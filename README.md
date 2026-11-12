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
- **#051** Vista's Virgin Stack (Aug 3, 2006)
- **#052** A Busy Week for Security Troubles (Aug 10, 2006)
- **#053** VMware (Aug 17, 2006)
- **#054** Blue Pill (Aug 24, 2006)
- **#055** Application Sandboxes (Aug 31, 2006)
- **#056** Listener Feedback Q&A #10 (Sep 7, 2006)
- **#057** Virtual PC versus VMware (Sep 14, 2006)
- **#058** Two New Critical Windows Problems (Sep 21, 2006)
- **#059** Comparing 'Parallels' VMs (Sep 28, 2006)
- **#060** Listener Feedback Q&A #11 (Oct 5, 2006)
- **#061** ISP Privacy and Security (Oct 12, 2006)
- **#062** Internet Proxies (Oct 19, 2006)
- **#063** MojoPac (Oct 26, 2006)
- **#064** Listener Feedback Q&A #12 (Nov 2, 2006)
- **#065** Why Is Security So Difficult? (Nov 9, 2006)
- **#066** Windows Vista Security (Nov 16, 2006)
- **#067** Kernel Patch Protection (Nov 23, 2006)
- **#068** Listener Feedback Q&A #13 (Nov 30, 2006)
- **#069** The Social Implications of Internet Anonymity (Dec 7, 2006)
- **#070** Achieving Internet Anonymity (Dec 14, 2006)
- **#071** SecurAble (Dec 21, 2006)
- **#072** Listener Feedback Q&A #14 (Dec 28, 2006)
- **#073** Digital Rights Management (DRM) (Jan 4, 2007)
- **#074** Peter Gutmann on Vista DRM (Jan 11, 2007)
- **#075** Vista DRM Wrap-Up and Announcing "SecurAble" (Jan 18, 2007)
- **#076** Listener Feedback Q&A #15 (Jan 25, 2007)
- **#077** Microsoft on Vista DRM (Feb 1, 2007)
- **#078** DEP in Depth (Feb 8, 2007)
- **#079** Backtracking Spoofed Spam eMail (Feb 15, 2007)
- **#080** Listener Feedback Q&A #16 (Feb 22, 2007)
- **#081** Hard Drive Unreliability (Mar 1, 2007)
- **#082** Cyber Warfare (Mar 8, 2007)
- **#083** UAC in Depth (Mar 15, 2007)
- **#084** Listener Feedback Q&A #17 (Mar 22, 2007)
- **#085** Intro to Web Code Injection (Mar 29, 2007)
- **#086** Cross-Site Scripting (Apr 5, 2007)
- **#087** SQL Injection Exploits (Apr 12, 2007)
- **#088** Listener Feedback Q&A #18 (Apr 19, 2007)
- **#089** Even More Badly Broken WEP (Apr 26, 2007)
- **#090** Multifactor Authentication (May 3, 2007)
- **#091** Marc Maiffret (May 10, 2007)
- **#092** Listener Feedback Q&A #19 (May 17, 2007)
- **#093** Microsoft Patent Wars (May 24, 2007)
- **#094** The Fourth Factor (May 31, 2007)
- **#095** OpenID (Jun 7, 2007)
- **#096** Listener Feedback Q&A #20 (Jun 14, 2007)
- **#097** Operation: Bot Roast (Jun 21, 2007)
- **#098** Internet Identity Metasystems (Jun 28, 2007)
- **#099** Trusted Platform Module (TPM) (Jul 5, 2007)
- **#100** Listener Feedback Q&A #21 (Jul 12, 2007)
- **#101** Are You Human? (Jul 19, 2007)
- **#102** Listener Mailbag #1 (Jul 26, 2007)
- **#103** PayPal Security Key (Aug 2, 2007)
- **#104** Listener Feedback Q&A #22 (Aug 9, 2007)
- **#105** Firewall LeakTesting (Aug 16, 2007)
- **#106** Listener Mailbag #2 (Aug 23, 2007)
- **#107** PIP & Even More Perfect Passwords (Aug 30, 2007)
- **#108** Listener Feedback #23 (Sep 6, 2007)
- **#109** GRC's eCommerce System (Sep 13, 2007)
- **#110** Listener Feedback #24 (Sep 20, 2007)
- **#111** OpenID Precautions (Sep 27, 2007)
- **#112** Listener Feedback #25 (Oct 4, 2007)
- **#113** Roaming Authentication (Oct 11, 2007)
- **#114** Listener Feedback #26 (Oct 18, 2007)
- **#115** Perfect Paper Passwords (Oct 25, 2007)
- **#116** Listener Feedback #27 (Nov 1, 2007)
- **#117** Even More Perfect paper Passwords (Nov 8, 2007)
- **#118** Listener Feedback #28 (Nov 15, 2007)
- **#119** PayPal and DoubleClick (Nov 22, 2007)
- **#120** Listener Feedback #29 (Nov 29, 2007)
- **#121** Is Privacy Dead? (Dec 6, 2007)
- **#122** Listener Feedback #30 (Dec 13, 2007)
- **#123** Jungle Disk (Dec 20, 2007)
- **#124** Listener Feedback #31 (Dec 27, 2007)
- **#125** Symmetric Ciphers (Jan 3, 2008)
- **#126** Listener Feedback #32 (Jan 10, 2008)
- **#127** Corporate Security (Jan 17, 2008)
- **#128** Listener Feedback #33 (Jan 24, 2008)
- **#129** Windows SteadyState (Jan 31, 2008)
- **#130** Listener Feedback #34 (Feb 7, 2008)
- **#131** FREE CompuSec (Feb 14, 2008)
- **#132** Listener Feedback #35 (Feb 21, 2008)
- **#133** TrueCrypt v5.0 (Feb 28, 2008)
- **#134** Listener Feedback #36 (Mar 6, 2008)
- **#135** IronKey (Mar 13, 2008)
- **#136** Listener Feedback #37 (Mar 20, 2008)
- **#137** RAM Hijacks (Mar 27, 2008)
- **#138** Listener Feedback #38 (Apr 3, 2008)
- **#139** Network Congestion (Apr 10, 2008)
- **#140** Listener Feedback #39 (Apr 17, 2008)
- **#141** RSA Conference 2008 (Apr 24, 2008)
- **#142** Listener Feedback #40 (May 1, 2008)
- **#143** YubiKey (May 8, 2008)
- **#144** Listener Feedback #41 (May 15, 2008)
- **#145** Secunia's PSI (May 22, 2008)
- **#146** Listener Feedback #42 (May 29, 2008)
- **#147** Microsoft's Baseline Security Analyzer (Jun 5, 2008)
- **#148** Listener Feedback #43 (Jun 12, 2008)
- **#149** ISP Betrayal (Jun 19, 2008)
- **#150** Listener Feedback #44 (Jun 26, 2008)
- **#151** Phracking Phorm (Jul 3, 2008)
- **#152** Listener Feedback #45 (Jul 10, 2008)
- **#153** DePhormed Politics (Jul 17, 2008)
- **#154** Listener Feedback #46 (Jul 24, 2008)
- **#155** Bailiwicked Domain Attack (Jul 31, 2008)
- **#156** Listener Feedback #47 (Aug 7, 2008)
- **#157** DNS — After the Patch (Aug 14, 2008)
- **#158** Listener Feedback #48 (Aug 21, 2008)
- **#159** Vista Security Bypass (Aug 28, 2008)
- **#160** Listener Feedback #49 (Sep 4, 2008)
- **#161** Google's Chrome (Sep 11, 2008)
- **#162** Listener Feedback #50 (Sep 18, 2008)
- **#163** GoogleUpdate & DNS Security (Sep 25, 2008)
- **#164** Sockstress (Oct 2, 2008)
- **#165** Listener Feedback #51 (Oct 9, 2008)
- **#166** Cross-Site Request Forgery (Oct 16, 2008)
- **#167** Listener Feedback #52 (Oct 23, 2008)
- **#168** ClickJacking (Oct 30, 2008)
- **#169** Listener Feedback #53 (Nov 6, 2008)
- **#170** The TKIP Hack (Nov 13, 2008)
- **#171** Listener Feedback #54 (Nov 20, 2008)
- **#172** Sandboxie (Nov 27, 2008)
- **#173** Listener Feedback #55 (Dec 4, 2008)
- **#174** Sandbox Limitations (Dec 11, 2008)
- **#175** Listener Feedback #56 (Dec 18, 2008)
- **#176** Drop My Rights (Dec 25, 2008)
- **#177** Breaking SSL, PDP-8's & UltraCapacitors (Jan 1, 2009)
- **#178** Listener Feedback #57 (Jan 8, 2009)
- **#179** Cracking Security Certificates (Jan 15, 2009)
- **#180** Listener Feedback #58 (Jan 22, 2009)
- **#181** Crypto Rehash (Jan 29, 2009)
- **#182** Listener Feedback #59 (Feb 5, 2009)
- **#183** Modes of Encryption (Feb 12, 2009)
- **#184** Listener Feedback #60 (Feb 19, 2009)
- **#185** Cryptographic HMACs (Feb 26, 2009)
- **#186** Listener Feedback #61 (Mar 5, 2009)
- **#187** Windows Autorun-around (Mar 12, 2009)
- **#188** Listener Feedback #62 (Mar 19, 2009)
- **#189** Internet Explorer 8 (Mar 26, 2009)
- **#190** Listener Feedback #63 (Apr 2, 2009)
- **#191** GhostNet (Apr 9, 2009)
- **#192** Listener Feedback #64 (Apr 16, 2009)
- **#193** Conficker (Apr 23, 2009)
- **#194** Listener Feedback #65 (Apr 30, 2009)
- **#195** The SSL/TLS Protocol (May 7, 2009)
- **#196** Listener Feedback #66 (May 14, 2009)
- **#197** Windows 7 Security (May 21, 2009)
- **#198** Listener Feedback #67 (May 28, 2009)
- **#199** The Geek Atlas, IPv6 & a non-VPN (Jun 4, 2009)
- **#200** Listener Feedback #68 (Jun 11, 2009)
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
