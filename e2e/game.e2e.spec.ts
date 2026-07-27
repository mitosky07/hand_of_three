import { expect, test, type Page } from "@playwright/test";

type ExposedGame = {
  scene: {
    isActive: (key: string) => boolean;
    getScene: (key: string) => {
      controller?: { state?: { phase?: string } };
    } | null;
  };
};

declare global {
  interface Window {
    __HAND_OF_THREE_GAME__?: ExposedGame;
  }
}

async function waitForScene(page: Page, scene: string) {
  await expect.poll(
    () => page.evaluate((target) => Boolean(window.__HAND_OF_THREE_GAME__?.scene.isActive(target)), scene),
    { message: `Expected ${scene} to become active` },
  ).toBe(true);
}

test("plays a complete keyboard-driven smoke flow", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto("/?e2e=1");
  await expect(page.locator("canvas")).toHaveCount(1);
  await expect(page.locator("canvas")).toHaveAttribute("width", "1280");
  await waitForScene(page, "MainMenuScene");

  await page.keyboard.press("Enter");
  await waitForScene(page, "ModeSelectionScene");

  await page.keyboard.press("Enter");
  await waitForScene(page, "MatchScene");

  await expect.poll(
    () => page.evaluate(() => window.__HAND_OF_THREE_GAME__?.scene.getScene("MatchScene")?.controller?.state?.phase),
    { message: "Expected the match to wait for a card" },
  ).toBe("WAITING_FOR_SELECTION");

  await page.keyboard.press("1");
  await expect.poll(
    () => page.evaluate(() => window.__HAND_OF_THREE_GAME__?.scene.getScene("MatchScene")?.controller?.state?.phase),
  ).toBe("CARD_SELECTED");

  await page.keyboard.press("W");
  await expect.poll(
    () => page.evaluate(() => window.__HAND_OF_THREE_GAME__?.scene.getScene("MatchScene")?.controller?.state?.phase),
    { timeout: 15_000, message: "Expected the AI hand to resolve" },
  ).toMatch(/WAITING_FOR_SELECTION|MATCH_FINISHED/);

  await page.keyboard.press("Escape");
  await waitForScene(page, "PauseScene");
  await page.keyboard.press("Enter");
  await expect.poll(
    () => page.evaluate(() => Boolean(window.__HAND_OF_THREE_GAME__?.scene.isActive("PauseScene"))),
  ).toBe(false);

  expect(pageErrors).toEqual([]);
});
