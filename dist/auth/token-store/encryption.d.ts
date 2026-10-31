import type { StoredOAuthTokens } from "./types.js";
export type EncryptedTokensV1 = {
    v: 1;
    alg: "aes-256-gcm";
    iv: string;
    tag: string;
    ciphertext: string;
    keyVersion: string;
};
export type EncryptionKeyConfig = {
    key: Buffer;
    keyVersion: string;
};
export declare function resolveTokenEncryptionKeyConfig(explicitKey?: string, explicitVersion?: string): EncryptionKeyConfig;
export declare function isEncryptedTokensV1(value: unknown): value is EncryptedTokensV1;
export declare function encryptStoredTokens(tokens: StoredOAuthTokens, userKey: string, keyConfig: EncryptionKeyConfig): EncryptedTokensV1;
export declare function decryptStoredTokens(encrypted: EncryptedTokensV1, userKey: string, keyConfig: EncryptionKeyConfig): StoredOAuthTokens;
