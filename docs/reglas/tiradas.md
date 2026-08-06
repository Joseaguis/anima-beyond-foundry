# Tiradas: el D100, el D10 y la resolución del asalto

Mecánica base del sistema. Todo lo de este documento está **confirmado** contra
el Core Exxet (páginas indicadas), salvo lo marcado con ⚠️.

Implementación: `src/system/dice/` (mecánica pura), `src/system/check/` (motor),
`src/system/combat/` (resolución), `src/system/chat/` (tarjetas).

---

## Los dos dados

Se juega con dos dados de diez caras. Lanzados juntos (uno decenas, otro
unidades) dan el **D100**; dos ceros son 100. Un solo dado da el **D10**.

- **Controles de habilidad**: `1D100 + habilidad final`. Son la base del sistema.
- **Controles de resistencia**: `1D100 + Resistencia`.
- **Controles de característica**: `1D10 + característica`. Los únicos con D10.

*(Core p. 7)*

---

## La Tirada Abierta

Sólo con D100. Con **90 o más** se vuelve a tirar y se **suma** al resultado
anterior. La nueva tirada también puede abrir, pero **cada abierta consecutiva
sube el umbral un punto**: la segunda abre con 91, la tercera con 92, y así.
**Un 100 siempre abre**, sea cual sea el umbral acumulado.

> Ejemplo del manual: saca 95 (abre), vuelve a tirar y saca 90. Como ya hace
> falta 91, se queda ahí: 95 + 90 = **185**.

Se admite en cualquier control de D100 **salvo tres**:

1. Controles de Resistencia.
2. Cálculo del Nivel de Pifia.
3. Cálculo del Nivel de Crítico.

*(Core p. 7 y 96)* · Código: `resolveD100` en [d100.ts](../../src/system/dice/d100.ts)

---

## La Pifia

Un resultado de **1, 2 ó 3** en un D100 es una Pifia: fracaso automático. A
continuación se tira **otro D100, sin abierta**, para el **Nivel de Pifia**:
cuanto más alto, peor el fracaso.

Qué se hace con ese nivel depende del tipo de control — es la única parte de la
mecánica que varía, y en el código vive como datos en `CHECK_TYPES`
([types.ts](../../src/system/check/types.ts)), no como condicionales:

| Control | Efecto de la pifia |
| --- | --- |
| Habilidad (secundarias) | El nivel **se resta del resultado final** |
| Defensa | El nivel **se resta de la habilidad de defensa**. Por encima de 80, el DJ decide consecuencias extra (tropezar, perder el arma…) |
| Ataque | El golpe **falla automáticamente** y el personaje **pierde todas sus acciones activas** del asalto. El rival puede **sumar el nivel de fracaso a su ataque** si aún puede contraatacar. Por encima de 80, consecuencias extra |
| Turno (iniciativa) | Actúa **el último**. **No se calcula Nivel de Pifia** |
| Lanzar un conjuro | El conjuro falla pero **el Zeón se gasta igual**. Nivel > 90: el conjuro se descontrola |
| Conjuro ya mantenido | **No lo anula**: resta el nivel de fracaso a la proyección |
| Potencial psíquico | El nivel **se resta del resultado final** |

*(Core p. 7, 96, 116, 212)*

### Rangos de pifia distintos de 1-3

Varias mecánicas mueven el umbral, y **se acumulan**:

- **Maestría** (ver abajo): −1 grado.
- Ventaja de buena suerte: −1 grado (pifia sólo con 1-2; con maestría, sólo con 1).
- Desventaja de mala suerte: +2 grados (pifia con 1-5; con maestría, 1-4).
- «Incapaz de errar»: no pifia nunca, ni con un 1.
- Armas de fuego: cada arma sube el nivel de pifia necesario para que reviente.

En el sistema esto se expresa como **desplazamientos**, no como valores
absolutos: la regla especial `fumbleRange` (y `openRollRange` para la abierta)
suma o resta grados sobre la base. Ver
[house-rules.ts](../../src/system/statistic/house-rules.ts).

---

## La Maestría

Con una **habilidad final superior a 200** el personaje es un maestro y **resta
un grado a su índice de pifia**: el 3 deja de pifiar para él.

Se mide sobre la habilidad **ya modificada** por los modificadores situacionales
de la tirada, no sobre el valor de la ficha.

*(Core p. 7)*

---

## Controles de Resistencia

`1D100 + Resistencia` contra una dificultad. Tres particularidades:

1. **No admiten Tirada Abierta.**
2. Un **100 natural** siempre evita el efecto, por alta que sea la dificultad.
3. Con la Resistencia **20 puntos por encima** de la dificultad se supera
   **automáticamente, sin tirar**.

