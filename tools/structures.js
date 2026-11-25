/* Self-check for building condition, fortresses, trade routes, arms, the bomb and saves. Exits non-zero on failure.
   node tools/structures.js */
'use strict';
const ID = require('./load.js');
const B = ID.B;
let fails = 0;
const ok = (c, msg) => { if (!c) { fails++; console.log('FAIL ' + msg); } else console.log('ok   ' + msg); };
const near = (a, b, e) => Math.abs(a - b) < (e || 1e-6);
const months = (G, m) => { for (let k = 0; k < m * 30; k++) ID.Game.tick(G); };
const own = (G, n, t) => G.blist.filter((i) => G.owner[i] === n.id && G.bld[i] === t);

const G = ID.newGame({ scenario: 'meridia', headless: true, difficulty: 'iron', historical: false, seed: 7 });
const al = ID.alive(G).sort((a, b) => b.nb[B.FACTORY] - a.nb[B.FACTORY]);
const n = al[0];
n.ai = false; G.player = n.id; G.autoPlayer = false; // keep the AI's hands off the test nation's buildings

/* condition and repair */
const f = own(G, n, B.FACTORY)[0];
ok(G.hp[f] === 100, 'a new factory is at 100%');
ID.damage(G, f, 40); ID.structMonth(G, true);
ok(G.hp[f] === 60 && near(ID.nbe(n, B.FACTORY), n.nb[B.FACTORY] - 0.4), 'damage 40 → 60%, counts as 0.6 of a factory');
n.gold = 5000; const g0 = n.gold; n.nwars = 0;
ID.structMonth(G);
ok(G.hp[f] > 60 && n.gold < g0, 'repair mends it and costs gold (' + G.hp[f] + '%, ' + (g0 - n.gold).toFixed(1) + ' gold)');

/* wreck and rebuild */
ID.damage(G, f, 200); ID.structMonth(G, true);
ok(G.hp[f] === 0 && n.a.wrecks >= 1 && G.bld[f] === B.FACTORY, 'a wreck keeps its tile and counts nothing');
ok(ID.canRebuild(G, n, f) === '', 'a wreck can be rebuilt');
const gr = n.gold; ID.startRebuild(G, n, f);
ok(near(gr - n.gold, ID.BUILDINGS[B.FACTORY].cost * 0.5, 1), 'rebuilding costs half the base price');
const q = G.builds.find((x) => x.i === f);
for (let t = G.tick; t <= q.done; t++) ID.tickBuilds(G), G.tick++;
ok(G.hp[f] === 100, 'the rebuilt factory is back at 100%');

/* fortress numbers */
const fx = (c, style) => { G.fortQ[f] = c; return ID.fortFx(G, f, style); };
let r = fx(100); ok(near(r.cost, 1.8) && near(r.loss, 2.5) && near(r.shelter, 0.5), 'full fort: speed ÷1.8, losses ×2.5, shelter ×0.5');
r = fx(50); ok(near(r.cost, 1.4) && near(r.loss, 1.75), 'fort at 50%: ÷1.4, ×1.75');
r = fx(100, 'siege'); ok(near(r.cost, 1.12) && near(r.loss, 1.225), 'siege ignores 85% of a fort');
G.fortsDirty = true; ID.recomputeForts(G);

/* capture in war damages */
const e = al.find((o) => o !== n && ID.borders(G, n.id, o.id));
const ec = own(G, e, B.CITY).find((i) => i !== e.capital) || own(G, e, B.CITY)[0];
ID.Diplomacy.startWar(G, n, e, 'claims');
ID.setOwner(G, ec, n.id);
ok(G.hp[ec] === 70 && G.bld[ec] === B.CITY, 'a city taken by storm loses 30 condition');

/* artillery on a fort */
const ef = (() => { for (const i of G.blist) if (G.owner[i] === e.id && G.bld[i] === B.FORT) return i; ID.placeBuilding(G, ec - 2, B.FORT); return G.bld[ec - 2] === B.FORT ? ec - 2 : -1; })();
if (ef >= 0 && G.owner[ef] === e.id) {
  n.gold = 5000; n.cd = {};
  // stand beside it so the barrage is in range
  const W = G.W; for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) { const j = ef + dy * W + dx; if (Math.abs(dx) + Math.abs(dy) === 3 && G.terrain[j]) ID.setOwner(G, j, n.id); }
  const h0 = G.hp[ef], w = ID.Combat.useAbil(G, n, 'barrage', ef);
  ok(w === '' && G.hp[ef] < h0, 'a barrage batters a fortress (' + h0 + '% → ' + G.hp[ef] + '%)' + (w ? ': ' + w : ''));
}

