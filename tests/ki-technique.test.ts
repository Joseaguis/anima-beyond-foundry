/**
 * Unit tests for the Ki technique builder (Dominus Exxet cap. 5).
 *
 * The Efecto / Desventaja catalog is generated from the `Tablas Técnicas` sheet
 * of "Ficha Anima v8.7.0.xlsx", and the CM formula is a transcription of that
 * workbook's `CM:` cell. The worked examples below come from Dominus pp. 045-046.
 */
import { describe, expect, it } from "vitest";
import {
  buildTechnique,
  formatKiCost,
  meetsTreeRequirement,
} from "../src/domains/ki/technique-build";
import { buildTechniqueProfile, techniqueRuleElements } from "../src/domains/ki/technique-profile";
import type {
  TechniqueComposition,
  TechniqueEffectEntry,
} from "../src/domains/ki/technique-data";
import {
  TECHNIQUE_DISADVANTAGES,
  TECHNIQUE_EFFECTS,
  getEffectDef,
  getEffectOption,
} from "../src/domains/ki/technique-tables";

/** A composition with every optional field defaulted. */
function composition(over: Partial<TechniqueComposition>): TechniqueComposition {
  return {
    level: 1,
    combinable: false,
    effects: [],
    disadvantages: [],
    kiReduction: {},
    kiIncrease: 0,
    freeDistribution: {},
    ...over,
  };
}

function effect(over: Partial<TechniqueEffectEntry>): TechniqueEffectEntry {
  return {
    effect: "",
    role: "secondary",
    options: [],
    duration: "none",
    distribution: {},
    upkeepDistribution: {},
    ...over,
  };
}

describe("catálogo generado", () => {
  it("tiene los efectos y desventajas del Excel", () => {
    expect(TECHNIQUE_EFFECTS.length).toBe(65);
    expect(TECHNIQUE_DISADVANTAGES.length).toBe(24);
  });

  it("Habilidad de Ataque coincide con la tabla del Excel", () => {
    const def = getEffectDef("habilidad-de-ataque");
    expect(def).toBeDefined();
    expect(def!.type).toBe("action");
    expect(def!.klass).toBe("attack");
    expect(def!.primaryChar).toBe("dex");
    expect(def!.optionalChars).toEqual({ agi: 2, str: 2, pow: 2, wp: 3 });

    // Efecto | Opción | 1º | 2º | CM | mant | SMe | SMa | Nv
    expect(getEffectOption(def!, "+10")).toEqual({
      option: "+10",
      ki1: 2,
      ki2: 4,
      cm: 5,
      mant: 1,
      sMinor: 2,
      sMajor: 4,
      level: 1,
    });
    expect(getEffectOption(def!, "+125")).toMatchObject({ ki1: 18, cm: 35, level: 2 });
  });

  it("marca como no sostenibles los efectos sin SMe/SMa", () => {
    const withoutSustain = TECHNIQUE_EFFECTS.flatMap((e) =>
      e.options.filter((o) => o.sMinor === null),
    );
    expect(withoutSustain.length).toBeGreaterThan(0);
  });
});

