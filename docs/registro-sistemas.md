# Registro de sistemas — estado de implementación

Este documento es el registro vivo de **qué sistemas de Anima: Beyond Fantasy están
implementados en este proyecto y en qué grado**, incluyendo partes de la
arquitectura/UI que no son en sí mismas "reglas del juego" (p. ej. si un tab de la
ficha es un placeholder o ya funciona). Es, en la práctica, el TODO-list del
desarrollo.

Se complementa con [docs/reglas/](reglas/README.md), que documenta **el contenido de
las reglas** (fórmulas, tablas, mecánica del manual). La relación entre ambos:

- `docs/reglas/*.md` responde a "¿qué dice el reglamento?" y usa `⚠️ Verificar` para
  marcar reglas de memoria o sin contrastar con el manual.
- Este documento responde a "¿qué hay implementado en el código de eso?" — es una
  dimensión distinta e independiente: un sistema puede tener sus reglas ya
  confirmadas y seguir "No implementado" en código, o viceversa.

Sustituye a `docs/System-target.md` (que estaba vacío y sin uso).

## Convención de estado de implementación

Sin introducir emojis nuevos que choquen con el `⚠️ Verificar` de `docs/reglas/`
(ese símbolo sigue significando únicamente "confianza en la fuente de la regla").
Aquí el estado se expresa solo en texto:

- **Completo** — implementado y cubierto por tests.
- **Parcial** — una parte funciona; el detalle de qué falta va en la subsección.
- **Solo ficha de datos** — existe el modelo/Item con campos pero ninguna lógica
  runtime los consume (típico de mecánicas descritas solo como metadatos).
- **Placeholder** — solo hay un stub de UI (`StubPanel`), sin modelo de datos propio.
- **No implementado** — no hay ningún rastro en el código.

## Tabla resumen

| Sistema | Nivel | Regla asociada |
| --- | --- | --- |
| Características | Completo | — |
| Habilidades secundarias (PJ) | Completo | — |
| Combate — cálculo de estadísticas (HA/HP/Esquiva/daño/armadura) | Completo | [armas-y-combate.md](reglas/armas-y-combate.md), [armaduras.md](reglas/armaduras.md) |
| Combate — resolución de tiradas/daño automático | No implementado | [armas-y-combate.md](reglas/armas-y-combate.md) |
| Magia — fórmulas derivadas (Zeón/ACT/Proyección) | Completo | [magia.md](reglas/magia.md) |
| Magia — hechizos y su mantenimiento en runtime | Solo ficha de datos | [magia.md](reglas/magia.md), [mantenimiento.md](reglas/mantenimiento.md) |
| Ki — fórmulas derivadas (puntos, acumulación) | Completo | [ki.md](reglas/ki.md) |
| Ki — construcción de técnicas (Dominus cap. 5) | Completo | [ki.md](reglas/ki.md) |
| Ki — poderes y uso de técnicas en runtime | Solo ficha de datos | [ki.md](reglas/ki.md), [mantenimiento.md](reglas/mantenimiento.md) |
| Psíquica — fórmulas derivadas (Potencial/CVs/Proyección) | Completo | [psiquica.md](reglas/psiquica.md) |
| Psíquica — poderes/disciplinas/patrones en runtime | Solo ficha de datos (sin UI) | [psiquica.md](reglas/psiquica.md) |
| Mantenimiento / efectos activos (transversal) | No implementado | [mantenimiento.md](reglas/mantenimiento.md) |
| Motor de modificadores (rule elements) | Completo (un solo tipo de regla) | [modificadores.md](reglas/modificadores.md) |
| Reglas especiales de ficha (house rules) | Parcial (catálogo con 1 regla: cap suave de bonos) | [secundarias.md](reglas/secundarias.md) |
| Fatiga | Completo | [modificadores.md](reglas/modificadores.md) |
| NPCs / criaturas | Completo en modo "directo"; sin secundarias/magia/ki/psíquica | — |
| Creación de personaje | Parcial (PD/CP existen; sin wizard ni bonos raciales) | — |
| Razas | Placeholder (solo lista de nombres) | — |
| Inventario / equipo | Completo (sin peso máximo/contenedores) | — |
| Fama, dinero, salud mental, biografía | Completo (solo almacenamiento, sin lógica de reglas) | — |
| Contagio, vehículos, ambientación | No existe | — |

## Detalle por sistema

### Características
**Completo.** Cálculo de valor final y modificador vía tabla en
[src/actors/creature/prep/characteristics.ts](../src/actors/creature/prep/characteristics.ts)
y [tables.ts](../src/actors/creature/tables.ts). Tests en `tests/tables.test.ts` y
`tests/prep-pipeline.test.ts`.

