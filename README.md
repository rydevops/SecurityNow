# Security Now! Interactive Book

A Progressive Web App that turns episodes of **Security Now!** with Steve Gibson & Leo Laporte into an interactive storybook. It runs straight from the root of this repository on GitHub Pages.

## Features

- **Cover → Episodes → Reader** flow, with hash routes (`#/`, `#/episodes`, `#/episode/1`)
- **Storyboard reader**: Leo (left) and Steve (right) talk in speech bubbles. The current speaker is highlighted, and the other host is shown in grayscale.
- **Key fact** cards, a **chapter drawer**, a progress bar, and a **quiz** at the end of each episode
- **Episode index** grouped in ranges of 100 (001–100 … 1001–1100 …), with search by number or title
- Tap, swipe or use the arrow keys to move through an episode. Progress is saved in the browser.
- Installable PWA (manifest + service worker)

## No caching / auto-update

- `sw.js` **caches nothing**. Every same-origin request is fetched with `cache: "no-store"`, and any old caches are deleted when the worker activates.
- `index.html` has a small bootstrap that fetches `version.json` (no-store), then loads `css/styles.css?v=<version>` and `js/app.js?v=<version>`, which skips any stale HTTP cache.
- The app checks `version.json` again whenever it is opened or brought back to the foreground, and every 5 minutes. If the version has changed, it reloads itself.

**When you deploy a change, bump `version` in `version.json`.**

## Adding an episode

1. Create `episodes/sn-XXX.json` (use `episodes/sn-001.json` as the template). It contains `chapters`, each with `beats`:
   - `{ "s": "leo" | "steve", "t": "dialogue" }`
   - `{ "type": "fact", "title": "...", "t": "..." }`
   - and an optional `quiz` array: `{ "q", "options", "answer", "explain" }`.
2. Add an entry to `episodes/index.json`.
3. Bump `version.json`.

Source transcripts: `https://www.grc.com/sn/sn-XXX.txt` (three-digit numbers up to 999, then `sn-1000.txt` and up).

## GitHub Pages

Settings → Pages → *Deploy from a branch* → select the branch and the `/ (root)` folder. `.nojekyll` is included so files are served as they are.

## Run locally

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

Transcripts © Steve Gibson & Leo Laporte, licensed under Creative Commons BY-NC-SA 2.5. This is an unofficial fan adaptation.
