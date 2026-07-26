/**
 * migrateCharacterDp: legacy plain-number dp spends become per-slot records
 * assigned to the "c1" slot, and pre-multiclass characters get their category
 * progression seeded from their level.
 *
 * migrateSecondaryNatural: the legacy manual `natural` field on secondaries
 * (fixed and custom) is dropped; the structured counters replace it.
 */
import { describe, expect, it } from "vitest";
import {
  LEGACY_SLOT_KEY,
  migrateCharacterDp,
  migrateSecondaryNatural,
} from "../src/actors/character/migration";

function legacySource(): Record<string, any> {
  return {
    level: 4,
    combat: {
      attack: { dp: 100, special: 5 },
      parry: { dp: 80, special: 0 },
      dodge: { dp: 0, special: 0 },
      wearArmor: { dp: 30, special: 10 },
    },
    magic: { zeonDp: 60, zeonSpecial: 10, magicProjectionDp: 45 },
    ki: { dp: 20, accumulationDp: 40, special: 3 },
    psychic: { cvDp: 40, projectionDp: 30 },
    secondary: {
      acrobatics: { dp: 30, natural: 5, special: 0 },
      style: { dp: 0, natural: 0, special: 0 },
    },
    customSecondary: {
      tracking: { name: "Rastreo", dp: 20, cost: 2 },
    },
  };
}

describe("migrateCharacterDp", () => {
  it("converts numeric dp spends into per-slot records on c1", () => {
    const source = migrateCharacterDp(legacySource());

    expect(source.combat.attack.dp).toEqual({ [LEGACY_SLOT_KEY]: 100 });
    expect(source.combat.parry.dp).toEqual({ [LEGACY_SLOT_KEY]: 80 });
    expect(source.combat.wearArmor.dp).toEqual({ [LEGACY_SLOT_KEY]: 30 });
    expect(source.magic.zeonDp).toEqual({ [LEGACY_SLOT_KEY]: 60 });
    expect(source.magic.magicProjectionDp).toEqual({ [LEGACY_SLOT_KEY]: 45 });
    // Legacy single-pool Ki moves to the per-characteristic shape under `pow`
    // (attribution is approximate; totals and reserve are unaffected).
    expect(source.ki.pointsDp).toEqual({ pow: { [LEGACY_SLOT_KEY]: 20 } });
    expect(source.ki.accDp).toEqual({ pow: { [LEGACY_SLOT_KEY]: 40 } });
    expect(source.ki.dp).toBeUndefined();
    expect(source.ki.accumulationDp).toBeUndefined();
    expect(source.psychic.cvDp).toEqual({ [LEGACY_SLOT_KEY]: 40 });
    expect(source.psychic.projectionDp).toEqual({ [LEGACY_SLOT_KEY]: 30 });
    expect(source.secondary.acrobatics.dp).toEqual({ [LEGACY_SLOT_KEY]: 30 });
    expect(source.customSecondary.tracking.dp).toEqual({ [LEGACY_SLOT_KEY]: 20 });
  });

  it("converts zero spends into empty records", () => {
    const source = migrateCharacterDp(legacySource());
    expect(source.combat.dodge.dp).toEqual({});
    expect(source.secondary.style.dp).toEqual({});
  });

  it("preserves non-dp fields", () => {
    const source = migrateCharacterDp(legacySource());
    expect(source.combat.attack.special).toBe(5);
    expect(source.magic.zeonSpecial).toBe(10);
    expect(source.ki.special).toBe(3);
  });

  it("seeds the category progression from the character level", () => {
    const source = migrateCharacterDp(legacySource());
    expect(source.categories).toEqual([
      { key: LEGACY_SLOT_KEY, itemId: "", levels: 4, changeCost: 0 },
    ]);
  });

  it("seeds a level-0 character that has spent dp", () => {
    const source = migrateCharacterDp({ ...legacySource(), level: 0 });
    expect(source.categories).toEqual([
      { key: LEGACY_SLOT_KEY, itemId: "", levels: 0, changeCost: 0 },
    ]);
  });

  it("does not seed fresh characters (level 0, nothing spent)", () => {
    const source = migrateCharacterDp({
      level: 0,
      combat: { attack: { dp: 0 }, parry: { dp: 0 }, dodge: { dp: 0 }, wearArmor: { dp: 0 } },
    });
    expect(source.categories).toBeUndefined();
  });

  it("is idempotent on already-migrated sources", () => {
    const once = migrateCharacterDp(legacySource());
    const snapshot = JSON.parse(JSON.stringify(once));
    const twice = migrateCharacterDp(once);
    expect(twice).toEqual(snapshot);
  });

  it("does not seed categories on partial update sources", () => {
    const source = migrateCharacterDp({ level: 5 });
    expect(source.categories).toBeUndefined();
  });

  it("respects an existing category progression", () => {
    const existing = [
      { key: "c1", itemId: "abc", levels: 5, changeCost: 0 },
      { key: "x7", itemId: "def", levels: 3, changeCost: 20 },
    ];
    const source = migrateCharacterDp({ ...legacySource(), categories: existing });
    expect(source.categories).toBe(existing);
  });
});

describe("migrateSecondaryNatural", () => {
  it("drops the legacy natural field from fixed and custom secondaries", () => {
    const source = migrateSecondaryNatural({
      secondary: {
        acrobatics: { dp: { c1: 30 }, natural: 70, special: 0 },
        style: { dp: {}, natural: 0, special: 0 },
      },
      customSecondary: {
        piloting: { name: "Pilotar", dp: { c1: 20 }, natural: 75, special: 0 },
      },
    });

    expect(source.secondary.acrobatics).toEqual({ dp: { c1: 30 }, special: 0 });
    expect(source.secondary.style).toEqual({ dp: {}, special: 0 });
    expect(source.customSecondary.piloting).toEqual({
      name: "Pilotar",
      dp: { c1: 20 },
      special: 0,
    });
  });

  it("keeps the structured counters untouched", () => {
    const source = migrateSecondaryNatural({
      secondary: {
        acrobatics: { dp: {}, natural: 70, naturalBonus: 2, naturalAbilities: 5, novelBonus: 1, special: 0 },
      },
    });
    expect(source.secondary.acrobatics).toEqual({
      dp: {},
      naturalBonus: 2,
      naturalAbilities: 5,
      novelBonus: 1,
      special: 0,
    });
  });

  it("is idempotent and tolerates partial sources", () => {
    expect(migrateSecondaryNatural({})).toEqual({});
    expect(migrateSecondaryNatural({ secondary: null })).toEqual({ secondary: null });

    const once = migrateSecondaryNatural({
      secondary: { acrobatics: { dp: {}, natural: 5, special: 0 } },
    });
    const snapshot = JSON.parse(JSON.stringify(once));
    expect(migrateSecondaryNatural(once)).toEqual(snapshot);
  });
});
