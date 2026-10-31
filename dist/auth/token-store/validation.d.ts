import type { StoredOAuthTokens, TokenStoreRecord } from "./types.js";
export declare function validateUserKey(userKey: string): string;
export declare function validateStoredOAuthTokens(tokens: unknown): StoredOAuthTokens;
export declare function validateTokenStoreRecord(value: unknown, fallbackUserKey: string): TokenStoreRecord | null;
