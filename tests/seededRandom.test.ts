import { describe, expect, it } from "vitest";
import { createSeededRandom, dailySeed } from "../src/domain/random";
import { dailyOffers } from "../src/services/dailyService";

describe("daily seeded RNG", () => {
  it("replays the same sequence from the same seed", () => {
    const one = createSeededRandom("2026-07-26-round-1");
    const two = createSeededRandom("2026-07-26-round-1");
    expect(Array.from({ length: 20 }, one)).toEqual(Array.from({ length: 20 }, two));
  });

  it("formats the daily seed in UTC", () => {
    expect(dailySeed(new Date("2026-07-26T23:59:00Z"))).toBe("2026-07-26");
  });

  it("keeps daily market offers deterministic", () => {
    expect(dailyOffers(4, "2026-07-26")).toEqual(dailyOffers(4, "2026-07-26"));
    expect(dailyOffers(4, "2026-07-26")).toHaveLength(4);
  });
});
