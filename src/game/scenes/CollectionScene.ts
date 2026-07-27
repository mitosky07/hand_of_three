import Phaser from "phaser";
import { COLORS, drawPixelBackdrop, drawPixelPanel, pixelText } from "../../config/theme";
import { ELEMENT_LABEL, type ElementType } from "../../domain/Card";
import { getRewardMultiplier } from "../../domain/progression";
import { progressionService } from "../../services/progressionService";
import { GameButton } from "../objects/GameButton";

const RELIC_LABELS: Record<string, string> = {
  "stone-idol": "STONE IDOL",
  "paper-crown": "PAPER CROWN",
  "silver-shears": "SILVER SHEARS",
  "golden-chip": "GOLDEN CHIP",
  "brass-knuckles": "BRASS KNUCKLES",
  "carbon-paper": "CARBON PAPER",
  "red-thread": "RED THREAD",
  "dealers-eye": "DEALER'S EYE",
};

export class CollectionScene extends Phaser.Scene {
  constructor() { super("CollectionScene"); }
  create() {
    const profile = progressionService.get();
    const run = profile.run;
    drawPixelBackdrop(this, COLORS.violet);
    drawPixelPanel(this, 250, 360, 420, 650, COLORS.gold);
    drawPixelPanel(this, 780, 225, 580, 380, COLORS.cyan);
    drawPixelPanel(this, 780, 560, 580, 240, COLORS.magenta);
    this.add.text(72, 70, "INVENTORY", pixelText(22, "#d9b867")).setOrigin(0, .5);
    this.add.text(72, 105, "UPGRADES AVAILABLE DURING RUNS", pixelText(7, "#7fa98a")).setOrigin(0, .5);
    this.add.text(72, 160, `ROUND ${run.round}  /  BEST ${profile.bestRound}`, pixelText(12, "#efe2bc")).setOrigin(0, .5);
    this.add.text(72, 205, `◉ ${profile.chips} CHIPS`, pixelText(16, "#d9b867")).setOrigin(0, .5);
    this.add.text(72, 260, `RUN WINS      ${run.wins}\nTOTAL WINS    ${profile.totalWins}\nTOTAL EARNED  ${profile.totalEarned}\nCURRENT MULT  x${getRewardMultiplier(profile).toFixed(2)}\n\nLOSE BEST OF 3:\nTHE RUN RESETS.`, { ...pixelText(8, "#c9bea0"), align: "left", lineSpacing: 12 }).setOrigin(0, 0);
    const tools = Object.values(run.items).reduce((total, count) => total + count, 0);
    this.add.text(72, 455, `DOUBLE CHIPS  ${run.doubleTokens}\nRUN TOOLS     ${tools}\nRELICS        ${run.relics.length}/3`, { ...pixelText(8), align: "left", lineSpacing: 12 }).setOrigin(0, 0);
    new GameButton(this, 250, 550, "Table cosmetics", () => this.scene.start("CosmeticsScene"), 320, "purple");
    new GameButton(this, 250, 610, "How upgrades work", () => this.scene.start("TutorialScene"), 320, "green");
    new GameButton(this, 250, 670, "Back", () => this.scene.start("MainMenuScene"), 320, "red");

    this.add.text(520, 75, "RUN CARDS", pixelText(15, "#efe2bc")).setOrigin(0, .5);
    (["rock", "paper", "scissors"] as ElementType[]).forEach((element, index) => {
      const y = 140 + index * 90;
      const colors = { rock: 0x713d38, paper: 0x315f6b, scissors: 0x55425f };
      this.add.rectangle(780, y, 470, 65, colors[element]).setStrokeStyle(3, 0xb99b62);
      this.add.text(565, y - 10, ELEMENT_LABEL[element], pixelText(10)).setOrigin(0, .5);
      this.add.text(565, y + 16, `LEVEL BONUS +${run.upgrades[element]}`, pixelText(8, "#c9bea0")).setOrigin(0, .5);
      for (let pip = 0; pip < 3; pip++) this.add.rectangle(930 + pip * 34, y, 22, 22, pip < run.upgrades[element] ? COLORS.gold : 0x0b1f19).setStrokeStyle(2, 0xb99b62);
    });
    this.add.text(520, 470, "EQUIPPED RELICS", pixelText(13, "#efe2bc")).setOrigin(0, .5);
    const relicText = run.relics.length ? run.relics.map((id, index) => `${index + 1}. ${RELIC_LABELS[id]}`).join("\n") : "NONE YET.\nBUY THEM BETWEEN WON MATCHES.";
    this.add.text(520, 515, relicText, { ...pixelText(8, run.relics.length ? "#d9b867" : "#756a5d"), align: "left", lineSpacing: 12 }).setOrigin(0, 0);
  }
}
