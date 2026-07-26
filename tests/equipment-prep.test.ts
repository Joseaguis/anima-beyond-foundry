/**
 * Equipment phase, state penalties (fatigue) and the aggregated
 * allActions/physicalActions modifier targets. Rule references: Core Exxet
 * ch. 3 (armor penalty on secondaries), ch. 6 (fatigue), ch. 8 (armors,
 * weapons); docs/reglas/.
 */
import { describe, expect, it } from "vitest";
import { prepareCharacteristics } from "../src/actors/creature/prep/characteristics";
import { prepareState } from "../src/actors/creature/prep/state";
import { prepareCombat } from "../src/actors/creature/prep/combat";
import {
  combineAt,
  prepareEquipment,
  type EquippedArmorData,
  type EquippedWeaponData,
} from "../src/actors/creature/prep/equipment";
import { prepareVitals } from "../src/actors/creature/prep/vitals";
import { prepareSupernatural } from "../src/actors/creature/prep/supernatural";
import { prepareSecondaries } from "../src/actors/creature/prep/secondaries";
import { defaultCategoryData, type PrepContext } from "../src/actors/creature/prep/types";
import { stackTotal, type Modifier } from "../src/rules/modifier";

function makeArmor(overrides: Partial<EquippedArmorData> = {}): EquippedArmorData {
  return {
    name: "Armadura",
    armorType: "soft",
    localization: "complete",
    quality: 0,
    at: { fil: 0, con: 0, pen: 0, cal: 0, fri: 0, ele: 0, ene: 0 },
    requirement: 0,
    naturalPenalty: 0,
    movementPenalty: 0,
    perceptionPenalty: 0,
    fortitude: 0,
    presence: 0,
    ...overrides,
  };
}

function makeWeapon(overrides: Partial<EquippedWeaponData> = {}): EquippedWeaponData {
  return {
    id: "",
    name: "Arma",
    weaponType: "melee",
    damage: 40,
    speed: 0,
    quality: 0,
    requiredStr: 0,
    primaryType: "FIL",
    secondaryType: "",
    critical: 0,
    hands: "one",
    size: "medium",
    proportions: "normal",
    fortitude: 0,
    breakage: 0,
    presence: 0,
    range: 0,
    reload: 0,
    ammoId: "",
    ...overrides,
  };
}

function baseSystem(): Record<string, any> {
  return {
    level: 2,
    str: { base: 8, bonus: 0 }, // mod +10
    dex: { base: 7, bonus: 0 }, // mod +5
    agi: { base: 7, bonus: 0 },
    con: { base: 7, bonus: 0 },
    int: { base: 5, bonus: 0 },
    pow: { base: 5, bonus: 0 },
    wp: { base: 5, bonus: 0 },
    per: { base: 5, bonus: 0 },
    initiative: { base: 20, armorPenalty: 0, weaponBonus: 0 },
    lifePoints: { max: 0, current: 0, multiples: 0 },
    fatigue: { max: 7, current: 7 },
    combat: {
      attack: { dp: 100, special: 0 },
      parry: { dp: 100, special: 0 },
      dodge: { dp: 100, special: 0 },
      // base floor(80/2) = 40 + STR mod 10 = 50
      wearArmor: { dp: 80, special: 0 },
    },
    secondary: {
      acrobatics: { dp: 20, special: 0 },
      swim: { dp: 20, special: 0 },
      stealth: { dp: 20, special: 0 },
      notice: { dp: 20, special: 0 },
    },
    magic: { zeonDp: 0, magicProjectionDp: 60, magicProjectionSpecial: 0 },
    psychic: { cvDp: 0, projectionDp: 60, projectionSpecial: 0 },
  };
}

const SECONDARIES = [
  { key: "acrobatics", labelKey: "x", group: "athletics", baseChar: "agi" as const, armorPenalty: "full" as const },
  { key: "swim", labelKey: "x", group: "athletics", baseChar: "agi" as const, armorPenalty: "unreducible" as const },
  { key: "stealth", labelKey: "x", group: "subterfuge", baseChar: "agi" as const, armorPenalty: "half" as const },
  { key: "notice", labelKey: "x", group: "perceptive", baseChar: "per" as const },
];

