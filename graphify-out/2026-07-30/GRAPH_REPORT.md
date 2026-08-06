# Graph Report - anima-beyond-foundry  (2026-07-26)

## Corpus Check
- 1258 files · ~312,238 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1360 nodes · 3146 edges · 69 communities (66 shown, 3 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5ced472a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

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
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]

## God Nodes (most connected - your core abstractions)
1. `SectionCard()` - 36 edges
2. `BaseItemModel` - 33 edges
3. `AnimaActor` - 30 edges
4. `NumberField()` - 26 edges
5. `AnimaItem` - 26 edges
6. `TextField()` - 23 edges
7. `RollModifier` - 21 edges
8. `CreatureModel` - 20 edges
9. `ItemTabProps` - 20 edges
10. `Detalle por sistema` - 19 edges

## Surprising Connections (you probably didn't know these)
- `graphify` --semantically_similar_to--> `Graphify Knowledge Graph Integration`  [INFERRED] [semantically similar]
  .github/copilot-instructions.md → CLAUDE.md
- `MockActor` --references--> `AnimaRuleElement`  [EXTRACTED]
  sandbox/mock-documents.ts → src/rules/rule-element/base.ts
- `MockActor` --references--> `AnimaSynthetics`  [EXTRACTED]
  sandbox/mock-documents.ts → src/rules/synthetics.ts
- `buildRollOps()` --calls--> `buildStatistics()`  [EXTRACTED]
  sandbox/roll-bridge.ts → src/system/statistic/build.ts
- `DamageCalculator()` --calls--> `num()`  [INFERRED]
  src/components/character/tabs/CombateTab.tsx → scripts/extract-technique-tables.ts

## Import Cycles
- 3-file cycle: `src/documents/actor.ts -> src/rules/index.ts -> src/rules/rule-element/base.ts -> src/documents/actor.ts`
- 3-file cycle: `src/documents/actor.ts -> src/system/statistic/statistic.ts -> src/system/check/check.ts -> src/documents/actor.ts`
- 3-file cycle: `src/documents/actor.ts -> src/system/statistic/statistic.ts -> src/system/statistic/house-rules.ts -> src/documents/actor.ts`
- 3-file cycle: `src/documents/item.ts -> src/items/physical/model.ts -> src/items/base/model.ts -> src/documents/item.ts`
- 4-file cycle: `src/documents/actor.ts -> src/rules/index.ts -> src/rules/rule-element/flat-modifier.ts -> src/rules/rule-element/base.ts -> src/documents/actor.ts`
- 4-file cycle: `src/documents/actor.ts -> src/rules/index.ts -> src/rules/rule-element/roll-modifier.ts -> src/rules/rule-element/base.ts -> src/documents/actor.ts`
- 4-file cycle: `src/documents/actor.ts -> src/system/statistic/build.ts -> src/system/statistic/statistic.ts -> src/system/check/check.ts -> src/documents/actor.ts`
- 4-file cycle: `src/documents/actor.ts -> src/system/statistic/build.ts -> src/system/statistic/statistic.ts -> src/system/statistic/house-rules.ts -> src/documents/actor.ts`

## Hyperedges (group relationships)
- **Game Rules Source Documents** — claude_core_exxet, claude_arcana_exxet, claude_dominus_exxet, claude_prometheum_exxet, claude_ficha_anima_excel [EXTRACTED 1.00]
- **Project Reference Architecture Pattern** — claude_anima_beyond_foundry, claude_anime_beyond_fantasy_docs, claude_pf2e_reference [EXTRACTED 1.00]

## Communities (69 total, 3 thin omitted)

### Community 0 - "Item Sheet Tabs & UI"
Cohesion: 0.08
Nodes (42): DESCRIPTION_TAB, ITEM_SHEET_CONFIG, RULES_TAB, ItemSheetConfig, ItemTabDef, ItemTabProps, PhysicalSidebar(), ARMOR_TYPES (+34 more)

