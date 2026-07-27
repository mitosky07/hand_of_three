import { expect, test, type Page } from "@playwright/test";

declare global {
  interface Window {
    __HAND_OF_THREE_GAME__?: {
      scene: {
        isActive: (key: string) => boolean;
        getScene: (key: string) => any;
      };
    };
  }
}

async function waitForScene(page: Page, key: string) {
  await expect.poll(() => page.evaluate((scene) => Boolean(window.__HAND_OF_THREE_GAME__?.scene.isActive(scene)), key)).toBe(true);
}

async function forceAiHand(page: Page, winner: "PLAYER_ONE" | "PLAYER_TWO") {
  const cardNumber = await page.evaluate((desiredWinner) => {
    const scene = window.__HAND_OF_THREE_GAME__!.scene.getScene("MatchScene");
    const state = scene.controller.state;
    const hand = state.players.PLAYER_ONE.hand;
    const index = hand.findIndex((card: any) => scene.controller.canSelect("PLAYER_ONE", card));
    const playerCard = hand[Math.max(0, index)];
    const beatenBy: Record<string, string> = { rock: "scissors", paper: "rock", scissors: "paper" };
    const beatsPlayer: Record<string, string> = { rock: "paper", paper: "scissors", scissors: "rock" };
    const element = desiredWinner === "PLAYER_ONE" ? beatenBy[playerCard.element] : beatsPlayer[playerCard.element];
    state.players.PLAYER_TWO.hand = [{ id: `forced-${element}-${state.round}`, element, level: 10 }];
    return Math.max(0, index) + 1;
  }, winner);
  await page.keyboard.press(String(cardNumber));
  await page.keyboard.press("W");
  await expect.poll(() => page.evaluate(() => Boolean(window.__HAND_OF_THREE_GAME__?.scene.getScene("MatchScene")?.pendingAdvance)), { timeout: 15_000 }).toBe(true);
  await page.keyboard.press("Enter");
}

test("completes a whole AI match and reaches results", async ({ page }) => {
  await page.goto("/?scene=match&e2e=1");
  await waitForScene(page, "MatchScene");
  await forceAiHand(page, "PLAYER_ONE");
  await expect.poll(() => page.evaluate(() => window.__HAND_OF_THREE_GAME__?.scene.getScene("MatchScene")?.controller?.state?.phase)).toBe("WAITING_FOR_SELECTION");
  await forceAiHand(page, "PLAYER_ONE");
  await waitForScene(page, "ResultsScene");
});

test("market purchase persists and a lost match resets the run", async ({ page }) => {
  await page.goto("/?e2e=1");
  await page.evaluate(() => localStorage.setItem("hand-of-three-progression-v1", JSON.stringify({ chips: 100, bestRound: 4, run: { round: 4 } })));
  await page.goto("/?scene=shop&e2e=1");
  await waitForScene(page, "ShopScene");
  await page.locator("canvas").click({ position: { x: 635, y: 321 } });
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("hand-of-three-progression-v1") ?? "{}").chips)).toBeLessThan(100);

  await page.goto("/?scene=match&e2e=1");
  await waitForScene(page, "MatchScene");
  await forceAiHand(page, "PLAYER_TWO");
  await expect.poll(() => page.evaluate(() => window.__HAND_OF_THREE_GAME__?.scene.getScene("MatchScene")?.controller?.state?.phase)).toBe("WAITING_FOR_SELECTION");
  await forceAiHand(page, "PLAYER_TWO");
  await waitForScene(page, "ResultsScene");
  const reset = await page.evaluate(() => JSON.parse(localStorage.getItem("hand-of-three-progression-v1") ?? "{}"));
  expect(reset.chips).toBe(0);
  expect(reset.run.round).toBe(1);
});

test("interactive practice tutorial completes all three lessons", async ({ page }) => {
  await page.goto("/?scene=practice&e2e=1");
  await waitForScene(page, "TutorialMatchScene");
  for (let lesson = 0; lesson < 3; lesson++) {
    await page.keyboard.press("2");
    await page.keyboard.press("Enter");
  }
  await waitForScene(page, "ShopScene");
  await expect.poll(() => page.evaluate(() => localStorage.getItem("hand-of-three-tutorial-complete"))).toBe("1");
});

test("reduced-motion setting persists after reload", async ({ page }) => {
  await page.goto("/?scene=settings&e2e=1");
  await waitForScene(page, "SettingsScene");
  await page.locator("canvas").click({ position: { x: 930, y: 340 } });
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("hand-of-three-settings") ?? "{}").reducedMotion)).toBe(true);
  await page.reload();
  await waitForScene(page, "SettingsScene");
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("hand-of-three-settings") ?? "{}").reducedMotion)).toBe(true);
});

test("the game fits a compact landscape viewport and guards portrait play", async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 360 });
  await page.goto("/?e2e=1");
  await waitForScene(page, "MainMenuScene");
  const box = await page.locator("canvas").boundingBox();
  expect(box).not.toBeNull();
  expect(box!.width).toBeLessThanOrEqual(640);
  expect(box!.height).toBeLessThanOrEqual(360);

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator("#rotate-device")).toBeVisible();
});

test("run items open and close from the keyboard", async ({ page }) => {
  await page.goto("/?e2e=1");
  await page.evaluate(() => {
    localStorage.setItem("hand-of-three-progression-v1", JSON.stringify({
      chips: 0,
      run: { items: { "smoke-break": 1 } },
    }));
  });
  await page.goto("/?scene=match&e2e=1");
  await waitForScene(page, "MatchScene");
  await page.keyboard.press("i");
  await expect.poll(() => page.evaluate(() => Boolean(window.__HAND_OF_THREE_GAME__?.scene.getScene("MatchScene")?.itemOverlay))).toBe(true);
  await page.keyboard.press("Escape");
  await expect.poll(() => page.evaluate(() => Boolean(window.__HAND_OF_THREE_GAME__?.scene.getScene("MatchScene")?.itemOverlay))).toBe(false);
});

test("forfeiting from pause ends the active run instead of granting a free retry", async ({ page }) => {
  await page.goto("/?e2e=1");
  await page.evaluate(() => {
    localStorage.setItem("hand-of-three-progression-v1", JSON.stringify({
      chips: 40,
      bestRound: 6,
      totalWins: 5,
      run: { round: 6, wins: 5 },
    }));
  });
  await page.goto("/?scene=match&e2e=1");
  await waitForScene(page, "MatchScene");
  await page.keyboard.press("Escape");
  await waitForScene(page, "PauseScene");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await waitForScene(page, "MainMenuScene");
  const progress = await page.evaluate(() => JSON.parse(localStorage.getItem("hand-of-three-progression-v1") ?? "{}"));
  expect(progress.chips).toBe(0);
  expect(progress.run.round).toBe(1);
  expect(progress.bestRound).toBe(6);
});
