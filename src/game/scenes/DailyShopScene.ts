import Phaser from "phaser";
import { COLORS, drawPixelBackdrop, drawPixelPanel, pixelText } from "../../config/theme";
import { dailyOffers, dailyService, type DailyOffer } from "../../services/dailyService";
import { GameButton } from "../objects/GameButton";

export class DailyShopScene extends Phaser.Scene {
  constructor() { super("DailyShopScene"); }

  create() {
    const state = dailyService.get();
    drawPixelBackdrop(this, COLORS.cyan);
    drawPixelPanel(this, 640, 350, 1080, 620, COLORS.gold);
    this.add.text(140, 92, "DAILY MARKET", pixelText(23, "#d9b867")).setOrigin(0, .5);
    this.add.text(140, 125, `SEED ${state.date} · ROUND ${state.round} · SAME OFFERS FOR EVERYONE`, pixelText(9, "#8fd0c9")).setOrigin(0, .5);
    const wallet = this.add.text(1125, 92, `${state.chips} CHIPS`, pixelText(12, "#d9b867")).setOrigin(1, .5);
    const message = this.add.text(640, 590, "", pixelText(8, "#a9674e")).setOrigin(.5);
    dailyOffers(state.round, state.date).forEach((offer, index) => this.renderOffer(offer, index, wallet, message));
    new GameButton(this, 500, 650, `Play round ${state.round}`, () => this.scene.start("MatchScene", { mode: "AI", daily: true }), 300, "blue");
    new GameButton(this, 820, 650, "Lobby", () => this.scene.start("MainMenuScene"), 300, "red");
  }

  private renderOffer(offer: DailyOffer, index: number, wallet: Phaser.GameObjects.Text, message: Phaser.GameObjects.Text) {
    const x = index % 2 ? 905 : 375;
    const y = index < 2 ? 245 : 465;
    this.add.rectangle(x, y, 470, 180, index % 2 ? 0x315f6b : 0x244c38).setStrokeStyle(4, COLORS.gold);
    this.add.text(x - 200, y - 58, offer.name.toUpperCase(), pixelText(11, "#efe2bc")).setOrigin(0, .5);
    this.add.text(x - 200, y - 18, offer.description.toUpperCase(), { ...pixelText(10, "#c2cbd0"), wordWrap: { width: 390 }, lineSpacing: 7 }).setOrigin(0, 0);
    const button = new GameButton(this, x + 115, y + 55, `Buy · ${offer.price}`, () => {
      if (!dailyService.buy(offer.id, offer.price)) { message.setText("NOT ENOUGH DAILY CHIPS"); return; }
      wallet.setText(`${dailyService.get().chips} CHIPS`);
      message.setText(`${offer.name.toUpperCase()} PURCHASED`);
      button.setEnabled(dailyService.get().chips >= offer.price);
    }, 190, index % 2 ? "blue" : "green");
    button.setEnabled(dailyService.get().chips >= offer.price);
  }
}
