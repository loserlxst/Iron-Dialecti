/* Headless measurements for event variety, pacing and programme trees, and a coverage check of every
   per-ideology table.
   node tools/metrics.js events  [--runs 10] [--years 60]   random dispatches the player's country receives
   node tools/metrics.js pacing  [--runs 10] [--years 60] [--random]   war share, peace spells, wars per decade
   node tools/metrics.js human   [--runs 10] [--p 0.5]      the player's wars with a human-like proxy
   node tools/metrics.js trees                              programmes and one-playthrough years per country
   node tools/metrics.js tables                             fails if an ideology is missing from a table
   node tools/metrics.js econ    [--runs 8] [--random]      trade, output spread, equipment, damage, the bomb
   events and pacing are measured on the same runs (historical mode, the player's country played by the AI). */
'use strict';
const fs = require('fs'), path = require('path');
const ID = require('./load.js');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i >= 0 ? process.argv[i + 1] : d; };
const mode = process.argv[2] || 'events', runs = +arg('runs', 10), years = +arg('years', 60), random = process.argv.includes('--random');
const PL = ['Aurelia', 'Cassine', 'Karsova', 'Pavon', 'Lys', 'Suyan', 'Hesperia', 'Verano', 'Meridia', 'Antara', 'Khemra', 'Amaran', 'Zandar', 'Baskhar', 'Sahrem', 'Varanth', 'Tyrrha', 'Norvik', 'Ruthe', 'Irkal'];
const WW = (y) => (y >= 1914 && y < 1919) || (y >= 1939 && y < 1946);
const avg = (a) => a.reduce((s, v) => s + v, 0) / Math.max(1, a.length);
const med = (a) => { const b = a.slice().sort((x, y) => x - y); return b.length ? b[b.length >> 1] : 0; };
const pct = (v) => Math.round(v * 100) + '%';

/* ---------------------------------------------------------------- tables */
if (mode === 'tables') {
  const flagsSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'ui', 'flags.js'), 'utf8');
  const emb = /EMBLEM_OF = \{([^}]*)\}/.exec(flagsSrc)[1];
  const miss = [];
  for (const I of ID.IDEO_LIST) {
    const k = I.id, need = (ok, what) => { if (!ok) miss.push(k + ': ' + what); };
    for (const f of ['name', 'family', 'color', 'short', 'theory', 'axes', 'rivals', 'econ', 'budget', 'control', 'recruit', 'doctrine', 'fbase', 'fpow', 'legit', 'laws', 'lawDef', 'dip', 'flags', 'drift', 'objective', 'title']) need(I[f] != null, 'field ' + f);
    need(ID.FAMILIES[I.family], 'family ' + I.family);
    need(ID.leaderTitle(k) !== 'Head of State', 'leader title (names.js TITLES)');
    need(ID.START_WEIGHTS[k] != null, 'START_WEIGHTS'); need(ID.SIT_FOR[k], 'SIT_FOR');
    need(ID.DOCTRINE[k], 'doctrine (data/doctrine.js)'); need(ID.FOCUS.ideos[k], 'ideology tree (data/ideotrees.js)');
    need(ID.REGIME.body[k], 'regime body'); need(ID.REGIME.lines[k] && ID.REGIME.lines[k].length >= 3, 'regime lines');
    need(new RegExp('\\b' + k + ':').test(emb), 'emblem (ui/flags.js EMBLEM_OF)');
    for (const d of I.drift || []) need(ID.IDEOLOGIES[d.to], 'drift target ' + d.to);
    for (const r of I.rivals || []) need(ID.IDEOLOGIES[r], 'rival ' + r);
    const sw = I.econ && ID.ECON[I.econ.model]; need(sw, 'economy model ' + (I.econ && I.econ.model));
    need(ID.CONTROL[I.control.type], 'control type');
    for (const c of ID.LAW_CATS) if (c !== 'mobil') need(I.laws[c] && I.laws[c].length && I.lawDef[c], 'laws.' + c);
  }
  console.log(ID.IDEO_LIST.length + ' ideologies checked; ' + (miss.length ? miss.length + ' missing:\n  ' + miss.join('\n  ') : 'every table complete.'));
  process.exit(miss.length ? 1 : 0);
}

