import type { ItemTabDef } from "./types";
import { SummaryTab } from "./tabs/SummaryTab";
import { DescriptionTab } from "./tabs/DescriptionTab";
import { ModifiersTab } from "./tabs/ModifiersTab";
import { PhysicalTab } from "./tabs/PhysicalTab";
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

const resumen: ItemTabDef = { id: "resumen", labelKey: "ANIMA.ItemTabs.Resumen", component: SummaryTab };
const descripcion: ItemTabDef = { id: "descripcion", labelKey: "ANIMA.ItemTabs.Descripcion", component: DescriptionTab };
const modificadores: ItemTabDef = { id: "modificadores", labelKey: "ANIMA.ItemTabs.Modificadores", component: ModifiersTab };
const fisico: ItemTabDef = { id: "fisico", labelKey: "ANIMA.ItemTabs.Fisico", component: PhysicalTab };

const combate: ItemTabDef = { id: "combate", labelKey: "ANIMA.ItemTabs.Combate", component: WeaponCombatTab };
const proteccion: ItemTabDef = { id: "proteccion", labelKey: "ANIMA.ItemTabs.Proteccion", component: ArmorProtectionTab };
const hechizo: ItemTabDef = { id: "hechizo", labelKey: "ANIMA.ItemTabs.Hechizo", component: SpellTab };
const estilo: ItemTabDef = { id: "estilo", labelKey: "ANIMA.ItemTabs.Estilo", component: CombatStyleTab };
const kiTab: ItemTabDef = { id: "ki", labelKey: "ANIMA.ItemTabs.Ki", component: KiAbilityTab };
const tecnica: ItemTabDef = { id: "tecnica", labelKey: "ANIMA.ItemTabs.Tecnica", component: KiTechniqueTab };
const rasgo: ItemTabDef = { id: "rasgo", labelKey: "ANIMA.ItemTabs.Rasgo", component: TraitTab };
const via: ItemTabDef = { id: "via", labelKey: "ANIMA.ItemTabs.Via", component: MagicPathTab };
const monstruo: ItemTabDef = { id: "monstruo", labelKey: "ANIMA.ItemTabs.Monstruo", component: MonsterAbilityTab };
const costes: ItemTabDef = { id: "costes", labelKey: "ANIMA.ItemTabs.Costes", component: CategoryTab };
const poderPsi: ItemTabDef = { id: "poderPsi", labelKey: "ANIMA.ItemTabs.PoderPsi", component: PsychicPowerTab };
const disciplinaPsi: ItemTabDef = { id: "disciplinaPsi", labelKey: "ANIMA.ItemTabs.DisciplinaPsi", component: PsychicDisciplineTab };
const patronMental: ItemTabDef = { id: "patronMental", labelKey: "ANIMA.ItemTabs.PatronMental", component: MentalPatternTab };

export const ITEM_TAB_CONFIG: Record<string, ItemTabDef[]> = {
  weapon:            [resumen, combate, fisico, descripcion, modificadores],
  armor:             [resumen, proteccion, fisico, descripcion, modificadores],
  spell:             [resumen, hechizo, descripcion, modificadores],
  combatStyle:       [resumen, estilo, descripcion, modificadores],
  kiAbility:         [resumen, kiTab, descripcion, modificadores],
  kiTechnique:       [resumen, tecnica, descripcion, modificadores],
  trait:             [resumen, rasgo, descripcion, modificadores],
  magicPath:         [resumen, via, descripcion, modificadores],
  monsterAbility:    [resumen, monstruo, descripcion, modificadores],
  category:          [resumen, costes, descripcion],
  weaponTable:       [resumen, descripcion],
  psychicPower:      [resumen, poderPsi, descripcion, modificadores],
  psychicDiscipline: [resumen, disciplinaPsi, descripcion, modificadores],
  mentalPattern:     [resumen, patronMental, descripcion, modificadores],
};

export const DEFAULT_TABS: ItemTabDef[] = [resumen, descripcion];
