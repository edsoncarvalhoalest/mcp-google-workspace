export const GOOGLE_AUTH_STATUS_TOOL_DEFINITION = {
    name: "google_auth_status",
    description: "Show the Google sign-in state of this MCP server: whether a token is stored, the account (user key/email), granted and missing OAuth scopes, and the pending sign-in URL if a login is in progress. Does not call Google APIs.",
    inputSchema: {
        type: "object",
        properties: {},
    },
};
export const START_GOOGLE_AUTH_TOOL_DEFINITION = {
    name: "start_google_auth",
    description: "Start (or reuse) the Google sign-in flow and return the authorization URL immediately. Open the URL in a browser and approve access; if the browser ends on an unreachable localhost page, pass that full URL to complete_google_auth.",
    inputSchema: {
        type: "object",
        properties: {
            force: {
                type: "boolean",
                description: "Discard any pending sign-in and generate a new authorization URL.",
                default: false,
            },
        },
    },
};
export const COMPLETE_GOOGLE_AUTH_TOOL_DEFINITION = {
    name: "complete_google_auth",
    description: "Finish Google sign-in by providing the full URL the browser was redirected to after approving access (http://localhost:.../oauth2callback?code=...), or only the authorization code. Saves the tokens for future tool calls.",
    inputSchema: {
        type: "object",
        properties: {
            redirectUrl: {
                type: "string",
                description: "Full redirected URL copied from the browser address bar (contains code and state).",
            },
            code: {
                type: "string",
                description: "Authorization code, if only the code is available.",
            },
        },
    },
};
