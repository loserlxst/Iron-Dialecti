/* IRON DIALECTIC — the map maker: edit the land (continents and islands, sea level, noise, painted terrain and rivers)
   and the states (capitals, weights, systems, situations, customizations) of a map definition (js/sim/maps.js), with a
   live preview of who owns what, checks before play, saved maps, and map codes and files. Left click, drag, scroll and
   pinch only: a drag on a handle moves it, a drag with the terrain brush paints, any other drag pans. */
(function () {
  'use strict';
  const ID = (globalThis.ID = globalThis.ID || {});
  const UI = ID.UI, R = ID.Render, M = ID.Maps, esc = ID.esc, T = ID.T;
  const acts = UI.acts, btn = UI.btn, tip = UI.tip, $ = UI.$;
  const MK = (ID.Maker = {});
  const store = { get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } } };
  const hex = (c) => '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');

  let def = null, PG = null, base = null, pT = null, pR = null, checks = [], err = '';
  let tool = 'land', sel = -1, selN = -1, armed = false, brush = { t: T.PLAINS, r: 2, river: 0 }, grab = null, timer = 0, slot = -1, min = false;

  /* ---------------------------------------------------------------- the working definition */
  const sz = () => ID.MAP_SIZES[def.size];
  /* The generated land without paint, the base painted terrain is a diff against (rebuilt when the layout changes). */
  function relayout() {
    const opts = Object.assign(ID.mapOpts(def, def.seed, def.size), { paint: null, rivers: null });
    const m = ID.genMap(opts); base = { terrain: m.terrain, river: m.river };
    const N = m.N; const oT = pT, oR = pR; pT = new Int8Array(N).fill(-1); pR = new Int8Array(N).fill(-1);
    if (oT && oT.length === N) { pT.set(oT); pR.set(oR); }
  }
  function loadPaint() {
    const N = sz().W * sz().H; pT = new Int8Array(N).fill(-1); pR = new Int8Array(N).fill(-1);
    for (const [s, l, v] of def.paint || []) pT.fill(v, s, s + l);
    for (const [s, l, v] of def.rivers || []) pR.fill(v, s, s + l);
  }
  /* Painted tiles back into run-length diffs against the generated land. */
  function savePaint() {
    const N = pT.length, tN = new Uint8Array(N), rN = new Uint8Array(N);
    for (let i = 0; i < N; i++) { tN[i] = pT[i] >= 0 ? pT[i] : base.terrain[i]; rN[i] = tN[i] === T.SEA ? 0 : pR[i] >= 0 ? pR[i] : base.river[i]; }
    def.paint = M.diff(base.terrain, tN);
    const bR = base.river.slice(); for (let i = 0; i < N; i++) if (tN[i] === T.SEA) bR[i] = 0;
    def.rivers = M.diff(bR, rN);
  }
  function rebuild(layout) {
    clearTimeout(timer); timer = 0;
    if (layout || !base) relayout();
    savePaint();
    const cam = Object.assign({}, R.cam), had = !!PG;
    try { PG = M.build(def, { headless: false }); err = ''; checks = M.check(def, PG); }
    catch (e) { err = e.message || String(e); checks = [{ lvl: 'err', text: err }]; if (!PG) return; }
    PG.paused = true;
    R.setMode('political'); R.setGame(PG); R.quiet = true; R.selected = -1;
    panel();
    if (had) { Object.assign(R.cam, cam); R.pan(0, 0); }
  }
  const soon = (layout) => { clearTimeout(timer); timer = setTimeout(() => rebuild(layout), 40); };

  /* ---------------------------------------------------------------- entering */
  MK.open = function (d, s) {
    def = JSON.parse(JSON.stringify(d)); slot = s == null ? -1 : s; PG = null; base = null; sel = -1; selN = -1; armed = false; tool = 'land'; min = false;
    ID.Main.mode = 'maker'; ID.Main.bg = null; UI.G = null; UI.closeModal(); $('#hud').hidden = true; $('#coach').hidden = true;
    loadPaint(); relayout();
    const t = $('#title'); t.className = 'screen setup maker'; t.hidden = false;
    R.overlay = overlay;
    rebuild();
  };
  MK.close = function () { R.overlay = null; def = null; PG = null; const cvs = $('#map'); cvs.style.height = ''; delete cvs.dataset.mk; R.resize(); };
  MK.def = () => def;
  MK.relayout = () => panel();

  /* ---------------------------------------------------------------- the panel */
  const field = (label, inner, note) => '<div class="field"><label>' + label + '</label>' + inner + (note ? '<small>' + note + '</small>' : '') + '</div>';
  const seg = (cur, list, act) => '<div class="seg wrap">' + list.map((x) => '<button class="' + (cur === x[0] ? 'on' : '') + '" data-act="' + act + '" data-a=\'' + esc(JSON.stringify(x[0])) + '\'' + (x[2] ? tip(x[2]) : '') + '>' + x[1] + '</button>').join('') + '</div>';
  const slider = (act, v, lo, hi, step, label) => '<div class="sl" style="grid-template-columns:96px 1fr 52px"><span>' + label + '</span><input type="range" min="' + lo + '" max="' + hi + '" step="' + step + '" value="' + v + '" data-change="' + act + '"><b>' + v + '</b></div>';
  function panel() {
    if (!def) return;
    const t = $('#title'), old = t.querySelector('.pick .db'), top = old ? old.scrollTop : 0;
    const errs = checks.filter((c) => c.lvl === 'err').length;
    let h = '<div class="pick maker' + (min ? ' min' : '') + '"><div class="dh"><h2>Map maker</h2>' + (UI.compact ? '<button class="x" data-act="mkMin"' + tip(min ? 'Show the tools' : 'Show more of the map') + '>' + (min ? '▴' : '▾') + '</button>' : '') + '<button class="x" data-act="mkQuit"' + tip('Back to the title screen') + '>✕</button></div>';
    h += '<div class="mktools">' + seg(tool, [['land', 'Land', 'Continents, islands, sea level and size'], ['paint', 'Terrain', 'Paint terrain and rivers tile by tile'], ['nations', 'States', 'Place capitals and edit the states'], ['look', 'Look', 'Only move the map']], 'mkTool') + '</div><div class="db">';
    h += field('Name', '<input type="text" maxlength="' + M.LIM.name + '" value="' + esc(def.name) + '" data-change="mkName" style="width:100%">');
    if (tool === 'land') h += landPanel();
    else if (tool === 'paint') h += paintPanel();
    else if (tool === 'nations') h += nationPanel();
    else h += '<p class="lead">Drag to move the map, scroll or pinch to zoom. Nothing changes.</p>';
    h += field('Checks', checks.length ? '<ul class="checks">' + checks.map((c) => '<li class="' + (c.lvl === 'err' ? 'bad' : 'warn') + '">' + esc(c.text) + '</li>').join('') + '</ul>' : '<small class="good">Ready to play.</small>');
    h += field('Maps', '<div class="row">' + btn('Presets and saved maps', 'mkPresets', null, { cls: 'sm' }) + btn(slot >= 0 ? 'Save' : 'Save as a new map', 'mkSave', null, { cls: 'sm', tip: 'Kept in this browser. Codes and files share it with others.' }) + '</div><div class="row" style="margin-top:6px">' + btn('Copy code', 'mkCode', null, { cls: 'sm' }) + btn('Load code', 'loadCode', null, { cls: 'sm ghost' }) + btn('Export file', 'mkExport', null, { cls: 'sm ghost' }) + '<label class="b sm ghost">Import file<input type="file" accept=".idmap,application/json" data-change="mkImport" hidden></label></div>');
    h += '</div><div class="ft">' + btn('Play this map', 'mkPlay', null, { cls: 'big red', off: errs ? 'Fix the problems listed under Checks first.' : '' }) + '<span class="sp"></span>' + btn('Back', 'mkQuit', null, { cls: 'ghost' }) + '</div></div>';
    t.innerHTML = h;
    const db = t.querySelector('.pick .db'); if (db) db.scrollTop = top;
    fitCanvas();
  }
  /* On a phone held upright the panel is a sheet along the bottom: the map is drawn only in the space above it. */
  function fitCanvas() {
    const pk = $('#title .pick.maker'), cvs = $('#map'), sheet = UI.compact && pk && pk.getBoundingClientRect().top > 40;
    const h = sheet ? Math.max(120, Math.round(pk.getBoundingClientRect().top)) + 'px' : '';
    if (cvs.style.height !== h) { cvs.style.height = h; const first = !cvs.dataset.mk; cvs.dataset.mk = 1; R.resize(); if (PG && first) R.fit(); }
  }
  function landPanel() {
    let h = field('Map size', seg(def.size, Object.keys(ID.MAP_SIZES).map((k) => [k, ID.MAP_SIZES[k].name + ' <small>' + ID.MAP_SIZES[k].W + '×' + ID.MAP_SIZES[k].H + '</small>']), 'mkSize'), 'A new size keeps the shapes and the states but clears painted terrain.');
    h += field('Sea level', slider('mkLand', Math.round(def.land * 100), 18, 65, 1, 'Land %'), 'How much of the map is land.');
    h += field('Noise', '<div class="row nw"><input type="text" value="' + def.seed + '" data-change="mkSeed" style="width:120px"' + tip('The seed of the coastlines and the terrain. Type a number and press Enter.') + '>' + btn('New coastlines', 'mkReseed', null, { cls: 'sm ghost' }) + '</div>');
    h += field('Continents and islands <span class="dim" style="font-weight:500">(' + def.blobs.length + ')</span>', '<div class="row">' + btn('Add a continent', 'mkAddBlob', 0.16, { cls: 'sm' }) + btn('Add an island', 'mkAddBlob', 0.045, { cls: 'sm' }) + '</div>' +
      (sel >= 0 && def.blobs[sel] ? '<div class="note" style="margin-top:8px"><b>Selected shape</b>' + slider('mkBlobR', Math.round(def.blobs[sel][2] * 1000), 10, 350, 1, 'Size') + btn('Delete it', 'mkDelBlob', null, { cls: 'sm ghost' }) + '</div>' : ''),
      UI.tap('Drag a round handle to move a shape. Click one to select it and change its size.'));
    return h;
  }
  function paintPanel() {
    const TT = ID.TERRAIN;
    let h = field('Brush', '<div class="tswatch">' + [0, 1, 2, 3, 4, 5, 6].map((k) => '<button class="' + (!brush.river && brush.t === k ? 'on' : '') + '" data-act="mkBrush" data-a="' + k + '"><i style="background:' + (k === 0 ? '#abbcb8' : hex(TT[k].col)) + '"></i>' + TT[k].name + '</button>').join('') +
      '<button class="' + (brush.river === 1 ? 'on' : '') + '" data-act="mkRiver" data-a="1"><i style="background:#4a7a9a"></i>River</button><button class="' + (brush.river === -1 ? 'on' : '') + '" data-act="mkRiver" data-a="-1"><i style="background:#e9dfc8;border-style:dashed"></i>No river</button></div>');
    h += field('Brush size', seg(brush.r, [[0, '1'], [1, '3'], [2, '5'], [4, '9'], [7, '15']], 'mkBrushR'));
    let n = 0; for (let i = 0; i < pT.length; i++) if (pT[i] >= 0 || pR[i] >= 0) n++;
    h += field('Painted', '<div class="row"><span>' + n + ' tiles</span>' + btn('Clear all painting', 'mkClearPaint', null, { cls: 'sm ghost', off: n ? '' : 'Nothing is painted.' }) + '</div>', UI.touch ? 'Drag one finger to paint; use two fingers to move the map.' : 'Drag to paint. Use Look, the arrow keys or two-finger scroll to move the map.');
    return h;
  }
  function nationPanel() {
    let h = '<div class="note">Historical mode and the national programme trees belong to the countries of the Three Continents. On a custom map a state keeps its own tree only while it is still one of them (Aurelia moved somewhere else keeps Aurelia’s tree and destinies, even renamed). Every other state gets the family and ideology trees, as on random worlds.</div>';
    h += '<div class="row" style="margin:8px 0">' + btn(armed ? 'Click the map to place it…' : 'Add a state', 'mkArm', null, { cls: 'sm' + (armed ? ' red' : ''), off: def.nations.length >= M.LIM.nations ? 'A map can have at most ' + M.LIM.nations + ' states.' : '' }) + '<span class="dim">' + def.nations.length + ' states</span></div>';
    const d = def.nations[selN];
    if (d) {
      const n = PG && ID.byBase(PG, d.key);
      h += '<div class="note mksel"><div class="row nw">' + (n ? ID.Flags.html(n, 'sflag') : '') + '<b style="font-size:17px">' + esc(d.base) + '</b><span class="dim">' + (n ? n.tiles + ' tiles · ' : '') + (ID.FOCUS.nations[d.key] ? esc(d.key) + '’s tree' : 'family tree') + '</span></div>';
      h += slider('mkWeight', d.w, 0.3, 2.5, 0.05, 'Weight');
      h += '<small class="dim">Weight is how far it spreads at the start, against its neighbours.</small>';
      h += '<div class="row" style="margin-top:6px">' + btn('Edit country…', 'mkEdit', null, { cls: 'sm red', tip: 'Name, flag, colour, system, situation and more' }) + btn('Delete', 'mkDelN', null, { cls: 'sm ghost' }) + '</div></div>';
    }
    h += '<div class="mklist">' + def.nations.map((x, k) => { const n = PG && ID.byBase(PG, x.key); return '<button class="nrow' + (k === selN ? ' on' : '') + '" data-act="mkSelN" data-a="' + k + '">' + (n ? ID.Flags.html(n, 'mini') : '') + '<b>' + esc(x.base) + '</b><small>' + esc(ID.IDEOLOGIES[x.ideo].name) + ' · ' + esc(ID.SITUATIONS[x.sit].name.toLowerCase()) + '</small></button>'; }).join('') + '</div>';
    return h;
  }

  /* ---------------------------------------------------------------- the handles on the map */
  function overlay(ctx, sx, sy, z) {
    if (!def || !PG) return;
    const W = PG.W, H = PG.H;
    ctx.save();
    if (tool === 'land') {
      def.blobs.forEach((b, k) => {
        const X = sx(b[0] * W), Y = sy(b[1] * H), r = b[2] * W * 0.72 * z, on = k === sel;
        ctx.strokeStyle = on ? 'rgba(200,40,30,0.95)' : 'rgba(23,20,15,0.45)'; ctx.lineWidth = on ? 2.5 : 1.5; ctx.setLineDash(on ? [] : [5, 4]);
        ctx.beginPath(); ctx.arc(X, Y, Math.max(4, r), 0, 6.3); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = on ? '#c8281e' : '#ebe2cc'; ctx.strokeStyle = '#17140f'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(X, Y, UI.touch ? 9 : 7, 0, 6.3); ctx.fill(); ctx.stroke();
      });
    } else if (tool === 'nations') {
      ctx.font = '700 13px Barlow Condensed, sans-serif'; ctx.textAlign = 'center';
      def.nations.forEach((d, k) => {
        const X = sx(d.x * W), Y = sy(d.y * H), on = k === selN, n = ID.byBase(PG, d.key), s = UI.touch ? 9 : 7;
        ctx.fillStyle = n ? n.css : '#888'; ctx.strokeStyle = on ? '#c8281e' : '#17140f'; ctx.lineWidth = on ? 3.5 : 2;
        ctx.fillRect(X - s, Y - s, s * 2, s * 2); ctx.strokeRect(X - s, Y - s, s * 2, s * 2);
        const label = d.base.toUpperCase(), tw = ctx.measureText(label).width + 8;
        ctx.fillStyle = on ? '#c8281e' : '#17140f'; ctx.fillRect(X - tw / 2, Y + s + 3, tw, 16);
        ctx.fillStyle = '#ebe2cc'; ctx.fillText(label, X, Y + s + 15);
      });
    }
    ctx.restore();
  }

  /* ---------------------------------------------------------------- pointer (from js/ui/main.js) */
  const near = (px, py, pts) => { const [mx, my] = R.mapAt(px, py), z = R.cam.z, lim = UI.touch ? 24 : 16; let best = -1, bd = lim; pts.forEach((p, k) => { const d = Math.hypot((p[0] - mx) * z, (p[1] - my) * z); if (d < bd) { bd = d; best = k; } }); return best; };
  const blobPts = () => def.blobs.map((b) => [b[0] * PG.W, b[1] * PG.H]);
  const capPts = () => def.nations.map((d) => [d.x * PG.W, d.y * PG.H]);
  function paintAt(px, py) {
    const [mx, my] = R.mapAt(px, py), W = PG.W, H = PG.H, r = brush.r;
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy > r * r + r) continue;
      const x = Math.floor(mx) + dx, y = Math.floor(my) + dy; if (x < 0 || y < 0 || x >= W || y >= H) continue;
      const i = y * W + x;
      if (brush.river) { if (PG.terrain[i] !== T.SEA) { pR[i] = brush.river > 0 ? 1 : 0; PG.river[i] = pR[i]; } }
      else { pT[i] = brush.t; PG.terrain[i] = brush.t; if (brush.t === T.SEA) PG.owner[i] = 0; }
      PG.dirty.push(i);
    }
  }
  MK.down = function (px, py) {
    if (!def || !PG) return false;
    if (tool === 'land') { const k = near(px, py, blobPts()); if (k >= 0) { sel = k; grab = { k: 'blob' }; panel(); return true; } }
    else if (tool === 'nations' && !armed) { const k = near(px, py, capPts()); if (k >= 0) { selN = k; grab = { k: 'cap' }; panel(); return true; } }
    else if (tool === 'paint') { grab = { k: 'paint', x: px, y: py }; paintAt(px, py); return true; }
    return false;
  };
  MK.move = function (px, py) {
    if (!grab) return;
    const [mx, my] = R.mapAt(px, py), W = PG.W, H = PG.H, r4 = (v) => Math.round(v * 10000) / 10000;
    if (grab.k === 'blob') { const b = def.blobs[sel]; b[0] = r4(ID.clamp(mx / W, -0.1, 1.1)); b[1] = r4(ID.clamp(my / H, -0.1, 1.1)); }
    else if (grab.k === 'cap') { const d = def.nations[selN]; d.x = r4(ID.clamp(mx / W, 0, 1)); d.y = r4(ID.clamp(my / H, 0, 1)); }
    else if (grab.k === 'paint') { const steps = Math.max(1, Math.ceil(Math.hypot(px - grab.x, py - grab.y) / Math.max(2, R.cam.z * 0.8))); for (let s = 1; s <= steps; s++) paintAt(grab.x + ((px - grab.x) * s) / steps, grab.y + ((py - grab.y) * s) / steps); grab.x = px; grab.y = py; }
  };
  MK.up = function (tap) {
    const g = grab; grab = null; if (!g) return;
    if (g.k === 'paint') soon(false);
    else if (!tap) soon(g.k === 'blob');
  };
  MK.tap = function (px, py) {
    if (!def || !PG) return;
    if (tool === 'nations') {
      if (armed) { addNation(px, py); return; }
      let k = near(px, py, capPts());
      if (k < 0) { const i = R.tileAt(px, py), o = i >= 0 ? PG.owner[i] : 0; if (o) k = def.nations.findIndex((d) => d.key === PG.nations[o].key); }
      selN = k; panel();
    } else if (tool === 'land') { sel = near(px, py, blobPts()); panel(); }
  };
  function addNation(px, py) {
    const [mx, my] = R.mapAt(px, py), used = new Set(def.nations.map((d) => d.key).concat(def.nations.map((d) => d.base)));
    const rng = new ID.RNG((Date.now() ^ (mx * 997)) >>> 0), nm = ID.genName(rng, used), ideos = Object.keys(ID.START_WEIGHTS).filter((k) => ID.START_WEIGHTS[k] > 0);
    const ideo = rng.weighted(ideos, (k) => ID.START_WEIGHTS[k]);
    def.nations.push({ key: nm.base, base: nm.base, adj: nm.adj, x: Math.round(ID.clamp(mx / PG.W, 0, 1) * 1e4) / 1e4, y: Math.round(ID.clamp(my / PG.H, 0, 1) * 1e4) / 1e4, w: 1, ideo, sit: rng.pick(ID.SIT_FOR[ideo]) });
    selN = def.nations.length - 1; armed = false; rebuild();
  }

  /* ---------------------------------------------------------------- actions */
  acts.mapMaker = () => acts.mkPresets(true);
  acts.mkQuit = () => { MK.close(); ID.Screens.title(); };
  acts.mkMin = () => { min = !min; panel(); };
  acts.mkTool = (a) => { tool = a; armed = false; panel(); };
  acts.mkName = (v) => { def.name = ID.Custom.clean(v, M.LIM.name) || def.name; panel(); };
  acts.mkSize = (a) => { if (a === def.size) return; def.size = a; def.paint = []; def.rivers = []; pT = null; loadPaint(); rebuild(true); };
  acts.mkLand = (v) => { def.land = ID.clamp(+v / 100, 0.18, 0.65); rebuild(true); };
  acts.mkSeed = (v) => { def.seed = (parseInt(v, 10) >>> 0) || ID.hashStr(String(v)) || 1; rebuild(true); };
  acts.mkReseed = () => { def.seed = ((Math.random() * 1e9) >>> 0) || 1; rebuild(true); };
  acts.mkAddBlob = (r) => { if (def.blobs.length >= M.LIM.blobs) { UI.toast('A map can have at most ' + M.LIM.blobs + ' shapes.'); return; } const [cx, cy] = R.center(); def.blobs.push([Math.round((cx / PG.W) * 1e4) / 1e4, Math.round((cy / PG.H) * 1e4) / 1e4, r]); sel = def.blobs.length - 1; rebuild(true); };
  acts.mkBlobR = (v) => { if (def.blobs[sel]) { def.blobs[sel][2] = +v / 1000; rebuild(true); } };
  acts.mkDelBlob = () => { if (sel >= 0) { def.blobs.splice(sel, 1); sel = -1; rebuild(true); } };
  acts.mkBrush = (a) => { brush.t = a; brush.river = 0; panel(); };
  acts.mkRiver = (a) => { brush.river = a; panel(); };
  acts.mkBrushR = (a) => { brush.r = a; panel(); };
  acts.mkClearPaint = () => { pT.fill(-1); pR.fill(-1); rebuild(); };
  acts.mkArm = () => { armed = !armed; tool = 'nations'; panel(); if (armed) UI.toast(UI.tap('Click the map where the new state’s capital should be.'), true); };
  acts.mkSelN = (k) => { selN = k; const d = def.nations[k]; if (d && PG) R.focus(Math.round(d.y * PG.H) * PG.W + Math.round(d.x * PG.W)); panel(); };
  acts.mkWeight = (v) => { const d = def.nations[selN]; if (d) { d.w = ID.clamp(+v, 0.3, 2.5); rebuild(); } };
  acts.mkDelN = () => { if (selN < 0) return; def.nations.splice(selN, 1); selN = -1; rebuild(); };
  /* The country editor on a state of this map: its customization lives in the state's own definition. */
  acts.mkEdit = () => {
    const d = def.nations[selN]; if (!d || !PG) return;
    const key = d.key, D = () => def.nations.find((x) => x.key === key);
    const FIELDS = ['adj', 'full', 'cap', 'leader', 'color', 'flag', 'hist', 'motto', 'anthem', 'blurb'];
    const orig = (k) => { const o = ID.SCENARIOS.meridia.nations.find((m) => m.base === k); return o ? o.adj : ID.Custom.adjOf(k); };
    const adj0 = (x) => (x.base !== x.key ? ID.Custom.adjOf(x.base) : orig(x.key));
    ID.CustomUI.open({
      G: () => PG, n: () => ID.byBase(PG, key) || PG.nations[1],
      get: () => { const x = D(), c = {}; for (const k of FIELDS) if (x[k] != null && k !== 'adj') c[k] = x[k]; if (x.base !== x.key) c.base = x.base; if (x.adj !== adj0(x)) c.adj = x.adj; return c; },
      set: (c) => { const x = D(); for (const k of FIELDS) delete x[k]; const nb = c.base; delete c.base; Object.assign(x, c); x.base = nb || x.key; if (!x.adj) x.adj = adj0(x); rebuild(); },
      ideo: (v) => { D().ideo = v; rebuild(); },
      close: () => panel(),
    });
  };
  acts.mkPlay = () => { savePaint(); let d; try { d = M.validate(JSON.parse(JSON.stringify(def))); } catch (e) { UI.toast(e.message); return; } MK.close(); ID.Screens.setup({ scenario: 'custom', map: d }); };

  /* ---------------------------------------------------------------- presets and saved maps */
  const saved = () => store.get('id_maps', []);
  acts.mkPresets = (fromTitle) => {
    const S = saved();
    let h = '<div class="dlg wide"><div class="dhd"><div class="k">MAP MAKER</div><button class="x" data-act="' + (def ? 'closeModal' : 'closeModal') + '">✕</button></div><div class="dbd">';
    h += '<p class="lead">Start from a preset or one of your maps. A custom map is played like any other world: the states grow over it, and the computer runs them.</p>';
    h += '<h4>Presets</h4><div class="mkpre">' + M.PRESETS.map((p) => '<div class="dec"><h4>' + esc(p.name) + '</h4><p>' + esc(p.desc) + '</p><span></span>' + btn('Open', 'mkFromPreset', p.id, { cls: 'sm red' }) + '</div>').join('') + '</div>';
    h += '<h4 style="margin-top:12px">Your maps</h4>' + (S.length ? S.map((m, k) => '<div class="mkrow"><input type="text" maxlength="' + M.LIM.name + '" value="' + esc(m.name) + '" data-change="mkRename" data-k="' + k + '"' + tip('Rename: type and press Enter') + '><small class="dim">' + new Date(m.at).toLocaleDateString() + '</small>' + btn('Open', 'mkOpenSaved', k, { cls: 'sm' }) + btn('Duplicate', 'mkDup', k, { cls: 'sm ghost' }) + btn('Delete', 'mkDelSaved', k, { cls: 'sm ghost' }) + '</div>').join('') : '<p class="dim">None yet. Press Save in the map maker to keep a map here.</p>');
    h += '<div class="row" style="margin-top:12px">' + btn('Load code', 'loadCode', null, { cls: 'ghost' }) + '<label class="b ghost">Import file<input type="file" accept=".idmap,application/json" data-change="mkImport" hidden></label><span class="sp"></span>' + btn('Close', 'closeModal', null, { cls: 'ghost' }) + '</div></div></div>';
    UI.modal(h, 'menu');
  };
  acts.mkFromPreset = (id) => { let d; try { d = M.preset(id); } catch (e) { UI.toast(e.message); return; } MK.open(d); };
  acts.mkOpenSaved = (k) => { const m = saved()[k]; if (!m) return; try { MK.open(M.validate(m.def), k); } catch (e) { UI.toast('That map could not be opened: ' + e.message); } };
  acts.mkRename = (v, el) => { const S = saved(), m = S[+el.dataset.k]; if (!m) return; m.name = ID.Custom.clean(v, M.LIM.name) || m.name; m.def.name = m.name; store.set('id_maps', S); if (slot === +el.dataset.k && def) { def.name = m.name; panel(); } };
  acts.mkDup = (k) => { const S = saved(), m = S[k]; if (!m) return; const c = JSON.parse(JSON.stringify(m)); c.name = (m.name + ' (copy)').slice(0, M.LIM.name); c.def.name = c.name; c.at = Date.now(); S.splice(k + 1, 0, c); if (!store.set('id_maps', S)) UI.toast('Could not save: this browser’s storage is full.'); if (slot > k) slot++; acts.mkPresets(); };
  acts.mkDelSaved = (k) => { const S = saved(); S.splice(k, 1); store.set('id_maps', S); if (slot === k) slot = -1; else if (slot > k) slot--; acts.mkPresets(); };
  acts.mkSave = () => {
    if (!def) return; savePaint();
    const S = saved(), m = { name: def.name, at: Date.now(), def: M.pack(def) };
    if (slot >= 0 && S[slot]) S[slot] = m; else { S.unshift(m); slot = 0; }
    if (store.set('id_maps', S)) UI.toast('Saved “' + def.name + '”.', true); else UI.toast('Could not save: this browser’s storage is full. Export a file instead.');
    panel();
  };

  /* ---------------------------------------------------------------- codes and files */
  let codeFull = '', codeLite = '', codeFor = null;
  async function showCode(d, lite) {
    try { codeFull = await M.encode(d); codeLite = d.nations.some((x) => x.flag && x.flag.img) ? await M.encode(d, true) : ''; } catch (e) { UI.toast('The code could not be made: ' + e.message); return; }
    codeFor = d; codeDlg(lite && codeLite ? 'lite' : 'full');
  }
  function codeDlg(which) {
    const code = which === 'lite' ? codeLite : codeFull;
    UI.modal('<div class="dlg"><div class="dhd"><div class="k">MAP CODE</div><button class="x" data-act="closeModal">✕</button></div><div class="dbd">' +
      '<p class="lead">Anyone can paste this code into <b>Load code</b> on the title screen to play or edit <b>' + esc(codeFor.name) + '</b>.</p>' +
      '<textarea class="code" rows="6" readonly>' + esc(code) + '</textarea><p class="dim">' + code.length.toLocaleString() + ' characters' + (codeLite ? '' : '.') + '</p>' +
      (codeLite ? '<div class="field"><label>Uploaded flags</label><div class="seg"><button class="' + (which === 'full' ? 'on' : '') + '" data-act="mkCodeWhich" data-a=\'"full"\'>Include (' + codeFull.length.toLocaleString() + ')</button><button class="' + (which === 'lite' ? 'on' : '') + '" data-act="mkCodeWhich" data-a=\'"lite"\'>Leave out (' + codeLite.length.toLocaleString() + ')</button></div><small>Left out, those countries fly a flag built from their colours. A file keeps everything at any size.</small></div>' : '') +
      '<div class="row">' + btn('Copy', 'mkCopy', which, { cls: 'red' }) + btn('Export file', 'mkExport', null, { cls: 'ghost' }) + '<span class="sp"></span>' + btn('Close', 'closeModal', null, { cls: 'ghost' }) + '</div></div></div>', 'menu');
    const ta = document.querySelector('#modal textarea.code'); if (ta) ta.addEventListener('focus', () => ta.select());
  }
  acts.mkCodeWhich = (a) => codeDlg(a);
  acts.mkCopy = async (which) => {
    const code = which === 'lite' ? codeLite : codeFull, ta = document.querySelector('#modal textarea.code');
    try { await navigator.clipboard.writeText(code); UI.toast('Map code copied (' + code.length.toLocaleString() + ' characters).', true); }
    catch (e) { if (ta) { ta.focus(); ta.select(); } try { document.execCommand('copy'); UI.toast('Map code copied.', true); } catch (x) { UI.toast('Select the code and copy it.'); } }
  };
  acts.mkCode = () => { savePaint(); showCode(JSON.parse(JSON.stringify(def))); };
  MK.showCode = showCode;
  function download(d) {
    const a = document.createElement('a'), url = URL.createObjectURL(new Blob([M.toFile(d)], { type: 'application/json' }));
    a.href = url; a.download = (d.name.replace(/[^\p{L}\p{N} _-]/gu, '').trim() || 'map') + '.idmap'; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
  acts.mkExport = () => { if (def) { savePaint(); download(def); } else if (codeFor) download(codeFor); };
  acts.mkImport = (v, el) => {
    const f = el.files && el.files[0]; if (!f) return;
    if (f.size > 4e6) { UI.toast('That file is too large to be a map.'); return; }
    f.text().then((s) => { const d = M.fromFile(s); MK.open(d); UI.toast('Opened “' + d.name + '”.', true); }).catch((e) => UI.toast(e.message || 'That file could not be read.'));
  };
  /* Load code: from the title menu, the map maker, or its presets. */
  acts.loadCode = () => {
    UI.modal('<div class="dlg"><div class="dhd"><div class="k">LOAD A MAP CODE</div><button class="x" data-act="closeModal">✕</button></div><div class="dbd">' +
      '<p class="lead">Paste a map code (it begins with IDM1-).</p><textarea class="code" rows="6" id="codein" placeholder="IDM1-…"></textarea><div id="codeerr"></div>' +
      '<div class="row">' + btn('Play it', 'codeGo', 'play', { cls: 'red' }) + btn('Open in the map maker', 'codeGo', 'edit', { cls: 'ghost' }) + '<span class="sp"></span>' + btn('Close', 'closeModal', null, { cls: 'ghost' }) + '</div></div></div>', 'menu');
  };
  acts.codeGo = async (how) => {
    const el = $('#codein'), out = $('#codeerr'); if (!el) return;
    let d; try { d = await M.decode(el.value); M.build(d); } catch (e) { if (out) out.innerHTML = '<div class="note red">' + esc(e.message || 'That code could not be read.') + '</div>'; return; }
    if (how === 'edit') MK.open(d); else { if (def) MK.close(); ID.Screens.setup({ scenario: 'custom', map: d }); }
  };
})();
