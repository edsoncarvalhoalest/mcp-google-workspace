function isNonEmptyString(value) {
    return typeof value === "string" && value.trim().length > 0;
}
function isFiniteNumber(value) {
    return typeof value === "number" && Number.isFinite(value);
}
function parseIsoDate(value) {
    if (!isNonEmptyString(value)) {
        return null;
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return null;
    }
    return parsed.toISOString();
}
export function validateUserKey(userKey) {
    const normalized = userKey.trim();
    if (normalized.length === 0) {
        throw new Error("userKey must be a non-empty string.");
    }
    return normalized;
}
export function validateStoredOAuthTokens(tokens) {
    if (typeof tokens !== "object" || tokens === null) {
        throw new Error("tokens must be an object.");
    }
    const source = tokens;
    const normalized = {};
    if (source.access_token !== undefined) {
        if (!isNonEmptyString(source.access_token)) {
            throw new Error("tokens.access_token must be a non-empty string when provided.");
        }
        normalized.access_token = source.access_token.trim();
    }
    if (source.refresh_token !== undefined) {
        if (!isNonEmptyString(source.refresh_token)) {
            throw new Error("tokens.refresh_token must be a non-empty string when provided.");
        }
        normalized.refresh_token = source.refresh_token.trim();
    }
    if (source.scope !== undefined) {
        if (!isNonEmptyString(source.scope)) {
            throw new Error("tokens.scope must be a non-empty string when provided.");
        }
        normalized.scope = source.scope.trim();
    }
    if (source.token_type !== undefined) {
        if (!isNonEmptyString(source.token_type)) {
            throw new Error("tokens.token_type must be a non-empty string when provided.");
        }
        normalized.token_type = source.token_type.trim();
    }
    if (source.expiry_date !== undefined) {
        if (!isFiniteNumber(source.expiry_date)) {
            throw new Error("tokens.expiry_date must be a finite number when provided.");
        }
        normalized.expiry_date = source.expiry_date;
    }
    const hasAnyCredential = Boolean(normalized.access_token || normalized.refresh_token);
    if (!hasAnyCredential) {
        throw new Error("Token payload must contain at least access_token or refresh_token.");
    }
    return normalized;
}
export function validateTokenStoreRecord(value, fallbackUserKey) {
    if (typeof value !== "object" || value === null) {
        return null;
    }
    const raw = value;
    const normalizedUserKey = typeof raw.userKey === "string" && raw.userKey.trim().length > 0 ? raw.userKey.trim() : fallbackUserKey;
    if (typeof raw.tokens !== "object" || raw.tokens === null) {
        return null;
    }
    let tokens;
    try {
        tokens = validateStoredOAuthTokens(raw.tokens);
    }
    catch {
        return null;
    }
    const createdAt = parseIsoDate(raw.createdAt) ?? new Date().toISOString();
    const updatedAt = parseIsoDate(raw.updatedAt) ?? createdAt;
    return {
        userKey: normalizedUserKey,
        tokens,
        createdAt,
        updatedAt,
    };
}
