import dotenv from "dotenv";
import express from "express";
import fs from "fs";
import { google } from "googleapis";
import open from "open";
import { Buffer } from "node:buffer";
import path from "node:path";
import { resolveDefaultUserKey } from "./token-store/default-user-key.js";
import { createTokenStore, resolveTokenStoreProvider } from "./token-store/provider.js";
import { validateStoredOAuthTokens } from "./token-store/validation.js";
// MCP stdio must keep stdout clean (JSON-RPC only). Quiet dotenv logs.
dotenv.config({ quiet: true });
const LEGACY_KEYS_DIR = path.join(process.cwd(), "keys");
const OAUTH2_PATH = path.join(LEGACY_KEYS_DIR, "oauth2.json");
const DEFAULT_REDIRECT_URIS = [
    "http://localhost:3000/oauth2callback",
    "http://localhost:3001/oauth2callback",
    "http://localhost:3002/oauth2callback",
];
const INITIAL_TOKEN_STORE_USER_KEY = resolveDefaultUserKey();
let activeTokenStoreUserKey = INITIAL_TOKEN_STORE_USER_KEY;
export const STANDARD_SCOPES = [
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/spreadsheets",
    "https://mail.google.com/",
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/documents.readonly",
    "https://www.googleapis.com/auth/userinfo.email",
];
function uniqueValues(values) {
    return Array.from(new Set(values.filter((value) => Boolean(value))));
}
function isPlaceholderOAuthValue(value) {
    if (!value) {
        return false;
    }
    const normalized = value.trim();
    return (/^<.*>$/.test(normalized) ||
        /^your_google_client_id(\.apps\.googleusercontent\.com)?$/i.test(normalized) ||
        /^your_google_client_secret$/i.test(normalized) ||
        /^replace_me$/i.test(normalized));
}
function redirectUriFromPort(port) {
    if (!port) {
        return undefined;
    }
    return `http://localhost:${port}/oauth2callback`;
}
function readOAuthProfileFromDisk() {
    if (!fs.existsSync(OAUTH2_PATH)) {
        return undefined;
    }
    try {
        const raw = JSON.parse(fs.readFileSync(OAUTH2_PATH, "utf-8"));
        return raw.installed ?? raw.web;
    }
    catch (error) {
        throw new Error(`Không thể đọc oauth2.json. Hãy kiểm tra JSON hợp lệ và định dạng OAuth client. Đặt file tại $MCP_CONFIG_DIR/oauth2.json (mặc định ~/.mcp-google-workspace) hoặc keys/oauth2.json cho local dev. Chi tiết: ${error instanceof Error ? error.message : String(error)}`);
    }
}
function readOAuthConfig() {
    let clientId = process.env.GOOGLE_CLIENT_ID;
    let clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const oauthProfileFromDisk = readOAuthProfileFromDisk();
    if (oauthProfileFromDisk) {
        clientId = clientId || oauthProfileFromDisk.client_id;
        clientSecret = clientSecret || oauthProfileFromDisk.client_secret;
    }
    if (!clientId || !clientSecret) {
        throw new Error("Thiếu GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET. Hãy set .env hoặc đặt oauth2.json vào $MCP_CONFIG_DIR (hoặc legacy keys/oauth2.json).");
    }
    if (isPlaceholderOAuthValue(clientId) || isPlaceholderOAuthValue(clientSecret)) {
        throw new Error("GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET đang là giá trị placeholder. Hãy thay bằng OAuth client thật từ Google Cloud Console trong .env hoặc oauth2.json.");
    }
    const redirectUris = uniqueValues([
        process.env.GOOGLE_REDIRECT_URI,
        redirectUriFromPort(process.env.OAUTH_LOCAL_PORT),
        ...(oauthProfileFromDisk?.redirect_uris ?? []),
        ...DEFAULT_REDIRECT_URIS,
    ]);
    return { clientId, clientSecret, redirectUris };
}
const oauthConfig = readOAuthConfig();
export const oauth2Client = new google.auth.OAuth2(oauthConfig.clientId, oauthConfig.clientSecret, oauthConfig.redirectUris[0]);
const tokenStoreProvider = resolveTokenStoreProvider();
const tokenStore = createTokenStore(tokenStoreProvider);
function toStoredTokens(credentials) {
    const tokens = {};
    if (typeof credentials.access_token === "string") {
        tokens.access_token = credentials.access_token;
    }
    if (typeof credentials.refresh_token === "string") {
        tokens.refresh_token = credentials.refresh_token;
    }
    if (typeof credentials.scope === "string") {
        tokens.scope = credentials.scope;
    }
    if (typeof credentials.token_type === "string") {
        tokens.token_type = credentials.token_type;
    }
    if (typeof credentials.expiry_date === "number" && Number.isFinite(credentials.expiry_date)) {
        tokens.expiry_date = credentials.expiry_date;
    }
    return tokens;
}
function sanitizeTokenStoreUserKey(value) {
    return value.trim().toLowerCase();
}
function uniqueUserKeys(candidates) {
    const result = [];
    const seen = new Set();
    for (const candidate of candidates) {
        if (!candidate) {
            continue;
        }
        const normalized = candidate.trim();
        if (!normalized) {
            continue;
        }
        if (seen.has(normalized)) {
            continue;
        }
        seen.add(normalized);
        result.push(normalized);
    }
    return result;
}
function decodeBase64Url(value) {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
    return Buffer.from(`${normalized}${padding}`, "base64").toString("utf-8");
}
function parseIdTokenClaims(idToken) {
    const parts = idToken.split(".");
    const payloadPart = parts[1];
    if (!payloadPart) {
        return null;
    }
    try {
        const payload = decodeBase64Url(payloadPart);
        const parsed = JSON.parse(payload);
        if (typeof parsed === "object" && parsed !== null) {
            return parsed;
        }
    }
    catch { }
    return null;
}
function userKeyFromClaims(claims) {
    if (typeof claims.email === "string" && claims.email.trim().length > 0) {
        return `google-email:${sanitizeTokenStoreUserKey(claims.email)}`;
    }
    if (typeof claims.sub === "string" && claims.sub.trim().length > 0) {
        return `google-sub:${claims.sub.trim()}`;
    }
    return null;
}
async function userKeyFromGoogleUserInfo() {
    try {
        const oauth2Api = google.oauth2({ version: "v2", auth: oauth2Client });
        const response = await oauth2Api.userinfo.get();
        const profile = response.data;
        if (typeof profile.email === "string" && profile.email.trim().length > 0) {
            return `google-email:${sanitizeTokenStoreUserKey(profile.email)}`;
        }
        if (typeof profile.id === "string" && profile.id.trim().length > 0) {
            return `google-sub:${profile.id.trim()}`;
        }
    }
    catch { }
    return null;
}
async function resolveTokenStoreUserKeyFromCredentials() {
    const credentials = oauth2Client.credentials;
    if (typeof credentials.id_token === "string" && credentials.id_token.trim().length > 0) {
        const claims = parseIdTokenClaims(credentials.id_token);
        if (claims) {
            const fromClaims = userKeyFromClaims(claims);
            if (fromClaims) {
                activeTokenStoreUserKey = fromClaims;
                return fromClaims;
            }
        }
    }
    const fromUserInfo = await userKeyFromGoogleUserInfo();
    if (fromUserInfo) {
        activeTokenStoreUserKey = fromUserInfo;
        return fromUserInfo;
    }
    return activeTokenStoreUserKey;
}
function legacyCandidateUserKeys() {
    return uniqueUserKeys([
        activeTokenStoreUserKey,
        INITIAL_TOKEN_STORE_USER_KEY,
        "default",
    ]);
}
async function saveUserTokens() {
    const targetUserKey = await resolveTokenStoreUserKeyFromCredentials();
    const rawTokens = toStoredTokens(oauth2Client.credentials);
    let mergedTokens = { ...rawTokens };
    // Refresh token may be absent on subsequent refresh responses; preserve it from store.
    if (!mergedTokens.refresh_token) {
        try {
            const existing = await tokenStore.load(targetUserKey);
            if (existing?.tokens.refresh_token) {
                mergedTokens = {
                    ...mergedTokens,
                    refresh_token: existing.tokens.refresh_token,
                };
            }
        }
        catch (error) {
            console.error(`[auth] Không thể đọc token hiện có trước khi save để preserve refresh_token. Chi tiết: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    const validatedTokens = validateStoredOAuthTokens(mergedTokens);
    await tokenStore.save(targetUserKey, validatedTokens);
    for (const legacyKey of legacyCandidateUserKeys()) {
        if (legacyKey === targetUserKey) {
            continue;
        }
        try {
            await tokenStore.delete(legacyKey);
        }
        catch { }
    }
}
async function restoreUserTokensFromStore() {
    try {
        for (const candidateKey of legacyCandidateUserKeys()) {
            const record = await tokenStore.load(candidateKey);
            if (!record) {
                continue;
            }
            oauth2Client.setCredentials(record.tokens);
            const resolvedKey = await resolveTokenStoreUserKeyFromCredentials();
            await tokenStore.save(resolvedKey, record.tokens);
            if (candidateKey !== resolvedKey) {
                try {
                    await tokenStore.delete(candidateKey);
                }
                catch { }
            }
            return true;
        }
        return false;
    }
    catch (error) {
        console.error(`Không thể đọc token từ provider '${tokenStoreProvider}'. Sẽ yêu cầu đăng nhập lại. Chi tiết: ${error instanceof Error ? error.message : String(error)}`);
        oauth2Client.setCredentials({});
        return false;
    }
}
function parseRedirectUri(redirectUri) {
    const url = new URL(redirectUri);
    const port = Number(url.port || (url.protocol === "https:" ? "443" : "80"));
    const callbackPath = url.pathname || "/oauth2callback";
    if (url.hostname !== "localhost" && url.hostname !== "127.0.0.1") {
        throw new Error(`OAuth redirect URI phải dùng localhost/127.0.0.1 cho local flow: ${redirectUri}`);
    }
    if (!Number.isInteger(port) || port < 1) {
        throw new Error(`OAuth redirect URI không có port hợp lệ: ${redirectUri}`);
    }
    return { port, callbackPath };
}
function isListenError(error) {
    return error instanceof Error && "code" in error && error.code === "EADDRINUSE";
}
async function authorizeWithRedirectUri(redirectUri) {
    const { port, callbackPath } = parseRedirectUri(redirectUri);
    await new Promise((resolve, reject) => {
        const app = express();
        const server = app.listen(port);
        server.once("error", reject);
        server.once("listening", async () => {
            try {
                const authUrl = oauth2Client.generateAuthUrl({
                    access_type: "offline",
                    prompt: "consent",
                    redirect_uri: redirectUri,
                    scope: STANDARD_SCOPES,
                });
                console.error(`Mở browser để xác thực OAuth (${redirectUri}): ${authUrl}`);
                await open(authUrl);
            }
            catch (error) {
                server.close();
                reject(error);
            }
        });
        app.get(callbackPath, async (req, res) => {
            const code = req.query.code;
            const oauthError = req.query.error;
            if (typeof oauthError === "string" && oauthError.length > 0) {
                res.status(400).send(`OAuth thất bại: ${oauthError}`);
                server.close();
                reject(new Error(`OAuth callback trả lỗi: ${oauthError}`));
                return;
            }
            if (typeof code !== "string" || code.length === 0) {
                // Keep the callback server alive to wait for the real OAuth redirect
                // because users may hit callback URL manually without `code`.
                res.status(400).send("Chưa có authorization code. Vui lòng thực hiện đăng nhập từ OAuth URL.");
                return;
            }
            try {
                const tokenResponse = await oauth2Client.getToken({ code, redirect_uri: redirectUri });
                oauth2Client.setCredentials(tokenResponse.tokens);
                await saveUserTokens();
                res.send("OAuth thành công. Bạn có thể đóng tab này.");
                server.close();
                resolve();
            }
            catch (error) {
                res.status(500).send("Lỗi lấy token.");
                server.close();
                reject(error);
            }
        });
    });
}
async function authorizeUserViaLocalWebFlow() {
    let lastListenError;
    for (const redirectUri of oauthConfig.redirectUris) {
        try {
            await authorizeWithRedirectUri(redirectUri);
            return;
        }
        catch (error) {
            if (!isListenError(error)) {
                throw error;
            }
            lastListenError = error;
            console.error(`OAuth callback port bận, thử redirect URI tiếp theo: ${redirectUri}`);
        }
    }
    throw lastListenError ?? new Error("Không có OAuth redirect URI khả dụng.");
}
let authInFlight;
let forceConsentApplied = false;
function shouldForceConsent() {
    const raw = process.env.MCP_FORCE_CONSENT;
    if (!raw) {
        return false;
    }
    const normalized = raw.trim().toLowerCase();
    return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "y";
}
async function applyForceConsentIfRequested() {
    if (forceConsentApplied) {
        return;
    }
    forceConsentApplied = true;
    if (!shouldForceConsent()) {
        return;
    }
    try {
        for (const key of legacyCandidateUserKeys()) {
            await tokenStore.delete(key);
        }
        oauth2Client.setCredentials({});
        console.error(`[auth] MCP_FORCE_CONSENT=true -> cleared token for keys: ${legacyCandidateUserKeys().join(", ")}.`);
    }
    catch (error) {
        console.error(`[auth] MCP_FORCE_CONSENT=true nhưng không thể xóa token keys (${legacyCandidateUserKeys().join(", ")}). Chi tiết: ${error instanceof Error ? error.message : String(error)}`);
    }
}
async function ensureAuthFlowInFlight() {
    if (!authInFlight) {
        authInFlight = authorizeUserViaLocalWebFlow().finally(() => {
            authInFlight = undefined;
        });
    }
    await authInFlight;
}
export async function clearPersonalAuth(purgeDisk = true) {
    if (purgeDisk) {
        try {
            for (const key of legacyCandidateUserKeys()) {
                await tokenStore.delete(key);
            }
        }
        catch (error) {
            console.error(`Không thể xóa token từ provider '${tokenStoreProvider}'. Chi tiết: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    oauth2Client.setCredentials({});
}
export async function ensurePersonalAuth() {
    await applyForceConsentIfRequested();
    if (!(await restoreUserTokensFromStore())) {
        await ensureAuthFlowInFlight();
    }
    let tokenResponse;
    try {
        tokenResponse = await oauth2Client.getAccessToken();
    }
    catch {
        oauth2Client.setCredentials({});
        await ensureAuthFlowInFlight();
        tokenResponse = await oauth2Client.getAccessToken();
    }
    if (!tokenResponse.token) {
        oauth2Client.setCredentials({});
        await ensureAuthFlowInFlight();
    }
    await saveUserTokens();
}
export async function forcePersonalReauth() {
    await clearPersonalAuth(false);
    await ensureAuthFlowInFlight();
    await saveUserTokens();
}
