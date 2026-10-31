import { ADD_CHAT_REACTION_TOOL_DEFINITION, DELETE_CHAT_MESSAGE_TOOL_DEFINITION, FIND_CHAT_DIRECT_MESSAGE_TOOL_DEFINITION, GET_CHAT_MESSAGE_TOOL_DEFINITION, GET_CHAT_SPACE_TOOL_DEFINITION, LIST_CHAT_MEMBERS_TOOL_DEFINITION, LIST_CHAT_MESSAGES_TOOL_DEFINITION, LIST_CHAT_SPACES_TOOL_DEFINITION, SEND_CHAT_DIRECT_MESSAGE_TOOL_DEFINITION, SEND_CHAT_MESSAGE_TOOL_DEFINITION, UPDATE_CHAT_MESSAGE_TOOL_DEFINITION, } from "./definitions.js";
import { handleAddChatReaction, handleDeleteChatMessage, handleFindChatDirectMessage, handleGetChatMessage, handleGetChatSpace, handleListChatMembers, handleListChatMessages, handleListChatSpaces, handleSendChatDirectMessage, handleSendChatMessage, handleUpdateChatMessage, } from "./handlers.js";
const chatModule = (definition, handler) => ({
    owner: "google-chat",
    authMode: "personal",
    definition,
    handler,
});
export const CHAT_TOOL_MODULES = [
    chatModule(LIST_CHAT_SPACES_TOOL_DEFINITION, handleListChatSpaces),
    chatModule(GET_CHAT_SPACE_TOOL_DEFINITION, handleGetChatSpace),
    chatModule(FIND_CHAT_DIRECT_MESSAGE_TOOL_DEFINITION, handleFindChatDirectMessage),
    chatModule(LIST_CHAT_MESSAGES_TOOL_DEFINITION, handleListChatMessages),
    chatModule(GET_CHAT_MESSAGE_TOOL_DEFINITION, handleGetChatMessage),
    chatModule(SEND_CHAT_MESSAGE_TOOL_DEFINITION, handleSendChatMessage),
    chatModule(SEND_CHAT_DIRECT_MESSAGE_TOOL_DEFINITION, handleSendChatDirectMessage),
    chatModule(UPDATE_CHAT_MESSAGE_TOOL_DEFINITION, handleUpdateChatMessage),
    chatModule(DELETE_CHAT_MESSAGE_TOOL_DEFINITION, handleDeleteChatMessage),
    chatModule(LIST_CHAT_MEMBERS_TOOL_DEFINITION, handleListChatMembers),
    chatModule(ADD_CHAT_REACTION_TOOL_DEFINITION, handleAddChatReaction),
];
