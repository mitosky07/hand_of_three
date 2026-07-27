export type TimeCategory = "PLAY" | "PLAN" | "CODE-LOGIC" | "CODE-UI" | "ART-SPRITE" | "ART-ANIMATION" | "AUDIO" | "TEST" | "FIX" | "INTEGRATION" | "DEPLOY" | "LEARNING";
export interface TimeEntry { id: string; category: TimeCategory; description: string; startedAt: number; endedAt: number; }
const KEY = "hand-of-three-time-entries";
export class TimeTrackingService {
  private startedAt: number | null = null; private category: TimeCategory = "CODE-LOGIC"; private description = "";
  get entries(): TimeEntry[] {
    try {
      const value: unknown = JSON.parse(localStorage.getItem(KEY) ?? "[]");
      if (!Array.isArray(value)) return [];
      return value.filter((entry): entry is TimeEntry => {
        if (!entry || typeof entry !== "object") return false;
        const item = entry as Partial<TimeEntry>;
        return typeof item.id === "string"
          && typeof item.category === "string"
          && typeof item.description === "string"
          && typeof item.startedAt === "number"
          && Number.isFinite(item.startedAt)
          && typeof item.endedAt === "number"
          && Number.isFinite(item.endedAt)
          && item.endedAt >= item.startedAt;
      });
    } catch { return []; }
  }
  get elapsedMs() { return this.entries.reduce((sum, item) => sum + item.endedAt - item.startedAt, 0) + (this.startedAt ? Date.now() - this.startedAt : 0); }
  start(category: TimeCategory, description = "") { if (!this.startedAt) { this.category = category; this.description = description; this.startedAt = Date.now(); } }
  stop() { if (!this.startedAt) return; const entries = [...this.entries, { id: crypto.randomUUID(), category: this.category, description: this.description, startedAt: this.startedAt, endedAt: Date.now() }]; localStorage.setItem(KEY, JSON.stringify(entries)); this.startedAt = null; }
  exportCsv() { return ["date,category,description,minutes", ...this.entries.map((e) => `${new Date(e.startedAt).toISOString()},${e.category},${JSON.stringify(e.description)},${((e.endedAt-e.startedAt)/60000).toFixed(2)}`)].join("\n"); }
}
export const timeTracker = new TimeTrackingService();
