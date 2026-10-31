import type { ToolArgs } from "../../types.js";
export declare function handleListUpcomingEvents(args: ToolArgs): Promise<{
    [x: string]: unknown;
    content: ({
        type: "text";
        text: string;
        annotations?: {
            audience?: ("user" | "assistant")[] | undefined;
            priority?: number | undefined;
            lastModified?: string | undefined;
        } | undefined;
        _meta?: {
            [x: string]: unknown;
        } | undefined;
    } | {
        type: "image";
        data: string;
        mimeType: string;
        annotations?: {
            audience?: ("user" | "assistant")[] | undefined;
            priority?: number | undefined;
            lastModified?: string | undefined;
        } | undefined;
        _meta?: {
            [x: string]: unknown;
        } | undefined;
    } | {
        type: "audio";
        data: string;
        mimeType: string;
        annotations?: {
            audience?: ("user" | "assistant")[] | undefined;
            priority?: number | undefined;
            lastModified?: string | undefined;
        } | undefined;
        _meta?: {
            [x: string]: unknown;
        } | undefined;
    } | {
        uri: string;
        name: string;
        type: "resource_link";
        description?: string | undefined;
        mimeType?: string | undefined;
        size?: number | undefined;
        annotations?: {
            audience?: ("user" | "assistant")[] | undefined;
            priority?: number | undefined;
            lastModified?: string | undefined;
        } | undefined;
        _meta?: {
            [x: string]: unknown;
        } | undefined;
        icons?: {
            src: string;
            mimeType?: string | undefined;
            sizes?: string[] | undefined;
            theme?: "light" | "dark" | undefined;
        }[] | undefined;
        title?: string | undefined;
    } | {
        type: "resource";
        resource: {
            uri: string;
            text: string;
            mimeType?: string | undefined;
            _meta?: {
                [x: string]: unknown;
            } | undefined;
        } | {
            uri: string;
            blob: string;
            mimeType?: string | undefined;
            _meta?: {
                [x: string]: unknown;
            } | undefined;
        };
        annotations?: {
            audience?: ("user" | "assistant")[] | undefined;
            priority?: number | undefined;
            lastModified?: string | undefined;
        } | undefined;
        _meta?: {
            [x: string]: unknown;
        } | undefined;
    })[];
    _meta?: {
        [x: string]: unknown;
        progressToken?: string | number | undefined;
        "io.modelcontextprotocol/related-task"?: {
            taskId: string;
        } | undefined;
    } | undefined;
    structuredContent?: {
        [x: string]: unknown;
    } | undefined;
    isError?: boolean | undefined;
}>;
export declare function handleSearchCalendarEvents(args: ToolArgs): Promise<{
    [x: string]: unknown;
    content: ({
        type: "text";
        text: string;
        annotations?: {
            audience?: ("user" | "assistant")[] | undefined;
            priority?: number | undefined;
            lastModified?: string | undefined;
        } | undefined;
        _meta?: {
            [x: string]: unknown;
        } | undefined;
    } | {
        type: "image";
        data: string;
        mimeType: string;
        annotations?: {
            audience?: ("user" | "assistant")[] | undefined;
            priority?: number | undefined;
            lastModified?: string | undefined;
        } | undefined;
        _meta?: {
            [x: string]: unknown;
        } | undefined;
    } | {
        type: "audio";
        data: string;
        mimeType: string;
        annotations?: {
            audience?: ("user" | "assistant")[] | undefined;
            priority?: number | undefined;
            lastModified?: string | undefined;
        } | undefined;
        _meta?: {
            [x: string]: unknown;
        } | undefined;
    } | {
        uri: string;
        name: string;
        type: "resource_link";
        description?: string | undefined;
        mimeType?: string | undefined;
        size?: number | undefined;
        annotations?: {
            audience?: ("user" | "assistant")[] | undefined;
            priority?: number | undefined;
            lastModified?: string | undefined;
        } | undefined;
        _meta?: {
            [x: string]: unknown;
        } | undefined;
        icons?: {
            src: string;
            mimeType?: string | undefined;
            sizes?: string[] | undefined;
            theme?: "light" | "dark" | undefined;
        }[] | undefined;
        title?: string | undefined;
    } | {
        type: "resource";
        resource: {
            uri: string;
            text: string;
            mimeType?: string | undefined;
            _meta?: {
                [x: string]: unknown;
            } | undefined;
        } | {
            uri: string;
            blob: string;
            mimeType?: string | undefined;
            _meta?: {
                [x: string]: unknown;
            } | undefined;
        };
        annotations?: {
            audience?: ("user" | "assistant")[] | undefined;
            priority?: number | undefined;
            lastModified?: string | undefined;
        } | undefined;
        _meta?: {
            [x: string]: unknown;
        } | undefined;
    })[];
    _meta?: {
        [x: string]: unknown;
        progressToken?: string | number | undefined;
        "io.modelcontextprotocol/related-task"?: {
            taskId: string;
        } | undefined;
    } | undefined;
    structuredContent?: {
        [x: string]: unknown;
    } | undefined;
    isError?: boolean | undefined;
}>;
export declare function handleListCalendars(args: ToolArgs): Promise<{
    [x: string]: unknown;
    content: ({
        type: "text";
        text: string;
        annotations?: {
            audience?: ("user" | "assistant")[] | undefined;
            priority?: number | undefined;
            lastModified?: string | undefined;
        } | undefined;
        _meta?: {
            [x: string]: unknown;
        } | undefined;
    } | {
        type: "image";
        data: string;
        mimeType: string;
        annotations?: {
            audience?: ("user" | "assistant")[] | undefined;
            priority?: number | undefined;
            lastModified?: string | undefined;
        } | undefined;
        _meta?: {
            [x: string]: unknown;
        } | undefined;
    } | {
        type: "audio";
        data: string;
        mimeType: string;
        annotations?: {
            audience?: ("user" | "assistant")[] | undefined;
            priority?: number | undefined;
            lastModified?: string | undefined;
        } | undefined;
        _meta?: {
            [x: string]: unknown;
        } | undefined;
    } | {
        uri: string;
        name: string;
        type: "resource_link";
        description?: string | undefined;
        mimeType?: string | undefined;
        size?: number | undefined;
        annotations?: {
            audience?: ("user" | "assistant")[] | undefined;
            priority?: number | undefined;
            lastModified?: string | undefined;
        } | undefined;
        _meta?: {
            [x: string]: unknown;
        } | undefined;
        icons?: {
            src: string;
            mimeType?: string | undefined;
            sizes?: string[] | undefined;
            theme?: "light" | "dark" | undefined;
        }[] | undefined;
        title?: string | undefined;
    } | {
        type: "resource";
        resource: {
            uri: string;
            text: string;
            mimeType?: string | undefined;
            _meta?: {
                [x: string]: unknown;
            } | undefined;
        } | {
            uri: string;
            blob: string;
            mimeType?: string | undefined;
            _meta?: {
                [x: string]: unknown;
            } | undefined;
        };
        annotations?: {
            audience?: ("user" | "assistant")[] | undefined;
            priority?: number | undefined;
            lastModified?: string | undefined;
        } | undefined;
        _meta?: {
            [x: string]: unknown;
        } | undefined;
    })[];
    _meta?: {
        [x: string]: unknown;
        progressToken?: string | number | undefined;
        "io.modelcontextprotocol/related-task"?: {
            taskId: string;
        } | undefined;
    } | undefined;
    structuredContent?: {
        [x: string]: unknown;
    } | undefined;
    isError?: boolean | undefined;
}>;
export declare function handleCheckFreeBusy(args: ToolArgs): Promise<{
    [x: string]: unknown;
    content: ({
        type: "text";
        text: string;
        annotations?: {
            audience?: ("user" | "assistant")[] | undefined;
            priority?: number | undefined;
            lastModified?: string | undefined;
        } | undefined;
        _meta?: {
            [x: string]: unknown;
        } | undefined;
    } | {
        type: "image";
        data: string;
        mimeType: string;
        annotations?: {
            audience?: ("user" | "assistant")[] | undefined;
            priority?: number | undefined;
            lastModified?: string | undefined;
        } | undefined;
        _meta?: {
            [x: string]: unknown;
        } | undefined;
    } | {
        type: "audio";
        data: string;
        mimeType: string;
        annotations?: {
            audience?: ("user" | "assistant")[] | undefined;
            priority?: number | undefined;
            lastModified?: string | undefined;
        } | undefined;
        _meta?: {
            [x: string]: unknown;
        } | undefined;
    } | {
        uri: string;
        name: string;
        type: "resource_link";
        description?: string | undefined;
        mimeType?: string | undefined;
        size?: number | undefined;
        annotations?: {
            audience?: ("user" | "assistant")[] | undefined;
            priority?: number | undefined;
            lastModified?: string | undefined;
        } | undefined;
        _meta?: {
            [x: string]: unknown;
        } | undefined;
        icons?: {
            src: string;
            mimeType?: string | undefined;
            sizes?: string[] | undefined;
            theme?: "light" | "dark" | undefined;
        }[] | undefined;
        title?: string | undefined;
    } | {
        type: "resource";
        resource: {
            uri: string;
            text: string;
            mimeType?: string | undefined;
            _meta?: {
                [x: string]: unknown;
            } | undefined;
        } | {
            uri: string;
            blob: string;
            mimeType?: string | undefined;
            _meta?: {
                [x: string]: unknown;
            } | undefined;
        };
        annotations?: {
            audience?: ("user" | "assistant")[] | undefined;
            priority?: number | undefined;
            lastModified?: string | undefined;
        } | undefined;
        _meta?: {
            [x: string]: unknown;
        } | undefined;
    })[];
    _meta?: {
        [x: string]: unknown;
        progressToken?: string | number | undefined;
        "io.modelcontextprotocol/related-task"?: {
            taskId: string;
        } | undefined;
    } | undefined;
    structuredContent?: {
        [x: string]: unknown;
    } | undefined;
    isError?: boolean | undefined;
}>;
export declare function handleGetCalendarEvent(args: ToolArgs): Promise<{
    [x: string]: unknown;
    content: ({
        type: "text";
        text: string;
        annotations?: {
            audience?: ("user" | "assistant")[] | undefined;
            priority?: number | undefined;
            lastModified?: string | undefined;
        } | undefined;
        _meta?: {
            [x: string]: unknown;
        } | undefined;
    } | {
        type: "image";
        data: string;
        mimeType: string;
        annotations?: {
            audience?: ("user" | "assistant")[] | undefined;
            priority?: number | undefined;
            lastModified?: string | undefined;
        } | undefined;
        _meta?: {
            [x: string]: unknown;
        } | undefined;
    } | {
        type: "audio";
        data: string;
        mimeType: string;
        annotations?: {
            audience?: ("user" | "assistant")[] | undefined;
            priority?: number | undefined;
            lastModified?: string | undefined;
        } | undefined;
        _meta?: {
            [x: string]: unknown;
        } | undefined;
    } | {
        uri: string;
        name: string;
        type: "resource_link";
        description?: string | undefined;
        mimeType?: string | undefined;
        size?: number | undefined;
        annotations?: {
            audience?: ("user" | "assistant")[] | undefined;
            priority?: number | undefined;
            lastModified?: string | undefined;
        } | undefined;
        _meta?: {
            [x: string]: unknown;
        } | undefined;
        icons?: {
            src: string;
            mimeType?: string | undefined;
            sizes?: string[] | undefined;
            theme?: "light" | "dark" | undefined;
        }[] | undefined;
        title?: string | undefined;
    } | {
        type: "resource";
        resource: {
            uri: string;
            text: string;
            mimeType?: string | undefined;
            _meta?: {
                [x: string]: unknown;
            } | undefined;
        } | {
            uri: string;
            blob: string;
            mimeType?: string | undefined;
            _meta?: {
                [x: string]: unknown;
            } | undefined;
        };
        annotations?: {
            audience?: ("user" | "assistant")[] | undefined;
            priority?: number | undefined;
            lastModified?: string | undefined;
        } | undefined;
        _meta?: {
            [x: string]: unknown;
        } | undefined;
    })[];
    _meta?: {
        [x: string]: unknown;
        progressToken?: string | number | undefined;
        "io.modelcontextprotocol/related-task"?: {
            taskId: string;
        } | undefined;
    } | undefined;
    structuredContent?: {
        [x: string]: unknown;
    } | undefined;
    isError?: boolean | undefined;
}>;
export declare function handleCreateCalendarEvent(args: ToolArgs): Promise<{
    [x: string]: unknown;
    content: ({
        type: "text";
        text: string;
        annotations?: {
            audience?: ("user" | "assistant")[] | undefined;
            priority?: number | undefined;
            lastModified?: string | undefined;
        } | undefined;
        _meta?: {
            [x: string]: unknown;
        } | undefined;
    } | {
        type: "image";
        data: string;
        mimeType: string;
        annotations?: {
            audience?: ("user" | "assistant")[] | undefined;
            priority?: number | undefined;
            lastModified?: string | undefined;
        } | undefined;
        _meta?: {
            [x: string]: unknown;
        } | undefined;
    } | {
        type: "audio";
        data: string;
        mimeType: string;
        annotations?: {
            audience?: ("user" | "assistant")[] | undefined;
            priority?: number | undefined;
            lastModified?: string | undefined;
        } | undefined;
        _meta?: {
            [x: string]: unknown;
        } | undefined;
    } | {
        uri: string;
        name: string;
        type: "resource_link";
        description?: string | undefined;
        mimeType?: string | undefined;
        size?: number | undefined;
        annotations?: {
            audience?: ("user" | "assistant")[] | undefined;
            priority?: number | undefined;
            lastModified?: string | undefined;
        } | undefined;
        _meta?: {
            [x: string]: unknown;
        } | undefined;
        icons?: {
            src: string;
            mimeType?: string | undefined;
            sizes?: string[] | undefined;
            theme?: "light" | "dark" | undefined;
        }[] | undefined;
        title?: string | undefined;
    } | {
        type: "resource";
        resource: {
            uri: string;
            text: string;
            mimeType?: string | undefined;
            _meta?: {
                [x: string]: unknown;
            } | undefined;
        } | {
            uri: string;
            blob: string;
            mimeType?: string | undefined;
            _meta?: {
                [x: string]: unknown;
            } | undefined;
        };
        annotations?: {
            audience?: ("user" | "assistant")[] | undefined;
            priority?: number | undefined;
            lastModified?: string | undefined;
        } | undefined;
        _meta?: {
            [x: string]: unknown;
        } | undefined;
    })[];
    _meta?: {
        [x: string]: unknown;
        progressToken?: string | number | undefined;
        "io.modelcontextprotocol/related-task"?: {
            taskId: string;
        } | undefined;
    } | undefined;
    structuredContent?: {
        [x: string]: unknown;
    } | undefined;
    isError?: boolean | undefined;
}>;
export declare function handleUpdateCalendarEvent(args: ToolArgs): Promise<{
    [x: string]: unknown;
    content: ({
        type: "text";
        text: string;
        annotations?: {
            audience?: ("user" | "assistant")[] | undefined;
            priority?: number | undefined;
            lastModified?: string | undefined;
        } | undefined;
        _meta?: {
            [x: string]: unknown;
        } | undefined;
    } | {
        type: "image";
        data: string;
        mimeType: string;
        annotations?: {
            audience?: ("user" | "assistant")[] | undefined;
            priority?: number | undefined;
            lastModified?: string | undefined;
        } | undefined;
        _meta?: {
            [x: string]: unknown;
        } | undefined;
    } | {
        type: "audio";
        data: string;
        mimeType: string;
        annotations?: {
            audience?: ("user" | "assistant")[] | undefined;
            priority?: number | undefined;
            lastModified?: string | undefined;
        } | undefined;
        _meta?: {
            [x: string]: unknown;
        } | undefined;
    } | {
        uri: string;
        name: string;
        type: "resource_link";
        description?: string | undefined;
        mimeType?: string | undefined;
        size?: number | undefined;
        annotations?: {
            audience?: ("user" | "assistant")[] | undefined;
            priority?: number | undefined;
            lastModified?: string | undefined;
        } | undefined;
        _meta?: {
            [x: string]: unknown;
        } | undefined;
        icons?: {
            src: string;
            mimeType?: string | undefined;
            sizes?: string[] | undefined;
            theme?: "light" | "dark" | undefined;
        }[] | undefined;
        title?: string | undefined;
    } | {
        type: "resource";
        resource: {
            uri: string;
            text: string;
            mimeType?: string | undefined;
            _meta?: {
                [x: string]: unknown;
            } | undefined;
        } | {
            uri: string;
            blob: string;
            mimeType?: string | undefined;
            _meta?: {
                [x: string]: unknown;
            } | undefined;
        };
        annotations?: {
            audience?: ("user" | "assistant")[] | undefined;
            priority?: number | undefined;
            lastModified?: string | undefined;
        } | undefined;
        _meta?: {
            [x: string]: unknown;
        } | undefined;
    })[];
    _meta?: {
        [x: string]: unknown;
        progressToken?: string | number | undefined;
        "io.modelcontextprotocol/related-task"?: {
            taskId: string;
        } | undefined;
    } | undefined;
    structuredContent?: {
        [x: string]: unknown;
    } | undefined;
    isError?: boolean | undefined;
}>;
export declare function handleDeleteEventsInRange(args: ToolArgs): Promise<{
    [x: string]: unknown;
    content: ({
        type: "text";
        text: string;
        annotations?: {
            audience?: ("user" | "assistant")[] | undefined;
            priority?: number | undefined;
            lastModified?: string | undefined;
        } | undefined;
        _meta?: {
            [x: string]: unknown;
        } | undefined;
    } | {
        type: "image";
        data: string;
        mimeType: string;
        annotations?: {
            audience?: ("user" | "assistant")[] | undefined;
            priority?: number | undefined;
            lastModified?: string | undefined;
        } | undefined;
        _meta?: {
            [x: string]: unknown;
        } | undefined;
    } | {
        type: "audio";
        data: string;
        mimeType: string;
        annotations?: {
            audience?: ("user" | "assistant")[] | undefined;
            priority?: number | undefined;
            lastModified?: string | undefined;
        } | undefined;
        _meta?: {
            [x: string]: unknown;
        } | undefined;
    } | {
        uri: string;
        name: string;
        type: "resource_link";
        description?: string | undefined;
        mimeType?: string | undefined;
        size?: number | undefined;
        annotations?: {
            audience?: ("user" | "assistant")[] | undefined;
            priority?: number | undefined;
            lastModified?: string | undefined;
        } | undefined;
        _meta?: {
            [x: string]: unknown;
        } | undefined;
        icons?: {
            src: string;
            mimeType?: string | undefined;
            sizes?: string[] | undefined;
            theme?: "light" | "dark" | undefined;
        }[] | undefined;
        title?: string | undefined;
    } | {
        type: "resource";
        resource: {
            uri: string;
            text: string;
            mimeType?: string | undefined;
            _meta?: {
                [x: string]: unknown;
            } | undefined;
        } | {
            uri: string;
            blob: string;
            mimeType?: string | undefined;
            _meta?: {
                [x: string]: unknown;
            } | undefined;
        };
        annotations?: {
            audience?: ("user" | "assistant")[] | undefined;
            priority?: number | undefined;
            lastModified?: string | undefined;
        } | undefined;
        _meta?: {
            [x: string]: unknown;
        } | undefined;
    })[];
    _meta?: {
        [x: string]: unknown;
        progressToken?: string | number | undefined;
        "io.modelcontextprotocol/related-task"?: {
            taskId: string;
        } | undefined;
    } | undefined;
    structuredContent?: {
        [x: string]: unknown;
    } | undefined;
    isError?: boolean | undefined;
}>;
export declare function handleDeleteCalendarEvent(args: ToolArgs): Promise<{
    [x: string]: unknown;
    content: ({
        type: "text";
        text: string;
        annotations?: {
            audience?: ("user" | "assistant")[] | undefined;
            priority?: number | undefined;
            lastModified?: string | undefined;
        } | undefined;
        _meta?: {
            [x: string]: unknown;
        } | undefined;
    } | {
        type: "image";
        data: string;
        mimeType: string;
        annotations?: {
            audience?: ("user" | "assistant")[] | undefined;
            priority?: number | undefined;
            lastModified?: string | undefined;
        } | undefined;
        _meta?: {
            [x: string]: unknown;
        } | undefined;
    } | {
        type: "audio";
        data: string;
        mimeType: string;
        annotations?: {
            audience?: ("user" | "assistant")[] | undefined;
            priority?: number | undefined;
            lastModified?: string | undefined;
        } | undefined;
        _meta?: {
            [x: string]: unknown;
        } | undefined;
    } | {
        uri: string;
        name: string;
        type: "resource_link";
        description?: string | undefined;
        mimeType?: string | undefined;
        size?: number | undefined;
        annotations?: {
            audience?: ("user" | "assistant")[] | undefined;
            priority?: number | undefined;
            lastModified?: string | undefined;
        } | undefined;
        _meta?: {
            [x: string]: unknown;
        } | undefined;
        icons?: {
            src: string;
            mimeType?: string | undefined;
            sizes?: string[] | undefined;
            theme?: "light" | "dark" | undefined;
        }[] | undefined;
        title?: string | undefined;
    } | {
        type: "resource";
        resource: {
            uri: string;
            text: string;
            mimeType?: string | undefined;
            _meta?: {
                [x: string]: unknown;
            } | undefined;
        } | {
            uri: string;
            blob: string;
            mimeType?: string | undefined;
            _meta?: {
                [x: string]: unknown;
            } | undefined;
        };
        annotations?: {
            audience?: ("user" | "assistant")[] | undefined;
            priority?: number | undefined;
            lastModified?: string | undefined;
        } | undefined;
        _meta?: {
            [x: string]: unknown;
        } | undefined;
    })[];
    _meta?: {
        [x: string]: unknown;
        progressToken?: string | number | undefined;
        "io.modelcontextprotocol/related-task"?: {
            taskId: string;
        } | undefined;
    } | undefined;
    structuredContent?: {
        [x: string]: unknown;
    } | undefined;
    isError?: boolean | undefined;
}>;
