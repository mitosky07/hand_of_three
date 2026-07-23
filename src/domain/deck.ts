import type { Card, ElementType } from "./Card";
import { cryptoRandom, type RandomSource } from "./random";

export function createDeck(upgrades: Partial<Record<ElementType, number>> = {}): Card[] {
  const elements: ElementType[] = ["rock", "paper", "scissors"];
  return elements.flatMap((element) => Array.from({ length: 10 }, (_, index) => ({ id: `${element}-${String(index + 1).padStart(2, "0")}`, element, level: index + 1 + (upgrades[element] ?? 0) })));
}

export function createRandomDeck(random: RandomSource = cryptoRandom, upgrades: Partial<Record<ElementType, number>> = {}): Card[] {
  const elements: ElementType[] = ["rock", "paper", "scissors"];
  return Array.from({ length: 30 }, (_, index) => {
    const element = elements[Math.floor(random() * elements.length)];
    const baseLevel = 1 + Math.floor(random() * 10);
    return { id: `oracle-${index + 1}-${element}-${baseLevel}`, element, level: baseLevel + (upgrades[element] ?? 0) };
  });
}
export function shuffle<T>(items: readonly T[], random: RandomSource = cryptoRandom): T[] {
  const result = [...items]; for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; } return result;
}
