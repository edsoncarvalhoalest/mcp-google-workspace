export const CREATE_SPREADSHEET_TOOL_DEFINITION = {
    name: "create_spreadsheet",
    description: "Create a new Google Spreadsheet and return its id/url.",
    inputSchema: {
        type: "object",
        properties: {
            title: {
                type: "string",
                description: "Spreadsheet file title.",
            },
        },
        required: ["title"],
    },
};
export const ADD_WORKSHEET_TOOL_DEFINITION = {
    name: "add_worksheet",
    description: "Ensure a worksheet tab exists in an existing spreadsheet. If the tab is missing, create it; if it already exists, return the existing sheet metadata.",
    inputSchema: {
        type: "object",
        properties: {
            spreadsheetId: {
                type: "string",
                description: "Target spreadsheet id.",
            },
            sheetTitle: {
                type: "string",
                description: "Worksheet/tab title to create or verify.",
            },
        },
        required: ["spreadsheetId", "sheetTitle"],
    },
};
export const READ_SHEET_DATA_TOOL_DEFINITION = {
    name: "read_sheet_data",
    description: "Read data by A1 notation range. Supports cross-sheet ranges like 'Data Tab'!A1:D10 or 'Report'!C2. Use valueRenderOption=FORMULA when verifying formulas.",
    inputSchema: {
        type: "object",
        properties: {
            spreadsheetId: {
                type: "string",
                description: "Target spreadsheet id.",
            },
            range: {
                type: "string",
                description: "A1 notation range, supports cross-sheet references.",
            },
            valueRenderOption: {
                type: "string",
                description: "FORMATTED_VALUE | UNFORMATTED_VALUE | FORMULA. Default UNFORMATTED_VALUE.",
            },
        },
        required: ["spreadsheetId", "range"],
    },
};
export const WRITE_SHEET_DATA_TOOL_DEFINITION = {
    name: "write_sheet_data",
    description: "Write/overwrite values to a range by A1 notation (cross-sheet supported). Uses USER_ENTERED. Formulas must be passed as strings starting with '='.",
    inputSchema: {
        type: "object",
        properties: {
            spreadsheetId: {
                type: "string",
                description: "Target spreadsheet id.",
            },
            range: {
                type: "string",
                description: "A1 notation range, supports cross-sheet references.",
            },
            values: {
                type: "array",
                description: "2D array values. Cells can be string/number/boolean/null; formulas start with '='.",
                items: {
                    type: "array",
                    items: {
                        anyOf: [{ type: "string" }, { type: "number" }, { type: "boolean" }, { type: "null" }],
                    },
                },
            },
        },
        required: ["spreadsheetId", "range", "values"],
    },
};
export const APPEND_SHEET_DATA_TOOL_DEFINITION = {
    name: "append_sheet_data",
    description: "Append rows into a sheet range (often only tab name). Uses USER_ENTERED and keeps existing data intact.",
    inputSchema: {
        type: "object",
        properties: {
            spreadsheetId: {
                type: "string",
                description: "Target spreadsheet id.",
            },
            range: {
                type: "string",
                description: "A1 notation range (e.g. 'Logs' or 'Logs'!A:C), supports cross-sheet references.",
            },
            values: {
                type: "array",
                description: "2D array values. Cells can be string/number/boolean/null; formulas start with '='.",
                items: {
                    type: "array",
                    items: {
                        anyOf: [{ type: "string" }, { type: "number" }, { type: "boolean" }, { type: "null" }],
                    },
                },
            },
        },
        required: ["spreadsheetId", "range", "values"],
    },
};
export const SMART_SHEET_STYLER_TOOL_DEFINITION = {
    name: "smart_sheet_styler",
    description: "Apply a built-in formatting theme to a table range: bold header, zebra striping, outer/inner borders, and auto-resize columns.",
    inputSchema: {
        type: "object",
        properties: {
            spreadsheetId: {
                type: "string",
                description: "Target spreadsheet id.",
            },
            range: {
                type: "string",
                description: "A1 range of the target table (header must be the first row).",
            },
            theme: {
                type: "string",
                enum: ["slate", "forest", "sunset"],
                description: "Optional style preset. Default: slate.",
            },
        },
        required: ["spreadsheetId", "range"],
    },
};
export const INJECT_DATA_CHART_TOOL_DEFINITION = {
    name: "inject_data_chart",
    description: "Create an embedded chart from a data range using AddChartRequest. Supports BAR, LINE, and PIE chart types.",
    inputSchema: {
        type: "object",
        properties: {
            spreadsheetId: {
                type: "string",
                description: "Target spreadsheet id.",
            },
            dataRange: {
                type: "string",
                description: "A1 range containing chart headers + data, e.g. 'Report'!A1:C20.",
            },
            chartType: {
                type: "string",
                enum: ["BAR", "LINE", "PIE"],
                description: "Chart type to render.",
            },
            chartTitle: {
                type: "string",
                description: "Optional chart title.",
            },
            anchorCell: {
                type: "string",
                description: "Optional anchor cell (A1) where chart should be placed. Default auto anchor.",
            },
            targetSheetTitle: {
                type: "string",
                description: "Optional target sheet title to place chart. Default same sheet as dataRange.",
            },
        },
        required: ["spreadsheetId", "dataRange", "chartType"],
    },
};
export const CREATE_DROPDOWN_FILTER_TOOL_DEFINITION = {
    name: "create_dropdown_filter",
    description: "Apply dropdown data validation on a range, enable quick filter on a data table, and optionally protect source range.",
    inputSchema: {
        type: "object",
        properties: {
            spreadsheetId: {
                type: "string",
                description: "Target spreadsheet id.",
            },
            dataRange: {
                type: "string",
                description: "A1 range where SetBasicFilter and protection are applied.",
            },
            dropdownRange: {
                type: "string",
                description: "A1 range that receives dropdown data validation rule.",
            },
            dropdownValues: {
                type: "array",
                description: "Allowed dropdown values.",
                items: {
                    type: "string",
                },
            },
            strict: {
                type: "boolean",
                description: "If true, invalid values are rejected. Default true.",
            },
            showCustomUi: {
                type: "boolean",
                description: "If true, show dropdown UI in cells. Default true.",
            },
            protectSourceRange: {
                type: "boolean",
                description: "If true, lock source dataRange with protected range. Default true.",
            },
            warningOnly: {
                type: "boolean",
                description: "When protecting range, show warning instead of strict lock. Default false.",
            },
        },
        required: ["spreadsheetId", "dataRange", "dropdownRange", "dropdownValues"],
    },
};
export const OBSERVE_SPREADSHEET_CONTEXT_TOOL_DEFINITION = {
    name: "observe_spreadsheet_context",
    description: "Quét toàn bộ cấu trúc file Sheets hiện tại để trả về Bản đồ Ngữ nghĩa (Semantic Map). Giúp Agent biết chính xác tọa độ các khối dữ liệu, tiêu đề cột (Headers), định dạng Locale, và các tab đang có để tránh bị mù không gian.",
    inputSchema: {
        type: "object",
        properties: {
            spreadsheetId: {
                type: "string",
                description: "Target spreadsheet id.",
            },
            range: {
                type: "string",
                description: "A1 notation scan range, e.g. 'Sheet1!A1:Z50'.",
            },
        },
        required: ["spreadsheetId", "range"],
    },
};
export const DIAGNOSE_SHEET_EXECUTION_TOOL_DEFINITION = {
    name: "diagnose_sheet_execution",
    description: "Trọng tài kiểm tra lỗi công thức thực tế trên Sheet sau khi ghi. Quét vùng chỉ định để tìm kiếm các lỗi hiển thị hiển nhiên như #N/A, #VALUE!, #REF!, #DIV/0!, #ERROR! và trả về nguyên nhân kỹ thuật chi tiết để Agent tự sửa sai.",
    inputSchema: {
        type: "object",
        properties: {
            spreadsheetId: {
                type: "string",
                description: "Target spreadsheet id.",
            },
            range: {
                type: "string",
                description: "A1 notation range to inspect, e.g. 'Sheet1!C24:C37'.",
            },
        },
        required: ["spreadsheetId", "range"],
    },
};
