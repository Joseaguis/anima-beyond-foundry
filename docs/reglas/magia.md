# Magia

Fuente: Core Exxet cap. 11 "La Magia" (pp. 114–124, verificado contra el texto del
manual) y `Ficha Anima v8.7.0.xlsx` → hojas `Místicos`, `Metamagia`, `Tablas Magia`,
`Grimorio Magia`, `Grimorio de Vía`. Arcana Exxet amplía (metamagia, sub-vías,
invocaciones, Sheele) — solo consultado su índice, no volcado en detalle.

## Vías de magia y nivel de magia (Core p. 118)

- Existen **once vías**, en dos tipos: **mayores** (Luz, Oscuridad, Creación,
  Destrucción y Nigromancia — los aspectos fundamentales de la realidad) y
  **menores** (Fuego, Aire, Tierra, Agua, Esencia y Mentira — elementos básicos,
  almas e ilusión).
- Cada vía tiene un nivel de 1 a 100 y **por cada dos niveles posee un conjuro**
  (~50 conjuros por vía). Se invierte **nivel de magia** para subir vías; puede
  repartirse entre tantas vías como se quiera.
- **Nivel de magia máximo según Inteligencia** (Tabla 59): INT 1–5 → 0, INT 6 → 10,
  7 → 20, 8 → 30, 9 → 40, 10 → 50, 11 → 75, 12 → 100, 13 → 150, 14 → 200, 15 → 300,
  16 → 400, 17 → 500, 18 → 600, 19 → 700, 20 → 800.
- **Vías opuestas**: cada vía tiene antagónicas. El Core (p. 118) solo da dos ejemplos
  (Luz↔Oscuridad, Creación↔Destrucción), pero el **mapa completo está en el Excel**
  (`Tabla_VíasOpuestas`, hoja `Tablas`) y es el siguiente:

  | Vía | Tipo | Opuestas |
  | --- | --- | --- |
  | Luz | Mayor | Oscuridad, Nigromancia |
  | Oscuridad | Mayor | Luz, Nigromancia |
  | Creación | Mayor | Destrucción, Nigromancia |
  | Destrucción | Mayor | Creación, Nigromancia |
  | Fuego | Menor | Agua, Nigromancia |
  | Agua | Menor | Fuego, Nigromancia |
  | Aire | Menor | Tierra, Nigromancia |
  | Tierra | Menor | Aire, Nigromancia |
  | Esencia | Menor | Ilusión, Nigromancia |
  | Ilusión | Menor | Esencia, Nigromancia |
  | Nigromancia | Mayor | **las otras diez** |

  Desarrollar una vía opuesta a otra que ya se domina cuesta **el doble** de nivel de
  magia. **Implementado** en `prepareMagic` (`magicLevelPaths`).
- **Selección de conjuros sueltos** (Tabla 60): en lugar de subir la vía entera se
  pueden comprar conjuros individuales por nivel de magia según el nivel del
  conjuro: 2–10 → 2, 12–20 → 4, 22–30 → 6, 32–40 → 8, 42–50 → 10, 52–60 → 12,
  62–70 → 14, 72–80 → 16, 82–90 → 18, 92–100 → 20. **Implementado**
  (`getFreeSpellCost`): solo se cobran los conjuros que el nivel de su vía no cubre.
