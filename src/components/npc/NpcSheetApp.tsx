import type { ReactSheetProps } from "../../sheets/ReactSheet";
import { VitalsStrip } from "../character/VitalsStrip";
import { SectionCard } from "../character/ui/SectionCard";
import { NumberField, TextArea, TextField, DerivedValue, Field, StatCard } from "../character/ui/fields";
import { ItemList } from "../character/ui/ItemList";

const CHARACTERISTICS = [
  { key: "str", label: "FUE" },
  { key: "dex", label: "DES" },
  { key: "agi", label: "AGI" },
  { key: "con", label: "CON" },
  { key: "int", label: "INT" },
  { key: "pow", label: "POD" },
  { key: "wp", label: "VOL" },
  { key: "per", label: "PER" },
];

const COMBAT_SKILLS = [
  { key: "attack", label: "H. Ataque" },
  { key: "parry", label: "Parada" },
  { key: "dodge", label: "Esquiva" },
  { key: "wearArmor", label: "Llevar Armadura" },
];

const RESISTANCES = [
  { key: "rf", label: "RF" },
  { key: "rm", label: "RM" },
  { key: "rp", label: "RP" },
  { key: "rv", label: "RV" },
  { key: "re", label: "RE" },
];

function sign(n: number): string {
  return n >= 0 ? `+${n}` : `${n}`;
}

/**
 * Minimal NPC sheet: direct-entry stat block (characteristics, vitals, combat)
 * plus the items whose rule elements feed the derived values.
 */
