/**
 * Legacy helper interfaces used by the React sheet layer.
 *
 * Foundry globals (game, CONFIG, Hooks, foundry.*, Actor, Item, ...) come from
 * fvtt-types (see tsconfig "types"). The interfaces below are loose views of
 * Foundry documents consumed by the React components; they will be replaced by
 * properly typed documents when the sheet infrastructure is rewritten.
 */

declare module "*.scss" {
  const content: string;
  export default content;
}

declare module "*.css" {
  const content: string;
  export default content;
}

interface FoundryCompendium {
  collection: string;
  documentName: string;
  metadata: { label: string; name: string; type: string };
  getDocuments(): Promise<FoundryDocument[]>;
}

interface FoundrySheet {
  render(force?: boolean): void;
}

interface FoundryDocument {
  id: string;
  uuid: string;
  name: string;
  img: string;
  type: string;
  system: Record<string, unknown>;
  sheet: FoundrySheet | null;
  update(data: Record<string, unknown>): Promise<void>;
  toObject(source?: boolean): Record<string, unknown>;
}

interface FoundryEmbeddedCollection<T> extends Iterable<T> {
  get(id: string): T | undefined;
  map<U>(fn: (value: T) => U): U[];
  filter(fn: (value: T) => boolean): T[];
  readonly size: number;
}

interface FoundryActor extends FoundryDocument {
  type: string;
  system: Record<string, unknown>;
  items: FoundryEmbeddedCollection<FoundryDocument>;
  createEmbeddedDocuments(
    embeddedName: string,
    data: Record<string, unknown>[]
  ): Promise<FoundryDocument[]>;
  deleteEmbeddedDocuments(
    embeddedName: string,
    ids: string[]
  ): Promise<FoundryDocument[]>;
}
