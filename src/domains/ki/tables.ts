import { lookup1to20 } from "../../actors/creature/tables";

// Innate Ki accumulation by characteristic value (Excel "Tabla de Acumulación",
// verified: 1-9 → 1, 10-12 → 2, 13-15 → 3, 16-20 → 4; value 1..20).
const KI_ACCUMULATION = [
  1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 4, 4,
] as const;

/**
 * Innate Ki points granted by one characteristic (Excel Ki sheet): the
 * characteristic value, or 10 + 2·(value−10) above 10 (DES 13 → 16).
 */
export function getInnateKiPoints(value: number): number {
  if (value <= 0) return 0;
  return value <= 10 ? value : 10 + 2 * (value - 10);
}

/** Innate Ki accumulation granted by one characteristic (Excel Tabla de Acumulación). */
export function getInnateKiAccumulation(value: number): number {
  return lookup1to20(KI_ACCUMULATION, value);
}
