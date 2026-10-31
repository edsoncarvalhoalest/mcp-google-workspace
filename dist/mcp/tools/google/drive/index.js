import { CREATE_DRIVE_FILE_TOOL_DEFINITION, DELETE_DRIVE_FILE_TOOL_DEFINITION, GET_DRIVE_FILE_TOOL_DEFINITION, LIST_DRIVE_FOLDER_ITEMS_TOOL_DEFINITION, READ_DOCUMENT_CONTENT_TOOL_DEFINITION, SEARCH_FILES_TOOL_DEFINITION, UPDATE_DRIVE_FILE_TOOL_DEFINITION, } from "./definitions.js";
import { handleCreateDriveFile, handleDeleteDriveFile, handleGetDriveFile, handleListDriveFolderItems, handleReadDocumentContent, handleSearchFiles, handleUpdateDriveFile, } from "./handlers.js";
export const DRIVE_TOOL_MODULES = [
    {
        owner: "google-drive",
        authMode: "personal",
        definition: SEARCH_FILES_TOOL_DEFINITION,
        handler: handleSearchFiles,
    },
    {
        owner: "google-drive",
        authMode: "personal",
        definition: LIST_DRIVE_FOLDER_ITEMS_TOOL_DEFINITION,
        handler: handleListDriveFolderItems,
    },
    {
        owner: "google-drive",
        authMode: "personal",
        definition: GET_DRIVE_FILE_TOOL_DEFINITION,
        handler: handleGetDriveFile,
    },
    {
        owner: "google-drive",
        authMode: "personal",
        definition: CREATE_DRIVE_FILE_TOOL_DEFINITION,
        handler: handleCreateDriveFile,
    },
    {
        owner: "google-drive",
        authMode: "personal",
        definition: UPDATE_DRIVE_FILE_TOOL_DEFINITION,
        handler: handleUpdateDriveFile,
    },
    {
        owner: "google-drive",
        authMode: "personal",
        definition: DELETE_DRIVE_FILE_TOOL_DEFINITION,
        handler: handleDeleteDriveFile,
    },
    {
        owner: "google-drive",
        authMode: "personal",
        definition: READ_DOCUMENT_CONTENT_TOOL_DEFINITION,
        handler: handleReadDocumentContent,
        requiredScopes: [
            "https://www.googleapis.com/auth/drive",
            "https://www.googleapis.com/auth/documents.readonly",
        ],
    },
];
