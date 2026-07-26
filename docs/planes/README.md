# Planes de trabajo

Planes de implementación diseñados en una sesión para ejecutarse en otra. Cada plan es autocontenido:
incluye el **contexto** (por qué se hace), las **decisiones ya tomadas** con el usuario (no se vuelven a
preguntar), las **fases** de ejecución con rutas de fichero concretas, y cómo **verificar** el resultado.

## Índice

| Plan | Estado | Resumen |
|---|---|---|
| [item-sheet-pf2e.md](item-sheet-pf2e.md) | `pendiente` | Rediseño de las hojas de Item al patrón PF2e: barra lateral de resumen, eje Descripción/Detalles/Reglas, ProseMirror y fusión de Modificadores en Reglas. |

Documentos de apoyo (no son planes, son notas de investigación reutilizables):

- [referencia-pf2e-item-sheets.md](referencia-pf2e-item-sheets.md) — anatomía verificada de las item
  sheets de `../pf2e` y firmas de API de Foundry v14 comprobadas contra `fvtt-types`.

## Convención

**Estados**: `pendiente` (diseñado, sin empezar) · `en curso` (fases parcialmente hechas; el plan anota
cuáles) · `hecho` (completado y verificado; se puede borrar el fichero o dejarlo como registro).

**Cómo retomar un plan**: leer el plan completo antes de tocar código. Las decisiones marcadas como
tomadas con el usuario no se renegocian. Si al implementar se descubre que una fase estaba mal diseñada,
corregir el plan en el mismo commit que el código, para que el estado del fichero nunca mienta.

**Al terminar una fase**: marcarla en el plan (`- [x]`) y actualizar el estado de la tabla de arriba. Si el
plan cambia de alcance a medio camino, dejarlo escrito ahí y no en la conversación, que se pierde.
