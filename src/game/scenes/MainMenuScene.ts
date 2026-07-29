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
    drawPixelPanel(this, 640, 96, 1130, 112, COLORS.gold);
    drawPixelPanel(this, 320, 395, 490, 470, COLORS.magenta);
    drawPixelPanel(this, 900, 395, 620, 470, COLORS.cyan);

    this.add.text(112, 78, "HAND OF THREE", pixelText(31, "#f2e8ce")).setOrigin(0, .5);
    this.add.text(114, 117, "KARJITSU // AFTER HOURS", pixelText(10, "#d9785f")).setOrigin(0, .5);
    this.add.text(1168, 77, `ROUND ${String(profile.run.round).padStart(2, "0")}  ·  BEST ${String(profile.bestRound).padStart(2, "0")}`, pixelText(14, "#e0ad4f")).setOrigin(1, .5);
    this.add.text(1168, 116, `${chip.glyph} ${profile.chips} CHIPS  ·  MULT x${getRewardMultiplier(profile).toFixed(2)}`, pixelText(10, "#8fd0c9")).setOrigin(1, .5);

    this.add.text(320, 188, "THE THREE", pixelText(15, "#e0ad4f")).setOrigin(.5);
    const rules = [
      { frame: 0, label: "ROCK", detail: "CRUSHES SCISSORS" },
      { frame: 1, label: "PAPER", detail: "WRAPS ROCK" },
      { frame: 2, label: "SCISSORS", detail: "CUTS PAPER" },
    ];
    rules.forEach((rule, index) => {
      const y = 246 + index * 82;
      this.add.image(150, y, "video-poker-icons", rule.frame).setScale(1.08);
      this.add.text(194, y - 12, rule.label, pixelText(13, "#f2e8ce")).setOrigin(0, .5);
      this.add.text(194, y + 15, rule.detail, pixelText(10, "#9eb9bf")).setOrigin(0, .5);
      this.add.rectangle(320, y + 39, 404, 2, COLORS.cyan, .28);
    });

    this.add.rectangle(320, 532, 404, 88, COLORS.ink, .78).setStrokeStyle(2, COLORS.gold, .72);
    this.add.text(138, 510, "RUN STATUS", pixelText(10, "#8fd0c9")).setOrigin(0, .5);
    this.add.text(138, 545, `WINS ${profile.totalWins}  ·  ITEMS ${itemCount}  ·  RELICS ${profile.run.relics.length}/3`, pixelText(10, "#f2e8ce")).setOrigin(0, .5);
    this.add.text(320, 606, "WIN  ›  CASH  ›  BUY  ›  CLIMB", pixelText(9, "#9eb9bf")).setOrigin(.5);

    this.add.text(900, 188, "PULL UP A CHAIR", pixelText(18, "#e0ad4f")).setOrigin(.5);
    this.add.text(900, 218, "FIRST TO TWO HANDS  ·  THE HOUSE KEEPS YOUR RUN", pixelText(10, "#9eb9bf")).setOrigin(.5);
    const actions: [string, ButtonTone, () => void][] = [
      [`Continue · Rd ${profile.run.round}`, "blue", () => this.scene.start("ModeSelectionScene", { mode: "AI" })],
      [`Daily · Best ${daily.bestRound}`, "orange", () => this.scene.start("MatchScene", { mode: "AI", daily: true })],
      ["Online duel", "blue", () => this.scene.start("OnlineLobbyScene")],
      ["Local duel", "green", () => this.scene.start("ModeSelectionScene", { mode: "LOCAL" })],
      ["Run upgrades", "purple", () => this.scene.start("CollectionScene")],
      ["How to play", "green", () => this.scene.start("TutorialScene")],
      ["Options & time", "orange", () => this.scene.start("SettingsScene")],
      ["Credits", "red", () => this.scene.start("CreditsScene")],
    ];
    actions.forEach(([label, tone, action], index) => {
      const column = index % 2;
      const row = Math.floor(index / 2);
      new GameButton(this, 755 + column * 290, 275 + row * 78, label, action, 252, tone);
    });
    this.add.rectangle(900, 599, 540, 48, COLORS.ink, .76).setStrokeStyle(2, COLORS.cyan, .38);
    this.add.text(900, 599, "ARROWS / WASD TO MOVE  ·  ENTER TO DEAL", pixelText(10, "#c2cbd0")).setOrigin(.5);
    this.add.text(640, 662, "TABLE 03  //  HOUSE RULES, NO REAL WAGERS", pixelText(9, "#9eb9bf")).setOrigin(.5);
  }
}
