/**
 * Natural improvement of secondary abilities (Excel "Mejora Natural"):
 * - the "Bonos" cube = charMod·(1+Bon.) + 10·Hab., capped at 100 (Excel U129);
 *   with the `secondaryBonusSoftCap` special rule the excess above 100 counts
 *   at half value, rounded down to a multiple of 5;
 * - Novel bonuses are +10 each as category bonus, OUTSIDE the cap;
 * - budgets (warn-only, never clamped): max(1, level) natural bonuses on
 *   physical secondaries + as many on mental ones, 5·max(1, level) natural
 *   abilities, Σ novelPerLevel·levels Novel bonuses.
 */
import { describe, expect, it } from "vitest";
import {
  prepareSecondaries,
  type SecondaryAbilityDef,
} from "../src/actors/creature/prep/secondaries";
import {
  defaultCategoryData,
  type CharacteristicKey,
  type PrepContext,
  type ResolvedCategory,
} from "../src/actors/creature/prep/types";
import { categorySystemToData, type CategorySystemSource } from "../src/items/category/data";
import { specialRuleFlagValue } from "../src/rules/special-rules";
import freelancerPack from "../src/packs/_source/categories/freelancer.json";

const DEFS: SecondaryAbilityDef[] = [
  { key: "acrobatics", labelKey: "x", group: "athletics", baseChar: "agi" },
  { key: "jump", labelKey: "x", group: "athletics", baseChar: "str" },
  { key: "notice", labelKey: "x", group: "perceptive", baseChar: "per" },
  { key: "withstandPain", labelKey: "x", group: "vigor", baseChar: "wp" },
];

function singleStage(levels: number): ResolvedCategory[] {
  return [
    { key: "c1", data: defaultCategoryData(), levels, cumulativeLevels: levels, changeCost: 0 },
  ];
}

function ctxFor(opts: {
  level?: number;
  categories?: ResolvedCategory[];
  charMods?: Partial<Record<CharacteristicKey, number>>;
  flags?: Record<string, number>;
  mode?: PrepContext["mode"];
}): PrepContext {
  const level = opts.level ?? 5;
  return {
    level,
    categories: opts.categories ?? singleStage(level),
    mode: opts.mode ?? "dp",
    mod: () => 0,
    flag: (key) => opts.flags?.[key] ?? 0,
    charFinals: {} as PrepContext["charFinals"],
    charMods: {
      str: 0, dex: 0, agi: 0, con: 0, int: 0, pow: 0, wp: 0, per: 0,
      ...opts.charMods,
    },
  };
}

function run(
  system: Record<string, any>,
  ctxOpts: Parameters<typeof ctxFor>[0] = {},
): Record<string, any> {
  prepareSecondaries(system, ctxFor(ctxOpts), DEFS);
  return system;
}

// --- the "Bonos" cube and its cap -------------------------------------------

describe("cubo de Bonos (charMod·(1+Bon.) + 10·Hab.)", () => {
  it("sin mejora natural, el cubo es exactamente el bono de característica", () => {
    const system = run(
      { secondary: { acrobatics: { dp: {} } } },
      { charMods: { agi: 10 } },
    );
    expect(system.secondary.acrobatics.bonusRaw).toBe(10);
    expect(system.secondary.acrobatics.bonusTotal).toBe(10);
  });

  it("un charMod negativo también se re-aplica (withstandPain VOL −5, Bon. 1)", () => {
    const system = run(
      { secondary: { withstandPain: { dp: {}, naturalBonus: 1 } } },
      { charMods: { wp: -5 } },
    );
    expect(system.secondary.withstandPain.bonusRaw).toBe(-10);
    expect(system.secondary.withstandPain.bonusTotal).toBe(-10);
  });

  it("100 justos no se capan", () => {
    // 10·(1+4) + 10·5 = 100
    const system = run(
      { secondary: { acrobatics: { dp: {}, naturalBonus: 4, naturalAbilities: 5 } } },
      { charMods: { agi: 10 } },
    );
    expect(system.secondary.acrobatics.bonusRaw).toBe(100);
    expect(system.secondary.acrobatics.bonusTotal).toBe(100);
  });

  it.each([
    // [charMod, Bon., Hab., bruto, sin regla, con cap suave]
    [10, 6, 5, 120, 100, 110],
    [10, 7, 5, 130, 100, 115],
    [5, 8, 10, 145, 100, 120],
    [25, 5, 5, 200, 100, 150],
  ])(
    "bruto %i·(1+%i)+10·%i = %i → cap %i, cap suave %i",
    (charMod, bon, hab, raw, capped, softCapped) => {
      const make = () => ({
        secondary: { acrobatics: { dp: {}, naturalBonus: bon, naturalAbilities: hab } },
      });

      const plain = run(make(), { charMods: { agi: charMod } });
      expect(plain.secondary.acrobatics.bonusRaw).toBe(raw);
      expect(plain.secondary.acrobatics.bonusTotal).toBe(capped);

      const soft = run(make(), {
        charMods: { agi: charMod },
        flags: { secondaryBonusSoftCap: 1 },
      });
      expect(soft.secondary.acrobatics.bonusTotal).toBe(softCapped);
    },
  );

  it("los bonos de Novel suman al bono de categoría, fuera del cap", () => {
    // Cubo bruto 120 → capado a 100; Novel 3 → +30 en Cat. por encima.
    const system = run(
      {
        secondary: {
          acrobatics: { dp: {}, naturalBonus: 6, naturalAbilities: 5, novelBonus: 3 },
        },
      },
      { charMods: { agi: 10 } },
    );
    const ad = system.secondary.acrobatics;
    expect(ad.bonusTotal).toBe(100);
    expect(ad.catBonus).toBe(30);
    expect(ad.final).toBe(100 + 30 - 30); // + sin entrenar (base 0)
  });

  it("las secundarias personalizadas usan el mismo cubo", () => {
    const system = run(
      {
        customSecondary: {
          piloting: {
            name: "Pilotar",
            dp: {},
            cost: 2,
            group: "athletics",
            baseChar: "dex",
            naturalBonus: 6,
            naturalAbilities: 5,
          },
        },
      },
      { charMods: { dex: 10 } },
    );
    expect(system.customSecondary.piloting.bonusRaw).toBe(120);
    expect(system.customSecondary.piloting.bonusTotal).toBe(100);
  });
});

