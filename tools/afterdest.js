/* Self-check for the trees that open after a destiny (data/afterdest.js) and the late branches of the national,
   family and ideology trees (data/trees3.js). Exits non-zero on failure.
   node tools/afterdest.js */
'use strict';
const ID = require('./load.js');
const Fo = ID.Focus;
let fails = 0;
const ok = (c, msg) => { if (!c) { fails++; console.log('FAIL ' + msg); } else console.log('ok   ' + msg); };

/* every destiny has a tree, and every effect in it is one the game knows */
const dests = [];
for (const b in ID.FOCUS.nations) for (const f of ID.FOCUS.nations[b]) if (f.dest) dests.push(f);
for (const k in ID.FOCUS.families) for (const f of ID.FOCUS.families[k]) if (f.dest) dests.push(f);
const missing = dests.filter((f) => !(ID.FOCUS.after[f.id] && ID.FOCUS.after[f.id].length === 11));
ok(!missing.length, dests.length + ' destinies each open an eleven-programme tree' + (missing.length ? ': missing ' + missing.map((f) => f.id).join(', ') : ''));
ok(Object.keys(ID.FOCUS.after).every((k) => dests.some((f) => f.id === k)), 'no tree hangs off a destiny that does not exist');

/* the late branches: seven on every national and family tree, five on every ideology tree, and no two programmes
   drawn on the same spot */
const trees = [];
for (const b in ID.FOCUS.nations) trees.push([b, ID.FOCUS.nations[b], /_y(r|[ab][1-3])$/, 7, ID.FOCUS.nations[b].concat(ID.FOCUS.projects[b] || [])]);
for (const k in ID.FOCUS.families) trees.push(['family ' + k, ID.FOCUS.families[k], /_y(r|[ab][1-3])$/, 7]);
for (const k in ID.FOCUS.ideos) trees.push(['ideology ' + k, ID.FOCUS.ideos[k], /_i_z(r|[ab][12])$/, 5]);
const late = [], short = [], overlap = [];
for (const [name, L, re, want, all] of trees) {
  const mine = L.filter((f) => re.test(f.id)); late.push(...mine);
  if (mine.length !== want) short.push(name + ' has ' + mine.length);
  const at = {}; for (const f of all || L) { const k = f.x.toFixed(1) + ',' + f.y; if (at[k]) overlap.push(name + ': ' + at[k] + ' and ' + f.id); at[k] = f.id; }
}
ok(!short.length, trees.length + ' national, family and ideology trees each gain a late branch' + (short.length ? ': ' + short.join(', ') : ''));
ok(!overlap.length, 'no two programmes share a spot in any tree' + (overlap.length ? ':\n  ' + overlap.join('\n  ') : ''));

const BASIC = ['stab', 'gold', 'debtPct', 'sup', 'supAll', 'unrest', 'corr', 'bureau', 'fervor', 'tradition', 'glory', 'particip', 'discipline', 'charisma', 'grievance', 'dist', 'threat', 'equip', 'legitmod', 'mod', 'opAll', 'inflation'];
const MODS = ['prod', 'food', 'atk', 'def', 'sci', 'ls', 'rev', 'eff', 'unrest', 'trade', 'growth', 'regen', 'navy', 'speed', 'coup', 'wePace'];
const G = ID.newGame({ scenario: 'meridia', headless: true, difficulty: 'iron', historical: false, seed: 11 });
const bases = new Set(G.nations.filter(Boolean).map((n) => n.base).concat(['Neshar'])); // Neshar is proclaimed mid-game (data/oldlands.js)
const bad = [], ids = new Set();
let count = 0;
const afters = []; for (const k in ID.FOCUS.after) afters.push(...ID.FOCUS.after[k]);
for (const f of afters.concat(late)) {
  count++;
  if (ids.has(f.id) || (Fo.def(f.id) !== f)) bad.push(f.id + ': id clash');
  ids.add(f.id);
  for (const r of (f.req || []).concat(f.reqAny || [])) if (!Fo.def(r) || Fo.def(r).tree !== f.tree) bad.push(f.id + ': needs ' + r + ', which is not in its tree');
  if (!f.name || !f.desc || !(f.fx || []).length) bad.push(f.id + ': empty');
  for (const x of f.fx) {
    const t = x[0];
    if (BASIC.indexOf(t) < 0 && !Fo.FX[t]) bad.push(f.id + ': unknown effect ' + t);
    if (t === 'mod' && MODS.indexOf(x[1]) < 0) bad.push(f.id + ': unknown mod ' + x[1]);
    if (t === 'sup' && ID.FACTION_IDS.indexOf(x[1]) < 0) bad.push(f.id + ': unknown faction ' + x[1]);
    if (t === 'law' && !(ID.LAWS[x[1]] && ID.LAWS[x[1]].opts[x[2]])) bad.push(f.id + ': unknown law ' + x[1] + '/' + x[2]);
    if (['claim', 'note2', 'subvert', 'op'].indexOf(t) >= 0 && !bases.has(x[1])) bad.push(f.id + ': no country ' + x[1]);
    if (t === 'build' && !ID.BUILDINGS[x[1]]) bad.push(f.id + ': unknown building');
  }
  const caps = !!f.afterDest && /_(a4|b4|f2)$/.test(f.id);
  if (caps !== f.fx.some((x) => x[0] === 'epithet')) bad.push(f.id + ': a title belongs on the last step of each road and of the finale of a destiny tree, and only there');
}
ok(!bad.length, count + ' programmes use only known effects, factions, laws and countries' + (bad.length ? ':\n  ' + bad.join('\n  ') : ''));

