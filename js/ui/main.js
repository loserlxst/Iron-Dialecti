/* IRON DIALECTIC — boot, main loop, map input (left-click, drag, scroll, pinch, keys). */
(function () {
  'use strict';
  const ID = (globalThis.ID = globalThis.ID || {});
  const UI = ID.UI, R = ID.Render, esc = ID.esc;
  ID.SPEEDS = [0, 3, 6, 12, 24, 48];
  const Main = (ID.Main = { mode: 'title', bg: null, fps: 60, frameMs: 0, tickMs: 0 });
  let last = 0, acc = 0, cv = null;

  /* ---------------------------------------------------------------- simulation pacing */
  function advance(G, dps, dt) {
    acc += dt * dps;
    const cap = Math.max(2, dps * 0.2);
    if (acc > cap) acc = cap;
    const t0 = performance.now();
    while (acc >= 1) {
      ID.Game.tick(G); acc -= 1;
      if (G.over || (G.evq.length && G === UI.G)) { acc = 0; break; }
      if (performance.now() - t0 > 12) { acc = Math.min(acc, 1); break; }
    }
    Main.tickMs = performance.now() - t0;
  }
  function running(G) { return G && !G.paused && !G.over && !G.evq.length && !UI.modalKind; }

  /* ---------------------------------------------------------------- loop */
  function loop(now) {
    const dt = Math.min(0.1, Math.max(0, (now - last) / 1000)); last = now;
    const f0 = performance.now();
    try {
      if (Main.mode === 'title' && Main.bg) {
        const B = Main.bg;
        if (B.over || ID.yearOf(B.tick) >= ID.END_YEAR - 1) { ID.Screens.title(); }
        else { advance(B, 22, dt); B.sfx.length = 0; }
      } else if (Main.mode === 'game' && UI.G) {
        const G = UI.G;
        if (running(G)) advance(G, ID.SPEEDS[G.speed] || 6, dt); else acc = 0;
        if (G.sfx.length) { for (const s of G.sfx) ID.Audio.play(s); G.sfx.length = 0; }
        keyPan(dt);
      } else if (Main.mode === 'setup' || Main.mode === 'maker') keyPan(dt);
      R.frame(dt);
      if (Main.mode === 'game') UI.frame(dt);
      if (ID.Music) {
        let mood = 'title';
        if (Main.mode === 'game' && UI.G) { const n = UI.P(); mood = n && n.nwars ? 'war' : n && (n.stab < 30 || n.famine || (n.civil && UI.G.nations[n.civil].alive)) ? 'crisis' : 'peace'; }
        ID.Music.update(mood);
      }
      hoverTip(now);
    } catch (e) { console.error(e); }
    Main.frameMs = Main.frameMs * 0.95 + (performance.now() - f0) * 0.05;
    if (dt > 0) Main.fps = Main.fps * 0.95 + (1 / dt) * 0.05;
    requestAnimationFrame(loop);
  }
  function keyPan(dt) {
    const k = UI.keys, v = 620 * dt;
    if (document.activeElement && (document.activeElement.tagName === 'INPUT' && document.activeElement.type === 'text')) return;
    let dx = 0, dy = 0;
    if (k.arrowleft || k.a) dx += v; if (k.arrowright || k.d) dx -= v; if (k.arrowup || k.w) dy += v; if (k.arrowdown || k.s) dy -= v;
    if (dx || dy) R.pan(dx, dy);
  }

  /* ---------------------------------------------------------------- map pointer input */
  const pts = new Map(); let down = null, moved = false, pinch = 0, pinchC = null, lastClick = { t: 0, o: -1 };
  let hover = null, hoverShown = false, holdT = 0, held = false, drag = false; // drag: the map maker took this drag (paint, move a handle)
  function clickTile(i, e) {
    if (Main.mode === 'setup') { ID.Screens.pickAt(i); return; }
    if (Main.mode === 'maker') { ID.Maker.tap(e.clientX, e.clientY); return; }
    if (Main.mode !== 'game' || !UI.G) return;
    const G = UI.G, o = i >= 0 ? G.owner[i] : 0, now = performance.now();
    UI.clickTile(i);
    if (i >= 0 && o === lastClick.o && now - lastClick.t < 380 && o !== G.player && (o ? ID.atWar(G, G.player, o) : G.terrain[i] !== ID.T.SEA)) UI.acts.attack();
    lastClick = { t: now, o };
  }
  function onDown(e) {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    ID.Audio.unlock();
    cv.setPointerCapture(e.pointerId);
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.size === 1) { down = { x: e.clientX, y: e.clientY }; moved = false; held = false; drag = Main.mode === 'maker' && ID.Maker.down(e.clientX, e.clientY); }
    else if (drag) { ID.Maker.up(); drag = false; } // a second finger: pinch and pan instead
    clearTimeout(holdT); holdT = 0;
    /* A finger held still on the map shows what the mouse would show on hover. */
    if (pts.size === 1 && e.pointerType !== 'mouse') holdT = setTimeout(() => { holdT = 0; if (pts.size !== 1 || moved || !down) return; const h = tileTip(R.tileAt(down.x, down.y)); if (h) { UI.tipAt(down.x, down.y, h, true); hoverShown = true; held = true; } }, 480);
    if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = Math.hypot(a.x - b.x, a.y - b.y); pinchC = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; moved = true; }
    hideMapTip();
  }
  function onMove(e) {
    if (!pts.has(e.pointerId)) { hover = { x: e.clientX, y: e.clientY, t: performance.now() }; if (hoverShown) hideMapTip(); if (Main.mode === 'maker') ID.Maker.hover(e.clientX, e.clientY); return; }
    const p = pts.get(e.pointerId), dx = e.clientX - p.x, dy = e.clientY - p.y;
    p.x = e.clientX; p.y = e.clientY;
    if (pts.size === 1) {
      if (!moved && Math.hypot(e.clientX - down.x, e.clientY - down.y) > (e.pointerType === 'mouse' ? 5 : 10)) { moved = true; cv.classList.add('drag'); clearTimeout(holdT); holdT = 0; if (held) hideMapTip(); }
      if (moved) { if (drag) ID.Maker.move(e.clientX, e.clientY); else R.pan(dx, dy); }
    } else if (pts.size === 2) {
      const [a, b] = [...pts.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y), c = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      if (pinch > 0) R.zoomAt(c.x, c.y, d / pinch);
      R.pan(c.x - pinchC.x, c.y - pinchC.y); pinch = d; pinchC = c;
    }
  }
  function onUp(e) {
    if (!pts.has(e.pointerId)) return;
    const single = pts.size === 1; pts.delete(e.pointerId);
    clearTimeout(holdT); holdT = 0;
    if (pts.size < 2) pinch = 0;
    if (drag && single) { drag = false; if (moved) { ID.Maker.up(); if (!pts.size) { cv.classList.remove('drag'); moved = false; } return; } ID.Maker.up(true); }
    if (single && !moved && !held && e.type !== 'pointercancel' && Main.mode !== 'title') clickTile(R.tileAt(e.clientX, e.clientY), e);
    if (!pts.size) { cv.classList.remove('drag'); moved = false; }
  }
  function onWheel(e) {
    e.preventDefault(); hideMapTip();
    const mode = UI.settings.scroll || 'auto';
    const mouseLike = e.deltaMode !== 0 || (e.deltaX === 0 && Math.abs(e.deltaY) >= 50 && Number.isInteger(e.deltaY));
    const zoom = e.ctrlKey || mode === 'zoom' || (mode === 'auto' && mouseLike);
    if (zoom) {
      let d = e.deltaY * (e.deltaMode === 1 ? 33 : e.deltaMode === 2 ? 400 : 1);
      if (!e.ctrlKey && mouseLike) d = Math.sign(d) * Math.min(Math.abs(d), 120);
      R.zoomAt(e.clientX, e.clientY, Math.exp(-d * (e.ctrlKey ? 0.012 : 0.0022)));
    } else R.pan(-e.deltaX, -e.deltaY);
  }

  /* ---------------------------------------------------------------- map hover tooltip */
  function hideMapTip() { if (hoverShown) { UI.hideTip(); hoverShown = false; } }
  function hoverTip(now) {
    if (!hover || hoverShown || pts.size || UI.modalKind || now - hover.t < 420) return;
    const el = document.elementFromPoint(hover.x, hover.y); if (el !== cv) return;
    const h = tileTip(R.tileAt(hover.x, hover.y)); if (!h) return;
    UI.tipAt(hover.x, hover.y, h); hoverShown = true;
  }
  /* What a tile is, whose it is, and what a click on it would do. '' for the sea or outside a game. */
  function tileTip(i) {
    const G = Main.mode === 'game' ? UI.G : null; if (!G || i < 0 || UI.modalKind) return '';
    const t = ID.TERRAIN[G.terrain[i]]; if (G.terrain[i] === ID.T.SEA) return '';
    const o = G.owner[i], n = o ? G.nations[o] : null, Pr = G.provinces[G.prov[i]], me = UI.P();
    let h = '<h5>' + (n ? esc(n.name) : 'The hinterland') + '</h5>' + (n ? '' : 'Unclaimed land. Any state may take it without a war.<br>');
    if (n) h += esc(ID.IDEOLOGIES[n.ideo].name) + (n === me ? '' : ' · opinion of you <b>' + Math.round(ID.op(G, n.id, me.id)) + '</b>' + (ID.atWar(G, me.id, n.id) ? ' · <b class="bad">at war</b>' : '')) + '<br>';
    h += '<span class="dim">' + t.name + (G.river[i] ? ', river' : '') + (G.fortCov[i] && G.fortCov[i] === o ? ', fortified' : '') + (G.bld[i] ? ' · ' + ID.BUILDINGS[G.bld[i]].name : '') + '</span>';
    if (n === me || R.mode === 'stability' || R.mode === 'opposition') {
      if (n === me || !UI.fuzzy(me)) {
        h += '<hr>Unrest <b>' + Math.round(Pr.unrest) + '</b>' + (Pr.opp ? ' · ' + esc(ID.IDEOLOGIES[Pr.opp].name) + ' movement <b>' + Math.round(Pr.oppStr) + '</b>' : '');
        if (Pr.core && Pr.core !== o && n) h += '<br><span class="warn">Occupied: ' + Math.round(Pr.integ) + '% integrated</span>';
      }
    }
    if (G.cut[i] === 1) h += '<br><b class="bad">Cut off from supply</b>';
    else if (G.cut[i] === 2) h += '<br><span class="warn">Supplied by sea' + (ID.Combat.isBeach(G, i) ? ': this is the beachhead' : '') + '</span>';
    if (n === me && !G.bld[i]) h += '<br><span class="dim">' + UI.tap('Click to build here.') + '</span>';
    else if (n && n !== me && ID.atWar(G, me.id, n.id)) h += '<br><span class="dim">' + UI.tap('Click to select; double-click to attack.') + '</span>';
    else if (!n) h += '<br><span class="dim">' + UI.tap('Double-click to expand into it.') + '</span>';
    return h;
  }

  /* ---------------------------------------------------------------- boot */
  function boot() {
    cv = document.getElementById('map');
    R.init(cv); UI.init();
    cv.addEventListener('pointerdown', onDown);
    cv.addEventListener('pointermove', onMove);
    cv.addEventListener('pointerup', onUp);
    cv.addEventListener('pointercancel', onUp);
    cv.addEventListener('pointerleave', (e) => { if (e.pointerType !== 'mouse') return; hover = null; hideMapTip(); if (Main.mode === 'maker') ID.Maker.hover(-1e5, -1e5); }); // a lifted finger also 'leaves': keep a held tooltip up
    cv.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('resize', () => R.resize());
    const keep = () => { if (Main.mode === 'game' && UI.G && !UI.G.over) ID.Screens.autosave(UI.G); };
    window.addEventListener('beforeunload', keep);
    window.addEventListener('pagehide', keep); // phones close background tabs without beforeunload
    window.addEventListener('orientationchange', () => setTimeout(() => R.resize(), 250));
    document.addEventListener('visibilitychange', () => { if (document.hidden && Main.mode === 'game' && UI.G) { if (!UI.G.paused) UI.setPaused(true); if (UI.touch) keep(); } });
    ID.Screens.title();
    last = performance.now();
    requestAnimationFrame(loop);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
