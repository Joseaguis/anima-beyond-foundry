/**
 * Unit tests for the psychic derived data: Potencial Psíquico (base by VOL,
 * Tabla 68 + Incrementar Potencial, Tabla 70), CVs (innate by level + bought)
 * and the full CV economy (afinidades, poderes dominados, fortalecer, innatos,
 * incrementar potencial), plus Proyección Psíquica. Every expected value is
 * hand-computed from the Core Exxet tables and the Excel psychic costs.
 */
import { beforeAll, describe, expect, it } from "vitest";
import { prepareCharacteristics } from "../src/actors/creature/prep/characteristics";
import { prepareSupernatural } from "../src/actors/creature/prep/supernatural";
import type { PsychicDisciplineData, PsychicPowerData } from "../src/domains/psychic/data";
import { prepareDevelopment } from "../src/actors/creature/prep/development";
import { getPotentialIncrementBonus, getPsychicPotentialByVol } from "../src/domains/psychic/tables";
import { defaultCategoryData, type CategoryData, type PrepContext } from "../src/actors/creature/prep/types";

/** A mentalist category (one innate CV per level) with the Excel psychic costs. */
function mentalistCategory(): CategoryData {
  const cat = defaultCategoryData();
  cat.labelName = "Mentalista";
  cat.supernatural = {
    ...cat.supernatural,
    cv: 20, // CosteCV
    psychicProjection: 2, // CosteProyección Psíquica
    levelsPerCv: 1, // 1 CV innato por nivel
  };
  cat.dpLimits = { combat: 0.5, magic: 0.5, psychic: 0.6 };
  return cat;
}

function psychicSystem(): Record<string, any> {
  return {
    level: 10,
    str: { base: 5, bonus: 0 },
    dex: { base: 10, bonus: 0 }, // mod +15 → bono de Proyección
    agi: { base: 5, bonus: 0 },
    con: { base: 8, bonus: 0 },
    int: { base: 5, bonus: 0 },
    pow: { base: 5, bonus: 0 },
    wp: { base: 12, bonus: 0 }, // VOL 12 → Potencial base 80 (Tabla 68)
    per: { base: 5, bonus: 0 },
    lifePoints: { max: 0, current: 0, multiples: 0 },
    fatigue: { max: 0, current: 0 },
    initiative: { base: 20, armorPenalty: 0, weaponBonus: 0 },
    psychic: {
      cvDp: { c1: 100 }, // ⌊100/20⌋ = 5 CV comprados
      projectionDp: { c1: 10 }, // ⌊10/2⌋ = 5 base
      projectionSpecial: 0,
      potentialIncrementCvs: 3, // Tabla 70: 3 CV → +20; cuenta 3 CV usados
      potentialSpecial: 0,
      innatos: [{ powerName: "Vuelo telequinético", potentialAllocated: 30, note: "" }],
    },
    // Two affinities (1 CV each).
    psychicDisciplines: [
      { name: "Telequinesis", affinityCost: 1 },
      { name: "Telepatía", affinityCost: 1 },
    ] as PsychicDisciplineData[],
    // Three mastered powers (1 CV each): one fortified with 2 CV, one matricial.
    psychicPowers: [
      { name: "Impacto telequinético", discipline: "Telequinesis", powerLevel: 1, masteryCost: 1, fortifyCvs: 2, isMatrix: false, action: "active", maintainable: false, maintenanceDifficulty: "" },
      { name: "Vuelo telequinético", discipline: "Telequinesis", powerLevel: 2, masteryCost: 1, fortifyCvs: 0, isMatrix: false, action: "active", maintainable: true, maintenanceDifficulty: "hard" },
      { name: "Sentir matrices", discipline: "", powerLevel: 0, masteryCost: 1, fortifyCvs: 0, isMatrix: true, action: "active", maintainable: true, maintenanceDifficulty: "easy" },
    ] as PsychicPowerData[],
    dpConfig: { limitMode: "combined" },
  };
}

function ctxFor(system: Record<string, any>): PrepContext {
  const cat = mentalistCategory();
  return {
    level: system.level,
    categories: [
      { key: "c1", data: cat, levels: system.level, cumulativeLevels: system.level, changeCost: 0 },
    ],
    mode: "dp",
    mod: () => 0,
    flag: () => 0,
    charFinals: {} as PrepContext["charFinals"],
    charMods: {} as PrepContext["charMods"],
  };
}

let system: Record<string, any>;

beforeAll(() => {
  system = psychicSystem();
  const ctx = ctxFor(system);
  prepareCharacteristics(system, ctx);
  prepareSupernatural(system, ctx);
  prepareDevelopment(system, ctx);
});

/** Run the pipeline over a one-off variation of the fixture (as mysticism.test.ts). */
function prepared(patch: (system: Record<string, any>) => void): Record<string, any> {
  const s = psychicSystem();
  patch(s);
  const ctx = ctxFor(s);
  prepareCharacteristics(s, ctx);
  prepareSupernatural(s, ctx);
  prepareDevelopment(s, ctx);
  return s;
}

