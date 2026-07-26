# Graph Report - anima-beyond-foundry  (2026-07-04)

## Corpus Check
- 140 files · ~37,483 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 574 nodes · 1288 edges · 26 communities (21 shown, 5 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Item Sheet Tabs & UI|Item Sheet Tabs & UI]]
- [[_COMMUNITY_Character Sheet & Tabs|Character Sheet & Tabs]]
- [[_COMMUNITY_Character Data & Modifiers|Character Data & Modifiers]]
- [[_COMMUNITY_Item Data Models|Item Data Models]]
- [[_COMMUNITY_Categories & Build Tools|Categories & Build Tools]]
- [[_COMMUNITY_Package Configuration|Package Configuration]]
- [[_COMMUNITY_TypeScript Configuration|TypeScript Configuration]]
- [[_COMMUNITY_FoundryVTT Type Defs|FoundryVTT Type Defs]]
- [[_COMMUNITY_Item Sheet Rendering|Item Sheet Rendering]]
- [[_COMMUNITY_Project Documentation|Project Documentation]]
- [[_COMMUNITY_Principal & Summary Tabs|Principal & Summary Tabs]]
- [[_COMMUNITY_Vitals & Tooltips|Vitals & Tooltips]]
- [[_COMMUNITY_Characteristics Display|Characteristics Display]]
- [[_COMMUNITY_Combat Stats Display|Combat Stats Display]]
- [[_COMMUNITY_Deep Entity Extraction|Deep Entity Extraction]]
- [[_COMMUNITY_Entity Extraction|Entity Extraction]]
- [[_COMMUNITY_Derived Stats Display|Derived Stats Display]]
- [[_COMMUNITY_Supernatural Stats|Supernatural Stats]]
- [[_COMMUNITY_Vite Build Config|Vite Build Config]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]

## God Nodes (most connected - your core abstractions)
1. `BaseItemModel` - 25 edges
2. `SectionCard()` - 19 edges
3. `NumberField()` - 17 edges
4. `AnimaActor` - 17 edges
5. `AnimaItem` - 17 edges
6. `compilerOptions` - 17 edges
7. `TextField()` - 15 edges
8. `ItemTabProps` - 14 edges
9. `prepareVitals()` - 13 edges
10. `TabProps` - 13 edges

## Surprising Connections (you probably didn't know these)
- `graphify` --semantically_similar_to--> `Graphify Knowledge Graph Integration`  [INFERRED] [semantically similar]
  .github/copilot-instructions.md → CLAUDE.md
- `prepareCombat()` --calls--> `mod()`  [INFERRED]
  src/actors/creature/prep/combat.ts → tests/modifier.test.ts
- `prepareSecondaries()` --calls--> `mod()`  [INFERRED]
  src/actors/creature/prep/secondaries.ts → tests/modifier.test.ts
- `prepareSupernatural()` --calls--> `mod()`  [INFERRED]
  src/actors/creature/prep/supernatural.ts → tests/modifier.test.ts
- `prepareVitals()` --calls--> `mod()`  [INFERRED]
  src/actors/creature/prep/vitals.ts → tests/modifier.test.ts

## Import Cycles
- 3-file cycle: `src/documents/actor.ts -> src/rules/index.ts -> src/rules/rule-element/base.ts -> src/documents/actor.ts`
- 3-file cycle: `src/documents/item.ts -> src/items/physical/model.ts -> src/items/base/model.ts -> src/documents/item.ts`
- 4-file cycle: `src/documents/actor.ts -> src/rules/index.ts -> src/rules/rule-element/flat-modifier.ts -> src/rules/rule-element/base.ts -> src/documents/actor.ts`

## Hyperedges (group relationships)
- **Game Rules Source Documents** — claude_core_exxet, claude_arcana_exxet, claude_dominus_exxet, claude_prometheum_exxet, claude_ficha_anima_excel [EXTRACTED 1.00]
- **Project Reference Architecture Pattern** — claude_anima_beyond_foundry, claude_anime_beyond_fantasy_docs, claude_pf2e_reference [EXTRACTED 1.00]

## Communities (26 total, 5 thin omitted)

### Community 0 - "Item Sheet Tabs & UI"
Cohesion: 0.06
Nodes (64): combate, costes, descripcion, estilo, fisico, hechizo, kiTab, modificadores (+56 more)

### Community 1 - "Character Sheet & Tabs"
Cohesion: 0.16
Nodes (15): CharacterSheetApp(), TAB_COMPONENTS, KiTab(), MetamagiaTab(), ACTION_LABELS, MisticosTab(), PsiquicosTab(), StubPanel() (+7 more)

### Community 2 - "Character Data & Modifiers"
Cohesion: 0.20
Nodes (9): CHAR_OPTIONS, SecondaryAbilitiesProps, CharacteristicKey, DEFAULT_SECONDARY_ABILITIES, SECONDARY_ABILITIES_BY_GROUP, SECONDARY_ABILITY_GROUPS, SECONDARY_ABILITY_MAP, SecondaryAbilityDefinition (+1 more)

### Community 3 - "Item Data Models"
Cohesion: 0.08
Nodes (35): ArmorModel, ArmorSchema, armorTypeField(), combatBonusSchema(), descriptionSchema(), mkCostSchema(), BaseItemModel, BaseItemSchema (+27 more)

