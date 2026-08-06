/**
 * Minimal browser shims for the Foundry globals the system's models and
 * components touch, so they can run standalone in the sandbox (`npm run
 * sandbox`). This file must be the FIRST import of sandbox/main.tsx: the
 * models destructure `foundry.data.fields` at module-evaluation time.
 *
 * Coverage is deliberately small — just what src/ actually uses:
 *   foundry.data.fields.{Schema,Number,String,Boolean,Object,Array,TypedObject,HTML}Field
 *   foundry.abstract.TypeDataModel   (schema initials + source merge, parent)
 *   foundry.utils.randomID
 *   game.i18n.localize / format      (backed by src/lang/es.json)
 *   Roll (NdX±K) + toMessage         (feeds the sandbox chat toasts)
 *   ui.notifications
 */
import es from "../src/lang/es.json";

/* eslint-disable @typescript-eslint/no-explicit-any */

// ---------------------------------------------------------------- fields ---

type FieldOptions = Record<string, any>;

function clone<T>(value: T): T {
  return value === undefined ? value : structuredClone(value);
}

class DataField {
  options: FieldOptions;

  constructor(options: FieldOptions = {}) {
    this.options = options;
  }

  /** Default for this field when the source has no value. */
  getInitial(): unknown {
    const { initial } = this.options;
    return typeof initial === "function" ? initial() : clone(initial);
  }

  /** Turn a raw source value into instance data (deep-cloned, defaulted). */
  initialize(value: unknown): unknown {
    return value === undefined ? this.getInitial() : clone(value);
  }
}

class NumberField extends DataField {
  override getInitial(): unknown {
    return super.getInitial() ?? (this.options.nullable ? null : 0);
  }
}

class StringField extends DataField {
  override getInitial(): unknown {
    return super.getInitial() ?? (this.options.nullable ? null : "");
  }
}

class HTMLField extends StringField {}

class BooleanField extends DataField {
  override getInitial(): unknown {
    return super.getInitial() ?? false;
  }
}

class ObjectField extends DataField {
  override getInitial(): unknown {
    return super.getInitial() ?? {};
  }
}

class ArrayField extends DataField {
  element: DataField;

  constructor(element: DataField, options: FieldOptions = {}) {
    super(options);
    this.element = element;
  }

  override getInitial(): unknown {
    return super.getInitial() ?? [];
  }

  override initialize(value: unknown): unknown {
    if (!Array.isArray(value)) return this.getInitial();
    return value.map((v) => this.element.initialize(v));
  }
}

class SchemaField extends DataField {
  fields: Record<string, DataField>;

  constructor(fields: Record<string, DataField>, options: FieldOptions = {}) {
    super(options);
    this.fields = fields;
  }

  override initialize(value: unknown): unknown {
    const source = (value ?? {}) as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const [key, field] of Object.entries(this.fields)) {
      out[key] = field.initialize(source[key]);
    }
    return out;
  }

  override getInitial(): unknown {
    return this.initialize({});
  }
}

class TypedObjectField extends DataField {
  element: DataField;

  constructor(element: DataField, options: FieldOptions = {}) {
    super(options);
    this.element = element;
  }

  override getInitial(): unknown {
    return super.getInitial() ?? {};
  }

  override initialize(value: unknown): unknown {
    if (typeof value !== "object" || value === null) return this.getInitial();
    const out: Record<string, unknown> = {};
    for (const [key, v] of Object.entries(value)) out[key] = this.element.initialize(v);
    return out;
  }
}

// -------------------------------------------------------- TypeDataModel ---

class TypeDataModel {
  parent: unknown;

  constructor(source: Record<string, unknown> = {}, options: { parent?: unknown } = {}) {
    this.parent = options.parent ?? null;
    const ctor = this.constructor as typeof TypeDataModel & {
      defineSchema(): Record<string, DataField>;
      migrateData(source: Record<string, unknown>): Record<string, unknown>;
    };
    const migrated = ctor.migrateData(clone(source) ?? {});
    for (const [key, field] of Object.entries(ctor.defineSchema())) {
      (this as Record<string, unknown>)[key] = field.initialize(migrated[key]);
    }
  }

