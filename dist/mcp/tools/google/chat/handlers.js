import { errorResult, jsonResult } from "../../result.js";
import { getOptionalPositiveNumber, getRequiredString } from "../../shared/args.js";
import { clampPageSize, getChatClient, getHttpStatus, mapChatMember, mapChatMessage, mapChatSpace, normalizeMessageName, normalizeSpaceName, normalizeUserName, } from "./helpers.js";
function getOptionalString(args, key) {
    const value = args?.[key];
    if (value === undefined || value === null) {
        return undefined;
    }
    if (typeof value !== "string") {
        throw new Error(`Field '${key}' must be a string.`);
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
}
function getOptionalBoolean(args, key) {
    const value = args?.[key];
    if (value === undefined || value === null) {
        return undefined;
    }
    if (typeof value !== "boolean") {
        throw new Error(`Field '${key}' must be a boolean.`);
    }
    return value;
}
function compact(params) {
    return Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined));
}
function resolveUserArg(args) {
    const user = getOptionalString(args, "user") ?? getOptionalString(args, "userEmail");
    if (!user) {
        throw new Error("Provide 'userEmail' (or 'user' as 'users/{id|email}').");
    }
    return normalizeUserName(user);
}
async function findDirectMessage(chat, userName) {
    try {
        const response = await chat.spaces.findDirectMessage({ name: userName });
        return response.data;
    }
    catch (error) {
        if (getHttpStatus(error) === 404) {
            return undefined;
        }
        throw error;
    }
}
export async function handleListChatSpaces(args) {
    try {
        const chat = getChatClient();
        const response = await chat.spaces.list(compact({
            pageSize: clampPageSize(getOptionalPositiveNumber(args, "pageSize", 100)),
            pageToken: getOptionalString(args, "pageToken"),
            filter: getOptionalString(args, "filter"),
        }));
        const spaces = (response.data.spaces ?? []).map(mapChatSpace);
        return jsonResult({ spaces, nextPageToken: response.data.nextPageToken ?? null });
    }
    catch (error) {
        return errorResult(error);
    }
}
export async function handleGetChatSpace(args) {
    try {
        const chat = getChatClient();
        const response = await chat.spaces.get({ name: normalizeSpaceName(getRequiredString(args, "space")) });
        return jsonResult(mapChatSpace(response.data));
    }
    catch (error) {
        return errorResult(error);
    }
}
export async function handleFindChatDirectMessage(args) {
    try {
        const chat = getChatClient();
        const userName = resolveUserArg(args);
        const space = await findDirectMessage(chat, userName);
        if (!space) {
            return jsonResult({ found: false, user: userName });
        }
        return jsonResult({ found: true, user: userName, space: mapChatSpace(space) });
    }
    catch (error) {
        return errorResult(error);
    }
}
export async function handleListChatMessages(args) {
    try {
        const chat = getChatClient();
        const response = await chat.spaces.messages.list(compact({
            parent: normalizeSpaceName(getRequiredString(args, "space")),
            pageSize: clampPageSize(getOptionalPositiveNumber(args, "pageSize", 25)),
            pageToken: getOptionalString(args, "pageToken"),
            filter: getOptionalString(args, "filter"),
            orderBy: getOptionalString(args, "orderBy") ?? "createTime desc",
            showDeleted: getOptionalBoolean(args, "showDeleted"),
        }));
        const messages = (response.data.messages ?? []).map(mapChatMessage);
        return jsonResult({ messages, nextPageToken: response.data.nextPageToken ?? null });
    }
    catch (error) {
        return errorResult(error);
    }
}
export async function handleGetChatMessage(args) {
    try {
        const chat = getChatClient();
        const response = await chat.spaces.messages.get({ name: normalizeMessageName(getRequiredString(args, "name")) });
        return jsonResult(mapChatMessage(response.data));
    }
    catch (error) {
        return errorResult(error);
    }
}
export async function handleSendChatMessage(args) {
    try {
        const chat = getChatClient();
        const parent = normalizeSpaceName(getRequiredString(args, "space"));
        const text = getRequiredString(args, "text");
        const threadName = getOptionalString(args, "threadName");
        const threadKey = getOptionalString(args, "threadKey");
        const hasThread = Boolean(threadName || threadKey);
        const replyToThread = getOptionalBoolean(args, "replyToThread") ?? hasThread;
        const requestBody = { text };
        if (hasThread) {
            requestBody.thread = compact({ name: threadName, threadKey });
        }
        const response = await chat.spaces.messages.create(compact({
            parent,
            messageReplyOption: hasThread && replyToThread ? "REPLY_MESSAGE_FALLBACK_TO_NEW_THREAD" : undefined,
            requestBody,
        }));
        return jsonResult(mapChatMessage(response.data));
    }
    catch (error) {
        return errorResult(error);
    }
}
export async function handleSendChatDirectMessage(args) {
    try {
        const chat = getChatClient();
        const userName = normalizeUserName(getRequiredString(args, "userEmail").trim());
        const text = getRequiredString(args, "text");
        let space = await findDirectMessage(chat, userName);
        let created = false;
        if (!space) {
            const setup = await chat.spaces.setup({
                requestBody: {
                    space: { spaceType: "DIRECT_MESSAGE" },
                    memberships: [{ member: { name: userName, type: "HUMAN" } }],
                },
            });
            space = setup.data;
            created = true;
        }
        if (!space?.name) {
            throw new Error(`Could not resolve a direct message space for ${userName}.`);
        }
        const response = await chat.spaces.messages.create({
            parent: space.name,
            requestBody: { text },
        });
        return jsonResult({ space: mapChatSpace(space), createdSpace: created, message: mapChatMessage(response.data) });
    }
    catch (error) {
        return errorResult(error);
    }
}
export async function handleUpdateChatMessage(args) {
    try {
        const chat = getChatClient();
        const response = await chat.spaces.messages.patch({
            name: normalizeMessageName(getRequiredString(args, "name")),
            updateMask: "text",
            requestBody: { text: getRequiredString(args, "text") },
        });
        return jsonResult(mapChatMessage(response.data));
    }
    catch (error) {
        return errorResult(error);
    }
}
export async function handleDeleteChatMessage(args) {
    try {
        const chat = getChatClient();
        const name = normalizeMessageName(getRequiredString(args, "name"));
        await chat.spaces.messages.delete({ name });
        return jsonResult({ deleted: true, name });
    }
    catch (error) {
        return errorResult(error);
    }
}
export async function handleListChatMembers(args) {
    try {
        const chat = getChatClient();
        const response = await chat.spaces.members.list(compact({
            parent: normalizeSpaceName(getRequiredString(args, "space")),
            pageSize: clampPageSize(getOptionalPositiveNumber(args, "pageSize", 100)),
            pageToken: getOptionalString(args, "pageToken"),
            filter: getOptionalString(args, "filter"),
        }));
        const members = (response.data.memberships ?? []).map(mapChatMember);
        return jsonResult({ members, nextPageToken: response.data.nextPageToken ?? null });
    }
    catch (error) {
        return errorResult(error);
    }
}
export async function handleAddChatReaction(args) {
    try {
        const chat = getChatClient();
        const response = await chat.spaces.messages.reactions.create({
            parent: normalizeMessageName(getRequiredString(args, "name")),
            requestBody: { emoji: { unicode: getRequiredString(args, "emoji").trim() } },
        });
        return jsonResult({
            name: response.data.name ?? "",
            emoji: response.data.emoji?.unicode ?? response.data.emoji?.customEmoji?.uid ?? "",
            user: response.data.user?.name ?? "",
        });
    }
    catch (error) {
        return errorResult(error);
    }
}
