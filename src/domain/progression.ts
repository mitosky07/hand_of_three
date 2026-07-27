import type { ElementType } from "./Card";
import type { ContractId, ContractResult } from "./contracts";
import { unlockedCardBacks, unlockedChipStyles, unlockedFelts, unlockedPortraits, unlockedVictoryStamps, type CardBackId, type ChipStyleId, type FeltCosmeticId, type PortraitId, type VictoryStampId } from "./cosmetics";

export type RelicId = "stone-idol" | "paper-crown" | "silver-shears" | "golden-chip" | "brass-knuckles" | "carbon-paper" | "red-thread" | "dealers-eye";
export type RunItemId = "loaded-coin" | "smoke-break" | "table-knock" | "house-match";
export type ShopItemId = "upgrade-rock" | "upgrade-paper" | "upgrade-scissors" | "multiplier" | "double-token" | RunItemId | RelicId;

export interface RunState {
  round: number;
  wins: number;
  losses: number;
  upgrades: Record<ElementType, number>;
  multiplierLevel: number;
  relics: RelicId[];
  doubleTokens: number;
  freeRerolls: number;
  activeContract: ContractId | null;
  items: Record<RunItemId, number>;
}

export interface PlayerProgress {
  version: 5;
  chips: number;
  totalWins: number;
  bestRound: number;
  totalEarned: number;
  run: RunState;
  unlockedFelts: FeltCosmeticId[];
  selectedFelt: FeltCosmeticId;
  unlockedCardBacks: CardBackId[];
  selectedCardBack: CardBackId;
  unlockedChipStyles: ChipStyleId[];
  selectedChipStyle: ChipStyleId;
  unlockedVictoryStamps: VictoryStampId[];
  selectedVictoryStamp: VictoryStampId;
  unlockedPortraits: PortraitId[];
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
  bonusChips: number;
  bonusMultiplier: number;
  contractId: ContractId | null;
  contractCompleted: boolean;
  contractReward: string;
}

export const MAX_UPGRADE_LEVEL = 3;
export const MAX_MULTIPLIER_LEVEL = 4;
export const MAX_RELICS = 3;
export const MAX_RUN_ITEMS = 3;

export function createDefaultRun(): RunState {
  return { round: 1, wins: 0, losses: 0, upgrades: { rock: 0, paper: 0, scissors: 0 }, multiplierLevel: 0, relics: [], doubleTokens: 0, freeRerolls: 0, activeContract: null, items: { "loaded-coin": 0, "smoke-break": 0, "table-knock": 0, "house-match": 0 } };
}

export function createDefaultProgress(): PlayerProgress {
  return {
    version: 5,
    chips: 0,
    totalWins: 0,
    bestRound: 1,
    totalEarned: 0,
    run: createDefaultRun(),
    unlockedFelts: ["CLASSIC_FELT"],
    selectedFelt: "CLASSIC_FELT",
    unlockedCardBacks: ["HOUSE_BACK"],
    selectedCardBack: "HOUSE_BACK",
    unlockedChipStyles: ["BRASS_CHIP"],
    selectedChipStyle: "BRASS_CHIP",
    unlockedVictoryStamps: ["THREE_SEAL"],
    selectedVictoryStamp: "THREE_SEAL",
    unlockedPortraits: ["ORACLE_PORTRAIT"],
  };
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
  const relicIds: RelicId[] = ["stone-idol", "paper-crown", "silver-shears", "golden-chip", "brass-knuckles", "carbon-paper", "red-thread", "dealers-eye"];
  const relics = rawRelics.filter((id): id is RelicId => typeof id === "string" && relicIds.includes(id as RelicId));
  const itemsSource = typeof runSource.items === "object" && runSource.items ? runSource.items as Record<string, unknown> : {};
  const legacyWins = number(source.victories);
  const runRound = Math.max(1, number(runSource.round, 1));
  const totalWins = number(source.totalWins, legacyWins);
  const unlocked = unlockedFelts(totalWins);
  const selected = typeof source.selectedFelt === "string" && unlocked.includes(source.selectedFelt as FeltCosmeticId) ? source.selectedFelt as FeltCosmeticId : "CLASSIC_FELT";
  const bestRound = Math.max(1, number(source.bestRound, Math.max(1, legacyWins + 1)));
  const cardBacks = unlockedCardBacks(totalWins);
  const chipStyles = unlockedChipStyles(totalWins);
  const victoryStamps = unlockedVictoryStamps(totalWins);
  let remainingItemSlots = MAX_RUN_ITEMS;
  const normalizedItems = (["loaded-coin", "smoke-break", "table-knock", "house-match"] as const).reduce<Record<RunItemId, number>>((items, id) => {
    const count = Math.min(remainingItemSlots, number(itemsSource[id]));
    items[id] = count;
    remainingItemSlots -= count;
    return items;
  }, { "loaded-coin": 0, "smoke-break": 0, "table-knock": 0, "house-match": 0 });
  return {
    version: 5,
    chips: number(source.chips),
    totalWins,
    bestRound,
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
      freeRerolls: number(runSource.freeRerolls),
      activeContract: typeof runSource.activeContract === "string" && ["HOUSE_FAVOR", "NO_SAFE_BET", "COLD_TABLE", "THE_CUT"].includes(runSource.activeContract) ? runSource.activeContract as ContractId : null,
      items: normalizedItems,
    },
    unlockedFelts: unlocked,
    selectedFelt: selected,
    unlockedCardBacks: cardBacks,
    selectedCardBack: typeof source.selectedCardBack === "string" && cardBacks.includes(source.selectedCardBack as CardBackId) ? source.selectedCardBack as CardBackId : "HOUSE_BACK",
    unlockedChipStyles: chipStyles,
    selectedChipStyle: typeof source.selectedChipStyle === "string" && chipStyles.includes(source.selectedChipStyle as ChipStyleId) ? source.selectedChipStyle as ChipStyleId : "BRASS_CHIP",
    unlockedVictoryStamps: victoryStamps,
    selectedVictoryStamp: typeof source.selectedVictoryStamp === "string" && victoryStamps.includes(source.selectedVictoryStamp as VictoryStampId) ? source.selectedVictoryStamp as VictoryStampId : "THREE_SEAL",
    unlockedPortraits: unlockedPortraits(bestRound),
  };
}