export function NpcSheetApp(props: ReactSheetProps) {
  const { actor, system, items, isEditable, onUpdate } = props;
  const itemOps = {
    onItemCreate: props.onItemCreate,
    onItemEdit: props.onItemEdit,
    onItemUpdate: props.onItemUpdate,
    onItemDelete: props.onItemDelete,
    getCompendiumItems: props.getCompendiumItems,
    onItemAddFromCompendium: props.onItemAddFromCompendium,
  };

  const res = system.resistances ?? {};
  const cb = system.combat ?? {};

  return (
    <div className="anima-sheet">
      <VitalsStrip actor={actor} system={system} />
      <section className="a-panels scl">
        <div className="a-screen flex flex-col gap-3">
          {/* Headline */}
          <div className="grid grid-cols-4 gap-3">
            <StatCard
              label="Presencia"
              value={system.presence ?? 0}
              tip={`Presencia|Base=${system.presenceBase ?? 0}|=${system.presence ?? 0}`}
            />
            <StatCard
              label="Movimiento"
              value={system.movement?.final ?? 0}
              sub={system.movement?.speedText}
            />
            <StatCard label="Tamaño" value={system.size ?? 0} />
            <StatCard
              label="Regeneración"
              value={system.regeneration?.final ?? 0}
              sub={system.regeneration?.amountText}
            />
          </div>

          {/* Características */}
          <SectionCard title="Características" dot="acc">
            <div className="grid grid-cols-8 gap-2">
              {CHARACTERISTICS.map((c) => {
                const char = system[c.key] ?? {};
                return (
                  <div key={c.key} className="flex flex-col items-center gap-1">
                    <span className="a-flabel">{c.label}</span>
                    <NumberField
                      system={system}
                      path={`${c.key}.base`}
                      isEditable={isEditable}
                      onUpdate={onUpdate}
                      min={1}
                    />
                    <DerivedValue
                      value={`${char.final ?? 0} (${sign(char.mod ?? 0)})`}
                      tip={`${c.label}|Base=${char.base ?? 0}|Bono=${sign(char.bonus ?? 0)}|=${char.final ?? 0} (${sign(char.mod ?? 0)})`}
                    />
                  </div>
                );
              })}
            </div>
          </SectionCard>

          {/* Vitales + resistencias */}
          <div className="a-grid12">
            <SectionCard title="Vitales" dot="red" style={{ gridColumn: "span 6" }}>
              <div className="grid grid-cols-3 gap-2">
                <Field label="PV actuales">
                  <NumberField system={system} path="lifePoints.current" isEditable={isEditable} onUpdate={onUpdate} />
                </Field>
                <Field label="PV máximos">
                  <NumberField system={system} path="lifePoints.max" isEditable={isEditable} onUpdate={onUpdate} />
                </Field>
                <Field label="Presencia base">
                  <NumberField system={system} path="presenceBase" isEditable={isEditable} onUpdate={onUpdate} min={0} />
                </Field>
                <Field label="Iniciativa base">
                  <NumberField system={system} path="initiative.base" isEditable={isEditable} onUpdate={onUpdate} />
                </Field>
                <Field label="Nivel">
                  <NumberField system={system} path="level" isEditable={isEditable} onUpdate={onUpdate} min={0} />
                </Field>
                <Field label="Nivel de amenaza">
                  <NumberField system={system} path="threatLevel" isEditable={isEditable} onUpdate={onUpdate} min={0} />
                </Field>
              </div>
            </SectionCard>

            <SectionCard title="Resistencias" dot="blue" style={{ gridColumn: "span 6" }}>
              <div className="grid grid-cols-5 gap-2">
                {RESISTANCES.map((r) => (
                  <div key={r.key} className="flex flex-col items-center gap-1">
                    <span className="a-flabel">{r.label}</span>
                    <DerivedValue value={res[r.key]?.total ?? 0} />
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>

          {/* Combate */}
          <SectionCard title="Combate" dot="red" padded={false}>
            <div className="a-thead" style={{ gridTemplateColumns: "1fr 80px 80px 80px" }}>
              <div>Habilidad</div>
              <div className="text-center">Base</div>
              <div className="text-center">Especial</div>
              <div className="text-center">Total</div>
            </div>
            {COMBAT_SKILLS.map((s) => {
              const skill = cb[s.key] ?? {};
              return (
                <div key={s.key} className="a-trow" style={{ gridTemplateColumns: "1fr 80px 80px 80px" }}>
                  <div className="px-2.5 py-1 text-xs">{s.label}</div>
                  <div className="px-1 py-1">
                    <NumberField system={system} path={`combat.${s.key}.base`} isEditable={isEditable} onUpdate={onUpdate} min={0} />
                  </div>
                  <div className="px-1 py-1">
                    <NumberField system={system} path={`combat.${s.key}.special`} isEditable={isEditable} onUpdate={onUpdate} />
                  </div>
                  <div className="text-center font-bold text-[12.5px]">
                    <DerivedValue
                      value={skill.final ?? 0}
                      tip={`${s.label}|Base=${skill.base ?? 0}|Especial=${sign(skill.special ?? 0)}|=${skill.final ?? 0}`}
                    />
                  </div>
                </div>
              );
            })}
          </SectionCard>

          {/* Arma / armadura manual */}
          <div className="a-grid12">
            <SectionCard title="Arma" dot="red" style={{ gridColumn: "span 6" }}>
              <div className="grid grid-cols-3 gap-2">
                <Field label="Nombre">
                  <TextField system={system} path="weapon.name" isEditable={isEditable} onUpdate={onUpdate} />
                </Field>
                <Field label="Daño">
                  <NumberField system={system} path="weapon.damage" isEditable={isEditable} onUpdate={onUpdate} />
                </Field>
                <Field label="Turno">
                  <NumberField system={system} path="weapon.speed" isEditable={isEditable} onUpdate={onUpdate} />
                </Field>
              </div>
            </SectionCard>
            <SectionCard title="Armadura" dot="blue" style={{ gridColumn: "span 6" }}>
              <div className="grid grid-cols-3 gap-2">
                <Field label="Nombre">
                  <TextField system={system} path="armor.name" isEditable={isEditable} onUpdate={onUpdate} />
                </Field>
                <Field label="TA">
                  <NumberField system={system} path="armor.at" isEditable={isEditable} onUpdate={onUpdate} min={0} />
                </Field>
                <Field label="Penalizador">
                  <NumberField system={system} path="armor.penalty" isEditable={isEditable} onUpdate={onUpdate} min={0} />
                </Field>
              </div>
            </SectionCard>
          </div>

          {/* Items */}
          <ItemList
            title="Poderes de criatura"
            dot="acc"
            items={items}
            type="monsterAbility"
            isEditable={isEditable}
            itemOps={itemOps}
            addLabel="+ Poder"
            emptyLabel="Sin poderes de criatura."
            columns={[
              { label: "Nivel", width: "64px", render: (i: any) => i.system?.level ?? 0 },
              { label: "Acción", width: "80px", render: (i: any) => i.system?.action ?? "—" },
            ]}
          />
          <ItemList
            title="Inventario"
            dot="red"
            items={items}
            type="weapon"
            isEditable={isEditable}
            itemOps={itemOps}
            addLabel="+ Arma"
            emptyLabel="Sin armas."
            columns={[
              { label: "Daño", width: "64px", render: (i: any) => i.system?.damage ?? 0 },
              { label: "Equipada", width: "80px", render: (i: any) => (i.system?.equipped ? "Sí" : "No") },
            ]}
          />

          {/* Notas */}
          <SectionCard title="Notas" dot="acc">
            <TextArea system={system} path="notes" isEditable={isEditable} onUpdate={onUpdate} style={{ minHeight: 120 }} />
          </SectionCard>
        </div>
      </section>
    </div>
  );
}
