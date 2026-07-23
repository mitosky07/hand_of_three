import { consumeDoubleToken, createDefaultProgress, normalizeProgress, purchaseShopItem, resolveRunRound, spendChips, type PlayerProgress, type ShopItemId } from "../domain/progression";
import type { ElementType } from "../domain/Card";

const KEY = "hand-of-three-progression-v1";

class ProgressionService {
  get(): PlayerProgress { try { return normalizeProgress(JSON.parse(localStorage.getItem(KEY) ?? "null")); } catch { return createDefaultProgress(); } }
  save(progress: PlayerProgress): PlayerProgress { localStorage.setItem(KEY, JSON.stringify(progress)); return progress; }
  finishMatch(won: boolean, element: ElementType, doubled: boolean) { const result = resolveRunRound(this.get(), won, element, doubled); this.save(result.progress); return result.reward; }
  buy(id: ShopItemId) { const result = purchaseShopItem(this.get(), id); if (result.success) this.save(result.progress); return result; }
  pay(amount: number): boolean { const next = spendChips(this.get(), amount); if (!next) return false; this.save(next); return true; }
  useDoubleToken(): boolean { const next = consumeDoubleToken(this.get()); if (!next) return false; this.save(next); return true; }
}

export const progressionService = new ProgressionService();
