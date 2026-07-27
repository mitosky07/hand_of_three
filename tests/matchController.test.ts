import { describe, expect, it } from "vitest";
import { MatchController } from "../src/domain/matchController";
import { MatchPhase } from "../src/domain/MatchPhase";
import { createSeededRandom } from "../src/domain/random";

describe("MatchController", () => {
  it("deals five cards from independent decks", () => {
    const match = new MatchController("AI", undefined, undefined, () => .5);
    expect(match.state.players.PLAYER_ONE.hand).toHaveLength(5);
    expect(match.state.players.PLAYER_TWO.hand).toHaveLength(5);
    expect(match.state.players.PLAYER_ONE.deck).not.toBe(match.state.players.PLAYER_TWO.deck);
  });

  it("lets the rival choose after the player locks in", () => {
    const match = new MatchController("AI", undefined, undefined, () => .5);
    const playerCard = match.state.players.PLAYER_ONE.hand[0];
    const rivalCard = match.state.players.PLAYER_TWO.hand[0];
    match.select("PLAYER_ONE", playerCard.id);
    match.lock("PLAYER_ONE");
    expect(match.select("PLAYER_TWO", rivalCard.id)).toBe(true);
    expect(match.lock("PLAYER_TWO")).toBe(true);
    expect(match.resolve()).not.toBeNull();
    match.finishRound();
    expect(match.state.players.PLAYER_ONE.discardPile).toHaveLength(1);
    expect(match.state.players.PLAYER_TWO.discardPile).toHaveLength(1);
    expect(match.state.players.PLAYER_ONE.hand).toHaveLength(5);
    expect(match.state.players.PLAYER_TWO.hand).toHaveLength(5);
    expect(match.state.phase).toBe(MatchPhase.WAITING_FOR_SELECTION);
  });

  it("ends the best of three when a player earns two seals", () => {
    const match = new MatchController("AI", undefined, undefined, () => .5);
    for (let round = 0; round < 2; round++) {
      match.state.players.PLAYER_ONE.hand = [{ id: `rock-win-${round}`, element: "rock", level: 1 }];
      match.state.players.PLAYER_TWO.hand = [{ id: `scissors-loss-${round}`, element: "scissors", level: 10 }];
      match.select("PLAYER_ONE", `rock-win-${round}`);
      match.lock("PLAYER_ONE");
      match.select("PLAYER_TWO", `scissors-loss-${round}`);
      match.lock("PLAYER_TWO");
      match.resolve();
      match.finishRound();
    }
    expect(match.state.players.PLAYER_ONE.score).toBe(2);
    expect(match.state.winner).toBe("PLAYER_ONE");
    expect(match.state.phase).toBe(MatchPhase.MATCH_FINISHED);
  });

  it("uses the same seeded RNG for daily decks and Oracle choices", () => {
    const first = new MatchController("AI", undefined, undefined, createSeededRandom("daily-2026-07-26"));
    const second = new MatchController("AI", undefined, undefined, createSeededRandom("daily-2026-07-26"));
    expect(first.state.players.PLAYER_ONE.hand).toEqual(second.state.players.PLAYER_ONE.hand);
    expect(first.state.players.PLAYER_TWO.hand).toEqual(second.state.players.PLAYER_TWO.hand);
    expect(first.chooseRandomCard("PLAYER_TWO")).toEqual(second.chooseRandomCard("PLAYER_TWO"));
  });

  it("does not award Marked or Sharp bonuses when the rival wins", () => {
    const match = new MatchController("AI", undefined, undefined, () => .5);
    match.state.players.PLAYER_ONE.hand = [{ id: "paper-loss", element: "paper", level: 10 }];
    match.state.players.PLAYER_TWO.hand = [{ id: "scissors-win", element: "scissors", level: 1, keyword: "SHARP" }];
    match.select("PLAYER_ONE", "paper-loss");
    match.lock("PLAYER_ONE");
    match.select("PLAYER_TWO", "scissors-win");
    match.lock("PLAYER_TWO");
    match.resolve();
    expect(match.state.bonusChips).toBe(0);
    expect(match.state.bonusMultiplier).toBe(0);
  });

  it("allows a Heavy card when every card in the hand is blocked", () => {
    const match = new MatchController("AI", undefined, undefined, () => .5);
    match.state.lastPlayedElement.PLAYER_ONE = "rock";
    match.state.players.PLAYER_ONE.hand = [
      { id: "heavy-one", element: "rock", level: 3, keyword: "HEAVY" },
      { id: "heavy-two", element: "rock", level: 5, keyword: "HEAVY" },
    ];
    expect(match.canSelect("PLAYER_ONE", match.state.players.PLAYER_ONE.hand[0])).toBe(true);
    expect(match.select("PLAYER_ONE", "heavy-one")).toBe(true);
  });
});
