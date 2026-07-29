import { describe, expect, it } from "vitest";
import { consumeDoubleToken, createDefaultProgress, getRewardMultiplier, normalizeProgress, purchaseShopItem, resolveRunRound } from "../src/domain/progression";

describe("infinite run economy", () => {
  it("advances only after a victory and records the highest round", () => {
    const result = resolveRunRound(createDefaultProgress(), true, "rock");
    expect(result.reward.earned).toBe(3);
    expect(result.progress.run.round).toBe(2);
    expect(result.progress.bestRound).toBe(2);
    expect(result.progress.totalWins).toBe(1);
  });

  it("ends the run and starts from zero after losing a best-of-three", () => {
    const base = createDefaultProgress();
    const progress = {
      ...base,
      chips: 41,
      totalWins: 8,
      bestRound: 9,
      totalEarned: 73,
      run: {
        ...base.run,
        round: 7,
        wins: 6,
        upgrades: { rock: 2, paper: 1, scissors: 3 },
        multiplierLevel: 3,
        relics: ["stone-idol" as const, "paper-crown" as const],
        doubleTokens: 2
      }
    };
    const result = resolveRunRound(progress, false, "paper", true);
    expect(result.reward.earned).toBe(0);
    expect(result.reward.runEnded).toBe(true);
    expect(result.progress.run.round).toBe(1);
    expect(result.progress.chips).toBe(0);
    expect(result.progress.run.upgrades).toEqual({ rock: 0, paper: 0, scissors: 0 });
    expect(result.progress.run.multiplierLevel).toBe(0);
    expect(result.progress.run.relics).toEqual([]);
    expect(result.progress.run.doubleTokens).toBe(0);
    expect(result.progress.totalWins).toBe(8);
    expect(result.progress.bestRound).toBe(9);
    expect(result.progress.totalEarned).toBe(73);
  });

  it("scales rewards every five rounds and combines multipliers", () => {
    const base = createDefaultProgress();
    const progress = { ...base, run: { ...base.run, round: 6, multiplierLevel: 2, relics: ["silver-shears" as const] } };
    expect(getRewardMultiplier(progress, "scissors")).toBe(1.85);
    expect(resolveRunRound(progress, true, "scissors", true).reward.earned).toBe(14);
  });

  it("buys upgrades for the current run", () => {
    const result = purchaseShopItem({ ...createDefaultProgress(), chips: 20 }, "upgrade-paper");
    expect(result.success).toBe(true);
    expect(result.progress.run.upgrades.paper).toBe(1);
    expect(result.progress.chips).toBe(12);
  });

  it("blocks purchases without chips and consumes x2 items", () => {
    const denied = purchaseShopItem(createDefaultProgress(), "double-token");
    expect(denied.success).toBe(false);
    expect(denied.message).toBe("NOT ENOUGH CHIPS");

    const bought = purchaseShopItem({ ...createDefaultProgress(), chips: 6 }, "double-token");
    expect(bought.success).toBe(true);
    expect(bought.progress.run.doubleTokens).toBe(1);
    expect(consumeDoubleToken(bought.progress)?.run.doubleTokens).toBe(0);
  });

  it("migrates the previous persistent profile", () => {
    const migrated = normalizeProgress({ chips: 9, victories: 4, upgrades: { rock: 2 }, multiplierLevel: 1 });
    expect(migrated.version).toBe(5);
    expect(migrated.totalWins).toBe(4);
    expect(migrated.bestRound).toBe(5);
    expect(migrated.run.upgrades.rock).toBe(2);
  });
});