describe("ejemplo trabajado de Dominus p. 045", () => {
  // Técnica de nivel 2: Primario +125 al Ataque (18 Ki DES, 35 CM), más
  // Ataque a distancia 100 m (8 Ki POD, 20 CM) y Apuntar −100 (9 Ki DES, 15 CM).
  const base = (over: Partial<TechniqueEffectEntry>[]) =>
    composition({
      level: 2,
      effects: [
        effect({ effect: "habilidad-de-ataque", role: "primary", options: ["+125"], ...over[0] }),
        effect({ effect: "ataque-a-distancia", options: ["100 metros"], ...over[1] }),
        effect({
          effect: "maniobras-de-combate-y-apuntar",
          options: ["-100"],
          ...over[2],
        }),
      ],
    });

  it("suma 70 CM, admisible para una técnica de segundo nivel", () => {
    const result = buildTechnique(
      base([{ distribution: { dex: 18 } }, { distribution: { pow: 8 } }, { distribution: { dex: 9 } }]),
    );
    expect(result.cmEffects).toBe(70);
    expect(result.cm).toBe(70);
    expect(result.atLevelMinimum).toBe(false);
  });

  it("sin repartir: 27 de Destreza y 8 de Poder", () => {
    const result = buildTechnique(
      base([{ distribution: { dex: 18 } }, { distribution: { pow: 8 } }, { distribution: { dex: 9 } }]),
    );
    expect(result.kiCost.dex).toBe(27);
    expect(result.kiCost.pow).toBe(8);
    expect(result.errors).toEqual([]);
  });

  it("al pasar los 18 de DES a FUE y AGI (+2 cada una) quedan AGI 12, FUE 10, DES 9, POD 8", () => {
    const result = buildTechnique(
      base([
        { distribution: { agi: 12, str: 10 } },
        { distribution: { pow: 8 } },
        { distribution: { dex: 9 } },
      ]),
    );
    // 18 base + 2 (AGI) + 2 (FUE) = 22, repartidos 12 / 10.
    expect(result.perEffect[0].kiRequired).toBe(22);
    expect(result.perEffect[0].kiAllocated).toBe(22);
    expect(result.kiCost).toMatchObject({ agi: 12, str: 10, dex: 9, pow: 8 });
    expect(result.errors).toEqual([]);
    expect(formatKiCost(result.kiCost, result.kiUpkeep)).toBe("AGI 12 DES 9 FUE 10 POD 8");
  });

  it("detecta el Ki sin repartir", () => {
    const result = buildTechnique(
      base([{ distribution: { dex: 17 } }, { distribution: { pow: 8 } }, { distribution: { dex: 9 } }]),
    );
    expect(result.errors.map((e) => e.code)).toContain("kiNotDistributed");
  });
});

describe("ejemplo de ajuste de coste, Dominus p. 046", () => {
  // Técnica de nivel 2 de 40 CM con costes AGI 7, DES 7, POD 3. Invertir 50 CM
  // baja 5 puntos de Ki hasta el límite AGI 5, DES 5, POD 2, dejando el CM en 90.
  it("+10 CM por punto de Ki reducido, hasta la mitad de cada base", () => {
    const result = buildTechnique(
      composition({
        level: 2,
        effects: [
          effect({
            effect: "habilidad-de-ataque",
            role: "primary",
            options: ["+125"],
            // 18 base + 2 (AGI) + 2 (POD) = 22, menos 5 reducidos = 17.
            distribution: { agi: 5, dex: 5, pow: 7 },
          }),
        ],
        kiReduction: { agi: 2, dex: 2, pow: 1 },
      }),
    );
    expect(result.cmAdjustment).toBe(50);
    expect(result.cm).toBe(85); // 35 CM del efecto + 50 del ajuste
    expect(result.errors).toEqual([]);
  });

  it("rechaza bajar una característica por debajo de la mitad de su base", () => {
    const result = buildTechnique(
      composition({
        level: 2,
        effects: [
          effect({
            effect: "habilidad-de-ataque",
            role: "primary",
            options: ["+125"],
            distribution: { agi: 2, dex: 8, pow: 8 },
          }),
        ],
        kiReduction: { agi: 4 },
      }),
    );
    expect(result.errors.map((e) => e.code)).toContain("kiReductionBelowHalf");
  });

  it("exige tres características para poder reducir Ki", () => {
    const result = buildTechnique(
      composition({
        level: 2,
        effects: [
          effect({
            effect: "habilidad-de-ataque",
            role: "primary",
            options: ["+125"],
            distribution: { dex: 17 },
          }),
        ],
        kiReduction: { dex: 1 },
      }),
    );
    expect(result.errors.map((e) => e.code)).toContain("kiReductionChars");
  });

  it("−5 CM por cada 2 puntos de Ki añadidos, tope −20 CM", () => {
    const result = buildTechnique(
      composition({
        level: 2,
        effects: [
          effect({
            effect: "habilidad-de-ataque",
            role: "primary",
            options: ["+125"],
            distribution: { dex: 18 },
          }),
        ],
        kiIncrease: 8,
        freeDistribution: { dex: 8 },
      }),
    );
    expect(result.cmAdjustment).toBe(-20);
    expect(result.kiCost.dex).toBe(26);
    expect(result.errors).toEqual([]);
  });
});

