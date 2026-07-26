/**
 * Extract the Ki technique creation tables from the reference character sheet.
 *
 * Reads (read-only) the Markdown conversion of `Ficha Anima v8.7.0.xlsx` that
 * lives in the sibling `anime-beyond-fantasy-docs` repo and emits:
 *
 *   - src/domains/ki/technique-tables.generated.ts   the Efecto / Desventaja catalog
 *   - src/packs/_source/kiTechniques/*.json          the book techniques compendium
 *
 * Both outputs are committed, so neither the build nor the tests depend on the
 * external reference folder being present.
 *
 * Column layout of the `Tablas Técnicas` sheet (verified against the formulas in
 * `Creación de Técnicas`, which address these exact ranges):
 *
 *   C:L  rows 10-643   Tabla de opciones de efectos
 *                      C Efecto | D Opción | E Coste 1º | F Coste 2º | G CM |
 *                      H mant | I SMe | J SMa | K Nv | L Referencia
 *   C:T  rows 644+     Compendio de técnicas de los libros
 *                      C Nombre | D Árbol | E Nivel | F CM Base | G CM Reducido |
 *                      H Coste | I Efectos | J Combinable y Desventajas
 *   O:X  rows 9-88     Tabla de efectos y referencias
 *                      O Efecto | P Ref. opciones | Q Tipo | R Clase |
 *                      S Características | T-V Elemento 1-3 | W Todos elementos |
 *                      X Reducción CM Legado
 *   O:Q  rows 165-192  Tabla de desventajas y referencias (O nombre, Q Clase)
 *   O:S  rows 200-301  Tabla de opciones de desventajas
 *                      O Desventaja | P Opción | Q CM | R Nivel | S Referencia
 *
 * Run via `npm run gen:ki-tables`.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const DOCS_ROOT = path.resolve(root, "..", "anime-beyond-fantasy-docs");
const CONVERTED_DIR = path.join(DOCS_ROOT, "graphify-out", "converted");
const OUT_TABLES = path.join(root, "src", "domains", "ki", "technique-tables.generated.ts");
const OUT_PACK = path.join(root, "src", "packs", "_source", "kiTechniques");

const SHEET = "Tablas Técnicas";

// ---------------------------------------------------------------------------
// Markdown table plumbing
// ---------------------------------------------------------------------------

/** A sheet row as a column-letter addressable array (index 0 === column A). */
type Row = string[];

