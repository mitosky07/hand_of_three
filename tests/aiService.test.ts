import { describe, expect, it } from "vitest";
import { chooseRandomCard } from "../src/services/aiService";

const hand = [
  { id: "rock-01", element: "rock" as const, level: 1 },
  { id: "paper-05", element: "paper" as const, level: 5 },
  { id: "scissors-10", element: "scissors" as const, level: 10 },
];

describe("chooseRandomCard", () => {
  it("can choose either end of the hand", () => {
    expect(chooseRandomCard(hand, () => 0).id).toBe("rock-01");
    expect(chooseRandomCard(hand, () => .999999).id).toBe("scissors-10");
  });

  it("rejects an empty hand", () => {
    expect(() => chooseRandomCard([], () => 0)).toThrow("empty hand");
  });
});
