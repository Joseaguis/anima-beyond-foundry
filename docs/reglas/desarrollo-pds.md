# Puntos de Desarrollo (PD) y categorías

Reparto de PDs de la ficha, multi-categoría y límites por reserva. Fuente:
hoja `PDs` y `Tabla general de Categorías` del Excel
`Ficha Anima v8.7.0.xlsx` (Markdown en
`../anime-beyond-fantasy-docs/graphify-out/converted/Ficha Anima v8.7.0_fff267d3.md`,
hoja PDs en líneas 867-1036 y tabla maestra en 2130-2157).

## PD totales por nivel

- **Confirmado**: nivel 0 → **400 PD** (Excel, líneas 507 y 882).
- **Confirmado**: `600 + 100·(nivel−1)` a partir de nivel 1 (+100 PD por
  nivel). Contrastado con la ficha rellenada `ficha-test01.xlsx` (nivel 10 →
  1500 PD, celda PDs!T17) en
  [tests/ficha-test01.test.ts](../../tests/ficha-test01.test.ts).
- Implementación: `developmentPointsForLevel()` en
  `src/actors/creature/prep/development.ts`.

## Multi-categoría (progresión)

**Confirmado** (estructura de la hoja PDs): un personaje puede tener hasta 5
categorías en orden cronológico. Cada habilidad lleva un par
`(Coste, PDs gastados)` **por categoría**, más columnas resultado
`Base | Bono | Categoría | Especial | Total`.

- Implementación: `system.categories` en el character = array ordenado de
  tramos `{ key, itemId, levels, changeCost }`. Cada gasto de PD es un
  `Record<key, número>` (campo `dp`). Los items de tipo `category` aportan
  costes/bonos vía `categoryDataById` (ver `src/items/category/model.ts`).
- **Base comprada** = Σ por categoría de `floor(pd_categoría / coste_categoría)`.
  El floor se aplica **por categoría** (cada columna del Excel divide su propio
  gasto por su propio coste); repartir un gasto entre categorías puede perder
  restos, igual que en el Excel.
- **Bonos innatos** (`combatBonusPerLevel`, bonos de secundarias…) = Σ por
  categoría de `bono/nivel × niveles cursados en esa categoría`.
- **Tasas sin gasto asociado** (múltiplo de ACT): se usa el de la **última**
  categoría (la actual).
- El nivel del personaje pasa a ser derivado: Σ de `levels` de los tramos.

## Cambio de categoría

- **Confirmado** (texto de la hoja PDs, líneas 880-884): mínimo **2 niveles**
  en una categoría antes de cambiar; el cambio cuesta PDs y se registra por
  transición (columnas Antigua/Nueva/Coste).
- **⚠️ Verificar**: la fórmula exacta del coste (comunidad: 60 PD, reducido a
  20 si comparten arquetipo; los arquetipos por categoría están en la tabla
  maestra). Hasta verificarla, `changeCost` es un campo editable por tramo.
  Dato confirmado: Guerrero (fighter) → Tecnicista (domine) cuesta **60 PD**
  (ficha-test01, celda PDs!Y7).

## Límites por reserva

**Confirmado** (tabla maestra, columnas `Limite Combate/Magia/Psi`): cada
categoría define la fracción de los PD totales que puede invertirse en cada
reserva (0.5 o 0.6). Reservas y qué gasto computa en cada una:

| Reserva | Gastos que computan |
| --- | --- |
| Combate | H. Ataque, H. Parada, H. Esquiva, Llevar Armadura, Conocimiento Marcial, **Puntos de Ki y Acumulación de Ki** |
| Mística | Zeón, Proyección Mágica (más adelante: Nivel de Magia, Convocación, tablas) |
| Psíquica | CV, Proyección Psíquica (más adelante: patrones, tablas) |

Las secundarias no tienen límite propio: solo computan contra el total.

### Modo "Combinado" (el implementado, por defecto del Excel)

Cada categoría calcula por separado sus límites, **manteniendo los límites de
las categorías anteriores**: en cada etapa i de la progresión,
`límite_i = floor(fracción_i × PD_totales(nivel acumulado_i))`, y el gasto de
la reserva asignado a las etapas 0..i no puede superarlo. Ejemplo confirmado
con la ficha (Paladín 5 / Guerrero Acróbata 3 / Tecnicista 2, todos 60% de
combate): límites 600 → 780 → 900.

