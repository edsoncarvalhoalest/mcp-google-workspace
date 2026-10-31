import type { TokenStore } from "./types.js";
export type TokenStoreProvider = "file" | "firestore" | "hybrid";
export declare function resolveTokenStoreProvider(): TokenStoreProvider;
export declare function createTokenStore(provider?: TokenStoreProvider): TokenStore;
