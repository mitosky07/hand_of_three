import { randomBytes } from "node:crypto";
import { createServer } from "node:http";
import { WebSocket, WebSocketServer } from "ws";
import { addKeywords, createDeck, shuffle } from "../src/domain/deck";
import { resolveRound } from "../src/domain/resolveRound";
import type { Card, ElementType } from "../src/domain/Card";
import { parseClientMessage, type OnlineMatchView, type OnlineSeat, type ServerMessage } from "../src/online/protocol";

const port = Number(process.env.PORT ?? 8097);
const roundDelayMs = Number(process.env.ROUND_DELAY_MS ?? 2200);
const winningScore = 2;

interface Player {
  socket: WebSocket;
  name: string;
  seat: OnlineSeat;
  deck: Card[];
  hand: Card[];
  score: number;
  selected: Card | null;
  rematch: boolean;
  lastElement: ElementType | null;
}

interface Room {
  code: string;
  players: Partial<Record<OnlineSeat, Player>>;
  round: number;
  result: { cards: Record<OnlineSeat, Card>; winner: OnlineSeat | null; reason: "ELEMENT_ADVANTAGE" | "HIGHER_LEVEL" | "EXACT_TIE" } | null;
  finished: boolean;
  timer: ReturnType<typeof setTimeout> | null;
}

const rooms = new Map<string, Room>();
const memberships = new Map<WebSocket, { room: Room; seat: OnlineSeat }>();
export const multiplayerHttpServer = createServer((request, response) => {
  if (request.url === "/health") {
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({ ok: true, rooms: rooms.size }));
    return;
  }
  response.writeHead(404);
  response.end();
});
export const multiplayerServer = new WebSocketServer({ server: multiplayerHttpServer });

function roomCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  do {
    const bytes = randomBytes(5);
    code = Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
  } while (rooms.has(code));
  return code;
}

function send(socket: WebSocket, message: ServerMessage) {
  if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message));
}

function freshPlayer(socket: WebSocket, seat: OnlineSeat, name: string): Player {
  const deck = shuffle(addKeywords(createDeck()));
  return { socket, seat, name: name.trim() || (seat === "PLAYER_ONE" ? "Player 1" : "Player 2"), deck, hand: deck.splice(-5), score: 0, selected: null, rematch: false, lastElement: null };
}

function viewFor(room: Room, seat: OnlineSeat): OnlineMatchView {
  const player = room.players[seat]!;
  const opponentSeat: OnlineSeat = seat === "PLAYER_ONE" ? "PLAYER_TWO" : "PLAYER_ONE";
  const opponent = room.players[opponentSeat];
  const waiting = !opponent;
  const result = room.result ? {
    yourCard: room.result.cards[seat],
    opponentCard: room.result.cards[opponentSeat],
    winner: room.result.winner === null ? "DRAW" as const : room.result.winner === seat ? "YOU" as const : "OPPONENT" as const,
    reason: room.result.reason,
  } : null;
  const phase = waiting ? "WAITING_FOR_PLAYER" as const
    : room.finished ? "MATCH_FINISHED" as const
      : result ? "ROUND_RESULT" as const
        : player.selected ? "WAITING_FOR_OPPONENT" as const
          : "SELECTING" as const;
  return {
    roomCode: room.code,
    phase,
    round: room.round,
    hand: player.hand,
    opponentHandCount: opponent?.hand.length ?? 0,
    yourScore: player.score,
    opponentScore: opponent?.score ?? 0,
    yourName: player.name,
    opponentName: opponent?.name ?? "Waiting...",
    selectedCardId: player.selected?.id ?? null,
    result,
  };
}

function broadcast(room: Room) {
  for (const seat of ["PLAYER_ONE", "PLAYER_TWO"] as const) {
    const player = room.players[seat];
    if (player) send(player.socket, { type: "STATE", view: viewFor(room, seat) });
  }
}

function beginRoom(room: Room) {
  room.round = 1;
  room.result = null;
  room.finished = false;
  for (const seat of ["PLAYER_ONE", "PLAYER_TWO"] as const) {
    const player = room.players[seat];
    if (!player) continue;
    const deck = shuffle(addKeywords(createDeck()));
    Object.assign(player, { deck, hand: deck.splice(-5), score: 0, selected: null, rematch: false, lastElement: null });
  }
  broadcast(room);
}

function finishRound(room: Room) {
  room.timer = null;
  if (room.finished) return;
  for (const seat of ["PLAYER_ONE", "PLAYER_TWO"] as const) {
    const player = room.players[seat]!;
    if (player.selected) {
      const guardedDraw = room.result?.winner === null && player.selected.keyword === "GUARD";
      if (!guardedDraw) player.hand = player.hand.filter((card) => card.id !== player.selected!.id);
      player.lastElement = player.selected.element;
    }
    player.selected = null;
    while (player.hand.length < 5 && player.deck.length) player.hand.push(player.deck.pop()!);
  }
  room.result = null;
  room.round++;
  broadcast(room);
}

