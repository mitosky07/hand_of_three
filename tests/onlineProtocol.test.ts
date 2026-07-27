import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { WebSocket } from "ws";
import type { AddressInfo } from "node:net";
import type { OnlineMatchView, ServerMessage } from "../src/online/protocol";
import { resolveRound } from "../src/domain/resolveRound";

let server: typeof import("../server/index").multiplayerServer;
let httpServer: typeof import("../server/index").multiplayerHttpServer;
let url = "";

class TestClient {
  readonly socket: WebSocket;
  private queue: ServerMessage[] = [];
  private waiters: Array<(message: ServerMessage) => void> = [];
  constructor(url: string) {
    this.socket = new WebSocket(url);
    this.socket.on("message", (data) => {
      const message = JSON.parse(data.toString()) as ServerMessage;
      const waiter = this.waiters.shift();
      if (waiter) waiter(message);
      else this.queue.push(message);
    });
  }
  opened() { return new Promise<void>((resolve) => this.socket.once("open", () => resolve())); }
  send(message: object) { this.socket.send(JSON.stringify(message)); }
  next(): Promise<ServerMessage> {
    const message = this.queue.shift();
    return message ? Promise.resolve(message) : new Promise((resolve) => this.waiters.push(resolve));
  }
  close() { this.socket.terminate(); }
}

async function waitForView(client: TestClient, predicate: (view: OnlineMatchView) => boolean): Promise<OnlineMatchView> {
  for (let attempts = 0; attempts < 12; attempts++) {
    const message = await client.next();
    if ((message.type === "STATE" || message.type === "JOINED") && predicate(message.view)) return message.view;
  }
  throw new Error("Expected multiplayer state was not received");
}

describe("authoritative multiplayer server", () => {
  beforeAll(async () => {
    process.env.PORT = "0";
    process.env.ROUND_DELAY_MS = "0";
    ({ multiplayerServer: server, multiplayerHttpServer: httpServer } = await import("../server/index"));
    if (!httpServer.address()) await new Promise<void>((resolve) => httpServer.once("listening", () => resolve()));
    const port = (httpServer.address() as AddressInfo).port;
    url = `ws://127.0.0.1:${port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await new Promise<void>((resolve) => httpServer.close(() => resolve()));
  });

  it("creates, joins and resolves a private best-of-three room without leaking the rival hand", async () => {
    const one = new TestClient(url);
    const two = new TestClient(url);
    await Promise.all([one.opened(), two.opened()]);

    one.send({ type: "CREATE_ROOM", name: "Alice" });
    const created = await one.next();
    expect(created.type).toBe("JOINED");
    if (created.type !== "JOINED") throw new Error("Room was not created");
    expect(created.view.phase).toBe("WAITING_FOR_PLAYER");
    expect("opponentHand" in created.view).toBe(false);

    two.send({ type: "JOIN_ROOM", code: created.view.roomCode, name: "Bob" });
    const joined = await two.next();
    expect(joined.type).toBe("JOINED");
    if (joined.type !== "JOINED") throw new Error("Room was not joined");
    let viewOne = await waitForView(one, (view) => view.phase === "SELECTING");
    let viewTwo = await waitForView(two, (view) => view.phase === "SELECTING");
    let finalOne: OnlineMatchView | null = null;
    for (let hand = 0; hand < 10; hand++) {
      const pair = viewOne.hand.flatMap((yourCard) => viewTwo.hand.map((opponentCard) => ({ yourCard, opponentCard })))
        .find(({ yourCard, opponentCard }) => resolveRound(yourCard, opponentCard, () => .99).winner !== null)
        ?? { yourCard: viewOne.hand[0], opponentCard: viewTwo.hand[0] };
      one.send({ type: "PLAY_CARD", cardId: pair.yourCard.id });
      await waitForView(one, (view) => view.phase === "WAITING_FOR_OPPONENT");
      two.send({ type: "PLAY_CARD", cardId: pair.opponentCard.id });
      const resultOne = await waitForView(one, (view) => Boolean(view.result));
      const resultTwo = await waitForView(two, (view) => Boolean(view.result));
      expect(resultOne.result?.yourCard.id).toBe(pair.yourCard.id);
      expect(resultTwo.result?.yourCard.id).toBe(pair.opponentCard.id);
      if (resultOne.phase === "MATCH_FINISHED") { finalOne = resultOne; break; }
      viewOne = await waitForView(one, (view) => view.phase === "SELECTING");
      viewTwo = await waitForView(two, (view) => view.phase === "SELECTING");
    }
    expect(finalOne?.phase).toBe("MATCH_FINISHED");
    one.close();
    two.close();
  });

  it("rejects malformed messages and cards that are not in the authoritative hand", async () => {
    const client = new TestClient(url);
    await client.opened();
    client.socket.send("{not-json");
    await expect(client.next()).resolves.toEqual({ type: "ERROR", message: "INVALID MESSAGE" });

    client.send({ type: "CREATE_ROOM", name: "<script>Dealer</script>" });
    const joined = await client.next();
    expect(joined.type).toBe("JOINED");
    if (joined.type !== "JOINED") throw new Error("Room was not created");
    expect(joined.view.yourName).not.toContain("<");

    const opponent = new TestClient(url);
    await opponent.opened();
    opponent.send({ type: "JOIN_ROOM", code: joined.view.roomCode, name: "Opponent" });
    await waitForView(opponent, (view) => view.phase === "SELECTING");
    await waitForView(client, (view) => view.phase === "SELECTING");
    client.send({ type: "PLAY_CARD", cardId: "forged-card" });
    await expect(client.next()).resolves.toEqual({ type: "ERROR", message: "CARD IS NOT IN YOUR HAND" });
    client.close();
    opponent.close();
  });
});
