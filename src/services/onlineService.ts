import type { ClientMessage, OnlineMatchView, OnlineSeat, ServerMessage } from "../online/protocol";

type Listener = (message: ServerMessage) => void;

class OnlineService {
  private socket: WebSocket | null = null;
  private listeners = new Set<Listener>();
  view: OnlineMatchView | null = null;
  seat: OnlineSeat | null = null;

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async connect(): Promise<void> {
    if (this.socket?.readyState === WebSocket.OPEN) return;
    if (this.socket) this.socket.close();
    const configured = import.meta.env.VITE_MULTIPLAYER_URL as string | undefined;
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const url = configured || `${protocol}//${window.location.hostname || "127.0.0.1"}:8097`;
    await new Promise<void>((resolve, reject) => {
      const socket = new WebSocket(url);
      this.socket = socket;
      socket.addEventListener("open", () => resolve(), { once: true });
      socket.addEventListener("error", () => reject(new Error("Could not reach the multiplayer server")), { once: true });
      socket.addEventListener("message", (event) => {
        const message = JSON.parse(String(event.data)) as ServerMessage;
        if (message.type === "JOINED") { this.seat = message.seat; this.view = message.view; }
        else if (message.type === "STATE") this.view = message.view;
        this.listeners.forEach((listener) => listener(message));
      });
      socket.addEventListener("close", () => {
        this.socket = null;
        this.listeners.forEach((listener) => listener({ type: "ERROR", message: "CONNECTION CLOSED" }));
      });
    });
  }

  createRoom(name: string) { this.send({ type: "CREATE_ROOM", name }); }
  joinRoom(code: string, name: string) { this.send({ type: "JOIN_ROOM", code: code.trim().toUpperCase(), name }); }
  play(cardId: string) { this.send({ type: "PLAY_CARD", cardId }); }
  rematch() { this.send({ type: "REMATCH" }); }
  leave() { this.send({ type: "LEAVE_ROOM" }); this.socket?.close(); this.view = null; this.seat = null; }
  private send(message: ClientMessage) { if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify(message)); }
}

export const onlineService = new OnlineService();
