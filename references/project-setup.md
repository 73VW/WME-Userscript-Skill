# WME Userscript Project Setup

Guide for bootstrapping a new Waze Map Editor userscript project in TypeScript.

## Prerequisites

- Node.js (LTS recommended)
- npm
- Editor with TypeScript support

## Minimal Project Structure

```text
my-wme-script/
├── main.user.ts           # Entry point — SDK init + script logic
├── header.js              # Tampermonkey userscript header
├── rollup.config.mjs      # Rollup bundler configuration
├── tsconfig.json          # TypeScript compiler options
├── package.json           # Dependencies and scripts
├── .out/                  # Build output (gitignored)
└── releases/              # Final userscript artifact(s)
```

For larger scripts, add:

```text
├── src/
│   ├── layer.ts
│   ├── storage.ts
│   ├── utils.ts
│   └── __tests__/
├── locales/               # Optional i18next resources
└── .devcontainer/         # Optional
```

## package.json

Minimal setup with a stable distribution artifact (`releases/main.user.js`):

```json
{
  "name": "my-wme-script",
  "version": "1.0.0",
  "scripts": {
    "compile": "rollup -c",
    "watch": "rollup -c --watch",
    "concat": "concat -o releases/main.user.js header.js .out/main.user.js",
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

On Windows, replace `$npm_package_version` with `%npm_package_version%` or use `cross-var`/`cross-env` wrappers.

## tsconfig.json

Recommended baseline:

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

Enable `resolveJsonModule: true` if importing JSON locale files.

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

If you import JSON or external npm modules, add:

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

## Quickstart

```bash
# 1. Create project directory
mkdir my-wme-script && cd my-wme-script

# 2. Initialize project
npm init -y

# 3. Add files from this skill templates/examples
# - examples/sdk-init.ts -> main.user.ts
# - examples/header-template.js -> header.js

# 4. Install dependencies
npm install

# 5. Build
npm run build

# 6. Install in Tampermonkey
# Open releases/main.user.js in browser
```
