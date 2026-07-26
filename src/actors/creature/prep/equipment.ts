import type { PrepContext } from "./types";
import type { CombatSystemSlice } from "./combat";

/**
 * Equipped weapons and armors (Core Exxet ch. 8; docs/reglas/armaduras.md,
 * armas-y-combate.md).
 *
 * Runs after prepareCombat (it needs the wear-armor final and the combat
 * finals to derive per-weapon values) and before prepareVitals /
 * prepareSecondaries (which consume the penalties it publishes on
 * `system.equipment`).
 */

export const AT_TYPES = ["fil", "con", "pen", "cal", "fri", "ele", "ene"] as const;
export type AtType = (typeof AT_TYPES)[number];

/** Snapshot of an equipped armor, published by ArmorModel.prepareActorData. */
export interface EquippedArmorData {
  name: string;
  armorType: string; // "hard" | "soft" | "natural"
  localization: string;
  quality: number;
  at: Record<AtType, number>;
  requirement: number;
  /** Stored positive in the schema; applied as a penalty. */
  naturalPenalty: number;
  movementPenalty: number;
  perceptionPenalty: number;
  /** Entereza / presencia del objeto (columnas Ent. y Pres. del Excel). */
  fortitude: number;
  presence: number;
}

/** Snapshot of an equipped weapon, published by WeaponModel.prepareActorData. */
export interface EquippedWeaponData {
  /** Id of the source item, for sheet updates (e.g. ammo selector). */
  id: string;
  name: string;
  weaponType: string;
  damage: number;
  speed: number;
  quality: number;
  requiredStr: number;
  primaryType: string;
  secondaryType: string;
  critical: number;
  hands: string;
  size: string;
  /** "normal" | "enormous" | "giant" (armas enormes y gigantes). */
  proportions: string;
  /** Entereza / rotura / presencia del objeto (columnas del Excel). */
  fortitude: number;
  breakage: number;
  presence: number;
  /** Proyectiles: rango (m), turnos de recarga y munición enlazada. */
  range: number;
  reload: number;
  ammoId: string;
  ammoName?: string;
  ammoDamage?: number;
  ammoQuality?: number;
}

/** Derived combat values of one equipped weapon. */
export interface WeaponComputed extends EquippedWeaponData {
  /** HA with this weapon: attack final + quality − missing-STR penalty. */
  attack: number;
  /** HP with this weapon: parry final + quality − missing-STR penalty. */
  parry: number;
  /** Contribution to initiative: speed + quality (− 40 if undersized wielder). */
  initiative: number;
  /** Final damage: ceil₁₀(scaled base + STR bonus) + 2×quality + damage mods. */
  finalDamage: number;
  /** Defender TA reduction: 1 per +5 of quality (never negative). */
  atPiercing: number;
  /** False when the wielder's STR is below the (proportion-adjusted) requirement. */
  meetsStrength: boolean;
  /** False when the wielder's size cannot handle the weapon's proportions at all. */
  meetsSize: boolean;
}

/** Unarmed combat: speed 20, base damage 10 + STR bonus (Core Exxet p. 73). */
export interface UnarmedComputed {
  attack: number;
  parry: number;
  initiative: number;
  finalDamage: number;
  critical: string;
}

export interface EquipmentSummary {
  /** Names of the equipped armors (for display). */
  armors: string[];
  /** Combined TA per attack type: highest + half of each other (floored). */
  at: Record<AtType, number>;
  /** Combined wear-armor requirement: the layers' requirements are summed. */
  requirement: number;
  /** Wear-armor points above the requirement (≥ 0); reduces the natural penalty. */
  surplus: number;
  /**
   * Natural penalty applied to initiative and to armorPenalty:"full"
   * secondaries (≤ 0): summed layer natural penalties reduced by the surplus,
   * plus −20 per extra non-natural layer (never reducible).
   */
  naturalPenalty: number;
  /** Same, but the surplus reduction is capped at half (Sigilo). */
  naturalPenaltyHalf: number;
  /** Same, without any surplus reduction (Nadar). */
  naturalPenaltyUnreduced: number;
  /** Unmet requirement: wearArmor − requirement, to every physical action (≤ 0). */
  physicalActionPenalty: number;
  /** Movement restriction: sum of layers − 1 per full 50 of surplus (≥ 0). */
  movementPenalty: number;
  /** Sum of perception penalties (helmets; ≥ 0). */
  perceptionPenalty: number;
  /** Weapon initiative contribution: single weapon's, or the slowest of several. */
  weaponInitiative?: number;
  /**
   * Esquiva mostrada en los bloques de armas: dodge final + Bono Esq. de la
   * caja de equipo. El bono NO toca combat.dodge.final (que alimenta HUD,
   * secundarias, etc.), solo la defensa de los bloques.
   */
  dodge: number;
  weapons: WeaponComputed[];
  unarmed: UnarmedComputed;
}

