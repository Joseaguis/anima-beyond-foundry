import { getModifier } from "../tables";
import { CHARACTERISTIC_KEYS, type CharacteristicKey, type PrepContext } from "./types";

export interface CharacteristicData {
  base: number;
  bonus: number;
  final?: number;
  mod?: number;
}

/**
 * Compute the final value and modifier of the eight characteristics, and fill
 * `ctx.charFinals` / `ctx.charMods` for the following phases.
 */
export function prepareCharacteristics(
  system: Partial<Record<CharacteristicKey, CharacteristicData>>,
  ctx: PrepContext,
): void {
  for (const key of CHARACTERISTIC_KEYS) {
    const char = system[key];
    const final = char ? char.base + char.bonus + ctx.mod(key) : 5;
    if (char) {
      char.final = final;
      char.mod = getModifier(final);
    }
    ctx.charFinals[key] = final;
    ctx.charMods[key] = getModifier(final);
  }
}