describe("psíquica: tabla de Potencial por Voluntad (Tabla 68)", () => {
  it("VOL 4 → +0, 7 → +30, 12 → +80, 20 → +220, y clamp por encima de 20", () => {
    expect(getPsychicPotentialByVol(4)).toBe(0);
    expect(getPsychicPotentialByVol(7)).toBe(30);
    expect(getPsychicPotentialByVol(12)).toBe(80);
    expect(getPsychicPotentialByVol(20)).toBe(220);
    expect(getPsychicPotentialByVol(25)).toBe(220);
  });
});

describe("psíquica: Incrementar Potencial (Tabla 70, CV acumulativos)", () => {
  it("0 → 0, 1 → +10, 5 → +20, 6 → +30, 55 → +100", () => {
    expect(getPotentialIncrementBonus(0)).toBe(0);
    expect(getPotentialIncrementBonus(1)).toBe(10);
    expect(getPotentialIncrementBonus(5)).toBe(20);
    expect(getPotentialIncrementBonus(6)).toBe(30);
    expect(getPotentialIncrementBonus(55)).toBe(100);
  });
});

describe("psíquica: CVs totales y Proyección", () => {
  it("CVs Totales = innato(1+9/1=10) + comprado(⌊100/20⌋=5) = 15", () => {
    expect(system.psychic.cvMax).toBe(15);
  });

  it("Proyección Psíquica = ⌊10/2⌋(5) + DES(+15) = 20", () => {
    expect(system.psychic.projectionBase).toBe(5);
    expect(system.psychic.projectionFinal).toBe(20);
  });
});

describe("psíquica: Potencial Psíquico derivado", () => {
  it("Potencial final = base(VOL 12 → 80) + incremento(3 CV → +20) = 100", () => {
    expect(system.psychic.potentialBase).toBe(80);
    expect(system.psychic.potentialIncrement).toBe(20);
    expect(system.psychic.potentialFinal).toBe(100);
  });
});

describe("psíquica: economía de CVs", () => {
  it("CVs usados = afinidades(2) + poderes(3) + fortalecer(2) + innatos(1·2) + incrementar(3) = 12", () => {
    expect(system.psychic.cvUsed).toBe(12);
  });

  it("CVs libres = totales(15) − usados(12) = 3", () => {
    expect(system.psychic.cvFree).toBe(3);
  });

  it("Nº de innatos = 1", () => {
    expect(system.psychic.innatosCount).toBe(1);
  });

  it("sin sobregasto, cvOver = 0", () => {
    expect(system.psychic.cvOver).toBe(0);
  });

  it("el sobregasto se señala sin recortar, como el CM de Ki", () => {
    // Cuatro innatos más = 8 CV extra sobre los 3 libres.
    const s = prepared((sys) => {
      sys.psychic.innatos = Array.from({ length: 5 }, () => ({
        powerName: "Vuelo telequinético",
        potentialAllocated: 0,
        note: "",
      }));
    });
    expect(s.psychic.cvUsed).toBe(20);
    expect(s.psychic.cvFree).toBe(-5);
    expect(s.psychic.cvOver).toBe(5);
  });
});

describe("psíquica: cristal psíquico (Core p. 229)", () => {
  it("un cristal genérico suma su bono al potencial", () => {
    const s = prepared((sys) => {
      sys.psychic.crystalBonus = 15;
    });
    expect(s.psychic.potentialFinal).toBe(115); // 100 + 15
  });

  it("cada +5 del cristal añade un nivel de fatiga al fracasar", () => {
    expect(prepared((sys) => (sys.psychic.crystalBonus = 15)).psychic.crystalFatiguePenalty).toBe(3);
    expect(prepared((sys) => (sys.psychic.crystalBonus = 30)).psychic.crystalFatiguePenalty).toBe(6);
    expect(prepared((sys) => (sys.psychic.crystalBonus = 0)).psychic.crystalFatiguePenalty).toBe(0);
  });

  it("un cristal atado a una disciplina no entra en el potencial global, pero sí penaliza", () => {
    const s = prepared((sys) => {
      sys.psychic.crystalBonus = 20;
      sys.psychic.crystalDiscipline = "Telemetría";
    });
    expect(s.psychic.potentialFinal).toBe(100);
    expect(s.psychic.crystalFatiguePenalty).toBe(4);
  });

  it("no consume CV: la economía no se mueve", () => {
    const s = prepared((sys) => (sys.psychic.crystalBonus = 30));
    expect(s.psychic.cvUsed).toBe(12);
    expect(s.psychic.cvFree).toBe(3);
  });
});

describe("psíquica: reserva de PD psíquica", () => {
  it("cuenta CV + Proyección (100 + 10 = 110)", () => {
    expect(system.development.limits.psychic.spent).toBe(110);
  });
});
