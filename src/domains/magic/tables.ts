import { lookup1to20 } from "../../actors/creature/tables";

// Innate Zeon by Power (Excel Tabla_Valores_Base, col N; POD 1..20).
const INNATE_ZEON = [
  5, 20, 40, 55, 70, 85, 95, 110, 120, 135, 150, 160, 175, 185, 200, 215, 225, 240, 250, 265,
] as const;

// Innate ACT (accumulation) by Power (Excel Tabla_Valores_Base, col O; POD 1..20).
const INNATE_ACT = [
  0, 0, 0, 0, 5, 5, 5, 10, 10, 10, 10, 15, 15, 15, 20, 25, 25, 30, 30, 35,
] as const;

// Maximum magic level by Intelligence (Excel Tabla_NivelMagia / Core Tabla 59;
// INT 1..20). The Excel adds this as the innate magic level, not a hard cap.
const MAGIC_LEVEL_BY_INT = [
  0, 0, 0, 0, 0, 10, 20, 30, 40, 50, 75, 100, 150, 200, 300, 400, 500, 600, 700, 800,
] as const;

/** Innate Zeon granted by the Power characteristic (Excel PDs!W93). */
export function getInnateZeon(pow: number): number {
  return lookup1to20(INNATE_ZEON, pow);
}

/** Innate ACT (accumulation) granted by the Power characteristic (Excel PDs!W94). */
export function getInnateAct(pow: number): number {
  return lookup1to20(INNATE_ACT, pow);
}

/** Innate magic level granted by Intelligence (Excel PDs!W97 / Tabla 59). */
export function getMagicLevelByInt(int: number): number {
  return lookup1to20(MAGIC_LEVEL_BY_INT, int);
}

/**
 * Magic level cost of buying a single spell instead of raising the whole path
 * (Tabla 60, Core p. 118): 2 per 10 spell levels, rounded up.
 */
export function getFreeSpellCost(spellLevel: number): number {
  if (spellLevel <= 0) return 0;
  return Math.ceil(Math.min(spellLevel, 100) / 10) * 2;
}

/**
 * Split the comma-separated `opposedPath` field into path names. Nigromancia
 * lists all ten others, so this is a list rather than a single value.
 */
export function parseOpposedPaths(opposed: string | undefined): string[] {
  return (opposed ?? "")
    .split(",")
    .map((p) => p.trim())
    .filter((p) => p !== "");
}
