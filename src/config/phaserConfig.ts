import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "./gameConfig";
import { BootScene } from "../game/scenes/BootScene";
import { PreloadScene } from "../game/scenes/PreloadScene";
import { MainMenuScene } from "../game/scenes/MainMenuScene";
import { ModeSelectionScene } from "../game/scenes/ModeSelectionScene";
import { TutorialScene } from "../game/scenes/TutorialScene";
import { MatchScene } from "../game/scenes/MatchScene";
import { PauseScene } from "../game/scenes/PauseScene";
import { ResultsScene } from "../game/scenes/ResultsScene";
import { SettingsScene } from "../game/scenes/SettingsScene";
import { CreditsScene } from "../game/scenes/CreditsScene";
import { ShopScene } from "../game/scenes/ShopScene";
import { CollectionScene } from "../game/scenes/CollectionScene";
import { OnlineLobbyScene } from "../game/scenes/OnlineLobbyScene";
import { OnlineMatchScene } from "../game/scenes/OnlineMatchScene";
import { CosmeticsScene } from "../game/scenes/CosmeticsScene";
import { TutorialMatchScene } from "../game/scenes/TutorialMatchScene";
import { DailyShopScene } from "../game/scenes/DailyShopScene";

export const phaserConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "app",
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: "#1a100c",
  scene: [BootScene, PreloadScene, MainMenuScene, ModeSelectionScene, OnlineLobbyScene, OnlineMatchScene, TutorialScene, TutorialMatchScene, MatchScene, PauseScene, ResultsScene, SettingsScene, CreditsScene, ShopScene, DailyShopScene, CollectionScene, CosmeticsScene],
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  input: { activePointers: 3 },
};
