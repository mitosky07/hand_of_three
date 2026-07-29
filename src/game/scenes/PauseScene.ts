import Phaser from "phaser";
import { COLORS, drawPixelPanel, pixelText } from "../../config/theme";
import { GameButton } from "../objects/GameButton";

export class PauseScene extends Phaser.Scene {
  constructor() { super("PauseScene"); }
  create(data: { match: Phaser.Scene; allowRestart: boolean; leaveLabel: string; onLeave: () => void }) {
    data.match.scene.pause();
    this.add.rectangle(640, 360, 1280, 720, COLORS.ink, .88);
    drawPixelPanel(this, 640, 360, 700, data.allowRestart ? 410 : 350, COLORS.magenta);
    this.add.text(640, data.allowRestart ? 205 : 235, "TABLE PAUSED", pixelText(27, "#e0ad4f")).setOrigin(.5);
    this.add.text(640, data.allowRestart ? 246 : 276, "THE DEALER WAITS  ·  YOUR RUN IS SAFE", pixelText(11, "#8fd0c9")).setOrigin(.5);
    if (data.allowRestart) {
      new GameButton(this, 640, 310, "Continue", () => { this.scene.stop(); data.match.scene.resume(); }, 390);
      new GameButton(this, 640, 382, "Restart duel", () => { this.scene.stop(); data.match.scene.restart(); }, 390, "blue");
      new GameButton(this, 640, 454, data.leaveLabel, () => { this.scene.stop(); data.onLeave(); }, 390, "red");
    } else {
      new GameButton(this, 640, 350, "Continue", () => { this.scene.stop(); data.match.scene.resume(); }, 390);
      new GameButton(this, 640, 430, data.leaveLabel, () => { this.scene.stop(); data.onLeave(); }, 390, "red");
    }
  }
}
