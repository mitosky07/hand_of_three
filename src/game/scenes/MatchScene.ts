import Phaser from "phaser";
import { COLORS, PIXEL_FONT, drawPixelBackdrop, pixelText } from "../../config/theme";
import { MatchController } from "../../domain/matchController";
import { MatchPhase } from "../../domain/MatchPhase";
import { ELEMENT_LABEL, type ElementType, type PlayerId } from "../../domain/Card";
import type { RoundResult } from "../../domain/resolveRound";
import { getRewardMultiplier, type RoundReward } from "../../domain/progression";
import { chooseRandomCard } from "../../services/aiService";
import { audioService } from "../../services/audioService";
import { CardView } from "../objects/CardView";
import { GameButton } from "../objects/GameButton";
import { getFinishAnimationSpec } from "../animations/finishAnimation";
import { progressionService } from "../../services/progressionService";
import { WINNING_SCORE } from "../../config/gameConfig";
import { getMatchCommand } from "../input/keyboardControls";

export class MatchScene extends Phaser.Scene {
  private controller!: MatchController;
  private mode: "AI" | "LOCAL" = "AI";
  private handViews: CardView[] = [];
  private selected: CardView | null = null;
  private status!: Phaser.GameObjects.Text;
  private score!: Phaser.GameObjects.Text;
  private opponent!: Phaser.GameObjects.Text;
  private roundText!: Phaser.GameObjects.Text;
  private streakText!: Phaser.GameObjects.Text;
  private confirm!: GameButton;
  private center!: Phaser.GameObjects.Container;
  private opponentHand!: Phaser.GameObjects.Container;
  private chipsText!: Phaser.GameObjects.Text;
  private multiplierText!: Phaser.GameObjects.Text;
  private doubleButton!: GameButton;
  private handCounter!: Phaser.GameObjects.Text;
  private statusPlate!: Phaser.GameObjects.Rectangle;
  private doubleActive = false;
  private activeHandPlayer: PlayerId = "PLAYER_ONE";
  private keyboardCardIndex = -1;
  private localReadyAction: (() => void) | null = null;

  constructor() { super("MatchScene"); }
  init(data: { mode: "AI" | "LOCAL" }) { this.mode = data.mode ?? "AI"; }

  create() {
    const profile = progressionService.get();
    this.controller = new MatchController(this.mode, undefined, undefined, undefined, this.mode === "AI" ? profile.run.upgrades : {});
    drawPixelBackdrop(this, COLORS.gold);
    this.drawTable();
    this.score = this.add.text(54, 42, "", { fontFamily: PIXEL_FONT, fontSize: "13px", color: "#efe2bc", lineSpacing: 8 });
    this.opponent = this.add.text(1226, 42, "", { fontFamily: PIXEL_FONT, fontSize: "13px", color: "#efe2bc", align: "right", lineSpacing: 8 }).setOrigin(1, 0);
    this.roundText = this.add.text(640, 43, "", pixelText(15, "#d9b867")).setOrigin(.5);
    this.streakText = this.add.text(640, 72, "", pixelText(8, "#c9bea0")).setOrigin(.5);
    this.chipsText = this.add.text(300, 98, "", pixelText(9, "#d9b867")).setOrigin(0, .5);
    this.multiplierText = this.add.text(980, 98, "", pixelText(9, "#7fa98a")).setOrigin(1, .5);
    this.center = this.add.container(640, 260);
    this.opponentHand = this.add.container(640, 145);
    this.handCounter = this.add.text(640, 101, "", pixelText(8, "#d9b867")).setOrigin(.5);
    this.statusPlate = this.add.rectangle(640, 395, 670, 68, COLORS.ink, .84).setStrokeStyle(2, COLORS.gold, .5);
    this.status = this.add.text(640, 395, "", { ...pixelText(10), wordWrap: { width: 640 }, lineSpacing: 6 }).setOrigin(.5);
    this.confirm = new GameButton(this, 640, 465, "2 · Confirm", () => this.confirmSelection(), 230, "blue");
    new GameButton(this, 215, 465, "Pause", () => this.scene.launch("PauseScene", { match: this }), 170, "red");
    this.doubleButton = new GameButton(this, 1065, 465, "Double item", () => this.activateDoubleToken(), 205, "purple");
    this.doubleButton.setVisible(this.mode === "AI");
    const keyboard = this.input.keyboard;
    keyboard?.on("keydown", this.handleKeyDown, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => keyboard?.off("keydown", this.handleKeyDown, this));
    this.render();
  }

