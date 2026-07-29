import Phaser from "phaser";
import { COLORS, drawPixelBackdrop, drawPixelPanel, pixelText } from "../../config/theme";
import { MatchController } from "../../domain/matchController";
import type { RoundReward } from "../../domain/progression";
import { progressionService } from "../../services/progressionService";
import { GameButton } from "../objects/GameButton";
import type { DailyReward } from "../../services/dailyService";
import { VICTORY_STAMPS } from "../../domain/cosmetics";

export class ResultsScene extends Phaser.Scene {
  private controller!: MatchController;
  private roundReward?: RoundReward;
  private dailyReward?: DailyReward;
  constructor() { super("ResultsScene"); }
  init(data: { controller: MatchController; roundReward?: RoundReward; dailyReward?: DailyReward }) {
    this.controller = data.controller;
    this.roundReward = data.roundReward;
    this.dailyReward = data.dailyReward;
  }

  create() {
    if (this.dailyReward) this.createDailyResult();
    else if (this.controller.state.mode === "AI") this.createRunIntermission();
    else this.createLocalResult();
  }

  private createDailyResult() {
    const reward = this.dailyReward!;
    drawPixelBackdrop(this, reward.won ? COLORS.cyan : COLORS.magenta);
    drawPixelPanel(this, 410, 360, 700, 620, reward.won ? COLORS.cyan : COLORS.magenta);
    drawPixelPanel(this, 990, 360, 380, 620, COLORS.gold);
    this.add.text(92, 82, `DAILY TABLE // ${reward.state.date}`, pixelText(9, "#7fa98a")).setOrigin(0, .5);
    this.add.text(92, 155, reward.won ? "TABLE CLEARED" : "DAILY RUN OVER", pixelText(27, reward.won ? "#d9b867" : "#a9674e")).setOrigin(0, .5);
    this.add.text(92, 235, reward.won ? `ROUND ${reward.roundAfter} UNLOCKED` : "RETRY FROM ROUND 1", pixelText(11, "#efe2bc")).setOrigin(0, .5);
    this.add.rectangle(310, 350, 440, 170, 0x102d24).setStrokeStyle(3, 0xb99b62);
    this.add.text(125, 305, "DAILY SCORE", pixelText(8, "#8e816d")).setOrigin(0, .5);
    this.add.text(125, 355, reward.won ? `+${reward.earned} · TOTAL ${reward.state.chips}` : `BEST SCORE ${reward.state.bestChips}`, pixelText(20, "#d9b867")).setOrigin(0, .5);
    this.add.text(92, 475, `BEST ROUND ${reward.state.bestRound}\nSEED ${reward.state.date}\nSAME STARTING DEAL FOR EVERYONE`, { ...pixelText(9, "#c9bea0"), lineSpacing: 13 }).setOrigin(0, 0);
    new GameButton(this, 990, 190, reward.won ? `Play round ${reward.roundAfter}` : "Retry daily", () => this.scene.start("MatchScene", { mode: "AI", daily: true }), 300, "blue");
    if (reward.won) new GameButton(this, 990, 290, "Daily market", () => this.scene.start("DailyShopScene"), 300, "orange");
    new GameButton(this, 990, 390, "Copy result", () => void navigator.clipboard?.writeText(`Hand of Three Daily ${reward.state.date} · Round ${reward.state.bestRound} · ${reward.state.bestChips} chips`), 300, "green");
    new GameButton(this, 990, 540, "Lobby", () => this.scene.start("MainMenuScene"), 300, "red");
  }

  private createRunIntermission() {
    const profile = progressionService.get();
    const stamp = VICTORY_STAMPS.find((item) => item.id === profile.selectedVictoryStamp) ?? VICTORY_STAMPS[0];
    const reward = this.roundReward!;
    const won = reward.won;
    const runEnded = reward.runEnded;
    drawPixelBackdrop(this, won ? COLORS.gold : COLORS.magenta);
    drawPixelPanel(this, 410, 360, 700, 620, won ? COLORS.gold : COLORS.magenta);
    drawPixelPanel(this, 990, 360, 380, 620, COLORS.cyan);
    this.add.text(92, 75, `RUN // ROUND ${String(reward.roundBefore).padStart(2, "0")} · BEST OF 3`, pixelText(9, "#7fa98a")).setOrigin(0, .5);
    this.add.text(92, 145, won ? "MATCH WON" : "RUN OVER", pixelText(29, won ? "#d9b867" : "#a9674e")).setOrigin(0, .5);
    if (won) this.add.text(650, 145, `[ ${stamp.label} ]`, pixelText(12, "#7fa98a")).setOrigin(1, .5);
    this.add.text(92, 195, won ? `ROUND ${reward.roundAfter} UNLOCKED` : "THE ORACLE WON · BACK TO ROUND 1", pixelText(8, "#efe2bc")).setOrigin(0, .5);
    this.add.rectangle(310, 315, 440, 160, 0x102d24).setStrokeStyle(3, 0xb99b62);
    this.add.text(125, 265, "HOUSE PAYOUT", pixelText(8, "#8e816d")).setOrigin(0, .5);
    this.add.text(125, 320, won ? `◉ +${reward.earned}` : "RUN CHIPS LOST", won ? pixelText(31, "#d9b867") : pixelText(10, "#a9674e")).setOrigin(0, .5);
    this.add.text(125, 365, won ? `${reward.base} BASE × ${reward.multiplier.toFixed(2)} MULT${reward.bonusChips ? ` + ${reward.bonusChips} MARKED` : ""}${reward.doubled ? " × 2 ITEM" : ""}` : "A FRESH RUN STARTS FROM ZERO", pixelText(9, "#c9bea0")).setOrigin(0, .5);
    if (reward.contractId) this.add.text(125, 410, reward.contractCompleted ? `CONTRACT CLEARED · ${reward.contractReward}` : "CONTRACT MISSED · NO PENALTY", pixelText(9, reward.contractCompleted ? "#7fa98a" : "#a9674e")).setOrigin(0, .5);
    this.add.text(92, 465, `WALLET  ◉ ${profile.chips}\nBEST    ROUND ${profile.bestRound}\nTOTAL WINS  ${profile.totalWins}`, { ...pixelText(9, "#c9bea0"), align: "left", lineSpacing: 13 }).setOrigin(0, 0);
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
