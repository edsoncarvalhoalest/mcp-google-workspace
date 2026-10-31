const CALENDAR_ID_PROPERTY = {
    type: "string",
    description: 'Calendar ID. Defaults to "primary".',
};
const ETAG_PROPERTY = {
    type: "string",
    description: "Resource etag from a previous retrieval. Used for optimistic concurrency (If-Match on writes, If-None-Match on reads).",
};
export const LIST_UPCOMING_EVENTS_TOOL_DEFINITION = {
    name: "list_upcoming_events",
    description: "List upcoming events from a Google Calendar.",
    inputSchema: {
        type: "object",
        properties: {
            calendarId: CALENDAR_ID_PROPERTY,
            daysAhead: {
                type: "number",
                description: "How many days ahead to search for events.",
                default: 7,
            },
        },
    },
};
export const SEARCH_CALENDAR_EVENTS_TOOL_DEFINITION = {
    name: "search_calendar_events",
    description: "Search calendar events by free-text query within a time window.",
    inputSchema: {
        type: "object",
        properties: {
            calendarId: CALENDAR_ID_PROPERTY,
            query: {
                type: "string",
                description: "Free-text search query (Calendar events.list q).",
            },
            daysAhead: {
                type: "number",
                description: "How many days ahead to search for events.",
                default: 30,
            },
            limit: {
                type: "number",
                description: "Maximum number of events to return.",
                default: 20,
            },
        },
        required: ["query"],
    },
};
export const LIST_CALENDARS_TOOL_DEFINITION = {
    name: "list_calendars",
    description: "List the user's calendars (from calendarList) with their IDs, so the agent can target the right calendar before reading or writing events.",
    inputSchema: {
        type: "object",
        properties: {
            limit: {
                type: "number",
                description: "Maximum number of calendars to return.",
                default: 50,
            },
        },
    },
};
export const CHECK_FREE_BUSY_TOOL_DEFINITION = {
    name: "check_free_busy",
    description: "Query busy time blocks for one or more calendars within a time window (Calendar freebusy.query). Use this before creating an event to avoid conflicts and to find mutual free slots.",
    inputSchema: {
        type: "object",
        properties: {
            timeMin: {
                type: "string",
                description: "Window start in RFC3339 format (e.g. 2026-06-01T09:00:00+07:00).",
            },
            timeMax: {
                type: "string",
                description: "Window end in RFC3339 format.",
            },
            calendarIds: {
                type: "array",
                items: { type: "string" },
                description: 'Calendar IDs to inspect. Defaults to ["primary"].',
            },
            timeZone: {
                type: "string",
                description: 'IANA time zone for the query (e.g. "Asia/Ho_Chi_Minh"). Defaults to UTC.',
            },
        },
        required: ["timeMin", "timeMax"],
    },
};
export const GET_CALENDAR_EVENT_TOOL_DEFINITION = {
    name: "get_calendar_event",
    description: "Get a single calendar event by ID. Optionally pass etag for conditional retrieval (If-None-Match): returns notModified when the event is unchanged.",
    inputSchema: {
        type: "object",
        properties: {
            calendarId: CALENDAR_ID_PROPERTY,
            eventId: {
                type: "string",
                description: "Event ID from Google Calendar.",
            },
            etag: ETAG_PROPERTY,
        },
        required: ["eventId"],
    },
};
export const CREATE_CALENDAR_EVENT_TOOL_DEFINITION = {
    name: "create_calendar_event",
    description: "Create a new event on a Google Calendar. PREFERRED: pass startDate (YYYY-MM-DD) + startTime (HH:mm) + durationMinutes and let the server build the exact timestamp - this avoids date/offset mistakes. Advanced callers may pass startDateTime+endDateTime in RFC3339 instead. By default it checks for conflicts and will NOT create when the time slot overlaps an existing event (returns conflict: true).",
    inputSchema: {
        type: "object",
        properties: {
            calendarId: CALENDAR_ID_PROPERTY,
            allowConflict: {
                type: "boolean",
                description: "If true, create the event even when the time slot overlaps existing events. Default: false (returns a conflict warning instead of creating).",
            },
            summary: {
                type: "string",
                description: "Event title.",
            },
            description: {
                type: "string",
                description: "Event description.",
            },
            location: {
                type: "string",
                description: "Event location.",
            },
            startDate: {
                type: "string",
                description: "PREFERRED. Calendar date as YYYY-MM-DD (e.g. 2026-05-31). Interpreted in timeZone.",
            },
            startTime: {
                type: "string",
                description: "PREFERRED. Start time as HH:mm 24h (e.g. 07:30). Interpreted in timeZone.",
            },
            durationMinutes: {
                type: "number",
                description: "Event length in minutes when using startDate/startTime. Defaults to 60.",
            },
            startDateTime: {
                type: "string",
                description: "Advanced. Full start time in RFC3339 (e.g. 2026-05-31T07:30:00+07:00). Use only if you are certain of the offset; otherwise prefer startDate+startTime.",
            },
            endDateTime: {
                type: "string",
                description: "Advanced. Full end time in RFC3339. Required if startDateTime is used.",
            },
            timeZone: {
                type: "string",
                description: 'IANA time zone for start/end (e.g. "Asia/Ho_Chi_Minh"). Defaults to UTC.',
            },
        },
        required: ["summary"],
    },
};
export const UPDATE_CALENDAR_EVENT_TOOL_DEFINITION = {
    name: "update_calendar_event",
    description: "Update an existing calendar event. To change the time, PREFERRED: pass startDate (YYYY-MM-DD) + startTime (HH:mm) + durationMinutes and let the server build the timestamp. When the time changes it checks for conflicts with OTHER events and will NOT update on overlap (returns conflict: true) unless allowConflict is true. Pass etag for conditional modification (If-Match): fails with precondition_failed (412) if the event changed on the server.",
    inputSchema: {
        type: "object",
        properties: {
            calendarId: CALENDAR_ID_PROPERTY,
            eventId: {
                type: "string",
                description: "Event ID to update.",
            },
            allowConflict: {
                type: "boolean",
                description: "If true, move the event even when the new time slot overlaps other events. Default: false (returns a conflict warning instead of updating).",
            },
            etag: ETAG_PROPERTY,
            summary: { type: "string", description: "New title." },
            description: { type: "string", description: "New description." },
            location: { type: "string", description: "New location." },
            startDate: {
                type: "string",
                description: "PREFERRED. New calendar date as YYYY-MM-DD. Interpreted in timeZone.",
            },
            startTime: {
                type: "string",
                description: "PREFERRED. New start time as HH:mm 24h. Interpreted in timeZone.",
            },
            durationMinutes: {
                type: "number",
                description: "Event length in minutes when using startDate/startTime. Defaults to 60.",
            },
            startDateTime: {
                type: "string",
                description: "Advanced. New start time in RFC3339 format. Prefer startDate+startTime instead.",
            },
            endDateTime: {
                type: "string",
                description: "Advanced. New end time in RFC3339 format.",
            },
            timeZone: {
                type: "string",
                description: 'IANA time zone when setting start/end. Defaults to UTC.',
            },
        },
        required: ["eventId"],
    },
};
export const DELETE_EVENTS_IN_RANGE_TOOL_DEFINITION = {
    name: "delete_events_in_range",
    description: "Delete ALL events within a time window (e.g. clear a whole day). Returns the list of deleted events and any failures. Use this when the user asks to remove all events of a day/period.",
    inputSchema: {
        type: "object",
        properties: {
            calendarId: CALENDAR_ID_PROPERTY,
            timeMin: {
                type: "string",
                description: "Window start in RFC3339 format (e.g. 2026-05-31T00:00:00+07:00).",
            },
            timeMax: {
                type: "string",
                description: "Window end in RFC3339 format (e.g. 2026-05-31T23:59:59+07:00).",
            },
        },
        required: ["timeMin", "timeMax"],
    },
};
export const DELETE_CALENDAR_EVENT_TOOL_DEFINITION = {
    name: "delete_calendar_event",
    description: "Delete a calendar event. Pass etag for conditional deletion (If-Match): fails with precondition_failed (412) if the event changed on the server.",
    inputSchema: {
        type: "object",
        properties: {
            calendarId: CALENDAR_ID_PROPERTY,
            eventId: {
                type: "string",
                description: "Event ID to delete.",
            },
            etag: ETAG_PROPERTY,
        },
        required: ["eventId"],
    },
};