export interface EquipmentSystemSlice extends CombatSystemSlice {
  equippedArmors?: EquippedArmorData[];
  equippedWeapons?: EquippedWeaponData[];
  equipment?: EquipmentSummary;
}

/** Combined TA: the highest value as base plus half of each other, rounded down. */
export function combineAt(values: number[]): number {
  if (values.length === 0) return 0;
  const max = Math.max(...values);
  const maxIndex = values.indexOf(max);
  return values.reduce(
    (total, value, index) => total + (index === maxIndex ? value : Math.floor(value / 2)),
    0,
  );
}

/** Damage is rounded up in groups of 10 after adding the STR bonus. */
function ceil10(value: number): number {
  return Math.ceil(value / 10) * 10;
}

/**
 * Effects of armas enormes y gigantes (Core Exxet p. 73): scaled base damage,
 * extra STR required and the wielder-size thresholds (min to wield at all /
 * min to avoid the special −40 turn penalty).
 */
const WEAPON_PROPORTIONS: Record<
  string,
  { scaleDamage: (base: number) => number; extraStr: number; minSize: number; noPenaltySize: number }
> = {
  enormous: {
    scaleDamage: (base) => Math.floor((base * 1.5) / 5) * 5,
    extraStr: 2,
    minSize: 9,
    noPenaltySize: 23,
  },
  giant: {
    scaleDamage: (base) => base * 2,
    extraStr: 5,
    minSize: 23,
    noPenaltySize: 29,
  },
};

