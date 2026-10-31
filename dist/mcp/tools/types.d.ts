import type { CallToolResult, Tool } from "@modelcontextprotocol/sdk/types.js";
export type ToolArgs = Record<string, unknown> | undefined;
export type ToolHandler = (args: ToolArgs) => Promise<CallToolResult>;
export type AuthMode = "personal" | "none";
export type ToolModule = {
    owner: string;
    definition: Tool;
    handler: ToolHandler;
    authMode?: AuthMode;
};
