# Mantenimiento y efectos activos (transversal)

Este documento no repite las fórmulas de Magia, Ki o Psíquica (ver
[magia.md](magia.md), [ki.md](ki.md), [psiquica.md](psiquica.md)): recoge cómo cada
sistema define **mantener un efecto activo en el tiempo** — hechizos mantenidos como
escudos, hechizos diarios, técnicas de ki persistentes (auras, armaduras de energía)
y poderes psíquicos activos — y documenta el hueco arquitectónico que supone hoy no
tener ningún runtime para ello.

Fuente: Core Exxet p. 120 ("El mantenimiento de los conjuros"), pp. 101–102
(habilidades del Ki) y p. 212 (innatos psíquicos); Dominus Exxet pp. 46–47
("Mantener las Técnicas" / "Las Técnicas Sostenidas"). **Verificado contra el texto
de los manuales.**

## Confirmado: cada sistema tiene su propia mecánica

No es un sistema unificado en las reglas oficiales. Los tres comparten la idea de
"pagar recurso para que el efecto siga vivo", pero difieren en cadencia, en si hace
falta tirada y en qué pasa al dejar de pagar:

| | Magia (conjuros) | Ki (técnicas / habilidades) | Psíquica (poderes) |
| --- | --- | --- | --- |
| Recurso | Zeón | Ki (por característica) | Ninguno por asalto (CV permanentes al adquirir el innato) |
| Cadencia | Por asalto, o **diario** (24 h) | Por asalto (técnicas mantenidas); habilidades de dominio: coste individual (p. ej. 1 Ki/minuto para volar) | Sin pago recurrente: el innato sostiene el poder indefinidamente |
| Coste | 4 costes por conjuro, uno por grado | Valor añadido fijado al crear la técnica (Tabla 17: +10/+20/+30 CM) | 2 CV permanentes por innato |
| ¿Tirada para mantener? | No | No | No (se mantiene a la dificultad natural del potencial, sin dados ni bonos) |
| ¿Es acción? | **Acción innata** (no modifica el ACT) | Gasto **innato** (no importa la Acumulación) | **Acto pasivo** |
| ¿Funciona dormido/inconsciente? | **Sí** | ⚠️ Verificar (el manual no lo dice explícitamente para técnicas) | **Sí** |
| Límite simultáneo | **Sin límite** mientras quede Zeón | Sin límite explícito (limita el Ki disponible) | Un poder por innato; innatos ilimitados (2 CV cada uno) |
| Fin del efecto | Al dejar de pagar o anularlo a voluntad | Al dejar de pagar o dejar que se extinga | Al soltar el innato (a voluntad) |

### Detalle por sistema (resumen; el detalle completo está en cada doc)

- **Magia** (Core p. 120): cada conjuro mantenible lista cuatro costes de
  mantenimiento (por grado). Pago por asalto automático desde la reserva de Zeón,
  como acción innata que no modifica el ACT; sostenible incluso dormido o
  inconsciente; sin límite de conjuros activos mientras quede Zeón; anulable a
  voluntad. Los **diarios** se declaran al iniciar la jornada y cubren 24 horas (la
  ficha Excel los suma en "Coste zeónico total al día"). Recibir daños **no afecta a
  los conjuros ya mantenidos** (solo al Zeón que se está acumulando). Una pifia
  posterior sobre un hechizo mantenido no lo anula: resta el nivel de fracaso a la
  proyección de ese hechizo.
- **Ki** (Dominus pp. 46–47): las **Técnicas Mantenidas** pagan por asalto el valor
  añadido fijado en su creación (gasto innato, independiente de la Acumulación); se
  puede mantener solo parte de los Efectos. Las **Técnicas Sostenidas** son el caso
  contrario: sin coste por asalto, con duración prefijada (Menores 5 asaltos,
  Mayores 20). Ambos mecanismos **no son combinables** en una misma técnica. Las
  **habilidades de dominio** del Core definen su mantenimiento individualmente
  (Vuelo/Levitación: 1 Ki por minuto; Movimiento de objetos: 1 Ki por asalto por
  cada 5 kg; Destrucción por Ki: explícitamente **no mantenible**).