export function getRewardMultiplier(progress: PlayerProgress, element?: ElementType): number {
  let multiplier = 1 + progress.run.multiplierLevel * .25;
  if (element === "rock" && progress.run.relics.includes("stone-idol")) multiplier += .35;
  if (element === "paper" && progress.run.relics.includes("paper-crown")) multiplier += .35;
  if (element === "scissors" && progress.run.relics.includes("silver-shears")) multiplier += .35;
  return Math.round(multiplier * 100) / 100;
}

export function resolveRunRound(progress: PlayerProgress, won: boolean, element: ElementType, doubled = false, bonusChips = 0, bonusMultiplier = 0, contract?: ContractResult): { progress: PlayerProgress; reward: RoundReward } {
  const roundBefore = progress.run.round;
  const runItemCount = Object.values(progress.run.items).reduce((total, count) => total + count, 0);
  const contractItem = contract?.item && runItemCount < MAX_RUN_ITEMS ? contract.item : null;
  const itemFallbackReroll = Boolean(contract?.completed && contract?.item && !contractItem);
  const base = 3 + Math.floor((roundBefore - 1) / 5) + (progress.run.relics.includes("golden-chip") ? 1 : 0);
  const multiplier = Math.round((getRewardMultiplier(progress, element) + bonusMultiplier) * 100) / 100;
  const contractChips = contract?.bonusChips ?? 0;
  const earned = won ? Math.max(1, Math.floor((base * multiplier + bonusChips + contractChips) * (doubled ? 2 : 1))) : 0;
  const roundAfter = won ? roundBefore + 1 : 1;
  const totalWins = progress.totalWins + (won ? 1 : 0);
  const next: PlayerProgress = won
    ? {
      ...progress,
      chips: progress.chips + earned,
      totalWins,
      totalEarned: progress.totalEarned + earned,
      bestRound: Math.max(progress.bestRound, roundAfter),
      run: {
        ...progress.run,
        round: roundAfter,
        wins: progress.run.wins + 1,
        multiplierLevel: Math.min(MAX_MULTIPLIER_LEVEL, progress.run.multiplierLevel + (contract?.multiplierLevels ?? 0)),
        freeRerolls: progress.run.freeRerolls + (contract?.freeRerolls ?? 0) + (itemFallbackReroll ? 1 : 0) + (progress.run.relics.includes("dealers-eye") ? 1 : 0),
        activeContract: null,
        items: contractItem
          ? {
            ...progress.run.items,
            [contractItem]: progress.run.items[contractItem] + 1,
          }
          : progress.run.items,
        upgrades: {
          ...progress.run.upgrades,
          rock: element === "rock" && progress.run.relics.includes("brass-knuckles")
            ? Math.min(MAX_UPGRADE_LEVEL, progress.run.upgrades.rock + 1)
            : progress.run.upgrades.rock,
        },
      },
      unlockedFelts: unlockedFelts(totalWins),
      unlockedCardBacks: unlockedCardBacks(totalWins),
      unlockedChipStyles: unlockedChipStyles(totalWins),
      unlockedVictoryStamps: unlockedVictoryStamps(totalWins),
      unlockedPortraits: unlockedPortraits(Math.max(progress.bestRound, roundAfter)),
    }
    : { ...progress, chips: 0, run: createDefaultRun() };
  const contractReward = contract?.completed
    ? contract.bonusChips ? "+4 CHIPS" : contract.multiplierLevels ? "+0.25 MULT" : contractItem ? `+1 ${contractItem.replaceAll("-", " ").toUpperCase()}` : "+1 FREE REROLL"
    : "";
  return { progress: next, reward: { won, runEnded: !won, base, multiplier, doubled, earned, roundBefore, roundAfter, bonusChips: bonusChips + contractChips, bonusMultiplier, contractId: contract?.id ?? null, contractCompleted: Boolean(contract?.completed), contractReward } };
}

