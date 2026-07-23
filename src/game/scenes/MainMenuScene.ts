import Phaser from "phaser";
import { COLORS, drawPixelBackdrop, drawPixelPanel, pixelText } from "../../config/theme";
import { getRewardMultiplier } from "../../domain/progression";
import { progressionService } from "../../services/progressionService";
import { GameButton, type ButtonTone } from "../objects/GameButton";

export class MainMenuScene extends Phaser.Scene {
  constructor() { super("MainMenuScene"); }
  create() {
    const profile = progressionService.get();
    drawPixelBackdrop(this, COLORS.gold);
    drawPixelPanel(this, 350, 360, 570, 650, COLORS.magenta);
    drawPixelPanel(this, 930, 360, 480, 650, COLORS.cyan);

    const sign = this.add.graphics();
    sign.fillStyle(0x120d0b).fillRect(112, 82, 470, 188);
    sign.lineStyle(6, 0x6e3b27).strokeRect(112, 82, 470, 188);
    sign.lineStyle(2, COLORS.gold, .8).strokeRect(126, 96, 442, 160);
    for (let x = 145; x < 560; x += 28) {
      sign.fillStyle((x / 28) % 2 ? 0x789b78 : 0xcaa85f).fillRect(x, 105, 6, 6);
      sign.fillRect(x, 241, 6, 6);
    }
    this.add.text(347, 142, "HAND", pixelText(43, "#d9b867")).setOrigin(.5);
    this.add.text(347, 201, "OF THREE", pixelText(34, "#efe2bc")).setOrigin(.5);
    this.add.text(347, 306, "KARJITSU // AFTER HOURS", pixelText(8, "#a9674e")).setOrigin(.5);

    this.add.rectangle(347, 440, 450, 190, 0x102d24, .98).setStrokeStyle(3, 0xb99b62);
    this.add.text(145, 370, "ENDLESS RUN", pixelText(10, "#7fa98a")).setOrigin(0, .5);
    this.add.text(145, 416, `ROUND ${String(profile.run.round).padStart(2, "0")}`, pixelText(21, "#efe2bc")).setOrigin(0, .5);
    this.add.text(430, 416, `BEST ${String(profile.bestRound).padStart(2, "0")}`, pixelText(10, "#d9b867")).setOrigin(.5);
    this.add.text(145, 460, `◉ ${profile.chips} CHIPS   MULT x${getRewardMultiplier(profile).toFixed(2)}\nWINS ${profile.totalWins}   ITEMS ${profile.run.doubleTokens}   RELICS ${profile.run.relics.length}/3`, { ...pixelText(8, "#c9bea0"), align: "left", lineSpacing: 11 }).setOrigin(0, 0);
    this.add.text(347, 566, "WIN  ›  CASH  ›  BUY  ›  CLIMB", pixelText(7, "#8e816d")).setOrigin(.5);

    this.add.text(735, 72, "CHOOSE YOUR NEXT MOVE", pixelText(12, "#d9b867")).setOrigin(0, .5);
    const actions: [string, ButtonTone, () => void][] = [
      [`Continue · round ${profile.run.round}`, "blue", () => this.scene.start("ModeSelectionScene", { mode: "AI" })],
      ["Local duel", "green", () => this.scene.start("ModeSelectionScene", { mode: "LOCAL" })],
      ["Run upgrades", "purple", () => this.scene.start("CollectionScene")],
      ["How to play", "green", () => this.scene.start("TutorialScene")],
      ["Options & time", "orange", () => this.scene.start("SettingsScene")],
      ["Credits", "red", () => this.scene.start("CreditsScene")],
    ];
    actions.forEach(([label, tone, action], index) => new GameButton(this, 930, 145 + index * 78, label, action, 385, tone));
    this.add.text(930, 650, "BEST ROUND AND RUN SAVED AUTOMATICALLY", pixelText(7, "#756a5d")).setOrigin(.5);
  }
}
