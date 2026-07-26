/**
 * Regression of the spell compendium extracted from the Excel sheet
 * `Tablas Magia` (640 spells) and the paths generated alongside it.
 *
 * Like the Ki compendium test this reads the pack sources straight off disk:
 * the DataModels need `foundry.data.fields`, which does not exist in Node, so
 * validation here is pure JSON.
 */
import { readdirSync, readFileSync } from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { getFreeSpellCost, parseOpposedPaths } from "../src/domains/magic/tables";
import {
  FREE_ACCESS_LABEL,
  FREE_ACCESS_LEVELS,
  SUB_PATH_LEVELS,
} from "../src/domains/magic/free-access.generated";

const SOURCE_DIR = path.resolve(__dirname, "..", "src", "packs", "_source");
const SPELL_DIR = path.join(SOURCE_DIR, "spells");
const PATH_DIR = path.join(SOURCE_DIR, "magicPaths");

interface SpellGrade {
  zeonCost: number;
  intRequired: number;
  maintenanceCost: number;
  effect: string;
}

interface SpellDoc {
  name: string;
  type: string;
  system: {
    spellLevel: number;
    actionType: string;
    maintenanceType: string;
    magicPath: string;
    spellType: string;
    resistanceType: string;
    closedPaths: string;
    grades: Record<string, SpellGrade>;
  };
}

interface PathDoc {
  name: string;
  type: string;
  system: { subtype: string; pathType: string; opposedPath: string };
}

function load<T>(dir: string): T[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(readFileSync(path.join(dir, f), "utf-8")) as T);
}

const spells = load<SpellDoc>(SPELL_DIR);
const paths = load<PathDoc>(PATH_DIR);

const GRADE_KEYS = ["base", "intermediate", "advanced", "arcane"] as const;
const SPELL_TYPES = new Set([
  "effect",
  "attack",
  "defense",
  "detection",
  "automatic",
  "spiritual",
]);
const ACTION_TYPES = new Set(["active", "passive"]);
const MAINTENANCE_TYPES = new Set(["none", "daily", "sustained"]);

/**
 * Data-entry errors in the workbook, not extraction bugs. `Atar esencia vital`
 * (Esencia 86) has the literal "Activa" in its `Tipo` column instead of a spell
 * type, so it falls back to "effect".
 *
 * Asserted as an exact set so a regression in the `Tipo` canonicalisation —
 * which absorbs the sheet's inconsistent accents and abbreviations — shows up
 * here as a new entry rather than passing silently.
 */
const KNOWN_BAD_TIPO = new Set(["Atar esencia vital"]);

