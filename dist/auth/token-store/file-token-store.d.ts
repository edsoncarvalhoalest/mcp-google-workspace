import type { StoredOAuthTokens, TokenStore, TokenStoreRecord } from "./types.js";
type FileTokenStoreOptions = {
    configDir?: string;
    defaultUserKey?: string;
    legacyKeysDir?: string;
};
export declare class FileTokenStore implements TokenStore {
    private readonly configDir;
    private readonly defaultUserKey;
    private readonly legacyTokenPath;
    private readonly multiUserPath;
    private readonly legacyKeysTokenPath;
    constructor(options?: FileTokenStoreOptions);
    private ensureConfigDirExists;
    private safeReadJson;
    private writeJsonAtomic;
    private readLegacyDefaultRecord;
    private readLegacyTokenRecordFromPath;
    private readMultiUserStore;
    private writeMultiUserStore;
    load(userKey: string): Promise<TokenStoreRecord | null>;
    save(userKey: string, tokens: StoredOAuthTokens): Promise<void>;
    delete(userKey: string): Promise<void>;
}
export {};
