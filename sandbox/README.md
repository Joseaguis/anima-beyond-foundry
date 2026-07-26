# Sandbox de UI

Galería standalone de las ventanas del sistema (fichas y sheets de item) con
hot reload, sin necesidad de tener Foundry abierto:

```
npm run sandbox
```

No sustituye al build de Foundry: `npm run dev` (vite build --watch) sigue
siendo el modo para desarrollar contra Foundry.

## Cómo funciona

- `foundry-shim.ts` emula lo mínimo de Foundry que usan modelos y componentes
  (`foundry.data.fields`, `foundry.abstract.TypeDataModel`, `game.i18n` sobre
  `src/lang/es.json`, `Roll`, `foundry.utils.randomID`, `ui.notifications`).
  Debe ser siempre el primer import de `main.tsx`.
- `mock-documents.ts` replica el ciclo de preparación de `AnimaActor` sobre
  documentos en memoria, usando los TypeDataModels y rule elements REALES:
  cada edición re-ejecuta la pipeline completa, así los derivados reaccionan
  igual que en Foundry.
- `packs.ts` expone `src/packs/_source/` como compendio en memoria
  (`import.meta.glob`), así el selector de compendio funciona con datos reales.
- `fixtures.ts` define los actores de muestra; lo que no se lista lo rellenan
  los defaults del schema.

`tests/sandbox-smoke.test.ts` protege el sandbox: si los modelos empiezan a
usar APIs de Foundry no shimeadas, ese test falla antes de que el sandbox se
rompa en el navegador.

## Límites conocidos

- Sin chrome de ventana ni estilos base de Foundry (el marco es una imitación).
- Los iconos `icons/...` los sirve Foundry; aquí se sustituyen por un
  placeholder.
- Diálogos nativos, chat real y drag & drop de documentos no existen; las
  tiradas y notificaciones salen como toasts.
- El estado vive en memoria: sobrevive al hot reload de componentes, pero no a
  recargar la página.