  private drawTable() {
    const texture = this.textures.get("poker-table-art");
    if (!texture.has("table-crop")) texture.add("table-crop", 0, 50, 200, 1154, 835);
    this.add.image(640, 392, "poker-table-art", "table-crop").setDisplaySize(1080, 560).setDepth(-5);
  }

  private render() {
    const { players, round, phase } = this.controller.state;
    const profile = progressionService.get();
    this.score.setText(this.mode === "AI" ? `YOU\nSEALS ${players.PLAYER_ONE.score}/${WINNING_SCORE}` : `${players.PLAYER_ONE.name.toUpperCase()}\n${this.pips(players.PLAYER_ONE.score)}  ·  DECK ${players.PLAYER_ONE.deck.length}`);
    this.opponent.setText(this.mode === "AI" ? `ORACLE\nSEALS ${players.PLAYER_TWO.score}/${WINNING_SCORE}` : `${players.PLAYER_TWO.name.toUpperCase()}\n${this.pips(players.PLAYER_TWO.score)}  ·  DECK ${players.PLAYER_TWO.deck.length}`);
    this.roundText.setText(`ROUND ${String(this.mode === "AI" ? profile.run.round : round).padStart(2, "0")}`);
    const maxHands = WINNING_SCORE * 2 - 1;
    this.handCounter.setText(this.mode === "AI" ? `HAND ${Math.min(round, maxHands)} OF ${maxHands} · FIRST TO ${WINNING_SCORE}` : `HAND ${round} · FIRST TO ${WINNING_SCORE}`);
    this.updateEconomyHud();
    this.renderOpponentHand(players.PLAYER_TWO.hand.length);
    this.updateStreak();
    if (phase === MatchPhase.WAITING_FOR_SELECTION || phase === MatchPhase.CARD_SELECTED) {
      this.renderHand("PLAYER_ONE");
      this.status.setText(this.selected ? "STEP 2 · CONFIRM YOUR PLAY" : "STEP 1 · CHOOSE A CARD FROM YOUR HAND");
      this.confirm.setVisible(true).setEnabled(Boolean(this.selected));
      this.doubleButton.setVisible(this.mode === "AI").setEnabled(this.mode === "AI" && !this.doubleActive && progressionService.get().run.doubleTokens > 0);
    }
  }

  private renderHand(player: PlayerId) {
    this.handViews.forEach(view => view.destroy());
    this.handViews = [];
    this.activeHandPlayer = player;
    this.keyboardCardIndex = -1;
    const hand = this.controller.state.players[player].hand;
    const spacing = Math.min(122, 620 / Math.max(1, hand.length));
    const start = 640 - ((hand.length - 1) * spacing) / 2;
    hand.forEach((card, index) => {
      const distance = index - (hand.length - 1) / 2;
      const view = new CardView(this, start + index * spacing, 580 + Math.abs(distance) * 3, card);
      view.setRestingScale(.62).setAngle(distance * 1.8);
      view.setAlpha(0).setY(view.y + 26);
      this.tweens.add({ targets: view, y: view.y - 26, alpha: 1, duration: 260, delay: index * 55, ease: "Back.out" });
      (view.list[1] as Phaser.GameObjects.Rectangle).on("pointerup", () => player === "PLAYER_ONE" ? this.selectPlayerOne(view) : this.selectPlayerTwo(view));
      this.handViews.push(view);
    });
  }

  private renderOpponentHand(count: number) {
    this.opponentHand.removeAll(true);
    for (let index = 0; index < count; index++) {
      const x = (index - (count - 1) / 2) * 34;
      const shadow = this.add.rectangle(x + 3, 4, 52, 68, COLORS.ink);
      const card = this.add.rectangle(x, 0, 52, 68, COLORS.feltDark).setStrokeStyle(2, COLORS.woodLight);
      const mark = this.add.text(x, 1, "III", pixelText(6, "#9fd3a9")).setOrigin(.5);
      shadow.setAlpha(0); card.setAlpha(0); mark.setAlpha(0);
      this.tweens.add({ targets: [shadow, card, mark], alpha: 1, duration: 170, delay: index * 45 });
      this.opponentHand.add([shadow, card, mark]);
    }
  }

