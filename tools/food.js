/* Headless food measurement: how often countries starve, and whether cities pay for themselves.
   node tools/food.js [--runs 4] [--years 40]
   Reports the share of country-months in famine, the share with any shortage, how long famines last,
   and famine share split by how many cities a country has per 100 tiles. */
'use strict';
const ID = require('./load.js');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i >= 0 ? process.argv[i + 1] : d; };
const runs = +arg('runs', 4), years = +arg('years', 40);
const pct = (a, b) => (b ? Math.round((a / b) * 1000) / 10 : 0) + '%';

/* self-check: a lost harvest empties the granaries first, famine follows only when they are dry, nobody grows meanwhile */
{
  let fails = 0; const ok = (c, msg) => { if (!c) fails++; console.log((c ? 'ok   ' : 'FAIL ') + msg); };
  const G = ID.newGame({ scenario: 'meridia', headless: true, difficulty: 'iron', historical: false, seed: 7 });
  const n = ID.alive(G).sort((a, b) => b.tiles - a.tiles)[0], E = ID.Economy;
  n.laws.trade = 'autarky'; // no grain imports, so only the granaries stand between the harvest and famine
  ID.Game.tick(G); while (G.tick % 30) ID.Game.tick(G);
  const h0 = E.harvest(n);
  ok(n.grain > 0 && !n.famine, 'a country starts with grain in store (' + n.grain.toFixed(1) + ' months)');
  const g0 = n.grain; const cut = (n.foodLand *= 0.7 / h0); // a lost harvest: 70% of need, held there even if the country conquers farmland meanwhile
  let first = -1, grainAtFamine = -1, pop0 = n.pop, grew = false;
  for (let m = 1; m <= 36 && first < 0; m++) {
    for (let d = 0; d < 30; d++) { ID.Game.tick(G); n.foodLand = cut; if (m > 1 && n.pop > pop0 + 1e-6) grew = true; pop0 = n.pop; }
    if (n.famine && first < 0) { first = m; grainAtFamine = n.grain; }
  }
  ok(first > 1, 'the stores hold off famine for ' + first + ' months after a bad harvest (70% of need)');
  ok(grainAtFamine < 0.01, 'famine starts only once the granaries are empty');
  ok(!grew, 'population does not grow while the harvest is short (from the first monthly harvest on)');
  ok(E.harvest(n) < h0 && g0 > 0, 'harvest fell from ' + Math.round(h0 * 100) + '% to ' + Math.round(E.harvest(n) * 100) + '%');

  /* The grain year: each policy wins somewhere. One state, one save, the weather forced; only the policy differs. */
  const base = ID.Game.save((() => { const G0 = ID.newGame({ scenario: 'random', headless: true, difficulty: 'iron', seed: 23 }); for (let d = 0; d < 360 * 2; d++) ID.Game.tick(G0); return G0; })());
  const G1 = ID.Game.load(base), id = ID.alive(G1).filter((x) => !x.nwars && x.laws.trade !== 'autarky' && (x.a.routes || []).some((r) => r.border || r.sea)).sort((a, b) => b.tiles - a.tiles)[0].id;
  // runs `months` months of one state's harvest, economy and population for policy `pol` while the rest of the world
  // holds still (no wars or conquests to blur it); wx(n, m) gives each state's weather; prep(G, n) sets the scene
  const play = (pol, months, wx, prep) => {
    const G = ID.Game.load(base); G.headless = true; const n = G.nations[id];
    let fam = 0; const g0 = n.gold - n.debt, sold = { v: 0 };
    const weather = (m) => { let s = 0, k = 0; for (const x of ID.alive(G)) { const w = wx(x, m); x.wx = { cur: w, next: w, last: w }; s += E.wxOf(w).m; k++; } G.world.grainP = E.GRAIN_PRICE * Math.min(2, Math.max(0.6, 1 + (1 - s / k) * 5)); };
    n.grainPol = pol; weather(0); E.month(G, n); if (prep) prep(G, n);
    n.grain = E.POLICY[pol].store; // a state that has run under its policy for a while
    const p0 = n.pop;
    for (let m = 0; m < months; m++) { weather(m); n.grainPol = pol; for (let d = 0; d < 30; d++) { G.tick++; ID.Combat.tickPop(G, n); } E.month(G, n); if (n.famine) fam++; sold.v += (n.a.flow && n.a.flow['Grain sold from store']) || 0; }
    return { gold: n.gold - n.debt - g0, pop: n.pop / p0, fam, sold: sold.v, grain: n.grain };
  };
  const fair = () => 'fair';
  const A = {}; for (const p of ['export', 'feed', 'stock']) A[p] = play(p, 120, fair);
  ok(A.export.gold > A.feed.gold && A.export.gold > A.stock.gold, 'ordinary years: exporting the surplus earns the most gold (' + ['export', 'feed', 'stock'].map((p) => p + ' ' + Math.round(A[p].gold)).join(', ') + ')');
  ok(A.feed.pop > A.export.pop && A.feed.pop > A.stock.pop, 'ordinary years: feeding the people grows the population most (' + ['export', 'feed', 'stock'].map((p) => p + ' ×' + A[p].pop.toFixed(3)).join(', ') + ')');
  // a lean harvest (108% in a fair year), no imports, then a failed year and a poor one: only full granaries carry it
  const lean = (G, n) => { n.laws.trade = 'autarky'; n.foodLand *= 1.08 / Math.max(0.1, n.a.harvestAvg); };
  const hard = (x, m) => (m < 24 ? 'fair' : m < 36 ? 'failed' : m < 48 ? 'poor' : 'fair');
  const B = {}; for (const p of ['export', 'feed', 'stock']) B[p] = play(p, 60, hard, lean);
  ok(B.stock.fam === 0 && B.export.fam > 0, 'a failed and a poor year without imports: stock starves ' + B.stock.fam + ' months, feed ' + B.feed.fam + ', export ' + B.export.fam);
  // the world's harvest fails while ours is fair: full granaries sell at the high price
  const C = play('stock', 48, (x, m) => (x.id === id ? 'fair' : m < 24 ? 'fair' : 'failed'), (G, n) => { n.laws.trade = 'free'; });
  ok(C.sold > 0, 'a world famine: full granaries sell ' + Math.round(C.sold) + ' gold of grain at the high price');
  // the weather itself: forecast in March, in by September, never a failed year after a bad one, odds as in the table
  {
    const G = ID.newGame({ scenario: 'random', headless: true, difficulty: 'iron', seed: 31 }), seen = {}; let wrongMonth = 0, afterBad = 0, years = 0;
    const prev = {};
    for (let m = 0; m < 12 * 40; m++) {
      for (let d = 0; d < 30; d++) ID.Game.tick(G);
      const mo = Math.floor(G.tick / 30) % 12;
      for (const x of ID.alive(G)) {
        const w = x.wx; if (!w) continue;
        if (prev[x.id] != null && prev[x.id] !== w.cur) { if (mo !== 8) wrongMonth++; else { years++; seen[w.cur] = (seen[w.cur] || 0) + 1; if (w.cur === 'failed' && (w.last === 'poor' || w.last === 'failed')) afterBad++; } }
        else if (mo === 8 && prev[x.id] != null) { years++; seen[w.cur] = (seen[w.cur] || 0) + 1; }
        prev[x.id] = w.cur;
      }
    }
    ok(wrongMonth === 0, 'the harvest changes only in September');
    ok(afterBad === 0, 'a failed harvest never follows a poor or failed one');
    const off = E.WX.map((x) => Math.abs((seen[x.k] || 0) / years - x.p)), worst = Math.max(...off);
    ok(worst < 0.06, 'each kind of harvest comes about as often as its chance (worst gap ' + Math.round(worst * 100) + ' points over ' + years + ' harvests)');
  }
  // switching policy never throws stored grain away
  {
    const G = ID.newGame({ scenario: 'random', headless: true, difficulty: 'iron', seed: 31 }), x = ID.alive(G)[0];
    x.grainPol = 'stock'; x.grain = 12; x.grainPol = 'feed'; E.month(G, x);
    ok(x.grain > 11, 'from twelve months under stock to feed: the grain stays (' + x.grain.toFixed(1) + ' months)');
  }
  if (fails) process.exit(1);
}
let lsSum = 0, stabSum = 0, popEnd = 0, troopsEnd = 0, months = 0, famine = 0, short = 0, starts = 0, grainSum = 0;
const byCity = { low: [0, 0], mid: [0, 0], high: [0, 0] };
const spells = [];
for (let r = 0; r < runs; r++) {
  const G = ID.newGame({ seed: 11 + r * 7919, scenario: r % 2 ? 'random' : 'meridia', headless: true, difficulty: 'iron', historical: !(r % 2) });
  G.autoPlayer = true;
  const run = {};
  for (let d = 0; d < years * 360; d++) {
    ID.Game.tick(G);
    if (G.tick % 30) continue;
    for (const n of ID.alive(G)) {
      months++;
      if (n.famine) famine++;
      if (n.foodBal < 1) short++;
      grainSum += n.grain || 0; lsSum += n.ls; stabSum += n.stab;
      if (n.famine === 1) starts++;
      if (n.famine) run[n.id] = (run[n.id] || 0) + 1; else if (run[n.id]) { spells.push(run[n.id]); run[n.id] = 0; }
      const c = n.nb[ID.B.CITY] / Math.max(1, n.tiles / 100), k = c < 0.6 ? 'low' : c < 1.2 ? 'mid' : 'high';
      byCity[k][0]++; if (n.famine) byCity[k][1]++;
    }
  }
  for (const n of ID.alive(G)) { popEnd += n.pop / runs; troopsEnd += n.troops / runs; }
}
spells.sort((a, b) => a - b);
console.log('country-months', months, '| famine', pct(famine, months), '| food short', pct(short, months), '| famines started', starts,
  '| median famine', spells[spells.length >> 1] || 0, 'months | mean grain', (grainSum / months).toFixed(2), 'months | world pop', Math.round(popEnd), 'troops', Math.round(troopsEnd), '| mean ls', (lsSum / months).toFixed(1), 'stab', (stabSum / months).toFixed(1));
for (const k in byCity) console.log('  cities ' + k.padEnd(4), 'famine', pct(byCity[k][1], byCity[k][0]), 'of', byCity[k][0]);
