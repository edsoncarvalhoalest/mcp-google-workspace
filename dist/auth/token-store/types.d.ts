export type StoredOAuthTokens = {
    access_token?: string;
    refresh_token?: string;
    scope?: string;
    token_type?: string;
    expiry_date?: number;
};
export type TokenStoreRecord = {
    userKey: string;
    tokens: StoredOAuthTokens;
    createdAt: string;
    updatedAt: string;
};
export interface TokenStore {
    load(userKey: string): Promise<TokenStoreRecord | null>;
    save(userKey: string, tokens: StoredOAuthTokens): Promise<void>;
    delete(userKey: string): Promise<void>;
}
