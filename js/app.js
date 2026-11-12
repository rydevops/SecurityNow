/* =========================================================
   Security Now! Interactive Book — app logic
   Hash routes (they work on GitHub Pages with no server config):
     #/                 cover
     #/episodes         episode index
     #/episode/<n>      reader
   ========================================================= */
(() => {
  'use strict';

  const APP_VERSION = window.__APP_VERSION__ || 'dev';
  const $ = (sel, root = document) => root.querySelector(sel);
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };
  const pad = (n) => String(n).padStart(3, '0');
  const HOST_NAMES = { leo: 'Leo Laporte', steve: 'Steve Gibson' };
  // A guest's lines use a key listed in the episode's `guests` map
  // (e.g. { "peter": "Peter Gutmann" }). Guests sit in the centre, and
  // both hosts are dimmed while one speaks.
  const isHost = (s) => Object.prototype.hasOwnProperty.call(HOST_NAMES, s);
  const speakerName = (s) => HOST_NAMES[s] || (ep && ep.guests && ep.guests[s]) || s;

  /* ---------- storage (best-effort; app works without it) ---------- */
  const store = {
    get(k, d = null) { try { const v = localStorage.getItem('sn:' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem('sn:' + k, JSON.stringify(v)); } catch { /* ignore */ } },
  };

  /* ---------- reader settings (text size, typewriter) ---------- */
  const SPEEDS = {               // every = ms per tick, chars = characters per tick
    slow:   { every: 45, chars: 1 },
    normal: { every: 35, chars: 3 },
    fast:   { every: 25, chars: 6 },
  };
  const SIZES = [0.85, 1, 1.15, 1.3, 1.5];
  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const settings = Object.assign(
    { size: 1, typing: !prefersReducedMotion, speed: 'normal' },
    store.get('settings', {})
  );
  if (!SIZES.includes(settings.size)) settings.size = 1;
  if (!SPEEDS[settings.speed]) settings.speed = 'normal';
  const applySettings = () => document.documentElement.style.setProperty('--ts', String(settings.size));
  applySettings();

  /* ---------- network: never use the HTTP cache ---------- */
  const getJSON = async (path) => {
    const sep = path.includes('?') ? '&' : '?';
    const res = await fetch(`${path}${sep}v=${encodeURIComponent(APP_VERSION)}&t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`${path}: ${res.status}`);
    return res.json();
  };

  /* =========================================================
     UPDATE CHECKING
     The service worker does no caching, so a reload always gets the
     latest deploy. When a newer version.json is found (on open, on
     return to the app, or every few minutes), the app reloads itself.
     ========================================================= */
  let swReg = null;
  let lastCheck = 0;
  let reloading = false;

  async function checkForUpdate(force = false) {
    if (reloading) return;
    const now = Date.now();
    if (!force && now - lastCheck < 30_000) return;
    lastCheck = now;
    try {
      if (swReg) swReg.update().catch(() => {});
      const res = await fetch(`version.json?t=${now}`, { cache: 'no-store' });
      if (!res.ok) return;
      const { version } = await res.json();
      if (version && String(version) !== APP_VERSION) {
        reloading = true;
        toast(`Updating to version ${version}…`);
        setTimeout(() => location.reload(), 600);
      }
    } catch { /* offline: try again later */ }
  }

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('sw.js', { updateViaCache: 'none' })
      .then((reg) => { swReg = reg; reg.update().catch(() => {}); })
      .catch(() => {});
  }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') checkForUpdate(); });
  window.addEventListener('pageshow', (e) => { if (e.persisted) checkForUpdate(true); });
  window.addEventListener('online', () => checkForUpdate(true));
  window.addEventListener('focus', () => checkForUpdate());
  setInterval(() => checkForUpdate(true), 5 * 60_000);

  /* ---------- toast ---------- */
  let toastTimer;
  function toast(msg, ms = 2600) {
    const t = $('#toast');
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, ms);
  }

  /* =========================================================
     STATE
     ========================================================= */
  let catalog = [];           // from episodes/index.json
  // Index entries without a "file" are placeholders: episodes that aired
  // but haven't been adapted yet. They're listed, but can't be opened.
  const isReady = (e) => !!(e && e.file);
  const episodeCache = new Map(); // in-memory only, for this page session
  let ep = null;              // current episode JSON
  let steps = [];             // flattened beats + a final "quiz" step
  let idx = 0;                // current step index
  let quiz = { answers: [] };
  let activeRange = null;

  /* =========================================================
     ROUTER
     ========================================================= */
  const screens = { cover: $('#screen-cover'), index: $('#screen-index'), reader: $('#screen-reader') };
  function show(name) {
    for (const [k, s] of Object.entries(screens)) s.hidden = k !== name;
    stopTyping();
    closeDrawer();
    closeSettings();
    window.scrollTo(0, 0);
  }

  async function route() {
    const hash = location.hash.replace(/^#\/?/, '');
    const parts = hash.split('/').filter(Boolean);
    if (parts[0] === 'episodes') { renderIndex(); show('index'); return; }
    if (parts[0] === 'episode' && parts[1]) {
      const n = parseInt(parts[1], 10);
      await openEpisode(n);
      return;
    }
    renderCover();
    show('cover');
  }
  const go = (h) => { if (location.hash === h) route(); else location.hash = h; };
  window.addEventListener('hashchange', route);

  document.addEventListener('click', (e) => {
    const nav = e.target.closest('[data-nav]');
    if (!nav) return;
    const to = nav.dataset.nav;
    go(to === 'index' ? '#/episodes' : '#/');
  });

  /* =========================================================
     COVER
     ========================================================= */
  function renderCover() {
    const last = store.get('last');
    const resume = last && catalog.find((e) => e.number === last && isReady(e));
    const btn = $('#cover-start');
    btn.textContent = resume && store.get('progress:' + last, 0) > 0
      ? `Continue Episode ${resume.number}`
      : 'Start with Episode 1';
    btn.onclick = () => go(`#/episode/${resume ? resume.number : (catalog[0]?.number || 1)}`);
  }
  $('#cover-episodes').addEventListener('click', () => go('#/episodes'));

  /* =========================================================
     EPISODE INDEX
     Episodes are grouped in ranges of 100 (001–100, 101–200 … 1001–1100 …)
     so the list stays manageable as it grows into the thousands.
     ========================================================= */
  const RANGE = 100;
  const rangeOf = (n) => Math.floor((n - 1) / RANGE);

  function renderIndex() {
    const ranges = $('#ep-ranges');
    ranges.innerHTML = '';
    const maxN = Math.max(1, ...catalog.map((e) => e.number));
    const lastRange = rangeOf(maxN);
    if (activeRange == null) activeRange = rangeOf(store.get('last') || catalog[0]?.number || 1);

    for (let r = 0; r <= lastRange; r++) {
      const lo = r * RANGE + 1, hi = (r + 1) * RANGE;
      const inRange = catalog.filter((e) => rangeOf(e.number) === r);
      const ready = inRange.filter(isReady).length;
      const b = el('button', 'range', `${pad(lo)}–${pad(hi)}`);
      b.setAttribute('aria-pressed', String(r === activeRange));
      b.title = `${ready} of ${inRange.length} episode${inRange.length === 1 ? '' : 's'} ready to read`;
      if (inRange.length && !ready) b.classList.add('range--soon');
      b.onclick = () => { activeRange = r; $('#ep-search').value = ''; renderIndex(); };
      ranges.appendChild(b);
    }
    renderList();
  }

  function renderList() {
    const q = $('#ep-search').value.trim().toLowerCase();
    const list = $('#ep-list');
    list.innerHTML = '';
    let items = catalog;
    if (q) {
      const qn = q.replace(/^#?0*/, '');
      items = catalog.filter((e) =>
        String(e.number) === qn || pad(e.number).includes(q) ||
        e.title.toLowerCase().includes(q) || (e.subtitle || '').toLowerCase().includes(q));
    } else {
      items = catalog.filter((e) => rangeOf(e.number) === activeRange);
    }
    $('#ep-ranges').style.opacity = q ? .4 : 1;

    if (!items.length) {
      list.appendChild(el('li', 'empty', q ? 'No episodes match that search yet.' : 'Episodes in this range are coming soon.'));
      return;
    }
    for (const e of items) {
      const li = el('li');
      const ready = isReady(e);
      const b = el('button', ready ? 'ep' : 'ep ep--soon');
      const num = el('div', 'ep__num'); num.appendChild(el('span', '', pad(e.number)));
      const body = el('div', 'ep__body');
      body.appendChild(el('div', 'ep__title', e.title));
      if (e.subtitle) body.appendChild(el('div', 'ep__sub', e.subtitle));
      const meta = el('div', 'ep__meta');
      meta.appendChild(el('span', '', formatDate(e.date)));
      if (!ready) meta.appendChild(el('span', 'ep__soon', 'Coming soon'));
      const pct = store.get('pct:' + e.number, 0);
      if (pct > 0) {
        const bar = el('span', 'ep__bar'); const fill = el('i'); fill.style.width = pct + '%'; bar.appendChild(fill);
        meta.appendChild(bar);
        meta.appendChild(el('span', '', pct >= 100 ? 'Done' : `${pct}%`));
      }
      body.appendChild(meta);
      const goIcon = el('span', 'ep__go');
      goIcon.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>';
      b.append(num, body, goIcon);
      if (ready) {
        b.setAttribute('aria-label', `Episode ${e.number}: ${e.title}`);
        b.onclick = () => go(`#/episode/${e.number}`);
      } else {
        goIcon.hidden = true;
        b.setAttribute('aria-disabled', 'true');
        b.setAttribute('aria-label', `Episode ${e.number}: ${e.title}. Coming soon.`);
        b.onclick = () => toast(`Episode ${e.number} hasn’t been adapted yet.`);
      }
      li.appendChild(b);
      list.appendChild(li);
    }
  }
  $('#ep-search').addEventListener('input', renderList);

  function formatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso + 'T12:00:00');
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  /* =========================================================
     READER
     ========================================================= */
  async function openEpisode(n) {
    const meta = catalog.find((e) => e.number === n);
    if (!isReady(meta)) { toast(`Episode ${n} isn’t available yet.`); go('#/episodes'); return; }
    try {
      if (!episodeCache.has(n)) episodeCache.set(n, await getJSON(`episodes/${meta.file}`));
    } catch {
      toast('Couldn’t load that episode. Check your connection.');
      go('#/episodes');
      return;
    }
    ep = episodeCache.get(n);
    steps = [];
    ep.chapters.forEach((ch, ci) => ch.beats.forEach((beat, bi) => steps.push({ ci, bi, beat })));
    steps.push({ quiz: true, ci: ep.chapters.length });
    quiz = { answers: store.get('quiz:' + n, []) };
    idx = Math.min(store.get('progress:' + n, 0), steps.length - 1);
    store.set('last', n);

    $('#rd-num').textContent = '#' + pad(ep.number);
    $('#rd-title').textContent = ep.title;
    document.title = `#${pad(ep.number)} ${ep.title} · Security Now!`;
    buildDrawer();
    show('reader');
    renderStep({ jump: true });
  }

  function chapterTitle(ci) {
    return ci >= ep.chapters.length ? 'Test Yourself' : `Chapter ${ci + 1} · ${ep.chapters[ci].title}`;
  }

  // jump: show the step at once (chapter jump, opening, going back)
  // type: the reader moved forward, so type the newest line if enabled
  function renderStep({ jump = false, type = false } = {}) {
    stopTyping();
    const step = steps[idx];
    const thread = $('#rd-thread');
    thread.innerHTML = '';
    $('#rd-chapter').textContent = chapterTitle(step.ci);

    if (step.quiz) {
      renderQuiz(thread);
      setSpeaker(null);
    } else {
      // Show the chapter title, then every line of this chapter so far
      const ch = ep.chapters[step.ci];
      const div = el('div', 'divider');
      div.append(document.createTextNode(`Chapter ${step.ci + 1}`), el('b', '', ch.title));
      if (step.bi > 0 || jump) div.style.animation = 'none';
      thread.appendChild(div);

      for (let b = 0; b <= step.bi; b++) {
        const node = beatNode(ch.beats[b]);
        if (b < step.bi) { node.classList.add('is-past'); node.style.animation = 'none'; }
        thread.appendChild(node);
        if (b === step.bi && type && settings.typing) startTyping(node);
      }
      setSpeaker(step.beat.s || null);
      announce(step.beat);
    }

    requestAnimationFrame(() => {
      if (step.quiz) thread.scrollTop = 0;
      else thread.scrollTo({ top: thread.scrollHeight, behavior: jump ? 'auto' : 'smooth' });
    });

    // controls & progress
    const total = steps.length - 1;
    $('#rd-prev').disabled = idx === 0;
    $('#rd-next').disabled = idx >= total;
    $('#rd-next').classList.toggle('is-hint', idx === 0);
    $('#rd-count').textContent = step.quiz ? 'Quiz' : `${idx + 1} / ${total}`;
    const pct = Math.round((idx / total) * 100);
    $('#rd-progress').style.width = pct + '%';
    store.set('progress:' + ep.number, idx);
    store.set('pct:' + ep.number, Math.max(store.get('pct:' + ep.number, 0), pct));
    markDrawer(step.ci);
  }

  // Only http(s) links, and only local images under assets/potw/
  const safeUrl = (u) => (/^https?:\/\//i.test(u || '') ? u : null);
  const safeImage = (u) => (/^assets\/potw\/[\w.-]+\.(jpe?g|png|webp)$/i.test(u || '') ? u : null);

  function beatNode(beat) {
    if (beat.type === 'picture') return pictureNode(beat);
    if (beat.type === 'fact') {
      const f = el('div', 'fact');
      const label = el('div', 'fact__label');
      label.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z"/></svg>';
      label.appendChild(document.createTextNode('Key fact'));
      f.append(label, el('div', 'fact__title', beat.title), el('p', 'typed', beat.t));
      return f;
    }
    const b = el('div', `bubble bubble--${isHost(beat.s) ? beat.s : 'guest'}`);
    b.append(el('span', 'bubble__who', speakerName(beat.s)), el('span', 'typed', beat.t));
    return b;
  }

  // Screen readers get each new line in full at once, not character by character
  // Picture of the Week. If `image` is set (a local file we have the right
  // to publish), it is shown. Otherwise the card describes the picture and
  // links to the original in GRC's show notes.
  function pictureNode(beat) {
    const f = el('figure', 'potw');
    const label = el('div', 'fact__label');
    label.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 8"/></svg>';
    label.appendChild(document.createTextNode('Picture of the Week'));
    f.appendChild(label);
    const img = safeImage(beat.image);
    if (img) {
      const i = el('img', 'potw__img');
      i.src = img; i.alt = beat.alt || beat.t; i.loading = 'lazy';
      f.appendChild(i);
    }
    if (beat.caption) f.appendChild(el('div', 'potw__caption', `“${beat.caption}”`));
    f.appendChild(el('figcaption', 'typed', beat.t));
    const href = safeUrl(beat.source || (ep && ep.notes));
    if (href) {
      const a = el('a', 'potw__link', img ? 'Open the show notes ↗' : 'See the picture in the show notes ↗');
      a.href = href; a.target = '_blank'; a.rel = 'noopener';
      f.appendChild(a);
    }
    return f;
  }

  function announce(beat) {
    $('#rd-live').textContent =
      beat.type === 'fact' ? `Key fact. ${beat.title}. ${beat.t}`
      : beat.type === 'picture' ? `Picture of the Week: ${beat.caption || ''}. ${beat.t}`
      : `${speakerName(beat.s)}: ${beat.t}`;
  }

  /* ---------- typewriter ----------
     The whole line goes into the box at once: a visible "shown" part and
     an invisible "rest". Both stay in the layout, so the box is already its
     final size when typing starts and the words never move. Only the colour
     of each character changes as it's typed. */
  function typeInto(box, target, full, onDone) {
    const { every, chars } = SPEEDS[settings.speed];
    const shown = el('span', 'typed__shown');
    const rest = el('span', 'typed__rest', full);
    rest.setAttribute('aria-hidden', 'true');
    target.textContent = '';
    target.append(shown, rest);
    box.classList.add('is-typing');
    let i = 0;
    const done = () => {
      clearInterval(timer);
      target.textContent = full;           // back to plain text
      box.classList.remove('is-typing');
    };
    const timer = setInterval(() => {
      i = Math.min(full.length, i + chars);
      shown.textContent = full.slice(0, i);
      rest.textContent = full.slice(i);
      if (i >= full.length) { done(); onDone?.(); }
    }, every);
    return { finish: done };
  }

  let typer = null;
  function startTyping(node) {
    const target = node.querySelector('.typed');
    if (!target) return;
    typer = typeInto(node, target, target.textContent, () => { typer = null; });
  }
  // Stop typing and show the rest of the line at once
  function stopTyping() {
    if (!typer) return;
    typer.finish();
    typer = null;
  }

  function setSpeaker(who) {
    document.querySelectorAll('.host').forEach((h) => {
      const me = h.dataset.host;
      h.classList.toggle('is-speaking', who === me);
      h.classList.toggle('is-dim', !!who && who !== me);
    });
  }

  /* ---------- quiz ---------- */
  function renderQuiz(thread) {
    const qs = ep.quiz || [];
    const intro = el('div', 'divider');
    intro.append(document.createTextNode('End of episode'), el('b', '', 'Test yourself'));
    intro.style.animation = 'none';
    thread.appendChild(intro);

    let i = 0;
    for (; i < qs.length; i++) {
      const answered = quiz.answers[i] != null;
      thread.appendChild(questionCard(qs[i], i, qs.length, answered ? quiz.answers[i] : null));
      if (!answered) break;
    }
    if (i >= qs.length) thread.appendChild(finaleCard(qs));
  }

  // Option order for a quiz question, fixed for every visit. The correct
  // answer goes in a slot that moves with each question, so every quiz uses
  // all positions. The wrong answers are shuffled around it, seeded from the
  // question text. Returns original option indices, so answers saved in
  // localStorage keep working.
  function optionOrder(q, qi) {
    const n = q.options.length;
    let t = 0x811c9dc5;                                   // FNV-1a hash of the question
    for (const ch of q.q) t = Math.imul(t ^ ch.codePointAt(0), 16777619) >>> 0;
    const rand = () => {                                  // mulberry32
      t = (t + 0x6D2B79F5) >>> 0;
      let r = Math.imul(t ^ (t >>> 15), 1 | t);
      r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
    const others = [...Array(n).keys()].filter((k) => k !== q.answer);
    for (let k = others.length - 1; k > 0; k--) {         // Fisher–Yates
      const j = Math.floor(rand() * (k + 1));
      [others[k], others[j]] = [others[j], others[k]];
    }
    others.splice((qi + ep.number) % n, 0, q.answer);
    return others;
  }

  function questionCard(q, i, total, picked) {
    const c = el('div', 'card');
    c.appendChild(el('div', 'card__kicker', `Question ${i + 1} of ${total}`));
    c.appendChild(el('h3', '', q.q));
    const opts = el('div', 'opts');
    optionOrder(q, i).forEach((oi) => {
      const o = q.options[oi];
      const b = el('button', 'opt', o);
      if (picked != null) {
        b.disabled = true;
        if (oi === q.answer) b.classList.add('is-right');
        else if (oi === picked) b.classList.add('is-wrong');
      } else {
        b.onclick = () => {
          quiz.answers[i] = oi;
          store.set('quiz:' + ep.number, quiz.answers);
          const thread = $('#rd-thread');
          const top = thread.scrollTop;
          renderStep();
          // keep the reader looking at the answer + next question
          requestAnimationFrame(() => {
            thread.scrollTop = top;
            const cards = thread.querySelectorAll('.card');
            cards[cards.length - 1]?.scrollIntoView({ behavior: 'smooth', block: 'end' });
          });
        };
      }
      opts.appendChild(b);
    });
    c.appendChild(opts);
    if (picked != null) {
      const right = picked === q.answer;
      c.appendChild(el('p', 'explain', (right ? '✓ Correct. ' : '✗ Not quite. ') + q.explain));
      c.style.animation = 'none';
    }
    return c;
  }

  function finaleCard(qs) {
    const right = qs.reduce((n, q, i) => n + (quiz.answers[i] === q.answer ? 1 : 0), 0);
    const c = el('div', 'card');
    c.appendChild(el('div', 'card__kicker', `Episode ${ep.number} complete`));
    c.appendChild(el('div', 'score', `${right} / ${qs.length}`));
    c.appendChild(el('p', '', right === qs.length
      ? 'Perfect score. Steve would be proud.'
      : 'Nice work! Replay the episode to catch what you missed.'));

    const row = el('div', 'card__row');
    const next = catalog.find((e) => e.number > ep.number && isReady(e));
    if (next) {
      const b = el('button', 'btn btn--primary', `Next: Episode ${next.number}`);
      b.onclick = () => go(`#/episode/${next.number}`);
      row.appendChild(b);
    }
    const all = el('button', 'btn btn--ghost', 'All episodes');
    all.onclick = () => go('#/episodes');
    const again = el('button', 'btn btn--ghost', 'Replay');
    again.onclick = () => {
      quiz.answers = []; store.set('quiz:' + ep.number, []);
      idx = 0; renderStep({ jump: true });
    };
    row.append(all, again);
    c.appendChild(row);

    if (ep.transcript) {
      const p = el('p', 'explain');
      const a = el('a', '', 'Read the original transcript ↗');
      a.href = ep.transcript; a.target = '_blank'; a.rel = 'noopener';
      p.appendChild(a);
      c.appendChild(p);
    }
    store.set('pct:' + ep.number, 100);
    return c;
  }

  /* ---------- navigation ---------- */
  // While a line is being typed, "next" finishes it first; the next press moves on
  function next() {
    if (typer) { stopTyping(); return; }
    if (idx < steps.length - 1) { idx++; renderStep({ type: true }); }
  }
  function prev() { if (idx > 0) { idx--; renderStep({ jump: true }); } else stopTyping(); }
  $('#rd-next').addEventListener('click', (e) => { e.stopPropagation(); next(); });
  $('#rd-prev').addEventListener('click', (e) => { e.stopPropagation(); prev(); });

  // Tapping the left end of the stage goes back; the right end (or anywhere
  // in between) goes forward, just like the arrow buttons.
  const stage = $('#stage');
  function edgeZone(x) {
    const r = stage.getBoundingClientRect();
    const w = Math.max(64, r.width * 0.18);
    if (x - r.left < w) return 'prev';
    if (r.right - x < w) return 'next';
    return null;
  }
  function flashEdge(zone) {
    const n = $(`.edge--${zone}`);
    n.classList.remove('is-flash');
    void n.offsetWidth; // restart the animation
    n.classList.add('is-flash');
  }
  stage.addEventListener('click', (e) => {
    if (e.target.closest('button, a, .card')) return;
    if (window.getSelection()?.toString()) return;
    const zone = edgeZone(e.clientX);
    if (zone) flashEdge(zone);
    zone === 'prev' ? prev() : next();
  });
  // Mouse users see which end they're over
  stage.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    stage.dataset.hover = e.target.closest('button, a, .card') ? '' : (edgeZone(e.clientX) || '');
  });
  stage.addEventListener('pointerleave', () => { stage.dataset.hover = ''; });

  // Swipe left/right
  let sx = 0, sy = 0, st = 0;
  stage.addEventListener('pointerdown', (e) => { sx = e.clientX; sy = e.clientY; st = Date.now(); });
  stage.addEventListener('pointerup', (e) => {
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (Date.now() - st < 600 && Math.abs(dx) > 60 && Math.abs(dy) < 50) {
      e.preventDefault();
      suppressClick = true;
      dx < 0 ? next() : prev();
    }
  });
  let suppressClick = false;
  stage.addEventListener('click', (e) => { if (suppressClick) { suppressClick = false; e.stopImmediatePropagation(); } }, true);

  document.addEventListener('keydown', (e) => {
    if (!$('#drawer').hidden) { if (e.key === 'Escape') closeDrawer(); return; }
    if (!$('#settings').hidden) { if (e.key === 'Escape') closeSettings(); return; }
    if (screens.reader.hidden || e.target.matches('input, textarea')) return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown' || (e.key === ' ' && !e.target.closest('button'))) { e.preventDefault(); next(); }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); prev(); }
    else if (e.key === 'c') openDrawer();
  });

  /* =========================================================
     CHAPTER DRAWER
     ========================================================= */
  function buildDrawer() {
    $('#drawer-desc').textContent = ep.description || '';
    const a = $('#drawer-transcript');
    a.href = ep.transcript || '#';
    a.hidden = !ep.transcript;
    const n = $('#drawer-notes');
    n.href = safeUrl(ep.notes) || '#';
    n.hidden = !safeUrl(ep.notes);
    // Useful links listed in the show notes
    const links = (ep.links || []).filter((l) => safeUrl(l.url));
    $('#drawer-links-wrap').hidden = !links.length;
    const ul = $('#drawer-links');
    ul.innerHTML = '';
    links.forEach((l) => {
      const li = el('li');
      const la = el('a', '', l.label + ' ↗');
      la.href = l.url; la.target = '_blank'; la.rel = 'noopener';
      li.appendChild(la);
      if (l.note) li.appendChild(el('span', 'drawer__note', l.note));
      ul.appendChild(li);
    });
    const list = $('#drawer-list');
    list.innerHTML = '';
    const titles = [...ep.chapters.map((c) => c.title), 'Test Yourself'];
    titles.forEach((t, ci) => {
      const li = el('li');
      const b = el('button', 'chapter');
      b.dataset.ci = ci;
      b.append(el('span', 'chapter__n', ci < ep.chapters.length ? String(ci + 1) : '?'), el('span', '', t));
      b.onclick = () => {
        idx = steps.findIndex((s) => s.ci === ci);
        closeDrawer();
        renderStep({ jump: true });
      };
      li.appendChild(b);
      list.appendChild(li);
    });
  }
  function markDrawer(ci) {
    document.querySelectorAll('#drawer-list .chapter').forEach((b) => {
      const n = +b.dataset.ci;
      b.classList.toggle('is-current', n === ci);
      b.classList.toggle('is-done', n < ci);
    });
  }
  let lastFocus = null;
  function openDrawer() {
    lastFocus = document.activeElement;
    $('#drawer').hidden = false;
    $('#drawer .chapter.is-current')?.focus();
  }
  function closeDrawer() {
    if ($('#drawer').hidden) return;
    $('#drawer').hidden = true;
    lastFocus?.focus?.();
  }
  $('#rd-chapters-btn').addEventListener('click', openDrawer);
  $('#drawer').addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeDrawer(); });

  /* =========================================================
     SETTINGS PANEL
     ========================================================= */
  let preview = null;
  function syncSettingsUI() {
    document.querySelectorAll('#set-size button').forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.v === settings.size)));
    document.querySelectorAll('#set-speed button').forEach((b) => {
      b.setAttribute('aria-pressed', String(b.dataset.v === settings.speed));
      b.disabled = !settings.typing;
    });
    $('#set-typing').checked = settings.typing;
  }
  // Show the current speed in the preview bubble
  function runPreview() {
    preview?.finish();
    preview = null;
    const t = $('#set-preview');
    const full = t.dataset.full || (t.dataset.full = t.textContent);
    if (!settings.typing) { t.textContent = full; return; }
    preview = typeInto(t.closest('.bubble'), t, full, () => { preview = null; });
  }
  function saveSettings() {
    store.set('settings', settings);
    applySettings();
    syncSettingsUI();
    // Text reflows when the size changes; keep the newest line in view
    const thread = $('#rd-thread');
    if (thread && !screens.reader.hidden) requestAnimationFrame(() => { thread.scrollTop = thread.scrollHeight; });
  }
  $('#set-size').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    settings.size = +b.dataset.v; saveSettings();
  });
  $('#set-speed').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b || b.disabled) return;
    settings.speed = b.dataset.v; saveSettings(); runPreview();
  });
  $('#set-typing').addEventListener('change', (e) => {
    settings.typing = e.target.checked;
    if (!settings.typing) stopTyping();
    saveSettings(); runPreview();
  });
  let settingsFocus = null;
  function openSettings() {
    settingsFocus = document.activeElement;
    stopTyping();
    syncSettingsUI();
    $('#settings').hidden = false;
    $('#set-size button[aria-pressed="true"]')?.focus();
    runPreview();
  }
  function closeSettings() {
    if ($('#settings').hidden) return;
    preview?.finish();
    preview = null;
    $('#settings').hidden = true;
    settingsFocus?.focus?.();
  }
  $('#rd-settings-btn').addEventListener('click', openSettings);
  $('#settings').addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeSettings(); });

  /* =========================================================
     BOOT
     ========================================================= */
  (async function boot() {
    try {
      const data = await getJSON('episodes/index.json');
      catalog = (data.episodes || []).slice().sort((a, b) => a.number - b.number);
    } catch {
      catalog = [];
      toast('Couldn’t load the episode list. Check your connection.');
    }
    $('#boot').remove();
    $('#app').hidden = false;
    await route();
  })();
})();
