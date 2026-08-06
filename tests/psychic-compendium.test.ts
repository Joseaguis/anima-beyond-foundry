/**
 * Regression of the psychic compendium extracted from the Excel sheet
 * `Tablas psiquica` (125 powers across 13 disciplines plus the four Poderes
 * Matriciales), and of the seven hand-written Patrones Mentales.
 *
 * Like the spell and Ki compendium tests this reads the pack sources straight
 * off disk: the DataModels need `foundry.data.fields`, which does not exist in
 * Node, so validation here is pure JSON.
 */
import { readdirSync, readFileSync } from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { DIFFICULTY_LEVELS } from "../src/actors/creature/tables";

const SOURCE_DIR = path.resolve(__dirname, "..", "src", "packs", "_source");
const POWER_DIR = path.join(SOURCE_DIR, "psychicPowers");
const DISCIPLINE_DIR = path.join(SOURCE_DIR, "psychicDisciplines");
const PATTERN_DIR = path.join(SOURCE_DIR, "mentalPatterns");

interface Grade {
  difficulty: string;
  effect: string;
  damage: number;
  shieldPoints: number;
  damageBarrier: number;
}

interface PowerDoc {
  name: string;
  type: string;
  system: {
    discipline: string;
    powerLevel: number;
    action: string;
    maintainable: boolean;
    isMatrix: boolean;
    masteryCost: number;
    fortifyCvs: number;
    maintenanceDifficulty: string;
    grades: Grade[];
  };
}

interface DisciplineDoc {
  name: string;
  type: string;
  system: { affinityCost: number; situationalModifier: string };
}

interface PatternDoc {
  name: string;
  type: string;
  system: { effect: string; dpCost: number; modifier: string };
}

function load<T>(dir: string): T[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(readFileSync(path.join(dir, f), "utf-8")) as T);
}

const powers = load<PowerDoc>(POWER_DIR);
const disciplines = load<DisciplineDoc>(DISCIPLINE_DIR);
const patterns = load<PatternDoc>(PATTERN_DIR);

const ACTIONS = new Set(["active", "passive"]);
const DIFFICULTY_LABELS = DIFFICULTY_LEVELS.map((d) => d.label);
const DIFFICULTY_KEYS = new Set<string>(DIFFICULTY_LEVELS.map((d) => d.key));

/**
 * Powers per discipline as the workbook prints them. Frozen so a change in the
 * sheet or a regression in the extractor shows up as a diff, not as a silently
 * shorter catalog. The Core prints eight disciplines and Arcana Exxet five.
 */
const POWERS_BY_DISCIPLINE: Record<string, number> = {
  "Telepatía": 15,
  "Telequinesis": 14,
  "Crioquinesis": 13,
  "Incremento Físico": 13,
  "Piroquinesis": 11,
  "Energía": 11,
  "Sentiente": 10,
  "Electromagnetismo": 9,
  "Teletransporte": 7,
  "Luz": 6,
  "Causalidad": 5,
  "Telemetría": 4,
  "Hipersensibilidad": 3,
};

