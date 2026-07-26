# Anima Beyond Foundry

Sistema de FoundryVTT para el juego de rol Anima: Beyond Fantasy.
Stack: TypeScript, React, Vite, Tailwind CSS.

## Carpetas de referencia (solo lectura, NUNCA modificar)

Los proyectos externos están al mismo nivel que `anima-beyond-foundry/` dentro de `AnimeBeyondFantasyRol/`. Desde el directorio de trabajo, acceder con `../`.

### `../anime-beyond-fantasy-docs/` — Reglas del juego
- `docs/pdfs/` — Libros de reglas:
  - `Core exxet.pdf` — Reglas principales (combate, características, habilidades)
  - `Arcana Exxet.pdf` — Reglas de magia y lo sobrenatural
  - `Dominus Exxet - Los dominios del ki.pdf` — Reglas de Ki
  - `prometheum exxet.pdf` — Contenido adicional
- `docs/excels/Ficha Anima v8.7.0.xlsx` — Ficha de personaje con fórmulas, tablas de datos, controles y reglas del juego integradas. Es la fuente de verdad para cálculos, costes, límites y tablas. Existen algunas reglas que no las trae el PDF porque se indicaron de forma posterior, pero el Excel SIEMPRE tiene la razon.
- `graphify-out/converted/` — El Excel convertido a Markdown, mucho más fácil de consultar que el xlsx crudo. Preferir estos archivos .md para buscar tablas, costes y fórmulas.
- `docs/AnimaBeyondFantasyVisual.md` — Referencia de diseño visual
- `docs/ClaudeDesignPrompt.md` — Guías de diseño
- **Tiene graphify**: `graphify-out/graph.json` existe. Usar `graphify query` desde ese directorio para buscar reglas, mecánicas o datos del juego.

### `../pf2e/` — Referencia de código FoundryVTT
- Sistema de Pathfinder 2e para FoundryVTT, hecho en TypeScript.
- Es el sistema de FoundryVTT mejor hecho y más completo que existe.
- Usar como referencia de arquitectura, patrones y buenas prácticas de FoundryVTT.
- **Tiene graphify**: `graphify-out/graph.json` existe. Usar `graphify query` desde ese directorio para buscar patrones de implementación, estructura de datos o APIs de FoundryVTT.

## Arquitectura: dominios verticales

Los subsistemas de juego de Ánima viven como módulos verticales en `src/domains/<subsistema>/` (actualmente `ki/`, `magic/`, `psychic/`), cada uno dueño de su lógica de negocio con el patrón:

- `data.ts` — tipos del subsistema + su slice del actor system
- `tables.ts` — tablas del Excel propias del subsistema
- `prepare.ts` — cálculo de valores derivados
- Un fichero por modelo de item (`ki-ability.ts`, `spell.ts`, `magic-path.ts`…)

Reglas:

1. **Nuevos subsistemas** (invocación, Ars Magnus…) → nuevo `src/domains/<x>/` con este patrón.
2. **UI, packs y sheets NO van en domains** — siguen la convención Foundry (`src/components/`, `src/packs/`, `src/sheets/`).
3. Los tipos de datos de un subsistema se importan **de su dominio**, nunca del prep del actor.
4. `src/items/index.ts` es el barrel estable: re-exporta los modelos desde domains para que `main.ts`/`config.d.ts` no cambien.
5. `prep/supernatural.ts` es solo un orquestador fino; el orden del pipeline lo manda `character/model.ts` (p. ej. ki necesita `martialKnowledge`, publicado por `prepareVitals`).
6. Las tablas core de criatura (modificador, vida, regeneración, `lookup1to20`) quedan en `actors/creature/tables.ts`.

## Reglas de trabajo

1. **NUNCA modificar** archivos en `../anime-beyond-fantasy-docs/` ni en `../pf2e/`. Son solo referencia.
2. **Todo el desarrollo** va exclusivamente en este proyecto (`anima-beyond-foundry/`).
3. Cuando se necesiten **reglas, mecánicas o datos del juego**, consultar **primero `docs/reglas/`** (resúmenes estructurados de las reglas con estado de implementación); solo si el dato no está ahí o está marcado "⚠️ verificar", acudir a `../anime-beyond-fantasy-docs/` (PDFs para reglas, Markdown convertido o Excel para tablas/cálculos). Al verificar un dato pendiente, actualizar el markdown de `docs/reglas/` correspondiente.
4. Cuando se necesiten **patrones de implementación de FoundryVTT**, consultar `../pf2e/`.
5. `docs/planes/` guarda los **planes de trabajo pendientes** (diseñados en una sesión para ejecutarse en otra). Consultar su `README.md` antes de empezar un rediseño grande: puede que ya esté planificado, con las decisiones tomadas y las notas de investigación hechas.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
