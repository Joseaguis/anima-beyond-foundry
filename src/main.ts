import { AnimaActor, AnimaItem } from "./documents";
import { CharacterModel, NpcModel } from "./actors";
import { CharacterSheet } from "./sheets/actor/CharacterSheet";
import { NpcSheet } from "./sheets/actor/NpcSheet";
import {
  WeaponModel,
  ArmorModel,
  CategoryModel,
  TraitModel,
  WeaponTableModel,
  CombatStyleModel,
  KiAbilityModel,
  KiTechniqueModel,
  SpellModel,
  MagicPathModel,
  PsychicPowerModel,
  PsychicDisciplineModel,
  MentalPatternModel,
  MonsterAbilityModel,
} from "./items";
import { ItemSheet } from "./sheets/item/ItemSheet";
import "./styles/main.css";

Hooks.once("init", () => {
  console.log("AnimaBFv2 | Initializing system");

  CONFIG.Actor.documentClass = AnimaActor;
  CONFIG.Item.documentClass = AnimaItem;

  CONFIG.Actor.dataModels.character = CharacterModel;
  CONFIG.Actor.dataModels.npc = NpcModel;

  CONFIG.Item.dataModels.weapon = WeaponModel;
  CONFIG.Item.dataModels.armor = ArmorModel;
  CONFIG.Item.dataModels.category = CategoryModel;
  CONFIG.Item.dataModels.trait = TraitModel;
  CONFIG.Item.dataModels.weaponTable = WeaponTableModel;
  CONFIG.Item.dataModels.combatStyle = CombatStyleModel;
  CONFIG.Item.dataModels.kiAbility = KiAbilityModel;
  CONFIG.Item.dataModels.kiTechnique = KiTechniqueModel;
  CONFIG.Item.dataModels.spell = SpellModel;
  CONFIG.Item.dataModels.magicPath = MagicPathModel;
  CONFIG.Item.dataModels.psychicPower = PsychicPowerModel;
  CONFIG.Item.dataModels.psychicDiscipline = PsychicDisciplineModel;
  CONFIG.Item.dataModels.mentalPattern = MentalPatternModel;
  CONFIG.Item.dataModels.monsterAbility = MonsterAbilityModel;

  // The React sheets extend an `any` base until the sheet infrastructure is
  // rewritten on a typed mixin; cast for registration in the meantime.
  type SheetConstructor = foundry.applications.api.DocumentSheetV2.AnyConstructor;

  DocumentSheetConfig.registerSheet(Actor, "animabfv2", CharacterSheet as unknown as SheetConstructor, {
    types: ["character"],
    makeDefault: true,
    label: "ANIMA.SheetCharacter",
  });

  DocumentSheetConfig.registerSheet(Actor, "animabfv2", NpcSheet as unknown as SheetConstructor, {
    types: ["npc"],
    makeDefault: true,
    label: "ANIMA.SheetNpc",
  });

  DocumentSheetConfig.registerSheet(Item, "animabfv2", ItemSheet as unknown as SheetConstructor, {
    makeDefault: true,
    label: "ANIMA.SheetItem",
  });

  console.log("AnimaBFv2 | System initialized");
});

Hooks.once("ready", () => {
  console.log("AnimaBFv2 | System ready");
});