function run(data: Record<string, any>, modifiers: Record<string, Modifier[]> = {}): void {
  const level = data.level ?? 0;
  const ctx: PrepContext = {
    level,
    categories: [
      { key: "c1", data: defaultCategoryData(), levels: level, cumulativeLevels: level, changeCost: 0 },
    ],
    mode: "dp",
    mod: (key) => stackTotal(modifiers[key] ?? []),
    flag: () => 0,
    charFinals: {} as PrepContext["charFinals"],
    charMods: {} as PrepContext["charMods"],
  };
  prepareCharacteristics(data, ctx);
  prepareState(data, ctx);
  prepareCombat(data, ctx);
  prepareEquipment(data, ctx);
  prepareVitals(data, ctx);
  prepareSupernatural(data, ctx);
  prepareSecondaries(data, ctx, SECONDARIES);
}

describe("combineAt", () => {
  it("takes the highest TA plus half of each other, rounded down", () => {
    expect(combineAt([6, 5])).toBe(8); // Core Exxet example
    expect(combineAt([6, 5, 3])).toBe(9);
    expect(combineAt([6, 6])).toBe(9); // only one counts as base
    expect(combineAt([4])).toBe(4);
    expect(combineAt([])).toBe(0);
  });
});

describe("armor layers", () => {
  it("combines TAs per attack type across equipped armors", () => {
    const data = baseSystem();
    data.equippedArmors = [
      makeArmor({ armorType: "hard", at: { fil: 6, con: 4, pen: 0, cal: 0, fri: 0, ele: 0, ene: 0 } }),
      makeArmor({ at: { fil: 5, con: 1, pen: 2, cal: 0, fri: 0, ele: 0, ene: 0 } }),
    ];
    run(data);
    expect(data.equipment.at.fil).toBe(8);
    expect(data.equipment.at.con).toBe(4); // 4 + floor(1/2)
    expect(data.equipment.at.pen).toBe(2);
    expect(data.equipment.at.ene).toBe(0);
  });

  it("applies -20 to initiative and affected secondaries per extra layer", () => {
    const worn = baseSystem();
    worn.equippedArmors = [makeArmor({ armorType: "hard" }), makeArmor(), makeArmor()];
    const bare = baseSystem();
    run(worn);
    run(bare);

    expect(worn.equipment.naturalPenalty).toBe(-40);
    expect(worn.initiative.final).toBe(bare.initiative.final - 40);
    // Affected secondary takes the penalty; perceptive one does not.
    expect(worn.secondary.acrobatics.final).toBe(bare.secondary.acrobatics.final - 40);
    expect(worn.secondary.notice.final).toBe(bare.secondary.notice.final);
    // The layer penalty never touches attack abilities.
    expect(worn.combat.attack.final).toBe(bare.combat.attack.final);
  });

  it("natural protections never count as a layer", () => {
    const data = baseSystem();
    data.equippedArmors = [
      makeArmor({ armorType: "hard" }),
      makeArmor({ armorType: "natural", at: { fil: 2, con: 2, pen: 2, cal: 2, fri: 2, ele: 2, ene: 2 } }),
    ];
    run(data);
    expect(data.equipment.naturalPenalty).toBe(0);
    expect(data.equipment.at.fil).toBe(2); // the natural TA still protects
  });

  it("penalizes every physical action by the unmet requirement difference", () => {
    const worn = baseSystem();
    // wearArmor 50 < combined requirement 80 -> -30 to physical actions
    worn.equippedArmors = [makeArmor({ armorType: "hard", requirement: 80 })];
    const bare = baseSystem();
    run(worn);
    run(bare);

    expect(worn.equipment.physicalActionPenalty).toBe(-30);
    expect(worn.combat.attack.final).toBe(bare.combat.attack.final - 30);
    expect(worn.combat.parry.final).toBe(bare.combat.parry.final - 30);
    expect(worn.combat.dodge.final).toBe(bare.combat.dodge.final - 30);
    // Wear armor itself is exempt (it decides the penalty).
    expect(worn.combat.wearArmor.final).toBe(bare.combat.wearArmor.final);
    // Physical secondaries take it too; notice (PER) does not.
    expect(worn.secondary.notice.final).toBe(bare.secondary.notice.final);
  });

  it("sums layer requirements before comparing with wear armor", () => {
    const data = baseSystem(); // wearArmor 50
    data.equippedArmors = [
      makeArmor({ armorType: "hard", requirement: 40 }),
      makeArmor({ requirement: 30 }),
    ];
    run(data);
    expect(data.equipment.requirement).toBe(70);
    expect(data.equipment.physicalActionPenalty).toBe(-20);
  });

  it("reduces the natural penalty with surplus wear armor (Celia example)", () => {
    // Placas: requirement 90, natural penalty 35. Wear Armor 110 -> -15.
    const data = baseSystem();
    data.combat.wearArmor.dp = 200; // floor(200/2) + 10 = 110
    data.equippedArmors = [
      makeArmor({ armorType: "hard", requirement: 90, naturalPenalty: 35, movementPenalty: 4 }),
    ];
    run(data);
    expect(data.equipment.surplus).toBe(20);
    expect(data.equipment.naturalPenalty).toBe(-15);
    expect(data.equipment.physicalActionPenalty).toBe(0);
  });

  it("swim never benefits from surplus and stealth only down to half", () => {
    const data = baseSystem();
    data.combat.wearArmor.dp = 300; // 150 + 10 = 160 -> huge surplus
    data.equippedArmors = [makeArmor({ armorType: "hard", requirement: 50, naturalPenalty: 40 })];
    const bare = baseSystem();
    run(data);
    run(bare);

    expect(data.equipment.naturalPenalty).toBe(0); // fully reduced
    expect(data.equipment.naturalPenaltyUnreduced).toBe(-40);
    expect(data.equipment.naturalPenaltyHalf).toBe(-20);
    expect(data.secondary.swim.final).toBe(bare.secondary.swim.final - 40);
    expect(data.secondary.stealth.final).toBe(bare.secondary.stealth.final - 20);
    expect(data.secondary.acrobatics.final).toBe(bare.secondary.acrobatics.final);
  });

  it("each full 50 of surplus removes one point of movement restriction", () => {
    const data = baseSystem();
    data.combat.wearArmor.dp = 260; // 130 + 10 = 140; requirement 90 -> surplus 50
    data.equippedArmors = [
      makeArmor({ armorType: "hard", requirement: 90, naturalPenalty: 35, movementPenalty: 4 }),
    ];
    run(data);
    expect(data.equipment.movementPenalty).toBe(3);
    expect(data.movement.final).toBe(7 - 3); // AGI 7 minus restriction
  });

  it("armor quality improves TA, natural penalty, requirement and restriction", () => {
    const data = baseSystem();
    data.equippedArmors = [
      makeArmor({
        armorType: "hard",
        quality: 10, // 2 grades
        at: { fil: 4, con: 3, pen: 0, cal: 0, fri: 0, ele: 0, ene: 0 },
        requirement: 60,
        naturalPenalty: 20,
        movementPenalty: 2,
      }),
    ];
    run(data);
    expect(data.equipment.at.fil).toBe(6); // 4 + 2
    expect(data.equipment.at.ene).toBe(0); // unprotected types stay at 0
    expect(data.equipment.requirement).toBe(50); // 60 - 10 -> met exactly
    expect(data.equipment.physicalActionPenalty).toBe(0);
    expect(data.equipment.naturalPenalty).toBe(-10); // 20 - 10, no surplus
    expect(data.equipment.movementPenalty).toBe(0); // 2 - 2 grades
  });
});