export function acceptContract(progress: PlayerProgress, id: ContractId): PlayerProgress {
  return { ...progress, run: { ...progress.run, activeContract: id } };
}

export function clearContract(progress: PlayerProgress): PlayerProgress {
  return { ...progress, run: { ...progress.run, activeContract: null } };
}

export function consumeFreeReroll(progress: PlayerProgress): PlayerProgress | null {
  return progress.run.freeRerolls > 0 ? { ...progress, run: { ...progress.run, freeRerolls: progress.run.freeRerolls - 1 } } : null;
}

export function selectFelt(progress: PlayerProgress, felt: FeltCosmeticId): PlayerProgress | null {
  return progress.unlockedFelts.includes(felt) ? { ...progress, selectedFelt: felt } : null;
}

export function selectCardBack(progress: PlayerProgress, id: CardBackId): PlayerProgress | null {
  return progress.unlockedCardBacks.includes(id) ? { ...progress, selectedCardBack: id } : null;
}

export function selectChipStyle(progress: PlayerProgress, id: ChipStyleId): PlayerProgress | null {
  return progress.unlockedChipStyles.includes(id) ? { ...progress, selectedChipStyle: id } : null;
}

export function selectVictoryStamp(progress: PlayerProgress, id: VictoryStampId): PlayerProgress | null {
  return progress.unlockedVictoryStamps.includes(id) ? { ...progress, selectedVictoryStamp: id } : null;
}

export function consumeRunItem(progress: PlayerProgress, id: RunItemId): PlayerProgress | null {
  if (progress.run.items[id] <= 0) return null;
  return { ...progress, run: { ...progress.run, items: { ...progress.run.items, [id]: progress.run.items[id] - 1 } } };
}

export function buildShopCatalog(progress: PlayerProgress): ShopItem[] {
  const run = progress.run;
  const hasItemSpace = Object.values(run.items).reduce((total, count) => total + count, 0) < MAX_RUN_ITEMS;
  const elementName: Record<ElementType, string> = { rock: "Rock", paper: "Paper", scissors: "Scissors" };
  const upgrade = (element: ElementType, name: string, color: ShopItem["color"], iconFrame: number): ShopItem => ({ id: `upgrade-${element}` as ShopItemId, name, category: "UPGRADE", description: `+1 level to every ${elementName[element]} card for this run.`, price: 8 + run.upgrades[element] * 6, color, iconFrame, available: run.upgrades[element] < MAX_UPGRADE_LEVEL });
  return [
    upgrade("rock", "Polished rock", "red", 0), upgrade("paper", "Marked paper", "blue", 1), upgrade("scissors", "Master edge", "purple", 2),
    { id: "multiplier", name: "Golden table", category: "MULT", description: "+0.25 MULT for this run.", price: 12 + run.multiplierLevel * 8, color: "orange", iconFrame: 3, available: run.multiplierLevel < MAX_MULTIPLIER_LEVEL },
    { id: "double-token", name: "Double chip", category: "ITEM", description: "Use before playing: x2 chips if you win.", price: 6, color: "green", iconFrame: 4, available: true },
    { id: "loaded-coin", name: "Loaded coin", category: "ITEM", description: "Reroll one selected card before locking.", price: 6, color: "orange", iconFrame: 4, available: hasItemSpace },
    { id: "smoke-break", name: "Smoke break", category: "ITEM", description: "Peek at the Oracle's possible elements.", price: 7, color: "green", iconFrame: 4, available: hasItemSpace },
    { id: "table-knock", name: "Table knock", category: "ITEM", description: "+3 power to a selected card, then discard it.", price: 8, color: "red", iconFrame: 5, available: hasItemSpace },
    { id: "house-match", name: "House match", category: "ITEM", description: "On a draw, force both cards to be discarded.", price: 5, color: "blue", iconFrame: 5, available: hasItemSpace },
    { id: "stone-idol", name: "Stone idol", category: "RELIC", description: "+0.35 MULT when Rock wins.", price: 16, color: "red", iconFrame: 0, available: !run.relics.includes("stone-idol") && run.relics.length < MAX_RELICS },
    { id: "paper-crown", name: "Paper crown", category: "RELIC", description: "+0.35 MULT when Paper wins.", price: 16, color: "blue", iconFrame: 1, available: !run.relics.includes("paper-crown") && run.relics.length < MAX_RELICS },
    { id: "silver-shears", name: "Silver shears", category: "RELIC", description: "+0.35 MULT when Scissors wins.", price: 16, color: "purple", iconFrame: 2, available: !run.relics.includes("silver-shears") && run.relics.length < MAX_RELICS },
    { id: "golden-chip", name: "Golden chip", category: "RELIC", description: "+1 base chip per victory.", price: 18, color: "orange", iconFrame: 5, available: !run.relics.includes("golden-chip") && run.relics.length < MAX_RELICS },
    { id: "brass-knuckles", name: "Brass knuckles", category: "RELIC", description: "Rock match wins add +1 Rock level for the run.", price: 19, color: "red", iconFrame: 0, available: !run.relics.includes("brass-knuckles") && run.relics.length < MAX_RELICS },
    { id: "carbon-paper", name: "Carbon paper", category: "RELIC", description: "The first Paper in each match gains Guard.", price: 18, color: "blue", iconFrame: 1, available: !run.relics.includes("carbon-paper") && run.relics.length < MAX_RELICS },
    { id: "red-thread", name: "Red thread", category: "RELIC", description: "+0.25 match MULT after falling behind.", price: 17, color: "purple", iconFrame: 2, available: !run.relics.includes("red-thread") && run.relics.length < MAX_RELICS },
    { id: "dealers-eye", name: "Dealer's eye", category: "RELIC", description: "Gain one free market reroll after a win.", price: 18, color: "green", iconFrame: 3, available: !run.relics.includes("dealers-eye") && run.relics.length < MAX_RELICS },
  ];
}

