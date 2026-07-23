import { describe, expect, it } from "vitest";
import { MatchController } from "../src/domain/matchController";
import { MatchPhase } from "../src/domain/MatchPhase";

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
});
