import Phaser from "phaser";
import { COLORS, drawPixelBackdrop, drawPixelPanel, pixelText } from "../../config/theme";
import { onboardingService } from "../../services/onboardingService";

export class PreloadScene extends Phaser.Scene {
  constructor() { super("PreloadScene"); }
  preload() {
    this.load.image("poker-table-art", "assets/aseprite/poker-table-16bit-mcp-export.png");
    this.load.image("card-art-rock", "assets/aseprite/rock-card-mcp-export.png");
    this.load.image("card-art-paper", "assets/aseprite/paper-card-mcp-export.png");
    this.load.image("card-art-scissors", "assets/aseprite/scissors-card-mcp-export.png");
    this.load.spritesheet("item-icons", "assets/items/run-items-sheet.png", { frameWidth: 64, frameHeight: 64 });
  }
  create() {
    drawPixelBackdrop(this, COLORS.magenta);
    drawPixelPanel(this, 650, 360, 880, 360, COLORS.cyan);
    this.add.text(260, 250, "HAND\nOF THREE", { ...pixelText(31, "#ffd166"), align: "left" }).setOrigin(0, 0);
    this.add.text(260, 375, "GAME ROOM // 1985", pixelText(8, "#d9865b")).setOrigin(0, .5);
    this.add.text(630, 255, "SETTING TABLE 03", pixelText(11, "#9fd3a9")).setOrigin(0, .5);
    const frame = this.add.rectangle(825, 345, 390, 36, COLORS.ink).setStrokeStyle(3, COLORS.gold);
    const bar = this.add.rectangle(637, 345, 0, 20, COLORS.magenta).setOrigin(0, .5);
    const label = this.add.text(630, 410, "SHUFFLING FATES...", pixelText(9, "#c7b99b")).setOrigin(0, .5);
    const percent = this.add.text(825, 345, "0%", pixelText(8)).setOrigin(.5).setDepth(2);
    this.tweens.addCounter({ from: 0, to: 100, duration: 900, onUpdate: tween => { const value = Math.floor(tween.getValue() ?? 0); bar.width = value * 3.76; percent.setText(`${value}%`); }, onComplete: () => { label.setText("TABLE OPEN // GOOD LUCK"); this.time.delayedCall(260, () => this.openInitialScene()); } });
    frame.setDepth(1);
  }

  private openInitialScene() {
    const isLocalPreview = ["localhost", "127.0.0.1"].includes(window.location.hostname);
    const preview = isLocalPreview ? new URLSearchParams(window.location.search).get("scene") : null;
    const destinations: Record<string, [string, object?]> = {
      match: ["MatchScene", { mode: "AI" }],
      menu: ["MainMenuScene"],
      modes: ["ModeSelectionScene"],
      shop: ["ShopScene"],
      collection: ["CollectionScene"],
      tutorial: ["TutorialScene"],
      practice: ["TutorialMatchScene", { reward: false }],
      cosmetics: ["CosmeticsScene"],
      daily: ["MatchScene", { mode: "AI", daily: true }],
      "daily-shop": ["DailyShopScene"],
      online: ["OnlineLobbyScene"],
      settings: ["SettingsScene"],
      credits: ["CreditsScene"],
    };
    if (!preview && !new URLSearchParams(window.location.search).has("e2e") && !onboardingService.isComplete()) {
      this.scene.start("TutorialMatchScene", { reward: true });
      return;
    }
    const [scene, data] = preview && destinations[preview] ? destinations[preview] : destinations.menu;
    this.scene.start(scene, data);
  }
}