  private selectPlayerOne(view: CardView) {
    const phase = this.controller.state.phase;
    if (phase !== MatchPhase.WAITING_FOR_SELECTION && phase !== MatchPhase.CARD_SELECTED) return;
    if (this.selected && this.selected !== view) {
      this.selected.setSelected(false);
      this.controller.clearSelection("PLAYER_ONE");
    }
    this.selected = view;
    this.keyboardCardIndex = this.handViews.indexOf(view);
    this.controller.select("PLAYER_ONE", view.card.id);
    view.setSelected(true);
    this.status.setText("STEP 2 · CONFIRM YOUR PLAY");
    this.confirm.setEnabled(true);
  }

  private confirmSelection() {
    if (!this.selected || !this.controller.lock("PLAYER_ONE")) return;
    this.handViews.forEach(view => view.disableInteractive());
    this.confirm.setVisible(false);
    this.doubleButton.setVisible(false);
    this.status.setText(this.mode === "AI" ? "THE ORACLE IS CHOOSING..." : "CHOICE LOCKED");
    audioService.play("confirm");
    if (this.mode === "AI") this.time.delayedCall(620, () => this.aiTurn());
    else this.showPassScreen();
  }

  private aiTurn() {
    const cpu = this.controller.state.players.PLAYER_TWO;
    const choice = chooseRandomCard(cpu.hand);
    this.controller.select("PLAYER_TWO", choice.id);
    this.controller.lock("PLAYER_TWO");
    this.reveal();
  }

  private showPassScreen() {
    const overlay = this.add.rectangle(640, 360, 1280, 720, COLORS.ink, .96).setDepth(20);
    const frame = this.add.rectangle(640, 330, 760, 360, COLORS.panelDark).setStrokeStyle(5, COLORS.violet).setDepth(21);
    const msg = this.add.text(640, 285, "CHOICE LOCKED\n\nPASS THE DEVICE\nTO PLAYER 2", pixelText(17)).setOrigin(.5).setDepth(22);
    const proceed = () => { this.localReadyAction = null; overlay.destroy(); frame.destroy(); msg.destroy(); ready.destroy(); this.localTurn(); };
    const ready = new GameButton(this, 640, 445, "Player 2 ready", proceed, 310).setDepth(22);
    this.localReadyAction = proceed;
  }

  private localTurn() {
    this.selected = null;
    this.confirm.setVisible(false);
    this.status.setText("PLAYER 2 · CHOOSE YOUR CARD");
    this.renderHand("PLAYER_TWO");
  }

  private selectPlayerTwo(view: CardView) {
    if (this.controller.state.players.PLAYER_TWO.selectedCard) return;
    this.handViews.forEach(item => item.disableInteractive());
    this.controller.select("PLAYER_TWO", view.card.id);
    this.keyboardCardIndex = this.handViews.indexOf(view);
    view.setSelected(true);
    this.status.setText("PLAY LOCKED · PREPARING DUEL");
    this.time.delayedCall(420, () => { this.controller.lock("PLAYER_TWO"); this.reveal(); });
  }

  private reveal() {
    this.confirm.setVisible(false);
    this.handViews.forEach(view => view.destroy());
    this.handViews = [];
    this.opponentHand.removeAll(true);
    this.status.setText("REVEAL!");
    audioService.play("reveal");
    const { PLAYER_ONE: playerOne, PLAYER_TWO: playerTwo } = this.controller.state.players;
    const left = new CardView(this, -330, 0, playerOne.selectedCard!);
    const right = new CardView(this, 330, 0, playerTwo.selectedCard!);
    this.center.add([left, right]);
    this.tweens.add({ targets: left, x: -105, duration: 430, ease: "Back.out" });
    this.tweens.add({ targets: right, x: 105, duration: 430, ease: "Back.out", onComplete: () => this.finishReveal(left, right) });
  }

