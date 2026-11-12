# Security Now! Interactive Book

A Progressive Web App that turns episodes of **Security Now!** with Steve Gibson & Leo Laporte into an interactive storybook. It runs straight from the root of this repository on GitHub Pages.

## Features

- **Portrait and landscape layouts**, chosen by device orientation (separate cover and storyboard art for each)
- Animated glow on the **SECURITY NOW** title. The cover is labeled as an unofficial fan recreation.
- **Cover → Episodes → Reader** flow, with hash routes (`#/`, `#/episodes`, `#/episode/1`)
- **Storyboard reader**: Leo (left) and Steve (right) talk in speech bubbles. The current speaker is highlighted, and the other host is shown in grayscale.
- **Key fact** cards, a **chapter drawer**, a progress bar, and a **quiz** at the end of each episode
- **Episode index** grouped in ranges of 100 (001–100 … 1001–1100 …), with search by number or title
- Tap, swipe or use the arrow keys to move through an episode. Tapping the left end of the stage goes back; tapping the right end goes forward. Progress is saved in the browser.
- The hosts stay at the edges of any screen, including ultrawide.
- **Reading settings** (gear button): text size, a typewriter effect and its speed
- **Show notes:** episodes with GRC show notes link to the PDF, list useful links from it in the chapter menu, and include a Picture of the Week card
- Installable PWA (manifest + service worker)

## No caching / auto-update

- `sw.js` **caches nothing**. Every same-origin request is fetched with `cache: "no-store"`, and any old caches are deleted when the worker activates.
- `index.html` has a small bootstrap that fetches `version.json` (no-store), then loads `css/styles.css?v=<version>` and `js/app.js?v=<version>`, which skips any stale HTTP cache.
- The app checks `version.json` again whenever it is opened or brought back to the foreground, and every 5 minutes. If the version has changed, it reloads itself.

**When you deploy a change, bump `version` in `version.json`.**

## Episodes so far

- **#001** As the Worm Turns (Aug 19, 2005)
- **#002** HoneyMonkeys (Aug 25, 2005)
- **#003** NAT Router Firewalls (Sep 1, 2005)
- **#004** Personal Password Policy (Sep 8, 2005)
- **#005** Personal Password Policy, Part 2 (Sep 15, 2005)
- **#006** Information Leakage (Sep 22, 2005)
- **#007** SPYaWAREness (Sep 30, 2005)
- **#008** DDoS Attacks (Oct 6, 2005)
- **#009** Rootkits (Oct 13, 2005)
- **#010** Open Wireless Access Points (Oct 20, 2005)
- **#011** Bad WiFi Security (Oct 27, 2005)
- **#012** Sony's Rootkit DRM (Nov 2, 2005)
- **#013** Unbreakable WiFi Security (Nov 10, 2005)
- **#014** VPNs: The Theory (Nov 17, 2005)
- **#015** VPN Secure Tunneling Solutions (Nov 23, 2005)
- **#016** Listener Feedback Q&A #1 (Dec 1, 2005)
- **#017** PPTP and IPSec VPNs (Dec 8, 2005)
- **#018** Hamachi Rocks! (Dec 15, 2005)
- **#019** VPNs Three: Hamachi, iPig and OpenVPN (Dec 22, 2005)
- **#020** Serious Windows Flaw + Q&A #2 (Dec 29, 2005)
- **#021** The WMF Vulnerability (Jan 5, 2006)
- **#022** The Windows MetaFile Backdoor? (Jan 12, 2006)
- **#023** GRC's MouseTrap (Jan 19, 2006)
- **#024** Listener Feedback Q&A #3 (Jan 26, 2006)
- **#025** How the Internet Works, Part 1 (Feb 2, 2006)
- **#026** How the Internet Works, Part 2 (Feb 9, 2006)
- **#027** How LANs Work, Part 1 (Feb 16, 2006)
- **#028** Listener Feedback Q&A #4 (Feb 23, 2006)
- **#029** Ethernet Insecurity (Mar 2, 2006)
- **#030** Cryptographic Issues (Mar 9, 2006)
- **#031** Symmetric Stream Ciphers (Mar 16, 2006)
- **#032** Listener Feedback Q&A #5 (Mar 23, 2006)
- **#033** Symmetric Block Ciphers (Mar 30, 2006)
- **#034** Public Key Cryptography (Apr 6, 2006)
- **#035** Cryptographic Hashes (Apr 13, 2006)
- **#036** Listener Feedback Q&A #6 (Apr 20, 2006)
- **#037** Crypto Series Wrap-up (Apr 27, 2006)
- **#038** Browser Security (May 4, 2006)
- **#039** Buffer Overruns (May 11, 2006)
- **#040** Listener Feedback Q&A #7 (May 18, 2006)
- **#041** TrueCrypt (May 25, 2006)
- **#042** NAT Traversal (Jun 1, 2006)
- **#043** Open Ports (Jun 8, 2006)
- **#044** Listener Feedback Q&A #8 (Jun 15, 2006)
- **#045** The 'Hosts' File (Jun 22, 2006)
- **#046** Router Logs (Jun 29, 2006)
- **#047** Internet Weaponry (Jul 6, 2006)
- **#048** Listener Feedback Q&A #9 (Jul 13, 2006)
- **#049** The NETSTAT Command (Jul 20, 2006)
- **#050** Virtual Machine History & Technology (Jul 27, 2006)
- **#1000** One Thousand! (Nov 12, 2024)

## Adding an episode

1. Create `episodes/sn-XXX.json` (use `episodes/sn-001.json` as the template). It contains `chapters`, each with `beats`:
   - `{ "s": "leo" | "steve", "t": "dialogue" }`
   - `{ "type": "fact", "title": "...", "t": "..." }`
   - and an optional `quiz` array: `{ "q", "options", "answer", "explain" }`.
2. Add an entry to `episodes/index.json`.
3. Bump `version.json`.

Source transcripts: `https://www.grc.com/sn/sn-XXX.txt` (three-digit numbers up to 999, then `sn-1000.txt` and up).

See `CLAUDE.md` for the full set of project rules (branching, PRs, caching, how episodes are adapted).

## GitHub Pages

Settings → Pages → *Deploy from a branch* → select the branch and the `/ (root)` folder. `.nojekyll` is included so files are served as they are.

## Run locally

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

Transcripts © Steve Gibson & Leo Laporte, licensed under Creative Commons BY-NC-SA 2.5. This is an unofficial fan adaptation.
