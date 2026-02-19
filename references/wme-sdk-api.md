# WME SDK API Reference

Detailed reference for the Waze Map Editor SDK APIs used in userscript development. Always consult `node_modules/wme-sdk-typings/index.d.ts` and the official docs at https://www.waze.com/editor/sdk/index.html for the authoritative API surface.

## SDK Initialization

```typescript
import { WmeSDK } from "wme-sdk-typings";

unsafeWindow.SDK_INITIALIZED.then(initScript);

function initScript() {
  if (!unsafeWindow.getWmeSdk) {
    throw new Error("SDK not available");
  }
  const wmeSDK: WmeSDK = unsafeWindow.getWmeSdk({
    scriptId: "my-script-id",      // Unique identifier (kebab-case)
    scriptName: "My Script Name",   // Human-readable name (English)
  });

  console.debug(
    `SDK v. ${wmeSDK.getSDKVersion()} on ${wmeSDK.getWMEVersion()} initialized`
  );
}
```

The `scriptId` must be unique across all installed scripts. Use kebab-case. The `scriptName` is displayed in the WME UI.

## Map API

### Adding Layers

**Tile layer** (raster — WMTS, XYZ tiles):

```typescript
wmeSDK.Map.addTileLayer({
  layerName: "My Tile Layer",
  layerOptions: {
    tileHeight: 256,
    tileWidth: 256,
    url: {
      fileName: "${z}/${x}/${y}.png",
      servers: ["https://tiles.example.com/layer/default/current/3857"],
    },
  },
});
```

The `fileName` uses `${z}`, `${x}`, `${y}` placeholders for zoom level and tile coordinates. The `servers` array provides base URLs (load balancing if multiple).

**Feature layer** (vector — points, lines, polygons):

```typescript
wmeSDK.Map.addLayer({
  layerName: "My Feature Layer",
  styleContext: undefined,    // Optional SdkFeatureStyleContext
  styleRules: [{              // Optional SdkFeatureStyleRule[]
    style: {
      fillOpacity: 1,
      cursor: "pointer",
      pointRadius: 13,
      externalGraphic: "data:image/svg+xml;base64,...",
    },
  }],
});
```

### Z-Index

```typescript
wmeSDK.Map.setLayerZIndex({
  layerName: "My Tile Layer",
  zIndex: 2039,
});
```

Default WME z-index range: 2000–2065. Key reference points:
- Background: ~2010
- Custom layers: 2035–2050 (recommended range)
- Segments: 2060

### Adding Features

**Single feature:**

```typescript
wmeSDK.Map.addFeatureToLayer({
  layerName: "My Feature Layer",
  feature: {
    id: "feature-123",
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [lon, lat],  // [longitude, latitude] — GeoJSON order
    },
  },
});
```

**Batch (optimized — prefer for multiple features):**

```typescript
wmeSDK.Map.addFeaturesToLayer({
  layerName: "My Feature Layer",
  features: arrayOfSdkFeatures,
});
```

### Removing Features

```typescript
// Single
wmeSDK.Map.removeFeatureFromLayer({
  featureId: "feature-123",
  layerName: "My Feature Layer",
});

// Batch
wmeSDK.Map.removeFeaturesFromLayer({
  featureIds: ["feature-1", "feature-2"],
  layerName: "My Feature Layer",
});
```

### Removing Layers

```typescript
wmeSDK.Map.removeLayer({ layerName: "My Feature Layer" });
```

### Map State

```typescript
const zoom = wmeSDK.Map.getZoomLevel();
const center = wmeSDK.Map.getMapCenter();  // { lat: number, lon: number }
```

## Events API

### Registering Events

`on()` returns a cleanup function. Always store it for proper teardown:

```typescript
const cleanup = wmeSDK.Events.on({
  eventName: "wme-map-move-end",
  eventHandler: () => {
    console.log("Map moved");
  },
});

// Later, to unregister:
cleanup();
```

### One-Time Events

`once()` returns a Promise that resolves when the event fires:

```typescript
await wmeSDK.Events.once({ eventName: "wme-ready" });
console.log("WME is fully ready");
```

### Key Event Names

| Event | Payload | When |
|---|---|---|
| `wme-ready` | — | WME fully initialized (data loaded, user logged in) |
| `wme-map-move-end` | — | Map pan or zoom finished |
| `wme-layer-checkbox-toggled` | `{ name: string, checked: boolean }` | Layer checkbox toggled in UI |
| `wme-layer-feature-clicked` | `{ featureId: string \| number, layerName: string }` | Feature clicked on map |

### Tracking Layer Events

Enable click events for a specific feature layer:

