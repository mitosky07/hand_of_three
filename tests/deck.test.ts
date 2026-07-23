import { describe, expect, it } from "vitest";
import { createDeck, createRandomDeck, shuffle } from "../src/domain/deck";

describe("deck", () => {
  it("creates thirty unique cards", () => {
    const deck = createDeck();
    expect(deck).toHaveLength(30);
    expect(new Set(deck.map((card) => card.id)).size).toBe(30);
  });

  it("does not mutate while shuffling", () => {
    const deck = createDeck();
    const shuffled = shuffle(deck, () => 0);
    expect(deck[0].id).toBe("rock-01");
    expect(shuffled).not.toBe(deck);
  });

  it("applies run upgrades by element", () => {
    const deck = createDeck({ rock: 2, paper: 1 });
    expect(deck.find((card) => card.id === "rock-01")?.level).toBe(3);
    expect(deck.find((card) => card.id === "paper-10")?.level).toBe(11);
    expect(deck.find((card) => card.id === "scissors-01")?.level).toBe(1);
  });

  it("generates the Oracle deck from RNG", () => {
    const values = [0, .99, .34, .1, .67, .8]; let index = 0;
    const deck = createRandomDeck(() => values[index++ % values.length]);
    expect(deck).toHaveLength(30);
    expect(deck[0]).toMatchObject({ element: "rock", level: 10 });
    expect(deck[1]).toMatchObject({ element: "paper", level: 2 });
    expect(new Set(deck.map((card) => card.id)).size).toBe(30);
  });
});
