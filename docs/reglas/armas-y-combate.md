# Armas y combate físico

Fuente: Core Exxet pp. 72–73 (armas), 88–89 (ataques múltiples y armas
adicionales) — verificado contra el texto del manual — más las fórmulas de la
ficha Excel oficial.

## Estructura de datos de un arma

| Campo | Notas |
| --- | --- |
| Nombre y tipología | Cortas (P), Hacha (M), Maza (M), Espada (M), Mandoble (G), Asta (G), Cuerda (M), Mixtas (el mayor de sus tipos), Sin armas. + Escudos, Proyectiles, Lanzamiento, Munición |
| **Tamaño** | `Pequeño` / `Medio` / `Grande` — fija el penalizador por ataque adicional (−20/−30/−40) |
| **Proporciones** | `Normal` / `Enorme` / `Gigante` (ver § Armas enormes y gigantes) |
| Daño base | Ver fórmula de daño |
| Velocidad (turno) | Se suma/resta a la iniciativa mientras se empuña |
| **FUE requerida** | **−10 a la habilidad con el arma por cada punto de FUE que falte**. En armas a una o dos manos hay dos cifras (a dos manos / a una) |
| Crítico primario / secundario | FIL, CON, PEN, CAL, FRI, ELE, ENE |
| A una / dos manos | A dos manos se **dobla el bono de FUE** al daño |
| Entereza / Rotura / Presencia | Propiedades del objeto |
| **Calidad** | −5 (mediocre) a +25, pasos de 5 (ver § Calidad) |
| Munición | En proyectiles, el daño/calidad relevantes son los de la munición |
| Especiales | Precisa, Presa, Derribo, Lanzable, Compleja, alcance… |

## Fórmulas (confirmadas)

- **Daño final** = daño base (escalado por proporciones) + bono de FUE
  (**doblado si se empuña a dos manos**), **redondeando el total hacia arriba en
  grupos de 10**, + doble del bono de calidad + otros bonos (ki, elan…).
  Ejemplo: base 45 + FUE +10 = 55 → **60**.
- **HA / HP con el arma** = habilidad final del personaje + bono de calidad
  − 10 × puntos de FUE que falten. La calidad **no** suma a la esquiva.
- **Turno con el arma** = iniciativa del personaje + velocidad del arma + calidad.
- **Desarmado**: velocidad 20, daño base 10 (+ bono de FUE), crítico CON, salvo
  artes marciales. No puede usar la regla de armas adicionales. **El daño
  desarmado NO se redondea en grupos de 10** (Combate!L21 de la ficha: base por
  tamaño + bono de FUE tal cual; verificado con ficha-test01: FUE +5 → 15); el
  redondeo del primer punto es solo del daño con armas.
- **Proyectiles**: los lanzados suman el bono de FUE a una mano; las ballestas usan
  la FUE propia del arma (+ calidad) en lugar de la del tirador (⚠️ matiz por
  implementar).

## Ataques múltiples y dos armas (Core p. 88–89)

- **Ataques adicionales por habilidad**: un personaje puede declarar ataques extra;
  con HA 220 puede hasta 3, con 60 solo 1 (≈ 1 + ⌊HA/100⌋). Cada ataque adicional
  declarado penaliza **todos** los ataques del asalto según el tamaño del arma:
  **Pequeña −20, Media −30, Grande −40**. Todos los ataques cuentan como una sola
  acción, y cada golpe extra puede usarse como contraataque.
- **Arma adicional (dos armas)**: da **un ataque extra con la segunda arma**, con
  **−40 solo a la habilidad del segundo ataque**; con la ventaja *Ambidestría* ese
  penalizador baja a **−10**. El ataque extra también sirve como contra adicional.
- **Turno con dos armas: siempre el del arma más lenta.** Si además se declaran
  ataques adicionales, se usa el penalizador del arma de mayor tamaño.
- Cada arma conserva **sus propios HA/HP/turno/daño**: el personaje elige con qué
  arma ejecuta cada ataque o parada.

## Armas enormes y gigantes (Core p. 73)

| | Enorme (2–5× tamaño) | Gigante (>5×) |
| --- | --- | --- |
| Daño base | ×1.5, redondeando hacia abajo en grupos de 5 | ×2 |
| FUE requerida | +2 | +5 |
| Entereza / Rotura | +6 / +3 | +16 / +8 |
| Quién puede usarla | Tamaño ≥ 9 (con −40 al turno si Tamaño < 23) | Tamaño ≥ 23 (con −40 al turno si Tamaño < 29) |

