/**
 * Sandbox shell: a gallery of the system's windows running against mock
 * documents, with the real data pipeline and hot reload. Editing any field
 * re-runs preparation, so derived values react exactly like in Foundry.
 */
import { useCallback, useReducer, useState, useSyncExternalStore } from "react";
import { CharacterSheetApp } from "../src/components/character/CharacterSheetApp";
import { NpcSheetApp } from "../src/components/npc/NpcSheetApp";
import { ItemSheetApp } from "../src/components/item/ItemSheetApp";
import type { ReactSheetProps } from "../src/sheets/ReactSheet";
import type { ReactItemSheetProps } from "../src/sheets/ReactItemSheet";
import { MockActor, MockItem } from "./mock-documents";
import { characterFixture, npcFixture } from "./fixtures";
import * as packs from "./packs";
import { sandboxChat, type SandboxMessage } from "./foundry-shim";

/* eslint-disable @typescript-eslint/no-explicit-any */

// Module-level singletons: state survives component hot reloads.
const character = new MockActor(characterFixture());
const npc = new MockActor(npcFixture());

const ACTORS = { character, npc } as const;
type ActorKey = keyof typeof ACTORS;

interface ItemWindow {
  key: string;
  title: string;
  /** Embedded item: re-resolved from the actor on every render. */
  actor?: MockActor;
  itemId?: string;
  /** Standalone item (opened from the compendium browser). */
  item?: MockItem;
}

function useActorVersion(actor: MockActor): number {
  return useSyncExternalStore(actor.subscribe, actor.getVersion);
}

function buildSheetProps(actor: MockActor, openItem: (actor: MockActor, id: string) => void): ReactSheetProps {
  return {
    actor: actor as any,
    system: actor.system,
    items: actor.items.contents.map((i) => ({
      id: i.id,
      name: i.name,
      img: i.img,
      type: i.type,
      system: i.system,
    })),
    isEditable: true,
    onUpdate: (path, value) => actor.update({ [path]: value }),
    onItemCreate: (type, subtype) => actor.createItem(type, subtype),
    onItemEdit: (id) => openItem(actor, id),
    onItemDelete: (id) => actor.deleteItem(id),
    getCompendiumItems: async (type, subtype) => packs.getCompendiumItems(type, subtype),
    onItemAddFromCompendium: (uuid) => actor.addItemFromSource(packs.cloneSource(uuid)),
  };
}

function buildItemProps(item: MockItem): ReactItemSheetProps {
  return {
    item: {
      id: item.id,
      uuid: `Item.${item.id}`,
      name: item.name,
      img: item.img,
      type: item.type,
    },
    system: item.system,
    isEditable: true,
    // The sandbox has no users: always show what a GM would see.
    isGM: true,
    rollOptions: [],
    onUpdate: (path, value) => item.update({ [path]: value }),
    onEditImage: async () => {},
  };
}

function Window({
  title,
  width,
  height,
  onClose,
  children,
}: {
  title: string;
  width: number;
  height: number;
  onClose?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="sb-window" style={{ width, height }}>
      <header className="sb-window-header">
        <span>{title}</span>
        {onClose && (
          <button className="sb-window-close" onClick={onClose} title="Cerrar">
            ✕
          </button>
        )}
      </header>
      <div className="sb-window-body">{children}</div>
    </div>
  );
}

function ChatToasts() {
  const messages = useSyncExternalStore(
    useCallback((cb: () => void) => sandboxChat.subscribe(cb), []),
    sandboxChat.get,
  );
  if (messages.length === 0) return null;
  return (
    <div className="sb-toasts">
      {messages.map((m: SandboxMessage) => (
        <div key={m.id} className={`sb-toast sb-toast-${m.kind}`}>
          <strong>{m.title}</strong>
          <span>{m.body}</span>
        </div>
      ))}
    </div>
  );
}

