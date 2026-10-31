import dotenv from "dotenv";
import express from "express";
import { Buffer } from "node:buffer";
import process from "node:process";
dotenv.config();
const DEFAULT_PORT = 8080;
const MAX_STORED_NOTIFICATIONS = 100;
const notifications = [];
function parsePort(value) {
    if (!value) {
        return DEFAULT_PORT;
    }
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
        throw new Error(`Invalid GMAIL_WEBHOOK_PORT value: ${value}`);
    }
    return parsed;
}
function decodePubSubData(data) {
    if (typeof data !== "string" || data.length === 0) {
        return { payload: {} };
    }
    const rawData = Buffer.from(data, "base64").toString("utf-8");
    try {
        return { rawData, payload: JSON.parse(rawData) };
    }
    catch {
        return { rawData, payload: {} };
    }
}
function assertWebhookSecret(requestSecret, expectedSecret) {
    if (!expectedSecret) {
        return;
    }
    if (requestSecret !== expectedSecret) {
        throw new Error("Invalid webhook secret.");
    }
}
function rememberNotification(notification) {
    notifications.unshift(notification);
    if (notifications.length > MAX_STORED_NOTIFICATIONS) {
        notifications.splice(MAX_STORED_NOTIFICATIONS);
    }
}
const app = express();
app.use(express.json({ limit: "1mb" }));
app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "gmail-webhook", storedNotifications: notifications.length });
});
app.get("/webhooks/gmail/events", (_req, res) => {
    res.json({ events: notifications });
});
app.post("/webhooks/gmail", (req, res) => {
    try {
        const requestSecret = req.header("x-gmail-webhook-secret") ?? req.query.secret;
        assertWebhookSecret(requestSecret, process.env.GMAIL_WEBHOOK_SECRET);
        const message = req.body?.message ?? {};
        const decoded = decodePubSubData(message.data);
        const notification = {
            receivedAt: new Date().toISOString(),
            ...(typeof message.messageId === "string" ? { messageId: message.messageId } : {}),
            ...(typeof message.publishTime === "string" ? { publishTime: message.publishTime } : {}),
            ...(typeof req.body?.subscription === "string" ? { subscription: req.body.subscription } : {}),
            ...(decoded.payload.emailAddress ? { emailAddress: decoded.payload.emailAddress } : {}),
            ...(decoded.payload.historyId ? { historyId: decoded.payload.historyId } : {}),
            ...(decoded.rawData ? { rawData: decoded.rawData } : {}),
        };
        rememberNotification(notification);
        console.log(JSON.stringify(notification));
        res.status(204).send();
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        res.status(401).json({ error: message });
    }
});
const port = parsePort(process.env.GMAIL_WEBHOOK_PORT);
app.listen(port, () => {
    console.log(`Gmail webhook receiver listening on http://localhost:${port}/webhooks/gmail`);
    console.log("Expose this endpoint with a public HTTPS URL before using it as a Pub/Sub push endpoint.");
});
