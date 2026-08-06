/**
 * "This spell, cast at that grade" — the one place that knows how a spell's
 * four grades turn into something the roll engine can use.
 *
 * A spell is not one action but four (Core p. 119): each grade has its own Zeón
 * cost, INT requirement, damage and shield pool. Which one is used is decided
 * when the dice are rolled, so the statistic is built at Base and re-derived
 * here once the player picks a grade in the dialog.
 */

import type { AnimaItem } from "../../documents/item";
import type { StrikeFlag } from "../chat/flags";
import type { ShieldTemplate } from "../combat/shield";

export const SPELL_GRADE_KEYS = ["base", "intermediate", "advanced", "arcane"] as const;
export type SpellGradeKey = (typeof SPELL_GRADE_KEYS)[number];

const GRADE_LABELS: Record<SpellGradeKey, string> = {
  base: "Base",
  intermediate: "Intermedio",
  advanced: "Avanzado",
  arcane: "Arcano",
};

/** One grade as the dialog shows it. */
export interface GradeOption {
  key: string;
  label: string;
  /** Zeón spent to cast at this grade. */
  cost: number;
  /** Base damage at this grade; 0 when the spell deals none. */
  damage: number;
  /** Shield pool this grade raises; 0 when it is not a shield. */
  shieldPoints: number;
}

export interface SpellCast {
  grade: SpellGradeKey;
  zeonCost: number;
  intRequired: number;
  /** Null when the spell deals no damage. */
  strike: StrikeFlag | null;
  /** Null when the spell raises no shield. */
  shield: ShieldTemplate | null;
}

interface SpellGradeData {
  zeonCost?: number;
  intRequired?: number;
  damage?: number;
  shieldPoints?: number;
  damageBarrier?: number;
  effect?: string;
}

interface SpellSystemView {
  spellType?: string;
  damageType?: string;
  atPiercing?: number;
  grades?: Partial<Record<SpellGradeKey, SpellGradeData>>;
}

function gradeData(item: AnimaItem, grade: SpellGradeKey): SpellGradeData {
  return (item.system as SpellSystemView).grades?.[grade] ?? {};
}

export function isSpellGrade(value: unknown): value is SpellGradeKey {
  return (SPELL_GRADE_KEYS as readonly string[]).includes(String(value));
}

/** The four grades, for the dialog's selector. */
export function spellGrades(item: AnimaItem): GradeOption[] {
  return SPELL_GRADE_KEYS.map((key) => {
    const data = gradeData(item, key);
    return {
      key,
      label: GRADE_LABELS[key],
      cost: data.zeonCost ?? 0,
      damage: data.damage ?? 0,
      shieldPoints: data.shieldPoints ?? 0,
    };
  });
}

/** Everything the check engine needs to resolve this spell at one grade. */
export function spellCastAt(item: AnimaItem, grade: SpellGradeKey): SpellCast {
  const system = item.system as SpellSystemView;
  const data = gradeData(item, grade);
  const damage = data.damage ?? 0;
  const shieldPoints = data.shieldPoints ?? 0;

  return {
    grade,
    zeonCost: data.zeonCost ?? 0,
    intRequired: data.intRequired ?? 0,
    // A spell with no damage figure still resolves the round — it just cannot
    // take life points off anyone, so no strike is attached at all rather than
    // a strike that silently deals zero.
    strike:
      damage > 0
        ? {
            finalDamage: damage,
            atPiercing: system.atPiercing ?? 0,
            attackType: system.damageType || null,
            weaponName: item.name ?? "",
          }
        : null,
    shield:
      shieldPoints > 0
        ? {
            name: item.name ?? "",
            origin: "magic",
            itemId: item.id ?? undefined,
            grade,
            maxPoints: shieldPoints,
            damageBarrier: data.damageBarrier ?? 0,
          }
        : null,
  };
}

/** Whether this item is a spell that raises a shield at any grade. */
export function isShieldSpell(item: AnimaItem): boolean {
  if (item.type !== "spell") return false;
  return SPELL_GRADE_KEYS.some((key) => (gradeData(item, key).shieldPoints ?? 0) > 0);
}

/** Whether this item is a spell that deals damage at any grade. */
export function isAttackSpell(item: AnimaItem): boolean {
  if (item.type !== "spell") return false;
  return SPELL_GRADE_KEYS.some((key) => (gradeData(item, key).damage ?? 0) > 0);
}
