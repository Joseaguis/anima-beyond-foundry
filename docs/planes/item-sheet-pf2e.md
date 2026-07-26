# Rediseño de las hojas de Item al patrón PF2e

**Estado:** `pendiente` · **Diseñado:** 2026-07-26 · **Referencia de apoyo:**
[referencia-pf2e-item-sheets.md](referencia-pf2e-item-sheets.md)

Antes de implementar, leer el plan entero. Las decisiones del apartado "Decisiones ya tomadas" están
cerradas con el usuario y no se vuelven a preguntar.

---

## Contexto

Las hojas de Item del sistema son hoy una única sheet React (`src/sheets/item/ItemSheet.ts`) con una barra
de pestañas plana cuya composición depende del tipo (`ITEM_TAB_CONFIG`). Funciona, pero se aparta de la
convención de PF2e —el sistema de FoundryVTT mejor construido y la referencia declarada del proyecto— en
cuatro puntos que el usuario quiere corregir:

1. **No hay estructura común.** Cada tipo define su lista de pestañas de cero; no existe el eje
   `Descripción / Detalles / Reglas` que comparte todo item, ni un punto de extensión limpio para
   pestañas que solo apliquen a unos pocos tipos.
2. **El "Resumen" es una pestaña**, cuando en PF2e es una **barra lateral persistente** (`{Tipo} Summary`)
   visible junto a todas las pestañas y oculta solo en Reglas.
3. **No hay editor enriquecido.** `description.value` es un `HTMLField` que se edita con un `<textarea>`
   plano donde hay que escribir HTML a mano, y que nunca pasa por `enrichHTML`: `@UUID[...]`, `[[/r 1d20]]`
   y los bloques secretos no funcionan. Tampoco existe la separación **descripción pública / notas de GM**.
4. **El motor de rule elements está oculto** tras una pestaña llamada "Modificadores", sin la cabecera
   técnica (UUID, slug, opciones de tirada) que en PF2e hace usable el sistema de reglas.

Resultado buscado: una ventana de Item con la anatomía de PF2e —cabecera editable, barra lateral de
resumen, pestañas `Descripción / Detalles / Reglas` (más las específicas de tipo), y ProseMirror en todos
los campos de texto largo—, reutilizando el motor de reglas y los componentes de UI que ya existen.

### Decisiones ya tomadas

- Barra lateral igual que PF2e (se rehace lo que haga falta), oculta en la pestaña Reglas.
- **Sin Mystification**: no se toca el schema por ella. Pero el registro de pestañas debe soportar
  pestañas **condicionales** (`condition?: (ctx) => boolean`) para que una regla especial que afecte a
  pocos tipos sea trivial de añadir después.
- "Modificadores" **se fusiona** en una única pestaña "Reglas".
- ProseMirror en items: descripción (pública + GM) **y** los campos de texto largo (`effect`,
  `grades.*.effect`). **No se tocan las hojas de actor.**

### Punto de partida (verificado)

- Una sola sheet para los 14 tipos: `src/sheets/item/ItemSheet.ts` → `ReactItemSheet` →
  `ReactApplicationMixin` sobre `ItemSheetV2`. **100 % React, cero Handlebars.**
- El mixin (`src/sheets/react/mixin.ts`) sustituye a `HandlebarsApplicationMixin`: mantiene un
  `<section class="react-mount">` persistente y llama `root.render(...)` en cada `_onRender`.
- Motor de rule elements **ya real** en `src/rules/` (`AnimaRuleElement`, `FlatModifier`, predicados,
  `TARGETS`, sintéticos, `RULE_ELEMENTS`), con roll options en `AnimaActor.getRollOptions()`.
- Estilos: un único `src/styles/main.css` (Tailwind 4), convención de clases con prefijo `a-`, variables
  CSS de tema en `:root`.
- Foundry v14 (`compatibility` 14/14/14), tipos `fvtt-types`.

---

## Fase 0 — Schema: `description.gm`, `slug` y `effect` como HTML

- [ ] `src/items/base/data.ts` — `descriptionSchema()` gana el campo de GM:

```ts
description: new SchemaField({
  value: new HTMLField({ required: true, initial: "" }),
  gm:    new HTMLField({ required: true, initial: "" }),   // ← nuevo
  chat:  new HTMLField({ required: true, initial: "" }),
}),
```

