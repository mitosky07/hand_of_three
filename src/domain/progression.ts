import type { ElementType } from "./Card";

export type RelicId = "stone-idol" | "paper-crown" | "silver-shears" | "golden-chip";
export type ShopItemId = "upgrade-rock" | "upgrade-paper" | "upgrade-scissors" | "multiplier" | "double-token" | RelicId;

export interface RunState {
  round: number;
  wins: number;
  losses: number;
  upgrades: Record<ElementType, number>;
  multiplierLevel: number;
  relics: RelicId[];
  doubleTokens: number;
}

export interface PlayerProgress {
  version: 2;
  chips: number;
  totalWins: number;
  bestRound: number;
  totalEarned: number;
  run: RunState;
}

export interface ShopItem {
  id: ShopItemId;
  name: string;
  category: "UPGRADE" | "RELIC" | "ITEM" | "MULT";
  description: string;
  price: number;
  color: "red" | "blue" | "purple" | "orange" | "green";
  iconFrame: number;
  available: boolean;
}

export interface RoundReward {
  won: boolean;
  runEnded: boolean;
  base: number;
  multiplier: number;
  doubled: boolean;
  earned: number;
  roundBefore: number;
  roundAfter: number;
}

export const MAX_UPGRADE_LEVEL = 3;
export const MAX_MULTIPLIER_LEVEL = 4;
export const MAX_RELICS = 3;

export function createDefaultRun(): RunState {
  return { round: 1, wins: 0, losses: 0, upgrades: { rock: 0, paper: 0, scissors: 0 }, multiplierLevel: 0, relics: [], doubleTokens: 0 };
}

export function createDefaultProgress(): PlayerProgress {
  return { version: 2, chips: 0, totalWins: 0, bestRound: 1, totalEarned: 0, run: createDefaultRun() };
}

export function normalizeProgress(value: unknown): PlayerProgress {
  const base = createDefaultProgress();
  if (!value || typeof value !== "object") return base;
  const source = value as Record<string, unknown>;
  const number = (input: unknown, fallback = 0) => typeof input === "number" && Number.isFinite(input) ? Math.max(0, Math.floor(input)) : fallback;
  const legacyUpgrades = typeof source.upgrades === "object" && source.upgrades ? source.upgrades as Record<string, unknown> : {};
  const runSource = typeof source.run === "object" && source.run ? source.run as Record<string, unknown> : {};
  const upgradesSource = typeof runSource.upgrades === "object" && runSource.upgrades ? runSource.upgrades as Record<string, unknown> : legacyUpgrades;
  const rawRelics = Array.isArray(runSource.relics) ? runSource.relics : Array.isArray(source.relics) ? source.relics : [];
  const relics = rawRelics.filter((id): id is RelicId => typeof id === "string" && ["stone-idol", "paper-crown", "silver-shears", "golden-chip"].includes(id));
  const legacyWins = number(source.victories);
  const runRound = Math.max(1, number(runSource.round, 1));
  return {
    version: 2,
    chips: number(source.chips),
    totalWins: number(source.totalWins, legacyWins),
    bestRound: Math.max(1, number(source.bestRound, Math.max(1, legacyWins + 1))),
    totalEarned: number(source.totalEarned),
    run: {
      round: runRound,
      wins: number(runSource.wins, legacyWins),
      losses: number(runSource.losses),
      upgrades: {
        rock: Math.min(MAX_UPGRADE_LEVEL, number(upgradesSource.rock)),
        paper: Math.min(MAX_UPGRADE_LEVEL, number(upgradesSource.paper)),
        scissors: Math.min(MAX_UPGRADE_LEVEL, number(upgradesSource.scissors)),
      },
      multiplierLevel: Math.min(MAX_MULTIPLIER_LEVEL, number(runSource.multiplierLevel, number(source.multiplierLevel))),
      relics: [...new Set(relics)].slice(0, MAX_RELICS),
      doubleTokens: number(runSource.doubleTokens, number(source.doubleTokens)),
    },
  };
}

export function getRewardMultiplier(progress: PlayerProgress, element?: ElementType): number {
  let multiplier = 1 + progress.run.multiplierLevel * .25;
  if (element === "rock" && progress.run.relics.includes("stone-idol")) multiplier += .35;
  if (element === "paper" && progress.run.relics.includes("paper-crown")) multiplier += .35;
  if (element === "scissors" && progress.run.relics.includes("silver-shears")) multiplier += .35;
  return Math.round(multiplier * 100) / 100;
}

