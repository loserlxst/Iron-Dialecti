/* Encirclement self-check and soak.
   node tools/encircle.js            self-check: a landing, its sea lift, cutting it off, surrender; an ageing beach
   node tools/encircle.js --soak 4   plus AI campaigns (Three Continents and random): landings, pockets, surrenders */
'use strict';
const ID = require('./load.js');
const C = ID.Combat;
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i >= 0 ? process.argv[i + 1] : d; };
let fails = 0;
const ok = (c, msg) => { console.log((c ? '  ok   ' : '  FAIL ') + msg); if (!c) fails++; };

/* A world and two states at war that do not touch, the attacker with a port in range of the defender's coast. */
function setup(seed) {
  for (let s = seed; s < seed + 40; s++) {
    const G = ID.newGame({ seed: s, size: 'std', scenario: 'random', headless: true, difficulty: 'iron' });
    const L = ID.alive(G).filter((n) => n.nb[ID.B.PORT]);
    for (const A of L) for (const D of ID.alive(G)) {
      if (A === D || ID.borders(G, A.id, D.id) || D.tiles < 600) continue;
      const t = C.bestLanding(G, A, D, false); if (t < 0) continue;
      ID.Diplomacy.declare(G, A, D);
      if (!ID.atWar(G, A.id, D.id)) continue;
      return { G, A, D, t };
    }
  }
  throw new Error('no landing pair found');
}
/* Run only the fighting (fronts, boats, supply): the rest of the world holds still. */
const run = (G, days) => { for (let d = 0; d < days; d++) { G.tick++; C.tick(G); } };
const pocketOf = (G, A, D) => G.attacks.find((a) => a.from === A.id && a.to === D.id && a.pk >= 0);

function selfCheck() {
  console.log('== self-check ==');
  const { G, A, D, t } = setup(+arg('seed', 11));
  A.troops = 300; D.troops = 120;
  const bt = C.launchBoat(G, A, t, 120, 'advance');
  ok(typeof bt !== 'string', 'the landing sails (' + (typeof bt === 'string' ? bt : bt.path.length + ' tiles') + ')');
  run(G, 80);
  let p = pocketOf(G, A, D);
  ok(!!p, 'the landing is a pocket attack of its own' + (p ? ' (' + ID.fmtPop(p.troops) + ', ' + p.taken + ' tiles taken)' : ''));
  if (!p) return;
  const info = C.pocketInfo(G, p);
  ok(info && !info.enc && info.sea === 'beach', 'supplied over its beach (' + JSON.stringify(info && { sea: info.sea, beachLeft: info.beachLeft }) + ')');
  ok(!G.attacks.some((a) => a.from === A.id && a.to === D.id && !(a.pk >= 0) && a.heap.size), 'no main-army front against the defender');

  // the sea lift: a big reinforcement only sends what the lift carries
  const cap = C.liftCap(G, A, D.id, p.ck), pool0 = A.troops;
  const r = C.launch(G, A.id, D.id, 150, 'advance');
  ok(r && r.relief === D.id, 'reinforcing with no land front sends a convoy');
  const sent = pool0 - A.troops;
  ok(sent <= cap * 30 + 0.01 && sent < 150, 'the convoy carries at most a month of lift (' + sent.toFixed(1) + ' of 150 asked, lift ' + cap.toFixed(2) + '/day)');
  const r2 = C.launch(G, A.id, D.id, 150, 'advance');
  ok(typeof r2 === 'string' || r2.troops < 2, 'a second convoy at once gets little or nothing (' + (typeof r2 === 'string' ? r2 : r2.troops.toFixed(1)) + ')');
  const before = p.troops; run(G, 40); p = pocketOf(G, A, D);
  ok(p && p.troops + p.taken * 0.05 > before * 0.5, 'the convoy arrives in the pocket');

  // let it grow inland (beach kept fresh), then cut it off: the defender takes every coastal tile of the pocket
  for (let k = 0; k < 12 && p && p.taken < 60; k++) { for (const b of G.beach) if (b.o === A.id) b.t = G.tick; D.troops = Math.min(D.troops, 60); p.troops = Math.max(p.troops, 80); run(G, 10); p = pocketOf(G, A, D); }
  ok(p && p.taken >= 20, 'the pocket pushes inland (' + (p ? p.taken : 0) + ' tiles)');
  if (!p) return;
  const takeCoast = () => { let k = 0; for (let i = 0; i < G.N; i++) if (G.owner[i] === A.id && G.coast[i] && G._comp[i] === p.ck) { ID.setOwner(G, i, D.id); k++; } return k; };
  let took = 0; for (let k = 0, g = 1; k < 6 && p && g; k++) { g = takeCoast(); took += g; C.updateSupply(G); p = pocketOf(G, A, D); }
  ok(took > 0, 'the defender retakes the coast (' + took + ' tiles)');
  if (!p) { ok(false, 'the pocket survived the loss of its coast'); return; }
  ok(!!p.enc, 'the pocket is encircled (why: ' + (C.pocketInfo(G, p) || {}).why + ')');
  const tr0 = p.troops, tk0 = p.taken, d0 = C.pocketInfo(G, p).days;
  const r3 = C.launch(G, A.id, D.id, 100, 'advance');
  ok(typeof r3 === 'string', 'no reinforcement reaches it (' + r3 + ')');
  run(G, 9);
  p = pocketOf(G, A, D);
  if (p) {
    ok(p.troops < tr0, 'it loses strength every day (' + tr0.toFixed(1) + ' → ' + p.troops.toFixed(1) + ')');
    ok(p.taken - tk0 <= 12, 'it barely advances (' + (p.taken - tk0) + ' tiles in 9 days, only toward home)');
  }
  const pris0 = D.cnt.prisoners || 0, glory0 = D.glory;
  run(G, d0 + 30);
  ok(!pocketOf(G, A, D), 'it surrenders within the countdown (' + d0 + ' days)');
  ok((D.cnt.prisoners || 0) > pris0, 'the defender takes prisoners (' + ID.fmtPop((D.cnt.prisoners || 0) - pris0) + '), glory ' + glory0.toFixed(1) + ' → ' + D.glory.toFixed(1));
  const held = (G.pow || {})[D.id + ':' + A.id] || 0, tr1 = A.troops;
  ID.Diplomacy.peace(G, A, D);
  ok(held > 0 && Math.abs(A.troops - tr1 - held * 0.6) < 0.01 && !(G.pow || {})[D.id + ':' + A.id], 'at the peace six in ten prisoners come home (' + ID.fmtPop(held * 0.6) + ')');

  // an ageing beach: held, but without a port it stops carrying the pocket after C.BEACH_DAYS
  const s2 = setup(+arg('seed', 11) + 3), G2 = s2.G;
  s2.A.troops = 300; s2.D.troops = 15;
  const b2 = C.launchBoat(G2, s2.A, s2.t, 120, 'advance'); run(G2, Math.ceil(b2.path.length / 2) + 4);
  const q = pocketOf(G2, s2.A, s2.D);
  if (!q) { ok(false, 'second landing ashore'); return; }
  G2.tick += C.BEACH_DAYS + 5; // the beach has now been held that long
  for (let i = 0; i < G2.N; i++) if (G2.owner[i] === s2.A.id && G2._comp[i] === q.ck && G2.bld[i] === ID.B.PORT) G2.bld[i] = 0;
  C.updateSupply(G2);
  const qi = C.pocketInfo(G2, q);
  ok(qi && qi.enc && qi.why === 'beach', 'a beach held ' + C.BEACH_DAYS + '+ days with no port no longer supplies (' + (qi && qi.why) + ')');

  // save and load keep the pocket
  const G3 = ID.Game.load(ID.Game.save(G2)); G3.headless = true;
  const q3 = G3.attacks.find((a) => a.id === q.id);
  ok(q3 && q3.pk >= 0 && q3.enc, 'a save round trip keeps the pocket and its encirclement');
}

