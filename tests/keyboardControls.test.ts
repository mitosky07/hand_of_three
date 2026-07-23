import { describe, expect, it } from "vitest";
import { getMatchCommand, getMenuCommand } from "../src/game/input/keyboardControls";

describe("keyboard controls", () => {
  it("maps WASD and arrow keys across menus", () => {
    for (const key of ["w", "a", "ArrowUp", "ArrowLeft"]) expect(getMenuCommand(key)).toBe("PREVIOUS");
    for (const key of ["s", "d", "ArrowDown", "ArrowRight"]) expect(getMenuCommand(key)).toBe("NEXT");
    expect(getMenuCommand("Enter")).toBe("ACTIVATE");
    expect(getMenuCommand(" ")).toBe("ACTIVATE");
  });

  it("maps both keyboard layouts during a match", () => {
    expect(getMatchCommand("a")).toBe("PREVIOUS_CARD");
    expect(getMatchCommand("ArrowLeft")).toBe("PREVIOUS_CARD");
    expect(getMatchCommand("d")).toBe("NEXT_CARD");
    expect(getMatchCommand("ArrowRight")).toBe("NEXT_CARD");
    expect(getMatchCommand("w")).toBe("CONFIRM");
    expect(getMatchCommand("ArrowUp")).toBe("CONFIRM");
    expect(getMatchCommand("s")).toBe("CANCEL");
    expect(getMatchCommand("ArrowDown")).toBe("CANCEL");
    expect(getMatchCommand("Escape")).toBe("PAUSE");
    expect(getMatchCommand("3")).toBe("DIRECT_CARD");
  });
});
