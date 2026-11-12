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
- **The hosts always sit at the edges of the screen.** The stage fills the viewport, and the storyboard is split into three parts:
  - `assets/stage-{portrait,landscape}-left.jpg` (Leo + dark strip), pinned bottom-left
  - `assets/stage-{portrait,landscape}-right.jpg` (Steve + dark strip), pinned bottom-right
  - the white centre column, a flat colour that stretches to any width

  If the storyboard art changes, regenerate these crops. Each crop's inner edge must fall entirely in the white column.
- `--u` is one source-art pixel on screen (`min(100cqh/art-h, 100cqw/art-w)`). All stage measurements (strip widths, spotlight boxes, panel, controls) are source-pixel numbers in CSS variables on `.stage`, defined once per orientation and multiplied by `--u`. If the art changes, re-measure and update only those variables.
- If the screen is taller than the art, a gradient matching the strips fills the space above the pieces.
- The **"SECURITY NOW" title glows** with an animated effect on the cover. It uses `assets/title-glow-{portrait,landscape}.png`, masks of just the title letters taken from each cover. If a cover image changes, regenerate its mask with the same dimensions as the cover.
- The non-speaking host is grayscaled, and the speaking host's name tag glows.
- Before committing UI changes, check them with the pre-installed Playwright at phone portrait, phone landscape, tablet portrait and desktop sizes. Confirm there are no console errors.

## 5. Reader controls

- **Navigation:** the arrow buttons, the keyboard (←/→, Space, PageUp/PageDown), swipes, and taps. A tap on the **left end** of the stage (max(64px, 18%) wide) goes back; a tap on the **right end**, or anywhere in between, goes forward. Taps on buttons, links and quiz cards are ignored. Mouse users see a highlight over each end.
- **Settings (gear button):** text size (0.85×–1.5×, applied through the `--ts` CSS variable to everything in the thread), the typewriter effect (on/off), and typing speed (slow/normal/fast, `SPEEDS` in `app.js`). Settings are saved in `localStorage` under `sn:settings`.
- **Typewriter:** chat boxes are **static**. A typing line is laid out at its final size from the first character: the untyped rest is in place but transparent (`.typed__rest`), so the box never grows and the thread never scrolls while text appears. Never type by appending text to a growing element. Only the newest line types, and only when moving forward. Going back, opening an episode or jumping to a chapter shows lines in full. A tap or "next" during typing finishes the line, and the next one advances. Screen readers get the full line at once through the `#rd-live` region. Typing defaults to off when `prefers-reduced-motion` is set.
- Thread content sizes itself in `em`, so the text-size setting scales all of it. Don't hard-code font sizes inside `.thread`.

## 6. Adapting episodes