### Community 1 - "Character Sheet & Tabs"
Cohesion: 0.14
Nodes (8): CELL_SEP, CRIT_GRID, HANDS_LABELS, ROW_SEP, SIZE_LABELS, typeBanner(), VALUE_GRID, WeaponBlock()

### Community 2 - "Character Data & Modifiers"
Cohesion: 0.10
Nodes (26): CharacteristicKey, SECONDARY_ABILITIES_BY_GROUP, SECONDARY_ABILITY_GROUPS, SECONDARY_ABILITY_MAP, SecondaryAbilityDefinition, SecondaryAbilityGroup, defaultCategoryData(), ARCHETYPE_LABELS (+18 more)

### Community 3 - "Item Data Models"
Cohesion: 0.21
Nodes (8): ArmorModel, ArmorSchema, armorTypeField(), PhysicalItemModel, PhysicalItemSchema, PsychicPowerSchema, WeaponModel, WeaponSchema

### Community 4 - "Categories & Build Tools"
Cohesion: 0.29
Nodes (9): compileAll(), declaredPackNames(), DEST_ROOT, main(), makeId(), root, SOURCE_ROOT, STAGE_ROOT (+1 more)

### Community 5 - "Package Configuration"
Cohesion: 0.06
Nodes (30): dependencies, react, react-dom, description, devDependencies, @foundryvtt/foundryvtt-cli, fvtt-types, tailwindcss (+22 more)

### Community 6 - "TypeScript Configuration"
Cohesion: 0.10
Nodes (19): compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, jsx, module, moduleResolution, noEmit (+11 more)

### Community 7 - "FoundryVTT Type Defs"
Cohesion: 0.40
Nodes (5): FoundryActor, FoundryCompendium, FoundryDocument, FoundryEmbeddedCollection, FoundrySheet

### Community 8 - "Item Sheet Rendering"
Cohesion: 0.09
Nodes (23): capitalize(), Vital, VitalsStrip(), VitalsStripProps, ITEM_TYPE_LABELS, ItemSheetApp(), buildTabs(), sidebarFor() (+15 more)

### Community 9 - "Project Documentation"
Cohesion: 0.09
Nodes (22): Anima: Beyond Fantasy RPG, Anima Beyond Foundry, anime-beyond-fantasy-docs (Game Rules Reference), `../anime-beyond-fantasy-docs/` — Reglas del juego, Arcana Exxet (Magic & Supernatural Rules PDF), Arquitectura: dominios verticales, Carpetas de referencia (solo lectura, NUNCA modificar), Core Exxet (Main Rules PDF) (+14 more)

### Community 10 - "Principal & Summary Tabs"
Cohesion: 0.22
Nodes (9): Armaduras, Calidad (cada +5 de una armadura), Capas de armadura, Combinación de TAs, Estado en el código, Estructura de datos de una armadura, Llevar Armadura, requerimiento y penalizador natural, Pendiente de volcar (⚠️ verificar en Core Exxet) (+1 more)

### Community 11 - "Vitals & Tooltips"
Cohesion: 0.08
Nodes (24): Características, Combate — cálculo de estadísticas, Combate — resolución de tiradas/daño automático, Contagio, vehículos, ambientación, Convención de estado de implementación, Creación de personaje, Código muerto detectado, Cómo mantener este documento (+16 more)

### Community 12 - "Characteristics Display"
Cohesion: 0.14
Nodes (24): assertLayout(), cell(), colIndex(), CONVERTED_DIR, DIFFICULTIES, DOCS_ROOT, emitDisciplines(), emitPowers() (+16 more)

### Community 13 - "Combat Stats Display"
Cohesion: 0.12
Nodes (27): cell(), colIndex(), CONVERTED_DIR, DOCS_ROOT, EFFECT_COLS, emitFreeAccess(), emitPaths(), emitSpells() (+19 more)

