import { HAND_SIZE, WINNING_SCORE } from "../config/gameConfig";
import type { Card, ElementType, PlayerId } from "./Card";
import { createDeck, createRandomDeck, shuffle } from "./deck";
import { MatchPhase } from "./MatchPhase";
import type { MatchState } from "./MatchState";
import type { PlayerState } from "./PlayerState";
import { resolveRound, type RoundResult } from "./resolveRound";
import { cryptoRandom, type RandomSource } from "./random";

export class MatchController {
  state: MatchState;
  constructor(mode: "AI" | "LOCAL", playerOneName = "Player 1", playerTwoName = mode === "AI" ? "Oracle" : "Player 2", random: RandomSource = cryptoRandom, playerOneUpgrades: Partial<Record<ElementType, number>> = {}) {
    const makePlayer = (id: PlayerId, name: string): PlayerState => {
      const deck = mode === "AI" && id === "PLAYER_TWO" ? createRandomDeck(cryptoRandom) : createDeck(id === "PLAYER_ONE" ? playerOneUpgrades : {});
      return { id, name, deck: shuffle(deck, random), hand: [], discardPile: [], selectedCard: null, score: 0 };
    };
    this.state = { phase: MatchPhase.INITIALIZING, mode, players: { PLAYER_ONE: makePlayer("PLAYER_ONE", playerOneName), PLAYER_TWO: makePlayer("PLAYER_TWO", playerTwoName) }, round: 1, history: [], winner: null };
    this.state.phase = MatchPhase.DEALING; this.drawToHand("PLAYER_ONE"); this.drawToHand("PLAYER_TWO"); this.state.phase = MatchPhase.WAITING_FOR_SELECTION;
  }
  select(player: PlayerId, cardId: string) {
    const canSelect = this.state.phase === MatchPhase.WAITING_FOR_SELECTION
      || this.state.phase === MatchPhase.CARD_SELECTED
      || (player === "PLAYER_TWO" && this.state.phase === MatchPhase.WAITING_FOR_OPPONENT);
    if (!canSelect) return false;
    const card = this.state.players[player].hand.find((item) => item.id === cardId);
    if (!card) return false;
    this.state.players[player].selectedCard = card;
    this.state.phase = MatchPhase.CARD_SELECTED;
    return true;
  }
  clearSelection(player: PlayerId) { if (this.state.phase === MatchPhase.CARD_SELECTED) { this.state.players[player].selectedCard = null; this.state.phase = MatchPhase.WAITING_FOR_SELECTION; } }
  lock(player: PlayerId) { const selected = this.state.players[player].selectedCard; if (!selected || this.state.phase !== MatchPhase.CARD_SELECTED) return false; this.state.phase = player === "PLAYER_ONE" ? MatchPhase.WAITING_FOR_OPPONENT : MatchPhase.CARD_LOCKED; return true; }
  resolve(): RoundResult | null {
    const a = this.state.players.PLAYER_ONE.selectedCard, b = this.state.players.PLAYER_TWO.selectedCard; if (!a || !b) return null;
    this.state.phase = MatchPhase.RESOLVING; const result = resolveRound(a, b); if (result.winner) this.state.players[result.winner].score++;
    this.state.history.push({ playerOne: a, playerTwo: b, winner: result.winner }); return result;
  }
  finishRound() {
    const { PLAYER_ONE: p1, PLAYER_TWO: p2 } = this.state.players; [p1, p2].forEach((p) => { if (p.selectedCard) { p.hand = p.hand.filter((card) => card !== p.selectedCard); p.discardPile.push(p.selectedCard); p.selectedCard = null; } });
    if (p1.score >= WINNING_SCORE || p2.score >= WINNING_SCORE) { this.state.winner = p1.score >= WINNING_SCORE ? "PLAYER_ONE" : "PLAYER_TWO"; this.state.phase = MatchPhase.MATCH_FINISHED; return; }
    this.state.phase = MatchPhase.DRAWING; this.drawToHand("PLAYER_ONE"); this.drawToHand("PLAYER_TWO");
    if (!p1.deck.length && !p2.deck.length && !p1.hand.length && !p2.hand.length) { this.state.winner = p1.score === p2.score ? "DRAW" : p1.score > p2.score ? "PLAYER_ONE" : "PLAYER_TWO"; this.state.phase = MatchPhase.MATCH_FINISHED; return; }
    this.state.round++; this.state.phase = MatchPhase.WAITING_FOR_SELECTION;
  }
  private drawToHand(player: PlayerId) { const target = this.state.players[player]; while (target.hand.length < HAND_SIZE && target.deck.length) target.hand.push(target.deck.pop()!); }
}
