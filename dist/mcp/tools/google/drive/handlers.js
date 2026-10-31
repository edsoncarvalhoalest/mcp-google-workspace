import { google } from "googleapis";
import { Buffer } from "node:buffer";
import { Readable } from "node:stream";
import { oauth2Client } from "../../../../auth/personalAuth.js";
import { errorResult, jsonResult, textResult } from "../../result.js";
import { getOptionalPositiveNumber, getRequiredString } from "../../shared/args.js";
import { DRIVE_FILE_FIELDS, getDriveClient, getHttpStatus, ifMatchHeaders, ifNoneMatchHeaders, mapDriveFile, } from "./helpers.js";
const GOOGLE_DOCS_MIME_TYPE = "application/vnd.google-apps.document";
const FOLDER_MIME_TYPE = "application/vnd.google-apps.folder";
function isReadable(data) {
    return data instanceof Readable;
}
async function streamToBuffer(stream) {
    const chunks = [];
    for await (const chunk of stream) {
        chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
}
async function decodeDriveMedia(data) {
    if (typeof data === "string") {
        return data;
    }
    if (Buffer.isBuffer(data)) {
        return data.toString("utf-8");
    }
    if (data instanceof ArrayBuffer) {
        return Buffer.from(data).toString("utf-8");
    }
    if (ArrayBuffer.isView(data)) {
        return Buffer.from(data.buffer, data.byteOffset, data.byteLength).toString("utf-8");
    }
    if (isReadable(data)) {
        const raw = await streamToBuffer(data);
        return raw.toString("utf-8");
    }
    return JSON.stringify(data);
}
function extractDocumentText(elements) {
    if (!elements) {
        return "";
    }
    let text = "";
    for (const element of elements) {
        const paragraphElements = element.paragraph?.elements;
        if (paragraphElements) {
            for (const paragraphElement of paragraphElements) {
                text += paragraphElement.textRun?.content ?? "";
            }
        }
        const tableRows = element.table?.tableRows;
        if (tableRows) {
            for (const row of tableRows) {
                for (const cell of row.tableCells ?? []) {
                    text += extractDocumentText(cell.content);
                }
            }
        }
        if (element.tableOfContents?.content) {
            text += extractDocumentText(element.tableOfContents.content);
        }
    }
    return text;
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
function getCreateType(args) {
    const value = args?.type;
    if (value === undefined || value === null) {
        return "file";
    }
    if (value !== "file" && value !== "folder") {
        throw new Error('Field \'type\' must be "file" or "folder".');
    }
    return value;
}
function getPermanentDelete(args) {
    return args?.permanent === true;
}
export async function handleSearchFiles(args) {
    try {
        const query = getRequiredString(args, "query");
        const limit = getOptionalPositiveNumber(args, "limit", 10);
        const drive = getDriveClient();
        const response = await drive.files.list({
            q: query,
            pageSize: limit,
            fields: `files(${DRIVE_FILE_FIELDS})`,
            includeItemsFromAllDrives: true,
            supportsAllDrives: true,
        });
        const files = (response.data.files ?? []).map(mapDriveFile);
        return jsonResult(files);
    }
    catch (error) {
        return errorResult(error);
    }
}
export async function handleListDriveFolderItems(args) {
    try {
        const folderId = getRequiredString(args, "folderId");
        const limit = getOptionalPositiveNumber(args, "limit", 20);
        const includeTrashed = args?.includeTrashed === true;
        const drive = getDriveClient();
        const q = includeTrashed
            ? `'${folderId}' in parents`
            : `'${folderId}' in parents and trashed = false`;
        const response = await drive.files.list({
            q,
            pageSize: limit,
            fields: `files(${DRIVE_FILE_FIELDS})`,
            includeItemsFromAllDrives: true,
            supportsAllDrives: true,
        });
        const files = (response.data.files ?? []).map(mapDriveFile);
        return jsonResult(files);
    }
    catch (error) {
        return errorResult(error);
    }
}
export async function handleGetDriveFile(args) {
    try {
        const fileId = getRequiredString(args, "fileId");
        const etag = getOptionalEtag(args);
        const drive = getDriveClient();
        const requestOptions = etag ? { headers: ifNoneMatchHeaders(etag) } : undefined;
        try {
            const response = await drive.files.get({ fileId, fields: DRIVE_FILE_FIELDS, supportsAllDrives: true }, requestOptions);
            return jsonResult(mapDriveFile(response.data));
        }
        catch (error) {
            if (etag && getHttpStatus(error) === 304) {
                return jsonResult({
                    notModified: true,
                    message: "File has not changed since the provided etag.",
                    fileId,
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
export async function handleCreateDriveFile(args) {
    try {
        const name = getRequiredString(args, "name");
        const createType = getCreateType(args);
        const content = getOptionalStringField(args, "content") ?? "";
        const parentFolderId = getOptionalStringField(args, "parentFolderId");
        const drive = getDriveClient();
        const requestBody = {
            name,
            mimeType: createType === "folder" ? FOLDER_MIME_TYPE : "text/plain",
        };
        if (parentFolderId) {
            requestBody.parents = [parentFolderId];
        }
        if (createType === "folder") {
            const response = await drive.files.create({
                requestBody,
                fields: DRIVE_FILE_FIELDS,
                supportsAllDrives: true,
            });
            return jsonResult(mapDriveFile(response.data));
        }
        const response = await drive.files.create({
            requestBody,
            media: {
                mimeType: "text/plain",
                body: content,
            },
            fields: DRIVE_FILE_FIELDS,
            supportsAllDrives: true,
        });
        return jsonResult(mapDriveFile(response.data));
    }
    catch (error) {
        return errorResult(error);
    }
}
export async function handleUpdateDriveFile(args) {
    try {
        const fileId = getRequiredString(args, "fileId");
        const etag = getOptionalEtag(args);
        const name = getOptionalStringField(args, "name");
        const description = getOptionalStringField(args, "description");
        const parentFolderId = getOptionalStringField(args, "parentFolderId");
        if (name === undefined && description === undefined && parentFolderId === undefined) {
            throw new Error("Provide at least one of: name, description, parentFolderId.");
        }
        const drive = getDriveClient();
        const existing = await drive.files.get({
            fileId,
            fields: "parents",
            supportsAllDrives: true,
        });
        const currentParents = existing.data.parents ?? [];
        const requestBody = {};
        if (name !== undefined) {
            requestBody.name = name;
        }
        if (description !== undefined) {
            requestBody.description = description;
        }
        const requestOptions = etag ? { headers: ifMatchHeaders(etag) } : undefined;
        try {
            const updateParams = {
                fileId,
                requestBody,
                fields: DRIVE_FILE_FIELDS,
                supportsAllDrives: true,
            };
            if (parentFolderId) {
                updateParams.addParents = parentFolderId;
                if (currentParents.length > 0) {
                    updateParams.removeParents = currentParents.join(",");
                }
            }
            const response = await drive.files.update(updateParams, requestOptions);
            return jsonResult(mapDriveFile(response.data));
        }
        catch (error) {
            if (etag && getHttpStatus(error) === 412) {
                return jsonResult({
                    error: "precondition_failed",
                    httpStatus: 412,
                    message: "File was modified on the server since the provided etag. Re-fetch with get_drive_file and retry.",
                    fileId,
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
export async function handleDeleteDriveFile(args) {
    try {
        const fileId = getRequiredString(args, "fileId");
        const etag = getOptionalEtag(args);
        const permanent = getPermanentDelete(args);
        const drive = getDriveClient();
        const requestOptions = etag ? { headers: ifMatchHeaders(etag) } : undefined;
        try {
            if (permanent) {
                await drive.files.delete({ fileId, supportsAllDrives: true }, requestOptions);
                return jsonResult({ deleted: true, permanent: true, fileId });
            }
            await drive.files.update({ fileId, requestBody: { trashed: true }, supportsAllDrives: true }, requestOptions);
            return jsonResult({ deleted: true, permanent: false, trashed: true, fileId });
        }
        catch (error) {
            if (etag && getHttpStatus(error) === 412) {
                return jsonResult({
                    error: "precondition_failed",
                    httpStatus: 412,
                    message: "File was modified on the server since the provided etag. Re-fetch before deleting.",
                    fileId,
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
export async function handleReadDocumentContent(args) {
    try {
        const fileId = getRequiredString(args, "fileId");
        const drive = getDriveClient();
        const metadata = await drive.files.get({
            fileId,
            fields: "id,name,mimeType",
            supportsAllDrives: true,
        });
        const mimeType = metadata.data.mimeType ?? "";
        if (mimeType === GOOGLE_DOCS_MIME_TYPE) {
            const docs = google.docs({ version: "v1", auth: oauth2Client });
            const document = await docs.documents.get({ documentId: fileId });
            const text = extractDocumentText(document.data.body?.content).trim();
            return textResult(text);
        }
        const media = await drive.files.get({
            fileId,
            alt: "media",
            supportsAllDrives: true,
        }, { responseType: "arraybuffer" });
        const text = await decodeDriveMedia(media.data);
        return textResult(text);
    }
    catch (error) {
        return errorResult(error);
    }
}
