import type { StoredOAuthTokens, TokenStore, TokenStoreRecord } from "./types.js";
type HybridTokenStoreOptions = {
    primary: TokenStore;
    secondary: TokenStore;
    syncSecondaryToPrimaryOnLoad?: boolean;
};
export declare class HybridTokenStore implements TokenStore {
    private readonly primary;
    private readonly secondary;
    private readonly syncSecondaryToPrimaryOnLoad;
    constructor(options: HybridTokenStoreOptions);
    load(userKey: string): Promise<TokenStoreRecord | null>;
    save(userKey: string, tokens: StoredOAuthTokens): Promise<void>;
    delete(userKey: string): Promise<void>;
}
export type { HybridTokenStoreOptions };