describe("ejemplo de técnica mantenida, Dominus p. 046", () => {
  // Un +50 al Daño como Efecto Primario, Mantenido, en una técnica de nivel 1.
  //
  // Las tablas (Excel y Dominus p. 054, que coinciden) dan 1º = 4 Ki, CM 15,
  // Mant. 2. La prosa del ejemplo del libro dice "5 puntos de Ki" y concluye 7,
  // pero su propia tabla dice 4: el CM final (25) sí cuadra, el Ki es 6.
  const result = buildTechnique(
    composition({
      level: 1,
      effects: [
        effect({
          effect: "aumento-de-dano",
          role: "primary",
          options: ["+50"],
          duration: "maintained",
          distribution: { str: 6 },
          upkeepDistribution: { str: 2 },
        }),
      ],
    }),
  );

  it("suma 10 CM por ser mantenida y de primer nivel", () => {
    expect(result.cmEffects).toBe(15);
    expect(result.cmMaintained).toBe(10);
    expect(result.cm).toBe(25);
  });

  it("incluye el mantenimiento en el coste de activación y lo cobra cada asalto", () => {
    expect(result.kiTotal).toBe(6);
    expect(result.kiUpkeepTotal).toBe(2);
    expect(result.errors).toEqual([]);
    expect(formatKiCost(result.kiCost, result.kiUpkeep)).toBe("FUE 6 (2)");
  });
});

describe("mínimo y máximo de CM por nivel (Tabla 16)", () => {
  it("una técnica barata cuesta el mínimo de su nivel", () => {
    const result = buildTechnique(
      composition({
        effects: [
          effect({
            effect: "aumento-de-dano",
            role: "primary",
            options: ["+10"],
            distribution: { str: 1 },
          }),
        ],
      }),
    );
    expect(result.cmEffects).toBe(5);
    expect(result.cm).toBe(20);
    expect(result.atLevelMinimum).toBe(true);
  });

  it("marca el exceso sobre el máximo del nivel", () => {
    const result = buildTechnique(
      composition({
        level: 1,
        effects: [
          effect({
            effect: "habilidad-de-ataque",
            role: "primary",
            options: ["+100"],
            distribution: { dex: 14 },
          }),
          effect({
            effect: "ataque-a-distancia",
            options: ["1 kilómetro"],
            distribution: { pow: 12 },
          }),
        ],
      }),
    );
    expect(result.cm).toBeGreaterThan(50);
    expect(result.errors.map((e) => e.code)).toContain("cmExceedsLevel");
  });
});

describe("validaciones de estructura y duración", () => {
  it("exige exactamente un Efecto Primario", () => {
    const two = buildTechnique(
      composition({
        effects: [
          effect({ effect: "aumento-de-dano", role: "primary", options: ["+10"] }),
          effect({ effect: "ataque-elemental", role: "primary", options: ["Fuego"] }),
        ],
      }),
    );
    expect(two.errors.map((e) => e.code)).toContain("primaryCount");

    const none = buildTechnique(
      composition({ effects: [effect({ effect: "aumento-de-dano", options: ["+10"] })] }),
    );
    expect(none.errors.map((e) => e.code)).toContain("primaryCount");
  });

  it("rechaza un Efecto de nivel superior al de la técnica", () => {
    const result = buildTechnique(
      composition({
        level: 1,
        effects: [
          effect({ effect: "habilidad-de-ataque", role: "primary", options: ["+125"] }),
        ],
      }),
    );
    expect(result.errors.map((e) => e.code)).toContain("effectLevelTooHigh");
  });

  it("no permite sostener una técnica de primer nivel", () => {
    const result = buildTechnique(
      composition({
        level: 1,
        effects: [
          effect({
            effect: "aumento-de-dano",
            role: "primary",
            options: ["+10"],
            duration: "sustainedMinor",
          }),
        ],
      }),
    );
    expect(result.errors.map((e) => e.code)).toContain("sustainLevel");
  });

  it("una Sostenida solo admite Efectos de nivel estrictamente inferior", () => {
    const result = buildTechnique(
      composition({
        level: 2,
        effects: [
          effect({
            effect: "habilidad-de-ataque",
            role: "primary",
            options: ["+125"], // Nv 2, igual que la técnica
            duration: "sustainedMinor",
          }),
        ],
      }),
    );
    expect(result.errors.map((e) => e.code)).toContain("sustainEffectLevel");
  });

  it("no permite mezclar Mantenido y Sostenido", () => {
    const result = buildTechnique(
      composition({
        level: 2,
        effects: [
          effect({
            effect: "aumento-de-dano",
            role: "primary",
            options: ["+10"],
            duration: "maintained",
          }),
          effect({
            effect: "ataque-elemental",
            options: ["Fuego"],
            duration: "sustainedMinor",
          }),
        ],
      }),
    );
    expect(result.errors.map((e) => e.code)).toContain("maintainedAndSustained");
  });

  it("limita las desventajas al máximo del nivel", () => {
    const result = buildTechnique(
      composition({
        level: 1,
        effects: [effect({ effect: "aumento-de-dano", role: "primary", options: ["+10"] })],
        disadvantages: [
          { disadvantage: "compleja", option: "" },
          { disadvantage: "sin-defensa", option: "" },
        ],
      }),
    );
    expect(result.errors.map((e) => e.code)).toContain("tooManyDisadvantages");
  });
});

