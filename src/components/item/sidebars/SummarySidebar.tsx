import React from "react";
import type { ItemTabProps } from "../types";
import { StatCard, Pill } from "../../character/ui/fields";

/**
 * The persistent left column of the item sheet: the handful of numbers that
 * identify the item at a glance, visible next to every tab except Rules
 * (equivalent to PF2e's `{Type} Summary` sidebar).
 */

interface SummaryFieldDef {
  label: string;
  path: string;
  color?: "acc" | "blue" | "red";
}

const SUMMARY_CONFIG: Record<string, SummaryFieldDef[]> = {
  weapon: [
    { label: "ANIMA.Damage", path: "damage", color: "red" },
    { label: "ANIMA.Speed", path: "speed" },
    { label: "ANIMA.ItemPrimaryType", path: "primaryType", color: "acc" },
    { label: "ANIMA.ItemRequiredStr", path: "requiredStr" },
  ],
  armor: [
    { label: "ANIMA.ItemArmorType", path: "armorType", color: "acc" },
    { label: "ANIMA.ItemMovementPenalty", path: "movementPenalty", color: "red" },
    { label: "ANIMA.ItemRequirement", path: "requirement" },
  ],
  // Zeón, INT y daño viven bajo el grado desde la migración a los cuatro
  // grados (Core p. 119); las rutas de nivel raíz ya no existen y pintaban "—".
  spell: [
    { label: "ANIMA.ItemSpellLevel", path: "spellLevel", color: "blue" },
    { label: "ANIMA.ItemZeonCost", path: "grades.base.zeonCost", color: "acc" },
    { label: "ANIMA.ItemIntRequired", path: "grades.base.intRequired" },
    { label: "ANIMA.ItemSpellType", path: "spellType" },
    { label: "ANIMA.ItemSpellDamage", path: "grades.base.damage", color: "red" },
    { label: "ANIMA.ItemShieldPoints", path: "grades.base.shieldPoints", color: "blue" },
  ],
  combatStyle: [
    { label: "ANIMA.ItemDegree", path: "degree", color: "acc" },
    { label: "ANIMA.ItemRequiredCombat", path: "requiredCombat" },
    { label: "ANIMA.ItemMkCost", path: "mkCost", color: "blue" },
  ],
  kiAbility: [
    { label: "ANIMA.ItemKiCost", path: "kiCost", color: "acc" },
    { label: "ANIMA.ItemKiMaintenance", path: "kiMaintenance" },
    { label: "ANIMA.ItemMkCost", path: "mkCost", color: "blue" },
  ],
  kiTechnique: [
    { label: "ANIMA.ItemTechniqueLevel", path: "level", color: "acc" },
    { label: "ANIMA.ItemTechniqueTree", path: "tree" },
    { label: "ANIMA.ItemMkCost", path: "mkCost", color: "blue" },
  ],
  trait: [
    { label: "ANIMA.ItemCpCost", path: "cpCost", color: "acc" },
    { label: "ANIMA.ItemTraitCategory", path: "traitCategory" },
    { label: "ANIMA.ItemSubtype", path: "subtype" },
  ],
  magicPath: [
    { label: "ANIMA.ItemElement", path: "element", color: "blue" },
    { label: "ANIMA.Level", path: "level", color: "acc" },
    { label: "ANIMA.ItemMkCost", path: "mkCost" },
  ],
  monsterAbility: [
    { label: "ANIMA.ItemDpCost", path: "dpCost", color: "acc" },
    { label: "ANIMA.Level", path: "level" },
    { label: "ANIMA.ItemAction", path: "action" },
  ],
  category: [
    { label: "ANIMA.ItemArchetype", path: "archetype", color: "acc" },
    { label: "ANIMA.ItemLpPerLevel", path: "lpPerLevel" },
    { label: "ANIMA.ItemInitPerLevel", path: "initiativePerLevel" },
  ],
  weaponTable: [
    { label: "ANIMA.ItemWeaponGroup", path: "weaponGroup", color: "acc" },
    { label: "ANIMA.ItemDpCost", path: "dpCost" },
  ],
  psychicPower: [
    { label: "ANIMA.ItemPowerLevel", path: "powerLevel", color: "acc" },
    { label: "ANIMA.ItemPsychicDiscipline", path: "discipline" },
    { label: "ANIMA.ItemAction", path: "action" },
    { label: "ANIMA.ItemMasteryCost", path: "masteryCost", color: "blue" },
  ],
  psychicDiscipline: [
    { label: "ANIMA.ItemAffinityCost", path: "affinityCost", color: "acc" },
    { label: "ANIMA.ItemSituationalModifier", path: "situationalModifier" },
  ],
  mentalPattern: [
    { label: "ANIMA.ItemDpCost", path: "dpCost", color: "acc" },
    { label: "ANIMA.ItemModifier", path: "modifier" },
  ],
};

function readPath(obj: Record<string, any>, path: string): any {
  return path.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);
}

/** The StatCard stack, reused by the physical sidebar. */
export function SummaryStats({ itemType, system }: Pick<ItemTabProps, "itemType" | "system">) {
  const fields = SUMMARY_CONFIG[itemType] ?? [];
  const loc = (k: string) => game.i18n.localize(k);

  return (
    <>
      {fields.map((f) => (
        <StatCard
          key={f.path}
          label={loc(f.label)}
          value={readPath(system, f.path) ?? "—"}
          color={f.color}
        />
      ))}
    </>
  );
}

export function SummarySidebar({ itemType, system }: ItemTabProps) {
  const loc = (k: string) => game.i18n.localize(k);

  return (
    <div className="a-item-summary-grid">
      <SummaryStats itemType={itemType} system={system} />
      {"equipped" in system && (
        <div className="a-item-summary-pill">
          <Pill>{system.equipped ? loc("ANIMA.ItemEquipped") : loc("ANIMA.ItemNotEquipped")}</Pill>
        </div>
      )}
    </div>
  );
}
