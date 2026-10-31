function toErrorMessage(error) {
    return error instanceof Error ? error.message : String(error);
}
export class HybridTokenStore {
    primary;
    secondary;
    syncSecondaryToPrimaryOnLoad;
    constructor(options) {
        this.primary = options.primary;
        this.secondary = options.secondary;
        this.syncSecondaryToPrimaryOnLoad = options.syncSecondaryToPrimaryOnLoad ?? true;
    }
    async load(userKey) {
        let primaryError;
        try {
            const primaryRecord = await this.primary.load(userKey);
            if (primaryRecord) {
                return primaryRecord;
            }
        }
        catch (error) {
            primaryError = error;
            console.error(`[token-store:hybrid] Primary load failed for '${userKey}': ${toErrorMessage(error)}`);
        }
        try {
            const secondaryRecord = await this.secondary.load(userKey);
            if (!secondaryRecord) {
                if (primaryError) {
                    throw primaryError;
                }
                return null;
            }
            if (this.syncSecondaryToPrimaryOnLoad) {
                try {
                    await this.primary.save(userKey, secondaryRecord.tokens);
                }
                catch (syncError) {
                    console.error(`[token-store:hybrid] Failed to sync secondary->primary for '${userKey}': ${toErrorMessage(syncError)}`);
                }
            }
            return secondaryRecord;
        }
        catch (secondaryError) {
            console.error(`[token-store:hybrid] Secondary load failed for '${userKey}': ${toErrorMessage(secondaryError)}`);
            if (primaryError) {
                throw new Error(`Hybrid token load failed on both stores. primary='${toErrorMessage(primaryError)}', secondary='${toErrorMessage(secondaryError)}'`);
            }
            throw secondaryError;
        }
    }
    async save(userKey, tokens) {
        await this.primary.save(userKey, tokens);
        try {
            await this.secondary.save(userKey, tokens);
        }
        catch (error) {
            // Local write already succeeded. Keep app usable and only log mirror failure.
            console.error(`[token-store:hybrid] Secondary save failed for '${userKey}': ${toErrorMessage(error)}`);
        }
    }
    async delete(userKey) {
        await this.primary.delete(userKey);
        try {
            await this.secondary.delete(userKey);
        }
        catch (error) {
            // Delete from mirror is best-effort.
            console.error(`[token-store:hybrid] Secondary delete failed for '${userKey}': ${toErrorMessage(error)}`);
        }
    }
}
