# Hand of Three — Art direction

The game should feel like a well-used video-poker cabinet found in a back room, not a casino slot machine and not a modern neon dashboard.

## Visual grammar

- Work on a hard two-pixel grid. UI sprites use nearest-neighbor scaling and never mix smooth vector corners with pixel edges.
- Let the table own the screen. Menus sit inside cabinet panels; matches remove those panels and expose the felt.
- Use ivory for readable information, amber for value and selection, cyan for machine status, and crimson for danger.
- The base surface is graphite and petrol blue. Walnut appears only on the table rail and cabinet edge, never as the dominant UI color.
- Functional copy should remain at 10px or larger on the 1280 × 720 canvas; smaller Grid text is reserved for nonessential telemetry.
- Reserve bright accents for state changes. Static decoration stays dark so it does not compete with cards or controls.
- Buttons behave like physical controls: chamfered corners, a bright top edge, a dark lower lip, a three-pixel press, and no floating glow.
- Cards use one collectible, cut-corner silhouette with a walnut-and-ivory frame. Rock, Paper and Scissors remain instantly distinct through their illustration, face color and element-specific woven pattern.
- Match tables use a true oval poker-table silhouette: padded dark rail, walnut layers, a narrow brass inlay and a quiet felt field. Controls never sit on the rail.
- Texture comes from stepped edges, scanlines, wear marks and restrained asymmetry—not noise overlays or random decoration.

## Production rules

- Logical canvas: 1280 × 720.
- Card face: 132 × 184.
- Button source frame: 96 × 48, expanded with nine-slice scaling.
- Panel source: 96 × 96, expanded with nine-slice scaling.
- Cabinet: 1280 × 720.
- Table: 1120 × 510, transparent outside the oval rail.
- Typeface: Geist Pixel Square for display copy and Geist Pixel Grid for compact telemetry, bundled under the SIL Open Font License.
- Runtime assets: `src/assets/ui`.
- Editable sources: `art-source/aseprite`.
- Deterministic Aseprite builder: `npm run assets:build`.
- Aseprite automation: `tools/build-aseprite-assets.lua`, launched by `tools/export-aseprite-assets.ps1`.

## Interaction character

Input feedback should be immediate and short. Hover changes the physical face, press moves the label, selection lifts a card, and victories use element-specific finishers. Reduced-motion mode removes nonessential motion without removing state feedback.

## Things that do not belong

- gradients, glassmorphism, bloom or generic neon outlines;
- interchangeable rounded cards and pill buttons;
- decorative badges without gameplay meaning;
- multiple unrelated pixel scales;
- fake jackpot language or real-money gambling cues;
- dense prose where a table status or short house phrase is enough.
