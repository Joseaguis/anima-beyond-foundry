/**
 * Foundry-less Actor/Item stand-ins for the sandbox. They run the REAL data
 * pipeline — the same TypeDataModels and rule elements Foundry uses — by
 * replicating AnimaActor's preparation cycle (see src/documents/actor.ts):
 *
 *   prepareBaseData          -> reset synthetics
 *   prepareEmbeddedDocuments -> prepareSiblingData / prepareActorData hooks,
 *                               then rule elements write into synthetics
 *   prepareDerivedData       -> the system model computes derived stats
 *
 * Updates mutate the plain source, re-run the whole cycle and notify React.
 */
import { CharacterModel, NpcModel } from "../src/actors";
import {
  WeaponModel,
  ArmorModel,
  CategoryModel,
  TraitModel,
  WeaponTableModel,
  CombatStyleModel,
  KiAbilityModel,
  KiTechniqueModel,
  SpellModel,
  MagicPathModel,
  PsychicPowerModel,
  PsychicDisciplineModel,
  MentalPatternModel,
  MonsterAbilityModel,
} from "../src/items";
import { emptySynthetics, rulesFromItem, type AnimaSynthetics } from "../src/rules";
import type { AnimaRuleElement } from "../src/rules";
import type { AnimaItem } from "../src/documents/item";

/* eslint-disable @typescript-eslint/no-explicit-any */

type ModelConstructor = new (source: Record<string, unknown>, options: { parent: unknown }) => any;

const ACTOR_MODELS: Record<string, ModelConstructor> = {
  character: CharacterModel as unknown as ModelConstructor,
  npc: NpcModel as unknown as ModelConstructor,
};

const ITEM_MODELS: Record<string, ModelConstructor> = {
  weapon: WeaponModel,
  armor: ArmorModel,
  category: CategoryModel,
  trait: TraitModel,
  weaponTable: WeaponTableModel,
  combatStyle: CombatStyleModel,
  kiAbility: KiAbilityModel,
  kiTechnique: KiTechniqueModel,
  spell: SpellModel,
  magicPath: MagicPathModel,
  psychicPower: PsychicPowerModel,
  psychicDiscipline: PsychicDisciplineModel,
  mentalPattern: MentalPatternModel,
  monsterAbility: MonsterAbilityModel,
} as unknown as Record<string, ModelConstructor>;

export interface DocumentSource {
  _id?: string;
  name: string;
  type: string;
  img?: string;
  system?: Record<string, unknown>;
}

/**
 * Apply one Foundry-style update path ("system.str.base", "name",
 * "system.customSecondary.-=key") onto a plain object tree.
 */
function applyPathUpdate(root: Record<string, any>, path: string, value: unknown): void {
  const parts = path.split(".");
  let node = root;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (typeof node[part] !== "object" || node[part] === null) node[part] = {};
    node = node[part];
  }
  const last = parts[parts.length - 1];
  if (last.startsWith("-=")) delete node[last.slice(2)];
  else node[last] = value;
}

export class MockItem {
  readonly source: DocumentSource;
  readonly actor: MockActor | null;
  /** Standalone items (no actor) report changes here so the UI re-renders. */
  onChange: (() => void) | null = null;
  system: any;

  constructor(source: DocumentSource, actor: MockActor | null = null) {
    this.source = source;
    this.actor = actor;
    this.rebuild();
  }

  get id(): string {
    return this.source._id ?? "";
  }
  get name(): string {
    return this.source.name;
  }
  get img(): string {
    return this.source.img ?? "";
  }
  get type(): string {
    return this.source.type;
  }

  rebuild(): void {
    const Model = ITEM_MODELS[this.source.type];
    this.system = Model
      ? new Model(this.source.system ?? {}, { parent: this })
      : structuredClone(this.source.system ?? {});
  }

  async update(changes: Record<string, unknown>): Promise<void> {
    for (const [path, value] of Object.entries(changes)) {
      if (path === "name") this.source.name = String(value);
      else if (path === "img") this.source.img = String(value);
      else if (path.startsWith("system.")) {
        applyPathUpdate((this.source.system ??= {}), path.slice("system.".length), value);
      }
    }
    if (this.actor) this.actor.refresh();
    else {
      this.rebuild();
      this.onChange?.();
    }
  }
}

export interface MockActorInit {
  name: string;
  type: "character" | "npc";
  img?: string;
  system?: Record<string, unknown>;
  items?: DocumentSource[];
}

export class MockActor {
  name: string;
  img: string;
  readonly type: "character" | "npc";
  readonly sourceSystem: Record<string, unknown>;
  readonly sourceItems: DocumentSource[];

