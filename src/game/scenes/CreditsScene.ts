import Phaser from "phaser";
import { COLORS, TEXT_COLORS, drawPixelBackdrop, drawPixelPanel, pixelText } from "../../config/theme";
import { GameButton } from "../objects/GameButton";

export class CreditsScene extends Phaser.Scene {
  constructor() { super("CreditsScene"); }
  create() {
    drawPixelBackdrop(this, COLORS.magenta);
    drawPixelPanel(this, 384, 350, 610, 500, COLORS.magenta);
    drawPixelPanel(this, 930, 350, 390, 500, COLORS.gold);
    this.add.text(120, 130, "CREDITS // TABLE CREW", pixelText(11, TEXT_COLORS.mint)).setOrigin(0, .5);
    this.add.text(120, 188, "HAND\nOF THREE", { ...pixelText(33, TEXT_COLORS.gold), align: "left" }).setOrigin(0, 0);
    this.add.text(120, 330, "CREATED BY\nMITOSKY07\n\nGAME DESIGN & CODE\nMITOSKY07\n\nVISUAL DIRECTION\nAFTER-HOURS VIDEO POKER", { ...pixelText(9), align: "left" }).setOrigin(0, 0);
    this.add.text(780, 158, "PRODUCTION NOTES", pixelText(13, TEXT_COLORS.gold)).setOrigin(0, .5);
    this.add.text(780, 235, "TYPEFACE\nSILKSCREEN · OFL\n\nPIXEL ART\nCUSTOM SPRITES · 1X WORK GRID\n\nAUDIO\nWEB AUDIO SYNTHESIS\n\nBUILD\n1.2.1", { ...pixelText(8, TEXT_COLORS.muted), align: "left" }).setOrigin(0, 0);
    new GameButton(this, 930, 530, "Back to lobby", () => this.scene.start("MainMenuScene"), 300);
  }
}
