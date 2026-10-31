export function textResult(text) {
    return {
        content: [{ type: "text", text }],
    };
}
export function jsonResult(payload) {
    return textResult(JSON.stringify(payload, null, 2));
}
function getErrorMessage(error) {
    if (error instanceof Error) {
        return error.message;
    }
    if (typeof error === "string") {
        return error;
    }
    return JSON.stringify(error);
}
export function errorResult(error) {
    return {
        isError: true,
        content: [{ type: "text", text: getErrorMessage(error) }],
    };
}
export function extractText(result) {
    return result.content
        .filter((item) => item.type === "text")
        .map((item) => item.text)
        .join("\n");
}
