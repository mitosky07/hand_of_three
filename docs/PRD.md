# Hand of Three — Product Requirements Document

## 1. Product vision

**Hand of Three** is an endless, underground poker-room roguelite built around best-of-three Rock, Paper, Scissors card duels. Each run should feel tense, readable and replayable: the player reads an unpredictable opponent, builds a short-lived deck strategy and risks chips to reach a new best round.

The goal of the next version is to turn the existing systems—rounds, chips, shop, upgrades, items and relics—into a deeper run without adding visual clutter or making the game slow to understand.

## 2. Current foundation

The game already includes:

- Endless AI runs and local best-of-three matches.
- Random Oracle hands and random card selection.
- Chips, run-only upgrades, multiplier, double-chip item and elemental relics.
- Market, collection, tutorial, settings, pause, results and persistent progression.
- Rock crush, Paper wrap and Scissors slice finishers.
- Keyboard controls, pixel-art poker-table presentation, audio and play-time logging.

## 3. Target player experience

1. Enter a run and understand the table in under 20 seconds.
2. Pick a card because it serves a plan, not only because it is the highest number.
3. Feel a short spike of tension before every reveal and a clear payoff after each hand.
4. After a win, choose between immediate safety, long-term scaling or a risky special effect.
5. On defeat, immediately understand why the run ended and want to start another one.

## 4. Core design pillars

### Readable pressure

The important information—score, selected card, round objective, chips, multiplier and item—must always be readable at a glance. No card, button or decorative frame may cover it.

### Meaningful randomness

Randomness creates variety, but the player must always have a decision. The Oracle remains unpredictable; the player gets limited tools to react, plan and gamble.

### Short, punchy runs

One hand should resolve quickly. A complete match should take roughly 60–120 seconds. Shopping should take less than 30 seconds unless the player chooses to inspect details.

### Underground card-room identity

Every new system must look and sound like it belongs on the same low-key, illicit poker table: worn wood, dark felt, brass, paper tickets, chips, stamped cards and restrained neon.

## 5. Proposed features

### P0 — Clarity and game feel

#### A. Hand forecast and matchup feedback

Before confirmation, show a small, non-intrusive panel near the selected card:

- Selected element and power.
- The element it beats and loses against.
- Current bonus from upgrades/relics.
- The chips at stake if the player has activated a Double Chip.

After a reveal, use a concise result strip: `SCISSORS CUT PAPER · +5 CHIPS · 1–0`. Keep it on screen until the next selection.

**Acceptance criteria:** New players can identify who won, why, and what they earned without opening a menu.

#### B. Better match pacing

Add three intentional beats to each hand:

1. Card lock-in (0.2–0.35s).
2. Oracle reveal and clash (0.45–0.7s).
3. Result and finisher (0.6–1.0s, skippable with Enter).

The selected card must visibly move to the table’s active position. Losing cards should be dimmed, not removed instantly.

**Acceptance criteria:** Animations feel impactful but do not prevent a repeat player from advancing quickly.

#### C. Improved onboarding

Replace a text-heavy tutorial with a three-hand interactive first run:

- Hand 1 teaches the counter triangle.
- Hand 2 teaches card power and best-of-three score.
- Hand 3 gives one free item and opens the market.

Show the tutorial once, with a permanent `How to Play` option from the lobby.

**Acceptance criteria:** A new player finishes the first match knowing the controls, counters, score and shop purpose.

### P1 — More strategic runs

#### D. Card keywords

Add one keyword to selected cards. A card has only one keyword, keeping scanning fast.

| Keyword | Effect | Strategic role |
| --- | --- | --- |
| `HEAVY` | +2 power, but cannot be played after the same element | Burst / commitment |
| `MARKED` | Win grants +1 chip | Economy |
| `LUCKY` | 25% chance to double its power | Risk |
| `GUARD` | On a tie, keep this card in hand | Consistency |
| `SHARP` | If Scissors wins, gain +0.10 MULT for the match | Scaling |

Start with 15–20% of cards carrying a keyword. Never give more than one effect per card in the first release.

**Acceptance criteria:** The card view communicates the keyword through a one-word tag, icon and tooltip; effects are deterministic except `LUCKY`.

#### E. Match-level stakes

Before each AI match, present one optional contract. The player can decline it.

- `HOUSE FAVOR`: Win with Paper at least once; reward +4 chips.
- `NO SAFE BET`: Do not use the Double Chip; reward one free reroll.
- `COLD TABLE`: Win 2–0; reward +0.25 MULT for the run.
- `THE CUT`: Win with Scissors in the final hand; reward a random item.

Contracts create variety without requiring a new combat mode.

**Acceptance criteria:** Only one contract is active; its progress is visible on the table header; failure has no penalty beyond missing its reward.

#### F. Shop choices with identity

Give the market three fixed lanes and one rotating special:

- **Tune-up:** element upgrades.
- **Backroom:** consumable items.
- **Relic case:** unique relics.
- **Night special:** a temporary, powerful offer or contract-related item.

Use a shop reroll only for the rotating special and Backroom. This makes the shop easier to read and prevents buying from feeling entirely random.

