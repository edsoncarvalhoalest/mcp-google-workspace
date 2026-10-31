import type { StoredOAuthTokens, TokenStore, TokenStoreRecord } from "./types.js";
type FirestoreTokenStoreOptions = {
    projectId?: string;
    databaseId?: string;
    collection?: string;
    defaultUserKey?: string;
    serviceAccountKeyPath?: string;
    encryptionKey?: string;
    encryptionKeyVersion?: string;
};
declare function toDocumentId(userKey: string): string;
declare function toLegacyDocumentId(userKey: string): string;
declare function fromDocumentId(documentId: string): string;
export declare class FirestoreTokenStore implements TokenStore {
    private readonly firestore;
    private readonly databaseId;
    private readonly collection;
    private readonly defaultUserKey;
    private readonly encryptionKeyConfig;
    constructor(options?: FirestoreTokenStoreOptions);
    private buildRecordFromStoredData;
    private documentRef;
    private legacyDocumentRef;
    private loadSnapshotWithFallback;
    load(userKey: string): Promise<TokenStoreRecord | null>;
    save(userKey: string, tokens: StoredOAuthTokens): Promise<void>;
    delete(userKey: string): Promise<void>;
    getDefaultUserKey(): string;
}
export type { FirestoreTokenStoreOptions };
export { fromDocumentId, toDocumentId, toLegacyDocumentId };
