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
    drawPixelPanel(this, 430, 360, 650, 500, accent);
    drawPixelPanel(this, 970, 360, 330, 650, COLORS.gold);
    this.add.text(150, 145, this.mode === "AI" ? "UNDERGROUND TABLE // CPU" : "PRIVATE TABLE // LOCAL", pixelText(9, "#7fa98a")).setOrigin(0, .5);
    this.add.text(150, 198, this.mode === "AI" ? `ROUND ${String(profile.run.round).padStart(2, "0")}` : "TWO PLAYERS", pixelText(29, "#d9b867")).setOrigin(0, .5);
    this.add.text(150, 248, this.mode === "AI" ? `PERSONAL BEST ${profile.bestRound}` : "ONE DEVICE", pixelText(9, "#a9674e")).setOrigin(0, .5);
    this.add.rectangle(266, 390, 210, 190, 0x0b1110).setStrokeStyle(4, accent);
    this.add.text(266, 350, this.mode === "AI" ? "III" : "P1 / P2", pixelText(28, "#d9b867")).setOrigin(.5);
    this.add.text(266, 430, this.mode === "AI" ? `${oracle.name.toUpperCase()}\n${oracle.tagline.toUpperCase()}\nCANNOT SEE YOUR CARD` : "HIDDEN TURNS\nSAME RULES", { ...pixelText(7, "#c9bea0"), align: "center", lineSpacing: 9 }).setOrigin(.5);

    this.add.text(835, 155, "BEFORE YOU ENTER", pixelText(12, "#d9b867")).setOrigin(0, .5);
    if (this.mode === "AI") {
      new GameButton(this, 970, 210, `Play round ${profile.run.round}`, () => this.scene.start("MatchScene", { mode: "AI" }), 270, "blue");
      const toolCount = Object.values(profile.run.items).reduce((total, count) => total + count, 0);
      this.add.text(835, 260, `ROCK +${profile.run.upgrades.rock}  PAPER +${profile.run.upgrades.paper}\nSCISSORS +${profile.run.upgrades.scissors}  MULT x${getRewardMultiplier(profile).toFixed(2)}\nITEMS ${profile.run.doubleTokens + toolCount}  FREE REROLL ${profile.run.freeRerolls}`, { ...pixelText(7, "#c9bea0"), align: "left", lineSpacing: 9 }).setOrigin(0, 0);
      const offer = getContractForRound(profile.run.round);
      this.add.text(835, 375, "OPTIONAL CONTRACT", pixelText(8, "#a9674e")).setOrigin(0, .5);
      const contractText = this.add.text(835, 410, "", { ...pixelText(7, "#efe2bc"), align: "left", wordWrap: { width: 270 }, lineSpacing: 7 }).setOrigin(0, 0);
      let contractButton!: GameButton;
      const renderContract = () => {
        const active = progressionService.get().run.activeContract === offer.id;
        contractText.setText(`${offer.name.toUpperCase()}\n${offer.objective.toUpperCase()}\nREWARD ${offer.reward.toUpperCase()}\n${active ? "STATUS · ACCEPTED" : "STATUS · OPTIONAL"}`);
        contractButton.setLabel(active ? "Drop contract" : "Accept contract");
      };
      contractButton = new GameButton(this, 970, 555, "Accept contract", () => {
        if (progressionService.get().run.activeContract === offer.id) progressionService.clearContract();
        else progressionService.acceptContract(offer.id);
        renderContract();
      }, 270, "purple");
      renderContract();
    } else {
      new GameButton(this, 970, 260, "Open table", () => this.scene.start("MatchScene", { mode: "LOCAL" }), 270, "green");
      this.add.text(835, 345, "FIRST TO 2 SEALS\nNO CHIPS, ITEMS\nOR RUN UPGRADES", { ...pixelText(8, "#c9bea0"), align: "left", lineSpacing: 9 }).setOrigin(0, 0);
    }
    new GameButton(this, 970, this.mode === "AI" ? 630 : 560, "Back to lobby", () => this.scene.start("MainMenuScene"), 270, "red");
  }
}
