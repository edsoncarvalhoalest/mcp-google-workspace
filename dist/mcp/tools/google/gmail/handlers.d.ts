import type { ToolArgs } from "../../types.js";
export declare function handleSearchEmails(args: ToolArgs): Promise<{
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
export declare function handleGetEmail(args: ToolArgs): Promise<{
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
export declare function handleSendEmail(args: ToolArgs): Promise<{
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
export declare function handleCreateEmailDraft(args: ToolArgs): Promise<{
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
export declare function handleReplyEmail(args: ToolArgs): Promise<{
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
export declare function handleModifyEmailLabels(args: ToolArgs): Promise<{
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
export declare function handleStartGmailWatch(args: ToolArgs): Promise<{
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
export declare function handleStopGmailWatch(_args: ToolArgs): Promise<{
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
export declare function handleListGmailHistory(args: ToolArgs): Promise<{
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
