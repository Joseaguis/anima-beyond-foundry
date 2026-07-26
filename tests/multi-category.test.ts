/**
 * Multi-category DP model: per-category floors, innate bonuses per levels
 * advanced in each category, and the "combined" limit mode (each stage keeps
 * every earlier stage's limits — the Excel default).
 */
import { describe, expect, it } from "vitest";
import { prepareCombat } from "../src/actors/creature/prep/combat";
import { prepareSecondaries } from "../src/actors/creature/prep/secondaries";
import {
  developmentPointsForLevel,
  prepareDevelopment,
} from "../src/actors/creature/prep/development";
import {
  baseFromDp,
  defaultCategoryData,
  dpTotal,
  sumPerLevel,
  type CategoryData,
  type PrepContext,
  type ResolvedCategory,
} from "../src/actors/creature/prep/types";

// --- fixtures ---------------------------------------------------------------

function category(overrides: Partial<CategoryData> & { labelName: string }): CategoryData {
  return { ...defaultCategoryData(), ...overrides };
}

/** Paladín-like: cheap combat (2), 60% combat limit, +5 parry per level. */
const paladin = category({
  labelName: "Paladín",
  combatBonusPerLevel: { attack: 0, parry: 5, dodge: 0, wearArmor: 10 },
  dpLimits: { combat: 0.6, magic: 0.5, psychic: 0.5 },
});

/** Guerrero Acróbata-like: parry costs 3, +5 attack/dodge per level. */
const acrobat = category({
  labelName: "Guerrero Acróbata",
  combatCosts: { attack: 2, parry: 3, dodge: 2, wearArmor: 2 },
  combatBonusPerLevel: { attack: 5, parry: 0, dodge: 5, wearArmor: 0 },
  dpLimits: { combat: 0.6, magic: 0.5, psychic: 0.5 },
});

/** Tecnicista-like: no innate bonuses. */
const technician = category({
  labelName: "Tecnicista",
  dpLimits: { combat: 0.6, magic: 0.5, psychic: 0.5 },
});

/** The user's example progression: Paladín 5 / G. Acróbata 3 / Tecnicista 2. */
function progression(): ResolvedCategory[] {
  return [
    { key: "c1", data: paladin, levels: 5, cumulativeLevels: 5, changeCost: 0 },
    { key: "c2", data: acrobat, levels: 3, cumulativeLevels: 8, changeCost: 20 },
    { key: "c3", data: technician, levels: 2, cumulativeLevels: 10, changeCost: 60 },
  ];
}

function ctxFor(categories: ResolvedCategory[]): PrepContext {
  return {
    level: categories.reduce((s, c) => s + c.levels, 0),
    categories,
    mode: "dp",
    mod: () => 0,
    flag: () => 0,
    charFinals: { str: 5, dex: 5, agi: 5, con: 5, int: 5, pow: 5, wp: 5, per: 5 },
    charMods: { str: 0, dex: 0, agi: 0, con: 0, int: 0, pow: 0, wp: 0, per: 0 },
  };
}

// --- helpers ----------------------------------------------------------------

describe("dp helpers", () => {
  it("developmentPointsForLevel matches the sheet (400 / 600+100·(N-1))", () => {
    expect(developmentPointsForLevel(0)).toBe(400);
    expect(developmentPointsForLevel(1)).toBe(600);
    expect(developmentPointsForLevel(5)).toBe(1000);
    expect(developmentPointsForLevel(8)).toBe(1300);
    expect(developmentPointsForLevel(10)).toBe(1500);
  });

  it("baseFromDp floors per category, like the Excel columns", () => {
    const cats = progression();
    // parry: 100/2 + 100/3 + 10/2 = 50 + 33 + 5 = 88 (not floor(210/…)).
    const base = baseFromDp(cats, { c1: 100, c2: 100, c3: 10 }, (d) => d.combatCosts.parry);
    expect(base).toBe(50 + 33 + 5);
  });

  it("baseFromDp treats legacy plain numbers as first-slot spend", () => {
    const cats = progression();
    expect(baseFromDp(cats, 100, (d) => d.combatCosts.parry)).toBe(50);
  });

  it("baseFromDp ignores orphan slot keys", () => {
    const cats = progression();
    expect(baseFromDp(cats, { zz: 100 }, (d) => d.combatCosts.parry)).toBe(0);
    expect(dpTotal({ zz: 100 })).toBe(100);
  });

  it("sumPerLevel weighs each category by its levels", () => {
    // parry bonus: 5·5 (Paladín) + 0·3 + 0·2 = 25.
    expect(sumPerLevel(progression(), (d) => d.combatBonusPerLevel.parry)).toBe(25);
    // attack bonus: 0·5 + 5·3 + 0·2 = 15.
    expect(sumPerLevel(progression(), (d) => d.combatBonusPerLevel.attack)).toBe(15);
  });
});

