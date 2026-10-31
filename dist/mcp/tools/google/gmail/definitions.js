const MESSAGE_ID_PROPERTY = {
    type: "string",
    description: "Gmail message ID.",
};
const EMAIL_ADDRESS_LIST_PROPERTY = {
    type: "array",
    items: { type: "string" },
    description: "Email addresses.",
};
const OPTIONAL_EMAIL_ADDRESS_LIST_PROPERTIES = {
    cc: EMAIL_ADDRESS_LIST_PROPERTY,
    bcc: EMAIL_ADDRESS_LIST_PROPERTY,
};
const EMAIL_BODY_PROPERTIES = {
    subject: {
        type: "string",
        description: "Email subject.",
    },
    body: {
        type: "string",
        description: "Plain text email body.",
    },
    html: {
        type: "string",
        description: "Optional HTML body. If provided, the message is sent as multipart/alternative.",
    },
};
export const SEARCH_EMAILS_TOOL_DEFINITION = {
    name: "search_emails",
    description: "Search Gmail messages and return subject, snippet, sender, and date.",
    inputSchema: {
        type: "object",
        properties: {
            query: {
                type: "string",
                description: "Gmail query syntax, e.g. 'is:unread', 'from:boss'.",
            },
            limit: {
                type: "number",
                description: "Maximum number of email messages to return.",
                default: 5,
            },
        },
        required: ["query"],
    },
};
export const GET_EMAIL_TOOL_DEFINITION = {
    name: "get_email",
    description: "Get one Gmail message with headers, labels, snippet, and decoded plain/html body when available.",
    inputSchema: {
        type: "object",
        properties: {
            messageId: MESSAGE_ID_PROPERTY,
        },
        required: ["messageId"],
    },
};
export const SEND_EMAIL_TOOL_DEFINITION = {
    name: "send_email",
    description: "Send a new email from the authenticated Gmail account.",
    inputSchema: {
        type: "object",
        properties: {
            to: EMAIL_ADDRESS_LIST_PROPERTY,
            ...OPTIONAL_EMAIL_ADDRESS_LIST_PROPERTIES,
            ...EMAIL_BODY_PROPERTIES,
        },
        required: ["to", "subject", "body"],
    },
};
export const CREATE_EMAIL_DRAFT_TOOL_DEFINITION = {
    name: "create_email_draft",
    description: "Create a Gmail draft for review before sending.",
    inputSchema: {
        type: "object",
        properties: {
            to: EMAIL_ADDRESS_LIST_PROPERTY,
            ...OPTIONAL_EMAIL_ADDRESS_LIST_PROPERTIES,
            ...EMAIL_BODY_PROPERTIES,
        },
        required: ["to", "subject", "body"],
    },
};
export const REPLY_EMAIL_TOOL_DEFINITION = {
    name: "reply_email",
    description: "Reply to an existing Gmail message in the same thread.",
    inputSchema: {
        type: "object",
        properties: {
            messageId: MESSAGE_ID_PROPERTY,
            body: {
                type: "string",
                description: "Plain text reply body.",
            },
            html: {
                type: "string",
                description: "Optional HTML reply body.",
            },
            replyAll: {
                type: "boolean",
                description: "Reply to all original recipients when true. Default: false.",
            },
        },
        required: ["messageId", "body"],
    },
};
export const MODIFY_EMAIL_LABELS_TOOL_DEFINITION = {
    name: "modify_email_labels",
    description: "Add and/or remove Gmail label IDs from a message, e.g. remove UNREAD or add STARRED.",
    inputSchema: {
        type: "object",
        properties: {
            messageId: MESSAGE_ID_PROPERTY,
            addLabelIds: {
                type: "array",
                items: { type: "string" },
                description: "Label IDs to add.",
            },
            removeLabelIds: {
                type: "array",
                items: { type: "string" },
                description: "Label IDs to remove.",
            },
        },
        required: ["messageId"],
    },
};
export const START_GMAIL_WATCH_TOOL_DEFINITION = {
    name: "start_gmail_watch",
    description: "Start Gmail push notifications through a Google Cloud Pub/Sub topic. The topic must allow gmail-api-push@system.gserviceaccount.com to publish.",
    inputSchema: {
        type: "object",
        properties: {
            topicName: {
                type: "string",
                description: "Full Pub/Sub topic name, e.g. projects/my-project/topics/gmail-watch.",
            },
            labelIds: {
                type: "array",
                items: { type: "string" },
                description: "Optional Gmail label IDs to watch, e.g. INBOX, UNREAD.",
            },
            labelFilterAction: {
                type: "string",
                enum: ["include", "exclude"],
                description: "How labelIds should be applied. Default: include.",
            },
        },
        required: ["topicName"],
    },
};
export const STOP_GMAIL_WATCH_TOOL_DEFINITION = {
    name: "stop_gmail_watch",
    description: "Stop Gmail push notifications for the authenticated account.",
    inputSchema: {
        type: "object",
        properties: {},
    },
};
export const LIST_GMAIL_HISTORY_TOOL_DEFINITION = {
    name: "list_gmail_history",
    description: "List Gmail changes since a historyId, useful after a Pub/Sub webhook notification arrives.",
    inputSchema: {
        type: "object",
        properties: {
            startHistoryId: {
                type: "string",
                description: "History ID returned by start_gmail_watch or a webhook notification.",
            },
            historyTypes: {
                type: "array",
                items: {
                    type: "string",
                    enum: ["messageAdded", "messageDeleted", "labelAdded", "labelRemoved"],
                },
                description: "Optional Gmail history event types to return.",
            },
            limit: {
                type: "number",
                description: "Maximum history records to return.",
                default: 20,
            },
        },
        required: ["startHistoryId"],
    },
};
