import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, afterEach, before, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const importDist = (relative) => import(pathToFileURL(path.join(repoRoot, "dist", relative)).href);

const CHAT_SCOPES = [
    "https://www.googleapis.com/auth/chat.spaces",
    "https://www.googleapis.com/auth/chat.messages",
    "https://www.googleapis.com/auth/chat.memberships",
    "https://www.googleapis.com/auth/chat.messages.reactions",
];
const CHAT_TOOL_NAMES = [
    "list_chat_spaces",
    "get_chat_space",
    "find_chat_direct_message",
    "list_chat_messages",
    "get_chat_message",
    "send_chat_message",
    "send_chat_direct_message",
    "update_chat_message",
    "delete_chat_message",
    "list_chat_members",
    "add_chat_reaction",
];

const configDir = fs.mkdtempSync(path.join(os.tmpdir(), "mcp-gw-chat-test-"));
let auth;
let registry;
let helpers;
let handlers;

function textOf(result) {
    return result.content.map((item) => item.text ?? "").join("\n");
}

function jsonOf(result) {
    assert.ok(!result.isError, `unexpected error: ${textOf(result)}`);
    return JSON.parse(textOf(result));
}

function httpError(status, message) {
    const error = new Error(message);
    error.code = status;
    error.status = status;
    error.response = { status, data: { error: { code: status, message } } };
    return error;
}

/** Minimal fake of google.chat({version:'v1'}) that records calls. */
function createFakeChat(overrides = {}) {
    const calls = [];
    const record = (method, impl) => async (params) => {
        calls.push({ method, params });
        return impl(params);
    };
    const pick = (method, fallback) => record(method, overrides[method] ?? fallback);
    const chat = {
        calls,
        spaces: {
            list: pick("spaces.list", () => ({ data: { spaces: [] } })),
            get: pick("spaces.get", (params) => ({ data: { name: params.name } })),
            findDirectMessage: pick("spaces.findDirectMessage", () => {
                throw httpError(404, "Requested entity was not found.");
            }),
            setup: pick("spaces.setup", () => ({ data: { name: "spaces/NEWDM", spaceType: "DIRECT_MESSAGE" } })),
            messages: {
                list: pick("spaces.messages.list", () => ({ data: { messages: [] } })),
                get: pick("spaces.messages.get", (params) => ({ data: { name: params.name } })),
                create: pick("spaces.messages.create", (params) => ({
                    data: {
                        name: `${params.parent}/messages/M1`,
                        text: params.requestBody.text,
                        thread: { name: params.requestBody.thread?.name ?? `${params.parent}/threads/T1` },
                        space: { name: params.parent },
                    },
                })),
                patch: pick("spaces.messages.patch", (params) => ({ data: { name: params.name, text: params.requestBody.text } })),
                delete: pick("spaces.messages.delete", () => ({ data: {} })),
                reactions: {
                    create: pick("spaces.messages.reactions.create", (params) => ({
                        data: { name: `${params.parent}/reactions/R1`, emoji: params.requestBody.emoji, user: { name: "users/me" } },
                    })),
                },
            },
            members: {
                list: pick("spaces.members.list", () => ({ data: { memberships: [] } })),
            },
        },
    };
    return chat;
}

function useFakeChat(overrides) {
    const chat = createFakeChat(overrides);
    helpers.setChatClientFactory(() => chat);
    return chat;
}

before(async () => {
    Object.assign(process.env, {
        GOOGLE_CLIENT_ID: "dummy.apps.googleusercontent.com",
        GOOGLE_CLIENT_SECRET: "dummy",
        MCP_CONFIG_DIR: configDir,
        MCP_NO_BROWSER: "1",
        MCP_AUTH_WAIT_MS: "0",
        TOKEN_STORE_PROVIDER: "file",
        TOKEN_STORE_DEFAULT_USER_KEY: "chat-test-user",
    });
    auth = await importDist("auth/personalAuth.js");
    registry = await importDist("mcp/tools/registry.js");
    helpers = await importDist("mcp/tools/google/chat/helpers.js");
    handlers = await importDist("mcp/tools/google/chat/handlers.js");
});

afterEach(() => {
    helpers.resetChatClientFactory();
});

after(() => {
    fs.rmSync(configDir, { recursive: true, force: true });
});

test("STANDARD_SCOPES includes the Chat scopes and old tokens are flagged for re-consent", () => {
    for (const scope of CHAT_SCOPES) {
        assert.ok(auth.STANDARD_SCOPES.includes(scope), `missing ${scope}`);
    }
    const preChatScopes = auth.STANDARD_SCOPES.filter((scope) => !CHAT_SCOPES.includes(scope)).join(" ");
    assert.deepEqual(auth.getMissingScopes(preChatScopes), CHAT_SCOPES);
});

