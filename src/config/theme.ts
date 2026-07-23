import Phaser from "phaser";

export const PIXEL_FONT = '"Press Start 2P"';

export const COLORS = {
  ink: 0x0d0a09,
  night: 0x17110f,
  panel: 0x234438,
  panelDark: 0x102d24,
  cream: 0xefe2bc,
  gold: 0xd9b867,
  cyan: 0x7fa98a,
  magenta: 0xa9674e,
  coral: 0xa9674e,
  violet: 0x55425f,
  felt: 0x244c38,
  feltLight: 0x35634a,
  feltDark: 0x0b241c,
  wood: 0x653a28,
  woodLight: 0x9a5c3e,
  woodDark: 0x321d17,
  white: 0xffffff,
} as const;

export const TEXT_COLORS = {
  cream: "#efe2bc",
  gold: "#d9b867",
  mint: "#7fa98a",
  terracotta: "#a9674e",
  muted: "#c9bea0",
  dim: "#756a5d",
} as const;

export function pixelText(size: number, color = "#fff1c7"): Phaser.Types.GameObjects.Text.TextStyle {
  return { fontFamily: PIXEL_FONT, fontSize: `${size}px`, color, lineSpacing: 8, align: "center" };
}

export function drawPixelBackdrop(scene: Phaser.Scene, accent: number = COLORS.cyan): void {
  scene.cameras.main.setBackgroundColor(COLORS.ink);
  const graphics = scene.add.graphics().setDepth(-20);
  graphics.fillStyle(COLORS.night).fillRect(0, 0, 1280, 720);

  const planks = [0x271713, 0x2d1a15, 0x211310, 0x321c16, 0x291713];
  for (let y = 0, row = 0; y < 720; y += 72, row++) {
    graphics.fillStyle(planks[row % planks.length]).fillRect(0, y, 1280, 70);
    graphics.fillStyle(COLORS.woodLight, .16).fillRect(0, y + 4, 1280, 4);
    graphics.fillStyle(COLORS.ink, .55).fillRect(0, y + 68, 1280, 4);
    for (let x = row % 2 ? 180 : 0; x < 1280; x += 360) graphics.fillStyle(COLORS.ink, .3).fillRect(x, y, 4, 70);
  }

  graphics.fillStyle(COLORS.feltDark, .92).fillRect(32, 28, 1216, 664);
  graphics.lineStyle(5, COLORS.woodLight, .8).strokeRect(32, 28, 1216, 664);
  graphics.lineStyle(2, COLORS.cream, .35).strokeRect(44, 40, 1192, 640);
  graphics.lineStyle(2, accent, .13);
  for (let x = 72; x < 1240; x += 48) {
    for (let y = 70; y < 680; y += 48) {
      graphics.beginPath(); graphics.moveTo(x, y - 5); graphics.lineTo(x + 5, y); graphics.lineTo(x, y + 5); graphics.lineTo(x - 5, y); graphics.closePath(); graphics.strokePath();
    }
  }

  graphics.fillStyle(COLORS.gold);
  [[48, 44], [1232, 44], [48, 676], [1232, 676]].forEach(([x, y]) => graphics.fillRect(x - 4, y - 4, 8, 8));
}

export function drawPixelPanel(scene: Phaser.Scene, x: number, y: number, width: number, height: number, accent: number = COLORS.cyan): Phaser.GameObjects.Container {
  const deepShadow = scene.add.rectangle(12, 14, width, height, COLORS.ink, .8);
  const woodOuter = scene.add.rectangle(0, 0, width, height, COLORS.wood).setStrokeStyle(5, COLORS.woodDark);
  const woodHighlight = scene.add.rectangle(0, -3, width - 12, height - 12).setStrokeStyle(4, COLORS.woodLight, .9);
  const feltBody = scene.add.rectangle(0, 0, width - 28, height - 28, COLORS.panelDark, .98).setStrokeStyle(3, COLORS.cream, .9);
  const inner = scene.add.rectangle(0, 0, width - 42, height - 42).setStrokeStyle(2, accent, .42);
  const plaqueShadow = scene.add.rectangle(-width * .18 + 4, -height / 2 + 19, width * .42, 13, COLORS.ink, .7);
  const plaque = scene.add.rectangle(-width * .18, -height / 2 + 15, width * .42, 11, accent);
  const cornerA = scene.add.rectangle(-width / 2 + 15, -height / 2 + 15, 10, 10, COLORS.gold);
  const cornerB = scene.add.rectangle(width / 2 - 15, height / 2 - 15, 10, 10, COLORS.gold);
  return scene.add.container(x, y, [deepShadow, woodOuter, woodHighlight, feltBody, inner, plaqueShadow, plaque, cornerA, cornerB]);
}
