import { google } from "googleapis";
import { oauth2Client } from "../../../../auth/personalAuth.js";
export function getCalendarClient() {
    return google.calendar({ version: "v3", auth: oauth2Client });
}
export const DISPLAY_TIME_ZONE = "Asia/Ho_Chi_Minh";
// Renders an ISO/RFC3339 datetime (or all-day date) as wall-clock time in the
// display time zone, e.g. "2026-05-31 07:30 (Asia/Ho_Chi_Minh)". This lets the
// agent report times directly without doing its own (often wrong) UTC math.
export function formatInDisplayZone(value) {
    if (!value) {
        return "";
    }
    // All-day events carry only a date (YYYY-MM-DD) with no time component.
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return `${value} (all-day)`;
    }
    const instant = new Date(value);
    if (Number.isNaN(instant.getTime())) {
        return value;
    }
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: DISPLAY_TIME_ZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    }).formatToParts(instant);
    const get = (type) => parts.find((part) => part.type === type)?.value ?? "";
    return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")} (${DISPLAY_TIME_ZONE})`;
}
export function mapCalendarEvent(event) {
    const start = event.start?.dateTime ?? event.start?.date ?? "";
    const end = event.end?.dateTime ?? event.end?.date ?? "";
    return {
        id: event.id ?? "",
        etag: event.etag ?? "",
        summary: event.summary ?? "(No title)",
        description: event.description ?? "",
        location: event.location ?? "",
        start,
        end,
        startLocal: formatInDisplayZone(start),
        endLocal: formatInDisplayZone(end),
        htmlLink: event.htmlLink ?? "",
        meetLink: event.hangoutLink ?? "",
        status: event.status ?? "",
    };
}
export function mapCalendarListEntry(entry) {
    return {
        id: entry.id ?? "",
        summary: entry.summary ?? "",
        description: entry.description ?? "",
        primary: entry.primary ?? false,
        accessRole: entry.accessRole ?? "",
        selected: entry.selected ?? false,
        hidden: entry.hidden ?? false,
        backgroundColor: entry.backgroundColor ?? "",
        foregroundColor: entry.foregroundColor ?? "",
        timeZone: entry.timeZone ?? "",
        location: entry.location ?? "",
    };
}
export function getHttpStatus(error) {
    if (typeof error !== "object" || error === null) {
        return undefined;
    }
    const response = error.response;
    return response?.status;
}
export function ifMatchHeaders(etag) {
    return { "If-Match": etag };
}
export function ifNoneMatchHeaders(etag) {
    return { "If-None-Match": etag };
}
