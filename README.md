# Hand of Three

A Rock, Paper, Scissors card game with levels, built with Phaser and TypeScript.

## Run locally

```bash
npm install
npm run dev
npm run typecheck
npm run test
npm run build
```

AI mode uses two independent Web Crypto RNG steps: one to generate the Oracle's deck and another to choose a card from its hand. Local mode hides Player 1's choice before the device is passed to Player 2. Pixel-art table and card assets live under `public/assets`; Phaser and Web Audio provide animation, particles, backgrounds and sound.

The interface uses the bundled Press Start 2P typeface under the SIL Open Font License. Phones request landscape orientation to preserve table readability. Every menu supports WASD or arrow-key navigation plus `Enter`/`Space`. During matches, `A/D` or left/right selects cards, `W` or up confirms, `S` or down cancels, `1–5` directly selects a card and `Escape` pauses.

All screens share the same underground poker-room art direction: pixel wood, green felt, cream piping, brass rivets and raised buttons. Each winning element has its own finisher: Scissors slices, Rock crushes and Paper wraps the defeated card.

## Progression and market

AI mode is an endless run of best-of-three matches. The first player to win two hands wins the match. Winning pays chips, unlocks the next round and opens the market; losing ends the run and returns to round 1 without run chips, items or upgrades. The best round and lifetime wins remain saved. Local mode uses the same best-of-three rules without progression advantages.

The lobby always shows the next step, current round and best round. Inventory summarizes wins, multiplier, levels, items and relics.

## Editable Aseprite assets

The table, cards and item icons are preserved as native documents in `public/assets/aseprite/*.aseprite`. The game loads their exported PNG files directly.

## Play-time log

The timer starts when the game opens and stores completed sessions in `localStorage`. **Options & Time** displays the total and exports it as CSV.

During local development, finishers can be previewed deterministically with `?finish=rock`, `?finish=paper` or `?finish=scissors`. Screens can be opened for visual QA with `?scene=match`, `menu`, `modes`, `shop`, `collection`, `tutorial` or `settings`.

## License

This project is available for personal evaluation only. Copying, modifying, redistributing, or reusing its code and assets requires prior written permission. See [LICENSE](LICENSE).
