const KEY = "hand-of-three-settings";
export interface Settings { muted: boolean; }
export function getSettings(): Settings { try { return { muted: Boolean(JSON.parse(localStorage.getItem(KEY) ?? "{}").muted) }; } catch { return { muted: false }; } }
export function saveSettings(settings: Settings) { localStorage.setItem(KEY, JSON.stringify(settings)); }
