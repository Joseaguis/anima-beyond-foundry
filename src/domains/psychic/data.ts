import type { DpValue } from "../../actors/creature/prep/types";
import type { DifficultyKey } from "../../actors/creature/tables";

/** A psychic discipline affinity embedded on the actor (PsychicDisciplineModel). */
export interface PsychicDisciplineData {
  name: string;
  /** CV spent on the affinity (Afinidad a una disciplina, normally 1). */
  affinityCost: number;
}

/** A psychic power embedded on the actor (PsychicPowerModel). */
export interface PsychicPowerData {
  name: string;
  discipline: string;
  /** 1-3, or 0 for the discipline-less Poderes Matriciales. */
  powerLevel: number;
  /** CV to master the power (Dominar un poder, normally 1). */
  masteryCost: number;
  /** CV invested in Fortalecer un poder (+10 each, max 10 CV / +100). */
  fortifyCvs: number;
  isMatrix: boolean;
  /** Active powers need initiative; passive ones can be used any time. */
  action: string;
  /** Whether an innato can sustain this power (Core p. 212). */
  maintainable: boolean;
  /** Lowest difficulty it can be sustained at; "" when not maintainable. */
  maintenanceDifficulty: DifficultyKey | "";
}

/** An innate slot maintaining a power (Core p. 212); costs 2 CV each. */
export interface PsychicInnatoData {
  powerName?: string;
  potentialAllocated?: number;
  note?: string;
}

/** The actor's `psychic` block: CV/DP inputs and derived outputs. */
export interface PsychicData {
  // Inputs.
  cvDp?: DpValue;
  cvCurrent?: number;
  projectionDp?: DpValue;
  projectionSpecial?: number;
  potentialIncrementCvs?: number;
  potentialSpecial?: number;
  innatos?: PsychicInnatoData[];
  /** Psychic crystal bonus to potential, +5..+30 (Core p. 229). */
  crystalBonus?: number;
  /** Discipline the crystal is attuned to; empty means it applies to all. */
  crystalDiscipline?: string;
  // Derived outputs.
  cvMax?: number;
  cvUsed?: number;
  cvFree?: number;
  /** CV spent beyond the total — flagged, never clamped (like Ki's `cmOver`). */
  cvOver?: number;
  projectionBase?: number;
  projectionFinal?: number;
  potentialBase?: number;
  potentialIncrement?: number;
  potentialFinal?: number;
  /** Extra Fatiga levels the crystal inflicts on a failure: +1 per +5 of bonus. */
  crystalFatiguePenalty?: number;
  innatosCount?: number;
}

/** The slice of the actor system that the psychic preparation reads and writes. */
export interface PsychicSystemSlice {
  psychic?: PsychicData;
  /** Psychic discipline affinities embedded on the actor (PsychicDisciplineModel). */
  psychicDisciplines?: PsychicDisciplineData[];
  /** Psychic powers embedded on the actor (PsychicPowerModel). */
  psychicPowers?: PsychicPowerData[];
  /** State penalties (fatigue...), published by prepareState (runs earlier). */
  state?: { fatiguePenalty?: number };
}