export function prepareEquipment(system: EquipmentSystemSlice, ctx: PrepContext): void {
  const armors = system.equippedArmors ?? [];
  // La munición equipada no genera bloque propio ni arrastra la iniciativa;
  // se consume vía el ammoId del arma de proyectiles.
  const weapons = (system.equippedWeapons ?? []).filter((w) => w.weaponType !== "ammo");
  const cb = system.combat;

  // --- Armors ---------------------------------------------------------------
  // Armor quality (each +5): +1 TA, −5 natural penalty, −5 requirement,
  // −1 movement restriction (entereza/presence live on the item itself).
  // The TA bonus is only applied to types the armor actually protects.
  const effective = armors.map((armor) => {
    const grades = Math.trunc((armor.quality ?? 0) / 5);
    const at = {} as Record<AtType, number>;
    for (const type of AT_TYPES) {
      const base = armor.at?.[type] ?? 0;
      at[type] = base > 0 ? Math.max(0, base + grades) : 0;
    }
    return {
      ...armor,
      at,
      naturalPenalty: Math.max(0, (armor.naturalPenalty ?? 0) - grades * 5),
      requirement: Math.max(0, (armor.requirement ?? 0) - grades * 5),
      movementPenalty: Math.max(0, (armor.movementPenalty ?? 0) - grades),
    };
  });

  const at = {} as Record<AtType, number>;
  for (const type of AT_TYPES) {
    at[type] = combineAt(effective.map((a) => a.at[type]).filter((v) => v > 0));
  }

  // Combined layers: requirements, natural penalties and movement
  // restrictions are summed (Core Exxet p. 81).
  const requirement = effective.reduce((sum, a) => sum + a.requirement, 0);
  const totalNatural = effective.reduce((sum, a) => sum + a.naturalPenalty, 0);
  const movementBase = effective.reduce((sum, a) => sum + a.movementPenalty, 0);
  const perceptionPenalty = effective.reduce((sum, a) => sum + (a.perceptionPenalty ?? 0), 0);

  // Every non-natural layer beyond the first: −20 to turn and affected
  // secondaries. Automatic, never reduced by Wear Armor.
  const layers = effective.filter((a) => a.armorType !== "natural").length;
  const layerPenalty = layers > 1 ? -20 * (layers - 1) : 0;

  // Wear Armor above the combined requirement reduces the natural penalty
  // 1:1, and each full 50 of surplus removes 1 point of movement restriction.
  // Below it, the difference penalizes every physical action.
  const wearArmor = cb?.wearArmor?.final ?? 0;
  const surplus = Math.max(0, wearArmor - requirement);
  const naturalPenalty = -Math.max(0, totalNatural - surplus) + layerPenalty;
  const naturalPenaltyHalf =
    -Math.max(Math.ceil(totalNatural / 2), totalNatural - surplus) + layerPenalty;
  const naturalPenaltyUnreduced = -totalNatural + layerPenalty;
  // Without armor there is nothing to fail to carry, even if the ability is
  // temporarily negative (fatigue and the like).
  const physicalActionPenalty =
    effective.length > 0 ? Math.min(0, wearArmor - requirement) : 0;
  const movementPenalty = Math.max(0, movementBase - Math.floor(surplus / 50));

  if (cb && physicalActionPenalty !== 0) {
    // Wear Armor itself is exempt: it is the ability that decides the penalty.
    for (const key of ["attack", "parry", "dodge"] as const) {
      const skill = cb[key];
      if (skill?.final !== undefined) skill.final += physicalActionPenalty;
    }
  }

  // --- Weapons ----------------------------------------------------------------
  const strBonus = ctx.charMods.str ?? 0;
  const strFinal = ctx.charFinals.str ?? 0;
  // Size = STR + CON (Core Exxet size table: 9-18 is "Medio").
  const size = strFinal + (ctx.charFinals.con ?? 0);
  const damageMod = cb?.damageBonus ?? 0;
  const attackBase = cb?.attack?.final ?? 0;
  const parryBase = cb?.parry?.final ?? 0;
  // Bonos manuales de la caja "Equipo (Turno)" del Excel: aplican a todas las
  // armas y al desarmado, nunca a las habilidades de combate globales.
  const eb = cb?.equipBonus ?? {};
  const ebTurn = eb.turn ?? 0;
  const ebAttack = eb.attack ?? 0;
  const ebParry = eb.parry ?? 0;
  const ebDamage = eb.damage ?? 0;

  const computed: WeaponComputed[] = weapons.map((weapon) => {
    const quality = weapon.quality ?? 0;
    const prop = WEAPON_PROPORTIONS[weapon.proportions ?? "normal"];
    // Proyectiles con munición enlazada: el daño (y su calidad) son los de la
    // munición; HA/parada/turno conservan la calidad del arma. ⚠ Matiz exacto
    // de la regla pendiente de verificar (docs/reglas/armas-y-combate.md).
    const usesAmmo = weapon.weaponType === "ranged" && weapon.ammoDamage !== undefined;
    const damageBase = usesAmmo ? (weapon.ammoDamage ?? 0) : (weapon.damage ?? 0);
    const damageQuality = usesAmmo ? (weapon.ammoQuality ?? 0) : quality;
    const scaledBase = prop ? prop.scaleDamage(damageBase) : damageBase;
    const requiredStr = (weapon.requiredStr ?? 0) + (prop?.extraStr ?? 0);
    // −10 to the ability with the weapon per point of STR below the required.
    const strPenalty = -10 * Math.max(0, requiredStr - strFinal);
    // Two-handed grip doubles the STR bonus to damage.
    const grip = weapon.hands === "two" ? 2 : 1;
    // Undersized wielders of enormous/giant weapons take a special −40 to turn.
    const sizePenalty = prop && size < prop.noPenaltySize ? -40 : 0;

    return {
      ...weapon,
      attack: attackBase + quality + strPenalty + ebAttack,
      parry: parryBase + quality + strPenalty + ebParry,
      initiative: (weapon.speed ?? 0) + quality + sizePenalty + ebTurn,
      finalDamage: ceil10(scaledBase + strBonus * grip) + damageQuality * 2 + damageMod + ebDamage,
      atPiercing: Math.max(0, Math.trunc(damageQuality / 5)),
      meetsStrength: strFinal >= requiredStr,
      meetsSize: prop ? size >= prop.minSize : true,
    };
  });

  // One weapon contributes its own turn; with several (two weapons, weapon +
  // shield) the slowest one applies (Core Exxet p. 89).
  const weaponInitiative =
    computed.length > 0 ? Math.min(...computed.map((w) => w.initiative)) : undefined;

  const unarmed: UnarmedComputed = {
    attack: attackBase + ebAttack,
    parry: parryBase + ebParry,
    initiative: 20 + ebTurn,
    // Unarmed damage does not round up in groups of 10 (that rule is for
    // weapon base damage).
    finalDamage: 10 + strBonus + damageMod + ebDamage,
    critical: "CON",
  };

  system.equipment = {
    armors: armors.map((a) => a.name),
    at,
    requirement,
    surplus,
    naturalPenalty,
    naturalPenaltyHalf,
    naturalPenaltyUnreduced,
    physicalActionPenalty,
    movementPenalty,
    perceptionPenalty,
    weaponInitiative,
    dodge: (cb?.dodge?.final ?? 0) + (eb.dodge ?? 0),
    weapons: computed,
    unarmed,
  };
}
