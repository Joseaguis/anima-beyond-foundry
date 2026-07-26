import { SectionCard } from "../ui/SectionCard";
import { NumberField, TextField, TextArea, CheckboxField } from "../ui/fields";
import { ItemList } from "../ui/ItemList";
import { BreakdownRow } from "../ui/BreakdownRow";
import type { TabProps } from "./types";

/** The five manual "Ajustes de nivel" rows from the Excel Clase sheet. */
const LEVEL_ADJUSTMENTS: { key: string; label: string }[] = [
  { key: "race", label: "Ajuste por Raza" },
  { key: "gnosis", label: "Ajuste por Gnosis" },
  { key: "legacy", label: "Ajuste por Legados" },
  { key: "boundArtifact", label: "Artefacto vinculado" },
  { key: "extraPd", label: "PDs Adicionales" },
];

/**
 * Mejoras y rasgos de criatura que no hace falta ver todo el rato: Clase,
 * Resumen, Ajustes de nivel, Habilidades Esenciales, Poderes de Criatura y
 * las capacidades de raza / Nephilim.
 */
export function PoderesTab({ system, items, isEditable, onUpdate, itemOps }: TabProps) {
  const presence = system.presence ?? 0;

  return (
    <div className="a-screen flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        {/* Clase (hoja Clase del Excel) */}
        <SectionCard title="Clase">
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <div className="a-flabel mb-1">Tipo de Criatura</div>
              <TextField system={system} path="class.creatureType" isEditable={isEditable} onUpdate={onUpdate} placeholder="Natural" />
            </div>
            <div className="flex flex-col justify-end gap-1 pb-0.5">
              <label className="flex items-center gap-1.5 text-xs">
                <CheckboxField system={system} path="class.accumulateDamage" isEditable={isEditable} onUpdate={onUpdate} />
                Acumulación Daño
              </label>
              <label className="flex items-center gap-1.5 text-xs">
                <CheckboxField system={system} path="class.createdWithMagic" isEditable={isEditable} onUpdate={onUpdate} />
                Creado con Magia
              </label>
            </div>
            <div>
              <div className="a-flabel mb-1">Gnosis</div>
              <NumberField system={system} path="class.gnosis" isEditable={isEditable} onUpdate={onUpdate} min={0} />
            </div>
            <div>
              <div className="a-flabel mb-1">Natura +</div>
              <NumberField system={system} path="class.natureBonus" isEditable={isEditable} onUpdate={onUpdate} />
            </div>
          </div>
        </SectionCard>

        {/* Resumen de nivel */}
        <SectionCard title="Resumen" padded={false}>
          <BreakdownRow label="Nivel" value={system.level ?? 0} />
          <BreakdownRow label="Puntos de Desarrollo" value={system.developmentPoints ?? 0} />
          <BreakdownRow label="Conocimiento Marcial" value={system.martialKnowledge ?? 0} />
          <BreakdownRow label="Presencia" value={presence} />
          <BreakdownRow label="Tamaño" value={system.size ?? 0} />
        </SectionCard>
      </div>

      {/* Ajustes de nivel */}
      <SectionCard title="Ajustes de nivel" padded={false}>
        <div className="a-thead" style={{ gridTemplateColumns: "1fr 1fr 76px 76px" }}>
          <div>Tipo de Ajuste</div>
          <div>Notas</div>
          <div className="text-center">Nivel</div>
          <div className="text-center">PDs</div>
        </div>
        {LEVEL_ADJUSTMENTS.map(({ key, label }) => (
          <div key={key} className="a-trow" style={{ gridTemplateColumns: "1fr 1fr 76px 76px" }}>
            <div className="px-2.5 py-0.5 text-xs">{label}</div>
            <div className="px-1 py-0.5">
              <TextField
                system={system}
                path={`levelAdjustments.${key}.notes`}
                isEditable={isEditable}
                onUpdate={onUpdate}
              />
            </div>
            <div className="px-1 py-0.5">
              <NumberField
                system={system}
                path={`levelAdjustments.${key}.level`}
                isEditable={isEditable}
                onUpdate={onUpdate}
              />
            </div>
            <div className="px-1 py-0.5">
              <NumberField
                system={system}
                path={`levelAdjustments.${key}.pd`}
                isEditable={isEditable}
                onUpdate={onUpdate}
              />
            </div>
          </div>
        ))}
        <div className="a-tfoot text-[11.5px]" style={{ gridTemplateColumns: "1fr 1fr 76px 76px" }}>
          <div className="px-2.5 py-1 font-semibold" style={{ gridColumn: "span 2" }}>
            Ajuste total
          </div>
          <div className="text-center py-1 font-bold">
            {LEVEL_ADJUSTMENTS.reduce((sum, a) => sum + (system.levelAdjustments?.[a.key]?.level ?? 0), 0)}
          </div>
          <div className="text-center py-1 font-bold">
            {LEVEL_ADJUSTMENTS.reduce((sum, a) => sum + (system.levelAdjustments?.[a.key]?.pd ?? 0), 0)}
          </div>
        </div>
      </SectionCard>

      {/* Habilidades Esenciales / Poderes de Criatura */}
      <div className="grid grid-cols-2 gap-3">
        <ItemList
          title="Habilidades Esenciales"
          items={items}
          type="monsterAbility"
          subtype="essentialAbility"
          isEditable={isEditable}
          itemOps={itemOps}
          addLabel="+ Habilidad"
          emptyLabel="Sin habilidades esenciales."
          columns={[{ label: "PDs", width: "52px", render: (i: any) => i.system?.dpCost ?? 0 }]}
        />
        <ItemList
          title="Poderes de Criatura"
          items={items}
          type="monsterAbility"
          subtype="monsterPower"
          isEditable={isEditable}
          itemOps={itemOps}
          addLabel="+ Poder"
          emptyLabel="Sin poderes de criatura."
          columns={[{ label: "PDs", width: "52px", render: (i: any) => i.system?.dpCost ?? 0 }]}
        />
      </div>

      {/* Capacidades de raza y Nephilim */}
      <div className="grid grid-cols-2 gap-3">
        <SectionCard title="Capacidades Raciales" padded={false}>
          <TextArea system={system} path="racialCapabilities" isEditable={isEditable} onUpdate={onUpdate} style={{ minHeight: 90 }} />
        </SectionCard>
        <SectionCard title="Capacidades de Nephilim" padded={false}>
          <TextArea system={system} path="nephilimCapabilities" isEditable={isEditable} onUpdate={onUpdate} style={{ minHeight: 90 }} />
        </SectionCard>
      </div>
    </div>
  );
}