```typescript
wmeSDK.Events.trackLayerEvents({ layerName: "My Feature Layer" });
```

This must be called after `addLayer()` for `wme-layer-feature-clicked` events to fire on that layer.

## LayerSwitcher API

```typescript
// Register a checkbox in the WME layers panel
wmeSDK.LayerSwitcher.addLayerCheckbox({ name: "My Layer" });

// Programmatically set checkbox state
wmeSDK.LayerSwitcher.setLayerCheckboxChecked({
  name: "My Layer",
  isChecked: true,
});

// Query current state
const checked = wmeSDK.LayerSwitcher.isLayerCheckboxChecked({
  name: "My Layer",
});
```

The checkbox name should match the layer name for consistency. Checkbox state changes fire the `wme-layer-checkbox-toggled` event.

## Sidebar API

```typescript
const { tabLabel, tabPane } = await wmeSDK.Sidebar.registerScriptTab();

// tabLabel: HTMLElement for the tab header
tabLabel.innerText = "My Script";

// tabPane: HTMLElement container for tab content
tabPane.innerHTML = "<h2>Hello</h2><p>Script content here</p>";
```

Build UI with plain HTML strings — no framework needed. For structured UIs, compose a class hierarchy that produces HTML via `render()` methods. Bind event listeners after setting `innerHTML` using `tabPane.querySelector()`.

WME provides built-in web components like `<wz-checkbox>` that can be used in innerHTML. Listen for `change` events after rendering.

## Settings API

```typescript
const { localeCode } = wmeSDK.Settings.getLocale();
// localeCode: "en", "fr", "de", "it", etc.
```

## Shortcuts API

```typescript
wmeSDK.Shortcuts.createShortcut({
  shortcutId: "my-script-toggle",
  description: "Toggle my layer",
  shortcutKeys: "A+s",   // Alt+S
  callback: () => {
    // Toggle logic
  },
});
```

Key modifiers: `A` (Alt), `C` (Ctrl), `S` (Shift). Combined with `+` separator.

## State API

```typescript
const loading = wmeSDK.State.isMapLoading();
```

Useful for waiting until map data is fully loaded before querying features or rendering.

## Feature Types (SdkFeature)

```typescript
import { SdkFeature } from "wme-sdk-typings";

const pointFeature: SdkFeature = {
  id: "pt-1",
  type: "Feature",
  geometry: {
    type: "Point",
    coordinates: [lon, lat],
  },
};

const polygonFeature: SdkFeature = {
  id: "poly-1",
  type: "Feature",
  geometry: {
    type: "Polygon",
    coordinates: [[[lon1, lat1], [lon2, lat2], [lon3, lat3], [lon1, lat1]]],
  },
};
```

Geometry follows the GeoJSON specification: coordinates are `[longitude, latitude]`.

## Style Rules

```typescript
import { SdkFeatureStyleRule } from "wme-sdk-typings";

const styleRules: SdkFeatureStyleRule[] = [{
  style: {
    fillOpacity: 1,
    fillColor: "#e74c3c",
    strokeColor: "#c0392b",
    strokeWidth: 2,
    cursor: "pointer",
    pointRadius: 10,
    externalGraphic: "data:image/svg+xml;base64,...",
  },
}];
```

Common style properties:
- `fillColor`, `fillOpacity` — fill appearance
- `strokeColor`, `strokeWidth` — border appearance
- `pointRadius` — radius for point features
- `cursor` — CSS cursor on hover
- `externalGraphic` — icon URL or data URI (SVG recommended as base64)

## Utility Pattern: Wait for Map Idle

A common need is waiting for the map to finish loading data before rendering:

```typescript
function waitForMapIdle(args: {
  wmeSDK: WmeSDK;
  intervalMs?: number;
  maxTries?: number;
}): Promise<void> {
  const { wmeSDK, intervalMs = 50, maxTries = 60 } = args;
  return new Promise((resolve) => {
    let tries = 0;
    const check = () => {
      if (!wmeSDK.State.isMapLoading() || tries >= maxTries) {
        resolve();
      } else {
        tries++;
        setTimeout(check, intervalMs);
      }
    };
    check();
  });
}
```

Use before rendering features after a map move event to ensure fresh data is available.

## External Requests

For fetching data from external APIs, use Tampermonkey's `GM_xmlhttpRequest` to bypass CORS:

```typescript
GM_xmlhttpRequest({
  method: "GET",
  url: "https://api.example.com/data",
  onload: (response) => {
    const data = JSON.parse(response.responseText);
    // Process data
  },
});
```

Declare allowed domains in the userscript header:
```
// @grant   GM_xmlhttpRequest
// @connect api.example.com
```
