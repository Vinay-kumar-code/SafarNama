export interface OTAManifest {
  version: string;
  bundleUrl: string;
  releaseNotes: string;
  releasedAt: string;
  mandatory?: boolean;
}

const CURRENT_APP_VERSION = '1.0.0';
const VERSION_PREF_KEY = 'safarnama_installed_ota_version';

export interface OTAUpdateStatus {
  isChecking: boolean;
  updateAvailable: boolean;
  manifest: OTAManifest | null;
  error: string | null;
}

export async function getInstalledVersion(): Promise<string> {
  try {
    return localStorage.getItem(VERSION_PREF_KEY) || CURRENT_APP_VERSION;
  } catch {
    return CURRENT_APP_VERSION;
  }
}

export async function setInstalledVersion(version: string): Promise<void> {
  try {
    localStorage.setItem(VERSION_PREF_KEY, version);
  } catch (err) {
    console.warn('Could not persist installed OTA version to localStorage:', err);
  }
}

/**
 * Normal, self-hosted OTA Auto-Updater.
 * Fetches the manifest on app start, compares versions,
 * and notifies the app when a new bundle is ready.
 */
export async function checkOTAUpdate(): Promise<{
  updateAvailable: boolean;
  manifest: OTAManifest | null;
  currentVersion: string;
}> {
  const currentVersion = await getInstalledVersion();
  const manifestUrl =
    import.meta.env.VITE_OTA_MANIFEST_URL ||
    'https://raw.githubusercontent.com/Vinay-kumar-code/SafarNama/main/ota/manifest.json';

  try {
    const response = await fetch(`${manifestUrl}?t=${Date.now()}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      console.log('No remote OTA manifest found or server unreachable, running local bundle.');
      return { updateAvailable: false, manifest: null, currentVersion };
    }

    const manifest: OTAManifest = await response.json();

    if (manifest.version && manifest.version !== currentVersion) {
      return {
        updateAvailable: true,
        manifest,
        currentVersion,
      };
    }

    return { updateAvailable: false, manifest, currentVersion };
  } catch (err) {
    console.warn('OTA check skipped (offline or network error):', err);
    return { updateAvailable: false, manifest: null, currentVersion };
  }
}

export async function applyOTAUpdate(manifest: OTAManifest): Promise<void> {
  await setInstalledVersion(manifest.version);
  window.location.reload();
}
