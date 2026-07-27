import type { Card, CardKeyword, ElementType } from "./Card";
import { cryptoRandom, type RandomSource } from "./random";

export function createDeck(upgrades: Partial<Record<ElementType, number>> = {}): Card[] {
  const elements: ElementType[] = ["rock", "paper", "scissors"];
  return elements.flatMap((element) => Array.from({ length: 10 }, (_, index) => ({ id: `${element}-${String(index + 1).padStart(2, "0")}`, element, level: index + 1 + (upgrades[element] ?? 0) })));
}

export function createRandomDeck(random: RandomSource = cryptoRandom, upgrades: Partial<Record<ElementType, number>> = {}, weights: Partial<Record<ElementType, number>> = {}): Card[] {
  const elements: ElementType[] = ["rock", "paper", "scissors"];
  const weighted = elements.map((element) => ({ element, weight: Math.max(0, weights[element] ?? 1) }));
  const totalWeight = weighted.reduce((total, item) => total + item.weight, 0) || 3;
  return Array.from({ length: 30 }, (_, index) => {
    let roll = random() * totalWeight;
    const element = weighted.find((item) => (roll -= item.weight) <= 0)?.element ?? "scissors";
    const baseLevel = 1 + Math.floor(random() * 10);
    return { id: `oracle-${index + 1}-${element}-${baseLevel}`, element, level: baseLevel + (upgrades[element] ?? 0) };
  });
}

const KEYWORDS: CardKeyword[] = ["HEAVY", "MARKED", "LUCKY", "GUARD", "SHARP"];

export function addKeywords(cards: readonly Card[], random: RandomSource = cryptoRandom, chance = .2): Card[] {
  return cards.map((card) => {
    if (random() >= chance) return { ...card };
    const keyword = KEYWORDS[Math.floor(random() * KEYWORDS.length)];
    return { ...card, keyword, level: keyword === "HEAVY" ? card.level + 2 : card.level };
  });
}
export function shuffle<T>(items: readonly T[], random: RandomSource = cryptoRandom): T[] {
  const result = [...items]; for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; } return result;
}
