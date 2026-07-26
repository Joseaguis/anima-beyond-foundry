/**
 * Unit tests for the Ki derived data: per-characteristic ki points (value, or
 * 10 + 2·(v−10) above 10) and accumulation (innate by value + bought with DP),
 * plus Conocimiento Marcial (CM) as a resource. Innate tables verified against
 * the Excel Ki sheet and "Tabla de Acumulación".
 */
import { beforeAll, describe, expect, it } from "vitest";
import { prepareCharacteristics } from "../src/actors/creature/prep/characteristics";
import { prepareSupernatural } from "../src/actors/creature/prep/supernatural";
import { defaultCategoryData, type CategoryData, type PrepContext } from "../src/actors/creature/prep/types";
import { getInnateKiAccumulation, getInnateKiPoints } from "../src/domains/ki/tables";

describe("tablas innatas de Ki", () => {
  it("puntos: valor hasta 10, luego 10 + 2·(v−10)", () => {
    expect(getInnateKiPoints(0)).toBe(0);
    expect(getInnateKiPoints(6)).toBe(6);
    expect(getInnateKiPoints(10)).toBe(10);
    expect(getInnateKiPoints(11)).toBe(12);
    expect(getInnateKiPoints(13)).toBe(16); // DES 13 → 16 (verificado)
    expect(getInnateKiPoints(20)).toBe(30);
  });

  it("acumulación: 1-9→1, 10-12→2, 13-15→3, 16-20→4", () => {
    expect(getInnateKiAccumulation(1)).toBe(1);
    expect(getInnateKiAccumulation(9)).toBe(1);
    expect(getInnateKiAccumulation(10)).toBe(2);
    expect(getInnateKiAccumulation(12)).toBe(2);
    expect(getInnateKiAccumulation(13)).toBe(3);
    expect(getInnateKiAccumulation(15)).toBe(3);
    expect(getInnateKiAccumulation(16)).toBe(4);
    expect(getInnateKiAccumulation(20)).toBe(4);
  });
});

/** A category with cheap Ki costs (Tecnicista-like): 1 PD/point, 10 PD/acc. */
function kiCategory(): CategoryData {
  const cat = defaultCategoryData();
  cat.labelName = "Tecnicista";
  cat.martialKnowledgePerLevel = 50;
  cat.supernatural = { ...cat.supernatural, ki: 1, kiAccMultiple: 10 };
  return cat;
}

function ctxFor(system: Record<string, any>, mod: (k: string) => number = () => 0): PrepContext {
  const cat = kiCategory();
  return {
    level: system.level,
    categories: [
      { key: "c1", data: cat, levels: system.level, cumulativeLevels: system.level, changeCost: 0 },
    ],
    mode: "dp",
    mod,
    flag: () => 0,
    charFinals: {} as PrepContext["charFinals"],
    charMods: {} as PrepContext["charMods"],
  };
}

function baseSystem(): Record<string, any> {
  return {
    level: 5,
    str: { base: 6, bonus: 0 }, // innato 6, acc 1
    dex: { base: 13, bonus: 0 }, // innato 16, acc 3
    agi: { base: 8, bonus: 0 }, // innato 8, acc 1
    con: { base: 9, bonus: 0 }, // innato 9, acc 1
    int: { base: 8, bonus: 0 },
    pow: { base: 9, bonus: 0 }, // innato 9, acc 1
    wp: { base: 4, bonus: 0 }, // innato 4, acc 1
    per: { base: 5, bonus: 0 },
    martialKnowledge: 300,
    ki: { pointsDp: {}, accDp: {}, special: 0 },
  };
}

