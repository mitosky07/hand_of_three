const KEY = "hand-of-three-settings";
export interface Settings { muted: boolean; reducedMotion: boolean; }
export function getSettings(): Settings {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) ?? "{}") as Partial<Settings>;
    return { muted: Boolean(value.muted), reducedMotion: Boolean(value.reducedMotion) };
  } catch { return { muted: false, reducedMotion: false }; }
}
export function saveSettings(settings: Settings) { localStorage.setItem(KEY, JSON.stringify(settings)); }
