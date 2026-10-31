import { CREATE_EMAIL_DRAFT_TOOL_DEFINITION, GET_EMAIL_TOOL_DEFINITION, LIST_GMAIL_HISTORY_TOOL_DEFINITION, MODIFY_EMAIL_LABELS_TOOL_DEFINITION, REPLY_EMAIL_TOOL_DEFINITION, SEARCH_EMAILS_TOOL_DEFINITION, SEND_EMAIL_TOOL_DEFINITION, START_GMAIL_WATCH_TOOL_DEFINITION, STOP_GMAIL_WATCH_TOOL_DEFINITION, } from "./definitions.js";
import { handleCreateEmailDraft, handleGetEmail, handleListGmailHistory, handleModifyEmailLabels, handleReplyEmail, handleSearchEmails, handleSendEmail, handleStartGmailWatch, handleStopGmailWatch, } from "./handlers.js";
export const GMAIL_TOOL_MODULES = [
    {
        owner: "google-gmail",
        authMode: "personal",
        definition: SEARCH_EMAILS_TOOL_DEFINITION,
        handler: handleSearchEmails,
    },
    {
        owner: "google-gmail",
        authMode: "personal",
        definition: GET_EMAIL_TOOL_DEFINITION,
        handler: handleGetEmail,
    },
    {
        owner: "google-gmail",
        authMode: "personal",
        definition: SEND_EMAIL_TOOL_DEFINITION,
        handler: handleSendEmail,
    },
    {
        owner: "google-gmail",
        authMode: "personal",
        definition: CREATE_EMAIL_DRAFT_TOOL_DEFINITION,
        handler: handleCreateEmailDraft,
    },
    {
        owner: "google-gmail",
        authMode: "personal",
        definition: REPLY_EMAIL_TOOL_DEFINITION,
        handler: handleReplyEmail,
    },
    {
        owner: "google-gmail",
        authMode: "personal",
        definition: MODIFY_EMAIL_LABELS_TOOL_DEFINITION,
        handler: handleModifyEmailLabels,
    },
    {
        owner: "google-gmail",
        authMode: "personal",
        definition: START_GMAIL_WATCH_TOOL_DEFINITION,
        handler: handleStartGmailWatch,
    },
    {
        owner: "google-gmail",
        authMode: "personal",
        definition: STOP_GMAIL_WATCH_TOOL_DEFINITION,
        handler: handleStopGmailWatch,
    },
    {
        owner: "google-gmail",
        authMode: "personal",
        definition: LIST_GMAIL_HISTORY_TOOL_DEFINITION,
        handler: handleListGmailHistory,
    },
];