/* trade: ports carry routes */
months(G, 1);
const sailor = ID.alive(G).find((o) => o.a.seaRoutes > 0);
ok(!!sailor, 'some state trades by sea');
if (sailor) {
  const before = sailor.tradeInc; for (const i of own(G, sailor, B.PORT)) ID.damage(G, i, 100);
  ID.structMonth(G, true); ID.Economy.month(G, sailor);
  ok(sailor.a.seaRoutes === 0 && sailor.tradeInc < before, 'with every port wrecked, sea trade stops (' + before.toFixed(1) + ' → ' + sailor.tradeInc.toFixed(1) + ')');
}

/* arms are capped by factories */
ok(n.a.armsMade <= n.a.armsCap + 1e-9 && near(n.a.armsCap, (n.a.ic || 0) * ID.Economy.ARMS_K * (ID.ideo(n).econ.model === 'plan' || ID.ideo(n).econ.model === 'cyber' ? ID.Economy.PLAN_ARMS : 1), 1e-6), 'arms made never exceed what the factories can turn out');

/* the arsenal */
{
  const E = ID.Economy; E.initArsenal(G, n);
  const a0 = n.ars = 24 * n.a.armsNeed; n.a.refill = n.a.armsNeed; n.a.burn = 0; n.casM = 0;
  E.arsenalMonth(G, n); ok(Math.abs(n.ars - a0) < a0 * 0.01 && Math.abs(n.equip - 1) < 0.02, 'in peace an arsenal of 24 months of needs, refilled at one month a month, holds kit at 100%');
  n.a.burn = n.a.armsNeed * 0.6; const a1 = n.ars; E.arsenalMonth(G, n); ok(n.ars < a1, 'at war it drains (' + Math.round(a1) + ' → ' + Math.round(n.ars) + ')');
  const v = al.find((o) => o !== n && ID.atWar(G, n.id, o.id)), vf = G.blist.find((i) => G.owner[i] === v.id && (G.bld[i] === B.FACTORY || G.bld[i] === B.CITY));
  v.ars = 1000; const mine = n.ars; ID.setOwner(G, vf, n.id);
  ok(v.ars < 1000 && n.ars > mine, 'taking an enemy factory or city captures part of their arsenal (' + Math.round(n.ars - mine) + ')');
  const bP = E.warBurn(G, n, 10), bA = E.warBurn(G, v, 10) * (E.POSTURE_BURN[n.posture] || 1) / (E.POSTURE_BURN[v.posture] || 1);
  const rP = E.kitTarget(G, n, 50, []) && n.a.refill; n.id = '_'; const rA = E.kitTarget(G, n, 50, []) && n.a.refill; n.id = G.player; E.kitNow(G, n);
  ok(n.nwars && v.nwars && near(bP, bA * E.ARS.player) && near(rP, rA * E.ARS.playerIn), 'the player burns kit at ×' + E.ARS.player + ' and refills at ×' + E.ARS.playerIn + ' of an AI');
}

/* the atomic programme */
const E = ID.Economy, at = E.atom(n);
n.tech.mil = 5; ok(/technology 6/.test(E.atomBlock(G, n, 'atom')), 'no programme before military technology 6');
n.tech.mil = 6; while (ID.nbe(n, B.FACTORY) < 8) { const s = ID.spotNear(G, n.capital, n.id, 10); ID.placeBuilding(G, s, B.FACTORY); ID.structMonth(G, true); }
ok(E.atomBlock(G, n, 'atom') === '', 'the programme can start with technology 6 and 8 factories');
n.gold = 1e6; ok(ID.Events.runDecision(G, n, 'atom_programme') === '' && at.on === 'atom', 'the programme starts');
let m = 0; while (at.on && m < 400) { ID.Economy.atomMonth(G, n, 500); m++; }
ok(at.lv === 1 && m > 40 && m < 200, 'the bomb takes years (' + (m / 12).toFixed(1) + ' at this capacity)');
ok(/silo/.test(E.makeBlock(G, n, 'atom')), 'warheads need a silo');
ID.placeBuilding(G, ID.spotNear(G, n.capital, n.id, 10), B.SILO); ID.structMonth(G, true);
ok(ID.Events.runDecision(G, n, 'build_nuke') === '' && at.make, 'a warhead goes into production');
const done = at.make.done; G.tick = done; ID.Economy.atomMonth(G, n, 500);
ok(n.nukes === 1 && !at.make, 'it is ready three years later');

