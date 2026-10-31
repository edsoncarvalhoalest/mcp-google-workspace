import { errorResult, jsonResult, textResult } from "../../result.js";
import { parseAddWorksheetParams, parseAppendSheetDataParams, parseCreateDropdownFilterParams, parseCreateSpreadsheetParams, parseDiagnoseSheetExecutionParams, parseInjectDataChartParams, parseObserveSpreadsheetContextParams, parseReadSheetDataParams, parseSmartSheetStylerParams, parseWriteSheetDataParams, } from "./params.js";
import { addWorksheet, appendSheetData, createDropdownFilter, createSpreadsheet, diagnoseSheetExecution, injectDataChart, observeSpreadsheetContext, readSheetData, smartSheetStyler, writeSheetData, } from "./service.js";
export async function handleCreateSpreadsheet(args) {
    try {
        const { title } = parseCreateSpreadsheetParams(args);
        const payload = await createSpreadsheet(title);
        return jsonResult(payload);
    }
    catch (error) {
        return errorResult(error);
    }
}
export async function handleAddWorksheet(args) {
    try {
        const { spreadsheetId, sheetTitle } = parseAddWorksheetParams(args);
        const payload = await addWorksheet(spreadsheetId, sheetTitle);
        return jsonResult(payload);
    }
    catch (error) {
        return errorResult(error);
    }
}
export async function handleReadSheetData(args) {
    try {
        const { spreadsheetId, range, valueRenderOption } = parseReadSheetDataParams(args);
        const payload = await readSheetData(spreadsheetId, range, valueRenderOption);
        return jsonResult(payload);
    }
    catch (error) {
        return errorResult(error);
    }
}
export async function handleWriteSheetData(args) {
    try {
        const { spreadsheetId, range, values } = parseWriteSheetDataParams(args);
        const payload = await writeSheetData(spreadsheetId, range, values);
        return jsonResult(payload);
    }
    catch (error) {
        return errorResult(error);
    }
}
export async function handleAppendSheetData(args) {
    try {
        const { spreadsheetId, range, values } = parseAppendSheetDataParams(args);
        const payload = await appendSheetData(spreadsheetId, range, values);
        return jsonResult(payload);
    }
    catch (error) {
        return errorResult(error);
    }
}
export async function handleSmartSheetStyler(args) {
    try {
        const payload = await smartSheetStyler(parseSmartSheetStylerParams(args));
        return jsonResult(payload);
    }
    catch (error) {
        return errorResult(error);
    }
}
export async function handleInjectDataChart(args) {
    try {
        const payload = await injectDataChart(parseInjectDataChartParams(args));
        return jsonResult(payload);
    }
    catch (error) {
        return errorResult(error);
    }
}
export async function handleCreateDropdownFilter(args) {
    try {
        const payload = await createDropdownFilter(parseCreateDropdownFilterParams(args));
        return jsonResult(payload);
    }
    catch (error) {
        return errorResult(error);
    }
}
export async function handleObserveSpreadsheetContext(args) {
    try {
        const payload = await observeSpreadsheetContext(parseObserveSpreadsheetContextParams(args));
        return textResult(JSON.stringify(payload));
    }
    catch (error) {
        return errorResult(error);
    }
}
export async function handleDiagnoseSheetExecution(args) {
    try {
        const payload = await diagnoseSheetExecution(parseDiagnoseSheetExecutionParams(args));
        return textResult(JSON.stringify(payload));
    }
    catch (error) {
        return errorResult(error);
    }
}
export const SHEETS_TOOL_HANDLERS = {
    create_spreadsheet: handleCreateSpreadsheet,
    add_worksheet: handleAddWorksheet,
    read_sheet_data: handleReadSheetData,
    write_sheet_data: handleWriteSheetData,
    append_sheet_data: handleAppendSheetData,
    smart_sheet_styler: handleSmartSheetStyler,
    inject_data_chart: handleInjectDataChart,
    create_dropdown_filter: handleCreateDropdownFilter,
    observe_spreadsheet_context: handleObserveSpreadsheetContext,
    diagnose_sheet_execution: handleDiagnoseSheetExecution,
};
