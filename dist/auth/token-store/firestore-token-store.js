import { FieldValue, Firestore } from "@google-cloud/firestore";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { resolveDefaultUserKey } from "./default-user-key.js";
import { decryptStoredTokens, encryptStoredTokens, isEncryptedTokensV1, resolveTokenEncryptionKeyConfig, } from "./encryption.js";
import { validateStoredOAuthTokens, validateTokenStoreRecord, validateUserKey } from "./validation.js";
const DEFAULT_DATABASE_ID = "(default)";
const DEFAULT_COLLECTION = "oauth_user_tokens";
const SERVICE_ACCOUNT_ENV_KEYS = ["FIRESTORE_SERVICE_ACCOUNT_KEY_PATH", "GOOGLE_APPLICATION_CREDENTIALS"];
function resolveServiceAccountKeyPath(explicitPath) {
    if (explicitPath && explicitPath.trim().length > 0) {
        const absolutePath = path.resolve(process.cwd(), explicitPath.trim());
        if (!fs.existsSync(absolutePath)) {
            throw new Error(`Credential file from constructor option 'serviceAccountKeyPath' not found: ${absolutePath}`);
        }
        return absolutePath;
    }
    for (const key of SERVICE_ACCOUNT_ENV_KEYS) {
        const raw = process.env[key];
        if (!raw || raw.trim().length === 0) {
            continue;
        }
        const absolutePath = path.resolve(process.cwd(), raw.trim());
        if (!fs.existsSync(absolutePath)) {
            throw new Error(`Credential file from ${key} not found: ${absolutePath}`);
        }
        return absolutePath;
    }
    return undefined;
}
function toDocumentId(userKey) {
    return encodeURIComponent(validateUserKey(userKey));
}
function toLegacyDocumentId(userKey) {
    return Buffer.from(validateUserKey(userKey), "utf-8").toString("base64url");
}
function fromDocumentId(documentId) {
    try {
        return decodeURIComponent(documentId);
    }
    catch { }
    try {
        return Buffer.from(documentId, "base64url").toString("utf-8");
    }
    catch { }
    return documentId;
}
function normalizeSavedUserKey(value, fallbackUserKey) {
    if (typeof value === "string" && value.trim().length > 0) {
        return value.trim();
    }
    return fallbackUserKey;
}
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
function toIsoString(value) {
    if (typeof value === "string") {
        const parsed = new Date(value);
        if (!Number.isNaN(parsed.getTime())) {
            return parsed.toISOString();
        }
        return undefined;
    }
    if (value instanceof Date) {
        if (!Number.isNaN(value.getTime())) {
            return value.toISOString();
        }
        return undefined;
    }
    if (isRecordLike(value) && typeof value.toDate === "function") {
        const dateValue = value.toDate();
        if (dateValue instanceof Date && !Number.isNaN(dateValue.getTime())) {
            return dateValue.toISOString();
        }
    }
    return undefined;
}
export class FirestoreTokenStore {
    firestore;
    databaseId;
    collection;
    defaultUserKey;
    encryptionKeyConfig;
    constructor(options = {}) {
        const keyFilename = resolveServiceAccountKeyPath(options.serviceAccountKeyPath);
        const projectId = options.projectId ?? process.env.FIRESTORE_PROJECT_ID ?? process.env.GCP_PROJECT_ID;
        this.databaseId = options.databaseId ?? process.env.FIRESTORE_DATABASE ?? DEFAULT_DATABASE_ID;
        this.collection = options.collection ?? process.env.FIRESTORE_COLLECTION ?? DEFAULT_COLLECTION;
        this.defaultUserKey = options.defaultUserKey ?? resolveDefaultUserKey();
        this.encryptionKeyConfig = resolveTokenEncryptionKeyConfig(options.encryptionKey, options.encryptionKeyVersion);
        this.firestore = new Firestore({
            ...(projectId && projectId.trim().length > 0 ? { projectId: projectId.trim() } : {}),
            ...(this.databaseId !== "(default)" ? { databaseId: this.databaseId } : {}),
            ...(keyFilename ? { keyFilename } : {}),
        });
    }
    buildRecordFromStoredData(data, fallbackUserKey) {
        if (!isRecordLike(data)) {
            return null;
        }
        const nowIso = new Date().toISOString();
        const userKey = normalizeSavedUserKey(data.userKey, fallbackUserKey);
        let tokenPayload = null;
        if (isEncryptedTokensV1(data.tokensEncrypted)) {
            tokenPayload = decryptStoredTokens(data.tokensEncrypted, userKey, this.encryptionKeyConfig);
        }
        else {
            // Backward compatibility: read old plaintext records then rewrite on next save cycle.
            tokenPayload = normalizeTokens(data.tokens);
        }
        return validateTokenStoreRecord({
            userKey,
            tokens: tokenPayload,
            createdAt: toIsoString(data.createdAt) ?? nowIso,
            updatedAt: toIsoString(data.updatedAt) ?? nowIso,
        }, fallbackUserKey);
    }
    documentRef(userKey) {
        return this.firestore.collection(this.collection).doc(toDocumentId(userKey));
    }
    legacyDocumentRef(userKey) {
        return this.firestore.collection(this.collection).doc(toLegacyDocumentId(userKey));
    }
    async loadSnapshotWithFallback(userKey) {
        const primarySnapshot = await this.documentRef(userKey).get();
        if (primarySnapshot.exists) {
            return { snapshot: primarySnapshot, source: "primary" };
        }
        const legacySnapshot = await this.legacyDocumentRef(userKey).get();
        if (legacySnapshot.exists) {
            return { snapshot: legacySnapshot, source: "legacy" };
        }
        return { snapshot: null, source: "none" };
    }
    async load(userKey) {
        const normalizedUserKey = validateUserKey(userKey);
        const loaded = await this.loadSnapshotWithFallback(normalizedUserKey);
        if (!loaded.snapshot) {
            return null;
        }
        const record = this.buildRecordFromStoredData(loaded.snapshot.data(), normalizedUserKey);
        if (!record) {
            return null;
        }
        // One-time migration from legacy base64 doc id to readable doc id.
        if (loaded.source === "legacy") {
            try {
                await this.save(normalizedUserKey, record.tokens);
                await this.legacyDocumentRef(normalizedUserKey).delete();
            }
            catch (error) {
                console.error(`[token-store:firestore] Failed to migrate legacy document key for '${normalizedUserKey}': ${error instanceof Error ? error.message : String(error)}`);
            }
        }
        return record;
    }
    async save(userKey, tokens) {
        const normalizedUserKey = validateUserKey(userKey);
        const validatedTokens = validateStoredOAuthTokens(tokens);
        const documentRef = this.documentRef(normalizedUserKey);
        const loaded = await this.loadSnapshotWithFallback(normalizedUserKey);
        const existing = loaded.snapshot;
        const now = new Date().toISOString();
        const existingData = existing?.data();
        const createdAt = toIsoString(existingData?.createdAt) ?? now;
        const tokensEncrypted = encryptStoredTokens(validatedTokens, normalizedUserKey, this.encryptionKeyConfig);
        await documentRef.set({
            userKey: normalizedUserKey,
            tokensEncrypted,
            tokens: FieldValue.delete(),
            createdAt,
            updatedAt: now,
        }, { merge: true });
        if (loaded.source === "legacy") {
            await this.legacyDocumentRef(normalizedUserKey).delete();
        }
    }
    async delete(userKey) {
        const normalizedUserKey = validateUserKey(userKey);
        const documentRefs = [this.documentRef(normalizedUserKey), this.legacyDocumentRef(normalizedUserKey)];
        try {
            await Promise.all(documentRefs.map((docRef) => docRef.delete()));
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            if (message.includes("5 NOT_FOUND")) {
                return;
            }
            throw error;
        }
    }
    getDefaultUserKey() {
        return this.defaultUserKey;
    }
}
export { fromDocumentId, toDocumentId, toLegacyDocumentId };