**Acceptance criteria:** The player can understand the shop’s four areas without reading all item descriptions.

### P2 — Content and replayability

#### G. Oracle personalities

Introduce named opponents that change the *presentation* and lightly bias their deck generation, while still retaining the required second random card choice.

- `THE ORACLE`: balanced.
- `THE CUTTER`: more Scissors cards and sharp keywords.
- `THE MASON`: more high-power Rock cards.
- `THE BOOKIE`: more Marked/Lucky cards.

Each five-round milestone changes the opponent, table lighting and soundtrack layer. Do not make the AI cheat or choose a counter after seeing the player selection.

**Acceptance criteria:** AI still generates its hand first and selects one card randomly from that hand; each personality only changes the generation weights.

#### H. Unlockable visual collection

Make persistent wins unlock cosmetic-only items:

- Card backs.
- Table felt palettes.
- Chip designs.
- Victory stamps.
- Oracle portraits.

Avoid permanent power bonuses. The best-round leaderboard should remain about skill and run decisions.

**Acceptance criteria:** Cosmetics never change win odds, card power or shop prices.

#### I. Daily table seed

Add an optional daily challenge with a visible seed, a fixed shop sequence and a single leaderboard-style score: highest round, then chips earned.

For the first version, store the score locally and show a shareable result string. Online leaderboards can be a later feature.

**Acceptance criteria:** Two players using the same daily seed see the same starting hand, offers and Oracle-generation sequence.

## 6. Item and relic ideas

All are run-only. Keep an inventory cap of three relics and three consumables.

| Type | Name | Effect |
| --- | --- | --- |
| Item | Loaded Coin | Reroll one card in the player’s hand before selecting. |
| Item | Smoke Break | Peek at the Oracle’s possible elements, not its exact card. |
| Item | Table Knock | Add +3 power to the selected card; card is discarded after the hand. |
| Item | House Match | On a tie, replay the hand with new cards for both players. |
| Relic | Brass Knuckles | Rock wins add +1 permanent-for-run Rock power after each match. |
| Relic | Carbon Paper | The first Paper played each match gains `GUARD`. |
| Relic | Red Thread | If the player is behind in score, gain +0.25 MULT. |
| Relic | Dealer’s Eye | The first market reroll after each win is free. |

## 7. UI/UX requirements

- Use a safe play area: no key text below the card hand or beneath table rails.
- Always show `ROUND`, match score, chips, MULT and active item in the top information band.
- Reserve the center of the felt for the clash, never for permanent text.
- Use high-contrast cream text for primary information and muted green/bronze for secondary information.
- Show selected state through height, glow and a clear outline; do not rely only on color.
- Support keyboard first, with mouse/touch interactions matching the same buttons.
- Offer reduced-flash and reduced-motion options in Settings. Finishers should fall back to a brief static impact frame.

## 8. Technical requirements

- Keep all combat resolution in domain functions with unit tests.
- Seeded daily mode must use a deterministic RNG separate from normal random AI mode.
- Persist versioned progress safely in `localStorage`; migration must preserve best round, total wins and cosmetic unlocks.
- Add E2E coverage for a whole AI match, shop purchase, loss/reset, tutorial completion and settings persistence.
- Keep the production client static and itch.io-compatible with relative asset paths. Solo, local and daily modes must work without a server; real online rooms may use the separately deployed WebSocket service.

## 9. Success metrics

Track locally first; do not require analytics for the initial release.

- First-run completion: player completes tutorial match.
- Average match duration: 60–120 seconds.
- Run depth: median best round and median round per session.
- Build variety: percentage of runs purchasing each shop category.
- Replay signal: number of sessions after first defeat.
- Accessibility: reduced-motion setting is persistent and all major actions are keyboard reachable.

## 10. Delivery plan

### Milestone 1 — Readability and first run

Implement P0 A–C, including the result strip, safe-layout pass and interactive tutorial. Validate through a short playtest with people unfamiliar with the game.

### Milestone 2 — Strategy update

Implement card keywords, contracts and structured market lanes. Add domain tests for every keyword and contract reward.

### Milestone 3 — Replayability update

Implement Oracle personalities, cosmetic unlocks and the daily seeded table. Add shareable daily-result text.

## 11. Explicit non-goals for this version

- Real-money gambling or cash-out systems.
- Account registration, public matchmaking or global leaderboards.
- Pay-to-win progression.
- Complex deckbuilding with dozens of cards before the core run is proven fun.
- AI that reads or counters the player’s selected card after the player commits.

## 12. Scope amendment and implementation status

Real private-room multiplayer was added after the original PRD was approved. It uses an authoritative WebSocket server, private room codes, hidden rival hands and server-side best-of-three resolution. It does not require accounts or expose player progression.

Version 1.1 implements P0 A-C, P1 D-F and P2 G-I, plus the four proposed items, four proposed relics, progress migration and the online-room amendment. Automated coverage includes domain tests and browser E2E tests for AI play, progression reset, market purchase, tutorial completion, settings persistence and two-client online play.