function soak(runs) {
  console.log('\n== soak: ' + runs + ' campaigns × 40 years ==');
  const tot = { landings: 0, pockets: 0, big: 0, joined: 0, surrender: 0, enc: 0, relief: 0 };
  for (let r = 0; r < runs; r++) {
    const scen = r % 2 ? 'random' : 'meridia', G = ID.newGame({ seed: 3 + r * 7919, size: 'std', scenario: scen, headless: true, difficulty: 'iron' });
    G.rng.s = (77 + r * 131) >>> 0;
    const seen = {}, s = { landings: 0, pockets: 0, big: 0, joined: 0, surrender: 0, enc: 0, relief: 0 };
    const lb = C.launchBoat, rl = C.relief, nw = ID.news;
    C.launchBoat = function (...x) { const b = lb.apply(this, x); if (typeof b !== 'string') s.landings++; return b; };
    C.relief = function (...x) { const b = rl.apply(this, x); if (typeof b !== 'string') s.relief++; return b; };
    ID.news = function (GG, t, ...rest) { if (/^Encircled: /.test(t)) s.surrender++; return nw.call(this, GG, t, ...rest); };
    while (G.tick < 360 * 40 && !G.over) {
      ID.Game.tick(G);
      if (G.tick % 10 === 1) {
        const live = {};
        for (const a of G.attacks) if (a.to && a.pk >= 0) { live[a.id] = 1; const v = seen[a.id] || (seen[a.id] = { max: 0, enc: 0 }); v.max = Math.max(v.max, a.taken); if (a.enc) v.enc = 1; }
        for (const a of G.attacks) if (a.to && !(a.pk >= 0) && seen[a.id] && !seen[a.id].done) { seen[a.id].done = 1; s.joined++; }
        for (const k in seen) if (!live[k] && !seen[k].gone) { seen[k].gone = 1; if (G.attacks.some((a) => a.id === +k)) { s.joined++; } }
      }
    }
    C.launchBoat = lb; C.relief = rl; ID.news = nw;
    for (const k in seen) { s.pockets++; if (seen[k].max >= 30) s.big++; if (seen[k].enc) s.enc++; }
    console.log('run ' + r + ' ' + scen + ': ' + JSON.stringify(s));
    for (const k in s) tot[k] += s[k];
  }
  console.log('total: ' + JSON.stringify(tot) + ' (big = a landing that took 30+ tiles; joined = a pocket that reached its own lines)');
  if (tot.landings) ok(tot.big > 0, 'some naval invasions still succeed');
}

selfCheck();
if (process.argv.includes('--soak')) soak(+arg('soak', 4));
console.log(fails ? '\n' + fails + ' FAILED' : '\nall ok');
process.exit(fails ? 1 : 0);
