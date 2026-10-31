import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const personalAuthUrl = pathToFileURL(path.join(repoRoot, "dist/auth/personalAuth.js")).href;

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

function fakeIdToken(claims) {
    const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
    return `${encode({ alg: "none" })}.${encode(claims)}.sig`;
}

function textOf(result) {
    return result.content.map((item) => item.text ?? "").join("\n");
}

const configDir = fs.mkdtempSync(path.join(os.tmpdir(), "mcp-gw-test-"));
let port;
let auth;
let registry;
let helpers;

before(async () => {
    port = await getFreePort();
    Object.assign(process.env, {
        GOOGLE_CLIENT_ID: "dummy.apps.googleusercontent.com",
        GOOGLE_CLIENT_SECRET: "dummy",
        MCP_CONFIG_DIR: configDir,
        MCP_NO_BROWSER: "1",
        MCP_AUTH_WAIT_MS: "300",
        OAUTH_LOCAL_PORT: String(port),
        TOKEN_STORE_PROVIDER: "file",
        TOKEN_STORE_DEFAULT_USER_KEY: "test-user",
    });
    delete process.env.GOOGLE_REDIRECT_URI;
    delete process.env.MCP_FORCE_CONSENT;
    auth = await import(personalAuthUrl);
    registry = await import(pathToFileURL(path.join(repoRoot, "dist/mcp/tools/registry.js")).href);
    helpers = await import(pathToFileURL(path.join(repoRoot, "dist/mcp/tools/google/calendar/helpers.js")).href);
});

after(() => {
    fs.rmSync(configDir, { recursive: true, force: true });
});

test("getMissingScopes reports scopes absent from the token scope string", () => {
    const full = auth.STANDARD_SCOPES.join(" ");
    assert.deepEqual(auth.getMissingScopes(full), []);
    assert.deepEqual(auth.getMissingScopes(`openid ${full}`), []);
    const partial = auth.STANDARD_SCOPES.slice(1).join(" ");
    assert.deepEqual(auth.getMissingScopes(partial), [auth.STANDARD_SCOPES[0]]);
    assert.deepEqual(auth.getMissingScopes(undefined), auth.STANDARD_SCOPES);
});

test("auth tools are registered", () => {
    for (const name of ["google_auth_status", "start_google_auth", "complete_google_auth"]) {
        assert.ok(registry.REGISTERED_TOOL_NAMES.has(name), `${name} should be registered`);
    }
});

test("personal tool without token returns the auth URL quickly instead of hanging", async () => {
    const started = Date.now();
    const result = await registry.routeToolCall("list_calendars", {});
    const elapsed = Date.now() - started;
    assert.equal(result.isError, true);
    const text = textOf(result);
    assert.match(text, /https:\/\/accounts\.google\.com\/o\/oauth2\/v2\/auth\?/);
    assert.match(text, /complete_google_auth/);
    assert.ok(text.includes(`http://localhost:${port}/oauth2callback`), "message should contain the redirect URI");
    assert.ok(elapsed < 5000, `should return within the wait window, took ${elapsed}ms`);

    // A second call reuses the same pending flow (single listener, same URL).
    const second = await registry.routeToolCall("list_calendars", {});
    const status = await auth.getPersonalAuthStatus();
    assert.equal(status.authenticated, false);
    assert.ok(status.pendingAuth, "pending auth should be reported");
    assert.equal(status.pendingAuth.listening, true);
    assert.ok(textOf(second).includes(status.pendingAuth.authUrl));
    assert.match(status.pendingAuth.authUrl, /include_granted_scopes=true/);
});

test("callback listener stays alive after the timeout and rejects bad requests", async () => {
    const missingCode = await fetch(`http://localhost:${port}/oauth2callback`);
    assert.equal(missingCode.status, 400);
    const badState = await fetch(`http://localhost:${port}/oauth2callback?code=abc&state=wrong`);
    assert.equal(badState.status, 400);
    const status = await auth.getPersonalAuthStatus();
    assert.ok(status.pendingAuth, "flow must still be pending");
});

test("complete_google_auth with a redirect URL missing the code returns a clear error", async () => {
    const result = await registry.routeToolCall("complete_google_auth", {
        redirectUrl: `http://localhost:${port}/oauth2callback?state=x`,
    });
    assert.equal(result.isError, true);
    assert.match(textOf(result), /code/);
    const empty = await registry.routeToolCall("complete_google_auth", {});
    assert.equal(empty.isError, true);
    assert.match(textOf(empty), /redirectUrl|code/);
});