describe("ki por característica", () => {
  let system: Record<string, any>;
  beforeAll(() => {
    system = baseSystem();
    // 10 PD de puntos en AGI (coste 1 → +10) y 20 PD de acumulación en cada
    // característica (múltiplo 10 → +2 c/u).
    system.ki.pointsDp = { agi: { c1: 10 } };
    system.ki.accDp = {
      str: { c1: 20 },
      dex: { c1: 20 },
      agi: { c1: 20 },
      con: { c1: 20 },
      pow: { c1: 20 },
      wp: { c1: 20 },
    };
    const ctx = ctxFor(system);
    prepareCharacteristics(system, ctx);
    prepareSupernatural(system, ctx);
  });

  it("puntos innatos 52, comprados 10, total 62", () => {
    expect(system.ki.pointsInnate).toBe(52); // 6+16+8+9+9+4
    expect(system.ki.pointsBought).toBe(10);
    expect(system.ki.totalPoints).toBe(62);
  });

  it("acumulación innata 8, comprada 12, total 20", () => {
    expect(system.ki.accInnate).toBe(8); // 1+3+1+1+1+1
    expect(system.ki.accBought).toBe(12); // 2 × 6
    expect(system.ki.accumulation).toBe(20);
  });

  it("desglose por característica: DES 13 → 16 puntos / 3 acumulación", () => {
    expect(system.ki.perChar.dex).toEqual({
      value: 13,
      pointsInnate: 16,
      pointsBought: 0,
      pointsTotal: 16,
      accInnate: 3,
      accBought: 2,
      accTotal: 5,
    });
    expect(system.ki.perChar.agi.pointsBought).toBe(10);
  });
});

describe("ki: modificadores y special", () => {
  it("special y mod('ki')/mod('kiAccumulation') suman al total", () => {
    const system = baseSystem();
    system.ki.special = 5;
    const ctx = ctxFor(system, (k) => (k === "ki" ? 3 : k === "kiAccumulation" ? 2 : 0));
    prepareCharacteristics(system, ctx);
    prepareSupernatural(system, ctx);
    // Innatos 52 + special 5 + mod 3 = 60; acumulación innata 8 + mod 2 = 10.
    expect(system.ki.totalPoints).toBe(60);
    expect(system.ki.accumulation).toBe(10);
  });
});

describe("ki: Conocimiento Marcial como recurso", () => {
  it("CM total del actor, usado por las habilidades, disponible = resto", () => {
    const system = baseSystem();
    system.martialKnowledge = 300;
    system.kiAbilities = [{ mkCost: 40 }, { mkCost: 30 }, { mkCost: 20 }];
    const ctx = ctxFor(system);
    prepareCharacteristics(system, ctx);
    prepareSupernatural(system, ctx);
    expect(system.ki.cmTotal).toBe(300);
    expect(system.ki.cmUsed).toBe(90);
    expect(system.ki.cmAvailable).toBe(210);
    expect(system.ki.cmOver).toBe(false);
  });

  it("suma el mkCost de estilos, artes marciales y ars magnus al CM usado", () => {
    const system = baseSystem();
    system.martialKnowledge = 300;
    system.kiAbilities = [{ mkCost: 40 }];
    system.combatStyles = [
      { name: "Estilo", subtype: "styleTable", mkCost: 10, dpCost: 30 },
      { name: "Arte", subtype: "martialArt", mkCost: 20, dpCost: 50 },
      { name: "Ars", subtype: "arsMagnus", mkCost: 50, dpCost: 0 },
    ];
    const ctx = ctxFor(system);
    prepareCharacteristics(system, ctx);
    prepareSupernatural(system, ctx);
    expect(system.ki.cmUsed).toBe(120);
    expect(system.ki.cmAvailable).toBe(180);
  });

  it("suma el CM de las técnicas de Ki al CM usado", () => {
    const system = baseSystem();
    system.martialKnowledge = 300;
    system.kiAbilities = [{ mkCost: 40 }];
    // Publicadas por KiTechniqueModel.prepareActorData con el CM ya derivado.
    system.kiTechniques = [
      { name: "Feuer", tree: "Ignis", level: 1, mkCost: 20, kiTotal: 9, kiUpkeepTotal: 2, invalid: false },
      { name: "Yuki", tree: "Hyousetsu", level: 1, mkCost: 30, kiTotal: 16, kiUpkeepTotal: 4, invalid: false },
    ];
    const ctx = ctxFor(system);
    prepareCharacteristics(system, ctx);
    prepareSupernatural(system, ctx);
    expect(system.ki.cmUsed).toBe(90);
    expect(system.ki.cmAvailable).toBe(210);
  });

  it("marca exceso cuando las habilidades gastan más CM del disponible", () => {
    const system = baseSystem();
    system.martialKnowledge = 50;
    system.kiAbilities = [{ mkCost: 40 }, { mkCost: 30 }];
    const ctx = ctxFor(system);
    prepareCharacteristics(system, ctx);
    prepareSupernatural(system, ctx);
    expect(system.ki.cmUsed).toBe(70);
    expect(system.ki.cmAvailable).toBe(-20);
    expect(system.ki.cmOver).toBe(true);
  });
});