### Habilidades secundarias (personaje)
**Completo** para personajes (modo "dp"): coste por PD, cubo de Bonos
(`min(bono_car·(1+Bon.) + 10·Hab., 100)`, con la regla especial de cap suave),
mejora natural (contadores `naturalBonus`/`naturalAbilities`/`novelBonus` con
presupuestos por nivel en `system.secondaryImprovement`, avisos sin recorte),
bono de categoría (incluidos los bonos de Novel, `novelPerLevel`),
penalizadores de armadura/fatiga/acción, y soporte de secundarias
personalizadas (sin UI de alta/edición en el PDsTab todavía). Ver
[src/actors/creature/prep/secondaries.ts](../src/actors/creature/prep/secondaries.ts),
[src/data/secondaryAbilities.ts](../src/data/secondaryAbilities.ts),
[secundarias.md](reglas/secundarias.md). Los NPCs no las
tienen (`NpcModel` no llama `prepareSecondaries`).

### Reglas especiales de ficha (house rules)
**Parcial.** Catálogo tipado en
[src/rules/special-rules.ts](../src/rules/special-rules.ts) + persistencia por actor
(`system.specialRules`, activable desde la sección "Reglas especiales" de la pestaña
Principal) + flags agregadas en el pipeline (`PrepContext.flag`, alimentadas por la
ficha y por `synthetics.flags` para futuros rule elements). Única regla implementada:
`secondaryBonusSoftCap`. Previstas (solo diseño): PCs adicionales, rango de abierta,
rango de pifia.

### Combate — cálculo de estadísticas
**Completo.** HA/HP/Esquiva/Llevar Armadura, bono de daño, TA combinada multicapa,
iniciativa por arma, combate desarmado, armas enormes/gigantes. Ver
[src/actors/creature/prep/combat.ts](../src/actors/creature/prep/combat.ts) y
[equipment.ts](../src/actors/creature/prep/equipment.ts). Detalle de reglas en
[armas-y-combate.md](reglas/armas-y-combate.md) y [armaduras.md](reglas/armaduras.md).

### Combate — resolución de tiradas/daño automático
**No implementado.** `CombateTab.tsx` tiene una calculadora de daño manual (el
usuario introduce a mano el resultado de ataque/defensa/TA enemigo); no hay tirada de
dados, iniciativa en el Combat Tracker de Foundry, aplicación automática de daño ni
tarjetas de chat. Los campos de bonus de `combat-style`
(`attackBonus`/`defenseBonus`/...) tampoco están conectados al motor de rule
elements — son datos de exhibición salvo que se añada manualmente una regla
`FlatModifier`.

### Magia
**Fórmulas derivadas completas** (Zeón máximo/regeneración, ACT, Proyección Mágica) en
[src/actors/creature/prep/supernatural.ts](../src/actors/creature/prep/supernatural.ts).
**Los hechizos son solo fichas de datos**: `spell.maintenanceType`/`maintenanceCost`
existen en el modelo pero ningún código los usa en runtime — no se descuenta Zeón por
turno/día, no hay lista de hechizos activos en el actor, no hay tirada de Proyección
Mágica contra Resistencia. Detalle de reglas en [magia.md](reglas/magia.md).

### Ki
**Fórmulas derivadas completas** (puntos totales, acumulación) en
`src/domains/ki/prepare.ts`. **La construcción de técnicas está completa**: catálogo
de 65 Efectos y 24 Desventajas generado del Excel, constructor que deriva CM y coste
en Ki por característica con todas las validaciones, y perfil mecánico que declara
lo que hará la técnica. **Falta el runtime de uso**: los bonos persistentes se emiten
como rule elements con predicado `technique:<slug>:active`, que nadie activa todavía,
y nada consume Ki por asalto. Los poderes de Ki siguen siendo fichas de datos.
Detalle en [ki.md](reglas/ki.md).

### Psíquica
**Motor + modelos + tests completos (sin UI).** `supernatural.ts` (bloque `psy`) deriva
`cvMax`, Proyección, Potencial (base por VOL Tabla 68 + Incrementar Potencial Tabla 70) y
la economía de CVs (`cvUsed`/`cvFree`/`innatosCount`: afinidades, poderes dominados,
Fortalecer, innatos e Incrementar Potencial). Tablas nuevas en `tables.ts`
(`getPsychicPotentialByVol`, `getPotentialIncrementBonus`). Tres Items:
`psychic-discipline` (afinidad, espeja `magic-path`), `psychic-power` (poder, espeja
`spell`) y `mental-pattern` (contenido de rol, sin efecto derivado). Cubierto por
`tests/psychic.test.ts`. Pendiente: contenido concreto de poderes (compendio), la UI
(`PsiquicosTab.tsx` sigue `StubPanel`) y el runtime de mantenimiento/tirada. Detalle en
[psiquica.md](reglas/psiquica.md).

