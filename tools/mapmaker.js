/* Self-check for custom maps, map codes and country customization (js/sim/maps.js, js/sim/custom.js).
   Builds every preset, round-trips it through a code and a file and checks the rebuilt world is identical, feeds in
   damaged and hostile codes, plays 20 years headless on each preset, loads a save from before the key split, and
   measures code lengths. Exits non-zero on failure.   node tools/mapmaker.js [--years 20] */
'use strict';
const ID = require('./load.js');
const M = ID.Maps, Cu = ID.Custom;
let fails = 0;
const ok = (c, msg) => { if (!c) { fails++; console.log('FAIL ' + msg); } else console.log('ok   ' + msg); };
const YEARS = +(process.argv[process.argv.indexOf('--years') + 1] || 20) || 20;
const same = (A, B) => {
  if (A.N !== B.N || A.W !== B.W) return 'size';
  for (let i = 0; i < A.N; i++) if (A.owner[i] !== B.owner[i] || A.prov[i] !== B.prov[i] || A.terrain[i] !== B.terrain[i]) return 'tile ' + i;
  const ca = A.nations.map((n) => n && n.capital + n.key).join(), cb = B.nations.map((n) => n && n.capital + n.key).join();
  return ca === cb ? '' : 'capitals';
};
const rejects = async (code, why) => { try { await M.decode(code); ok(false, 'refused: ' + why); } catch (e) { ok(e instanceof Error && e.message.length > 10, 'refused: ' + why + ' → “' + e.message + '”'); } };

