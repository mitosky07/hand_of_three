import Phaser from "phaser";

export const PIXEL_FONT = '"Geist Pixel Square"';
export const DATA_FONT = '"Geist Pixel Grid"';

export const COLORS = {
  ink: 0x080b0e,
  night: 0x101820,
  panel: 0x173440,
  panelDark: 0x0b2028,
  cream: 0xf2e8ce,
  gold: 0xe0ad4f,
  cyan: 0x58b8c7,
  magenta: 0xc45263,
  coral: 0xd1634f,
  violet: 0x73558d,
  felt: 0x0f5b5b,
  feltLight: 0x187573,
  feltDark: 0x082f36,
  wood: 0x503229,
  woodLight: 0x9b6346,
  woodDark: 0x21191a,
  white: 0xffffff,
} as const;

export const TEXT_COLORS = {
  cream: "#f2e8ce",
  gold: "#e0ad4f",
  mint: "#8fd0c9",
  terracotta: "#d9785f",
  muted: "#c2cbd0",
  dim: "#82949b",
} as const;

export function pixelText(size: number, color = "#f2e8ce"): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    fontFamily: size <= 8 ? DATA_FONT : PIXEL_FONT,
    fontSize: `${size}px`,
    color,
    lineSpacing: 6,
    align: "center",
  };
}

export function drawPixelBackdrop(scene: Phaser.Scene, accent: number = COLORS.cyan): void {
  scene.cameras.main.setBackgroundColor(COLORS.ink);
  if (scene.textures.exists("video-poker-cabinet")) {
    scene.add.image(640, 360, "video-poker-cabinet").setDepth(-20);
    scene.add.rectangle(1168, 58, 42, 4, accent, .78).setDepth(-19);
    return;
  }
  const graphics = scene.add.graphics().setDepth(-20);
  graphics.fillStyle(COLORS.night).fillRect(0, 0, 1280, 720);

  const planks = [0x251a15, 0x2a1d17, 0x211713, 0x2d1f18];
  for (let y = 0, row = 0; y < 720; y += 90, row++) {
    graphics.fillStyle(planks[row % planks.length]).fillRect(0, y, 1280, 88);
    graphics.fillStyle(COLORS.woodLight, .12).fillRect(0, y + 3, 1280, 2);
    graphics.fillStyle(COLORS.ink, .72).fillRect(0, y + 87, 1280, 3);
    for (let x = row % 2 ? 240 : 0; x < 1280; x += 480) graphics.fillStyle(COLORS.ink, .22).fillRect(x, y, 3, 88);
  }

  graphics.fillStyle(COLORS.feltDark, .97).fillRect(38, 32, 1204, 656);
  graphics.lineStyle(4, COLORS.woodLight, .78).strokeRect(38, 32, 1204, 656);
  graphics.lineStyle(1, COLORS.cream, .22).strokeRect(47, 41, 1186, 638);
  graphics.fillStyle(accent, .48).fillRect(64, 50, 160, 3);
}

export function drawPixelPanel(scene: Phaser.Scene, x: number, y: number, width: number, height: number, accent: number = COLORS.cyan): Phaser.GameObjects.Container {
  if (scene.textures.exists("video-poker-panel")) {
    const shadow = scene.add.nineslice(7, 9, "video-poker-panel", undefined, width, height, 12, 12, 12, 12).setTint(COLORS.ink).setAlpha(.72);
    const panel = scene.add.nineslice(0, 0, "video-poker-panel", undefined, width, height, 12, 12, 12, 12);
    const led = scene.add.rectangle(-width / 2 + 18, -height / 2 + 16, 10, 4, accent, .9);
    return scene.add.container(x, y, [shadow, panel, led]);
  }
  const shadow = scene.add.rectangle(8, 10, width, height, COLORS.ink, .74);
  const frame = scene.add.rectangle(0, 0, width, height, COLORS.woodDark).setStrokeStyle(3, COLORS.woodLight);
  const body = scene.add.rectangle(0, 0, width - 14, height - 14, COLORS.panelDark, .99);
  const topRule = scene.add.rectangle(-width * .24, -height / 2 + 11, width * .34, 4, accent, .86);
  const stitch = scene.add.rectangle(width / 2 - 13, height / 2 - 13, 6, 6, COLORS.gold, .78);
  return scene.add.container(x, y, [shadow, frame, body, topRule, stitch]);
}
