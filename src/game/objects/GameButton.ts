import Phaser from "phaser";
import { audioService } from "../../services/audioService";
import { COLORS, PIXEL_FONT } from "../../config/theme";
import { getMenuCommand } from "../input/keyboardControls";

export type ButtonTone = "green" | "blue" | "orange" | "red" | "purple";

const TONES: Record<ButtonTone, { normal: number; hover: number; pressed: number }> = {
  green: { normal: 0, hover: 1, pressed: 2 },
  blue: { normal: 3, hover: 4, pressed: 5 },
  orange: { normal: 6, hover: 7, pressed: 8 },
  red: { normal: 9, hover: 10, pressed: 11 },
  purple: { normal: 12, hover: 13, pressed: 14 },
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
  if (["MatchScene", "OnlineMatchScene", "TutorialMatchScene"].includes(scene.sys.settings.key)) return;
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
  private readonly background: Phaser.GameObjects.NineSlice;
  private readonly shadow: Phaser.GameObjects.NineSlice;
  private readonly label: Phaser.GameObjects.Text;
  private readonly tone: { normal: number; hover: number; pressed: number };
  private readonly onClick: () => void;
  private enabled = true;
  private keyboardFocused = false;

  constructor(scene: Phaser.Scene, x: number, y: number, label: string, onClick: () => void, width = 300, tone: ButtonTone = "green") {
    super(scene, x, y);
    scene.add.existing(this);
    this.tone = TONES[tone];
    this.onClick = onClick;
    this.shadow = scene.add.nineslice(5, 6, "video-poker-buttons", this.tone.normal, width, 48, 12, 12, 12, 12)
      .setTint(COLORS.ink)
      .setAlpha(.72);
    this.background = scene.add.nineslice(0, 0, "video-poker-buttons", this.tone.normal, width, 48, 12, 12, 12, 12)
      .setInteractive({ useHandCursor: true });
    this.label = scene.add.text(0, -1, label.toUpperCase(), {
      fontFamily: PIXEL_FONT,
      fontSize: "14px",
      color: "#f2e8ce",
      align: "center",
      wordWrap: { width: width - 28 },
      lineSpacing: 3,
    }).setOrigin(.5);
    this.add([this.shadow, this.background, this.label]);
    this.background.on("pointerover", () => { audioService.play("hover"); focusButton(scene, this); this.setKeyboardFocus(true); });
    this.background.on("pointerout", () => {
      this.label.setY(-1);
      if (!this.keyboardFocused) this.setKeyboardFocus(false);
    });
    this.background.on("pointerdown", () => {
      this.background.setFrame(this.tone.pressed);
      this.label.setY(2);
    });
    this.background.on("pointerup", () => {
      this.background.setFrame(this.tone.hover);
      this.label.setY(-1);
      this.activate();
    });
    registerButton(scene, this);
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    this.setAlpha(enabled ? 1 : .48);
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
    this.background.setFrame(focused ? this.tone.hover : this.tone.normal);
    this.setScale(focused ? 1.01 : 1);
    return this;
  }

  setLabel(value: string) { this.label.setText(value.toUpperCase()); return this; }
}
