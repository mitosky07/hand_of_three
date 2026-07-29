import Phaser from "phaser";
import { COLORS, PIXEL_FONT, drawPixelBackdrop, pixelText } from "../../config/theme";
import { MatchController } from "../../domain/matchController";
import { MatchPhase } from "../../domain/MatchPhase";
import { ELEMENT_LABEL, type ElementType, type PlayerId } from "../../domain/Card";
import type { RoundResult } from "../../domain/resolveRound";
import { getRewardMultiplier, type RoundReward, type RunItemId } from "../../domain/progression";
import { audioService } from "../../services/audioService";
import { CardView } from "../objects/CardView";
import { GameButton } from "../objects/GameButton";
import { getFinishAnimationSpec } from "../animations/finishAnimation";
import { progressionService } from "../../services/progressionService";
import { WINNING_SCORE } from "../../config/gameConfig";
import { getMatchCommand } from "../input/keyboardControls";
import { getSettings } from "../../services/storageService";
import { getOracleForRound } from "../../domain/oracle";
import { createSeededRandom, dailySeed } from "../../domain/random";
import { dailyService } from "../../services/dailyService";
import { CARD_BACKS, CHIP_STYLES, feltById } from "../../domain/cosmetics";

export class MatchScene extends Phaser.Scene {
  private controller!: MatchController;
  private mode: "AI" | "LOCAL" = "AI";
  private daily = false;
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
  private houseMatchActive = false;
  private itemOverlay: Phaser.GameObjects.Container | null = null;
  private activeHandPlayer: PlayerId = "PLAYER_ONE";
  private keyboardCardIndex = -1;
  private localReadyAction: (() => void) | null = null;
  private pendingAdvance: (() => void) | null = null;

  constructor() { super("MatchScene"); }
  init(data: { mode: "AI" | "LOCAL"; daily?: boolean }) { this.mode = data.mode ?? "AI"; this.daily = Boolean(data.daily); }

  create() {
    const profile = progressionService.get();
    const runRound = this.daily ? dailyService.get().round : profile.run.round;
    const oracle = getOracleForRound(runRound);
    const random = this.daily ? createSeededRandom(`${dailySeed()}-round-${runRound}`) : undefined;
    this.controller = new MatchController(
      this.mode,
      undefined,
      this.mode === "AI" ? oracle.name : undefined,
      random,
      this.mode === "AI" ? (this.daily ? dailyService.get().upgrades : profile.run.upgrades) : {},
      oracle.weights,
      { carbonPaper: this.mode === "AI" && !this.daily && profile.run.relics.includes("carbon-paper") },
    );
    drawPixelBackdrop(this, COLORS.gold);
    this.drawTable();
    this.add.rectangle(640, 72, 1160, 86, COLORS.ink, .9).setStrokeStyle(2, COLORS.cyan, .42);
    this.add.rectangle(640, 654, 1110, 62, COLORS.woodDark, .96).setStrokeStyle(3, COLORS.woodLight);
    this.add.rectangle(640, 632, 1040, 3, COLORS.gold, .6);
    this.score = this.add.text(54, 38, "", { fontFamily: PIXEL_FONT, fontSize: "15px", color: "#f2e8ce", lineSpacing: 8 });
    this.opponent = this.add.text(1226, 38, "", { fontFamily: PIXEL_FONT, fontSize: "15px", color: "#f2e8ce", align: "right", lineSpacing: 8 }).setOrigin(1, 0);
    this.roundText = this.add.text(640, 42, "", pixelText(17, "#e0ad4f")).setOrigin(.5);
    this.streakText = this.add.text(640, 72, "", pixelText(10, "#c2cbd0")).setOrigin(.5);
    this.chipsText = this.add.text(300, 100, "", pixelText(10, "#e0ad4f")).setOrigin(0, .5);
    this.multiplierText = this.add.text(980, 100, "", pixelText(10, "#8fd0c9")).setOrigin(1, .5);
    this.center = this.add.container(640, 275);
    this.opponentHand = this.add.container(640, 154);
    this.handCounter = this.add.text(640, 101, "", pixelText(10, "#e0ad4f")).setOrigin(.5);
    this.statusPlate = this.add.rectangle(640, 412, 720, 56, COLORS.ink, .92).setStrokeStyle(2, COLORS.cyan, .55);
    this.status = this.add.text(640, 412, "", { ...pixelText(12), wordWrap: { width: 680 }, lineSpacing: 6 }).setOrigin(.5);
    this.confirm = new GameButton(this, 640, 654, "Deal · Confirm", () => this.confirmSelection(), 250, "blue");
    new GameButton(this, 220, 654, "Pause", () => this.openPause(), 180, "red");
    this.doubleButton = new GameButton(this, 1060, 654, "I · Run items", () => this.openItemMenu(), 220, "purple");
    this.doubleButton.setVisible(this.mode === "AI" && !this.daily);
    const keyboard = this.input.keyboard;
    keyboard?.on("keydown", this.handleKeyDown, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => keyboard?.off("keydown", this.handleKeyDown, this));
    this.render();
  }

