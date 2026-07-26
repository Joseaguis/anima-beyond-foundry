import { PhysicalItemModel, physicalItemSchema } from "../physical/model";
import type { EquippedWeaponData } from "../../actors/creature/prep/equipment";

const { NumberField, StringField } = foundry.data.fields;

export function weaponSchema() {
  return {
    ...physicalItemSchema(),
    weaponType: new StringField({ required: true, initial: "melee" }),
    damage: new NumberField({ required: true, initial: 0, integer: true }),
    speed: new NumberField({ required: true, initial: 0, integer: true }),
    requiredStr: new NumberField({ required: true, initial: 0, integer: true, min: 0 }),
    primaryType: new StringField({ required: true, initial: "FIL" }),
    secondaryType: new StringField({ required: true, initial: "" }),
    critical: new NumberField({ required: true, initial: 0, integer: true }),
    hands: new StringField({ required: true, initial: "one" }),
    reach: new NumberField({ required: true, initial: 0, integer: true, min: 0 }),
    // Proyectiles: rango en metros, turnos de recarga y munición enlazada
    // (id de un item weapon/ammo del mismo actor).
    range: new NumberField({ required: true, initial: 0, integer: true, min: 0 }),
    reload: new NumberField({ required: true, initial: 0, integer: true, min: 0 }),
    ammoId: new StringField({ required: true, initial: "" }),
    size: new StringField({ required: true, initial: "medium" }),
    // "normal" | "enormous" | "giant" — armas enormes y gigantes (Core Exxet
    // p. 73): scaled damage, extra STR and wielder-size restrictions.
    proportions: new StringField({ required: true, initial: "normal" }),
    special: new StringField({ required: true, initial: "" }),
  };
}

export type WeaponSchema = ReturnType<typeof weaponSchema>;

export class WeaponModel extends PhysicalItemModel<WeaponSchema> {
  static override defineSchema(): foundry.data.fields.DataSchema {
    return weaponSchema();
  }

  /**
   * Publish this weapon into the actor's equipped-weapon list (ephemeral).
   * prepareEquipment later derives per-weapon HA/HP/turn/damage — each
   * equipped weapon has its own values (docs/reglas/armas-y-combate.md).
   */
  override prepareActorData(): void {
    const actorSystem = this.parent?.actor?.system as
      | { equippedWeapons?: EquippedWeaponData[] }
      | undefined;
    if (!actorSystem || !this.isEquipped) return;

    const data = this as Record<string, any>;

    // Munición enlazada: resolver aquí el item hermano (persistido, seguro en
    // prepareActorData) para que prepareEquipment use su daño/calidad.
    let ammo: { name: string; damage: number; quality: number } | undefined;
    const ammoId: string = data.ammoId ?? "";
    if (data.weaponType === "ranged" && ammoId) {
      const item = this.parent?.actor?.items.get(ammoId);
      const ammoSys = item?.system as Record<string, any> | undefined;
      if (item?.type === "weapon" && ammoSys?.weaponType === "ammo") {
        ammo = {
          name: item.name ?? "",
          damage: ammoSys.damage ?? 0,
          quality: ammoSys.quality ?? 0,
        };
      }
    }

    const weapons = (actorSystem.equippedWeapons ??= []);
    weapons.push({
      id: this.parent?.id ?? "",
      name: this.parent?.name ?? "",
      weaponType: data.weaponType ?? "melee",
      damage: data.damage ?? 0,
      speed: data.speed ?? 0,
      quality: data.quality ?? 0,
      requiredStr: data.requiredStr ?? 0,
      primaryType: data.primaryType ?? "FIL",
      secondaryType: data.secondaryType ?? "",
      critical: data.critical ?? 0,
      hands: data.hands ?? "one",
      size: data.size ?? "medium",
      proportions: data.proportions ?? "normal",
      fortitude: data.fortitude ?? 0,
      breakage: data.breakage ?? 0,
      presence: data.presence ?? 0,
      range: data.range ?? 0,
      reload: data.reload ?? 0,
      ammoId,
      ammoName: ammo?.name,
      ammoDamage: ammo?.damage,
      ammoQuality: ammo?.quality,
    });
  }
}
