import type React from "react";
import { ReactApplicationMixin } from "./react/mixin";
import type { AnimaItemView, CompendiumEntry, ItemOps } from "./react/types";
import type { AnimaActor } from "../documents/actor";

// Re-exports kept for the React components' existing import paths.
export type { CompendiumEntry, ItemOps } from "./react/types";
export type { AnimaItemView as AnimaItem } from "./react/types";

export interface ReactSheetProps extends ItemOps {
  actor: FoundryActor;
  system: Record<string, any>;
  items: AnimaItemView[];
  isEditable: boolean;
  onUpdate: (path: string, value: unknown) => Promise<void>;
}

const { ActorSheetV2 } = foundry.applications.sheets;

/**
 * Base class for actor sheets: ApplicationV2 + React (no Handlebars). Tab
 * state lives inside the React tree, which survives Foundry re-renders
 * because the mount element and React root persist across them.
 */
export abstract class ReactSheet extends ReactApplicationMixin<
  ReactSheetProps,
  typeof ActorSheetV2
>(ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["animabfv2", "sheet", "actor"],
    position: { width: 720, height: 760 },
    window: { resizable: true },
  };

  get animaActor(): AnimaActor {
    return (this as unknown as { actor: AnimaActor }).actor;
  }

  protected override _prepareReactProps(): ReactSheetProps {
    const actor = this.animaActor;
    return {
      actor: actor as unknown as FoundryActor,
      system: actor.system as Record<string, any>,
      items: this.#buildItems(),
      isEditable: (this as unknown as { isEditable: boolean }).isEditable,
      onUpdate: (path, value) => actor.update({ [path]: value }).then(() => undefined),
      ...this.#buildItemOps(),
    };
  }

  #buildItems(): AnimaItemView[] {
    return this.animaActor.items.contents.map((i) => ({
      id: i.id ?? "",
      name: i.name,
      img: i.img ?? "",
      type: i.type,
      system: i.system as Record<string, any>,
    }));
  }

  #buildItemOps(): ItemOps {
    const actor = this.animaActor;
    return {
      onItemCreate: async (type, subtype) => {
        const label = game.i18n.localize(
          `ANIMA.Item${type.charAt(0).toUpperCase()}${type.slice(1)}`,
        );
        const data: { name: string; type: string; system?: object } = {
          name: label && !label.startsWith("ANIMA.") ? label : type,
          type,
        };
        if (subtype) data.system = { subtype };
        await actor.createEmbeddedDocuments("Item", [data as never]);
      },
      onItemEdit: (id) => {
        actor.items.get(id)?.sheet?.render(true);
      },
      onItemUpdate: async (id, updates) => {
        await actor.items.get(id)?.update(updates as never);
      },
      onItemDelete: async (id) => {
        await actor.deleteEmbeddedDocuments("Item", [id]);
      },
      getCompendiumItems: async (type, subtype) => {
        const out: CompendiumEntry[] = [];
        for (const pack of game.packs) {
          if (pack.documentName !== "Item") continue;
          let docs: { type: string; system: unknown; uuid: string; name: string; img: string | null }[];
          try {
            docs = (await pack.getDocuments()) as typeof docs;
          } catch {
            continue;
          }
          for (const doc of docs) {
            if (doc.type !== type) continue;
            const sys = doc.system as { subtype?: string; parent?: string; branch?: string; mkCost?: number };
            if (subtype && sys?.subtype !== subtype) continue;
            out.push({
              uuid: doc.uuid,
              name: doc.name,
              img: doc.img ?? "",
              pack: pack.metadata?.label ?? pack.collection,
              subtype: sys?.subtype,
              parent: sys?.parent,
              branch: sys?.branch,
              mkCost: sys?.mkCost,
            });
          }
        }
        out.sort((a, b) => a.name.localeCompare(b.name));
        return out;
      },
      onItemAddFromCompendium: async (uuid) => {
        const doc = await fromUuid(uuid);
        if (doc) {
          const source = (doc as unknown as { toObject(): Record<string, unknown> }).toObject();
          await actor.createEmbeddedDocuments("Item", [
            source as never,
          ]);
        }
      },
    };
  }
}