- **Conjuros de Libre Acceso y sub-vías** (Core p. 118, Arcana Exxet cap. 4).
  Donde la lista de una vía dice "Libre Acceso" en vez de un conjuro, hay un **hueco**.
  Los huecos son justo los niveles que la lista propia de la vía no cubre, y su
  reparto sale del compendio:

  | Vía | Propios | Huecos | Por decena |
  | --- | --- | --- | --- |
  | Mayores (Luz, Oscuridad, Creación, Destrucción, Nigromancia) | 40 | 10 | **1** → 4, 14 … 94 |
  | Menores (Fuego, Agua, Aire, Tierra, Esencia, Ilusión) | 30 | 20 | **2** → 4 y 8, 14 y 18 … |

  Esto concuerda con el manual: *"las vías mayores tienen más sortilegios propios,
  pero también menor capacidad de elegir conjuros de Libre Acceso"*.
  Solo están disponibles los huecos de nivel ≤ nivel de la vía.

  Cada hueco se rellena de una de dos formas:
  - **Un conjuro de Libre Acceso**, de nivel no superior al del hueco. Algunos están
    **cerrados** para vías cuya naturaleza los contradice (columna "Vía cerrada" del
    Excel; 89 de los 120 la traen).
  - **Una sub-vía**: se vincula a la vía y aporta sus diez conjuros, situados en 4,
    14 … 94, es decir **el primer hueco de cada decena**. Por eso consume los 10
    huecos de una vía mayor pero solo la mitad de una menor, que conserva libres los
    de 8, 18 … 98. Una sub-vía **no cuesta Nivel de Magia** aparte.

  **Implementado**: huecos en
  [src/domains/magic/free-access.generated.ts](../../src/domains/magic/free-access.generated.ts)
  (generado del compendio), resolución y avisos en `resolveFreeAccess()` dentro de
  [prepare.ts](../../src/domains/magic/prepare.ts). "Libre acceso" **no es una vía**:
  es el catálogo del que se elige, y por eso no tiene item propio.
- **Alta magia y magia divina** (Core p. 119): conjuros de nivel 82–90 requieren
  **Gnosis 25**; los de 92–100, **Gnosis 40**. Solo aplica a conjuros de vía (no a
  Libre Acceso adquiridos como selección).

## Zeón, ACT y grados de conjuro

- **Zeón máximo** (fórmula del Excel, PDs!AA93, verificada con ficha-test01) =
  **Zeón innato por POD** (tabla de valores base, abajo) + ⌊PD invertidos ÷
  coste de categoría⌋ × 5 + Zeón innato por nivel de la categoría
  (`zeonPerLevel`, Paladín/hechiceros) + especial + modificadores.
  **Implementado** en `prepareSupernatural` con `getInnateZeon(POD)`.
- **ACT (Acumulación)** (PDs!AA94) = **ACT innato por POD** × (1 +
  ⌊PD ÷ coste (CosteACT: 70/60/50)⌋) + especial. Cada múltiplo comprado añade
  otro ACT innato. **Implementado** con `getInnateAct(POD)`.
- **Tabla de valores base por POD** (Tablas!M37:O56; el Zeón innato sigue la
  misma progresión que los PV base por CON):

  | POD | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 |
  | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
  | Zeón | 5 | 20 | 40 | 55 | 70 | 85 | 95 | 110 | 120 | 135 | 150 | 160 | 175 | 185 | 200 | 215 | 225 | 240 | 250 | 265 |
  | ACT | 0 | 0 | 0 | 0 | 5 | 5 | 5 | 10 | 10 | 10 | 10 | 15 | 15 | 15 | 20 | 25 | 25 | 30 | 30 | 35 |

- **Regeneración de Zeón** — **"Múltiplo de regeneración"** = ACT total +
  10×metamagia + ⌊PD ÷ (CosteACT/2 = 35/30/25)⌋ × ACT innato + especial
  (PDs!AA95). **Implementado** en `prepareSupernatural` (`zeonRegen`).
  El mago acumula su ACT en Zeón cada asalto hasta reunir el coste del conjuro
  (Core p. 116):
  - Al final de un asalto en el que ha lanzado al menos un sortilegio, el turno
    siguiente deja de tener acumulada la cantidad no usada, **perdiendo también 10**
    en el proceso.
  - **Preparar un conjuro determinado**: se declara conjuro y grado; la acumulación
    solo sirve para ese hechizo, pero puede sostenerse tantos asaltos como el valor
    de POD. Al terminar la espera, si no se ejecuta, se recupera la magia perdiendo
    10 puntos de Zeón.
  - **Daños mientras se acumula** (Core p. 116): para conservar el Zeón preparado hay
    que superar un control de **Resistir el dolor contra el doble del daño sufrido**;
    si se falla, se pierde además esa cantidad de puntos. Con conjuros determinados
    se aplica un bono de +40. Recibir daños **no influye en absoluto en los conjuros
    mantenidos**.
