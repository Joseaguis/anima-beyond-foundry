/**
 * Regression test against the filled official sheet
 * `../anime-beyond-fantasy-docs/docs/excels/ficha-test01.xlsx` (Ficha Anima
 * v8.7.0): a Guerrero 5 / Tecnicista 5, level 10, 1500 DP. Every expected
 * value is the one the Excel computes (source of truth for the game's math);
 * the cell it comes from is referenced in a comment.
 *
 * Category data comes from the real pack source JSONs, so this also validates
 * the Guerrero/Tecnicista numbers shipped in the compendium.
 *
 * Rules the pipeline does not implement yet are asserted with `it.fails` so
 * the suite flags them the day they start passing:
 *  - life-point multiples bought with DP (docs/reglas/desarrollo-pds.md)
 */
import { beforeAll, describe, expect, it } from "vitest";
import { prepareCharacteristics } from "../src/actors/creature/prep/characteristics";
import { prepareState } from "../src/actors/creature/prep/state";
import { prepareCombat } from "../src/actors/creature/prep/combat";
import { prepareEquipment } from "../src/actors/creature/prep/equipment";
import { prepareVitals } from "../src/actors/creature/prep/vitals";
import { prepareSupernatural } from "../src/actors/creature/prep/supernatural";
import { prepareSecondaries } from "../src/actors/creature/prep/secondaries";
import { prepareDevelopment } from "../src/actors/creature/prep/development";
import type { PrepContext, ResolvedCategory } from "../src/actors/creature/prep/types";
import { categorySystemToData, type CategorySystemSource } from "../src/items/category/data";
import { DEFAULT_SECONDARY_ABILITIES } from "../src/data/secondaryAbilities";
import warriorPack from "../src/packs/_source/categories/warrior.json";
import technicianPack from "../src/packs/_source/categories/technician.json";

// --- progression: Guerrero 5 → Tecnicista 5 (PDs!O7/O9, cambio Y7=60) -------

const warrior = categorySystemToData(
  warriorPack.name,
  warriorPack.system as CategorySystemSource,
);
const technician = categorySystemToData(
  technicianPack.name,
  technicianPack.system as CategorySystemSource,
);

function progression(): ResolvedCategory[] {
  return [
    { key: "c1", data: warrior, levels: 5, cumulativeLevels: 5, changeCost: 0 },
    { key: "c2", data: technician, levels: 5, cumulativeLevels: 10, changeCost: 60 },
  ];
}

// --- the character as filled in the sheet ------------------------------------