### Community 4 - "Categories & Build Tools"
Cohesion: 0.29
Nodes (9): compileAll(), declaredPackNames(), DEST_ROOT, main(), makeId(), root, SOURCE_ROOT, STAGE_ROOT (+1 more)

### Community 5 - "Package Configuration"
Cohesion: 0.07
Nodes (26): dependencies, react, react-dom, description, devDependencies, @foundryvtt/foundryvtt-cli, fvtt-types, tailwindcss (+18 more)

### Community 6 - "TypeScript Configuration"
Cohesion: 0.10
Nodes (20): compilerOptions, baseUrl, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, jsx, module, moduleResolution (+12 more)

### Community 7 - "FoundryVTT Type Defs"
Cohesion: 0.40
Nodes (5): FoundryActor, FoundryCompendium, FoundryDocument, FoundryEmbeddedCollection, FoundrySheet

### Community 8 - "Item Sheet Rendering"
Cohesion: 0.19
Nodes (9): ItemSheet, ITEM_TYPE_LABELS, ItemSheetApp(), DEFAULT_TABS, ITEM_TAB_CONFIG, ApplicationV2Like, ReactApplicationMixin(), ReactItemSheet (+1 more)

### Community 9 - "Project Documentation"
Cohesion: 0.10
Nodes (21): Anima: Beyond Fantasy RPG, Anima Beyond Foundry, anime-beyond-fantasy-docs (Game Rules Reference), `../anime-beyond-fantasy-docs/` — Reglas del juego, Arcana Exxet (Magic & Supernatural Rules PDF), Carpetas de referencia (solo lectura, NUNCA modificar), Core Exxet (Main Rules PDF), ClaudeDesignPrompt.md (Design Guidelines) (+13 more)

### Community 10 - "Principal & Summary Tabs"
Cohesion: 0.08
Nodes (25): Armaduras, Capas de armadura (regla clave), Combinación de TAs, Estado en el código, Estructura de datos de una armadura, Pendiente de volcar (⚠️ verificar en Core Exxet), Requisito y Llevar Armadura, Armas y combate físico (+17 more)

### Community 11 - "Vitals & Tooltips"
Cohesion: 0.24
Nodes (9): capitalize(), Vital, VitalsStrip(), VitalsStripProps, CalcTip, CalcTooltip(), CalcTooltipProps, parseTip() (+1 more)

### Community 12 - "Characteristics Display"
Cohesion: 0.40
Nodes (3): CharacteristicRowProps, CHARACTERISTICS, CharacteristicsProps

### Community 14 - "Deep Entity Extraction"
Cohesion: 0.07
Nodes (39): ActorSystemMap, ActorType, AnimaActor, AnimaItem, ItemSystemMap, ItemType, GROUP_LABELS, GROUP_ORDER (+31 more)

### Community 15 - "Entity Extraction"
Cohesion: 0.07
Nodes (50): CharacterModel, CharacterSchema, dpSkillField(), characteristicField(), CreatureModel, CreatureSchema, getLifePointsBase(), getModifier() (+42 more)

### Community 19 - "Community 19"
Cohesion: 0.17
Nodes (8): CharacterSheet, NpcSheet, CHARACTERISTICS, COMBAT_SKILLS, NpcSheetApp(), RESISTANCES, ReactSheet, ReactSheetProps

### Community 20 - "Community 20"
Cohesion: 0.42
Nodes (7): AnimaItemView, CompendiumEntry, ItemOps, CompendiumPicker(), CompendiumPickerProps, ItemColumn, ItemListProps

### Community 21 - "Community 21"
Cohesion: 0.22
Nodes (4): ARMOR_TYPE_LABELS, CombateTab(), STYLE_SUBTYPE_LABELS, WEAPON_TYPE_LABELS

### Community 22 - "Community 22"
Cohesion: 0.25
Nodes (6): CHARS, MONSTER_SUBTYPE_LABELS, PrincipalTab(), RES, sign(), TRAIT_SUBTYPE_LABELS

### Community 23 - "Community 23"
Cohesion: 0.39
Nodes (6): ARCHETYPE_LABELS, combatRow(), PDsTab(), secRow(), sign(), SpendRow

### Community 25 - "Community 25"
Cohesion: 0.29
Nodes (6): BIO_FIELDS, FAME, GeneralTab(), MONEY, TEXT_BLOCKS, DerivedValue()

## Knowledge Gaps
- **180 isolated node(s):** `name`, `version`, `description`, `type`, `dev` (+175 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AnimaActor` connect `Deep Entity Extraction` to `Item Data Models`, `Community 19`, `Community 20`, `Entity Extraction`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **Why does `DEFAULT_SECONDARY_ABILITIES` connect `Character Data & Modifiers` to `Community 23`, `Deep Entity Extraction`, `Entity Extraction`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Why does `AnimaItem` connect `Deep Entity Extraction` to `Item Sheet Rendering`, `Item Data Models`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _181 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Item Sheet Tabs & UI` be split into smaller, more focused modules?**
  _Cohesion score 0.05583308845136644 - nodes in this community are weakly interconnected._
- **Should `Item Data Models` be split into smaller, more focused modules?**
  _Cohesion score 0.08354646206308611 - nodes in this community are weakly interconnected._
- **Should `Package Configuration` be split into smaller, more focused modules?**
  _Cohesion score 0.07407407407407407 - nodes in this community are weakly interconnected._