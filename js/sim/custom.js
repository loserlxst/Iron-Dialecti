/* IRON DIALECTIC — country customization: the names, colours, flags and flavour a player gives a state before the
   start. A customization is a set of nation-definition fields ({base, adj, full, cap, leader, color, flag, hist, motto,
   anthem, blurb, sit, ideo}); ID.newGame applies them to the definitions it builds the world from, so rebuilding a
   world from its seed without them restores history exactly. Everything here is validated, because customizations
   also arrive inside map codes written by strangers (sim/maps.js). No DOM. */
(function () {
  'use strict';
  const ID = (globalThis.ID = globalThis.ID || {});
  const Cu = (ID.Custom = {});

  Cu.LIM = { base: 24, adj: 24, full: 48, cap: 24, leader: 32, motto: 80, anthem: 48, blurb: 280, img: 24000 };
  /* Names reach HTML, SVG, regular expressions and String.replace patterns: only letters, digits, spaces and a little
     punctuation survive. Never < > " ' ` $ \ { } (a typed ' becomes ’). */
  const NAME_BAD = /[^\p{L}\p{M}\p{N} .,’\-()&]/gu;
  const TEXT_BAD = /[^\p{L}\p{M}\p{N} .,’\-()&!?:;—–“”‘…/]/gu;
  Cu.clean = (s, max, text) => (typeof s === 'string' ? s.replace(/'/g, '’').replace(/"/g, '').replace(text ? TEXT_BAD : NAME_BAD, '').replace(/\s+/g, ' ').trim().slice(0, max) : '');
  const HEX = /^#[0-9a-f]{6}$/i;
  Cu.IMG = /^data:image\/(png|webp);base64,[A-Za-z0-9+/]+={0,2}$/;
  Cu.PATTERNS = ['hband', 'vtri', 'bicol', 'canton', 'stripes', 'cross', 'diag', 'sunburst', 'border', 'chevron', 'saltire'];
  Cu.TEXT = ['full', 'cap', 'leader', 'motto', 'anthem', 'blurb'];

  /* Colours the political map draws legibly against the paper, the sea and the ink borders. */
  const hsl = (h, s, l) => { const a = s * Math.min(l, 1 - l), f = (k0) => { const k = (k0 + h * 12) % 12; return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))); }; return [f(0), f(8), f(4)]; };
  Cu.PALETTE = [];
  for (let k = 0; k < 16; k++) for (const [s, l] of [[0.52, 0.5], [0.42, 0.64]]) Cu.PALETTE.push(hsl(k / 16, s, l));
  Cu.dist = (a, b) => Math.hypot(a[0] - b[0], (a[1] - b[1]) * 1.3, a[2] - b[2]);
  /* Neighbours whose colour is too close to col to tell the border apart. */
  Cu.clashes = (G, n, col) => G.nations.filter((o) => o && o !== n && o.alive && ID.borders(G, n.id, o.id) && Cu.dist(o.color, col) < 48);

  Cu.cleanFlag = function (f) {
    if (!f || typeof f !== 'object') return null;
    if (f.img) return typeof f.img === 'string' && f.img.length <= Cu.LIM.img && Cu.IMG.test(f.img) ? { img: f.img } : null;
    if (Cu.PATTERNS.indexOf(f.p) < 0 || !HEX.test(f.a)) return null;
    const o = { p: f.p, a: f.a.toLowerCase() };
    for (const k of ['b', 'c', 'ef']) if (HEX.test(f[k])) o[k] = f[k].toLowerCase();
    if (typeof f.e === 'string' && /^[a-z]{1,12}$/.test(f.e)) o.e = f.e;
    return o;
  };
  const okCol = (c) => Array.isArray(c) && c.length === 3 && c.every((v) => Number.isInteger(v) && v >= 0 && v <= 255);
  /* The customization fields of any object, validated; unknown fields and bad values are dropped. */
  Cu.cleanCustom = function (c) {
    const o = {}; if (!c || typeof c !== 'object') return o;
    for (const k of ['base', 'adj']) { const v = Cu.clean(c[k], Cu.LIM[k]); if (v) o[k] = v; }
    for (const k of Cu.TEXT) { const v = Cu.clean(c[k], Cu.LIM[k], k !== 'cap' && k !== 'leader'); if (v) o[k] = v; }
    if (okCol(c.color)) o.color = c.color.slice();
    const f = Cu.cleanFlag(c.flag); if (f) o.flag = f;
    if (c.hist === true || c.hist === 1) o.hist = 1;
    if (typeof c.sit === 'string' && ID.SITUATIONS[c.sit]) o.sit = c.sit;
    if (typeof c.ideo === 'string' && ID.IDEOLOGIES[c.ideo]) o.ideo = c.ideo;
    return o;
  };

  /* Definition-level fields, applied before the world grows (they change who owns what). */
  const SIT_W = { great: 1.5, sick: 1.7, rich: 0.9, small: 0.55, backwater: 1.25, revolution: 0.9, trader: 0.6, middling: 1.0 };
  Cu.applyDef = function (d, c, random) {
    d.key = d.key || d.base;
    if (!c) return d;
    if (c.base) { d.base = c.base; d.adj = c.adj || c.base + (/a$/.test(c.base) ? 'n' : /[eiouy]$/.test(c.base) ? 'an' : 'ian'); } else if (c.adj) d.adj = c.adj;
    if (c.sit && c.sit !== d.sit) { if (random) d.w = d.w * SIT_W[c.sit] / (SIT_W[d.sit] || 1); d.sit = c.sit; }
    if (c.color) d.color = c.color.slice();
    if (c.blurb) d.blurb = c.blurb;
    for (const k of ['full', 'cap', 'leader', 'motto', 'anthem', 'flag', 'hist']) if (c[k]) d[k] = c[k];
    return d;
  };

  /* After the world is built (and after any rewrite of its government): the rest of a state's customization. */
  ID.customize = function (G, n, d) {
    const C = {};
    for (const k of ['full', 'cap', 'motto', 'anthem', 'flag', 'hist']) if (d && d[k]) C[k] = d[k];
    if (d && d.leader && n.leader) n.leader.name = d.leader;
    if (Object.keys(C).length) { C.ideo = n.ideo; C.fv = C.flag ? ID.hashStr(JSON.stringify(C.flag)).toString(36) : ''; n.cust = C; } else delete n.cust;
    n.name = n.destiny && !n.destiny.lapsed ? n.destiny.name : ID.nationTitle(n, n.ideo);
    if (C.cap && n.capital >= 0) { const P = G.provinces[G.prov[n.capital]]; if (P) { P.name = C.cap; C.capP = P.id; } }
  };
  /* Province names are not in the save: put the capitals' custom names back. */
  Cu.restore = function (G) { for (const n of G.nations) if (n && n.cust && n.cust.capP && G.provinces[n.cust.capP]) G.provinces[n.cust.capP].name = n.cust.cap; };

  /* National content was written for the Three Continents and names its countries outright ("Holy Aurelian Empire").
     A renamed state's text is rewritten in one pass: the scenario's name and adjective become the player's.
     shortcut: one table for the one world in play (set by newGame and load); a tool juggling two renamed worlds at once
     would need the table on G. */
  let REN = null, MAP = null;
  Cu.setRen = function (G) {
    REN = null; MAP = {};
    const sc = ID.SCENARIOS.meridia;
    for (const n of G.nations) {
      if (!n) continue;
      const d = sc.nations.find((x) => x.base === n.key); if (!d) continue;
      if (d.adj !== n.adj) MAP[d.adj] = n.adj;
      if (d.base !== n.base) MAP[d.base] = n.base;
    }
    const ks = Object.keys(MAP).sort((a, b) => b.length - a.length);
    if (ks.length) REN = new RegExp('\\b(' + ks.join('|') + ')\\b', 'g');
  };
  ID.ren = (s) => (REN && s ? String(s).replace(REN, (m) => MAP[m]) : s);

  /* A short self-check, run by tools/mapmaker.js. */
  Cu.selfTest = function () {
    const bad = Cu.clean('<img src=x onerror="alert(1)">$&{N}\'s', 40);
    if (/[<>"'$`{}\\]/.test(bad)) throw new Error('clean let markup through: ' + bad);
    if (Cu.cleanFlag({ img: 'data:image/svg+xml;base64,AAAA' })) throw new Error('svg flag accepted');
    if (Cu.cleanFlag({ p: 'stripes', a: 'red" onload="x' })) throw new Error('bad colour accepted');
    if (!Cu.cleanFlag({ img: 'data:image/png;base64,iVBORw0KGgo=' })) throw new Error('png flag refused');
    return true;
  };
})();
