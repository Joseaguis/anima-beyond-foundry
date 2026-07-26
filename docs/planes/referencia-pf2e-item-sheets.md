# Referencia: anatomía de las item sheets de PF2e + APIs de Foundry v14

Notas de investigación verificadas leyendo `../pf2e` y `node_modules/fvtt-types`. Existen para que una
sesión futura no repita la exploración. Apoyo de [item-sheet-pf2e.md](item-sheet-pf2e.md).

Todas las rutas de PF2e son relativas a `../pf2e/` (repo de solo lectura, **nunca modificar**).

---

## 1. Clase base y opciones

`src/module/item/base/sheet/sheet.ts` (~769 líneas) — `ItemSheetPF2e`.

- **Sigue en ApplicationV1**: `extends fav1.sheets.ItemSheet`, con
  `protected static override _warnedAppV1 = true` para silenciar el aviso de deprecación. Nuestro sistema ya
  está en `ItemSheetV2` + React, así que **no copiamos la clase, solo la estructura de datos y el layout.**
- `defaultOptions`: `width: 700`, `height: 460`,
  `scrollY: [".tab.active", ".inventory-details", "div[data-rule-tab]"]`, y dos grupos de tabs
  (`.tabs` → `.sheet-body`, inicial `description`; `.mystify-nav` → `.mystify-sheet`).
- El constructor hace `this.options.classes.push(this.item.type)` → clase CSS por tipo
  (`.pf2e.item.sheet.feat`).
- Datos que `getData()` expone y que nos interesan:
  - `enrichedContent.description` / `enrichedContent.gmNotes` — HTML ya pasado por `enrichHTML`.
  - `sidebarTitle` = `PF2E.Item.SidebarSummary` formateado con el tipo → **es el "{Tipo} Summary"**.
  - `sidebarTemplate` — solo si `options.hasSidebar`; si no, no hay columna.
  - `detailsTemplate` = `templates/items/${sluggify(item.type)}-details.hbs`.
  - `enabledRulesUI` = `game.user.hasRole(setting("minimumRulesUI"))` → la pestaña Reglas está detrás de un
    ajuste de rol.

## 2. Plantilla raíz

`static/templates/items/sheet.hbs` — la estructura completa:

```
<form>
  <header class="sheet-header">
    <img data-edit="img">                       ← imagen del _source, no la derivada
    <div class="details">
      <input name="name" value={{item._source.name}}>
      {{actionGlyph}} / <span class="action-glyph">
      <span class="level">{{itemType}} <input system.level.value></span>
      <tagify-tags class="paizo-style tags" name="system.traits.value">
    </div>
  </header>

  <nav class="sheet-tabs">
    {{#if sidebarTemplate}}<div class="sidebar-summary">{{sidebarTitle}}</div>{{/if}}
    <div class="tabs" data-tab-container="primary">
      <a data-tab="description">   Description
      <a data-tab="details">       Details
      <a data-tab="mystification"> ← solo si (isPhysical && user.isGM && !item.parentItem)
      <a data-tab="rules">         ← solo si (enabledRulesUI && !isVariant)
    </div>
  </nav>

  <div class="sheet-content">
    <section class="sidebar">{{> sidebarTemplate}}</section>   ← columna izquierda
    <div class="sheet-body">
      <section class="tab description">   dos {{editor}}: gm-notes (solo GM) + main
      <section class="tab details">       {{> detailsTemplate}} + fieldset.publication
      {{> mystify-panel.hbs}}
      <section class="tab rules">         {{> rules-panel.hbs}}
    </div>
  </div>
</form>
```

Puntos clave que replicamos:

- El **orden de la nav** es Description → Details → [Mystification] → Rules, y el título del sidebar vive
  **dentro de la nav**, alineado sobre la columna.
- El sidebar es hermano de `.sheet-body`, no una pestaña.
- Usa `item._source.name` / `item._source.img` para editar el valor persistido, no el derivado (relevante
  si algún día un modelo deriva el nombre; hoy en nuestro sistema no ocurre).

## 3. El truco del sidebar oculto en Reglas

`src/styles/item/_index.scss:44-52`:

```scss
&:has(.tab.active.rules) {
    .sidebar-summary { visibility: hidden; }   // hueco reservado, sin texto
    section.sidebar  { display: none; }
}
```

Es decir: el título se hace invisible (no `display:none`, para que la nav no salte) y la columna se
elimina. Nuestro plan usa `data-active-tab="rules"` en el contenedor raíz en lugar de `:has()`, porque React
ya conoce la pestaña activa y así es verificable desde el test de render.

Organización del CSS de PF2e por si hace falta más detalle: `src/styles/item/_index.scss` (raíz),
`_header.scss`, `_nav.scss`, `_sidebar.scss`, `_physical-sidebar.scss`, `_rules.scss`,
`_mystification.scss`, más un `_<tipo>-sheet.scss` por tipo.

## 4. Pestaña Description: dos editores

`sheet.hbs:83-98`:

```hbs
{{#if user.isGM}}
  <section class="editor-container gm-notes{{#if enrichedContent.gmNotes}} has-content{{/if}}">
    {{editor enrichedContent.gmNotes target="system.description.gm"
             button=true owner=owner editable=editable engine="prosemirror"}}
  </section>
{{/if}}
<section class="main editor-container">
  {{editor enrichedContent.description target="system.description.value"
           button=true owner=owner editable=editable engine="prosemirror"}}
</section>
```

