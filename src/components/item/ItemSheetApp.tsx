import React, { useEffect, useState } from "react";
import type { ReactItemSheetProps } from "../../sheets/ReactItemSheet";
import { buildTabs, sidebarFor } from "./itemTabs";
import type { ItemTabProps } from "./types";
import { Pill } from "../character/ui/fields";

const ITEM_TYPE_LABELS: Record<string, string> = {
  weapon: "ANIMA.ItemWeapon",
  armor: "ANIMA.ItemArmor",
  category: "ANIMA.ItemCategory",
  trait: "ANIMA.ItemTrait",
  weaponTable: "ANIMA.ItemWeaponTable",
  combatStyle: "ANIMA.ItemCombatStyle",
  kiAbility: "ANIMA.ItemKiAbility",
  kiTechnique: "ANIMA.ItemKiTechnique",
  spell: "ANIMA.ItemSpell",
  magicPath: "ANIMA.ItemMagicPath",
  monsterAbility: "ANIMA.ItemMonsterAbility",
  psychicPower: "ANIMA.ItemPsychicPower",
  psychicDiscipline: "ANIMA.ItemPsychicDiscipline",
  mentalPattern: "ANIMA.ItemMentalPattern",
};

/** Item name, editable in the header; commits on blur like the other fields. */
function ItemNameInput({
  name,
  isEditable,
  onCommit,
}: {
  name: string;
  isEditable: boolean;
  onCommit: (value: string) => void;
}) {
  const [local, setLocal] = useState(name);

  useEffect(() => {
    setLocal(name);
  }, [name]);

  return (
    <input
      className="a-item-name"
      value={local}
      disabled={!isEditable}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => local !== name && onCommit(local)}
      onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
    />
  );
}

/**
 * The item window, following PF2e's anatomy: editable header, a persistent
 * summary sidebar (hidden on Rules via `data-active-tab`) and the common
 * Description / Details / Rules tab axis built by `buildTabs`.
 */
export function ItemSheetApp(props: ReactItemSheetProps) {
  const { item, system, isEditable, isGM, rollOptions, onUpdate, onEditImage } = props;
  const itemType = item.type;

  const loc = (k: string) => game.i18n.localize(k);

  const tabProps: ItemTabProps = {
    itemType,
    itemUuid: item.uuid,
    itemName: item.name,
    system,
    isEditable,
    isGM,
    rollOptions,
    onUpdate,
  };

  const tabs = buildTabs(itemType, tabProps);
  const Sidebar = sidebarFor(itemType);

  const [activeTabId, setActiveTabId] = useState(tabs[0]?.id ?? "description");

  // A different item may not have the tab that was active on the previous one.
  useEffect(() => {
    setActiveTabId(tabs[0]?.id ?? "description");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id]);

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0];
  const ActiveComponent = activeTab?.component;

  const typeLabel = loc(ITEM_TYPE_LABELS[itemType] ?? itemType);

  return (
    <div className="a-item-sheet" data-active-tab={activeTab?.id}>
      {/* ── Header ── */}
      <header className="a-item-header">
        <img
          src={item.img}
          alt={item.name}
          className="a-item-img"
          width={48}
          height={48}
          role={isEditable ? "button" : undefined}
          onClick={isEditable ? () => void onEditImage() : undefined}
        />
        <div className="a-item-header-details">
          <ItemNameInput
            name={item.name}
            isEditable={isEditable}
            onCommit={(value) => void onUpdate("name", value)}
          />
          <div className="a-item-header-tags">
            <Pill>{typeLabel}</Pill>
            {typeof system.subtype === "string" && system.subtype && (
              <span className="a-item-type">{system.subtype}</span>
            )}
          </div>
        </div>
      </header>

      {/* ── Sidebar title + tab bar ── */}
      <nav className="a-item-nav">
        {Sidebar && (
          <div className="a-sidebar-title">
            {game.i18n.format("ANIMA.ItemSidebarSummary", { type: typeLabel })}
          </div>
        )}
        <div className="a-item-tabbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`a-tab ${activeTab?.id === tab.id ? "a-tab--active" : ""}`}
              onClick={() => setActiveTabId(tab.id)}
            >
              {loc(tab.labelKey)}
            </button>
          ))}
        </div>
      </nav>

      {/* ── Sidebar + active tab ── */}
      <div className="a-item-content">
        {Sidebar && (
          <section className="a-item-sidebar">
            <Sidebar {...tabProps} />
          </section>
        )}
        <div className="a-item-body">{ActiveComponent && <ActiveComponent {...tabProps} />}</div>
      </div>
    </div>
  );
}
