import { HAND_SIZE, WINNING_SCORE } from "../config/gameConfig";
import type { Card, ElementType, PlayerId } from "./Card";
import { addKeywords, createDeck, createRandomDeck, shuffle } from "./deck";
import { MatchPhase } from "./MatchPhase";
import type { MatchState } from "./MatchState";
import type { PlayerState } from "./PlayerState";
import { resolveRound, type RoundResult } from "./resolveRound";
import { cryptoRandom, type RandomSource } from "./random";

export class MatchController {
  state: MatchState;
  private readonly random: RandomSource;
  constructor(mode: "AI" | "LOCAL", playerOneName = "Player 1", playerTwoName = mode === "AI" ? "Oracle" : "Player 2", random: RandomSource = cryptoRandom, playerOneUpgrades: Partial<Record<ElementType, number>> = {}, oracleWeights: Partial<Record<ElementType, number>> = {}, traits: { carbonPaper?: boolean } = {}) {
    this.random = random;
    const makePlayer = (id: PlayerId, name: string): PlayerState => {
      const baseDeck = mode === "AI" && id === "PLAYER_TWO" ? createRandomDeck(random, {}, oracleWeights) : createDeck(id === "PLAYER_ONE" ? playerOneUpgrades : {});
      const deck = addKeywords(baseDeck, random);
      if (id === "PLAYER_ONE" && traits.carbonPaper) {
        const firstPaper = deck.find((card) => card.element === "paper");
        if (firstPaper) firstPaper.keyword = "GUARD";
      }
      return { id, name, deck: shuffle(deck, random), hand: [], discardPile: [], selectedCard: null, score: 0 };
    };
    this.state = { phase: MatchPhase.INITIALIZING, mode, players: { PLAYER_ONE: makePlayer("PLAYER_ONE", playerOneName), PLAYER_TWO: makePlayer("PLAYER_TWO", playerTwoName) }, round: 1, history: [], winner: null, lastPlayedElement: {}, bonusChips: 0, bonusMultiplier: 0, wasBehind: false };
    this.state.phase = MatchPhase.DEALING; this.drawToHand("PLAYER_ONE"); this.drawToHand("PLAYER_TWO"); this.state.phase = MatchPhase.WAITING_FOR_SELECTION;
  }
  select(player: PlayerId, cardId: string) {
    const canSelect = this.state.phase === MatchPhase.WAITING_FOR_SELECTION
      || this.state.phase === MatchPhase.CARD_SELECTED
      || (player === "PLAYER_TWO" && this.state.phase === MatchPhase.WAITING_FOR_OPPONENT);
    if (!canSelect) return false;
    const card = this.state.players[player].hand.find((item) => item.id === cardId);
    if (!card || !this.canSelect(player, card)) return false;
    this.state.players[player].selectedCard = card;
    this.state.phase = MatchPhase.CARD_SELECTED;
    return true;
  }
  canSelect(player: PlayerId, card: Card) {
    const blocked = card.keyword === "HEAVY" && this.state.lastPlayedElement[player] === card.element;
    if (!blocked) return true;
    return !this.state.players[player].hand.some((candidate) =>
      candidate.keyword !== "HEAVY" || this.state.lastPlayedElement[player] !== candidate.element
    );
  }
  chooseRandomCard(player: PlayerId) {
    const hand = this.state.players[player].hand;
    const legal = hand.filter((card) => this.canSelect(player, card));
    const choices = legal.length ? legal : hand;
    if (!choices.length) throw new Error("Cannot choose from an empty hand.");
    return choices[Math.floor(this.random() * choices.length)];
  }
  clearSelection(player: PlayerId) { if (this.state.phase === MatchPhase.CARD_SELECTED) { this.state.players[player].selectedCard = null; this.state.phase = MatchPhase.WAITING_FOR_SELECTION; } }
  lock(player: PlayerId) { const selected = this.state.players[player].selectedCard; if (!selected || this.state.phase !== MatchPhase.CARD_SELECTED) return false; this.state.phase = player === "PLAYER_ONE" ? MatchPhase.WAITING_FOR_OPPONENT : MatchPhase.CARD_LOCKED; return true; }
  resolve(): RoundResult | null {
    const a = this.state.players.PLAYER_ONE.selectedCard, b = this.state.players.PLAYER_TWO.selectedCard; if (!a || !b) return null;
    this.state.phase = MatchPhase.RESOLVING; const result = resolveRound(a, b, this.random); if (result.winner) this.state.players[result.winner].score++;
    if (result.winner === "PLAYER_ONE") {
      const winningCard = this.state.players.PLAYER_ONE.selectedCard!;
      if (winningCard.keyword === "MARKED") this.state.bonusChips++;
      if (winningCard.keyword === "SHARP" && winningCard.element === "scissors") this.state.bonusMultiplier = Math.round((this.state.bonusMultiplier + .1) * 100) / 100;
    }
    if (this.state.players.PLAYER_ONE.score < this.state.players.PLAYER_TWO.score) this.state.wasBehind = true;
    this.state.history.push({ playerOne: a, playerTwo: b, winner: result.winner }); return result;
  }
  finishRound(forceDiscard = false) {
    const { PLAYER_ONE: p1, PLAYER_TWO: p2 } = this.state.players;
    const latest = this.state.history.at(-1);
    [p1, p2].forEach((p) => {
      if (!p.selectedCard) return;
      this.state.lastPlayedElement[p.id] = p.selectedCard.element;
      const guardedDraw = !forceDiscard && !latest?.winner && p.selectedCard.keyword === "GUARD";
      if (!guardedDraw) {
        p.hand = p.hand.filter((card) => card !== p.selectedCard);
        p.discardPile.push(p.selectedCard);
      }
      p.selectedCard = null;
    });
    if (p1.score >= WINNING_SCORE || p2.score >= WINNING_SCORE) { this.state.winner = p1.score >= WINNING_SCORE ? "PLAYER_ONE" : "PLAYER_TWO"; this.state.phase = MatchPhase.MATCH_FINISHED; return; }
    this.state.phase = MatchPhase.DRAWING; this.drawToHand("PLAYER_ONE"); this.drawToHand("PLAYER_TWO");
    if (!p1.deck.length && !p2.deck.length && !p1.hand.length && !p2.hand.length) { this.state.winner = p1.score === p2.score ? "DRAW" : p1.score > p2.score ? "PLAYER_ONE" : "PLAYER_TWO"; this.state.phase = MatchPhase.MATCH_FINISHED; return; }
    this.state.round++; this.state.phase = MatchPhase.WAITING_FOR_SELECTION;
  }
  rerollCard(player: PlayerId, cardId: string) {
    if (![MatchPhase.WAITING_FOR_SELECTION, MatchPhase.CARD_SELECTED].includes(this.state.phase)) return false;
    const target = this.state.players[player];
    const card = target.hand.find((candidate) => candidate.id === cardId);
    if (!card || !target.deck.length) return false;
    target.hand = target.hand.filter((candidate) => candidate.id !== cardId);
    target.discardPile.push(card);
    target.hand.push(target.deck.pop()!);
    target.selectedCard = null;
    this.state.phase = MatchPhase.WAITING_FOR_SELECTION;
    return true;
  }
  private drawToHand(player: PlayerId) { const target = this.state.players[player]; while (target.hand.length < HAND_SIZE && target.deck.length) target.hand.push(target.deck.pop()!); }
}
