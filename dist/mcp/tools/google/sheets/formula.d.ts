import type { SheetValues } from "./types.js";
export declare function transformFormulaSeparators(values: SheetValues): SheetValues;
export declare function transformFormulaStructure(values: SheetValues): SheetValues;
export declare function buildFormulaRepairCandidates(values: SheetValues): SheetValues[];
export declare function hasAnyFormula(values: SheetValues): boolean;
export declare function isFormulaParseErrorText(text: string): boolean;
export declare function matrixHasFormulaCellError(values: string[][]): boolean;
