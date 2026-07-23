import Phaser from "phaser";
import { COLORS, drawPixelPanel, pixelText } from "../../config/theme";
import { GameButton } from "../objects/GameButton";

export class PauseScene extends Phaser.Scene {
  constructor() { super("PauseScene"); }
  create(data: { match: Phaser.Scene }) {
    data.match.scene.pause();
    this.add.rectangle(640, 360, 1280, 720, COLORS.ink, .9);
    drawPixelPanel(this, 710, 350, 760, 470, COLORS.magenta);
    this.add.text(380, 170, "TABLE\nPAUSED", { ...pixelText(27, "#ffd166"), align: "left" }).setOrigin(0, 0);
    this.add.text(380, 285, "THE DEALER WAITS", pixelText(8, "#9fd3a9")).setOrigin(0, .5);
    new GameButton(this, 800, 245, "Continue", () => { this.scene.stop(); data.match.scene.resume(); }, 340);
    new GameButton(this, 800, 330, "Restart duel", () => { this.scene.stop(); data.match.scene.restart(); }, 340);
    new GameButton(this, 800, 415, "Leave table", () => { this.scene.stop(); data.match.scene.stop(); this.scene.start("MainMenuScene"); }, 340);
  }
}
