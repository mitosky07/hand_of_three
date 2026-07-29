# Hand of Three multiplayer deployment

The browser build remains static and can be uploaded to itch.io. Online rooms use a separate Node.js WebSocket service.

## Local development

```bash
npm install
npm run dev
npm run dev:server
```

Run the two development commands in separate terminals. The local client connects to `ws://127.0.0.1:8097`.

## Production backend

Deploy the repository to a Node-compatible host that supports persistent WebSocket connections.

- Install command: `npm install`
- Start command: `npm start`
- Health check: `/health`
- Environment variable: `PORT` (normally supplied by the host)

Rooms are held in memory. Restarting the server closes active rooms but does not affect browser-saved progression. Before scaling to multiple instances, add shared room storage and sticky WebSocket routing.

## Production itch.io client

Create `.env.production`:

```dotenv
VITE_MULTIPLAYER_URL=wss://your-multiplayer-host.example
```

Build the client:

```bash
npm run build
```

Zip the **contents** of `dist`, keeping `index.html` at the ZIP root, and upload it as an HTML project. The URL must use `wss://`; browsers block insecure `ws://` connections from an HTTPS itch.io page.

## Protocol guarantees

- The server owns and shuffles both decks.
- Clients receive only their own hand and the rival hand count.
- Played card IDs are validated against the server-side hand.
- Choices remain hidden until both players lock.
- The server resolves hands and the best-of-three score.
- Names and messages are sanitized and size-limited.

Run all checks with:

```bash
npm run test:all
```
