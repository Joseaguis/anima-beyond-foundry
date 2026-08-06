import { useState } from "react";
import type { ReactSheetProps } from "../../sheets/ReactSheet";
import { VitalsStrip } from "./VitalsStrip";
import { TabNavigation, type TabId } from "./tabs/TabNavigation";
import type { TabProps } from "./tabs/types";
import { GeneralTab } from "./tabs/GeneralTab";
import { PrincipalTab } from "./tabs/PrincipalTab";
import { PoderesTab } from "./tabs/PoderesTab";
import { PDsTab } from "./tabs/PDsTab";
import { CombateTab } from "./tabs/CombateTab";
import { KiTab } from "./tabs/KiTab";
import { MisticosTab } from "./tabs/MisticosTab";
import { MetamagiaTab } from "./tabs/MetamagiaTab";
import { PsiquicosTab } from "./tabs/PsiquicosTab";
import { ReglasEspecialesTab } from "./tabs/ReglasEspecialesTab";

const TAB_COMPONENTS: Record<TabId, React.FC<TabProps>> = {
  general: GeneralTab,
  principal: PrincipalTab,
  poderes: PoderesTab,
  pds: PDsTab,
  combate: CombateTab,
  ki: KiTab,
  misticos: MisticosTab,
  metamagia: MetamagiaTab,
  psiquicos: PsiquicosTab,
  reglasEspeciales: ReglasEspecialesTab,
};

export function CharacterSheetApp({
  actor,
  system,
  items,
  isEditable,
  onUpdate,
  onItemCreate,
  onItemEdit,
  onItemUpdate,
  onItemDelete,
  getCompendiumItems,
  onItemAddFromCompendium,
  onRoll,
  rollable,
}: ReactSheetProps) {
  // Tab state lives in React: it survives Foundry re-renders because the
  // React root persists across them (see ReactApplicationMixin).
  const [tabId, setTabId] = useState<TabId>("principal");
  const ActiveComponent = TAB_COMPONENTS[tabId];

  const itemOps = {
    onItemCreate,
    onItemEdit,
    onItemUpdate,
    onItemDelete,
    getCompendiumItems,
    onItemAddFromCompendium,
  };

  const rollOps = { onRoll, rollable };

  return (
    <div className="anima-sheet">
      <VitalsStrip actor={actor} system={system} />
      <TabNavigation activeTab={tabId} onTabChange={setTabId} />
      <section className="a-panels scl">
        <ActiveComponent
          actor={actor}
          system={system}
          items={items}
          isEditable={isEditable}
          onUpdate={onUpdate}
          itemOps={itemOps}
          rollOps={rollOps}
        />
      </section>
    </div>
  );
}
