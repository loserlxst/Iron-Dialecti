/* Coup balance: attempts and successes per state-decade, by ideology and by source.
   node tools/coups.js [--runs 16 --years 50]
   With the coup model of politics.js (ID.Coup, G.coupLog) every attempt is logged with its source; on older code the
   tool wraps the old entry points (monthly risk, the inner circle, foreign plots) to count the same things. */
'use strict';
const ID = require('./load.js');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i >= 0 ? process.argv[i + 1] : d; };
const runs = +arg('runs', 16), years = +arg('years', 50);
const P = ID.Politics;
const log = [];
const v2 = !!ID.Coup;
if (!v2) { // the old entry points
  const wrap = (obj, k, src, nOf) => { const f = obj[k]; obj[k] = function (G, ...r) { const n = nOf(G, r), lead = n.leader.name, ideo = n.ideo, mil = n.fs.military, out = f.call(this, G, ...r); log.push({ G, t: G.tick, ideo, src, mil, ok: n.leader.name !== lead || n.ideo !== ideo, junta: ideo === 'junta' || ideo === 'personalist' }); return out; }; };
  wrap(P, 'coup', 'army', (G, r) => r[0]);
  wrap(ID.Regime, 'strike', 'figure', (G, r) => r[0]);
  const ps = ID.Diplomacy.plotSignal; ID.Diplomacy.plotSignal = function (G, n, t) { const lead = t.leader.name, ideo = t.ideo, mil = t.fs.military, had = !!ID.Diplomacy.plotOp(n, t); const out = ps.call(this, G, n, t); if (had && !out) log.push({ G, t: G.tick, ideo, src: 'foreign', mil, ok: t.leader.name !== lead || t.ideo !== ideo }); return out; };
}
/* Self-check of the player's side (coup model only): a plot is seen at its stages, the coup takes days, the odds shown
   are the odds rolled, and losing opens a road on instead of ending the campaign. */