/* ---------------------------------------------------------------- trees */
if (mode === 'trees') {
  const P = ID.Focus.PACE.nat;
  const STRUCT = ['note2', 'war', 'ally', 'claim', 'claimsAll', 'subvert', 'subvertNb', 'op', 'flag', 'nq', 'law', 'ideology', 'build', 'techUp', 'figLoy', 'figPurge', 'figHeir', 'figLeader', 'circleLoy', 'line', 'civilwar', 'protector', 'fn', 'dep', 'oil', 'front', 'union', 'later', 'opAll', 'nbOp', 'nbTreaty'];
  // a compatible set: historical programmes first, then the rest; respects exclusions both ways and one destiny
  const path1 = (L) => {
    const done = new Set(); let dest = 0, changed = true;
    const ord = L.slice().sort((a, b) => (b.hist ? 1 : 0) - (a.hist ? 1 : 0));
    const ex = (f) => [...done].some((x) => { const g = ID.Focus.def(x); return g && (g.excl || []).indexOf(f.id) >= 0; });
    while (changed) {
      changed = false;
      for (const f of ord) {
        if (done.has(f.id) || (f.dest && dest) || (f.excl || []).some((x) => done.has(x)) || ex(f)) continue;
        if ((f.req || []).some((x) => !done.has(x)) || (f.reqAny && !f.reqAny.some((x) => done.has(x)))) continue;
        done.add(f.id); if (f.dest) dest = 1; changed = true;
      }
    }
    return [...done].map(ID.Focus.def);
  };
  console.log('country    total  path  +ideo  years  excl  flat  neighbour/story');
  const out = [];
  for (const b of Object.keys(ID.FOCUS.nations)) {
    const L = ID.FOCUS.nations[b].concat((ID.FOCUS.projects || {})[b] || []);
    const p = path1(L), ip = path1(ID.FOCUS.ideos[(ID.NATIONAL[b] || {}).ideo || 'liberal'] || []);
    const y = (p.concat(ip).reduce((s, f) => s + (f.days || 120), 0) * P) / 360;
    const flat = L.filter((f) => !(f.fx || []).some((x) => STRUCT.indexOf(x[0]) >= 0) && !f.dest).length;
    const inter = L.filter((f) => (f.fx || []).some((x) => ['note2', 'war', 'ally', 'claim', 'subvert', 'op', 'subvertNb', 'dep', 'oil', 'union', 'front'].indexOf(x[0]) >= 0) || f.after).length;
    out.push([b, L.length, y]);
    console.log(b.padEnd(10), String(L.length).padStart(5), String(p.length).padStart(5), String(ip.length).padStart(6), y.toFixed(1).padStart(6), String(L.filter((f) => f.excl && f.excl.length).length).padStart(5), String(flat).padStart(5), String(inter).padStart(8));
  }
  const it = ID.FOCUS.ideos; const ks = Object.keys(it);
  console.log('ideology trees: ' + ks.length + ', programmes each ' + Math.min(...ks.map((k) => it[k].length)) + '–' + Math.max(...ks.map((k) => it[k].length)));
  // a destiny tree played through: its first act, the longer of its two roads, and the finale
  const af = ID.FOCUS.after || {}, dk = Object.keys(af);
  const dy = dk.map((k) => { const d = (re) => af[k].filter((f) => re.test(f.id)).reduce((s, f) => s + f.days, 0); return (d(/_(r|f\d)$/) + Math.max(d(/_a\d$/), d(/_b\d$/))) * P / 360; });
  if (dk.length) console.log('destiny trees: ' + dk.length + ', programmes each ' + Math.min(...dk.map((k) => af[k].length)) + '–' + Math.max(...dk.map((k) => af[k].length)) + '; one road and the finale take ' + Math.min(...dy).toFixed(1) + '–' + Math.max(...dy).toFixed(1) + ' years');
  console.log('fewest programmes: ' + Math.min(...out.map((r) => r[1])) + '; shortest playthrough: ' + Math.min(...out.map((r) => r[2])).toFixed(1) + ' years');
  process.exit(0);
}

/* ---------------------------------------------------------------- campaigns */
const newWorld = (r) => {
  const G = random ? ID.newGame({ seed: 1 + r * 7919, scenario: 'random', headless: true, difficulty: 'iron' })
    : ID.newGame({ scenario: 'meridia', headless: true, difficulty: 'iron', historical: true });
  if (!random) G.rng.s = (G.rng.s ^ (r * 2654435761)) >>> 0;
  // pacing is measured on a world with no player (a fallen player ends a campaign early); events need one
  if (mode !== 'events' && mode !== 'human') return { G, pn: null };
  const al = ID.alive(G); const pn = random ? al[r % al.length] : ID.byBase(G, PL[r % PL.length]) || al[0];
  ID.setPlayer(G, pn.id); if (mode === 'events') G.autoPlayer = true; // the AI answers for the player
  return { G, pn };
};

