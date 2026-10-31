import dotenv from "dotenv";
import express from "express";
import fs from "fs";
import { google } from "googleapis";
import open from "open";
import { Buffer } from "node:buffer";
import { randomBytes } from "node:crypto";
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
    // Google Chat (user authentication)
    "https://www.googleapis.com/auth/chat.spaces",
    "https://www.googleapis.com/auth/chat.messages",
    "https://www.googleapis.com/auth/chat.memberships",
    "https://www.googleapis.com/auth/chat.messages.reactions",
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
function storedUserKeys() {
    // Also consider keys already present in the file store
    // (e.g. "google-email:<email>") so a fresh process finds re-keyed tokens.
    try {
        if (typeof tokenStore?.readMultiUserStore === "function") {
            return Object.keys(tokenStore.readMultiUserStore());
        }
        // Hybrid store: the file store is the primary.
        if (typeof tokenStore?.primary?.readMultiUserStore === "function") {
            return Object.keys(tokenStore.primary.readMultiUserStore());
        }
    }
    catch { }
    return [];
}
function legacyCandidateUserKeys() {
    return uniqueUserKeys([
        activeTokenStoreUserKey,
        INITIAL_TOKEN_STORE_USER_KEY,
        "default",
        ...storedUserKeys(),
    ]);
}
export function getMissingScopes(tokenScopeString) {
    const granted = new Set(typeof tokenScopeString === "string"
        ? tokenScopeString.split(/\s+/).filter((scope) => scope.length > 0)
        : []);
    return STANDARD_SCOPES.filter((scope) => !granted.has(scope));
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
function isTruthyEnv(raw) {
    if (!raw) {
        return false;
    }
    const normalized = raw.trim().toLowerCase();
    return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "y";
}
const DEFAULT_AUTH_WAIT_MS = 20000;
function resolveAuthWaitMs() {
    const raw = process.env.MCP_AUTH_WAIT_MS;
    if (raw === undefined || raw.trim() === "") {
        return DEFAULT_AUTH_WAIT_MS;
    }
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed < 0) {
        return DEFAULT_AUTH_WAIT_MS;
    }
    return parsed;
}
/**
 * Thrown when a tool call needs Google consent that did not complete within
 * MCP_AUTH_WAIT_MS. The message carries the auth URL and instructions so the
 * MCP client (e.g. Kiro) can show them to the user instead of hanging.
 */
