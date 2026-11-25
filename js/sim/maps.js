/* IRON DIALECTIC — custom maps: the map maker's map definitions, the presets, the checks before play, and map codes.
   A map definition is the input of world creation, not a running game: the land layout (ID.genMap's blobs, its noise
   seed and sea level, painted terrain as run-length diffs against the generated land) and the nation definitions
   ID.newGame reads from a scenario (capital position, weight, system, situation and any customization). A custom map
   is played as the scenario 'custom' with the definition in G.map, which the save carries.
   Codes: "IDM1-" + base64url(deflate-raw(JSON)). Codes and files come from strangers: M.validate checks every field
   and never evaluates anything. No DOM (CompressionStream, btoa and atob exist in browsers and in Node). */
(function () {
  'use strict';
  const ID = (globalThis.ID = globalThis.ID || {});
  const M = (ID.Maps = {});
  const Cu = ID.Custom, T = ID.T;
  ID.VERSION = '2026.11.25';
  M.FORMAT = 1; // the code's own format
  M.MAPGEN = 2; // the map generator a definition was made for; a later generator keeps this one for old maps (as ID.mapOpts does for legacy layouts)
  M.PREFIX = 'IDM1-';
  M.LIM = { nations: 40, blobs: 80, runs: 60000, blds: 4000, name: 40, code: 600000 };
  M.YEARS = [1910, 1925, 1940];
  M.BLDS = [1, 2, 3, 4]; // city, fort, port, factory (ID.B)

  const num = (v, lo, hi) => typeof v === 'number' && isFinite(v) && v >= lo && v <= hi;
  const r4 = (v) => Math.round(v * 10000) / 10000;

  /* ---------------------------------------------------------------- definitions */
  M.blank = (o) => Object.assign({ id: 'custom', v: M.FORMAT, mg: M.MAPGEN, gv: ID.VERSION, name: 'A new world', seed: 1, size: 'std', land: 0.37, level: null, gen: true, noiseH: 0, blobs: [], paint: [], rivers: [], own: [], blds: [], grow: true, autoBld: true, year: 1910, nations: [] }, o || {});
  /* An empty sea with two states on two painted islands: the start for a map drawn by hand. */
  M.empty = function (size) {
    const sz = ID.MAP_SIZES[size || 'std'], W = sz.W, H = sz.H, paint = [];
    const isle = (cx, cy, rx, ry) => { for (let y = Math.round(cy - ry); y <= cy + ry; y++) { const half = Math.round(rx * Math.sqrt(Math.max(0, 1 - ((y - cy) / ry) ** 2))); if (half > 0) paint.push([y * W + Math.round(cx - half), half * 2 + 1, T.PLAINS]); } };
    isle(W * 0.3, H * 0.5, W * 0.12, H * 0.22); isle(W * 0.7, H * 0.5, W * 0.12, H * 0.22);
    paint.sort((a, b) => a[0] - b[0]);
    return M.blank({ name: 'An empty sea', seed: 1, size: size || 'std', gen: false, paint, nations: [
      { key: 'Westmark', base: 'Westmark', adj: 'Westmarkish', x: 0.3, y: 0.5, w: 1, ideo: 'conmon', sit: 'middling' },
      { key: 'Ostrava', base: 'Ostrava', adj: 'Ostravan', x: 0.7, y: 0.5, w: 1, ideo: 'liberal', sit: 'middling' }] });
  };
  /* The scenario of 1910 as an editable copy (no historical mode, no Old Lands script: those belong to the original). */
  M.fromMeridia = function () {
    const sc = ID.SCENARIOS.meridia;
    return M.blank({ name: 'The Three Continents', seed: sc.seed, size: sc.size, land: sc.land, noiseH: sc.noiseH, blobs: sc.blobs.map((b) => b.map(r4)),
      nations: sc.nations.map((d) => ({ key: d.base, base: d.base, adj: d.adj, x: d.x, y: d.y, w: d.w, ideo: d.ideo, sit: d.sit, blurb: d.blurb })) });
  };
  /* The nations of a built world as definitions (a random world, or a layout preset after placing its states). */
  M.fromWorld = function (G, base) {
    const def = M.blank(base);
    def.nations = ID.alive(G).map((n) => ({ key: n.key, base: n.base, adj: n.adj, x: r4((n.capital % G.W + 0.5) / G.W), y: r4((((n.capital / G.W) | 0) + 0.5) / G.H), w: ID.SIT_W[n.sit] || 1, ideo: n.ideo, sit: n.sit }));
    return def;
  };
  /* A layout: blobs and a sea level; the states are placed on it the way a random world places them. */
  M.layout = function (name, seed, size, blobs, land, extra, mask) {
    const G = ID.newGame({ scenario: 'random', seed, size, blobs, land, headless: true, mg: mask ? 2 : 0, mask });
    const def = M.fromWorld(G, { name, seed, size, land, blobs: blobs || G.blobs, mask: mask || undefined });
    if (extra) extra(def);
    return def;
  };
  const isles = (seed, n, lo, hi) => { const r = new ID.RNG(seed), out = []; for (let k = 0; k < n; k++) out.push([r4(r.range(0.08, 0.92)), r4(r.range(0.12, 0.88)), r4(r.range(lo, hi))]); return out; };
  const ring = (n, R, r) => { const out = []; for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2; out.push([r4(0.5 + Math.cos(a) * R * 0.62), r4(0.5 + Math.sin(a) * R), r]); } return out; };
  /* The globe laid flat, 80° north to 60° south, as land per 5° band of latitude: [west, east] in degrees of longitude.
     Coarse on purpose (straits and inland seas narrower than a band are left out); the generator roughens the coasts. */
  const EARTH = [
    [[-100, -20], [95, 110]],
    [[-125, -80], [-60, -20], [52, 58], [70, 160]],
    [[-180, -170], [-168, -82], [-80, -62], [-55, -22], [-24, -14], [8, 30], [30, 180]],
    [[-168, -95], [-78, -62], [-50, -42], [5, 19], [22, 155], [160, 180]],
    [[-165, -155], [-135, -95], [-80, -58], [-6, -2], [5, 20], [21, 140], [155, 163]],
    [[-130, -56], [-10, -6], [-5, 2], [4, 140], [142, 144], [156, 160]],
    [[-125, -64], [-5, 47], [54, 140], [142, 146]],
    [[-124, -70], [-9, 3], [5, 28], [41, 47], [54, 130], [139, 146]],
    [[-123, -76], [-9, -1], [15, 18], [20, 122], [126, 129], [130, 141]],
    [[-120, -80], [-10, 122], [129, 141]],
    [[-115, -97], [-82, -80], [-15, 33], [35, 48], [56, 122]],
    [[-106, -97], [-91, -87], [-84, -75], [-17, 37], [39, 59], [69, 117]],
    [[-105, -88], [-74, -68], [-17, 40], [42, 53], [73, 85], [95, 109], [120, 122]],
    [[-92, -83], [-17, 51], [74, 80], [98, 100], [104, 109], [122, 126]],
    [[-83, -60], [-13, 48], [80, 82], [99, 104], [122, 126]],
    [[-80, -50], [9, 43], [95, 106], [109, 119], [120, 125]],
    [[-81, -35], [9, 41], [100, 106], [110, 117], [120, 123], [131, 150]],
    [[-80, -35], [12, 40], [105, 125], [140, 150]],
    [[-77, -38], [13, 41], [43, 50], [130, 136], [141, 144]],
    [[-75, -39], [12, 40], [43, 50], [122, 146]],
    [[-70, -40], [13, 35], [43, 48], [114, 153]],
    [[-71, -48], [15, 33], [113, 153]],
    [[-72, -52], [17, 28], [115, 124], [134, 151]],
    [[-73, -57], [140, 150], [173, 178]],
    [[-74, -63], [145, 148], [170, 174]],
    [[-75, -66], [166, 170]],
    [[-75, -68], [-61, -58]],
    [],
  ];
  M.earthMask = function () {
    const w = 72, h = EARTH.length, bits = new Uint8Array(w * h);
    EARTH.forEach((L, y) => { for (let x = 0; x < w; x++) { const a = -180 + x * 5, b = a + 5; for (const [p, q] of L) { const o = Math.min(b, q) - Math.max(a, p); if (o >= Math.min(2.5, (q - p) * 0.6)) bits[y * w + x] = 1; } } });
    let land = 0; for (const v of bits) land += v;
    return { mask: ID.maskOf(bits, w, h), land: Math.round((land / bits.length) * 100) / 100 };
  };
  M.PRESETS = [
    { id: 'empty', name: 'An empty sea', desc: 'Nothing but water and two islands. Paint every coast, border and city yourself.', make: () => M.empty('std') },
    { id: 'world', name: 'World map', desc: 'The continents of a globe laid flat, from the polar islands to the southern capes, with 30 states placed across them. Rename and repaint them as you like.', make: (seed) => { const E = M.earthMask(); return M.layout('The World', seed || 1914, 'world', [], E.land, null, E.mask); } },
    { id: 'meridia', name: 'The Three Continents', desc: 'The handcrafted world of 1910, fully editable as a copy.', make: () => M.fromMeridia() },
    { id: 'random', name: 'A random world', desc: 'A world from a seed, as the Random world option makes it.', make: (seed) => { const s = seed || 4242; const G = ID.newGame({ scenario: 'random', seed: s, size: 'std', headless: true }); return M.fromWorld(G, { name: 'World ' + s, seed: s, size: 'std', land: 0.37, blobs: G.blobs.map((b) => b.map(r4)) }); } },
    { id: 'pangaea', name: 'Pangaea', desc: 'One great landmass. Every war is a land war.', make: (seed) => M.layout('Pangaea', seed || 3301, 'std', [[0.5, 0.5, 0.27], [0.34, 0.4, 0.19], [0.66, 0.6, 0.19], [0.38, 0.66, 0.15], [0.63, 0.34, 0.16], [0.22, 0.55, 0.11], [0.79, 0.45, 0.11]], 0.44) },
    { id: 'archipelago', name: 'Archipelago', desc: 'Dozens of islands. Ports, fleets and landings decide everything.', make: (seed) => M.layout('Archipelago', seed || 7702, 'std', isles(seed || 7702, 22, 0.05, 0.085), 0.3) },
    { id: 'rivals', name: 'Two rival continents', desc: 'Two continents of equal size across one ocean.', make: (seed) => M.layout('Two Rivals', seed || 5150, 'std', [[0.26, 0.5, 0.2], [0.2, 0.3, 0.12], [0.31, 0.72, 0.12], [0.74, 0.5, 0.2], [0.8, 0.3, 0.12], [0.69, 0.72, 0.12]], 0.36) },
    { id: 'inland', name: 'The inland sea', desc: 'A ring of shores around one sea, like a basin of old empires.', make: (seed) => M.layout('The Inland Sea', seed || 2024, 'std', ring(11, 0.33, 0.12).concat([[0.5, 0.06, 0.06], [0.5, 0.94, 0.06]]), 0.46) },
    { id: 'island', name: 'The island empire', desc: 'One great continent, and offshore a single island empire that has never been invaded.', make: (seed) => M.layout('The Island Empire', seed || 1888, 'std', [[0.38, 0.5, 0.25], [0.27, 0.33, 0.15], [0.45, 0.7, 0.15], [0.22, 0.63, 0.12], [0.55, 0.36, 0.12], [0.85, 0.45, 0.075]], 0.37, (def) => {
      // the island's state: a great power with a navy, whoever the placement put there
      let k = def.nations.findIndex((d) => Math.hypot((d.x - 0.85) * 1.78, d.y - 0.45) < 0.09);
      if (k < 0) { let bd = 9; def.nations.forEach((d, j) => { const dd = Math.hypot((d.x - 0.85) * 1.78, d.y - 0.45); if (dd < bd) { bd = dd; k = j; } }); def.nations[k].x = 0.85; def.nations[k].y = 0.45; }
      Object.assign(def.nations[k], { sit: 'great', w: 1.9, ideo: 'conmon' });
    }) },
  ];
  M.preset = (id, seed) => { const P = M.PRESETS.find((p) => p.id === id); return P ? M.validate(P.make(seed)) : null; };

  /* ---------------------------------------------------------------- painted terrain: run-length diffs */
  /* runs [[start, length, value]] of the tiles where `now` differs from `base` (typed arrays of one size). */
  M.diff = function (base, now) {
    const out = []; let s = -1, v = -1;
    for (let i = 0; i <= now.length; i++) {
      const d = i < now.length && now[i] !== base[i] ? now[i] : -1;
      if (d !== v || d < 0) { if (s >= 0 && v >= 0) out.push([s, i - s, v]); s = d >= 0 ? i : -1; v = d; }
    }
    return out;
  };

  /* ---------------------------------------------------------------- validation (the trust boundary) */
  M.validate = function (o) {
    const bad = (why) => { throw new Error(why); };
    if (!o || typeof o !== 'object' || Array.isArray(o)) bad('This is not a map.');
    if (o.mg != null && !(Number.isInteger(o.mg) && o.mg >= 1 && o.mg <= M.MAPGEN)) bad('This map was made by a newer version of the game.');
    const sz = ID.MAP_SIZES[o.size]; if (typeof o.size !== 'string' || !sz) bad('Unknown map size.');
    const N = sz.W * sz.H;
    if (!(Number.isInteger(o.seed) && o.seed >= 1 && o.seed <= 0xffffffff)) bad('The map seed is not valid.');
    const land = o.land == null ? 0.37 : o.land; if (!num(land, 0.15, 0.7)) bad('The sea level is out of range.');
    const noiseH = o.noiseH || 0; if (!(noiseH === 0 || (Number.isInteger(noiseH) && noiseH >= 100 && noiseH <= 400))) bad('The noise scale is out of range.');
    if (!Array.isArray(o.blobs) || o.blobs.length > M.LIM.blobs) bad('Too many continents and islands (at most ' + M.LIM.blobs + ').');
    const blobs = o.blobs.map((b) => { if (!Array.isArray(b) || b.length !== 3 || !num(b[0], -0.2, 1.2) || !num(b[1], -0.2, 1.2) || !num(b[2], 0.005, 0.5)) bad('A continent is out of range.'); return [r4(b[0]), r4(b[1]), r4(b[2])]; });
    const runs = (a, maxV, what) => {
      if (a == null) return []; if (!Array.isArray(a) || a.length > M.LIM.runs) bad('Too much ' + what + '.');
      let tot = 0, last = -1;
      return a.map((r) => {
        if (!Array.isArray(r) || r.length !== 3 || !Number.isInteger(r[0]) || !Number.isInteger(r[1]) || !Number.isInteger(r[2]) || r[0] < 0 || r[1] < 1 || r[0] + r[1] > N || r[2] < 0 || r[2] > maxV || r[0] < last) bad('The ' + what + ' does not fit this map.');
        last = r[0] + r[1]; tot += r[1]; if (tot > N) bad('The ' + what + ' does not fit this map.');
        return r.slice();
      });
    };
    const paint = runs(o.paint, 6, 'painted terrain'), rivers = runs(o.rivers, 1, 'painted river');
    const mg = o.mg || 1;
    const nN = Array.isArray(o.nations) ? o.nations.length : 0;
    const own = mg >= 2 ? runs(o.own, 255, 'painted territory') : []; // generator 1 cannot keep provinces inside painted borders
    if (own.some((r) => r[2] > nN && r[2] !== 255)) bad('The painted territory names a state that is not on the map.');
    if (o.level != null && !num(o.level, -2, 3)) bad('The sea level is out of range.');
    let mask = null;
    if (o.mask != null) {
      const k = o.mask; if (!k || !Number.isInteger(k.w) || !Number.isInteger(k.h) || k.w < 2 || k.h < 2 || k.w > 256 || k.h > 256 || typeof k.d !== 'string' || !/^[A-Za-z0-9_-]*$/.test(k.d) || k.d.length !== Math.ceil(Math.ceil((k.w * k.h) / 8) * 4 / 3)) bad('The land mask does not fit this map.');
      mask = { w: k.w, h: k.h, d: k.d };
    }
    if (o.blds != null && (!Array.isArray(o.blds) || o.blds.length > M.LIM.blds)) bad('Too many buildings.');
    const seenB = new Set();
    const blds = (o.blds || []).filter((b) => { if (!Array.isArray(b) || b.length !== 2 || !Number.isInteger(b[0]) || b[0] < 0 || b[0] >= N || M.BLDS.indexOf(b[1]) < 0) bad('A building does not fit this map.'); if (seenB.has(b[0])) return false; seenB.add(b[0]); return true; }).map((b) => b.slice());
    const year = o.year == null ? 1910 : o.year; if (M.YEARS.indexOf(year) < 0) bad('The start year is not one the game offers.');
    if (!Array.isArray(o.nations) || o.nations.length < 2) bad('A map needs at least two states.');
    if (o.nations.length > M.LIM.nations) bad('A map can have at most ' + M.LIM.nations + ' states.');
    const keys = new Set();
    const nations = o.nations.map((d, k) => {
      if (!d || typeof d !== 'object') bad('State ' + (k + 1) + ' is not valid.');
      const key = Cu.clean(d.key, 24), base = Cu.clean(d.base, Cu.LIM.base) || key;
      if (!key || keys.has(key)) bad('State ' + (k + 1) + ' has no name of its own.'); keys.add(key);
      if (!num(d.x, 0, 1) || !num(d.y, 0, 1)) bad(base + '’s capital is off the map.');
      if (!ID.IDEOLOGIES[d.ideo]) bad(base + ' has an unknown system of government.');
      if (!ID.SITUATIONS[d.sit]) bad(base + ' has an unknown situation.');
      const c = Cu.cleanCustom(d); delete c.ideo; delete c.sit; delete c.base;
      const x = Object.assign({ key, base, adj: c.adj || base, x: r4(d.x), y: r4(d.y), w: num(d.w, 0.2, 3) ? r4(d.w) : 1, ideo: d.ideo, sit: d.sit }, c);
      if (Number.isInteger(d.gold) && d.gold >= 0 && d.gold <= 5000) x.gold = d.gold;
      if (Number.isInteger(d.stab) && d.stab >= 5 && d.stab <= 95) x.stab = d.stab;
      if (Number.isInteger(d.bloc) && d.bloc >= 1 && d.bloc <= 8) x.bloc = d.bloc;
      if (typeof d.over === 'string' && d.over && ID.Sov && ID.Sov.KIND[d.dep]) { x.over = Cu.clean(d.over, 24); x.dep = d.dep; }
      return x;
    });
    for (const x of nations) if (x.over && (x.over === x.key || !keys.has(x.over))) { delete x.over; delete x.dep; } // an overlord must be another state of this map
    return { id: 'custom', v: M.FORMAT, mg, mask: mg >= 2 ? mask : null, gen: o.gen !== false, level: o.level == null ? null : r4(o.level), own, blds, grow: o.grow !== false, autoBld: o.autoBld !== false, year, gv: typeof o.gv === 'string' ? o.gv.slice(0, 16).replace(/[^\w.-]/g, '') : ID.VERSION,
      name: Cu.clean(o.name, M.LIM.name) || 'A custom world', seed: o.seed, size: o.size, land, noiseH, blobs, paint, rivers, nations };
  };

  /* ---------------------------------------------------------------- building and checking */
  M.build = (def, opts) => ID.newGame(Object.assign({ scenario: 'custom', map: def, headless: true, difficulty: 'iron' }, opts || {}));
  /* Problems to show before play: errors stop "Play this map", warnings do not. */
  M.check = function (def, G) {
    const out = [], W = G.W, H = G.H, add = (lvl, text) => out.push({ lvl, text });
    if (def.nations.length < 2) add('err', 'A map needs at least two states.');
    if (def.nations.length > 30) add('warn', def.nations.length + ' states is a crowded world; the game was balanced for 12 to 24.');
    if (def.nations.length < 6) add('warn', 'Only ' + def.nations.length + ' states: a short and lonely century.');
    const own = def.own && def.own.length ? ID.runsGrid(def.own, G.N) : null;
    def.nations.forEach((d) => {
      const i = Math.min(H - 1, Math.round(d.y * H)) * W + Math.min(W - 1, Math.round(d.x * W)), t = G.terrain[i];
      if (t === T.SEA) add('warn', d.base + '’s capital is at sea; it moves to the nearest coast.');
      else if (t === T.MOUNTAIN) add('warn', d.base + '’s capital is on a mountain; it moves to the nearest lowland.');
      const n = ID.byBase(G, d.key), k = def.nations.indexOf(d);
      if (own && own[i] && own[i] !== k + 1) add('warn', d.base + '’s capital is on land painted for ' + (own[i] === 255 ? 'nobody' : (def.nations[own[i] - 1] || {}).base) + '; it moves out of it.');
      if (!n) add('err', d.base + ' could not be placed.');
      else if (n.tiles < 60) add('warn', d.base + ' has very little land (' + n.tiles + ' tiles). Give it more weight or move it.');
    });
    let lone = 0; const seen = new Uint8Array(G.N);
    for (let i = 0; i < G.N; i++) {
      if (seen[i] || G.terrain[i] === T.SEA) continue;
      const st = [i]; seen[i] = 1; let c = 0;
      while (st.length) { const k = st.pop(); c++; const x = k % W; for (const j of [x > 0 ? k - 1 : -1, x < W - 1 ? k + 1 : -1, k - W, k + W]) if (j >= 0 && j < G.N && !seen[j] && G.terrain[j] !== T.SEA) { seen[j] = 1; st.push(j); } }
      if (c < 4) lone++;
    }
    if (lone) add('warn', lone + ' lone patch' + (lone > 1 ? 'es' : '') + ' of land smaller than four tiles: nobody can use them.');
    if (G.landCount < G.N * 0.12) add('warn', 'Very little land: ' + Math.round((G.landCount / G.N) * 100) + '% of the map.');
    return out;
  };

  /* ---------------------------------------------------------------- codes and files */
  const b64u = (bytes) => { let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
  const unb64u = (s) => { const b = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)); const out = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) out[i] = b.charCodeAt(i); return out; };
  const streams = () => { if (typeof CompressionStream === 'undefined' || typeof DecompressionStream === 'undefined') throw new Error('This browser cannot make or read map codes. Use Export file and Import file instead.'); };
  const pipe = async (bytes, stream) => new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer());
  /* What goes into a code or a file: the definition without the defaults, optionally without uploaded flags. */
  M.pack = function (def, noImages) {
    const o = { v: M.FORMAT, mg: def.mg || 1, gv: ID.VERSION, name: def.name, seed: def.seed, size: def.size, land: def.land, blobs: def.blobs, nations: def.nations.map((d) => { const x = Object.assign({}, d); if (x.adj === x.base) delete x.adj; if (x.base === x.key) delete x.base; if (x.w === 1) delete x.w; if (noImages && x.flag && x.flag.img) { delete x.flag; delete x.hist; } return x; }) };
    if (def.noiseH) o.noiseH = def.noiseH;
    if (def.paint && def.paint.length) o.paint = def.paint;
    if (def.rivers && def.rivers.length) o.rivers = def.rivers;
    if (def.mask) o.mask = def.mask;
    if (def.gen === false) o.gen = false;
    if (def.level != null) o.level = def.level;
    if (def.own && def.own.length) o.own = def.own;
    if (def.blds && def.blds.length) o.blds = def.blds;
    if (def.grow === false) o.grow = false;
    if (def.autoBld === false) o.autoBld = false;
    if (def.year && def.year !== 1910) o.year = def.year;
    return o;
  };
  M.encode = async function (def, noImages) {
    streams(); const json = JSON.stringify(M.pack(def, noImages));
    return M.PREFIX + b64u(await pipe(new TextEncoder().encode(json), new CompressionStream('deflate-raw')));
  };
  M.decode = async function (code) {
    if (typeof code !== 'string') throw new Error('Paste a map code.');
    code = code.replace(/\s+/g, '');
    if (!code) throw new Error('Paste a map code.');
    if (code.length > M.LIM.code) throw new Error('That code is too long to be a map.');
    const m = /^IDM(\d+)-([A-Za-z0-9_-]+)$/.exec(code);
    if (!m) throw new Error('That is not a map code. Map codes begin with IDM1-.');
    if (+m[1] > M.FORMAT) throw new Error('That code was made by a newer version of the game.');
    streams();
    let json;
    try { json = new TextDecoder('utf-8', { fatal: true }).decode(await pipe(unb64u(m[2]), new DecompressionStream('deflate-raw'))); } catch (e) { throw new Error('That code is damaged or cut short. Copy the whole code and try again.'); }
    if (json.length > 4e6) throw new Error('That code is too long to be a map.');
    let o; try { o = JSON.parse(json); } catch (e) { throw new Error('That code is damaged or cut short. Copy the whole code and try again.'); }
    return M.validate(o);
  };
  M.toFile = (def) => JSON.stringify({ format: 'idmap', map: M.pack(def) });
  M.fromFile = function (text) {
    if (typeof text !== 'string' || text.length > 4e6) throw new Error('That file is too large to be a map.');
    let o; try { o = JSON.parse(text); } catch (e) { throw new Error('That file is not a map (.idmap).'); }
    if (!o || o.format !== 'idmap') throw new Error('That file is not a map (.idmap).');
    return M.validate(o.map);
  };
})();
