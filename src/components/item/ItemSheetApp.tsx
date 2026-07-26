import React, { useState } from "react";
import type { ReactItemSheetProps } from "../../sheets/ReactItemSheet";
import { ITEM_TAB_CONFIG, DEFAULT_TABS } from "./itemTabs";
import { Pill } from "../character/ui/fields";

const ITEM_TYPE_LABELS: Record<string, string> = {
  weapon: "ANIMA.ItemWeapon",
  armor: "ANIMA.ItemArmor",
  category: "ANIMA.ItemCategory",
  trait: "ANIMA.ItemTrait",
  weaponTable: "ANIMA.ItemWeaponTable",
  combatStyle: "ANIMA.ItemCombatStyle",
  kiAbility: "ANIMA.ItemKiAbility",
  spell: "ANIMA.ItemSpell",
  magicPath: "ANIMA.ItemMagicPath",
  monsterAbility: "ANIMA.ItemMonsterAbility",
};

export function ItemSheetApp(props: ReactItemSheetProps) {
  const { item, system, isEditable, onUpdate } = props;
  const itemType = (item as any).type as string;
  const tabs = ITEM_TAB_CONFIG[itemType] ?? DEFAULT_TABS;
  const [activeTabId, setActiveTabId] = useState(tabs[0]?.id ?? "resumen");

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0];
  const ActiveComponent = activeTab?.component;

  const loc = (k: string) => game.i18n.localize(k);

  // Inject _itemType so SummaryTab can read it without extra props.
  const enrichedSystem = { ...system, _itemType: itemType };

  const hasEquipped = "equipped" in system;

  return (
    <div className="a-item-sheet">
      {/* ── Header ── */}
      <header className="a-item-header">
        <img
          src={item.img}
          alt={item.name}
          className="a-item-img"
          width={48}
          height={48}
        />
        <div className="a-item-header-info">
          <h1 className="a-item-name">{item.name}</h1>
          <div className="a-item-header-tags">
            <Pill>{loc(ITEM_TYPE_LABELS[itemType] ?? itemType)}</Pill>
            {hasEquipped && (
              <label className="a-item-equipped-toggle">
                <input
                  type="checkbox"
                  checked={!!system.equipped}
                  disabled={!isEditable}
                  onChange={(e) => onUpdate("system.equipped", e.target.checked)}
                />
                {loc("ANIMA.ItemEquipped")}
              </label>
            )}
          </div>
        </div>
      </header>

      {/* ── Tab bar ── */}
      <nav className="a-item-tabbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`a-tab ${activeTabId === tab.id ? "a-tab--active" : ""}`}
            onClick={() => setActiveTabId(tab.id)}
          >
            {loc(tab.labelKey)}
          </button>
        ))}
      </nav>

      {/* ── Tab content ── */}
      <section className="a-item-panels">
        {ActiveComponent && (
          <ActiveComponent
            system={enrichedSystem}
            isEditable={isEditable}
            onUpdate={onUpdate}
          />
        )}
      </section>
    </div>
  );
}
