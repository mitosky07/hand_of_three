import Phaser from "phaser";
import { COLORS, drawPixelBackdrop, drawPixelPanel, pixelText } from "../../config/theme";
import { CARD_BACKS, CHIP_STYLES, FELT_COSMETICS, VICTORY_STAMPS } from "../../domain/cosmetics";
import { progressionService } from "../../services/progressionService";
import { GameButton } from "../objects/GameButton";

export class CosmeticsScene extends Phaser.Scene {
  constructor() { super("CosmeticsScene"); }

  create() {
    drawPixelBackdrop(this, COLORS.violet);
    drawPixelPanel(this, 640, 350, 1060, 610, COLORS.violet);
    this.add.text(110, 92, "TABLE LOCKER", pixelText(24, "#d9b867")).setOrigin(0, .5);
    this.add.text(110, 128, "COSMETIC REWARDS · NO GAMEPLAY ADVANTAGE", pixelText(8, "#7fa98a")).setOrigin(0, .5);
    const message = this.add.text(1160, 82, "", pixelText(8, "#d9b867")).setOrigin(1, .5);

    FELT_COSMETICS.forEach((felt, index) => {
      const profile = progressionService.get();
      const unlocked = profile.unlockedFelts.includes(felt.id);
      const selected = profile.selectedFelt === felt.id;
      const y = 180 + index * 74;
      this.add.rectangle(640, y, 900, 66, 0x102d24).setStrokeStyle(selected ? 5 : 2, selected ? COLORS.gold : 0x7fa98a);
      this.add.rectangle(240, y, 110, 42, felt.tint === 0xffffff ? 0x2f713a : felt.tint).setStrokeStyle(3, COLORS.cream);
      this.add.text(320, y - 13, felt.name.toUpperCase(), pixelText(10, unlocked ? "#efe2bc" : "#756a5d")).setOrigin(0, .5);
      this.add.text(320, y + 13, unlocked ? felt.description.toUpperCase() : `LOCKED · ${felt.winsRequired} WINS REQUIRED`, pixelText(6, unlocked ? "#c9bea0" : "#a9674e")).setOrigin(0, .5);
      const button = new GameButton(this, 1000, y, selected ? "Equipped" : "Equip", () => {
        if (!progressionService.selectFelt(felt.id)) { message.setText("LOCKED"); return; }
        this.scene.restart();
      }, 170, selected ? "orange" : "green");
      button.setEnabled(unlocked && !selected);
    });

    const profile = progressionService.get();
    const back = CARD_BACKS.find((item) => item.id === profile.selectedCardBack)!;
    const chip = CHIP_STYLES.find((item) => item.id === profile.selectedChipStyle)!;
    const stamp = VICTORY_STAMPS.find((item) => item.id === profile.selectedVictoryStamp)!;
    const cycle = <T extends string>(items: readonly T[], selected: T, apply: (id: T) => void) => {
      const next = items[(items.indexOf(selected) + 1) % items.length];
      apply(next);
      this.scene.restart();
    };
    new GameButton(this, 370, 505, `Back · ${back.name}`, () => cycle(profile.unlockedCardBacks, profile.selectedCardBack, (id) => progressionService.selectCardBack(id)), 255, "blue");
    new GameButton(this, 640, 505, `Chip · ${chip.name}`, () => cycle(profile.unlockedChipStyles, profile.selectedChipStyle, (id) => progressionService.selectChipStyle(id)), 255, "orange");
    new GameButton(this, 910, 505, `Stamp · ${stamp.name}`, () => cycle(profile.unlockedVictoryStamps, profile.selectedVictoryStamp, (id) => progressionService.selectVictoryStamp(id)), 255, "purple");
    this.add.text(640, 570, `PORTRAIT GALLERY · ${profile.unlockedPortraits.map((id) => id.replace("_PORTRAIT", "")).join(" · ")}`, pixelText(7, "#7fa98a")).setOrigin(.5);
    new GameButton(this, 640, 645, "Back to inventory", () => this.scene.start("CollectionScene"), 320, "red");
  }
}
