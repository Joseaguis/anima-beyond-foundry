/**
 * Every rollable statistic an actor exposes, built from what the preparation
 * pipeline already published on `actor.system`. Nothing here recomputes a game
 * value: if a number looks wrong, the bug is upstream in `prep/` or in one of
 * the domains' `prepare.ts`, not here.
 *
 * PF2e builds its statistics inside the actor document; this project keeps the
 * actor document thin, so they are assembled on demand and cached per
 * preparation cycle by `AnimaActor#statistics`.
 */

import { CHARACTERISTIC_KEYS, type CharacteristicKey } from "../../actors/creature/prep/types";
import { DEFAULT_SECONDARY_ABILITIES } from "../../data/secondaryAbilities";
import { AnimaStatistic } from "./statistic";
import { isShieldSpell, isSpellGrade, spellCastAt, spellGrades } from "../actions/spellcast";
import {
  characteristicCheckSelectors,
  defenseSelectors,
  initiativeSelectors,
  magicProjectionSelectors,
  psychicPotentialSelectors,
  psychicProjectionSelectors,
  resistanceCheckSelectors,
  secondaryCheckSelectors,
  strikeAttackSelectors,
} from "../check/selectors";
import type { AnimaActor } from "../../documents/actor";
import type { AnimaItem } from "../../documents/item";
import type { StrikeFlag } from "../chat/flags";

export const RESISTANCE_KEYS = ["rf", "rm", "rp", "rv", "re"] as const;
export type ResistanceKey = (typeof RESISTANCE_KEYS)[number];

/** Which characteristic each Resistance derives from, per `prep/vitals.ts`. */
const RESISTANCE_LABELS: Record<ResistanceKey, string> = {
  rf: "ANIMA.RF",
  rm: "ANIMA.RM",
  rp: "ANIMA.RP",
  rv: "ANIMA.RV",
  re: "ANIMA.RE",
};

const CHARACTERISTIC_LABELS: Record<CharacteristicKey, string> = {
  str: "ANIMA.STR",
  dex: "ANIMA.DEX",
  agi: "ANIMA.AGI",
  con: "ANIMA.CON",
  int: "ANIMA.INT",
  pow: "ANIMA.POW",
  wp: "ANIMA.WP",
  per: "ANIMA.PER",
};

/** Loose view of the prepared system data, so this file stays free of casts. */
interface PreparedSystem {
  secondary?: Record<string, { final?: number }>;
  customSecondary?: Record<string, { final?: number; name?: string; baseChar?: CharacteristicKey }>;
  resistances?: Record<string, { total?: number }>;
  combat?: Record<string, { final?: number }>;
  initiative?: { final?: number };
  equipment?: {
    weapons?: WeaponView[];
    unarmed?: UnarmedView;
    dodge?: number;
  };
  magic?: { magicProjectionAttack?: number; magicProjectionDefense?: number };
  psychic?: { projectionFinal?: number; potentialFinal?: number };
}

interface WeaponView {
  id: string;
  name: string;
  weaponType: string;
  primaryType: string;
  attack: number;
  parry: number;
  initiative: number;
  finalDamage: number;
  atPiercing: number;
}