export function generateShopOffers(progress: PlayerProgress, count = 4, random: () => number = Math.random): ShopItem[] {
  const pool = buildShopCatalog(progress).filter((item) => item.available);
  for (let index = pool.length - 1; index > 0; index--) { const target = Math.floor(random() * (index + 1)); [pool[index], pool[target]] = [pool[target], pool[index]]; }
  return pool.slice(0, count);
}

export type ShopLane = "TUNE_UP" | "BACKROOM" | "RELIC_CASE" | "NIGHT_SPECIAL";
export const SHOP_LANES: ShopLane[] = ["TUNE_UP", "BACKROOM", "RELIC_CASE", "NIGHT_SPECIAL"];

export function generateStructuredShopOffers(progress: PlayerProgress, random: () => number = Math.random): Array<ShopItem | undefined> {
  const pool = buildShopCatalog(progress).filter((item) => item.available);
  const categories: Record<ShopLane, ShopItem["category"][]> = {
    TUNE_UP: ["UPGRADE"],
    BACKROOM: ["ITEM"],
    RELIC_CASE: ["RELIC"],
    NIGHT_SPECIAL: ["MULT"],
  };
  return SHOP_LANES.map((lane) => {
    const candidates = pool.filter((item) => categories[lane].includes(item.category));
    return candidates.length ? candidates[Math.floor(random() * candidates.length)] : undefined;
  });
}

export function purchaseShopItem(progress: PlayerProgress, id: ShopItemId): { progress: PlayerProgress; success: boolean; message: string } {
  const item = buildShopCatalog(progress).find((candidate) => candidate.id === id);
  if (!item || !item.available) return { progress, success: false, message: "SOLD OUT" };
  if (progress.chips < item.price) return { progress, success: false, message: "NOT ENOUGH CHIPS" };
  const next: PlayerProgress = { ...progress, chips: progress.chips - item.price, run: { ...progress.run, upgrades: { ...progress.run.upgrades }, relics: [...progress.run.relics], items: { ...progress.run.items } } };
  if (id.startsWith("upgrade-")) next.run.upgrades[id.replace("upgrade-", "") as ElementType]++;
  else if (id === "multiplier") next.run.multiplierLevel++;
  else if (id === "double-token") next.run.doubleTokens++;
  else if (["loaded-coin", "smoke-break", "table-knock", "house-match"].includes(id)) next.run.items[id as RunItemId]++;
  else next.run.relics.push(id as RelicId);
  return { progress: next, success: true, message: "PURCHASED" };
}

export function spendChips(progress: PlayerProgress, amount: number): PlayerProgress | null { return progress.chips >= amount ? { ...progress, chips: progress.chips - amount } : null; }
export function consumeDoubleToken(progress: PlayerProgress): PlayerProgress | null { return progress.run.doubleTokens > 0 ? { ...progress, run: { ...progress.run, doubleTokens: progress.run.doubleTokens - 1 } } : null; }
