# Graph Report - anima-beyond-foundry  (2026-07-19)

## Corpus Check
- 258 files · ~88,709 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 972 nodes · 2309 edges · 50 communities (47 shown, 3 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 12 edges (avg confidence: 0.83)
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
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]

## God Nodes (most connected - your core abstractions)
1. `SectionCard()` - 33 edges
2. `BaseItemModel` - 31 edges
3. `NumberField()` - 24 edges
4. `PrepContext` - 23 edges
5. `defaultCategoryData()` - 22 edges
6. `prepareVitals()` - 21 edges
7. `TextField()` - 20 edges
8. `prepareCombat()` - 18 edges
9. `prepareSupernatural()` - 18 edges
10. `DpValue` - 18 edges

## Surprising Connections (you probably didn't know these)
- `graphify` --semantically_similar_to--> `Graphify Knowledge Graph Integration`  [INFERRED] [semantically similar]
  .github/copilot-instructions.md → CLAUDE.md
- `prepareKi()` --calls--> `mod()`  [INFERRED]
  src/domains/ki/prepare.ts → tests/modifier.test.ts
- `prepareMagic()` --calls--> `mod()`  [INFERRED]
  src/domains/magic/prepare.ts → tests/modifier.test.ts
- `preparePsychic()` --calls--> `mod()`  [INFERRED]
  src/domains/psychic/prepare.ts → tests/modifier.test.ts
- `MockActor` --references--> `AnimaRuleElement`  [EXTRACTED]
  sandbox/mock-documents.ts → src/rules/rule-element/base.ts

## Import Cycles
- 3-file cycle: `src/documents/actor.ts -> src/rules/index.ts -> src/rules/rule-element/base.ts -> src/documents/actor.ts`
- 3-file cycle: `src/documents/item.ts -> src/items/physical/model.ts -> src/items/base/model.ts -> src/documents/item.ts`
- 4-file cycle: `src/documents/actor.ts -> src/rules/index.ts -> src/rules/rule-element/flat-modifier.ts -> src/rules/rule-element/base.ts -> src/documents/actor.ts`

## Hyperedges (group relationships)
- **Game Rules Source Documents** — claude_core_exxet, claude_arcana_exxet, claude_dominus_exxet, claude_prometheum_exxet, claude_ficha_anima_excel [EXTRACTED 1.00]
- **Project Reference Architecture Pattern** — claude_anima_beyond_foundry, claude_anime_beyond_fantasy_docs, claude_pf2e_reference [EXTRACTED 1.00]

## Communities (50 total, 3 thin omitted)

### Community 0 - "Item Sheet Tabs & UI"
Cohesion: 0.05
Nodes (57): combate, costes, descripcion, disciplinaPsi, estilo, fisico, hechizo, kiTab (+49 more)

### Community 1 - "Character Sheet & Tabs"
Cohesion: 0.19
Nodes (6): NpcSheet, CHARACTERISTICS, COMBAT_SKILLS, NpcSheetApp(), RESISTANCES, ReactSheet

### Community 2 - "Character Data & Modifiers"
Cohesion: 0.09
Nodes (29): ArmorPenaltyKind, CharacteristicKey, SECONDARY_ABILITIES_BY_GROUP, SECONDARY_ABILITY_GROUPS, SECONDARY_ABILITY_MAP, SecondaryAbilityDefinition, SecondaryAbilityGroup, ARCHETYPE_LABELS (+21 more)

### Community 3 - "Item Data Models"
Cohesion: 0.06
Nodes (51): ArmorModel, ArmorSchema, armorTypeField(), combatBonusSchema(), descriptionSchema(), mkCostSchema(), BaseItemModel, BaseItemSchema (+43 more)

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
Cohesion: 0.24
Nodes (9): capitalize(), Vital, VitalsStrip(), VitalsStripProps, CalcTip, CalcTooltip(), CalcTooltipProps, parseTip() (+1 more)

### Community 9 - "Project Documentation"
Cohesion: 0.09
Nodes (22): Anima: Beyond Fantasy RPG, Anima Beyond Foundry, anime-beyond-fantasy-docs (Game Rules Reference), `../anime-beyond-fantasy-docs/` — Reglas del juego, Arcana Exxet (Magic & Supernatural Rules PDF), Arquitectura: dominios verticales, Carpetas de referencia (solo lectura, NUNCA modificar), Core Exxet (Main Rules PDF) (+14 more)

### Community 10 - "Principal & Summary Tabs"
Cohesion: 0.22
Nodes (9): Armaduras, Calidad (cada +5 de una armadura), Capas de armadura, Combinación de TAs, Estado en el código, Estructura de datos de una armadura, Llevar Armadura, requerimiento y penalizador natural, Pendiente de volcar (⚠️ verificar en Core Exxet) (+1 more)

