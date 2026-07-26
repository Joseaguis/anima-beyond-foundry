/**
 * Direct prep mode (NPC stat blocks): bases are entered as-is; only special
 * values and rule-element modifiers apply on top.
 */
import { describe, expect, it } from "vitest";
import { prepareCharacteristics } from "../src/actors/creature/prep/characteristics";
import { prepareVitals } from "../src/actors/creature/prep/vitals";
import { prepareCombat } from "../src/actors/creature/prep/combat";
import { defaultCategoryData, type PrepContext } from "../src/actors/creature/prep/types";
import { stackTotal, type Modifier } from "../src/rules/modifier";

function npcSystem(): Record<string, any> {
  return {
    level: 3,
    str: { base: 10, bonus: 0 },
    dex: { base: 8, bonus: 0 },
    agi: { base: 9, bonus: 0 },
    con: { base: 11, bonus: 0 },
    int: { base: 5, bonus: 0 },
    pow: { base: 8, bonus: 0 },
    wp: { base: 7, bonus: 0 },
    per: { base: 6, bonus: 0 },
    presenceBase: 45,
    lifePoints: { max: 180, current: 180 },
    fatigue: { max: 0, current: 8 },
    initiative: { base: 70, armorPenalty: 10, weaponBonus: 0 },
    combat: {
      attack: { base: 90, special: 0 },
      parry: { base: 75, special: 5 },
      dodge: { base: 60, special: 0 },
      wearArmor: { base: 30, special: 0 },
    },
  };
}

function runDirect(data: Record<string, any>, modifiers: Record<string, Modifier[]> = {}): void {
  const level = data.level ?? 0;
  const ctx: PrepContext = {
    level,
    categories: [
      { key: "c1", data: defaultCategoryData(), levels: level, cumulativeLevels: level, changeCost: 0 },
    ],
    mode: "direct",
    mod: (key) => stackTotal(modifiers[key] ?? []),
    flag: () => 0,
    charFinals: {} as PrepContext["charFinals"],
    charMods: {} as PrepContext["charMods"],
  };
  prepareCharacteristics(data, ctx);
  prepareVitals(data, ctx);
  prepareCombat(data, ctx);
}

describe("direct prep mode", () => {
  it("uses the persisted presence instead of the level formula", () => {
    const data = npcSystem();
    runDirect(data);
    expect(data.presence).toBe(45);
    // Resistances still derive from presence + characteristic modifier.
    expect(data.resistances.rf.total).toBe(45 + 20); // CON 11 -> +20
  });

  it("keeps life points as entered", () => {
    const data = npcSystem();
    runDirect(data);
    expect(data.lifePoints.max).toBe(180);
  });

  it("combat totals are base + special + modifiers, without char/category bonuses", () => {
    const data = npcSystem();
    runDirect(data, {
      attack: [{ target: "attack", value: 10, type: "magic", enabled: true }],
    });
    expect(data.combat.attack.final).toBe(90 + 0 + 10);
    expect(data.combat.parry.final).toBe(75 + 5);
    expect(data.combat.dodge.final).toBe(60);
  });

  it("initiative is base - armorPenalty + weaponBonus + modifiers", () => {
    const data = npcSystem();
    runDirect(data, {
      initiative: [{ target: "initiative", value: 5, type: "untyped", enabled: true }],
    });
    expect(data.initiative.final).toBe(70 - 10 + 0 + 5);
  });

  it("modifiers still apply to direct life points", () => {
    const data = npcSystem();
    runDirect(data, {
      lifePoints: [{ target: "lifePoints", value: 25, type: "untyped", enabled: true }],
    });
    expect(data.lifePoints.max).toBe(205);
  });
});
