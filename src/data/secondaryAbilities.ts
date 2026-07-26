export type CharacteristicKey = "str" | "dex" | "agi" | "con" | "int" | "pow" | "wp" | "per";

export type SecondaryAbilityGroup =
  | "athletics"
  | "social"
  | "perceptive"
  | "intellectual"
  | "vigor"
  | "subterfuge"
  | "creative";

/**
 * How the armor natural penalty applies to an ability ("Sufre el penalizador
 * por armadura", Core Exxet ch. 3):
 * - "full":        reducible with surplus Wear Armor over the requirement.
 * - "half":        Wear Armor can only reduce it down to half its value (Sigilo).
 * - "unreducible": Wear Armor never reduces it (Nadar).
 */
export type ArmorPenaltyKind = "full" | "half" | "unreducible";

export interface SecondaryAbilityDefinition {
  key: string;
  labelKey: string;
  group: SecondaryAbilityGroup;
  baseChar: CharacteristicKey;
  /** Present when the ability suffers the armor natural penalty. */
  armorPenalty?: ArmorPenaltyKind;
}

export const SECONDARY_ABILITY_GROUPS: { id: SecondaryAbilityGroup; labelKey: string }[] = [
  { id: "athletics", labelKey: "ANIMA.SecGroupAthletics" },
  { id: "social", labelKey: "ANIMA.SecGroupSocial" },
  { id: "perceptive", labelKey: "ANIMA.SecGroupPerceptive" },
  { id: "intellectual", labelKey: "ANIMA.SecGroupIntellectual" },
  { id: "vigor", labelKey: "ANIMA.SecGroupVigor" },
  { id: "subterfuge", labelKey: "ANIMA.SecGroupSubterfuge" },
  { id: "creative", labelKey: "ANIMA.SecGroupCreative" },
];

