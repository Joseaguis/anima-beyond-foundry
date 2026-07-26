# Ki

Fuente: Core Exxet cap. 10 "Los Dominios del Ki" (pp. 100–113, verificado contra el
texto del manual), Dominus Exxet cap. 5 "Creación de Técnicas de Ki" (pp. 44–47,
verificado) y `Ficha Anima v8.7.0.xlsx` → hojas `Ki`, `Creación de Técnicas`,
`Tablas Técnicas`.

## Puntos de Ki y acumulación

- **Puntos de Ki por característica** (fórmula del Excel, verificada con
  ficha-test01 hoja PDs filas 30-35): cada una de las 6 características (FUE,
  DES, AGI, CON, POD, VOL) aporta puntos innatos = **su valor**, o
  **10 + 2·(valor−10)** si supera 10 (DES 13 → 16). A eso se suman los puntos
  comprados con PD en esa característica (coste `supernatural.ki` por punto).
  Total de la ficha = Σ de las 6.
- **Acumulación por característica** (PDs filas 36-41; Core Exxet Tabla 53,
  verificada contra el Excel — cortes confirmados): innata **1** con valor
  **1–9**, **2** con **10–12**, **3** con **13–15** y **4** con **16–20**, más
  **1 por cada `kiAccMultiple` PD** invertidos en esa característica.
- Cada característica tiene su propia fila de acumulación (`Acu.`, `Mitad`, `Ki`,
  `Actual`) en la hoja de personaje — el ki se gasta/acumula **por característica**,
  no como un pozo único. **Implementado**: `system.ki` guarda `pointsDp` y `accDp`
  por característica (str/dex/agi/con/pow/wp); `prepareSupernatural` publica el
  desglose `ki.perChar[c]` y los agregados `pointsInnate/pointsBought/totalPoints`
  y `accInnate/accBought/accumulation` (tablas `getInnateKiPoints` /
  `getInnateKiAccumulation` en `tables.ts`). Los antiguos `it.fails` de
  [tests/ficha-test01.test.ts](../../tests/ficha-test01.test.ts) (ki total 62,
  acumulación 20) ya pasan; ver también [tests/ki.test.ts](../../tests/ki.test.ts).
  Los personajes previos se migran del pozo único a la nueva forma (bajo `pow`,
  atribución aproximada; los totales no cambian). Sigue **pendiente** el runtime de
  la mitad de concentración (`Mitad`) y el `Actual`. **Unificación del Ki** es un rasgo opcional (`Sí`/`No` en la
  ficha); la nota de la propia hoja aclara: *"Con Unificación del Ki no se unifican
  las acumulaciones"* — ⚠️ Verificar el efecto exacto de Unificación en Dominus
  Exxet p. 6.
- **Acumular Ki** (Core p. 101): en un asalto se puede usar tanto Ki como permita la
  acumulación; se puede concentrar Ki de todas las características a la vez o solo de
  algunas. Si la acumulación no basta en un solo turno, se pueden mantener los puntos
  ya reunidos y seguir acumulando en asaltos posteriores. Si el personaje **realiza
  cualquier otra maniobra en el asalto, incluso pasiva**, al finalizar el asalto su
  concentración se reduce a **la mitad redondeada hacia arriba**. Puede acumular
  tantos asaltos como quiera aunque se vea obligado a seguir haciéndolo todos los
  asaltos, o arriesgarse a perder los puntos. Si los usa en un turno, tendrá que
  usarlos inmediatamente o retornarán a su reserva.
- **Aura visible**: con más de 20 puntos de Ki acumulados en total, el aura se vuelve
  visible para cualquiera y causa ligeras alteraciones en el entorno (viento,
  temblores); es de un color distinto para cada individuo.
- **CM (Conocimiento Marcial)**: recurso con el que se compran habilidades del Ki y
  técnicas (`CM Total` / `CM Usado`).

## Dominios del Ki (árbol de habilidades, hoja `Ki`)

Confirmado de la hoja Excel — coste en puntos de PD entre paréntesis, sangría =
requisito del padre:

- **Uso del Ki** (40)
- **Control del Ki** (30)
  - Detección del Ki (20) → Erudición (10)
  - Aura de combate (40)
  - Dominio físico (10)
    - Cambio físico (30) → Cambio superior (20)
    - Multiplicación de cuerpos (30) → Mult. mayor (30) → Mult. arcana (40)
    - Magnitud (30) → Mag. arcana (40)
    - Control de la edad (20)
  - Imitación de técnicas (50)
  - Forzar técnicas (20)
  - Eliminación de peso (10) → Levitación (20)
  - Movimiento de objetos (10) → Mov. de masas (20)
  - Vuelo (20)