Las Resistencias **no son acciones**, así que los penalizadores a "toda acción"
no se les aplican (ver [modificadores.md](modificadores.md)).

*(Core p. 8)* · Código: [resistance.ts](../../src/system/dice/resistance.ts)

---

## Controles de Característica

`1D10 + característica` contra la dificultad. La diferencia por encima o por
debajo es el nivel de éxito o de fracaso. Sin abierta y sin pifia.

**Tabla 1: Controles de Características**

| Dificultad | Valor |
| --- | --- |
| Simple | 6+ |
| Normal | 10+ |
| Complejo | 15+ |
| Extremo | 20+ |

Si no se precisa la dificultad, se considera **Normal (10)**.

**Enfrentados**: ambos tiran y gana quien consiga la diferencia más alta a su
favor; misma cifra es empate. No tienen por qué compararse la misma
característica (FUE contra AGI, por ejemplo). Si la diferencia entre las dos
características es **mayor de 4**, cada punto por encima **cuenta doble** para el
superior (FUE 5 contra 11 → el 11 juega como 13).

### ⚠️ Regla del 10 y Regla del 1

- **Regla del 10**: un 10 natural **vale 12** (característica 9 + 10 → 21, no 19).
  Confirmado por el ejemplo del manual.
- **Regla del 1**: un 1 natural cuenta **tres puntos peor** de lo que marca, es
  decir como un −2.

⚠️ **La segunda no está confirmada.** La maquetación del Core (p. 8) pierde el
encabezado «Regla del 1» y su ejemplo se contradice: primero dice que el 1 suma
3 puntos a la diferencia, y después que un fracaso por 1 pasa a ser un fracaso
por 4. El Excel no modela controles de característica, así que no arbitra. Se ha
implementado la lectura simétrica con la Regla del 10 y coherente con el ejemplo
de fracaso. La constante está aislada en
[config.ts](../../src/system/dice/config.ts) (`NATURAL_1_PENALTY`) para poder
cambiarla en un sitio si se decide otra cosa en mesa.

*(Core p. 8)* · Código: [d10.ts](../../src/system/dice/d10.ts)

---

## Resultado del Asalto

Todo el combate se resuelve enfrentando dos tiradas:

```
Resultado del Asalto = Ataque Final − Defensa Final
```

Ambas admiten abierta y pifia.

### Si es positivo: el ataque impacta

Se le resta la **Absorción** del defensor:

```
Absorción = 20 (base de cualquier ser) + 10 × grados de TA del tipo de ataque
```

Los grados de TA que el ataque **ignora** (calidad del arma: 1 grado por cada +5;
conjuros y habilidades de Ki pueden ignorar más o todos) se descuentan antes.

Con lo que queda:

- **Menos de 10** → el golpe conecta pero **no hay daño**: sólo ha cortado ropa o
  el arma ha rebotado en la armadura.
- **10 o más** → **porcentaje de daño** = ese valor redondeado a la baja en
  grupos de 10 (27 → 20 %, 185 → 180 %). Se aplica al **daño final** del ataque y
  se resta de los Puntos de Vida. Es la **Tabla 42**.

### Si es negativo: contraataque

El defensor consigue un contraataque y puede responder de inmediato (Acción
Respuesta), si aún le quedan acciones activas. Obtiene un **bono** a su siguiente
habilidad enfrentada igual a **la mitad del valor a su favor, redondeada a la
baja en grupos de 5**, con un máximo de **+150** (−30 → +15, −100 → +50).

### Si es exactamente 0

Ni impacta ni hay contraataque.

En todos los casos el defensor queda **«puesto a la defensiva»**: pierde sus
acciones activas del asalto.

> Ejemplo del manual: Celia ataca con 120 y saca 86 → 206. El guardia defiende
> con 60 y saca 44 → 104. Resultado del Asalto **102**. Lleva cuero endurecido,
> TA 2 contra filo → Absorción **40**. 102 − 40 = 62 → **60 %**. El daño final
> del sable de Celia es 50, así que el guardia pierde **30 PV**.

*(Core p. 86-87)* · Código: [absorption.ts](../../src/system/combat/absorption.ts),
[resolution.ts](../../src/system/combat/resolution.ts)

---

## Escudos sobrenaturales

Un escudo mágico, psíquico o de ki es un **pool de puntos de resistencia** que
sustituye a la parada o a la esquiva. Un personaje sólo puede usar **una clase de
defensa por ataque**: no se combina un escudo con una parada ni con una esquiva.

La Proyección con la que se interponen es **inmodificable por el número de
bloqueos**: se pueden detener tantos ataques como se quiera en el asalto sin
penalizador acumulado.

