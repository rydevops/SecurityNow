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

  /* ---------- storage (best-effort; app works without it) ---------- */
  const store = {
    get(k, d = null) { try { const v = localStorage.getItem('sn:' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem('sn:' + k, JSON.stringify(v)); } catch { /* ignore */ } },
  };

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
    closeDrawer();
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
    const resume = last && catalog.find((e) => e.number === last);
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
      const count = catalog.filter((e) => rangeOf(e.number) === r).length;
      const b = el('button', 'range', `${pad(lo)}–${pad(hi)}`);
      b.setAttribute('aria-pressed', String(r === activeRange));
      b.title = `${count} episode${count === 1 ? '' : 's'} available`;
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
      const b = el('button', 'ep');
      const num = el('div', 'ep__num'); num.appendChild(el('span', '', pad(e.number)));
      const body = el('div', 'ep__body');
      body.appendChild(el('div', 'ep__title', e.title));
      if (e.subtitle) body.appendChild(el('div', 'ep__sub', e.subtitle));
      const meta = el('div', 'ep__meta');
      meta.appendChild(el('span', '', formatDate(e.date)));
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
      b.setAttribute('aria-label', `Episode ${e.number}: ${e.title}`);
      b.onclick = () => go(`#/episode/${e.number}`);
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
    if (!meta) { toast(`Episode ${n} isn’t available yet.`); go('#/episodes'); return; }
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
    renderStep(true);
  }

  function chapterTitle(ci) {
    return ci >= ep.chapters.length ? 'Test Yourself' : `Chapter ${ci + 1} · ${ep.chapters[ci].title}`;
  }

  function renderStep(jump = false) {
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
      }
      setSpeaker(step.beat.s || null);
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

  function beatNode(beat) {
    if (beat.type === 'fact') {
      const f = el('div', 'fact');
      const label = el('div', 'fact__label');
      label.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z"/></svg>';
      label.appendChild(document.createTextNode('Key fact'));
      f.append(label, el('div', 'fact__title', beat.title), el('p', '', beat.t));
      return f;
    }
    const b = el('div', `bubble bubble--${beat.s}`);
    b.append(el('span', 'bubble__who', HOST_NAMES[beat.s] || beat.s), document.createTextNode(beat.t));
    return b;
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

  function questionCard(q, i, total, picked) {
    const c = el('div', 'card');
    c.appendChild(el('div', 'card__kicker', `Question ${i + 1} of ${total}`));
    c.appendChild(el('h3', '', q.q));
    const opts = el('div', 'opts');
    q.options.forEach((o, oi) => {
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
    const next = catalog.find((e) => e.number > ep.number);
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
      idx = 0; renderStep(true);
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
  function next() { if (idx < steps.length - 1) { idx++; renderStep(); } }
  function prev() { if (idx > 0) { idx--; renderStep(); } }
  $('#rd-next').addEventListener('click', (e) => { e.stopPropagation(); next(); });
  $('#rd-prev').addEventListener('click', (e) => { e.stopPropagation(); prev(); });

  // Tap anywhere on the story (except on buttons/cards) to advance
  $('#stage').addEventListener('click', (e) => {
    if (e.target.closest('button, a, .card')) return;
    if (window.getSelection()?.toString()) return;
    next();
  });

  // Swipe left/right
  let sx = 0, sy = 0, st = 0;
  $('#stage').addEventListener('pointerdown', (e) => { sx = e.clientX; sy = e.clientY; st = Date.now(); });
  $('#stage').addEventListener('pointerup', (e) => {
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (Date.now() - st < 600 && Math.abs(dx) > 60 && Math.abs(dy) < 50) {
      e.preventDefault();
      suppressClick = true;
      dx < 0 ? next() : prev();
    }
  });
  let suppressClick = false;
  $('#stage').addEventListener('click', (e) => { if (suppressClick) { suppressClick = false; e.stopImmediatePropagation(); } }, true);

  document.addEventListener('keydown', (e) => {
    if (!$('#drawer').hidden) { if (e.key === 'Escape') closeDrawer(); return; }
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
        renderStep(true);
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
