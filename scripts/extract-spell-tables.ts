/**
 * Extracts the spell catalog from the converted "Ficha Anima" workbook into the
 * `spells` and `magicPaths` compendium sources.
 *
 * Source: sheet `Tablas Magia` (640 spells) plus the `Tabla_VíasOpuestas` block
 * on the `Tablas` sheet, which is the only place the complete opposed-path map
 * exists — Core p. 118 only gives two examples.
 *
 * Column layout of `Tablas Magia`:
 *   B  key ("Luz2")            D  Conjuro      E  Vía        F  Nivel
 *   G  Diario                  H  Tipo         I  Acción
 *   J-M Int. R. base/int/av/arc               N-Q Zeón       R-U Mant.
 *   V-Y per-grade effect text  Z  Efecto       AA Vía cerrada
 * Section rows carry `> LUZ`, `> LIBRE ACCESO 1-10`… in column D.
 *
 * Run via `npm run gen:spell-tables`.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { guessAttackType, parseItemNumbers } from "./lib/parse-effect-numbers";

const root = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const DOCS_ROOT = path.resolve(root, "..", "anime-beyond-fantasy-docs");
const CONVERTED_DIR = path.join(DOCS_ROOT, "graphify-out", "converted");
const OUT_SPELLS = path.join(root, "src", "packs", "_source", "spells");
const OUT_PATHS = path.join(root, "src", "packs", "_source", "magicPaths");
const OUT_FREE_ACCESS = path.join(root, "src", "domains", "magic", "free-access.generated.ts");

const SHEET = "Tablas Magia";
const SOURCE = "Excel: Ficha Anima v8.7.0";
const SPELL_IMG = "icons/magic/symbols/runes-star-blue.webp";
const PATH_IMG = "icons/magic/symbols/circled-gem-pink.webp";

// ---------------------------------------------------------------------------
// Markdown table plumbing (same shape as scripts/extract-technique-tables.ts)
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

function num(row: Row, letter: string): number {
  const raw = cell(row, letter).replace(/\./g, "").replace(",", ".");
  if (raw === "") return 0;
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

function readSheet(md: string, sheet: string): Row[] {
  const lines = md.split(/\r?\n/);
  const start = lines.findIndex((l) => l.trim() === `## Sheet: ${sheet}`);
  if (start < 0) throw new Error(`sheet "${sheet}" not found in the converted workbook`);

  const rows: Row[] = [];
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("## Sheet:")) break;
    if (!line.startsWith("|")) continue;
    if (/^\|[\s|-]*\|$/.test(line) && line.includes("-")) continue;
    const parts = line.split("|");
    rows.push(parts.slice(1, -1).map((c) => c.trim()));
  }
  return rows;
}

function slug(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ---------------------------------------------------------------------------
// Column normalization
// ---------------------------------------------------------------------------

/**
 * The `Tipo` column is hand-typed and inconsistent: accents come and go
 * (`Anímico`/`Animico`/`Animíco`), it abbreviates (`Efec. Defen.`, `Efcto`) and
 * it mixes several types in one cell (`Efecto, Anímico`). Canonicalise on the
 * first recognised token; unknown values are reported, never thrown.
 */
const SPELL_TYPES: Record<string, string> = {
  efecto: "effect",
  efcto: "effect",
  efec: "effect",
  animico: "spiritual",
  anim: "spiritual",
  automatico: "automatic",
  auto: "automatic",
  ataque: "attack",
  ataq: "attack",
  defensa: "defense",
  defen: "defense",
  deteccion: "detection",
  det: "detection",
  variab: "effect",
};

function parseSpellType(raw: string): { type: string | null; token: string } {
  // Split on the separators the sheet actually uses and strip the trailing dot
  // of the abbreviations, then take the first token we recognise.
  const tokens = slug(raw)
    .split("-")
    .filter((t) => t !== "");
  for (const token of tokens) {
    const hit = SPELL_TYPES[token];
    if (hit) return { type: hit, token };
  }
  return { type: null, token: raw };
}

/** `Activa` / `Pasiva`; one row is blank and defaults to active. */
function parseActionType(raw: string): string {
  return slug(raw) === "pasiva" ? "passive" : "active";
}

/**
 * Maintenance: the four `Mant.` cells hold either a number or the literal "No".
 * No numbers at all -> not maintainable. Otherwise the `Diario` column decides
 * whether the upkeep is paid per day or per round (Core p. 120).
 */
