import assert from "node:assert/strict";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { google } from "googleapis";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const importDist = (relative) => import(pathToFileURL(path.join(repoRoot, "dist", relative)).href);

const USER_A = "google-email:a@example.com";
const USER_B = "google-email:b@example.com";

async function getFreePort() {
    return new Promise((resolve, reject) => {
        const server = net.createServer();
        server.once("error", reject);
        server.listen(0, "127.0.0.1", () => {
            const { port } = server.address();
            server.close(() => resolve(port));
        });
    });
}

function textOf(result) {
    return result.content.map((item) => item.text ?? "").join("\n");
}

const configDir = fs.mkdtempSync(path.join(os.tmpdir(), "mcp-gw-scopes-test-"));
const storePath = path.join(configDir, "user-tokens.store.json");
let auth;
let registry;
let chatHelpers;
let userinfoEmail = "a@example.com";

function writeStore(records) {
    const now = new Date().toISOString();
    const store = {};
    for (const [userKey, scope] of Object.entries(records)) {
        store[userKey] = {
            userKey,
            tokens: { access_token: `access-${userKey}`, refresh_token: `refresh-${userKey}`, scope, token_type: "Bearer" },
            createdAt: now,
            updatedAt: now,
        };
    }
    fs.writeFileSync(storePath, JSON.stringify(store));
    // The file store prefers the legacy single-user file for the pinned key.
    fs.rmSync(path.join(configDir, "user-tokens.json"), { force: true });
}

function readStore() {
    return fs.existsSync(storePath) ? JSON.parse(fs.readFileSync(storePath, "utf-8")) : {};
}

before(async () => {
    const port = await getFreePort();
    Object.assign(process.env, {
        GOOGLE_CLIENT_ID: "dummy.apps.googleusercontent.com",
        GOOGLE_CLIENT_SECRET: "dummy",
        MCP_CONFIG_DIR: configDir,
        MCP_NO_BROWSER: "1",
        MCP_AUTH_WAIT_MS: "200",
        OAUTH_LOCAL_PORT: String(port),
        TOKEN_STORE_PROVIDER: "file",
        TOKEN_STORE_DEFAULT_USER_KEY: USER_A,
    });
    delete process.env.GOOGLE_REDIRECT_URI;
    delete process.env.MCP_FORCE_CONSENT;
    // No real Google calls: userinfo resolves to account A.
    google.oauth2 = () => ({ userinfo: { get: async () => ({ data: { email: userinfoEmail } }) } });
    auth = await importDist("auth/personalAuth.js");
    registry = await importDist("mcp/tools/registry.js");
    chatHelpers = await importDist("mcp/tools/google/chat/helpers.js");
    auth.oauth2Client.getAccessToken = async () => ({ token: "access-token" });
});

after(() => {
    chatHelpers?.resetChatClientFactory();
    fs.rmSync(configDir, { recursive: true, force: true });
});

