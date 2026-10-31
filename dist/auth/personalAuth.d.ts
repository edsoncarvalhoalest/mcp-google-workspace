export declare const STANDARD_SCOPES: string[];
export declare const oauth2Client: import("google-auth-library").OAuth2Client;
export declare function clearPersonalAuth(purgeDisk?: boolean): Promise<void>;
export declare function ensurePersonalAuth(): Promise<void>;
export declare function forcePersonalReauth(): Promise<void>;
export declare class AuthRequiredError extends Error {
    authUrl: string;
    redirectUri: string;
    reason?: string;
    constructor(authUrl: string, redirectUri: string, reason?: string);
}
export type PersonalAuthStatus = {
    authenticated: boolean;
    userKey: string | null;
    email: string | null;
    hasRefreshToken: boolean;
    grantedScopes: string[];
    missingScopes: string[];
    scopesUnknown: boolean;
    requiredScopes: string[];
    pendingAuth: {
        authUrl: string;
        redirectUri: string;
        listening: boolean;
    } | null;
};
export declare function getMissingScopes(tokenScopeString: string | undefined | null): string[];
export declare function startPersonalAuth(force?: boolean): Promise<{
    authUrl: string;
    redirectUri: string;
    listening: boolean;
}>;
export declare function completePersonalAuth(input?: {
    redirectUrl?: string;
    code?: string;
}): Promise<PersonalAuthStatus>;
export declare function getPersonalAuthStatus(): Promise<PersonalAuthStatus>;
