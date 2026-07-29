import { expect, test } from "@playwright/test";

declare global {
  interface Window {
    __HAND_OF_THREE_GAME__?: {
      scene: {
        isActive: (key: string) => boolean;
        stop: (key: string) => void;
        start: (key: string, data?: object) => void;
      };
    };
  }
}

const screens: Array<{ name: string; scene: string; data?: object }> = [
  { name: "menu", scene: "MainMenuScene" },
  { name: "modes", scene: "ModeSelectionScene", data: { mode: "AI" } },
  { name: "match", scene: "MatchScene", data: { mode: "AI" } },
  { name: "daily", scene: "MatchScene", data: { mode: "AI", daily: true } },
  { name: "shop", scene: "ShopScene" },
  { name: "daily-shop", scene: "DailyShopScene" },
  { name: "collection", scene: "CollectionScene" },
  { name: "cosmetics", scene: "CosmeticsScene" },
  { name: "tutorial", scene: "TutorialScene" },
  { name: "practice", scene: "TutorialMatchScene", data: { reward: false } },
  { name: "online", scene: "OnlineLobbyScene" },
  { name: "settings", scene: "SettingsScene" },
  { name: "credits", scene: "CreditsScene" },
];

test("every directly reachable screen loads without console, page or asset errors", async ({ page }) => {
  test.setTimeout(90_000);
  const errors: string[] = [];
  let currentScreen = "boot";
  page.on("pageerror", (error) => errors.push(`PAGE: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`CONSOLE [${currentScreen}] ${message.location().url}: ${message.text()}`);
  });
  page.on("requestfailed", (request) => errors.push(`REQUEST: ${request.url()} · ${request.failure()?.errorText ?? "failed"}`));
  page.on("response", (response) => {
    if (response.status() >= 400) errors.push(`HTTP ${response.status()}: ${response.url()}`);
  });

  await page.goto("/?e2e=1");
  await expect.poll(() => page.evaluate(() => Boolean(window.__HAND_OF_THREE_GAME__?.scene.isActive("MainMenuScene")))).toBe(true);
  for (const screen of screens) {
    currentScreen = screen.name;
    await page.evaluate(({ scene, data }) => {
      const manager = window.__HAND_OF_THREE_GAME__?.scene;
      if (manager?.isActive(scene)) manager.stop(scene);
      manager?.start(scene, data);
    }, screen);
    await expect.poll(
      () => page.evaluate((key) => Boolean(window.__HAND_OF_THREE_GAME__?.scene.isActive(key)), screen.scene),
      { message: `${screen.name} did not open ${screen.scene}` },
    ).toBe(true);
  }

  expect(errors).toEqual([]);
});
