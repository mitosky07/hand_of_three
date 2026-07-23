import Phaser from "phaser";
import { timeTracker } from "../../services/timeTrackingService";
export class BootScene extends Phaser.Scene {
  constructor() { super("BootScene"); }
  create() {
    timeTracker.start("PLAY", "Hand of Three game session");
    window.addEventListener("beforeunload", () => timeTracker.stop(), { once: true });
    document.fonts.load('16px "Press Start 2P"').finally(() => this.scene.start("PreloadScene"));
  }
}
