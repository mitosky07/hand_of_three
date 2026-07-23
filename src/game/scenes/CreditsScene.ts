import Phaser from "phaser";
import { COLORS, drawPixelBackdrop, drawPixelPanel, pixelText } from "../../config/theme";
import { GameButton } from "../objects/GameButton";

export class CreditsScene extends Phaser.Scene {
  constructor() { super("CreditsScene"); }
  create() {
    drawPixelBackdrop(this, COLORS.magenta);
    drawPixelPanel(this, 384, 350, 610, 500, COLORS.magenta);
    drawPixelPanel(this, 930, 350, 390, 500, COLORS.gold);
    this.add.text(120, 130, "CREDITS // STAFF", pixelText(11, "#9fd3a9")).setOrigin(0, .5);
    this.add.text(120, 188, "HAND\nOF THREE", { ...pixelText(33, "#ffd166"), align: "left" }).setOrigin(0, 0);
    this.add.text(120, 330, "DESIGN & DEVELOPMENT\nHAND OF THREE PROJECT\n\nENGINE\nPHASER + TYPESCRIPT\n\nVISUAL DIRECTION\nPIXEL WOOD CASINO", { ...pixelText(9), align: "left" }).setOrigin(0, 0);
    this.add.text(780, 158, "ASSETS", pixelText(13, "#ffd166")).setOrigin(0, .5);
    this.add.text(780, 235, "TYPEFACE\nPRESS START 2P · OFL\n\nART\nASEPRITE MCP + PHASER\n\nAUDIO\nWEB AUDIO SYNTHESIS", { ...pixelText(8, "#c7b99b"), align: "left" }).setOrigin(0, 0);
    new GameButton(this, 930, 530, "Back to lobby", () => this.scene.start("MainMenuScene"), 300);
  }
}
