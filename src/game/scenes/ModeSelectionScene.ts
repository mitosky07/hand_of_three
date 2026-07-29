import Phaser from "phaser";
import { COLORS, drawPixelBackdrop, drawPixelPanel, pixelText } from "../../config/theme";
import { getRewardMultiplier } from "../../domain/progression";
import { progressionService } from "../../services/progressionService";
import { GameButton } from "../objects/GameButton";
import { getContractForRound } from "../../domain/contracts";
import { getOracleForRound } from "../../domain/oracle";

export class ModeSelectionScene extends Phaser.Scene {
  private mode: "AI" | "LOCAL" = "AI";
  constructor() { super("ModeSelectionScene"); }
  init(data: { mode?: "AI" | "LOCAL" }) { this.mode = data.mode ?? "AI"; }
  create() {
    const profile = progressionService.get();
    const oracle = getOracleForRound(profile.run.round);
    const accent = this.mode === "AI" ? COLORS.magenta : COLORS.cyan;
    drawPixelBackdrop(this, accent);
    drawPixelPanel(this, 350, 360, 560, 560, accent);
    drawPixelPanel(this, 925, 360, 540, 560, COLORS.gold);
    this.add.text(110, 118, this.mode === "AI" ? "UNDERGROUND TABLE // CPU" : "PRIVATE TABLE // LOCAL", pixelText(11, "#8fd0c9")).setOrigin(0, .5);
    this.add.text(110, 168, this.mode === "AI" ? `ROUND ${String(profile.run.round).padStart(2, "0")}` : "TWO PLAYERS", pixelText(29, "#e0ad4f")).setOrigin(0, .5);
    this.add.text(110, 207, this.mode === "AI" ? `PERSONAL BEST ${profile.bestRound}` : "ONE DEVICE", pixelText(11, "#d9785f")).setOrigin(0, .5);
    this.add.rectangle(350, 365, 430, 250, COLORS.ink, .82).setStrokeStyle(3, accent);
    this.add.text(350, 292, this.mode === "AI" ? "III" : "P1 / P2", pixelText(34, "#e0ad4f")).setOrigin(.5);
    this.add.text(350, 375, this.mode === "AI" ? `${oracle.name.toUpperCase()}\n${oracle.tagline.toUpperCase()}\n\nFAIR PLAY · CANNOT SEE YOUR CARD` : "PASS THE DEVICE BETWEEN TURNS\nHIDDEN CHOICES · SAME RULES", { ...pixelText(11, "#f2e8ce"), align: "center", lineSpacing: 10, wordWrap: { width: 360 } }).setOrigin(.5);
    this.add.text(350, 535, "FIRST TO 2 SEALS  ·  BEST OF 3", pixelText(10, "#c2cbd0")).setOrigin(.5);

    this.add.text(695, 118, "BEFORE YOU ENTER", pixelText(16, "#e0ad4f")).setOrigin(0, .5);
    if (this.mode === "AI") {
      new GameButton(this, 925, 178, `Play round ${profile.run.round}`, () => this.scene.start("MatchScene", { mode: "AI" }), 410, "blue");
      const toolCount = Object.values(profile.run.items).reduce((total, count) => total + count, 0);
      this.add.text(720, 230, `ROCK +${profile.run.upgrades.rock}   PAPER +${profile.run.upgrades.paper}\nSCISSORS +${profile.run.upgrades.scissors}   MULT x${getRewardMultiplier(profile).toFixed(2)}\nITEMS ${profile.run.doubleTokens + toolCount}   FREE REROLL ${profile.run.freeRerolls}`, { ...pixelText(10, "#c2cbd0"), align: "left", lineSpacing: 10 }).setOrigin(0, 0);
      const offer = getContractForRound(profile.run.round);
      this.add.text(720, 350, "OPTIONAL CONTRACT", pixelText(11, "#d9785f")).setOrigin(0, .5);
      const contractText = this.add.text(720, 382, "", { ...pixelText(10, "#f2e8ce"), align: "left", wordWrap: { width: 410 }, lineSpacing: 8 }).setOrigin(0, 0);
      let contractButton!: GameButton;
      const renderContract = () => {
        const active = progressionService.get().run.activeContract === offer.id;
        contractText.setText(`${offer.name.toUpperCase()}\n${offer.objective.toUpperCase()}\nREWARD ${offer.reward.toUpperCase()}\n${active ? "STATUS · ACCEPTED" : "STATUS · OPTIONAL"}`);
        contractButton.setLabel(active ? "Drop contract" : "Accept contract");
      };
      contractButton = new GameButton(this, 925, 530, "Accept contract", () => {
        if (progressionService.get().run.activeContract === offer.id) progressionService.clearContract();
        else progressionService.acceptContract(offer.id);
        renderContract();
      }, 410, "purple");
      renderContract();
    } else {
      new GameButton(this, 925, 205, "Open table", () => this.scene.start("MatchScene", { mode: "LOCAL" }), 410, "green");
      this.add.text(720, 290, "FIRST TO 2 SEALS\nNO CHIPS, ITEMS OR RUN UPGRADES\nBOTH PLAYERS USE THE SAME DECK RULES", { ...pixelText(11, "#c2cbd0"), align: "left", lineSpacing: 10 }).setOrigin(0, 0);
    }
    new GameButton(this, 925, 610, "Back to lobby", () => this.scene.start("MainMenuScene"), 410, "red");
  }
}