function resolveIfReady(room: Room) {
  const one = room.players.PLAYER_ONE;
  const two = room.players.PLAYER_TWO;
  if (!one?.selected || !two?.selected || room.result || room.finished) return;
  const result = resolveRound(one.selected, two.selected);
  if (result.winner) room.players[result.winner]!.score++;
  room.result = {
    cards: { PLAYER_ONE: one.selected, PLAYER_TWO: two.selected },
    winner: result.winner,
    reason: result.reason,
  };
  room.finished = one.score >= winningScore || two.score >= winningScore;
  broadcast(room);
  if (!room.finished) room.timer = setTimeout(() => finishRound(room), roundDelayMs);
}

function leave(socket: WebSocket) {
  const membership = memberships.get(socket);
  if (!membership) return;
  const { room, seat } = membership;
  memberships.delete(socket);
  delete room.players[seat];
  if (room.timer) clearTimeout(room.timer);
  const opponent = room.players[seat === "PLAYER_ONE" ? "PLAYER_TWO" : "PLAYER_ONE"];
  if (opponent) send(opponent.socket, { type: "OPPONENT_LEFT" });
  rooms.delete(room.code);
}

multiplayerServer.on("connection", (socket) => {
  socket.on("message", (raw) => {
    const messageBytes = Array.isArray(raw)
      ? raw.reduce((total, part) => total + part.byteLength, 0)
      : raw.byteLength;
    if (messageBytes > 2048) { socket.close(1009, "Message too large"); return; }
    let decoded: unknown;
    try { decoded = JSON.parse(raw.toString()); } catch { send(socket, { type: "ERROR", message: "INVALID MESSAGE" }); return; }
    const message = parseClientMessage(decoded);
    if (!message) { send(socket, { type: "ERROR", message: "INVALID MESSAGE" }); return; }

    if (message.type === "CREATE_ROOM") {
      if (memberships.has(socket)) return;
      const room: Room = { code: roomCode(), players: {}, round: 1, result: null, finished: false, timer: null };
      const player = freshPlayer(socket, "PLAYER_ONE", message.name);
      room.players.PLAYER_ONE = player;
      rooms.set(room.code, room);
      memberships.set(socket, { room, seat: "PLAYER_ONE" });
      send(socket, { type: "JOINED", seat: "PLAYER_ONE", view: viewFor(room, "PLAYER_ONE") });
      return;
    }

    if (message.type === "JOIN_ROOM") {
      if (memberships.has(socket)) return;
      const room = rooms.get(message.code);
      if (!room || room.players.PLAYER_TWO) { send(socket, { type: "ERROR", message: "ROOM NOT FOUND OR FULL" }); return; }
      const player = freshPlayer(socket, "PLAYER_TWO", message.name);
      room.players.PLAYER_TWO = player;
      memberships.set(socket, { room, seat: "PLAYER_TWO" });
      send(socket, { type: "JOINED", seat: "PLAYER_TWO", view: viewFor(room, "PLAYER_TWO") });
      broadcast(room);
      return;
    }

    const membership = memberships.get(socket);
    if (!membership) { send(socket, { type: "ERROR", message: "JOIN A ROOM FIRST" }); return; }
    const { room, seat } = membership;
    const player = room.players[seat]!;
    if (message.type === "PLAY_CARD") {
      if (room.finished || room.result || player.selected || !room.players.PLAYER_ONE || !room.players.PLAYER_TWO) return;
      const card = player.hand.find((candidate) => candidate.id === message.cardId);
      if (!card) { send(socket, { type: "ERROR", message: "CARD IS NOT IN YOUR HAND" }); return; }
      const heavyBlocked = card.keyword === "HEAVY" && player.lastElement === card.element;
      const hasAlternative = player.hand.some((candidate) =>
        candidate.keyword !== "HEAVY" || player.lastElement !== candidate.element
      );
      if (heavyBlocked && hasAlternative) {
        send(socket, { type: "ERROR", message: "HEAVY CANNOT FOLLOW THE SAME ELEMENT" });
        return;
      }
      player.selected = card;
      broadcast(room);
      resolveIfReady(room);
    } else if (message.type === "REMATCH") {
      if (!room.finished) return;
      player.rematch = true;
      if (room.players.PLAYER_ONE?.rematch && room.players.PLAYER_TWO?.rematch) beginRoom(room);
      else broadcast(room);
    } else if (message.type === "LEAVE_ROOM") leave(socket);
  });
  socket.on("close", () => leave(socket));
  socket.on("error", () => leave(socket));
});

multiplayerHttpServer.listen(port, () => {
  const address = multiplayerHttpServer.address();
  const activePort = typeof address === "object" && address ? address.port : port;
  console.log(`Hand of Three multiplayer server listening on :${activePort}`);
});
