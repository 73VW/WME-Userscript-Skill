---
name: wme-userscripts
description: >-
  This skill should be used when the user asks to "create a WME userscript",
  "develop a Waze Map Editor script", "add a layer to WME", "use the WME SDK",
  "bootstrap a WME project", "build a Tampermonkey script for Waze",
  "work on a WME extension", "add a feature layer", "add a tile layer",
  "register a sidebar tab", "add a keyboard shortcut in WME",
  or mentions WME SDK, wme-sdk-typings, Waze Map Editor development,
  or Tampermonkey/Greasemonkey scripts targeting waze.com/editor.
user-invocable: true
---

# WME Userscript Development

Guide the development of Waze Map Editor (WME) userscripts in TypeScript. This covers the WME SDK API, project structure, build pipeline, architecture patterns, and coding conventions.

Official WME SDK documentation: https://www.waze.com/editor/sdk/index.html

## WME SDK Essentials

### Initialization

Every WME userscript follows this initialization pattern:

```typescript
import { WmeSDK } from "wme-sdk-typings";

unsafeWindow.SDK_INITIALIZED.then(initScript);

function initScript() {
  if (!unsafeWindow.getWmeSdk) {
    throw new Error("SDK not available");
  }
  const wmeSDK: WmeSDK = unsafeWindow.getWmeSdk({
    scriptId: "my-script-id",
    scriptName: "My Script Name",
  });
  // Script logic goes here
}
```

Use `unsafeWindow` (Tampermonkey grant) to access the SDK globals. The template project uses `window` directly but production scripts with `@grant unsafeWindow` must use `unsafeWindow`.

### Core APIs

| API namespace | Key methods | Purpose |
|---|---|---|
| `Map` | `addLayer`, `addTileLayer`, `removeLayer`, `setLayerZIndex`, `addFeatureToLayer`, `addFeaturesToLayer`, `removeFeatureFromLayer`, `removeFeaturesFromLayer`, `getZoomLevel`, `getMapCenter` | Layer and feature management |
| `Events` | `on`, `once`, `trackLayerEvents` | Event handling (returns cleanup function) |
| `Sidebar` | `registerScriptTab` | Tab UI (returns `{tabLabel, tabPane}`) |
| `LayerSwitcher` | `addLayerCheckbox`, `setLayerCheckboxChecked`, `isLayerCheckboxChecked` | Layer toggle checkboxes |
| `Settings` | `getLocale` | User locale (`{localeCode}`) |
| `Shortcuts` | `createShortcut` | Keyboard shortcuts |
| `State` | `isMapLoading` | Map loading state |

Key events: `wme-ready`, `wme-layer-checkbox-toggled`, `wme-map-move-end`, `wme-layer-feature-clicked`.

For detailed API reference with code examples, consult `references/wme-sdk-api.md`.

### SDK Rules

- Use `wme-sdk-typings` for all WME API interactions. Consult `node_modules/wme-sdk-typings/index.d.ts` and the official SDK docs before implementing features.
- Never guess or invent SDK APIs. If something is missing from typings or docs, flag it.
- Never use deprecated WME globals (pre-SDK `W.` object, `Waze.*`, etc.).
- Never use direct DOM hacks that bypass SDK events.
- Map z-index range: 2000-2065. Segments layer is at 2060, background at 2010.

## Architecture Patterns

### Layer Hierarchy

The proven pattern for layer-based scripts uses an abstract base class with two branches:

```
Layer (abstract)
├── TileLayer — raster tile layers (WMTS, XYZ)
└── FeatureLayer (abstract) — vector features with interaction
    └── ConcreteLayer — specific data source + rendering
```

`Layer` handles: checkbox registration via `LayerSwitcher`, toggle state persistence via `localStorage`, event cleanup arrays, `addToMap`/`removeFromMap` lifecycle.

`FeatureLayer` adds: `fetchData` (async generator), `shouldDrawRecord` (filtering), `mapRecordToFeature` (mapping), `featureClicked` (interaction), delta-based rendering (only add/remove changed features), automatic re-render on `wme-map-move-end`.

See `examples/tile-layer.ts` and `examples/feature-layer.ts` for working implementations.

### Event Cleanup

Always store cleanup functions returned by `wmeSDK.Events.on()` and call them on layer removal:

```typescript
protected eventCleanups: Array<() => void> = [];

unregisterEvents(): void {
  for (const cleanup of this.eventCleanups) {
    try { cleanup(); } catch { /* ignore */ }
  }
  this.eventCleanups = [];
}
```

### State Persistence

Use `localStorage` with a script-specific key to persist layer toggle states:

```typescript
const STORAGE_KEY = "my-script-layer-state";

function saveLayerState(layerName: string, checked: boolean): void {
  const states = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  states[layerName] = checked;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(states));
}
```

### Sidebar UI

Build sidebar content using HTML string templates, no framework needed. Register a tab, then set `innerHTML`:

```typescript
const { tabLabel, tabPane } = await wmeSDK.Sidebar.registerScriptTab();
tabLabel.innerText = "My Script";
tabPane.innerHTML = "<p>Content here</p>";
```

For structured UIs, use a class hierarchy (`SidebarSection`, `SidebarItem`, etc.) that composes `render()` methods returning HTML strings.

## Project Structure & Build

Minimal project structure:

```
my-wme-script/
├── main.user.ts          # Entry point
├── src/                   # Source modules
├── header.js              # Tampermonkey header
├── rollup.config.mjs      # Rollup bundler config
├── tsconfig.json           # TypeScript (strict, ES2021, ES6 modules)
├── package.json
└── releases/              # Built userscript output
```

Build pipeline: `main.user.ts` → Rollup (TypeScript + plugins) → `.out/main.user.js` → concatenate with `header.js` → `releases/`.

Output format: IIFE (Immediately Invoked Function Expression) — required for userscripts.

For detailed setup instructions, consult `references/project-setup.md`.
For build pipeline and release workflow, consult `references/build-and-release.md`.
For the Tampermonkey header template, see `examples/header-template.js`.

## Code Style

- Optimize for cognitive load: readable conditionals with intermediate variables, early returns over nested ifs.
- Comments explain "why", not "what".
- Prefer deep modules (simple interface, complex implementation) over shallow wrappers.
- Composition over inheritance; avoid excessive abstraction layers.
- Minimal TypeScript features — don't require expert-level language knowledge.
- A little duplication is better than unnecessary coupling.

## Localization (Optional)

For multi-language scripts, use i18next:

- Translation files: `locales/<lang>/common.json`
- Key separator: `.` — namespace separator: `:`
- Initialize with `i18next.init({ lng: "en", fallbackLng: "en", resources: { ... } })`
- Set language from WME: `i18next.changeLanguage(wmeSDK.Settings.getLocale().localeCode)`
- New strings must be added to all language files.
- Extract keys: `npm run makemessages` (uses i18next-parser).

## Quality & Release

- **Testing:** Vitest for unit tests. Place tests in `src/__tests__/`.
- **Linting:** ESLint + typescript-eslint. Formatting with Prettier.
- **Commits:** Conventional Commits format (`type(scope): subject`).
- **Pre-PR checklist:** `npm run lint` passes, `npm run build` succeeds, manual smoke test in WME (load script, toggle layers, verify rendering).
- **Release:** Bump version in `header.js`, run build, output `releases/release-<version>.user.js`.
- **Distribution:** Host on GitHub, use raw URLs for `@updateURL` and `@downloadURL`.