  private drawTable() {
    const felt = feltById(progressionService.get().selectedFelt);
    const tableTextures = {
      CLASSIC_FELT: "video-poker-table-classic",
      MIDNIGHT_FELT: "video-poker-table-midnight",
      CRIMSON_FELT: "video-poker-table-crimson",
      VIOLET_FELT: "video-poker-table-violet",
    } as const;
    this.add.image(640, 367, tableTextures[felt.id]).setDepth(-5);
  }

  private render() {
    const { players, round, phase } = this.controller.state;
    const profile = progressionService.get();
    this.score.setText(this.mode === "AI" ? `YOU\nSEALS ${players.PLAYER_ONE.score}/${WINNING_SCORE}` : `${players.PLAYER_ONE.name.toUpperCase()}\n${this.pips(players.PLAYER_ONE.score)}  ·  DECK ${players.PLAYER_ONE.deck.length}`);
    this.opponent.setText(this.mode === "AI" ? `${players.PLAYER_TWO.name.toUpperCase()}\nSEALS ${players.PLAYER_TWO.score}/${WINNING_SCORE}` : `${players.PLAYER_TWO.name.toUpperCase()}\n${this.pips(players.PLAYER_TWO.score)}  ·  DECK ${players.PLAYER_TWO.deck.length}`);
    this.roundText.setText(`${this.daily ? "DAILY " : ""}ROUND ${String(this.mode === "AI" ? (this.daily ? dailyService.get().round : profile.run.round) : round).padStart(2, "0")}`);
    const maxHands = WINNING_SCORE * 2 - 1;
    this.handCounter.setText(this.mode === "AI" ? `HAND ${Math.min(round, maxHands)} OF ${maxHands} · FIRST TO ${WINNING_SCORE}` : `HAND ${round} · FIRST TO ${WINNING_SCORE}`);
    this.updateEconomyHud();
    this.renderOpponentHand(players.PLAYER_TWO.hand.length);
    this.updateStreak();
    if (phase === MatchPhase.WAITING_FOR_SELECTION || phase === MatchPhase.CARD_SELECTED) {
      this.renderHand("PLAYER_ONE");
      this.status.setText(this.selected ? "CARD SET · DEAL WHEN READY" : "CHOOSE ONE CARD");
      this.confirm.setVisible(true).setEnabled(Boolean(this.selected));
      const itemCount = this.runItemCount();
      this.doubleButton.setLabel(this.doubleActive ? `x2 active · ${itemCount}` : `I · Items ${itemCount}`);
      this.doubleButton.setVisible(this.mode === "AI" && !this.daily).setEnabled(this.mode === "AI" && !this.daily && itemCount > 0);
    }
  }

  private renderHand(player: PlayerId) {
    this.handViews.forEach(view => view.destroy());
    this.handViews = [];
    this.activeHandPlayer = player;
    this.keyboardCardIndex = -1;
    const hand = this.controller.state.players[player].hand;
    const spacing = Math.min(134, 690 / Math.max(1, hand.length));
    const start = 640 - ((hand.length - 1) * spacing) / 2;
    hand.forEach((card, index) => {
      const distance = index - (hand.length - 1) / 2;
      const view = new CardView(this, start + index * spacing, 530 + Math.abs(distance) * 3, card);
      view.setRestingScale(.74).setAngle(distance * 1.25);
      view.setAlpha(0).setY(view.y + 26);
      this.tweens.add({ targets: view, y: view.y - 26, alpha: 1, duration: 260, delay: index * 55, ease: "Back.out" });
      (view.list[1] as Phaser.GameObjects.Rectangle).on("pointerup", () => player === "PLAYER_ONE" ? this.selectPlayerOne(view) : this.selectPlayerTwo(view));
      this.handViews.push(view);
    });
  }

