import type { ElementType } from "../../domain/Card";

export type FinishAnimationKind = "CRUSH" | "WRAP" | "SLICE";

export interface FinishAnimationSpec {
  kind: FinishAnimationKind;
  announcement: string;
  durationMs: number;
}

const FINISH_ANIMATIONS: Record<ElementType, FinishAnimationSpec> = {
  rock: { kind: "CRUSH", announcement: "ROCK IMPACT!", durationMs: 620 },
  paper: { kind: "WRAP", announcement: "PAPER WRAPS!", durationMs: 620 },
  scissors: { kind: "SLICE", announcement: "SCISSORS SLICE!", durationMs: 560 },
};

export function getFinishAnimationSpec(element: ElementType): FinishAnimationSpec {
  return FINISH_ANIMATIONS[element];
}