function parseMaintenance(row: Row, daily: string): { type: string; costs: number[] } {
  const costs = ["R", "S", "T", "U"].map((c) => num(row, c));
  const maintainable = costs.some((c) => c > 0);
  if (!maintainable) return { type: "none", costs };
  const isDaily = ["si", "s"].includes(slug(daily));
  return { type: isDaily ? "daily" : "sustained", costs };
}

// ---------------------------------------------------------------------------
// Magic paths (Excel Tabla_VíasOpuestas, sheet `Tablas`)
// ---------------------------------------------------------------------------

interface PathDef {
  name: string;
  pathType: string;
  opposed: string;
}

/**
 * The opposed-path table lives on the `Tablas` sheet as a `Vía | Tipo | Vías
 * opuestas | …` block. It is the authoritative map: `docs/reglas/magia.md` only
 * had Luz/Oscuridad and Creación/Destrucción confirmed.
 */
function readPathTable(md: string): PathDef[] {
  const rows = readSheet(md, "Tablas");
  const header = rows.findIndex(
    (r) => r.some((c) => c === "Vías opuestas") && r.some((c) => c === "Tipo"),
  );
  if (header < 0) throw new Error(`"Vías opuestas" table not found on the "Tablas" sheet`);

  const nameCol = rows[header].findIndex((c) => c === "Tipo") - 1;
  const typeCol = nameCol + 1;
  const opposedCol = nameCol + 2;

  const defs: PathDef[] = [];
  for (let i = header + 1; i < rows.length; i++) {
    const name = (rows[i][nameCol] ?? "").trim();
    const type = (rows[i][typeCol] ?? "").trim();
    // The block ends at the first row without a Mayor/Menor classification.
    if (!name || !["Mayor", "Menor"].includes(type)) break;
    defs.push({
      name,
      pathType: type === "Mayor" ? "major" : "minor",
      opposed: (rows[i][opposedCol] ?? "").trim(),
    });
  }
  return defs;
}

/**
 * The label spells of the general Libre Acceso pool carry in their `Vía` column.
 * It is *not* a path: it is the catalog you pick from to fill a path's free
 * slots, so no `magicPath` item is emitted for it.
 */
export const FREE_ACCESS_LABEL = "Libre acceso";

/**
 * Every path a spell can belong to. The 11 real paths come from the opposed
 * table; the 14 sub-paths only appear as `Vía` values on the spells, so they
 * are collected from there, marked `subPath` and carry no opposition.
 */
function emitPaths(defs: PathDef[], viasSeen: Set<string>): number {
  mkdirSync(OUT_PATHS, { recursive: true });
  // Only the `path` docs are generated. Hand-written metamagia docs live in the
  // same pack (`precise-casting.json`) and must survive a regeneration.
  for (const file of readdirSync(OUT_PATHS).filter((f) => f.endsWith(".json"))) {
    const full = path.join(OUT_PATHS, file);
    const doc = JSON.parse(readFileSync(full, "utf-8"));
    if (doc?.system?.subtype === "metamagic") continue;
    rmSync(full);
  }

  const byName = new Map(defs.map((d) => [slug(d.name), d]));
  const used = new Set<string>();
  let written = 0;

  for (const via of [...viasSeen].sort()) {
    // Libre Acceso is a pool, not a path — it gets no item.
    if (via === FREE_ACCESS_LABEL) continue;
    const def = byName.get(slug(via));
    // Only the 11 entries of the opposed table are real paths; the rest
    // (Caos, Guerra, Muerte…) are sub-paths that attach to one.
    const isMain = Boolean(def);
    const doc = {
      name: via,
      type: "magicPath",
      img: PATH_IMG,
      system: {
        description: { value: "", chat: "" },
        source: SOURCE,
        rules: [],
        subtype: isMain ? "path" : "subPath",
        element: isMain ? via : "",
        pathType: def?.pathType ?? "",
        opposedPath: def?.opposed ?? "",
        // Set on the character sheet: which path's free slots this sub-path fills.
        parentPathId: "",
        mkCost: 0,
        level: 1,
        effect: "",
      },
    };

    let file = slug(via) || "via";
    for (let i = 2; used.has(file); i++) file = `${slug(via)}-${i}`;
    used.add(file);
    writeFileSync(path.join(OUT_PATHS, `${file}.json`), JSON.stringify(doc, null, 2) + "\n", "utf-8");
    written++;
  }
  return written;
}

