import Phaser from "phaser";
import { COLORS, drawPixelBackdrop, drawPixelPanel, pixelText } from "../../config/theme";
import { GameButton } from "../objects/GameButton";

const pages = [
  ["CHOOSE", "STEP 1\nPICK ONE OF THE FIVE CARDS\nIN YOUR HAND.", "USE A/D, LEFT/RIGHT, CLICK, OR PRESS 1–5."],
  ["CONFIRM", "STEP 2\nCHECK YOUR CARD AND CONFIRM.\nYOU CANNOT CHANGE IT AFTERWARD.", "W/UP OR ENTER CONFIRMS. S/DOWN CANCELS. ESC PAUSES."],
  ["MASTER", "ROCK > SCISSORS\nSCISSORS > PAPER\nPAPER > ROCK", "THE ELEMENT BEATS THE LEVEL."],
  ["COMPARE", "WHEN ELEMENTS MATCH,\nTHE HIGHER LEVEL WINS.", "RUN UPGRADES RAISE THOSE LEVELS."],
  ["MATCH", "EACH ROUND IS\nBEST OF THREE HANDS.", "THE FIRST TO TWO SEALS WINS THE MATCH."],
  ["CASH OUT", "WIN THE MATCH TO EARN\nCHIPS AND CLIMB A ROUND.", "THE BASE REWARD RISES EVERY FIVE ROUNDS."],
  ["RISK", "IF THE ORACLE WINS\nTHE MATCH, YOUR RUN ENDS.", "YOU RETURN TO ROUND 1 WITH NO RUN POWER."],
  ["UPGRADE", "THE MARKET OPENS ONLY\nBETWEEN WON MATCHES.", "LEVELS, RELICS AND MULT LAST FOR THE RUN."],
  ["ITEMS", "ACTIVATE A DOUBLE CHIP\nBEFORE CONFIRMING YOUR CARD.", "WIN THE MATCH TO DOUBLE ITS REWARD."],
];

export class TutorialScene extends Phaser.Scene {
  private page = 0;
  constructor() { super("TutorialScene"); }
  create() {
    drawPixelBackdrop(this, COLORS.magenta);
    drawPixelPanel(this, 246, 360, 300, 520, COLORS.magenta);
    drawPixelPanel(this, 790, 330, 720, 460, COLORS.cyan);
    this.add.text(118, 130, "HOUSE RULES // 1985", pixelText(10, "#d9b867")).setOrigin(0, .5);
    this.add.text(118, 180, "QUICK\nRUN\nGUIDE", { ...pixelText(23, "#efe2bc"), align: "left" }).setOrigin(0, 0);
    const slots: Phaser.GameObjects.Text[] = [];
    pages.forEach((_, index) => slots.push(this.add.text(135, 325 + index * 27, `0${index + 1}`, pixelText(8, "#756a5d")).setOrigin(0, .5)));
    const number = this.add.text(520, 160, "", pixelText(52, "#a9674e")).setOrigin(0, .5);
    const title = this.add.text(680, 160, "", pixelText(25, "#d9b867")).setOrigin(0, .5);
    const body = this.add.text(520, 280, "", { ...pixelText(13), align: "left" }).setOrigin(0, 0);
    const tip = this.add.text(520, 420, "", { ...pixelText(8, "#7fa98a"), align: "left", wordWrap: { width: 650 } }).setOrigin(0, 0);
    const render = () => {
      number.setText(`0${this.page + 1}`); title.setText(pages[this.page][0]); body.setText(pages[this.page][1]); tip.setText(`TIP // ${pages[this.page][2]}`);
      slots.forEach((slot, index) => slot.setColor(index === this.page ? "#d9b867" : "#756a5d"));
    };
    render();
    new GameButton(this, 570, 585, "Previous", () => { this.page = Math.max(0, this.page - 1); render(); }, 190);
    new GameButton(this, 790, 585, "Next", () => { if (this.page === pages.length - 1) this.scene.start("ModeSelectionScene", { mode: "AI" }); else { this.page++; render(); } }, 190);
    new GameButton(this, 1010, 585, "Exit", () => this.scene.start("MainMenuScene"), 190, "red");
  }
}
