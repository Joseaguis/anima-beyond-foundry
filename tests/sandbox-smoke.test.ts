/**
 * Smoke test for the standalone UI sandbox (sandbox/): the Foundry shims must
 * be enough for the real models + rule elements to run the full preparation
 * cycle on the mock documents. Guards the sandbox against rotting when the
 * models grow new Foundry API usage.
 *
 * The shim import must stay first: models read foundry.data.fields on import.
 */
import { describe, expect, it, beforeAll } from "vitest";

describe("sandbox mock pipeline", () => {
  let MockActor: typeof import("../sandbox/mock-documents").MockActor;
  let characterFixture: typeof import("../sandbox/fixtures").characterFixture;
  let npcFixture: typeof import("../sandbox/fixtures").npcFixture;

  // These three imports pull the whole model graph through the transform, which
  // sits right around vitest's 10s default on a cold run.
  beforeAll(async () => {
    await import("../sandbox/foundry-shim");
    ({ MockActor } = await import("../sandbox/mock-documents"));
    ({ characterFixture, npcFixture } = await import("../sandbox/fixtures"));
  }, 60_000);

  it("prepares a character with the real models and embedded items", () => {
    const actor = new MockActor(characterFixture());
    const system = actor.system as Record<string, any>;

    // Level derived from the category progression slots.
    expect(system.level).toBe(4);
    // Category item resolved through prepareActorData -> categoryDataById.
    expect(system.categoryName).toContain("Guerrero Acróbata");
    // Derived pipeline ran: finals exist and are numbers.
    expect(typeof system.combat.attack.final).toBe("number");
    expect(system.lifePoints.max).toBeGreaterThan(0);
    // The equipped long sword was published into the equipment phase.
    expect(system.equipment?.weapons?.[0]?.name).toBe("Espada Larga");
  });

  it("re-prepares on update and applies -= deletion paths", async () => {
    const actor = new MockActor(characterFixture());
    const before = (actor.system as any).str.final;

    await actor.update({ "system.str.base": 12 });
    expect((actor.system as any).str.base).toBe(12);
    expect((actor.system as any).str.final).toBeGreaterThan(before);

    await actor.update({ "system.customSecondary.extra": { name: "Cocina" } });
    expect((actor.sourceSystem as any).customSecondary.extra).toBeDefined();
    await actor.update({ "system.customSecondary.-=extra": null });
    expect((actor.sourceSystem as any).customSecondary.extra).toBeUndefined();
  });

  it("prepares an NPC in direct mode", () => {
    const actor = new MockActor(npcFixture());
    const system = actor.system as Record<string, any>;
    expect(system.combat.attack.final).toBeGreaterThanOrEqual(90);
    expect(system.lifePoints.max).toBe(180);
  });

  it("renders the character, NPC and item windows to HTML", async () => {
    const { renderToString } = await import("react-dom/server");
    const { createElement } = await import("react");
    const { CharacterSheetApp } = await import("../src/components/character/CharacterSheetApp");
    const { NpcSheetApp } = await import("../src/components/npc/NpcSheetApp");
    const { ItemSheetApp } = await import("../src/components/item/ItemSheetApp");

    const buildProps = (actor: InstanceType<typeof MockActor>) => ({
      actor: actor as any,
      system: actor.system,
      items: actor.items.contents.map((i) => ({
        id: i.id,
        name: i.name,
        img: i.img,
        type: i.type,
        system: i.system,
      })),
      isEditable: true,
      onUpdate: async () => {},
      onItemCreate: async () => {},
      onItemEdit: () => {},
      onItemDelete: async () => {},
      getCompendiumItems: async () => [],
      onItemAddFromCompendium: async () => {},
    });

    const character = new MockActor(characterFixture());
    const html = renderToString(createElement(CharacterSheetApp, buildProps(character)));
    expect(html).toContain("Aria Vela");

    const npc = new MockActor(npcFixture());
    expect(renderToString(createElement(NpcSheetApp, buildProps(npc)))).toContain("Sicario");

    const weapon = character.items.contents.find((i) => i.type === "weapon")!;
    const itemHtml = renderToString(
      createElement(ItemSheetApp, {
        item: { id: weapon.id, name: weapon.name, img: weapon.img, type: weapon.type },
        system: weapon.system,
        isEditable: true,
        onUpdate: async () => {},
      }),
    );
    expect(itemHtml).toContain("Espada Larga");
  });

  it("supports item CRUD like the sheet callbacks", async () => {
    const actor = new MockActor(characterFixture());
    const count = actor.items.contents.length;

    await actor.createItem("weapon");
    expect(actor.items.contents.length).toBe(count + 1);

    const created = actor.items.contents[actor.items.contents.length - 1];
    await actor.items.get(created.id)!.update({ "system.damage": 55 });
    expect((actor.items.get(created.id)!.system as any).damage).toBe(55);

    await actor.deleteItem(created.id);
    expect(actor.items.contents.length).toBe(count);
  });
});
