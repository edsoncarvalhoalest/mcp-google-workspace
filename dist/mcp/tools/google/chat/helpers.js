import { google } from "googleapis";
import { oauth2Client } from "../../../../auth/personalAuth.js";
export const CHAT_MAX_PAGE_SIZE = 1000;
function defaultChatClientFactory() {
    return google.chat({ version: "v1", auth: oauth2Client });
}
let chatClientFactory = defaultChatClientFactory;
export function getChatClient() {
    return chatClientFactory();
}
/** Test seam: replace the Chat client factory (e.g. with a fake client). */
export function setChatClientFactory(factory) {
    chatClientFactory = factory;
}
export function resetChatClientFactory() {
    chatClientFactory = defaultChatClientFactory;
}
function stripPrefix(value, prefix) {
    return value.startsWith(prefix) ? value.slice(prefix.length) : value;
}
/** Accepts "spaces/AAA", "AAA" or a message name "spaces/AAA/messages/BBB" and returns "spaces/AAA". */
export function normalizeSpaceName(value) {
    const trimmed = String(value ?? "").trim().replace(/^\/+|\/+$/g, "");
    if (!trimmed) {
        throw new Error("Field 'space' must be a non-empty string.");
    }
    const id = stripPrefix(trimmed, "spaces/").split("/")[0];
    if (!id) {
        throw new Error(`Invalid Chat space name: ${value}`);
    }
    return `spaces/${id}`;
}
/** Accepts "spaces/AAA/messages/BBB" (or a space plus a message id) and returns the full message name. */
export function normalizeMessageName(value, space) {
    const trimmed = String(value ?? "").trim().replace(/^\/+|\/+$/g, "");
    if (!trimmed) {
        throw new Error("Field 'name' must be a non-empty string.");
    }
    if (/^spaces\/[^/]+\/messages\/[^/]+$/.test(trimmed)) {
        return trimmed;
    }
    if (space && !trimmed.includes("/")) {
        return `${normalizeSpaceName(space)}/messages/${trimmed}`;
    }
    throw new Error(`Invalid Chat message name '${value}'. Expected 'spaces/{space}/messages/{message}'.`);
}
/** Accepts "users/123", "users/someone@example.com" or a bare email/id and returns "users/...". */
export function normalizeUserName(value) {
    const trimmed = String(value ?? "").trim();
    if (!trimmed) {
        throw new Error("Field 'userEmail' must be a non-empty string.");
    }
    return trimmed.startsWith("users/") ? trimmed : `users/${trimmed}`;
}
export function clampPageSize(value, max = CHAT_MAX_PAGE_SIZE) {
    return Math.min(Math.max(1, value), max);
}
export function mapChatSpace(space) {
    return {
        name: space?.name ?? "",
        displayName: space?.displayName ?? "",
        spaceType: space?.spaceType ?? space?.type ?? "",
        singleUserBotDm: space?.singleUserBotDm ?? false,
        spaceThreadingState: space?.spaceThreadingState ?? "",
        createTime: space?.createTime ?? "",
        lastActiveTime: space?.lastActiveTime ?? "",
        spaceUri: space?.spaceUri ?? "",
        description: space?.spaceDetails?.description ?? "",
        membershipCount: space?.membershipCount?.joinedDirectHumanUserCount ?? undefined,
    };
}
export function mapChatUser(user) {
    return {
        name: user?.name ?? "",
        displayName: user?.displayName ?? "",
        type: user?.type ?? "",
    };
}
export function mapChatMessage(message) {
    return {
        name: message?.name ?? "",
        text: message?.text ?? "",
        sender: mapChatUser(message?.sender),
        createTime: message?.createTime ?? "",
        lastUpdateTime: message?.lastUpdateTime ?? "",
        deleteTime: message?.deleteTime ?? "",
        threadName: message?.thread?.name ?? "",
        threadReply: message?.threadReply ?? false,
        spaceName: message?.space?.name ?? "",
        attachmentCount: Array.isArray(message?.attachment) ? message.attachment.length : 0,
    };
}
export function mapChatMember(membership) {
    return {
        name: membership?.name ?? "",
        state: membership?.state ?? "",
        role: membership?.role ?? "",
        createTime: membership?.createTime ?? "",
        member: membership?.member ? mapChatUser(membership.member) : undefined,
        groupMember: membership?.groupMember?.name ?? undefined,
    };
}
export function getHttpStatus(error) {
    if (typeof error !== "object" || error === null) {
        return undefined;
    }
    return error.response?.status ?? error.code ?? error.status;
}
