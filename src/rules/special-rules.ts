/**
 * Catalog of the sheet's special rules (house rules): per-actor toggles that
 * change a formula somewhere in the derived-data pipeline, the way the Excel
 * sheet's side notes do. An actor activates one by adding an entry under
 * `system.specialRules[key]`; the pipeline reads the aggregate through
 * `PrepContext.flag(key)` (> 0 means active), so a future rule element on an
 * item (advantage) can feed the same flag via synthetics.
 */

export interface SpecialRuleDef {
  key: string;
  /** i18n key of the rule's display name. */
  labelKey: string;
  /** i18n key of the short description shown in the UI. */
  hintKey: string;
  /** Whether the rule carries an editable numeric value (e.g. extra ranges). */
  hasValue: boolean;
}

export const SPECIAL_RULES: Record<string, SpecialRuleDef> = {
  // Secondary abilities: the "Bonos" cube caps at 100 (Excel). With this rule
  // the excess above 100 counts at half value, rounded down to a multiple of 5.
  secondaryBonusSoftCap: {
    key: "secondaryBonusSoftCap",
    labelKey: "ANIMA.RuleSoftCap",
    hintKey: "ANIMA.RuleSoftCapHint",
    hasValue: false,
  },
  // Future catalog entries (design placeholders, not implemented yet):
  // extraCreationPoints { hasValue: true }, openRollRange { hasValue: true },
  // fumbleRange { hasValue: true }.
};

/** A persisted special-rule entry on the actor. */
export interface SpecialRuleEntry {
  value?: number | null;
  note?: string;
}

/**
 * Numeric contribution of a persisted entry: an active rule without a value
 * counts as 1 (a plain toggle); absent rules contribute 0.
 */
export function specialRuleFlagValue(entry: SpecialRuleEntry | undefined): number {
  if (!entry) return 0;
  return typeof entry.value === "number" ? entry.value : 1;
}
