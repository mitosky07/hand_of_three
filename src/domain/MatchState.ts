import type { Card, PlayerId } from "./Card";
import type { PlayerState } from "./PlayerState";
import { MatchPhase } from "./MatchPhase";
export interface RoundHistory { playerOne: Card; playerTwo: Card; winner: PlayerId | null; }
export interface MatchState { phase: MatchPhase; mode: "AI" | "LOCAL"; players: Record<PlayerId, PlayerState>; round: number; history: RoundHistory[]; winner: PlayerId | null | "DRAW"; }