(async () => {
  ok(Cu.selfTest(), 'customization: markup, bad flags and bad colours are refused');

  /* ---------------------------------------------------------------- presets: code and file round trips */
  for (const P of M.PRESETS) {
    const def = M.preset(P.id), G = M.build(def);
    ok(ID.alive(G).length === def.nations.length, P.id + ': every state is placed (' + def.nations.length + ')');
    const code = await M.encode(def), d2 = await M.decode(code), G2 = M.build(d2);
    const s1 = same(G, G2); ok(!s1, P.id + ': a code rebuilds the same world (' + code.length + ' characters)' + (s1 ? ' — differs at ' + s1 : ''));
    const d3 = M.fromFile(M.toFile(def)), s2 = same(G, M.build(d3)); ok(!s2, P.id + ': a file rebuilds the same world' + (s2 ? ' — differs at ' + s2 : ''));
    const errs = M.check(def, G).filter((c) => c.lvl === 'err'); ok(!errs.length, P.id + ': no errors in the checks' + (errs.length ? ' — ' + errs[0].text : ''));
  }

  /* ---------------------------------------------------------------- painted terrain and customization survive a code */
  {
    const def = M.preset('pangaea'), W = ID.MAP_SIZES.std.W;
    const base = ID.genMap(Object.assign(ID.mapOpts(def, def.seed, def.size), { paint: null })), now = base.terrain.slice();
    for (let x = 10; x < 60; x++) now[20 * W + x] = ID.T.MOUNTAIN; // a painted ridge
    for (let i = 5000; i < 5040; i++) now[i] = ID.T.SEA;
    def.paint = M.diff(base.terrain, now);
    ok(def.paint.length <= 3, 'painted terrain is stored as a few runs (' + def.paint.length + '), not the grid');
    Object.assign(def.nations[0], { base: 'Bobland', adj: 'Boblandish', full: 'Free State of Bobland', cap: 'Bobton', leader: 'Ada Bob', color: [200, 40, 30], flag: { p: 'cross', a: '#123456', b: '#ebe2cc', e: 'star' }, motto: 'Bob wills it.' });
    const d2 = await M.decode(await M.encode(def)), G = M.build(d2), n = ID.byBase(G, def.nations[0].key);
    let painted = true; for (let x = 10; x < 60; x++) if (G.terrain[20 * W + x] !== ID.T.MOUNTAIN) painted = false;
    ok(painted, 'painted mountains are in the rebuilt world');
    ok(n.name === 'Free State of Bobland' && n.leader.name === 'Ada Bob' && n.cust.flag.p === 'cross' && n.color[0] === 200 && G.provinces[n.cust.capP].name === 'Bobton', 'a state’s customization comes through a code');
  }

  /* ---------------------------------------------------------------- the scenario maker: exact borders, local edits, buildings, options */
  {
    const def = M.preset('rivals'), sz = ID.MAP_SIZES[def.size], W = sz.W, N = W * sz.H;
    const G0 = M.build(def), cap0 = ID.byBase(G0, def.nations[0].key).capital;
    // paint a 30×20 block of land around the first state's capital for the second state, and a block of nobody's land
    const own = new Uint8Array(N), x0 = cap0 % W - 15, y0 = ((cap0 / W) | 0) - 10;
    for (let y = y0; y < y0 + 20; y++) for (let x = x0; x < x0 + 30; x++) if (G0.terrain[y * W + x] !== ID.T.SEA) own[y * W + x] = 2;
    const c2 = ID.byBase(G0, def.nations[5].key).capital;
    for (let y = ((c2 / W) | 0) + 6; y < ((c2 / W) | 0) + 12; y++) for (let x = c2 % W - 4; x < c2 % W + 4; x++) if (G0.terrain[y * W + x] !== ID.T.SEA) own[y * W + x] = 255;
    def.own = M.diff(new Uint8Array(N), own);
    def.blds = [[cap0 + 40, ID.B.FACTORY], [cap0 + 41, ID.B.FORT]].filter((b) => G0.terrain[b[0]] !== ID.T.SEA);
    Object.assign(def.nations[2], { gold: 777, stab: 33, bloc: 1 }); Object.assign(def.nations[3], { bloc: 1 }); Object.assign(def.nations[4], { over: def.nations[2].key, dep: 'protectorate' });
    def.year = 1925;
    const d2 = await M.decode(await M.encode(def)), G = M.build(d2), s2 = same(G, M.build(def));
    ok(!s2, 'a painted scenario (borders, buildings, options) round-trips through a code' + (s2 ? ' — differs at ' + s2 : ''));
    const b = ID.byBase(G, def.nations[1].key);
    let wrong = 0, nob = 0, tot = 0; for (let i = 0; i < N; i++) { if (own[i] === 2 && G.terrain[i] !== ID.T.SEA) { tot++; if (G.owner[i] !== b.id) wrong++; } if (own[i] === 255 && G.terrain[i] !== ID.T.SEA && G.owner[i]) nob++; }
    ok(tot > 100 && !wrong, 'every painted tile has the painted owner (' + tot + ' tiles, ' + wrong + ' wrong)');
    ok(!nob, 'land painted for nobody starts unowned');
    let cross = 0; for (let i = 0; i < N; i++) if (G.terrain[i] !== ID.T.SEA && G.provinces[G.prov[i]].center >= 0 && (own[i] === 2) !== (own[G.provinces[G.prov[i]].center] === 2)) cross++;
    ok(!cross, 'no province crosses a painted border');
    const a = ID.byBase(G, def.nations[0].key);
    ok(a && a.alive && G.owner[a.capital] === a.id, 'a capital painted over for another state moves out of that land');
    const n2 = ID.byBase(G, def.nations[2].key), n3 = ID.byBase(G, def.nations[3].key), n4 = ID.byBase(G, def.nations[4].key);
    ok(n2.gold === 777 && Math.round(n2.stab) === 33, 'a state starts with the treasury and stability set for it');
    ok(n2.bloc && n2.bloc === n3.bloc, 'two states in one alliance start in one bloc');
    ok(n4.dep && n4.dep.over === n2.id && n4.dep.kind === 'protectorate', 'a dependency starts bound to its overlord');
    ok(ID.yearOf(G.tick) === 1925, 'the scenario starts in its year (1925)');
    ok(d2.blds.every(([i, t]) => G.bld[i] === t), 'buildings placed by hand stand where they were placed');
    const G3 = M.build(Object.assign({}, d2, { autoBld: false, grow: false }));
    let fac = 0; for (const i of G3.blist) if (G3.bld[i] === ID.B.FACTORY) fac++;
    ok(fac === d2.blds.filter((x) => x[1] === ID.B.FACTORY).length, 'with automatic buildings off, only the placed factories exist (' + fac + ')');
    let ownedU = 0, ownedP = 0; for (let i = 0; i < N; i++) if (G3.terrain[i] !== ID.T.SEA && G3.owner[i]) { if (own[i]) ownedP++; else ownedU++; }
    const capProvs = ID.alive(G3).reduce((s, n) => s + G3.provinces[G3.prov[n.capital]].tiles, 0);
    ok(ownedU <= capProvs, 'with growth off, unpainted land is owned only in the capitals’ provinces (' + ownedU + ' ≤ ' + capProvs + ')');
    // a local edit stays local: sink 40 tiles of coast in one corner and compare the rest of the world
    const def5 = M.preset('pangaea'), G5 = M.build(def5), W5 = G5.W; let k0 = -1;
    for (let i = 0; i < G5.N && k0 < 0; i++) if (G5.coast[i] && (i % W5) < W5 / 3 && ((i / W5) | 0) < G5.H / 3) k0 = i;
    const sea = new Uint8Array(G5.N); sea.set(G5.terrain); for (let dy = 0; dy < 5; dy++) for (let dx = 0; dx < 8; dx++) sea[k0 + dy * W5 + dx] = ID.T.SEA;
    const base5 = ID.genMap(Object.assign(ID.mapOpts(def5, def5.seed, def5.size), { paint: null })).terrain;
    const G6 = M.build(Object.assign({}, def5, { paint: M.diff(base5, sea) }));
    let far = 0, farProv = 0, land = 0; const kx = k0 % W5, ky = (k0 / W5) | 0;
    for (let i = 0; i < G5.N; i++) { if (G5.terrain[i] === ID.T.SEA || Math.hypot(i % W5 - kx, ((i / W5) | 0) - ky) < 40) continue; land++; if (G5.terrain[i] !== G6.terrain[i] || G5.river[i] !== G6.river[i]) far++; if ((G5.prov[i] === G5.prov[i + 1]) !== (G6.prov[i] === G6.prov[i + 1])) farProv++; }
    ok(!far && !farProv, 'painting 40 tiles changes no terrain, river or province more than 40 tiles away (' + far + ' terrain, ' + farProv + ' province edges of ' + land + ')');
  }

  /* ---------------------------------------------------------------- damaged and hostile input */
  {
    const good = await M.encode(M.preset('rivals'));
    await rejects('', 'an empty paste');
    await rejects('hello world', 'not a code');
    await rejects(good.slice(0, good.length - 30), 'a code cut short');
    await rejects(good.slice(0, 5) + 'AAAA' + good.slice(9), 'a code with damaged bytes');
    await rejects('IDM7-' + good.slice(5), 'a code from a newer format');
    const enc = async (o) => M.PREFIX + Buffer.from(await new Response(new Blob([JSON.stringify(o)]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer()).toString('base64url');
    const ok2 = M.pack(M.preset('rivals'));
    await rejects(await enc(Object.assign({}, ok2, { nations: ok2.nations.slice(0, 1) })), 'one state');
    await rejects(await enc(Object.assign({}, ok2, { nations: Array.from({ length: 41 }, (_, k) => Object.assign({}, ok2.nations[0], { key: 'N' + k })) })), 'too many states');
    await rejects(await enc(Object.assign({}, ok2, { size: 'galactic' })), 'an unknown size');
    await rejects(await enc(Object.assign({}, ok2, { blobs: [[0.5, 0.5, 9]] })), 'a continent out of range');
    await rejects(await enc(Object.assign({}, ok2, { paint: [[0, 1e9, 1]] })), 'paint off the map');
    await rejects(await enc(Object.assign({}, ok2, { nations: ok2.nations.map((d, k) => (k ? d : Object.assign({}, d, { ideo: 'evil' }))) })), 'an unknown system');
    await rejects(await enc(Object.assign({}, ok2, { mg: 99 })), 'a newer map generator');
    await rejects(await enc([1, 2, 3]), 'an array instead of a map');
    // hostile text and images are cleaned, not refused
    const evil = Object.assign({}, ok2, { name: '<script>alert(1)</script>', nations: ok2.nations.map((d, k) => (k ? d : Object.assign({}, d, { base: '<img src=x onerror=alert(1)>', motto: '"><svg onload=alert(1)>', flag: { img: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=' }, color: [999, 0, 0], extra: 'eval(1)' }))) });
    const d = await M.decode(await enc(evil)), n0 = d.nations[0];
    ok(!/[<>"]/.test(d.name + n0.base + (n0.motto || '')), 'names and mottos from a code carry no markup (“' + n0.base + '”)');
    ok(!n0.flag && !n0.color && !('extra' in n0), 'an SVG flag, a bad colour and unknown fields are dropped');
    const png = await enc(Object.assign({}, ok2, { nations: ok2.nations.map((x, k) => (k ? x : Object.assign({}, x, { flag: { img: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==' } }))) }));
    ok((await M.decode(png)).nations[0].flag.img.startsWith('data:image/png'), 'a PNG flag is kept');
    let threw = false; try { M.fromFile('{"format":"idmap","map":{"size":"std"}}'); } catch (e) { threw = true; } ok(threw, 'a broken file is refused');
  }

  /* ---------------------------------------------------------------- a campaign on every preset, with a save in the middle */
  for (const P of M.PRESETS) {
    const G = M.build(M.preset(P.id), { headless: true });
    ID.Game.observe(G, ID.alive(G)[0].id); // observer mode never ends, so a conquered first state does not stop the run
    let err = '';
    try {
      for (let d = 0; d < 360 * YEARS / 2; d++) ID.Game.tick(G);
      const G2 = ID.Game.load(ID.Game.save(G)); G2.headless = true;
      for (let d = 0; d < 360 * YEARS / 2 && !G2.over; d++) ID.Game.tick(G2);
      ok(G2.scenario === 'custom' && ID.yearOf(G2.tick) >= 1910 + YEARS - 1, P.id + ': ' + YEARS + ' years headless with a save and load halfway (' + ID.alive(G2).length + ' states left)');
    } catch (e) { err = e.stack; ok(false, P.id + ': campaign crashed: ' + err); }
  }

  /* ---------------------------------------------------------------- the Enormous size as a random world */
  {
    const G = ID.newGame({ scenario: 'random', seed: 77, size: 'huge', headless: true }); ID.Game.observe(G, ID.alive(G)[0].id);
    for (let d = 0; d < 360 * 5; d++) ID.Game.tick(G);
    const L = ID.Game.load(ID.Game.save(G)); let s = true; for (let i = 0; i < G.N; i++) if (L.owner[i] !== G.owner[i]) { s = false; break; }
    ok(G.W === 640 && ID.alive(G).length >= 20 && s, 'an Enormous random world (640×360, ' + ID.MAP_SIZES.huge.nations + ' states) runs five years and saves and loads');
  }

  /* ---------------------------------------------------------------- a save from before the key split */
  {
    const G = ID.newGame({ scenario: 'meridia', headless: true, historical: true });
    ID.setPlayer(G, ID.byBase(G, 'Aurelia').id);
    for (let d = 0; d < 400; d++) ID.Game.tick(G);
    const o = JSON.parse(ID.Game.save(G)); for (const n of o.nations) if (n) { delete n.key; delete n.cust; } delete o.map;
    const L = ID.Game.load(JSON.stringify(o)), a = ID.byBase(L, 'Aurelia');
    ok(a && a.key === 'Aurelia' && a.tree === 'Aurelia' && ID.identityOf(L, a).anthem === ID.IDENTITY.Aurelia.anthem, 'an old save loads: keys come from the names, trees and identity still work');
    for (let d = 0; d < 360; d++) ID.Game.tick(L);
    ok(true, 'and runs on a year');
  }

  /* ---------------------------------------------------------------- a renamed country keeps its content */
  {
    const G = ID.newGame({ scenario: 'meridia', headless: true, custom: { Aurelia: { base: 'Bob', adj: 'Bobbish' } } });
    const n = ID.byBase(G, 'Aurelia'), f = ID.Focus.def('au_d_commonwealth');
    ok(n.base === 'Bob' && n.tree === 'Aurelia' && /Bob/.test(ID.identityOf(G, n).lore) && !/Aurelia/.test(ID.identityOf(G, n).lore), 'a renamed Aurelia keeps its tree and its lore reads “Bob”');
    ok(ID.Focus.nm(f, n) === 'The Bobbish Commonwealth', 'its destinies read “Bobbish” (' + ID.Focus.nm(f, n) + ')');
    const G0 = ID.newGame({ scenario: 'meridia', headless: true });
    ok(!same(G0, ID.newGame({ scenario: 'meridia', headless: true, custom: {} })), 'no customization rebuilds history exactly');
  }

  /* ---------------------------------------------------------------- code lengths */
  {
    const def = M.preset('meridia'), bare = await M.encode(def);
    const rnd = (n) => { let s = ''; const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'; for (let i = 0; i < n; i++) s += A[(Math.random() * 64) | 0]; return s; };
    for (let k = 0; k < 3; k++) def.nations[k].flag = { img: 'data:image/webp;base64,' + rnd(1500) }; // a 60×40 WebP flag is about 1.1 KB (1500 base64 characters)
    const three = await M.encode(def), lite = await M.encode(def, true);
    console.log('     code length, Three Continents: ' + bare.length + ' characters; with three uploaded flags ' + three.length + '; with them left out ' + lite.length);
    ok(lite === bare, 'leaving uploaded flags out gives the code without them');
  }

  console.log(fails ? fails + ' FAILED' : 'all passed');
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
