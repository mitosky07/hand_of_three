import { describe, expect, it } from "vitest";
import { MatchController } from "../src/domain/matchController";
import { MatchPhase } from "../src/domain/MatchPhase";
import { createDefaultProgress, MAX_RELICS, MAX_RUN_ITEMS, normalizeProgress, resolveRunRound } from "../src/domain/progression";
import { createSeededRandom } from "../src/domain/random";

describe("gameplay stress invariants", () => {
  it("finishes 500 seeded best-of-three matches without an illegal or empty choice", () => {
    for (let seed = 0; seed < 500; seed++) {
      const match = new MatchController("AI", undefined, undefined, createSeededRandom(`stress-${seed}`));
      let hands = 0;
      while (match.state.phase !== MatchPhase.MATCH_FINISHED && hands < 60) {
        const playerCard = match.chooseRandomCard("PLAYER_ONE");
        expect(match.select("PLAYER_ONE", playerCard.id)).toBe(true);
        expect(match.lock("PLAYER_ONE")).toBe(true);
        const oracleCard = match.chooseRandomCard("PLAYER_TWO");
        expect(match.select("PLAYER_TWO", oracleCard.id)).toBe(true);
        expect(match.lock("PLAYER_TWO")).toBe(true);
        expect(match.resolve()).not.toBeNull();
        match.finishRound();
        hands++;
        expect(match.state.players.PLAYER_ONE.hand.length).toBeLessThanOrEqual(5);
        expect(match.state.players.PLAYER_TWO.hand.length).toBeLessThanOrEqual(5);
      }
      expect(match.state.phase, `seed ${seed} did not finish after ${hands} hands`).toBe(MatchPhase.MATCH_FINISHED);
      expect(match.state.winner).not.toBeNull();
    }
  });

  it("keeps economy and inventory bounds valid across a long run", () => {
    let progress = { ...createDefaultProgress(), chips: 500 };
    for (let round = 0; round < 250; round++) {
      const result = resolveRunRound(progress, true, round % 3 === 0 ? "rock" : round % 3 === 1 ? "paper" : "scissors");
      progress = result.progress;
      expect(progress.chips).toBeGreaterThanOrEqual(0);
      expect(progress.run.relics.length).toBeLessThanOrEqual(MAX_RELICS);
      expect(Object.values(progress.run.items).reduce((total, count) => total + count, 0)).toBeLessThanOrEqual(MAX_RUN_ITEMS);
      expect(Number.isFinite(result.reward.multiplier)).toBe(true);
      expect(Number.isFinite(result.reward.earned)).toBe(true);
    }
  });

  it("normalizes malformed persisted profiles without leaking invalid values", () => {
    const malformed = normalizeProgress({
      chips: Number.POSITIVE_INFINITY,
      totalWins: -99,
      bestRound: Number.NaN,
      run: {
        round: -5,
        upgrades: { rock: 999, paper: "bad", scissors: Number.NaN },
        multiplierLevel: 999,
        relics: ["stone-idol", "stone-idol", "invalid", "paper-crown", "silver-shears", "golden-chip"],
        items: { "loaded-coin": 999, "smoke-break": 999, "table-knock": -1 },
      },
    });
    expect(malformed.chips).toBe(0);
    expect(malformed.totalWins).toBe(0);
    expect(malformed.run.round).toBe(1);
    expect(malformed.run.upgrades).toEqual({ rock: 3, paper: 0, scissors: 0 });
    expect(malformed.run.multiplierLevel).toBe(4);
    expect(malformed.run.relics).toHaveLength(MAX_RELICS);
    expect(Object.values(malformed.run.items).reduce((total, count) => total + count, 0)).toBe(MAX_RUN_ITEMS);
  });
});
