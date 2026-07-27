import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TimeTrackingService } from "../src/services/timeTrackingService";

describe("TimeTrackingService", () => {
  const values = new Map<string, string>();

  beforeEach(() => {
    values.clear();
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value)
      }
    });
  });

  afterEach(() => vi.restoreAllMocks());

  it("counts, persists and exports a session", () => {
    const clock = vi.spyOn(Date, "now");
    clock.mockReturnValueOnce(1_000);
    const tracker = new TimeTrackingService();
    tracker.start("TEST", "Interface audit");
    clock.mockReturnValue(121_000);

    expect(tracker.elapsedMs).toBe(120_000);
    tracker.stop();

    expect(tracker.entries).toHaveLength(1);
    expect(tracker.entries[0]).toMatchObject({ category: "TEST", description: "Interface audit", startedAt: 1_000, endedAt: 121_000 });
    expect(tracker.exportCsv()).toContain("TEST,\"Interface audit\",2.00");
  });

  it("ignores valid JSON with an invalid persisted shape", () => {
    localStorage.setItem("hand-of-three-time-entries", JSON.stringify({ not: "an array" }));
    const tracker = new TimeTrackingService();
    expect(tracker.entries).toEqual([]);
    expect(tracker.elapsedMs).toBe(0);
  });
});
