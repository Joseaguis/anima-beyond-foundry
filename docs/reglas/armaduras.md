# Armaduras

Fuente: Core Exxet pp. 80–82 (verificado contra el texto del manual).

## Estructura de datos de una armadura

| Campo | Valores | Notas |
| --- | --- | --- |
| Nombre | — | p. ej. Piezas, Completa, Cota de mallas… |
| **Clase** | `Dura` / `Blanda` / `Natural` | Duras: rígidas. Blandas: se adaptan al movimiento. Naturales: protecciones sobrenaturales (conjuros, ki) que no cuentan como capa |
| **Localización** | `Completa`, `Peto`, `Camisola`, `Cabeza` (yelmos) | Peto: pecho y espalda. Camisola: + brazos. Completa: todo salvo la cabeza. Yelmos: solo cabeza |
| **TA por tipo de ataque** | 0–10 | Siete valores: FIL, CON, PEN, CAL, FRI, ELE, ENE. Cada punto de TA suma +10 a la Absorción contra ese tipo |
| **Requerimiento** | 0–150+ | Habilidad *Llevar Armadura* necesaria para usarla sin problemas |
| **Penalizador natural** | 0 a −70… | Se aplica **siempre** al turno y a las secundarias afectadas (ver abajo) |
| **Restricción al movimiento** | 0 a −6… | Resta al Tipo de Movimiento |
| **Pen. Percepción** | 0 a −10… | Solo yelmos |
| Entereza / Presencia | — | Propiedades del objeto |
| **Calidad** | −5 (mediocre) a +25 | Ver § Calidad. La ficha Excel contempla rangos mayores para materiales especiales |
| Peso / Precio | — | — |

## Llevar Armadura, requerimiento y penalizador natural

*Llevar Armadura* es una habilidad primaria de combate basada en FUE (suma el bono
de FUE aunque no se inviertan PD).

- **Si Llevar Armadura < requerimiento**: penalizador a **toda acción física**
  igual a la **diferencia** (Celia: LA 50, escamas req. 80 → −30 a toda acción física).
- **El penalizador natural se aplica siempre** (se cumpla o no el requerimiento) al
  **turno** del personaje y a sus **habilidades secundarias afectadas**.
- **Los puntos de Llevar Armadura por encima del requerimiento reducen el
  penalizador natural 1:1** (placas: req. 90, pen. −35; con LA 110 el penalizador
  queda en −15).
- **Cada 50 puntos de exceso restan además 1 a la restricción al movimiento**.

### Secundarias afectadas por el penalizador de armadura

Acrobacias, Atletismo, Nadar, Saltar, Trepar, Proezas de Fuerza, Ocultarse,
Sigilo y Baile. Dos casos especiales:

- **Nadar**: el penalizador **no puede reducirse** con Llevar Armadura.
- **Sigilo**: solo puede reducirse **hasta la mitad** de su valor.

## Capas de armadura

- Máximo **1 armadura dura + 2 blandas** a la vez.
- **Cada capa adicional a la primera (salvo las naturales) causa −20 al turno y a
  las secundarias afectadas**. Es automático y **no se reduce** con Llevar Armadura.
- Con varias capas **se suman**: los requerimientos (10 + 50 → hace falta LA 60),
  los penalizadores naturales (−20 y −25 → −45) y las restricciones al movimiento
  (1 + 3 → 4).

### Combinación de TAs

Por cada tipo de ataque: la TA más alta como base **+ la mitad de cada una de las
otras, redondeando hacia abajo**. Ejemplo: TA Filo 6 y 5 → 6 + ⌊5/2⌋ = **8**.

## Calidad (cada +5 de una armadura)

| Efecto | Valor |
| --- | --- |
| TA | +1 (en los tipos que ya protege) |
| Penalizador natural (y turno) | −5 |
| Requerimiento | −5 |
| Restricción al movimiento | −1 |
| Presencia | +50 |
| Entereza | +5 |

Mediocre (−5): resta los mismos beneficios, salvo la presencia, que no cambia.

## Estado en el código

- Modelo: [src/items/armor/model.ts](../../src/items/armor/model.ts) (`armorType`,
  `localization`, 7 TAs, `requirement`, `naturalPenalty`, `movementPenalty`,
  `perceptionPenalty` + físicos). Cada armadura equipada se publica en
  `system.equippedArmors`.
- Cálculo: [src/actors/creature/prep/equipment.ts](../../src/actors/creature/prep/equipment.ts)
  implementa todo lo anterior — calidad por armadura, suma de requerimientos y
  penalizadores, reducción por exceso de LA (con los casos Nadar/Sigilo), −20 por
  capa, TA combinada y restricción al movimiento — y lo publica en
  `system.equipment`. Las secundarias afectadas están marcadas con `armorPenalty`
  en [src/data/secondaryAbilities.ts](../../src/data/secondaryAbilities.ts).
  Tests en [tests/equipment-prep.test.ts](../../tests/equipment-prep.test.ts).
- **Faltas conocidas**: las TAs se combinan globalmente, no por localización (el
  campo existe pero no hay zonas de impacto); no se impide equipar más de 1 dura +
  2 blandas (solo se calculan sus penalizadores); la calidad no ajusta todavía la
  entereza/presencia mostradas del item; escudos aparte (son armas).

## Pendiente de volcar (⚠️ verificar en Core Exxet)

- Reglas de **zonas de impacto / golpes apuntados** (qué TA aplica por localización).
- Rotura contra armaduras y degradación del equipo ("la rotura se aplica contra
  todas las capas a la vez", Core p. 91 aprox.).