function fichaSystem(): Record<string, any> {
  return {
    level: 10, // Principal!AI5

    // Principal!E11:E18 (base) + G52:J52 "PCs liberalizados" (+3 DES, +2 POD)
    agi: { base: 8, bonus: 0 },
    con: { base: 9, bonus: 0 },
    dex: { base: 10, bonus: 3 },
    str: { base: 6, bonus: 0 },
    int: { base: 8, bonus: 0 },
    per: { base: 5, bonus: 0 },
    pow: { base: 7, bonus: 2 },
    wp: { base: 4, bonus: 0 },

    // PDs!T188: 2 múltiplos de vida (15 DP Guerrero + 20 DP Tecnicista — that
    // DP spend is not modeled yet, see the development it.fails below).
    lifePoints: { max: 0, current: 238, multiples: 2 },
    fatigue: { max: 0, current: 9 }, // full: no exhaustion penalty
    initiative: { base: 20, armorPenalty: 0, weaponBonus: 0 },
    mentalHealth: { insanityThreshold: 0 },
    creationPoints: { total: 3, spent: 0 },

    // PDs!M25:O28 (Guerrero / Tecnicista DP columns)
    combat: {
      attack: { dp: { c1: 300, c2: 80 }, special: 0 },
      parry: { dp: { c1: 300, c2: 70 }, special: 0 },
      dodge: { dp: {}, special: 0 },
      wearArmor: { dp: { c2: 20 }, special: 0 },
      martialKnowledge: { dp: {}, special: 0 },
    },

    magic: {
      zeonDp: {},
      zeonSpecial: 0,
      magicProjectionDp: {},
      magicProjectionSpecial: 0,
      magicLevel: 0,
    },
    // PDs!O30 (10 DP ki points in AGI, Tecnicista cost 1 → +10) and PDs!O36:O41
    // (20 DP accumulation in each of the 6 characteristics, múltiplo 10 → +2 c/u).
    ki: {
      pointsDp: { agi: { c2: 10 } },
      accDp: {
        str: { c2: 20 },
        dex: { c2: 20 },
        agi: { c2: 20 },
        con: { c2: 20 },
        pow: { c2: 20 },
        wp: { c2: 20 },
      },
      special: 0,
    },
    psychic: { cvDp: {}, projectionDp: {}, projectionSpecial: 0 },

    // PDs!K129:M179 (DP) and the "Mejora Natural" columns W ("Bon.":
    // naturalBonus, times the characteristic bonus is re-applied) and X
    // ("Hab.": naturalAbilities, +10 each, 5/level). The pipeline computes the
    // Excel "Bonos" cube U = min(charMod·(1+W) + 10·X, 100).
    secondary: {
      // Atléticas
      acrobatics: { dp: { c1: 30 }, naturalBonus: 2, naturalAbilities: 5, special: 0 }, // (fila 129)
      athletics: { dp: { c1: 40 }, naturalBonus: 2, naturalAbilities: 5, special: 0 }, // (130)
      ride: { dp: { c2: 30 }, naturalBonus: 1, naturalAbilities: 5, special: 0 }, // (131)
      swim: { dp: { c1: 20 }, naturalBonus: 1, naturalAbilities: 5, special: 0 }, // (132)
      climb: { dp: { c1: 10 }, naturalBonus: 1, naturalAbilities: 5, special: 0 }, // (133)
      jump: { dp: { c1: 15 }, naturalBonus: 1, naturalAbilities: 5, special: 0 }, // (134)
      // Sociales
      style: { dp: {}, special: 0 },
      intimidate: { dp: { c1: 10, c2: 20 }, special: 0 }, // (137)
      leadership: { dp: {}, special: 0 },
      persuasion: { dp: {}, special: 0 },
      trading: { dp: { c1: 30, c2: 10 }, special: 0 }, // (140)
      streetwise: { dp: {}, special: 0 },
      etiquette: { dp: {}, special: 0 },
      // Perceptivas
      notice: { dp: {}, naturalAbilities: 8, special: 0 }, // (143)
      search: { dp: {}, naturalAbilities: 3, special: 0 }, // (144)
      track: { dp: {}, special: 0 },
      // Intelectuales
      animals: { dp: {}, special: 0 },
      sciences: { dp: { c1: 15 }, special: 0 }, // (147)
      herbalismo: { dp: {}, special: 0 },
      history: { dp: { c2: 15 }, special: 0 }, // (150)
      tactics: { dp: {}, special: 0 },
      medicine: { dp: {}, special: 0 },
      memorize: { dp: {}, special: 0 },
      navigation: { dp: { c1: 30, c2: 15 }, naturalBonus: 1, naturalAbilities: 4, special: 0 }, // (154)
      occult: { dp: {}, special: 0 },
      appraise: { dp: { c1: 15 }, special: 0 }, // Tasación (156)
      magicAppraisal: { dp: {}, special: 0 },
      // Vigor
      composure: { dp: { c1: 20, c2: 20 }, special: 0 }, // Frialdad (158)
      featsOfStrength: { dp: { c1: 50, c2: 20 }, naturalBonus: 1, special: 0 }, // (159)
      withstandPain: { dp: {}, naturalBonus: 1, special: 0 }, // VOL −5 → aporta −5 (160)
      // Subterfugio
      lockPicking: { dp: {}, special: 0 },
      disguise: { dp: {}, special: 0 },
      hide: { dp: {}, special: 0 },
      theft: { dp: {}, special: 0 },
      stealth: { dp: {}, special: 0 },
      trapLore: { dp: {}, special: 0 },
      poisons: { dp: {}, special: 0 },
      // Creativas
      art: { dp: {}, special: 0 },
      dance: { dp: {}, special: 0 },
      forging: { dp: {}, special: 0 },
      music: { dp: { c1: 20 }, naturalBonus: 2, special: 0 }, // POD 10·2 (174)
      sleightOfHand: { dp: {}, special: 0 },
      animism: { dp: {}, special: 0 },
    },
    customSecondary: {
      // Pilotar (fila 135): not in DEFAULT_SECONDARY_ABILITIES.
      piloting: {
        name: "Pilotar",
        dp: { c1: 20 },
        cost: 2,
        group: "athletics",
        baseChar: "dex",
        naturalBonus: 1, // cubo: 25·2 + 50 = 100 justos (sin cap)
        naturalAbilities: 5,
        special: 0,
      },
      // Ciencia Divina (fila 180): user-defined skill, cost 2.
      divineScience: {
        name: "Ciencia Divina",
        dp: { c2: 50 },
        cost: 2,
        group: "intellectual",
        baseChar: "int",
        naturalBonus: 6, // cubo: 10·7 = 70
        special: 0,
      },
    },
    dpConfig: { limitMode: "combined" },
  };
}