  private renderOpponentHand(count: number) {
    this.opponentHand.removeAll(true);
    const back = CARD_BACKS.find((item) => item.id === progressionService.get().selectedCardBack) ?? CARD_BACKS[0];
    for (let index = 0; index < count; index++) {
      const x = (index - (count - 1) / 2) * 34;
      const color = this.add.rectangle(x - 1, -1, 47, 68, back.color);
      const card = this.add.image(x, 0, "video-card-back").setScale(.42);
      const mark = this.add.text(x, 0, back.mark, pixelText(7, "#f2e8ce")).setOrigin(.5).setStroke("#080b0e", 2);
      color.setAlpha(0); card.setAlpha(0); mark.setAlpha(0);
      this.tweens.add({ targets: [color, card, mark], alpha: 1, duration: 170, delay: index * 45 });
      this.opponentHand.add([color, card, mark]);
    }
  }

  private selectPlayerOne(view: CardView) {
    const phase = this.controller.state.phase;
    if (phase !== MatchPhase.WAITING_FOR_SELECTION && phase !== MatchPhase.CARD_SELECTED) return;
    if (this.selected && this.selected !== view) {
      this.selected.setSelected(false);
      this.controller.clearSelection("PLAYER_ONE");
      this.selected = null;
    }
    if (!this.controller.select("PLAYER_ONE", view.card.id)) {
      this.status.setText("HEAVY CARDS CANNOT FOLLOW THE SAME ELEMENT");
      return;
    }
    this.selected = view;
    this.keyboardCardIndex = this.handViews.indexOf(view);
    view.setSelected(true);
    this.status.setText(this.selectionForecast(view.card));
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
    const choice = this.controller.chooseRandomCard("PLAYER_TWO");
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
    if (!this.controller.select("PLAYER_TWO", view.card.id)) {
      this.status.setText("HEAVY CARDS CANNOT FOLLOW THE SAME ELEMENT");
      return;
    }
    this.handViews.forEach(item => item.disableInteractive());
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
    if (result.luckyTriggered?.length) detail += ` · LUCKY x2: ${result.luckyTriggered.map((id) => id === "PLAYER_ONE" ? "YOU" : "RIVAL").join(" + ")}`;
    if (this.mode === "AI") detail += `\nSCORE ${this.controller.state.players.PLAYER_ONE.score} — ${this.controller.state.players.PLAYER_TWO.score} · BEST OF 3`;
    this.status.setText(`${title}\n${detail} · ENTER TO CONTINUE`);
    audioService.play(result.winner === "PLAYER_ONE" ? "win" : result.winner === "PLAYER_TWO" ? "lose" : "tie");
    if (result.winner && !getSettings().reducedMotion) this.cameras.main.shake(130, .004);
    let advanced = false;
    const advance = () => {
      if (advanced) return;
      advanced = true;
      this.pendingAdvance = null;
      this.center.removeAll(true);
      if (this.mode === "AI") {
        this.controller.finishRound(this.houseMatchActive && !result.winner);
        this.houseMatchActive = false;
        if (this.controller.state.phase === MatchPhase.MATCH_FINISHED) {
          if (this.daily) {
            const dailyReward = dailyService.finish(this.controller.state.winner === "PLAYER_ONE");
            this.scene.start("ResultsScene", { controller: this.controller, dailyReward });
            return;
          }
          const matchReward: RoundReward = progressionService.finishMatch(
            this.controller.state.winner === "PLAYER_ONE",
            playerOne.element,
            this.doubleActive,
            this.controller.state.bonusChips,
            this.controller.state.bonusMultiplier + (this.controller.state.wasBehind && progressionService.get().run.relics.includes("red-thread") ? .25 : 0),
            {
              playerScore: this.controller.state.players.PLAYER_ONE.score,
              opponentScore: this.controller.state.players.PLAYER_TWO.score,
              history: this.controller.state.history,
            },
          );
          this.doubleActive = false;
          this.doubleButton.setLabel("I · Run items");
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
    };
    this.pendingAdvance = advance;
    this.time.delayedCall(getSettings().reducedMotion ? 850 : 1850, advance);
  }

  private activateDoubleToken() {
    if (this.doubleActive || !progressionService.useDoubleToken()) return;
    this.doubleActive = true;
    this.closeItemMenu();
    this.status.setText("ITEM ACTIVE · x2 CHIPS IF YOU WIN THIS MATCH");
    this.updateEconomyHud();
  }

  private openItemMenu() {
    if (this.itemOverlay || this.mode !== "AI" || this.daily) return;
    const run = progressionService.get().run;
    const overlay = this.add.container(0, 0).setDepth(30);
    this.itemOverlay = overlay;
    overlay.add([
      this.add.rectangle(640, 360, 1280, 720, COLORS.ink, .9),
      this.add.rectangle(640, 350, 760, 570, COLORS.panelDark).setStrokeStyle(5, COLORS.violet),
      this.add.text(640, 105, "RUN ITEMS", pixelText(20, "#d9b867")).setOrigin(.5),
      this.add.text(640, 140, "USE BEFORE LOCKING · PRESS 1-5 · ESC TO CLOSE", pixelText(9, "#c9bea0")).setOrigin(.5),
    ]);
    const entries: Array<[string, number, () => void]> = [
      [`DOUBLE CHIP ×${run.doubleTokens}`, run.doubleTokens, () => this.activateDoubleToken()],
      [`LOADED COIN ×${run.items["loaded-coin"]}`, run.items["loaded-coin"], () => this.useRunItem("loaded-coin")],
      [`SMOKE BREAK ×${run.items["smoke-break"]}`, run.items["smoke-break"], () => this.useRunItem("smoke-break")],
      [`TABLE KNOCK ×${run.items["table-knock"]}`, run.items["table-knock"], () => this.useRunItem("table-knock")],
      [`HOUSE MATCH ×${run.items["house-match"]}`, run.items["house-match"], () => this.useRunItem("house-match")],
    ];
    entries.forEach(([label, count, action], index) => {
      const button = new GameButton(this, 640, 205 + index * 72, label, action, 500, index % 2 ? "blue" : "purple").setDepth(31);
      button.setEnabled(count > 0 && !(index === 0 && this.doubleActive));
      overlay.add(button);
    });
    const close = new GameButton(this, 640, 590, "Close", () => this.closeItemMenu(), 250, "red").setDepth(31);
    overlay.add(close);
  }

  private closeItemMenu() {
    this.itemOverlay?.destroy(true);
    this.itemOverlay = null;
  }

  private useRunItem(id: RunItemId) {
    if ((id === "loaded-coin" || id === "table-knock") && !this.selected) {
      this.status.setText("SELECT A CARD BEFORE USING THIS ITEM");
      this.closeItemMenu();
      return;
    }
    if (!progressionService.useRunItem(id)) return;
    if (id === "loaded-coin") {
      this.controller.rerollCard("PLAYER_ONE", this.selected!.card.id);
      this.selected = null;
      this.closeItemMenu();
      this.render();
      this.status.setText("LOADED COIN · CARD REROLLED");
    } else if (id === "smoke-break") {
      const elements = [...new Set(this.controller.state.players.PLAYER_TWO.hand.map((card) => ELEMENT_LABEL[card.element]))];
      this.status.setText(`SMOKE BREAK · ORACLE MAY HOLD ${elements.join(" / ")}`);
    } else if (id === "table-knock") {
      this.selected!.setLevel(this.selected!.card.level + 3);
      this.status.setText(`TABLE KNOCK · ${ELEMENT_LABEL[this.selected!.card.element]} NOW LV ${this.selected!.card.level}`);
    } else {
      this.houseMatchActive = true;
      this.status.setText("HOUSE MATCH ACTIVE · A DRAW DISCARDS BOTH CARDS");
    }
    this.closeItemMenu();
  }

  private runItemCount() {
    const run = progressionService.get().run;
    return run.doubleTokens + Object.values(run.items).reduce((total, count) => total + count, 0);
  }

  private updateEconomyHud() {
    if (this.mode !== "AI") {
      this.chipsText.setText("LOCAL MODE · NO PROGRESSION");
      this.multiplierText.setText("");
      return;
    }
    if (this.daily) {
      const daily = dailyService.get();
      this.chipsText.setText(`DAILY SEED ${daily.date}`);
      this.multiplierText.setText(`SCORE ${daily.chips} · BEST ROUND ${daily.bestRound}`);
      return;
    }
    const profile = progressionService.get();
    const chip = CHIP_STYLES.find((item) => item.id === profile.selectedChipStyle) ?? CHIP_STYLES[0];
    this.chipsText.setText(`${chip.glyph} ${profile.chips} CHIPS`);
    this.multiplierText.setText(`MULT x${getRewardMultiplier(profile).toFixed(2)} · ITEMS ${this.runItemCount()}${this.doubleActive ? " · x2 ACTIVE" : ""}`);
  }

  private playFinishAnimation(element: ElementType, winner: CardView, loser: CardView, done: () => void) {
    const spec = getFinishAnimationSpec(element);
    this.status.setText(spec.announcement);
    if (getSettings().reducedMotion) {
      loser.setAlpha(.42);
      this.time.delayedCall(220, done);
      return;
    }
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
    if (this.itemOverlay) {
      event.preventDefault();
      if (/^[1-5]$/.test(event.key)) this.activateItemSlot(Number(event.key) - 1);
      else if (event.key === "Escape" || event.key === "Backspace" || event.key.toLowerCase() === "i") this.closeItemMenu();
      return;
    }
    if (event.key.toLowerCase() === "i" && this.mode === "AI" && !this.daily && this.runItemCount() > 0) {
      event.preventDefault();
      this.openItemMenu();
      return;
    }
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
    else if (command === "PAUSE" && [MatchPhase.WAITING_FOR_SELECTION, MatchPhase.CARD_SELECTED].includes(this.controller.state.phase)) this.openPause();
  }

  private openPause() {
    this.scene.launch("PauseScene", {
      match: this,
      allowRestart: this.mode === "LOCAL",
      leaveLabel: this.mode === "LOCAL" ? "Leave table" : this.daily ? "Forfeit daily" : "Forfeit run",
      onLeave: () => this.forfeitMatch(),
    });
  }

  private forfeitMatch() {
    if (this.daily) dailyService.finish(false);
    else if (this.mode === "AI") progressionService.finishMatch(false, "rock", false);
    this.scene.stop();
    this.scene.start("MainMenuScene");
  }

  private activateItemSlot(index: number) {
    const actions = [
      () => this.activateDoubleToken(),
      () => this.useRunItem("loaded-coin"),
      () => this.useRunItem("smoke-break"),
      () => this.useRunItem("table-knock"),
      () => this.useRunItem("house-match"),
    ];
    actions[index]?.();
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
    if (this.pendingAdvance) { this.pendingAdvance(); return; }
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
      this.status.setText("CHOOSE ONE CARD");
      return;
    }
    if (this.activeHandPlayer === "PLAYER_TWO" && this.keyboardCardIndex >= 0) {
      this.handViews[this.keyboardCardIndex]?.setSelected(false);
      this.keyboardCardIndex = -1;
      this.status.setText("PLAYER 2 · CHOOSE YOUR CARD");
    }
  }

  private updateStreak() {
    if (this.mode === "AI") { this.streakText.setText(this.daily ? "DAILY TABLE · SAME DEAL FOR EVERY PLAYER" : "BEST OF 3 · LOSE THE MATCH AND THE RUN ENDS"); return; }
    const history = this.controller.state.history;
    const latest = history.at(-1)?.winner;
    if (!latest) { this.streakText.setText(`FIRST TO ${WINNING_SCORE} SEALS`); return; }
    let streak = 0;
    for (let index = history.length - 1; index >= 0 && history[index].winner === latest; index--) streak++;
    this.streakText.setText(streak >= 2 ? `${latest === "PLAYER_ONE" ? "YOUR" : "RIVAL"} STREAK ×${streak}` : `FIRST TO ${WINNING_SCORE} SEALS`);
  }

  private pips(score: number) { return Array.from({ length: WINNING_SCORE }, (_, index) => index < score ? "◆" : "◇").join(" "); }

  private selectionForecast(card: { element: ElementType; level: number }) {
    const beats: Record<ElementType, ElementType> = { rock: "scissors", scissors: "paper", paper: "rock" };
    const losesTo: Record<ElementType, ElementType> = { rock: "paper", scissors: "rock", paper: "scissors" };
    const bonus = this.mode === "AI" && !this.daily ? progressionService.get().run.upgrades[card.element] : 0;
    return `${ELEMENT_LABEL[card.element]} LV ${card.level} · BEATS ${ELEMENT_LABEL[beats[card.element]]} · LOSES TO ${ELEMENT_LABEL[losesTo[card.element]]}\nRUN BONUS +${bonus} · CONFIRM WHEN READY`;
  }
}
