const SPACE_PROPERTY = {
    type: "string",
    description: "Chat space resource name, e.g. 'spaces/AAAAxxxx' (the bare ID 'AAAAxxxx' is also accepted).",
};
const MESSAGE_NAME_PROPERTY = {
    type: "string",
    description: "Chat message resource name, e.g. 'spaces/AAAAxxxx/messages/BBBB.CCCC'.",
};
const PAGE_TOKEN_PROPERTY = {
    type: "string",
    description: "Page token returned as nextPageToken by a previous call.",
};
export const LIST_CHAT_SPACES_TOOL_DEFINITION = {
    name: "list_chat_spaces",
    description: "List Google Chat spaces (named spaces, group chats and direct messages) the signed-in user is a member of. Returns resource names like 'spaces/AAAAxxxx'.",
    inputSchema: {
        type: "object",
        properties: {
            pageSize: { type: "number", description: "Maximum spaces to return (1-1000).", default: 100 },
            pageToken: PAGE_TOKEN_PROPERTY,
            filter: {
                type: "string",
                description: "Optional filter, e.g. 'spaceType = \"SPACE\"' or 'spaceType = \"SPACE\" OR spaceType = \"DIRECT_MESSAGE\"'.",
            },
        },
    },
};
export const GET_CHAT_SPACE_TOOL_DEFINITION = {
    name: "get_chat_space",
    description: "Get details of a Google Chat space by resource name ('spaces/AAAAxxxx').",
    inputSchema: {
        type: "object",
        properties: { space: SPACE_PROPERTY },
        required: ["space"],
    },
};
export const FIND_CHAT_DIRECT_MESSAGE_TOOL_DEFINITION = {
    name: "find_chat_direct_message",
    description: "Find the existing direct message space between the signed-in user and another user. Returns found=false when no DM exists yet.",
    inputSchema: {
        type: "object",
        properties: {
            userEmail: { type: "string", description: "Email of the other user, e.g. 'someone@example.com'." },
            user: { type: "string", description: "Alternative to userEmail: user resource name 'users/{id}' or 'users/{email}'." },
        },
    },
};
export const LIST_CHAT_MESSAGES_TOOL_DEFINITION = {
    name: "list_chat_messages",
    description: "List messages in a Google Chat space ('spaces/AAAAxxxx'), newest first by default.",
    inputSchema: {
        type: "object",
        properties: {
            space: SPACE_PROPERTY,
            pageSize: { type: "number", description: "Maximum messages to return (1-1000).", default: 25 },
            pageToken: PAGE_TOKEN_PROPERTY,
            filter: {
                type: "string",
                description: "Optional filter, e.g. 'createTime > \"2025-01-01T00:00:00Z\"' or 'thread.name = spaces/AAA/threads/BBB'.",
            },
            orderBy: {
                type: "string",
                description: "'createTime desc' (default) or 'createTime asc'.",
                default: "createTime desc",
            },
            showDeleted: { type: "boolean", description: "Include deleted messages. Default: false." },
        },
        required: ["space"],
    },
};
export const GET_CHAT_MESSAGE_TOOL_DEFINITION = {
    name: "get_chat_message",
    description: "Get a Google Chat message by resource name ('spaces/AAAAxxxx/messages/BBBB').",
    inputSchema: {
        type: "object",
        properties: { name: MESSAGE_NAME_PROPERTY },
        required: ["name"],
    },
};
export const SEND_CHAT_MESSAGE_TOOL_DEFINITION = {
    name: "send_chat_message",
    description: "Send a text message as the signed-in user to a Google Chat space ('spaces/AAAAxxxx'). Optionally reply in a thread via threadName or threadKey.",
    inputSchema: {
        type: "object",
        properties: {
            space: SPACE_PROPERTY,
            text: { type: "string", description: "Message text (Chat formatting such as *bold* and _italic_ is supported)." },
            threadName: { type: "string", description: "Existing thread resource name 'spaces/AAA/threads/BBB' to reply to." },
            threadKey: { type: "string", description: "Custom thread key; messages with the same key go to the same thread." },
            replyToThread: {
                type: "boolean",
                description: "When threadName/threadKey is given, reply in that thread (falls back to a new thread if not found). Default: true when a thread is given.",
            },
        },
        required: ["space", "text"],
    },
};
export const SEND_CHAT_DIRECT_MESSAGE_TOOL_DEFINITION = {
    name: "send_chat_direct_message",
    description: "Send a direct message to a user by email. Finds the existing DM space, or creates it (spaces.setup) when it does not exist, then posts the message.",
    inputSchema: {
        type: "object",
        properties: {
            userEmail: { type: "string", description: "Email of the recipient, e.g. 'someone@example.com'." },
            text: { type: "string", description: "Message text." },
        },
        required: ["userEmail", "text"],
    },
};
export const UPDATE_CHAT_MESSAGE_TOOL_DEFINITION = {
    name: "update_chat_message",
    description: "Edit the text of a Google Chat message sent by the signed-in user ('spaces/AAA/messages/BBB').",
    inputSchema: {
        type: "object",
        properties: {
            name: MESSAGE_NAME_PROPERTY,
            text: { type: "string", description: "New message text." },
        },
        required: ["name", "text"],
    },
};
export const DELETE_CHAT_MESSAGE_TOOL_DEFINITION = {
    name: "delete_chat_message",
    description: "Delete a Google Chat message sent by the signed-in user ('spaces/AAA/messages/BBB').",
    inputSchema: {
        type: "object",
        properties: { name: MESSAGE_NAME_PROPERTY },
        required: ["name"],
    },
};
export const LIST_CHAT_MEMBERS_TOOL_DEFINITION = {
    name: "list_chat_members",
    description: "List members of a Google Chat space ('spaces/AAAAxxxx').",
    inputSchema: {
        type: "object",
        properties: {
            space: SPACE_PROPERTY,
            pageSize: { type: "number", description: "Maximum members to return (1-1000).", default: 100 },
            pageToken: PAGE_TOKEN_PROPERTY,
            filter: {
                type: "string",
                description: "Optional filter, e.g. 'member.type = \"HUMAN\"' or 'role = \"ROLE_MANAGER\"'.",
            },
        },
        required: ["space"],
    },
};
export const ADD_CHAT_REACTION_TOOL_DEFINITION = {
    name: "add_chat_reaction",
    description: "Add an emoji reaction to a Google Chat message ('spaces/AAA/messages/BBB').",
    inputSchema: {
        type: "object",
        properties: {
            name: MESSAGE_NAME_PROPERTY,
            emoji: { type: "string", description: "Unicode emoji, e.g. '👍'." },
        },
        required: ["name", "emoji"],
    },
};