if (mode === 'econ') {
  // structures, industry, trade and the bomb: AI-only worlds (historical, or --random)
  const S = { trade: { 1925: [], 1950: [], 1970: [] }, top3: [], richMed: [], eq: [], eqLow: [], fac: [], wrecked: [], damaged: [], gold: [], bombY: [], bombStates: [], heads: [], used: [], thermo: [], wars: 0, civil: 0, big: [], alive: [], bombed: [], shelled: [] };
  for (let r = 0; r < runs; r++) {
    const { G } = newWorld(r); const firstBomb = {};
    let wrecked = 0; const orm = ID.removeBuilding; ID.removeBuilding = function (G2, i, skip) { if (!skip && G2.bld[i]) wrecked++; return orm.apply(this, arguments); };
    const oab = ID.Combat.useAbil; const ab = { barrage: 0, airraid: 0 }; ID.Combat.useAbil = function (G2, n, k) { const w = oab.apply(this, arguments); if (!w && ab[k] != null) ab[k]++; return w; };
    while (G.tick < years * 360 && !G.over) {
      ID.Game.tick(G);
      if (G.tick % 360) continue;
      const y = ID.yearOf(G.tick), al = ID.alive(G);
      for (const n of al) if (((n.cnt && n.cnt.nukesBuilt) || n.nukes) && !firstBomb[n.id]) firstBomb[n.id] = y;
      if (S.trade[y]) S.trade[y].push(al.reduce((s, n) => s + n.tradeInc, 0) / Math.max(1, al.reduce((s, n) => s + n.gdp, 0)));
    }
    ID.removeBuilding = orm; ID.Combat.useAbil = oab;
    const al = ID.alive(G).filter((n) => !n.civilOf), gd = al.map((n) => n.gdp).sort((a, b) => b - a), tot = gd.reduce((s, v) => s + v, 0);
    S.top3.push((gd[0] + (gd[1] || 0) + (gd[2] || 0)) / tot); S.richMed.push(gd[0] / gd[gd.length >> 1]);
    S.eq.push(avg(al.map((n) => n.equip))); S.eqLow.push(Math.min(...al.map((n) => n.equip)));
    S.fac.push(avg(al.map((n) => n.nb[ID.B.FACTORY]))); S.gold.push(avg(al.map((n) => n.gold)));
    S.wrecked.push(wrecked); S.damaged.push(G.hp ? G.blist.filter((i) => G.hp[i] < 100).length : 0);
    const ys = Object.values(firstBomb).sort((a, b) => a - b); S.bombY.push(ys.length ? ys[0] : 0); S.bombStates.push(ys.length);
    S.heads.push(G.nations.filter(Boolean).reduce((s, n) => s + ((n.cnt && n.cnt.nukesBuilt) || 0), 0)); S.used.push(G.world.nuked || 0);
    S.thermo.push(G.nations.filter((n) => n && n.cnt && n.cnt.thermoBuilt).length);
    S.bombed.push(ab.airraid); S.shelled.push(ab.barrage);
    S.wars += G.chronicle.filter((c) => c.type === 'war').length; S.civil += G.chronicle.filter((c) => c.type === 'civilwar').length;
    let big = al[0]; for (const n of al) if (n.tiles > big.tiles) big = n; S.big.push(big.tiles / G.landCount); S.alive.push(al.length);
    process.stderr.write('.');
  }
  const f = (a, d) => avg(a).toFixed(d == null ? 2 : d);
  console.log('\n' + (random ? 'random' : 'historical') + ', ' + runs + ' runs, ' + years + ' years');
  console.log('trade share of output 1925 / 1950 / 1970: ' + [1925, 1950, 1970].map((y) => pct(avg(S.trade[y]))).join(' / '));
  console.log('output: top three states ' + pct(avg(S.top3)) + ' of the world; richest / median ' + f(S.richMed, 1) + '×');
  console.log('equipment at the end: average ' + f(S.eq) + ', lowest ' + f(S.eqLow) + '; factories per state ' + f(S.fac, 1) + '; treasury per state ' + f(S.gold, 0));
  console.log('buildings destroyed per run ' + f(S.wrecked, 1) + ', damaged at the end ' + f(S.damaged, 1) + '; barrages ' + f(S.shelled, 1) + ', bombing raids ' + f(S.bombed, 1));
  console.log('first warhead (avg year, runs with one) ' + (S.bombY.filter(Boolean).length ? f(S.bombY.filter(Boolean), 0) : '-') + '; states with warheads ' + f(S.bombStates, 1) + '; warheads built ' + f(S.heads, 1) + '; atomic uses ' + f(S.used, 1) + '; thermonuclear states ' + f(S.thermo, 1));
  console.log('wars per run ' + (S.wars / runs).toFixed(1) + ', civil wars ' + (S.civil / runs).toFixed(1) + '; largest state ' + pct(avg(S.big)) + ' (max ' + pct(Math.max(...S.big)) + '); alive at the end ' + f(S.alive, 1));
  process.exit(0);
}