### Community 14 - "Deep Entity Extraction"
Cohesion: 0.12
Nodes (21): DEFAULT_SECONDARY_ABILITIES, GROUP_LABELS, GROUP_ORDER, localize(), ModifiersEditor(), ModifiersEditorProps, TYPE_LABELS, RuleElementSource (+13 more)

### Community 15 - "Entity Extraction"
Cohesion: 0.17
Nodes (15): CHARACTERISTIC_DIFFICULTIES, CharacteristicDifficultyKey, CharacteristicDifficultyRow, DIFFICULTY_KEYS, getLifePointsBase(), getMovementSpeed(), getRegeneration(), getRegenerationRow() (+7 more)

### Community 16 - "Derived Stats Display"
Cohesion: 0.09
Nodes (35): cell(), CHAR_KEYS, CLASES, colIndex(), CompendiumEntry, CONVERTED_DIR, DisadvantageDef, DisadvantageOption (+27 more)

### Community 17 - "Supernatural Stats"
Cohesion: 0.36
Nodes (7): AnyRecord, legacyDpRecord(), legacyDpTotal(), migrateCharacterDp(), migrateDpField(), migrateKiField(), migrateSecondaryNatural()

### Community 19 - "Community 19"
Cohesion: 0.14
Nodes (17): getActionsPerTurn(), ActionModBreakdown, COMBAT_CHAR, CombatSkillData, CombatSystemSlice, EquipBonusData, prepareCombat(), ceil10() (+9 more)

### Community 20 - "Community 20"
Cohesion: 0.17
Nodes (12): Convocación (Invocaciones y Encarnaciones), Dificultad y alcance (tabla de la hoja Excel — equivale al Recuadro X), El mantenimiento de los conjuros (Core p. 120 — confirmado), Estado en el código, Generalidades (Core p. 121), Magia, Metamagia (Arcana Exxet cap. 3 — verificado), Pendiente de volcar (⚠️ verificar) (+4 more)

### Community 21 - "Community 21"
Cohesion: 0.06
Nodes (54): analyzeEffect(), buildTechnique(), durationKi(), EffectAnalysis, emptyPerChar(), formatKiCost(), KI_DISPLAY_ORDER, sumDistribution() (+46 more)

### Community 22 - "Community 22"
Cohesion: 0.18
Nodes (11): Concentración (Tabla 69, Core p. 211 — confirmado), CVs (Consumos de Voluntad) y Potencial Psíquico, Dificultad y alcance de un poder psíquico (tabla confirmada, hoja Psíquicos), Disciplinas y patrones mentales, Estado en el código, Fracaso psíquico y fatiga (Core p. 211 — confirmado), Mantenimiento de poderes: los innatos (Core p. 212 — confirmado), Pendiente (+3 more)

### Community 25 - "Community 25"
Cohesion: 0.12
Nodes (15): ACTION_LABELS, MisticosTab(), sign(), SUMMONING_SKILLS, ActiveSpell, ActiveSpellsList(), ActiveSpellsListProps, GRADES (+7 more)

### Community 26 - "Community 26"
Cohesion: 0.22
Nodes (9): Armas enormes y gigantes (Core p. 73), Armas y combate físico, Ataques múltiples y dos armas (Core p. 88–89), Calidad (cada +5 de un arma), Estado en el código, Estructura de datos de un arma, Fórmulas (confirmadas), Pendiente de volcar (⚠️ verificar) (+1 more)

### Community 27 - "Community 27"
Cohesion: 0.25
Nodes (8): Cambio de categoría, Costes por categoría, Límites por reserva, Modo "Combinado" (el implementado, por defecto del Excel), Multi-categoría (progresión), PD totales por nivel, Pendiente de volcar / implementar, Puntos de Desarrollo (PD) y categorías

