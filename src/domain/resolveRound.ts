import type { Card, PlayerId } from "./Card";
export type RoundReason = "ELEMENT_ADVANTAGE" | "HIGHER_LEVEL" | "EXACT_TIE";
export interface RoundResult { winner: PlayerId | null; reason: RoundReason; }
const beats = { rock: "scissors", scissors: "paper", paper: "rock" } as const;
export function resolveRound(cardA: Card, cardB: Card): RoundResult {
  if (cardA.element === cardB.element) {
    if (cardA.level === cardB.level) return { winner: null, reason: "EXACT_TIE" };
    return { winner: cardA.level > cardB.level ? "PLAYER_ONE" : "PLAYER_TWO", reason: "HIGHER_LEVEL" };
  }
  return { winner: beats[cardA.element] === cardB.element ? "PLAYER_ONE" : "PLAYER_TWO", reason: "ELEMENT_ADVANTAGE" };
}