- **Extrusión de presencia** (10)
  - Armadura de energía (10) → Armadura mayor (10) → Arm. arcana (10)
  - Extensión del aura al arma (10) → Ataque elemental / Daño incrementado / Alcance
    incrementado / Velocidad incrementada (10 cada una)
  - Destrucción por Ki (20)
  - Absorción de energía (30)
  - Escudo físico (10)
- **Transmisión del Ki** (10)
  - Curación por Ki (10) → Curación superior (10)
  - Estabilizar (10)
  - Sacrificio vital (10)
- **Uso de la energía necesaria** (10)
  - Ocultación del Ki (10) → Aura de ocultación (10) / Falsa muerte (10)
  - Eliminación de necesidades (10) → Inmunidad elemental FUE/FRÍ/ELE (20 cada una)
  - Eliminación de penalizadores (20) → Recuperación (20) → Restituir a otros (10)
  - Aumento de características (20) → Incremento superior (20)
- **Técnicas de combate improvisadas** (50)
- **Inhumanidad** (30) → **Zen** (50/40 según rama)

Rama de **Némesis** (marcada aparte en la hoja, casillas `False` — capacidades de
antagonista/PJ especial, no del árbol normal): Uso del Némesis (70), Anulación de Ki
(30) → Anulación de Ki mayor (20), Anulación de Magia (30) → mayor (20), Anulación de
Matrices (30) → mayor (20), Anulación de Lazos (30), Extrusión de Vacío (30) → Forma
de Vacío (30) → Cuerpo de Vacío (10) → Sin necesidades/Movimiento de
Vacío/Esencia de Vacío → Uno con la nada (40), Aura de Vacío (30), Indetección (10).
⚠️ Verificar en Dominus Exxet qué distingue estas capacidades del árbol normal
(¿solo PNJs/Némesis, o cualquier personaje con suficiente nivel?).

**Sellos de Invocación** (Madera/Metal/Aire/Agua/Fuego) y **Pactos de Sangre:
Criaturas invocables** aparecen también en esta hoja — ⚠️ Verificar si es parte del
árbol de Ki o comparte mecánica con la Convocación mágica (ver
[magia.md](magia.md)).

## Habilidades del Ki: coste y duración individual (Core pp. 101–102 — confirmado)

Cada habilidad del árbol de Dominios define **su propio coste y mantenimiento**, no
hay una regla unificada:

- **Levitación**: 1 punto de Ki genérico por nivel de Tipo de vuelo; **mantenerse en
  el aire cuesta 1 punto de Ki adicional por minuto**.
- **Vuelo**: 1 punto de Ki genérico por Tipo de vuelo; el mantenimiento sigue siendo
  **1 punto por minuto**.
- **Movimiento de objetos**: 1 punto de Ki **cada asalto** por cada 5 kg de peso.
- **Eliminación de peso**: 1 punto de Ki genérico en cada asalto para prolongar el
  efecto.
- **Armadura de energía**: concede TA 2 contra energía; sin penalizadores al turno
  por capa adicional. (Coste de activación/duración: ⚠️ verificar detalle exacto.)
- **Destrucción por Ki**: se considera un ataque y **no puede mantenerse** — cada
  asalto que se desee usar deben invertirse de nuevo puntos de Ki.
- **Curación por Ki**: cura 2 PV por punto de Ki genérico gastado (máx. la mitad del
  daño sufrido).
- **Uso de la energía necesaria**: multiplica ×10 el tiempo sin sufrir cansancio;
  además permite gastar hasta 5 puntos de Cansancio por asalto (+75 a una única
  acción o bonos de +15).

## Creación de Técnicas (Dominus Exxet cap. 5 — confirmado)

Una técnica se construye combinando **Efectos** con coste en Ki (repartido entre
características) y en CM. Niveles 1–3 (el 3 es "Arcana"). Los Efectos son de Tipo
**Acción** (ligados a una única acción) o de Tipo **Asalto** (benefician durante
todo el asalto), y de Clase **Ataque / Contraataque / Defensa / Variable**, que es
lo que determina si la técnica es Activa o Pasiva.

**Tabla 16 — Niveles y Árboles** (Dominus p. 044):

| Nivel | CM mín | CM máx | Máx. desventajas |
|---|---|---|---|
| 1 (Básica) | 20 | 50 | 1 |
| 2 (Mayor) | 40 | 100 | 2 |
| 3 (Arcana) | 60 | 200 | 3 |

Árbol: dos técnicas de Nv1 antes de una Nv2, y dos de Nv2 antes de una Arcana. Si
los Efectos suman menos que el mínimo del nivel, **el coste es el mínimo**.

Estructura: exactamente **un** Efecto Primario (paga la columna `1º`) y varios
Secundarios (columna `2º`). Cada Efecto puede llevar además varias **Opciones**,
y cada una suma su propio Ki y CM. El reparto del Ki hacia una característica
opcional cuesta el recargo indicado para esa característica, una vez por
característica usada.