// --- combat across categories -----------------------------------------------

describe("prepareCombat with a multi-category progression", () => {
  it("splits base by per-category cost and sums innate bonuses", () => {
    const system: Record<string, any> = {
      combat: {
        attack: { dp: { c1: 100, c2: 60 }, special: 0 },
        parry: { dp: { c1: 100, c2: 100 }, special: 0 },
        dodge: { dp: {}, special: 0 },
        wearArmor: { dp: {}, special: 0 },
      },
    };
    prepareCombat(system, ctxFor(progression()));

    // attack: 100/2 + 60/2 = 80 base; +5/level over 3 acrobat levels = 15.
    expect(system.combat.attack.base).toBe(80);
    expect(system.combat.attack.catBonus).toBe(15);
    expect(system.combat.attack.final).toBe(95);
    // parry: 50 + 33 = 83 base; +5/level over 5 paladin levels = 25.
    expect(system.combat.parry.base).toBe(83);
    expect(system.combat.parry.catBonus).toBe(25);
  });
});

// --- secondaries: cost overrides and per-ability bonuses ----------------------

describe("prepareSecondaries with overrides", () => {
  const abilityDefs = [
    { key: "withstandPain", labelKey: "x", group: "vigor", baseChar: "wp" as const },
  ];

  it("uses min(group cost, per-ability override) and per-ability bonuses", () => {
    const withOverride = category({
      labelName: "Paladín",
      secondaryCosts: { ...defaultCategoryData().secondaryCosts, vigor: 2 },
      secondaryCostOverrides: { withstandPain: 1 },
      secondaryAbilityBonusPerLevel: { withstandPain: 10 },
    });
    const cats: ResolvedCategory[] = [
      { key: "c1", data: withOverride, levels: 5, cumulativeLevels: 5, changeCost: 0 },
    ];
    const system: Record<string, any> = {
      secondary: { withstandPain: { dp: { c1: 10 }, special: 0 } },
    };
    prepareSecondaries(system, ctxFor(cats), abilityDefs);

    // base 10/1 = 10 (override), catBonus 10·5 = 50.
    expect(system.secondary.withstandPain.base).toBe(10);
    expect(system.secondary.withstandPain.catBonus).toBe(50);
  });
});

// --- development: totals and combined limits ----------------------------------

