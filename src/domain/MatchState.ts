import type { Card, ElementType, PlayerId } from "./Card";
import type { PlayerState } from "./PlayerState";
import { MatchPhase } from "./MatchPhase";
export interface RoundHistory { playerOne: Card; playerTwo: Card; winner: PlayerId | null; }
export interface MatchState {
  phase: MatchPhase;
  mode: "AI" | "LOCAL";
  players: Record<PlayerId, PlayerState>;
  round: number;
  history: RoundHistory[];
  winner: PlayerId | null | "DRAW";
  lastPlayedElement: Partial<Record<PlayerId, ElementType>>;
  bonusChips: number;
  bonusMultiplier: number;
  wasBehind: boolean;
}
