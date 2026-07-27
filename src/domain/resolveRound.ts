import type { Card, PlayerId } from "./Card";
import type { RandomSource } from "./random";
export type RoundReason = "ELEMENT_ADVANTAGE" | "HIGHER_LEVEL" | "EXACT_TIE";
export interface RoundResult {
  winner: PlayerId | null;
  reason: RoundReason;
  effectiveLevels?: { PLAYER_ONE: number; PLAYER_TWO: number };
  luckyTriggered?: PlayerId[];
}
const beats = { rock: "scissors", scissors: "paper", paper: "rock" } as const;
export function resolveRound(cardA: Card, cardB: Card, random: RandomSource = Math.random): RoundResult {
  const luckyTriggered: PlayerId[] = [];
  const levelA = cardA.keyword === "LUCKY" && random() < .25 ? (luckyTriggered.push("PLAYER_ONE"), cardA.level * 2) : cardA.level;
  const levelB = cardB.keyword === "LUCKY" && random() < .25 ? (luckyTriggered.push("PLAYER_TWO"), cardB.level * 2) : cardB.level;
  const extras = { effectiveLevels: { PLAYER_ONE: levelA, PLAYER_TWO: levelB }, luckyTriggered };
  if (cardA.element === cardB.element) {
    if (levelA === levelB) return { winner: null, reason: "EXACT_TIE", ...extras };
    return { winner: levelA > levelB ? "PLAYER_ONE" : "PLAYER_TWO", reason: "HIGHER_LEVEL", ...extras };
  }
  return { winner: beats[cardA.element] === cardB.element ? "PLAYER_ONE" : "PLAYER_TWO", reason: "ELEMENT_ADVANTAGE", ...extras };
}
