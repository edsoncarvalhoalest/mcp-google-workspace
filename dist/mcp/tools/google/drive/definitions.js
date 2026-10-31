const ETAG_PROPERTY = {
    type: "string",
    description: "Version token from a previous retrieval (md5Checksum or version). Optional concurrency headers on get/update/delete.",
};
export const SEARCH_FILES_TOOL_DEFINITION = {
    name: "search_files",
    description: "Search Google Drive files using Drive query syntax.",
    inputSchema: {
        type: "object",
        properties: {
            query: {
                type: "string",
                description: "Google Drive q syntax, e.g. \"name contains 'report'\".",
            },
            limit: {
                type: "number",
                description: "Maximum number of files to return.",
                default: 10,
            },
        },
        required: ["query"],
    },
};
export const LIST_DRIVE_FOLDER_ITEMS_TOOL_DEFINITION = {
    name: "list_drive_folder_items",
    description: "List items directly inside a Drive folder.",
    inputSchema: {
        type: "object",
        properties: {
            folderId: { type: "string", description: "Drive folder ID." },
            limit: {
                type: "number",
                description: "Maximum number of items to return.",
                default: 20,
            },
            includeTrashed: {
                type: "boolean",
                description: "Include trashed items. Default: false.",
            },
        },
        required: ["folderId"],
    },
};
export const GET_DRIVE_FILE_TOOL_DEFINITION = {
    name: "get_drive_file",
    description: "Get Drive file metadata by ID. Optional etag uses If-None-Match (returns notModified when unchanged).",
    inputSchema: {
        type: "object",
        properties: {
            fileId: { type: "string", description: "Google Drive file ID." },
            etag: ETAG_PROPERTY,
        },
        required: ["fileId"],
    },
};
export const CREATE_DRIVE_FILE_TOOL_DEFINITION = {
    name: "create_drive_file",
    description: "Create a plain text file or folder in Google Drive.",
    inputSchema: {
        type: "object",
        properties: {
            name: { type: "string", description: "File or folder name." },
            type: {
                type: "string",
                enum: ["file", "folder"],
                description: 'Create a "file" (text/plain) or "folder". Default: file.',
            },
            content: {
                type: "string",
                description: "Text content when type is file. Ignored for folders.",
            },
            parentFolderId: {
                type: "string",
                description: "Optional parent folder ID.",
            },
        },
        required: ["name"],
    },
};
export const UPDATE_DRIVE_FILE_TOOL_DEFINITION = {
    name: "update_drive_file",
    description: "Update file metadata (name, description) or move to another folder. Optional etag uses If-Match.",
    inputSchema: {
        type: "object",
        properties: {
            fileId: { type: "string", description: "File ID to update." },
            etag: ETAG_PROPERTY,
            name: { type: "string", description: "New name." },
            description: { type: "string", description: "New description." },
            parentFolderId: {
                type: "string",
                description: "Move file into this folder (replaces current parent).",
            },
        },
        required: ["fileId"],
    },
};
export const DELETE_DRIVE_FILE_TOOL_DEFINITION = {
    name: "delete_drive_file",
    description: "Trash or permanently delete a Drive file. Optional etag uses If-Match.",
    inputSchema: {
        type: "object",
        properties: {
            fileId: { type: "string", description: "File ID to delete." },
            etag: ETAG_PROPERTY,
            permanent: {
                type: "boolean",
                description: "If true, permanently delete. Default: move to trash.",
            },
        },
        required: ["fileId"],
    },
};
export const READ_DOCUMENT_CONTENT_TOOL_DEFINITION = {
    name: "read_document_content",
    description: "Read plain text content from a Google Docs file or regular text file in Drive.",
    inputSchema: {
        type: "object",
        properties: {
            fileId: {
                type: "string",
                description: "Google Drive file id.",
            },
        },
        required: ["fileId"],
    },
};
