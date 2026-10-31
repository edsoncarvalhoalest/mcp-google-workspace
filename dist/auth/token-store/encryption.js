import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
const AES_ALGORITHM = "aes-256-gcm";
const AES_KEY_BYTES = 32;
const AES_IV_BYTES = 12;
const AES_AUTH_TAG_BYTES = 16;
const ENCRYPTION_KEY_ENV_KEYS = ["TOKEN_STORE_ENCRYPTION_KEY", "TOKEN_ENCRYPTION_KEY"];
function decodeBase64Key(raw) {
    const normalized = raw.trim();
    if (!/^[A-Za-z0-9+/=_-]+$/.test(normalized)) {
        return null;
    }
    try {
        const parsed = Buffer.from(normalized, "base64");
        if (parsed.length !== AES_KEY_BYTES) {
            return null;
        }
        return parsed;
    }
    catch {
        return null;
    }
}
function decodeHexKey(raw) {
    const normalized = raw.trim();
    if (!/^[0-9a-fA-F]{64}$/.test(normalized)) {
        return null;
    }
    return Buffer.from(normalized, "hex");
}
function resolveRawEncryptionKey(explicitKey) {
    if (explicitKey && explicitKey.trim().length > 0) {
        return explicitKey.trim();
    }
    for (const keyName of ENCRYPTION_KEY_ENV_KEYS) {
        const value = process.env[keyName];
        if (value && value.trim().length > 0) {
            return value.trim();
        }
    }
    return null;
}
export function resolveTokenEncryptionKeyConfig(explicitKey, explicitVersion) {
    const rawKey = resolveRawEncryptionKey(explicitKey);
    if (!rawKey) {
        throw new Error("Missing token encryption key. Set TOKEN_STORE_ENCRYPTION_KEY (base64 or 64-char hex) before using Firestore token store.");
    }
    const keyBuffer = decodeBase64Key(rawKey) ?? decodeHexKey(rawKey) ?? createHash("sha256").update(rawKey).digest();
    const keyVersion = explicitVersion?.trim() || process.env.TOKEN_STORE_ENCRYPTION_KEY_VERSION?.trim() || "1";
    return { key: keyBuffer, keyVersion };
}
function buildAad(userKey) {
    return Buffer.from(`oauth_user_tokens:${userKey}`, "utf-8");
}
export function isEncryptedTokensV1(value) {
    if (typeof value !== "object" || value === null) {
        return false;
    }
    const raw = value;
    return (raw.v === 1 &&
        raw.alg === AES_ALGORITHM &&
        typeof raw.iv === "string" &&
        typeof raw.tag === "string" &&
        typeof raw.ciphertext === "string" &&
        typeof raw.keyVersion === "string");
}
export function encryptStoredTokens(tokens, userKey, keyConfig) {
    const iv = randomBytes(AES_IV_BYTES);
    const cipher = createCipheriv(AES_ALGORITHM, keyConfig.key, iv, {
        authTagLength: AES_AUTH_TAG_BYTES,
    });
    cipher.setAAD(buildAad(userKey));
    const plaintext = Buffer.from(JSON.stringify(tokens), "utf-8");
    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const tag = cipher.getAuthTag();
    return {
        v: 1,
        alg: AES_ALGORITHM,
        iv: iv.toString("base64"),
        tag: tag.toString("base64"),
        ciphertext: ciphertext.toString("base64"),
        keyVersion: keyConfig.keyVersion,
    };
}
export function decryptStoredTokens(encrypted, userKey, keyConfig) {
    const iv = Buffer.from(encrypted.iv, "base64");
    const tag = Buffer.from(encrypted.tag, "base64");
    const ciphertext = Buffer.from(encrypted.ciphertext, "base64");
    if (iv.length !== AES_IV_BYTES) {
        throw new Error("Invalid encrypted token payload: iv length mismatch.");
    }
    if (tag.length !== AES_AUTH_TAG_BYTES) {
        throw new Error("Invalid encrypted token payload: auth tag length mismatch.");
    }
    const decipher = createDecipheriv(AES_ALGORITHM, keyConfig.key, iv, {
        authTagLength: AES_AUTH_TAG_BYTES,
    });
    decipher.setAAD(buildAad(userKey));
    decipher.setAuthTag(tag);
    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf-8");
    const parsed = JSON.parse(plaintext);
    if (typeof parsed !== "object" || parsed === null) {
        throw new Error("Decrypted token payload is not an object.");
    }
    return parsed;
}
