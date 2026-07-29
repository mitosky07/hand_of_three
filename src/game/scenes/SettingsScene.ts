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
    drawPixelPanel(this, 640, 360, 920, 520, COLORS.cyan);
    this.add.text(220, 138, "CONTROL BOOTH", pixelText(27, "#e0ad4f")).setOrigin(0, .5);
    this.add.text(220, 178, "TABLE OPTIONS  ·  ACCESSIBILITY  ·  PLAY LOG", pixelText(10, "#8fd0c9")).setOrigin(0, .5);
    this.add.rectangle(390, 365, 340, 280, COLORS.ink, .68).setStrokeStyle(2, COLORS.magenta, .72);
    const audio = this.add.text(255, 265, "", { ...pixelText(14), align: "left", lineSpacing: 10 }).setOrigin(0, 0);
    const time = this.add.text(255, 455, "", { ...pixelText(11, "#c2cbd0"), align: "left" }).setOrigin(0, 0);
    const render = () => {
      audio.setText(`AUDIO\n${settings.muted ? "OFF  ○" : "ON   ●"}\n\nMOTION\n${settings.reducedMotion ? "REDUCED" : "FULL"}`);
      const minutes = Math.floor(timeTracker.elapsedMs / 60000);
      time.setText(`PLAY LOG\n${Math.floor(minutes / 60)}H ${minutes % 60}M RECORDED`);
    };
    render();
    this.add.text(800, 230, "ACTIONS", pixelText(15, "#e0ad4f")).setOrigin(.5);
    new GameButton(this, 800, 290, "Toggle audio", () => { settings.muted = !settings.muted; saveSettings(settings); render(); }, 350);
    new GameButton(this, 800, 365, "Toggle motion", () => { settings.reducedMotion = !settings.reducedMotion; saveSettings(settings); render(); }, 350, "purple");
    new GameButton(this, 800, 440, "Export CSV", () => {
      const blob = new Blob([timeTracker.exportCsv()], { type: "text/csv" });
      const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = "hand-of-three-time-log.csv"; link.click(); URL.revokeObjectURL(link.href);
    }, 350);
    new GameButton(this, 800, 535, "Back", () => this.scene.start("MainMenuScene"), 350, "red");
  }
}
