/**
 * Resultado del Asalto (Core Exxet pp. 86-87): the comparison that turns an
 * attack roll and a defence roll into damage or into a counterattack.
 *
 * Pure functions over totals — the check engine feeds them, the chat card
 * renders them. Nothing here knows about actors or Foundry.
 */

import {
  applyDamagePercent,
  computeAbsorption,
  damagePercent,
  type AbsorptionBreakdown,
  type AbsorptionInput,
} from "./absorption";

/** A counterattack bonus is capped here however good the defence was. */
export const MAX_COUNTER_BONUS = 150;

export interface RoundResolutionInput {
  /** Attacker's ability plus dice. */
  attackTotal: number;
  /** Defender's ability plus dice. */
  defenseTotal: number;
  /** The attack's final damage (`system.equipment.weapons[i].finalDamage`). */
  finalDamage: number;
  /** How the defender's Absorción is put together. */
  absorption: AbsorptionInput;
  /**
   * The attacker fumbled. The blow misses automatically whatever the totals say
   * (Core p. 96), and the defender may add the failure level to their own
   * attack — pass it here so the card can offer that bonus.
   */
  attackerFumbled?: boolean;
  attackerFumbleLevel?: number | null;
}

export interface RoundResolution {
  /** attackTotal − defenseTotal. */
  roundResult: number;
  hit: boolean;
  absorption: AbsorptionBreakdown;
  /** roundResult − Absorción. Zero when the attack did not connect. */
  afterAbsorption: number;
  /** Percentage of Tabla 42; zero when the blow draws no blood. */
  damagePercent: number;
  /** Life Points the defender loses. */
  damage: number;
  counterattack: boolean;
  /** Bonus the defender carries into their Acción Respuesta. */
  counterBonus: number;
  /** The attack missed because the attacker fumbled, not because of the totals. */
  fumbledAway: boolean;
  /**
   * Failure level the defender may add to their own attack after the attacker's
   * fumble (Core p. 96). Zero unless the attacker fumbled.
   */
  fumbleBonusToOpponent: number;
}

/**
 * The defender's reward for a good parry: half the margin in their favour,
 * rounded down in groups of five, capped at +150 (Core p. 87 — a −30 result
 * gives +15, a −100 gives +50).
 */
export function counterattackBonus(roundResult: number): number {
  if (roundResult >= 0) return 0;
  const half = Math.abs(roundResult) / 2;
  return Math.min(MAX_COUNTER_BONUS, Math.floor(half / 5) * 5);
}

export function resolveRound(input: RoundResolutionInput): RoundResolution {
  const roundResult = input.attackTotal - input.defenseTotal;
  const absorption = computeAbsorption(input.absorption);
  const fumbleBonusToOpponent = input.attackerFumbled ? (input.attackerFumbleLevel ?? 0) : 0;

  // Only a positive result hits, and only a negative one earns a counterattack:
  // an exact tie is neither, and the attacker simply achieves nothing. A fumble
  // misses regardless of how the totals came out.
  if (roundResult <= 0 || input.attackerFumbled) {
    return {
      roundResult,
      hit: false,
      absorption,
      afterAbsorption: 0,
      damagePercent: 0,
      damage: 0,
      counterattack: roundResult < 0 && !input.attackerFumbled,
      counterBonus: input.attackerFumbled ? 0 : counterattackBonus(roundResult),
      fumbledAway: input.attackerFumbled === true,
      fumbleBonusToOpponent,
    };
  }

  const afterAbsorption = roundResult - absorption.total;
  const percent = damagePercent(afterAbsorption);

  return {
    roundResult,
    hit: true,
    absorption,
    afterAbsorption,
    damagePercent: percent,
    damage: applyDamagePercent(input.finalDamage, percent),
    counterattack: false,
    counterBonus: 0,
    fumbledAway: false,
    fumbleBonusToOpponent: 0,
  };
}
