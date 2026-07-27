import { acceptContract, clearContract, consumeDoubleToken, consumeFreeReroll, consumeRunItem, createDefaultProgress, normalizeProgress, purchaseShopItem, resolveRunRound, selectCardBack, selectChipStyle, selectFelt, selectVictoryStamp, spendChips, type PlayerProgress, type RunItemId, type ShopItemId } from "../domain/progression";
import type { ElementType } from "../domain/Card";
import { evaluateContract, type ContractId, type ContractMatchSummary } from "../domain/contracts";
import type { CardBackId, ChipStyleId, FeltCosmeticId, VictoryStampId } from "../domain/cosmetics";

const KEY = "hand-of-three-progression-v1";

class ProgressionService {
  get(): PlayerProgress { try { return normalizeProgress(JSON.parse(localStorage.getItem(KEY) ?? "null")); } catch { return createDefaultProgress(); } }
  save(progress: PlayerProgress): PlayerProgress { localStorage.setItem(KEY, JSON.stringify(progress)); return progress; }
  finishMatch(won: boolean, element: ElementType, doubled: boolean, bonusChips = 0, bonusMultiplier = 0, summary?: Omit<ContractMatchSummary, "won" | "doubled">) {
    const current = this.get();
    const contract = current.run.activeContract && summary
      ? evaluateContract(current.run.activeContract, { ...summary, won, doubled })
      : undefined;
    const result = resolveRunRound(current, won, element, doubled, bonusChips, bonusMultiplier, contract);
    this.save(result.progress);
    return result.reward;
  }
  buy(id: ShopItemId) { const result = purchaseShopItem(this.get(), id); if (result.success) this.save(result.progress); return result; }
  pay(amount: number): boolean { const next = spendChips(this.get(), amount); if (!next) return false; this.save(next); return true; }
  useDoubleToken(): boolean { const next = consumeDoubleToken(this.get()); if (!next) return false; this.save(next); return true; }
  acceptContract(id: ContractId) { this.save(acceptContract(this.get(), id)); }
  clearContract() { this.save(clearContract(this.get())); }
  useFreeReroll(): boolean { const next = consumeFreeReroll(this.get()); if (!next) return false; this.save(next); return true; }
  selectFelt(id: FeltCosmeticId): boolean { const next = selectFelt(this.get(), id); if (!next) return false; this.save(next); return true; }
  grantDoubleToken() {
    const current = this.get();
    this.save({ ...current, run: { ...current.run, doubleTokens: current.run.doubleTokens + 1 } });
  }
  useRunItem(id: RunItemId): boolean { const next = consumeRunItem(this.get(), id); if (!next) return false; this.save(next); return true; }
  selectCardBack(id: CardBackId) { const next = selectCardBack(this.get(), id); if (next) this.save(next); return Boolean(next); }
  selectChipStyle(id: ChipStyleId) { const next = selectChipStyle(this.get(), id); if (next) this.save(next); return Boolean(next); }
  selectVictoryStamp(id: VictoryStampId) { const next = selectVictoryStamp(this.get(), id); if (next) this.save(next); return Boolean(next); }
}

export const progressionService = new ProgressionService();
