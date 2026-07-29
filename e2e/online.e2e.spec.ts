import { expect, test, type Page } from "@playwright/test";

declare global {
  interface Window {
    __HAND_OF_THREE_GAME__?: {
      scene: { isActive: (key: string) => boolean };
    };
    __HAND_OF_THREE_ONLINE__?: {
      view: {
        roomCode: string;
        phase: string;
        yourScore: number;
        opponentScore: number;
        result: unknown;
      } | null;
    };
  }
}

async function waitForScene(page: Page, key: string) {
  await expect.poll(() => page.evaluate((scene) => Boolean(window.__HAND_OF_THREE_GAME__?.scene.isActive(scene)), key)).toBe(true);
}

async function openOnlineLobby(page: Page) {
  await page.goto("/?e2e=1");
  await waitForScene(page, "MainMenuScene");
  await page.locator("canvas").click({ position: { x: 755, y: 353 } });
  await waitForScene(page, "OnlineLobbyScene");
}

test("two browsers join a private room and resolve a real online hand", async ({ browser }) => {
  const host = await browser.newPage();
  const guest = await browser.newPage();
  await openOnlineLobby(host);
  host.once("dialog", (dialog) => dialog.accept("Alice"));
  await host.locator("canvas").click({ position: { x: 450, y: 360 } });
  await waitForScene(host, "OnlineMatchScene");
  await expect.poll(() => host.evaluate(() => window.__HAND_OF_THREE_ONLINE__?.view?.roomCode ?? "")).not.toBe("");
  const roomCode = await host.evaluate(() => window.__HAND_OF_THREE_ONLINE__?.view?.roomCode ?? "");

  await openOnlineLobby(guest);
  const answers = [roomCode, "Bob"];
  guest.on("dialog", (dialog) => dialog.accept(answers.shift() ?? ""));
  await guest.locator("canvas").click({ position: { x: 830, y: 360 } });
  await waitForScene(guest, "OnlineMatchScene");
  await expect.poll(() => host.evaluate(() => window.__HAND_OF_THREE_ONLINE__?.view?.phase)).toBe("SELECTING");
  await expect.poll(() => guest.evaluate(() => window.__HAND_OF_THREE_ONLINE__?.view?.phase)).toBe("SELECTING");

  await host.keyboard.press("1");
  await host.keyboard.press("Enter");
  await guest.keyboard.press("1");
  await guest.keyboard.press("Enter");

  await expect.poll(() => host.evaluate(() => Boolean(window.__HAND_OF_THREE_ONLINE__?.view?.result))).toBe(true);
  await expect.poll(() => guest.evaluate(() => Boolean(window.__HAND_OF_THREE_ONLINE__?.view?.result))).toBe(true);
  await host.close();
  await guest.close();
});