if (mode === 'human') {
  // the player's nation is not AI-diplomatic: AI enemies treat it as a human (offers, not forced peace);
  // the proxy runs the AI's internal and war logic for it and accepts each peace offer with chance p
  const p = +arg('p', 0.5); let A = 0, W = 0, Ax = 0, Wx = 0, fell = 0; const sp = [];
  for (let r = 0; r < runs; r++) {
    const { G, pn } = newWorld(r); let s = 0;
    while (G.tick < years * 360 && !G.over) {
      ID.Game.tick(G);
      if (G.tick % 30 === 0 && pn.alive) {
        ID.AI.month(G, pn);
        while (G.evq.length) ID.Events.choose(G, -1, undefined, true);
        while (G.tray && G.tray.length) ID.Events.choose(G, -1, 0, true);
        for (const o of (G.offers || []).slice()) if (o.kind === 'peace' && G.rng.chance(p) && ID.atWar(G, o.from, pn.id)) ID.Diplomacy.enact(G, G.nations[o.from], pn, 'peace');
        for (const e of ID.Diplomacy.enemies(G, pn)) if (ID.Diplomacy.wantsPeace(G, pn, e) && ID.Diplomacy.evalProposal(G, pn, e, 'peace').ok && G.rng.chance(p)) ID.Diplomacy.enact(G, pn, e, 'peace');
        const y = ID.yearOf(G.tick), w = pn.nwars > 0; A++; if (w) W++; if (!WW(y)) { Ax++; if (w) Wx++; }
        if (!w) s++; else if (s) { sp.push(s); s = 0; }
      }
      if ((G.tick & 3) === 0 && pn.alive && pn.nwars) ID.AI.war(G, pn);
    }
    if (s) sp.push(s); if (G.over || !pn.alive) fell++; process.stderr.write('.');
  }
  console.log('\nhuman proxy (accepts ' + pct(p) + ' of peace offers): player at war ' + pct(W / A) + ', outside world wars ' + pct(Wx / Ax) + ', median peace ' + (med(sp) / 12).toFixed(1) + ' y, fell in ' + fell + ' of ' + runs);
  process.exit(0);
}