- **Psíquica** (Core p. 212): mantener un poder requiere un **innato** (2 CV
  permanentes). Primero hay que usar el poder con éxito; después se declara el
  mantenimiento y desde el asalto siguiente no se tira más: el poder queda fijado a
  la dificultad natural del potencial (el extra de la tirada se pierde). Acto
  pasivo, funciona dormido o inconsciente. Cada innato sostiene un solo poder a la
  vez, pero es reutilizable para poderes distintos en momentos distintos.

## Interacción con Resistencias (Core p. 121 — confirmado)

Quien falla la RM contra un efecto sobrenatural tiene derecho a **una nueva tirada
cada 5 asaltos** (salvo que el efecto indique lo contrario). **Solo los efectos
mantenidos dan derecho a esa nueva Resistencia**: los hechizos que tras fallar el
control producen un efecto continuado sin mantenimiento (p. ej. Destruir Recuerdos)
no la permiten. Regla clave para cualquier runtime futuro: un efecto mantenido debe
recordar contra quién se mantiene para repetir la RM cada 5 asaltos.

## Relación con otras reglas ya documentadas

- **Un mismo efecto no se acumula consigo mismo**
  ([modificadores.md](modificadores.md), regla de acumulación 2): dos mantenimientos
  del mismo conjuro/técnica no se suman, se aplica el mayor. Mantener el mismo
  efecto dos veces no debe duplicar su bono.
- **Efectos de técnica mantenida no dan beneficios extra** (Dominus p. 46): funcionan
  como si se re-ejecutaran cada asalto, pero un +100 a un ataque por asalto sigue
  aplicándose a un solo ataque por asalto.
- **Metamagia "Mantenimiento añadido"** ([magia.md](magia.md)): el coste de mantener
  es modificable por otras reglas.
- **Escudos** (Core pp. 120–121): los conjuros de Defensa no sufren penalizadores por
  recibir ataques adicionales — un escudo mantenido defiende todo el asalto.

## Estado en el código

**El modelo de datos existe para magia; el runtime no existe para nada.**

Lo que **sí** hay (solo magia):

- `system.magic.activeSpells` guarda, por conjuro mantenido: nombre, **grado** con el
  que se lanzó, **modo** (`round` sostenido / `daily` diario), coste en Zeón, **contra
  quién** se mantiene y una nota. El campo "contra quién" es lo que permite aplicar la
  regla de repetir la RM cada 5 asaltos, exclusiva de los efectos mantenidos.
- `prepareMagic` deriva `upkeepRound` y `upkeepDaily`, que la pestaña Místicos muestra
  en el pie de la lista de conjuros activos.
- El modelo de conjuro tiene los **cuatro** costes de mantenimiento, uno por grado
  (`grades.*.maintenanceCost`), como manda el manual.

Lo que **sigue faltando**:

- **Nada descuenta Zeón ni Ki.** No hay ningún hook de combate o de tiempo registrado
  (`src/main.ts` solo tiene `init` y `ready`), ni uso de `ActiveEffect`, ni concepto de
  asalto en el motor de reglas: `FlatModifier` es **estático**, se evalúa en cada
  `prepareDerivedData` contra un predicado y el estado de "equipado" del item.
- `kiAbility.kiMaintenance` y los innatos psíquicos siguen siendo metadatos sueltos.
- El runtime se abordará junto con la infraestructura de tiradas, porque necesita
  exactamente la misma base (hooks de turno/tiempo). Como referencia de arquitectura,
  `../pf2e/` implementa `ActiveEffect`/duración de forma madura.

## Pendiente de volcar (⚠️ verificar)

- Si las técnicas de Ki mantenidas se sostienen estando inconsciente (el manual lo
  confirma para magia y psíquica, pero no lo dice para técnicas).
- Ofudas y conjuros mantenidos con Ofudas (Arcana Exxet p. 13).
- Mantenimiento de una Sheele (Arcana Exxet p. 89).
- Coste de activación y duración exacta de cada habilidad de dominio del Core no
  volcada aún (Aura de combate, Armadura de energía…) — ver la sección "Pendiente de
  volcar" de [ki.md](ki.md).