test("all Chat tools are registered", () => {
    for (const name of CHAT_TOOL_NAMES) {
        assert.ok(registry.REGISTERED_TOOL_NAMES.has(name), `tool ${name} not registered`);
    }
    for (const definition of registry.REGISTERED_TOOL_DEFINITIONS.filter((d) => CHAT_TOOL_NAMES.includes(d.name))) {
        assert.equal(definition.inputSchema.type, "object");
    }
});

test("normalizeSpaceName / normalizeMessageName / normalizeUserName", () => {
    assert.equal(helpers.normalizeSpaceName("AAA"), "spaces/AAA");
    assert.equal(helpers.normalizeSpaceName("spaces/AAA"), "spaces/AAA");
    assert.equal(helpers.normalizeSpaceName(" spaces/AAA/messages/BBB "), "spaces/AAA");
    assert.throws(() => helpers.normalizeSpaceName(""));
    assert.equal(helpers.normalizeMessageName("spaces/AAA/messages/BBB.CCC"), "spaces/AAA/messages/BBB.CCC");
    assert.equal(helpers.normalizeMessageName("BBB", "AAA"), "spaces/AAA/messages/BBB");
    assert.throws(() => helpers.normalizeMessageName("BBB"));
    assert.equal(helpers.normalizeUserName("someone@example.com"), "users/someone@example.com");
    assert.equal(helpers.normalizeUserName("users/123"), "users/123");
});

test("list_chat_spaces passes pageSize/filter and maps output + nextPageToken", async () => {
    const chat = useFakeChat({
        "spaces.list": () => ({
            data: {
                spaces: [{ name: "spaces/AAA", displayName: "Equipe", spaceType: "SPACE", createTime: "2025-01-01T00:00:00Z" }],
                nextPageToken: "NEXT",
            },
        }),
    });
    const payload = jsonOf(await handlers.handleListChatSpaces({ pageSize: 5000, filter: 'spaceType = "SPACE"' }));
    assert.deepEqual(chat.calls[0], {
        method: "spaces.list",
        params: { pageSize: 1000, filter: 'spaceType = "SPACE"' },
    });
    assert.equal(payload.nextPageToken, "NEXT");
    assert.equal(payload.spaces.length, 1);
    assert.equal(payload.spaces[0].name, "spaces/AAA");
    assert.equal(payload.spaces[0].displayName, "Equipe");
    assert.equal(payload.spaces[0].spaceType, "SPACE");
});

test("list_chat_messages uses defaults and maps sender/thread", async () => {
    const chat = useFakeChat({
        "spaces.messages.list": () => ({
            data: {
                messages: [{
                    name: "spaces/AAA/messages/M1",
                    text: "oi",
                    sender: { name: "users/1", displayName: "Fulano", type: "HUMAN" },
                    createTime: "2025-01-01T00:00:00Z",
                    thread: { name: "spaces/AAA/threads/T1" },
                    space: { name: "spaces/AAA" },
                }],
            },
        }),
    });
    const payload = jsonOf(await handlers.handleListChatMessages({ space: "AAA" }));
    assert.deepEqual(chat.calls[0].params, { parent: "spaces/AAA", pageSize: 25, orderBy: "createTime desc" });
    assert.equal(payload.nextPageToken, null);
    assert.deepEqual(payload.messages[0].sender, { name: "users/1", displayName: "Fulano", type: "HUMAN" });
    assert.equal(payload.messages[0].threadName, "spaces/AAA/threads/T1");
    assert.equal(payload.messages[0].spaceName, "spaces/AAA");
});

test("send_chat_message without thread sends only text", async () => {
    const chat = useFakeChat();
    const payload = jsonOf(await handlers.handleSendChatMessage({ space: "spaces/AAA", text: "Olá" }));
    assert.deepEqual(chat.calls[0].params, { parent: "spaces/AAA", requestBody: { text: "Olá" } });
    assert.equal(payload.name, "spaces/AAA/messages/M1");
});

test("send_chat_message in a thread sets thread and messageReplyOption", async () => {
    const chat = useFakeChat();
    jsonOf(await handlers.handleSendChatMessage({ space: "AAA", text: "resposta", threadName: "spaces/AAA/threads/T9" }));
    assert.deepEqual(chat.calls[0].params, {
        parent: "spaces/AAA",
        messageReplyOption: "REPLY_MESSAGE_FALLBACK_TO_NEW_THREAD",
        requestBody: { text: "resposta", thread: { name: "spaces/AAA/threads/T9" } },
    });
    jsonOf(await handlers.handleSendChatMessage({ space: "AAA", text: "k", threadKey: "key-1", replyToThread: false }));
    assert.deepEqual(chat.calls[1].params, {
        parent: "spaces/AAA",
        requestBody: { text: "k", thread: { threadKey: "key-1" } },
    });
});

