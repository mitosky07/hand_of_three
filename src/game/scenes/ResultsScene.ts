import Phaser from "phaser";
import { COLORS, drawPixelBackdrop, drawPixelPanel, pixelText } from "../../config/theme";
import { MatchController } from "../../domain/matchController";
import type { RoundReward } from "../../domain/progression";
import { progressionService } from "../../services/progressionService";
import { GameButton } from "../objects/GameButton";

export class ResultsScene extends Phaser.Scene {
  private controller!: MatchController;
  private roundReward?: RoundReward;
  constructor() { super("ResultsScene"); }
  init(data: { controller: MatchController; roundReward?: RoundReward }) {
    this.controller = data.controller;
    this.roundReward = data.roundReward;
  }

  create() {
    if (this.controller.state.mode === "AI") this.createRunIntermission();
    else this.createLocalResult();
  }

  private createRunIntermission() {
    const profile = progressionService.get();
    const reward = this.roundReward!;
    const won = reward.won;
    const runEnded = reward.runEnded;
    drawPixelBackdrop(this, won ? COLORS.gold : COLORS.magenta);
    drawPixelPanel(this, 410, 360, 700, 620, won ? COLORS.gold : COLORS.magenta);
    drawPixelPanel(this, 990, 360, 380, 620, COLORS.cyan);
    this.add.text(92, 75, `RUN // ROUND ${String(reward.roundBefore).padStart(2, "0")} · BEST OF 3`, pixelText(9, "#7fa98a")).setOrigin(0, .5);
    this.add.text(92, 145, won ? "MATCH WON" : "RUN OVER", pixelText(29, won ? "#d9b867" : "#a9674e")).setOrigin(0, .5);
    this.add.text(92, 195, won ? `ROUND ${reward.roundAfter} UNLOCKED` : "THE ORACLE WON · BACK TO ROUND 1", pixelText(8, "#efe2bc")).setOrigin(0, .5);
    this.add.rectangle(310, 315, 440, 160, 0x102d24).setStrokeStyle(3, 0xb99b62);
    this.add.text(125, 265, "HOUSE PAYOUT", pixelText(8, "#8e816d")).setOrigin(0, .5);
    this.add.text(125, 320, won ? `◉ +${reward.earned}` : "RUN CHIPS LOST", won ? pixelText(31, "#d9b867") : pixelText(10, "#a9674e")).setOrigin(0, .5);
    this.add.text(125, 365, won ? `${reward.base} BASE × ${reward.multiplier.toFixed(2)} MULT${reward.doubled ? " × 2 ITEM" : ""}` : "A FRESH RUN STARTS FROM ZERO", pixelText(7, "#c9bea0")).setOrigin(0, .5);
    this.add.text(92, 440, `WALLET  ◉ ${profile.chips}\nBEST    ROUND ${profile.bestRound}\nTOTAL WINS  ${profile.totalWins}`, { ...pixelText(9, "#c9bea0"), align: "left", lineSpacing: 13 }).setOrigin(0, 0);
    this.add.text(835, 85, won ? "BETWEEN MATCHES" : "NEW RUN", pixelText(12, "#d9b867")).setOrigin(0, .5);
    new GameButton(this, 990, 190, won ? `Play round ${profile.run.round}` : "Start from round 1", () => this.scene.start("MatchScene", { mode: "AI" }), 300, "blue");
    if (!runEnded) {
      new GameButton(this, 990, 285, "Black market", () => this.scene.start("ShopScene"), 300, "orange");
      new GameButton(this, 990, 380, "View inventory", () => this.scene.start("CollectionScene"), 300, "purple");
    }
    new GameButton(this, 990, 545, "Save & exit", () => this.scene.start("MainMenuScene"), 300, "red");
  }

  private createLocalResult() {
    const state = this.controller.state;
    const won = state.winner === "PLAYER_ONE";
    drawPixelBackdrop(this, won ? COLORS.gold : COLORS.magenta);
    drawPixelPanel(this, 410, 360, 700, 620, won ? COLORS.gold : COLORS.magenta);
    drawPixelPanel(this, 990, 360, 380, 620, COLORS.cyan);
    const heading = state.winner === "DRAW" ? "DRAW" : won ? "PLAYER 1 WINS" : "PLAYER 2 WINS";
    this.add.text(92, 80, "LOCAL DUEL", pixelText(10, "#7fa98a")).setOrigin(0, .5);
    this.add.text(92, 155, heading, pixelText(28, "#d9b867")).setOrigin(0, .5);
    this.add.text(92, 230, `SCORE  ${state.players.PLAYER_ONE.score} — ${state.players.PLAYER_TWO.score}`, pixelText(15, "#efe2bc")).setOrigin(0, .5);
    const wins = state.history.filter((round) => round.winner === "PLAYER_ONE").length;
    const losses = state.history.filter((round) => round.winner === "PLAYER_TWO").length;
    const ties = state.history.filter((round) => !round.winner).length;
    this.add.text(92, 315, `HANDS ${state.history.length}\nP1 ${wins}  ·  P2 ${losses}  ·  DRAWS ${ties}\n\nNO CHIPS OR RUN UPGRADES`, { ...pixelText(9, "#c9bea0"), align: "left", lineSpacing: 13 }).setOrigin(0, 0);
    new GameButton(this, 990, 220, "Rematch", () => this.scene.start("MatchScene", { mode: "LOCAL" }), 300, "blue");
    new GameButton(this, 990, 335, "Change table", () => this.scene.start("ModeSelectionScene", { mode: "LOCAL" }), 300, "green");
    new GameButton(this, 990, 535, "Lobby", () => this.scene.start("MainMenuScene"), 300, "red");
  }
}
