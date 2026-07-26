# Graph Report - anima-beyond-foundry  (2026-07-09)

## Corpus Check
- 163 files · ~61,895 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 818 nodes · 1772 edges · 48 communities (42 shown, 6 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.84)
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
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]

## God Nodes (most connected - your core abstractions)
1. `BaseItemModel` - 25 edges
2. `prepareVitals()` - 19 edges
3. `SectionCard()` - 19 edges
4. `AnimaItem` - 18 edges
5. `prepareCombat()` - 17 edges
6. `NumberField()` - 17 edges
7. `AnimaActor` - 17 edges
8. `Detalle por sistema` - 17 edges
9. `MockActor` - 16 edges
10. `PrepContext` - 16 edges

## Surprising Connections (you probably didn't know these)
- `graphify` --semantically_similar_to--> `Graphify Knowledge Graph Integration`  [INFERRED] [semantically similar]
  .github/copilot-instructions.md → CLAUDE.md
- `MockActor` --references--> `AnimaRuleElement`  [EXTRACTED]
  sandbox/mock-documents.ts → src/rules/rule-element/base.ts
- `MockActor` --references--> `AnimaSynthetics`  [EXTRACTED]
  sandbox/mock-documents.ts → src/rules/synthetics.ts
- `prepareCombat()` --calls--> `mod()`  [INFERRED]
  src/actors/creature/prep/combat.ts → tests/modifier.test.ts
- `prepareSecondaries()` --calls--> `mod()`  [INFERRED]
  src/actors/creature/prep/secondaries.ts → tests/modifier.test.ts

## Import Cycles
- 3-file cycle: `src/documents/actor.ts -> src/rules/index.ts -> src/rules/rule-element/base.ts -> src/documents/actor.ts`
- 3-file cycle: `src/documents/item.ts -> src/items/physical/model.ts -> src/items/base/model.ts -> src/documents/item.ts`
- 4-file cycle: `src/documents/actor.ts -> src/rules/index.ts -> src/rules/rule-element/flat-modifier.ts -> src/rules/rule-element/base.ts -> src/documents/actor.ts`

## Hyperedges (group relationships)
- **Game Rules Source Documents** — claude_core_exxet, claude_arcana_exxet, claude_dominus_exxet, claude_prometheum_exxet, claude_ficha_anima_excel [EXTRACTED 1.00]
- **Project Reference Architecture Pattern** — claude_anima_beyond_foundry, claude_anime_beyond_fantasy_docs, claude_pf2e_reference [EXTRACTED 1.00]

## Communities (48 total, 6 thin omitted)

### Community 0 - "Item Sheet Tabs & UI"
Cohesion: 0.12
Nodes (15): combate, costes, descripcion, estilo, fisico, hechizo, kiTab, modificadores (+7 more)

### Community 1 - "Character Sheet & Tabs"
Cohesion: 0.06
Nodes (38): CharacterSheet, NpcSheet, CharacterSheetApp(), TAB_COMPONENTS, NpcSheetApp(), AnimaItemView, CompendiumEntry, ItemOps (+30 more)

### Community 2 - "Character Data & Modifiers"
Cohesion: 0.11
Nodes (16): CHAR_OPTIONS, SecondaryAbilitiesProps, ArmorPenaltyKind, CharacteristicKey, SECONDARY_ABILITIES_BY_GROUP, SECONDARY_ABILITY_GROUPS, SECONDARY_ABILITY_MAP, SecondaryAbilityDefinition (+8 more)

### Community 3 - "Item Data Models"
Cohesion: 0.07
Nodes (42): ArmorModel, ArmorSchema, armorTypeField(), combatBonusSchema(), descriptionSchema(), mkCostSchema(), BaseItemModel, BaseItemSchema (+34 more)

### Community 4 - "Categories & Build Tools"
Cohesion: 0.29
Nodes (9): compileAll(), declaredPackNames(), DEST_ROOT, main(), makeId(), root, SOURCE_ROOT, STAGE_ROOT (+1 more)

### Community 5 - "Package Configuration"
Cohesion: 0.07
Nodes (27): dependencies, react, react-dom, description, devDependencies, @foundryvtt/foundryvtt-cli, fvtt-types, tailwindcss (+19 more)