El Excel tiene más modos (`Mayor combinado`, `Individual`, `Último`, `Mejor`,
hoja PDs líneas 871-876) — **⚠️ Verificar** su semántica exacta en las fórmulas
del xlsx. El campo `system.dpConfig.limitMode` los acepta pero de momento todo
cae a "combined".

**Política de validación**: como el Excel, el sistema **no recorta** el gasto
que excede un límite; lo señala (`over`, `warnings` en `system.development`) y
la UI lo pinta en rojo.

## Costes por categoría

**Confirmado** — tabla maestra (líneas 2134-2155 del md). Volcado completo en
los packs `src/packs/_source/categories/*.json`. Columnas mapeadas:

- `Turno` → `initiativePerLevel`; `PV` → `lpPerLevel`; `CosteMultiploPV` →
  `lifeMultiple`; `Conocimiento Marcial` → `martialKnowledgePerLevel`.
- `Limite Combate/Magia/Psi` → `dpLimits.{combat,magic,psychic}`.
- `H. Ataque/Parada/Esquiva/Llevar Armadura` (bonos innatos por nivel) →
  `combatBonusPerLevel`. **Confirmado**: el bono innato de categoría a
  ataque/parada/esquiva se **capa en +50** (fórmula `MIN(50, …)` en PDs!X25);
  Llevar Armadura no tiene cap. `Zeón` innato → `supernatural.zeonPerLevel`
  (**pendiente de aplicar** al Zeón máximo). El CV innato por `Nv/CV` →
  `supernatural.levelsPerCv` **ya se aplica** en `prepareSupernatural`
  (fórmula PDs!X111: la primera categoría da `1 + (niveles−1)/NvCV`, las
  siguientes `niveles/NvCV`; se trunca la suma al final).
- Costes: `CosteH.*` → `combatCosts`; `CosteKi/CosteAcumKi` →
  `supernatural.ki/kiAccMultiple`; `CosteZeón/CosteACT/CosteProyección` →
  `supernatural.zeon/actMultiple/magicProjection`; `CosteCV/CosteProyección
  psíquica` → `supernatural.cv/psychicProjection`; `CosteConvocar` →
  `supernatural.summoning` (las 4 habilidades de convocación por separado,
  pendientes).
- Grupos de secundarias → `secondaryCosts`; costes individuales
  (`CosteP. Fuerza`…) → `secondaryCostOverrides` con semántica
  **coste efectivo = min(grupo, override)**; bonos innatos por habilidad
  individual → `secondaryAbilityBonusPerLevel`. **No existen bonos innatos por
  grupo** en el Excel (el campo `secondaryBonusPerLevel` queda a 0, deprecado).
- **Conocimiento Marcial comprado**: coste **5 PD/punto** en todas las
  categorías (hoja PDs línea 904) → `system.combat.martialKnowledge.dp`.
- **Capacidades de combate como items** (sección de la hoja PDs): las tablas de
  armas (`weaponTable.dpCost`), tablas de estilo y artes marciales
  (`combatStyle.dpCost`) gastan PD; el `mkCost` de estilos/artes/ars magnus
  gasta CM (lo suma `prepareKi` a `ki.cmUsed`). `prepareDevelopment` publica el
  total en `development.itemDp`, lo suma a `spent` y lo cuenta contra el límite
  de combate **final** (los items no pertenecen a un tramo/categoría, así que
  — como los gastos huérfanos — no entran en los checks por tramo). Se listan
  y editan en la pestaña PDs de la hoja.

## Pendiente de volcar / implementar

- Coste exacto del cambio de categoría (ver arriba).
- Zeón innato (por nivel y por POD, ver [magia.md](magia.md)) en el cálculo
  sobrenatural.
- Gastos de PD aún no modelados: Convocar/Controlar/Atar/Desconvocar, Nivel de Magia comprado,
  patrones mentales, **múltiplos de vida** (coste `lifeMultiple` PD por
  múltiplo: en ficha-test01 son 15+20 PD que hoy no computan como gasto — ver
  el `it.fails` en tests/ficha-test01.test.ts), características compradas.
  (Los bonos naturales/de Novel ya están modelados como contadores por
  secundaria, ver [secundarias.md](secundarias.md).)
- Modos de límite distintos de "Combinado".
- Migración: los personajes previos al multi-clase se migran solos al abrirse
  (`migrateCharacterDp`): su gasto entero pasa al tramo `c1` y se siembra
  `categories` con un tramo con todos sus niveles apuntando al primer item de
  categoría del actor.
