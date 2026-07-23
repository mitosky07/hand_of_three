export type MenuCommand = "PREVIOUS" | "NEXT" | "ACTIVATE" | null;
export type MatchCommand = "PREVIOUS_CARD" | "NEXT_CARD" | "CONFIRM" | "CANCEL" | "PAUSE" | "DIRECT_CARD" | null;

export function getMenuCommand(key: string): MenuCommand {
  const normalized = key.toLowerCase();
  if (["arrowup", "arrowleft", "w", "a"].includes(normalized)) return "PREVIOUS";
  if (["arrowdown", "arrowright", "s", "d"].includes(normalized)) return "NEXT";
  if (["enter", " ", "spacebar"].includes(normalized)) return "ACTIVATE";
  return null;
}

export function getMatchCommand(key: string): MatchCommand {
  const normalized = key.toLowerCase();
  if (["arrowleft", "a"].includes(normalized)) return "PREVIOUS_CARD";
  if (["arrowright", "d"].includes(normalized)) return "NEXT_CARD";
  if (["arrowup", "w", "enter", " ", "spacebar"].includes(normalized)) return "CONFIRM";
  if (["arrowdown", "s"].includes(normalized)) return "CANCEL";
  if (normalized === "escape") return "PAUSE";
  if (/^[1-5]$/.test(normalized)) return "DIRECT_CARD";
  return null;
}
