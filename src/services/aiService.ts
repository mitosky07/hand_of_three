import type { Card } from "../domain/Card";
import { cryptoRandom, type RandomSource } from "../domain/random";

export function chooseRandomCard(hand: readonly Card[], random: RandomSource = cryptoRandom): Card {
  if (!hand.length) throw new Error("The AI cannot choose from an empty hand.");
  return hand[Math.floor(random() * hand.length)];
}
