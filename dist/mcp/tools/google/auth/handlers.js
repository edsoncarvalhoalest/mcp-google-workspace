import { completePersonalAuth, getPersonalAuthStatus, startPersonalAuth } from "../../../../auth/personalAuth.js";
import { errorResult, jsonResult } from "../../result.js";
function getOptionalString(args, key) {
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
export async function handleGoogleAuthStatus(_args) {
    try {
        return jsonResult(await getPersonalAuthStatus());
    }
    catch (error) {
        return errorResult(error);
    }
}
export async function handleStartGoogleAuth(args) {
    try {
        const force = args?.force === true;
        const flow = await startPersonalAuth(force);
        return jsonResult({
            ...flow,
            instructions: "Abra authUrl no navegador e aprove. Se terminar em uma pagina localhost inacessivel, passe a URL completa para complete_google_auth. / Open authUrl in a browser and approve. If it ends on an unreachable localhost page, pass the full URL to complete_google_auth.",
        });
    }
    catch (error) {
        return errorResult(error);
    }
}
export async function handleCompleteGoogleAuth(args) {
    try {
        const redirectUrl = getOptionalString(args, "redirectUrl");
        const code = getOptionalString(args, "code");
        const status = await completePersonalAuth({ redirectUrl, code });
        return jsonResult({ completed: true, ...status });
    }
    catch (error) {
        return errorResult(error);
    }
}
