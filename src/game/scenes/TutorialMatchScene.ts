import Phaser from "phaser";
import { COLORS, drawPixelBackdrop, drawPixelPanel, pixelText } from "../../config/theme";
import type { Card } from "../../domain/Card";
import { onboardingService } from "../../services/onboardingService";
import { progressionService } from "../../services/progressionService";
import { CardView } from "../objects/CardView";
import { GameButton } from "../objects/GameButton";

interface Lesson {
  title: string;
  prompt: string;
  hint: string;
  opponent: Card;
  hand: Card[];
  correctId: string;
  success: string;
}

const LESSONS: Lesson[] = [
  {
    title: "COUNTER THE TABLE",
    prompt: "THE RIVAL SHOWS ROCK. CHOOSE ITS COUNTER.",
    hint: "PAPER WRAPS ROCK.",
    opponent: { id: "tutorial-rock", element: "rock", level: 10 },
    hand: [
      { id: "lesson-rock", element: "rock", level: 10 },
      { id: "lesson-paper", element: "paper", level: 1 },
      { id: "lesson-scissors", element: "scissors", level: 10 },
    ],
    correctId: "lesson-paper",
    success: "ELEMENT BEATS LEVEL · PAPER WINS.",
  },
  {
    title: "READ THE POWER",
    prompt: "SAME ELEMENT: PLAY A HIGHER ROCK.",
    hint: "WHEN ELEMENTS MATCH, THE HIGHER LEVEL WINS.",
    opponent: { id: "tutorial-rock-4", element: "rock", level: 4 },
    hand: [
      { id: "lesson-rock-2", element: "rock", level: 2 },
      { id: "lesson-rock-7", element: "rock", level: 7 },
      { id: "lesson-scissors-10", element: "scissors", level: 10 },
    ],
    correctId: "lesson-rock-7",
    success: "ROCK 7 BEATS ROCK 4.",
  },
  {
    title: "SPOT THE KEYWORD",
    prompt: "PLAY THE MARKED CARD FOR AN EXTRA CHIP.",
    hint: "KEYWORDS CREATE A PLAN BEYOND RAW POWER.",
    opponent: { id: "tutorial-scissors", element: "scissors", level: 9 },
    hand: [
      { id: "lesson-paper-10", element: "paper", level: 10 },
      { id: "lesson-marked", element: "rock", level: 1, keyword: "MARKED" },
      { id: "lesson-scissors-3", element: "scissors", level: 3 },
    ],
    correctId: "lesson-marked",
    success: "MARKED ROCK WINS · BONUS CHIP SECURED.",
  },
];

export class TutorialMatchScene extends Phaser.Scene {
  private lesson = 0;
  private reward = false;
  private dynamic!: Phaser.GameObjects.Container;
  private status!: Phaser.GameObjects.Text;
  private locked = false;
  private nextAction: (() => void) | null = null;

  constructor() { super("TutorialMatchScene"); }
  init(data: { reward?: boolean }) { this.reward = Boolean(data.reward); }

  create() {
    drawPixelBackdrop(this, COLORS.gold);
    drawPixelPanel(this, 640, 360, 1080, 650, COLORS.cyan);
    this.add.text(145, 78, "FIRST NIGHT // PRACTICE TABLE", pixelText(9, "#7fa98a")).setOrigin(0, .5);
    this.status = this.add.text(640, 405, "", { ...pixelText(10), align: "center", lineSpacing: 8, wordWrap: { width: 820 } }).setOrigin(.5);
    this.dynamic = this.add.container();
    new GameButton(this, 1120, 655, "Skip", () => this.finish(false), 190, "red");
    this.input.keyboard?.on("keydown", this.handleKey, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.input.keyboard?.off("keydown", this.handleKey, this));
    this.renderLesson();
  }

  private renderLesson() {
    this.dynamic.removeAll(true);
    this.locked = false;
    this.nextAction = null;
    const lesson = LESSONS[this.lesson];
    this.dynamic.add([
      this.add.text(145, 115, `LESSON ${this.lesson + 1}/3`, pixelText(8, "#a9674e")).setOrigin(0, .5),
      this.add.text(145, 155, lesson.title, pixelText(20, "#d9b867")).setOrigin(0, .5),
      this.add.text(145, 195, lesson.prompt, pixelText(8, "#c9bea0")).setOrigin(0, .5),
      new CardView(this, 640, 285, lesson.opponent).setRestingScale(.68),
    ]);
    const start = 475;
    lesson.hand.forEach((card, index) => {
      const view = new CardView(this, start + index * 165, 550, card).setRestingScale(.72);
      (view.list[1] as Phaser.GameObjects.Rectangle).on("pointerup", () => this.choose(card.id));
      this.dynamic.add(view);
    });
    this.status.setText(`${lesson.hint}\nCHOOSE WITH CLICK OR KEYS 1–3.`);
  }

  private choose(cardId: string) {
    if (this.locked) return;
    const lesson = LESSONS[this.lesson];
    if (cardId !== lesson.correctId) {
      this.status.setText(`NOT THIS ONE · ${lesson.hint}\nTRY AGAIN.`);
      return;
    }
    this.locked = true;
    this.status.setText(`${lesson.success}\nPRESS ENTER TO CONTINUE.`);
    const last = this.lesson === LESSONS.length - 1;
    this.nextAction = () => {
      next.destroy();
      if (last) this.finish(true);
      else { this.lesson++; this.renderLesson(); }
    };
    const next = new GameButton(this, 640, 655, last ? "Open the market" : "Next lesson", () => this.nextAction?.(), 300, last ? "orange" : "green");
    this.dynamic.add(next);
  }

  private handleKey(event: KeyboardEvent) {
    const index = Number(event.key) - 1;
    if (Number.isInteger(index) && index >= 0 && index < 3) this.choose(LESSONS[this.lesson].hand[index].id);
    else if (["Enter", " ", "ArrowRight"].includes(event.key)) this.nextAction?.();
    else if (event.key === "Escape") this.finish(false);
  }

  private finish(completed: boolean) {
    onboardingService.complete();
    if (completed && this.reward) progressionService.grantDoubleToken();
    this.scene.start(completed ? "ShopScene" : "MainMenuScene");
  }
}
