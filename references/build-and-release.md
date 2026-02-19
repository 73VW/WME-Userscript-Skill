# Build Pipeline & Release Workflow

## Build Pipeline

```text
main.user.ts + src/*.ts
  │
  ▼  Rollup (TypeScript -> IIFE bundle)
.out/main.user.js
  │
  ▼  Concatenation (header.js + compiled output)
releases/main.user.js
```

The userscript header must remain at the top of the final file, before compiled code.

## npm Scripts

| Script | Command | Purpose |
|---|---|---|
| `compile` | `rollup -c` | TypeScript -> `.out/main.user.js` |
| `watch` | `rollup -c --watch` | Rebuild on file changes |
| `concat` | `concat -o releases/main.user.js header.js .out/main.user.js` | Prepend header to compiled output |
| `build` | `compile` + `concat` | Full build |
| `release` | Sync `@version` in `header.js` with package version + build | Release build |

## Header Template (Distribution Strategy)

Use a stable URL strategy pointing to `releases/main.user.js`:

```javascript
// ==UserScript==
// @name        My WME Script
// @namespace   wme-sdk-scripts
// @version     1.0.0
// @description Brief description of the script.
// @updateURL   https://raw.githubusercontent.com/<user>/<repo>/<branch>/releases/main.user.js
// @downloadURL https://raw.githubusercontent.com/<user>/<repo>/<branch>/releases/main.user.js
// @author      Author Name
// @match       https://www.waze.com/editor*
// @match       https://beta.waze.com/editor*
// @match       https://www.waze.com/*/editor*
// @match       https://beta.waze.com/*/editor*
// @exclude     https://www.waze.com/user/editor*
// @exclude     https://beta.waze.com/user/editor*
// @grant       unsafeWindow
// @grant       GM_xmlhttpRequest
// @connect     api.example.com
// ==/UserScript==
```

## Required `@match` / `@exclude`

`@match`:

```text
https://www.waze.com/editor*
https://beta.waze.com/editor*
https://www.waze.com/*/editor*
https://beta.waze.com/*/editor*
```

`@exclude`:

```text
https://www.waze.com/user/editor*
https://beta.waze.com/user/editor*
```

## Grants and External APIs

- `unsafeWindow`: required for SDK access (`SDK_INITIALIZED`, `getWmeSdk`).
- `GM_xmlhttpRequest`: needed only for external HTTP requests.
- `@connect`: list every remote domain used by `GM_xmlhttpRequest`.

## Release Workflow

1. Bump package version:

```bash
npm version patch  # or minor / major
```

2. Run release build:

```bash
npm run release
```

3. Output artifact:

```text
releases/main.user.js
```

4. Commit and push updated files (including `header.js` version update and built artifact).

## Development Workflow

1. Run `npm run watch` for continuous compilation.
2. Reload WME after rebuilds.
3. If needed, use a dev-only header with `@require file:///.../.out/main.user.js`.
