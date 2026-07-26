import type { Modifier } from "./modifier";

/**
 * Data contributed by rule elements during actor preparation. Rule elements
 * never mutate actor system data directly: they write here, and the derived
 * data pipeline (and later the Statistic helpers) read from it.
 *
 * Extend this interface (rollNotes, damage dice...) as new rule element kinds
 * appear — the preparation cycle in AnimaActor does not need to change.
 */
export interface AnimaSynthetics {
  /** Modifiers grouped by target stat key (see ./targets). */
  modifiers: Record<string, Modifier[]>;
  /**
   * Numeric flags keyed by special-rule key (see ./special-rules). The actor's
   * own `system.specialRules` entries and (in the future) item rule elements
   * add here; the pipeline reads them through `PrepContext.flag(key)`.
   */
  flags: Record<string, number>;
}

export function emptySynthetics(): AnimaSynthetics {
  return { modifiers: {}, flags: {} };
}