test("send_chat_direct_message falls back to spaces.setup on 404 and posts in the new space", async () => {
    const chat = useFakeChat();
    const payload = jsonOf(await handlers.handleSendChatDirectMessage({ userEmail: "someone@example.com", text: "Oi!" }));
    assert.deepEqual(chat.calls.map((call) => call.method), [
        "spaces.findDirectMessage",
        "spaces.setup",
        "spaces.messages.create",
    ]);
    assert.deepEqual(chat.calls[0].params, { name: "users/someone@example.com" });
    assert.deepEqual(chat.calls[1].params.requestBody, {
        space: { spaceType: "DIRECT_MESSAGE" },
        memberships: [{ member: { name: "users/someone@example.com", type: "HUMAN" } }],
    });
    assert.deepEqual(chat.calls[2].params, { parent: "spaces/NEWDM", requestBody: { text: "Oi!" } });
    assert.equal(payload.createdSpace, true);
    assert.equal(payload.message.name, "spaces/NEWDM/messages/M1");
});

test("send_chat_direct_message reuses an existing DM", async () => {
    const chat = useFakeChat({
        "spaces.findDirectMessage": () => ({ data: { name: "spaces/DM1", spaceType: "DIRECT_MESSAGE" } }),
    });
    const payload = jsonOf(await handlers.handleSendChatDirectMessage({ userEmail: "someone@example.com", text: "Oi" }));
    assert.deepEqual(chat.calls.map((call) => call.method), ["spaces.findDirectMessage", "spaces.messages.create"]);
    assert.equal(payload.createdSpace, false);
    assert.equal(payload.space.name, "spaces/DM1");
});

test("find_chat_direct_message reports found=false on 404", async () => {
    useFakeChat();
    const payload = jsonOf(await handlers.handleFindChatDirectMessage({ userEmail: "someone@example.com" }));
    assert.deepEqual(payload, { found: false, user: "users/someone@example.com" });
});

test("update, delete, members and reactions build the expected requests", async () => {
    const chat = useFakeChat({
        "spaces.members.list": () => ({
            data: {
                memberships: [{ name: "spaces/AAA/members/1", role: "ROLE_MEMBER", state: "JOINED", member: { name: "users/1", type: "HUMAN" } }],
                nextPageToken: "N2",
            },
        }),
    });
    jsonOf(await handlers.handleUpdateChatMessage({ name: "spaces/AAA/messages/M1", text: "editado" }));
    assert.deepEqual(chat.calls[0].params, { name: "spaces/AAA/messages/M1", updateMask: "text", requestBody: { text: "editado" } });

    assert.deepEqual(jsonOf(await handlers.handleDeleteChatMessage({ name: "spaces/AAA/messages/M1" })), {
        deleted: true,
        name: "spaces/AAA/messages/M1",
    });

    const members = jsonOf(await handlers.handleListChatMembers({ space: "AAA", pageSize: 10 }));
    assert.deepEqual(chat.calls[2].params, { parent: "spaces/AAA", pageSize: 10 });
    assert.equal(members.members[0].member.name, "users/1");
    assert.equal(members.nextPageToken, "N2");

    const reaction = jsonOf(await handlers.handleAddChatReaction({ name: "spaces/AAA/messages/M1", emoji: "👍" }));
    assert.deepEqual(chat.calls[3].params, { parent: "spaces/AAA/messages/M1", requestBody: { emoji: { unicode: "👍" } } });
    assert.equal(reaction.emoji, "👍");
});

test("Google errors are returned as isError preserving the message", async () => {
    useFakeChat({
        "spaces.list": () => {
            throw httpError(403, "Request had insufficient authentication scopes.");
        },
    });
    const result = await handlers.handleListChatSpaces({});
    assert.equal(result.isError, true);
    assert.match(textOf(result), /insufficient authentication scopes/);
});

test("invalid arguments produce isError without calling the API", async () => {
    const chat = useFakeChat();
    const result = await handlers.handleSendChatMessage({ space: "AAA" });
    assert.equal(result.isError, true);
    assert.match(textOf(result), /text/);
    assert.equal(chat.calls.length, 0);
});

test("Chat tools carry MCP read-only/destructive annotations", () => {
    const byName = new Map(registry.REGISTERED_TOOL_DEFINITIONS.map((definition) => [definition.name, definition]));
    for (const name of ["list_chat_spaces", "get_chat_space", "find_chat_direct_message", "list_chat_messages", "get_chat_message", "list_chat_members"]) {
        assert.equal(byName.get(name).annotations?.readOnlyHint, true, `${name} should be read-only`);
    }
    for (const name of ["update_chat_message", "delete_chat_message"]) {
        assert.equal(byName.get(name).annotations?.destructiveHint, true, `${name} should be destructive`);
    }
    for (const name of ["send_chat_message", "send_chat_direct_message", "add_chat_reaction"]) {
        const annotations = byName.get(name).annotations;
        assert.equal(annotations?.readOnlyHint, false, `${name} writes`);
        assert.equal(annotations?.destructiveHint, false, `${name} is additive`);
    }
});