export const DEFAULT_SECONDARY_ABILITIES: SecondaryAbilityDefinition[] = [
  // Athletics
  { key: "acrobatics", labelKey: "ANIMA.SecAcrobatics", group: "athletics", baseChar: "agi", armorPenalty: "full" },
  { key: "athletics", labelKey: "ANIMA.SecAthletics", group: "athletics", baseChar: "agi", armorPenalty: "full" },
  { key: "swim", labelKey: "ANIMA.SecSwim", group: "athletics", baseChar: "agi", armorPenalty: "unreducible" },
  { key: "climb", labelKey: "ANIMA.SecClimb", group: "athletics", baseChar: "agi", armorPenalty: "full" },
  { key: "jump", labelKey: "ANIMA.SecJump", group: "athletics", baseChar: "str", armorPenalty: "full" },
  { key: "ride", labelKey: "ANIMA.SecRide", group: "athletics", baseChar: "agi" },

  // Social
  { key: "leadership", labelKey: "ANIMA.SecLeadership", group: "social", baseChar: "pow" },
  { key: "persuasion", labelKey: "ANIMA.SecPersuasion", group: "social", baseChar: "int" },
  { key: "intimidate", labelKey: "ANIMA.SecIntimidate", group: "social", baseChar: "wp" },
  { key: "style", labelKey: "ANIMA.SecStyle", group: "social", baseChar: "pow" },
  { key: "trading", labelKey: "ANIMA.SecTrading", group: "social", baseChar: "int" },
  { key: "streetwise", labelKey: "ANIMA.SecStreetwise", group: "social", baseChar: "int" },
  { key: "etiquette", labelKey: "ANIMA.SecEtiquette", group: "social", baseChar: "int" },

  // Perceptive
  { key: "notice", labelKey: "ANIMA.SecNotice", group: "perceptive", baseChar: "per" },
  { key: "search", labelKey: "ANIMA.SecSearch", group: "perceptive", baseChar: "per" },
  { key: "track", labelKey: "ANIMA.SecTrack", group: "perceptive", baseChar: "per" },

  // Intellectual
  { key: "animals", labelKey: "ANIMA.SecAnimals", group: "intellectual", baseChar: "int" },
  { key: "appraise", labelKey: "ANIMA.SecAppraise", group: "intellectual", baseChar: "int" },
  { key: "herbalismo", labelKey: "ANIMA.SecHerbalismo", group: "intellectual", baseChar: "int" },
  { key: "history", labelKey: "ANIMA.SecHistory", group: "intellectual", baseChar: "int" },
  { key: "magicAppraisal", labelKey: "ANIMA.SecMagicAppraisal", group: "intellectual", baseChar: "pow" },
  { key: "medicine", labelKey: "ANIMA.SecMedicine", group: "intellectual", baseChar: "int" },
  { key: "memorize", labelKey: "ANIMA.SecMemorize", group: "intellectual", baseChar: "int" },
  { key: "navigation", labelKey: "ANIMA.SecNavigation", group: "intellectual", baseChar: "int" },
  { key: "occult", labelKey: "ANIMA.SecOccult", group: "intellectual", baseChar: "int" },
  { key: "sciences", labelKey: "ANIMA.SecSciences", group: "intellectual", baseChar: "int" },
  { key: "tactics", labelKey: "ANIMA.SecTactics", group: "intellectual", baseChar: "int" },

  // Vigor
  { key: "composure", labelKey: "ANIMA.SecComposure", group: "vigor", baseChar: "wp" },
  { key: "featsOfStrength", labelKey: "ANIMA.SecFeatsOfStrength", group: "vigor", baseChar: "str", armorPenalty: "full" },
  { key: "withstandPain", labelKey: "ANIMA.SecWithstandPain", group: "vigor", baseChar: "wp" },

  // Subterfuge
  { key: "disguise", labelKey: "ANIMA.SecDisguise", group: "subterfuge", baseChar: "dex" },
  { key: "hide", labelKey: "ANIMA.SecHide", group: "subterfuge", baseChar: "per", armorPenalty: "full" },
  { key: "lockPicking", labelKey: "ANIMA.SecLockPicking", group: "subterfuge", baseChar: "dex" },
  { key: "poisons", labelKey: "ANIMA.SecPoisons", group: "subterfuge", baseChar: "int" },
  { key: "theft", labelKey: "ANIMA.SecTheft", group: "subterfuge", baseChar: "dex" },
  { key: "trapLore", labelKey: "ANIMA.SecTrapLore", group: "subterfuge", baseChar: "dex" },
  { key: "stealth", labelKey: "ANIMA.SecStealth", group: "subterfuge", baseChar: "agi", armorPenalty: "half" },

  // Creative
  { key: "art", labelKey: "ANIMA.SecArt", group: "creative", baseChar: "pow" },
  { key: "dance", labelKey: "ANIMA.SecDance", group: "creative", baseChar: "agi", armorPenalty: "full" },
  { key: "forging", labelKey: "ANIMA.SecForging", group: "creative", baseChar: "dex" },
  { key: "music", labelKey: "ANIMA.SecMusic", group: "creative", baseChar: "pow" },
  { key: "sleightOfHand", labelKey: "ANIMA.SecSleightOfHand", group: "creative", baseChar: "dex" },
  { key: "animism", labelKey: "ANIMA.SecAnimism", group: "creative", baseChar: "pow" },
];

export const SECONDARY_ABILITY_MAP = Object.fromEntries(
  DEFAULT_SECONDARY_ABILITIES.map((a) => [a.key, a]),
);

export const SECONDARY_ABILITIES_BY_GROUP = DEFAULT_SECONDARY_ABILITIES.reduce(
  (acc, ability) => {
    if (!acc[ability.group]) acc[ability.group] = [];
    acc[ability.group].push(ability);
    return acc;
  },
  {} as Record<SecondaryAbilityGroup, SecondaryAbilityDefinition[]>,
);
