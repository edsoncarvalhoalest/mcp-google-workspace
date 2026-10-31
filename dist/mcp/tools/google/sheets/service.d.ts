import type { CreateDropdownFilterParams, DiagnoseSheetExecutionParams, InjectDataChartParams, NativeChartType, ObserveSpreadsheetContextParams, SheetValues, SmartSheetStylerParams, SmartSheetTheme } from "./types.js";
export declare function normalizeRangeForApi(range: string): string;
export declare function columnIndexToLetters(columnIndex: number): string;
type HeaderCell = {
    column: string;
    cell: string;
    value: string;
};
type DataBlock = {
    blockId: number;
    sheetTitle?: string;
    range: string;
    startRow: number;
    endRow: number;
    startColumn: string;
    endColumn: string;
    rowCount: number;
    columnCount: number;
    nonEmptyCellCount: number;
    headers: HeaderCell[];
    dataRowCount: number;
    sampleRows: string[][];
};
export declare function detectDataBlocks(values: unknown[][], range: string): DataBlock[];
export declare function inferFormulaArgumentSeparatorFromLocale(locale: string | undefined): "," | ";";
type LocaleSignals = {
    spreadsheetLocale: string | null;
    inferredDecimalSeparator: "," | "." | null;
    inferredFormulaArgumentSeparator: "," | ";";
    confidence: "metadata" | "data" | "formula" | "low";
    evidence: {
        commaDecimalCount: number;
        dotDecimalCount: number;
        commaFormulaSeparatorCount: number;
        semicolonFormulaSeparatorCount: number;
    };
};
export declare function inferLocaleSignals(formattedValues: unknown[][], formulaValues: unknown[][], spreadsheetLocale?: string): LocaleSignals;
export declare function createSpreadsheet(title: string): Promise<{
    spreadsheetId: string;
    spreadsheetUrl: string;
    title: string;
}>;
export declare function addWorksheet(spreadsheetId: string, sheetTitle: string): Promise<{
    spreadsheetId: string;
    sheetId: number | null;
    sheetTitle: string;
    index: number | null;
    created: boolean;
}>;
export declare function readSheetData(spreadsheetId: string, range: string, valueRenderOption?: "FORMATTED_VALUE" | "UNFORMATTED_VALUE" | "FORMULA"): Promise<{
    spreadsheetId: string;
    range: string;
    values: unknown[][];
}>;
export declare function writeSheetData(spreadsheetId: string, range: string, values: SheetValues): Promise<{
    spreadsheetId: string;
    range: string;
    updatedRows: number;
    updatedColumns: number;
}>;
export declare function appendSheetData(spreadsheetId: string, range: string, values: SheetValues): Promise<{
    spreadsheetId: string;
    range: string;
    updatedRange: string;
    appendedRows: number;
}>;
export declare function smartSheetStyler(params: SmartSheetStylerParams): Promise<{
    spreadsheetId: string;
    normalizedRange: string;
    sheetTitle: string;
    theme: SmartSheetTheme;
    bandedRangeId: number | null;
    requestsApplied: number;
}>;
export declare function injectDataChart(params: InjectDataChartParams): Promise<{
    spreadsheetId: string;
    normalizedDataRange: string;
    chartType: NativeChartType;
    chartId: number | null;
    targetSheetTitle: string;
    anchorCell: string;
    chartTitle: string | null;
}>;
export declare function createDropdownFilter(params: CreateDropdownFilterParams): Promise<{
    spreadsheetId: string;
    normalizedDataRange: string;
    normalizedDropdownRange: string;
    dropdownValues: string[];
    basicFilterApplied: boolean;
    protectedRangeId: number | null;
}>;
type WorksheetSummary = {
    title: string;
    sheetId: number | null;
    index: number | null;
    hidden: boolean;
    rowCount: number | null;
    columnCount: number | null;
};
export declare function observeSpreadsheetContext(params: ObserveSpreadsheetContextParams): Promise<{
    spreadsheetId: string;
    requestedRange: string;
    normalizedRange: string;
    worksheets: WorksheetSummary[];
    locale: LocaleSignals;
    dataBlocks: DataBlock[];
    scanSummary: {
        returnedRows: number;
        returnedColumns: number;
        detectedBlockCount: number;
    };
}>;
declare const SHEET_ERROR_CODES: readonly ["#N/A", "#VALUE!", "#REF!", "#DIV/0!", "#ERROR!", "#NAME?", "#NUM!", "#NULL!"];
type SheetErrorCode = (typeof SHEET_ERROR_CODES)[number];
type FormulaDiagnosis = {
    probableCause: string;
    technicalDetails: string;
    suggestedFixes: string[];
    confidence: "high" | "medium" | "low";
};
export declare function diagnoseFormulaError(errorCode: SheetErrorCode, formula: string): FormulaDiagnosis;
type DiagnosedCell = {
    cell: string;
    displayedError: SheetErrorCode;
    displayedValue: string;
    formula: string;
    functions: string[];
    diagnosis: FormulaDiagnosis;
};
export declare function diagnoseSheetExecution(params: DiagnoseSheetExecutionParams): Promise<{
    spreadsheetId: string;
    requestedRange: string;
    normalizedRange: string;
    summary: {
        status: "passed" | "failed";
        totalCellsScanned: number;
        errorCellCount: number;
        errorsByCode: Partial<Record<SheetErrorCode, number>>;
    };
    errors: DiagnosedCell[];
}>;
export {};
