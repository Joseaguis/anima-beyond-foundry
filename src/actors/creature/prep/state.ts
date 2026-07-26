import type { PrepContext } from "./types";

/**
 * State-derived penalties (Core Exxet ch. 6; docs/reglas/modificadores.md).
 * Runs after prepareCharacteristics (it needs the final CON) and before every
 * phase that computes an action-like ability.
 */

export interface StatePenalties {
  /** Exhaustion penalty to every action (≤ 0), Tabla 27. */
  fatiguePenalty: number;
}

export interface StateSystemSlice {
  fatigue?: { max: number; current: number; special?: number };
  state?: StatePenalties;
}

/** Tabla 27: remaining fatigue points → penalty to any action. */
const FATIGUE_PENALTIES: Record<number, number> = {
  0: -120,
  1: -80,
  2: -40,
  3: -20,
  4: -10,
};

export function prepareState(system: StateSystemSlice, ctx: PrepContext): void {
  let fatiguePenalty = 0;

  const fatigue = system.fatigue;
  if (fatigue) {
    fatigue.max = (ctx.charFinals.con ?? 0) + (fatigue.special ?? 0) + ctx.mod("fatigue");
    const current = Math.max(0, fatigue.current ?? 0);
    const max = fatigue.max;
    // With a natural CON below 5 the exhaustion penalty only kicks in once
    // points are actually lost; otherwise it applies at 4 points or fewer.
    const applies = max >= 5 ? current <= 4 : current < max;
    if (applies) fatiguePenalty = FATIGUE_PENALTIES[current] ?? 0;
  }

  system.state = { fatiguePenalty };
}
