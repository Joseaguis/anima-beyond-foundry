/**
 * Extracts the psychic catalog from the converted "Ficha Anima" workbook into
 * the `psychicPowers` and `psychicDisciplines` compendium sources.
 *
 * Source: sheet `Tablas psiquica`, which holds every power of the eight Core
 * disciplines plus the five from Arcana Exxet and the four Poderes Matriciales,
 * with their full difficulty→effect ladder. The book's own chapters are only
 * needed for the narrative descriptions, which this generator leaves empty.
 *
 * The sheet carries two tables side by side:
 *
 *   "Tabla general de Poderes Psíquicos"   D Poder  E Disciplina  F Nivel
 *                                          G Mantenido  H Acción  I-R RUT..ZEN
 *   "Tabla Poderes con mantenimiento"      U Poder  V Pot. Min
 *
 * Section rows carry `> TELEPATIA`, `> PODERES MATRICIALES`… in column D.
 *
 * Run via `npm run gen:psychic-tables`.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { guessAttackType, parseEffectNumbers } from "./lib/parse-effect-numbers";

const root = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const DOCS_ROOT = path.resolve(root, "..", "anime-beyond-fantasy-docs");
const CONVERTED_DIR = path.join(DOCS_ROOT, "graphify-out", "converted");
const OUT_POWERS = path.join(root, "src", "packs", "_source", "psychicPowers");
const OUT_DISCIPLINES = path.join(root, "src", "packs", "_source", "psychicDisciplines");

const SHEET = "Tablas psiquica";
const SOURCE = "Excel: Ficha Anima v8.7.0";
const POWER_IMG = "icons/magic/control/hypnosis-mesmerism-eye-tan.webp";
const DISCIPLINE_IMG = "icons/magic/control/energy-stream-link-blue.webp";

/** The pool the four Poderes Matriciales sit in. Not a discipline: it needs no
 * affinity and emits no `psychicDiscipline` item, the same way magic's Libre
 * Acceso label emits no `magicPath`. */
const MATRIX_LABEL = "Poderes Matriciales";

// ---------------------------------------------------------------------------
// Markdown table plumbing (same shape as scripts/extract-spell-tables.ts)
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
// Column layout
// ---------------------------------------------------------------------------

const NAME_COL = "D";
const DISCIPLINE_COL = "E";
const LEVEL_COL = "F";
const MAINTAINED_COL = "G";
const ACTION_COL = "H";
/** The ten difficulty grades, RUT..ZEN. */
const GRADE_COLS = ["I", "J", "K", "L", "M", "N", "O", "P", "Q", "R"] as const;
const MAINT_NAME_COL = "U";
const MAINT_POTMIN_COL = "V";

/**
 * Difficulty ladder, in the order the sheet's ten grade columns run. Kept in
 * sync with `DIFFICULTY_LEVELS` in src/actors/creature/tables.ts — this script
 * cannot import it because that module is typed against Foundry's globals.
 */
const DIFFICULTIES: readonly { key: string; label: string; abbr: string }[] = [
  { key: "routine", label: "Rutinario", abbr: "RUT" },
  { key: "easy", label: "Fácil", abbr: "FAC" },
  { key: "medium", label: "Medio", abbr: "MED" },
  { key: "hard", label: "Difícil", abbr: "DIF" },
  { key: "veryHard", label: "Muy difícil", abbr: "MDF" },
  { key: "absurd", label: "Absurdo", abbr: "ABS" },
  { key: "almostImpossible", label: "Casi imposible", abbr: "CIM" },
  { key: "impossible", label: "Imposible", abbr: "IMP" },
  { key: "inhuman", label: "Inhumano", abbr: "INH" },
  { key: "zen", label: "Zen", abbr: "ZEN" },
];

const KEY_BY_ABBR = new Map(DIFFICULTIES.map((d) => [d.abbr, d.key]));

/**
 * The header row sits one column to the left of the data rows (the converter
 * collapses an empty cell), so the layout above cannot be derived from it.
 * Assert it against a known data row instead, and fail loudly if the sheet is
 * ever restructured rather than emitting 124 silently wrong documents.
 */