export class AuthRequiredError extends Error {
    authUrl;
    redirectUri;
    reason;
    constructor(authUrl, redirectUri, reason) {
        super(buildAuthRequiredMessage(authUrl, redirectUri, reason));
        this.name = "AuthRequiredError";
        this.authUrl = authUrl;
        this.redirectUri = redirectUri;
        this.reason = reason;
    }
}
function buildAuthRequiredMessage(authUrl, redirectUri, reason) {
    return [
        "Login do Google necessario / Google sign-in required.",
        reason ? `Motivo / Reason: ${reason}` : undefined,
        "",
        "1. Abra esta URL no navegador e aprove o acesso / Open this URL in your browser and approve access:",
        authUrl,
        "",
        `2. O servidor aguarda o retorno em / The server is waiting for the callback on: ${redirectUri}`,
        "   Se o navegador terminar em uma pagina localhost inacessivel, copie a URL completa da barra de enderecos",
        "   (ou apenas o parametro code) e passe para a ferramenta `complete_google_auth`.",
        "   If the browser ends on an unreachable localhost page, copy the full URL from the address bar",
        "   (or just the code parameter) and pass it to the `complete_google_auth` tool.",
        "",
        "3. Depois tente novamente a ferramenta original / Then retry the original tool.",
    ]
        .filter((line) => line !== undefined)
        .join("\n");
}
// The single in-flight interactive flow (listener + auth URL), reused across calls.
let pendingAuth;
function closePendingListener(flow) {
    if (flow?.server) {
        try {
            flow.server.close();
        }
        catch { }
        flow.server = undefined;
    }
}
function settlePendingAuth(flow, error) {
    if (flow.settled) {
        return;
    }
    flow.settled = true;
    closePendingListener(flow);
    if (pendingAuth === flow) {
        pendingAuth = undefined;
    }
    if (error) {
        flow.reject(error);
    }
    else {
        flow.resolve();
    }
}
async function exchangeCodeForFlow(flow, code) {
    const tokenResponse = await oauth2Client.getToken({ code, redirect_uri: flow.redirectUri });
    oauth2Client.setCredentials(tokenResponse.tokens);
    await saveUserTokens();
    settlePendingAuth(flow);
}
function listenOnRedirectUri(flow, redirectUri) {
    const { port, callbackPath } = parseRedirectUri(redirectUri);
    return new Promise((resolve, reject) => {
        const app = express();
        app.get(callbackPath, async (req, res) => {
            res.type("text/plain; charset=utf-8");
            if (flow.settled) {
                res.status(410).send("Este login ja foi concluido ou expirou. / This sign-in already completed or expired.");
                return;
            }
            const code = req.query.code;
            const oauthError = req.query.error;
            const state = req.query.state;
            if (typeof oauthError === "string" && oauthError.length > 0) {
                res.status(400).send(`OAuth falhou / OAuth failed: ${oauthError}`);
                settlePendingAuth(flow, new Error(`OAuth callback returned error: ${oauthError}`));
                return;
            }
            if (typeof code !== "string" || code.length === 0) {
                // Keep the listener alive: users may hit the callback URL manually without `code`.
                res.status(400).send("Sem authorization code. Inicie o login pela URL do OAuth. / Missing authorization code. Start sign-in from the OAuth URL.");
                return;
            }
            if (state !== flow.state) {
                res.status(400).send("Parametro state invalido; use a URL de login mais recente. / Invalid state parameter; use the latest sign-in URL.");
                return;
            }
            try {
                await exchangeCodeForFlow(flow, code);
                res.send("Login concluido. Voce pode fechar esta aba. / Sign-in complete. You can close this tab.");
            }
            catch (error) {
                res.status(500).send("Erro ao obter o token. / Failed to obtain the token.");
                settlePendingAuth(flow, error);
            }
        });
        const server = app.listen(port);
        server.once("error", reject);
        server.once("listening", () => {
            server.removeListener("error", reject);
            server.on("error", (error) => {
                console.error(`[auth] OAuth callback listener error: ${error instanceof Error ? error.message : String(error)}`);
            });
            // Never keep the MCP process alive just for the callback listener.
            server.unref();
            resolve(server);
        });
    });
}
async function startAuthFlow() {
    if (pendingAuth && !pendingAuth.settled) {
        return pendingAuth;
    }
    const flow = {
        state: randomBytes(16).toString("hex"),
        settled: false,
        server: undefined,
        redirectUri: oauthConfig.redirectUris[0],
        authUrl: "",
    };
    flow.promise = new Promise((resolve, reject) => {
        flow.resolve = resolve;
        flow.reject = reject;
    });
    // Avoid unhandled rejections when nobody is waiting on the flow anymore.
    flow.promise.catch(() => { });
    pendingAuth = flow;
    for (const redirectUri of oauthConfig.redirectUris) {
        try {
            flow.server = await listenOnRedirectUri(flow, redirectUri);
            flow.redirectUri = redirectUri;
            break;
        }
        catch (error) {
            if (!isListenError(error)) {
                pendingAuth = undefined;
                throw error;
            }
            console.error(`[auth] OAuth callback port busy, trying next redirect URI: ${redirectUri}`);
        }
    }
    if (!flow.server) {
        console.error(`[auth] No OAuth callback port available; complete sign-in with the complete_google_auth tool (redirect URI ${flow.redirectUri}).`);
    }
    flow.authUrl = oauth2Client.generateAuthUrl({
        access_type: "offline",
        prompt: "consent",
        include_granted_scopes: true,
        redirect_uri: flow.redirectUri,
        scope: STANDARD_SCOPES,
        state: flow.state,
    });
    console.error(`[auth] Abra para autenticar / Open to authenticate (${flow.redirectUri}): ${flow.authUrl}`);
    if (!isTruthyEnv(process.env.MCP_NO_BROWSER)) {
        try {
            const child = await open(flow.authUrl);
            child?.on?.("error", (error) => {
                console.error(`[auth] Could not open a browser: ${error instanceof Error ? error.message : String(error)}`);
            });
        }
        catch (error) {
            console.error(`[auth] Could not open a browser: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    return flow;
}
async function waitForPersonalAuth(reason) {
    const flow = await startAuthFlow();
    const waitMs = resolveAuthWaitMs();
    let timer;
    const timeout = new Promise((resolve) => {
        timer = setTimeout(() => resolve("timeout"), waitMs);
    });
    try {
        const outcome = await Promise.race([flow.promise.then(() => "done"), timeout]);
        if (outcome === "timeout") {
            throw new AuthRequiredError(flow.authUrl, flow.redirectUri, reason);
        }
    }
    finally {
        clearTimeout(timer);
    }
}
let forceConsentApplied = false;
function shouldForceConsent() {
    return isTruthyEnv(process.env.MCP_FORCE_CONSENT);
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
        await waitForPersonalAuth("nenhum token salvo / no stored token");
        return;
    }
    const grantedScope = oauth2Client.credentials.scope;
    if (typeof grantedScope === "string" && grantedScope.trim().length > 0) {
        const missing = getMissingScopes(grantedScope);
        if (missing.length > 0) {
            console.error(`[auth] Stored token is missing required scopes; re-consent needed: ${missing.join(" ")}`);
            oauth2Client.setCredentials({});
            await waitForPersonalAuth(`token salvo sem escopos necessarios / stored token is missing scopes: ${missing.join(" ")}`);
            return;
        }
    }
    let tokenResponse;
    try {
        tokenResponse = await oauth2Client.getAccessToken();
    }
    catch {
        oauth2Client.setCredentials({});
        await waitForPersonalAuth("token expirado ou revogado / token expired or revoked");
        return;
    }
    if (!tokenResponse.token) {
        oauth2Client.setCredentials({});
        await waitForPersonalAuth("token invalido / invalid token");
        return;
    }
    await saveUserTokens();
}
export async function forcePersonalReauth() {
    await clearPersonalAuth(false);
    await waitForPersonalAuth("o Google rejeitou o token atual / Google rejected the current token");
}
/** Starts (or reuses) the interactive flow and returns the auth URL without waiting. */
export async function startPersonalAuth(force = false) {
    if (force && pendingAuth && !pendingAuth.settled) {
        settlePendingAuth(pendingAuth, new Error("Superseded by a new sign-in request."));
    }
    const flow = await startAuthFlow();
    return {
        authUrl: flow.authUrl,
        redirectUri: flow.redirectUri,
        listening: Boolean(flow.server),
    };
}
function parseCompletionInput({ redirectUrl, code }) {
    if (typeof redirectUrl === "string" && redirectUrl.trim().length > 0) {
        let url;
        try {
            url = new URL(redirectUrl.trim());
        }
        catch {
            throw new Error("redirectUrl invalida / invalid redirectUrl: expected the full URL from the browser address bar.");
        }
        const oauthError = url.searchParams.get("error");
        if (oauthError) {
            throw new Error(`O Google retornou erro / Google returned an error: ${oauthError}`);
        }
        const fromUrl = url.searchParams.get("code");
        if (!fromUrl) {
            throw new Error("A redirectUrl nao contem o parametro code / redirectUrl has no 'code' parameter. Copy the full URL after approving access.");
        }
        return {
            code: fromUrl,
            state: url.searchParams.get("state") ?? undefined,
            redirectUri: `${url.origin}${url.pathname}`,
        };
    }
    if (typeof code === "string" && code.trim().length > 0) {
        return { code: code.trim() };
    }
    throw new Error("Informe redirectUrl ou code / Provide redirectUrl or code.");
}
/** Completes the pending flow using a redirect URL (or code) pasted by the user. */
export async function completePersonalAuth(input = {}) {
    const parsed = parseCompletionInput(input);
    let flow = pendingAuth && !pendingAuth.settled ? pendingAuth : undefined;
    if (flow && parsed.state && parsed.state !== flow.state) {
        throw new Error("Parametro state nao corresponde ao login pendente; use a URL de login mais recente. / State does not match the pending sign-in; use the latest sign-in URL.");
    }
    if (!flow) {
        // No pending flow in this process (e.g. server restarted): exchange directly.
        const tokenResponse = await oauth2Client.getToken({
            code: parsed.code,
            redirect_uri: parsed.redirectUri ?? oauthConfig.redirectUris[0],
        });
        oauth2Client.setCredentials(tokenResponse.tokens);
        await saveUserTokens();
        return getPersonalAuthStatus();
    }
    try {
        await exchangeCodeForFlow(flow, parsed.code);
    }
    catch (error) {
        settlePendingAuth(flow, error);
        throw error;
    }
    return getPersonalAuthStatus();
}
/** Reports stored token state without calling Google APIs. */
export async function getPersonalAuthStatus() {
    let record = null;
    for (const key of legacyCandidateUserKeys()) {
        try {
            record = await tokenStore.load(key);
        }
        catch {
            record = null;
        }
        if (record) {
            break;
        }
    }
    const scope = record?.tokens?.scope;
    const grantedScopes = typeof scope === "string" ? scope.split(/\s+/).filter((item) => item.length > 0) : [];
    const userKey = record?.userKey ?? null;
    const email = typeof userKey === "string" && userKey.startsWith("google-email:")
        ? userKey.slice("google-email:".length)
        : null;
    const flow = pendingAuth && !pendingAuth.settled ? pendingAuth : undefined;
    return {
        authenticated: Boolean(record && (record.tokens.refresh_token || record.tokens.access_token)),
        userKey,
        email,
        hasRefreshToken: Boolean(record?.tokens?.refresh_token),
        grantedScopes,
        missingScopes: record ? (typeof scope === "string" ? getMissingScopes(scope) : []) : [...STANDARD_SCOPES],
        scopesUnknown: Boolean(record && typeof scope !== "string"),
        requiredScopes: [...STANDARD_SCOPES],
        pendingAuth: flow
            ? { authUrl: flow.authUrl, redirectUri: flow.redirectUri, listening: Boolean(flow.server) }
            : null,
    };
}