test("complete_google_auth exchanges the code (stubbed) and saves tokens", async () => {
    const pending = (await auth.getPersonalAuthStatus()).pendingAuth;
    const state = new URL(pending.authUrl).searchParams.get("state");
    let exchangeArgs;
    auth.oauth2Client.getToken = async (options) => {
        exchangeArgs = options;
        return {
            tokens: {
                access_token: "access-token",
                refresh_token: "refresh-token",
                scope: auth.STANDARD_SCOPES.join(" "),
                token_type: "Bearer",
                id_token: fakeIdToken({ email: "Someone@Example.com" }),
            },
        };
    };
    const result = await registry.routeToolCall("complete_google_auth", {
        redirectUrl: `http://localhost:${port}/oauth2callback?state=${state}&code=the-code&scope=x`,
    });
    assert.equal(result.isError, undefined, textOf(result));
    assert.deepEqual(exchangeArgs, { code: "the-code", redirect_uri: pending.redirectUri });
    const payload = JSON.parse(textOf(result));
    assert.equal(payload.authenticated, true);
    assert.equal(payload.userKey, "google-email:someone@example.com");
    assert.deepEqual(payload.missingScopes, []);
    assert.equal(payload.pendingAuth, null);
    const store = JSON.parse(fs.readFileSync(path.join(configDir, "user-tokens.store.json"), "utf-8"));
    assert.ok(store["google-email:someone@example.com"]);
});

test("a fresh process finds tokens stored under a google-email key (storedUserKeys)", async () => {
    const freshDir = fs.mkdtempSync(path.join(os.tmpdir(), "mcp-gw-fresh-"));
    try {
        const now = new Date().toISOString();
        fs.writeFileSync(path.join(freshDir, "user-tokens.store.json"), JSON.stringify({
            "google-email:someone@example.com": {
                userKey: "google-email:someone@example.com",
                tokens: { refresh_token: "r", access_token: "a", scope: "https://www.googleapis.com/auth/drive" },
                createdAt: now,
                updatedAt: now,
            },
        }));
        const script = `const m = await import(${JSON.stringify(personalAuthUrl)}); console.log(JSON.stringify(await m.getPersonalAuthStatus()));`;
        const runStatus = async (extraEnv) => {
            const { stdout } = await execFileAsync(process.execPath, ["--input-type=module", "-e", script], {
                env: {
                    PATH: process.env.PATH,
                    GOOGLE_CLIENT_ID: "dummy.apps.googleusercontent.com",
                    GOOGLE_CLIENT_SECRET: "dummy",
                    MCP_CONFIG_DIR: freshDir,
                    MCP_NO_BROWSER: "1",
                    ...extraEnv,
                },
                cwd: freshDir,
            });
            return JSON.parse(stdout.trim().split("\n").pop());
        };
        // No key configured: the default key comes from USER and does not pin the account.
        const status = await runStatus({ USER: "another-user" });
        assert.equal(status.authenticated, true);
        assert.equal(status.email, "someone@example.com");
        assert.ok(status.missingScopes.length > 0, "drive-only token should report missing scopes");
        assert.ok(!status.missingScopes.includes("https://www.googleapis.com/auth/drive"));
        // An explicitly pinned, absent key must not fall back to another account.
        const pinned = await runStatus({ TOKEN_STORE_DEFAULT_USER_KEY: "google-email:other@example.com" });
        assert.equal(pinned.authenticated, false);
        assert.equal(pinned.userKey, null);
    }
    finally {
        fs.rmSync(freshDir, { recursive: true, force: true });
    }
});

test("time zone settings fall back on invalid values", () => {
    assert.equal(helpers.resolveTimeZoneSetting(["Not/AZone", "America/Sao_Paulo"], "UTC"), "America/Sao_Paulo");
    assert.equal(helpers.resolveTimeZoneSetting([undefined, ""], "UTC"), "UTC");
    assert.equal(helpers.resolveTimeZoneSetting(["Bad/Zone"], "Asia/Ho_Chi_Minh"), "Asia/Ho_Chi_Minh");
});
