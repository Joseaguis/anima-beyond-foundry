export const TABS = [
  { id: "general", labelKey: "ANIMA.Tabs.General" },
  { id: "principal", labelKey: "ANIMA.Tabs.Principal" },
  { id: "poderes", labelKey: "ANIMA.Tabs.Poderes" },
  { id: "pds", labelKey: "ANIMA.Tabs.PDs" },
  { id: "combate", labelKey: "ANIMA.Tabs.Combate" },
  { id: "ki", labelKey: "ANIMA.Tabs.Ki" },
  { id: "misticos", labelKey: "ANIMA.Tabs.Misticos" },
  { id: "metamagia", labelKey: "ANIMA.Tabs.Metamagia" },
  { id: "psiquicos", labelKey: "ANIMA.Tabs.Psiquicos" },
  { id: "reglasEspeciales", labelKey: "ANIMA.Tabs.ReglasEspeciales" },
] as const;

export type TabId = (typeof TABS)[number]["id"];

interface TabNavigationProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <nav className="a-tabbar scl">
      {TABS.map((tab, i) => (
        <button
          key={tab.id}
          className={`a-tab ${activeTab === tab.id ? "a-tab--active" : ""}`}
          onClick={() => onTabChange(tab.id)}
        >
          <span className="a-tab-num">{i + 1}</span>
          {game.i18n.localize(tab.labelKey)}
        </button>
      ))}
    </nav>
  );
}
