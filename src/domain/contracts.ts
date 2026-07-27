import type { RoundHistory } from "./MatchState";
import type { RandomSource } from "./random";

export type ContractId = "HOUSE_FAVOR" | "NO_SAFE_BET" | "COLD_TABLE" | "THE_CUT";
export type ContractItemId = "loaded-coin" | "smoke-break" | "table-knock" | "house-match";

export interface ContractDefinition {
  id: ContractId;
  name: string;
  objective: string;
  reward: string;
}

export interface ContractMatchSummary {
  won: boolean;
  doubled: boolean;
  playerScore: number;
  opponentScore: number;
  history: RoundHistory[];
}

export interface ContractResult {
  id: ContractId;
  completed: boolean;
  bonusChips: number;
  multiplierLevels: number;
  freeRerolls: number;
  item: ContractItemId | null;
}

export const CONTRACTS: Record<ContractId, ContractDefinition> = {
  HOUSE_FAVOR: { id: "HOUSE_FAVOR", name: "House Favor", objective: "Win at least one hand with Paper.", reward: "+4 chips" },
  NO_SAFE_BET: { id: "NO_SAFE_BET", name: "No Safe Bet", objective: "Win the match without using Double Chip.", reward: "+1 free market reroll" },
  COLD_TABLE: { id: "COLD_TABLE", name: "Cold Table", objective: "Win the match 2–0.", reward: "+0.25 run MULT" },
  THE_CUT: { id: "THE_CUT", name: "The Cut", objective: "Win the final hand with Scissors.", reward: "+1 random run item" },
};

const ORDER: ContractId[] = ["HOUSE_FAVOR", "NO_SAFE_BET", "COLD_TABLE", "THE_CUT"];
const CUT_ITEMS: ContractItemId[] = ["loaded-coin", "smoke-break", "table-knock", "house-match"];

export function getContractForRound(round: number): ContractDefinition {
  return CONTRACTS[ORDER[(Math.max(1, round) - 1) % ORDER.length]];
}

export function evaluateContract(id: ContractId, summary: ContractMatchSummary, random: RandomSource = Math.random): ContractResult {
  let completed = false;
  if (summary.won) {
    if (id === "HOUSE_FAVOR") completed = summary.history.some((hand) => hand.winner === "PLAYER_ONE" && hand.playerOne.element === "paper");
    else if (id === "NO_SAFE_BET") completed = !summary.doubled;
    else if (id === "COLD_TABLE") completed = summary.playerScore === 2 && summary.opponentScore === 0;
    else completed = summary.history.at(-1)?.winner === "PLAYER_ONE" && summary.history.at(-1)?.playerOne.element === "scissors";
  }
  return {
    id,
    completed,
    bonusChips: completed && id === "HOUSE_FAVOR" ? 4 : 0,
    multiplierLevels: completed && id === "COLD_TABLE" ? 1 : 0,
    freeRerolls: completed && id === "NO_SAFE_BET" ? 1 : 0,
    item: completed && id === "THE_CUT"
      ? CUT_ITEMS[Math.min(CUT_ITEMS.length - 1, Math.floor(random() * CUT_ITEMS.length))]
      : null,
  };
}