describe("compendio psíquico: poderes", () => {
  it("extrae los 125 poderes de la hoja (121 de disciplina + 4 matriciales)", () => {
    expect(powers.length).toBe(125);
  });

  it("todos son items de tipo psychicPower", () => {
    expect(powers.filter((p) => p.type !== "psychicPower")).toEqual([]);
  });

  it("el reparto por disciplina coincide con el impreso", () => {
    const counts: Record<string, number> = {};
    for (const p of powers) {
      if (p.system.isMatrix) continue;
      counts[p.system.discipline] = (counts[p.system.discipline] ?? 0) + 1;
    }
    expect(counts).toEqual(POWERS_BY_DISCIPLINE);
  });

  it("hay exactamente 4 Poderes Matriciales, sin disciplina ni nivel", () => {
    const matrix = powers.filter((p) => p.system.isMatrix);
    expect(matrix.map((p) => p.name).sort()).toEqual([
      "Conectar matrices",
      "Destruir matrices",
      "Ocultar matrices",
      "Sentir matrices",
    ]);
    // Core p. 228: "Estos poderes no tienen nivel" and belong to no discipline.
    expect(matrix.every((p) => p.system.powerLevel === 0 && p.system.discipline === "")).toBe(true);
  });

  it("cada poder de disciplina es de nivel 1-3 y referencia una disciplina existente", () => {
    const known = new Set(disciplines.map((d) => d.name));
    for (const p of powers) {
      if (p.system.isMatrix) continue;
      expect(known, `${p.name} apunta a "${p.system.discipline}"`).toContain(p.system.discipline);
      expect(p.system.powerLevel, p.name).toBeGreaterThanOrEqual(1);
      expect(p.system.powerLevel, p.name).toBeLessThanOrEqual(3);
    }
  });

  it("la acción es siempre activa o pasiva", () => {
    for (const p of powers) expect(ACTIONS, p.name).toContain(p.system.action);
  });

  it("cada poder trae los 10 grados en orden", () => {
    for (const p of powers) {
      expect(p.system.grades.map((g) => g.difficulty), p.name).toEqual(DIFFICULTY_LABELS);
    }
  });

  it("sólo los poderes mantenibles llevan dificultad de mantenimiento, y es una clave válida", () => {
    for (const p of powers) {
      const d = p.system.maintenanceDifficulty;
      if (!p.system.maintainable) {
        expect(d, `${p.name} no es mantenible`).toBe("");
      } else if (d !== "") {
        expect(DIFFICULTY_KEYS, p.name).toContain(d);
      }
    }
  });

  it("dominar cualquier poder cuesta 1 CV y el catálogo no trae Fortalecer", () => {
    // Fortalecer is a per-character investment (Core p. 212), never catalog data.
    for (const p of powers) {
      expect(p.system.masteryCost, p.name).toBe(1);
      expect(p.system.fortifyCvs, p.name).toBe(0);
    }
  });

  it("los nombres son únicos: el Excel ya desambigua Área (Telepatía) y Área (Sentiente)", () => {
    const names = powers.map((p) => p.name);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe("compendio psíquico: disciplinas", () => {
  it("son las 13 disciplinas, sin item para el pool de matriciales", () => {
    expect(disciplines.length).toBe(13);
    expect(disciplines.map((d) => d.name).sort()).toEqual(Object.keys(POWERS_BY_DISCIPLINE).sort());
    expect(disciplines.some((d) => d.name === "Poderes Matriciales")).toBe(false);
  });

  it("la afinidad cuesta 1 CV (Core p. 211)", () => {
    for (const d of disciplines) {
      expect(d.type).toBe("psychicDiscipline");
      expect(d.system.affinityCost, d.name).toBe(1);
    }
  });
});

describe("compendio psíquico: patrones mentales", () => {
  it("son los 7 de Arcana Exxet", () => {
    expect(patterns.map((p) => p.name).sort()).toEqual([
      "Cobardía",
      "Compasión",
      "Extroversión",
      "Introversión",
      "Locura",
      "Psicopatía",
      "Valentía",
    ]);
  });

  it("cada uno declara coste en PD, modificador y efecto", () => {
    for (const p of patterns) {
      expect(p.type).toBe("mentalPattern");
      expect(p.system.dpCost, p.name).toBeGreaterThan(0);
      expect(p.system.modifier, p.name).not.toBe("");
      expect(p.system.effect, p.name).toContain("Patrones Mentales Opuestos");
    }
  });

  it("Locura es el único que cuesta 20 PD; el resto 30", () => {
    for (const p of patterns) {
      expect(p.system.dpCost, p.name).toBe(p.name === "Locura" ? 20 : 30);
    }
  });
});

/**
 * Figures pulled out of the grade prose by `scripts/lib/parse-effect-numbers`.
 * Unlike a spell, which grade applies is decided *after* rolling — the psychic
 * potential check is looked up on the difficulty ladder — so every grade row
 * carries its own damage or shield pool.
 */
describe("cifras de combate de los poderes", () => {
  const withDamage = powers.filter((p) => p.system.grades.some((g) => g.damage > 0));
  const withShield = powers.filter((p) => p.system.grades.some((g) => g.shieldPoints > 0));

  it("los poderes ofensivos conocidos traen daño por grado", () => {
    expect(new Set(withDamage.map((p) => p.name))).toEqual(
      new Set([
        "Esquirlas de hielo",
        "Arco eléctrico",
        "Cúpula de energía",
        "Descarga de energía",
        "Barrera ígnea",
        "Inmolar",
      ]),
    );
  });

  it("los escudos psíquicos traen su aguante por grado", () => {
    expect(new Set(withShield.map((p) => p.name))).toEqual(
      new Set([
        "Escudo de hielo",
        "Escudo magnético",
        "Escudo de energía",
        "Pantalla de luz",
        "Escudo telequinético",
      ]),
    );
  });

  it("las cifras crecen al subir de dificultad", () => {
    const regressions: string[] = [];
    for (const power of [...withDamage, ...withShield]) {
      // Sólo se comparan los grados que traen cifra: la escala deja huecos
      // (los primeros peldaños son `Fatiga N`, sin efecto de combate).
      for (const key of ["damage", "shieldPoints"] as const) {
        const values = power.system.grades.map((g) => g[key]).filter((v) => v > 0);
        for (let i = 1; i < values.length; i++) {
          if (values[i] < values[i - 1]) regressions.push(`${power.name}.${key}[${i}]`);
        }
      }
    }
    expect(regressions).toEqual([]);
  });

  it("la barrera de daño queda en cero: es un campo de autor", () => {
    expect(powers.every((p) => p.system.grades.every((g) => g.damageBarrier === 0))).toBe(true);
  });
});
