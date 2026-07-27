import { describe, expect, it } from "vitest";
import { unlockedCardBacks, unlockedFelts, unlockedPortraits } from "../src/domain/cosmetics";
import { createDefaultProgress, resolveRunRound, selectFelt } from "../src/domain/progression";

describe("cosmetic progression", () => {
  it("unlocks table felts from lifetime wins without adding power", () => {
    expect(unlockedFelts(0)).toEqual(["CLASSIC_FELT"]);
    expect(unlockedFelts(7)).toContain("CRIMSON_FELT");
  });

  it("only equips an unlocked felt", () => {
    const base = createDefaultProgress();
    expect(selectFelt(base, "VIOLET_FELT")).toBeNull();
    const veteran = { ...base, totalWins: 12, unlockedFelts: unlockedFelts(12) };
    expect(selectFelt(veteran, "VIOLET_FELT")?.selectedFelt).toBe("VIOLET_FELT");
  });

  it("updates unlocks after a victory", () => {
    const base = { ...createDefaultProgress(), totalWins: 2 };
    const result = resolveRunRound(base, true, "rock");
    expect(result.progress.unlockedFelts).toContain("MIDNIGHT_FELT");
  });

  it("unlocks card backs and opponent portraits at milestones", () => {
    expect(unlockedCardBacks(10)).toEqual(["HOUSE_BACK", "BONE_BACK", "NEON_BACK"]);
    expect(unlockedPortraits(11)).toContain("MASON_PORTRAIT");
  });
});
