import type { ElementType } from "./Card";

export type OracleId = "ORACLE" | "CUTTER" | "MASON" | "BOOKIE";

export interface OracleProfile {
  id: OracleId;
  name: string;
  tagline: string;
  weights: Record<ElementType, number>;
  accent: number;
}

export const ORACLES: Record<OracleId, OracleProfile> = {
  ORACLE: { id: "ORACLE", name: "The Oracle", tagline: "Balanced · unreadable", weights: { rock: 1, paper: 1, scissors: 1 }, accent: 0xd9b867 },
  CUTTER: { id: "CUTTER", name: "The Cutter", tagline: "Scissors-heavy · sharp", weights: { rock: .7, paper: .8, scissors: 1.8 }, accent: 0x9f87a7 },
  MASON: { id: "MASON", name: "The Mason", tagline: "Rock-heavy · high power", weights: { rock: 1.8, paper: .7, scissors: .8 }, accent: 0xb8796d },
  BOOKIE: { id: "BOOKIE", name: "The Bookie", tagline: "Paper-heavy · lucky", weights: { rock: .8, paper: 1.8, scissors: .7 }, accent: 0x83aab0 },
};

const ORDER: OracleId[] = ["ORACLE", "CUTTER", "MASON", "BOOKIE"];

export function getOracleForRound(round: number): OracleProfile {
  return ORACLES[ORDER[Math.floor((Math.max(1, round) - 1) / 5) % ORDER.length]];
}