### Community 11 - "Vitals & Tooltips"
Cohesion: 0.09
Nodes (23): Características, Combate — cálculo de estadísticas, Combate — resolución de tiradas/daño automático, Contagio, vehículos, ambientación, Convención de estado de implementación, Creación de personaje, Código muerto detectado, Cómo mantener este documento (+15 more)

### Community 12 - "Characteristics Display"
Cohesion: 0.32
Nodes (14): prepareCharacteristics(), prepareCombat(), prepareEquipment(), prepareSecondaries(), prepareSecondaryImprovement(), prepareState(), prepareSupernatural(), sumPerLevel() (+6 more)

### Community 13 - "Combat Stats Display"
Cohesion: 0.10
Nodes (30): KI_CHAR_KEYS, KiAbilityData, KiCharBreakdown, KiCharKey, KiData, KiSystemSlice, DpSkill, MagicData (+22 more)

### Community 14 - "Deep Entity Extraction"
Cohesion: 0.06
Nodes (45): ActorSystemMap, ActorType, AnimaActor, AnimaItem, ItemSystemMap, ItemType, GROUP_LABELS, GROUP_ORDER (+37 more)

### Community 15 - "Entity Extraction"
Cohesion: 0.14
Nodes (25): getActionsPerTurn(), getLifePointsBase(), getModifier(), getMovementSpeed(), getRegeneration(), getRegenerationRow(), lookup1to20(), MOVEMENT_SPEED (+17 more)

### Community 16 - "Derived Stats Display"
Cohesion: 0.14
Nodes (11): ChatListener, chatListeners, FieldOptions, format(), g, HTMLField, localize(), messages (+3 more)

### Community 17 - "Supernatural Stats"
Cohesion: 0.31
Nodes (7): AnyRecord, legacyDpRecord(), legacyDpTotal(), migrateCharacterDp(), migrateDpField(), migrateKiField(), migrateSecondaryNatural()

### Community 19 - "Community 19"
Cohesion: 0.10
Nodes (20): ActionModBreakdown, COMBAT_CHAR, CombatSkillData, CombatSystemSlice, AT_TYPES, AtType, ceil10(), combineAt() (+12 more)

### Community 20 - "Community 20"
Cohesion: 0.17
Nodes (12): Convocación (Invocaciones y Encarnaciones), Dificultad y alcance (tabla de la hoja Excel — equivale al Recuadro X), El mantenimiento de los conjuros (Core p. 120 — confirmado), Estado en el código, Generalidades (Core p. 121), Magia, Metamagia (Arcana Exxet — mención breve), Pendiente de volcar (⚠️ verificar) (+4 more)

### Community 22 - "Community 22"
Cohesion: 0.18
Nodes (11): Concentración (Tabla 69, Core p. 211 — confirmado), CVs (Consumos de Voluntad) y Potencial Psíquico, Dificultad y alcance de un poder psíquico (tabla confirmada, hoja Psíquicos), Disciplinas y patrones mentales, Estado en el código, Fracaso psíquico y fatiga (Core p. 211 — confirmado), Mantenimiento de poderes: los innatos (Core p. 212 — confirmado), Pendiente (fuera del motor actual) (+3 more)

### Community 25 - "Community 25"
Cohesion: 0.09
Nodes (24): ACTION_LABELS, MisticosTab(), sign(), SUMMONING_SKILLS, ACTION_LABELS, CONCENTRATION_ROWS, CV_COST_ROWS, StubPanel() (+16 more)

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
Cohesion: 0.27
Nodes (9): CharacterSchema, dpRecordField(), dpSkillField(), kiCharField(), characteristicField(), CreatureSchema, DEFAULT_SECONDARY_ABILITIES, PrepMode (+1 more)

### Community 30 - "Community 30"
Cohesion: 0.29
Nodes (7): Confirmado: cada sistema tiene su propia mecánica, Detalle por sistema (resumen; el detalle completo está en cada doc), Estado en el código, Interacción con Resistencias (Core p. 121 — confirmado), Mantenimiento y efectos activos (transversal), Pendiente de volcar (⚠️ verificar), Relación con otras reglas ya documentadas

### Community 31 - "Community 31"
Cohesion: 0.29
Nodes (7): Cansancio (Tabla 27, Core Exxet p. 60 — confirmado), Categorías de modificadores (según la ficha oficial), Ejemplo, Estado en el código, Modificadores y reglas de acumulación, Pendiente de volcar (⚠️ verificar en Core Exxet), Reglas de acumulación

### Community 32 - "Community 32"
Cohesion: 0.22
Nodes (10): Cell, COLUMNS, META_LAYOUT, MetaGraph, METAMAGIA_GRAPH, MetaNode, nodeX(), nodeY() (+2 more)