- Transcript URL: `https://www.grc.com/sn/sn-NNN.txt`, zero-padded to 3 digits for 1–999 (`sn-001.txt`) and plain from 1000 on (`sn-1000.txt`). The "SecurityNow" cloud environment allows `www.grc.com`.
- **Only adapt the episodes that are asked for.**
- Write a **summary in the form of a script, not a reenactment**:
  - Keep every key fact (names, numbers, CVEs, dates, products, who said what) and drop filler, sponsor reads and small talk.
  - Make it read like Steve and Leo talking (`"s": "leo"` / `"s": "steve"`), in their own voices, as in Episode 1.
  - **Paraphrase.** Don't copy long passages from the transcript or from articles quoted on the show. Short phrases are fine.
  - Don't invent facts. Background added in "Key fact" cards must be accurate and general.
  - If a host gets a fact wrong on the show, keep the line as they said it, and give the correct fact in a card that notes the difference (see Sasser's timing in Episode 1 and the card-number check in Episode 5).
- **Cover the whole show. Trim words, not facts.** Shows now run two hours or more, and the script should include everything in them, just faster to read:
  - Read the full transcript, not a summary of it. Cover every segment in the show's order: the opening, Picture of the Week, every news story, GRC and SpinRite updates that carry information, every listener question, and the closing. Skip only sponsor reads, small talk and repeated "coming up" teasers.
  - There is no length limit. A long episode gets a long script, with more chapters.
  - Keep every detail a reader would want: names, numbers, CVEs, versions, dates, places, who said what, each host's opinion or reaction, and their recommendations.
  - Trim by shortening sentences, merging points the hosts repeat, and paraphrasing quoted articles down to the facts. Don't trim by dropping stories or details.
  - Keep lines to one to three short sentences. Split long explanations into several lines.
- **Transitions must be smooth.** A reader should never land on a new subject without being told it's coming:
  - **Open every chapter with a line that names the topic and why it matters** ("Our big story: Synology just patched a critical zero-click flaw…"). Readers can jump to any chapter from the menu, so the first line has to stand on its own. Don't start a chapter mid-thought ("Microsoft fixed that.", "He's right.") or with a pronoun that refers back to the last chapter.
  - **Bridge every change of subject inside a chapter.** Use a hand-off ("Speaking of fines…", "Staying with Microsoft…"), a host announcing the next item ("Next, a sneaky supply-chain attack."), or a line that links the two stories. Paraphrase the hosts' own hand-offs from the transcript when they have them.
  - **Group related stories into one chapter** ("Fines from Russia and South Korea"). Unrelated stories get their own chapters.
  - **Finish a story before moving on.** End it with the takeaway, verdict or reaction the show gave it.
  - **Introduce each listener question in one line**: who asked, where they're from if given, and what they want to know. Then give the answer.
  - Short connecting lines are fine, like a host asking the question the next line answers. They must not add facts or opinions the hosts didn't express.
  - Put a fact card right after the line it explains, never between a question and its answer.
  - After writing, read only the first line of each chapter, then each line where the subject changes. Each one must make sense on its own.
- Structure: `episodes/sn-NNN.json` with `number`, `title`, `subtitle`, `date`, `description`, `transcript`, `audio`, and `chapters[]`. Each chapter has `beats[]`; a beat is either a dialogue line `{ "s", "t" }` or a fact card `{ "type": "fact", "title", "t" }`. When a guest joins the show, list them in a top-level `"guests": { "<key>": "<Full Name>" }` map and give their lines `"s": "<key>"`. Guest lines appear in the centre of the thread, and both hosts are dimmed while a guest speaks. End with a 4–6 question `quiz[]` (`q`, `options`, `answer` index, `explain`). Write `options` in any order. The app places the correct answer in a different slot for each question (`optionOrder()` in `app.js`), so quizzes never fall into a pattern. Write wrong answers that are plausible.
- **Show notes:** also check `https://www.grc.com/sn/sn-NNN-notes.pdf` (same numbering as transcripts). Early episodes have none, and the URL returns 404. When notes exist:
  - Set `"notes"` to the PDF URL. The chapter menu then shows a "Show notes (PDF)" link.
  - Add `"links": [{ "label", "url", "note"? }]` for useful links from the notes (tools, CVEs, projects). These appear under "From the show notes." Only http(s) URLs are shown.
  - Add details from the notes that help the reader, like steps, settings or lists, as paraphrased fact cards.
  - **Picture of the Week:** add a `{ "type": "picture", "caption", "t" }` beat where Steve introduces it. `caption` is Steve's short title and `t` is your own description of the picture. The card links to the show notes so readers can see the original.
  - **Don't copy Picture of the Week images (or other images from the notes) into the repo.** They're usually third-party photos with no license, unlike the Creative Commons transcripts. Only set `"image": "assets/potw/<file>"` for an image the owner has confirmed may be published. The app only loads local images from `assets/potw/`.
- Register the episode in `episodes/index.json` (the index sorts by number and groups episodes in ranges of 100, so it scales into the thousands).
  - Every aired episode is already listed. Episodes that haven't been adapted are **placeholders**: `{ "number", "title", "date" }` with no `file`. The index shows them dimmed with "Coming soon", and they can't be opened.
  - When you adapt an episode, update its existing entry: add `"subtitle"` and `"file"`, and keep the number and date. Don't add a second entry.
  - Placeholder titles and dates come from GRC's archive (`https://www.grc.com/securitynow.htm` and `https://www.grc.com/sn/past/<year>.htm`). When new episodes air, add placeholders for them the same way. Weeks with no new episode (no archive entry and no transcript, such as some holiday weeks) are left out.
- Validate the JSON (`python3 -m json.tool`), click through the episode in a browser, and bump `version.json`.

## 7. Code conventions

- Vanilla JS (one IIFE in `js/app.js`), no frameworks, no external CDNs and no build tools.
- Hash routes: `#/`, `#/episodes`, `#/episode/<n>`, so GitHub Pages needs no server config.
- `localStorage` holds only reading progress, quiz answers and reader settings. Every access is wrapped in try/catch, and the app must still work without it.
- Insert episode text with `textContent`, never `innerHTML`.
- Respect `prefers-reduced-motion`.