### Community 28 - "Community 28"
Cohesion: 0.25
Nodes (8): Creación de Técnicas (Dominus Exxet cap. 5 — confirmado), Dominios del Ki (árbol de habilidades, hoja `Ki`), Estado en el código, Habilidades del Ki: coste y duración individual (Core pp. 101–102 — confirmado), Ki, Mantener y sostener técnicas (Dominus pp. 46–47 — confirmado), Pendiente de volcar (⚠️ verificar en Dominus Exxet), Puntos de Ki y acumulación

### Community 29 - "Community 29"
Cohesion: 0.13
Nodes (13): CombatStyleModel, KiAbilityModel, MagicPathModel, PsychicPowerModel, ACTOR_MODELS, ITEM_MODELS, ModelConstructor, SheetConstructor (+5 more)

### Community 30 - "Community 30"
Cohesion: 0.29
Nodes (7): Confirmado: cada sistema tiene su propia mecánica, Detalle por sistema (resumen; el detalle completo está en cada doc), Estado en el código, Interacción con Resistencias (Core p. 121 — confirmado), Mantenimiento y efectos activos (transversal), Pendiente de volcar (⚠️ verificar), Relación con otras reglas ya documentadas

### Community 31 - "Community 31"
Cohesion: 0.29
Nodes (7): Cansancio (Tabla 27, Core Exxet p. 60 — confirmado), Categorías de modificadores (según la ficha oficial), Ejemplo, Estado en el código, Modificadores y reglas de acumulación, Pendiente de volcar (⚠️ verificar en Core Exxet), Reglas de acumulación

### Community 32 - "Community 32"
Cohesion: 0.16
Nodes (17): META_LAYOUT, nodeX(), nodeY(), entry(), Cell, COLUMNS, MetaGraph, METAMAGIA_GRAPH (+9 more)

### Community 33 - "Community 33"
Cohesion: 0.23
Nodes (5): BaseItemModel, MentalPatternModel, MentalPatternSchema, MonsterAbilityModel, MonsterAbilitySchema

### Community 34 - "Community 34"
Cohesion: 0.50
Nodes (3): Cómo funciona, Límites conocidos, Sandbox de UI

### Community 35 - "Community 35"
Cohesion: 0.06
Nodes (22): ArrayField, BooleanField, ChatListener, chatListeners, clone(), DataField, FieldOptions, format() (+14 more)

### Community 36 - "Community 36"
Cohesion: 0.05
Nodes (40): CharacterSheet, NpcSheet, CharacterSheetApp(), meetsTreeRequirement(), NpcSheetApp(), ApplicationV2Like, ReactApplicationMixin(), AnimaItemView (+32 more)

### Community 37 - "Community 37"
Cohesion: 0.67
Nodes (3): Convenciones de estos documentos, Reglas de Anima: Beyond Fantasy — Referencia para el desarrollo, Índice

### Community 38 - "Community 38"
Cohesion: 0.15
Nodes (10): ActorSystemMap, ActorType, AnimaItem, ItemSystemMap, ItemType, ItemSheet, rulesFromItem(), ReactItemSheet (+2 more)

### Community 39 - "Community 39"
Cohesion: 0.07
Nodes (40): TAB_COMPONENTS, WeaponBlocks(), ArmorPenaltyKind, ARMOR_TYPE_LABELS, AT_TYPES, CombateTab(), LOCALIZATION_LABELS, WEAPON_TYPE_LABELS (+32 more)

### Community 40 - "Community 40"
Cohesion: 0.14
Nodes (17): CheckDialogApplication, CheckDialogInput, promptCheckDialog(), CheckDialogApp(), CheckDialogProps, CheckDialogResult, CHECK_TYPES, CheckDifficulty (+9 more)

### Community 41 - "Community 41"
Cohesion: 0.15
Nodes (23): resolveCheck(), resolveSuccess(), usesDifficultyLadder(), getDifficultyForValue(), RollBackend, D100Options, D100Result, effectiveFumbleThreshold() (+15 more)

