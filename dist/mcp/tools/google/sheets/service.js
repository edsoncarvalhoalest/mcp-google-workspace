import { google } from "googleapis";
import { oauth2Client } from "../../../../auth/personalAuth.js";
function createSheetsApi() {
    return google.sheets({ version: "v4", auth: oauth2Client });
}
function quoteSheetTitle(sheetTitle) {
    return `'${sheetTitle.replace(/'/g, "''")}'`;
}
function formatSheetTitleForA1(sheetTitle) {
    return /^[A-Za-z0-9_]+$/.test(sheetTitle) ? sheetTitle : quoteSheetTitle(sheetTitle);
}
export function normalizeRangeForApi(range) {
    const trimmed = range.trim();
    const bangIndex = trimmed.lastIndexOf("!");
    if (bangIndex < 1) {
        return trimmed;
    }
    const rawSheetPart = trimmed.slice(0, bangIndex).trim();
    const coordPart = trimmed.slice(bangIndex + 1).trim();
    if (/^'.*'$/.test(rawSheetPart)) {
        return `${rawSheetPart}!${coordPart}`;
    }
    if (/^[A-Za-z0-9_]+$/.test(rawSheetPart)) {
        return `${rawSheetPart}!${coordPart}`;
    }
    return `${quoteSheetTitle(rawSheetPart)}!${coordPart}`;
}
function unquoteSheetTitle(sheetTitle) {
    const trimmed = sheetTitle.trim();
    if (/^'.*'$/.test(trimmed)) {
        return trimmed.slice(1, -1).replace(/''/g, "'");
    }
    return trimmed;
}
function parseSheetAndGridRange(range) {
    const normalizedRange = normalizeRangeForApi(range);
    const bangIndex = normalizedRange.lastIndexOf("!");
    if (bangIndex < 1) {
        return { normalizedRange, gridRange: normalizedRange };
    }
    const sheetTitle = unquoteSheetTitle(normalizedRange.slice(0, bangIndex));
    const gridRange = normalizedRange.slice(bangIndex + 1).trim();
    return { normalizedRange, sheetTitle, gridRange };
}
function columnLettersToIndex(columnLetters) {
    const normalized = columnLetters.trim().toUpperCase();
    let result = 0;
    for (const char of normalized) {
        const code = char.charCodeAt(0);
        if (code < 65 || code > 90) {
            throw new Error(`Invalid column letter '${columnLetters}'.`);
        }
        result = result * 26 + (code - 64);
    }
    return result - 1;
}
export function columnIndexToLetters(columnIndex) {
    if (!Number.isInteger(columnIndex) || columnIndex < 0) {
        throw new Error(`Column index must be a non-negative integer. Received ${columnIndex}.`);
    }
    let remaining = columnIndex + 1;
    let letters = "";
    while (remaining > 0) {
        const modulo = (remaining - 1) % 26;
        letters = String.fromCharCode(65 + modulo) + letters;
        remaining = Math.floor((remaining - 1) / 26);
    }
    return letters;
}
function parseA1Reference(reference) {
    const cleaned = reference.trim().replace(/\$/g, "");
    if (cleaned.length === 0) {
        return {};
    }
    const match = /^([A-Za-z]+)?(\d+)?$/.exec(cleaned);
    if (!match) {
        return {};
    }
    const columnLetters = match[1];
    const rowText = match[2];
    return {
        ...(columnLetters ? { columnIndex: columnLettersToIndex(columnLetters) } : {}),
        ...(rowText ? { row: Number.parseInt(rowText, 10) } : {}),
    };
}
function parseA1Bounds(gridRange) {
    const cleaned = gridRange.trim().replace(/\$/g, "");
    const [rawStart = "", rawEnd] = cleaned.split(":", 2);
    const start = parseA1Reference(rawStart);
    const end = rawEnd === undefined ? start : parseA1Reference(rawEnd);
    return {
        startColumnIndex: start.columnIndex ?? 0,
        startRow: start.row ?? 1,
        ...(end.columnIndex !== undefined ? { endColumnIndex: end.columnIndex } : {}),
        ...(end.row !== undefined ? { endRow: end.row } : {}),
    };
}
function formatA1Cell(sheetTitle, columnIndex, row) {
    const cell = `${columnIndexToLetters(columnIndex)}${row}`;
    return sheetTitle ? `${formatSheetTitleForA1(sheetTitle)}!${cell}` : cell;
}
function formatA1Range(sheetTitle, startColumnIndex, startRow, endColumnIndex, endRow) {
    const range = `${columnIndexToLetters(startColumnIndex)}${startRow}:${columnIndexToLetters(endColumnIndex)}${endRow}`;
    return sheetTitle ? `${formatSheetTitleForA1(sheetTitle)}!${range}` : range;
}
const STYLER_THEME_PALETTES = {
    slate: {
        headerBackground: { red: 0.184, green: 0.247, blue: 0.345 },
        headerText: { red: 1, green: 1, blue: 1 },
        border: { red: 0.757, green: 0.804, blue: 0.859 },
        zebraOdd: { red: 0.97, green: 0.978, blue: 0.992 },
        zebraEven: { red: 1, green: 1, blue: 1 },
    },
    forest: {
        headerBackground: { red: 0.18, green: 0.392, blue: 0.294 },
        headerText: { red: 1, green: 1, blue: 1 },
        border: { red: 0.749, green: 0.847, blue: 0.776 },
        zebraOdd: { red: 0.949, green: 0.98, blue: 0.961 },
        zebraEven: { red: 1, green: 1, blue: 1 },
    },
    sunset: {
        headerBackground: { red: 0.706, green: 0.337, blue: 0.247 },
        headerText: { red: 1, green: 1, blue: 1 },
        border: { red: 0.925, green: 0.8, blue: 0.749 },
        zebraOdd: { red: 0.996, green: 0.961, blue: 0.941 },
        zebraEven: { red: 1, green: 1, blue: 1 },
    },
};
function clampGridIndexes(startIndex, endIndex, maxLength) {
    const normalizedStart = Math.max(0, startIndex);
    const normalizedMax = Math.max(maxLength, normalizedStart + 1);
    const normalizedEnd = Math.min(Math.max(normalizedStart + 1, endIndex), normalizedMax);
    return { startIndex: normalizedStart, endIndex: normalizedEnd };
}
function resolveA1CellReference(cell) {
    const parsed = parseA1Reference(cell);
    if (parsed.columnIndex === undefined || parsed.row === undefined) {
        throw new Error(`Field 'anchorCell' must be a valid A1 cell (e.g. H2). Received '${cell}'.`);
    }
    if (parsed.row < 1) {
        throw new Error(`Anchor row must be >= 1. Received '${cell}'.`);
    }
    return { columnIndex: parsed.columnIndex, row: parsed.row };
}
async function resolveSheetGridContext(sheetsApi, spreadsheetId, range, explicitSheetTitle) {
    const { normalizedRange, sheetTitle: sheetTitleFromRange, gridRange } = parseSheetAndGridRange(range);
    const metadataResponse = await sheetsApi.spreadsheets.get({
        spreadsheetId,
        fields: "sheets(properties(sheetId,title,gridProperties(rowCount,columnCount)))",
    });
    const sheets = metadataResponse.data.sheets ?? [];
    if (sheets.length === 0) {
        throw new Error("Spreadsheet has no worksheet tabs.");
    }
    const targetSheetTitle = explicitSheetTitle ?? sheetTitleFromRange ?? sheets[0]?.properties?.title ?? "";
    const targetSheet = sheets.find((sheet) => sheet.properties?.title === targetSheetTitle);
    if (!targetSheet) {
        throw new Error(`Worksheet '${targetSheetTitle}' was not found in spreadsheet.`);
    }
    const sheetId = targetSheet.properties?.sheetId;
    if (typeof sheetId !== "number") {
        throw new Error(`Worksheet '${targetSheetTitle}' does not expose a valid sheetId.`);
    }
    const rowCount = targetSheet.properties?.gridProperties?.rowCount ?? 1000;
    const columnCount = targetSheet.properties?.gridProperties?.columnCount ?? 26;
    const bounds = parseA1Bounds(gridRange);
    const rowIndexes = clampGridIndexes(bounds.startRow - 1, bounds.endRow ?? rowCount, rowCount);
    const columnIndexes = clampGridIndexes(bounds.startColumnIndex, bounds.endColumnIndex !== undefined ? bounds.endColumnIndex + 1 : columnCount, columnCount);
    return {
        normalizedRange,
        sheetTitle: targetSheetTitle,
        sheetId,
        startRowIndex: rowIndexes.startIndex,
        endRowIndex: rowIndexes.endIndex,
        startColumnIndex: columnIndexes.startIndex,
        endColumnIndex: columnIndexes.endIndex,
    };
}
function normalizeName(value) {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
}
function isBlankCell(value) {
    return value === undefined || value === null || (typeof value === "string" && value.trim().length === 0);
}
function isBlankRow(row) {
    return row.every((cell) => isBlankCell(cell));
}
function coerceMatrix(values) {
    if (!Array.isArray(values)) {
        return [];
    }
    return values.map((row) => (Array.isArray(row) ? row : []));
}
function stringifyCell(value) {
    if (value === undefined || value === null) {
        return "";
    }
    return String(value);
}
function getMaxColumnCount(values) {
    return values.reduce((max, row) => Math.max(max, row.length), 0);
}
function collectNonEmptyRelativeColumns(rows) {
    const indexes = new Set();
    rows.forEach((row) => {
        row.forEach((cell, columnIndex) => {
            if (!isBlankCell(cell)) {
                indexes.add(columnIndex);
            }
        });
    });
    return Array.from(indexes).sort((left, right) => left - right);
}
function buildDataBlock(values, bounds, sheetTitle, startRowOffset, endRowOffset, blockId) {
    const rows = values.slice(startRowOffset, endRowOffset + 1);
    const nonEmptyRelativeColumns = collectNonEmptyRelativeColumns(rows);
    const minRelativeColumn = nonEmptyRelativeColumns[0] ?? 0;
    const maxRelativeColumn = nonEmptyRelativeColumns[nonEmptyRelativeColumns.length - 1] ?? minRelativeColumn;
    const startColumnIndex = bounds.startColumnIndex + minRelativeColumn;
    const endColumnIndex = bounds.startColumnIndex + maxRelativeColumn;
    const absoluteStartRow = bounds.startRow + startRowOffset;
    const absoluteEndRow = bounds.startRow + endRowOffset;
    const headerRow = rows[0] ?? [];
    const headers = [];
    for (let relativeColumn = minRelativeColumn; relativeColumn <= maxRelativeColumn; relativeColumn += 1) {
        const value = stringifyCell(headerRow[relativeColumn]).trim();
        if (value.length === 0) {
            continue;
        }
        const absoluteColumnIndex = bounds.startColumnIndex + relativeColumn;
        headers.push({
            column: columnIndexToLetters(absoluteColumnIndex),
            cell: formatA1Cell(sheetTitle, absoluteColumnIndex, absoluteStartRow),
            value,
        });
    }
    const nonEmptyCellCount = rows.reduce((count, row) => count + row.filter((cell) => !isBlankCell(cell)).length, 0);
    return {
        blockId,
        ...(sheetTitle ? { sheetTitle } : {}),
        range: formatA1Range(sheetTitle, startColumnIndex, absoluteStartRow, endColumnIndex, absoluteEndRow),
        startRow: absoluteStartRow,
        endRow: absoluteEndRow,
        startColumn: columnIndexToLetters(startColumnIndex),
        endColumn: columnIndexToLetters(endColumnIndex),
        rowCount: rows.length,
        columnCount: endColumnIndex - startColumnIndex + 1,
        nonEmptyCellCount,
        headers,
        dataRowCount: Math.max(0, rows.length - 1),
        sampleRows: rows.slice(0, 5).map((row) => Array.from({ length: endColumnIndex - startColumnIndex + 1 }, (_, index) => stringifyCell(row[minRelativeColumn + index]))),
    };
}
export function detectDataBlocks(values, range) {
    const { sheetTitle, gridRange } = parseSheetAndGridRange(range);
    const bounds = parseA1Bounds(gridRange);
    const blocks = [];
    let currentStartOffset = null;
    for (let rowOffset = 0; rowOffset < values.length; rowOffset += 1) {
        const row = values[rowOffset] ?? [];
        if (isBlankRow(row)) {
            if (currentStartOffset !== null) {
                blocks.push(buildDataBlock(values, bounds, sheetTitle, currentStartOffset, rowOffset - 1, blocks.length + 1));
                currentStartOffset = null;
            }
            continue;
        }
        if (currentStartOffset === null) {
            currentStartOffset = rowOffset;
        }
    }
    if (currentStartOffset !== null) {
        blocks.push(buildDataBlock(values, bounds, sheetTitle, currentStartOffset, values.length - 1, blocks.length + 1));
    }
    return blocks;
}
const SEMICOLON_ARGUMENT_LOCALE_SUFFIXES = new Set([
    "AR",
    "AT",
    "BE",
    "BG",
    "BR",
    "CH",
    "CL",
    "CO",
    "CR",
    "CZ",
    "DE",
    "DK",
    "EE",
    "ES",
    "FI",
    "FR",
    "GR",
    "HR",
    "HU",
    "ID",
    "IT",
    "LT",
    "LU",
    "LV",
    "MX",
    "NL",
    "NO",
    "PE",
    "PL",
    "PT",
    "RO",
    "RS",
    "RU",
    "SE",
    "SI",
    "SK",
    "TR",
    "UA",
    "UY",
    "VE",
    "VN",
]);
export function inferFormulaArgumentSeparatorFromLocale(locale) {
    if (!locale || locale.trim().length === 0) {
        return ",";
    }
    const normalized = locale.trim().replace("-", "_");
    const parts = normalized.split("_").filter((part) => part.length > 0);
    if (parts.length < 2) {
        if (parts[0]?.toLowerCase() === "en") {
            return ",";
        }
        if (parts[0]?.toLowerCase() === "vi") {
            return ";";
        }
        return ",";
    }
    const countryCode = parts[1]?.toUpperCase() ?? "";
    return SEMICOLON_ARGUMENT_LOCALE_SUFFIXES.has(countryCode) ? ";" : ",";
}
function countSeparatorOutsideQuotes(formula, separator) {
    let count = 0;
    let inDoubleQuote = false;
    for (let index = 0; index < formula.length; index += 1) {
        const char = formula[index];
        if (char === '"') {
            if (inDoubleQuote && formula[index + 1] === '"') {
                index += 1;
                continue;
            }
            inDoubleQuote = !inDoubleQuote;
            continue;
        }
        if (!inDoubleQuote && char === separator) {
            count += 1;
        }
    }
    return count;
}
function inferDecimalSeparatorFromToken(token) {
    const lastComma = token.lastIndexOf(",");
    const lastDot = token.lastIndexOf(".");
    if (lastComma < 0 && lastDot < 0) {
        return null;
    }
    if (lastComma >= 0 && lastDot >= 0) {
        return lastComma > lastDot ? "," : ".";
    }
    const separatorIndex = Math.max(lastComma, lastDot);
    const separator = lastComma >= 0 ? "," : ".";
    const digitsAfter = token.slice(separatorIndex + 1).replace(/\D/g, "").length;
    const digitsBefore = token.slice(0, separatorIndex).replace(/\D/g, "").length;
    if (digitsAfter === 3 && digitsBefore <= 3) {
        return null;
    }
    return separator;
}
function collectDecimalEvidence(values) {
    let commaDecimalCount = 0;
    let dotDecimalCount = 0;
    const numericTokenPattern = /[-+]?\d[\d\s.,]*[.,]\d+/g;
    values.forEach((row) => {
        row.forEach((cell) => {
            const text = stringifyCell(cell);
            const tokens = text.match(numericTokenPattern) ?? [];
            tokens.forEach((token) => {
                const separator = inferDecimalSeparatorFromToken(token);
                if (separator === ",") {
                    commaDecimalCount += 1;
                }
                if (separator === ".") {
                    dotDecimalCount += 1;
                }
            });
        });
    });
    return { commaDecimalCount, dotDecimalCount };
}
function collectFormulaSeparatorEvidence(values) {
    let commaFormulaSeparatorCount = 0;
    let semicolonFormulaSeparatorCount = 0;
    values.forEach((row) => {
        row.forEach((cell) => {
            const formula = stringifyCell(cell).trim();
            if (!formula.startsWith("=")) {
                return;
            }
            commaFormulaSeparatorCount += countSeparatorOutsideQuotes(formula, ",");
            semicolonFormulaSeparatorCount += countSeparatorOutsideQuotes(formula, ";");
        });
    });
    return { commaFormulaSeparatorCount, semicolonFormulaSeparatorCount };
}
export function inferLocaleSignals(formattedValues, formulaValues, spreadsheetLocale) {
    const decimalEvidence = collectDecimalEvidence(formattedValues);
    const formulaEvidence = collectFormulaSeparatorEvidence(formulaValues);
    const inferredDecimalSeparator = decimalEvidence.commaDecimalCount > decimalEvidence.dotDecimalCount
        ? ","
        : decimalEvidence.dotDecimalCount > decimalEvidence.commaDecimalCount
            ? "."
            : null;
    let inferredFormulaArgumentSeparator = inferFormulaArgumentSeparatorFromLocale(spreadsheetLocale);
    let confidence = spreadsheetLocale ? "metadata" : "low";
    if (formulaEvidence.semicolonFormulaSeparatorCount > formulaEvidence.commaFormulaSeparatorCount) {
        inferredFormulaArgumentSeparator = ";";
        confidence = "formula";
    }
    else if (formulaEvidence.commaFormulaSeparatorCount > formulaEvidence.semicolonFormulaSeparatorCount) {
        inferredFormulaArgumentSeparator = ",";
        confidence = "formula";
    }
    else if (inferredDecimalSeparator) {
        inferredFormulaArgumentSeparator = inferredDecimalSeparator === "," ? ";" : ",";
        confidence = "data";
    }
    return {
        spreadsheetLocale: spreadsheetLocale && spreadsheetLocale.trim().length > 0 ? spreadsheetLocale : null,
        inferredDecimalSeparator,
        inferredFormulaArgumentSeparator,
        confidence,
        evidence: {
            ...decimalEvidence,
            ...formulaEvidence,
        },
    };
}
function isFormulaCellValue(value) {
    return typeof value === "string" && value.trim().startsWith("=");
}
function hasFormulaCells(values) {
    return values.some((row) => row.some((cell) => isFormulaCellValue(cell)));
}
function convertFormulaCommasToSemicolons(formula) {
    let result = "";
    let inDoubleQuote = false;
    let inSingleQuote = false;
    for (let index = 0; index < formula.length; index += 1) {
        const current = formula[index];
        if (current === '"' && !inSingleQuote) {
            if (inDoubleQuote && formula[index + 1] === '"') {
                result += '""';
                index += 1;
                continue;
            }
            inDoubleQuote = !inDoubleQuote;
            result += current;
            continue;
        }
        if (current === "'" && !inDoubleQuote) {
            if (inSingleQuote && formula[index + 1] === "'") {
                result += "''";
                index += 1;
                continue;
            }
            inSingleQuote = !inSingleQuote;
            result += current;
            continue;
        }
        if (!inDoubleQuote && !inSingleQuote && current === ",") {
            result += ";";
            continue;
        }
        result += current;
    }
    return result;
}
function applySemicolonFormulaInterceptor(values) {
    let hasChanges = false;
    const transformed = values.map((row) => row.map((cell) => {
        if (!isFormulaCellValue(cell)) {
            return cell;
        }
        const normalizedFormula = convertFormulaCommasToSemicolons(cell);
        if (normalizedFormula !== cell) {
            hasChanges = true;
        }
        return normalizedFormula;
    }));
    return hasChanges ? transformed : values;
}
async function applyLocaleFormulaInterceptor(sheetsApi, spreadsheetId, values) {
    if (!hasFormulaCells(values)) {
        return values;
    }
    const localeResponse = await sheetsApi.spreadsheets.get({
        spreadsheetId,
        fields: "properties(locale)",
    });
    const locale = localeResponse.data.properties?.locale ?? undefined;
    const expectedSeparator = inferFormulaArgumentSeparatorFromLocale(locale);
    if (expectedSeparator !== ";") {
        return values;
    }
    return applySemicolonFormulaInterceptor(values);
}
function getErrorMessage(error) {
    if (error instanceof Error) {
        return error.message;
    }
    if (typeof error === "string") {
        return error;
    }
    return JSON.stringify(error);
}
export async function createSpreadsheet(title) {
    const sheetsApi = createSheetsApi();
    const response = await sheetsApi.spreadsheets.create({
        requestBody: {
            properties: { title },
        },
    });
    return {
        spreadsheetId: response.data.spreadsheetId ?? "",
        spreadsheetUrl: response.data.spreadsheetUrl ?? "",
        title: response.data.properties?.title ?? title,
    };
}
export async function addWorksheet(spreadsheetId, sheetTitle) {
    const sheetsApi = createSheetsApi();
    const metadata = await sheetsApi.spreadsheets.get({
        spreadsheetId,
        fields: "sheets(properties(sheetId,title,index))",
    });
    const requestedTitleKey = normalizeName(sheetTitle);
    const existingSheet = (metadata.data.sheets ?? []).find((sheet) => normalizeName(sheet.properties?.title ?? "") === requestedTitleKey);
    if (existingSheet) {
        return {
            spreadsheetId,
            sheetId: existingSheet.properties?.sheetId ?? null,
            sheetTitle: existingSheet.properties?.title ?? sheetTitle,
            index: existingSheet.properties?.index ?? null,
            created: false,
        };
    }
    const response = await sheetsApi.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
            requests: [
                {
                    addSheet: {
                        properties: {
                            title: sheetTitle,
                        },
                    },
                },
            ],
        },
    });
    const addSheetReply = response.data.replies?.[0]?.addSheet;
    return {
        spreadsheetId,
        sheetId: addSheetReply?.properties?.sheetId ?? null,
        sheetTitle: addSheetReply?.properties?.title ?? sheetTitle,
        index: addSheetReply?.properties?.index ?? null,
        created: true,
    };
}
export async function readSheetData(spreadsheetId, range, valueRenderOption = "UNFORMATTED_VALUE") {
    const normalizedRange = normalizeRangeForApi(range);
    const sheetsApi = createSheetsApi();
    const response = await sheetsApi.spreadsheets.values.get({
        spreadsheetId,
        range: normalizedRange,
        valueRenderOption,
        dateTimeRenderOption: "FORMATTED_STRING",
    });
    return {
        spreadsheetId,
        range: response.data.range ?? normalizedRange,
        values: response.data.values ?? [],
    };
}
export async function writeSheetData(spreadsheetId, range, values) {
    const normalizedRange = normalizeRangeForApi(range);
    const sheetsApi = createSheetsApi();
    const interceptedValues = await applyLocaleFormulaInterceptor(sheetsApi, spreadsheetId, values);
    await sheetsApi.spreadsheets.values.update({
        spreadsheetId,
        range: normalizedRange,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: interceptedValues },
    });
    return {
        spreadsheetId,
        range: normalizedRange,
        updatedRows: interceptedValues.length,
        updatedColumns: Math.max(...interceptedValues.map((row) => row.length), 0),
    };
}
export async function appendSheetData(spreadsheetId, range, values) {
    const normalizedRange = normalizeRangeForApi(range);
    const sheetsApi = createSheetsApi();
    const interceptedValues = await applyLocaleFormulaInterceptor(sheetsApi, spreadsheetId, values);
    const response = await sheetsApi.spreadsheets.values.append({
        spreadsheetId,
        range: normalizedRange,
        valueInputOption: "USER_ENTERED",
        insertDataOption: "INSERT_ROWS",
        includeValuesInResponse: true,
        requestBody: { values: interceptedValues },
    });
    return {
        spreadsheetId,
        range: normalizedRange,
        updatedRange: response.data.updates?.updatedRange ?? normalizedRange,
        appendedRows: interceptedValues.length,
    };
}
function buildGridRange(context) {
    return {
        sheetId: context.sheetId,
        startRowIndex: context.startRowIndex,
        endRowIndex: context.endRowIndex,
        startColumnIndex: context.startColumnIndex,
        endColumnIndex: context.endColumnIndex,
    };
}
function buildChartSpec(chartType, context, chartTitle) {
    const title = chartTitle?.trim() || undefined;
    const firstDataRowIndex = Math.min(context.startRowIndex + 1, context.endRowIndex - 1);
    const columnCount = context.endColumnIndex - context.startColumnIndex;
    if (chartType === "PIE") {
        const domainRange = {
            sheetId: context.sheetId,
            startRowIndex: firstDataRowIndex,
            endRowIndex: context.endRowIndex,
            startColumnIndex: context.startColumnIndex,
            endColumnIndex: context.startColumnIndex + 1,
        };
        const valueColumnStart = Math.min(context.startColumnIndex + 1, context.endColumnIndex - 1);
        const seriesRange = {
            sheetId: context.sheetId,
            startRowIndex: firstDataRowIndex,
            endRowIndex: context.endRowIndex,
            startColumnIndex: valueColumnStart,
            endColumnIndex: valueColumnStart + 1,
        };
        return {
            ...(title ? { title } : {}),
            pieChart: {
                legendPosition: "RIGHT_LEGEND",
                domain: {
                    sourceRange: { sources: [domainRange] },
                },
                series: {
                    sourceRange: { sources: [seriesRange] },
                },
            },
        };
    }
    const domains = columnCount > 1
        ? [
            {
                domain: {
                    sourceRange: {
                        sources: [
                            {
                                sheetId: context.sheetId,
                                startRowIndex: context.startRowIndex,
                                endRowIndex: context.endRowIndex,
                                startColumnIndex: context.startColumnIndex,
                                endColumnIndex: context.startColumnIndex + 1,
                            },
                        ],
                    },
                },
            },
        ]
        : [];
    const firstSeriesColumn = columnCount > 1 ? context.startColumnIndex + 1 : context.startColumnIndex;
    const series = [];
    for (let columnIndex = firstSeriesColumn; columnIndex < context.endColumnIndex; columnIndex += 1) {
        series.push({
            series: {
                sourceRange: {
                    sources: [
                        {
                            sheetId: context.sheetId,
                            startRowIndex: context.startRowIndex,
                            endRowIndex: context.endRowIndex,
                            startColumnIndex: columnIndex,
                            endColumnIndex: columnIndex + 1,
                        },
                    ],
                },
            },
        });
    }
    return {
        ...(title ? { title } : {}),
        basicChart: {
            chartType: chartType === "BAR" ? "BAR" : "LINE",
            legendPosition: "RIGHT_LEGEND",
            headerCount: 1,
            domains,
            series,
        },
    };
}
export async function smartSheetStyler(params) {
    const sheetsApi = createSheetsApi();
    const context = await resolveSheetGridContext(sheetsApi, params.spreadsheetId, params.range);
    const theme = params.theme ?? "slate";
    const palette = STYLER_THEME_PALETTES[theme];
    const headerEndRowIndex = Math.min(context.startRowIndex + 1, context.endRowIndex);
    const requests = [
        {
            repeatCell: {
                range: {
                    sheetId: context.sheetId,
                    startRowIndex: context.startRowIndex,
                    endRowIndex: headerEndRowIndex,
                    startColumnIndex: context.startColumnIndex,
                    endColumnIndex: context.endColumnIndex,
                },
                cell: {
                    userEnteredFormat: {
                        backgroundColor: palette.headerBackground,
                        textFormat: {
                            bold: true,
                            foregroundColor: palette.headerText,
                        },
                        horizontalAlignment: "CENTER",
                        wrapStrategy: "WRAP",
                    },
                },
                fields: "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,wrapStrategy)",
            },
        },
        {
            addBanding: {
                bandedRange: {
                    range: buildGridRange(context),
                    rowProperties: {
                        headerColor: palette.headerBackground,
                        firstBandColor: palette.zebraOdd,
                        secondBandColor: palette.zebraEven,
                    },
                },
            },
        },
        {
            updateBorders: {
                range: buildGridRange(context),
                top: { style: "SOLID", color: palette.border },
                bottom: { style: "SOLID", color: palette.border },
                left: { style: "SOLID", color: palette.border },
                right: { style: "SOLID", color: palette.border },
                innerHorizontal: { style: "SOLID", color: palette.border },
                innerVertical: { style: "SOLID", color: palette.border },
            },
        },
        {
            autoResizeDimensions: {
                dimensions: {
                    sheetId: context.sheetId,
                    dimension: "COLUMNS",
                    startIndex: context.startColumnIndex,
                    endIndex: context.endColumnIndex,
                },
            },
        },
    ];
    const response = await sheetsApi.spreadsheets.batchUpdate({
        spreadsheetId: params.spreadsheetId,
        requestBody: {
            requests,
        },
    });
    const addBandingReply = response.data.replies?.find((reply) => reply.addBanding)?.addBanding;
    return {
        spreadsheetId: params.spreadsheetId,
        normalizedRange: context.normalizedRange,
        sheetTitle: context.sheetTitle,
        theme,
        bandedRangeId: addBandingReply?.bandedRange?.bandedRangeId ?? null,
        requestsApplied: requests.length,
    };
}
export async function injectDataChart(params) {
    const sheetsApi = createSheetsApi();
    const dataContext = await resolveSheetGridContext(sheetsApi, params.spreadsheetId, params.dataRange);
    if (dataContext.endRowIndex - dataContext.startRowIndex < 2) {
        throw new Error("Chart dataRange must include at least one header row and one data row.");
    }
    if (dataContext.endColumnIndex - dataContext.startColumnIndex < 1) {
        throw new Error("Chart dataRange must include at least one column.");
    }
    if (params.chartType === "PIE" && dataContext.endColumnIndex - dataContext.startColumnIndex < 2) {
        throw new Error("PIE chart requires at least 2 columns (labels + values).");
    }
    const targetContext = await resolveSheetGridContext(sheetsApi, params.spreadsheetId, params.dataRange, params.targetSheetTitle ?? dataContext.sheetTitle);
    const autoAnchorColumn = targetContext.endColumnIndex + 1;
    const autoAnchorRow = targetContext.startRowIndex + 1;
    const anchor = params.anchorCell ? resolveA1CellReference(params.anchorCell) : { columnIndex: autoAnchorColumn, row: autoAnchorRow };
    const chartSpec = buildChartSpec(params.chartType, dataContext, params.chartTitle);
    const response = await sheetsApi.spreadsheets.batchUpdate({
        spreadsheetId: params.spreadsheetId,
        requestBody: {
            requests: [
                {
                    addChart: {
                        chart: {
                            spec: chartSpec,
                            position: {
                                overlayPosition: {
                                    anchorCell: {
                                        sheetId: targetContext.sheetId,
                                        rowIndex: anchor.row - 1,
                                        columnIndex: anchor.columnIndex,
                                    },
                                    offsetXPixels: 12,
                                    offsetYPixels: 12,
                                },
                            },
                        },
                    },
                },
            ],
        },
    });
    const addChartReply = response.data.replies?.[0]?.addChart?.chart;
    const anchorCell = `${columnIndexToLetters(anchor.columnIndex)}${anchor.row}`;
    return {
        spreadsheetId: params.spreadsheetId,
        normalizedDataRange: dataContext.normalizedRange,
        chartType: params.chartType,
        chartId: addChartReply?.chartId ?? null,
        targetSheetTitle: targetContext.sheetTitle,
        anchorCell,
        chartTitle: params.chartTitle?.trim() || null,
    };
}
export async function createDropdownFilter(params) {
    const sheetsApi = createSheetsApi();
    const dataContext = await resolveSheetGridContext(sheetsApi, params.spreadsheetId, params.dataRange);
    const dropdownContext = await resolveSheetGridContext(sheetsApi, params.spreadsheetId, params.dropdownRange);
    const protectSourceRange = params.protectSourceRange ?? true;
    const warningOnly = params.warningOnly ?? false;
    const strict = params.strict ?? true;
    const showCustomUi = params.showCustomUi ?? true;
    const requests = [
        {
            setDataValidation: {
                range: buildGridRange(dropdownContext),
                rule: {
                    condition: {
                        type: "ONE_OF_LIST",
                        values: params.dropdownValues.map((value) => ({ userEnteredValue: value })),
                    },
                    strict,
                    showCustomUi,
                },
            },
        },
        {
            setBasicFilter: {
                filter: {
                    range: buildGridRange(dataContext),
                },
            },
        },
    ];
    if (protectSourceRange) {
        requests.push({
            addProtectedRange: {
                protectedRange: {
                    range: buildGridRange(dataContext),
                    warningOnly,
                    requestingUserCanEdit: true,
                    description: `Protected by create_dropdown_filter (${new Date().toISOString()})`,
                },
            },
        });
    }
    const response = await sheetsApi.spreadsheets.batchUpdate({
        spreadsheetId: params.spreadsheetId,
        requestBody: {
            requests,
        },
    });
    const protectedRangeReply = response.data.replies?.find((reply) => reply.addProtectedRange)?.addProtectedRange;
    return {
        spreadsheetId: params.spreadsheetId,
        normalizedDataRange: dataContext.normalizedRange,
        normalizedDropdownRange: dropdownContext.normalizedRange,
        dropdownValues: params.dropdownValues,
        basicFilterApplied: true,
        protectedRangeId: protectedRangeReply?.protectedRange?.protectedRangeId ?? null,
    };
}
export async function observeSpreadsheetContext(params) {
    try {
        const normalizedRange = normalizeRangeForApi(params.range);
        const sheetsApi = createSheetsApi();
        const [metadataResponse, formattedResponse, formulaResponse] = await Promise.all([
            sheetsApi.spreadsheets.get({
                spreadsheetId: params.spreadsheetId,
                fields: "properties(locale),sheets(properties(sheetId,title,index,hidden,gridProperties(rowCount,columnCount)))",
            }),
            sheetsApi.spreadsheets.values.get({
                spreadsheetId: params.spreadsheetId,
                range: normalizedRange,
                valueRenderOption: "FORMATTED_VALUE",
                dateTimeRenderOption: "FORMATTED_STRING",
            }),
            sheetsApi.spreadsheets.values.get({
                spreadsheetId: params.spreadsheetId,
                range: normalizedRange,
                valueRenderOption: "FORMULA",
                dateTimeRenderOption: "FORMATTED_STRING",
            }),
        ]);
        const formattedValues = coerceMatrix(formattedResponse.data.values);
        const formulaValues = coerceMatrix(formulaResponse.data.values);
        const worksheets = (metadataResponse.data.sheets ?? []).map((sheet) => ({
            title: sheet.properties?.title ?? "",
            sheetId: sheet.properties?.sheetId ?? null,
            index: sheet.properties?.index ?? null,
            hidden: sheet.properties?.hidden ?? false,
            rowCount: sheet.properties?.gridProperties?.rowCount ?? null,
            columnCount: sheet.properties?.gridProperties?.columnCount ?? null,
        }));
        const dataBlocks = detectDataBlocks(formattedValues, normalizedRange);
        return {
            spreadsheetId: params.spreadsheetId,
            requestedRange: params.range,
            normalizedRange,
            worksheets,
            locale: inferLocaleSignals(formattedValues, formulaValues, metadataResponse.data.properties?.locale ?? undefined),
            dataBlocks,
            scanSummary: {
                returnedRows: formattedValues.length,
                returnedColumns: getMaxColumnCount(formattedValues),
                detectedBlockCount: dataBlocks.length,
            },
        };
    }
    catch (error) {
        throw new Error(`observe_spreadsheet_context failed: ${getErrorMessage(error)}`);
    }
}
const SHEET_ERROR_CODES = ["#N/A", "#VALUE!", "#REF!", "#DIV/0!", "#ERROR!", "#NAME?", "#NUM!", "#NULL!"];
function detectSheetErrorCode(value) {
    const normalized = stringifyCell(value).trim().toUpperCase();
    return SHEET_ERROR_CODES.find((code) => normalized.startsWith(code)) ?? null;
}
function extractFormulaFunctions(formula) {
    const matches = formula.toUpperCase().match(/[A-Z][A-Z0-9_.]*\s*\(/g) ?? [];
    return Array.from(new Set(matches.map((match) => match.replace(/\s*\($/, ""))));
}
export function diagnoseFormulaError(errorCode, formula) {
    const normalizedFormula = formula.trim();
    const upperFormula = normalizedFormula.toUpperCase();
    const functions = extractFormulaFunctions(normalizedFormula);
    if (!normalizedFormula.startsWith("=")) {
        return {
            probableCause: "O hien thi loi nhung API khong tra ve cong thuc goc trong o nay.",
            technicalDetails: "Gia tri co the la loi duoc paste san, text bat dau bang ma loi, hoac ket qua loi tu vung/phu thuoc khac.",
            suggestedFixes: [
                "Doc lai o lien quan voi valueRenderOption=FORMULA de xac dinh cong thuc nguon.",
                "Kiem tra cac o upstream ma o nay dang tham chieu neu day la gia tri trung gian.",
            ],
            confidence: "low",
        };
    }
    if (errorCode === "#N/A") {
        if (upperFormula.includes("VLOOKUP(")) {
            return {
                probableCause: "VLOOKUP khong tim thay khoa tra cuu trong cot dau tien cua vung lookup.",
                technicalDetails: "VLOOKUP chi tra theo chieu doc va yeu cau lookup key nam o cot dau tien cua bang tra. Neu bang du lieu trai theo chieu ngang, cong thuc nen dung HLOOKUP/XLOOKUP hoac doi lai vung lookup.",
                suggestedFixes: [
                    "Xac minh lookup_value co ton tai trong cot dau tien cua table_array.",
                    "Neu bang tra cuu nam ngang, thay VLOOKUP bang HLOOKUP hoac XLOOKUP.",
                    "Kiem tra tham so range_lookup; dung FALSE/0 cho khop chinh xac neu du lieu khong sap xep.",
                ],
                confidence: "high",
            };
        }
        if (upperFormula.includes("HLOOKUP(")) {
            return {
                probableCause: "HLOOKUP khong tim thay khoa tra cuu trong hang dau tien cua vung lookup.",
                technicalDetails: "HLOOKUP tra theo chieu ngang; neu khoa nam trong cot doc, cong thuc nen dung VLOOKUP/XLOOKUP.",
                suggestedFixes: [
                    "Xac minh lookup_value nam trong hang dau tien cua table_array.",
                    "Neu bang tra cuu nam doc, thay HLOOKUP bang VLOOKUP hoac XLOOKUP.",
                ],
                confidence: "high",
            };
        }
        if (upperFormula.includes("MATCH(") || upperFormula.includes("XMATCH(") || upperFormula.includes("XLOOKUP(")) {
            return {
                probableCause: "Ham lookup/match khong tim thay gia tri can khop.",
                technicalDetails: "Gia tri tra cuu co the khac kieu du lieu, du khoang trang, sai dinh dang ngay/so, hoac nam ngoai vung tra cuu.",
                suggestedFixes: [
                    "So sanh lookup_value voi vung lookup bang TRIM/TO_TEXT/VALUE khi nghi ngo sai kieu du lieu.",
                    "Kiem tra lai vung lookup co bao gom dong/cot chua khoa hay khong.",
                    "Dung IFNA chi sau khi da xac minh logic lookup dung.",
                ],
                confidence: "high",
            };
        }
        if (upperFormula.includes("FILTER(")) {
            return {
                probableCause: "FILTER khong tim thay dong nao thoa dieu kien.",
                technicalDetails: "Google Sheets tra #N/A khi FILTER khong co ket qua va khong co fallback.",
                suggestedFixes: [
                    "Kiem tra tung dieu kien FILTER co cung kich thuoc vung voi data range.",
                    "Bao cong thuc bang IFNA(FILTER(...), fallback) neu ket qua rong la hop le.",
                ],
                confidence: "high",
            };
        }
    }
    if (errorCode === "#VALUE!") {
        return {
            probableCause: "Cong thuc dang nhan sai kieu du lieu hoac cac vung mang khong cung kich thuoc.",
            technicalDetails: "Loi nay hay xay ra khi tinh toan tren text thay vi so/ngay, ghep array khac kich thuoc, hoac truyen tham so sai kieu cho ham.",
            suggestedFixes: [
                "Kiem tra cac o tham chieu co phai so/ngay that hay text duoc dinh dang giong so/ngay.",
                "Neu dung ARRAYFORMULA/FILTER/SUMIFS, dam bao cac range dieu kien co cung so dong/cot.",
                "Dung VALUE, DATEVALUE, TO_TEXT hoac TRIM de chuan hoa du lieu dau vao khi can.",
            ],
            confidence: functions.length > 0 ? "medium" : "low",
        };
    }
    if (errorCode === "#REF!") {
        return {
            probableCause: "Cong thuc tham chieu den o/vung khong hop le.",
            technicalDetails: "Thuong do sheet/range bi xoa, copy cong thuc lam lech tham chieu tuong doi, hoac chi so cot cua VLOOKUP vuot qua do rong table_array.",
            suggestedFixes: [
                "Kiem tra cac tham chieu sheet co dung ten va duoc quote khi ten sheet co khoang trang.",
                "Neu dung VLOOKUP, dam bao col_index_num khong lon hon so cot trong table_array.",
                "Dung tham chieu tuyet doi ($A$1:$D$100) khi copy cong thuc xuong nhieu dong.",
            ],
            confidence: "high",
        };
    }
    if (errorCode === "#DIV/0!") {
        return {
            probableCause: "Mau so bang 0 hoac rong.",
            technicalDetails: "Phep chia truc tiep, AVERAGE tren tap rong, hoac ty le voi mau so trong se sinh #DIV/0!.",
            suggestedFixes: [
                "Kiem tra mau so trong cong thuc tai dong bi loi.",
                "Dung IF(denominator=0, fallback, numerator/denominator) hoac IFERROR khi fallback da duoc xac dinh.",
            ],
            confidence: "high",
        };
    }
    if (errorCode === "#ERROR!") {
        return {
            probableCause: "Google Sheets khong parse duoc cong thuc.",
            technicalDetails: "Nguyen nhan hay gap la sai dau phan cach tham so theo locale (, vs ;), thieu dong ngoac/ngoac kep, hoac ten sheet co khoang trang chua duoc boc bang dau nhay don.",
            suggestedFixes: [
                "Doi dau phan cach tham so giua dau phay va cham phay theo locale cua spreadsheet.",
                "Dem lai ngoac mo/dong va dau nhay kep trong cong thuc.",
                "Quote ten sheet co khoang trang, vi du 'Data Tab'!A1:B10.",
            ],
            confidence: "high",
        };
    }
    if (errorCode === "#NAME?") {
        return {
            probableCause: "Sheets khong nhan dien duoc ten ham, named range, hoac chuoi text trong cong thuc.",
            technicalDetails: "Thuong do go sai ten ham, dung ham khong duoc ho tro, quen boc text bang dau nhay kep, hoac named range khong ton tai.",
            suggestedFixes: [
                "Kiem tra chinh ta ten ham va named range.",
                "Boc literal text bang dau nhay kep.",
                "Neu cong thuc duoc copy tu Excel, kiem tra ham do co ton tai trong Google Sheets hay khong.",
            ],
            confidence: "high",
        };
    }
    if (errorCode === "#NUM!") {
        return {
            probableCause: "Cong thuc tao ra gia tri so khong hop le hoac vuot gioi han tinh toan.",
            technicalDetails: "Co the do can bac hai so am, log so khong duong, lai suat/so ky khong hop le, hoac vong lap tinh toan khong hoi tu.",
            suggestedFixes: [
                "Kiem tra mien gia tri cua cac ham toan hoc/tai chinh.",
                "Them rang buoc IF de chan dau vao am/0 khi ham khong chap nhan.",
            ],
            confidence: "medium",
        };
    }
    return {
        probableCause: "Cong thuc co tham chieu giao nhau/range khong hop le.",
        technicalDetails: "#NULL! thuong lien quan den toan tu giao vung khong tao ra ket qua hop le.",
        suggestedFixes: ["Kiem tra cac toan tu range va dau phan cach range trong cong thuc."],
        confidence: "medium",
    };
}
function getRequestedCellCount(bounds, returnedRows, returnedColumns) {
    const requestedRows = bounds.endRow !== undefined ? Math.max(0, bounds.endRow - bounds.startRow + 1) : returnedRows;
    const requestedColumns = bounds.endColumnIndex !== undefined ? Math.max(0, bounds.endColumnIndex - bounds.startColumnIndex + 1) : returnedColumns;
    return requestedRows * requestedColumns;
}
export async function diagnoseSheetExecution(params) {
    try {
        const { normalizedRange, sheetTitle, gridRange } = parseSheetAndGridRange(params.range);
        const bounds = parseA1Bounds(gridRange);
        const sheetsApi = createSheetsApi();
        const [formattedResponse, formulaResponse] = await Promise.all([
            sheetsApi.spreadsheets.values.get({
                spreadsheetId: params.spreadsheetId,
                range: normalizedRange,
                valueRenderOption: "FORMATTED_VALUE",
                dateTimeRenderOption: "FORMATTED_STRING",
            }),
            sheetsApi.spreadsheets.values.get({
                spreadsheetId: params.spreadsheetId,
                range: normalizedRange,
                valueRenderOption: "FORMULA",
                dateTimeRenderOption: "FORMATTED_STRING",
            }),
        ]);
        const formattedValues = coerceMatrix(formattedResponse.data.values);
        const formulaValues = coerceMatrix(formulaResponse.data.values);
        const rowCount = Math.max(formattedValues.length, formulaValues.length);
        const columnCount = Math.max(getMaxColumnCount(formattedValues), getMaxColumnCount(formulaValues));
        const errors = [];
        const errorsByCode = {};
        for (let rowOffset = 0; rowOffset < rowCount; rowOffset += 1) {
            const formattedRow = formattedValues[rowOffset] ?? [];
            const formulaRow = formulaValues[rowOffset] ?? [];
            const currentColumnCount = Math.max(formattedRow.length, formulaRow.length, columnCount);
            for (let columnOffset = 0; columnOffset < currentColumnCount; columnOffset += 1) {
                const displayedValue = stringifyCell(formattedRow[columnOffset]);
                const errorCode = detectSheetErrorCode(displayedValue);
                if (!errorCode) {
                    continue;
                }
                const formula = stringifyCell(formulaRow[columnOffset]);
                const absoluteColumnIndex = bounds.startColumnIndex + columnOffset;
                const absoluteRow = bounds.startRow + rowOffset;
                errorsByCode[errorCode] = (errorsByCode[errorCode] ?? 0) + 1;
                errors.push({
                    cell: formatA1Cell(sheetTitle, absoluteColumnIndex, absoluteRow),
                    displayedError: errorCode,
                    displayedValue,
                    formula,
                    functions: extractFormulaFunctions(formula),
                    diagnosis: diagnoseFormulaError(errorCode, formula),
                });
            }
        }
        return {
            spreadsheetId: params.spreadsheetId,
            requestedRange: params.range,
            normalizedRange,
            summary: {
                status: errors.length === 0 ? "passed" : "failed",
                totalCellsScanned: getRequestedCellCount(bounds, rowCount, columnCount),
                errorCellCount: errors.length,
                errorsByCode,
            },
            errors,
        };
    }
    catch (error) {
        throw new Error(`diagnose_sheet_execution failed: ${getErrorMessage(error)}`);
    }
}