- [ ] `src/items/base/model.ts` — `baseItemSchema()` gana `slug`, que la pestaña Reglas edita y los
      predicados podrán usar como identificador estable:

```ts
slug: new StringField({ required: true, initial: "" }),
```

- [ ] ⚠️ **Colisión real a resolver antes de añadir `slug`**: `KiTechniqueModel` ya define `get slug()` en
      `src/domains/ki/ki-technique.ts:118`. Un `StringField` llamado `slug` hace que `TypeDataModel`
      intente asignar `this.slug`, lo que revienta sobre un getter sin setter. Renombrar el getter a
      `rollOptionSlug` y hacerlo caer en el campo cuando esté relleno:

```ts
get rollOptionSlug(): string {
  return this.slug || slugifyName(this.parent?.name ?? "");
}
```

  Actualizar los dos usos: `src/domains/ki/ki-technique.ts:182` y
  `src/domains/ki/technique-profile.ts:160`. `tests/ki-technique.test.ts` y
  `tests/ki-technique-compendium.test.ts` cubren esta ruta: deben seguir en verde.

- [ ] Los campos de texto largo que van a recibir ProseMirror pasan de `StringField` a `HTMLField` (mismo
      almacenamiento, pero es lo semánticamente correcto y evita que el HTML se escape al mostrarlo):
      `effect` en `src/domains/magic/spell.ts`, `src/items/trait/model.ts`,
      `src/domains/magic/magic-path.ts`, `src/items/monster-ability/model.ts`,
      `src/domains/magic/mental-pattern.ts`, `src/domains/psychic/psychic-power.ts`,
      `src/domains/psychic/psychic-discipline.ts`; más `spell.grades.*.effect` y
      `psychicPower.grades[].effect`.

**Sin migración de datos**: los tres cambios son aditivos o de tipo compatible, y Foundry rellena los
campos nuevos con su `initial`. No hace falta regenerar `src/packs/_source/` (los 721 items con descripción
siguen siendo válidos); `npm run build:packs` se ejecuta igual al construir.

`description.chat` se queda como está: hoy es un campo muerto (ni se edita ni se lee) y sacarlo del schema
no aporta nada a este rediseño. Queda anotado como candidato a la futura tarjeta de chat.

---

## Fase 1 — `<RichTextEditor>`: ProseMirror dentro de React

- [ ] Nuevo `src/components/ui/RichTextEditor.tsx` (carpeta nueva para UI compartida entre item y actor;
      los componentes de `src/components/character/ui/` se siguen reutilizando tal cual).

```tsx
interface RichTextEditorProps {
  /** Path relativo a system, p.ej. "description.value" */
  path: string;
  value: string;
  isEditable: boolean;
  onUpdate: (path: string, value: unknown) => Promise<void>;
  /** Clave estable para no recrear el editor entre items: normalmente el id del item */
  ownerKey: string;
  /** Vista enriquecida hasta pulsar el botón de editar (por defecto true) */
  toggled?: boolean;
  height?: number;
}
```

El componente envuelve el custom element de Foundry v14
`foundry.applications.elements.HTMLProseMirrorElement.create({ name, value, enriched, toggled, height, disabled })`
(firma verificada en
`node_modules/fvtt-types/src/foundry/client/applications/elements/prosemirror-editor.d.mts`).

Cuatro problemas que el diseño tiene que resolver explícitamente:

**a) El mixin re-renderiza React en cada render de Foundry.**
`src/sheets/react/mixin.ts:55-60` llama `root.render(...)` con props nuevas cada vez que el documento
cambia. El editor **no puede** recrearse ni perder lo que se está escribiendo. Patrón:

- Crear el elemento en un `useEffect` con deps `[ownerKey, path]` únicamente — nunca `[value]`.
- Guardar `onUpdate` en un `useRef` y leerlo desde el listener, para que el `change` no haya que
  reenganchar cuando cambia la closure de props.
- Envolver en `React.memo` con comparador que ignore `onUpdate`.

**b) Cambios de valor venidos de fuera** (otro usuario, una macro, un undo). Sincronizar solo cuando el
editor está cerrado y limpio, jamás pisando una edición en curso:

```tsx
useEffect(() => {
  const el = elRef.current;
  if (!el || el.open || el.isDirty()) return;   // edición en curso: no tocar
  if (el.value !== value) recreate();           // cerrado ⇒ recrear es seguro
}, [value]);
```

