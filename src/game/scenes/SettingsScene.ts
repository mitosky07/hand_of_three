import Phaser from "phaser";
import { COLORS, drawPixelBackdrop, drawPixelPanel, pixelText } from "../../config/theme";
import { getSettings, saveSettings } from "../../services/storageService";
import { timeTracker } from "../../services/timeTrackingService";
import { GameButton } from "../objects/GameButton";

export class SettingsScene extends Phaser.Scene {
  constructor() { super("SettingsScene"); }
  create() {
    const settings = getSettings();
    drawPixelBackdrop(this, COLORS.cyan);
    drawPixelPanel(this, 380, 355, 600, 510, COLORS.magenta);
    drawPixelPanel(this, 930, 355, 390, 510, COLORS.cyan);
    this.add.text(118, 130, "TABLE // OPTIONS", pixelText(12, "#9fd3a9")).setOrigin(0, .5);
    this.add.text(118, 185, "CONTROL\nBOOTH", { ...pixelText(27, "#ffd166"), align: "left" }).setOrigin(0, 0);
    const audio = this.add.text(118, 330, "", { ...pixelText(12), align: "left" }).setOrigin(0, 0);
    const time = this.add.text(118, 430, "", { ...pixelText(9, "#c7b99b"), align: "left" }).setOrigin(0, 0);
    const render = () => {
      audio.setText(`AUDIO\n${settings.muted ? "OFF  ○" : "ON   ●"}`);
      const minutes = Math.floor(timeTracker.elapsedMs / 60000);
      time.setText(`PLAY LOG\n${Math.floor(minutes / 60)}H ${minutes % 60}M RECORDED`);
    };
    render();
    this.add.text(785, 155, "ACTIONS", pixelText(14, "#ffd166")).setOrigin(0, .5);
    new GameButton(this, 930, 255, "Toggle audio", () => { settings.muted = !settings.muted; saveSettings(settings); render(); }, 300);
    new GameButton(this, 930, 340, "Export CSV", () => {
      const blob = new Blob([timeTracker.exportCsv()], { type: "text/csv" });
      const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = "hand-of-three-time-log.csv"; link.click(); URL.revokeObjectURL(link.href);
    }, 300);
    new GameButton(this, 930, 525, "Back", () => this.scene.start("MainMenuScene"), 300);
  }
}