### Mantenimiento y efectos activos (transversal)
**No implementado — foco de atención especial.** Afecta por igual a magia, ki y
(posiblemente) psíquica: hechizos mantenidos como escudos, hechizos diarios y
técnicas de ki persistentes no tienen ningún runtime hoy. No existe ningún uso de
`ActiveEffect` de Foundry ni concepto de turno/duración en el motor de reglas
(`src/rules/rule-element/` solo implementa `FlatModifier`, un modificador estático
sin dimensión temporal). Los campos `maintenanceType`/`maintenanceCost`/
`kiMaintenance` son metadatos desconectados que ningún código lee. Ver el análisis
completo, comparando cómo cada sistema define "mantener", en
[mantenimiento.md](reglas/mantenimiento.md).

### Motor de modificadores (rule elements)
**Completo, con un solo tipo de regla implementado.** Sistema de stacking tipado
(`untyped`/`item`/`magic`/`status`/`circumstance`/`special`) en
[src/rules/modifier.ts](../src/rules/modifier.ts), bien testeado. Solo existe
`FlatModifierRuleElement`; el registro `RULE_ELEMENTS` está preparado para añadir más
tipos (por ejemplo, uno de duración, cuando se aborde el mantenimiento). Ver
[modificadores.md](reglas/modificadores.md).

### Fatiga
**Completo.** Tabla de penalización por puntos de cansancio (Tabla 27, Core Exxet)
aplicada a toda acción, en
[src/actors/creature/prep/state.ts](../src/actors/creature/prep/state.ts).

### NPCs / criaturas
**Completo en modo "stat block directo"** (`prepMode: "direct"`): comparten toda la
maquinaria de características/combate/equipo/vitales con personajes, pero **sin**
secundarias, magia/ki/psíquica ni categoría (`NpcModel.prepareDerivedData` no llama a
esas fases). `threatLevel` está marcado explícitamente en el código como indicador
solo informativo para el GM, sin efecto mecánico. UI completa pero minimalista (una
sola pantalla, sin tabs) en `NpcSheetApp.tsx`.

### Creación de personaje
**Parcial.** Existen `creationPoints` (total/gastado/restante) y puntos de desarrollo
(`developmentPoints`, fórmula por nivel), y rasgos (ventajas/desventajas) con coste en
PD. **No hay** asistente/wizard de creación, ni validación de límites, ni
bonificaciones raciales — `src/data/races.ts` es solo una lista `{id, labelKey}` de 7
razas para un desplegable, sin ningún efecto en el cálculo. `CategoryModel` toma solo
la primera categoría del actor (comentario explícito: soporte multi-clase pendiente).

### Razas
**Placeholder.** Solo lista de nombres (`src/data/races.ts`); el tab principal
muestra un placeholder literal donde deberían ir las "Capacidades raciales".

### Inventario / equipo
**Completo** en modelo de datos e integración con el cálculo de combate (equipar
arma/armadura contribuye automáticamente a las estadísticas derivadas). Sin carga/peso
máximo ni contenedores/mochilas.

### Fama, dinero, salud mental, biografía
**Completo como almacenamiento**, sin ninguna lógica de reglas asociada (son campos
simples con UI en `GeneralTab.tsx`): fama (audacia/cobardía/honor/infamia), dinero
(oro/plata/cobre), salud mental (`insanityThreshold`, por defecto = VOL), biografía y
apariencia.

### Contagio, vehículos, ambientación
**No existe.** Ningún rastro en tipos, carpetas ni referencias del código.

## Código muerto detectado

Estos componentes de UI no están importados por ningún componente activo (la ficha
actual usa exclusivamente los componentes bajo `tabs/`) y parecen restos de una
iteración anterior previa al rediseño por tabs. No se han borrado en esta tarea de
documentación, se registran como limpieza pendiente:

- `src/components/character/CombatStats.tsx`
- `src/components/character/DerivedStats.tsx`
- `src/components/character/Characteristics.tsx`
- `src/components/character/SupernaturalStats.tsx`

## Cómo mantener este documento

Actualizar el nivel de un sistema en cuanto cambie su implementación (al completar una
fase, al conectar un runtime, al reemplazar un placeholder). `docs/reglas/` sigue
siendo la fuente de verdad para el contenido de las reglas; este documento es la
fuente de verdad para el estado del código.
