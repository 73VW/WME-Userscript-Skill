/**
 * Example: FeatureLayer with delta-based rendering, event cleanup,
 * and click interaction.
 *
 * Demonstrates the full lifecycle: add layer → fetch data → render features
 * → handle clicks → re-render on map move → clean up on toggle off.
 */

import {
  WmeSDK,
  SdkFeature,
  SdkFeatureStyleRule,
} from "wme-sdk-typings";

// --- Types ---

interface DataRecord {
  id: string;
  lat: number;
  lon: number;
  name: string;
}

// --- State ---

const LAYER_NAME = "My Feature Layer";
const MIN_ZOOM = 15;
const visibleFeatureIds = new Set<string>();
const eventCleanups: Array<() => void> = [];

// --- Style ---

const styleRules: SdkFeatureStyleRule[] = [
  {
    style: {
      fillOpacity: 0.8,
      fillColor: "#3498db",
      strokeColor: "#2980b9",
      strokeWidth: 2,
      cursor: "pointer",
      pointRadius: 10,
    },
  },
];

// --- Core functions ---

function addLayerToMap(wmeSDK: WmeSDK): void {
  wmeSDK.Map.addLayer({
    layerName: LAYER_NAME,
    styleRules,
  });

  // Enable click events for this layer
  wmeSDK.Events.trackLayerEvents({ layerName: LAYER_NAME });
}

function removeLayerFromMap(wmeSDK: WmeSDK): void {
  wmeSDK.Map.removeLayer({ layerName: LAYER_NAME });
  visibleFeatureIds.clear();

  // Clean up all event listeners
  for (const cleanup of eventCleanups) {
    try {
      cleanup();
    } catch {
      /* ignore */
    }
  }
  eventCleanups.length = 0;
}

function mapRecordToFeature(record: DataRecord): SdkFeature {
  return {
    id: record.id,
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [record.lon, record.lat],
    },
  };
}

// --- Data fetching ---

async function fetchData(wmeSDK: WmeSDK): Promise<DataRecord[]> {
  const center = wmeSDK.Map.getMapCenter();

  // Replace with actual API call (GM_xmlhttpRequest for external APIs)
  const response = await fetch(
    `https://api.example.com/data?lat=${center.lat}&lon=${center.lon}`,
  );
  return response.json();
}

// --- Rendering (delta-based) ---

async function render(wmeSDK: WmeSDK): Promise<void> {
  const zoom = wmeSDK.Map.getZoomLevel();
  if (zoom < MIN_ZOOM) return;

  const records = await fetchData(wmeSDK);

  const newRecordsById = new Map<string, DataRecord>();
  for (const record of records) {
    newRecordsById.set(record.id, record);
  }

  // Add only features not already on the map
  const toAdd = Array.from(newRecordsById.values()).filter(
    (r) => !visibleFeatureIds.has(r.id),
  );

  if (toAdd.length > 0) {
    wmeSDK.Map.addFeaturesToLayer({
      layerName: LAYER_NAME,
      features: toAdd.map(mapRecordToFeature),
    });
    for (const record of toAdd) {
      visibleFeatureIds.add(record.id);
    }
  }

  // Remove features no longer in the data set
  const toRemove = Array.from(visibleFeatureIds).filter(
    (id) => !newRecordsById.has(id),
  );

  if (toRemove.length > 0) {
    wmeSDK.Map.removeFeaturesFromLayer({
      featureIds: toRemove,
      layerName: LAYER_NAME,
    });
    for (const id of toRemove) {
      visibleFeatureIds.delete(id);
    }
  }
}

// --- Event registration ---

function registerEvents(wmeSDK: WmeSDK): void {
  // Re-render on map pan/zoom
  const cleanupMove = wmeSDK.Events.on({
    eventName: "wme-map-move-end",
    eventHandler: () => {
      render(wmeSDK);
    },
  });
  eventCleanups.push(cleanupMove);

  // Handle feature clicks
  const cleanupClick = wmeSDK.Events.on({
    eventName: "wme-layer-feature-clicked",
    eventHandler: ({ featureId, layerName }) => {
      if (layerName !== LAYER_NAME) return;
      console.log(`Feature clicked: ${featureId}`);
      // Handle click — show info panel, open dialog, etc.
    },
  });
  eventCleanups.push(cleanupClick);
}

// --- Checkbox toggle ---

function setupLayer(wmeSDK: WmeSDK): void {
  wmeSDK.LayerSwitcher.addLayerCheckbox({ name: LAYER_NAME });

  wmeSDK.Events.on({
    eventName: "wme-layer-checkbox-toggled",
    eventHandler: ({ name, checked }) => {
      if (name !== LAYER_NAME) return;

      if (checked) {
        addLayerToMap(wmeSDK);
        registerEvents(wmeSDK);
        render(wmeSDK);
      } else {
        removeLayerFromMap(wmeSDK);
      }
    },
  });
}
