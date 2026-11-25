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
    await rejects(await enc(Object.assign({}, ok2, { size: 'huge' })), 'an unknown size');
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
