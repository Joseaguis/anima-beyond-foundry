import type { AnimaActor, AnimaItem } from "../documents";
import type { CharacterModel, NpcModel } from "../actors";
import type {
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
} from "../items";
import type { AnimaChatFlags } from "../system/chat/flags";

declare module "fvtt-types/configuration" {
  // The sheet layer only runs after the "ready" hook, so type globals (game,
  // ui, canvas...) as fully initialized instead of forcing guards everywhere.
  interface AssumeHookRan {
    ready: never;
  }

  // Chat cards store the whole check under our system id, so the message can be
  // re-rendered and completed by the defender later (see system/chat/flags.ts).
  interface FlagConfig {
    ChatMessage: {
      animabfv2: AnimaChatFlags;
    };
  }
}

declare global {
  interface DocumentClassConfig {
    Actor: typeof AnimaActor;
    Item: typeof AnimaItem;
  }

  interface DataModelConfig {
    Actor: {
      character: typeof CharacterModel;
      npc: typeof NpcModel;
    };
    Item: {
      weapon: typeof WeaponModel;
      armor: typeof ArmorModel;
      category: typeof CategoryModel;
      trait: typeof TraitModel;
      weaponTable: typeof WeaponTableModel;
      combatStyle: typeof CombatStyleModel;
      kiAbility: typeof KiAbilityModel;
      kiTechnique: typeof KiTechniqueModel;
      spell: typeof SpellModel;
      magicPath: typeof MagicPathModel;
      psychicPower: typeof PsychicPowerModel;
      psychicDiscipline: typeof PsychicDisciplineModel;
      mentalPattern: typeof MentalPatternModel;
      monsterAbility: typeof MonsterAbilityModel;
    };
  }
}

export {};
