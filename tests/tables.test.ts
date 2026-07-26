import { describe, expect, it } from "vitest";
import {
  DIFFICULTY_LEVELS,
  getActionsPerTurn,
  getDifficultyForValue,
  getLifePointsBase,
  getModifier,
  getMovementSpeed,
  getRegeneration,
  getRegenerationRow,
  REGENERATION_TABLE,
} from "../src/actors/creature/tables";

describe("DIFFICULTY_LEVELS (escala compartida por magia y psíquica)", () => {
  it("son los diez grados con sus umbrales impresos", () => {
    expect(DIFFICULTY_LEVELS.map((d) => d.threshold)).toEqual([
      20, 40, 80, 120, 140, 180, 240, 280, 320, 440,
    ]);
  });

  it("Imposible alcanza 10 km, no 5 (caja «Dificultades» del Excel)", () => {
    const impossible = DIFFICULTY_LEVELS.find((d) => d.key === "impossible");
    expect(impossible?.range).toBe("Hasta 10 km. Blanco aproximado");
  });
});

describe("getDifficultyForValue (dificultad que alcanza un potencial)", () => {
  it("toma el grado más alto que el valor cubre, sin dados ni modificadores", () => {
    // Core p. 212: con potencial +60 se mantiene en Fácil; con +120, en Difícil.
    expect(getDifficultyForValue(60)?.key).toBe("easy");
    expect(getDifficultyForValue(120)?.key).toBe("hard");
    expect(getDifficultyForValue(20)?.key).toBe("routine");
    expect(getDifficultyForValue(1000)?.key).toBe("zen");
  });

  it("por debajo de 20 no alcanza ningún grado", () => {
    expect(getDifficultyForValue(19)).toBeUndefined();
  });
});

describe("getModifier (characteristic -> modifier table)", () => {
  it("matches the Core Exxet table", () => {
    const expected: Record<number, number> = {
      1: -30,
      2: -20,
      3: -10,
      4: -5,
      5: 0,
      6: 5,
      7: 5,
      8: 10,
      9: 10,
      10: 15,
      11: 20,
      12: 20,
      13: 25,
      14: 25,
      15: 30,
      16: 35,
      17: 35,
      18: 40,
      19: 40,
      20: 45,
    };
    for (const [value, mod] of Object.entries(expected)) {
      expect(getModifier(Number(value)), `char ${value}`).toBe(mod);
    }
  });

  it("clamps at the bottom", () => {
    expect(getModifier(0)).toBe(-30);
    expect(getModifier(-3)).toBe(-30);
  });
});

describe("getRegeneration (CON -> base regeneration table)", () => {
  it("matches the sheet's Tabla_Regen", () => {
    const expected: Record<number, number> = {
      1: 0,
      2: 0,
      3: 1,
      7: 1,
      8: 2,
      9: 2,
      10: 3,
      11: 4,
      12: 5,
      13: 6,
      14: 7,
      15: 8,
      16: 9,
      17: 10,
      18: 11,
      19: 12,
      20: 12,
    };
    for (const [con, regen] of Object.entries(expected)) {
      expect(getRegeneration(Number(con)), `con ${con}`).toBe(regen);
    }
  });
});

describe("getRegenerationRow (Tabla 19/20, level 0..20)", () => {
  it("has one row per regeneration level", () => {
    expect(REGENERATION_TABLE).toHaveLength(21);
  });

  it("matches the sheet at key levels", () => {
    expect(getRegenerationRow(0)).toEqual({ amount: "Ninguna", removal: "Ninguna", special: "" });
    expect(getRegenerationRow(2)).toMatchObject({ amount: "20 PV / día", removal: "-5 al día" });
    expect(getRegenerationRow(5)).toMatchObject({
      amount: "50 PV / día *",
      removal: "-10 al día",
      special: "Sin cicatrices.",
    });
    expect(getRegenerationRow(12)).toMatchObject({
      amount: "5 PV / min *",
      removal: "-5 por hora",
    });
    expect(getRegenerationRow(12).special).toContain("Miembros unidos se recuperan en 3 días");
    expect(getRegenerationRow(19)).toMatchObject({ amount: "100 PV / turno *", removal: "Todos" });
    expect(getRegenerationRow(20).special).toContain("Inmune a críticos físicos");
  });

  it("clamps outside 0..20", () => {
    expect(getRegenerationRow(-3)).toEqual(getRegenerationRow(0));
    expect(getRegenerationRow(25)).toEqual(getRegenerationRow(20));
  });
});

describe("getMovementSpeed (Tabla 21, movement type -> speed)", () => {
  it("matches the sheet at key levels", () => {
    expect(getMovementSpeed(1)).toBe("< 1 m / asalto");
    expect(getMovementSpeed(8)).toBe("28 m / asalto");
    expect(getMovementSpeed(19)).toBe("25 km / asalto");
    expect(getMovementSpeed(20)).toBe("Esp*");
  });

  it("0 or below cannot move; above 20 clamps", () => {
    expect(getMovementSpeed(0)).toBe("—");
    expect(getMovementSpeed(-2)).toBe("—");
    expect(getMovementSpeed(23)).toBe("Esp*");
  });
});

describe("getActionsPerTurn (Tabla 37, DEX+AGI -> actions)", () => {
  it("matches every threshold", () => {
    const expected: [number, number][] = [
      [0, 1], [10, 1], [11, 2], [14, 2], [15, 3], [19, 3], [20, 4], [22, 4],
      [23, 5], [25, 5], [26, 6], [28, 6], [29, 8], [31, 8], [32, 10], [40, 10],
    ];
    for (const [sum, actions] of expected) {
      expect(getActionsPerTurn(sum), `DES+AGI ${sum}`).toBe(actions);
    }
  });
});

describe("getLifePointsBase (CON -> base LP table)", () => {
  it("matches the Core Exxet table", () => {
    const expected: Record<number, number> = {
      1: 5,
      2: 20,
      3: 40,
      4: 55,
      5: 70,
      6: 85,
      7: 95,
      8: 110,
      9: 120,
      10: 135,
      11: 150,
      12: 160,
      13: 175,
      14: 185,
      15: 200,
    };
    for (const [con, lp] of Object.entries(expected)) {
      expect(getLifePointsBase(Number(con)), `con ${con}`).toBe(lp);
    }
  });
});