Recrear (en vez de asignar `el.value`) es la vía robusta: el `_refresh()` de `HTMLProseMirrorElement` no
está documentado como refrescador de la vista `enriched`, y con el editor cerrado no hay estado que perder.
Durante la implementación, comprobar el `_refresh` real en el cliente de Foundry; si sí refresca, sustituir
por la asignación directa, que es más barata.

**c) `enrichHTML` es asíncrono.** `foundry.applications.ux.TextEditor.implementation.enrichHTML(value)`
devuelve `Promise<string>`. El elemento recibe `enriched` en el momento de la creación, así que el orden es:
enriquecer primero, crear después.

```tsx
const [enriched, setEnriched] = useState<string | null>(null);
useEffect(() => {
  let cancelled = false;
  void TextEditor.enrichHTML(value).then((html) => { if (!cancelled) setEnriched(html); });
  return () => { cancelled = true; };
}, [value]);
if (enriched === null) return <div className="a-editor-loading" ref={hostRef} />;
```

**d) Fallback obligatorio para sandbox y tests.** `sandbox/foundry-shim.ts` no shimea `foundry.applications`
ni `TextEditor`, y `tests/sandbox-smoke.test.ts:94` renderiza `ItemSheetApp` con `renderToString` (SSR: los
`useEffect` no corren). La detección de soporte se hace **en el cuerpo del render**, no en un efecto:

```tsx
const supported = !!(globalThis as any).foundry?.applications?.elements?.HTMLProseMirrorElement;
if (!supported) return <TextArea system={{ [path]: value }} path={path} ... />;  // fields.tsx
```

Así el sandbox y el smoke test siguen funcionando sin ampliar el shim, y en Foundry real se obtiene
ProseMirror. Reutiliza el `TextArea` existente de `src/components/character/ui/fields.tsx:108` (commit en
`blur`).

---

## Fase 2 — Props de la sheet: nombre e imagen editables, `isGM`, `uuid`

- [ ] `src/sheets/ReactItemSheet.ts`:

```ts
export interface ReactItemSheetProps {
  item: { id: string; uuid: string; name: string; img: string; type: string };
  system: Record<string, any>;
  isEditable: boolean;
  isGM: boolean;                        // ← notas de GM y pestañas condicionales
  onUpdate: (path: string, value: unknown) => Promise<void>;
  onEditImage: () => Promise<void>;     // ← FilePicker
}
```

- `onUpdate` ya sirve para `name` sin cambios: hace `item.update({ [path]: value })`, así que
  `onUpdate("name", v)` y `onUpdate("img", v)` funcionan (los helpers de `fields.tsx` prefijan `system.`;
  la cabecera llama a `onUpdate` directamente).
- `onEditImage` abre `foundry.applications.apps.FilePicker.implementation` con
  `{ current: item.img, type: "image", callback: (p) => item.update({ img: p }) }`, siguiendo el patrón con
  el que `src/sheets/ReactSheet.ts:61` construye `ItemOps`.
- `DEFAULT_OPTIONS.position` pasa de `520x480` a **`700x500`** (PF2e usa 700x460) para que quepa la barra
  lateral.

---

## Fase 3 — Nuevo registro: `ITEM_SHEET_CONFIG`

- [ ] `src/components/item/types.ts` — el contrato de pestaña deja de pasar el tipo escondido dentro de
      `system` (hack `_itemType` en `src/components/item/ItemSheetApp.tsx:31`):

```ts
export interface ItemTabProps {
  itemType: string;
  itemUuid: string;
  itemName: string;
  system: Record<string, any>;
  isEditable: boolean;
  isGM: boolean;
  onUpdate: (path: string, value: unknown) => Promise<void>;
}

export interface ItemTabDef {
  id: string;
  labelKey: string;
  component: React.FC<ItemTabProps>;
  /** Pestaña opcional: si devuelve false no se renderiza (p.ej. solo GM, solo un subtipo). */
  condition?: (props: ItemTabProps) => boolean;
}

export interface ItemSheetConfig {
  /** Columna izquierda persistente, oculta en Reglas. */
  sidebar?: React.FC<ItemTabProps>;
  /** Panel de la pestaña Detalles, propio del tipo. */
  details?: React.FC<ItemTabProps>;
  /** Pestañas adicionales, insertadas entre Detalles y Reglas. */
  extra?: ItemTabDef[];
}
```

