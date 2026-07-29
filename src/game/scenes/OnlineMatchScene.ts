import Phaser from "phaser";
import { COLORS, drawPixelBackdrop, pixelText } from "../../config/theme";
import type { OnlineMatchView, ServerMessage } from "../../online/protocol";
import { onlineService } from "../../services/onlineService";
import { CardView } from "../objects/CardView";
import { GameButton } from "../objects/GameButton";
import { CARD_BACKS, feltById } from "../../domain/cosmetics";
import { progressionService } from "../../services/progressionService";

export class OnlineMatchScene extends Phaser.Scene {
  private dynamic!: Phaser.GameObjects.Container;
  private status!: Phaser.GameObjects.Text;
  private selectedId: string | null = null;
  private unsubscribe: (() => void) | null = null;
  private handViews: CardView[] = [];
  private focusIndex = -1;

  constructor() { super("OnlineMatchScene"); }

  create() {
    drawPixelBackdrop(this, COLORS.cyan);
    this.drawTable();
    this.add.text(50, 35, "ONLINE TABLE", pixelText(11, "#7fa98a")).setOrigin(0, .5);
    this.status = this.add.text(640, 405, "", { ...pixelText(10, "#efe2bc"), align: "center", wordWrap: { width: 720 }, lineSpacing: 8 }).setOrigin(.5);
    this.dynamic = this.add.container(0, 0);
    this.unsubscribe = onlineService.subscribe((message) => this.handleMessage(message));
    this.input.keyboard?.on("keydown", this.handleKey, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unsubscribe?.();
      this.input.keyboard?.off("keydown", this.handleKey, this);
    });
    if (onlineService.view) this.render(onlineService.view);
    else this.returnToLobby("NO ACTIVE ONLINE ROOM");
  }

  private drawTable() {
    const felt = feltById(progressionService.get().selectedFelt);
    const tableTextures = {
      CLASSIC_FELT: "video-poker-table-classic",
      MIDNIGHT_FELT: "video-poker-table-midnight",
      CRIMSON_FELT: "video-poker-table-crimson",
      VIOLET_FELT: "video-poker-table-violet",
    } as const;
    this.add.image(640, 367, tableTextures[felt.id]).setDepth(-5);
  }

  private render(view: OnlineMatchView) {
    this.dynamic.removeAll(true);
    this.handViews = [];
    if (!view.hand.some((card) => card.id === this.selectedId)) this.selectedId = null;
    this.dynamic.add([
      this.add.text(54, 68, `${view.yourName.toUpperCase()}\nSEALS ${view.yourScore}/2`, { ...pixelText(11), lineSpacing: 8 }),
      this.add.text(1226, 68, `${view.opponentName.toUpperCase()}\nSEALS ${view.opponentScore}/2`, { ...pixelText(11), align: "right", lineSpacing: 8 }).setOrigin(1, 0),
      this.add.text(640, 45, `ROOM ${view.roomCode}`, pixelText(14, "#d9b867")).setOrigin(.5),
      this.add.text(640, 75, `HAND ${view.round} · FIRST TO 2`, pixelText(8, "#c9bea0")).setOrigin(.5),
    ]);

    if (view.phase === "WAITING_FOR_PLAYER") {
      this.status.setText(`WAITING FOR A RIVAL\nSHARE ROOM CODE: ${view.roomCode}\nENTER COPY · ESC LEAVE`);
      const copy = new GameButton(this, 640, 500, "Copy room code", () => void navigator.clipboard?.writeText(view.roomCode), 280, "blue");
      const leave = new GameButton(this, 640, 585, "Leave table", () => this.leave(), 280, "red");
      this.dynamic.add([copy, leave]);
      return;
    }

    this.renderOpponentHand(view.opponentHandCount);
    if (view.result) {
      const yours = new CardView(this, 500, 265, view.result.yourCard).setRestingScale(.78);
      const theirs = new CardView(this, 780, 265, view.result.opponentCard).setRestingScale(.78);
      this.dynamic.add([yours, theirs]);
      const resultText = view.result.winner === "YOU" ? "YOU TAKE THE HAND" : view.result.winner === "OPPONENT" ? "RIVAL TAKES THE HAND" : "PERFECT DRAW";
      this.status.setText(`${resultText}\n${view.result.reason.replaceAll("_", " ")}`);
      if (view.phase === "MATCH_FINISHED") {
        this.status.setText(`${resultText}\n${view.result.reason.replaceAll("_", " ")}\nENTER REMATCH · ESC LOBBY`);
        const rematch = new GameButton(this, 520, 585, "Rematch", () => onlineService.rematch(), 230, "green");
        const leave = new GameButton(this, 760, 585, "Lobby", () => this.leave(), 230, "red");
        this.dynamic.add([rematch, leave]);
      }
      return;
    }

    this.renderHand(view);
    if (view.phase === "WAITING_FOR_OPPONENT") {
      this.status.setText("CARD LOCKED · WAITING FOR YOUR RIVAL");
      return;
    }
    this.status.setText(this.selectedId ? "CARD READY · CONFIRM YOUR PLAY" : "CHOOSE A CARD FROM YOUR HAND");
    const confirm = new GameButton(this, 640, 465, "Confirm", () => this.confirm(), 230, "blue").setEnabled(Boolean(this.selectedId));
    const leave = new GameButton(this, 205, 465, "Leave", () => this.leave(), 160, "red");
    this.dynamic.add([confirm, leave]);
  }

  private renderHand(view: OnlineMatchView) {
    const spacing = Math.min(122, 620 / Math.max(1, view.hand.length));
    const start = 640 - ((view.hand.length - 1) * spacing) / 2;
    view.hand.forEach((card, index) => {
      const distance = index - (view.hand.length - 1) / 2;
      const cardView = new CardView(this, start + index * spacing, 590 + Math.abs(distance) * 3, card).setRestingScale(.62).setAngle(distance * 1.8);
      (cardView.list[1] as Phaser.GameObjects.Rectangle).on("pointerup", () => this.select(cardView, index));
      cardView.setSelected(card.id === this.selectedId);
      this.handViews.push(cardView);
      this.dynamic.add(cardView);
    });
  }

  private renderOpponentHand(count: number) {
    const back = CARD_BACKS.find((item) => item.id === progressionService.get().selectedCardBack) ?? CARD_BACKS[0];
    for (let index = 0; index < count; index++) {
      const x = 640 + (index - (count - 1) / 2) * 34;
      const color = this.add.rectangle(x - 1, 144, 44, 62, back.color);
      const card = this.add.image(x, 145, "video-card-back").setScale(.39);
      const mark = this.add.text(x, 145, back.mark, pixelText(8, "#f2e8ce")).setOrigin(.5).setStroke("#080b0e", 2);
      this.dynamic.add([color, card, mark]);
    }
  }

  private select(card: CardView, index: number) {
    if (onlineService.view?.phase !== "SELECTING") return;
    this.selectedId = card.card.id;
    this.focusIndex = index;
    this.handViews.forEach((view) => view.setSelected(view === card));
    this.status.setText("CARD READY · CONFIRM YOUR PLAY");
  }

  private confirm() { if (this.selectedId && onlineService.view?.phase === "SELECTING") onlineService.play(this.selectedId); }

  private handleKey(event: KeyboardEvent) {
    const phase = onlineService.view?.phase;
    if (!phase) return;
    if (event.key === "Escape") { this.leave(); return; }
    if (phase === "WAITING_FOR_PLAYER" && ["Enter", " "].includes(event.key)) {
      void navigator.clipboard?.writeText(onlineService.view!.roomCode);
      this.status.setText(`ROOM ${onlineService.view!.roomCode} COPIED\nWAITING FOR A RIVAL · ESC LEAVE`);
      return;
    }
    if (phase === "MATCH_FINISHED" && ["Enter", " "].includes(event.key)) {
      onlineService.rematch();
      this.status.setText("REMATCH REQUESTED · WAITING FOR YOUR RIVAL");
      return;
    }
    if (phase !== "SELECTING") return;
    const direct = Number(event.key) - 1;
    if (Number.isInteger(direct) && direct >= 0 && direct < this.handViews.length) this.select(this.handViews[direct], direct);
    else if (["ArrowLeft", "a", "A"].includes(event.key)) this.moveFocus(-1);
    else if (["ArrowRight", "d", "D"].includes(event.key)) this.moveFocus(1);
    else if (["Enter", " ", "ArrowUp", "w", "W"].includes(event.key)) this.confirm();
  }

  private moveFocus(direction: -1 | 1) {
    if (!this.handViews.length) return;
    this.focusIndex = this.focusIndex < 0 ? (direction > 0 ? 0 : this.handViews.length - 1) : (this.focusIndex + direction + this.handViews.length) % this.handViews.length;
    this.select(this.handViews[this.focusIndex], this.focusIndex);
  }

  private handleMessage(message: ServerMessage) {
    if (message.type === "STATE" || message.type === "JOINED") this.render(message.view);
    else if (message.type === "OPPONENT_LEFT") this.returnToLobby("YOUR RIVAL LEFT THE TABLE");
    else if (message.type === "ERROR") this.status.setText(message.message);
  }

  private returnToLobby(message: string) { this.status.setText(message); this.time.delayedCall(1300, () => this.leave()); }
  private leave() { onlineService.leave(); this.scene.start("MainMenuScene"); }
}