- **Grados de un conjuro** (Core p. 119): todos los conjuros tienen cuatro grados —
  **base, intermedio, avanzado y arcano** — cada uno con su propio valor zeónico y
  efectos mayores. Cada hechizo tiene un requisito de **Inteligencia** (si la INT del
  personaje no alcanza el grado, no puede ejecutarlo aunque conozca el conjuro).
- **Magia innata** (Core p. 117, Tabla 58): conjuros de valor zeónico bajo se lanzan
  sin gastar Zeón, según el ACT Final: 10–50 → hasta 10 de Zeón, 55–70 → 20,
  75–90 → 30, 95–110 → 40, 115–130 → 50, 135–150 → 60, 155–180 → 70, 185–200 → 80,
  +200 → 90. Solo un conjuro innato por asalto, sin acumular magia. Si un conjuro
  innato tiene mantenimiento, puede mantenerse activo también gratis, pero mientras
  tanto no se puede lanzar ningún otro conjuro innato.

## Proyección Mágica (Core pp. 116–117)

- **Base** = ⌊PD invertidos ÷ coste de categoría⌋; **Final** = Base + bono de DES +
  especial + modificadores + ("toda acción" + cansancio, porque es una acción).
- Se usa para atacar y defenderse con conjuros. Un mago puede lanzar, sin negativos,
  tantos conjuros de ataque o anímicos como le permita el número de ataques de los
  luchadores; los escudos no se resienten por recibir golpes adicionales (los únicos
  penalizadores son los negativos a toda acción y la ceguera).
- **Desequilibrio ofensivo** (Core p. 117): se puede desplazar la Proyección hacia
  ataque o defensa en pasos de 10 puntos por nivel, hasta un máximo de ±30.
- **Dificultades de la Proyección** (Recuadro X, Core p. 116): Rutinario → sobre sí
  mismo o en contacto; Fácil → 5 m; Media → 25 m; Difícil → 100 m; Muy Difícil →
  250 m; Absurdo → 500 m; Casi Imposible → blancos no vistos pero localizados, hasta
  1 km; Imposible → hasta 5 km con idea aproximada de la ubicación. (La hoja Excel
  usa una tabla equivalente con umbrales 20–440.)
- **Pifia** (Core p. 116): pifia al lanzar = el conjuro fracasa (si supera 90, el
  hechizo se va de control con consecuencias negativas). Una pifia posterior al
  lanzamiento **sobre un hechizo mantenido no lo anula**: solo resta el nivel de
  fracaso de la habilidad de proyección de ese hechizo.
- **Choque de conjuros** (Tabla 57, Core p. 117): dos descargas que se interceptan
  tiran 1d100 + daño base + bono de POD; diferencia 1–50 → ambos se anulan; 51–100 →
  el ganador pasa a través con daño base reducido a la mitad; +100 → el ataque
  inferior queda anulado y el vencedor sigue sin penalizador.

## El mantenimiento de los conjuros (Core p. 120 — confirmado)

- Muchos hechizos pueden **mantenerse** durante periodos prolongados mientras el
  brujo siga invirtiendo Zeón. La descripción de cada sortilegio indica cuáles
  pueden mantenerse y cuál es su coste; todos los mantenibles tienen **cuatro costes
  de mantenimiento, uno por grado** con el que se lancen.
- **Cada asalto posterior al lanzamiento**, quien controla el conjuro debe gastar esa
  cantidad para que siga activo (p. ej. mantenimiento 5 en grado base → 5 puntos de
  Zeón por asalto automáticamente).