describe("equipped weapons", () => {
  it("derives per-weapon attack, parry, turn and damage with quality applied", () => {
    const data = baseSystem();
    data.equippedWeapons = [makeWeapon({ name: "Espada larga", damage: 50, speed: -10, quality: 5 })];
    run(data);

    const [sword] = data.equipment.weapons;
    expect(sword.attack).toBe(data.combat.attack.final + 5);
    expect(sword.parry).toBe(data.combat.parry.final + 5);
    expect(sword.initiative).toBe(-5);
    // ceil10(50 + STR bonus 10) = 60, + doubled quality bonus 10
    expect(sword.finalDamage).toBe(70);
    // +5 quality pierces 1 point of the defender's TA
    expect(sword.atPiercing).toBe(1);
    expect(data.equipment.weaponInitiative).toBe(-5);
  });

  it("rounds damage up in groups of 10 after adding the STR bonus", () => {
    const data = baseSystem();
    data.equippedWeapons = [makeWeapon({ damage: 45 })]; // 45 + 10 = 55 -> 60
    run(data);
    expect(data.equipment.weapons[0].finalDamage).toBe(60);
  });

  it("doubles the STR bonus for two-handed weapons", () => {
    const data = baseSystem();
    data.equippedWeapons = [makeWeapon({ damage: 60, hands: "two" })]; // 60 + 20 = 80
    run(data);
    expect(data.equipment.weapons[0].finalDamage).toBe(80);
  });

  it("gives each of two weapons its own values and uses the slowest turn", () => {
    const data = baseSystem();
    data.equippedWeapons = [
      makeWeapon({ name: "Espada", damage: 50, speed: 0, quality: 10 }),
      makeWeapon({ name: "Daga", damage: 30, speed: 20, quality: 0 }),
    ];
    run(data);

    const [sword, dagger] = data.equipment.weapons;
    expect(sword.attack).toBe(data.combat.attack.final + 10);
    expect(dagger.attack).toBe(data.combat.attack.final);
    expect(sword.finalDamage).toBe(80); // ceil10(60) + 20
    expect(dagger.finalDamage).toBe(40);
    expect(data.equipment.weaponInitiative).toBe(10);
  });

  it("applies -10 to the weapon ability per missing STR point", () => {
    const data = baseSystem();
    data.equippedWeapons = [makeWeapon({ requiredStr: 11 })]; // STR 8 -> 3 short
    run(data);
    const [weapon] = data.equipment.weapons;
    expect(weapon.meetsStrength).toBe(false);
    expect(weapon.attack).toBe(data.combat.attack.final - 30);
    expect(weapon.parry).toBe(data.combat.parry.final - 30);
  });

  it("scales enormous weapons and flags undersized wielders", () => {
    const data = baseSystem(); // size = STR 8 + CON 7 = 15
    data.equippedWeapons = [
      makeWeapon({ damage: 50, requiredStr: 6, proportions: "enormous" }),
    ];
    run(data);
    const [weapon] = data.equipment.weapons;
    // floor(50*1.5/5)*5 = 75; ceil10(75+10) = 90
    expect(weapon.finalDamage).toBe(90);
    expect(weapon.meetsStrength).toBe(true); // needs 6+2=8, has 8
    expect(weapon.meetsSize).toBe(true); // size 15 ≥ 9
    expect(weapon.initiative).toBe(-40); // still undersized for no-penalty use (15 < 23)
  });

  it("publishes unarmed combat values", () => {
    const data = baseSystem();
    run(data);
    expect(data.equipment.unarmed.initiative).toBe(20);
    expect(data.equipment.unarmed.finalDamage).toBe(20); // 10 + STR bonus 10, no rounding
    expect(data.equipment.unarmed.attack).toBe(data.combat.attack.final);
    // Without equipped weapons the manual weapon bonus keeps feeding initiative.
    expect(data.equipment.weaponInitiative).toBeUndefined();
  });

  it("excludes equipped ammo from the weapon list and the turn contribution", () => {
    const data = baseSystem();
    data.equippedWeapons = [
      makeWeapon({ name: "Flechas", weaponType: "ammo", speed: -60 }),
      makeWeapon({ name: "Espada", speed: 5 }),
    ];
    run(data);
    expect(data.equipment.weapons).toHaveLength(1);
    expect(data.equipment.weapons[0].name).toBe("Espada");
    expect(data.equipment.weaponInitiative).toBe(5);
  });

  it("uses the linked ammo's damage and quality for ranged final damage", () => {
    const data = baseSystem();
    data.equippedWeapons = [
      makeWeapon({
        name: "Arco",
        weaponType: "ranged",
        damage: 40,
        quality: 5,
        ammoId: "a1",
        ammoName: "Flechas +10",
        ammoDamage: 30,
        ammoQuality: 10,
      }),
    ];
    run(data);
    const [bow] = data.equipment.weapons;
    // ceil10(30 + STR 10) = 40, + doubled AMMO quality 20.
    expect(bow.finalDamage).toBe(60);
    // TA piercing comes from the ammo quality (10 -> 2).
    expect(bow.atPiercing).toBe(2);
    // Attack keeps the weapon's own quality.
    expect(bow.attack).toBe(data.combat.attack.final + 5);
  });
});