// ---------------------------------------------------------------------------
// Spells
// ---------------------------------------------------------------------------

const GRADE_KEYS = ["base", "intermediate", "advanced", "arcane"] as const;
const INT_COLS = ["J", "K", "L", "M"] as const;
const ZEON_COLS = ["N", "O", "P", "Q"] as const;
const EFFECT_COLS = ["V", "W", "X", "Y"] as const;

/**
 * The handful of spells whose figures no amount of reading the prose can
 * recover, keyed by spell name.
 *
 * `damage`/`shieldPoints` take one entry per grade. `attackType` overrides the
 * keyword guess. Everything here is a deliberate editorial decision, so each
 * one carries the reason: an empty list means "the book really gives no
 * number", which is different from "the parser missed it".
 */
const MANUAL_OVERRIDES: Record<
  string,
  { damage?: number[]; shieldPoints?: number[]; attackType?: string; reason: string }
> = {
  // Damage scales off the caster's own Strength bonus, so there is no fixed
  // figure to record: "Daño igual al doble del bono de la Fuerza".
  "Golpe de aire": { reason: "daño derivado de la FUE del lanzador" },
  // Grapple spells: they use the Presa rules, not damage.
  "Lazos de luz": { reason: "usa las reglas de Presa, no causa daño" },
  "Lazos oscuros": { reason: "usa las reglas de Presa, no causa daño" },
  // Typed `attack` in the Excel but it is pure protection.
  "Protección contra el vacío": { reason: "es protección, mal clasificada como ataque" },
  // These two do have damage in their grades; what they lack is a declared TA.
  // The sound wave "destroza cualquier cosa sólida" without naming a type, and
  // the void spell only says it causes an automatic critical on top.
  "Mezzo forte": { reason: "sin TA declarada para la onda sonora" },
  Implosión: { reason: "sin TA declarada; además provoca un crítico automático" },
  // Only ever damages supernatural shields, never a creature.
  "Onda vacua": { attackType: "ene", reason: "sólo daña escudos sobrenaturales" },
  // The caster picks the attack type each time it is cast.
  "Ataque fantasmal": { reason: "el lanzador elige la tipología de ataque" },
  // Both spheres are steered by Magic Projection and attack the Energy TA; the
  // prose says "TA de ENE", which the keyword table reads, but they are listed
  // here so the pair stays explicit.
  "Esfera buscadora": { attackType: "ene", reason: "ataca en TA de ENE" },
  "Esfera oscura": { attackType: "ene", reason: "ataca en TA de ENE" },
  // Defence spells whose grades gate *what* they stop (an RM/RP threshold or a
  // number of dodges), not how much punishment they soak up. They are not a
  // pool of points and must not be given one.
  "Movimiento defensivo": { reason: "sustituye la esquiva, no es un pool de puntos" },
  "Barrera de almas": { reason: "detiene efectos por RM/RP, no tiene aguante" },
  "Escudo espectral": { reason: "detiene efectos por Resistencia, no tiene aguante" },
  // Su mecánica entera es la barrera de daño, no un aguante: "no sufre
  // perjuicio alguno si detiene ataques con un daño base igual o inferior"
  // (40 / 90 / 120 / 160 por grado). La barrera se rellena en la ficha.
  "Burbuja protectora": { reason: "sólo tiene barrera de daño, sin puntos de aguante" },
};