function runPipeline(): { system: Record<string, any>; ctx: PrepContext } {
  const system = fichaSystem();
  const ctx: PrepContext = {
    level: 10,
    categories: progression(),
    mode: "dp",
    mod: () => 0,
    flag: () => 0,
    charFinals: {} as PrepContext["charFinals"],
    charMods: {} as PrepContext["charMods"],
  };
  // Same order as CharacterModel.prepareDerivedData().
  prepareCharacteristics(system, ctx);
  prepareState(system, ctx);
  prepareCombat(system, ctx);
  prepareEquipment(system, ctx);
  prepareVitals(system, ctx);
  prepareSupernatural(system, ctx);
  prepareSecondaries(system, ctx, DEFAULT_SECONDARY_ABILITIES);
  prepareDevelopment(system, ctx);
  return { system, ctx };
}

let system: Record<string, any>;

beforeAll(() => {
  ({ system } = runPipeline());
});

// --- características (Principal!G11:H18) --------------------------------------

describe("ficha-test01: características", () => {
  it.each([
    ["agi", 8, 10],
    ["con", 9, 10],
    ["dex", 13, 25],
    ["str", 6, 5],
    ["int", 8, 10],
    ["per", 5, 0],
    ["pow", 9, 10],
    ["wp", 4, -5],
  ])("%s: final %i, bono %i", (key, final, mod) => {
    expect(system[key as string].final).toBe(final);
    expect(system[key as string].mod).toBe(mod);
  });
});

// --- desarrollo (PDs) ----------------------------------------------------------

describe("ficha-test01: desarrollo (PD)", () => {
  it("nivel 10 son 1500 PD (PDs!T17)", () => {
    expect(system.development.total).toBe(1500);
    expect(system.developmentPoints).toBe(1500);
  });

  it("presupuestos por tramo: 1000 / 1500 (PDs!T7, T9+T7)", () => {
    expect(system.development.perCategory.map((s: any) => s.dpBudget)).toEqual([1000, 1500]);
  });

  it("límites de combate por tramo: 600 / 900 (PDs!M86, O86)", () => {
    expect(system.development.perCategory.map((s: any) => s.limits.combat)).toEqual([600, 900]);
  });

  it("gasto en la reserva de combate: 900 justos, sin exceso", () => {
    // c1: ataque 300 + parada 300 = 600 (exactamente el límite del tramo).
    // c2: 80+70+20 combate + 10 ki + 120 acumulación = 300. Total 900 = límite.
    expect(system.development.limits.combat.spent).toBe(900);
    expect(system.development.limits.combat.limit).toBe(900);
    expect(system.development.limits.combat.over).toBe(false);
  });

  it("sin avisos ni PD huérfanos", () => {
    expect(system.development.warnings).toEqual([]);
    expect(system.development.orphanDp).toBe(0);
  });

  it("gasto contabilizado hoy: 1465 de 1500", () => {
    // Habilidades 1405 + cambio de categoría 60. Los 35 PD restantes son los
    // múltiplos de vida (PDs!K188=15, M188=20), aún sin modelar como gasto.
    expect(system.development.spent).toBe(1465);
    expect(system.development.available).toBe(35);
  });

  it.fails("los múltiplos de vida consumen PD (PDs!C194: 1000/1000 y 500/500)", () => {
    // Regla pendiente (docs/reglas/desarrollo-pds.md): comprar múltiplos de
    // vida cuesta `lifeMultiple` PD por múltiplo (Guerrero 15, Tecnicista 20).
    expect(system.development.spent).toBe(1500);
    expect(system.development.available).toBe(0);
  });
});

// --- habilidades de combate (PDs!V25:AA28, AA42) -------------------------------

