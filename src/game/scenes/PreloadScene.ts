import Phaser from "phaser";
import { COLORS, TEXT_COLORS, drawPixelBackdrop, drawPixelPanel, pixelText } from "../../config/theme";
import { onboardingService } from "../../services/onboardingService";

export class PreloadScene extends Phaser.Scene {
  constructor() { super("PreloadScene"); }
  preload() {
    this.load.spritesheet("video-poker-buttons", new URL("../../assets/ui/video-poker-buttons.png", import.meta.url).href, { frameWidth: 96, frameHeight: 48 });
    this.load.image("video-poker-panel", new URL("../../assets/ui/video-poker-panel.png", import.meta.url).href);
    this.load.image("video-poker-cabinet", new URL("../../assets/ui/video-poker-cabinet.png", import.meta.url).href);
    this.load.image("video-poker-table-classic", new URL("../../assets/ui/table-classic.png", import.meta.url).href);
    this.load.image("video-poker-table-midnight", new URL("../../assets/ui/table-midnight.png", import.meta.url).href);
    this.load.image("video-poker-table-crimson", new URL("../../assets/ui/table-crimson.png", import.meta.url).href);
    this.load.image("video-poker-table-violet", new URL("../../assets/ui/table-violet.png", import.meta.url).href);
    this.load.image("video-card-rock", new URL("../../assets/ui/card-rock.png", import.meta.url).href);
    this.load.image("video-card-paper", new URL("../../assets/ui/card-paper.png", import.meta.url).href);
    this.load.image("video-card-scissors", new URL("../../assets/ui/card-scissors.png", import.meta.url).href);
  }
  create() {
    drawPixelBackdrop(this, COLORS.magenta);
    drawPixelPanel(this, 650, 360, 880, 360, COLORS.cyan);
    this.add.text(260, 250, "HAND\nOF THREE", { ...pixelText(31, TEXT_COLORS.gold), align: "left" }).setOrigin(0, 0);
    this.add.text(260, 375, "AFTER HOURS // TABLE 03", pixelText(8, TEXT_COLORS.terracotta)).setOrigin(0, .5);
    this.add.text(630, 255, "SETTING THE TABLE", pixelText(11, TEXT_COLORS.mint)).setOrigin(0, .5);
    const frame = this.add.rectangle(825, 345, 390, 36, COLORS.ink).setStrokeStyle(3, COLORS.gold);
    const bar = this.add.rectangle(637, 345, 0, 20, COLORS.magenta).setOrigin(0, .5);
    const label = this.add.text(630, 410, "SHUFFLING THE HOUSE DECK...", pixelText(9, TEXT_COLORS.muted)).setOrigin(0, .5);
    const percent = this.add.text(825, 345, "0%", pixelText(8)).setOrigin(.5).setDepth(2);
    this.tweens.addCounter({ from: 0, to: 100, duration: 900, onUpdate: tween => { const value = Math.floor(tween.getValue() ?? 0); bar.width = value * 3.76; percent.setText(`${value}%`); }, onComplete: () => { label.setText("TABLE OPEN // CUT THE DECK"); this.time.delayedCall(260, () => this.openInitialScene()); } });
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
