import { ensurePersonalAuth, forcePersonalReauth } from "../../auth/personalAuth.js";
import { AUTH_TOOL_MODULES } from "./google/auth/index.js";
import { CALENDAR_TOOL_MODULES } from "./google/calendar/index.js";
import { CHAT_TOOL_MODULES } from "./google/chat/index.js";
import { DRIVE_TOOL_MODULES } from "./google/drive/index.js";
import { GMAIL_TOOL_MODULES } from "./google/gmail/index.js";
import { SHEETS_TOOL_MODULES } from "./google/sheets/index.js";
import { errorResult, extractText } from "./result.js";
const AUTH_ERROR_MARKERS = [
    "401",
    "unauthorized",
    "unauthenticated",
    "invalid_grant",
    "invalid_token",
    "token has been expired or revoked",
    "invalid credentials",
    "request had invalid authentication credentials",
    "insufficient authentication scopes",
];
function isAuthErrorText(text) {
    const normalized = text.toLowerCase();
    return AUTH_ERROR_MARKERS.some((marker) => normalized.includes(marker));
}
const ALL_TOOL_MODULES = [
    ...AUTH_TOOL_MODULES,
    ...DRIVE_TOOL_MODULES,
    ...SHEETS_TOOL_MODULES,
    ...GMAIL_TOOL_MODULES,
    ...CALENDAR_TOOL_MODULES,
    ...CHAT_TOOL_MODULES,
];
const TOOL_MODULE_MAP = new Map();
for (const toolModule of ALL_TOOL_MODULES) {
    const existing = TOOL_MODULE_MAP.get(toolModule.definition.name);
    if (existing) {
        throw new Error(`Duplicate tool name '${toolModule.definition.name}' between '${existing.owner}' and '${toolModule.owner}'.`);
    }
    TOOL_MODULE_MAP.set(toolModule.definition.name, toolModule);
}
export const REGISTERED_TOOL_DEFINITIONS = ALL_TOOL_MODULES.map((toolModule) => toolModule.definition);
export const REGISTERED_TOOL_NAMES = new Set(TOOL_MODULE_MAP.keys());
async function executeToolModule(toolModule, args) {
    const authMode = toolModule.authMode ?? "personal";
    if (authMode === "none") {
        return toolModule.handler(args);
    }
    await ensurePersonalAuth();
    let result = await toolModule.handler(args);
    if (result.isError && isAuthErrorText(extractText(result))) {
        await forcePersonalReauth();
        result = await toolModule.handler(args);
    }
    return result;
}
export async function routeToolCall(name, args) {
    try {
        const toolModule = TOOL_MODULE_MAP.get(name);
        if (!toolModule) {
            return errorResult(`Tool '${name}' is not supported by this local MCP server.`);
        }
        // Await so auth failures (e.g. AuthRequiredError with the sign-in URL)
        // become a tool error result instead of a rejected request.
        return await executeToolModule(toolModule, args);
    }
    catch (error) {
        return errorResult(error);
    }
}