- **El pago de los mantenimientos es una acción innata**: el brujo encadena los
  conjuros automáticamente a su esencia, tomando el Zeón de su reserva **sin
  modificar su ACT**. Se alimentan directamente del poder del lanzador, por lo que
  puede sostenerlos **incluso dormido o inconsciente**. Para finalizar un conjuro
  mantenido, el hechicero puede anularlo cuando quiera.
- **Mientras quede Zeón suficiente, no hay límite** a la cantidad de conjuros que se
  pueden tener activos.
- **Conjuros diarios**: segundo tipo de mantenimiento; el coste es tan reducido que
  en lugar de pagarse por asalto se paga a lo largo del día. **Al iniciar una
  jornada, el hechicero debe declarar si mantiene o no el conjuro activo**; si lo
  hace, no vuelve a invertir Zeón hasta pasadas veinticuatro horas. (Esto explica la
  zona "Conjuros activos" con "Zeón Diario" y "Coste zeónico total al día" de la
  hoja Excel.)
- **Resistencias contra efectos mantenidos** (Core p. 121, "Cada 5 asaltos"): quien
  falla una RM contra un efecto sobrenatural tiene derecho a repetir la tirada cada
  5 asaltos, salvo que el conjuro indique lo contrario. **Solo los conjuros
  mantenidos dan derecho a nueva Resistencia**; los que tras fallar producen un
  efecto continuado sin mantenimiento, no.

## Tipos de conjuros (Core pp. 120–121)

**Ataque** (descargas; se paran con energía; rotura = daño base ÷ 20), **Defensa**
(escudos; nunca sufren penalizadores por recibir ataques adicionales), **Anímico**
(ataque basado en energía contra la esencia; el blanco resiste con RM; parables solo
con capacidad de parar energía o con TA de energía), **Efecto** (no requiere
proyección ni suele resistirse), **Automático** (aplica si el blanco cumple la
circunstancia y falla la RM; superado el control, 5 asaltos de inmunidad) y
**Detección** (versión de Automático; supera la RM o no detecta; no visible).
Pueden ser mixtos.

## Dificultad y alcance (tabla de la hoja Excel — equivale al Recuadro X)

| Dificultad | Umbral | Alcance |
| --- | --- | --- |
| Rutinario | 20 | Sobre sí mismo o en contacto |
| Fácil | 40 | Blancos hasta 5 m |
| Medio | 80 | Blancos hasta 20 m |
| Difícil | 120 | Blancos hasta 100 m |
| Muy difícil | 140 | Blancos hasta 250 m |
| Absurdo | 180 | Blancos hasta 500 m |
| Casi imposible | 240 | Hasta 1 km, blanco localizado |
| Imposible | 280 | Hasta 5 km, blanco aproximado |
| Inhumano | 320 | — |
| Zen | 440 | — |

⚠️ Verificar la conciliación exacta entre los alcances del Recuadro X del manual
(Media → 25 m) y la tabla de la ficha (Medio/80 → 20 m): la ficha parece usar
umbrales numéricos propios.

## Generalidades (Core p. 121)

- **Presencia afectable**: los conjuros indican hasta cuánta presencia afectan; un
  conjuro de área puede dividir su valor entre varios blancos. El equipo del
  personaje va incluido (salvo artefactos con presencia superior a 200).
- **Dejarse afectar**: quien lo declara voluntariamente no ejecuta el control de
  Resistencia.
- **RM base**: si un conjuro que debería resistirse no la refleja, siempre puede
  entenderse RM 120 si el DJ lo considera.
- **Conjuros fantasmales**: daño irreal; al terminar el conjuro la víctima queda
  inconsciente (no despierta en varias horas); un crítico mortal fantasmal mata
  realmente por fallo cardiaco.
- **Aumentar Resistencias**: cada efecto sobrenatural distinto solo da derecho a un
  control; para repetir con bono hay que volver a recibir el efecto (una sola
  RM nueva la primera vez).

## Convocación (Invocaciones y Encarnaciones)

Sub-sistema propio (Core cap. 12, pp. 194+; Arcana Exxet cap. 5–6 lo amplía), con su
propia tabla de intensidad/duración/componente/coste vista en la hoja Excel:

| Intensidad | Duración | Componente | Efecto/Restricción | Mod. dificultad | Zeón |
| --- | --- | --- | --- | --- | --- |
| Excepcional | Un minuto | Pelo − 10 | Mitad Zeón. Espiritual. +30 ACT y Proy. | −40 | — |
| Poderosa | Cinco minutos | Sangre − 20 | Mitad Zeón | −20 | 500 Zeón |
| Normal | Media hora | Un pedazo de su cuerpo − 20 | Incapaz de lanzar en Grado Arcano | 0 | 200 Zeón |
| Débil | Una hora | Objeto personal − 10 | 1 asalto preparatoria. 10 Zeon | 20 | 200 Zeón |
| Vacía | Un día | Objeto personal mayor − 20 | Incapaz de lanzar conjuros | 40 | 1000 Zeón |
| — | Una semana | Un retrato − 10 | — | 80 | — |
| — | Un mes | Un familiar directo − 30 | — | 120 | — |

⚠️ Verificar en Core cap. 12 el significado exacto de cada columna y las reglas de
Convocar/Dominación/Atadura/Desconvocar (habilidades con coste propio en la ficha).

## Metamagia (Arcana Exxet cap. 3 — verificado)

El árbol (*Arcana Shepirah*) se recorre en **esferas**: cada nodo adquirido es una
esfera de su principio, y la potencia escala con cuántas esferas del mismo nombre se
posean. Se empieza por una esfera sin requisito de nivel y solo puede tomarse una
esfera unida por una línea a otra ya dominada.

- **Cada esfera cuesta Nivel de Magia** (5/10/15/20/25 según la rama; las raíces son
  gratis). El recuadro del Excel muestra `Nivel Máximo | Nivel Usado | Metamagia`
  juntos: la metamagia **gasta** nivel de magia, no amplía el máximo.
- **Casi todos los principios se gastan al lanzar** (Zeón extra para más área, menos
  TA del blanco, una Proyección fija…), así que no son números de ficha. La **única
  excepción** es *Regeneración zeónica avanzada*: +10 a la Regeneración zeónica base
  por esfera (+10/+20/+30), que es exactamente el `10 × metamagia` de la fórmula.
- **Implementado**: el grafo vive en
  [src/domains/magic/metamagia-graph.ts](../../src/domains/magic/metamagia-graph.ts)
  y el catálogo de efectos (38 etiquetas transcritas de Arcana pp. 20–29) en
  [src/domains/magic/metamagia.ts](../../src/domains/magic/metamagia.ts).
  `resolveMetamagias()` toma el **coste del nodo** (la misma etiqueta cuesta distinto
  según la rama) y el **efecto de la etiqueta**, porque los ids son posicionales. El
  texto impreso se muestra en el tooltip de cada nodo del árbol.
- Relevante para mantenimiento: **"Mantenimiento añadido"** pasa el coste por asalto a
  cada 5 turnos y los diarios a semanales, limitado a un conjuro por cada 2 de Poder.

## Estado en el código

Todo el subsistema vive en `src/domains/magic/` (dominio vertical).

- Modelo de conjuro: [src/domains/magic/spell.ts](../../src/domains/magic/spell.ts)
  (`spellLevel`, `actionType`, `maintenanceType`, `magicPath`, `damageType`,
  `resistanceType`, `spellType` —incluido **`spiritual` (Anímico)**—, `effect`,
  `closedPaths`, y **`grades`** con base/intermedio/avanzado/arcano, cada uno
  `{ zeonCost, intRequired, maintenanceCost, effect }`). `migrateData` convierte el
  coste único legacy al grado base. Publica sus conjuros al actor para la Tabla 60.
- Modelo de vía: [src/domains/magic/magic-path.ts](../../src/domains/magic/magic-path.ts)
  (`subtype` **path/subPath/metamagic**, `element`, `pathType` mayor/menor,
  `opposedPath` —lista separada por comas—, `level` **1–100**, y `parentPathId` para
  vincular una sub-vía a su vía). Publica todo eso al actor.
