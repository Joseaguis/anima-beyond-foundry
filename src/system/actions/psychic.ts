/**
 * Using a psychic power.
 *
 * The shape of the action is the opposite of a spell's. A caster picks a
 * spell's grade before rolling; a psychic rolls first and *then* reads which
 * row of the difficulty ladder the potential check reached (Core p. 212). So
 * there is nothing to choose up front — the grade is an output.
 *
 * Reaching the grade is only half of it: an offensive power still has to get
 * to the target, which is a separate Psychic Projection roll. The potential
 * card offers it as a follow-up.
 */

import { DIFFICULTY_LEVELS, type DifficultyKey } from "../../actors/creature/tables";
import type { AnimaItem } from "../../documents/item";
import type { ShieldTemplate } from "../combat/shield";
import type { StrikeFlag } from "../chat/flags";

interface PsychicGradeData {
  difficulty?: string;
  effect?: string;
  damage?: number;
  shieldPoints?: number;
  damageBarrier?: number;
}

export interface PsychicOutcome {
  gradeKey: string;
  gradeLabel: string;
  effect: string;
  /** Null when the reached grade deals no damage. */
  strike: StrikeFlag | null;
  /** Null when the reached grade raises no shield. */
  shield: ShieldTemplate | null;
}

/**
 * The grade rows of a power, in ladder order. The extractor always emits the
 * ten of them so a row's position never shifts, which is what lets a reached
 * difficulty be looked up by index.
 */
function gradeRows(item: AnimaItem): PsychicGradeData[] {
  return ((item.system as { grades?: PsychicGradeData[] }).grades ?? []) as PsychicGradeData[];
}

/** What the power does at the difficulty the potential check actually reached. */
export function psychicOutcomeAt(item: AnimaItem, grade: DifficultyKey): PsychicOutcome | null {
  const index = DIFFICULTY_LEVELS.findIndex((level) => level.key === grade);
  if (index < 0) return null;

  const row = gradeRows(item)[index];
  const level = DIFFICULTY_LEVELS[index];
  if (!row) return null;

  const damage = row.damage ?? 0;
  const shieldPoints = row.shieldPoints ?? 0;

  return {
    gradeKey: level.key,
    gradeLabel: level.label,
    effect: row.effect ?? "",
    strike:
      damage > 0
        ? {
            finalDamage: damage,
            atPiercing: 0,
            attackType: (item.system as { damageType?: string }).damageType || null,
            // Core p. 211: no TA is effective against a psychic power, so the
            // defender only ever gets the base 20 of Absorción.
            ignoresArmor: true,
            weaponName: item.name ?? "",
          }
        : null,
    shield:
      shieldPoints > 0
        ? {
            name: item.name ?? "",
            origin: "psychic",
            itemId: item.id ?? undefined,
            grade: level.key,
            maxPoints: shieldPoints,
            damageBarrier: row.damageBarrier ?? 0,
            // The telekinetic shield keeps the points it was created with but
            // sheds 5 a round down to what the psychic can sustain (Core p. 212).
            decayPerRound: /telequin/i.test(item.name ?? "") ? 5 : 0,
          }
        : null,
  };
}

/** Whether a power ever deals damage, at any grade. */
export function isAttackPower(item: AnimaItem): boolean {
  return item.type === "psychicPower" && gradeRows(item).some((g) => (g.damage ?? 0) > 0);
}

/** Whether a power ever raises a shield, at any grade. */
export function isShieldPower(item: AnimaItem): boolean {
  return item.type === "psychicPower" && gradeRows(item).some((g) => (g.shieldPoints ?? 0) > 0);
}
