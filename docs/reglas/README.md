# Reglas de Anima: Beyond Fantasy — Referencia para el desarrollo

Resumen estructurado de las reglas del juego que el sistema debe implementar.
El objetivo es poder desarrollar sin tener que consultar continuamente los PDFs
o el Excel. **Ante cualquier discrepancia, la fuente de verdad es:**

1. `../anime-beyond-fantasy-docs/docs/excels/Ficha Anima v8.7.0.xlsx` (fórmulas y tablas;
   versión Markdown en `../anime-beyond-fantasy-docs/graphify-out/converted/`)
2. Los manuales en `../anime-beyond-fantasy-docs/docs/pdfs/` (Core Exxet, Arcana Exxet,
   Dominus Exxet, Prometheum Exxet)

## Índice

| Documento | Contenido |
| --- | --- |
| [tiradas.md](tiradas.md) | Mecánica base: D100 y D10, tirada abierta, pifia, maestría, resistencias, características y Resultado del Asalto |
| [desarrollo-pds.md](desarrollo-pds.md) | PD totales por nivel, multi-categoría, costes por categoría, cambio de categoría y límites por reserva |
| [secundarias.md](secundarias.md) | Fórmula del total, −30 sin entrenar, mejora natural (Bon./Hab.), habilidades custom |
| [modificadores.md](modificadores.md) | Tipos de modificadores, qué se acumula (stackea) y qué no |
| [armaduras.md](armaduras.md) | Estructura de las armaduras, capas (hasta 3), combinación de TAs, requisito y penalizadores |
| [armas-y-combate.md](armas-y-combate.md) | Estructura de las armas, fórmulas de HA/HP/HE/Turno/Daño, dos armas, artes marciales, calidad |
| [magia.md](magia.md) | Vías, Zeón, ACT, Proyección Mágica, conjuros, Convocación, metamagia |
| [ki.md](ki.md) | Puntos de Ki, árbol de Dominios del Ki, creación de técnicas, Némesis |
| [psiquica.md](psiquica.md) | CVs, Potencial Psíquico, Proyección Psíquica, disciplinas, poderes innatos |
| [mantenimiento.md](mantenimiento.md) | Mantenimiento y efectos activos transversales a magia/ki/psíquica (hechizos mantenidos, diarios, técnicas persistentes) |

## Convenciones de estos documentos

- **Confirmado**: regla contrastada con el Excel (fórmulas literales) o con el manual.
- **⚠️ Verificar**: regla escrita de memoria o incompleta; hay que contrastar el valor
  exacto con el manual antes de implementarla. Cada documento tiene una sección
  "Pendiente de volcar" con lo que falta por extraer de los libros.
- Abreviaturas: HA (habilidad de ataque), HP (habilidad de parada), HE (habilidad de
  esquiva), HD (habilidad defensiva: la parada o la esquiva usada), TA (tipo de
  armadura / índice de protección), FUE/DES/AGI/CON/INT/POD/VOL/PER (características).
- Tipos de ataque para TAs: FIL (filo), CON (contundente), PEN (penetrante),
  CAL (calor), FRI (frío), ELE (electricidad), ENE (energía).
