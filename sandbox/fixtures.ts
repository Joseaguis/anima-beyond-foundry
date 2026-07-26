/**
 * Sample actors for the sandbox. Deliberately partial: everything not listed
 * here is filled in by the schema defaults, exactly like a fresh actor in
 * Foundry. Embedded items are cloned from the real pack sources.
 */
import { cloneSource } from "./packs";
import type { DocumentSource, MockActorInit } from "./mock-documents";

function packItem(uuid: string, overrides: Record<string, unknown> = {}): DocumentSource {
  const source = cloneSource(uuid);
  if (!source) throw new Error(`Sandbox fixture: pack source not found for ${uuid}`);
  source.system = { ...source.system, ...overrides };
  return source as DocumentSource;
}

export function characterFixture(): MockActorInit {
  return {
    name: "Aria Vela",
    type: "character",
    system: {
      race: "human",
      str: { base: 8, bonus: 0 },
      dex: { base: 9, bonus: 0 },
      agi: { base: 9, bonus: 0 },
      con: { base: 8, bonus: 0 },
      int: { base: 6, bonus: 0 },
      pow: { base: 7, bonus: 0 },
      wp: { base: 7, bonus: 0 },
      per: { base: 8, bonus: 0 },
      // One category stage backed by the embedded Guerrero Acróbata item.
      categories: [{ key: "c1", itemId: "haNs83NmaW6QmFmE", levels: 4, changeCost: 0 }],
      combat: {
        attack: { dp: { c1: 60 }, special: 0 },
        dodge: { dp: { c1: 40 }, special: 0 },
        wearArmor: { dp: { c1: 20 }, special: 0 },
      },
      secondary: {
        acrobatics: { dp: { c1: 20 }, naturalBonus: 1, naturalAbilities: 0, novelBonus: 0, special: 0 },
        athletics: { dp: { c1: 10 }, naturalBonus: 0, naturalAbilities: 0, novelBonus: 0, special: 0 },
        jump: { dp: { c1: 10 }, naturalBonus: 0, naturalAbilities: 0, novelBonus: 0, special: 0 },
      },
      lifePoints: { current: 95 },
      details: { sex: "F", age: "23", height: "1,68", region: "Gaïa" },
    },
    items: [
      packItem("sandbox.categories.haNs83NmaW6QmFmE"), // Guerrero Acróbata
      packItem("sandbox.weapons.abfweaponLongSwd", { equipped: true }), // Espada Larga
      packItem("sandbox.traits.abftraitGift0001"), // El Don
    ],
  };
}

export function npcFixture(): MockActorInit {
  return {
    name: "Sicario del Yugo",
    type: "npc",
    system: {
      level: 3,
      str: { base: 10, bonus: 0 },
      dex: { base: 8, bonus: 0 },
      agi: { base: 9, bonus: 0 },
      con: { base: 11, bonus: 0 },
      int: { base: 5, bonus: 0 },
      pow: { base: 8, bonus: 0 },
      wp: { base: 7, bonus: 0 },
      per: { base: 6, bonus: 0 },
      lifePoints: { max: 180, current: 180 },
      fatigue: { max: 8, current: 8 },
      initiative: { base: 70, armorPenalty: 10, weaponBonus: 0 },
      combat: {
        attack: { base: 90, special: 0 },
        parry: { base: 75, special: 5 },
        dodge: { base: 60, special: 0 },
        wearArmor: { base: 30, special: 0 },
      },
    },
    items: [],
  };
}
