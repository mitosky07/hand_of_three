import type { Card } from "../domain/Card";

export type OnlineSeat = "PLAYER_ONE" | "PLAYER_TWO";
export type OnlinePhase = "WAITING_FOR_PLAYER" | "SELECTING" | "WAITING_FOR_OPPONENT" | "ROUND_RESULT" | "MATCH_FINISHED";

export interface OnlineRoundResult {
  yourCard: Card;
  opponentCard: Card;
  winner: "YOU" | "OPPONENT" | "DRAW";
  reason: "ELEMENT_ADVANTAGE" | "HIGHER_LEVEL" | "EXACT_TIE";
}

export interface OnlineMatchView {
  roomCode: string;
  phase: OnlinePhase;
  round: number;
  hand: Card[];
  opponentHandCount: number;
  yourScore: number;
  opponentScore: number;
  yourName: string;
  opponentName: string;
  selectedCardId: string | null;
  result: OnlineRoundResult | null;
}

export type ClientMessage =
  | { type: "CREATE_ROOM"; name: string }
  | { type: "JOIN_ROOM"; code: string; name: string }
  | { type: "PLAY_CARD"; cardId: string }
  | { type: "REMATCH" }
  | { type: "LEAVE_ROOM" };

export type ServerMessage =
  | { type: "JOINED"; seat: OnlineSeat; view: OnlineMatchView }
  | { type: "STATE"; view: OnlineMatchView }
  | { type: "ERROR"; message: string }
  | { type: "OPPONENT_LEFT" };

export function parseClientMessage(input: unknown): ClientMessage | null {
  if (!input || typeof input !== "object") return null;
  const value = input as Record<string, unknown>;
  const cleanName = (name: string) => name.replace(/[^\p{L}\p{N} _-]/gu, "").trim().slice(0, 18);
  if (value.type === "CREATE_ROOM" && typeof value.name === "string") return { type: value.type, name: cleanName(value.name) };
  if (value.type === "JOIN_ROOM" && typeof value.code === "string" && typeof value.name === "string") return { type: value.type, code: value.code.toUpperCase().replace(/[^A-Z2-9]/g, "").slice(0, 5), name: cleanName(value.name) };
  if (value.type === "PLAY_CARD" && typeof value.cardId === "string") return { type: value.type, cardId: value.cardId };
  if (value.type === "REMATCH" || value.type === "LEAVE_ROOM") return { type: value.type };
  return null;
}
