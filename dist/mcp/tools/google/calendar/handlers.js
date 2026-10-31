import { errorResult, jsonResult } from "../../result.js";
import { getOptionalPositiveNumber, getRequiredString } from "../../shared/args.js";
import { getCalendarClient, getHttpStatus, ifMatchHeaders, ifNoneMatchHeaders, mapCalendarEvent, mapCalendarListEntry, resolveTimeZoneSetting, } from "./helpers.js";
function getCalendarId(args) {
    const value = args?.calendarId;
    if (value === undefined || value === null) {
        return "primary";
    }
    if (typeof value !== "string" || value.trim().length === 0) {
        throw new Error("Field 'calendarId' must be a non-empty string.");
    }
    return value.trim();
}
function getOptionalEtag(args) {
    const value = args?.etag;
    if (value === undefined || value === null) {
        return undefined;
    }
    if (typeof value !== "string" || value.trim().length === 0) {
        throw new Error("Field 'etag' must be a non-empty string when provided.");
    }
    return value.trim();
}
function getOptionalStringField(args, key) {
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
function getTimeZone(args) {
    return (getOptionalStringField(args, "timeZone") ??
        resolveTimeZoneSetting([process.env.MCP_TIME_ZONE, process.env.MCP_DISPLAY_TIME_ZONE], "UTC"));
}
function buildDateTimeField(dateTime, timeZone) {
    return { dateTime, timeZone };
}
// Returns the UTC offset (e.g. "+07:00") that the given IANA time zone has at
// the supplied instant, so we can build a valid RFC3339 string deterministically
// instead of relying on the LLM to format it.
function offsetForZone(timeZone, instant) {
    try {
        const formatter = new Intl.DateTimeFormat("en-US", {
            timeZone,
            timeZoneName: "longOffset",
        });
        const tzName = formatter.formatToParts(instant).find((part) => part.type === "timeZoneName")?.value ?? "GMT";
        const match = tzName.match(/GMT([+-]\d{1,2})(?::?(\d{2}))?/);
        const hourPart = match?.[1];
        if (!hourPart) {
            return "+00:00";
        }
        const sign = hourPart.startsWith("-") ? "-" : "+";
        const hours = hourPart.replace(/[+-]/, "").padStart(2, "0");
        const minutes = (match?.[2] ?? "00").padStart(2, "0");
        return `${sign}${hours}:${minutes}`;
    }
    catch {
        return "+00:00";
    }
}
// Builds an RFC3339 datetime from plain date + time parts interpreted as wall
// clock time in the given IANA zone. e.g. ("2026-05-31","07:30","Asia/Ho_Chi_Minh")
// -> "2026-05-31T07:30:00+07:00".
function buildRfc3339(date, time, timeZone) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        throw new Error("Field 'startDate' must be in YYYY-MM-DD format.");
    }
    if (!/^\d{2}:\d{2}$/.test(time)) {
        throw new Error("Field 'startTime' must be in HH:mm (24h) format.");
    }
    const base = `${date}T${time}:00`;
    const reference = new Date(`${base}Z`);
    if (Number.isNaN(reference.getTime())) {
        throw new Error("Invalid startDate/startTime combination.");
    }
    return `${base}${offsetForZone(timeZone, reference)}`;
}
// Resolves the start/end RFC3339 values from either explicit *DateTime fields or
// the structured startDate/startTime/durationMinutes fields.
function resolveEventWindow(args, timeZone) {
    const explicitStart = getOptionalStringField(args, "startDateTime");
    const explicitEnd = getOptionalStringField(args, "endDateTime");
    if (explicitStart && explicitEnd) {
        return { startDateTime: explicitStart, endDateTime: explicitEnd };
    }
    const startDate = getOptionalStringField(args, "startDate");
    const startTime = getOptionalStringField(args, "startTime");
    if (startDate && startTime) {
        const startDateTime = buildRfc3339(startDate, startTime, timeZone);
        const durationMinutes = getOptionalPositiveNumber(args, "durationMinutes", 60);
        const endInstant = new Date(new Date(startDateTime).getTime() + durationMinutes * 60_000);
        const offset = offsetForZone(timeZone, endInstant);
        // Shift the UTC instant by the offset so the UTC accessors read wall-clock time.
        const offsetMinutes = (offset.startsWith("-") ? -1 : 1) *
            (Number(offset.slice(1, 3)) * 60 + Number(offset.slice(4, 6)));
        const wall = new Date(endInstant.getTime() + offsetMinutes * 60_000);
        const pad = (n) => String(n).padStart(2, "0");
        const endDate = `${wall.getUTCFullYear()}-${pad(wall.getUTCMonth() + 1)}-${pad(wall.getUTCDate())}`;
        const endTime = `${pad(wall.getUTCHours())}:${pad(wall.getUTCMinutes())}`;
        const endDateTime = `${endDate}T${endTime}:00${offset}`;
        return { startDateTime, endDateTime };
    }
    throw new Error("Provide either startDateTime+endDateTime (RFC3339) or startDate (YYYY-MM-DD)+startTime (HH:mm).");
}
// Finds events overlapping [timeMin, timeMax] excluding the event being edited
// (and excluding cancelled instances). Used for the update conflict guard, where
// freebusy cannot exclude the event from its own busy block.
async function findOverlappingEvents(calendar, calendarId, timeMin, timeMax, excludeEventId) {
    const response = await calendar.events.list({
        calendarId,
        timeMin,
        timeMax,
        singleEvents: true,
        orderBy: "startTime",
    });
    return (response.data.items ?? []).filter((item) => item.status !== "cancelled" &&
        item.id !== excludeEventId &&
        item.recurringEventId !== excludeEventId);
}
function getCalendarIds(args) {
    const value = args?.calendarIds;
    if (value === undefined || value === null) {
        return ["primary"];
    }
    if (!Array.isArray(value)) {
        throw new Error("Field 'calendarIds' must be an array of strings.");
    }
    const ids = value
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter((item) => item.length > 0);
    if (ids.length === 0) {
        throw new Error("Field 'calendarIds' must contain at least one non-empty string.");
    }
    return ids;
}
export async function handleListUpcomingEvents(args) {
    try {
        const calendarId = getCalendarId(args);
        const daysAhead = getOptionalPositiveNumber(args, "daysAhead", 7);
        const now = new Date();
        const timeMax = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
        const calendar = getCalendarClient();
        const response = await calendar.events.list({
            calendarId,
            timeMin: now.toISOString(),
            timeMax: timeMax.toISOString(),
            singleEvents: true,
            orderBy: "startTime",
        });
        const events = (response.data.items ?? []).map(mapCalendarEvent);
        return jsonResult(events);
    }
    catch (error) {
        return errorResult(error);
    }
}
export async function handleSearchCalendarEvents(args) {
    try {
        const calendarId = getCalendarId(args);
        const query = getRequiredString(args, "query");
        const daysAhead = getOptionalPositiveNumber(args, "daysAhead", 30);
        const limit = getOptionalPositiveNumber(args, "limit", 20);
        const now = new Date();
        const timeMax = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
        const calendar = getCalendarClient();
        const response = await calendar.events.list({
            calendarId,
            q: query,
            timeMin: now.toISOString(),
            timeMax: timeMax.toISOString(),
            singleEvents: true,
            orderBy: "startTime",
            maxResults: limit,
        });
        const events = (response.data.items ?? []).map(mapCalendarEvent);
        return jsonResult(events);
    }
    catch (error) {
        return errorResult(error);
    }
}
export async function handleListCalendars(args) {
    try {
        const limit = getOptionalPositiveNumber(args, "limit", 50);
        const calendar = getCalendarClient();
        const response = await calendar.calendarList.list({ maxResults: limit });
        const calendars = (response.data.items ?? []).map(mapCalendarListEntry);
        return jsonResult(calendars);
    }
    catch (error) {
        return errorResult(error);
    }
}
export async function handleCheckFreeBusy(args) {
    try {
        const timeMin = getRequiredString(args, "timeMin");
        const timeMax = getRequiredString(args, "timeMax");
        const calendarIds = getCalendarIds(args);
        const timeZone = getTimeZone(args);
        const calendar = getCalendarClient();
        const response = await calendar.freebusy.query({
            requestBody: {
                timeMin,
                timeMax,
                timeZone,
                items: calendarIds.map((id) => ({ id })),
            },
        });
        const calendarsData = response.data.calendars ?? {};
        const calendars = calendarIds.map((id) => {
            const entry = calendarsData[id];
            return {
                calendarId: id,
                busy: (entry?.busy ?? []).map((slot) => ({
                    start: slot.start ?? "",
                    end: slot.end ?? "",
                })),
                errors: (entry?.errors ?? []).map((err) => err.reason ?? "unknown"),
            };
        });
        return jsonResult({
            timeMin: response.data.timeMin ?? timeMin,
            timeMax: response.data.timeMax ?? timeMax,
            calendars,
        });
    }
    catch (error) {
        return errorResult(error);
    }
}
export async function handleGetCalendarEvent(args) {
    try {
        const calendarId = getCalendarId(args);
        const eventId = getRequiredString(args, "eventId");
        const etag = getOptionalEtag(args);
        const calendar = getCalendarClient();
        const requestOptions = etag ? { headers: ifNoneMatchHeaders(etag) } : undefined;
        try {
            const response = await calendar.events.get({ calendarId, eventId }, requestOptions);
            return jsonResult(mapCalendarEvent(response.data));
        }
        catch (error) {
            if (etag && getHttpStatus(error) === 304) {
                return jsonResult({
                    notModified: true,
                    message: "Event has not changed since the provided etag.",
                    eventId,
                    etag,
                });
            }
            throw error;
        }
    }
    catch (error) {
        return errorResult(error);
    }
}
export async function handleCreateCalendarEvent(args) {
    try {
        const calendarId = getCalendarId(args);
        const summary = getRequiredString(args, "summary");
        const timeZone = getTimeZone(args);
        const { startDateTime, endDateTime } = resolveEventWindow(args, timeZone);
        const description = getOptionalStringField(args, "description");
        const location = getOptionalStringField(args, "location");
        const calendar = getCalendarClient();
        const requestBody = {
            summary,
            start: buildDateTimeField(startDateTime, timeZone),
            end: buildDateTimeField(endDateTime, timeZone),
        };
        if (description) {
            requestBody.description = description;
        }
        if (location) {
            requestBody.location = location;
        }
        // Conflict guard: by default, refuse to create when the slot overlaps an
        // existing busy block. Pass allowConflict=true to override.
        const allowConflict = args?.allowConflict === true;
        if (!allowConflict) {
            const freeBusy = await calendar.freebusy.query({
                requestBody: {
                    timeMin: startDateTime,
                    timeMax: endDateTime,
                    timeZone,
                    items: [{ id: calendarId }],
                },
            });
            const busy = freeBusy.data.calendars?.[calendarId]?.busy ?? [];
            if (busy.length > 0) {
                return jsonResult({
                    conflict: true,
                    created: false,
                    message: "Khung gio bi trung voi su kien hien co. Event CHUA duoc tao. Hay chon gio khac, hoac truyen allowConflict=true de van tao.",
                    requested: { start: startDateTime, end: endDateTime, calendarId },
                    busy: busy.map((slot) => ({ start: slot.start ?? "", end: slot.end ?? "" })),
                });
            }
        }
        const response = await calendar.events.insert({ calendarId, requestBody });
        return jsonResult(mapCalendarEvent(response.data));
    }
    catch (error) {
        return errorResult(error);
    }
}
export async function handleUpdateCalendarEvent(args) {
    try {
        const calendarId = getCalendarId(args);
        const eventId = getRequiredString(args, "eventId");
        const etag = getOptionalEtag(args);
        const calendar = getCalendarClient();
        const existing = await calendar.events.get({ calendarId, eventId });
        const requestBody = { ...existing.data };
        const summary = getOptionalStringField(args, "summary");
        const description = getOptionalStringField(args, "description");
        const location = getOptionalStringField(args, "location");
        const startDateTime = getOptionalStringField(args, "startDateTime");
        const endDateTime = getOptionalStringField(args, "endDateTime");
        const startDate = getOptionalStringField(args, "startDate");
        const startTime = getOptionalStringField(args, "startTime");
        if (summary !== undefined) {
            requestBody.summary = summary;
        }
        if (description !== undefined) {
            requestBody.description = description;
        }
        if (location !== undefined) {
            requestBody.location = location;
        }
        // Time changes: prefer structured startDate/startTime (server builds RFC3339);
        // fall back to explicit startDateTime/endDateTime.
        const hasStructuredTime = startDate !== undefined && startTime !== undefined;
        const hasExplicitTime = startDateTime !== undefined || endDateTime !== undefined;
        if (hasStructuredTime) {
            const timeZone = getTimeZone(args);
            const window = resolveEventWindow(args, timeZone);
            requestBody.start = buildDateTimeField(window.startDateTime, timeZone);
            requestBody.end = buildDateTimeField(window.endDateTime, timeZone);
        }
        else if (hasExplicitTime) {
            const timeZone = getTimeZone(args);
            if (startDateTime !== undefined) {
                requestBody.start = buildDateTimeField(startDateTime, timeZone);
            }
            if (endDateTime !== undefined) {
                requestBody.end = buildDateTimeField(endDateTime, timeZone);
            }
        }
        const hasFieldUpdates = summary !== undefined ||
            description !== undefined ||
            location !== undefined ||
            hasStructuredTime ||
            hasExplicitTime;
        if (!hasFieldUpdates) {
            throw new Error("Provide at least one field to update (summary, description, location, startDate+startTime, or startDateTime/endDateTime).");
        }
        // Conflict guard: when the time changes, refuse to move the event onto a slot
        // that overlaps a DIFFERENT existing event. Pass allowConflict=true to override.
        const allowConflict = args?.allowConflict === true;
        const timeChanged = hasStructuredTime || hasExplicitTime;
        const newStart = requestBody.start?.dateTime;
        const newEnd = requestBody.end?.dateTime;
        if (timeChanged && !allowConflict && newStart && newEnd) {
            const overlaps = await findOverlappingEvents(calendar, calendarId, newStart, newEnd, eventId);
            if (overlaps.length > 0) {
                return jsonResult({
                    conflict: true,
                    updated: false,
                    message: "Khung gio moi bi trung voi su kien khac. Event CHUA duoc cap nhat. Hay chon gio khac, hoac truyen allowConflict=true de van doi.",
                    requested: { start: newStart, end: newEnd, calendarId },
                    busy: overlaps.map((item) => ({
                        id: item.id ?? "",
                        summary: item.summary ?? "(No title)",
                        start: item.start?.dateTime ?? item.start?.date ?? "",
                        end: item.end?.dateTime ?? item.end?.date ?? "",
                    })),
                });
            }
        }
        const requestOptions = etag ? { headers: ifMatchHeaders(etag) } : undefined;
        try {
            const response = await calendar.events.update({ calendarId, eventId, requestBody }, requestOptions);
            return jsonResult(mapCalendarEvent(response.data));
        }
        catch (error) {
            if (etag && getHttpStatus(error) === 412) {
                return jsonResult({
                    error: "precondition_failed",
                    httpStatus: 412,
                    message: "Event was modified on the server since the provided etag. Re-fetch with get_calendar_event and retry.",
                    eventId,
                    etag,
                });
            }
            throw error;
        }
    }
    catch (error) {
        return errorResult(error);
    }
}
export async function handleDeleteEventsInRange(args) {
    try {
        const calendarId = getCalendarId(args);
        const timeMin = getRequiredString(args, "timeMin");
        const timeMax = getRequiredString(args, "timeMax");
        const calendar = getCalendarClient();
        const listResponse = await calendar.events.list({
            calendarId,
            timeMin,
            timeMax,
            singleEvents: true,
            orderBy: "startTime",
            maxResults: 2500,
        });
        const items = listResponse.data.items ?? [];
        const deleted = [];
        const failed = [];
        for (const item of items) {
            const id = item.id ?? "";
            if (!id) {
                continue;
            }
            try {
                await calendar.events.delete({ calendarId, eventId: id });
                deleted.push({
                    id,
                    summary: item.summary ?? "(No title)",
                    start: item.start?.dateTime ?? item.start?.date ?? "",
                });
            }
            catch (error) {
                failed.push({ id, reason: error instanceof Error ? error.message : String(error) });
            }
        }
        return jsonResult({
            calendarId,
            range: { timeMin, timeMax },
            deletedCount: deleted.length,
            failedCount: failed.length,
            deleted,
            failed,
        });
    }
    catch (error) {
        return errorResult(error);
    }
}
export async function handleDeleteCalendarEvent(args) {
    try {
        const calendarId = getCalendarId(args);
        const eventId = getRequiredString(args, "eventId");
        const etag = getOptionalEtag(args);
        const calendar = getCalendarClient();
        const requestOptions = etag ? { headers: ifMatchHeaders(etag) } : undefined;
        try {
            await calendar.events.delete({ calendarId, eventId }, requestOptions);
            return jsonResult({ deleted: true, eventId, calendarId });
        }
        catch (error) {
            if (etag && getHttpStatus(error) === 412) {
                return jsonResult({
                    error: "precondition_failed",
                    httpStatus: 412,
                    message: "Event was modified on the server since the provided etag. Re-fetch before deleting.",
                    eventId,
                    etag,
                });
            }
            throw error;
        }
    }
    catch (error) {
        return errorResult(error);
    }
}
