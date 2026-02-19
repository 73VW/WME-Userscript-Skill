/**
 * Example: Minimal TileLayer implementation.
 *
 * Adds a raster tile layer to WME with a checkbox toggle
 * and persistent state via localStorage.
 */

import { WmeSDK } from "wme-sdk-typings";

const STORAGE_KEY = "my-script-layer-state";

function saveLayerState(layerName: string, checked: boolean): void {
  try {
    const states = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    states[layerName] = checked;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(states));
  } catch {
    /* ignore storage errors */
  }
}

function isLayerEnabled(layerName: string): boolean | null {
  try {
    const states = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return layerName in states ? states[layerName] : null;
  } catch {
    return null;
  }
}

function addTileLayerToMap(wmeSDK: WmeSDK) {
  const layerName = "My Tile Overlay";

  // Register checkbox in the WME layers panel
  wmeSDK.LayerSwitcher.addLayerCheckbox({ name: layerName });

  // Handle checkbox toggle
  wmeSDK.Events.on({
    eventName: "wme-layer-checkbox-toggled",
    eventHandler: ({ name, checked }) => {
      if (name !== layerName) return;
      saveLayerState(layerName, checked);

      if (checked) {
        wmeSDK.Map.addTileLayer({
          layerName,
          layerOptions: {
            tileHeight: 256,
            tileWidth: 256,
            url: {
              fileName: "${z}/${x}/${y}.png",
              servers: [
                "https://tiles.example.com/layer/default/current/3857",
              ],
            },
          },
        });
        wmeSDK.Map.setLayerZIndex({ layerName, zIndex: 2039 });
      } else {
        wmeSDK.Map.removeLayer({ layerName });
      }
    },
  });

  // Restore persisted state on wme-ready
  wmeSDK.Events.once({ eventName: "wme-ready" }).then(() => {
    if (isLayerEnabled(layerName) === true) {
      wmeSDK.LayerSwitcher.setLayerCheckboxChecked({
        name: layerName,
        isChecked: true,
      });
    }
  });
}
