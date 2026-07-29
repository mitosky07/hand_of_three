import Phaser from "phaser";
import { timeTracker } from "../../services/timeTrackingService";
export class BootScene extends Phaser.Scene {
  constructor() { super("BootScene"); }
  create() {
    timeTracker.start("PLAY", "Hand of Three game session");
    window.addEventListener("beforeunload", () => timeTracker.stop(), { once: true });
    let started = false;
    const proceed = () => {
      if (started) return;
      started = true;
      this.scene.start("PreloadScene");
    };
    window.setTimeout(proceed, 500);
    document.fonts?.load('16px "Silkscreen"').then(proceed, proceed);
  }
}