  private finishReveal(left: CardView, right: CardView) {
    const result = this.controller.resolve()!;
    if (!result.winner) {
      this.impactBurst();
      this.showResult(result);
      return;
    }
    const winner = result.winner === "PLAYER_ONE" ? left : right;
    const loser = result.winner === "PLAYER_ONE" ? right : left;
    const winnerCard = this.controller.state.players[result.winner].selectedCard!;
    const isLocalPreview = window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost";
    const debugElement = isLocalPreview ? new URLSearchParams(window.location.search).get("finish") : null;
    const finishElement: ElementType = debugElement === "rock" || debugElement === "paper" || debugElement === "scissors" ? debugElement : winnerCard.element;
    this.playFinishAnimation(finishElement, winner, loser, () => {
      this.impactBurst();
      this.showResult(result);
    });
  }

  private showResult(result: RoundResult) {
    const playerOne = this.controller.state.players.PLAYER_ONE.selectedCard!;
    const playerTwo = this.controller.state.players.PLAYER_TWO.selectedCard!;
    let title = "PERFECT DRAW";
    let detail = "SAME ELEMENT · SAME LEVEL";
    if (result.winner) {
      const winner = result.winner === "PLAYER_ONE" ? playerOne : playerTwo;
      const loser = result.winner === "PLAYER_ONE" ? playerTwo : playerOne;
      title = this.mode === "AI"
        ? result.winner === "PLAYER_ONE" ? "HAND TO YOU!" : "HAND TO THE ORACLE"
        : result.winner === "PLAYER_ONE" ? "PLAYER 1 TAKES THE HAND" : "PLAYER 2 TAKES THE HAND";
      detail = result.reason === "ELEMENT_ADVANTAGE" ? `${ELEMENT_LABEL[winner.element]} BEATS ${ELEMENT_LABEL[loser.element]}` : `LEVEL ${winner.level} BEATS LEVEL ${loser.level}`;
    }
    if (this.mode === "AI") detail += `\nSCORE ${this.controller.state.players.PLAYER_ONE.score} — ${this.controller.state.players.PLAYER_TWO.score} · BEST OF 3`;
    this.status.setText(`${title}\n${detail}`);
    audioService.play(result.winner === "PLAYER_ONE" ? "win" : result.winner === "PLAYER_TWO" ? "lose" : "tie");
    if (result.winner) this.cameras.main.shake(130, .004);
    this.time.delayedCall(1850, () => {
      this.center.removeAll(true);
      if (this.mode === "AI") {
        this.controller.finishRound();
        if (this.controller.state.phase === MatchPhase.MATCH_FINISHED) {
          const matchReward: RoundReward = progressionService.finishMatch(this.controller.state.winner === "PLAYER_ONE", playerOne.element, this.doubleActive);
          this.doubleActive = false;
          this.doubleButton.setLabel("Use double item");
          this.scene.start("ResultsScene", { controller: this.controller, roundReward: matchReward });
          return;
        }
        this.selected = null;
        this.render();
        return;
      }
      this.controller.finishRound();
      if (this.controller.state.phase === MatchPhase.MATCH_FINISHED) this.scene.start("ResultsScene", { controller: this.controller });
      else { this.selected = null; this.render(); }
    });
  }

  private activateDoubleToken() {
    if (this.doubleActive || !progressionService.useDoubleToken()) return;
    this.doubleActive = true;
    this.doubleButton.setLabel("x2 ACTIVE").setEnabled(false);
    this.status.setText("ITEM ACTIVE · x2 CHIPS IF YOU WIN THIS MATCH");
    this.updateEconomyHud();
  }

  private updateEconomyHud() {
    if (this.mode !== "AI") {
      this.chipsText.setText("LOCAL MODE · NO PROGRESSION");
      this.multiplierText.setText("");
      return;
    }
    const profile = progressionService.get();
    this.chipsText.setText(`◉ ${profile.chips} CHIPS`);
    this.multiplierText.setText(`MULT x${getRewardMultiplier(profile).toFixed(2)} · ITEMS ${profile.run.doubleTokens}${this.doubleActive ? " ACTIVE" : ""}`);
  }

  private playFinishAnimation(element: ElementType, winner: CardView, loser: CardView, done: () => void) {
    const spec = getFinishAnimationSpec(element);
    this.status.setText(spec.announcement);
    if (spec.kind === "SLICE") this.playSlice(winner, loser, done);
    else if (spec.kind === "CRUSH") this.playCrush(winner, loser, done);
    else this.playWrap(winner, loser, done);
  }

