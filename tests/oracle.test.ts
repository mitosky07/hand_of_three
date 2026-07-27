import { describe, expect, it } from "vitest";
import { createRandomDeck } from "../src/domain/deck";
import { getOracleForRound } from "../src/domain/oracle";

describe("Oracle personalities", () => {
  it("changes opponent every five rounds", () => {
    expect(getOracleForRound(1).id).toBe("ORACLE");
    expect(getOracleForRound(5).id).toBe("ORACLE");
    expect(getOracleForRound(6).id).toBe("CUTTER");
    expect(getOracleForRound(11).id).toBe("MASON");
    expect(getOracleForRound(16).id).toBe("BOOKIE");
  });

  it("uses generation weights without choosing after seeing the player card", () => {
    const deck = createRandomDeck(() => .5, {}, { rock: 0, paper: 0, scissors: 1 });
    expect(deck.every((card) => card.element === "scissors")).toBe(true);
  });
});
