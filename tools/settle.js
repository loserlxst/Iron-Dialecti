/* Settling empty land by sea: how much of the unclaimed land is taken by 1925, 1940 and 1960, by whom, and
   whether it feeds one power too much.
   node tools/settle.js [--runs 8 --years 50]    (the self-check runs first when the game has C.settle) */
'use strict';
const ID = require('./load.js');
const C = ID.Combat;
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i >= 0 ? process.argv[i + 1] : d; };
const runs = +arg('runs', 8), years = +arg('years', 50);
let fails = 0; const ok = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) fails++; };
/* Islands: unclaimed land that no state can reach by land at the start (a flood over land from every owned tile). */
function islandsOf(G) {
  const W = G.W, seen = new Uint8Array(G.N), st = [];
  for (let i = 0; i < G.N; i++) if (G.owner[i]) { seen[i] = 1; st.push(i); }
  while (st.length) { const c = st.pop(), x = c % W; for (const q of [x > 0 ? c - 1 : -1, x < W - 1 ? c + 1 : -1, c - W, c + W]) if (q >= 0 && q < G.N && !seen[q] && G.terrain[q] !== ID.T.SEA) { seen[q] = 1; st.push(q); } }
  const out = []; for (let i = 0; i < G.N; i++) if (!seen[i] && G.terrain[i] !== ID.T.SEA) out.push(i);
  return out;
}
const unclaimed = (G) => { let k = 0; for (let i = 0; i < G.N; i++) if (!G.owner[i] && G.terrain[i] !== ID.T.SEA) k++; return k; };

if (C.settle && !process.argv.includes('--nocheck')) {
  console.log('== self-check ==');
  let G = null, n = null, t = -1;
  for (let s = 1; s < 30 && t < 0; s++) {
    G = ID.newGame({ seed: s, size: 'std', scenario: 'random', headless: true, difficulty: 'iron' });
    for (const x of ID.alive(G)) { if (!x.nb[ID.B.PORT]) continue; const b = C.bestSettle(G, x); if (b >= 0) { n = x; t = b; break; } }
  }
  ok(t >= 0, 'a state with a port finds an empty island to settle');
  if (t >= 0) {
    ID.setPlayer(G, n.id); G.headless = true;
    const cost = C.settleCost(G, n, t);
    ok(typeof cost === 'object' && cost.gold > 0 && cost.days > 0, 'the expedition has a cost and a travel time (' + JSON.stringify(cost && { gold: cost.gold, troops: Math.round(cost.troops), days: cost.days }) + ')');
    n.gold = 1000; n.troops = Math.max(n.troops, 200);
    const g0 = n.gold, tr0 = n.troops, bt = C.settle(G, n, t);
    ok(bt && typeof bt !== 'string' && G.boats.indexOf(bt) >= 0 && n.gold < g0 && n.troops < tr0, 'the expedition sails as a boat and costs gold and troops');
    for (let d = 0; d < cost.days + 3; d++) { G.tick++; C.tick(G); }
    ok(G.owner[t] === n.id, 'it founds a beachhead on the island');
    const a = G.attacks.find((x) => x.from === n.id && x.to === 0 && x.pk >= 0);
    ok(!!a, 'the colony expands from there as an expansion of its own');
    const k0 = n.tiles; for (let d = 0; d < 120; d++) { G.tick++; C.tick(G); }
    ok(n.tiles > k0, 'the colony grows (' + k0 + ' → ' + n.tiles + ' tiles)');
    C.updateSupply(G);
    const c = G._comps[G._comp[t]];
    ok(c && c.st === 2, 'in peace the colony is supplied over its own shore');
    const G2 = ID.Game.load(ID.Game.save(G)); ok(G2.owner[t] === n.id, 'a save keeps it');
  }
  console.log(fails ? fails + ' FAILED\n' : 'self-check passed\n');
}

console.log('== soak: ' + runs + ' worlds × ' + years + ' years ==');
const share = { 1915: [], 1920: [], 1925: [], 1940: [], 1960: [] }, top = [], by = {}; let exps = 0;
for (let r = 0; r < runs; r++) {
  const G = ID.newGame({ seed: 5 + r * 7919, size: 'std', scenario: r % 2 ? 'meridia' : 'random', headless: true, difficulty: 'iron' });
  G.rng.s = (31 + r * 977) >>> 0;
  const isl = islandsOf(G), u0 = isl.length, st = C.settle;
  if (st) C.settle = function (GG, nn, tt) { const b = st.apply(this, arguments); if (b && typeof b !== 'string') { exps++; by[nn.ideo] = (by[nn.ideo] || 0) + 1; } return b; };
  const line = [];
  while (G.tick < years * 360 && !G.over) {
    ID.Game.tick(G);
    if (G.tick % 360 === 0) { const y = ID.yearOf(G.tick); if (share[y]) { let left = 0; for (const i of isl) if (!G.owner[i]) left++; const v = 1 - left / Math.max(1, u0); share[y].push(v); line.push(y + ' ' + Math.round(v * 100) + '%'); } }
  }
  if (st) C.settle = st;
  let big = null; for (const n of ID.alive(G)) if (!big || n.tiles > big.tiles) big = n;
  top.push(big.tiles / G.landCount);
  console.log('run ' + r + ' ' + G.scenario + ': islands (unclaimed land no state reaches by land) ' + Math.round(u0 / G.landCount * 100) + '% of land; settled ' + line.join(', ') + ' | largest state ' + Math.round(big.tiles / G.landCount * 100) + '%');
}
const avg = (a) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0);
console.log('share of the islands settled: 1915 ' + Math.round(avg(share[1915]) * 100) + '%, 1920 ' + Math.round(avg(share[1920]) * 100) + '%, 1925 ' + Math.round(avg(share[1925]) * 100) + '%, 1940 ' + Math.round(avg(share[1940]) * 100) + '%, 1960 ' + Math.round(avg(share[1960]) * 100) + '% | largest state ' + Math.round(avg(top) * 100) + '% (max ' + Math.round(Math.max(...top) * 100) + '%)');
if (C.settle) console.log('expeditions: ' + exps + ' (' + (exps / runs).toFixed(1) + ' a world) by system: ' + JSON.stringify(by));
process.exit(fails ? 1 : 0);
