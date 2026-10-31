import type { drive_v3 } from "googleapis";
/** Drive v3 partial response: `etag` is not a valid fields mask entry (use md5Checksum/version). */
export declare const DRIVE_FILE_FIELDS = "id,name,mimeType,webViewLink,description,parents,trashed,modifiedTime,md5Checksum,version";
export declare function getDriveClient(): drive_v3.Drive;
export type DriveFileSummary = {
    id: string;
    name: string;
    mimeType: string;
    webViewLink: string;
    etag: string;
    description: string;
    parents: string[];
    trashed: boolean;
    modifiedTime: string;
};
export declare function mapDriveFile(file: drive_v3.Schema$File): DriveFileSummary;
export declare function getHttpStatus(error: unknown): number | undefined;
export declare function ifMatchHeaders(etag: string): Record<string, string>;
export declare function ifNoneMatchHeaders(etag: string): Record<string, string>;