if (v2 && !process.argv.includes('--nocheck')) {
  let fails = 0; const ok = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) fails++; };
  const Cp = ID.Coup, Ev = ID.Events;
  const mk = () => { const G = ID.newGame({ seed: 9, size: 'std', scenario: 'random', headless: true, difficulty: 'iron' }); const n = ID.alive(G)[0]; ID.setPlayer(G, n.id); G.headless = true; return { G, n }; };
  console.log('== self-check ==');
  { // a content army does not plot; an unhappy one does, and good security sees it
    const { G, n } = mk(); n.fs.military = 75; n.sm.military = 75;
    let born = 0; for (let k = 0; k < 400; k++) { n.plot = null; Cp.month(G, n, ID.RECRUIT[n.laws.recruit], ID.DIFFICULTY[G.difficulty]); if (n.plot) born++; }
    ok(born <= 2, 'a content army (support 75) almost never starts a plot (' + born + ' in 400 months)');
    n.laws.security = 'secret'; n.budget.security = 0.1; n.fs.military = 15; n.stab = 30; n.legit = 30; n.a.coupAt = null; G.evq.length = 0;
    n.plot = { src: 'army', prog: 70, since: G.tick, known: 0 };
    Cp.month(G, n, ID.RECRUIT[n.laws.recruit], ID.DIFFICULTY[G.difficulty]);
    ok(G.evq.some((e) => e.id === 'plot_stage'), 'under a secret police a plot with a date set is always seen');
    const e = G.evq.find((x) => x.id === 'plot_stage'), opts = e && Ev.options(G, n, Ev.def('plot_stage'), e.ctx);
    ok(opts && opts.some((x) => /Purge/.test(x.label)) && opts.some((x) => /Reassign/.test(x.label)) && opts.some((x) => /Arrest/.test(x.label)) && opts.some((x) => /Concede/.test(x.label)), 'actions offered: ' + (opts || []).map((x) => x.label).join(', '));
    Ev.choose(G, opts.findIndex((x) => /Purge/.test(x.label)));
    ok(!n.plot, 'a purge ends the plot');
  }
  { // the coup itself: the shown odds are the rolled odds, it takes days, losing opens the road on
    const { G, n } = mk(); n.fs.military = 10; n.stab = 20; n.legit = 20; G.evq.length = 0;
    Cp.launch(G, n, { src: 'army' });
    ok(n.coupNow && G.evq[0] && G.evq[0].id === 'coup', 'the coup begins with a dispatch, not a roll');
    const txt = Ev.txt(Ev.def('coup').text, G, n, {}), p = Cp.odds(G, n, n.coupNow).p;
    ok(txt.indexOf('The loyalists’ chance: ' + Math.round((1 - p) * 100) + '%') >= 0, 'the text gives the exact odds (' + Math.round((1 - p) * 100) + '%) and why');
    const k = Ev.options(G, n, Ev.def('coup'), {}).findIndex((x) => /Negotiate/.test(x.label)); Ev.choose(G, k);
    let days = 0; while (n.coupNow && days < 20) { if (G.evq.length) Ev.choose(G, 2); G.tick++; Cp.day(G, n); days++; }
    ok(days >= 4, 'it is fought out over ' + days + ' days');
    const lost = G.evq.find((x) => x.id === 'coup_lost');
    if (lost) { const o2 = Ev.options(G, n, Ev.def('coup_lost'), {}); ok(o2.length >= 3 && !G.over, 'the plotters won: ' + o2.map((x) => x.label).join(', ')); }
    else ok(!G.over && n.alive, 'the loyalists won');
  }
  { // averaged over many coups, the share the plotters win matches the odds shown at the start
    let won = 0, exp = 0; const N = 300;
    for (let k = 0; k < N; k++) {
      const { G, n } = mk(); G.rng.s = (1000 + k * 77) >>> 0; n.fs.military = 30; n.stab = 40; G.evq.length = 0;
      Cp.launch(G, n, { src: 'army' }); exp += Cp.odds(G, n, n.coupNow).p;
      Ev.choose(G, Ev.options(G, n, Ev.def('coup'), {}).findIndex((x) => /Negotiate/.test(x.label)));
      let d = 0; while (n.coupNow && d < 20) { if (G.evq.length && G.evq[0].id === 'coup_day') Ev.choose(G, 2); G.tick++; Cp.day(G, n); d++; }
      if (G.evq.some((x) => x.id === 'coup_lost')) won++;
    }
    ok(Math.abs(won / N - exp / N) < 0.08, 'plotters won ' + Math.round(won / N * 100) + '% against ' + Math.round(exp / N * 100) + '% shown');
  }
  { // the counter-coup road and a save round trip
    const { G, n } = mk(); const old = n.ideo; n.a.coupLost = { src: 'army', to: 'junta' }; G.evq.length = 0;
    const o3 = Ev.options(G, n, Ev.def('coup_lost'), {}); Ev.queue(G, n, 'coup_lost', {}); Ev.choose(G, o3.findIndex((x) => /exile/.test(x.label)));
    ok(n.ideo === 'junta' && n.a.restore && n.a.restore.ideo === old, 'exile: the junta rules and the old order waits (' + old + ')');
    const G2 = ID.Game.load(ID.Game.save(G)); ok(G2.nations[n.id].a.restore && G2.nations[n.id].a.restore.ideo === old, 'it survives a save');
  }
  console.log(fails ? fails + ' FAILED' : 'self-check passed');
  if (fails) process.exitCode = 1;
}
const sy = {}; // state-years by ideology
const tally = {}, bySrc = {}, hiMil = { att: 0, ok: 0, years: 0 }, hiArmy = { att: 0, ok: 0 }, weak = { att: 0, ok: 0, years: 0 };
for (let r = 0; r < runs; r++) {
  const G = ID.newGame({ seed: 5 + r * 7919, size: 'std', scenario: r % 2 ? 'random' : 'meridia', headless: true, difficulty: 'iron' });
  G.rng.s = (101 + r * 977) >>> 0;
  if (v2) G.coupLog = [];
  while (G.tick < years * 360 && !G.over) {
    ID.Game.tick(G);
    if (G.tick % 360 === 0) for (const n of ID.alive(G)) { sy[n.ideo] = (sy[n.ideo] || 0) + 1; if (n.fs.military > 60) hiMil.years++; if (n.stab < 35) weak.years++; }
  }
  if (v2) for (const e of G.coupLog) log.push(e);
}
for (const e of log) {
  const t = tally[e.ideo] || (tally[e.ideo] = { att: 0, ok: 0 }); t.att++; if (e.ok) t.ok++;
  const s = bySrc[e.src] || (bySrc[e.src] = { att: 0, ok: 0 }); s.att++; if (e.ok) s.ok++;
  if (e.stab != null && e.stab < 35) { weak.att++; if (e.ok) weak.ok++; }
  if (e.mil > 60) { hiMil.att++; if (e.ok) hiMil.ok++; if (e.src === 'army') { hiArmy.att++; if (e.ok) hiArmy.ok++; } }
}
const tot = Object.values(sy).reduce((a, b) => a + b, 0);
console.log((v2 ? 'coup model' : 'old coups') + ': ' + runs + ' games × ' + years + ' years, ' + tot + ' state-years');
console.log('all: attempts ' + log.length + ' (' + (log.length / tot * 10).toFixed(2) + ' per state-decade), successes ' + log.filter((e) => e.ok).length + ' (' + (log.filter((e) => e.ok).length / tot * 10).toFixed(2) + ')');
console.log('by source: ' + Object.keys(bySrc).map((k) => k + ' ' + bySrc[k].att + '/' + bySrc[k].ok).join(', ') + '  (attempts/successes)');
console.log('military support above 60: ' + hiMil.years + ' state-years, attempts ' + hiMil.att + ', successes ' + hiMil.ok + '; army coups among them ' + hiArmy.att + '/' + hiArmy.ok);
if (v2) console.log('weak states (stability under 35): ' + weak.years + ' state-years, attempts ' + weak.att + ', successes ' + weak.ok + ' (' + (weak.ok / Math.max(1, weak.years) * 10).toFixed(2) + ' per state-decade)');
console.log('by ideology (state-years, attempts, successes per state-decade):');
const rows = Object.keys(sy).sort((a, b) => sy[b] - sy[a]);
for (const k of rows) { const t = tally[k] || { att: 0, ok: 0 }; console.log('  ' + k.padEnd(12) + String(sy[k]).padStart(5) + String(t.att).padStart(5) + String(t.ok).padStart(4) + '  ' + (t.ok / sy[k] * 10).toFixed(2)); }
