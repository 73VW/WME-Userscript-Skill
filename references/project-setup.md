# WME Userscript Project Setup

Guide for bootstrapping a new Waze Map Editor userscript project in TypeScript.

## Prerequisites

- Node.js (LTS recommended)
- npm
- Editor with TypeScript support

## Minimal Project Structure

```
my-wme-script/
├── main.user.ts           # Entry point — SDK init + script logic
├── header.js              # Tampermonkey userscript header
├── rollup.config.mjs      # Rollup bundler configuration
├── tsconfig.json          # TypeScript compiler options
├── package.json           # Dependencies and scripts
├── .out/                  # Build output (gitignored)
└── releases/              # Final userscript files
```

For larger scripts, add:

```
├── src/                   # Source modules
│   ├── layer.ts           # Layer base classes
│   ├── storage.ts         # localStorage persistence
│   ├── utils.ts           # Shared utilities
│   └── __tests__/         # Unit tests
├── locales/               # i18next translations (optional)
│   ├── i18n.ts
│   ├── en/common.json
│   └── fr/common.json
└── .devcontainer/         # DevContainer config (optional)
```

## package.json

Minimal dependencies:

```json
{
  "name": "my-wme-script",
  "version": "1.0.0",
  "scripts": {
    "compile": "rollup -c",
    "watch": "rollup -c --watch",
    "concat": "concat -o releases/release-$npm_package_version.user.js header.js .out/main.user.js",
    "build": "npm run compile && npm run concat",
    "release": "replace-in-files --regex='\\d+\\.\\d+\\.\\d+' --replacement=$npm_package_version header.js && npm run build"
  },
  "devDependencies": {
    "@rollup/plugin-typescript": "^12.1.0",
    "tslib": "^2.7.0",
    "typescript": "^5.6.3",
    "wme-sdk-typings": "https://web-assets.waze.com/wme_sdk_docs/production/latest/wme-sdk-typings.tgz"
  },
  "dependencies": {
    "@types/tampermonkey": "^5.0.3",
    "concat": "^1.0.3",
    "cross-env": "^7.0.3",
    "replace-in-files-cli": "^3.0.0"
  }
}
```

On Windows, replace `$npm_package_version` with `%npm_package_version%` or use `cross-env`.

## tsconfig.json

Key settings for WME userscripts:

```json
{
  "compilerOptions": {
    "target": "ES2021",
    "module": "ES6",
    "moduleResolution": "node10",
    "outDir": ".out",
    "removeComments": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true
  },
  "exclude": ["node_modules", "releases"]
}
```

Enable `resolveJsonModule: true` if importing JSON files (e.g., i18next locale files).

## rollup.config.mjs

Minimal configuration:

```javascript
import typescript from "@rollup/plugin-typescript";

export default {
  input: "main.user.ts",
  output: {
    file: ".out/main.user.js",
    format: "iife",
    name: "WmeScript",
    sourcemap: "inline",
  },
  plugins: [typescript()],
};
```

For projects with JSON imports or npm dependencies, add plugins:

```javascript
import typescript from "@rollup/plugin-typescript";
import json from "@rollup/plugin-json";
import nodeResolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";

export default {
  input: "main.user.ts",
  output: {
    file: ".out/main.user.js",
    format: "iife",
    name: "WmeScript",
    sourcemap: "inline",
  },
  plugins: [nodeResolve(), commonjs(), json(), typescript()],
};
```

## Optional Features

### i18next (Localization)

Add to package.json:

```json
{
  "dependencies": {
    "i18next": "^25.3.0"
  },
  "devDependencies": {
    "i18next-parser": "^9.3.0"
  }
}
```

Create `locales/i18n.ts`:

```typescript
import i18next from "i18next";
import enCommon from "./en/common.json";
import frCommon from "./fr/common.json";

i18next.init({
  lng: "en",
  fallbackLng: "en",
  resources: {
    en: { common: enCommon },
    fr: { common: frCommon },
  },
});

export default i18next;
```

Add a script for key extraction:

```json
"makemessages": "i18next 'src/**/*.ts' 'main.user.ts'"
```

### Vitest (Testing)

```json
{
  "devDependencies": {
    "vitest": "^3.0.0"
  },
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

Create `vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
  },
});
```

### ESLint + Prettier

```json
{
  "devDependencies": {
    "eslint": "^9.0.0",
    "typescript-eslint": "^8.0.0",
    "prettier": "^3.6.0"
  },
  "scripts": {
    "lint": "eslint .",
    "format": "prettier --write ."
  }
}
```

### Watch Mode (Development)

For concurrent watchers during development, use `concurrently`:

```json
{
  "devDependencies": {
    "concurrently": "^9.0.0"
  },
  "scripts": {
    "watch": "concurrently \"rollup -c --watch\" \"npm run lint -- --watch\" \"prettier --watch .\""
  }
}
```

## DevContainer Setup

For reproducible environments, add `.devcontainer/devcontainer.json`:

```json
{
  "name": "WME Script Dev",
  "image": "mcr.microsoft.com/devcontainers/typescript-node:1-22-bookworm",
  "postCreateCommand": "npm install"
}
```

## Quickstart

```bash
# 1. Create project directory
mkdir my-wme-script && cd my-wme-script

# 2. Initialize and install dependencies
npm init -y
npm install

# 3. Create entry point from template
# (copy from examples/sdk-init.ts)

# 4. Create Tampermonkey header
# (copy from examples/header-template.js, fill in TODOs)

# 5. Build
npm run build

# 6. Install in Tampermonkey
# Open releases/release-1.0.0.user.js in browser
```
