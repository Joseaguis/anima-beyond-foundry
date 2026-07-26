import { DEFAULT_SECONDARY_ABILITIES } from "../data/secondaryAbilities";

/**
 * Registry of every stat a modifier can target. Each key maps to a label
 * (localization key) and a group used to organize the editor dropdown.
 *
 * The keys are consumed by `CharacterModel.prepareDerivedData()` via the `mod(key)`
 * helper, so adding a new target here means: add the key + wire `+ mod("<key>")`
 * into the relevant calculation.
 */
export interface TargetDef {
  /** Localization key for the human-readable label. */
  labelKey: string;
  group: TargetGroup;
}

export type TargetGroup =
  | "general"
  | "characteristic"
  | "combat"
  | "resistance"
  | "secondary"
  | "supernatural"
  | "vital";

const baseTargets: Record<string, TargetDef> = {
  // Aggregated action penalties/bonuses (see docs/reglas/modificadores.md):
  // allActions hits every action (attack, defenses, secondaries, magic and
  // psychic projection); physicalActions only the physical ones.
  allActions: { labelKey: "ANIMA.AllActions", group: "general" },
  physicalActions: { labelKey: "ANIMA.PhysicalActions", group: "general" },

  // Characteristics (applied to .final before derived calc, so they propagate)
  str: { labelKey: "ANIMA.STR", group: "characteristic" },
  dex: { labelKey: "ANIMA.DEX", group: "characteristic" },
  agi: { labelKey: "ANIMA.AGI", group: "characteristic" },
  con: { labelKey: "ANIMA.CON", group: "characteristic" },
  int: { labelKey: "ANIMA.INT", group: "characteristic" },
  pow: { labelKey: "ANIMA.POW", group: "characteristic" },
  wp: { labelKey: "ANIMA.WP", group: "characteristic" },
  per: { labelKey: "ANIMA.PER", group: "characteristic" },

  // Combat
  attack: { labelKey: "ANIMA.Attack", group: "combat" },
  parry: { labelKey: "ANIMA.Parry", group: "combat" },
  dodge: { labelKey: "ANIMA.Dodge", group: "combat" },
  wearArmor: { labelKey: "ANIMA.WearArmor", group: "combat" },
  damage: { labelKey: "ANIMA.Damage", group: "combat" },
  initiative: { labelKey: "ANIMA.Initiative", group: "combat" },

  // Resistances
  rf: { labelKey: "ANIMA.RF", group: "resistance" },
  rm: { labelKey: "ANIMA.RM", group: "resistance" },
  rp: { labelKey: "ANIMA.RP", group: "resistance" },
  rv: { labelKey: "ANIMA.RV", group: "resistance" },
  re: { labelKey: "ANIMA.RE", group: "resistance" },

  // Supernatural
  zeonMax: { labelKey: "ANIMA.ZeonMax", group: "supernatural" },
  act: { labelKey: "ANIMA.ACT", group: "supernatural" },
  magicProjection: { labelKey: "ANIMA.MagicProj", group: "supernatural" },
  zeonRegen: { labelKey: "ANIMA.ZeonRegen", group: "supernatural" },
  magicLevel: { labelKey: "ANIMA.MagicLevel", group: "supernatural" },
  summon: { labelKey: "ANIMA.Summon", group: "supernatural" },
  control: { labelKey: "ANIMA.Control", group: "supernatural" },
  bind: { labelKey: "ANIMA.Bind", group: "supernatural" },
  banish: { labelKey: "ANIMA.Banish", group: "supernatural" },
  ki: { labelKey: "ANIMA.KiPoints", group: "supernatural" },
  kiAccumulation: { labelKey: "ANIMA.KiAccumulation", group: "supernatural" },
  psychicCv: { labelKey: "ANIMA.CVMax", group: "supernatural" },
  psychicProjection: { labelKey: "ANIMA.PsiProj", group: "supernatural" },

  // Vital / misc
  lifePoints: { labelKey: "ANIMA.LifePoints", group: "vital" },
  fatigue: { labelKey: "ANIMA.Fatigue", group: "vital" },
  movement: { labelKey: "ANIMA.Movement", group: "vital" },
  regeneration: { labelKey: "ANIMA.Regeneration", group: "vital" },
  presence: { labelKey: "ANIMA.Presence", group: "vital" },
};

// Secondary abilities: one target per ability, keyed `secondary.<key>`.
const secondaryTargets: Record<string, TargetDef> = Object.fromEntries(
  DEFAULT_SECONDARY_ABILITIES.map((a) => [
    `secondary.${a.key}`,
    { labelKey: a.labelKey, group: "secondary" as const },
  ]),
);

export const TARGETS: Record<string, TargetDef> = { ...baseTargets, ...secondaryTargets };

export function isTarget(key: string): boolean {
  return key in TARGETS;
}

/** Options for a grouped <select>, resolving labels via game.i18n when available. */
export function targetOptions(): { group: TargetGroup; value: string; label: string }[] {
  const localize = (key: string): string =>
    typeof game !== "undefined" && game.i18n ? game.i18n.localize(key) : key;
  return Object.entries(TARGETS).map(([value, def]) => ({
    group: def.group,
    value,
    label: localize(def.labelKey),
  }));
}