function assertLayout(rows: Row[]): void {
  const probe = rows.find((r) => cell(r, NAME_COL) === "Escudo psíquico");
  if (!probe) throw new Error(`layout probe "Escudo psíquico" not found on the "${SHEET}" sheet`);
  const actual = {
    discipline: cell(probe, DISCIPLINE_COL),
    level: cell(probe, LEVEL_COL),
    maintained: cell(probe, MAINTAINED_COL),
    action: cell(probe, ACTION_COL),
    firstGrade: cell(probe, GRADE_COLS[0]),
  };
  const expected = {
    discipline: "Telepatía",
    level: "1",
    maintained: "Sí",
    action: "Pasiva",
    firstGrade: "Fatiga 2",
  };
  for (const [field, want] of Object.entries(expected)) {
    const got = (actual as Record<string, string>)[field];
    if (got !== want) {
      throw new Error(
        `"${SHEET}" column layout changed: expected ${field}="${want}" on the ` +
          `"Escudo psíquico" row, got "${got}". Re-check the column letters.`,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Value normalization
// ---------------------------------------------------------------------------

/** `Sí` / `Si` / `Si.` / `S` all mean maintainable; anything else does not. */
function parseMaintained(raw: string): boolean {
  const s = slug(raw);
  return s === "si" || s === "s";
}

/** `Activa` / `Pasiva`. One row reads `Activo` (the book's own typo). */
function parseAction(raw: string): string {
  return slug(raw).startsWith("pasiv") ? "passive" : "active";
}

/**
 * `1`, `2`, `3`, or `-` for the Poderes Matriciales, which have no level. The
 * schema models those as level 0 plus `isMatrix`.
 */
function parseLevel(raw: string): number {
  const n = Number(raw.trim());
  return Number.isFinite(n) && n >= 1 && n <= 3 ? n : 0;
}

/**
 * "Tabla Poderes con mantenimiento" gives the lowest difficulty each
 * maintainable power can be sustained at. It is *not* row-aligned with the main
 * table — it only lists maintainable powers, so it drifts — and it contains one
 * stray index row whose `Pot. Min` holds power names instead of a grade. Both
 * are handled by keying on the power name and only accepting cells that are a
 * known grade abbreviation.
 */
function readMaintenanceDifficulties(rows: Row[]): Map<string, string> {
  const byPower = new Map<string, string>();
  for (const row of rows) {
    const name = cell(row, MAINT_NAME_COL);
    if (!name || name.startsWith(">") || name === "Poder") continue;
    const key = KEY_BY_ABBR.get(cell(row, MAINT_POTMIN_COL).toUpperCase());
    if (!key) continue;
    byPower.set(slug(name), key);
  }
  return byPower;
}

// ---------------------------------------------------------------------------
// Emit
// ---------------------------------------------------------------------------

interface PowerRow {
  name: string;
  discipline: string;
  level: number;
  maintainable: boolean;
  action: string;
  grades: { difficulty: string; effect: string }[];
}

function readPowers(rows: Row[]): PowerRow[] {
  const powers: PowerRow[] = [];
  for (const row of rows) {
    const name = cell(row, NAME_COL);
    // Section headers (`> TELEPATIA`), the header row, and the sheet's
    // column-number legend row, which otherwise parses as a valid power.
    if (!name || name.startsWith(">") || name === "Poder" || /^\d+$/.test(name)) continue;
    const discipline = cell(row, DISCIPLINE_COL);
    if (!discipline) continue;

    powers.push({
      name,
      discipline,
      level: parseLevel(cell(row, LEVEL_COL)),
      maintainable: parseMaintained(cell(row, MAINTAINED_COL)),
      action: parseAction(cell(row, ACTION_COL)),
      // Always emit the ten grades in order. The leading cells hold `Fatiga N`
      // (the CV lost on that result, not an effect) and are kept verbatim;
      // blanks are kept too so a grade's position never shifts.
      grades: DIFFICULTIES.map((d, i) => ({
        difficulty: d.label,
        effect: cell(row, GRADE_COLS[i]),
      })),
    });
  }
  return powers;
}

function emitPowers(powers: PowerRow[], maintenance: Map<string, string>): number {
  rmSync(OUT_POWERS, { recursive: true, force: true });
  mkdirSync(OUT_POWERS, { recursive: true });

  const used = new Set<string>();
  let written = 0;

  for (const p of powers) {
    const isMatrix = p.discipline === MATRIX_LABEL;
    const doc = {
      name: p.name,
      type: "psychicPower",
      img: POWER_IMG,
      system: {
        description: { value: "", chat: "" },
        source: SOURCE,
        rules: [],
        discipline: isMatrix ? "" : p.discipline,
        powerLevel: p.level,
        action: p.action,
        maintainable: p.maintainable,
        isMatrix,
        // Dominar un poder costs 1 CV, matriciales included (Core p. 212).
        masteryCost: 1,
        // Fortalecer is a per-character investment, never part of the catalog.
        fortifyCvs: 0,
        maintenanceDifficulty: p.maintainable ? (maintenance.get(slug(p.name)) ?? "") : "",
        // No TA stops a psychic power (Core p. 211), so this is display-only —
        // the roll engine sends them through with `ignoresArmor`.
        damageType: guessAttackType(...p.grades.map((g) => g.effect)),
        // Same treatment as the spells: the figures only exist inside the grade
        // prose. There is no description to fall back on — the Excel leaves it
        // empty for every power. The damage barrier is authored by hand.
        grades: p.grades.map((g) => {
          const numbers = parseEffectNumbers(g.effect);
          return { ...g, ...numbers, damageBarrier: 0 };
        }),
        effect: "",
      },
    };

    // build-packs.ts derives the _id from the filename by sha1, so prefixing
    // with the discipline keeps ids stable and unique.
    const base = `${slug(p.discipline)}-${slug(p.name)}` || "poder";
    let file = base;
    for (let i = 2; used.has(file); i++) file = `${base}-${i}`;
    used.add(file);

    writeFileSync(path.join(OUT_POWERS, `${file}.json`), JSON.stringify(doc, null, 2) + "\n", "utf-8");
    written++;
  }
  return written;
}

function emitDisciplines(names: string[]): number {
  mkdirSync(OUT_DISCIPLINES, { recursive: true });
  for (const file of readdirSync(OUT_DISCIPLINES).filter((f) => f.endsWith(".json"))) {
    rmSync(path.join(OUT_DISCIPLINES, file));
  }

  let written = 0;
  for (const name of names) {
    const doc = {
      name,
      type: "psychicDiscipline",
      img: DISCIPLINE_IMG,
      system: {
        description: { value: "", chat: "" },
        source: SOURCE,
        rules: [],
        // The per-discipline situational modifiers (Telepatía +20 on contact,
        // Piroquinesis by environment…) are printed in the books, not the
        // sheet, and are filled in by hand.
        situationalModifier: "",
        // Afinidad a una disciplina: 1 CV (Core p. 211).
        affinityCost: 1,
        effect: "",
      },
    };
    writeFileSync(
      path.join(OUT_DISCIPLINES, `${slug(name)}.json`),
      JSON.stringify(doc, null, 2) + "\n",
      "utf-8",
    );
    written++;
  }
  return written;
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
  console.log(`[psychic-tables] reading ${path.relative(root, workbook)}`);
  const md = readFileSync(workbook, "utf-8");

  const rows = readSheet(md, SHEET);
  assertLayout(rows);

  const maintenance = readMaintenanceDifficulties(rows);
  const powers = readPowers(rows);

  const written = emitPowers(powers, maintenance);
  const byDiscipline = new Map<string, number>();
  for (const p of powers) byDiscipline.set(p.discipline, (byDiscipline.get(p.discipline) ?? 0) + 1);
  console.log(`[psychic-tables] ${path.relative(root, OUT_POWERS)}: ${written} poderes`);
  for (const [d, n] of [...byDiscipline].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(n).padStart(3)}  ${d}`);
  }

  const disciplines = [...byDiscipline.keys()].filter((d) => d !== MATRIX_LABEL).sort();
  const dWritten = emitDisciplines(disciplines);
  console.log(`[psychic-tables] ${path.relative(root, OUT_DISCIPLINES)}: ${dWritten} disciplinas`);

  // A maintainable power with no entry in the maintenance table means the two
  // tables disagree — report it rather than silently shipping an empty field.
  const missing = powers.filter((p) => p.maintainable && !maintenance.has(slug(p.name)));
  if (missing.length) {
    console.warn(
      `[psychic-tables] WARNING: ${missing.length} poder(es) mantenible(s) sin ` +
        `dificultad de mantenimiento en la segunda tabla:`,
    );
    for (const p of missing) console.warn(`  - ${p.name} (${p.discipline})`);
  }
  const orphan = [...maintenance.keys()].filter((k) => !powers.some((p) => slug(p.name) === k));
  if (orphan.length) {
    console.warn(`[psychic-tables] WARNING: ${orphan.length} entrada(s) de mantenimiento huérfana(s):`);
    for (const k of orphan) console.warn(`  - ${k}`);
  }
}

main();
