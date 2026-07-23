import Phaser from "phaser";
import { audioService } from "../../services/audioService";
import { COLORS, PIXEL_FONT } from "../../config/theme";
import { getMenuCommand } from "../input/keyboardControls";

export type ButtonTone = "green" | "blue" | "orange" | "red" | "purple";

const TONES: Record<ButtonTone, { base: number; hover: number; stroke: number }> = {
  green: { base: 0x244c38, hover: 0x35634a, stroke: 0x7fa98a },
  blue: { base: 0x315f6b, hover: 0x417986, stroke: 0x83aab0 },
  orange: { base: 0x805038, hover: 0x9a6548, stroke: 0xc39665 },
  red: { base: 0x713d38, hover: 0x8a4b43, stroke: 0xb8796d },
  purple: { base: 0x55425f, hover: 0x6c5478, stroke: 0x9f87a7 },
};

interface MenuKeyboardState {
  buttons: GameButton[];
  index: number;
  handler: (event: KeyboardEvent) => void;
}

const menuStates = new WeakMap<Phaser.Scene, MenuKeyboardState>();

function isUsable(button: GameButton) { return button.active && button.visible && button.isEnabled; }

function focusButton(scene: Phaser.Scene, button: GameButton) {
  const state = menuStates.get(scene);
  if (!state || !isUsable(button)) return;
  state.buttons.forEach(candidate => candidate.setKeyboardFocus(candidate === button));
  state.index = state.buttons.indexOf(button);
}

function moveFocus(scene: Phaser.Scene, direction: -1 | 1) {
  const state = menuStates.get(scene);
  if (!state) return;
  const usable = state.buttons.filter(isUsable);
  if (!usable.length) return;
  const current = state.buttons[state.index];
  const currentIndex = Math.max(0, usable.indexOf(current));
  focusButton(scene, usable[(currentIndex + direction + usable.length) % usable.length]);
  audioService.play("hover");
}

function refreshFocus(scene: Phaser.Scene) {
  const state = menuStates.get(scene);
  if (!state) return;
  const current = state.buttons[state.index];
  if (current && isUsable(current)) return;
  const next = state.buttons.find(isUsable);
  if (next) focusButton(scene, next);
  else { state.buttons.forEach(button => button.setKeyboardFocus(false)); state.index = -1; }
}

function registerButton(scene: Phaser.Scene, button: GameButton) {
  if (scene.sys.settings.key === "MatchScene") return;
  let state = menuStates.get(scene);
  if (!state) {
    const keyboard = scene.input.keyboard;
    const handler = (event: KeyboardEvent) => {
      const command = getMenuCommand(event.key);
      if (!command) return;
      event.preventDefault();
      if (command === "PREVIOUS") moveFocus(scene, -1);
      else if (command === "NEXT") moveFocus(scene, 1);
      else {
        const active = menuStates.get(scene);
        active?.buttons[active.index]?.activate();
      }
    };
    state = { buttons: [], index: -1, handler };
    menuStates.set(scene, state);
    keyboard?.on("keydown", handler);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      keyboard?.off("keydown", handler);
      menuStates.delete(scene);
    });
  }
  state.buttons.push(button);
  button.once("destroy", () => {
    const current = menuStates.get(scene);
    if (!current) return;
    current.buttons = current.buttons.filter(candidate => candidate !== button);
    current.index = Math.min(current.index, current.buttons.length - 1);
    refreshFocus(scene);
  });
  if (state.index < 0) focusButton(scene, button);
  else refreshFocus(scene);
}

export class GameButton extends Phaser.GameObjects.Container {
  private readonly background: Phaser.GameObjects.Rectangle;
  private readonly shadow: Phaser.GameObjects.Rectangle;
  private readonly label: Phaser.GameObjects.Text;
  private readonly tone: { base: number; hover: number; stroke: number };
  private readonly onClick: () => void;
  private enabled = true;
  private keyboardFocused = false;

  constructor(scene: Phaser.Scene, x: number, y: number, label: string, onClick: () => void, width = 300, tone: ButtonTone = "green") {
    super(scene, x, y);
    scene.add.existing(this);
    this.tone = TONES[tone];
    this.onClick = onClick;
    const deepShadow = scene.add.rectangle(8, 9, width, 52, COLORS.ink, .8);
    this.shadow = scene.add.rectangle(4, 5, width, 52, COLORS.woodDark);
    this.background = scene.add.rectangle(0, 0, width, 52, this.tone.base).setStrokeStyle(3, this.tone.stroke).setInteractive({ useHandCursor: true });
    const inset = scene.add.rectangle(0, 0, width - 12, 40).setStrokeStyle(2, COLORS.cream, .55);
    const marker = scene.add.rectangle(-width / 2 + 12, 0, 7, 30, COLORS.gold);
    this.label = scene.add.text(-width / 2 + 30, 0, label.toUpperCase(), { fontFamily: PIXEL_FONT, fontSize: "12px", color: "#fff4cf", align: "left", wordWrap: { width: width - 52 }, lineSpacing: 4 }).setOrigin(0, .5);
    this.add([deepShadow, this.shadow, this.background, inset, marker, this.label]);
    this.background.on("pointerover", () => { audioService.play("hover"); focusButton(scene, this); this.setKeyboardFocus(true); });
    this.background.on("pointerout", () => { if (!this.keyboardFocused) this.setKeyboardFocus(false); });
    this.background.on("pointerdown", () => this.setPosition(this.x + 3, this.y + 3));
    this.background.on("pointerup", () => { this.setPosition(this.x - 3, this.y - 3); this.activate(); });
    registerButton(scene, this);
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    this.setAlpha(enabled ? 1 : .35);
    enabled ? this.background.setInteractive({ useHandCursor: true }) : this.background.disableInteractive();
    refreshFocus(this.scene);
    return this;
  }

  get isEnabled() { return this.enabled; }

  activate() {
    if (!isUsable(this)) return this;
    audioService.play("confirm");
    this.onClick();
    return this;
  }

  setKeyboardFocus(focused: boolean) {
    this.keyboardFocused = focused;
    this.background.setFillStyle(focused ? this.tone.hover : this.tone.base);
    this.background.setStrokeStyle(3, focused ? COLORS.cream : this.tone.stroke);
    this.setScale(focused ? 1.025 : 1);
    return this;
  }

  setLabel(value: string) { this.label.setText(value.toUpperCase()); return this; }
}