export function resolveRunRound(progress: PlayerProgress, won: boolean, element: ElementType, doubled = false): { progress: PlayerProgress; reward: RoundReward } {
  const roundBefore = progress.run.round;
  const base = 3 + Math.floor((roundBefore - 1) / 5) + (progress.run.relics.includes("golden-chip") ? 1 : 0);
  const multiplier = getRewardMultiplier(progress, element);
  const earned = won ? Math.max(1, Math.floor(base * multiplier * (doubled ? 2 : 1))) : 0;
  const roundAfter = won ? roundBefore + 1 : 1;
  const next: PlayerProgress = won
    ? {
      ...progress,
      chips: progress.chips + earned,
      totalWins: progress.totalWins + 1,
      totalEarned: progress.totalEarned + earned,
      bestRound: Math.max(progress.bestRound, roundAfter),
      run: { ...progress.run, round: roundAfter, wins: progress.run.wins + 1 },
    }
    : { ...progress, chips: 0, run: createDefaultRun() };
  return { progress: next, reward: { won, runEnded: !won, base, multiplier, doubled, earned, roundBefore, roundAfter } };
}

export function buildShopCatalog(progress: PlayerProgress): ShopItem[] {
  const run = progress.run;
  const elementName: Record<ElementType, string> = { rock: "Rock", paper: "Paper", scissors: "Scissors" };
  const upgrade = (element: ElementType, name: string, color: ShopItem["color"], iconFrame: number): ShopItem => ({ id: `upgrade-${element}` as ShopItemId, name, category: "UPGRADE", description: `+1 level to every ${elementName[element]} card for this run.`, price: 8 + run.upgrades[element] * 6, color, iconFrame, available: run.upgrades[element] < MAX_UPGRADE_LEVEL });
  return [
    upgrade("rock", "Polished rock", "red", 0), upgrade("paper", "Marked paper", "blue", 1), upgrade("scissors", "Master edge", "purple", 2),
    { id: "multiplier", name: "Golden table", category: "MULT", description: "+0.25 MULT for this run.", price: 12 + run.multiplierLevel * 8, color: "orange", iconFrame: 3, available: run.multiplierLevel < MAX_MULTIPLIER_LEVEL },
    { id: "double-token", name: "Double chip", category: "ITEM", description: "Use before playing: x2 chips if you win.", price: 6, color: "green", iconFrame: 4, available: true },
    { id: "stone-idol", name: "Stone idol", category: "RELIC", description: "+0.35 MULT when Rock wins.", price: 16, color: "red", iconFrame: 0, available: !run.relics.includes("stone-idol") && run.relics.length < MAX_RELICS },
    { id: "paper-crown", name: "Paper crown", category: "RELIC", description: "+0.35 MULT when Paper wins.", price: 16, color: "blue", iconFrame: 1, available: !run.relics.includes("paper-crown") && run.relics.length < MAX_RELICS },
    { id: "silver-shears", name: "Silver shears", category: "RELIC", description: "+0.35 MULT when Scissors wins.", price: 16, color: "purple", iconFrame: 2, available: !run.relics.includes("silver-shears") && run.relics.length < MAX_RELICS },
    { id: "golden-chip", name: "Golden chip", category: "RELIC", description: "+1 base chip per victory.", price: 18, color: "orange", iconFrame: 5, available: !run.relics.includes("golden-chip") && run.relics.length < MAX_RELICS },
  ];
}

export function generateShopOffers(progress: PlayerProgress, count = 4, random: () => number = Math.random): ShopItem[] {
  const pool = buildShopCatalog(progress).filter((item) => item.available);
  for (let index = pool.length - 1; index > 0; index--) { const target = Math.floor(random() * (index + 1)); [pool[index], pool[target]] = [pool[target], pool[index]]; }
  return pool.slice(0, count);
}

export function purchaseShopItem(progress: PlayerProgress, id: ShopItemId): { progress: PlayerProgress; success: boolean; message: string } {
  const item = buildShopCatalog(progress).find((candidate) => candidate.id === id);
  if (!item || !item.available) return { progress, success: false, message: "SOLD OUT" };
  if (progress.chips < item.price) return { progress, success: false, message: "NOT ENOUGH CHIPS" };
  const next: PlayerProgress = { ...progress, chips: progress.chips - item.price, run: { ...progress.run, upgrades: { ...progress.run.upgrades }, relics: [...progress.run.relics] } };
  if (id.startsWith("upgrade-")) next.run.upgrades[id.replace("upgrade-", "") as ElementType]++;
  else if (id === "multiplier") next.run.multiplierLevel++;
  else if (id === "double-token") next.run.doubleTokens++;
  else next.run.relics.push(id as RelicId);
  return { progress: next, success: true, message: "PURCHASED" };
}

export function spendChips(progress: PlayerProgress, amount: number): PlayerProgress | null { return progress.chips >= amount ? { ...progress, chips: progress.chips - amount } : null; }
export function consumeDoubleToken(progress: PlayerProgress): PlayerProgress | null { return progress.run.doubleTokens > 0 ? { ...progress, run: { ...progress.run, doubleTokens: progress.run.doubleTokens - 1 } } : null; }