  static defineSchema(): Record<string, DataField> {
    return {};
  }

  static migrateData(source: Record<string, unknown>): Record<string, unknown> {
    return source;
  }

  prepareBaseData(): void {}
  prepareDerivedData(): void {}
}

// ------------------------------------------------------------------ i18n ---

function resolvePath(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>(
    (node, part) =>
      typeof node === "object" && node !== null
        ? (node as Record<string, unknown>)[part]
        : undefined,
    obj,
  );
}

function localize(key: string): string {
  const value = resolvePath(es, key);
  return typeof value === "string" ? value : key;
}

function format(key: string, data: Record<string, unknown> = {}): string {
  return localize(key).replace(/\{(\w+)\}/g, (match, name) =>
    name in data ? String(data[name]) : match,
  );
}

// ------------------------------------------------------------- chat/toasts ---

export interface SandboxMessage {
  id: number;
  kind: "roll" | "info" | "warn" | "error";
  title: string;
  body: string;
  /** Rendered instead of `body` when set — used to preview real chat cards. */
  html?: string;
}

type ChatListener = (messages: SandboxMessage[]) => void;

let nextMessageId = 1;
let messages: SandboxMessage[] = [];
const chatListeners = new Set<ChatListener>();

export const sandboxChat = {
  push(kind: SandboxMessage["kind"], title: string, body: string, html?: string): void {
    const message = { id: nextMessageId++, kind, title, body, html };
    messages = [...messages, message];
    for (const listener of chatListeners) listener(messages);
    // Toast-style expiry: keep the log short-lived. Cards get longer, since
    // they carry a breakdown worth reading.
    setTimeout(
      () => {
        messages = messages.filter((m) => m.id !== message.id);
        for (const listener of chatListeners) listener(messages);
      },
      html ? 20000 : 6000,
    );
  },
  subscribe(listener: ChatListener): () => void {
    chatListeners.add(listener);
    return () => chatListeners.delete(listener);
  },
  get(): SandboxMessage[] {
    return messages;
  },
};

// ------------------------------------------------------------------ Roll ---

class Roll {
  formula: string;
  total = 0;

  constructor(formula: string) {
    this.formula = String(formula);
  }

  async evaluate(): Promise<this> {
    // Supports the arithmetic subset the sheets use: "NdX + K - M".
    let total = 0;
    const terms = this.formula.replace(/\s+/g, "").match(/[+-]?[^+-]+/g) ?? [];
    for (const term of terms) {
      const sign = term.startsWith("-") ? -1 : 1;
      const body = term.replace(/^[+-]/, "");
      const dice = body.match(/^(\d*)d(\d+)$/i);
      if (dice) {
        const count = Number(dice[1] || 1);
        const faces = Number(dice[2]);
        for (let i = 0; i < count; i++) total += sign * (Math.floor(Math.random() * faces) + 1);
      } else {
        total += sign * (Number(body) || 0);
      }
    }
    this.total = total;
    return this;
  }

  async toMessage(options: { speaker?: { alias?: string }; flavor?: string } = {}): Promise<void> {
    sandboxChat.push(
      "roll",
      options.speaker?.alias ?? "Tirada",
      `${options.flavor ?? this.formula}: ${this.total}`,
    );
  }
}

// ----------------------------------------------------------------- utils ---

const ID_CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function randomID(length = 16): string {
  let id = "";
  for (let i = 0; i < length; i++) id += ID_CHARS[Math.floor(Math.random() * ID_CHARS.length)];
  return id;
}

// -------------------------------------------------------------- install ---

const g = globalThis as Record<string, any>;

g.foundry = {
  data: {
    fields: {
      DataField,
      SchemaField,
      NumberField,
      StringField,
      HTMLField,
      BooleanField,
      ObjectField,
      ArrayField,
      TypedObjectField,
    },
  },
  abstract: { TypeDataModel },
  utils: { randomID },
};

g.game = { i18n: { localize, format } };

g.Roll = Roll;

g.ui = {
  notifications: {
    info: (m: string) => sandboxChat.push("info", "Info", m),
    warn: (m: string) => sandboxChat.push("warn", "Aviso", m),
    error: (m: string) => sandboxChat.push("error", "Error", m),
  },
};
