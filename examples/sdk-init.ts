import { WmeSDK } from "wme-sdk-typings";

const SCRIPT_ID = "my-script-id";
const SCRIPT_NAME = "My Script Name";

unsafeWindow.SDK_INITIALIZED.then(initScript);

function initScript() {
  if (!unsafeWindow.getWmeSdk) {
    throw new Error("SDK not available");
  }
  const wmeSDK: WmeSDK = unsafeWindow.getWmeSdk({
    scriptId: SCRIPT_ID,
    scriptName: SCRIPT_NAME,
  });

  console.debug(
    `SDK v. ${wmeSDK.getSDKVersion()} on ${wmeSDK.getWMEVersion()} initialized`,
  );

  // Register sidebar tab
  async function addScriptTab() {
    const { tabLabel, tabPane } = await wmeSDK.Sidebar.registerScriptTab();
    tabLabel.innerText = SCRIPT_NAME;
    tabPane.innerHTML = `<p>${SCRIPT_NAME} is running.</p>`;
  }

  // Wait for WME to be fully ready before interacting with map data
  async function init() {
    await addScriptTab();
    await wmeSDK.Events.once({ eventName: "wme-ready" });
    // Script is ready — add layers, register events, etc.
  }

  init();
}