describe("equip bonuses (caja \"Equipo\" del Excel)", () => {
  it("applies the manual bonuses to every weapon and to unarmed", () => {
    const modded = baseSystem();
    modded.combat.equipBonus = { turn: 10, attack: 5, parry: 15, dodge: 20, damage: 10 };
    modded.equippedWeapons = [makeWeapon({ damage: 50, speed: -10 })];
    const bare = baseSystem();
    bare.equippedWeapons = [makeWeapon({ damage: 50, speed: -10 })];
    run(modded);
    run(bare);

    const [w, base] = [modded.equipment.weapons[0], bare.equipment.weapons[0]];
    expect(w.attack).toBe(base.attack + 5);
    expect(w.parry).toBe(base.parry + 15);
    expect(w.initiative).toBe(base.initiative + 10);
    expect(w.finalDamage).toBe(base.finalDamage + 10);
    expect(modded.equipment.unarmed.attack).toBe(bare.equipment.unarmed.attack + 5);
    expect(modded.equipment.unarmed.initiative).toBe(30);
    expect(modded.equipment.unarmed.finalDamage).toBe(bare.equipment.unarmed.finalDamage + 10);
  });

  it("publishes the block dodge without touching the global dodge final", () => {
    const modded = baseSystem();
    modded.combat.equipBonus = { dodge: 20 };
    const bare = baseSystem();
    run(modded);
    run(bare);

    expect(modded.equipment.dodge).toBe(bare.combat.dodge.final + 20);
    expect(modded.combat.dodge.final).toBe(bare.combat.dodge.final);
  });

  it("keeps working without the equipBonus node (NPCs, legacy actors)", () => {
    const data = baseSystem();
    delete data.combat.equipBonus;
    data.equippedWeapons = [makeWeapon()];
    run(data);
    expect(data.equipment.dodge).toBe(data.combat.dodge.final);
    expect(data.equipment.weapons[0].attack).toBe(data.combat.attack.final);
  });
});

