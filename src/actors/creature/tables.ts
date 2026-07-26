/**
 * Core Exxet lookup tables shared by every creature-like actor.
 * Pure functions — no Foundry globals, unit-testable in Node.
 */

/** Characteristic-to-modifier table. */
export function getModifier(value: number): number {
  if (value <= 1) return -30;
  if (value === 2) return -20;
  if (value === 3) return -10;
  if (value === 4) return -5;
  const group = Math.floor((value - 5) / 5);
  const position = (value - 5) % 5;
  return group * 15 + (position === 0 ? 0 : position <= 2 ? 5 : 10);
}

/** Base life points by Constitution. */
export function getLifePointsBase(con: number): number {
  if (con <= 1) return 5;
  if (con === 2) return 20;
  if (con === 3) return 40;
  if (con === 4) return 55;
  const group = Math.floor((con - 5) / 5);
  const pos = (con - 5) % 5;
  const offsets = [0, 15, 25, 40, 50];
  return 70 + group * 65 + offsets[pos];
}

/**
 * Base regeneration by Constitution. Caps at 12: regeneration 13+ only comes
 * from supernatural sources (Gnosis, creature powers).
 */
export function getRegeneration(con: number): number {
  if (con <= 2) return 0;
  if (con <= 7) return 1;
  if (con <= 9) return 2;
  if (con === 10) return 3;
  if (con <= 18) return con - 7;
  return 12;
}

/**
 * Look up a value in a 1..20 table by characteristic value. Below 1 → 0 (the
 * Excel guards mystic innates with IF(car=0,0,...)); above 20 clamps to the
 * table's last row (VLOOKUP approximate match).
 */
export function lookup1to20(table: readonly number[], value: number): number {
  if (value <= 0) return 0;
  const idx = Math.min(Math.max(Math.trunc(value), 1), 20);
  return table[idx - 1];
}

export interface RegenerationRow {
  /** Life points recovered and cadence, e.g. "50 PV / día *". */
  amount: string;
  /** Penalty elimination rate, e.g. "−10 al día". */
  removal: string;
  /** Extra healing rules granted at this level ("" below level 5). */
  special: string;
}

/**
 * Tabla 19/20 (Core Exxet pág. 55) as printed in the character-sheet Excel.
 * Indexed by regeneration level 0..20. The trailing "*" on amounts is the
 * Excel's own mark for regeneration that works even without resting.
 */
export const REGENERATION_TABLE: readonly RegenerationRow[] = [
  { amount: "Ninguna", removal: "Ninguna", special: "" },
  { amount: "10 PV / día", removal: "-5 al día", special: "" },
  { amount: "20 PV / día", removal: "-5 al día", special: "" },
  { amount: "30 PV / día", removal: "-5 al día", special: "" },
  { amount: "40 PV / día", removal: "-10 al día", special: "" },
  { amount: "50 PV / día *", removal: "-10 al día", special: "Sin cicatrices." },
  {
    amount: "75 PV / día *",
    removal: "-15 al día",
    special: "Sin desangramiento. Sin cicatrices.",
  },
  {
    amount: "100 PV / día *",
    removal: "-20 al día",
    special:
      "Miembros limpios unidos se recuperan en 1 semana. Sin cicatrices. Sin desangramiento.",
  },
  {
    amount: "250 PV / día *",
    removal: "-25 al día",
    special:
      "Miembros limpios unidos se recuperan en 5 días. Sin cicatrices. Sin desangramiento.",
  },
  {
    amount: "500 PV / día *",
    removal: "-30 al día",
    special:
      "Miembros limpios unidos se recuperan en 3 días. Supera entre la vida y la muerte. Sin cicatrices. Sin desangramiento.",
  },
  {
    amount: "1 PV / min *",
    removal: "-40 al día",
    special:
      "Miembros limpios unidos se recuperan en 1 día. Supera entre la vida y la muerte. Sin cicatrices. Sin desangramiento.",
  },
  {
    amount: "2 PV / min *",
    removal: "-50 al día",
    special:
      "Miembros unidos se recuperan en 1 semana, limpios en 1 día. Supera entre la vida y la muerte. Sin cicatrices. Sin desangramiento.",
  },
  {
    amount: "5 PV / min *",
    removal: "-5 por hora",
    special:
      "Miembros unidos se recuperan en 3 días, limpios en 1 día. Supera entre la vida y la muerte. Sin cicatrices. Sin desangramiento.",
  },
  {
    amount: "10 PV / min *",
    removal: "-10 por hora",
    special:
      "Miembros unidos se recuperan en 1 día. Supera entre la vida y la muerte. Sin cicatrices. Sin desangramiento.",
  },
  {
    amount: "1 PV / turno *",
    removal: "-15 por hora",
    special:
      "Miembros unidos se recuperan en horas. Supera entre la vida y la muerte. Sin cicatrices. Sin desangramiento.",
  },
  {
    amount: "5 PV / turno *",
    removal: "-20 por hora",
    special:
      "Salvo cabeza, miembros crecen en 1 semana, unidos en 1 asalto. Supera entre la vida y la muerte. Sin cicatrices. Sin desangramiento.",
  },
  {
    amount: "10 PV / turno *",
    removal: "-10 por minuto",
    special:
      "Salvo cabeza, miembros crecen en 1 día, unidos en 1 asalto. Supera entre la vida y la muerte. Sin cicatrices. Sin desangramiento.",
  },
  {
    amount: "25 PV / turno *",
    removal: "-10 por asalto",
    special:
      "Salvo cabeza, miembros crecen en minutos, unidos en 1 asalto. Supera entre la vida y la muerte. Sin cicatrices. Sin desangramiento.",
  },
  {
    amount: "50 PV / turno *",
    removal: "-25 por asalto",
    special:
      "Salvo cabeza, miembros crecen en asaltos, unidos en 1 asalto. Supera entre la vida y la muerte. Sin cicatrices. Sin desangramiento.",
  },
  {
    amount: "100 PV / turno *",
    removal: "Todos",
    special:
      "Los miembros crecen en 1 asalto. Supera entre la vida y la muerte. Sin cicatrices. Sin desangramiento.",
  },
  {
    amount: "250 PV / turno *",
    removal: "Todos",
    special:
      "Inmune a críticos físicos. Los miembros crecen en 1 asalto. Supera entre la vida y la muerte. Sin cicatrices. Sin desangramiento.",
  },
];

