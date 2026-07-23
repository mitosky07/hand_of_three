import Phaser from "phaser";
import { COLORS, drawPixelBackdrop, drawPixelPanel, pixelText } from "../../config/theme";
import { generateShopOffers, getRewardMultiplier, type ShopItem } from "../../domain/progression";
import { progressionService } from "../../services/progressionService";
import { GameButton, type ButtonTone } from "../objects/GameButton";

const TONE_COLOR: Record<ButtonTone, number> = { green: 0x244c38, blue: 0x315f6b, orange: 0x805038, red: 0x713d38, purple: 0x55425f };

export class ShopScene extends Phaser.Scene {
  private offers: ShopItem[] = [];
  private offerViews: Phaser.GameObjects.Container[] = [];
  private chipsText!: Phaser.GameObjects.Text;
  private statsText!: Phaser.GameObjects.Text;
  private messageText!: Phaser.GameObjects.Text;
  private rerollButton!: GameButton;
  private rerollCost = 3;

  constructor() { super("ShopScene"); }
  create() {
    drawPixelBackdrop(this, 0x9a7248);
    drawPixelPanel(this, 170, 360, 270, 650, COLORS.gold);
    drawPixelPanel(this, 790, 360, 930, 650, 0x7fa98a);
    this.add.text(72, 70, "MARKET", pixelText(24, "#d9b867")).setOrigin(0, .5);
    this.add.text(72, 106, "UNDER THE TABLE", pixelText(8, "#a9674e")).setOrigin(0, .5);
    this.chipsText = this.add.text(72, 158, "", pixelText(17, "#efe2bc")).setOrigin(0, .5);
    this.statsText = this.add.text(72, 210, "", { ...pixelText(8, "#c9bea0"), align: "left", lineSpacing: 11 }).setOrigin(0, 0);
    this.add.text(72, 337, "HOUSE RULE", pixelText(8, "#a9674e")).setOrigin(0, .5);
    this.add.text(72, 370, "UPGRADES LAST\nFOR THIS RUN.\n\nWIN › BUY › CLIMB", { ...pixelText(7, "#efe2bc"), align: "left", lineSpacing: 12 }).setOrigin(0, 0);
    this.rerollButton = new GameButton(this, 170, 510, "Reroll · 3", () => this.reroll(), 205, "blue");
    new GameButton(this, 170, 580, "Play round", () => this.scene.start("MatchScene", { mode: "AI" }), 205, "green");
    new GameButton(this, 170, 650, "Lobby", () => this.scene.start("MainMenuScene"), 205, "red");
    this.add.text(360, 65, "TONIGHT'S WARES", pixelText(17, "#efe2bc")).setOrigin(0, .5);
    this.add.text(360, 96, "BUY POWER FOR THIS RUN · OFFERS CHANGE", pixelText(7, "#8e816d")).setOrigin(0, .5);
    this.messageText = this.add.text(1160, 70, "", pixelText(9, "#d9b867")).setOrigin(1, .5);
    this.offers = generateShopOffers(progressionService.get());
    this.render();
  }

  private render() {
    const profile = progressionService.get();
    const run = profile.run;
    this.chipsText.setText(`◉ ${profile.chips} CHIPS`);
    this.statsText.setText(`ROUND  ${run.round}\nBEST   ${profile.bestRound}\nMULT   x${getRewardMultiplier(profile).toFixed(2)}\nRELICS ${run.relics.length}/3\nITEM x2 ${run.doubleTokens}`);
    this.rerollButton.setEnabled(profile.chips >= this.rerollCost);
    this.offerViews.forEach((view) => view.destroy(true));
    this.offerViews = [];
    [[550, 245], [960, 245], [550, 510], [960, 510]].forEach(([x, y], index) => this.renderOffer(x, y, this.offers[index]));
  }

  private renderOffer(x: number, y: number, item?: ShopItem) {
    const container = this.add.container(x, y);
    const shadow = this.add.rectangle(9, 11, 350, 220, COLORS.ink, .78);
    const body = this.add.rectangle(0, 0, 350, 220, item ? TONE_COLOR[item.color] : 0x102d24).setStrokeStyle(5, 0x6e3b27);
    const inner = this.add.rectangle(0, 0, 332, 202).setStrokeStyle(2, 0xb99b62, .75);
    container.add([shadow, body, inner]);
    if (!item) { container.add(this.add.text(0, 0, "EMPTY DISPLAY", pixelText(9, "#756a5d")).setOrigin(.5)); this.offerViews.push(container); return; }
    if (this.textures.exists("item-icons")) {
      const icon = this.add.image(112, -54, "item-icons", item.iconFrame).setDisplaySize(58, 58);
      container.add(icon);
    }
    container.add([
      this.add.text(-145, -83, item.category, pixelText(7, "#d9b867")).setOrigin(0, .5),
      this.add.text(-145, -48, item.name.toUpperCase(), { ...pixelText(11, "#efe2bc"), align: "left", wordWrap: { width: 235 } }).setOrigin(0, .5),
      this.add.text(-145, -8, item.description.toUpperCase(), { ...pixelText(8, "#c9bea0"), align: "left", wordWrap: { width: 285 }, lineSpacing: 7 }).setOrigin(0, 0),
      this.add.text(-140, 76, `◉ ${item.price}`, pixelText(13, "#d9b867")).setOrigin(0, .5),
    ]);
    const buy = new GameButton(this, x + 85, y + 76, "Buy", () => this.buy(item), 150, item.color);
    buy.setEnabled(progressionService.get().chips >= item.price);
    this.offerViews.push(container, buy);
  }

  private buy(item: ShopItem) {
    const result = progressionService.buy(item.id);
    this.messageText.setText(result.message);
    if (!result.success) return;
    this.offers = this.offers.filter((offer) => offer !== item);
    const replacement = generateShopOffers(progressionService.get(), 9).find((candidate) => !this.offers.some((offer) => offer.id === candidate.id));
    if (replacement) this.offers.push(replacement);
    this.render();
  }

  private reroll() {
    if (!progressionService.pay(this.rerollCost)) { this.messageText.setText("NOT ENOUGH CHIPS"); return; }
    this.rerollCost++;
    this.rerollButton.setLabel(`Reroll · ${this.rerollCost}`);
    this.offers = generateShopOffers(progressionService.get());
    this.messageText.setText("NEW DISPLAY");
    this.render();
  }
}
