import type { ItemTabProps } from "../types";
import { SectionCard } from "../../character/ui/SectionCard";
import { Field, NumberField, TextField, TextArea } from "../../character/ui/fields";

export function MentalPatternTab({ system, isEditable, onUpdate }: ItemTabProps) {
  const loc = (k: string) => game.i18n.localize(k);

  return (
    <SectionCard title={loc("ANIMA.ItemMentalPattern")} dot="blue">
      <div className="a-item-grid">
        <Field label={loc("ANIMA.ItemDpCost")}>
          <NumberField system={system} path="dpCost" isEditable={isEditable} onUpdate={onUpdate} min={0} />
        </Field>
        <Field label={loc("ANIMA.ItemModifier")}>
          <TextField system={system} path="modifier" isEditable={isEditable} onUpdate={onUpdate} />
        </Field>
      </div>
      {/* Bonos, penalizadores, patrones opuestos y costes: prosa, no números. */}
      <Field label={loc("ANIMA.ItemEffect")}>
        <TextArea
          system={system}
          path="effect"
          isEditable={isEditable}
          onUpdate={onUpdate}
          style={{ minHeight: 140 }}
        />
      </Field>
    </SectionCard>
  );
}
