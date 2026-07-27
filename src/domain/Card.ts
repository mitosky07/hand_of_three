export type ElementType = "rock" | "paper" | "scissors";
export type PlayerId = "PLAYER_ONE" | "PLAYER_TWO";
export type CardKeyword = "HEAVY" | "MARKED" | "LUCKY" | "GUARD" | "SHARP";

export interface Card { id: string; element: ElementType; level: number; keyword?: CardKeyword; }

export const KEYWORD_DESCRIPTION: Record<CardKeyword, string> = {
  HEAVY: "+2 POWER · CANNOT FOLLOW THE SAME ELEMENT",
  MARKED: "WINNING THIS HAND ADDS +1 CHIP",
  LUCKY: "25% CHANCE TO DOUBLE ITS POWER",
  GUARD: "ON A DRAW, THIS CARD RETURNS TO YOUR HAND",
  SHARP: "A SCISSORS WIN ADDS +0.10 MATCH MULT",
};

export const ELEMENT_LABEL: Record<ElementType, string> = { rock: "ROCK", paper: "PAPER", scissors: "SCISSORS" };
export const ELEMENT_ICON: Record<ElementType, string> = { rock: "✦", paper: "▤", scissors: "✂" };
export const ELEMENT_COLOR: Record<ElementType, number> = { rock: 0xb84a55, paper: 0x197fa5, scissors: 0x8b3fc7 };