**Parar cuesta puntos igualmente.** Cuando el escudo detiene el golpe, pierde
puntos equivalentes al **daño base** del ataque — no al porcentaje del Resultado
del Asalto.

> Escudo de 300 puntos contra una espada larga de daño base 60: aunque la
> defensa gane, al escudo le quedan **240**.

**Romperse deja pasar el resto.** Si el daño base supera los puntos que quedan,
el escudo se quiebra y el agredido *"sufre automáticamente el impacto sin la
posibilidad de defenderse, pero reduciendo el daño base a la cifra que ha
conseguido traspasar la barrera"*.

> Al escudo le quedan 40 y recibe el mismo ataque de 60: se rompe, y el defensor
> recibe el ataque **con la habilidad plena del atacante** (defensa 0) con un
> daño final de **20**.

**Cubrir a terceros**: se puede interponer el escudo por otro personaje, con
**−40** a la Proyección, declarándolo antes de que se tire. Si el escudo no
detiene el impacto, el agredido **sí** puede defenderse con normalidad.

Una **pifia al lanzar un escudo no anula el conjuro**: sólo resta el nivel de
pifia a la habilidad defensiva, como cualquier otra defensa.

La metamagia **Escudos Potenciados** dobla (1 esfera) o triplica (2 esferas) el
aguante.

*(Core p. 97-98; Arcana Exxet)* · Código:
[shield.ts](../../src/system/combat/shield.ts)

### Barrera de daño

> *"Si un ataque tiene un daño base inferior a la barrera del objeto, no importa
> cuál sea la habilidad del agresor, nunca podrá quitarle PV."*

Un escudo con barrera 60 no se desgasta con golpes de daño base 40, por buena
que sea la tirada. **Excepción: el daño de energía siempre atraviesa la
barrera**, porque afecta a la esencia y no sólo a la forma material.

La barrera **no se extrae del texto**: es un atributo que se rellena en la ficha
del ítem, grado a grado. El manual la expresa de media docena de formas
distintas y una barrera mal adivinada volvería inmune a un escudo, así que se
prefirió el dato explícito. Ver la cabecera de
[parse-effect-numbers.ts](../../scripts/lib/parse-effect-numbers.ts).

*(Core p. 236, Tabla 81)*

---

## Potencial psíquico y escala de dificultades

`1D100 + Potencial Psíquico`, **con abierta y con pifia**. El total se busca en
la escala de diez grados (20 / 40 / 80 / 120 / 140 / 180 / 240 / 280 / 320 / 440,
ver `DIFFICULTY_LEVELS` en [tables.ts](../../src/actors/creature/tables.ts)) y el
grado alcanzado se lee en la tabla de efectos del poder.

*(Core p. 210-212; detalles en [psiquica.md](psiquica.md))*

---

## De dónde salen las cifras de conjuros y poderes

El Excel **no tiene columnas** de daño ni de aguante: los números viven dentro de
la prosa de cada grado (`"Daño 100."`, `"1.000 puntos de Resistencia"`,
`"1500 PVs"`). El extractor los lee con
[parse-effect-numbers.ts](../../scripts/lib/parse-effect-numbers.ts) al
regenerar los packs, así que sobreviven a cada regeneración.

Dos detalles que costaron:

- Algunos conjuros ponen el daño **en la descripción** y varían otra cosa por
  grado (*Espina de la tierra*: "cada espina tiene daño base 60" y luego 2/4/6/8
  espinas). La descripción actúa de valor por defecto, sólo para conjuros de
  ataque y de defensa.
- La **TA declarada gana** a cualquier palabra suelta. *Espina de la tierra*
  declara Penetrantes y menciona "energía" sólo para decir a quién no afecta;
  *Devastación* "ataca en la TA de calor, aunque es capaz de dañar energía".

Los conjuros a los que el manual no da cifra están listados con su motivo en
`MANUAL_OVERRIDES` dentro del extractor, y fijados como conjunto exacto en
`tests/spell-compendium.test.ts` para que un hueco nuevo no pase inadvertido.

---

## Pendiente de volcar

- **Nivel de Crítico** y **Tabla 50** (críticos de combate): no admite ni abierta
  ni pifia. Fuera del alcance de la primera fase del sistema de tiradas.
- **Tabla 51** (localización del impacto) y los estados derivados.
- **Tabla 52** (pifia en turno) sólo está implementada como penalizador de
  sorpresa: 01 → −125, 02 → −100, 03 → −75.
- **Choque de conjuros** (Tabla 57): ver [magia.md](magia.md).
- Ataques múltiples y sus penalizadores; segunda arma a −40 (−10 con
  Ambidestría): ver [armas-y-combate.md](armas-y-combate.md).