function emitSpells(rows: Row[]): {
  written: number;
  vias: Set<string>;
  levelsByVia: Map<string, Set<number>>;
  unknownTypes: Map<string, number>;
  gaps: { noDamage: string[]; noShield: string[]; noType: string[] };
} {
  rmSync(OUT_SPELLS, { recursive: true, force: true });
  mkdirSync(OUT_SPELLS, { recursive: true });

  const used = new Set<string>();
  const vias = new Set<string>();
  const levelsByVia = new Map<string, Set<number>>();
  const unknownTypes = new Map<string, number>();
  // Spells the parser could not fill and MANUAL_OVERRIDES does not excuse. An
  // empty report is the point: it means the next Excel revision did not quietly
  // introduce a spell whose numbers nobody noticed were missing.
  const gaps = { noDamage: [] as string[], noShield: [] as string[], noType: [] as string[] };
  let written = 0;

  for (const row of rows) {
    const name = cell(row, "D");
    // Section headers (`> LUZ`), the sheet's header row, and its column-number
    // legend row (`| 1 | 2 | 3 | …`), which otherwise parses as a valid spell.
    if (!name || name.startsWith(">") || name === "Conjuro" || /^\d+$/.test(name)) continue;
    const via = cell(row, "E");
    const level = num(row, "F");
    if (!via || !level) continue;
    vias.add(via);
    (levelsByVia.get(via) ?? levelsByVia.set(via, new Set()).get(via)!).add(level);

    const { type, token } = parseSpellType(cell(row, "H"));
    if (!type) unknownTypes.set(token, (unknownTypes.get(token) ?? 0) + 1);
    const maintenance = parseMaintenance(row, cell(row, "G"));
    const description = cell(row, "Z");

    // The sheet has no damage or resistance columns: both live inside the
    // per-grade effect prose, and for a few spells only in the description
    // ("cada espina tiene daño base 60" + grades listing 2/4/6/8 spines).
    // The description is only trusted for attack and defence spells, where a
    // bare figure can only mean that spell's own damage or pool.
    const effectTexts = EFFECT_COLS.map((col) => cell(row, col));
    const override = MANUAL_OVERRIDES[name];
    const numbers = parseItemNumbers(description, effectTexts, {
      useDescription: type === "attack" || type === "defense",
    });

    const grades: Record<string, unknown> = {};
    GRADE_KEYS.forEach((key, i) => {
      grades[key] = {
        zeonCost: num(row, ZEON_COLS[i]),
        intRequired: num(row, INT_COLS[i]),
        maintenanceCost: maintenance.costs[i],
        effect: effectTexts[i],
        damage: override?.damage?.[i] ?? numbers[i].damage,
        shieldPoints: override?.shieldPoints?.[i] ?? numbers[i].shieldPoints,
        // Authored by hand on the item sheet, never guessed — see
        // scripts/lib/parse-effect-numbers.
        damageBarrier: 0,
      };
    });

    if (!override) {
      const anyDamage = GRADE_KEYS.some((_, i) => numbers[i].damage > 0);
      const anyShield = GRADE_KEYS.some((_, i) => numbers[i].shieldPoints > 0);
      if (type === "attack" && !anyDamage) gaps.noDamage.push(name);
      if (type === "defense" && !anyShield) gaps.noShield.push(name);
      if (type === "attack" && !guessAttackType(description, ...effectTexts)) gaps.noType.push(name);
    }

    const doc = {
      name,
      type: "spell",
      img: SPELL_IMG,
      system: {
        description: { value: description ? `<p>${description}</p>` : "", chat: "" },
        source: SOURCE,
        rules: [],
        spellLevel: level,
        actionType: parseActionType(cell(row, "I")),
        maintenanceType: maintenance.type,
        magicPath: via,
        // Read from the same prose as the figures above; "" when nothing in the
        // text gives it away, which is the signal for MANUAL_OVERRIDES.
        damageType:
          type === "attack"
            ? (override?.attackType ?? guessAttackType(description, ...effectTexts))
            : "",
        // No source in the sheet: authored per spell on the item sheet.
        atPiercing: 0,
        resistanceType: "none",
        spellType: type ?? "effect",
        effect: description,
        closedPaths: cell(row, "AA"),
        grades,
      },
    };

    // Names repeat between Libre Acceso and the paths, so the path prefixes the
    // file. build-packs.ts derives the _id from the filename, so it stays stable.
    const base = `${slug(via)}-${slug(name)}` || "conjuro";
    let file = base;
    for (let i = 2; used.has(file); i++) file = `${base}-${i}`;
    used.add(file);

    writeFileSync(path.join(OUT_SPELLS, `${file}.json`), JSON.stringify(doc, null, 2) + "\n", "utf-8");
    written++;
  }

  return { written, vias, levelsByVia, unknownTypes, gaps };
}

// ---------------------------------------------------------------------------
// Free-access slots
// ---------------------------------------------------------------------------

/**
 * A path's free-access slots are the levels its own spell list leaves empty
 * (Core p. 118: where the list reads "Libre Acceso" instead of a spell). Major
 * paths print 40 spells and so leave 10 gaps, one per decade (4, 14 … 94);
 * minor paths print 30 and leave 20, two per decade (4 and 8, 14 and 18 …) —
 * which is why the book says minor paths get "muchos más conjuros libres".
 *
 * Sub-path spells sit at 4, 14 … 94, the *first* gap of each decade, so a
 * linked sub-path always consumes exactly 10 slots.
 */