### Community 6 - "TypeScript Configuration"
Cohesion: 0.10
Nodes (19): compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, jsx, module, moduleResolution, noEmit (+11 more)

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
Cohesion: 0.22
Nodes (9): Armaduras, Calidad (cada +5 de una armadura), Capas de armadura, Combinación de TAs, Estado en el código, Estructura de datos de una armadura, Llevar Armadura, requerimiento y penalizador natural, Pendiente de volcar (⚠️ verificar en Core Exxet) (+1 more)

### Community 11 - "Vitals & Tooltips"
Cohesion: 0.09
Nodes (22): Características, Combate — cálculo de estadísticas, Combate — resolución de tiradas/daño automático, Contagio, vehículos, ambientación, Convención de estado de implementación, Creación de personaje, Código muerto detectado, Cómo mantener este documento (+14 more)

### Community 12 - "Characteristics Display"
Cohesion: 0.40
Nodes (3): CharacteristicRowProps, CHARACTERISTICS, CharacteristicsProps

### Community 14 - "Deep Entity Extraction"
Cohesion: 0.07
Nodes (39): ActorSystemMap, ActorType, AnimaActor, AnimaItem, ItemSystemMap, ItemType, GROUP_LABELS, GROUP_ORDER (+31 more)

### Community 15 - "Entity Extraction"
Cohesion: 0.05
Nodes (84): CategorySystemSource, categorySystemToData(), CharacterSchema, dpRecordField(), dpSkillField(), characteristicField(), CreatureModel, CreatureSchema (+76 more)

### Community 19 - "Community 19"
Cohesion: 0.18
Nodes (10): ItemTabDef, ItemTabProps, ARMOR_TYPES, ArmorProtectionTab(), AT_KEYS, LOCALIZATIONS, CombatStyleTab(), DEGREES (+2 more)

### Community 20 - "Community 20"
Cohesion: 0.17
Nodes (12): Convocación (Invocaciones y Encarnaciones), Dificultad y alcance (tabla de la hoja Excel — equivale al Recuadro X), El mantenimiento de los conjuros (Core p. 120 — confirmado), Estado en el código, Generalidades (Core p. 121), Magia, Metamagia (Arcana Exxet — mención breve), Pendiente de volcar (⚠️ verificar) (+4 more)

### Community 21 - "Community 21"
Cohesion: 0.24
Nodes (7): DescriptionTab(), CATEGORIES, SUBTYPES, TraitTab(), Dot, SectionCard(), SectionCardProps

### Community 22 - "Community 22"
Cohesion: 0.18
Nodes (11): Concentración (Tabla 69, Core p. 211 — confirmado), CVs (Consumos de Voluntad) y Potencial Psíquico, Dificultad y alcance de un poder psíquico (tabla confirmada, hoja Psíquicos), Disciplinas y patrones mentales, Estado en el código, Fracaso psíquico y fatiga (Core p. 211 — confirmado), Mantenimiento de poderes: los innatos (Core p. 212 — confirmado), Pendiente de volcar (⚠️ verificar en Core Exxet) (+3 more)

### Community 25 - "Community 25"
Cohesion: 0.24
Nodes (9): capitalize(), Vital, VitalsStrip(), VitalsStripProps, CalcTip, CalcTooltip(), CalcTooltipProps, parseTip() (+1 more)

### Community 26 - "Community 26"
Cohesion: 0.22
Nodes (9): Armas enormes y gigantes (Core p. 73), Armas y combate físico, Ataques múltiples y dos armas (Core p. 88–89), Calidad (cada +5 de un arma), Estado en el código, Estructura de datos de un arma, Fórmulas (confirmadas), Pendiente de volcar (⚠️ verificar) (+1 more)

### Community 27 - "Community 27"
Cohesion: 0.25
Nodes (8): Cambio de categoría, Costes por categoría, Límites por reserva, Modo "Combinado" (el implementado, por defecto del Excel), Multi-categoría (progresión), PD totales por nivel, Pendiente de volcar / implementar, Puntos de Desarrollo (PD) y categorías

### Community 28 - "Community 28"
Cohesion: 0.25
Nodes (8): Creación de Técnicas (Dominus Exxet cap. 5), Dominios del Ki (árbol de habilidades, hoja `Ki`), Estado en el código, Habilidades del Ki: coste y duración individual (Core pp. 101–102 — confirmado), Ki, Mantener y sostener técnicas (Dominus pp. 46–47 — confirmado), Pendiente de volcar (⚠️ verificar en Dominus Exxet), Puntos de Ki y acumulación

