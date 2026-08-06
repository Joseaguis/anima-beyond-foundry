/**
 * Selectors: the buckets a check draws its situational modifiers and roll
 * options from. PF2e calls them "domains" (`getStrikeAttackDomains`,
 * `pf2e/src/module/actor/helpers.ts:316`); this project already uses "domain"
 * for the vertical game subsystems under `src/domains/`, so they are selectors
 * here to keep the two apart.
 *
 * The convention is broad-to-narrow: a check lists every bucket it belongs to,
 * from `all` down to the specific weapon, and a rule element opts into whichever
 * level it wants to affect. `all` is added by the extractor, never listed here.
 */

import type { CharacteristicKey } from "../../actors/creature/prep/types";

/** Every selector list ends up including this one. */
export const ALL_SELECTOR = "all";

function unique(selectors: (string | false | null | undefined)[]): string[] {
  return [...new Set(selectors.filter((s): s is string => typeof s === "string" && s.length > 0))];
}

/** A secondary ability check: `athletics-check`, `dex-based`, `secondary-check`… */
export function secondaryCheckSelectors(key: string, characteristic: CharacteristicKey): string[] {
  return unique([
    `secondary.${key}-check`,
    `${key}-check`,
    `${characteristic}-based`,
    "secondary-check",
    "physical-actions",
    "all-actions",
    "check",
  ]);
}

/** A Resistance check. Resistances are not actions, so no action selectors. */
export function resistanceCheckSelectors(key: string): string[] {
  return unique([`${key}-check`, "resistance-check", "check"]);
}

/** A characteristic check (the D10 ones). */
export function characteristicCheckSelectors(key: CharacteristicKey): string[] {
  return unique([`${key}-check`, `${key}-based`, "characteristic-check", "check"]);
}

export interface StrikeSelectorInput {
  /** Item id of the weapon, absent for unarmed. */
  weaponId?: string | null;
  /** Slugified weapon name, when there is one. */
  weaponSlug?: string | null;
  /** `melee`, `ranged`, `thrown`, `shield`… as stored on the weapon. */
  weaponType?: string | null;
  /** Attack type: `FIL`, `CON`, `PEN`… */
  attackType?: string | null;
  unarmed?: boolean;
}

/** An attack roll with a weapon (or unarmed). Mirrors getStrikeAttackDomains. */
export function strikeAttackSelectors(input: StrikeSelectorInput): string[] {
  const ranged = input.weaponType === "ranged" || input.weaponType === "thrown";
  return unique([
    input.weaponId && `${input.weaponId}-attack`,
    input.weaponSlug && `${input.weaponSlug}-attack`,
    input.attackType && `${input.attackType.toLowerCase()}-attack-roll`,
    input.unarmed ? "unarmed-attack-roll" : "weapon-attack-roll",
    ranged ? "ranged-attack-roll" : "melee-attack-roll",
    "attack-roll",
    "attack",
    "physical-actions",
    "all-actions",
    "check",
  ]);
}

/** A defence roll: parry with a weapon, or dodge. */
export function defenseSelectors(
  kind: "parry" | "dodge",
  input: StrikeSelectorInput = {},
): string[] {
  return unique([
    input.weaponId && `${input.weaponId}-${kind}`,
    input.weaponSlug && `${input.weaponSlug}-${kind}`,
    `${kind}-roll`,
    "defense-roll",
    "defense",
    "physical-actions",
    "all-actions",
    "check",
  ]);
}

/**
 * Magic Projection. It applies no combat penalties either attacking or
 * defending (Core p. 116), so `physical-actions` is deliberately absent —
 * matching how `domains/magic/prepare.ts` already computes the final value.
 */
export function magicProjectionSelectors(
  kind: "attack" | "defense",
  spellSlug?: string | null,
): string[] {
  return unique([
    spellSlug && `${spellSlug}-cast`,
    `magic-projection-${kind}-roll`,
    "magic-projection-roll",
    kind === "attack" ? "attack" : "defense",
    "all-actions",
    "check",
  ]);
}

/** Psychic potential: the `1d100 + Potencial` control that fires a power. */
export function psychicPotentialSelectors(powerSlug?: string | null): string[] {
  return unique([
    powerSlug && `${powerSlug}-potential`,
    "psychic-potential-check",
    "all-actions",
    "check",
  ]);
}

/** Psychic projection: reaching the target with a power. */
export function psychicProjectionSelectors(
  kind: "attack" | "defense",
  powerSlug?: string | null,
): string[] {
  return unique([
    powerSlug && `${powerSlug}-projection`,
    `psychic-projection-${kind}-roll`,
    "psychic-projection-roll",
    kind === "attack" ? "attack" : "defense",
    "all-actions",
    "check",
  ]);
}

/** Initiative (the "turno" roll). */
export function initiativeSelectors(weaponId?: string | null): string[] {
  return unique([weaponId && `${weaponId}-initiative`, "initiative-roll", "check"]);
}