test("concurrent start_google_auth/status calls never see an empty authUrl", async () => {
    const [first, second, status] = await Promise.all([
        auth.startPersonalAuth(),
        auth.startPersonalAuth(),
        auth.getPersonalAuthStatus(),
    ]);
    assert.match(first.authUrl, /^https:\/\/accounts\.google\.com\//);
    assert.equal(second.authUrl, first.authUrl);
    assert.ok(status.pendingAuth, "status should report the pending flow");
    assert.equal(status.pendingAuth.authUrl, first.authUrl);
});

test("required scopes are resolved per tool owner, with per-module override", () => {
    assert.deepEqual(registry.resolveRequiredScopes({ owner: "google-drive" }), auth.SERVICE_SCOPES["google-drive"]);
    assert.deepEqual(registry.resolveRequiredScopes({ owner: "google-chat" }), auth.SERVICE_SCOPES["google-chat"]);
    assert.deepEqual(registry.resolveRequiredScopes({ owner: "google-drive", requiredScopes: ["x"] }), ["x"]);
    assert.deepEqual(registry.resolveRequiredScopes({ owner: "unknown" }), auth.STANDARD_SCOPES);
    const chatScopes = new Set(auth.SERVICE_SCOPES["google-chat"]);
    for (const scopes of Object.values(auth.SERVICE_SCOPES)) {
        for (const scope of scopes) {
            assert.ok(auth.STANDARD_SCOPES.includes(scope), `${scope} must be requested at consent`);
        }
    }
    assert.equal(chatScopes.size, 4);
});

test("a token without Chat scopes still serves non-Chat tools but re-consents for Chat", async () => {
    const nonChat = auth.STANDARD_SCOPES.filter((scope) => !scope.includes("/auth/chat.")).join(" ");
    writeStore({ [USER_A]: nonChat });
    await auth.ensurePersonalAuth(auth.SERVICE_SCOPES["google-drive"]);
    await auth.ensurePersonalAuth(auth.SERVICE_SCOPES["google-calendar"]);
    assert.ok(readStore()[USER_A], "token must stay stored");

    await assert.rejects(auth.ensurePersonalAuth(auth.SERVICE_SCOPES["google-chat"]), (error) => {
        assert.equal(error.name, "AuthRequiredError");
        assert.match(error.message, /chat\.spaces/);
        assert.match(error.message, /accounts\.google\.com/);
        return true;
    });

    let chatCalls = 0;
    chatHelpers.setChatClientFactory(() => {
        chatCalls += 1;
        return {};
    });
    const result = await registry.routeToolCall("list_chat_spaces", {});
    assert.equal(result.isError, true);
    assert.match(textOf(result), /complete_google_auth/);
    assert.equal(chatCalls, 0, "Chat handler must not run without Chat scopes");
    assert.ok(readStore()[USER_A], "re-consent must not delete the stored token");
});

test("insufficient-scope 403 from a tool triggers re-auth and returns the sign-in URL", async () => {
    writeStore({ [USER_A]: auth.STANDARD_SCOPES.join(" ") });
    let calls = 0;
    chatHelpers.setChatClientFactory(() => ({
        spaces: {
            list: async () => {
                calls += 1;
                throw new Error("Request had insufficient authentication scopes.");
            },
        },
    }));
    const result = await registry.routeToolCall("list_chat_spaces", {});
    assert.equal(result.isError, true);
    assert.equal(calls, 1, "handler runs once, then the registry forces re-auth");
    const text = textOf(result);
    assert.match(text, /accounts\.google\.com\/o\/oauth2\/v2\/auth/);
    assert.match(text, /Google rejected the current token/);
    assert.ok(readStore()[USER_A], "forcePersonalReauth must not purge the store");
    chatHelpers.resetChatClientFactory();
});

test("saving or purging one account leaves other accounts in the store", async () => {
    writeStore({ [USER_A]: auth.STANDARD_SCOPES.join(" "), [USER_B]: auth.STANDARD_SCOPES.join(" ") });
    await auth.ensurePersonalAuth(auth.SERVICE_SCOPES["google-drive"]);
    let store = readStore();
    assert.ok(store[USER_A], "active account is re-saved");
    assert.ok(store[USER_B], "other account must survive a token save");

    await auth.clearPersonalAuth(true);
    store = readStore();
    assert.equal(store[USER_A], undefined, "active account is purged");
    assert.ok(store[USER_B], "other account must survive a purge");
});

test("a fresh restore falls back to a stored account without deleting it", async () => {
    // Only B remains; the pinned key (A) is absent, so B is the restore fallback.
    userinfoEmail = "b@example.com";
    await auth.ensurePersonalAuth(auth.SERVICE_SCOPES["google-drive"]);
    const store = readStore();
    assert.ok(store[USER_B], "fallback account is kept under its own key");
    assert.deepEqual(Object.keys(store), [USER_B]);
});
