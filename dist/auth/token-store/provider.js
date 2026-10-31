import { FileTokenStore } from "./file-token-store.js";
import { FirestoreTokenStore } from "./firestore-token-store.js";
import { HybridTokenStore } from "./hybrid-token-store.js";
export function resolveTokenStoreProvider() {
    const raw = process.env.TOKEN_STORE_PROVIDER?.trim().toLowerCase();
    if (raw === "hybrid" || raw === "both" || raw === "file+firestore") {
        return "hybrid";
    }
    if (raw === "firestore") {
        return "firestore";
    }
    return "file";
}
export function createTokenStore(provider = resolveTokenStoreProvider()) {
    if (provider === "hybrid") {
        return new HybridTokenStore({
            primary: new FileTokenStore(),
            secondary: new FirestoreTokenStore(),
            syncSecondaryToPrimaryOnLoad: true,
        });
    }
    if (provider === "firestore") {
        return new FirestoreTokenStore();
    }
    return new FileTokenStore();
}
