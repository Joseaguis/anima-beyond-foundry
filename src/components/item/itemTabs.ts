import type { ItemSheetConfig, ItemTabDef, ItemTabProps } from "./types";
import { SummarySidebar } from "./sidebars/SummarySidebar";
import { PhysicalSidebar } from "./sidebars/PhysicalSidebar";
import { DescriptionTab } from "./tabs/DescriptionTab";
import { RulesTab } from "./tabs/RulesTab";
import { WeaponCombatTab } from "./tabs/WeaponCombatTab";
import { ArmorProtectionTab } from "./tabs/ArmorProtectionTab";
import { SpellTab } from "./tabs/SpellTab";
import { CombatStyleTab } from "./tabs/CombatStyleTab";
import { KiAbilityTab } from "./tabs/KiAbilityTab";
import { KiTechniqueTab } from "./tabs/KiTechniqueTab";
import { TraitTab } from "./tabs/TraitTab";
import { MagicPathTab } from "./tabs/MagicPathTab";
import { MonsterAbilityTab } from "./tabs/MonsterAbilityTab";
import { CategoryTab } from "./tabs/CategoryTab";
import { PsychicPowerTab } from "./tabs/PsychicPowerTab";
import { PsychicDisciplineTab } from "./tabs/PsychicDisciplineTab";
import { MentalPatternTab } from "./tabs/MentalPatternTab";

/**
 * Per-type sheet composition. Every item shares the same axis
 * (Description / Details / Rules), so a type only declares what is proper to
 * it: its sidebar, its Details panel and any extra tab. Extras may carry a
 * `condition` to appear only for some items (e.g. GM-only).
 */
export const ITEM_SHEET_CONFIG: Record<string, ItemSheetConfig> = {
  weapon: { sidebar: PhysicalSidebar, details: WeaponCombatTab },
  armor: { sidebar: PhysicalSidebar, details: ArmorProtectionTab },
  spell: { sidebar: SummarySidebar, details: SpellTab },
  combatStyle: { sidebar: SummarySidebar, details: CombatStyleTab },
  kiAbility: { sidebar: SummarySidebar, details: KiAbilityTab },
  kiTechnique: { sidebar: SummarySidebar, details: KiTechniqueTab },
  trait: { sidebar: SummarySidebar, details: TraitTab },
  magicPath: { sidebar: SummarySidebar, details: MagicPathTab },
  monsterAbility: { sidebar: SummarySidebar, details: MonsterAbilityTab },
  category: { sidebar: SummarySidebar, details: CategoryTab },
  weaponTable: { sidebar: SummarySidebar },
  psychicPower: { sidebar: SummarySidebar, details: PsychicPowerTab },
  psychicDiscipline: { sidebar: SummarySidebar, details: PsychicDisciplineTab },
  mentalPattern: { sidebar: SummarySidebar, details: MentalPatternTab },
};

const DESCRIPTION_TAB: ItemTabDef = {
  id: "description",
  labelKey: "ANIMA.ItemTabs.Descripcion",
  component: DescriptionTab,
};

const RULES_TAB: ItemTabDef = {
  id: "rules",
  labelKey: "ANIMA.ItemTabs.Reglas",
  component: RulesTab,
};

/** The sidebar of a type, if it has one. */
export function sidebarFor(type: string): ItemSheetConfig["sidebar"] {
  return ITEM_SHEET_CONFIG[type]?.sidebar;
}

/** `[Description, Details?, ...extra, Rules]`, filtered by each `condition`. */
export function buildTabs(type: string, props: ItemTabProps): ItemTabDef[] {
  const config = ITEM_SHEET_CONFIG[type] ?? {};

  const tabs: ItemTabDef[] = [DESCRIPTION_TAB];
  if (config.details) {
    tabs.push({
      id: "details",
      labelKey: "ANIMA.ItemTabs.Detalles",
      component: config.details,
    });
  }
  tabs.push(...(config.extra ?? []));
  tabs.push(RULES_TAB);

  return tabs.filter((tab) => tab.condition?.(props) ?? true);
}
