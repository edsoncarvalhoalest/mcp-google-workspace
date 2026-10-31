import type { CallToolResult, Tool } from "@modelcontextprotocol/sdk/types.js";
import type { ToolArgs } from "./types.js";
export declare const REGISTERED_TOOL_DEFINITIONS: Tool[];
export declare const REGISTERED_TOOL_NAMES: Set<string>;
export declare function routeToolCall(name: string, args: ToolArgs): Promise<CallToolResult>;
