import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ToolArgs } from "../../types.js";
export declare function handleGoogleAuthStatus(args: ToolArgs): Promise<CallToolResult>;
export declare function handleStartGoogleAuth(args: ToolArgs): Promise<CallToolResult>;
export declare function handleCompleteGoogleAuth(args: ToolArgs): Promise<CallToolResult>;
