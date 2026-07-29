# Hand of Three

An after-hours card duel built around Karjitsu: Rock, Paper and Scissors cards, uneven levels, best-of-three matches and an endless run economy.

Created by **mitosky07**.

## Run locally

```bash
npm install
npm run dev
npm run dev:server
npm run typecheck
npm run typecheck:server
npm run test
npm run test:e2e
npm run build
```

Run `npm run dev` and `npm run dev:server` in separate terminals to use online multiplayer locally. Open the game in two browser windows, choose **Online duel**, create a private table in one window, and join with its room code in the other.

## Real online multiplayer

Online matches use an authoritative WebSocket server. The server owns both decks, validates every played card, hides the rival hand and resolves the best-of-three match. Clients receive only their own cards and public table information.

For a public itch.io build:

1. Deploy this repository as a Node service on a WebSocket-capable host.
2. Use `npm start` as the service command and expose the host-provided `PORT`.
3. Create `.env.production` with `VITE_MULTIPLAYER_URL=wss://your-server.example`.
4. Run `npm run build` and upload the contents of `dist` to itch.io.

Because itch.io serves the game over HTTPS, the public server URL must use `wss://`. A local fallback uses `ws://127.0.0.1:8097`.

See [docs/MULTIPLAYER.md](docs/MULTIPLAYER.md) for deployment, environment variables and operational notes.

AI mode uses two independent Web Crypto RNG steps: one to generate the Oracle's deck and another to choose a card from its hand. Local mode hides Player 1's choice before the device is passed to Player 2. Production-ready pixel assets live under `src/assets`; Phaser and Web Audio provide animation, particles, backgrounds and sound.

## Version 1.4 features

- Real online best-of-three rooms with private codes and an authoritative WebSocket server.
- Card keywords: Heavy, Marked, Lucky, Guard and Sharp.
- Optional contracts with chips, items, MULT and reroll rewards.
- Tactical run items and eight relics with distinct effects.
- Oracle personalities rotating every five rounds.
- Seeded daily runs with deterministic hands, opponents and market offers.
- Unlockable felts, card backs, chips, victory stamps and Oracle portraits.
- Interactive first-run tutorial, reduced motion and skippable results.
- Structured market lanes: Tune-up, Backroom, Relic Case and Night Special.

The interface uses the bundled Geist Pixel Square and Geist Pixel Grid typefaces under the SIL Open Font License. All cabinet, table, button, card, and item sprites have editable sources in `art-source/aseprite`; regenerate their runtime PNG exports with `npm run assets:build`. Phones request landscape orientation to preserve table readability. Every menu supports WASD or arrow-key navigation plus `Enter`/`Space`. During matches, `A/D` or left/right selects cards, `W` or up confirms, `S` or down cancels, `1-5` directly selects a card, `I` opens run items and `Escape` pauses or closes an overlay. Online tables use `Enter` to copy a waiting room code or request a rematch and `Escape` to leave.

All screens share the same underground poker-room art direction: a hand-built oval table, walnut rails, woven felt, imperfect print marks and raised cabinet buttons. The Rock, Paper and Scissors cards use original, editable Aseprite artwork rather than generated image assets. Each winning element has its own finisher: Scissors slices, Rock crushes and Paper wraps the defeated card.

## Progression and market

AI mode is an endless run of best-of-three matches. The first player to win two hands wins the match. Winning pays chips, unlocks the next round and opens the market; losing ends the run and returns to round 1 without run chips, items or upgrades. The best round and lifetime wins remain saved. Local mode uses the same best-of-three rules without progression advantages.

The lobby always shows the next step, current round and best round. Inventory summarizes wins, multiplier, levels, items and relics.

## Art production

Editable production sprites are stored in `art-source/aseprite`. Run `npm run assets:build` to rebuild the cabinet, controls, tables, cards, and item icons through Aseprite; their runtime PNG exports live in `src/assets/ui`. The pipeline keeps every surface on the same palette and two-pixel grid.

See [docs/ART_DIRECTION.md](docs/ART_DIRECTION.md) for the visual rules used across the game.

## Play-time log

The timer starts when the game opens and stores completed sessions in `localStorage`. **Options & Time** displays the total and exports it as CSV.

During local development, finishers can be previewed deterministically with `?finish=rock`, `?finish=paper` or `?finish=scissors`. Screens can be opened for visual QA with `?scene=match`, `menu`, `modes`, `shop`, `daily-shop`, `collection`, `cosmetics`, `practice`, `online`, `tutorial` or `settings`.

## License

This project is available for personal evaluation only. Copying, modifying, redistributing, or reusing its code and assets requires prior written permission. See [LICENSE](LICENSE).

## Documentation

- [Product requirements](docs/PRD.md)
- [Art direction](docs/ART_DIRECTION.md)
- [Multiplayer deployment](docs/MULTIPLAYER.md)
- [itch.io page description](docs/ITCH_DESCRIPTION.md)
- [itch.io release checklist](docs/ITCH_RELEASE.md)