describe("combinable (Tabla 19)", () => {
  it("suma 10 CM y 3 Ki por nivel", () => {
    const result = buildTechnique(
      composition({
        level: 2,
        combinable: true,
        effects: [
          effect({
            effect: "aumento-de-dano",
            role: "primary",
            options: ["+10"],
            distribution: { str: 1 },
          }),
        ],
        freeDistribution: { pow: 6 },
      }),
    );
    expect(result.cmCombinable).toBe(20);
    expect(result.kiTotal).toBe(7); // 1 del efecto + 6 de combinable
    expect(result.errors).toEqual([]);
  });
});

describe("perfil mecánico", () => {
  it("separa los Efectos de Tipo Asalto de los de Tipo Acción", () => {
    const profile = buildTechniqueProfile(
      composition({
        level: 2,
        effects: [
          // Habilidad de Esquiva es de Tipo Acción y clase Defensa.
          effect({ effect: "habilidad-de-esquiva", role: "primary", options: ["+75"] }),
          // Incremento de Resistencia Física es de Tipo Asalto.
          effect({ effect: "incremento-de-resistencia-fisica", options: ["+20 RF"] }),
        ],
      }),
    );
    expect(profile.action.dodge).toBe(75);
    expect(profile.round.rf).toBe(20);
    // Sin Efectos de clase Ataque, la técnica es pasiva.
    expect(profile.activation).toBe("passive");
  });

  it("marca la técnica como activa en cuanto un Efecto exige atacar", () => {
    const profile = buildTechniqueProfile(
      composition({
        effects: [effect({ effect: "aumento-de-dano", role: "primary", options: ["+50"] })],
      }),
    );
    expect(profile.activation).toBe("active");
    expect(profile.action.damage).toBe(50);
  });

  it("extrae ataques extra, alcance, área y estados", () => {
    const profile = buildTechniqueProfile(
      composition({
        level: 3,
        effects: [
          effect({ effect: "ataque-adicional", role: "primary", options: ["+2"] }),
          effect({ effect: "ataque-a-distancia", options: ["1 kilómetro"] }),
          effect({ effect: "ataque-con-area", options: ["25 metros de radio"] }),
          effect({
            effect: "estados-sobrenaturales",
            options: ["RF 160", "Estado añadido: Terror"],
          }),
        ],
      }),
    );
    expect(profile.extraAttacks).toBe(2);
    expect(profile.range).toBe(1000); // los kilómetros se normalizan a metros
    expect(profile.area).toBe(25);
    expect(profile.states).toEqual(["Terror"]);
  });

  it("refleja la duración con sus asaltos", () => {
    const sustained = buildTechniqueProfile(
      composition({
        level: 2,
        effects: [
          effect({
            effect: "incremento-de-resistencia-fisica",
            role: "primary",
            options: ["+20 RF"],
            duration: "sustainedMinor",
          }),
        ],
      }),
    );
    expect(sustained.duration).toEqual({ mode: "sustainedMinor", rounds: 5 });

    const maintained = buildTechniqueProfile(
      composition({
        effects: [
          effect({
            effect: "aumento-de-dano",
            role: "primary",
            options: ["+10"],
            duration: "maintained",
          }),
        ],
      }),
    );
    expect(maintained.duration).toEqual({ mode: "maintained", rounds: null });
  });

  it("cobra Ki extra por acumular Estados añadidos", () => {
    const result = buildTechnique(
      composition({
        level: 3,
        effects: [
          effect({
            effect: "estados-sobrenaturales",
            role: "primary",
            options: ["RF 160", "Estado añadido: Terror", "Estado añadido: Dolor Extremo"],
          }),
        ],
      }),
    );
    const options = ["RF 160", "Estado añadido: Terror", "Estado añadido: Dolor Extremo"];
    const def = getEffectDef("estados-sobrenaturales")!;
    const base = options.reduce((sum, o) => sum + (getEffectOption(def, o)?.ki1 ?? 0), 0);
    // Dos "Estado añadido" cuestan n·(n−1) = 2 puntos de Ki extra.
    expect(result.perEffect[0].kiRequired).toBe(base + 2);
  });
});