describe("prepareDevelopment (combined mode)", () => {
  function baseSystem(): Record<string, any> {
    return {
      combat: {
        attack: { dp: {} },
        parry: { dp: {} },
        dodge: { dp: {} },
        wearArmor: { dp: {} },
        martialKnowledge: { dp: {} },
      },
      magic: { zeonDp: {}, magicProjectionDp: {} },
      ki: { pointsDp: {}, accDp: {} },
      psychic: { cvDp: {}, projectionDp: {} },
      secondary: { acrobatics: { dp: {} } },
      customSecondary: {},
      dpConfig: { limitMode: "combined" },
    };
  }

  it("computes the user's example stage limits: 600 / 780 / 900", () => {
    const system = baseSystem();
    prepareDevelopment(system, ctxFor(progression()));

    const stages = system.development.perCategory;
    expect(stages.map((s: any) => s.dpBudget)).toEqual([1000, 1300, 1500]);
    expect(stages.map((s: any) => s.limits.combat)).toEqual([600, 780, 900]);
    expect(system.development.total).toBe(1500);
  });

  it("flags a combat overspend at an intermediate stage", () => {
    const system = baseSystem();
    // 650 combat DP in the Paladín stage: over its 600 limit even though the
    // final 900 limit would allow it.
    system.combat.attack.dp = { c1: 650 };
    prepareDevelopment(system, ctxFor(progression()));

    expect(system.development.limits.combat.spent).toBe(650);
    expect(system.development.limits.combat.limit).toBe(900);
    expect(system.development.limits.combat.over).toBe(true);
  });

  it("accepts the same spend when assigned to later stages", () => {
    const system = baseSystem();
    system.combat.attack.dp = { c1: 600, c3: 50 };
    prepareDevelopment(system, ctxFor(progression()));
    expect(system.development.limits.combat.over).toBe(false);
  });

  it("counts ki spends against the combat limit", () => {
    const system = baseSystem();
    system.ki.pointsDp = { agi: { c1: 400 } };
    system.ki.accDp = { agi: { c1: 201 } };
    prepareDevelopment(system, ctxFor(progression()));
    expect(system.development.limits.combat.spent).toBe(601);
    expect(system.development.limits.combat.over).toBe(true);
  });

  it("subtracts ability spends and change costs from the available total", () => {
    const system = baseSystem();
    system.combat.attack.dp = { c1: 100 };
    system.magic.zeonDp = { c2: 50 };
    prepareDevelopment(system, ctxFor(progression()));

    // 1500 - 100 - 50 - (20 + 60 change costs) = 1270.
    expect(system.development.spent).toBe(230);
    expect(system.development.available).toBe(1270);
  });

  it("counts item costs (weapon tables, styles, martial arts) as combat spend", () => {
    const system = baseSystem();
    system.weaponTables = [{ dpCost: 60 }, { dpCost: 40 }];
    system.combatStyles = [
      { subtype: "styleTable", dpCost: 50 },
      { subtype: "martialArt", dpCost: 30 },
      // Ars Magnus solo gasta CM, nunca PD.
      { subtype: "arsMagnus", dpCost: 999 },
    ];
    prepareDevelopment(system, ctxFor(progression()));

    expect(system.development.itemDp).toBe(180);
    expect(system.development.spent).toBe(180 + 20 + 60); // + change costs
    expect(system.development.limits.combat.spent).toBe(180);
    expect(system.development.limits.combat.over).toBe(false);
  });

  it("flags the combat limit when item costs push past the final stage limit", () => {
    const system = baseSystem();
    system.combat.attack.dp = { c3: 600 };
    system.weaponTables = [{ dpCost: 301 }]; // 600 + 301 > 900 (límite final)
    prepareDevelopment(system, ctxFor(progression()));
    expect(system.development.limits.combat.spent).toBe(901);
    expect(system.development.limits.combat.over).toBe(true);
  });

  it("keeps orphan dp in the totals and warns about it", () => {
    const system = baseSystem();
    system.combat.attack.dp = { zz: 40 };
    prepareDevelopment(system, ctxFor(progression()));

    expect(system.development.orphanDp).toBe(40);
    expect(system.development.spent).toBe(40 + 80); // + change costs
    expect(system.development.warnings.some((w: string) => w.includes("40 PD"))).toBe(true);
  });

  it("warns about category changes with fewer than 2 levels", () => {
    const cats: ResolvedCategory[] = [
      { key: "c1", data: paladin, levels: 1, cumulativeLevels: 1, changeCost: 0 },
      { key: "c2", data: acrobat, levels: 3, cumulativeLevels: 4, changeCost: 20 },
    ];
    const system = baseSystem();
    prepareDevelopment(system, ctxFor(cats));
    expect(system.development.warnings.some((w: string) => w.includes("mínimo son 2"))).toBe(true);
  });

  it("does nothing in direct mode", () => {
    const system = baseSystem();
    const ctx = { ...ctxFor(progression()), mode: "direct" as const };
    prepareDevelopment(system, ctx);
    expect(system.development).toBeUndefined();
  });
});
