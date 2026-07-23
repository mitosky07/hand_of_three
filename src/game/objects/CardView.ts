import Phaser from "phaser";
import { COLORS, PIXEL_FONT } from "../../config/theme";
import { ELEMENT_LABEL, type Card } from "../../domain/Card";
import { audioService } from "../../services/audioService";

export class CardView extends Phaser.GameObjects.Container {
  readonly card: Card;
  private readonly highlight: Phaser.GameObjects.Rectangle;
  private readonly cardBody: Phaser.GameObjects.Rectangle;
  private baseY: number;
  private restingScale = 1;
  private selected = false;

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
    const textureKey = `card-art-${card.element}`;
    const texture = scene.textures.get(textureKey);
    const frameName = "card-crop";
    if (!texture.has(frameName)) texture.add(frameName, 0, 100, 115, 824, 1280);
    const art = scene.add.image(0, 0, textureKey, frameName).setDisplaySize(132, 184);
    const baseLevel = Number(card.id.split("-").at(-1));
    const upgrade = Number.isFinite(baseLevel) ? Math.max(0, card.level - baseLevel) : 0;
    const title = scene.add.text(0, -70, `${ELEMENT_LABEL[card.element]}${upgrade ? ` +${upgrade}` : ""}`, {
      fontFamily: PIXEL_FONT,
      fontSize: "9px",
      color: "#fff1c7",
      stroke: "#2b1b17",
      strokeThickness: 3
    }).setOrigin(.5);
    const number = scene.add.text(0, 61, String(card.level), {
      fontFamily: PIXEL_FONT,
      fontSize: "19px",
      color: "#fff1c7",
      stroke: "#241713",
      strokeThickness: 4
    }).setOrigin(.5);
    this.add([art, title, number]);
  }

  private drawBack(scene: Phaser.Scene) {
    const wood = scene.add.rectangle(0, 0, 132, 184, 0x8b4f2d).setStrokeStyle(5, 0xd89a55);
    const felt = scene.add.rectangle(0, 0, 112, 164, 0x123d34).setStrokeStyle(3, COLORS.cream);
    const pattern = scene.add.graphics();
    pattern.lineStyle(3, 0x7cc6a5, .7).strokeRect(-47, -70, 94, 140);
    pattern.fillStyle(0x7cc6a5);
    for (let y = -48; y <= 48; y += 24) {
      for (let x = -36; x <= 36; x += 24) pattern.fillRect(x - 3, y - 3, 6, 6);
    }
    const mark = scene.add.text(0, 0, "III", { fontFamily: PIXEL_FONT, fontSize: "17px", color: "#fff1c7" }).setOrigin(.5);
    this.add([wood, felt, pattern, mark]);
  }
}