interface UnarmedView {
  attack: number;
  parry: number;
  initiative: number;
  finalDamage: number;
  critical: string;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * All of the actor's statistics, keyed by slug. Slugs are stable and are what
 * the sheet's roll buttons and the chat flags refer to.
 */
export function buildStatistics(actor: AnimaActor): Map<string, AnimaStatistic> {
  const system = actor.system as PreparedSystem;
  const statistics = new Map<string, AnimaStatistic>();
  const add = (statistic: AnimaStatistic): void => {
    statistics.set(statistic.slug, statistic);
  };

  // --- Secondary abilities -------------------------------------------------
  for (const definition of DEFAULT_SECONDARY_ABILITIES) {
    const final = system.secondary?.[definition.key]?.final;
    if (typeof final !== "number") continue;
    add(
      new AnimaStatistic(actor, {
        slug: `secondary.${definition.key}`,
        label: definition.labelKey,
        type: "skill-check",
        base: final,
        selectors: secondaryCheckSelectors(definition.key, definition.baseChar),
      }),
    );
  }

  for (const [id, ability] of Object.entries(system.customSecondary ?? {})) {
    if (typeof ability?.final !== "number") continue;
    add(
      new AnimaStatistic(actor, {
        slug: `customSecondary.${id}`,
        label: ability.name ?? id,
        type: "skill-check",
        base: ability.final,
        selectors: secondaryCheckSelectors(id, ability.baseChar ?? "dex"),
      }),
    );
  }

  // --- Resistances ---------------------------------------------------------
  for (const key of RESISTANCE_KEYS) {
    const total = system.resistances?.[key]?.total;
    if (typeof total !== "number") continue;
    add(
      new AnimaStatistic(actor, {
        slug: `resistance.${key}`,
        label: RESISTANCE_LABELS[key],
        type: "resistance-check",
        base: total,
        selectors: resistanceCheckSelectors(key),
      }),
    );
  }

  // --- Characteristics (the D10 checks) ------------------------------------
  for (const key of CHARACTERISTIC_KEYS) {
    const final = (system as unknown as Record<string, { final?: number }>)[key]?.final;
    if (typeof final !== "number") continue;
    add(
      new AnimaStatistic(actor, {
        slug: `characteristic.${key}`,
        label: CHARACTERISTIC_LABELS[key],
        type: "characteristic-check",
        base: final,
        selectors: characteristicCheckSelectors(key),
      }),
    );
  }

  // --- Bare combat abilities (no weapon) -----------------------------------
  const attack = system.combat?.attack?.final;
  if (typeof attack === "number") {
    add(
      new AnimaStatistic(actor, {
        slug: "attack",
        label: "ANIMA.Attack",
        type: "attack-roll",
        base: attack,
        selectors: strikeAttackSelectors({}),
      }),
    );
  }
  const parry = system.combat?.parry?.final;
  if (typeof parry === "number") {
    add(
      new AnimaStatistic(actor, {
        slug: "parry",
        label: "ANIMA.Parry",
        type: "defense-roll",
        base: parry,
        selectors: defenseSelectors("parry"),
      }),
    );
  }
  // Dodge is published on `equipment` with the armour penalty already folded in.
  const dodge = system.equipment?.dodge ?? system.combat?.dodge?.final;
  if (typeof dodge === "number") {
    add(
      new AnimaStatistic(actor, {
        slug: "dodge",
        label: "ANIMA.Dodge",
        type: "defense-roll",
        base: dodge,
        selectors: defenseSelectors("dodge"),
      }),
    );
  }

  // --- One attack and one parry per equipped weapon ------------------------
  for (const weapon of system.equipment?.weapons ?? []) {
    const slug = slugify(weapon.name);
    const strike: StrikeFlag = {
      finalDamage: weapon.finalDamage,
      atPiercing: weapon.atPiercing,
      attackType: weapon.primaryType,
      weaponName: weapon.name,
    };
    const shared = { weaponId: weapon.id, weaponSlug: slug, weaponType: weapon.weaponType };

    add(
      new AnimaStatistic(actor, {
        slug: `strike.${weapon.id}`,
        label: weapon.name,
        type: "attack-roll",
        base: weapon.attack,
        selectors: strikeAttackSelectors({ ...shared, attackType: weapon.primaryType }),
        rollOptions: [`weapon:${slug}`, `weapon:type:${weapon.weaponType}`],
        strike,
      }),
    );

    add(
      new AnimaStatistic(actor, {
        slug: `parry.${weapon.id}`,
        label: weapon.name,
        type: "defense-roll",
        base: weapon.parry,
        selectors: defenseSelectors("parry", shared),
        rollOptions: [`weapon:${slug}`],
      }),
    );
  }

  const unarmed = system.equipment?.unarmed;
  if (unarmed) {
    add(
      new AnimaStatistic(actor, {
        slug: "strike.unarmed",
        label: "ANIMA.Unarmed",
        type: "attack-roll",
        base: unarmed.attack,
        selectors: strikeAttackSelectors({ unarmed: true, attackType: unarmed.critical }),
        rollOptions: ["weapon:unarmed"],
        strike: {
          finalDamage: unarmed.finalDamage,
          atPiercing: 0,
          attackType: unarmed.critical,
        },
      }),
    );
  }

  // --- Supernatural --------------------------------------------------------
  const magicAttack = system.magic?.magicProjectionAttack;
  if (typeof magicAttack === "number") {
    add(
      new AnimaStatistic(actor, {
        slug: "magic-projection-attack",
        label: "ANIMA.MagicProj",
        type: "magic-projection-attack",
        base: magicAttack,
        selectors: magicProjectionSelectors("attack"),
      }),
    );
  }
  const magicDefense = system.magic?.magicProjectionDefense;
  if (typeof magicDefense === "number") {
    add(
      new AnimaStatistic(actor, {
        slug: "magic-projection-defense",
        label: "ANIMA.MagicProj",
        type: "magic-projection-defense",
        base: magicDefense,
        selectors: magicProjectionSelectors("defense"),
      }),
    );
  }

  const potential = system.psychic?.potentialFinal;
  if (typeof potential === "number") {
    add(
      new AnimaStatistic(actor, {
        slug: "psychic-potential",
        label: "ANIMA.PsychicPotential",
        type: "psychic-potential",
        base: potential,
        selectors: psychicPotentialSelectors(),
      }),
    );
  }
  const psychicProjection = system.psychic?.projectionFinal;
  if (typeof psychicProjection === "number") {
    add(
      new AnimaStatistic(actor, {
        slug: "psychic-projection",
        label: "ANIMA.PsiProj",
        type: "psychic-projection",
        base: psychicProjection,
        selectors: psychicProjectionSelectors("attack"),
      }),
    );
  }

  // --- One statistic per spell and per psychic power -----------------------
  //
  // These are the same two projections above, bound to the item so that rule
  // element predicates, the card's heading and the roll options can name it.
  // Spells carry no numeric damage in the model (each grade's effect is prose),
  // so a spell attack resolves the round without an automatic damage figure.
  for (const document of actor.items?.contents ?? []) {
    // Foundry narrows `item` per type inside the loop; the statistic only ever
    // needs the document, so widen it back to the system's own item type.
    const item = document as unknown as AnimaItem;
    const itemSystem = item.system as { slug?: string; damageType?: string } | undefined;
    const slug = itemSystem?.slug || slugify(item.name ?? "");

    if (item.type === "spell") {
      // A defence spell is projected with the defensive value and raises a
      // shield; everything else is thrown with the offensive one.
      const shieldSpell = isShieldSpell(item);
      const base = shieldSpell ? magicDefense : magicAttack;
      if (typeof base !== "number") continue;

      const baseCast = spellCastAt(item, "base");
      add(
        new AnimaStatistic(actor, {
          slug: `cast.${item.id}`,
          label: item.name ?? "",
          type: shieldSpell ? "magic-projection-defense" : "magic-projection-attack",
          base,
          selectors: magicProjectionSelectors(shieldSpell ? "defense" : "attack", slug),
          rollOptions: [`spell:${slug}`],
          item,
          strike: baseCast.strike,
          grades: spellGrades(item),
          castFor: (grade) => spellCastAt(item, isSpellGrade(grade) ? grade : "base"),
        }),
      );
    }

    if (item.type === "psychicPower" && typeof potential === "number") {
      add(
        new AnimaStatistic(actor, {
          slug: `power.${item.id}`,
          label: item.name ?? "",
          type: "psychic-potential",
          base: potential,
          selectors: psychicPotentialSelectors(slug),
          rollOptions: [`power:${slug}`],
          item,
        }),
      );
    }
  }

  // --- Initiative ----------------------------------------------------------
  const initiative = system.initiative?.final;
  if (typeof initiative === "number") {
    add(
      new AnimaStatistic(actor, {
        slug: "initiative",
        label: "ANIMA.Initiative",
        type: "initiative-roll",
        base: initiative,
        selectors: initiativeSelectors(),
      }),
    );
  }

  return statistics;
}
