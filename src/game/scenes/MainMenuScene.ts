import Phaser from "phaser";
import { COLORS, drawPixelBackdrop, drawPixelPanel, pixelText } from "../../config/theme";
import { getRewardMultiplier } from "../../domain/progression";
import { progressionService } from "../../services/progressionService";
import { GameButton, type ButtonTone } from "../objects/GameButton";
import { dailyService } from "../../services/dailyService";
import { CHIP_STYLES } from "../../domain/cosmetics";

export class MainMenuScene extends Phaser.Scene {
  constructor() { super("MainMenuScene"); }
  create() {
    const profile = progressionService.get();
    const daily = dailyService.get();
    const chip = CHIP_STYLES.find((item) => item.id === profile.selectedChipStyle) ?? CHIP_STYLES[0];
    const itemCount = profile.run.doubleTokens + Object.values(profile.run.items).reduce((total, count) => total + count, 0);
    drawPixelBackdrop(this, COLORS.gold);
    drawPixelPanel(this, 350, 360, 570, 650, COLORS.magenta);
    drawPixelPanel(this, 930, 360, 480, 650, COLORS.cyan);

    const sign = this.add.graphics();
    sign.fillStyle(COLORS.ink).fillRect(122, 92, 450, 166);
    sign.lineStyle(3, COLORS.woodLight).strokeRect(122, 92, 450, 166);
    sign.fillStyle(COLORS.magenta).fillRect(138, 108, 72, 4);
    sign.fillStyle(COLORS.gold).fillRect(484, 238, 72, 4);
    this.add.text(148, 120, "HOUSE GAME No. 03", pixelText(8, "#8ca893")).setOrigin(0, .5);
    this.add.text(347, 164, "HAND OF THREE", pixelText(30, "#e8dcc0")).setOrigin(.5);
    this.add.text(347, 210, "ROCK  /  PAPER  /  SCISSORS", pixelText(8, "#c7a45b")).setOrigin(.5);
    this.add.text(347, 300, "AN AFTER-HOURS CARD GAME", pixelText(8, "#b06b55")).setOrigin(.5);

    this.add.rectangle(347, 440, 450, 190, COLORS.panelDark, .98).setStrokeStyle(2, COLORS.gold, .66);
    this.add.text(145, 370, "ENDLESS RUN", pixelText(10, "#7fa98a")).setOrigin(0, .5);
    this.add.text(145, 416, `ROUND ${String(profile.run.round).padStart(2, "0")}`, pixelText(21, "#efe2bc")).setOrigin(0, .5);
    this.add.text(430, 416, `BEST ${String(profile.bestRound).padStart(2, "0")}`, pixelText(10, "#d9b867")).setOrigin(.5);
    this.add.text(145, 460, `${chip.glyph} ${profile.chips} CHIPS   MULT x${getRewardMultiplier(profile).toFixed(2)}\nWINS ${profile.totalWins}   ITEMS ${itemCount}   RELICS ${profile.run.relics.length}/3`, { ...pixelText(8, "#c9bea0"), align: "left", lineSpacing: 11 }).setOrigin(0, 0);
    this.add.text(347, 566, "WIN  ›  CASH  ›  BUY  ›  CLIMB", pixelText(7, "#8e816d")).setOrigin(.5);

    this.add.text(735, 72, "CHOOSE YOUR NEXT MOVE", pixelText(12, "#d9b867")).setOrigin(0, .5);
    const actions: [string, ButtonTone, () => void][] = [
      [`Continue · round ${profile.run.round}`, "blue", () => this.scene.start("ModeSelectionScene", { mode: "AI" })],
      [`Daily table · best ${daily.bestRound}`, "orange", () => this.scene.start("MatchScene", { mode: "AI", daily: true })],
      ["Online duel", "blue", () => this.scene.start("OnlineLobbyScene")],
      ["Local duel", "green", () => this.scene.start("ModeSelectionScene", { mode: "LOCAL" })],
      ["Run upgrades", "purple", () => this.scene.start("CollectionScene")],
      ["How to play", "green", () => this.scene.start("TutorialScene")],
      ["Options & time", "orange", () => this.scene.start("SettingsScene")],
      ["Credits", "red", () => this.scene.start("CreditsScene")],
    ];
    actions.forEach(([label, tone, action], index) => new GameButton(this, 930, 110 + index * 66, label, action, 385, tone));
    this.add.text(930, 650, "BEST ROUND AND RUN SAVED AUTOMATICALLY", pixelText(7, "#756a5d")).setOrigin(.5);
  }
}