- **Nivel de Magia usado** = vías (×2 si opuestas) + conjuros sueltos + metamagia. Las
  **sub-vías no cuentan**: van incluidas en el desarrollo de su vía anfitriona.
- Fórmulas derivadas: [src/domains/magic/prepare.ts](../../src/domains/magic/prepare.ts),
  orquestado desde `prep/supernatural.ts`. Tablas en
  [src/domains/magic/tables.ts](../../src/domains/magic/tables.ts) (`getInnateZeon`,
  `getInnateAct`, `getMagicLevelByInt`, `getFreeSpellCost`, `parseOpposedPaths`).
  Costes de categoría en `src/items/category/model.ts`.
- **Compendio**: 640 conjuros y 25 vías (11 principales + 14 sub-vías) generados del
  Excel por [scripts/extract-spell-tables.ts](../../scripts/extract-spell-tables.ts)
  (`npm run gen:spell-tables`), hoja `Tablas Magia`.
- Se señala el sobregasto con `magicLevelOver` y `freeAccessFree` sin recortar, igual
  que el CM de Ki, y los problemas concretos se listan en `magic.warnings` (conjuro
  cerrado para su vía, sin hueco, sin vía asignada, sub-vía huérfana…).
- **Convocatoria**: Convocar/Atar/Desconvocar usan el bono de **POD**; Dominación
  (Controlar) usa el bono de **VOL** (Excel PDs!W98-W101).
- **Mantenimiento**: `activeSpells` guarda grado, modo (asalto/diario), coste y
  **contra quién** se mantiene (necesario para la RM cada 5 asaltos). `prepareMagic`
  deriva `upkeepRound` y `upkeepDaily`. **No hay runtime**: nada descuenta Zeón.
- Tests: [tests/mysticism.test.ts](../../tests/mysticism.test.ts),
  [tests/spell-compendium.test.ts](../../tests/spell-compendium.test.ts) y
  [tests/ficha-test01.test.ts](../../tests/ficha-test01.test.ts).
- **Faltas conocidas (siguen pendientes)**: todo lo que depende de tiradas y de un
  concepto de asalto —resolución de Proyección Mágica contra Resistencia, choque de
  conjuros (Tabla 57), acumulación de Zeón por asalto, magia innata (Tabla 58) y el
  runtime que descuente el mantenimiento—. Hoy no existe infraestructura de dados ni
  hooks de combate/tiempo en el proyecto.

## Pendiente de volcar (⚠️ verificar)

- **Vínculos Cerrados de las sub-vías**: cada sub-vía lista las vías a las que *no*
  puede vincularse (Arcana cap. 4; p. ej. Muerte está cerrada a Creación, Luz,
  Esencia, Tierra, Agua, Aire e Ilusión). Solo está en el texto del PDF y no se ha
  transcrito: el vínculo sub-vía↔vía **no se valida** todavía.
- Detalle de la magia natural (Arcana Exxet cap. 2 "Magia Natural").
- `damageType` y `resistanceType` de los conjuros: el Excel no tiene columnas para
  ellos, están en el texto del efecto (`"RM o RP 80"`, `"140 RF"`, `"Daño 60"`).
- Una fila del Excel tiene mal el `Tipo`: *Atar esencia vital* (Esencia 86) dice
  "Activa" en vez del tipo de conjuro; cae a `effect` y está fijada en el test.
- Conciliación de los alcances del Recuadro X con los umbrales de la ficha Excel.
- Reglas completas de Convocación (Core cap. 12) y Metamagia (Arcana cap. 3).
- Consecuencias exactas de acumular Zeón (Arcana Exxet p. 7 "Consecuencias de
  Acumular Zeon", "Grados muy bajos de Zeon").
- Ofudas y conjuros mantenidos con Ofudas (Arcana Exxet p. 13, teorema Onmyodo).
