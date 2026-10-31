import { ADD_CHAT_REACTION_TOOL_DEFINITION, DELETE_CHAT_MESSAGE_TOOL_DEFINITION, FIND_CHAT_DIRECT_MESSAGE_TOOL_DEFINITION, GET_CHAT_MESSAGE_TOOL_DEFINITION, GET_CHAT_SPACE_TOOL_DEFINITION, LIST_CHAT_MEMBERS_TOOL_DEFINITION, LIST_CHAT_MESSAGES_TOOL_DEFINITION, LIST_CHAT_SPACES_TOOL_DEFINITION, SEND_CHAT_DIRECT_MESSAGE_TOOL_DEFINITION, SEND_CHAT_MESSAGE_TOOL_DEFINITION, UPDATE_CHAT_MESSAGE_TOOL_DEFINITION, } from "./definitions.js";
import { handleAddChatReaction, handleDeleteChatMessage, handleFindChatDirectMessage, handleGetChatMessage, handleGetChatSpace, handleListChatMembers, handleListChatMessages, handleListChatSpaces, handleSendChatDirectMessage, handleSendChatMessage, handleUpdateChatMessage, } from "./handlers.js";
const SCOPE_PREFIX = "https://www.googleapis.com/auth/";
export const CHAT_SCOPES = {
    spaces: `${SCOPE_PREFIX}chat.spaces`,
    messages: `${SCOPE_PREFIX}chat.messages`,
    memberships: `${SCOPE_PREFIX}chat.memberships`,
    reactions: `${SCOPE_PREFIX}chat.messages.reactions`,
};
// Each tool is gated only on the scopes its Chat API methods use, so one
// declined Chat scope (e.g. reactions) does not block unrelated Chat tools.
const chatModule = (definition, handler, scopeNames) => ({
    owner: "google-chat",
    authMode: "personal",
    requiredScopes: scopeNames.map((name) => CHAT_SCOPES[name]),
    definition,
    handler,
});
export const CHAT_TOOL_MODULES = [
    chatModule(LIST_CHAT_SPACES_TOOL_DEFINITION, handleListChatSpaces, ["spaces"]),
    chatModule(GET_CHAT_SPACE_TOOL_DEFINITION, handleGetChatSpace, ["spaces"]),
    chatModule(FIND_CHAT_DIRECT_MESSAGE_TOOL_DEFINITION, handleFindChatDirectMessage, ["spaces"]),
    chatModule(LIST_CHAT_MESSAGES_TOOL_DEFINITION, handleListChatMessages, ["messages"]),
    chatModule(GET_CHAT_MESSAGE_TOOL_DEFINITION, handleGetChatMessage, ["messages"]),
    chatModule(SEND_CHAT_MESSAGE_TOOL_DEFINITION, handleSendChatMessage, ["messages"]),
    chatModule(SEND_CHAT_DIRECT_MESSAGE_TOOL_DEFINITION, handleSendChatDirectMessage, ["spaces", "messages"]),
    chatModule(UPDATE_CHAT_MESSAGE_TOOL_DEFINITION, handleUpdateChatMessage, ["messages"]),
    chatModule(DELETE_CHAT_MESSAGE_TOOL_DEFINITION, handleDeleteChatMessage, ["messages"]),
    chatModule(LIST_CHAT_MEMBERS_TOOL_DEFINITION, handleListChatMembers, ["memberships"]),
    chatModule(ADD_CHAT_REACTION_TOOL_DEFINITION, handleAddChatReaction, ["reactions"]),
];
