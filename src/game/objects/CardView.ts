import Phaser from "phaser";
import { COLORS, PIXEL_FONT } from "../../config/theme";
import { ELEMENT_LABEL, type Card } from "../../domain/Card";
import { audioService } from "../../services/audioService";
import { progressionService } from "../../services/progressionService";
import { CARD_BACKS } from "../../domain/cosmetics";

export class CardView extends Phaser.GameObjects.Container {
  readonly card: Card;
  private readonly highlight: Phaser.GameObjects.Rectangle;
  private readonly cardBody: Phaser.GameObjects.Rectangle;
  private baseY: number;
  private restingScale = 1;
  private selected = false;
  private levelText?: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number, card: Card, hidden = false) {
    super(scene, x, y);
    scene.add.existing(this);
    this.card = card;
    this.baseY = y;
    const shadow = scene.add.rectangle(6, 8, 132, 184, COLORS.ink);
    this.cardBody = scene.add.rectangle(0, 0, 132, 184, COLORS.ink, .001).setInteractive({ useHandCursor: !hidden });
    this.highlight = scene.add.rectangle(0, 0, 144, 196).setStrokeStyle(5, COLORS.gold).setVisible(false);
    this.add([shadow, this.cardBody]);

    if (hidden) this.drawBack(scene);
    else this.drawFace(scene, card);
    this.add(this.highlight);

    this.cardBody.on("pointerover", () => { if (!this.selected) this.scene.tweens.add({ targets: this, y: this.baseY - 8, duration: 90 }); });
    this.cardBody.on("pointerout", () => { if (!this.selected) this.scene.tweens.add({ targets: this, y: this.baseY, duration: 90 }); });
  }

  setSelected(value: boolean) {
    if (this.selected === value) return;
    this.selected = value;
    this.highlight.setVisible(value);
    if (value) audioService.play("select");
    this.scene.tweens.add({ targets: this, y: value ? this.baseY - 18 : this.baseY, scale: value ? this.restingScale * 1.06 : this.restingScale, duration: 120, ease: "Quad.out" });
  }

  setRestingScale(value: number) {
    this.restingScale = value;
    this.setScale(value);
    return this;
  }

  private drawFace(scene: Phaser.Scene, card: Card) {
    const face = scene.add.image(0, 0, `video-card-${card.element}`);
    const baseLevel = Number(card.id.split("-").at(-1));
    const upgrade = Number.isFinite(baseLevel) ? Math.max(0, card.level - baseLevel) : 0;
    const title = scene.add.text(0, -69, `${ELEMENT_LABEL[card.element]}${upgrade ? ` +${upgrade}` : ""}`, {
      fontFamily: PIXEL_FONT,
      fontSize: "10px",
      color: "#e8dcc0",
    }).setOrigin(.5);
    const number = scene.add.text(0, 68, String(card.level), {
      fontFamily: PIXEL_FONT,
      fontSize: "18px",
      color: "#e8dcc0",
    }).setOrigin(.5);
    this.levelText = number;
    const keyword = card.keyword ? scene.add.text(0, 43, card.keyword, {
      fontFamily: PIXEL_FONT,
      fontSize: "6px",
      color: "#c7a45b",
    }).setOrigin(.5) : null;
    this.add(keyword
      ? [face, title, keyword, number]
      : [face, title, number]);
  }

  setLevel(level: number) {
    this.card.level = level;
    this.levelText?.setText(String(level));
    return this;
  }

  private drawBack(scene: Phaser.Scene) {
    const selected = progressionService.get().selectedCardBack;
    const style = CARD_BACKS.find((item) => item.id === selected) ?? CARD_BACKS[0];
    const wood = scene.add.rectangle(0, 0, 132, 184, COLORS.wood).setStrokeStyle(3, COLORS.woodDark);
    const felt = scene.add.rectangle(0, 0, 118, 170, style.color).setStrokeStyle(2, COLORS.cream, .75);
    const pattern = scene.add.graphics();
    pattern.lineStyle(2, COLORS.gold, .58).strokeRect(-48, -72, 96, 144);
    pattern.fillStyle(COLORS.cream, .38);
    for (let y = -48; y <= 48; y += 32) {
      for (let x = -32; x <= 32; x += 32) pattern.fillRect(x - 2, y - 2, 4, 4);
    }
    const mark = scene.add.text(0, 0, style.mark, { fontFamily: PIXEL_FONT, fontSize: "15px", color: "#e8dcc0" }).setOrigin(.5);
    this.add([wood, felt, pattern, mark]);
  }
}
