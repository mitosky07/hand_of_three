import Phaser from "phaser";
import { COLORS, drawPixelBackdrop, drawPixelPanel, pixelText } from "../../config/theme";
import { generateStructuredShopOffers, getRewardMultiplier, SHOP_LANES, type ShopItem } from "../../domain/progression";
import { progressionService } from "../../services/progressionService";
import { GameButton, type ButtonTone } from "../objects/GameButton";

const TONE_COLOR: Record<ButtonTone, number> = { green: 0x294137, blue: 0x334b52, orange: 0x694735, red: 0x633b35, purple: 0x494052 };
export class ShopScene extends Phaser.Scene {
  private offers: Array<ShopItem | undefined> = [];
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
    this.statsText = this.add.text(72, 210, "", { ...pixelText(10, "#c2cbd0"), align: "left", lineSpacing: 11 }).setOrigin(0, 0);
    this.add.text(72, 337, "HOUSE RULE", pixelText(8, "#a9674e")).setOrigin(0, .5);
    this.add.text(72, 370, "UPGRADES LAST\nFOR THIS RUN.\n\nWIN › BUY › CLIMB", { ...pixelText(9, "#f2e8ce"), align: "left", lineSpacing: 12 }).setOrigin(0, 0);
    this.rerollButton = new GameButton(this, 170, 510, "", () => this.reroll(), 205, "blue");
    new GameButton(this, 170, 580, "Play round", () => this.scene.start("MatchScene", { mode: "AI" }), 205, "green");
    new GameButton(this, 170, 650, "Lobby", () => this.scene.start("MainMenuScene"), 205, "red");
    this.add.text(360, 65, "TONIGHT'S WARES", pixelText(17, "#efe2bc")).setOrigin(0, .5);
    this.add.text(360, 96, "TUNE-UP · BACKROOM · RELIC CASE · NIGHT SPECIAL", pixelText(9, "#8e816d")).setOrigin(0, .5);
    this.messageText = this.add.text(1160, 70, "", pixelText(9, "#d9b867")).setOrigin(1, .5);
    this.offers = generateStructuredShopOffers(progressionService.get());
    this.render();
  }

  private render() {
    const profile = progressionService.get();
    const run = profile.run;
    this.chipsText.setText(`◉ ${profile.chips} CHIPS`);
    this.statsText.setText(`ROUND  ${run.round}\nBEST   ${profile.bestRound}\nMULT   x${getRewardMultiplier(profile).toFixed(2)}\nRELICS ${run.relics.length}/3\nITEM x2 ${run.doubleTokens}`);
    this.rerollButton.setLabel(profile.run.freeRerolls > 0 ? `Free reroll · ${profile.run.freeRerolls}` : `Reroll · ${this.rerollCost}`);
    this.rerollButton.setEnabled(profile.run.freeRerolls > 0 || profile.chips >= this.rerollCost);
    this.offerViews.forEach((view) => view.destroy(true));
    this.offerViews = [];
    [[550, 245], [960, 245], [550, 510], [960, 510]].forEach(([x, y], index) => this.renderOffer(x, y, index, this.offers[index]));
  }

  private renderOffer(x: number, y: number, index: number, item?: ShopItem) {
    const container = this.add.container(x, y);
    const lane = SHOP_LANES[index];
    const shadow = this.add.rectangle(9, 11, 350, 220, COLORS.ink, .78);
    const body = this.add.rectangle(0, 0, 350, 220, item ? TONE_COLOR[item.color] : COLORS.panelDark).setStrokeStyle(3, COLORS.woodLight);
    const inner = this.add.rectangle(0, 0, 334, 204).setStrokeStyle(1, COLORS.cream, .42);
    container.add([shadow, body, inner]);
    if (!item) {
      container.add([
        this.add.text(-145, -83, lane.replaceAll("_", " "), pixelText(9, "#d9b867")).setOrigin(0, .5),
        this.add.text(0, 0, "SOLD OUT", pixelText(9, "#756a5d")).setOrigin(.5),
      ]);
      this.offerViews.push(container);
      return;
    }
    const icon = this.add.image(112, -54, "video-poker-icons", item.iconFrame);
    container.add(icon);
    container.add([
      this.add.text(-145, -83, lane.replaceAll("_", " "), pixelText(9, "#d9b867")).setOrigin(0, .5),
      this.add.text(-145, -48, item.name.toUpperCase(), { ...pixelText(11, "#efe2bc"), align: "left", wordWrap: { width: 235 } }).setOrigin(0, .5),
      this.add.text(-145, -8, item.description.toUpperCase(), { ...pixelText(9, "#c2cbd0"), align: "left", wordWrap: { width: 285 }, lineSpacing: 7 }).setOrigin(0, 0),
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
    const index = this.offers.findIndex((offer) => offer?.id === item.id);
    if (index >= 0) this.offers[index] = generateStructuredShopOffers(progressionService.get())[index];
    this.render();
  }

  private reroll() {
    const free = progressionService.useFreeReroll();
    if (!free && !progressionService.pay(this.rerollCost)) { this.messageText.setText("NOT ENOUGH CHIPS"); return; }
    if (!free) this.rerollCost++;
    const fresh = generateStructuredShopOffers(progressionService.get());
    this.offers[1] = fresh[1];
    this.offers[3] = fresh[3];
    this.messageText.setText("NEW DISPLAY");
    this.render();
  }
}
