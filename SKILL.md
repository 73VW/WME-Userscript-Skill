---
name: wme-userscripts
description: >-
  Use this skill when the user asks to create, maintain, audit, refactor, or
  debug a Waze Map Editor (WME) userscript with the WME SDK, including
  TypeScript setup, layer development (tile or feature), sidebar tabs,
  shortcuts, build/release workflow, or Tampermonkey distribution for
  waze.com/editor.
user-invocable: true
---

# WME Userscript Development

Build and maintain Waze Map Editor userscripts in TypeScript using the official WME SDK.

Official SDK docs: https://www.waze.com/editor/sdk/index.html

## Reference Contract

Use this file as workflow and decision guidance only. Technical details live in references:

- SDK APIs and event payloads: `references/wme-sdk-api.md`
- Project bootstrap and tooling: `references/project-setup.md`
- Build/release/distribution workflow: `references/build-and-release.md`
- Starter snippets: `examples/sdk-init.ts`, `examples/tile-layer.ts`, `examples/feature-layer.ts`, `examples/header-template.js`

## When To Read What

- User asks for SDK usage, events, map layers, or feature click handling:
  read `references/wme-sdk-api.md`
- User asks to bootstrap or configure a project:
  read `references/project-setup.md`
- User asks about versions, artifacts, updateURL/downloadURL, or publishing:
  read `references/build-and-release.md`

## Non-Negotiable Rules

- Use `wme-sdk-typings` and official SDK docs as the source of truth.
- Never invent API methods, event names, or payload fields.
- Never use deprecated pre-SDK globals (`W.*`, `Waze.*`).
- Use `unsafeWindow` for SDK access in userscripts (`SDK_INITIALIZED`, `getWmeSdk`).
- Always unregister event listeners using cleanup functions returned by `wmeSDK.Events.on()`.
- Wrap `localStorage` read/write in `try/catch`.

## Decision Tree

1. Layer request:
- Raster/tiles from XYZ or WMTS source -> use `Map.addTileLayer`.
- Clickable/interactable vector data -> use `Map.addLayer` + features + `trackLayerEvents`.

2. UI request:
- WME layers panel toggle -> use `LayerSwitcher` checkbox APIs.
- Script settings or controls panel -> use `Sidebar.registerScriptTab()`.
- Keyboard action -> use `Shortcuts.createShortcut()`.

3. Rendering request:
- Many dynamic records -> use batch add/remove (`addFeaturesToLayer`, `removeFeaturesFromLayer`) and delta updates.
- Refresh on map changes -> subscribe to `wme-map-move-end` and re-render.

## Agent-Neutral Workflow (Codex + Claude)

1. Understand scope:
- Confirm feature goal, data source, and expected behavior in WME.

2. Verify SDK surface:
- Check `wme-sdk-typings` and `references/wme-sdk-api.md` before coding.
- If API is missing/unclear, state the limitation explicitly.

3. Propose design:
- Choose tile vs feature layer.
- Define state model (toggle persistence, visible feature IDs).
- Define lifecycle (init, add/remove layer, event registration/cleanup).

4. Implement:
- Start from the closest example.
- Keep code simple and explicit (small modules, low abstraction).

5. Validate:
- Run `npm run build`.
- Run lint/tests when present (`npm run lint`, `npm test`).
- Manual smoke test in WME (load script, toggle layer, verify rendering/clicks).

6. Deliver:
- Summarize behavior changes.
- Include any required header metadata changes (`@grant`, `@connect`, URLs).
- Include quick verification steps for reviewers.

## Quality Gates

Before finalizing a change, verify:

- SDK correctness:
  - All WME API calls exist in typings/docs.
- Lifecycle safety:
  - Event cleanup is implemented and called.
- State safety:
  - `localStorage` access is guarded by `try/catch`.
- Compatibility:
  - No legacy WME globals.
- Build quality:
  - `build` passes; lint/tests pass when configured.
- Runtime quality:
  - WME smoke test passes (ready state, layer toggle, render/update, click handling).

## Troubleshooting (Quick)

- SDK not initialized:
  - Ensure `@grant unsafeWindow` is present and initialization waits for `SDK_INITIALIZED`.
- Checkbox toggles but no layer appears:
  - Verify layer name consistency across `LayerSwitcher` and `Map` calls.
- Feature click handler never fires:
  - Ensure `Events.trackLayerEvents({ layerName })` is called after `addLayer`.
- External API call fails:
  - Use `GM_xmlhttpRequest` and add matching `@connect` domains in the header.
