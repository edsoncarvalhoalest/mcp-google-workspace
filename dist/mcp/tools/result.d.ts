import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
export declare function textResult(text: string): CallToolResult;
export declare function jsonResult(payload: unknown): CallToolResult;
export declare function errorResult(error: unknown): CallToolResult;
export declare function extractText(result: CallToolResult): string;
