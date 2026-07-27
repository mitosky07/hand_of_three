import Phaser from "phaser";
import { phaserConfig } from "./config/phaserConfig";
import { onlineService } from "./services/onlineService";
import "./style.css";

const game = new Phaser.Game(phaserConfig);

if (new URLSearchParams(window.location.search).has("e2e")) {
  (window as Window & { __HAND_OF_THREE_GAME__?: Phaser.Game }).__HAND_OF_THREE_GAME__ = game;
  (window as Window & { __HAND_OF_THREE_ONLINE__?: typeof onlineService }).__HAND_OF_THREE_ONLINE__ = onlineService;
}