  private playSlice(winner: CardView, loser: CardView, done: () => void) {
    const slashes = [-18, 18].map((offset, index) => {
      const shadow = this.add.rectangle(loser.x - 115, offset + loser.y + 5, 170, 12, COLORS.ink, .8).setRotation(index ? .62 : -.62).setAlpha(0);
      const slash = this.add.rectangle(loser.x - 120, offset + loser.y, 170, 6, index ? COLORS.cream : COLORS.gold).setRotation(index ? .62 : -.62).setAlpha(0);
      this.center.add([shadow, slash]);
      this.tweens.add({ targets: [shadow, slash], x: loser.x + 120, alpha: { from: 0, to: 1 }, duration: 220, delay: index * 90, yoyo: true, hold: 70, onComplete: () => { shadow.destroy(); slash.destroy(); } });
      return slash;
    });
    this.tweens.add({ targets: winner, angle: { from: -8, to: 8 }, yoyo: true, duration: 130, repeat: 1 });
    this.tweens.add({ targets: loser, angle: { from: -4, to: 4 }, alpha: { from: 1, to: .48 }, yoyo: true, duration: 80, repeat: 3 });
    this.time.delayedCall(470, () => { this.spawnFinishParticles(loser.x, loser.y, COLORS.cream, 12); done(); });
    void slashes;
  }

  private playCrush(winner: CardView, loser: CardView, done: () => void) {
    const winnerStart = { x: winner.x, y: winner.y };
    this.tweens.add({
      targets: winner,
      y: winner.y - 95,
      scale: 1.18,
      duration: 180,
      ease: "Quad.out",
      onComplete: () => this.tweens.add({
        targets: winner,
        x: loser.x,
        y: loser.y - 22,
        duration: 180,
        ease: "Cubic.in",
        onComplete: () => {
          this.cameras.main.shake(180, .008);
          this.tweens.add({ targets: loser, scaleY: .28, scaleX: 1.24, y: loser.y + 68, duration: 130, ease: "Back.in" });
          this.spawnFinishParticles(loser.x, loser.y + 60, COLORS.woodLight, 18);
          this.time.delayedCall(180, () => {
            done();
            this.tweens.add({ targets: winner, x: winnerStart.x, y: winnerStart.y, scale: 1, duration: 260, ease: "Back.out" });
          });
        }
      })
    });
  }

  private playWrap(winner: CardView, loser: CardView, done: () => void) {
    this.tweens.add({ targets: winner, angle: 10, scale: 1.08, yoyo: true, duration: 180 });
    this.tweens.add({ targets: loser, scale: .76, angle: -5, duration: 380, ease: "Sine.inOut" });
    const bands = [
      this.add.rectangle(loser.x - 150, loser.y - 42, 126, 42, COLORS.cream).setRotation(.12),
      this.add.rectangle(loser.x + 150, loser.y + 42, 126, 42, COLORS.cream).setRotation(.12),
      this.add.rectangle(loser.x - 36, loser.y - 145, 48, 170, 0xd8e4cf).setRotation(-.12),
      this.add.rectangle(loser.x + 36, loser.y + 145, 48, 170, 0xd8e4cf).setRotation(-.12),
    ];
    bands.forEach((band, index) => {
      band.setAlpha(.94).setStrokeStyle(3, COLORS.gold);
      this.center.add(band);
      this.tweens.add({ targets: band, x: loser.x + (index % 2 ? 15 : -15), y: loser.y + (index < 2 ? (index ? 28 : -28) : 0), duration: 390, delay: index * 45, ease: "Back.out" });
    });
    this.time.delayedCall(560, () => { this.spawnFinishParticles(loser.x, loser.y, COLORS.cream, 10); done(); });
  }

  private spawnFinishParticles(x: number, y: number, color: number, count: number) {
    for (let index = 0; index < count; index++) {
      const angle = (Math.PI * 2 * index) / count;
      const particle = this.add.rectangle(x, y, index % 2 ? 7 : 11, index % 3 ? 7 : 11, index % 3 ? color : COLORS.gold);
      this.center.add(particle);
      this.tweens.add({ targets: particle, x: x + Math.cos(angle) * (75 + index * 4), y: y + Math.sin(angle) * (55 + index * 3), angle: 180, alpha: 0, duration: 420, onComplete: () => particle.destroy() });
    }
  }

