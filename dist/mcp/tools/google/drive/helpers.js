import { google } from "googleapis";
import { oauth2Client } from "../../../../auth/personalAuth.js";
/** Drive v3 partial response: `etag` is not a valid fields mask entry (use md5Checksum/version). */
export const DRIVE_FILE_FIELDS = "id,name,mimeType,webViewLink,description,parents,trashed,modifiedTime,md5Checksum,version";
export function getDriveClient() {
    return google.drive({ version: "v3", auth: oauth2Client });
}
function readFileVersionToken(file) {
    return (file.md5Checksum ||
        (file.version !== undefined ? String(file.version) : "") ||
        file.modifiedTime ||
        "");
}
export function mapDriveFile(file) {
    return {
        id: file.id ?? "",
        name: file.name ?? "",
        mimeType: file.mimeType ?? "",
        webViewLink: file.webViewLink ?? "",
        etag: readFileVersionToken(file),
        description: file.description ?? "",
        parents: file.parents ?? [],
        trashed: file.trashed ?? false,
        modifiedTime: file.modifiedTime ?? "",
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