/* the bombs */
const strike = (kind) => {
  const v = ID.alive(G).filter((o) => o !== n && o.tiles > 600).sort((a, b) => b.pop - a.pop)[0];
  const p0 = v.pop, nb0 = G.blist.filter((i) => G.owner[i] === v.id).length;
  ID.Diplomacy.startWar(G, n, v, 'claims');
  if (kind === 'thermo') n.thermo = 1; else n.nukes = 1;
  n.missiles = 0; G.missiles.length = 0;
  const C = ID.Combat; const range = C.missileRange; C.missileRange = () => 9999;
  ok(C.launchMissile(G, n, v.capital, kind) === '', kind + ': launched');
  C.missileRange = range;
  for (let k = 0; k < 120 && G.missiles.length; k++) ID.Combat.tick(G);
  const W = G.W, x0 = v.capital % W, y0 = (v.capital / W) | 0, Bk = C.BOMB[kind];
  let left = 0, rad = 0; for (let dy = -Bk.r; dy <= Bk.r; dy++) for (let dx = -Bk.r; dx <= Bk.r; dx++) { if (dx * dx + dy * dy > Bk.r * Bk.r) continue; const j = (y0 + dy) * W + x0 + dx; if (j < 0 || j >= G.N || G.terrain[j] === 0) continue; if (G.bld[j]) left++; if (G.rad[j]) rad++; }
  ok(left === 0 && rad > 0, kind + ': nothing stands within ' + Bk.r + ' tiles, and the land is irradiated');
  ok(v.pop < p0, kind + ': ' + ID.fmtPop(p0 - v.pop) + ' dead of ' + ID.fmtPop(p0) + ' (' + Math.round((1 - v.pop / p0) * 100) + '%), buildings ' + nb0 + ' → ' + G.blist.filter((i) => G.owner[i] === v.id).length);
  return 1 - v.pop / p0;
};
const da = strike('atom'), dt = strike('thermo');
ok(dt > da, 'the thermonuclear bomb kills a larger share than the atomic one');

/* saves */
ID.Combat.updateSupply(G); // settle the pockets the tests above left, as loading does
const str = ID.Game.save(G), G2 = ID.Game.load(str);
ok(G2.blist.every((i) => G2.hp[i] === G.hp[i]) && G2.blist.length === G.blist.length, 'condition survives a save');
const o = JSON.parse(str); delete o.hp; for (const k of o.nations) if (k) { delete k.atom; delete k.thermo; }
const G3 = ID.Game.load(o);
ok(G3.blist.every((i) => G3.hp[i] === 100), 'an old save loads with every building whole');
months(G3, 2);
ok(ID.alive(G3).length > 0, 'an old save runs on');

// the balance shown on the top band is what the treasury really does each month (budget plus ID.flow: oil,
// tribute, dependencies, repairs, debt), counted over two years for every state
{
  const G4 = ID.newGame({ seed: 5, scenario: 'meridia', headless: true }); G4.rng.s = 77; months(G4, 120);
  const real = {}, shown = {};
  for (const n of ID.alive(G4)) {
    let v = n.gold; real[n.id] = 0; shown[n.id] = 0;
    Object.defineProperty(n, 'gold', { get() { return v; }, set(x) { if (/E\.month|ID\.flow/.test(new Error().stack.split('\n')[2])) real[n.id] += x - v; v = x; }, configurable: true });
  }
  let worst = 0, who = '';
  for (let m = 0; m < 24; m++) { months(G4, 1); for (const n of ID.alive(G4)) if (shown[n.id] != null) shown[n.id] += ID.balance(n); }
  for (const n of ID.alive(G4)) { if (real[n.id] == null) continue; const d = Math.abs(real[n.id] - shown[n.id]) / 24 / Math.max(5, Math.abs(real[n.id] / 24)); if (d > worst) { worst = d; who = n.base; } }
  ok(worst < 0.15, 'the monthly balance shown matches the treasury (worst gap ' + Math.round(worst * 100) + '%, ' + who + ')');
}

console.log(fails ? fails + ' FAILED' : 'all passed');
process.exit(fails ? 1 : 0);
