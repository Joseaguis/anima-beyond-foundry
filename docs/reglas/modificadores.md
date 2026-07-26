# Modificadores y reglas de acumulación

En Anima casi todo bono o penalizador se expresa como un modificador plano sobre una
habilidad o característica derivada. La clave del sistema es saber **qué modificadores
se acumulan entre sí (stackean) y cuáles no**.

## Categorías de modificadores (según la ficha oficial)

La ficha Excel agrupa los modificadores del personaje en dos grandes cubos, más los
especiales:

| Categoría | Ejemplos | A qué se aplica |
| --- | --- | --- |
| **A toda acción** | Cansancio (fatiga), dolor de críticos, estados (ceguera, sorpresa…) | Todas las tiradas y habilidades |
| **A acciones físicas** | Penalizador natural de armadura (requisito no cumplido), presa, terreno | Solo acciones físicas: combate, secundarias físicas, etc. |
| **Especiales (Esp.)** | Modificadores puntuales de efectos concretos | Según el efecto |

Además, cada habilidad concreta recibe modificadores propios que no pasan por estos
cubos (bono de arma, calidad, arte marcial, ki, elan, personalización…). Ver
[armas-y-combate.md](armas-y-combate.md).

### Cansancio (Tabla 27, Core Exxet p. 60 — confirmado)

Los puntos de cansancio equivalen a la CON. Con 4 o menos puntos, penalizador
**a toda acción**:

| Puntos de cansancio | Penalizador |
| --- | --- |
| 4 | −10 |
| 3 | −20 |
| 2 | −40 |
| 1 | −80 |
| 0 | −120 |

Con CON natural < 5 el penalizador no se sufre automáticamente: empieza al perder
los primeros puntos. Además, se pueden **gastar** puntos de cansancio: +15 por punto
a acciones físicas (máx. 2 por asalto), o +1 por punto a controles de característica
FUE/DES/AGI, o +15 ACT / +1 a todas las acumulaciones de ki durante un asalto.

## Reglas de acumulación

1. **Regla general — los penalizadores se acumulan.** Cansancio + dolor + armadura +
   presa se suman todos, salvo que un efecto diga lo contrario.
2. **Un mismo efecto no se acumula consigo mismo.** Dos lanzamientos del mismo conjuro,
   dos usos de la misma técnica de ki o dos objetos con el mismo poder no se suman:
   se aplica solo el mayor. (Regla general de lo sobrenatural; Core/Arcana Exxet.)
3. **Bonos de orígenes distintos sí se acumulan.** Bono del arma + calidad + arte
   marcial + estilo de combate + ki + elan se suman todos en la HA, porque cada uno
   procede de una fuente distinta (así lo hace la fórmula de la ficha, confirmado).
4. **Excepciones con fórmula propia.** Algunas combinaciones no suman linealmente y
   tienen su propia regla:
   - **TAs de varias armaduras**: la mayor + la mitad (redondeando abajo) de cada una
     de las demás. Ver [armaduras.md](armaduras.md).
   - **Turno con dos armas o escudo**: no se suman los turnos; se aplica el peor
     (más penalizador adicional si procede). Ver [armas-y-combate.md](armas-y-combate.md).

### Ejemplo

Un personaje con HA final 120 ataca fatigado (cansancio: −20 a toda acción) y con una
armadura cuyo requisito no cumple (penalizador natural −30, a acción física). Ambos
penalizadores se acumulan: ataca con 120 − 20 − 30 = 70. Si además estuviera bajo dos
lanzamientos del conjuro *Escudo de X* (+10 y +20 a la defensa), solo aplicaría el +20.

## Estado en el código

- Motor de stacking: [src/rules/modifier.ts](../../src/rules/modifier.ts). Usa tipos al
  estilo PF2e (`untyped`, `item`, `magic`, `status`, `circumstance`, `special`):
  `untyped` siempre se acumula; de cada tipo con nombre solo aplica el mejor bono y el
  peor penalizador.
- **Política recomendada para Anima**: por defecto `untyped` (en Anima casi todo se
  acumula). Reservar un tipo con nombre para efectos mutuamente excluyentes — p. ej.
  dar el mismo `type` a las dos instancias del mismo conjuro para que solo aplique el
  mayor. Si hace falta afinar más, la regla real de Anima es "por efecto/origen", no
  por categoría amplia: podría necesitarse un campo `slug`/origen en el futuro.
- Targets agregados en [src/rules/targets.ts](../../src/rules/targets.ts):
  - **`allActions`** ("toda acción") se aplica a ataque, parada, esquiva, llevar
    armadura, proyección mágica, proyección psíquica y todas las secundarias.
  - **`physicalActions`** ("acción física") se aplica a las habilidades de combate y a
    las secundarias físicas (las basadas en FUE/DES/AGI/CON;
    ver `isPhysicalSecondary` en
    [src/actors/creature/prep/secondaries.ts](../../src/actors/creature/prep/secondaries.ts)).
  - Los penalizadores de armadura (capas, penalizador natural y requisito no
    cumplido) los genera la fase
    [src/actors/creature/prep/equipment.ts](../../src/actors/creature/prep/equipment.ts)
    y siguen esta misma semántica.
- El **penalizador por cansancio** (Tabla 27) se calcula automáticamente desde
  `fatigue.current` en [src/actors/creature/prep/state.ts](../../src/actors/creature/prep/state.ts)
  y se aplica a toda acción (combate, proyecciones y secundarias), no al turno.

## Pendiente de volcar (⚠️ verificar en Core Exxet)

- Penalizadores por **dolor/críticos** y estados (ceguera parcial/total, sorpresa,
  presa, derribado, a oscuras…) con sus valores exactos — irían en `prepareState`.
- Si el penalizador de "toda acción" afecta también a acciones pasivas (resistencias no,
  confirmado: las RES no son acciones).
