export function getRequiredString(args, key) {
    const value = args?.[key];
    if (typeof value !== "string" || value.trim().length === 0) {
        throw new Error(`Field '${key}' must be a non-empty string.`);
    }
    return value;
}
export function getOptionalPositiveNumber(args, key, fallback) {
    const value = args?.[key];
    if (value === undefined || value === null) {
        return fallback;
    }
    if (typeof value !== "number" || Number.isNaN(value)) {
        throw new Error(`Field '${key}' must be a number.`);
    }
    const normalized = Math.floor(value);
    if (normalized < 1) {
        throw new Error(`Field '${key}' must be >= 1.`);
    }
    return normalized;
}
