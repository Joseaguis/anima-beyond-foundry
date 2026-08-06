import type { ReactNode } from "react";
import { SectionCard } from "../ui/SectionCard";
import { NumberField, TextArea, DerivedValue } from "../ui/fields";
import { ItemList } from "../ui/ItemList";
import { SummonsList, type Summon } from "../ui/SummonsList";
import { ActiveSpellsList, type ActiveSpell } from "../ui/ActiveSpellsList";
import { DifficultyTable } from "../ui/DifficultyTable";
import { FREE_ACCESS_LABEL } from "../../../domains/magic/free-access.generated";
import type { TabProps } from "./types";

const ACTION_LABELS: Record<string, string> = {
  active: "Activa",
  passive: "Pasiva",
};

function sign(n: number): string {
  return n >= 0 ? `+${n}` : `${n}`;
}

/**
 * Picks which owned path a sub-path or a Libre Acceso spell attaches to. Item
 * sheets cannot do this (ItemTabProps has no `items`), so the dropdown lives
 * here — same shape as the ammo selector in WeaponBlocks.
 */
function PathSelect({
  value,
  paths,
  isEditable,
  onChange,
}: {
  value: string;
  paths: { id: string; name: string }[];
  isEditable: boolean;
  onChange: (value: string) => void;
}) {
  // A path deleted after being linked would otherwise render as "(sin vía)".
  const dangling = value && !paths.some((p) => p.id === value);
  return (
    <select
      className="a-input"
      value={dangling ? "" : value}
      disabled={!isEditable}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{dangling ? "(vía eliminada)" : "(sin vía)"}</option>
      {paths.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name}
        </option>
      ))}
    </select>
  );
}

/** Read-only derived stat: label on the left, value (with optional tooltip) on the right. */
function DerivedLine({
  label,
  value,
  tip,
  color,
}: {
  label: ReactNode;
  value: number;
  tip?: string;
  color?: "acc" | "blue" | "red";
}) {
  return (
    <div className="flex items-center justify-between py-1" style={{ borderBottom: "1px dashed #eaedf0" }}>
      <span className="text-[11.5px]" style={{ color: "#454c56" }}>{label}</span>
      <DerivedValue className={color ? `a-${color}` : ""} value={value} tip={tip} />
    </div>
  );
}

/** Editable reserve field: label on the left, NumberField on the right. */
function InputLine({
  label,
  system,
  path,
  isEditable,
  onUpdate,
  min,
}: {
  label: ReactNode;
  system: Record<string, any>;
  path: string;
  isEditable: boolean;
  onUpdate: TabProps["onUpdate"];
  min?: number;
}) {
  return (
    <div className="flex items-center justify-between py-1" style={{ borderBottom: "1px dashed #eaedf0" }}>
      <span className="text-[11.5px]" style={{ color: "#454c56" }}>{label}</span>
      <NumberField
        system={system}
        path={path}
        isEditable={isEditable}
        onUpdate={onUpdate}
        min={min}
        className="w-16!"
      />
    </div>
  );
}

const SUMMONING_SKILLS: { key: string; label: string; valueKey: string }[] = [
  { key: "summon", label: "Convocar", valueKey: "summon" },
  { key: "control", label: "Dominación", valueKey: "control" },
  { key: "bind", label: "Atadura", valueKey: "bind" },
  { key: "banish", label: "Desconvocar", valueKey: "banish" },
];