- [ ] `src/components/item/itemTabs.ts` se reescribe: en vez de listar las pestañas de cada tipo a mano,
      declara solo lo específico y `buildTabs()` compone el eje común.

```ts
export const ITEM_SHEET_CONFIG: Record<string, ItemSheetConfig> = {
  weapon: { sidebar: PhysicalSidebar, details: WeaponCombatTab },
  armor:  { sidebar: PhysicalSidebar, details: ArmorProtectionTab },
  spell:  { sidebar: SummarySidebar,  details: SpellTab },
  // …un renglón por tipo
};

/** [Descripción, Detalles?, ...extra, Reglas] filtrado por `condition`. */
export function buildTabs(type: string, props: ItemTabProps): ItemTabDef[];
```

Ids en inglés (`description` / `details` / `rules` / y el id de cada extra), etiquetas en español desde
`ANIMA.ItemTabs.*` como ahora. El renombrado es barato: los ids solo se usan en `itemTabs.ts` y
`ItemSheetApp.tsx` (`sandbox/App.tsx` y el smoke test no los mencionan).

- [ ] **Los actuales `SummaryTab` y `PhysicalTab` se convierten en barras laterales**, replicando el
      desdoble de PF2e entre `physical-sidebar.hbs` y el sidebar genérico:
  - `SummarySidebar` ← `SummaryTab`, con el `SUMMARY_CONFIG` que ya tiene, leyendo el tipo desde
    `props.itemType` en lugar de `system._itemType`. Completar el mapa para los tipos que hoy no tienen
    entrada (`kiTechnique`, `psychicPower`, `psychicDiscipline`, `mentalPattern`).
  - `PhysicalSidebar` ← `PhysicalTab` + los stats de resumen del arma/armadura (calidad, presencia,
    fortaleza, rotura, peso, precio, equipado). Así weapon/armor pierden la pestaña "Físico" y ganan la
    columna, como en PF2e.

"Modificadores" desaparece del registro (Fase 5).

---

## Fase 4 — `ItemSheetApp.tsx`: la anatomía PF2e

- [ ] Reescribir el shell:

```tsx
<div className="a-item-sheet" data-active-tab={activeTabId}>
  <header className="a-item-header">
    <img className="a-item-img" src={item.img} onClick={onEditImage} role="button" />
    <div className="a-item-header-details">
      <ItemNameInput name={item.name} isEditable onCommit={(v) => onUpdate("name", v)} />
      <span className="a-item-type">{typeLabel}</span>
      <div className="a-item-header-tags">{/* subtipo, equipado, … */}</div>
    </div>
  </header>

  <nav className="a-item-nav">
    {Sidebar && <div className="a-sidebar-title">{sidebarTitle}</div>}
    <div className="a-item-tabbar">{/* botones */}</div>
  </nav>

  <div className="a-item-content">
    {Sidebar && <section className="a-item-sidebar"><Sidebar {...tabProps} /></section>}
    <div className="a-item-body"><ActiveComponent {...tabProps} /></div>
  </div>
</div>
```

- `sidebarTitle` = `game.i18n.format("ANIMA.ItemSidebarSummary", { type: typeLabel })` → "Resumen de Arma",
  equivalente a `PF2E.Item.SidebarSummary`.
- **Ocultar la barra lateral en Reglas** vía el atributo `data-active-tab` que React ya controla, en lugar
  del `form:has(.tab.active.rules)` de PF2e — más robusto y verificable desde el smoke test:

```css
.a-item-sheet[data-active-tab="rules"] .a-item-sidebar { display: none; }
.a-item-sheet[data-active-tab="rules"] .a-sidebar-title { visibility: hidden; }
```

- `ItemNameInput`: input con estado local y commit en `blur`, mismo patrón que `TextField` de
  `src/components/character/ui/fields.tsx` pero escribiendo en `name` (sin prefijo `system.`).
- [ ] Arreglar `ITEM_TYPE_LABELS` (`src/components/item/ItemSheetApp.tsx:6-17`): le faltan `kiTechnique`,
      `psychicPower`, `psychicDiscipline` y `mentalPattern`, cuyas claves i18n **sí** existen en
      `src/lang/es.json`, de modo que hoy el pill muestra la clave cruda.

---

