export type ElementType = "rock" | "paper" | "scissors";
export type PlayerId = "PLAYER_ONE" | "PLAYER_TWO";

export interface Card { id: string; element: ElementType; level: number; }

export const ELEMENT_LABEL: Record<ElementType, string> = { rock: "ROCK", paper: "PAPER", scissors: "SCISSORS" };
export const ELEMENT_ICON: Record<ElementType, string> = { rock: "✦", paper: "▤", scissors: "✂" };
export const ELEMENT_COLOR: Record<ElementType, number> = { rock: 0xb84a55, paper: 0x197fa5, scissors: 0x8b3fc7 };
