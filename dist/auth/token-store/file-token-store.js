import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { resolveDefaultUserKey } from "./default-user-key.js";
import { validateStoredOAuthTokens, validateTokenStoreRecord, validateUserKey } from "./validation.js";
const TOKEN_FILE_NAME = "user-tokens.json";
const MULTI_USER_FILE_NAME = "user-tokens.store.json";
function isRecordLike(value) {
    return typeof value === "object" && value !== null;
}
function normalizeTokens(value) {
    if (!isRecordLike(value)) {
        return {};
    }
    const tokens = {};
    if (typeof value.access_token === "string") {
        tokens.access_token = value.access_token;
    }
    if (typeof value.refresh_token === "string") {
        tokens.refresh_token = value.refresh_token;
    }
    if (typeof value.scope === "string") {
        tokens.scope = value.scope;
    }
    if (typeof value.token_type === "string") {
        tokens.token_type = value.token_type;
    }
    if (typeof value.expiry_date === "number" && Number.isFinite(value.expiry_date)) {
        tokens.expiry_date = value.expiry_date;
    }
    return tokens;
}
function looksLikeLegacyTokens(value) {
    if (!isRecordLike(value)) {
        return false;
    }
    return ("access_token" in value ||
        "refresh_token" in value ||
        "scope" in value ||
        "token_type" in value ||
        "expiry_date" in value);
}
export class FileTokenStore {
    configDir;
    defaultUserKey;
    legacyTokenPath;
    multiUserPath;
    legacyKeysTokenPath;
    constructor(options = {}) {
        this.configDir = options.configDir ?? process.env.MCP_CONFIG_DIR ?? path.join(os.homedir(), ".mcp-google-workspace");
        this.defaultUserKey = options.defaultUserKey ?? resolveDefaultUserKey();
        const legacyKeysDir = options.legacyKeysDir ?? path.join(process.cwd(), "keys");
        this.legacyTokenPath = path.join(this.configDir, TOKEN_FILE_NAME);
        this.multiUserPath = path.join(this.configDir, MULTI_USER_FILE_NAME);
        this.legacyKeysTokenPath = path.join(legacyKeysDir, TOKEN_FILE_NAME);
        this.ensureConfigDirExists();
    }
    ensureConfigDirExists() {
        fs.mkdirSync(this.configDir, { recursive: true });
    }
    safeReadJson(filePath) {
        if (!fs.existsSync(filePath)) {
            return undefined;
        }
        const raw = fs.readFileSync(filePath, "utf-8");
        return JSON.parse(raw);
    }
    writeJsonAtomic(filePath, payload) {
        const tempPath = `${filePath}.tmp`;
        fs.writeFileSync(tempPath, JSON.stringify(payload, null, 2));
        fs.renameSync(tempPath, filePath);
    }
    readLegacyDefaultRecord() {
        const fromConfig = this.readLegacyTokenRecordFromPath(this.legacyTokenPath);
        if (fromConfig) {
            return fromConfig;
        }
        const fromLegacyKeys = this.readLegacyTokenRecordFromPath(this.legacyKeysTokenPath);
        if (fromLegacyKeys) {
            this.writeJsonAtomic(this.legacyTokenPath, fromLegacyKeys.tokens);
            return fromLegacyKeys;
        }
        return null;
    }
    readLegacyTokenRecordFromPath(filePath) {
        if (!fs.existsSync(filePath)) {
            return null;
        }
        const parsed = this.safeReadJson(filePath);
        if (!looksLikeLegacyTokens(parsed)) {
            return null;
        }
        const stats = fs.statSync(filePath);
        const createdAt = stats.birthtime?.toISOString?.() ?? stats.mtime.toISOString();
        const updatedAt = stats.mtime.toISOString();
        return validateTokenStoreRecord({
            userKey: this.defaultUserKey,
            tokens: normalizeTokens(parsed),
            createdAt,
            updatedAt,
        }, this.defaultUserKey);
    }
    readMultiUserStore() {
        const parsed = this.safeReadJson(this.multiUserPath);
        if (!isRecordLike(parsed)) {
            return {};
        }
        const result = {};
        for (const [candidateUserKey, rawRecord] of Object.entries(parsed)) {
            if (!isRecordLike(rawRecord) || !isRecordLike(rawRecord.tokens)) {
                continue;
            }
            const normalizedKey = candidateUserKey.trim();
            if (normalizedKey.length === 0) {
                continue;
            }
            const nowIso = new Date().toISOString();
            const validatedRecord = validateTokenStoreRecord({
                userKey: normalizedKey,
                tokens: normalizeTokens(rawRecord.tokens),
                createdAt: typeof rawRecord.createdAt === "string" ? rawRecord.createdAt : nowIso,
                updatedAt: typeof rawRecord.updatedAt === "string" ? rawRecord.updatedAt : nowIso,
            }, normalizedKey);
            if (!validatedRecord) {
                continue;
            }
            result[normalizedKey] = validatedRecord;
        }
        return result;
    }
    writeMultiUserStore(store) {
        this.writeJsonAtomic(this.multiUserPath, store);
    }
    async load(userKey) {
        const normalizedUserKey = validateUserKey(userKey);
        if (normalizedUserKey === this.defaultUserKey) {
            const legacyRecord = this.readLegacyDefaultRecord();
            if (legacyRecord) {
                return legacyRecord;
            }
        }
        const store = this.readMultiUserStore();
        return store[normalizedUserKey] ?? null;
    }
    async save(userKey, tokens) {
        const normalizedUserKey = validateUserKey(userKey);
        const validatedTokens = validateStoredOAuthTokens(tokens);
        const now = new Date().toISOString();
        if (normalizedUserKey === this.defaultUserKey) {
            // Keep backward compatibility with current production/local token file format.
            this.writeJsonAtomic(this.legacyTokenPath, normalizeTokens(validatedTokens));
        }
        const store = this.readMultiUserStore();
        const existing = store[normalizedUserKey];
        store[normalizedUserKey] = {
            userKey: normalizedUserKey,
            tokens: normalizeTokens(validatedTokens),
            createdAt: existing?.createdAt ?? now,
            updatedAt: now,
        };
        this.writeMultiUserStore(store);
    }
    async delete(userKey) {
        const normalizedUserKey = validateUserKey(userKey);
        if (normalizedUserKey === this.defaultUserKey) {
            if (fs.existsSync(this.legacyTokenPath)) {
                fs.unlinkSync(this.legacyTokenPath);
            }
            if (fs.existsSync(this.legacyKeysTokenPath)) {
                fs.unlinkSync(this.legacyKeysTokenPath);
            }
        }
        const store = this.readMultiUserStore();
        if (store[normalizedUserKey]) {
            delete store[normalizedUserKey];
            this.writeMultiUserStore(store);
        }
    }
}