export function App() {
  const [active, setActive] = useState<ActorKey>("character");
  const [itemWindows, setItemWindows] = useState<ItemWindow[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [, forceUpdate] = useReducer((n: number) => n + 1, 0);

  // Re-render when the active actor re-prepares.
  useActorVersion(character);
  useActorVersion(npc);

  const openEmbeddedItem = useCallback((actor: MockActor, itemId: string) => {
    const item = actor.items.get(itemId);
    if (!item) return;
    const key = `${actor.name}:${itemId}`;
    setItemWindows((windows) =>
      windows.some((w) => w.key === key)
        ? windows
        : [...windows, { key, title: item.name, actor, itemId }],
    );
  }, []);

  const openPackItem = useCallback(
    (uuid: string) => {
      const source = packs.cloneSource(uuid);
      if (!source) return;
      const key = `pack:${uuid}`;
      setItemWindows((windows) => {
        if (windows.some((w) => w.key === key)) return windows;
        const item = new MockItem(source);
        item.onChange = forceUpdate;
        return [...windows, { key, title: source.name, item }];
      });
    },
    [forceUpdate],
  );

  const closeItemWindow = (key: string) =>
    setItemWindows((windows) => windows.filter((w) => w.key !== key));

  const actor = ACTORS[active];
  const sheetProps = buildSheetProps(actor, openEmbeddedItem);

  // Compendium browser entries, grouped by pack folder.
  const packGroups = new Map<string, typeof packs.PACK_DOCS>();
  for (const doc of packs.PACK_DOCS) {
    const group = packGroups.get(doc.packLabel) ?? [];
    group.push(doc);
    packGroups.set(doc.packLabel, group);
  }

  return (
    <div className="sb-shell">
      <aside className={sidebarCollapsed ? "sb-sidebar sb-sidebar-collapsed" : "sb-sidebar"}>
        <button
          className="sb-sidebar-toggle"
          onClick={() => setSidebarCollapsed((v) => !v)}
          title={sidebarCollapsed ? "Mostrar barra lateral" : "Ocultar barra lateral"}
        >
          {sidebarCollapsed ? "»" : "«"}
        </button>

        {!sidebarCollapsed && (
          <>
            <h1>Anima Sandbox</h1>

            <h2>Fichas</h2>
            <button
              className={active === "character" ? "sb-nav sb-nav-active" : "sb-nav"}
              onClick={() => setActive("character")}
            >
              {character.name} <small>PJ</small>
            </button>
            <button
              className={active === "npc" ? "sb-nav sb-nav-active" : "sb-nav"}
              onClick={() => setActive("npc")}
            >
              {npc.name} <small>PNJ</small>
            </button>

            <h2>Compendio</h2>
            {[...packGroups.entries()].map(([label, docs]) => (
              <details key={label} className="sb-pack-group">
                <summary>
                  {label} <small>{docs.length}</small>
                </summary>
                {docs.map((doc) => (
                  <button key={doc.uuid} className="sb-nav" onClick={() => openPackItem(doc.uuid)}>
                    {doc.source.name}
                  </button>
                ))}
              </details>
            ))}

            <p className="sb-hint">
              Los cambios re-ejecutan la pipeline real de preparación. Estado en memoria: se pierde al
              recargar la página (no con hot reload de componentes).
            </p>
          </>
        )}
      </aside>

      <main className="sb-desktop">
        <Window
          key={active}
          title={`${actor.name} — ${active === "character" ? "Personaje" : "PNJ"}`}
          width={720}
          height={760}
        >
          {active === "character" ? (
            <CharacterSheetApp {...sheetProps} />
          ) : (
            <NpcSheetApp {...sheetProps} />
          )}
        </Window>

        {itemWindows.map((window) => {
          const item = window.item ?? window.actor?.items.get(window.itemId ?? "");
          if (!item) return null;
          return (
            <Window
              key={window.key}
              title={item.name}
              width={700}
              height={500}
              onClose={() => closeItemWindow(window.key)}
            >
              <ItemSheetApp {...buildItemProps(item)} />
            </Window>
          );
        })}
      </main>

      <ChatToasts />
    </div>
  );
}