**No hay tope de Efectos por técnica**: los libros no lo imponen y hay técnicas
publicadas con seis. Las 5 filas de la hoja de Excel son maqueta, no regla.

**Ajuste de coste** (Dominus p. 046): +10 CM por −1 punto de Ki (máx. −5 en total,
sin bajar ninguna característica de la mitad de su base redondeando arriba, y
sosteniendo la técnica en al menos 3 características); o **−5 CM por cada 2 puntos
de Ki añadidos**, hasta −20 CM (es decir +8 Ki).

> Corrección: una versión anterior de este documento decía "−5 CM por +1 Ki". El
> PDF (p. 046) dice por cada **dos** puntos.

**Tabla 19 — Efectos Combinables** (Dominus p. 047): declararlo al crear la técnica
cuesta **+3 Ki y +10 CM por nivel** (Nv1 +3/+10, Nv2 +6/+20, Nv3 +9/+30). Al
combinar dos técnicas, los Efectos iguales **no se suman**: se toma el más alto.

La fórmula del CM de la hoja de Excel (celda `CM:` de `Creación de Técnicas`)
unifica las tablas 17, 18 y 19 como múltiplos del nivel, y aplica el mínimo del
nivel **al final**, después de las desventajas:

```
MAX(mínimoDelNivel,
    Σ CM(efectos) + Σ CM(desventajas)
    + 10·nivel (Mantenida) + 20·nivel (Sost. Menor) + 30·nivel (Sost. Mayor)
    + 10·nivel (Combinable)
    + 10·kiReducido − 5·floor(kiAñadido / 2))
```

El catálogo completo (65 Efectos con 555 opciones y 24 Desventajas con 72 opciones)
está volcado; ver "Estado en el código".

## Mantener y sostener técnicas (Dominus pp. 46–47 — confirmado)

Dos mecanismos distintos y **no combinables en una misma técnica**:

- **Técnicas Mantenidas** (Tabla 17): se declara al diseñar la técnica. Añade
  **+10/+20/+30 CM** según nivel (1º/2º/3º) y un **valor añadido en puntos de Ki**
  que se reparte libremente entre las características que la técnica emplea. Para
  conservarla activa, **cada asalto posterior se gastan tantos puntos de Ki como ese
  valor añadido**, usando las mismas características del Efecto, y el gasto es
  **completamente innato: no importa cuál sea la Acumulación del personaje**. Es
  posible mantener solo parte de los Efectos y dejar que otros se extingan. Los
  Efectos mantenidos funcionan como si se volvieran a ejecutar cada asalto, pero
  **no otorgan beneficios adicionales** (un +100 a un ataque por asalto sigue siendo
  a un solo ataque por asalto).
- **Técnicas Sostenidas** (Tabla 18): duración **prefijada sin coste por asalto** —
  tras ejecutarse permanecen activas hasta extinguirse solas. Dos grados:
  **Menores** (5 asaltos / 15 segundos) y **Mayores** (20 asaltos / 1 minuto). Solo
  técnicas de nivel 2–3, y solo pueden emplear Efectos de nivel inferior al propio.
  Coste adicional: Sostenimiento Menor +40 CM (Nv. 2) / +60 CM (Nv. 3); Mayor
  +60 / +90 CM, más un coste en Ki asociado a cada Efecto.
- **Técnicas Improvisadas** (Dominus p. 47): inmediatas, **no pueden mantenerse ni
  sostenerse**; incrementan la pifia en 10 (pifia con 5 o menos, 4 con Maestría).

Ver [mantenimiento.md](mantenimiento.md) para la comparación con magia y psíquica.

## Estado en el código

- Habilidades de Ki: [src/domains/ki/ki-ability.ts](../../src/domains/ki/ki-ability.ts)
  (`mkCost`, `subtype`, `parent`, `branch`, `kiCost`, `kiMaintenance`, `action`).
  `prepareActorData` publica cada habilidad en `system.kiAbilities` para sumar el CM.