describe("ficha-test01: combate", () => {
  it("H. Ataque: base 190, bono cat. 50, total 265 (PDs!AA25)", () => {
    expect(system.combat.attack.base).toBe(190); // 300/2 + 80/2
    expect(system.combat.attack.catBonus).toBe(50); // 5·5 + 5·5, cap 50
    expect(system.combat.attack.final).toBe(265); // 190 + 25 DES + 50
  });

  it("H. Parada: base 185, bono cat. 25, total 235 (PDs!AA26)", () => {
    expect(system.combat.parry.base).toBe(185); // 300/2 + 70/2
    expect(system.combat.parry.catBonus).toBe(25); // 5·5 Guerrero
    expect(system.combat.parry.final).toBe(235); // 185 + 25 DES + 25
  });

  it("H. Esquiva sin PD: total 10 (PDs!AA27)", () => {
    expect(system.combat.dodge.base).toBe(0);
    expect(system.combat.dodge.catBonus).toBe(0);
    expect(system.combat.dodge.final).toBe(10); // solo bono AGI
  });

  it("Llevar Armadura: base 10, bono cat. 25, total 40 (PDs!AA28)", () => {
    expect(system.combat.wearArmor.base).toBe(10); // 20/2
    expect(system.combat.wearArmor.catBonus).toBe(25); // 5·5 Guerrero
    expect(system.combat.wearArmor.final).toBe(40); // 10 + 5 FUE + 25
  });

  it("Conocimiento Marcial 375 (PDs!AA42)", () => {
    expect(system.martialKnowledge).toBe(375); // 25·5 + 50·5
  });

  it("desarmado: HA 265, defensa 235, turno +20, daño 15 (Combate!I21:L21)", () => {
    expect(system.equipment.unarmed.attack).toBe(265);
    expect(system.equipment.unarmed.parry).toBe(235);
    expect(system.equipment.unarmed.initiative).toBe(20);
    expect(system.equipment.unarmed.finalDamage).toBe(15); // 10 + 5 FUE
  });
});

// --- vitales y resistencias (Principal) ----------------------------------------

describe("ficha-test01: vitales", () => {
  it("PV 238 (Principal!N11 y PDs!Z188)", () => {
    expect(system.lifePoints.max).toBe(238); // 120 base CON 9 + 15·5+5·5 + 2·9
  });

  it("cansancio 9 (Principal!N16)", () => {
    expect(system.fatigue.max).toBe(9);
    expect(system.state.fatiguePenalty).toBe(0);
  });

  it("iniciativa 105 + 20 desarmado = 125 (Principal!D31)", () => {
    expect(system.initiative.final).toBe(105); // 20 base + 25 DES + 10 AGI + 50 cat.
    expect(system.initiative.final + system.equipment.unarmed.initiative).toBe(125);
  });

  it("presencia 75 (Principal!F57)", () => {
    expect(system.presence).toBe(75); // 25 + 5·10
  });

  it("resistencias RF/RE/RV/RM 85, RP 70 (Principal!J58:J62)", () => {
    expect(system.resistances.rf.total).toBe(85);
    expect(system.resistances.re.total).toBe(85);
    expect(system.resistances.rv.total).toBe(85);
    expect(system.resistances.rm.total).toBe(85);
    expect(system.resistances.rp.total).toBe(70);
  });

  it("movimiento 8, regeneración 2, tamaño 15 (Principal!J16, J11, K6)", () => {
    expect(system.movement.final).toBe(8); // AGI 8
    expect(system.movement.speedText).toBe("28 m / asalto"); // Tabla 21
    expect(system.regeneration.final).toBe(2); // tabla: CON 9 → 2
    expect(system.regeneration.amountText).toBe("20 PV / día");
    expect(system.regeneration.removalText).toBe("-5 al día");
    expect(system.size).toBe(15); // FUE 6 + CON 9 → "Medio"
  });

  it("acciones por turno 4 (Tabla 37: DES 13 + AGI 8 = 21)", () => {
    expect(system.combat.actionsPerTurn).toBe(4);
  });
});

// --- ki (PDs!V30:AA41, hoja Ki) -------------------------------------------------

describe("ficha-test01: ki", () => {
  it("puntos comprados 10 y acumulación comprada 12", () => {
    expect(system.ki.pointsBought).toBe(10); // 10 PD a coste 1 (Tecnicista), AGI
    expect(system.ki.accBought).toBe(12); // 20 PD × 6 característ . a múltiplo 10 = 2 c/u
  });

  it("ki total 62 por característica (Ki!F24)", () => {
    // Puntos de ki por característica: valor, o 10 + 2·(v−10) si supera 10
    // (DES 13 → 16). FUE6+DES16+AGI8+CON9+POD9+VOL4 = 52 innatos + 10 comprados.
    expect(system.ki.pointsInnate).toBe(52);
    expect(system.ki.totalPoints).toBe(62);
  });

  it("acumulación total 20 por característica (Ki!D24)", () => {
    // Acumulación innata por característica (FUE/AGI/CON/POD/VOL 1, DES 13 → 3)
    // = 8, + 2 compradas por característica = 12. Total 20.
    expect(system.ki.accInnate).toBe(8);
    expect(system.ki.accumulation).toBe(20);
  });
});