### Community 33 - "Community 33"
Cohesion: 0.18
Nodes (9): ActorKey, ACTORS, App(), buildSheetProps(), character, npc, useActorVersion(), sandboxChat (+1 more)

### Community 34 - "Community 34"
Cohesion: 0.50
Nodes (3): Cómo funciona, Límites conocidos, Sandbox de UI

### Community 35 - "Community 35"
Cohesion: 0.16
Nodes (7): ArrayField, BooleanField, clone(), DataField, NumberField, ObjectField, TypedObjectField

### Community 36 - "Community 36"
Cohesion: 0.11
Nodes (26): CharacterSheet, CharacterSheetApp(), TAB_COMPONENTS, AnimaItemView, CompendiumEntry, ItemOps, ReactSheetProps, KI_CHARS (+18 more)

### Community 37 - "Community 37"
Cohesion: 0.67
Nodes (3): Convenciones de estos documentos, Reglas de Anima: Beyond Fantasy — Referencia para el desarrollo, Índice

### Community 38 - "Community 38"
Cohesion: 0.19
Nodes (9): ItemSheet, ITEM_TYPE_LABELS, ItemSheetApp(), DEFAULT_TABS, ITEM_TAB_CONFIG, ApplicationV2Like, ReactApplicationMixin(), ReactItemSheet (+1 more)

### Community 39 - "Community 39"
Cohesion: 0.25
Nodes (6): ARMOR_TYPE_LABELS, AT_TYPES, CombateTab(), LOCALIZATION_LABELS, SIZE_LABELS, WEAPON_TYPE_LABELS

### Community 40 - "Community 40"
Cohesion: 0.17
Nodes (14): CategoryDevelopment, collectSpends(), DevelopmentData, developmentPointsForLevel(), prepareDevelopment(), ReserveKey, ReserveStatus, DEFAULT_DP_LIMITS (+6 more)

### Community 41 - "Community 41"
Cohesion: 0.24
Nodes (6): CharacteristicData, CHARACTERISTIC_KEYS, defaultCategoryData(), ctxFor(), kiCategory(), category()

### Community 42 - "Community 42"
Cohesion: 0.40
Nodes (5): Datos por habilidad (confirmados con ficha-test01), Fórmula del total (confirmada, PDs!AA129), Habilidades fuera de la lista fija, Habilidades secundarias, Mejora natural (columnas "Bon.", "Hab." y "Novel" — confirmada y modelada)

### Community 43 - "Community 43"
Cohesion: 0.13
Nodes (18): CategorySystemSource, categorySystemToData(), ImprovementStatus, PHYSICAL_CHARS, SecondariesSystemSlice, SecondaryAbilityData, SecondaryAbilityDef, SecondaryImprovementData (+10 more)

### Community 44 - "Community 44"
Cohesion: 0.21
Nodes (10): characterFixture(), npcFixture(), packItem(), DocumentSource, MockActorInit, cloneSource(), findByUuid(), modules (+2 more)

### Community 45 - "Community 45"
Cohesion: 0.14
Nodes (4): ItemWindow, applyPathUpdate(), MockActor, MockItem

### Community 48 - "Community 48"
Cohesion: 0.33
Nodes (5): BIO_FIELDS, FAME, GeneralTab(), MONEY, TEXT_BLOCKS

### Community 49 - "Community 49"
Cohesion: 0.12
Nodes (19): LEVEL_ADJUSTMENTS, CHARS, PrincipalTab(), RES, sign(), TRAIT_SUBTYPE_LABELS, SUMMARY_CONFIG, SummaryFieldDef (+11 more)

## Knowledge Gaps
- **302 isolated node(s):** `name`, `version`, `description`, `type`, `dev` (+297 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `SectionCard()` connect `Community 25` to `Item Sheet Tabs & UI`, `Character Sheet & Tabs`, `Character Data & Modifiers`, `Community 36`, `Community 39`, `Community 48`, `Community 49`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Why does `defaultCategoryData()` connect `Community 41` to `Character Data & Modifiers`, `Community 40`, `Community 43`, `Characteristics Display`, `Combat Stats Display`, `Entity Extraction`, `Community 19`, `Community 29`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Why does `CategoryData` connect `Community 43` to `Character Data & Modifiers`, `Item Data Models`, `Community 40`, `Community 41`, `Combat Stats Display`, `Entity Extraction`, `Community 29`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _303 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Item Sheet Tabs & UI` be split into smaller, more focused modules?**
  _Cohesion score 0.05086071987480438 - nodes in this community are weakly interconnected._
- **Should `Character Data & Modifiers` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._
- **Should `Item Data Models` be split into smaller, more focused modules?**
  _Cohesion score 0.055078416728902166 - nodes in this community are weakly interconnected._