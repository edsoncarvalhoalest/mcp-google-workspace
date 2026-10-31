import { getRequiredString } from "../../shared/args.js";
function parseSheetCellValue(value, key, rowIndex, columnIndex) {
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean" || value === null) {
        return value;
    }
    throw new Error(`Field '${key}[${rowIndex}][${columnIndex}]' must be string|number|boolean|null.`);
}
function getRequired2DValues(args, key) {
    const raw = args?.[key];
    if (!Array.isArray(raw)) {
        throw new Error(`Field '${key}' must be a 2D array.`);
    }
    const matrix = raw.map((row, rowIndex) => {
        if (!Array.isArray(row)) {
            throw new Error(`Field '${key}[${rowIndex}]' must be an array.`);
        }
        return row.map((cell, columnIndex) => parseSheetCellValue(cell, key, rowIndex, columnIndex));
    });
    if (matrix.length === 0) {
        throw new Error(`Field '${key}' must contain at least one row.`);
    }
    return matrix;
}
function getOptionalString(args, key) {
    const value = args?.[key];
    if (value === undefined || value === null) {
        return undefined;
    }
    if (typeof value !== "string") {
        throw new Error(`Field '${key}' must be a string.`);
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
}
function getOptionalBoolean(args, key) {
    const value = args?.[key];
    if (value === undefined || value === null) {
        return undefined;
    }
    if (typeof value !== "boolean") {
        throw new Error(`Field '${key}' must be a boolean.`);
    }
    return value;
}
function getRequiredStringArray(args, key) {
    const value = args?.[key];
    if (!Array.isArray(value) || value.length === 0) {
        throw new Error(`Field '${key}' must be a non-empty array of strings.`);
    }
    const parsed = value.map((item, index) => {
        if (typeof item !== "string" || item.trim().length === 0) {
            throw new Error(`Field '${key}[${index}]' must be a non-empty string.`);
        }
        return item.trim();
    });
    return parsed;
}
export function parseCreateSpreadsheetParams(args) {
    return {
        title: getRequiredString(args, "title"),
    };
}
export function parseAddWorksheetParams(args) {
    return {
        spreadsheetId: getRequiredString(args, "spreadsheetId"),
        sheetTitle: getRequiredString(args, "sheetTitle"),
    };
}
export function parseReadSheetDataParams(args) {
    const rawValueRenderOption = args?.valueRenderOption;
    let valueRenderOption;
    if (typeof rawValueRenderOption === "string" && rawValueRenderOption.trim().length > 0) {
        const normalized = rawValueRenderOption.trim().toUpperCase();
        if (normalized !== "FORMATTED_VALUE" && normalized !== "UNFORMATTED_VALUE" && normalized !== "FORMULA") {
            throw new Error("Field 'valueRenderOption' must be FORMATTED_VALUE, UNFORMATTED_VALUE, or FORMULA.");
        }
        valueRenderOption = normalized;
    }
    return {
        spreadsheetId: getRequiredString(args, "spreadsheetId"),
        range: getRequiredString(args, "range"),
        ...(valueRenderOption ? { valueRenderOption } : {}),
    };
}
export function parseWriteSheetDataParams(args) {
    return {
        spreadsheetId: getRequiredString(args, "spreadsheetId"),
        range: getRequiredString(args, "range"),
        values: getRequired2DValues(args, "values"),
    };
}
export function parseAppendSheetDataParams(args) {
    return {
        spreadsheetId: getRequiredString(args, "spreadsheetId"),
        range: getRequiredString(args, "range"),
        values: getRequired2DValues(args, "values"),
    };
}
export function parseSmartSheetStylerParams(args) {
    const rawTheme = getOptionalString(args, "theme");
    if (!rawTheme) {
        return {
            spreadsheetId: getRequiredString(args, "spreadsheetId"),
            range: getRequiredString(args, "range"),
        };
    }
    const normalizedTheme = rawTheme.toLowerCase();
    if (normalizedTheme !== "slate" && normalizedTheme !== "forest" && normalizedTheme !== "sunset") {
        throw new Error("Field 'theme' must be one of: slate, forest, sunset.");
    }
    return {
        spreadsheetId: getRequiredString(args, "spreadsheetId"),
        range: getRequiredString(args, "range"),
        theme: normalizedTheme,
    };
}
export function parseInjectDataChartParams(args) {
    const chartType = getRequiredString(args, "chartType").trim().toUpperCase();
    if (chartType !== "BAR" && chartType !== "LINE" && chartType !== "PIE") {
        throw new Error("Field 'chartType' must be BAR, LINE, or PIE.");
    }
    const chartTitle = getOptionalString(args, "chartTitle");
    const anchorCell = getOptionalString(args, "anchorCell");
    const targetSheetTitle = getOptionalString(args, "targetSheetTitle");
    return {
        spreadsheetId: getRequiredString(args, "spreadsheetId"),
        dataRange: getRequiredString(args, "dataRange"),
        chartType,
        ...(chartTitle ? { chartTitle } : {}),
        ...(anchorCell ? { anchorCell } : {}),
        ...(targetSheetTitle ? { targetSheetTitle } : {}),
    };
}
export function parseCreateDropdownFilterParams(args) {
    const strict = getOptionalBoolean(args, "strict");
    const showCustomUi = getOptionalBoolean(args, "showCustomUi");
    const protectSourceRange = getOptionalBoolean(args, "protectSourceRange");
    const warningOnly = getOptionalBoolean(args, "warningOnly");
    return {
        spreadsheetId: getRequiredString(args, "spreadsheetId"),
        dataRange: getRequiredString(args, "dataRange"),
        dropdownRange: getRequiredString(args, "dropdownRange"),
        dropdownValues: getRequiredStringArray(args, "dropdownValues"),
        ...(strict !== undefined ? { strict } : {}),
        ...(showCustomUi !== undefined ? { showCustomUi } : {}),
        ...(protectSourceRange !== undefined ? { protectSourceRange } : {}),
        ...(warningOnly !== undefined ? { warningOnly } : {}),
    };
}
export function parseObserveSpreadsheetContextParams(args) {
    return {
        spreadsheetId: getRequiredString(args, "spreadsheetId"),
        range: getRequiredString(args, "range"),
    };
}
export function parseDiagnoseSheetExecutionParams(args) {
    return {
        spreadsheetId: getRequiredString(args, "spreadsheetId"),
        range: getRequiredString(args, "range"),
    };
}
