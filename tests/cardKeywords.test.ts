import { describe, expect, it } from "vitest";
import { addKeywords } from "../src/domain/deck";
import { MatchController } from "../src/domain/matchController";
import { MatchPhase } from "../src/domain/MatchPhase";
import { resolveRound } from "../src/domain/resolveRound";

describe("card keywords", () => {
  it("assigns deterministic keywords and applies HEAVY power", () => {
    const [card] = addKeywords([{ id: "rock-01", element: "rock", level: 1 }], () => 0, 1);
    expect(card.keyword).toBe("HEAVY");
    expect(card.level).toBe(3);
  });

  it("doubles a LUCKY card when its roll succeeds", () => {
    const result = resolveRound(
      { id: "paper-lucky", element: "paper", level: 3, keyword: "LUCKY" },
      { id: "paper-plain", element: "paper", level: 5 },
      () => 0,
    );
    expect(result.winner).toBe("PLAYER_ONE");
    expect(result.effectiveLevels?.PLAYER_ONE).toBe(6);
    expect(result.luckyTriggered).toEqual(["PLAYER_ONE"]);
  });

  it("blocks a HEAVY repeat and returns GUARD to the hand after a draw", () => {
    const match = new MatchController("LOCAL", undefined, undefined, () => .5);
    const heavy = { id: "heavy-rock", element: "rock" as const, level: 7, keyword: "HEAVY" as const };
    match.state.players.PLAYER_ONE.hand = [heavy, { id: "legal-paper", element: "paper", level: 2 }];
    match.state.lastPlayedElement.PLAYER_ONE = "rock";
    expect(match.select("PLAYER_ONE", heavy.id)).toBe(false);

    const guard = { id: "guard-paper", element: "paper" as const, level: 4, keyword: "GUARD" as const };
    const rival = { id: "rival-paper", element: "paper" as const, level: 4 };
    match.state.lastPlayedElement = {};
    match.state.players.PLAYER_ONE.hand = [guard];
    match.state.players.PLAYER_TWO.hand = [rival];
    match.select("PLAYER_ONE", guard.id);
    match.lock("PLAYER_ONE");
    match.select("PLAYER_TWO", rival.id);
    match.lock("PLAYER_TWO");
    match.resolve();
    match.finishRound();
    expect(match.state.players.PLAYER_ONE.hand.some((card) => card.id === guard.id)).toBe(true);
    expect(match.state.players.PLAYER_TWO.hand.some((card) => card.id === rival.id)).toBe(false);
  });

  it("tracks MARKED chips and SHARP multiplier for the match payout", () => {
    const match = new MatchController("LOCAL", undefined, undefined, () => .5);
    match.state.players.PLAYER_ONE.hand = [{ id: "sharp", element: "scissors", level: 4, keyword: "SHARP" }];
    match.state.players.PLAYER_TWO.hand = [{ id: "paper", element: "paper", level: 10 }];
    match.select("PLAYER_ONE", "sharp");
    match.lock("PLAYER_ONE");
    match.select("PLAYER_TWO", "paper");
    match.lock("PLAYER_TWO");
    match.resolve();
    expect(match.state.bonusMultiplier).toBe(.1);

    match.state.phase = MatchPhase.WAITING_FOR_SELECTION;
    match.state.players.PLAYER_ONE.selectedCard = null;
    match.state.players.PLAYER_TWO.selectedCard = null;
    match.state.players.PLAYER_ONE.hand = [{ id: "marked", element: "rock", level: 1, keyword: "MARKED" }];
    match.state.players.PLAYER_TWO.hand = [{ id: "scissors", element: "scissors", level: 10 }];
    match.select("PLAYER_ONE", "marked");
    match.lock("PLAYER_ONE");
    match.select("PLAYER_TWO", "scissors");
    match.lock("PLAYER_TWO");
    match.resolve();
    expect(match.state.bonusChips).toBe(1);
  });
});