const agg = { ev: {}, runs: [], war: 0, alive: 0, warX: 0, aliveX: 0, peace: [], wars: 0, civil: 0, dec: {}, top: [], start: 0, end: 0, yr: {}, cause: {} };
for (let r = 0; r < runs; r++) {
  const { G, pn } = newWorld(r);
  const story = {}; const oq = ID.Events.queue;
  if (!pn) { /* world only */ }
  ID.Events.queue = function (G2, n, id) { if (n === pn) { const d = ID.Events.def(id); if (d && d.story) story[id] = 1; } return oq.apply(this, arguments); };
  const os = ID.Diplomacy.startWar;
  ID.Diplomacy.startWar = function (G2, A, B, cb) { if (!ID.atWar(G2, A.id, B.id)) agg.cause[cb || 'none'] = (agg.cause[cb || 'none'] || 0) + 1; return os.apply(this, arguments); };
  const spell = {}; agg.start += ID.alive(G).length;
  while (G.tick < years * 360 && !G.over) {
    ID.Game.tick(G);
    if (G.tick % 30) continue;
    const y = ID.yearOf(G.tick), Y = agg.yr[y] || (agg.yr[y] = [0, 0]);
    for (const n of ID.alive(G)) {
      if (n.civilOf) continue;
      const w = n.nwars > 0; agg.alive++; Y[1]++; if (w) { agg.war++; Y[0]++; }
      if (!WW(y)) { agg.aliveX++; if (w) agg.warX++; }
      if (!w) spell[n.id] = (spell[n.id] || 0) + 1; else if (spell[n.id]) { agg.peace.push(spell[n.id]); spell[n.id] = 0; }
    }
  }
  ID.Events.queue = oq; ID.Diplomacy.startWar = os;
  for (const k in spell) if (spell[k]) agg.peace.push(spell[k]);
  for (const c of G.chronicle) {
    if (c.type === 'war') { agg.wars++; const d = Math.floor(ID.yearOf(c.t) / 10) * 10; agg.dec[d] = (agg.dec[d] || 0) + 1; }
    if (c.type === 'civilwar') agg.civil++;
  }
  const al = ID.alive(G); agg.end += al.length; let big = al[0]; for (const n of al) if (n.tiles > big.tiles) big = n; agg.top.push(big.tiles / G.landCount);
  const rnd = (pn && pn.a.evN) || {}, tot = Object.values(rnd).reduce((s, v) => s + v, 0), ent = Object.entries(rnd).sort((a, b) => b[1] - a[1]);
  agg.runs.push({ who: pn ? pn.base : '-', tot, distinct: ent.length, over3: ent.filter((e) => e[1] > 3 && !(ID.Events.def(e[0]) || {}).recur).length, top: ent.slice(0, 4).map((e) => e[0] + '×' + e[1]).join(' '), story: Object.keys(story).length, alive: pn ? pn.alive : 1 });
  for (const [k, v] of ent) (agg.ev[k] = agg.ev[k] || []).push(v);
  process.stderr.write('.');
}
console.log('');
if (mode === 'events') {
  for (const e of agg.runs) console.log(e.who.padEnd(9), 'random', String(e.tot).padStart(3), 'distinct', String(e.distinct).padStart(3), '(' + pct(e.distinct / Math.max(1, e.tot)) + ')', 'over 3×:', e.over3, ' story chapters', e.story, e.alive ? '' : '(fell)', ' most:', e.top);
  const mx = Object.entries(agg.ev).map(([k, v]) => [k, Math.max(...v), v.reduce((s, x) => s + x, 0)]).sort((a, b) => b[1] - a[1] || b[2] - a[2]);
  console.log('avg random dispatches per run', avg(agg.runs.map((e) => e.tot)).toFixed(1), '| distinct share avg', pct(avg(agg.runs.map((e) => e.distinct / Math.max(1, e.tot)))), 'min', pct(Math.min(...agg.runs.map((e) => e.distinct / Math.max(1, e.tot)))), '| max single count', mx.length ? mx[0][1] : 0, '| pool', ID.EVENT_DEFS.filter((d) => d.w && !d.sys).length);
  console.log('most repeated:', mx.slice(0, 10).map((e) => e[0] + ' max' + e[1] + ' sum' + e[2]).join(', '));
}
console.log((random ? 'random' : 'historical') + ' pacing, ' + runs + ' runs × ' + years + ' y: at war ' + pct(agg.war / agg.alive) + ' of country-months, outside world wars ' + pct(agg.warX / agg.aliveX) + ' | peace spell median ' + (med(agg.peace) / 12).toFixed(1) + ' y, mean ' + (avg(agg.peace) / 12).toFixed(1) + ' y | wars/run ' + (agg.wars / runs).toFixed(1) + ' | civil wars/run ' + (agg.civil / runs / 2).toFixed(1) + ' | states ' + (agg.start / runs).toFixed(1) + '→' + (agg.end / runs).toFixed(1) + ' | largest ' + pct(avg(agg.top)) + ' (max ' + pct(Math.max(...agg.top)) + ')');
console.log('wars per decade (per run): ' + Object.keys(agg.dec).sort().map((d) => d + ':' + (agg.dec[d] / runs).toFixed(1)).join(' '));
console.log('war starts by cause (per run): ' + Object.entries(agg.cause).sort((a, b) => b[1] - a[1]).map((e) => e[0] + ' ' + (e[1] / runs).toFixed(1)).join(', '));
console.log('share at war by year: ' + Object.keys(agg.yr).filter((y) => y % 2 === 0).map((y) => String(y).slice(2) + ':' + Math.round(agg.yr[y][0] / agg.yr[y][1] * 100)).join(' '));