## Fase 5 — Pestaña Reglas (fusión de Modificadores)

- [ ] Nuevo `src/components/item/tabs/RulesTab.tsx`, calcado de
      `../pf2e/static/templates/items/rules-panel.hbs`:

1. **Cabecera técnica** (`.a-rules-nerd`):
   - `UUID` — input readonly con `item.uuid` + botón de copiar (`game.clipboard.copyPlainText(uuid)`,
     verificado en `fvtt-types/.../helpers/interaction/clipboard-helper.d.mts:17`) e icono de ayuda.
   - `Slug` — `TextField path="slug"` + botón regenerar → `itemName.slugify({ strict: true })` (Foundry
     extiende `String.prototype`; verificado en `fvtt-types/src/foundry/common/primitives/string.d.mts:35`.
     **No existe `foundry.utils.slugify`**). En sandbox/tests hay que shimear ese método o encapsularlo en
     un helper propio — el normalizador manual que hoy vive en el getter de `KiTechniqueModel` sirve como
     implementación de referencia.
   - `Ver opciones de tirada` — muestra las opciones que este item vería: `AnimaActor.getRollOptions()`
     (`src/documents/actor.ts:47`) cuando el item está en un actor, más las que genera el propio item (las
     técnicas de ki emiten `technique:<slug>:active`, `src/domains/ki/technique-profile.ts:162`). Sin
     actor, listar solo las del item. Render en un `CalcTooltip` (ya existe) o un `<details>` desplegable.
2. **Lista de rule elements**: el `ModifiersEditor` actual (`src/components/item/ModifiersEditor.tsx`) sin
   cambios funcionales, movido dentro de la pestaña; las filas no-`FlatModifier` siguen mostrándose como
   resumen read-only.
3. **Creador**: `<select>` con las claves de `RULE_ELEMENTS` (`src/rules/index.ts`) — hoy solo
   `FlatModifier`, pero se lee del registro para que añadir un tipo nuevo no toque la UI — y botón
   "Nueva regla" que hace push del `{ key }` elegido.

- [ ] `ModifiersTab.tsx` se elimina; la clave i18n `ANIMA.ItemTabs.Modificadores` se sustituye por
      `ANIMA.ItemTabs.Reglas`.

---

## Fase 6 — ProseMirror en los paneles de Detalles

- [ ] `DescriptionTab.tsx` queda:

```tsx
{isGM && (
  <SectionCard title={loc("ANIMA.ItemGmNotes")} light>
    <RichTextEditor path="description.gm" value={system.description?.gm ?? ""} ... />
  </SectionCard>
)}
<SectionCard title={loc("ANIMA.ItemDescription")}>
  <RichTextEditor path="description.value" value={system.description?.value ?? ""} ... />
</SectionCard>
{"source" in system && (
  <SectionCard title={loc("ANIMA.Source")} light>
    <TextField system={system} path="source" ... />
  </SectionCard>
)}
```

Esto arregla un bug: hoy `src/components/item/tabs/DescriptionTab.tsx:19-24` comprueba
`"source" in (system.description ?? {})` (siempre falso, `source` vive en la raíz de `system`) y escribiría
a `description.source`, que no existe en el schema. Consecuencia actual: el campo `source`, que está
poblado en 721 items de compendio, **no se ve ni se edita en ninguna hoja**.

- [ ] Sustituir además `TextField`/`TextArea` por `RichTextEditor` en los campos de texto largo de:
      `SpellTab` (`effect` + `grades.{base,intermediate,advanced,arcane}.effect`), `PsychicPowerTab`
      (`effect` + `grades[].effect`), `TraitTab`, `MagicPathTab`, `MonsterAbilityTab`, `MentalPatternTab`,
      `PsychicDisciplineTab`. Los `grades.*.effect` son textos cortos ("Daño 100.") → usarlos con
      `toggled height={90}` para que no dominen el panel.

---

## Fase 7 — CSS e i18n

- [ ] `src/styles/main.css`, bloque de item (líneas 292-476): reescribir para el layout `sidebar + body` y,
      de paso, **cambiar los colores hardcodeados (`#e0732a`, `#1c2128`, `#737a85`, `#d9dde2`) por las
      variables `--acc` / `--ink` / `--mut` / `--bd`** que ya usa el bloque de actor. Clases nuevas:

