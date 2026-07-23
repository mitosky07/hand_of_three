import type { Card, PlayerId } from "./Card";
export interface PlayerState { id: PlayerId; name: string; deck: Card[]; hand: Card[]; discardPile: Card[]; selectedCard: Card | null; score: number; }
