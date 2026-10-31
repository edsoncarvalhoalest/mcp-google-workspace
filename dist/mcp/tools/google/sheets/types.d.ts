export type SheetCellValue = string | number | boolean | null;
export type SheetValueRow = SheetCellValue[];
export type SheetValues = SheetValueRow[];
export interface CreateSpreadsheetParams {
    title: string;
}
export interface AddWorksheetParams {
    spreadsheetId: string;
    sheetTitle: string;
}
export interface ReadSheetDataParams {
    spreadsheetId: string;
    range: string;
    valueRenderOption?: "FORMATTED_VALUE" | "UNFORMATTED_VALUE" | "FORMULA";
}
export interface WriteSheetDataParams {
    spreadsheetId: string;
    range: string;
    values: SheetValues;
}
export interface AppendSheetDataParams {
    spreadsheetId: string;
    range: string;
    values: SheetValues;
}
export type SmartSheetTheme = "slate" | "forest" | "sunset";
export interface SmartSheetStylerParams {
    spreadsheetId: string;
    range: string;
    theme?: SmartSheetTheme;
}
export type NativeChartType = "BAR" | "LINE" | "PIE";
export interface InjectDataChartParams {
    spreadsheetId: string;
    dataRange: string;
    chartType: NativeChartType;
    chartTitle?: string;
    anchorCell?: string;
    targetSheetTitle?: string;
}
export interface CreateDropdownFilterParams {
    spreadsheetId: string;
    dataRange: string;
    dropdownRange: string;
    dropdownValues: string[];
    strict?: boolean;
    showCustomUi?: boolean;
    protectSourceRange?: boolean;
    warningOnly?: boolean;
}
export interface ObserveSpreadsheetContextParams {
    spreadsheetId: string;
    range: string;
}
export interface DiagnoseSheetExecutionParams {
    spreadsheetId: string;
    range: string;
}