### Community 42 - "Community 42"
Cohesion: 0.40
Nodes (5): Datos por habilidad (confirmados con ficha-test01), Fórmula del total (confirmada, PDs!AA129), Habilidades fuera de la lista fija, Habilidades secundarias, Mejora natural (columnas "Bon.", "Hab." y "Novel" — confirmada y modelada)

### Community 43 - "Community 43"
Cohesion: 0.17
Nodes (15): CategoryDevelopment, collectSpends(), DevelopmentData, DevelopmentSystemSlice, prepareDevelopment(), ReserveKey, ReserveStatus, FATIGUE_PENALTIES (+7 more)

### Community 44 - "Community 44"
Cohesion: 0.07
Nodes (26): Contexto, Decisiones ya tomadas, Fase 0 — Schema: `description.gm`, `slug` y `effect` como HTML, Fase 1 — `<RichTextEditor>`: ProseMirror dentro de React, Fase 2 — Props de la sheet: nombre e imagen editables, `isGM`, `uuid`, Fase 3 — Nuevo registro: `ITEM_SHEET_CONFIG`, Fase 4 — `ItemSheetApp.tsx`: la anatomía PF2e, Fase 5 — Pestaña Reglas (fusión de Modificadores) (+18 more)

### Community 45 - "Community 45"
Cohesion: 0.14
Nodes (4): ItemWindow, applyPathUpdate(), MockActor, MockItem

### Community 46 - "Community 46"
Cohesion: 0.21
Nodes (21): characteristicCheckSelectors(), defenseSelectors(), initiativeSelectors(), magicProjectionSelectors(), psychicPotentialSelectors(), psychicProjectionSelectors(), resistanceCheckSelectors(), secondaryCheckSelectors() (+13 more)

### Community 48 - "Community 48"
Cohesion: 0.16
Nodes (17): CharacterModel, CharacterSchema, dpRecordField(), dpSkillField(), kiCharField(), characteristicField(), CreatureSchema, equipBonusField() (+9 more)

### Community 49 - "Community 49"
Cohesion: 0.16
Nodes (11): DIFFICULTY_LEVELS, ACTION_LABELS, localize(), RulesTab(), StubPanel(), DifficultyTable(), Innato, InnatosList() (+3 more)

### Community 50 - "Community 50"
Cohesion: 0.22
Nodes (9): FlatModifierRuleElement, RollModifierRuleElement, isModifierType(), Modifier, ModifierType, StackableModifier, AnimaSynthetics, AnimaStatistic (+1 more)

### Community 51 - "Community 51"
Cohesion: 0.31
Nodes (7): KiCharKey, kiDistributionField(), KiTechniqueModel, KiTechniqueSchema, TechniqueBuildResult, TechniqueProfile, slugify()

### Community 52 - "Community 52"
Cohesion: 0.27
Nodes (10): prepareSupernatural(), baseFromDp(), innateCv(), preparePsychic(), CONCENTRATION_BONUSES, CV_FREE_USES, getPotentialIncrementBonus(), getPsychicPotentialByVol() (+2 more)

### Community 53 - "Community 53"
Cohesion: 0.18
Nodes (7): randomBackend(), AnimaActor, extractRollOptions(), emptySynthetics(), buildRollOps(), AnimaStatistic, localize()

### Community 54 - "Community 54"
Cohesion: 0.23
Nodes (10): CheckOutcome, isOpposedAttack(), postCheckMessage(), rollCheck(), CheckResult, DifficultyRow, AnimaRoll, AnimaRollData (+2 more)

### Community 55 - "Community 55"
Cohesion: 0.11
Nodes (30): DifficultyKey, lookup1to20(), ActiveSpellData, DpSkill, MagicData, MagicPathData, MagicSystemSlice, SpellData (+22 more)

### Community 56 - "Community 56"
Cohesion: 0.22
Nodes (11): combatBonusSchema(), descriptionSchema(), mkCostSchema(), BaseItemSchema, CombatStyleData, CombatStyleSchema, CreatureModel, KiAbilitySchema (+3 more)