/** Row of Tabla 19/20 for a regeneration level, clamped to 0..20. */
export function getRegenerationRow(level: number): RegenerationRow {
  const idx = Math.min(Math.max(Math.trunc(level), 0), 20);
  return REGENERATION_TABLE[idx];
}

/**
 * Tabla 21: Tipo de Movimiento (Core Exxet pág. 56). Indexed by movement type
 * 1..20; type 20 has no fixed speed ("Esp*").
 */
export const MOVEMENT_SPEED: readonly string[] = [
  "< 1 m / asalto",
  "4 m / asalto",
  "8 m / asalto",
  "15 m / asalto",
  "20 m / asalto",
  "22 m / asalto",
  "25 m / asalto",
  "28 m / asalto",
  "32 m / asalto",
  "35 m / asalto",
  "40 m / asalto",
  "50 m / asalto",
  "80 m / asalto",
  "150 m / asalto",
  "250 m / asalto",
  "500 m / asalto",
  "1 km / asalto",
  "5 km / asalto",
  "25 km / asalto",
  "Esp*",
];

/** Speed text for a movement type; 0 or below means the creature cannot move. */
export function getMovementSpeed(level: number): string {
  if (level <= 0) return "—";
  const idx = Math.min(Math.max(Math.trunc(level), 1), 20);
  return MOVEMENT_SPEED[idx - 1];
}

/**
 * The ten difficulty grades shared by magic and psychic projection (Core Exxet
 * pp. 118 and 210; Excel boxes "Dificultades" on the `Místicos` and `Psíquicos`
 * sheets). Magic and psychic use the same thresholds and the same ranges — only
 * the psychic powers' effect tables differ — so the scale lives here rather than
 * in one of the two domains.
 */
export type DifficultyKey =
  | "routine"
  | "easy"
  | "medium"
  | "hard"
  | "veryHard"
  | "absurd"
  | "almostImpossible"
  | "impossible"
  | "inhuman"
  | "zen";

export interface DifficultyRow {
  key: DifficultyKey;
  /** Roll needed to reach this grade. */
  threshold: number;
  label: string;
  /** Abbreviation the Excel uses as a column header (`RUT`, `FAC`, …). */
  abbr: string;
  /** Reach granted at this grade; "—" for the two grades with no printed range. */
  range: string;
}

export const DIFFICULTY_LEVELS: readonly DifficultyRow[] = [
  { key: "routine", threshold: 20, label: "Rutinario", abbr: "RUT", range: "Sobre sí mismo o en contacto" },
  { key: "easy", threshold: 40, label: "Fácil", abbr: "FAC", range: "Blancos hasta 5m" },
  { key: "medium", threshold: 80, label: "Medio", abbr: "MED", range: "Blancos hasta 20m" },
  { key: "hard", threshold: 120, label: "Difícil", abbr: "DIF", range: "Blancos hasta 100m" },
  { key: "veryHard", threshold: 140, label: "Muy difícil", abbr: "MDF", range: "Blancos hasta 250m" },
  { key: "absurd", threshold: 180, label: "Absurdo", abbr: "ABS", range: "Blancos hasta 500m" },
  { key: "almostImpossible", threshold: 240, label: "Casi imposible", abbr: "CIM", range: "Hasta 1 km. Blanco localizado" },
  // The Excel "Dificultades" box says 10 km, not the 5 km this table used to show.
  { key: "impossible", threshold: 280, label: "Imposible", abbr: "IMP", range: "Hasta 10 km. Blanco aproximado" },
  { key: "inhuman", threshold: 320, label: "Inhumano", abbr: "INH", range: "—" },
  { key: "zen", threshold: 440, label: "Zen", abbr: "ZEN", range: "—" },
];

/** Every difficulty key, in ascending order — handy for schema `choices`. */
export const DIFFICULTY_KEYS: readonly DifficultyKey[] = DIFFICULTY_LEVELS.map((d) => d.key);

/** The difficulty a psychic power is maintained at with a given potential: the
 * highest grade the potential alone reaches, with no dice or modifiers
 * (Core p. 212). Below 20 nothing is reached. */
export function getDifficultyForValue(value: number): DifficultyRow | undefined {
  let hit: DifficultyRow | undefined;
  for (const row of DIFFICULTY_LEVELS) {
    if (value >= row.threshold) hit = row;
  }
  return hit;
}

/** Tabla 37: Num. de Acciones (Core Exxet pág. 81), indexed by DEX + AGI. */
export function getActionsPerTurn(dexPlusAgi: number): number {
  if (dexPlusAgi >= 32) return 10;
  if (dexPlusAgi >= 29) return 8;
  if (dexPlusAgi >= 26) return 6;
  if (dexPlusAgi >= 23) return 5;
  if (dexPlusAgi >= 20) return 4;
  if (dexPlusAgi >= 15) return 3;
  if (dexPlusAgi >= 11) return 2;
  return 1;
}