function emitFreeAccess(defs: PathDef[], levelsByVia: Map<string, Set<number>>): number {
  const entries: string[] = [];
  for (const def of defs) {
    const own = levelsByVia.get(def.name) ?? new Set<number>();
    const gaps: number[] = [];
    for (let level = 2; level <= 100; level += 2) if (!own.has(level)) gaps.push(level);
    entries.push(`  ${JSON.stringify(def.name)}: [${gaps.join(", ")}],`);
  }

  // Every sub-path prints its ten spells at the same levels; take them from the
  // data rather than hard-coding 4, 14 … 94.
  const mainNames = new Set(defs.map((d) => d.name));
  const subLevels = new Set<number>();
  for (const [via, levels] of levelsByVia) {
    if (mainNames.has(via) || via === FREE_ACCESS_LABEL) continue;
    for (const l of levels) subLevels.add(l);
  }

  const body = `// GENERATED by scripts/extract-spell-tables.ts — do not edit by hand.
// Run \`npm run gen:spell-tables\` to refresh.

/**
 * Free-access slot levels of each magic path: the levels its printed spell list
 * does not cover. One per decade in major paths (10 total), two in minor ones
 * (20 total). Only the slots at or below the path's level are available.
 */
export const FREE_ACCESS_LEVELS: Readonly<Record<string, readonly number[]>> = {
${entries.join("\n")}
};

/**
 * Levels a sub-path's ten spells occupy — the first slot of each decade. Linking
 * a sub-path therefore consumes 10 slots: all of them in a major path, half of
 * them in a minor one, which keeps its second slot per decade free.
 */
export const SUB_PATH_LEVELS: readonly number[] = [${[...subLevels].sort((a, b) => a - b).join(", ")}];

/** The \`magicPath\` label of the general Libre Acceso pool (not a path item). */
export const FREE_ACCESS_LABEL = ${JSON.stringify(FREE_ACCESS_LABEL)};
`;

  writeFileSync(OUT_FREE_ACCESS, body, "utf-8");
  return entries.length;
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
  console.log(`[spell-tables] reading ${path.relative(root, workbook)}`);
  const md = readFileSync(workbook, "utf-8");

  const { written, vias, levelsByVia, unknownTypes, gaps } = emitSpells(readSheet(md, SHEET));
  console.log(`[spell-tables] ${path.relative(root, OUT_SPELLS)}: ${written} conjuros`);

  if (unknownTypes.size) {
    console.warn(`[spell-tables] WARNING: ${unknownTypes.size} "Tipo" value(s) not recognised:`);
    for (const [token, count] of unknownTypes) console.warn(`  - "${token}" (${count})`);
  }

  // Anything listed here needs either a better pattern in
  // scripts/lib/parse-effect-numbers or an entry in MANUAL_OVERRIDES.
  for (const [label, names] of [
    ["ataques sin daño", gaps.noDamage],
    ["defensas sin aguante", gaps.noShield],
    ["ataques sin tipo de TA", gaps.noType],
  ] as const) {
    if (names.length) {
      console.warn(`[spell-tables] WARNING: ${names.length} ${label}: ${names.join(", ")}`);
    }
  }

  const pathDefs = readPathTable(md);
  const pathsWritten = emitPaths(pathDefs, vias);
  console.log(
    `[spell-tables] ${path.relative(root, OUT_PATHS)}: ${pathsWritten} vías ` +
      `(${pathDefs.length} principales + ${pathsWritten - pathDefs.length} sub-vías)`,
  );

  const slotted = emitFreeAccess(pathDefs, levelsByVia);
  const slotCounts = pathDefs.map((d) => {
    const own = levelsByVia.get(d.name) ?? new Set<number>();
    let gaps = 0;
    for (let l = 2; l <= 100; l += 2) if (!own.has(l)) gaps++;
    return `${d.name}:${gaps}`;
  });
  console.log(
    `[spell-tables] ${path.relative(root, OUT_FREE_ACCESS)}: ${slotted} vías\n` +
      `  huecos -> ${slotCounts.join("  ")}`,
  );
}

main();
