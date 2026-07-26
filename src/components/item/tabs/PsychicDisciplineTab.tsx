import type { ItemTabProps } from "../types";
import { SectionCard } from "../../character/ui/SectionCard";
import { Field, NumberField, TextField } from "../../character/ui/fields";

export function PsychicDisciplineTab({ system, isEditable, onUpdate }: ItemTabProps) {
  const loc = (k: string) => game.i18n.localize(k);

  return (
    <SectionCard title={loc("ANIMA.ItemPsychicDiscipline")} dot="blue">
      <div className="a-item-grid">
        <Field label={loc("ANIMA.ItemAffinityCost")}>
          <NumberField system={system} path="affinityCost" isEditable={isEditable} onUpdate={onUpdate} min={0} />
        </Field>
        <Field label={loc("ANIMA.ItemSituationalModifier")}>
          <TextField system={system} path="situationalModifier" isEditable={isEditable} onUpdate={onUpdate} />
        </Field>
        <Field label={loc("ANIMA.ItemEffect")}>
          <TextField system={system} path="effect" isEditable={isEditable} onUpdate={onUpdate} />
        </Field>
      </div>
    </SectionCard>
  );
}