describe("state penalties (fatigue, Tabla 27)", () => {
  it.each([
    [7, 0],
    [4, -10],
    [3, -20],
    [2, -40],
    [1, -80],
    [0, -120],
  ])("with %i fatigue points the penalty to any action is %i", (current, expected) => {
    const modded = baseSystem();
    modded.fatigue.current = current;
    const bare = baseSystem();
    run(modded);
    run(bare);

    expect(modded.state.fatiguePenalty).toBe(expected);
    expect(modded.combat.attack.final).toBe(bare.combat.attack.final + expected);
    expect(modded.magic.magicProjectionFinal).toBe(bare.magic.magicProjectionFinal + expected);
    expect(modded.secondary.notice.final).toBe(bare.secondary.notice.final + expected);
  });
});

describe("aggregated action modifiers", () => {
  const allActions: Modifier[] = [
    { target: "allActions", value: -20, type: "untyped", enabled: true },
  ];
  const physicalActions: Modifier[] = [
    { target: "physicalActions", value: -30, type: "untyped", enabled: true },
  ];

  it("allActions hits combat, projections and every secondary", () => {
    const modded = baseSystem();
    const bare = baseSystem();
    run(modded, { allActions });
    run(bare);

    expect(modded.combat.attack.final).toBe(bare.combat.attack.final - 20);
    expect(modded.combat.dodge.final).toBe(bare.combat.dodge.final - 20);
    expect(modded.magic.magicProjectionFinal).toBe(bare.magic.magicProjectionFinal - 20);
    expect(modded.psychic.projectionFinal).toBe(bare.psychic.projectionFinal - 20);
    expect(modded.secondary.acrobatics.final).toBe(bare.secondary.acrobatics.final - 20);
    expect(modded.secondary.notice.final).toBe(bare.secondary.notice.final - 20);
  });

  it("physicalActions hits combat and physical secondaries only", () => {
    const modded = baseSystem();
    const bare = baseSystem();
    run(modded, { physicalActions });
    run(bare);

    expect(modded.combat.attack.final).toBe(bare.combat.attack.final - 30);
    expect(modded.magic.magicProjectionFinal).toBe(bare.magic.magicProjectionFinal);
    expect(modded.psychic.projectionFinal).toBe(bare.psychic.projectionFinal);
    expect(modded.secondary.acrobatics.final).toBe(bare.secondary.acrobatics.final - 30);
    expect(modded.secondary.notice.final).toBe(bare.secondary.notice.final);
  });
});
