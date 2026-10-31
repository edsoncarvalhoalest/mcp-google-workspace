function isFormulaValue(value) {
    return typeof value === "string" && value.trim().startsWith("=");
}
function transformFormulaValues(values, transform) {
    return values.map((row) => row.map((cell) => {
        if (!isFormulaValue(cell)) {
            return cell;
        }
        return transform(cell);
    }));
}
function swapFormulaArgumentSeparators(formula) {
    let result = "";
    let inDoubleQuote = false;
    for (let index = 0; index < formula.length; index += 1) {
        const current = formula[index];
        if (current === '"') {
            if (inDoubleQuote && formula[index + 1] === '"') {
                result += '""';
                index += 1;
                continue;
            }
            inDoubleQuote = !inDoubleQuote;
            result += current;
            continue;
        }
        if (!inDoubleQuote && current === ",") {
            result += ";";
            continue;
        }
        if (!inDoubleQuote && current === ";") {
            result += ",";
            continue;
        }
        result += current;
    }
    return result;
}
export function transformFormulaSeparators(values) {
    return transformFormulaValues(values, swapFormulaArgumentSeparators);
}
function appendMissingClosingParentheses(formula) {
    let balance = 0;
    let inDoubleQuote = false;
    for (let index = 0; index < formula.length; index += 1) {
        const current = formula[index];
        if (current === '"') {
            if (inDoubleQuote && formula[index + 1] === '"') {
                index += 1;
                continue;
            }
            inDoubleQuote = !inDoubleQuote;
            continue;
        }
        if (inDoubleQuote) {
            continue;
        }
        if (current === "(") {
            balance += 1;
            continue;
        }
        if (current === ")" && balance > 0) {
            balance -= 1;
        }
    }
    if (balance <= 0) {
        return formula;
    }
    return `${formula}${")".repeat(balance)}`;
}
export function transformFormulaStructure(values) {
    return transformFormulaValues(values, appendMissingClosingParentheses);
}
function areValuesEqual(left, right) {
    return JSON.stringify(left) === JSON.stringify(right);
}
export function buildFormulaRepairCandidates(values) {
    const candidates = [];
    const pushUnique = (candidate) => {
        if (!candidates.some((existing) => areValuesEqual(existing, candidate))) {
            candidates.push(candidate);
        }
    };
    const separatorSwapped = transformFormulaSeparators(values);
    const structureFixed = transformFormulaStructure(values);
    const swappedThenFixed = transformFormulaStructure(separatorSwapped);
    const fixedThenSwapped = transformFormulaSeparators(structureFixed);
    pushUnique(values);
    pushUnique(separatorSwapped);
    pushUnique(structureFixed);
    pushUnique(swappedThenFixed);
    pushUnique(fixedThenSwapped);
    return candidates;
}
export function hasAnyFormula(values) {
    return values.some((row) => row.some((cell) => isFormulaValue(cell)));
}
export function isFormulaParseErrorText(text) {
    const normalized = text.toLowerCase();
    return (normalized.includes("parse error") ||
        normalized.includes("formula parse") ||
        normalized.includes("unable to parse") ||
        normalized.includes("invalid value"));
}
export function matrixHasFormulaCellError(values) {
    return values.some((row) => row.some((cell) => {
        const normalized = cell.trim().toUpperCase();
        return normalized.startsWith("#ERROR!");
    }));
}