`.a-item-nav` · `.a-sidebar-title` · `.a-item-content` (flex row) · `.a-item-sidebar` (ancho fijo ~180px,
`overflow-y:auto`) · `.a-item-body` (flex 1, `overflow-y:auto`) · `.a-item-header-details` ·
`.a-item-type` · `.a-rules-nerd` + `.a-rules-row` · `.a-editor-container` / `.a-editor-container--gm`
(la variante GM con fondo tenue, como el `.gm-notes` de PF2e) · `.a-editor-loading`.

Los `prose-mirror` insertados traen su propio CSS de Foundry; solo hay que fijarles altura y borde dentro
de `.a-editor-container`, y comprobar que el `.react-mount { overflow-y: auto }` de
`.animabfv2.sheet.actor` no necesita equivalente para item (el scroll pasa a `.a-item-body`).

- [ ] `src/lang/es.json`: añadir `ANIMA.ItemTabs.Detalles`, `ANIMA.ItemTabs.Reglas`,
      `ANIMA.ItemSidebarSummary` ("Resumen de {type}"), `ANIMA.ItemGmNotes`, `ANIMA.RulesUuid`,
      `ANIMA.RulesSlug`, `ANIMA.RulesRegenerateSlug`, `ANIMA.RulesCopyUuid`,
      `ANIMA.RulesViewRollOptions`, `ANIMA.RulesNew`; retirar `ANIMA.ItemTabs.Modificadores` y
      `ANIMA.ItemTabs.Fisico`/`Resumen` si dejan de usarse.

---

## Verificación

1. `npm run typecheck` y `npm test` en verde. `tests/sandbox-smoke.test.ts:94` **necesita actualización**:
   las props de `ItemSheetApp` cambian (`uuid`, `isGM`, `onEditImage`). Aprovechar para ampliarlo: en vez
   de renderizar solo un arma, iterar los 14 tipos con un item mock de cada uno y afirmar que ninguno
   lanza y que todos contienen la pestaña Reglas — así el registro nuevo queda cubierto.
2. `npm run sandbox` → recorrer los tipos en la galería. Verificar que el editor cae al `<textarea>` de
   fallback (sin `foundry.applications`) sin romper nada, que la barra lateral se ve y que desaparece al
   entrar en Reglas.
3. `npm run build` y probar en **Foundry v14 real** (es donde ProseMirror existe de verdad):
   - Abrir un arma de compendio: cabecera con nombre editable e imagen que abre el FilePicker.
   - Descripción: escribir con ProseMirror, insertar un `@UUID[...]` arrastrando otro item y comprobar que
     el enlace se enriquece al cerrar el editor. Como GM, ver el editor de notas de GM; como jugador con
     permiso de propietario, no verlo.
   - **Prueba clave del riesgo (a)**: con el editor abierto y texto a medio escribir, modificar el item
     desde otro sitio (una macro `item.update({...})`) y comprobar que **no se pierde lo escrito**.
   - Reglas: copiar el UUID, regenerar el slug, añadir un `FlatModifier` a `Ataque` y comprobar en la ficha
     del actor que el ataque sube; ver que la barra lateral está oculta en esta pestaña.
4. `graphify update .` al terminar, para mantener el grafo al día.

---

## Riesgos

| Riesgo | Mitigación |
|---|---|
| El `root.render()` del mixin en cada cambio del documento destruye el editor a medio escribir. | Fase 1(a)+(b): creación con deps estables, `onUpdate` en `useRef`, sincronización externa solo con el editor cerrado y limpio. Es el punto que hay que probar a mano en Foundry. |
| `slug` como campo del schema colisiona con `get slug()` de `KiTechniqueModel`. | Fase 0: renombrar el getter a `rollOptionSlug` **antes** de añadir el campo. |
| El sandbox y el smoke test no tienen `foundry.applications` → romper el render. | Fase 1(d): fallback a `<textarea>` decidido en el cuerpo del render, no en un efecto (SSR-safe). |
| `String.prototype.slugify` no existe fuera de Foundry. | Encapsular en un helper propio del sistema en vez de llamar al prototipo directamente. |
| Los `effect` de los packs son texto plano sin HTML y duplican `description.value`. | El cambio a `HTMLField` es compatible (el texto plano sigue siendo HTML válido). La deduplicación `effect` ⇄ `description` queda **fuera de alcance** de este plan. |
