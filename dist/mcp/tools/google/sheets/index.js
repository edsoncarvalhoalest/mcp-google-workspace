import { ADD_WORKSHEET_TOOL_DEFINITION, APPEND_SHEET_DATA_TOOL_DEFINITION, CREATE_DROPDOWN_FILTER_TOOL_DEFINITION, CREATE_SPREADSHEET_TOOL_DEFINITION, DIAGNOSE_SHEET_EXECUTION_TOOL_DEFINITION, INJECT_DATA_CHART_TOOL_DEFINITION, OBSERVE_SPREADSHEET_CONTEXT_TOOL_DEFINITION, READ_SHEET_DATA_TOOL_DEFINITION, SMART_SHEET_STYLER_TOOL_DEFINITION, WRITE_SHEET_DATA_TOOL_DEFINITION, } from "./definitions.js";
import { handleAddWorksheet, handleAppendSheetData, handleCreateDropdownFilter, handleCreateSpreadsheet, handleDiagnoseSheetExecution, handleInjectDataChart, handleObserveSpreadsheetContext, handleReadSheetData, handleSmartSheetStyler, handleWriteSheetData, } from "./handlers.js";
export const SHEETS_TOOL_MODULES = [
    {
        owner: "google-sheets",
        authMode: "personal",
        definition: CREATE_SPREADSHEET_TOOL_DEFINITION,
        handler: handleCreateSpreadsheet,
    },
    {
        owner: "google-sheets",
        authMode: "personal",
        definition: ADD_WORKSHEET_TOOL_DEFINITION,
        handler: handleAddWorksheet,
    },
    {
        owner: "google-sheets",
        authMode: "personal",
        definition: READ_SHEET_DATA_TOOL_DEFINITION,
        handler: handleReadSheetData,
    },
    {
        owner: "google-sheets",
        authMode: "personal",
        definition: WRITE_SHEET_DATA_TOOL_DEFINITION,
        handler: handleWriteSheetData,
    },
    {
        owner: "google-sheets",
        authMode: "personal",
        definition: APPEND_SHEET_DATA_TOOL_DEFINITION,
        handler: handleAppendSheetData,
    },
    {
        owner: "google-sheets",
        authMode: "personal",
        definition: SMART_SHEET_STYLER_TOOL_DEFINITION,
        handler: handleSmartSheetStyler,
    },
    {
        owner: "google-sheets",
        authMode: "personal",
        definition: INJECT_DATA_CHART_TOOL_DEFINITION,
        handler: handleInjectDataChart,
    },
    {
        owner: "google-sheets",
        authMode: "personal",
        definition: CREATE_DROPDOWN_FILTER_TOOL_DEFINITION,
        handler: handleCreateDropdownFilter,
    },
    {
        owner: "google-sheets",
        authMode: "personal",
        definition: OBSERVE_SPREADSHEET_CONTEXT_TOOL_DEFINITION,
        handler: handleObserveSpreadsheetContext,
    },
    {
        owner: "google-sheets",
        authMode: "personal",
        definition: DIAGNOSE_SHEET_EXECUTION_TOOL_DEFINITION,
        handler: handleDiagnoseSheetExecution,
    },
];