### Community 57 - "Community 57"
Cohesion: 0.13
Nodes (15): Controles de Característica, Controles de Resistencia, La Maestría, La Pifia, La Tirada Abierta, Los dos dados, Pendiente de volcar, Potencial psíquico y escala de dificultades (+7 more)

### Community 58 - "Community 58"
Cohesion: 0.38
Nodes (13): escapeHtml(), localize(), outcomeClass(), renderBreakdown(), renderCheckCard(), renderCheckHtml(), renderDefenseButtons(), renderDice() (+5 more)

### Community 59 - "Community 59"
Cohesion: 0.26
Nodes (11): readAnimaFlags(), applyDamage(), DEFENSE_STATISTICS, handleSocketRequest(), onApplyDamage(), onDefend(), pickDefenseStatistic(), readArmorTypes() (+3 more)

### Community 60 - "Community 60"
Cohesion: 0.31
Nodes (11): AbsorptionBreakdown, AbsorptionInput, applyDamagePercent(), computeAbsorption(), damagePercent(), toAtType(), counterattackBonus(), resolveRound() (+3 more)

### Community 61 - "Community 61"
Cohesion: 0.23
Nodes (11): CategorySystemSource, categorySystemToData(), CategoryModel, CategorySchema, combatBonusField(), combatCostField(), secondaryBonusField(), secondaryCostField() (+3 more)

### Community 62 - "Community 62"
Cohesion: 0.38
Nodes (3): spellGradeField(), SpellModel, SpellSchema

### Community 63 - "Community 63"
Cohesion: 0.26
Nodes (10): KI_CHAR_KEYS, KiAbilityData, KiCharBreakdown, KiData, KiSystemSlice, prepareKi(), getInnateKiAccumulation(), getInnateKiPoints() (+2 more)

### Community 64 - "Community 64"
Cohesion: 0.14
Nodes (10): ACTION_TYPES, MAINTENANCE_TYPES, RESISTANCE_TYPES, SPELL_GRADES, SPELL_TYPES, SpellTab(), FallbackEditor(), nest() (+2 more)

### Community 65 - "Community 65"
Cohesion: 0.26
Nodes (6): AnimaRuleElement, RuleElementConstructor, isPredicate(), Predicate, testPredicate(), extractRollModifiers()

### Community 66 - "Community 66"
Cohesion: 0.23
Nodes (11): AnimaChatFlags, ApplyDamageRequest, CheckFlag, OpposedFlag, StrikeFlag, CheckContext, CheckResolveInput, AnimaCheckType (+3 more)

### Community 67 - "Community 67"
Cohesion: 0.24
Nodes (9): ImprovementStatus, PHYSICAL_CHARS, prepareSecondaries(), prepareSecondaryImprovement(), SecondariesSystemSlice, SecondaryAbilityData, SecondaryAbilityDef, SecondaryImprovementData (+1 more)

## Knowledge Gaps
- **399 isolated node(s):** `name`, `version`, `description`, `type`, `dev` (+394 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `DamageCalculator()` connect `Derived Stats Display` to `Community 39`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Why does `AnimaActor` connect `Community 53` to `Community 65`, `Community 66`, `Community 36`, `Community 38`, `Community 40`, `Community 46`, `Community 48`, `Community 50`, `Community 54`, `Community 59`, `Community 29`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _400 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Item Sheet Tabs & UI` be split into smaller, more focused modules?**
  _Cohesion score 0.08348457350272233 - nodes in this community are weakly interconnected._
- **Should `Character Sheet & Tabs` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._
- **Should `Character Data & Modifiers` be split into smaller, more focused modules?**
  _Cohesion score 0.09879032258064516 - nodes in this community are weakly interconnected._
- **Should `Package Configuration` be split into smaller, more focused modules?**
  _Cohesion score 0.06451612903225806 - nodes in this community are weakly interconnected._