  system!: any;
  items!: { contents: MockItem[]; get(id: string): MockItem | undefined };
  synthetics!: AnimaSynthetics;
  rules!: AnimaRuleElement[];

  /** Bumped on every re-preparation; snapshot for useSyncExternalStore. */
  version = 0;
  #listeners = new Set<() => void>();

  constructor(init: MockActorInit) {
    this.name = init.name;
    this.img = init.img ?? "icons/svg/mystery-man.svg";
    this.type = init.type;
    this.sourceSystem = structuredClone(init.system ?? {});
    this.sourceItems = structuredClone(init.items ?? []);
    for (const item of this.sourceItems) item._id ??= foundry.utils.randomID();
    this.prepare();
  }

  subscribe = (listener: () => void): (() => void) => {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  };

  getVersion = (): number => this.version;

  #notify(): void {
    this.version++;
    for (const listener of this.#listeners) listener();
  }

  /** Full re-preparation from sources — mirrors AnimaActor.prepareData(). */
  prepare(): void {
    const contents = this.sourceItems.map((source) => new MockItem(source, this));
    this.items = { contents, get: (id) => contents.find((i) => i.id === id) };

    const Model = ACTOR_MODELS[this.type];
    this.system = new Model(this.sourceSystem, { parent: this });

    // prepareBaseData
    this.synthetics = emptySynthetics();
    this.rules = [];
    this.system.prepareBaseData();

    // prepareEmbeddedDocuments: sibling/actor hooks, then rule elements
    const systems = contents
      .map((item) => item.system)
      .filter((system) => typeof system?.prepareActorData === "function");
    for (const system of systems) system.prepareSiblingData();
    for (const system of systems) system.prepareActorData();

    this.rules = contents
      .slice()
      .sort((a, b) => Number(b.type === "category") - Number(a.type === "category"))
      .flatMap((item) => rulesFromItem(item as unknown as AnimaItem))
      .filter((rule) => !rule.ignored)
      .sort((a, b) => a.priority - b.priority);

    const rollOptions = this.getRollOptions();
    for (const rule of this.rules) {
      try {
        rule.beforePrepareData(this.synthetics, rollOptions);
      } catch (error) {
        console.error(`Sandbox | Rule element "${rule.key}" (${rule.label}) failed`, error);
      }
    }

    // prepareDerivedData
    this.system.prepareDerivedData();
  }

  /** Mirrors AnimaActor.getRollOptions(). */
  getRollOptions(): Set<string> {
    const options = new Set<string>();
    options.add(`self:type:${this.type}`);
    const system = this.system as {
      level?: number;
      categoryData?: { labelName?: string };
      resolvedCategories?: { data: { labelName?: string } }[];
    };
    const categoryNames = system.resolvedCategories?.length
      ? system.resolvedCategories.map((c) => c.data.labelName)
      : [system.categoryData?.labelName];
    for (const name of categoryNames) {
      if (name) options.add(`self:category:${name.toLowerCase().replace(/\s+/g, "-")}`);
    }
    if (typeof system.level === "number") options.add(`self:level:${system.level}`);
    return options;
  }

  refresh(): void {
    this.prepare();
    this.#notify();
  }

  async update(changes: Record<string, unknown>): Promise<void> {
    for (const [path, value] of Object.entries(changes)) {
      if (path === "name") this.name = String(value);
      else if (path === "img") this.img = String(value);
      else if (path.startsWith("system.")) {
        applyPathUpdate(this.sourceSystem, path.slice("system.".length), value);
      }
    }
    this.refresh();
  }

  // ------------------------------------------------------------ item CRUD ---

  async createItem(type: string, subtype?: string): Promise<void> {
    const label = game.i18n.localize(`ANIMA.Item${type.charAt(0).toUpperCase()}${type.slice(1)}`);
    const source: DocumentSource = {
      _id: foundry.utils.randomID(),
      name: label && !label.startsWith("ANIMA.") ? label : type,
      type,
    };
    if (subtype) source.system = { subtype };
    this.sourceItems.push(source);
    this.refresh();
  }

  async addItemFromSource(source: DocumentSource | undefined): Promise<void> {
    if (!source) return;
    const copy = structuredClone(source);
    copy._id = foundry.utils.randomID();
    this.sourceItems.push(copy);
    this.refresh();
  }

  async deleteItem(id: string): Promise<void> {
    const index = this.sourceItems.findIndex((item) => item._id === id);
    if (index >= 0) {
      this.sourceItems.splice(index, 1);
      this.refresh();
    }
  }
}
