import AsyncStorage from "@react-native-async-storage/async-storage";

import { Settings } from "../types/Settings";
import { STORAGE_KEYS } from "./keys";

// ─── Notes ───────────────────────────────────────────────────────────────────
// Settings is a SINGLETON — the app has exactly one Settings record.
// It does not follow the array-based CRUD pattern of other storage files.
// Instead: getSettings / saveSettings / updateSettings / clearSettings.

// ─── CRUD ────────────────────────────────────────────────────────────────────

export const getSettings = async (): Promise<Settings | null> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data ? (JSON.parse(data) as Settings) : null;
  } catch (error) {
    console.error("[settingsStorage] getSettings failed:", error);
    return null;
  }
};

// getById is not applicable for a singleton — use getSettings()

export const saveSettings = async (settings: Settings): Promise<void> => {
  try {
    const existing = await getSettings();
    if (existing !== null) {
      console.warn(
        "[settingsStorage] saveSettings: Settings already exist. Use updateSettings instead.",
      );
      return;
    }

    await AsyncStorage.setItem(
      STORAGE_KEYS.SETTINGS,
      JSON.stringify(settings),
    );
  } catch (error) {
    console.error("[settingsStorage] saveSettings failed:", error);
  }
};

export const updateSettings = async (
  updatedSettings: Settings,
): Promise<void> => {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEYS.SETTINGS,
      JSON.stringify(updatedSettings),
    );
  } catch (error) {
    console.error("[settingsStorage] updateSettings failed:", error);
  }
};

// deleteSettings is intentionally omitted — settings should never be hard-deleted.
// Use clearSettings only for dev/test resets.

export const clearSettings = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.SETTINGS);
  } catch (error) {
    console.error("[settingsStorage] clearSettings failed:", error);
  }
};
