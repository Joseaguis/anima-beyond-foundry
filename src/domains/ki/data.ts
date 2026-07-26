import type { KiTechniqueData } from "./technique-data";
import type { DpValue } from "../../actors/creature/prep/types";

/** The six characteristics that grant Ki (FUE/DES/AGI/CON/POD/VOL). */
export const KI_CHAR_KEYS = ["str", "dex", "agi", "con", "pow", "wp"] as const;
export type KiCharKey = (typeof KI_CHAR_KEYS)[number];

/** Per-characteristic Ki points and accumulation breakdown (innate + bought). */
export interface KiCharBreakdown {
  value: number;
  pointsInnate: number;
  pointsBought: number;
  pointsTotal: number;
  accInnate: number;
  accBought: number;
  accTotal: number;
}

/** A Ki ability embedded on the actor (KiAbilityModel.prepareActorData). */
export interface KiAbilityData {
  name: string;
  /** "kiPower" | "nemesisPower" | "kiTechnique". */
  subtype: string;
  /** Martial Knowledge (CM) cost of learning the ability. */
  mkCost: number;
  kiCost: number;
  kiMaintenance: number;
}

/** The actor's `ki` block: DP inputs and derived outputs. */
export interface KiData {
  // Inputs: per-characteristic DP maps (str/dex/agi/con/pow/wp).
  pointsDp?: Partial<Record<KiCharKey, DpValue>>;
  accDp?: Partial<Record<KiCharKey, DpValue>>;
  special?: number;
  // Derived outputs.
  perChar?: Record<KiCharKey, KiCharBreakdown>;
  pointsInnate?: number;
  pointsBought?: number;
  totalPoints?: number;
  accInnate?: number;
  accBought?: number;
  accumulation?: number;
  // Conocimiento Marcial as a resource pool for Ki abilities.
  cmTotal?: number;
  cmUsed?: number;
  cmAvailable?: number;
  cmOver?: boolean;
}

/** The slice of the actor system that the Ki preparation reads and writes. */
export interface KiSystemSlice {
  ki?: KiData;
  /** Ki abilities embedded on the actor (KiAbilityModel.prepareActorData). */
  kiAbilities?: KiAbilityData[];
  /** Ki techniques embedded on the actor (KiTechniqueModel.prepareActorData). */
  kiTechniques?: KiTechniqueData[];
  /**
   * Combat styles / martial arts / ars magnus embedded on the actor
   * (CombatStyleModel.prepareActorData); their mkCost also spends CM.
   */
  combatStyles?: { name: string; subtype: string; mkCost: number; dpCost: number }[];
  /** Total Martial Knowledge (CM), published by prepareVitals (runs earlier). */
  martialKnowledge?: number;
}
