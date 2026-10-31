const FALLBACK_USER_KEY = "default";
export function resolveDefaultUserKey(fallback = FALLBACK_USER_KEY) {
    const candidates = [
        process.env.TOKEN_STORE_DEFAULT_USER_KEY,
        process.env.MCP_USER_KEY,
        process.env.USER,
    ];
    for (const candidate of candidates) {
        const normalized = candidate?.trim();
        if (normalized && normalized.length > 0) {
            return normalized;
        }
    }
    return fallback;
}
