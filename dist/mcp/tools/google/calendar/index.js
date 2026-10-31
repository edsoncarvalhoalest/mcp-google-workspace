import { CHECK_FREE_BUSY_TOOL_DEFINITION, CREATE_CALENDAR_EVENT_TOOL_DEFINITION, DELETE_CALENDAR_EVENT_TOOL_DEFINITION, DELETE_EVENTS_IN_RANGE_TOOL_DEFINITION, GET_CALENDAR_EVENT_TOOL_DEFINITION, LIST_CALENDARS_TOOL_DEFINITION, LIST_UPCOMING_EVENTS_TOOL_DEFINITION, SEARCH_CALENDAR_EVENTS_TOOL_DEFINITION, UPDATE_CALENDAR_EVENT_TOOL_DEFINITION, } from "./definitions.js";
import { handleCheckFreeBusy, handleCreateCalendarEvent, handleDeleteCalendarEvent, handleDeleteEventsInRange, handleGetCalendarEvent, handleListCalendars, handleListUpcomingEvents, handleSearchCalendarEvents, handleUpdateCalendarEvent, } from "./handlers.js";
export const CALENDAR_TOOL_MODULES = [
    {
        owner: "google-calendar",
        authMode: "personal",
        definition: LIST_UPCOMING_EVENTS_TOOL_DEFINITION,
        handler: handleListUpcomingEvents,
    },
    {
        owner: "google-calendar",
        authMode: "personal",
        definition: SEARCH_CALENDAR_EVENTS_TOOL_DEFINITION,
        handler: handleSearchCalendarEvents,
    },
    {
        owner: "google-calendar",
        authMode: "personal",
        definition: LIST_CALENDARS_TOOL_DEFINITION,
        handler: handleListCalendars,
    },
    {
        owner: "google-calendar",
        authMode: "personal",
        definition: CHECK_FREE_BUSY_TOOL_DEFINITION,
        handler: handleCheckFreeBusy,
    },
    {
        owner: "google-calendar",
        authMode: "personal",
        definition: GET_CALENDAR_EVENT_TOOL_DEFINITION,
        handler: handleGetCalendarEvent,
    },
    {
        owner: "google-calendar",
        authMode: "personal",
        definition: CREATE_CALENDAR_EVENT_TOOL_DEFINITION,
        handler: handleCreateCalendarEvent,
    },
    {
        owner: "google-calendar",
        authMode: "personal",
        definition: UPDATE_CALENDAR_EVENT_TOOL_DEFINITION,
        handler: handleUpdateCalendarEvent,
    },
    {
        owner: "google-calendar",
        authMode: "personal",
        definition: DELETE_CALENDAR_EVENT_TOOL_DEFINITION,
        handler: handleDeleteCalendarEvent,
    },
    {
        owner: "google-calendar",
        authMode: "personal",
        definition: DELETE_EVENTS_IN_RANGE_TOOL_DEFINITION,
        handler: handleDeleteEventsInRange,
    },
];
