# Habilidades secundarias

Fuente: hoja `PDs` (filas 128-186) de la ficha Excel; fórmulas verificadas con
`ficha-test01.xlsx` en [tests/ficha-test01.test.ts](../../tests/ficha-test01.test.ts).

## Fórmula del total (confirmada, PDs!AA129)

```
Total = (−30 si Base < 5)            ← sin entrenar
      + Base                          ← Σ floor(PD_categoría / coste_categoría)
      + Bonos                         ← min(bono_car · (1 + Bon.) + 10 · Hab., 100)
      + Cat.                          ← bonos innatos de categoría por nivel + 10·Novel
      + Esp. + 40 si hay especialidad + modificadores (toda acción / física)
```

- **Sin entrenar (−30)**: se aplica mientras la **base comprada con PD sea
  menor que 5** (no basta con haber invertido algo: 10 PD a coste 3 dan base 3
  y siguen sin entrenar). Una ventaja lo anula (flag `Tablas!G310` en el Excel,
  probablemente "Aprendiz de todo"; ⚠️ verificar cuál). Implementado en
  `prepareSecondaries` (solo modo "dp").
- Algunas habilidades muestran `-` sin entrenar (Medicina, Venenos, V. Mágica,
  Baile, Forja…): **no pueden usarse sin entrenamiento**; el valor numérico
  subyacente sigue la fórmula. El sistema hoy calcula el número igualmente.

## Mejora natural (columnas "Bon.", "Hab." y "Novel" — confirmada y modelada)

- **Bon. (bonos naturales)**: nº de veces que se vuelve a aplicar el bono de la
  característica a esa habilidad (negativo incluido: withstandPain con VOL −5 y
  Bon. 1 aporta −5). Presupuesto: **1 para secundarias físicas
  (FUE/DES/AGI/CON) + 1 para mentales por nivel**, con suelo a nivel 0
  (`max(1, nivel)` de cada tipo; la plantilla del Excel a nivel 0 muestra
  "de 1 + 1"). Acumulables en la misma habilidad sin tope individual
  (ficha-test01 tiene Bon. 2 y una con 6; a nivel 10 suma exactamente 10
  físicos + 10 mentales).
- **Hab. (habilidades naturales)**: **+10 cada una**; presupuesto global
  **`5 × max(1, nivel)`** (ficha-test01: "50 de 50" a nivel 10, PDs!Y186;
  plantilla a nivel 0: "de 5"). Sin tope por habilidad.
- **Novel**: **+10 cada uno que suma a la columna Cat.** (bono de categoría),
  **fuera del cap de Bonos**. Los concede la categoría **Novel**
  (`novelPerLevel: 5` en `freelancer.json`; el resto de categorías 0); máximo =
  `Σ novelPerLevel × niveles` por tramo. ⚠️ Verificar en Core Exxet el número
  exacto por nivel (el volcado de valores del Excel no lo revela; 5/nivel es la
  decisión adoptada) y el comportamiento a nivel 0 con categoría Novel.
- **Cubo "Bonos" (PDs!U129)**: `min(bono_car × (1 + Bon.) + 10 × Hab., 100)`.
  El cap de 100 aplica **solo a este cubo**: Base, Cat. (incluido `10·Novel`),
  Esp. y modificadores suman por encima.
- **Regla especial "cap suave"** (`secondaryBonusSoftCap`, house rule, ver
  [src/rules/special-rules.ts](../../src/rules/special-rules.ts)): el exceso
  sobre 100 cuenta a la mitad, redondeando hacia abajo a múltiplo de 5
  (120→110, 130→115, 145→120, 200→150).
- **Estado en el código**: modelado con los contadores persistidos
  `naturalBonus` / `naturalAbilities` / `novelBonus` de cada secundaria (fijas
  y custom); el cubo y los presupuestos se calculan en `prepareSecondaries`
  (`system.secondaryImprovement`, política Excel: exceder **no recorta, avisa**
  y la UI lo pinta en rojo). El campo manual `natural` fue eliminado
  (migración `migrateSecondaryNatural`). Tests:
  [tests/secondary-improvement.test.ts](../../tests/secondary-improvement.test.ts).

## Datos por habilidad (confirmados con ficha-test01)

- **Trampería usa DES** (no PER) — corregido en
  `src/data/secondaryAbilities.ts`.
- **Comercio es del grupo Sociales** (coste 2 en Guerrero/Tecnicista), aunque
  su característica es INT.
- Guerrero: P. Fuerza coste 1 (`secondaryCostOverrides`) y +5/nivel
  (`secondaryAbilityBonusPerLevel`) — PDs!AA159 = 95 con 50+20 PD.
- **No hay bonos innatos por grupo**; solo por habilidad individual.

## Habilidades fuera de la lista fija

La ficha permite filas libres (p. ej. "Ciencia Divina", PDs!fila 180 en
ficha-test01, y "Pilotar" que en nuestro sistema no está en
`DEFAULT_SECONDARY_ABILITIES`): se modelan como `customSecondary` con coste
plano propio, grupo y característica. Siguen la misma fórmula (incluido el
−30 sin entrenar).
