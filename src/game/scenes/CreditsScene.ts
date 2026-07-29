import Phaser from "phaser";
import { COLORS, TEXT_COLORS, drawPixelBackdrop, drawPixelPanel, pixelText } from "../../config/theme";
import { GameButton } from "../objects/GameButton";

export class CreditsScene extends Phaser.Scene {
  constructor() { super("CreditsScene"); }
  create() {
    drawPixelBackdrop(this, COLORS.magenta);
    drawPixelPanel(this, 640, 360, 920, 520, COLORS.magenta);
    this.add.text(220, 145, "HAND OF THREE", pixelText(33, TEXT_COLORS.gold)).setOrigin(0, .5);
    this.add.text(220, 188, "CREDITS // TABLE CREW", pixelText(11, TEXT_COLORS.mint)).setOrigin(0, .5);
    this.add.rectangle(440, 365, 430, 280, COLORS.ink, .66).setStrokeStyle(2, COLORS.magenta, .65);
    this.add.text(260, 260, "CREATED BY\nMITOSKY07\n\nGAME DESIGN & CODE\nMITOSKY07\n\nART & INTERFACE\nORIGINAL ASEPRITE PIXEL WORK", { ...pixelText(11), align: "left", lineSpacing: 9 }).setOrigin(0, 0);
    this.add.text(720, 235, "PRODUCTION NOTES", pixelText(15, TEXT_COLORS.gold)).setOrigin(0, .5);
    this.add.text(720, 280, "TYPEFACE\nGEIST PIXEL · OFL\n\nPIXEL ART\nEDITABLE ASEPRITE SOURCES · 2PX GRID\n\nAUDIO\nWEB AUDIO SYNTHESIS\n\nBUILD 1.4.1", { ...pixelText(10, TEXT_COLORS.muted), align: "left", lineSpacing: 8 }).setOrigin(0, 0);
    new GameButton(this, 820, 535, "Back to lobby", () => this.scene.start("MainMenuScene"), 350, "red");
  }
}
