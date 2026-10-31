export declare const STANDARD_SCOPES: string[];
export declare const oauth2Client: import("google-auth-library").OAuth2Client;
export declare function clearPersonalAuth(purgeDisk?: boolean): Promise<void>;
export declare function ensurePersonalAuth(): Promise<void>;
export declare function forcePersonalReauth(): Promise<void>;
