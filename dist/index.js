import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { REGISTERED_TOOL_DEFINITIONS, REGISTERED_TOOL_NAMES, routeToolCall } from "./mcp/tools/registry.js";
import { errorResult } from "./mcp/tools/result.js";
export async function startMcpServer() {
    const server = new Server({ name: "mcp-google-workspace", version: "1.0.0" }, { capabilities: { tools: {} } });
    server.setRequestHandler(ListToolsRequestSchema, async () => {
        return { tools: REGISTERED_TOOL_DEFINITIONS };
    });
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
        const { name, arguments: args } = request.params;
        if (!REGISTERED_TOOL_NAMES.has(name)) {
            return errorResult(`Tool '${name}' is not supported by this MCP server.`);
        }
        return routeToolCall(name, args);
    });
    const transport = new StdioServerTransport();
    await server.connect(transport);
}
const currentFilePath = fileURLToPath(import.meta.url);
const executedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (currentFilePath === executedPath) {
    await startMcpServer();
}
