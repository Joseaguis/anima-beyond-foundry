import { useEffect, useMemo, useState } from "react";
import { SectionCard } from "../ui/SectionCard";
import { DerivedValue, NumberField, StatCard, TextArea, CheckboxField } from "../ui/fields";
import { ItemList } from "../ui/ItemList";
import { PowerTree } from "../ui/PowerTree";
import { TechniqueList } from "../ui/TechniqueList";
import type { CompendiumEntry } from "../../../sheets/ReactSheet";
import type { TabProps } from "./types";

// Display order from the design doc (§5), mapped to the model keys.
const KI_CHARS: { label: string; key: string }[] = [
  { label: "AGI", key: "agi" },
  { label: "CON", key: "con" },
  { label: "DES", key: "dex" },
  { label: "FUE", key: "str" },
  { label: "POD", key: "pow" },
  { label: "VOL", key: "wp" },
];

const KI_GRID = "48px 1fr 1fr 1fr 1fr 1fr";
const KI_SKILL_GRID = "1fr 64px 64px 64px";

export function KiTab({ system, items, isEditable, onUpdate, itemOps }: TabProps) {
  const ki = system.ki ?? {};
  const perChar: Record<string, any> = ki.perChar ?? {};

  // Full Ki/Némesis tree loaded from the compendium (async).
  const [tree, setTree] = useState<CompendiumEntry[] | null>(null);
  useEffect(() => {
    let alive = true;
    itemOps.getCompendiumItems("kiAbility").then((list) => {
      if (alive) setTree(list);
    });
    return () => {
      alive = false;
    };
  }, [itemOps]);

  const kiNodes = useMemo(
    () => (tree ?? []).filter((n) => n.subtype === "kiPower"),
    [tree],
  );
  const nemesisNodes = useMemo(
    () => (tree ?? []).filter((n) => n.subtype === "nemesisPower"),
    [tree],
  );

  // Acquired node name -> embedded item id, per subtype.
  const ownedBySubtype = useMemo(() => {
    const kiOwned: Record<string, string> = {};
    const nemOwned: Record<string, string> = {};
    for (const i of items) {
      if (i.type !== "kiAbility") continue;
      if (i.system?.subtype === "nemesisPower") nemOwned[i.name] = i.id;
      else if (i.system?.subtype === "kiPower") kiOwned[i.name] = i.id;
    }
    return { kiOwned, nemOwned };
  }, [items]);

  return (
    <div className="a-screen a-grid12">
      {/* Puntos de Ki por característica */}
      <SectionCard
        title="Puntos de Ki"
        padded={false}
        className="a-zebra"
        style={{ gridColumn: "span 8" }}
        right={
          <label className="flex items-center gap-1.5 normal-case cursor-pointer">
            Unificación
            <CheckboxField
              system={system}
              path="ki.unified"
              isEditable={isEditable}
              onUpdate={onUpdate}
            />
          </label>
        }
      >
        <div className="a-thead" style={{ gridTemplateColumns: KI_GRID }}>
          <div />
          <div className="text-center">Valor</div>
          <div className="text-center">Ki</div>
          <div className="text-center">Acum.</div>
          <div className="text-center">Mitad</div>
          <div className="text-center">Actual</div>
        </div>
        {KI_CHARS.map(({ label, key }) => {
          const b = perChar[key] ?? {};
          const acc = b.accTotal ?? 0;
          return (
            <div key={key} className="a-trow" style={{ gridTemplateColumns: KI_GRID }}>
              <div className="px-2 py-0.5 font-bold text-xs">{label}</div>
              <div className="text-center text-[13px]">{b.value ?? 0}</div>
              <div className="text-center text-[13px]">
                <DerivedValue
                  value={b.pointsTotal ?? 0}
                  tip={`Puntos de Ki (${label})|Innato=${b.pointsInnate ?? 0}|Comprado=${b.pointsBought ?? 0}|=${b.pointsTotal ?? 0}`}
                />
              </div>
              <div className="text-center text-[13px]">
                <DerivedValue
                  value={acc}
                  tip={`Acumulación (${label})|Innata=${b.accInnate ?? 0}|Comprada=${b.accBought ?? 0}|=${acc}`}
                />
              </div>
              {/* Mitad = concentración (acumulación ÷ 2). */}
              <div className="text-center text-[13px] a-muted">{Math.floor(acc / 2)}</div>
              {/* Actual: registro de juego (sin runtime de gasto todavía). */}
              <div className="px-1 py-0.5">
                <NumberField
                  system={system}
                  path={`ki.current.${key}`}
                  isEditable={isEditable}
                  onUpdate={onUpdate}
                  min={0}
                />
              </div>
            </div>
          );
        })}
        <div className="a-tfoot" style={{ gridTemplateColumns: KI_GRID }}>
          <div className="px-2 py-1 font-bold text-xs">Total</div>
          <div />
          <div className="px-1.5 py-1 text-center font-semibold">
            <DerivedValue
              value={ki.totalPoints ?? 0}
              tip={`Puntos de Ki totales|Innato=${ki.pointsInnate ?? 0}|Comprado=${ki.pointsBought ?? 0}|=${ki.totalPoints ?? 0}`}
            />
          </div>
          <div className="px-1.5 py-1 text-center font-semibold">
            <DerivedValue
              value={ki.accumulation ?? 0}
              tip={`Acumulación total|Innata=${ki.accInnate ?? 0}|Comprada=${ki.accBought ?? 0}|=${ki.accumulation ?? 0}`}
            />
          </div>
          <div className="px-1.5 py-1 text-center a-muted">{Math.floor((ki.accumulation ?? 0) / 2)}</div>
          <div className="px-1.5 py-1 text-center font-semibold">
            {KI_CHARS.reduce((sum, c) => sum + (system.ki?.current?.[c.key] ?? 0), 0)}
          </div>
        </div>
      </SectionCard>

      {/* Conocimiento Marcial (CM) */}
      <div className="flex flex-col gap-3" style={{ gridColumn: "span 4" }}>
        <StatCard
          label="CM Total"
          value={ki.cmTotal ?? 0}
          tip={`Conocimiento Marcial total|=${ki.cmTotal ?? 0}`}
        />
        <StatCard label="CM Usado" value={ki.cmUsed ?? 0} />
        <StatCard
          label="CM Disponible"
          value={ki.cmAvailable ?? 0}
          color={ki.cmOver ? "red" : undefined}
          sub={ki.cmOver ? "excedido" : undefined}
          tip={`CM disponible|Total=${ki.cmTotal ?? 0}|Usado=${ki.cmUsed ?? 0}|=${ki.cmAvailable ?? 0}`}
        />
      </div>

      {/* Habilidades del Ki (Detección / Ocultación) */}
      <SectionCard title="Habilidades del Ki" padded={false} className="a-zebra" style={{ gridColumn: "span 4" }}>
        <div className="a-thead" style={{ gridTemplateColumns: KI_SKILL_GRID }}>
          <div>Habilidad</div>
          <div className="text-center">Base</div>
          <div className="text-center">Esp.</div>
          <div className="text-center">Total</div>
        </div>
        {(
          [
            { key: "detection", label: "Detección del Ki" },
            { key: "concealment", label: "Ocultación del Ki" },
          ] as const
        ).map(({ key, label }) => {
          const skill = system.ki?.[key] ?? {};
          return (
            <div key={key} className="a-trow" style={{ gridTemplateColumns: KI_SKILL_GRID }}>
              <div className="px-2.5 py-0.5 text-xs">{label}</div>
              <div className="px-1 py-0.5">
                <NumberField
                  system={system}
                  path={`ki.${key}.base`}
                  isEditable={isEditable}
                  onUpdate={onUpdate}
                />
              </div>
              <div className="px-1 py-0.5">
                <NumberField
                  system={system}
                  path={`ki.${key}.special`}
                  isEditable={isEditable}
                  onUpdate={onUpdate}
                  className="a-input--special"
                />
              </div>
              <div className="text-center text-[12px]">
                <DerivedValue
                  value={(skill.base ?? 0) + (skill.special ?? 0)}
                  tip={`${label}|Base=${skill.base ?? 0}|Especial=${skill.special ?? 0}|=${(skill.base ?? 0) + (skill.special ?? 0)}`}
                />
              </div>
            </div>
          );
        })}
      </SectionCard>

      {/* Sellos del Dragón */}
      <SectionCard title="Sellos del Dragón" padded={false} style={{ gridColumn: "span 4" }}>
        <TextArea
          system={system}
          path="ki.dragonSeals"
          isEditable={isEditable}
          onUpdate={onUpdate}
          style={{ minHeight: 72 }}
        />
      </SectionCard>

      {/* Límite */}
      <SectionCard title="Límite" style={{ gridColumn: "span 4" }}>
        <div className="flex items-center justify-between">
          <span className="text-[11.5px]" style={{ color: "#454c56" }}>
            Límites libres
          </span>
          <NumberField
            system={system}
            path="ki.freeLimits"
            isEditable={isEditable}
            onUpdate={onUpdate}
            min={0}
            className="w-12!"
          />
        </div>
      </SectionCard>

      {/* Árbol de Dominios del Ki */}
      <PowerTree
        title="Uso del Ki (Dominios)"
        dot="acc"
        nodes={kiNodes}
        ownedIds={ownedBySubtype.kiOwned}
        isEditable={isEditable}
        loading={tree === null}
        onAcquire={(uuid) => itemOps.onItemAddFromCompendium(uuid)}
        onRelease={(id) => itemOps.onItemDelete(id)}
        style={{ gridColumn: "span 6" }}
      />

      {/* Árbol de Némesis */}
      <PowerTree
        title="Uso del Némesis"
        dot="red"
        nodes={nemesisNodes}
        ownedIds={ownedBySubtype.nemOwned}
        isEditable={isEditable}
        loading={tree === null}
        onAcquire={(uuid) => itemOps.onItemAddFromCompendium(uuid)}
        onRelease={(id) => itemOps.onItemDelete(id)}
        style={{ gridColumn: "span 6" }}
      />

      {/* Técnicas de Ki (Dominus Exxet cap. 5), agrupadas por Árbol de Técnicas. */}
      <TechniqueList items={items} isEditable={isEditable} itemOps={itemOps} />

      {/* Notas Ki */}
      <SectionCard title="Notas Ki" padded={false} style={{ gridColumn: "span 12" }}>
        <TextArea
          system={system}
          path="kiNotes"
          isEditable={isEditable}
          onUpdate={onUpdate}
          style={{ minHeight: 72 }}
        />
      </SectionCard>
    </div>
  );
}
