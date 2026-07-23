import { describe, expect, it } from "vitest";
import { getFinishAnimationSpec } from "../src/game/animations/finishAnimation";

describe("finish animations", () => {
  it("uses a crushing impact when rock wins", () => {
    expect(getFinishAnimationSpec("rock")).toMatchObject({ kind: "CRUSH", announcement: "ROCK IMPACT!" });
  });

  it("wraps the defeated card when paper wins", () => {
    expect(getFinishAnimationSpec("paper")).toMatchObject({ kind: "WRAP", announcement: "PAPER WRAPS!" });
  });

  it("cuts the defeated card when scissors wins", () => {
    expect(getFinishAnimationSpec("scissors")).toMatchObject({ kind: "SLICE", announcement: "SCISSORS SLICE!" });
  });
});
