import Phaser from "phaser";
import { COLORS, drawPixelBackdrop, drawPixelPanel, pixelText } from "../../config/theme";
import type { ServerMessage } from "../../online/protocol";
import { onlineService } from "../../services/onlineService";
import { GameButton } from "../objects/GameButton";

export class OnlineLobbyScene extends Phaser.Scene {
  private status!: Phaser.GameObjects.Text;
  private unsubscribe: (() => void) | null = null;

  constructor() { super("OnlineLobbyScene"); }

  create() {
    drawPixelBackdrop(this, COLORS.cyan);
    drawPixelPanel(this, 640, 360, 820, 520, COLORS.cyan);
    this.add.text(640, 145, "ONLINE BACKROOM", pixelText(28, "#e0ad4f")).setOrigin(.5);
    this.add.text(640, 185, "REAL-TIME TWO-PLAYER TABLE", pixelText(11, "#8fd0c9")).setOrigin(.5);
    this.add.text(640, 250, "CREATE A PRIVATE ROOM AND SHARE ITS CODE\nOR ENTER A CODE FROM ANOTHER PLAYER.", { ...pixelText(12, "#c2cbd0"), align: "center", lineSpacing: 12 }).setOrigin(.5);
    this.status = this.add.text(640, 455, "READY", { ...pixelText(11, "#e0ad4f"), align: "center", wordWrap: { width: 680 } }).setOrigin(.5);
    new GameButton(this, 450, 355, "Create table", () => void this.createRoom(), 320, "blue");
    new GameButton(this, 830, 355, "Join table", () => void this.joinRoom(), 320, "green");
    new GameButton(this, 640, 545, "Back to lobby", () => this.leave(), 350, "red");
    this.unsubscribe = onlineService.subscribe((message) => this.handleMessage(message));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => { this.unsubscribe?.(); this.unsubscribe = null; });
  }

  private playerName() {
    const saved = localStorage.getItem("hand-of-three-online-name") ?? "Player";
    const entered = window.prompt("Your table name", saved)?.trim().slice(0, 18);
    if (!entered) return null;
    localStorage.setItem("hand-of-three-online-name", entered);
    return entered;
  }

  private async createRoom() {
    const name = this.playerName();
    if (!name) return;
    this.status.setText("CONNECTING TO THE BACKROOM...");
    try { await onlineService.connect(); onlineService.createRoom(name); }
    catch { this.status.setText("SERVER UNAVAILABLE · START OR DEPLOY THE MULTIPLAYER SERVER"); }
  }

  private async joinRoom() {
    const code = window.prompt("Enter the 5-character room code")?.trim().toUpperCase();
    if (!code) return;
    const name = this.playerName();
    if (!name) return;
    this.status.setText("FINDING TABLE...");
    try { await onlineService.connect(); onlineService.joinRoom(code, name); }
    catch { this.status.setText("SERVER UNAVAILABLE · CHECK THE MULTIPLAYER URL"); }
  }

  private handleMessage(message: ServerMessage) {
    if (message.type === "JOINED") this.scene.start("OnlineMatchScene");
    else if (message.type === "ERROR") this.status.setText(message.message);
  }

  private leave() { onlineService.leave(); this.scene.start("MainMenuScene"); }
}
