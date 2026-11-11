# CLAUDE.md — Security Now! Interactive Book

Rules and conventions for working in this repository. Follow them on every task.

## 1. Git workflow (required)

- **Start every new request on a new branch.** Branch from the latest `main` (`git fetch origin main && git checkout -b <branch> origin/main`). Never stack a new request on a branch whose PR is already merged.
- Commit with clear, descriptive messages, and push with `git push -u origin <branch>`.
- **When the feature or request is complete, open a pull request into `main`.** Base the description on the repo's PR template if one exists, summarize the changes, and list how they were tested.
- Never push to `main` directly. Never force-push someone else's branch.
- Never put AI model names or identifiers in commits, PRs, code or comments.
- Bump `version.json` in every PR that changes the app (see §3).

## 2. What this project is

- A **PWA** that runs on **GitHub Pages** from the **repository root**. There is no build step; everything is static HTML/CSS/JS. `.nojekyll` must stay.
- An **interactive book** of the *Security Now!* podcast. Each episode is summarized as a scripted conversation between **Leo Laporte (always on the left)** and **Steve Gibson (always on the right)**.
- It is an **unofficial fan recreation**. The "Unofficial fan recreation" badge and the not-affiliated disclaimer on the cover must stay.

## 3. Caching rules (no caching, auto-update)

- The app must **never cache**. `sw.js` is network-only: it fetches with `cache: "no-store"`, deletes all caches when it activates, and only exists so the app can be installed. Never add a cache-first or offline-cache strategy.
- `index.html` contains a bootstrap that fetches `version.json` (no-store), then loads `css/styles.css?v=<version>` and `js/app.js?v=<version>`. Add new top-level CSS/JS through that loader, not with hard-coded `<link>`/`<script>` tags.
- All data fetches go through `getJSON()` in `js/app.js` (no-store and cache-busted).
- The app re-checks `version.json` when it's opened, when it returns to the foreground, when the network comes back, and every 5 minutes. If the version has changed, it reloads.
- **Bump `version.json` on every deploy**, or apps that are already open won't refresh.

## 4. Layout and art

- Layout is chosen by **orientation** (`@media (orientation: landscape)` and `<picture><source media=…>`). Desktops and rotated phones/tablets get landscape; upright phones/tablets get portrait.
  - Cover: `assets/cover.jpg` (1:1) / `assets/cover-landscape.jpg` (16:9)
  - Storyboard: `assets/storyboard.jpg` (1086×1448) / `assets/storyboard-landscape.jpg` (1672×941)
- All stage measurements (white-column edges, portrait boxes, panel and controls) are CSS variables on `.stage`, defined once per orientation. If the art changes, re-measure it and update only those variables.
- The storyboard is pinned to the bottom of the stage. A gradient matching the art fills any extra height.
- The **"SECURITY NOW" title glows** with an animated effect on the cover. It uses `assets/title-glow-{portrait,landscape}.png`, masks of just the title letters taken from each cover. If a cover image changes, regenerate its mask with the same dimensions as the cover.
- The non-speaking host is grayscaled, and the speaking host's name tag glows.
- Before committing UI changes, check them with the pre-installed Playwright at phone portrait, phone landscape, tablet portrait and desktop sizes. Confirm there are no console errors.

## 5. Adapting episodes

- Transcript URL: `https://www.grc.com/sn/sn-NNN.txt`, zero-padded to 3 digits for 1–999 (`sn-001.txt`) and plain from 1000 on (`sn-1000.txt`). The "SecurityNow" cloud environment allows `www.grc.com`.
- **Only adapt the episodes that are asked for.**
- Write a **summary in the form of a script, not a reenactment**:
  - Keep every key fact (names, numbers, CVEs, dates, products, who said what) and drop filler, sponsor reads and small talk.
  - Make it read like Steve and Leo talking (`"s": "leo"` / `"s": "steve"`), in their own voices, as in Episode 1.
  - **Paraphrase.** Don't copy long passages from the transcript or from articles quoted on the show. Short phrases are fine.
  - Don't invent facts. Background added in "Key fact" cards must be accurate and general.
- Structure: `episodes/sn-NNN.json` with `number`, `title`, `subtitle`, `date`, `description`, `transcript`, `audio`, and `chapters[]`. Each chapter has `beats[]`; a beat is either a dialogue line `{ "s", "t" }` or a fact card `{ "type": "fact", "title", "t" }`. End with a 4–6 question `quiz[]` (`q`, `options`, `answer` index, `explain`).
- Register the episode in `episodes/index.json` (the index sorts by number and groups episodes in ranges of 100, so it scales into the thousands).
- Validate the JSON (`python3 -m json.tool`), click through the episode in a browser, and bump `version.json`.

## 6. Code conventions

- Vanilla JS (one IIFE in `js/app.js`), no frameworks, no external CDNs and no build tools.
- Hash routes: `#/`, `#/episodes`, `#/episode/<n>`, so GitHub Pages needs no server config.
- `localStorage` holds only reading progress and quiz answers. Every access is wrapped in try/catch, and the app must still work without it.
- Insert episode text with `textContent`, never `innerHTML`.
- Respect `prefers-reduced-motion`.
