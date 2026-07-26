import React from "react";
import type { ItemTabProps } from "../types";
import { StatCard, Pill } from "../../character/ui/fields";

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
  spell: [
    { label: "ANIMA.ItemSpellLevel", path: "spellLevel", color: "blue" },
    { label: "ANIMA.ItemZeonCost", path: "zeonCost", color: "acc" },
    { label: "ANIMA.ItemIntRequired", path: "intRequired" },
    { label: "ANIMA.ItemSpellType", path: "spellType" },
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
};

function readPath(obj: Record<string, any>, path: string): any {
  return path.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);
}

export function SummaryTab({ system }: ItemTabProps) {
  const itemType = (system as any)._itemType as string | undefined;
  const fields = SUMMARY_CONFIG[itemType ?? ""] ?? [];

  const loc = (k: string) => game.i18n.localize(k);

  return (
    <div className="a-item-summary-grid">
      {fields.map((f) => (
        <StatCard
          key={f.path}
          label={loc(f.label)}
          value={readPath(system, f.path) ?? "—"}
          color={f.color}
        />
      ))}
      {"equipped" in system && (
        <div className="a-item-summary-pill">
          <Pill>{system.equipped ? loc("ANIMA.ItemEquipped") : loc("ANIMA.ItemNotEquipped")}</Pill>
        </div>
      )}
    </div>
  );
}