- **Técnicas de Ki**: tipo de item propio `kiTechnique`.
  - Catálogo generado del Excel:
    [src/domains/ki/technique-tables.generated.ts](../../src/domains/ki/technique-tables.generated.ts)
    (65 Efectos / 555 opciones, 24 Desventajas / 72 opciones), producido por
    [scripts/extract-technique-tables.ts](../../scripts/extract-technique-tables.ts)
    (`npm run gen:ki-tables`). Tablas 16–19 a mano en
    [technique-tables.ts](../../src/domains/ki/technique-tables.ts).
  - Constructor: [technique-build.ts](../../src/domains/ki/technique-build.ts)
    (`buildTechnique`, puro). Calcula CM, coste en Ki por característica y la lista
    de errores. Validado contra los tres ejemplos trabajados de Dominus pp. 045-046
    en [tests/ki-technique.test.ts](../../tests/ki-technique.test.ts).
  - Perfil mecánico: [technique-profile.ts](../../src/domains/ki/technique-profile.ts)
    separa los Efectos de Tipo Asalto (persistentes) de los de Tipo Acción y extrae
    bonos, ataques/defensas extra, TA, alcance, área y estados. Los persistentes se
    emiten como `FlatModifier` **con predicado** `technique:<slug>:active`, de modo
    que poseer una técnica no aplica nada: el runtime de activación (pendiente) solo
    tendrá que añadir esa roll option. Se recogen vía `system.syntheticRules`, fuera
    de `system.rules`, para no ensuciar el editor de modificadores.
  - Modelo: [ki-technique.ts](../../src/domains/ki/ki-technique.ts). Persiste **solo
    la composición**; CM, coste, perfil y errores se derivan en cada preparación.
  - UI: constructor en
    [KiTechniqueTab.tsx](../../src/components/item/tabs/KiTechniqueTab.tsx), listado
    por árbol en [TechniqueList.tsx](../../src/components/character/ui/TechniqueList.tsx).
  - Compendio: 159 técnicas de los árboles publicados en
    [src/packs/_source/kiTechniques/](../../src/packs/_source/kiTechniques/).
    ⚠️ El Excel guarda su `CM Base` y `Coste` como **valores literales de los
    libros, no como fórmula** (solo su bloque "Técnicas Propias" calcula). Al
    recalcularlos, 74/159 coinciden; el resto se aparta en múltiplos de 5–25 sin
    patrón atribuible a ninguna regla. Por eso se conservan en `bookCm`/`bookCost`
    como referencia y la divergencia se **informa**, no se asume como verdad
    (ver [tests/ki-technique-compendium.test.ts](../../tests/ki-technique-compendium.test.ts)).
    Nota: el texto de Efectos del Excel suele omitir "Mantenido" aunque el coste
    lleve los marcadores `(N)` de mantenimiento; el generador lo reinfiere.
- Puntos/acumulación de Ki por característica y CM como recurso:
  [src/domains/ki/prepare.ts](../../src/domains/ki/prepare.ts), bloque `ki`
  (`perChar`, agregados, `cmTotal/cmUsed/cmAvailable/cmOver`). El CM lo consumen las
  habilidades de Ki, **las técnicas** y los estilos de combate.
  Multiplicadores de categoría (`ki`, `kiAccMultiple`) en
  [src/items/category/model.ts](../../src/items/category/model.ts) (`supernatural`).
  Los PD de puntos y acumulación cuentan contra la reserva de **combate** (12 rutas
  en `development.ts`). UI en
  [KiTab.tsx](../../src/components/character/tabs/KiTab.tsx).
- **Árbol de Dominios + Némesis volcado**: 72 items en
  [src/packs/_source/kiAbilities/](../../src/packs/_source/kiAbilities/) con su
  `mkCost` (Excel/Core), `parent`/`branch` para el árbol y descripción (Core Exxet
  cap. 10 y Dominus Exxet cap. 3). Los bonos persistentes se aplican con rule
  elements `FlatModifier`: **Dominio físico** (+10 RF) y **Cuerpo de vacío** (+20 a
  todas las Resistencias). El resto son capacidades activas/descriptivas.
- **Faltas conocidas**: sin runtime de **uso** de técnicas ni de mantenimiento (nada
  consume Ki por turno y nadie activa la roll option `technique:<slug>:active`); no
  se **fuerza** el requisito de padre del árbol de Dominios ni el de Árbol de
  Técnicas (se informa en la ficha, decide el DJ); sin comportamiento propio de las
  Anulaciones del Némesis más allá del bono declarado; sin sellos de invocación ni
  pactos de sangre; Técnicas Improvisadas modeladas en las tablas pero sin flujo
  propio.

## Pendiente de volcar (⚠️ verificar en Dominus Exxet)

- Efecto exacto de Unificación del Ki (Dominus p. 6, "Reglas de Ki opcionales").
- Runtime de las Anulaciones del Némesis (tablas 11–14), del mantenimiento y del uso
  de técnicas.
- Recuperación de Ki y "Grados muy bajos de Ki" (Dominus p. 7).
- Tres opciones que los libros citan y las tablas del Excel no listan: "RP 180" de
  Espejismo (¿abreviatura de "Ilusión Fantasmal RP 180"?) y "Desenfundar" /
  "Especial" de Acciones Adicionales. Y la desventaja **Requerimiento**, usada por
  11 técnicas publicadas pero ausente de la tabla de desventajas.