  private impactBurst() {
    for (let index = 0; index < 18; index++) {
      const angle = (Math.PI * 2 * index) / 18;
      const square = this.add.rectangle(640, 286, index % 3 ? 7 : 11, index % 3 ? 7 : 11, index % 2 ? COLORS.gold : COLORS.cyan).setDepth(8);
      this.tweens.add({ targets: square, x: 640 + Math.cos(angle) * (95 + index * 3), y: 286 + Math.sin(angle) * (70 + index * 2), alpha: 0, duration: 460, onComplete: () => square.destroy() });
    }
  }

  private handleKeyDown(event: KeyboardEvent) {
    if (!this.sys.isActive() || !this.controller) return;
    const command = getMatchCommand(event.key);
    if (!command) return;
    event.preventDefault();
    if (command === "DIRECT_CARD") {
      const view = this.handViews[Number(event.key) - 1];
      if (!view) return;
      if (this.activeHandPlayer === "PLAYER_ONE") this.selectPlayerOne(view);
      else this.selectPlayerTwo(view);
      return;
    }
    if (command === "PREVIOUS_CARD") this.focusAdjacentCard(-1);
    else if (command === "NEXT_CARD") this.focusAdjacentCard(1);
    else if (command === "CONFIRM") this.confirmKeyboardChoice();
    else if (command === "CANCEL") this.cancelKeyboardChoice();
    else if (command === "PAUSE" && [MatchPhase.WAITING_FOR_SELECTION, MatchPhase.CARD_SELECTED].includes(this.controller.state.phase)) this.scene.launch("PauseScene", { match: this });
  }

  private focusAdjacentCard(direction: -1 | 1) {
    if (!this.handViews.length) return;
    this.keyboardCardIndex = this.keyboardCardIndex < 0
      ? direction > 0 ? 0 : this.handViews.length - 1
      : (this.keyboardCardIndex + direction + this.handViews.length) % this.handViews.length;
    const view = this.handViews[this.keyboardCardIndex];
    if (this.activeHandPlayer === "PLAYER_ONE") this.selectPlayerOne(view);
    else {
      this.handViews.forEach(candidate => candidate.setSelected(candidate === view));
      this.status.setText("PLAYER 2 · PRESS ENTER TO LOCK THIS CARD");
      audioService.play("select");
    }
  }

  private confirmKeyboardChoice() {
    if (this.localReadyAction) { this.localReadyAction(); return; }
    if (this.activeHandPlayer === "PLAYER_ONE") this.confirmSelection();
    else if (this.keyboardCardIndex >= 0) this.selectPlayerTwo(this.handViews[this.keyboardCardIndex]);
  }

  private cancelKeyboardChoice() {
    if (this.activeHandPlayer === "PLAYER_ONE" && this.selected) {
      this.selected.setSelected(false);
      this.controller.clearSelection("PLAYER_ONE");
      this.selected = null;
      this.keyboardCardIndex = -1;
      this.confirm.setEnabled(false);
      this.status.setText("STEP 1 · CHOOSE A CARD FROM YOUR HAND");
      return;
    }
    if (this.activeHandPlayer === "PLAYER_TWO" && this.keyboardCardIndex >= 0) {
      this.handViews[this.keyboardCardIndex]?.setSelected(false);
      this.keyboardCardIndex = -1;
      this.status.setText("PLAYER 2 · CHOOSE YOUR CARD");
    }
  }

  private updateStreak() {
    if (this.mode === "AI") { this.streakText.setText("BEST OF 3 · LOSE THE MATCH AND THE RUN ENDS"); return; }
    const history = this.controller.state.history;
    const latest = history.at(-1)?.winner;
    if (!latest) { this.streakText.setText(`FIRST TO ${WINNING_SCORE} SEALS`); return; }
    let streak = 0;
    for (let index = history.length - 1; index >= 0 && history[index].winner === latest; index--) streak++;
    this.streakText.setText(streak >= 2 ? `${latest === "PLAYER_ONE" ? "YOUR" : "RIVAL"} STREAK ×${streak}` : `FIRST TO ${WINNING_SCORE} SEALS`);
  }

  private pips(score: number) { return Array.from({ length: WINNING_SCORE }, (_, index) => index < score ? "◆" : "◇").join(" "); }
}