export function MisticosTab({ system, items, isEditable, onUpdate, itemOps, rollOps }: TabProps) {
  const mg = system.magic ?? {};
  const summons: Summon[] = mg.summons ?? [];
  const activeSpells: ActiveSpell[] = mg.activeSpells ?? [];
  // The eleven real paths, for the sub-path / free-access dropdowns.
  const ownPaths = items
    .filter((i: any) => i.type === "magicPath" && i.system?.subtype === "path")
    .map((i: any) => ({ id: i.id, name: i.name }));

  return (
    <div className="a-screen a-grid12">
      {/* Nivel de Magia */}
      <SectionCard title="Nivel de Magia" dot="blue" style={{ gridColumn: "span 4" }}>
        <DerivedLine
          label="Máximo"
          value={mg.magicLevelMax ?? 0}
          tip={`Nivel de Magia máximo|Innato (INT) + comprado + especial=${mg.magicLevelMax ?? 0}|=${mg.magicLevelMax ?? 0}`}
        />
        <DerivedLine
          label="Usado"
          value={mg.magicLevelUsed ?? 0}
          color="acc"
          tip={`Nivel de Magia usado|Vías (opuestas ×2)=${mg.magicLevelPaths ?? 0}|Conjuros sueltos (Tabla 60)=${mg.magicLevelSpells ?? 0}|Metamagia=${mg.metamagiaMagicLevel ?? 0}|=${mg.magicLevelUsed ?? 0}`}
        />
        <DerivedLine
          label="Disponible"
          value={mg.magicLevelAvailable ?? 0}
          color={mg.magicLevelOver ? "red" : "blue"}
        />
        <DerivedLine label="Metamagia" value={mg.metamagiaMagicLevel ?? 0} />
      </SectionCard>

      {/* Zeón */}
      <SectionCard title="Zeón" dot="acc" style={{ gridColumn: "span 4" }}>
        <DerivedLine
          label="Total"
          value={mg.zeonMax ?? 0}
          color="acc"
          tip={`Zeón máximo|Innato (POD) + comprado (×5) + por nivel + especial=${mg.zeonMax ?? 0}|=${mg.zeonMax ?? 0}`}
        />
        <InputLine label="Actual" system={system} path="magic.zeonCurrent" isEditable={isEditable} onUpdate={onUpdate} min={0} />
      </SectionCard>

      {/* Acumulación */}
      <SectionCard title="Acumulación" dot="blue" style={{ gridColumn: "span 4" }}>
        <DerivedLine
          label="Regeneración Zeónica"
          value={mg.zeonRegen ?? 0}
          tip={`Regeneración|ACT + 10×metamagia + comprado + especial=${mg.zeonRegen ?? 0}|=${mg.zeonRegen ?? 0}`}
        />
        <DerivedLine
          label="ACT"
          value={mg.act ?? 0}
          color="acc"
          tip={`Acumulación (ACT)|Innato (POD) × múltiplos=${mg.act ?? 0}|=${mg.act ?? 0}`}
        />
      </SectionCard>

      {/* Proyección Mágica */}
      <SectionCard title="Proyección Mágica" dot="acc" style={{ gridColumn: "span 6" }}>
        <DerivedLine
          label="Turno"
          value={mg.magicProjectionFinal ?? 0}
          tip={`Proyección Mágica|Base + bono DES + especial=${mg.magicProjectionFinal ?? 0}|=${mg.magicProjectionFinal ?? 0}`}
        />
        <DerivedLine
          label="Ataque"
          value={mg.magicProjectionAttack ?? 0}
          color="red"
          tip={`Proyección de Ataque|Turno ${sign(mg.offensiveImbalance ?? 0)} desequilibrio=${mg.magicProjectionAttack ?? 0}|=${mg.magicProjectionAttack ?? 0}`}
        />
        <DerivedLine
          label="Defensa"
          value={mg.magicProjectionDefense ?? 0}
          color="blue"
          tip={`Proyección de Defensa|Turno ${sign(-(mg.offensiveImbalance ?? 0))} desequilibrio=${mg.magicProjectionDefense ?? 0}|=${mg.magicProjectionDefense ?? 0}`}
        />
        <InputLine label="Desequilibrio ofensivo (±30, pasos de 10)" system={system} path="magic.offensiveImbalance" isEditable={isEditable} onUpdate={onUpdate} />
      </SectionCard>

      {/* Convocatoria (con columna Esp. como el Excel) */}
      <SectionCard title="Convocatoria" dot="blue" padded={false} className="a-zebra" style={{ gridColumn: "span 6" }}>
        <div className="a-thead" style={{ gridTemplateColumns: "1fr 72px 64px" }}>
          <div>Habilidad</div>
          <div className="text-center">Esp.</div>
          <div className="text-center">Total</div>
        </div>
        {SUMMONING_SKILLS.map((s) => (
          <div key={s.key} className="a-trow" style={{ gridTemplateColumns: "1fr 72px 64px" }}>
            <div className="px-2.5 py-0.5 text-xs">{s.label}</div>
            <div className="px-1 py-0.5">
              <NumberField
                system={system}
                path={`magic.summoning.${s.key}.special`}
                isEditable={isEditable}
                onUpdate={onUpdate}
                className="a-input--special"
              />
            </div>
            <div className="text-center text-[12px]">
              <DerivedValue
                value={mg[s.valueKey] ?? 0}
                tip={`${s.label}|PD + bono característica + especial=${mg[s.valueKey] ?? 0}|=${mg[s.valueKey] ?? 0}`}
              />
            </div>
          </div>
        ))}
      </SectionCard>

      {/* Conjuros activos / Criaturas atadas */}
      <ActiveSpellsList
        spells={activeSpells}
        upkeepRound={mg.upkeepRound ?? 0}
        upkeepDaily={mg.upkeepDaily ?? 0}
        isEditable={isEditable}
        onUpdate={onUpdate}
        style={{ gridColumn: "span 6" }}
      />

      {/* Invocaciones y Encarnaciones */}
      <SummonsList
        summons={summons}
        isEditable={isEditable}
        onUpdate={onUpdate}
        style={{ gridColumn: "span 6" }}
      />

      {/* Dificultades de referencia */}
      <DifficultyTable style={{ gridColumn: "span 6" }} />

      {/* Vías de Magia */}
      <div style={{ gridColumn: "span 6" }}>
        <ItemList
          title={`Vías de Magia · Nivel usado ${mg.magicLevelPaths ?? 0}`}
          dot="blue"
          items={items}
          type="magicPath"
          subtype="path"
          isEditable={isEditable}
          itemOps={itemOps}
          addLabel="+ Vía"
          emptyLabel="Sin vías de magia."
          columns={[
            { label: "Nivel", width: "52px", render: (i: any) => i.system?.level ?? 0 },
            { label: "Elemento", width: "1fr", render: (i: any) => i.system?.element || "—" },
            { label: "Opuesta", width: "1fr", render: (i: any) => i.system?.opposedPath || "—" },
          ]}
        />
      </div>

      {/* Sub-vías: ocupan huecos de Libre Acceso de la vía a la que se vinculan */}
      <div style={{ gridColumn: "span 6" }}>
        <ItemList
          title={`Sub-vías · Libre Acceso ${mg.freeAccessUsed ?? 0}/${mg.freeAccessSlots ?? 0}`}
          dot={(mg.freeAccessFree ?? 0) < 0 ? "red" : "blue"}
          items={items}
          type="magicPath"
          subtype="subPath"
          isEditable={isEditable}
          itemOps={itemOps}
          addLabel="+ Sub-vía"
          emptyLabel="Sin sub-vías."
          columns={[
            {
              label: "Vía",
              width: "1.2fr",
              render: (i: any) => (
                <PathSelect
                  value={i.system?.parentPathId ?? ""}
                  paths={ownPaths}
                  isEditable={isEditable}
                  onChange={(v) => itemOps.onItemUpdate(i.id, { "system.parentPathId": v })}
                />
              ),
            },
          ]}
        />
      </div>

      {/* Conjuros */}
      <ItemList
        title="Conjuros"
        dot="acc"
        items={items}
        type="spell"
        isEditable={isEditable}
        itemOps={itemOps}
        addLabel="+ Conjuro"
        emptyLabel="Sin conjuros."
        style={{ gridColumn: "span 6" }}
        // Pulsar el nombre tira la proyección mágica de ese conjuro. Los
        // conjuros de efecto no la necesitan (Core p. 116).
        rollSlugFor={(i: any) => (i.system?.spellType === "effect" ? undefined : `cast.${i.id}`)}
        rollOps={rollOps}
        columns={[
          { label: "Nivel", width: "52px", render: (i: any) => i.system?.spellLevel ?? 0 },
          { label: "Zeón", width: "56px", render: (i: any) => i.system?.grades?.base?.zeonCost ?? 0 },
          { label: "Acción", width: "64px", render: (i: any) => ACTION_LABELS[i.system?.actionType] ?? "—" },
          {
            // Solo los de Libre Acceso ocupan un hueco y necesitan elegir vía.
            label: "Vía",
            width: "1.2fr",
            render: (i: any) =>
              i.system?.magicPath === FREE_ACCESS_LABEL ? (
                <PathSelect
                  value={i.system?.hostPathId ?? ""}
                  paths={ownPaths}
                  isEditable={isEditable}
                  onChange={(v) => itemOps.onItemUpdate(i.id, { "system.hostPathId": v })}
                />
              ) : (
                i.system?.magicPath || "—"
              ),
          },
        ]}
      />

      {/* Avisos de huecos, vías cerradas y sub-vías mal vinculadas */}
      {(mg.warnings?.length ?? 0) > 0 && (
        <div
          className="a-card px-3 py-2 text-[11.5px]"
          style={{ gridColumn: "span 12", borderLeft: "3px solid var(--red)" }}
        >
          {mg.warnings.map((w: string) => (
            <div key={w}>⚠ {w}</div>
          ))}
        </div>
      )}

      {/* Notas Místicos */}
      <SectionCard title="Notas Místicos" padded={false} style={{ gridColumn: "span 12" }}>
        <TextArea
          system={system}
          path="magicNotes"
          isEditable={isEditable}
          onUpdate={onUpdate}
          style={{ minHeight: 72 }}
        />
      </SectionCard>
    </div>
  );
}
