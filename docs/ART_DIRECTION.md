# Hand of Three — Art direction

The game should feel like a well-used video-poker cabinet found in a back room, not a casino slot machine and not a modern neon dashboard.

## Visual grammar

- Work on a hard pixel grid. UI sprites use nearest-neighbor scaling and never mix smooth vector corners with pixel edges.
- Let the table own the screen. Menus sit inside cabinet panels; matches remove those panels and expose the felt.
- Use ivory for readable information, amber for value and selection, rust for danger, and muted green for secondary status.
- Reserve bright accents for state changes. Static decoration stays dark so it does not compete with cards or controls.
- Buttons behave like physical controls: a top highlight, a dark lower lip, a three-pixel press, and no floating glow.
- Card silhouettes stay identical across suits. Rock, Paper and Scissors are distinguished by one illustration, one face color and a plain label.
- Texture comes from stepped edges, scanlines, wear marks and restrained asymmetry—not noise overlays or random decoration.

## Production rules

- Logical canvas: 1280 × 720.
- Card face: 132 × 184.
- Button source frame: 96 × 48, expanded with nine-slice scaling.
- Panel source: 96 × 96, expanded with nine-slice scaling.
- Cabinet: 1280 × 720.
- Table: 1120 × 510.
- Typeface: Silkscreen Regular/Bold, bundled under the SIL Open Font License.
- Runtime assets: `src/assets/ui`.
- Deterministic asset builder: `tools/generate-video-poker-assets.ps1`.

## Interaction character

Input feedback should be immediate and short. Hover changes the physical face, press moves the label, selection lifts a card, and victories use element-specific finishers. Reduced-motion mode removes nonessential motion without removing state feedback.

## Things that do not belong

- gradients, glassmorphism, bloom or generic neon outlines;
- interchangeable rounded cards and pill buttons;
- decorative badges without gameplay meaning;
- multiple unrelated pixel scales;
- fake jackpot language or real-money gambling cues;
- dense prose where a table status or short house phrase is enough.
