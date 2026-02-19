# Build Pipeline & Release Workflow

## Build Pipeline

```
main.user.ts + src/*.ts
  │
  ▼  Rollup (TypeScript → IIFE bundle)
.out/main.user.js
  │
  ▼  Concatenation (header.js + compiled output)
releases/release-<version>.user.js
```

The two-step process keeps the Tampermonkey header separate from the TypeScript source. The header is plain JavaScript with metadata comments that Tampermonkey parses — it must appear at the very top of the final file, before any compiled code.

### npm Scripts

| Script | Command | Purpose |
|---|---|---|
| `compile` | `rollup -c` | TypeScript → `.out/main.user.js` |
| `watch` | `rollup -c --watch` | Rebuild on file changes |
| `concat` | `concat -o releases/... header.js .out/main.user.js` | Prepend header to compiled output |
| `build` | `compile` + `concat` | Full build |
| `release` | Version bump in header + `build` | Tagged release build |

## Tampermonkey Header Format

```javascript
// ==UserScript==
// @name        My WME Script
// @namespace   wme-sdk-scripts
// @version     1.0.0
// @description Brief description of the script.
// @updateURL   https://raw.githubusercontent.com/<user>/<repo>/releases/releases/main.user.js
// @downloadURL https://raw.githubusercontent.com/<user>/<repo>/releases/releases/main.user.js
// @author      Author Name
// @match       https://www.waze.com/editor*
// @match       https://beta.waze.com/editor*
// @match       https://www.waze.com/*/editor*
// @match       https://beta.waze.com/*/editor*
// @exclude     https://www.waze.com/user/editor*
// @exclude     https://beta.waze.com/user/editor*
// @grant       GM_xmlhttpRequest
// @grant       unsafeWindow
// @connect     api.example.com
// ==/UserScript==
```

### Required @match Patterns

These four patterns cover all WME editor URLs (production + beta, with and without locale prefix):

```
https://www.waze.com/editor*
https://beta.waze.com/editor*
https://www.waze.com/*/editor*
https://beta.waze.com/*/editor*
```

### Required @exclude Patterns

Exclude the user profile pages that also match `/editor`:

```
https://www.waze.com/user/editor*
https://beta.waze.com/user/editor*
```

### Common @grant Values

| Grant | When needed |
|---|---|
| `unsafeWindow` | Always — required for `SDK_INITIALIZED` and `getWmeSdk` access |
| `GM_xmlhttpRequest` | When fetching external APIs (bypasses CORS) |

### @connect

List each external domain the script will fetch data from:

```
// @connect api.example.com
// @connect data.othersource.org
```

## Release Workflow

1. **Bump version** in `package.json`:
   ```bash
   npm version patch  # or minor, major
   ```

2. **Run release** (updates header.js version + builds):
   ```bash
   npm run release
   ```
   This replaces the version number in `header.js` with the package.json version, then runs the full build.

3. **Output:** `releases/release-<version>.user.js`

4. **Commit and push** the release file.

## Distribution

Host the release file on GitHub. Use raw URLs for auto-update:

```
@updateURL   https://raw.githubusercontent.com/<user>/<repo>/<branch>/releases/main.user.js
@downloadURL https://raw.githubusercontent.com/<user>/<repo>/<branch>/releases/main.user.js
```

Some projects maintain a dedicated `releases` branch with only the built files, keeping the main branch clean.

## Development Workflow

1. Run `npm run watch` for continuous recompilation.
2. In Tampermonkey, create a dev header pointing to the local `.out/main.user.js` file via `@require file:///path/to/.out/main.user.js`.
3. Reload the WME editor page to pick up changes.

Alternatively, use `concat` after each compile and reload the full userscript in Tampermonkey.