// --- magia y psíquica (PDs!V93:AA97, V111:AA112) --------------------------------

describe("ficha-test01: magia y psíquica", () => {
  it("proyección mágica 25 y psíquica 25 (PDs!AA96, AA112)", () => {
    expect(system.magic.magicProjectionFinal).toBe(25); // solo bono DES
    expect(system.psychic.projectionFinal).toBe(25);
  });

  it("CV innatos 4 (PDs!AA111)", () => {
    expect(system.psychic.cvMax).toBe(4); // trunc(1 + 4/3 + 5/3)
  });

  it("zeón innato 120 y ACT 10 por POD (PDs!AA93, AA94)", () => {
    // Zeón base y ACT por la tabla de POD (POD 9 → 120 zeón, ACT 10).
    expect(system.magic.zeonMax).toBe(120);
    expect(system.magic.act).toBe(10);
  });

  it("nivel de magia 30 por INT (PDs!AA97)", () => {
    // Nivel de magia innato por la tabla de INT (INT 8 → 30).
    expect(system.magic.magicLevelMax).toBe(30);
  });
});

// --- secundarias (PDs!AA129:AA180) ----------------------------------------------

describe("ficha-test01: secundarias", () => {
  it.each([
    // [clave, total esperado, celda]
    ["acrobatics", 95, "AA129"],
    ["athletics", 100, "AA130"],
    ["ride", 85, "AA131"],
    ["swim", 80, "AA132"],
    ["climb", 75, "AA133"], // base 5 exactos: sin −30
    ["jump", 67, "AA134"],
    ["style", -20, "AA136"],
    ["intimidate", 10, "AA137"],
    ["leadership", -20, "AA138"],
    ["persuasion", -20, "AA139"],
    ["trading", 30, "AA140"],
    ["streetwise", -20, "AA141"],
    ["etiquette", -20, "AA142"],
    ["notice", 50, "AA143"],
    ["search", 0, "AA144"],
    ["track", -30, "AA145"],
    ["animals", -20, "AA146"],
    ["sciences", 15, "AA147"],
    ["herbalismo", -20, "AA149"],
    ["history", 15, "AA150"],
    ["tactics", -20, "AA151"],
    ["medicine", -20, "AA152 ('-': inusable sin entrenar)"],
    ["memorize", -20, "AA153"],
    ["navigation", 75, "AA154"],
    ["occult", -20, "AA155"],
    ["appraise", 15, "AA156"],
    ["magicAppraisal", -20, "AA157 ('-')"],
    ["composure", 15, "AA158"],
    ["featsOfStrength", 95, "AA159"], // coste 1 y +5/nivel del Guerrero
    ["withstandPain", -40, "AA160"],
    ["lockPicking", -5, "AA161"],
    ["disguise", -5, "AA162"],
    ["hide", -30, "AA163"],
    ["theft", -5, "AA164"],
    ["stealth", -20, "AA165"],
    ["trapLore", -5, "AA166"], // Trampería es DES (no PER)
    ["poisons", -20, "AA167 ('-')"],
    ["art", -20, "AA168"],
    ["dance", -20, "AA169 ('-')"],
    ["forging", -5, "AA170 ('-')"],
    ["music", 40, "AA174"],
    ["sleightOfHand", -5, "AA175"],
    ["animism", -20, "AA173"],
  ])("%s = %i (PDs!%s)", (key, expected) => {
    expect(system.secondary[key as string].final).toBe(expected);
  });

  it("custom Pilotar 110 (PDs!AA135)", () => {
    expect(system.customSecondary.piloting.final).toBe(110); // 10 + 25 DES + 75
  });

  it("custom Ciencia Divina 95 (PDs!AA180)", () => {
    expect(system.customSecondary.divineScience.final).toBe(95); // 25 + 10 INT + 60
  });

  it("mejora natural al límite justo: 10+10 de 10+10, 50 de 50 (PDs!Y184:Y186)", () => {
    expect(system.secondaryImprovement).toEqual({
      physical: { assigned: 10, max: 10, over: false },
      mental: { assigned: 10, max: 10, over: false },
      abilities: { assigned: 50, max: 50, over: false },
      novel: { assigned: 0, max: 0, over: false },
      warnings: [],
    });
  });
});
