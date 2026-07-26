/**
 * Pure conversion from a category item's persisted system data to the
 * CategoryData shape the prep pipeline consumes. Kept free of Foundry
 * globals so tests can feed it pack source JSON directly.
 */

import type { CategoryData } from "../../actors/creature/prep/types";

/** Persisted system shape of a category item (pack source JSON / schema). */
export interface CategorySystemSource {
  lifeMultiple?: number;
  lpPerLevel?: number;
  initiativePerLevel?: number;
  martialKnowledgePerLevel?: number;
  dpLimits?: { combat: number; magic: number; psychic: number };
  combatCosts: CategoryData["combatCosts"];
  combatBonusPerLevel: CategoryData["combatBonusPerLevel"];
  supernatural: CategoryData["supernatural"];
  secondaryCosts: Record<string, number>;
  secondaryBonusPerLevel: Record<string, number>;
  secondaryCostOverrides?: Record<string, number>;
  secondaryAbilityBonusPerLevel?: Record<string, number>;
  novelPerLevel?: number;
}

/** This category's per-level costs and bonuses, in pipeline form. */
export function categorySystemToData(name: string, system: CategorySystemSource): CategoryData {
  return {
    labelName: name,
    lifeMultiple: system.lifeMultiple ?? 20,
    lpPerLevel: system.lpPerLevel ?? 0,
    initiativePerLevel: system.initiativePerLevel ?? 0,
    martialKnowledgePerLevel: system.martialKnowledgePerLevel ?? 0,
    dpLimits: system.dpLimits ? { ...system.dpLimits } : undefined,
    combatCosts: { ...system.combatCosts },
    combatBonusPerLevel: { ...system.combatBonusPerLevel },
    supernatural: { ...system.supernatural },
    secondaryCosts: { ...system.secondaryCosts },
    secondaryBonusPerLevel: { ...system.secondaryBonusPerLevel },
    secondaryCostOverrides: { ...system.secondaryCostOverrides },
    secondaryAbilityBonusPerLevel: { ...system.secondaryAbilityBonusPerLevel },
    novelPerLevel: system.novelPerLevel ?? 0,
  };
}