describe("reglas derivadas", () => {
  it("solo emite modificadores de Tipo Asalto y siempre con predicado", () => {
    const profile = buildTechniqueProfile(
      composition({
        level: 2,
        effects: [
          effect({ effect: "habilidad-de-esquiva", role: "primary", options: ["+75"] }),
          effect({ effect: "incremento-de-resistencia-fisica", options: ["+20 RF"] }),
        ],
      }),
    );
    const rules = techniqueRuleElements(profile, "yuki");
    expect(rules).toEqual([
      {
        key: "FlatModifier",
        target: "rf",
        value: 20,
        type: "special",
        predicate: ["technique:yuki:active"],
      },
    ]);
  });

  it("no emite nada cuando la técnica no tiene bonos persistentes", () => {
    const profile = buildTechniqueProfile(
      composition({
        effects: [effect({ effect: "aumento-de-dano", role: "primary", options: ["+50"] })],
      }),
    );
    expect(techniqueRuleElements(profile, "feuer")).toEqual([]);
  });
});

describe("requisito de Árbol de Técnicas", () => {
  it("exige dos técnicas del nivel inmediatamente inferior", () => {
    expect(meetsTreeRequirement(1, [])).toBe(true);
    expect(meetsTreeRequirement(2, [{ level: 1 }])).toBe(false);
    expect(meetsTreeRequirement(2, [{ level: 1 }, { level: 1 }])).toBe(true);
    expect(meetsTreeRequirement(3, [{ level: 1 }, { level: 1 }, { level: 2 }])).toBe(false);
    expect(meetsTreeRequirement(3, [{ level: 2 }, { level: 2 }])).toBe(true);
  });
});

describe("desventajas", () => {
  it("descuentan CM y respetan su clase", () => {
    const result = buildTechnique(
      composition({
        level: 2,
        effects: [
          effect({
            effect: "habilidad-de-ataque",
            role: "primary",
            options: ["+100"],
            distribution: { dex: 14 },
          }),
        ],
        // Sin Defensa (−15) es de clase Ataque y el efecto lo es, así que vale.
        disadvantages: [{ disadvantage: "sin-defensa", option: "" }],
      }),
    );
    expect(result.cmDisadvantages).toBe(-15);
    // 30 CM del efecto − 15 = 15, por debajo del mínimo de nivel 2.
    expect(result.cm).toBe(40);
    expect(result.atLevelMinimum).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("rechaza una desventaja defensiva en una técnica sin Efectos de defensa", () => {
    const result = buildTechnique(
      composition({
        level: 2,
        effects: [
          effect({
            effect: "habilidad-de-ataque",
            role: "primary",
            options: ["+100"],
            distribution: { dex: 14 },
          }),
        ],
        disadvantages: [{ disadvantage: "defensa-especializada", option: "Físicos" }],
      }),
    );
    expect(result.errors.map((e) => e.code)).toContain("disadvantageClass");
  });
});
