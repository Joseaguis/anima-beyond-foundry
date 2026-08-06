import { SectionCard } from "../ui/SectionCard";
import { NumberField, TextField, TextArea, DerivedValue } from "../ui/fields";
import { ItemList } from "../ui/ItemList";
import { SideLabelTable } from "../ui/SideLabelTable";
import { SecondarySkillsTable } from "../ui/SecondarySkillsTable";
import { BreakdownRow } from "../ui/BreakdownRow";
import { Rollable } from "../ui/Rollable";
import type { TabProps } from "./types";

const TRAIT_SUBTYPE_LABELS: Record<string, string> = {
  advantage: "Ventaja",
  disadvantage: "Desventaja",
};

// Display order from the Excel sheet with the model key each maps to.
const CHARS: { label: string; key: string }[] = [
  { label: "AGI", key: "agi" },
  { label: "CON", key: "con" },
  { label: "DES", key: "dex" },
  { label: "FUE", key: "str" },
  { label: "INT", key: "int" },
  { label: "PER", key: "per" },
  { label: "POD", key: "pow" },
  { label: "VOL", key: "wp" },
];

const RES: { k: string; key: string; name: string; charKey: string; charLabel: string }[] = [
  { k: "RF", key: "rf", name: "Física", charKey: "con", charLabel: "CON" },
  { k: "RE", key: "re", name: "Enfermedad", charKey: "con", charLabel: "CON" },
  { k: "RV", key: "rv", name: "Veneno", charKey: "con", charLabel: "CON" },
  { k: "RM", key: "rm", name: "Mágica", charKey: "pow", charLabel: "POD" },
  { k: "RP", key: "rp", name: "Psíquica", charKey: "wp", charLabel: "VOL" },
];

const CHAR_GRID = "44px 1fr 1fr 1fr 1fr";
const RES_GRID = "76px 1fr 1fr 1fr 1fr";

function sign(n: number): string {
  return n >= 0 ? `+${n}` : `${n}`;
}

/** Inline "Esp." editor used by the vitals cards (regen, movimiento, cansancio…). */
function SpecialInline({
  system,
  path,
  isEditable,
  onUpdate,
}: {
  system: Record<string, any>;
  path: string;
  isEditable: boolean;
  onUpdate: TabProps["onUpdate"];
}) {
  return (
    <div className="flex items-center justify-between gap-2 pt-1" style={{ borderTop: "1px dashed #d5d9df" }}>
      <span className="a-flabel">Esp.</span>
      <NumberField
        system={system}
        path={path}
        isEditable={isEditable}
        onUpdate={onUpdate}
        className="w-14! h-[22px]! text-[11.5px]! a-input--special"
        placeholder="+0"
      />
    </div>
  );
}

