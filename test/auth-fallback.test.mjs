import assert from "node:assert/strict";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { google } from "googleapis";

// No TOKEN_STORE_DEFAULT_USER_KEY/MCP_USER_KEY: the default key comes from USER,
// as in a Kiro config that does not pin the account. Re-keyed tokens stored as
// "google-email:<email>" must still be restored.
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const importDist = (relative) => import(pathToFileURL(path.join(repoRoot, "dist", relative)).href);
const STORED_KEY = "google-email:b@example.com";
const configDir = fs.mkdtempSync(path.join(os.tmpdir(), "mcp-gw-fallback-test-"));
const storePath = path.join(configDir, "user-tokens.store.json");
let auth;

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
        USER: "kiro-local-user",
    });
    for (const name of ["TOKEN_STORE_DEFAULT_USER_KEY", "MCP_USER_KEY", "GOOGLE_REDIRECT_URI", "MCP_FORCE_CONSENT"]) {
        delete process.env[name];
    }
    const now = new Date().toISOString();
    fs.writeFileSync(storePath, JSON.stringify({
        [STORED_KEY]: {
            userKey: STORED_KEY,
            tokens: { access_token: "access-b", refresh_token: "refresh-b", scope: "https://www.googleapis.com/auth/drive", token_type: "Bearer" },
            createdAt: now,
            updatedAt: now,
        },
    }));
    google.oauth2 = () => ({ userinfo: { get: async () => ({ data: { email: "b@example.com" } }) } });
    auth = await importDist("auth/personalAuth.js");
    auth.oauth2Client.getAccessToken = async () => ({ token: "access-b" });
});

after(() => {
    fs.rmSync(configDir, { recursive: true, force: true });
});

test("without a pinned key, a re-keyed stored token is restored and kept under its key", async () => {
    await auth.ensurePersonalAuth(["https://www.googleapis.com/auth/drive"]);
    assert.equal(auth.oauth2Client.credentials.access_token, "access-b");
    const store = JSON.parse(fs.readFileSync(storePath, "utf-8"));
    assert.deepEqual(Object.keys(store), [STORED_KEY]);
    const status = await auth.getPersonalAuthStatus();
    assert.equal(status.authenticated, true);
    assert.equal(status.email, "b@example.com");
});
