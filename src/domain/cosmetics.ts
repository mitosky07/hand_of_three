export type FeltCosmeticId = "CLASSIC_FELT" | "MIDNIGHT_FELT" | "CRIMSON_FELT" | "VIOLET_FELT";
export type CardBackId = "HOUSE_BACK" | "BONE_BACK" | "NEON_BACK";
export type ChipStyleId = "BRASS_CHIP" | "NEON_CHIP" | "BLACK_CHIP";
export type VictoryStampId = "THREE_SEAL" | "SKULL_SEAL" | "ORACLE_SEAL";
export type PortraitId = "ORACLE_PORTRAIT" | "CUTTER_PORTRAIT" | "MASON_PORTRAIT" | "BOOKIE_PORTRAIT";

export interface FeltCosmetic {
  id: FeltCosmeticId;
  name: string;
  description: string;
  winsRequired: number;
  tint: number;
}

export const FELT_COSMETICS: FeltCosmetic[] = [
  { id: "CLASSIC_FELT", name: "Classic Felt", description: "The original backroom green.", winsRequired: 0, tint: 0xffffff },
  { id: "MIDNIGHT_FELT", name: "Midnight Felt", description: "Cold blue after closing time.", winsRequired: 3, tint: 0x8eb2c7 },
  { id: "CRIMSON_FELT", name: "Crimson Felt", description: "A dangerous red private table.", winsRequired: 7, tint: 0xc48b86 },
  { id: "VIOLET_FELT", name: "Violet Felt", description: "The Oracle's hidden room.", winsRequired: 12, tint: 0xb095c8 },
];

export function unlockedFelts(totalWins: number): FeltCosmeticId[] {
  return FELT_COSMETICS.filter((felt) => totalWins >= felt.winsRequired).map((felt) => felt.id);
}

export function feltById(id: FeltCosmeticId): FeltCosmetic {
  return FELT_COSMETICS.find((felt) => felt.id === id) ?? FELT_COSMETICS[0];
}

export const CARD_BACKS: Array<{ id: CardBackId; name: string; winsRequired: number; color: number; mark: string }> = [
  { id: "HOUSE_BACK", name: "House Back", winsRequired: 0, color: 0x123d34, mark: "III" },
  { id: "BONE_BACK", name: "Bone Back", winsRequired: 5, color: 0x6b6658, mark: "X" },
  { id: "NEON_BACK", name: "Neon Back", winsRequired: 10, color: 0x315f6b, mark: "///" },
];

export const CHIP_STYLES: Array<{ id: ChipStyleId; name: string; winsRequired: number; glyph: string; color: string }> = [
  { id: "BRASS_CHIP", name: "Brass Chip", winsRequired: 0, glyph: "◉", color: "#d9b867" },
  { id: "NEON_CHIP", name: "Neon Chip", winsRequired: 8, glyph: "◆", color: "#7fa98a" },
  { id: "BLACK_CHIP", name: "Black Chip", winsRequired: 14, glyph: "●", color: "#a9674e" },
];

export const VICTORY_STAMPS: Array<{ id: VictoryStampId; name: string; winsRequired: number; label: string }> = [
  { id: "THREE_SEAL", name: "Three Seal", winsRequired: 0, label: "III" },
  { id: "SKULL_SEAL", name: "Skull Seal", winsRequired: 12, label: "SKULL" },
  { id: "ORACLE_SEAL", name: "Oracle Seal", winsRequired: 20, label: "EYE" },
];

export function unlockedCardBacks(totalWins: number) { return CARD_BACKS.filter((item) => totalWins >= item.winsRequired).map((item) => item.id); }
export function unlockedChipStyles(totalWins: number) { return CHIP_STYLES.filter((item) => totalWins >= item.winsRequired).map((item) => item.id); }
export function unlockedVictoryStamps(totalWins: number) { return VICTORY_STAMPS.filter((item) => totalWins >= item.winsRequired).map((item) => item.id); }
export function unlockedPortraits(bestRound: number): PortraitId[] {
  const portraits: PortraitId[] = ["ORACLE_PORTRAIT"];
  if (bestRound >= 6) portraits.push("CUTTER_PORTRAIT");
  if (bestRound >= 11) portraits.push("MASON_PORTRAIT");
  if (bestRound >= 16) portraits.push("BOOKIE_PORTRAIT");
  return portraits;
}
