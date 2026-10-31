import { google } from "googleapis";
import { Buffer } from "node:buffer";
import { oauth2Client } from "../../../../auth/personalAuth.js";
import { errorResult, jsonResult } from "../../result.js";
import { getOptionalPositiveNumber, getRequiredString } from "../../shared/args.js";
function createGmailClient() {
    return google.gmail({ version: "v1", auth: oauth2Client });
}
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
function getOptionalBoolean(args, key, fallback) {
    const value = args?.[key];
    if (value === undefined || value === null) {
        return fallback;
    }
    if (typeof value !== "boolean") {
        throw new Error(`Field '${key}' must be a boolean.`);
    }
    return value;
}
function getOptionalStringArray(args, key) {
    const value = args?.[key];
    if (value === undefined || value === null) {
        return undefined;
    }
    if (!Array.isArray(value)) {
        throw new Error(`Field '${key}' must be an array of strings.`);
    }
    const items = value.map((item, index) => {
        if (typeof item !== "string" || item.trim().length === 0) {
            throw new Error(`Field '${key}[${index}]' must be a non-empty string.`);
        }
        return item.trim();
    });
    return items.length > 0 ? items : undefined;
}
function getRequiredStringArray(args, key) {
    const items = getOptionalStringArray(args, key);
    if (!items) {
        throw new Error(`Field '${key}' must contain at least one email address.`);
    }
    return items;
}
function parseEmailDraftArgs(args) {
    const cc = getOptionalStringArray(args, "cc");
    const bcc = getOptionalStringArray(args, "bcc");
    const html = getOptionalString(args, "html");
    return {
        to: getRequiredStringArray(args, "to"),
        ...(cc ? { cc } : {}),
        ...(bcc ? { bcc } : {}),
        subject: getRequiredString(args, "subject"),
        body: getRequiredString(args, "body"),
        ...(html ? { html } : {}),
    };
}
function encodeHeaderValue(value) {
    if (/^[\x00-\x7F]*$/.test(value)) {
        return value;
    }
    return `=?UTF-8?B?${Buffer.from(value, "utf-8").toString("base64")}?=`;
}
function base64UrlEncode(value) {
    return Buffer.from(value, "utf-8")
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/g, "");
}
function base64UrlDecode(value) {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
    return Buffer.from(padded, "base64").toString("utf-8");
}
function buildAddressHeader(addresses) {
    return addresses && addresses.length > 0 ? addresses.join(", ") : undefined;
}
function buildRawEmail({ to, cc, bcc, subject, body, html, extraHeaders = {}, }) {
    const headers = [
        `To: ${buildAddressHeader(to)}`,
        ...(cc ? [`Cc: ${buildAddressHeader(cc)}`] : []),
        ...(bcc ? [`Bcc: ${buildAddressHeader(bcc)}`] : []),
        `Subject: ${encodeHeaderValue(subject)}`,
        "MIME-Version: 1.0",
    ];
    for (const [key, value] of Object.entries(extraHeaders)) {
        if (value) {
            headers.push(`${key}: ${value}`);
        }
    }
    if (!html) {
        return [
            ...headers,
            'Content-Type: text/plain; charset="UTF-8"',
            "Content-Transfer-Encoding: 8bit",
            "",
            body,
        ].join("\r\n");
    }
    const boundary = `mcp-gmail-${Date.now()}`;
    return [
        ...headers,
        `Content-Type: multipart/alternative; boundary="${boundary}"`,
        "",
        `--${boundary}`,
        'Content-Type: text/plain; charset="UTF-8"',
        "Content-Transfer-Encoding: 8bit",
        "",
        body,
        `--${boundary}`,
        'Content-Type: text/html; charset="UTF-8"',
        "Content-Transfer-Encoding: 8bit",
        "",
        html,
        `--${boundary}--`,
        "",
    ].join("\r\n");
}
function getHeaders(message) {
    const headers = message.payload?.headers ?? [];
    const result = {};
    for (const header of headers) {
        if (header.name && header.value) {
            result[header.name.toLowerCase()] = header.value;
        }
    }
    return result;
}
function pickHeader(headers, name) {
    return headers[name.toLowerCase()] ?? "";
}
function collectBodyParts(part, result) {
    if (!part) {
        return;
    }
    const data = part.body?.data;
    if (data && part.mimeType === "text/plain") {
        result.text.push(base64UrlDecode(data));
    }
    else if (data && part.mimeType === "text/html") {
        result.html.push(base64UrlDecode(data));
    }
    if (part.filename && part.body?.attachmentId) {
        result.attachments.push({
            filename: part.filename,
            mimeType: part.mimeType ?? "",
            attachmentId: part.body.attachmentId,
            size: part.body.size ?? 0,
        });
    }
    for (const child of part.parts ?? []) {
        collectBodyParts(child, result);
    }
}
function summarizeMessage(message) {
    const headers = getHeaders(message);
    return {
        id: message.id ?? "",
        threadId: message.threadId ?? "",
        labelIds: message.labelIds ?? [],
        subject: pickHeader(headers, "Subject"),
        from: pickHeader(headers, "From"),
        to: pickHeader(headers, "To"),
        cc: pickHeader(headers, "Cc"),
        date: pickHeader(headers, "Date"),
        snippet: message.snippet ?? "",
    };
}
function detailedMessage(message) {
    const body = { text: [], html: [], attachments: [] };
    collectBodyParts(message.payload, body);
    return {
        ...summarizeMessage(message),
        historyId: message.historyId ?? "",
        sizeEstimate: message.sizeEstimate ?? 0,
        bodyText: body.text.join("\n").trim(),
        bodyHtml: body.html.join("\n").trim(),
        attachments: body.attachments,
    };
}
function splitAddresses(headerValue) {
    return headerValue
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
}
function uniqueAddresses(addresses) {
    return Array.from(new Set(addresses.filter(Boolean)));
}
function buildReplyRecipients(headers, replyAll) {
    const replyTo = pickHeader(headers, "Reply-To") || pickHeader(headers, "From");
    const recipients = splitAddresses(replyTo);
    if (replyAll) {
        recipients.push(...splitAddresses(pickHeader(headers, "To")));
        recipients.push(...splitAddresses(pickHeader(headers, "Cc")));
    }
    return uniqueAddresses(recipients);
}
function buildReplySubject(subject) {
    return /^re:/i.test(subject.trim()) ? subject : `Re: ${subject}`;
}
function getHistoryTypes(args) {
    const values = getOptionalStringArray(args, "historyTypes");
    if (!values) {
        return undefined;
    }
    const allowed = new Set(["messageAdded", "messageDeleted", "labelAdded", "labelRemoved"]);
    for (const value of values) {
        if (!allowed.has(value)) {
            throw new Error(`Unsupported Gmail history type '${value}'.`);
        }
    }
    return values;
}
export async function handleSearchEmails(args) {
    try {
        const query = getRequiredString(args, "query");
        const limit = getOptionalPositiveNumber(args, "limit", 5);
        const gmail = createGmailClient();
        const listResponse = await gmail.users.messages.list({
            userId: "me",
            q: query,
            maxResults: limit,
        });
        const messages = listResponse.data.messages ?? [];
        const detailed = await Promise.all(messages
            .filter((message) => typeof message.id === "string" && message.id.length > 0)
            .map(async (message) => {
            const detail = await gmail.users.messages.get({
                userId: "me",
                id: message.id,
                format: "metadata",
                metadataHeaders: ["Subject", "From", "To", "Cc", "Date"],
            });
            return summarizeMessage(detail.data);
        }));
        return jsonResult(detailed);
    }
    catch (error) {
        return errorResult(error);
    }
}
export async function handleGetEmail(args) {
    try {
        const messageId = getRequiredString(args, "messageId");
        const gmail = createGmailClient();
        const response = await gmail.users.messages.get({
            userId: "me",
            id: messageId,
            format: "full",
        });
        return jsonResult(detailedMessage(response.data));
    }
    catch (error) {
        return errorResult(error);
    }
}
export async function handleSendEmail(args) {
    try {
        const email = parseEmailDraftArgs(args);
        const gmail = createGmailClient();
        const response = await gmail.users.messages.send({
            userId: "me",
            requestBody: {
                raw: base64UrlEncode(buildRawEmail(email)),
            },
        });
        return jsonResult({
            sent: true,
            id: response.data.id,
            threadId: response.data.threadId,
            labelIds: response.data.labelIds ?? [],
        });
    }
    catch (error) {
        return errorResult(error);
    }
}
export async function handleCreateEmailDraft(args) {
    try {
        const email = parseEmailDraftArgs(args);
        const gmail = createGmailClient();
        const response = await gmail.users.drafts.create({
            userId: "me",
            requestBody: {
                message: {
                    raw: base64UrlEncode(buildRawEmail(email)),
                },
            },
        });
        return jsonResult({
            draftCreated: true,
            draftId: response.data.id,
            messageId: response.data.message?.id,
            threadId: response.data.message?.threadId,
        });
    }
    catch (error) {
        return errorResult(error);
    }
}
export async function handleReplyEmail(args) {
    try {
        const messageId = getRequiredString(args, "messageId");
        const body = getRequiredString(args, "body");
        const html = getOptionalString(args, "html");
        const replyAll = getOptionalBoolean(args, "replyAll", false);
        const gmail = createGmailClient();
        const original = await gmail.users.messages.get({
            userId: "me",
            id: messageId,
            format: "metadata",
            metadataHeaders: ["Subject", "From", "To", "Cc", "Reply-To", "Message-ID", "References"],
        });
        const headers = getHeaders(original.data);
        const to = buildReplyRecipients(headers, replyAll);
        if (to.length === 0) {
            throw new Error("Could not determine reply recipient from the original message.");
        }
        const messageIdHeader = pickHeader(headers, "Message-ID");
        const references = [pickHeader(headers, "References"), messageIdHeader].filter(Boolean).join(" ");
        const subject = buildReplySubject(pickHeader(headers, "Subject"));
        const threadId = original.data.threadId;
        if (!threadId) {
            throw new Error("Could not determine Gmail thread ID from the original message.");
        }
        const response = await gmail.users.messages.send({
            userId: "me",
            requestBody: {
                threadId,
                raw: base64UrlEncode(buildRawEmail({
                    to,
                    subject,
                    body,
                    ...(html ? { html } : {}),
                    extraHeaders: {
                        "In-Reply-To": messageIdHeader,
                        References: references,
                    },
                })),
            },
        });
        return jsonResult({
            replied: true,
            id: response.data.id,
            threadId: response.data.threadId,
        });
    }
    catch (error) {
        return errorResult(error);
    }
}
export async function handleModifyEmailLabels(args) {
    try {
        const messageId = getRequiredString(args, "messageId");
        const addLabelIds = getOptionalStringArray(args, "addLabelIds") ?? [];
        const removeLabelIds = getOptionalStringArray(args, "removeLabelIds") ?? [];
        if (addLabelIds.length === 0 && removeLabelIds.length === 0) {
            throw new Error("Provide addLabelIds or removeLabelIds.");
        }
        const gmail = createGmailClient();
        const response = await gmail.users.messages.modify({
            userId: "me",
            id: messageId,
            requestBody: { addLabelIds, removeLabelIds },
        });
        return jsonResult({
            modified: true,
            ...summarizeMessage(response.data),
        });
    }
    catch (error) {
        return errorResult(error);
    }
}
export async function handleStartGmailWatch(args) {
    try {
        const topicName = getRequiredString(args, "topicName");
        const labelIds = getOptionalStringArray(args, "labelIds");
        const labelFilterAction = getOptionalString(args, "labelFilterAction") ?? "include";
        if (labelFilterAction !== "include" && labelFilterAction !== "exclude") {
            throw new Error('Field "labelFilterAction" must be "include" or "exclude".');
        }
        const gmail = createGmailClient();
        const response = await gmail.users.watch({
            userId: "me",
            requestBody: {
                topicName,
                ...(labelIds ? { labelIds } : {}),
                labelFilterAction,
            },
        });
        return jsonResult({
            watching: true,
            historyId: response.data.historyId,
            expiration: response.data.expiration,
            expirationIso: response.data.expiration ? new Date(Number(response.data.expiration)).toISOString() : undefined,
            topicName,
            labelIds: labelIds ?? [],
            labelFilterAction,
        });
    }
    catch (error) {
        return errorResult(error);
    }
}
export async function handleStopGmailWatch(_args) {
    try {
        const gmail = createGmailClient();
        await gmail.users.stop({ userId: "me" });
        return jsonResult({ watching: false, stopped: true });
    }
    catch (error) {
        return errorResult(error);
    }
}
export async function handleListGmailHistory(args) {
    try {
        const startHistoryId = getRequiredString(args, "startHistoryId");
        const historyTypes = getHistoryTypes(args);
        const limit = getOptionalPositiveNumber(args, "limit", 20);
        const gmail = createGmailClient();
        const response = await gmail.users.history.list({
            userId: "me",
            startHistoryId,
            ...(historyTypes ? { historyTypes } : {}),
            maxResults: limit,
        });
        return jsonResult({
            startHistoryId,
            historyId: response.data.historyId,
            history: response.data.history ?? [],
            nextPageToken: response.data.nextPageToken,
        });
    }
    catch (error) {
        return errorResult(error);
    }
}