### Community 29 - "Community 29"
Cohesion: 0.38
Nodes (3): AnyRecord, migrateCharacterDp(), migrateDpField()

### Community 30 - "Community 30"
Cohesion: 0.29
Nodes (7): Confirmado: cada sistema tiene su propia mecánica, Detalle por sistema (resumen; el detalle completo está en cada doc), Estado en el código, Interacción con Resistencias (Core p. 121 — confirmado), Mantenimiento y efectos activos (transversal), Pendiente de volcar (⚠️ verificar), Relación con otras reglas ya documentadas

### Community 31 - "Community 31"
Cohesion: 0.29
Nodes (7): Cansancio (Tabla 27, Core Exxet p. 60 — confirmado), Categorías de modificadores (según la ficha oficial), Ejemplo, Estado en el código, Modificadores y reglas de acumulación, Pendiente de volcar (⚠️ verificar en Core Exxet), Reglas de acumulación

### Community 32 - "Community 32"
Cohesion: 0.29
Nodes (5): CategoryTab(), COMBAT_KEYS, COMBAT_LABELS, SEC_GROUPS, SEC_LABELS

### Community 33 - "Community 33"
Cohesion: 0.14
Nodes (4): ItemWindow, applyPathUpdate(), MockActor, MockItem

### Community 34 - "Community 34"
Cohesion: 0.33
Nodes (5): ACTION_TYPES, MAINTENANCE_TYPES, RESISTANCE_TYPES, SPELL_TYPES, SpellTab()

### Community 35 - "Community 35"
Cohesion: 0.16
Nodes (7): ArrayField, BooleanField, clone(), DataField, NumberField, ObjectField, TypedObjectField

### Community 36 - "Community 36"
Cohesion: 0.40
Nodes (4): ACTIONS, KiAbilityTab(), KiEffect, SUBTYPES

### Community 37 - "Community 37"
Cohesion: 0.67
Nodes (3): Convenciones de estos documentos, Reglas de Anima: Beyond Fantasy — Referencia para el desarrollo, Índice

### Community 38 - "Community 38"
Cohesion: 0.14
Nodes (11): ChatListener, chatListeners, FieldOptions, format(), g, HTMLField, localize(), messages (+3 more)

### Community 39 - "Community 39"
Cohesion: 0.18
Nodes (9): ActorKey, ACTORS, App(), buildSheetProps(), character, npc, useActorVersion(), sandboxChat (+1 more)

### Community 40 - "Community 40"
Cohesion: 0.21
Nodes (10): characterFixture(), npcFixture(), packItem(), DocumentSource, MockActorInit, cloneSource(), findByUuid(), modules (+2 more)

### Community 41 - "Community 41"
Cohesion: 0.15
Nodes (17): CHARACTERISTICS, COMBAT_SKILLS, RESISTANCES, BIO_FIELDS, FAME, MONEY, TEXT_BLOCKS, MagicPathTab() (+9 more)

### Community 42 - "Community 42"
Cohesion: 0.40
Nodes (5): Datos por habilidad (confirmados con ficha-test01), Fórmula del total (confirmada, PDs!AA129), Habilidades fuera de la lista fija, Habilidades secundarias, Mejora natural (columnas "Bon." y "Hab.", pendiente de modelar)

### Community 43 - "Community 43"
Cohesion: 0.40
Nodes (4): DAMAGE_TYPES, SIZES, WEAPON_TYPES, WeaponCombatTab()

### Community 45 - "Community 45"
Cohesion: 0.29
Nodes (5): SUMMARY_CONFIG, SummaryFieldDef, SummaryTab(), Pill(), StatCard()

## Knowledge Gaps
- **272 isolated node(s):** `name`, `version`, `description`, `type`, `dev` (+267 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `MockActor` connect `Community 33` to `Item Data Models`, `Deep Entity Extraction`, `Community 39`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Why does `AnimaActor` connect `Deep Entity Extraction` to `Character Sheet & Tabs`, `Item Data Models`, `Entity Extraction`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Why does `CharacterModel` connect `Item Data Models` to `Community 29`, `Entity Extraction`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _273 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Item Sheet Tabs & UI` be split into smaller, more focused modules?**
  _Cohesion score 0.125 - nodes in this community are weakly interconnected._
- **Should `Character Sheet & Tabs` be split into smaller, more focused modules?**
  _Cohesion score 0.06286748077792854 - nodes in this community are weakly interconnected._
- **Should `Character Data & Modifiers` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._