- Las notas de GM van **arriba**, solo para `user.isGM`, con la clase `has-content` cuando hay texto (para
  poder destacarlas visualmente).
- `button=true` = editor "toggled": se ve el HTML enriquecido y un botón de lápiz abre ProseMirror.
- En nuestro sistema no hay helper `{{editor}}`; el equivalente es el custom element `<prose-mirror>`
  (ver §7).

## 5. Pestaña Rules

`static/templates/items/rules-panel.hbs`. Dos modos: si `ruleEditing` está activo muestra un editor a
pantalla completa con botones Close/Apply; si no, el panel normal:

- `.nerd-details` con tres `.form-group`:
  1. **UUID** — `<input readonly value={{item.uuid}}>` + botón
     `data-action="copy-to-clipboard" data-clipboard="{{item.uuid}}"` (icono portapapeles) + icono de ayuda
     con tooltip `PF2E.Item.Rules.Hint.UUID`.
  2. **Source ID** — igual, solo si `item.sourceId` (compendio de origen). Opcional para nosotros.
  3. **Slug** — `<input name="system.slug">` + botón `data-action="regenerate-slug"` (icono sync).
  4. Botón **View Roll Options** (`data-action="view-roll-options"`) con tooltip de clase
     `pf2e roll-options`, dirección RIGHT.
- `.rule-element-forms` — un formulario por rule element, renderizado por clases
  `RuleElementForm` (`src/module/item/base/sheet/rule-element-form/`). Nuestro equivalente actual es
  `ModifiersEditor.tsx`, que ya cubre `FlatModifier`.
- `.create-rule-element` — `<select data-action="select-rule-element">` con los tipos disponibles + botón
  `data-action="add-rule-element"` ("New Rule Element").

## 6. Mystification (descartada, documentada por si se retoma)

`static/templates/items/mystify-panel.hbs`. Campos: `system.identification.status` (select) y
`system.identification.unidentified.{img, name, data.description.value}` con su propio `{{editor}}` y un
`<p class="hint">`. Solo se muestra para `isPhysical && user.isGM`.

**Decisión tomada: no se implementa.** Lo que sí se toma de aquí es la lección de diseño: el registro de
pestañas debe admitir pestañas condicionales por tipo *y* por permiso, para que añadir algo así después no
requiera tocar el shell.

## 7. APIs de Foundry v14 verificadas contra `fvtt-types`

El proyecto usa `fvtt-types` (rama `main` de League-of-Foundry-Developers). Firmas comprobadas:

| API | Ruta en `node_modules/fvtt-types/src/` | Nota |
|---|---|---|
| `HTMLProseMirrorElement.create(config)` | `foundry/client/applications/elements/prosemirror-editor.d.mts:63` | `config`: `{ name, value, enriched, toggled, collaborate, compact, documentUUID, height }` + `FormInputConfig`. Tag `"prose-mirror"`. Tiene `get open()`, `isDirty()`, `_refresh()`. El constructor es `protected`: **hay que usar `create()`**. |
| `TextEditor.enrichHTML(content, options?)` | `foundry/client/applications/ux/text-editor.d.mts:43` | `static`, devuelve `Promise<string>`. Se accede por `foundry.applications.ux.TextEditor.implementation`. |
| `ClipboardHelper.copyPlainText(text)` | `foundry/client/helpers/interaction/clipboard-helper.d.mts:17` | `Promise<void>`. Instancia en `game.clipboard`. |
| `String.prototype.slugify(options?)` | `foundry/common/primitives/string.d.mts:35` | **Extensión del prototipo, no `foundry.utils.slugify`** (esa no existe). Fuera de Foundry (sandbox, vitest) no está disponible → encapsular en un helper propio. |
| `FilePicker` | `foundry/client/applications/apps/file-picker.d.mts` | Acceso por `foundry.applications.apps.FilePicker.implementation`. |

## 8. Estado del proyecto propio en el momento de diseñar (2026-07-26)

Para detectar deriva si pasa tiempo antes de implementar:

- 14 tipos de Item, todos con `description.{value,chat}` + `source` + `rules` heredados de
  `baseItemSchema()`; **sin** `description.gm` ni `slug`.
- Una sola item sheet (`ItemSheet`), registrada en `src/main.ts` con
  `DocumentSheetConfig.registerSheet(Item, "animabfv2", ItemSheet, { makeDefault: true })` **sin `types`**,
  por lo que aplica a los 14.
- 17 componentes de pestaña en `src/components/item/tabs/`, el mayor `KiTechniqueTab.tsx` (~580 líneas).
- Cero Handlebars en `src/`; los `dist/templates/*.hbs` son residuos de un build antiguo que
  `emptyOutDir: false` no borra y a los que nadie hace referencia.
- Motor de reglas propio en `src/rules/` con un único rule element (`FlatModifier`) en `RULE_ELEMENTS`.
- `src/components/character/ui/fields.tsx` es la biblioteca de inputs compartida (commit en `blur`, soporta
  mini-expresiones aritméticas vía `SAFE_MATH` + `evalMath`).
- Campos del schema **sin UI** hoy (candidatos para los paneles de Detalles, fuera del alcance de este
  plan): `weapon.{hands,reach,proportions,ammoId}`, `armor.perceptionPenalty`, casi todo
  `category.{combatCosts,combatBonusPerLevel,secondaryCosts,secondaryBonusPerLevel,secondaryCostOverrides}`,
  `combatStyle.bonuses`, `spell.hostPathId`, `magicPath.{pathType,parentPathId}`, `description.chat`.