// --- budgets ------------------------------------------------------------------

describe("presupuestos de mejora natural (secondaryImprovement)", () => {
  it("suelo a nivel 0: 1 físico + 1 mental y 5 habilidades (plantilla Excel)", () => {
    const system = run({ secondary: {} }, { level: 0, categories: singleStage(0) });
    expect(system.secondaryImprovement.physical.max).toBe(1);
    expect(system.secondaryImprovement.mental.max).toBe(1);
    expect(system.secondaryImprovement.abilities.max).toBe(5);
  });

  it("físico y mental se presupuestan por separado según la característica", () => {
    const system = run(
      {
        secondary: {
          acrobatics: { dp: {}, naturalBonus: 2 }, // AGI → físico
          jump: { dp: {}, naturalBonus: 1 }, // FUE → físico
          notice: { dp: {}, naturalBonus: 3 }, // PER → mental
        },
      },
      { level: 5 },
    );
    expect(system.secondaryImprovement.physical).toEqual({ assigned: 3, max: 5, over: false });
    expect(system.secondaryImprovement.mental).toEqual({ assigned: 3, max: 5, over: false });
  });

  it("las personalizadas computan por su característica", () => {
    const system = run(
      {
        secondary: {},
        customSecondary: {
          piloting: { name: "Pilotar", dp: {}, baseChar: "dex", naturalBonus: 2, naturalAbilities: 3 },
          divineScience: { name: "Ciencia Divina", dp: {}, baseChar: "int", naturalBonus: 4, novelBonus: 1 },
        },
      },
      { level: 5 },
    );
    const imp = system.secondaryImprovement;
    expect(imp.physical.assigned).toBe(2);
    expect(imp.mental.assigned).toBe(4);
    expect(imp.abilities.assigned).toBe(3);
    expect(imp.novel.assigned).toBe(1);
  });

  it("exceder el presupuesto avisa (over + warning) pero no recorta el total", () => {
    const system = run(
      {
        secondary: {
          acrobatics: { dp: {}, naturalBonus: 3, naturalAbilities: 6 },
        },
      },
      { level: 1, charMods: { agi: 10 } },
    );
    const imp = system.secondaryImprovement;
    expect(imp.physical).toEqual({ assigned: 3, max: 1, over: true });
    expect(imp.abilities).toEqual({ assigned: 6, max: 5, over: true });
    expect(imp.warnings).toEqual([
      "Bonos naturales físicos: 3 asignados de 1.",
      "Habilidades naturales: 6 asignadas de 5.",
    ]);
    // El cubo sigue aplicando todo lo asignado: 10·4 + 60 = 100.
    expect(system.secondary.acrobatics.bonusTotal).toBe(100);
  });

  it("el máximo de Novel viene de novelPerLevel por tramo (categoría Novel real)", () => {
    const freelancer = categorySystemToData(
      freelancerPack.name,
      freelancerPack.system as CategorySystemSource,
    );
    const categories: ResolvedCategory[] = [
      { key: "c1", data: freelancer, levels: 3, cumulativeLevels: 3, changeCost: 0 },
      { key: "c2", data: defaultCategoryData(), levels: 2, cumulativeLevels: 5, changeCost: 60 },
    ];
    const system = run(
      { secondary: { acrobatics: { dp: {}, novelBonus: 4 } } },
      { level: 5, categories },
    );
    expect(system.secondaryImprovement.novel).toEqual({ assigned: 4, max: 15, over: false });
  });

  it("sin niveles de Novel, cualquier bono de Novel asignado excede (0 de máximo)", () => {
    const system = run(
      { secondary: { acrobatics: { dp: {}, novelBonus: 5 } } },
      { level: 12 },
    );
    expect(system.secondaryImprovement.novel).toEqual({ assigned: 5, max: 0, over: true });
    expect(system.secondaryImprovement.warnings).toContain("Bonos de Novel: 5 asignados de 0.");
  });

  it("en modo direct (PNJs) no se calculan presupuestos", () => {
    const system = run({ secondary: { acrobatics: { dp: {} } } }, { mode: "direct" });
    expect(system.secondaryImprovement).toBeUndefined();
  });
});

// --- special-rule entries -------------------------------------------------------

describe("specialRuleFlagValue", () => {
  it("activa sin valor cuenta 1; con valor, el valor; ausente, 0", () => {
    expect(specialRuleFlagValue(undefined)).toBe(0);
    expect(specialRuleFlagValue({ note: "" })).toBe(1);
    expect(specialRuleFlagValue({ value: null, note: "" })).toBe(1);
    expect(specialRuleFlagValue({ value: 3, note: "" })).toBe(3);
    expect(specialRuleFlagValue({ value: 0, note: "" })).toBe(0);
  });
});
