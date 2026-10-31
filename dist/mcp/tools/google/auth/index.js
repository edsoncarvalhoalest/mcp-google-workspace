import { COMPLETE_GOOGLE_AUTH_TOOL_DEFINITION, GOOGLE_AUTH_STATUS_TOOL_DEFINITION, START_GOOGLE_AUTH_TOOL_DEFINITION, } from "./definitions.js";
import { handleCompleteGoogleAuth, handleGoogleAuthStatus, handleStartGoogleAuth } from "./handlers.js";
export const AUTH_TOOL_MODULES = [
    {
        owner: "google-auth",
        authMode: "none",
        definition: GOOGLE_AUTH_STATUS_TOOL_DEFINITION,
        handler: handleGoogleAuthStatus,
    },
    {
        owner: "google-auth",
        authMode: "none",
        definition: START_GOOGLE_AUTH_TOOL_DEFINITION,
        handler: handleStartGoogleAuth,
    },
    {
        owner: "google-auth",
        authMode: "none",
        definition: COMPLETE_GOOGLE_AUTH_TOOL_DEFINITION,
        handler: handleCompleteGoogleAuth,
    },
];
