import { dailySeed } from "../domain/random";

const KEY = "hand-of-three-daily-v1";

export interface DailyState {
  date: string;
  round: number;
  chips: number;
  bestRound: number;
  bestChips: number;
  upgrades: { rock: number; paper: number; scissors: number };
  multiplierLevel: number;
}

export interface DailyReward {
  won: boolean;
  earned: number;
  roundBefore: number;
  roundAfter: number;
  state: DailyState;
}

function fresh(): DailyState {
  return { date: dailySeed(), round: 1, chips: 0, bestRound: 1, bestChips: 0, upgrades: { rock: 0, paper: 0, scissors: 0 }, multiplierLevel: 0 };
}

class DailyService {
  get(): DailyState {
    try {
      const stored = JSON.parse(localStorage.getItem(KEY) ?? "null") as Partial<DailyState> | null;
      if (!stored || stored.date !== dailySeed()) return fresh();
      return {
        date: stored.date,
        round: Math.max(1, Number(stored.round) || 1),
        chips: Math.max(0, Number(stored.chips) || 0),
        bestRound: Math.max(1, Number(stored.bestRound) || 1),
        bestChips: Math.max(0, Number(stored.bestChips) || 0),
        upgrades: {
          rock: Math.max(0, Number(stored.upgrades?.rock) || 0),
          paper: Math.max(0, Number(stored.upgrades?.paper) || 0),
          scissors: Math.max(0, Number(stored.upgrades?.scissors) || 0),
        },
        multiplierLevel: Math.max(0, Number(stored.multiplierLevel) || 0),
      };
    } catch { return fresh(); }
  }

  finish(won: boolean): DailyReward {
    const current = this.get();
    const earned = won ? Math.floor((3 + Math.floor((current.round - 1) / 5)) * (1 + current.multiplierLevel * .25)) : 0;
    const roundAfter = won ? current.round + 1 : 1;
    const chips = won ? current.chips + earned : 0;
    const state: DailyState = {
      ...current,
      round: roundAfter,
      chips,
      bestRound: Math.max(current.bestRound, roundAfter),
      bestChips: Math.max(current.bestChips, chips),
      upgrades: won ? current.upgrades : { rock: 0, paper: 0, scissors: 0 },
      multiplierLevel: won ? current.multiplierLevel : 0,
    };
    localStorage.setItem(KEY, JSON.stringify(state));
    return { won, earned, roundBefore: current.round, roundAfter, state };
  }

  buy(id: DailyOfferId, price: number): boolean {
    const current = this.get();
    if (current.chips < price) return false;
    const next: DailyState = { ...current, chips: current.chips - price, upgrades: { ...current.upgrades } };
    if (id === "MULT") next.multiplierLevel++;
    else next.upgrades[id.toLowerCase() as "rock" | "paper" | "scissors"]++;
    localStorage.setItem(KEY, JSON.stringify(next));
    return true;
  }
}

export const dailyService = new DailyService();

export type DailyOfferId = "ROCK" | "PAPER" | "SCISSORS" | "MULT";
export interface DailyOffer { id: DailyOfferId; name: string; description: string; price: number; }

export function dailyOffers(round: number, seed = dailySeed()): DailyOffer[] {
  const offers: DailyOffer[] = [
    { id: "ROCK", name: "Stone polish", description: "+1 Rock level for this daily run.", price: 4 },
    { id: "PAPER", name: "Marked stock", description: "+1 Paper level for this daily run.", price: 4 },
    { id: "SCISSORS", name: "Fresh edge", description: "+1 Scissors level for this daily run.", price: 4 },
    { id: "MULT", name: "House odds", description: "+0.25 daily score MULT.", price: 6 },
  ];
  const hash = [...`${seed}-${round}`].reduce((value, char) => Math.imul(value ^ char.charCodeAt(0), 16777619), 2166136261);
  const shift = Math.abs(hash) % offers.length;
  return offers.map((_, index) => offers[(index + shift) % offers.length]);
}
