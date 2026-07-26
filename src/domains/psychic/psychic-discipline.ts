import { BaseItemModel, baseItemSchema } from "../../items/base/model";
import { CreatureModel } from "../../actors/creature/model";
import type { PsychicDisciplineData } from "./data";

const { NumberField, StringField } = foundry.data.fields;

export function psychicDisciplineSchema() {
  return {
    ...baseItemSchema(),
    // Situational potential modifier described in prose (e.g. Telepatía "+20 en
    // contacto", Piroquinesis "+30 en un volcán"). Informational only.
    situationalModifier: new StringField({ required: true, initial: "" }),
    // Afinidad a una disciplina: normally 1 CV (Core p. 211).
    affinityCost: new NumberField({ required: true, initial: 1, integer: true, min: 0 }),
    effect: new StringField({ required: true, initial: "" }),
  };
}

export type PsychicDisciplineSchema = ReturnType<typeof psychicDisciplineSchema>;

export class PsychicDisciplineModel extends BaseItemModel<PsychicDisciplineSchema> {
  static override defineSchema(): foundry.data.fields.DataSchema {
    return psychicDisciplineSchema();
  }

  /** Publish this affinity into the actor's discipline list (ephemeral) so the
   * psychic prep can total the CV spent on affinities. */
  override prepareActorData(): void {
    const actorSystem = this.parent?.actor?.system;
    if (!(actorSystem instanceof CreatureModel)) return;
    const data = this as Record<string, any>;
    const list = ((actorSystem as unknown as { psychicDisciplines?: PsychicDisciplineData[] })
      .psychicDisciplines ??= []);
    list.push({
      name: this.parent?.name ?? "",
      affinityCost: data.affinityCost ?? 1,
    });
  }
}