describe("spell compendium", () => {
  it("extracts every spell of the sheet", () => {
    expect(spells.length).toBe(640);
    expect(spells.every((s) => s.type === "spell")).toBe(true);
  });

  it("covers the eleven paths, the sub-paths and Libre Acceso", () => {
    const counts = new Map<string, number>();
    for (const s of spells) {
      counts.set(s.system.magicPath, (counts.get(s.system.magicPath) ?? 0) + 1);
    }
    // Core p. 118: five major paths of 40 spells and six minor ones of 30.
    for (const major of ["Luz", "Oscuridad", "Creación", "Destrucción", "Nigromancia"]) {
      expect(counts.get(major)).toBe(40);
    }
    for (const minor of ["Fuego", "Agua", "Aire", "Tierra", "Esencia", "Ilusión"]) {
      expect(counts.get(minor)).toBe(30);
    }
    expect(counts.get("Libre acceso")).toBe(120);
    // Fourteen sub-paths of ten spells each (Arcana Exxet).
    const subPaths = [...counts.entries()].filter(([, n]) => n === 10);
    expect(subPaths.length).toBe(14);
  });

  it("references only paths that exist in the magicPaths pack", () => {
    const known = new Set(paths.map((p) => p.name));
    const dangling = [...new Set(spells.map((s) => s.system.magicPath))].filter(
      (via) => !known.has(via),
    );
    // "Libre acceso" is the pool label, not a path: it deliberately has no item.
    expect(dangling).toEqual([FREE_ACCESS_LABEL]);
  });

  it("uses only declared enum values", () => {
    const badType = spells.filter((s) => !SPELL_TYPES.has(s.system.spellType));
    const badAction = spells.filter((s) => !ACTION_TYPES.has(s.system.actionType));
    const badMaintenance = spells.filter(
      (s) => !MAINTENANCE_TYPES.has(s.system.maintenanceType),
    );
    expect(badType).toEqual([]);
    expect(badAction).toEqual([]);
    expect(badMaintenance).toEqual([]);
  });

  it("pins the rows whose Tipo column is unusable", () => {
    // Everything the extractor could not classify fell back to "effect"; the
    // reverse check (an "effect" spell that should be something else) is what
    // the pinned set guards.
    const fellBack = spells.filter((s) => KNOWN_BAD_TIPO.has(s.name));
    expect(new Set(fellBack.map((s) => s.name))).toEqual(KNOWN_BAD_TIPO);
    expect(fellBack.every((s) => s.system.spellType === "effect")).toBe(true);
  });

  it("keeps spell levels within 2-100 and even", () => {
    const bad = spells.filter(
      (s) => s.system.spellLevel < 2 || s.system.spellLevel > 100 || s.system.spellLevel % 2 !== 0,
    );
    expect(bad.map((s) => `${s.name} (${s.system.spellLevel})`)).toEqual([]);
  });

  it("has four grades whose zeon and INT never decrease", () => {
    const bad: string[] = [];
    for (const s of spells) {
      const grades = GRADE_KEYS.map((k) => s.system.grades[k]);
      if (grades.some((g) => !g)) {
        bad.push(`${s.name}: missing grade`);
        continue;
      }
      for (let i = 1; i < grades.length; i++) {
        if (grades[i].zeonCost < grades[i - 1].zeonCost) {
          bad.push(`${s.name}: zeon ${GRADE_KEYS[i]} < ${GRADE_KEYS[i - 1]}`);
        }
        if (grades[i].intRequired < grades[i - 1].intRequired) {
          bad.push(`${s.name}: INT ${GRADE_KEYS[i]} < ${GRADE_KEYS[i - 1]}`);
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it("only marks a spell maintainable when it has a maintenance cost", () => {
    const bad = spells.filter((s) => {
      const hasCost = GRADE_KEYS.some((k) => (s.system.grades[k]?.maintenanceCost ?? 0) > 0);
      return hasCost !== (s.system.maintenanceType !== "none");
    });
    expect(bad.map((s) => s.name)).toEqual([]);
  });
});

describe("magic paths", () => {
  it("classifies the eleven real paths and their oppositions", () => {
    const byName = new Map(paths.map((p) => [p.name, p]));
    // Excel Tabla_VíasOpuestas — the complete map, which the Core only
    // exemplifies (p. 118 names just Luz/Oscuridad and Creación/Destrucción).
    const expected: Record<string, string[]> = {
      Luz: ["Oscuridad", "Nigromancia"],
      Oscuridad: ["Luz", "Nigromancia"],
      Creación: ["Destrucción", "Nigromancia"],
      Destrucción: ["Creación", "Nigromancia"],
      Fuego: ["Agua", "Nigromancia"],
      Agua: ["Fuego", "Nigromancia"],
      Aire: ["Tierra", "Nigromancia"],
      Tierra: ["Aire", "Nigromancia"],
      Esencia: ["Ilusión", "Nigromancia"],
      Ilusión: ["Esencia", "Nigromancia"],
    };
    for (const [name, opposed] of Object.entries(expected)) {
      expect(parseOpposedPaths(byName.get(name)?.system.opposedPath)).toEqual(opposed);
    }
    // Nigromancia is antagonistic to all ten others.
    expect(parseOpposedPaths(byName.get("Nigromancia")?.system.opposedPath)).toHaveLength(10);
  });

  it("marks major and minor paths", () => {
    const majors = paths.filter((p) => p.system.pathType === "major").map((p) => p.name).sort();
    const minors = paths.filter((p) => p.system.pathType === "minor").map((p) => p.name).sort();
    expect(majors).toEqual(["Creación", "Destrucción", "Luz", "Nigromancia", "Oscuridad"]);
    expect(minors).toEqual(["Agua", "Aire", "Esencia", "Fuego", "Ilusión", "Tierra"]);
  });

  it("keeps the hand-written metamagia doc out of the generated set", () => {
    expect(paths.some((p) => p.system.subtype === "metamagic")).toBe(true);
  });

  it("marks the fourteen sub-paths and emits no item for Libre Acceso", () => {
    const subPaths = paths.filter((p) => p.system.subtype === "subPath");
    expect(subPaths.length).toBe(14);
    expect(paths.filter((p) => p.system.subtype === "path").length).toBe(11);
    expect(paths.some((p) => p.name === FREE_ACCESS_LABEL)).toBe(false);
  });

  it("places every sub-path spell on a sub-path level", () => {
    const subPathNames = new Set(
      paths.filter((p) => p.system.subtype === "subPath").map((p) => p.name),
    );
    const misplaced = spells
      .filter((s) => subPathNames.has(s.system.magicPath))
      .filter((s) => !SUB_PATH_LEVELS.includes(s.system.spellLevel));
    expect(misplaced.map((s) => `${s.name} (${s.system.spellLevel})`)).toEqual([]);
    expect(SUB_PATH_LEVELS).toEqual([4, 14, 24, 34, 44, 54, 64, 74, 84, 94]);
  });
});

describe("free-access slots", () => {
  it("gives major paths 10 slots and minor ones 20", () => {
    for (const p of paths.filter((p) => p.system.pathType === "major")) {
      expect(FREE_ACCESS_LEVELS[p.name]).toHaveLength(10);
    }
    for (const p of paths.filter((p) => p.system.pathType === "minor")) {
      expect(FREE_ACCESS_LEVELS[p.name]).toHaveLength(20);
    }
  });

  it("never puts a slot where the path already prints a spell", () => {
    const ownLevels = new Map<string, Set<number>>();
    for (const s of spells) {
      const set = ownLevels.get(s.system.magicPath) ?? new Set<number>();
      set.add(s.system.spellLevel);
      ownLevels.set(s.system.magicPath, set);
    }
    const clashes: string[] = [];
    for (const [via, levels] of Object.entries(FREE_ACCESS_LEVELS)) {
      for (const l of levels) {
        if (ownLevels.get(via)?.has(l)) clashes.push(`${via} ${l}`);
      }
    }
    expect(clashes).toEqual([]);
  });

  it("puts one slot per decade in major paths and two in minor ones", () => {
    const perDecade = (via: string) => {
      const counts = new Map<number, number>();
      for (const l of FREE_ACCESS_LEVELS[via]) {
        const decade = Math.ceil(l / 10);
        counts.set(decade, (counts.get(decade) ?? 0) + 1);
      }
      return [...new Set(counts.values())];
    };
    expect(perDecade("Luz")).toEqual([1]);
    expect(perDecade("Fuego")).toEqual([2]);
  });

  it("aligns sub-path levels with the first slot of each decade", () => {
    // This is what makes a sub-path consume all ten slots of a major path but
    // only half of a minor one.
    for (const level of SUB_PATH_LEVELS) {
      expect(FREE_ACCESS_LEVELS["Luz"]).toContain(level);
      expect(FREE_ACCESS_LEVELS["Fuego"]).toContain(level);
    }
  });
});

describe("Tabla 60 (loose spell cost)", () => {
  it("charges 2 magic level per band of ten spell levels", () => {
    expect(getFreeSpellCost(2)).toBe(2);
    expect(getFreeSpellCost(10)).toBe(2);
    expect(getFreeSpellCost(12)).toBe(4);
    expect(getFreeSpellCost(20)).toBe(4);
    expect(getFreeSpellCost(22)).toBe(6);
    expect(getFreeSpellCost(50)).toBe(10);
    expect(getFreeSpellCost(92)).toBe(20);
    expect(getFreeSpellCost(100)).toBe(20);
  });

  it("prices every spell in the compendium", () => {
    const unpriced = spells.filter((s) => getFreeSpellCost(s.system.spellLevel) <= 0);
    expect(unpriced).toEqual([]);
  });
});