export function PrincipalTab({ system, items, isEditable, onUpdate, itemOps, rollOps }: TabProps) {
  const lp = system.lifePoints ?? {};
  const fatigue = system.fatigue ?? {};
  const init = system.initiative ?? {};
  const res = system.resistances ?? {};
  const regen = system.regeneration ?? {};
  const movement = system.movement ?? {};
  const combat = system.combat ?? {};
  const equipment = system.equipment ?? {};
  const presence = system.presence ?? 0;
  const cp = system.creationPoints ?? {};

  // Modificadores globales: el desglose lo publica prepareCombat (incluye los
  // manuales inyectados en synthetics); la armadura penaliza acciones físicas
  // aparte (la aplica prepareEquipment sobre los finales).
  const amb = combat.actionModBreakdown ?? {};
  const manualAll = system.modifiers?.allActions ?? 0;
  const manualPhysical = system.modifiers?.physicalActions ?? 0;
  const otherEffects =
    ((amb.allActions ?? 0) - manualAll) + ((amb.physicalActions ?? 0) - manualPhysical);
  const armorPhysical = equipment.physicalActionPenalty ?? 0;
  const modTotal =
    (amb.allActions ?? 0) + (amb.physicalActions ?? 0) + (amb.fatigue ?? 0) + armorPhysical;

  const dexAgi = (system.dex?.final ?? 0) + (system.agi?.final ?? 0);

  // PC gastados/ganados en rasgos, para el pie de Puntos de Creación.
  const traits = items.filter((i: any) => i.type === "trait");
  const advantageCp = traits
    .filter((i: any) => i.system?.subtype === "advantage")
    .reduce((sum: number, i: any) => sum + (i.system?.cpCost ?? 0), 0);
  const disadvantageCp = traits
    .filter((i: any) => i.system?.subtype === "disadvantage")
    .reduce((sum: number, i: any) => sum + (i.system?.cpCost ?? 0), 0);

  const regenTip = `Regeneración|Natural (CON)=${regen.natural ?? 0}|Esp.=${sign(regen.special ?? 0)}|=${regen.final ?? 0}`;
  const movementTip = `Movimiento|AGI=${system.agi?.final ?? 0}|Esp.=${sign(movement.special ?? 0)}|Pen. armadura=−${equipment.movementPenalty ?? 0}|=${movement.final ?? 0}`;
  const turnTip = `Turno|Base=${init.base ?? 0}|AGI·DES=${sign(init.charPart ?? 0)}|Cat=${sign(init.catPart ?? 0)}|Armadura=${sign(init.armorPart ?? 0)}|Arma=${sign(init.weaponPart ?? 0)}|Esp.=${sign(init.special ?? 0)}|=${init.final ?? 0}`;

  return (
    <div className="a-screen a-grid12">
      {/* Columna principal (izquierda, como la hoja Principal del Excel) */}
      <div className="flex flex-col gap-3" style={{ gridColumn: "span 8" }}>
        {/* Fila 1 del Excel: Características | Regen+Mov | PV+Cansancio */}
        <div className="grid gap-3" style={{ gridTemplateColumns: "1.5fr 1fr 1fr" }}>
          {/* Características */}
          <SideLabelTable label="Características">
            <div className="a-thead" style={{ gridTemplateColumns: CHAR_GRID }}>
              <div />
              <div className="text-center">Base</div>
              <div className="text-center">Temp.</div>
              <div className="text-center">Total</div>
              <div className="text-center">Bono</div>
            </div>
            {CHARS.map(({ label, key }) => {
              const c = system[key] ?? {};
              return (
                <div key={key} className="a-trow" style={{ gridTemplateColumns: CHAR_GRID }}>
                  <div className="px-2 py-0.5 font-bold text-xs">
                    <Rollable
                      slug={`characteristic.${key}`}
                      onRoll={rollOps?.onRoll}
                      rollable={rollOps?.rollable}
                      title={`Control de ${label} (1D10)`}
                    >
                      {label}
                    </Rollable>
                  </div>
                  <div className="px-1 py-0.5">
                    <NumberField
                      system={system}
                      path={`${key}.base`}
                      isEditable={isEditable}
                      onUpdate={onUpdate}
                      min={1}
                    />
                  </div>
                  <div className="px-1 py-0.5">
                    <NumberField
                      system={system}
                      path={`${key}.bonus`}
                      isEditable={isEditable}
                      onUpdate={onUpdate}
                    />
                  </div>
                  <div className="text-center text-[13px]">
                    <DerivedValue
                      value={c.final ?? 0}
                      tip={`${label} total|Base=${c.base ?? 0}|Temporal=${c.bonus ?? 0}|=${c.final ?? 0}`}
                    />
                  </div>
                  <div className="text-center font-semibold text-[12px]">{sign(c.mod ?? 0)}</div>
                </div>
              );
            })}
          </SideLabelTable>

          {/* Columna central del Excel: Regeneración + Movimiento */}
          <div className="flex flex-col gap-3">
            <SectionCard title="Regeneración">
              <div className="flex items-center justify-between gap-2">
                <DerivedValue className="text-[22px]" value={regen.final ?? 0} tip={regenTip} />
                <div className="text-right leading-tight">
                  <div className="text-[11px] font-semibold">{regen.amountText ?? "—"}</div>
                  <div className="text-[10px] a-muted">{regen.removalText ?? "—"}</div>
                </div>
              </div>
              <SpecialInline
                system={system}
                path="regeneration.special"
                isEditable={isEditable}
                onUpdate={onUpdate}
              />
            </SectionCard>
            <SectionCard title="Movimiento">
              <div className="flex items-center justify-between gap-2">
                <DerivedValue className="text-[22px]" value={movement.final ?? 0} tip={movementTip} />
                <div className="text-right leading-tight">
                  <div className="text-[11px] font-semibold">{movement.speedText ?? "—"}</div>
                  <div className="text-[10px] a-muted">Pen: {equipment.movementPenalty ?? 0}</div>
                </div>
              </div>
              <SpecialInline
                system={system}
                path="movement.special"
                isEditable={isEditable}
                onUpdate={onUpdate}
              />
            </SectionCard>
          </div>

          {/* Columna derecha del Excel: Puntos de Vida + Cansancio */}
          <div className="flex flex-col gap-3">
            <SectionCard title="Puntos de Vida">
              <div className="flex items-center gap-2">
                <NumberField
                  system={system}
                  path="lifePoints.current"
                  isEditable={isEditable}
                  onUpdate={onUpdate}
                  className="w-16! h-[30px]! text-[16px]! font-bold"
                />
                <span className="a-muted text-sm">/</span>
                <DerivedValue
                  className="text-[22px] px-2"
                  value={lp.max ?? 0}
                  tip={`Vida Máxima|Base CON + multiplicadores=${lp.max ?? 0}|=${lp.max ?? 0}`}
                />
              </div>
            </SectionCard>
            <SectionCard title="Cansancio">
              <div className="flex items-center gap-2">
                <NumberField
                  system={system}
                  path="fatigue.current"
                  isEditable={isEditable}
                  onUpdate={onUpdate}
                  className="w-16! h-[30px]! text-[16px]! font-bold"
                />
                <span className="a-muted text-sm">/</span>
                <DerivedValue
                  className="text-[22px] px-2"
                  value={fatigue.max ?? 0}
                  tip={`Cansancio|CON=${system.con?.final ?? 0}|Esp.=${sign(fatigue.special ?? 0)}|=${fatigue.max ?? 0}`}
                />
              </div>
              <SpecialInline
                system={system}
                path="fatigue.special"
                isEditable={isEditable}
                onUpdate={onUpdate}
              />
            </SectionCard>
          </div>
        </div>

        {/* Banda "Regeneración especial": reglas extra de la Tabla 19/20 */}
        <div className="a-card">
          <div className="flex items-stretch">
            <div
              className="flex items-center px-3 text-[10px] font-semibold uppercase whitespace-nowrap"
              style={{ background: "var(--hdr)", color: "#eef0f2", letterSpacing: "0.05em" }}
            >
              Regeneración especial
            </div>
            <div className="flex-1 px-2.5 py-1.5 text-[11.5px] leading-snug">
              {regen.specialText || "—"}
              {system.specialRegeneration ? (
                <span className="a-muted"> · Notas: {system.specialRegeneration}</span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Turno: solo total (desglose en tooltip) + Esp. editable */}
          <SectionCard title="Turno" padded={false}>
            <div
              className="flex items-center justify-between px-2.5 py-1.5"
              style={{ background: "#eef1f5" }}
            >
              <span className="text-[11px] font-bold uppercase">Total</span>
              <DerivedValue className="text-[20px]" value={init.final ?? 0} tip={turnTip} />
            </div>
            <div className="flex items-center justify-between gap-2 px-2.5 py-1.5">
              <span className="a-flabel">Esp.</span>
              <NumberField
                system={system}
                path="initiative.special"
                isEditable={isEditable}
                onUpdate={onUpdate}
                className="w-14! h-[22px]! text-[11.5px]! a-input--special"
                placeholder="+0"
              />
            </div>
          </SectionCard>

          {/* Habilidades de Combate (como la hoja Principal del Excel) */}
          <SectionCard title="Habilidades de Combate" padded={false}>
            <BreakdownRow
              label="H. Ataque"
              value={
                <DerivedValue
                  value={combat.attack?.final ?? 0}
                  tip={`H. Ataque|Base=${combat.attack?.base ?? 0}|Cat.=${sign(combat.attack?.catBonus ?? 0)}|Esp.=${sign(combat.attack?.special ?? 0)}|Modificadores=${sign(modTotal)}|=${combat.attack?.final ?? 0}`}
                />
              }
            />
            <BreakdownRow
              label="H. Parada"
              value={
                <DerivedValue
                  value={combat.parry?.final ?? 0}
                  tip={`H. Parada|Base=${combat.parry?.base ?? 0}|Cat.=${sign(combat.parry?.catBonus ?? 0)}|Esp.=${sign(combat.parry?.special ?? 0)}|Modificadores=${sign(modTotal)}|=${combat.parry?.final ?? 0}`}
                />
              }
            />
            <BreakdownRow
              label="H. Esquiva"
              value={
                <DerivedValue
                  value={combat.dodge?.final ?? 0}
                  tip={`H. Esquiva|Base=${combat.dodge?.base ?? 0}|Cat.=${sign(combat.dodge?.catBonus ?? 0)}|Esp.=${sign(combat.dodge?.special ?? 0)}|Modificadores=${sign(modTotal)}|=${combat.dodge?.final ?? 0}`}
                />
              }
            />
            <BreakdownRow label="Ll. Armadura" value={combat.wearArmor?.final ?? 0} />
            <BreakdownRow
              label="Modificadores"
              value={
                <DerivedValue
                  value={sign(modTotal)}
                  tip={`Modificadores|A toda acción=${sign(manualAll)}|A acc. físicas=${sign(manualPhysical)}|Cansancio=${sign(amb.fatigue ?? 0)}|Armadura (físicas)=${sign(armorPhysical)}|Otros efectos=${sign(otherEffects)}|=${sign(modTotal)}`}
                  className={modTotal < 0 ? "a-red" : ""}
                />
              }
              red={modTotal < 0}
            />
            <div className="flex items-center justify-between gap-2 px-2.5 py-1">
              <span className="text-[11.5px]" style={{ color: "#454c56" }}>
                A toda acción
              </span>
              <NumberField
                system={system}
                path="modifiers.allActions"
                isEditable={isEditable}
                onUpdate={onUpdate}
                className="w-14! h-[22px]! text-[11.5px]! a-input--special"
                placeholder="+0"
              />
            </div>
            <div className="flex items-center justify-between gap-2 px-2.5 py-1">
              <span className="text-[11.5px]" style={{ color: "#454c56" }}>
                A acciones físicas
              </span>
              <NumberField
                system={system}
                path="modifiers.physicalActions"
                isEditable={isEditable}
                onUpdate={onUpdate}
                className="w-14! h-[22px]! text-[11.5px]! a-input--special"
                placeholder="+0"
              />
            </div>
            <div
              className="flex items-center justify-between gap-2 px-2.5 py-1"
              style={{ borderTop: "1px dashed #d5d9df" }}
            >
              <span className="text-[11.5px]" style={{ color: "#454c56" }}>
                Acciones por turno
              </span>
              <DerivedValue
                value={combat.actionsPerTurn ?? 1}
                tip={`Acciones por turno (Tabla 37)|DES + AGI=${dexAgi}|=${combat.actionsPerTurn ?? 1}`}
              />
            </div>
          </SectionCard>
        </div>

        {/* Puntos de Creación (ancho completo, con pie estilo Excel) */}
        <SectionCard title="Puntos de Creación" padded={false}>
          <BreakdownRow label="Totales" value={cp.total ?? 0} />
          <BreakdownRow label="Gastados" value={cp.spent ?? 0} red={(cp.spent ?? 0) > (cp.total ?? 0)} />
          <BreakdownRow label="Disponibles" value={cp.remaining ?? (cp.total ?? 0) - (cp.spent ?? 0)} />
          <div
            className="grid grid-cols-3 text-center"
            style={{ borderTop: "1px solid var(--bd)", background: "#e4e8ee" }}
          >
            <div className="py-1">
              <div className="a-flabel">Ventajas (PC)</div>
              <div className="text-[13px] font-bold">{advantageCp}</div>
            </div>
            <div className="py-1" style={{ borderLeft: "1px solid var(--bd)" }}>
              <div className="a-flabel">PCs liberalizados</div>
              <div className="text-[13px] font-bold a-muted">—</div>
            </div>
            <div className="py-1" style={{ borderLeft: "1px solid var(--bd)" }}>
              <div className="a-flabel">Desventajas (PC)</div>
              <div className="text-[13px] font-bold">{disadvantageCp}</div>
            </div>
          </div>
        </SectionCard>

        {/* Resistencias (Base | Bono | Esp. | Total, como en el Excel) */}
        <SideLabelTable label="Resistencias">
          <div className="a-thead" style={{ gridTemplateColumns: RES_GRID }}>
            <div />
            <div className="text-center">Base</div>
            <div className="text-center">Bono</div>
            <div className="text-center">Esp.</div>
            <div className="text-center">Total</div>
          </div>
          <div className="a-trow" style={{ gridTemplateColumns: RES_GRID }}>
            <div className="px-2 py-0.5 font-bold text-xs">Pres. Base</div>
            <div className="text-center text-[12px]">{presence}</div>
            <div className="text-center text-[12px] a-muted">—</div>
            <div className="text-center text-[12px] a-muted">—</div>
            <div className="text-center text-[12px]">
              <DerivedValue value={presence} tip={`Presencia|Por nivel=${presence}|=${presence}`} />
            </div>
          </div>
          {RES.map((r) => {
            const charMod = system[r.charKey]?.mod ?? 0;
            const rd = res[r.key] ?? {};
            return (
              <div key={r.key} className="a-trow" style={{ gridTemplateColumns: RES_GRID }}>
                <div className="px-2 py-0.5 font-bold text-xs" title={r.name}>
                  <Rollable
                    slug={`resistance.${r.key}`}
                    onRoll={rollOps?.onRoll}
                    rollable={rollOps?.rollable}
                    title={`Control de ${r.name}`}
                  >
                    {r.k}
                  </Rollable>
                </div>
                <div className="text-center text-[12px]">{presence}</div>
                <div className="text-center text-[12px] font-semibold">{sign(charMod)}</div>
                <div className="px-1 py-0.5">
                  <NumberField
                    system={system}
                    path={`resistances.${r.key}.special`}
                    isEditable={isEditable}
                    onUpdate={onUpdate}
                    className="h-[22px]! text-[11.5px]! a-input--special"
                    placeholder="+0"
                  />
                </div>
                <div className="text-center text-[12px]">
                  <DerivedValue
                    value={rd.total ?? 0}
                    tip={`Resistencia ${r.name}|Presencia=${presence}|Mod ${r.charLabel}=${sign(charMod)}|Esp.=${sign(rd.special ?? 0)}|=${rd.total ?? 0}`}
                  />
                </div>
              </div>
            );
          })}
          <div className="flex items-center gap-2 px-2 py-1" style={{ borderTop: "1px solid var(--bd)" }}>
            <span className="a-flabel whitespace-nowrap">Esp:</span>
            <TextField
              system={system}
              path="resistances.notes"
              isEditable={isEditable}
              onUpdate={onUpdate}
              placeholder="Notas sobre resistencias…"
            />
          </div>
        </SideLabelTable>

        {/* Notas Principal + Puntos de Destino (pie, como en el Excel) */}
        <SectionCard title="Notas Principal" padded={false}>
          <TextArea
            system={system}
            path="notes"
            isEditable={isEditable}
            onUpdate={onUpdate}
            style={{ minHeight: 80 }}
          />
          <div
            className="flex items-center justify-between gap-2 px-2.5 py-1.5"
            style={{ borderTop: "1px solid var(--bd)" }}
          >
            <div className="flex items-center gap-2">
              <span className="a-flabel">Puntos de Destino</span>
              <NumberField
                system={system}
                path="destinyPoints"
                isEditable={isEditable}
                onUpdate={onUpdate}
                min={0}
                className="w-12!"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="a-flabel">Usados</span>
              <NumberField
                system={system}
                path="destinyPointsUsed"
                isEditable={isEditable}
                onUpdate={onUpdate}
                min={0}
                className="w-12!"
              />
            </div>
          </div>
        </SectionCard>

        {/* Ventajas y desventajas (los Legados de Sangre son rasgos y van aquí) */}
        <ItemList
          title="Ventajas y Desventajas"
          items={items}
          type="trait"
          isEditable={isEditable}
          itemOps={itemOps}
          addLabel="+ Rasgo"
          emptyLabel="Sin ventajas ni desventajas."
          columns={[
            { label: "Tipo", width: "92px", render: (i: any) => TRAIT_SUBTYPE_LABELS[i.system?.subtype] ?? i.system?.subtype ?? "—" },
            { label: "PC", width: "52px", render: (i: any) => i.system?.cpCost ?? 0 },
          ]}
        />
      </div>

      {/* Columna derecha: Habilidades Secundarias (como en el Excel) */}
      <SecondarySkillsTable
        system={system}
        style={{ gridColumn: "span 4" }}
        onRoll={rollOps?.onRoll}
        rollable={rollOps?.rollable}
      />
    </div>
  );
}