/** `A` -> 0, `Z` -> 25, `AA` -> 26. */
function colIndex(letter: string): number {
  let n = 0;
  for (const ch of letter) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

function cell(row: Row, letter: string): string {
  return row[colIndex(letter)] ?? "";
}

function num(row: Row, letter: string): number | null {
  const raw = cell(row, letter).replace(",", ".");
  if (raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/**
 * Locate the `## Sheet: <name>` section and return its table rows. The
 * converter renders one Markdown row per non-empty spreadsheet row, so row
 * numbers are not preserved — every table below is delimited by its header
 * text instead.
 */
function readSheet(md: string, sheet: string): Row[] {
  const lines = md.split(/\r?\n/);
  const start = lines.findIndex((l) => l.trim() === `## Sheet: ${sheet}`);
  if (start < 0) throw new Error(`sheet "${sheet}" not found in the converted workbook`);

  const rows: Row[] = [];
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("## Sheet:")) break;
    if (!line.startsWith("|")) continue;
    // The `| --- | --- |` separator is Markdown scaffolding, not a sheet row.
    if (/^\|[\s|-]*\|$/.test(line) && line.includes("-")) continue;
    const parts = line.split("|");
    // parts[0] is empty (leading pipe) and parts[last] is the trailing pipe, so
    // column A lands on parts[1].
    rows.push(parts.slice(1, -1).map((c) => c.trim()));
  }
  return rows;
}

// ---------------------------------------------------------------------------
// Normalization
// ---------------------------------------------------------------------------

function slug(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Spanish characteristic abbreviations used by the sheet -> Ki char keys. */
const CHAR_KEYS: Record<string, string> = {
  AGI: "agi",
  CON: "con",
  DES: "dex",
  FUE: "str",
  POD: "pow",
  VOL: "wp",
};

const TIPOS: Record<string, string> = { "Acción": "action", Asalto: "round" };

const CLASES: Record<string, string> = {
  Ataque: "attack",
  Contra: "counter",
  Defensa: "defense",
  Variable: "variable",
};

/**
 * `DES (AGI+2, FUE+2, POD+2, VOL+3)` -> primary characteristic plus the Ki
 * surcharge for shifting part of the cost onto each optional one.
 */
function parseChars(text: string): { primary: string; optional: Record<string, number> } | null {
  const m = text.match(/^([A-Z]{3})\s*(?:\(([^)]*)\))?/);
  if (!m || !CHAR_KEYS[m[1]]) return null;
  const optional: Record<string, number> = {};
  for (const opt of (m[2] ?? "").matchAll(/([A-Z]{3})\s*\+\s*(\d+)/g)) {
    const key = CHAR_KEYS[opt[1]];
    if (key) optional[key] = Number(opt[2]);
  }
  return { primary: CHAR_KEYS[m[1]], optional };
}

// ---------------------------------------------------------------------------
// Catalog types (mirrored by src/domains/ki/technique-data.ts)
// ---------------------------------------------------------------------------

interface EffectOption {
  option: string;
  ki1: number;
  ki2: number;
  cm: number;
  mant: number;
  sMinor: number | null;
  sMajor: number | null;
  level: number;
}

interface EffectDef {
  key: string;
  name: string;
  section: string;
  type: string;
  klass: string;
  primaryChar: string;
  optionalChars: Record<string, number>;
  elements: string[];
  options: EffectOption[];
}

interface DisadvantageOption {
  option: string;
  cm: number;
  level: number;
}

interface DisadvantageDef {
  key: string;
  name: string;
  klass: string;
  options: DisadvantageOption[];
}

interface CompendiumEntry {
  name: string;
  tree: string;
  level: number;
  bookCm: number;
  bookCost: string;
  effectsText: string;
  extrasText: string;
}

// ---------------------------------------------------------------------------
// Parsing the sheet
// ---------------------------------------------------------------------------

/** A `>>SECTION` / `> EFFECT GROUP` marker rather than a data row. */
function isMarker(value: string): boolean {
  return value.startsWith(">");
}

function parseSheet(rows: Row[]) {
  const optionRows: Row[] = [];
  const compendium: CompendiumEntry[] = [];
  const effectDefs: EffectDef[] = [];
  const disadvantageDefs: DisadvantageDef[] = [];
  const disadvantageOptions: DisadvantageOption[][] = [];
  const disadvantageOptionOwner: string[] = [];

  // The left block (C:L) switches from effect options to the book compendium at
  // the `Nombre | Árbol` header; the right block (O:X) walks three tables in
  // order, each introduced by its own title cell.
  let leftMode: "options" | "compendium" = "options";
  let rightMode: "none" | "effects" | "disadvantages" | "disadvantageOptions" = "none";
  let section = "";

  for (const row of rows) {
    const c = cell(row, "C");
    const o = cell(row, "O");

    // ---- left block ----------------------------------------------------
    if (c === "Nombre" && cell(row, "D") === "Árbol") {
      leftMode = "compendium";
      // The right-hand reference tables all sit above the compendium. Below it,
      // column O holds "Elem. Efecto 2" row numbers, which would otherwise be
      // read as disadvantage options.
      rightMode = "none";
    } else if (leftMode === "options") {
      // Column L is the lookup key the sheet builds as `Efecto & Opción`. That
      // identity holds for every real option row and for none of the headers,
      // legends or stray labels.
      const skip =
        !c ||
        isMarker(c) ||
        cell(row, "L") !== c + cell(row, "D") ||
        // The sheet reserves five user-defined Efecto slots with no rules.
        c.startsWith("Efecto Personalizado");
      if (!skip) optionRows.push(row);
    } else if (c && !isMarker(c)) {
      // Book compendium. The "Técnicas Propias" block above it is driven by
      // formulas off the live builder sheet and renders blank here, so require
      // an actual cost string.
      const cost = cell(row, "H");
      const bookCm = num(row, "F");
      if (cost && bookCm) {
        compendium.push({
          name: c,
          tree: cell(row, "D"),
          level: num(row, "E") ?? 1,
          bookCm,
          bookCost: cost,
          effectsText: cell(row, "I"),
          extrasText: cell(row, "J"),
        });
      }
    }

    // ---- right block ---------------------------------------------------
    if (o === "Tabla de efectos y referencias") {
      rightMode = "effects";
      continue;
    }
    if (o === "Tabla de desventajas y referencias") {
      rightMode = "disadvantages";
      continue;
    }
    if (o === "Tabla de Opciones de desventajas") {
      rightMode = "disadvantageOptions";
      continue;
    }
    if (!o || o === "Lista Efectos Técnicas" || o === "Desventaja") continue;

    if (rightMode === "effects") {
      if (o.startsWith(">>")) {
        section = o.replace(/^>+\s*/, "");
        continue;
      }
      const chars = parseChars(cell(row, "S"));
      // Rows without a characteristic are not effects: the element list
      // (O100:O105) and the three "Efecto Personalizado" placeholders.
      if (!chars) continue;
      const elements = ["T", "U", "V"].map((l) => cell(row, l)).filter((e) => e !== "");
      effectDefs.push({
        key: slug(o),
        name: o,
        section,
        type: TIPOS[cell(row, "Q")] ?? "action",
        klass: CLASES[cell(row, "R")] ?? "variable",
        primaryChar: chars.primary,
        optionalChars: chars.optional,
        elements,
        options: [],
      });
    } else if (rightMode === "disadvantages") {
      if (isMarker(o)) continue;
      // The custom-disadvantage placeholders carry no Clase.
      const klass = cell(row, "Q");
      if (!klass) continue;
      disadvantageDefs.push({
        key: slug(o),
        name: o,
        klass: klass === "Cualquiera" ? "any" : (CLASES[klass] ?? "any"),
        options: [],
      });
    } else if (rightMode === "disadvantageOptions") {
      if (isMarker(o)) continue;
      const cm = num(row, "Q");
      if (cm === null || cm === 0) continue;
      disadvantageOptionOwner.push(slug(o));
      disadvantageOptions.push([{ option: cell(row, "P"), cm, level: num(row, "R") ?? 1 }]);
    }
  }

  // Attach option rows to their effect. The options table title-cases the
  // effect name ("Habilidad De Ataque") while the definitions table does not,
  // so both sides are matched on their slug.
  const byKey = new Map(effectDefs.map((e) => [e.key, e]));
  const orphans = new Set<string>();
  for (const row of optionRows) {
    const key = slug(cell(row, "C"));
    const effect = byKey.get(key);
    if (!effect) {
      orphans.add(cell(row, "C"));
      continue;
    }
    effect.options.push({
      option: cell(row, "D"),
      ki1: num(row, "E") ?? 0,
      ki2: num(row, "F") ?? 0,
      cm: num(row, "G") ?? 0,
      mant: num(row, "H") ?? 0,
      sMinor: num(row, "I"),
      sMajor: num(row, "J"),
      // Blank means "no level requirement"; the sheet wraps every lookup of
      // this column in MAX(1, ...).
      level: num(row, "K") ?? 1,
    });
  }

  // Same for disadvantage options.
  const disByKey = new Map(disadvantageDefs.map((d) => [d.key, d]));
  disadvantageOptionOwner.forEach((owner, i) => {
    const target = disByKey.get(owner);
    if (target) target.options.push(...disadvantageOptions[i]);
    else orphans.add(owner);
  });

  return { effectDefs, disadvantageDefs, compendium, orphans };
}

// ---------------------------------------------------------------------------
// Emitting the catalog module
// ---------------------------------------------------------------------------

function emitTables(effects: EffectDef[], disadvantages: DisadvantageDef[]): string {
  const j = (v: unknown) => JSON.stringify(v);

  const effectLines = effects.map((e) => {
    const opts = e.options
      .map(
        (o) =>
          `      { option: ${j(o.option)}, ki1: ${o.ki1}, ki2: ${o.ki2}, cm: ${o.cm}, ` +
          `mant: ${o.mant}, sMinor: ${j(o.sMinor)}, sMajor: ${j(o.sMajor)}, level: ${o.level} },`,
      )
      .join("\n");
    return [
      `  {`,
      `    key: ${j(e.key)},`,
      `    name: ${j(e.name)},`,
      `    section: ${j(e.section)},`,
      `    type: ${j(e.type)},`,
      `    klass: ${j(e.klass)},`,
      `    primaryChar: ${j(e.primaryChar)},`,
      `    optionalChars: ${j(e.optionalChars)},`,
      `    elements: ${j(e.elements)},`,
      `    options: [`,
      opts,
      `    ],`,
      `  },`,
    ].join("\n");
  });

  const disLines = disadvantages.map((d) => {
    const opts = d.options
      .map((o) => `      { option: ${j(o.option)}, cm: ${o.cm}, level: ${o.level} },`)
      .join("\n");
    return [
      `  {`,
      `    key: ${j(d.key)},`,
      `    name: ${j(d.name)},`,
      `    klass: ${j(d.klass)},`,
      `    options: [`,
      opts,
      `    ],`,
      `  },`,
    ].join("\n");
  });

  return `/**
 * Ki technique Efecto and Desventaja catalog, extracted from the
 * \`Tablas Técnicas\` sheet of "Ficha Anima v8.7.0.xlsx".
 *
 * AUTO-GENERATED by scripts/extract-technique-tables.ts — do not edit by hand.
 * Regenerate with \`npm run gen:ki-tables\`.
 */
import type { TechniqueDisadvantageDef, TechniqueEffectDef } from "./technique-data";

/** The six elements a Efecto can be affine to (used by Atadura Elemental). */
export const TECHNIQUE_ELEMENTS = ["Agua", "Aire", "Fuego", "Tierra", "Luz", "Oscuridad"] as const;

export const TECHNIQUE_EFFECTS: readonly TechniqueEffectDef[] = [
${effectLines.join("\n")}
];

export const TECHNIQUE_DISADVANTAGES: readonly TechniqueDisadvantageDef[] = [
${disLines.join("\n")}
];
`;
}

// ---------------------------------------------------------------------------
// Emitting the compendium pack
// ---------------------------------------------------------------------------

/** Split on commas that are not nested inside parentheses. */
function splitTopLevel(text: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let current = "";
  for (const ch of text) {
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      out.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  if (current.trim()) out.push(current.trim());
  return out.filter((s) => s !== "" && s !== "-");
}

const DURATION_MODES: Record<string, string> = {
  mantenido: "maintained",
  "sostenimiento menor": "sustainedMinor",
  "sostenimiento mayor": "sustainedMajor",
};

/** Reduce every word of a slug to its singular form (Spanish -s / -es). */
function singularize(s: string): string {
  return s
    .split("-")
    .map((w) => (w.endsWith("es") ? w.slice(0, -2) : w.endsWith("s") ? w.slice(0, -1) : w))
    .join("-");
}

/**
 * Resolve a name written in book prose against the catalog.
 *
 * The compendium text does not always parenthesise the option
 * ("Sacrificio -50 PV", "Atadura Elemental A Dos Elementos") and drifts between
 * singular and plural ("Acción Adicional" vs "Acciones Adicionales"), so fall
 * back to the longest catalog name that prefixes the text and read the
 * remainder as the option.
 */
function resolveEntry<T extends { key: string; options: readonly { option: string }[] }>(
  name: string,
  catalog: readonly T[],
): { entry: T; option: string } | null {
  const s = slug(name);

  const exact = catalog.find((e) => e.key === s);
  if (exact) return { entry: exact, option: "" };

  // "Acción Adicional" vs "Acciones Adicionales": the books pluralise per word,
  // so compare with every word reduced to its singular.
  const singular = singularize(s);
  const plural = catalog.filter((e) => singularize(e.key) === singular);
  if (plural.length === 1) return { entry: plural[0], option: "" };

  let best: T | null = null;
  for (const e of catalog) {
    if (s.startsWith(`${e.key}-`) && (!best || e.key.length > best.key.length)) best = e;
  }
  if (!best) return null;

  const rest = s.slice(best.key.length).replace(/^-/, "");
  const option = best.options.find((o) => slug(o.option) === rest);
  return { entry: best, option: option ? option.option : rest };
}

/** `VOL 5 (1) POD 1 FUE 3 (1)` -> per-characteristic activation / upkeep Ki. */
function parseCost(text: string): Record<string, { activation: number; upkeep: number }> {
  const out: Record<string, { activation: number; upkeep: number }> = {};
  for (const m of text.matchAll(/([A-Z]{3})\s+(\d+)\s*(?:\((\d+)\))?/g)) {
    const key = CHAR_KEYS[m[1]];
    if (!key) continue;
    out[key] = { activation: Number(m[2]), upkeep: Number(m[3] ?? 0) };
  }
  return out;
}

/**
 * `Aumento de Daño (+25, Mantenido), Ataque Elemental (Fuego)` -> structured
 * effect entries. The first entry is the Primario, the rest Secundarios; the
 * last parenthesised token may be a duration mode instead of an option.
 */
function parseEffects(text: string, effects: readonly EffectDef[]) {
  const parsed: {
    effect: string;
    role: string;
    options: string[];
    duration: string;
    resolved: boolean;
  }[] = [];

  splitTopLevel(text).forEach((chunk, index) => {
    const m = chunk.match(/^([^(]+?)\s*(?:\(([\s\S]*)\))?$/);
    if (!m) return;
    const name = m[1].trim();
    const hit = resolveEntry(name, effects);

    let duration = "none";
    const raw = splitTopLevel(m[2] ?? "").filter((opt) => {
      const mode = DURATION_MODES[opt.toLowerCase()];
      if (mode) {
        duration = mode;
        return false;
      }
      return true;
    });
    // The compendium prose does not follow the tables' capitalisation
    // ("Drenaje de vida" vs "Drenaje de Vida") and sometimes misspells accents
    // ("Ataque contínuo"), so options are matched on their slug and rewritten to
    // the catalog's canonical label.
    const options = raw.map((opt) => {
      const candidates = [opt];
      // The books sometimes repeat the Efecto's name inside the option
      // ("Marca (Marca Mayor)" for the option labelled just "Mayor").
      if (slug(opt).startsWith(`${slug(name)}-`)) {
        candidates.push(opt.slice(name.length).trim());
      }
      for (const candidate of candidates) {
        const canonical = hit?.entry.options.find((o) => slug(o.option) === slug(candidate));
        if (canonical) return canonical.option;
      }
      return opt;
    });
    // An option folded into the name (unparenthesised) comes first.
    if (hit?.option) options.unshift(hit.option);

    parsed.push({
      effect: hit?.entry.key ?? slug(name),
      role: index === 0 ? "primary" : "secondary",
      options,
      duration,
      resolved: Boolean(hit),
    });
  });

  return parsed;
}

/**
 * `Combinable, Atadura Elemental (Oscuridad), Condición (Nocturno)` -> the
 * Combinable flag plus structured disadvantages.
 */
function parseExtras(text: string, disadvantages: readonly DisadvantageDef[]) {
  let combinable = false;
  const list: { disadvantage: string; option: string; resolved: boolean }[] = [];

  for (const chunk of splitTopLevel(text)) {
    const m = chunk.match(/^([^(]+?)\s*(?:\(([\s\S]*)\))?$/);
    if (!m) continue;
    const name = m[1].trim().replace(/\.$/, "");
    if (slug(name) === "combinable") {
      combinable = true;
      continue;
    }
    const hit = resolveEntry(name, disadvantages);
    list.push({
      disadvantage: hit?.entry.key ?? slug(name),
      // A parenthesised option wins over one folded into the name.
      option: (m[2] ?? "").trim() || (hit?.option ?? ""),
      resolved: Boolean(hit),
    });
  }

  return { combinable, disadvantages: list };
}

/**
 * Recover the Mantenido flag the compendium text often omits.
 *
 * The books' `Coste` column marks the per-round upkeep in parentheses
 * (`VOL 5 (1) POD 1 FUE 3 (1)`), and by definition only a Mantenida has one. So
 * when the cost carries an upkeep but no Efecto was written as "Mantenido", the
 * technique is maintained: pick the subset of Efectos whose `mant` values add up
 * to the printed upkeep, preferring all of them, then just the Primario.
 */
function inferMaintained(
  parsed: { effect: string; role: string; options: string[]; duration: string }[],
  bookCost: string,
  effects: readonly EffectDef[],
): void {
  if (parsed.some((e) => e.duration !== "none")) return;

  const upkeep = [...bookCost.matchAll(/\((\d+)\)/g)].reduce((sum, m) => sum + Number(m[1]), 0);
  if (upkeep === 0) return;

  const byKey = new Map(effects.map((e) => [e.key, e]));
  const mantOf = (entry: { effect: string; options: string[] }): number => {
    const def = byKey.get(entry.effect);
    if (!def) return 0;
    const selected = entry.options.length
      ? def.options.filter((o) => entry.options.includes(o.option))
      : def.options.filter((o) => o.option === "");
    return selected.reduce((sum, o) => sum + o.mant, 0);
  };

  const candidates = [parsed, parsed.filter((e) => e.role === "primary")];
  for (const subset of candidates) {
    if (subset.reduce((sum, e) => sum + mantOf(e), 0) === upkeep) {
      for (const entry of subset) entry.duration = "maintained";
      return;
    }
  }
  // No subset reproduces the printed upkeep; mark the Primario so the technique
  // is at least flagged as maintained, and let the CM report show the gap.
  const primary = parsed.find((e) => e.role === "primary");
  if (primary) primary.duration = "maintained";
}

function emitPack(
  entries: CompendiumEntry[],
  effects: EffectDef[],
  disadvantages: DisadvantageDef[],
): { written: number; unresolved: string[] } {
  rmSync(OUT_PACK, { recursive: true, force: true });
  mkdirSync(OUT_PACK, { recursive: true });

  const unresolved: string[] = [];
  const used = new Set<string>();
  let written = 0;

  for (const entry of entries) {
    const parsedEffects = parseEffects(entry.effectsText, effects);
    const extras = parseExtras(entry.extrasText, disadvantages);
    inferMaintained(parsedEffects, entry.bookCost, effects);
    const byKey = new Map(effects.map((e) => [e.key, e]));
    const missing = [
      ...parsedEffects.filter((e) => !e.resolved).map((e) => `efecto:${e.effect}`),
      ...extras.disadvantages.filter((d) => !d.resolved).map((d) => `desventaja:${d.disadvantage}`),
      // Options that survive canonicalisation unmatched: the books reference
      // something the tables do not list.
      ...parsedEffects.flatMap((e) => {
        const def = byKey.get(e.effect);
        if (!def) return [];
        return e.options
          .filter((opt) => !def.options.some((o) => o.option === opt))
          .map((opt) => `opción:${e.effect}/${opt}`);
      }),
    ];
    if (missing.length) unresolved.push(`${entry.name} -> ${missing.join(", ")}`);

    let base = slug(entry.name) || "tecnica";
    let file = base;
    for (let i = 2; used.has(file); i++) file = `${base}-${i}`;
    used.add(file);

    const doc = {
      name: entry.name,
      type: "kiTechnique",
      img: "icons/magic/control/energy-stream-link-white.webp",
      system: {
        description: { value: "", chat: "" },
        source: "Excel: Ficha Anima v8.7.0",
        rules: [],
        tree: entry.tree,
        level: entry.level,
        combinable: extras.combinable,
        effects: parsedEffects.map((e) => ({
          effect: e.effect,
          role: e.role,
          options: e.options,
          duration: e.duration,
          // The books print the technique's total cost, not its per-effect
          // split, so the distribution is left for the owner to fill in.
          distribution: {},
          upkeepDistribution: {},
        })),
        disadvantages: extras.disadvantages.map((d) => ({
          disadvantage: d.disadvantage,
          option: d.option,
        })),
        kiReduction: {},
        kiIncrease: 0,
        freeDistribution: {},
        // Values as printed in the books, kept for reference: the sheet stores
        // them as literals rather than recomputing them, so they can disagree
        // with the builder by a few points.
        bookCm: entry.bookCm,
        bookCost: entry.bookCost,
        bookDistribution: parseCost(entry.bookCost),
      },
    };

    writeFileSync(path.join(OUT_PACK, `${file}.json`), JSON.stringify(doc, null, 2) + "\n", "utf-8");
    written++;
  }

  return { written, unresolved };
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

function findWorkbook(): string {
  if (!existsSync(CONVERTED_DIR)) {
    throw new Error(
      `converted workbook folder not found: ${CONVERTED_DIR}\n` +
        `This generator needs the sibling anime-beyond-fantasy-docs repo checked out.`,
    );
  }
  const candidates = readdirSync(CONVERTED_DIR).filter(
    (f) => f.startsWith("Ficha Anima") && f.endsWith(".md"),
  );
  if (!candidates.length) throw new Error(`no "Ficha Anima*.md" found in ${CONVERTED_DIR}`);
  candidates.sort();
  return path.join(CONVERTED_DIR, candidates[0]);
}

function main(): void {
  const workbook = findWorkbook();
  console.log(`[ki-tables] reading ${path.relative(root, workbook)}`);

  const rows = readSheet(readFileSync(workbook, "utf-8"), SHEET);
  const { effectDefs, disadvantageDefs, compendium, orphans } = parseSheet(rows);

  const optionCount = effectDefs.reduce((sum, e) => sum + e.options.length, 0);
  const disOptionCount = disadvantageDefs.reduce((sum, d) => sum + d.options.length, 0);

  const noOptions = effectDefs.filter((e) => e.options.length === 0).map((e) => e.name);
  if (noOptions.length) {
    console.warn(`[ki-tables] WARNING: ${noOptions.length} efecto(s) with no options:`);
    for (const n of noOptions) console.warn(`  - ${n}`);
  }
  if (orphans.size) {
    console.warn(`[ki-tables] WARNING: ${orphans.size} option group(s) with no definition:`);
    for (const n of orphans) console.warn(`  - ${n}`);
  }

  writeFileSync(OUT_TABLES, emitTables(effectDefs, disadvantageDefs), "utf-8");
  console.log(
    `[ki-tables] ${path.relative(root, OUT_TABLES)}: ` +
      `${effectDefs.length} efectos / ${optionCount} opciones, ` +
      `${disadvantageDefs.length} desventajas / ${disOptionCount} opciones`,
  );

  const { written, unresolved } = emitPack(compendium, effectDefs, disadvantageDefs);
  console.log(`[ki-tables] ${path.relative(root, OUT_PACK)}: ${written} técnicas`);
  if (unresolved.length) {
    console.warn(`[ki-tables] WARNING: ${unresolved.length} técnica(s) with unresolved references:`);
    for (const u of unresolved) console.warn(`  - ${u}`);
  }
}

main();