Los bonos especiales al daño (calidad incluida) se aplican **después** del escalado.

## Calidad (cada +5 de un arma)

| Efecto | Valor |
| --- | --- |
| Habilidad de ataque y parada | +5 |
| Velocidad (turno) | +5 |
| Daño | **+10** (el bono se dobla) |
| Rotura | +2 |
| Entereza | +10 |
| Presencia | +50 |
| **TA del defensor** | **−1** (un arma +10 resta 2 grados de TA) |

Rango: +5 a +25 como máximo (Core); mediocre −5 (resta lo mismo, salvo la
presencia, que no cambia). A partir de ~+15 el origen es sobrenatural.

## Resolución de ataques (principio de diseño)

Todo ataque parte de una de estas fuentes: un **arma** (incluidas armas naturales
de criaturas), el **desarmado**, la **magia** (proyección mágica) o lo **psíquico**
(proyección psíquica). Cada fuente aporta su habilidad de ataque, su daño y su
tipo de crítico.

Contra el daño **siempre se aplica la TA combinada del defensor** del tipo
correspondiente (cada punto de TA = +10 Absorción), salvo que el ataque
**atraviese TAs**: la calidad del arma resta 1 grado por +5 (ya modelado como
`atPiercing`), y conjuros/ki/habilidades pueden ignorar más o toda. El dato
"grados de TA que ignora" debe viajar con cada ataque.

## Estado en el código

- Modelo: [src/items/weapon/model.ts](../../src/items/weapon/model.ts)
  (`weaponType`, `damage`, `speed`, `requiredStr`, tipos de crítico, `hands`,
  `size`, `proportions`, `range`/`reload` para proyectiles, `ammoId` con la
  munición enlazada, físicos). Cada arma equipada se publica en
  `system.equippedWeapons` (la munición del arma se resuelve ahí mismo).
- Cálculo por arma: [src/actors/creature/prep/equipment.ts](../../src/actors/creature/prep/equipment.ts)
  publica en `system.equipment.weapons` la HA/HP (con calidad y penalizador por
  FUE insuficiente), turno (con calidad y −40 por proporciones), daño final
  (escalado + FUE ×2 a dos manos + redondeo a 10 + doble calidad), `atPiercing`
  y los avisos `meetsStrength`/`meetsSize`; `system.equipment.unarmed` lleva el
  desarmado (velocidad 20, daño 10 + FUE). Con varias armas, la iniciativa usa
  la más lenta. Los items con `weaponType: "ammo"` equipados no generan bloque
  propio: se consumen vía el `ammoId` del arma. Tests en
  [tests/equipment-prep.test.ts](../../tests/equipment-prep.test.ts).
- **Munición enlazada**: en armas `ranged` con munición, el daño final y el
  `atPiercing` usan el daño y la calidad **de la munición**; la HA/parada/turno
  conservan la calidad del arma. ⚠ Verificar el matiz exacto (¿la calidad de la
  munición afecta también a la HA?) contra Core Exxet/Excel.
- **Bonos de equipo** (caja "Equipo (Turno)" del Excel):
  `system.combat.equipBonus` (`turn`/`attack`/`parry`/`dodge`/`damage`),
  editables en la cabecera "Desarmado" de la pestaña Combate. Se aplican en
  `prepareEquipment` a todas las armas y al desarmado; el Bono Esq. solo entra
  en la esquiva mostrada en los bloques (`system.equipment.dodge`), nunca en
  `combat.dodge.final`.
- **Faltas conocidas**: número de ataques por asalto y sus penalizadores (es
  mecánica del flujo de ataque, aún sin implementar); el −40/−10 de la segunda
  arma (necesita saber qué arma es la secundaria y si hay Ambidestría);
  ballestas (FUE propia); artes marciales y estilos en las
  fórmulas; arma conocida/similar/desarrollada; empuñar a dos manos un arma
  "a una o dos manos" (hoy solo dobla FUE si `hands === "two"`); la calidad no
  ajusta la entereza/rotura/presencia mostradas del item; contador de usos de
  munición (el enlace no descuenta proyectiles).

## Pendiente de volcar (⚠️ verificar)

- Tablas de **artes marciales** (grados, requisitos y bonos) — Core Exxet y
  Dominus Exxet.
- Penalizadores por **arma no conocida / similar / arquetípica** (tabla "Armas
  Conocidas" de la ficha).
- Escudos: TA/parada y su efecto exacto en el turno ("penalizador del escudo",
  ficha Excel).
- Maniobras de combate (apuntar, presa, derribo, desarme…) y estados (dolor de
  críticos, sorpresa).
