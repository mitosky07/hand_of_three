# itch.io release checklist

1. Run `npm install`.
2. Run `npm run test:all`.
3. Run `npm run package:itch`.
4. Upload the ZIP created under `release/`. Do not upload the repository or the `dist` folder.
5. Set the project type to **HTML** and choose **Embed in page**.
6. Use a 1280 × 720 viewport.
7. Enable **Fullscreen button** and **Mobile friendly**.
8. Leave scrollbars, SharedArrayBuffer support and automatic start disabled.
9. Keep the generative-AI disclosure accurate for the released assets.
10. After uploading, use itch.io's **Run game** button in a private or draft page before making the release public.

The ZIP verifier rejects nested `index.html` files, Windows-only path separators and missing assets referenced by the entry page.