/* a country reaches a destiny: the tree opens, one road closes the other, the title is kept, a lapse closes it */
const n = ID.byBase(G, 'Aurelia'); G.player = n.id; G.autoPlayer = true;
const dest = Fo.def('au_d_crown');
ok(!Fo.trees(n).some((t) => t.key === 'dest'), 'no destiny tree before a destiny');
ok(Fo.block(G, n, Fo.def('au_d_crown_r'), true) !== '', 'its programmes are closed before the destiny');
Fo.complete(G, n, dest);
const T = Fo.trees(n).find((t) => t.key === 'dest');
ok(T && T.name === n.destiny.name && T.list.length === 11, 'reaching ' + n.destiny.name + ' opens its tree');
ok(Fo.available(G, n).some((f) => f.id === 'au_d_crown_r'), 'its first programme can be started');
ok(Fo.block(G, n, Fo.def('au_d_crown_f1'), true) !== '', 'the finale waits for the end of a road');
const mods0 = n.mods.length;
for (const id of ['au_d_crown_r', 'au_d_crown_b1', 'au_d_crown_b2', 'au_d_crown_b3', 'au_d_crown_b4', 'au_d_crown_f1', 'au_d_crown_f2']) {
  const f = Fo.def(id), why = Fo.block(G, n, f, true);
  ok(!why, id + ' can start' + (why ? ': ' + why : ''));
  Fo.complete(G, n, f);
}
ok(n.mods.length > mods0, 'its bonuses apply');
ok(Fo.state(G, n, Fo.def('au_d_crown_a1')) === 'excl', 'the other road is ruled out');
ok(['The Little Father', 'The Restored Throne'].every((t) => (n.epithets || []).some((e) => e.t === t)), 'the road’s title and the finale’s title are kept');
n.destiny.lapsed = true;
ok(!Fo.trees(n).some((t) => t.key === 'dest'), 'the tree closes when the destiny lapses');

/* family trees name the state */
const R = ID.newGame({ seed: 5, scenario: 'random', headless: true, difficulty: 'iron' });
const m = ID.alive(R).find((x) => !ID.FOCUS.nations[x.tree]);
const fam = ID.ideo(m).family, fd = ID.FOCUS.families[fam].find((f) => f.dest), was = m.name;
Fo.complete(R, m, fd);
const FT = Fo.trees(m).find((t) => t.key === 'dest');
ok(FT && FT.list[0].afterDest === fd.id, was + ' (' + fam + ') reaches ' + m.destiny.name + ' and its tree opens');
const road = ['r', 'b1', 'b2', 'b3', 'b4'].map((k) => Fo.def(fd.id + '_' + k)), epi = road[4].fx.find((x) => x[0] === 'epithet');
for (const f of road) Fo.complete(R, m, f);
ok(m.epithets.some((e) => e.t === Fo.sub(epi[1], m) && e.t.indexOf('{') < 0), 'a family title is written for the state: ' + Fo.sub(epi[1], m));

/* the AI walks these trees in a long run without errors */
const H = ID.newGame({ scenario: 'meridia', headless: true, difficulty: 'iron', historical: true });
let err = null;
try { for (let d = 0; d < 360 * 45; d++) ID.Game.tick(H); } catch (e) { err = e; }
ok(!err, 'forty-five years of history run' + (err ? ': ' + err.stack : ''));
const reached = ID.alive(H).filter((x) => x.destiny && !x.destiny.lapsed);
const walked = reached.filter((x) => Object.keys(x.path.done).some((id) => Fo.def(id) && Fo.def(id).afterDest));
console.log('     by ' + ID.yearOf(H.tick) + ': ' + reached.length + ' states hold a destiny, ' + walked.length + ' have taken a programme after it');
ok(!reached.length || walked.length, 'AI states take programmes after their destiny');

console.log(fails ? fails + ' FAILED' : 'all passed');
process.exit(fails ? 1 : 0);
