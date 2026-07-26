/**
 * In-memory "compendium" for the sandbox, backed by the real pack sources in
 * src/packs/_source. Vite inlines them at build time via import.meta.glob.
 */
import type { CompendiumEntry } from "../src/sheets/ReactSheet";

export interface PackDoc {
  uuid: string;
  packLabel: string;
  source: {
    _id?: string;
    name: string;
    type: string;
    img?: string;
    system?: Record<string, unknown>;
  };
}

const modules = import.meta.glob("../src/packs/_source/**/*.json", { eager: true });

export const PACK_DOCS: PackDoc[] = Object.entries(modules).map(([path, mod]) => {
  const source = ((mod as { default?: unknown }).default ?? mod) as PackDoc["source"];
  const folder = path.split("/").slice(-2, -1)[0] ?? "misc";
  return {
    uuid: `sandbox.${folder}.${source._id ?? path}`,
    packLabel: folder,
    source,
  };
});

export function getCompendiumItems(type: string, subtype?: string): CompendiumEntry[] {
  return PACK_DOCS.filter((doc) => {
    if (doc.source.type !== type) return false;
    if (subtype && (doc.source.system as { subtype?: string })?.subtype !== subtype) return false;
    return true;
  })
    .map((doc) => {
      const sys = doc.source.system as
        | { subtype?: string; parent?: string; branch?: string; mkCost?: number }
        | undefined;
      return {
        uuid: doc.uuid,
        name: doc.source.name,
        img: doc.source.img ?? "",
        pack: doc.packLabel,
        subtype: sys?.subtype,
        parent: sys?.parent,
        branch: sys?.branch,
        mkCost: sys?.mkCost,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function findByUuid(uuid: string): PackDoc | undefined {
  return PACK_DOCS.find((doc) => doc.uuid === uuid);
}

/** Deep-cloned pack source, ready to embed in a mock actor. */
export function cloneSource(uuid: string): PackDoc["source"] | undefined {
  const doc = findByUuid(uuid);
  return doc ? structuredClone(doc.source) : undefined;
}
