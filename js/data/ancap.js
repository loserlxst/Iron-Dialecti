/* IRON DIALECTIC — Anarcho-Capitalism (session 15): its doctrine, inner circle, engine and dispatches.
   The definition is in data/ideologies.js, the trees in ideotrees/trees2/trees3, the destiny (The Free Covenant)
   in the liberal family tree of destiny.js with its tree in afterdest.js.
   Engine J, the market for protection. Three agencies split the covenant's contracts (n.sigx.ag: name, share s,
   quality q). The doctrine gauge, Competition, is how evenly they split (1 − Σs², scaled to 0–100). Members' fees
   (n.tax, which no one in the covenant sets) rise as one agency dominates; protection is thin while the defence
   contracts are small; an agency that holds most of the market long enough becomes the state (junta or NRX).
   Territory is property: a neighbour short of money sells a border province (ac_buy), and an unhappy province may
   leave for a neighbour, peacefully, with nobody entitled to stop it.
   Forbidden: taxes (no tax slider: econ has no taxMin), conscription (hired companies only), public works
   (factories and towns), rule by decree. Loads after data/engines.js. */
(function () {
  'use strict';
  const ID = (globalThis.ID = globalThis.ID || {});
  const D = ID.DOCTRINE, EV = ID.EVENT_DEFS, R = ID.REGIME;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const isP = (G, n) => n.id === G.player && !G.autoPlayer;
  const YEAR = 360, MO = 30;
  const keep = (n, label, k, v) => {
    for (let i = n.mods.length - 1; i >= 0; i--) if (n.mods[i].label === label && n.mods[i].k === k) n.mods.splice(i, 1);
    if (v) n.mods.push({ k, v, m: 2, label });
  };
  const pct = (v) => Math.round(v * 100) + '%';

  /* ================================================================ the agencies */
  const FIRST = ['Ironclad', 'Meridian', 'Northgate', 'Sterling', 'Bastion', 'Lodestar', 'Granite', 'Keystone', 'Harbour', 'Anvil', 'Vanguard', 'Halcyon', 'Pinnacle', 'Bulwark'];
  const SECOND = ['Assurance', 'Defence', 'Protective Union', 'Mutual', 'Security Company', 'Guard & Arbitration', 'Indemnity', 'Watch'];
  const ACap = (ID.Ancap = {});
  ACap.agencies = function (G, n) {
    const x = n.sigx || (n.sigx = {});
    if (!x.ag) {
      x.ag = []; const used = {};
      for (let k = 0; k < 3; k++) { let nm; do { nm = G.rng.pick(FIRST) + ' ' + G.rng.pick(SECOND); } while (used[nm]); used[nm] = 1; x.ag.push({ name: nm, s: [0.4, 0.33, 0.27][k], q: 0.5 }); }
      x.dom = 0;
    }
    return x.ag;
  };
  ACap.comp = (ag) => { let h = 0; for (const a of ag) h += a.s * a.s; return clamp((1 - h) / (2 / 3) * 100, 0, 100); };
  ACap.top = (ag) => ag.reduce((a, b) => (b.s > a.s ? b : a));
  const norm = (ag) => { let t = 0; for (const a of ag) { a.s = Math.max(0.03, a.s); t += a.s; } for (const a of ag) a.s /= t; };
  /* Contracts handed to the smaller agencies: shares move toward equal. */
  ACap.spread = function (G, n, k) { const ag = ACap.agencies(G, n); for (const a of ag) a.s += (1 / ag.length - a.s) * k; norm(ag); n.sig = ACap.comp(ag); };
  /* What the members pay: 8% of output under full competition, up to 14% under a monopoly. */
  ACap.fee = (sig) => Math.round((8 + (100 - sig) * 0.06) * 10) / 10;

  /* ---------------------------------------------------------------- land as property */
  /* The best-priced border province that a neighbour short of money would sell: {Pr, o, price, tiles} or null.
     Only AI states sell (the player's land is not on the market). */
  ACap.offer = function (G, n) {
    let best = null;
    for (let p = 1; p < G.provinces.length; p++) {
      const Pr = G.provinces[p], o = G.nations[Pr.owner];
      if (!o || o === n || !o.alive || o.id === G.player || !o.ai || ID.atWar(G, n.id, o.id) || o.capital < 0 || p === G.prov[o.capital]) continue;
      if (!(o.gold < 120 || o.debt > Math.max(200, o.gdp * 2) || o.stab < 40)) continue;
      const tiles = Pr.cnt[o.id] || 0; if (tiles < 4 || tiles > o.tiles * 0.25) continue;
      if (!Pr.nb || !Pr.nb.some((q) => G.provinces[q].owner === n.id)) continue;
      if (ID.areRivals(n.ideo, o.ideo) || ID.ideo(o).flags.noPeace) continue;
      const price = Math.round(50 + tiles * 1.1 + Pr.urban * 220 + (Pr.core === o.id ? tiles * 0.8 : 0));
      const score = tiles / price;
      if (!best || score > best.score) best = { Pr, o, price, tiles, score };
    }
    return best;
  };
  const transfer = (G, Pr, from, to) => { for (let i = 0; i < G.N; i++) if (G.prov[i] === Pr.id && G.owner[i] === from.id) ID.setOwner(G, i, to.id); ID.recalcBorders(G); };
  ACap.buy = function (G, n) {
    const b = ACap.offer(G, n); if (!b || n.gold < b.price) return 'No sale.';
    n.gold -= b.price; b.o.gold += b.price;
    transfer(G, b.Pr, b.o, n);
    if (b.Pr.core === b.o.id) b.Pr.core = n.id; // sold by deed: the claim goes with it
    n.cnt.bought = (n.cnt.bought || 0) + 1; ID.addOp(G, b.o.id, n.id, 4);
    ID.news(G, n.name + ' buys ' + (b.Pr.name || 'a province') + ' from ' + b.o.name + ' for ' + b.price + ' gold. Not a shot is fired.', n.id === G.player ? 'good' : 'dip', n.id, b.o.id);
    ID.chron(G, 'treaty', n.name + ' buys ' + (b.Pr.name || 'a province') + ' from ' + b.o.name + '.', n.id, b.o.id);
    if (ID.Press) ID.Press.add(G, { w: 2, kind: 'dip', a: n.id, b: b.o.id, art: 'peace', title: n.base + ' buys ' + (b.Pr.name || 'a province'), key: 'acbuy' + n.id, gap: 300,
      text: 'The ' + b.o.adj + ' government, short of money, has sold ' + (b.Pr.name || 'a border province') + ' to the covenant of ' + n.base + ' for ' + b.price + ' gold. The residents were not asked; the covenant says they may leave again whenever they like, which is more than their old government offered.' });
    return '';
  };
  /* A province that wants out goes: to the friendliest neighbour at peace with us, or on its own. At most one every two years. */
  function exitMonth(G, n) {
    const x = n.sigx; if ((x.exitAt || 0) > G.tick || P().inCivil(G, n)) return;
    const capP = n.capital >= 0 ? G.prov[n.capital] : -1;
    for (let p = 1; p < G.provinces.length; p++) {
      const Pr = G.provinces[p]; if (Pr.owner !== n.id || p === capP || (Pr.unrest < 55 && !(Pr.opp && Pr.opp !== n.ideo && Pr.oppStr > 55))) continue;
      if (!G.rng.chance(0.03 * (1 + (100 - (n.sig || 50)) / 100))) continue;
      let to = null, bo = -1e9;
      for (const q of Pr.nb || []) { const o = G.nations[G.provinces[q].owner]; if (!o || o === n || !o.alive || ID.atWar(G, n.id, o.id)) continue; const op = ID.op(G, n.id, o.id); if (op > bo) { bo = op; to = o; } }
      x.exitAt = G.tick + 2 * YEAR; n.cnt.exits = (n.cnt.exits || 0) + 1;
      const nm = Pr.name || 'A province';
      if (to) { transfer(G, Pr, n, to); if (Pr.core === n.id) Pr.core = to.id; ID.news(G, nm + ' signs with ' + to.adj + ' agencies and leaves ' + n.name + '. Under the covenant nobody may stop it.', n.id === G.player ? 'bad' : 'pol', n.id, to.id); }
      else if (P().secede) { P().secede(G, n, Pr); ID.news(G, nm + ' leaves ' + n.name + ' and goes its own way, as the covenant allows.', n.id === G.player ? 'bad' : 'pol', n.id); }
      if (n.id === G.player) ID.logGrief(n, G.tick, nm + ' left the covenant.');
      if (ID.Press) ID.Press.add(G, { w: 2, kind: 'pol', a: n.id, b: to ? to.id : 0, art: 'parliament', title: nm + ' walks out of ' + n.base, key: 'acexit' + n.id, gap: 600,
        text: 'Nobody marched and nobody was shot: ' + nm + ' simply took its custom ' + (to ? 'to ' + to.adj + ' agencies' : 'elsewhere') + '. In ' + n.base + ' the right to leave is written into the covenant, and the covenant’s defenders call this the system working.' });
      return;
    }
  }
  const P = () => ID.Politics, Ev = () => ID.Events;
  /* The dominant agency stops asking for contracts. */
  ACap.agencyState = function (G, n, t) {
    const to = /Defence|Security|Guard|Protective|Watch|Bastion|Bulwark|Ironclad|Vanguard/.test(t.name) ? 'junta' : 'nrx';
    (G.coupLog = G.coupLog || []).push({ t: G.tick, ideo: n.ideo, src: 'agency', mil: n.fs.military, stab: n.stab, ok: true });
    ID.chron(G, 'coup', t.name + ' stops selling protection in ' + n.name + ' and starts governing it.', n.id);
    P().changeIdeology(G, n, to, 'coup');
  };

  /* ---------------------------------------------------------------- the monthly market */
  function month(G, n) {
    const ag = ACap.agencies(G, n), x = n.sigx, rng = G.rng;
    // quality wanders, customers follow quality, and size buys more size (the bigger the contracts, the faster)
    for (const a of ag) a.q = clamp(a.q + rng.range(-0.08, 0.08), 0.1, 0.9);
    const avg = ag.reduce((s, a) => s + a.q, 0) / ag.length, big = ACap.top(ag), spend = (n.budget.arms || 0) + (n.budget.security || 0);
    // a leader past half the market raises its fees and customers drift to the cheaper rivals
    for (const a of ag) a.s += (a.q - avg) * 0.05 + (a === big ? 0.002 + spend * 0.004 - Math.max(0, a.s - 0.45) * 0.08 : 0);
    if ((x.excl || 0) > G.tick) big.s += 0.015;
    norm(ag);
    n.sig = ACap.comp(ag);
    n.tax = ACap.fee(n.sig);
    // contracts too small for a war: thin protection
    const cover = clamp((n.budget.arms || 0) / 0.25, 0, 1);
    keep(n, 'Thin protection', 'def', cover < 1 ? -0.18 * (1 - cover) : 0);
    // unpaid companies
    if (n.gold < 0) { x.unpaid = (x.unpaid || 0) + 1; if (x.unpaid === 1 && isP(G, n)) ID.news(G, 'The treasury is empty and the companies are unpaid: every day without money, some of them walk away.', 'bad', n.id); } else x.unpaid = 0;
    // a dominant agency is a state in waiting
    const t = ACap.top(ag);
    x.dom = t.s > 0.6 ? (x.dom || 0) + 1 : t.s < 0.55 ? 0 : Math.max(0, (x.dom || 0) - 1);
    if (x.dom === 4) { if (isP(G, n)) { if (!Ev().pending(G, 'ac_monopoly')) Ev().queue(G, n, 'ac_monopoly', {}); } else if (n.gold > 150 && rng.chance(0.6)) { n.gold -= 100; ACap.spread(G, n, 0.5); } }
    if ((x.dom >= 24 || t.s > 0.85) && !P().inCivil(G, n)) {
      x.dom = 0;
      if (isP(G, n)) { if (!Ev().pending(G, 'ac_state')) Ev().queue(G, n, 'ac_state', { name: t.name }); }
      else if (n.gold > 400 && rng.chance(0.5)) { n.gold -= 400; ACap.spread(G, n, 0.8); }
      else { ACap.agencyState(G, n, t); return; }
    }
    exitMonth(G, n);
  }
  function extra(n, G) {
    const ag = n.sigx && n.sigx.ag; if (!ag) return [];
    const rows = ag.slice().sort((a, b) => b.s - a.s).map((a, k) => [a.name, pct(a.s) + ' of the contracts' + (k === 0 && n.sigx.dom ? ' · dominant for ' + n.sigx.dom + ' months' : ''), k === 0 && a.s > 0.6 ? false : null]);
    rows.push(['Members’ fees', n.tax + '% of output (set by the agencies, not by you)', n.tax < 6.5]);
    const b = G ? ACap.offer(G, n) : null;
    rows.push(['Land for sale', b ? (b.Pr.name || 'A province') + ' from ' + b.o.name + ', ' + b.tiles + ' tiles, ' + b.price + ' gold' : 'no neighbour needs the money just now', b ? true : null]);
    if ((n.sigx.exitAt || 0) > (G ? G.tick : 0)) rows.push(['Exit', 'a province left recently; the next may go after ' + ID.dateOf(n.sigx.exitAt).short, null]);
    return rows;
  }

  /* ================================================================ the doctrine */
  D.ancap = {
    name: 'The Market for Protection', gauge: 'Competition', init: 60,
    desc: 'There is no government to capture, only firms to hire. Defence, courts and roads are bought from competing agencies. Competition keeps them cheap, honest and efficient, and thin when war comes; let one agency win and it is strong, dear, wasteful and a state in all but name. Members’ fees are what the agencies charge: 8% of output in a free market, up to 14% under a monopoly.',
    drift: () => 0, // the engine sets the gauge from the agencies' shares each month
    fx: (n, v) => ({ eff: (v - 50) * 0.002, conf: (v - 50) * 0.2, growth: (v - 50) * 0.004, trade: (v - 50) * 0.002, def: -(v - 50) * 0.003, coup: -(v - 50) * 0.01 }),
    low: 'One agency dominates: stronger defence and higher fees, waste, and a state in waiting.',
    high: 'Many agencies compete: cheap, efficient protection that is thin when war comes.',
    acts: [
      { id: 'ac_spread', name: 'Spread the contracts', desc: 'Give this year’s contracts to the smaller agencies. Competition rises; the leader sulks.', cost: { gold: 60 }, cd: 12,
        fx: [['fn', (G, n) => ACap.spread(G, n, 0.5)]], ai: (n) => !!(n.sigx && n.sigx.ag) && ACap.top(n.sigx.ag).s > 0.55 },
      { id: 'ac_exclusive', name: 'An exclusive contract', desc: 'Hand the whole defence of the covenant to the strongest agency for two years: defence +12%, attack +5%, and its share of the market grows every month.', cost: { gold: 80 }, cd: 24,
        fx: [['fn', (G, n) => { n.sigx.excl = G.tick + 2 * YEAR; }], ['mod', 'def', 0.12, 24, 'Exclusive contract'], ['mod', 'atk', 0.05, 24, 'Exclusive contract']], ai: (n, v) => !!n.a.threatened && n.gold > 200 && v > 45 },
      { id: 'ac_buy', name: 'Buy a province', desc: 'Buy the best-priced border province from a neighbour that needs the money (broke, in debt or unstable). The doctrine card names the offer. No war, no claim left behind.', cost: {}, cd: 18,
        can: (n, G) => { const b = ACap.offer(G, n); return !b ? 'No neighbour needs the money just now.' : n.gold < b.price ? 'The best offer is ' + (b.Pr.name || 'a province') + ' from ' + b.o.name + ' for ' + b.price + ' gold.' : ''; },
        fx: [['fn', (G, n) => ACap.buy(G, n)]], ai: (n, v, G) => { const b = ACap.offer(G, n); return !!b && !n.nwars && n.gold > b.price * 1.6 + 100; } },
      { id: 'ac_ransom', name: 'Buy peace', desc: 'War is bad for business. Pay the strongest enemy to go home: gold equal to 150 plus four tenths of its army (in thousands). The peace follows the war score as usual.', cost: {}, cd: 24,
        can: (n, G) => { const e = ACap.foe(G, n); return !e ? 'You are not at war.' : ID.ideo(e).flags.noPeace ? e.name + ' does not take money for peace.' : n.gold < ACap.ransom(e) ? 'Needs ' + ACap.ransom(e) + ' gold for ' + e.name + '.' : ''; },
        fx: [['fn', (G, n) => { const e = ACap.foe(G, n); if (!e) return; const c = ACap.ransom(e); n.gold -= c; e.gold += c; ID.news(G, n.name + ' pays ' + c + ' gold and ' + e.name + ' goes home.', 'dip', n.id, e.id); ID.Diplomacy.peace(G, n, e); }]],
        ai: (n, v, G) => !!n.a.losing && n.gold > 300 },
    ],
    war: { name: 'Contract armies', desc: 'Hired companies fight hard while they are paid, and hardest for property they are paid to guard: cities are held 40% better and home ground 15%; offensives cost a tenth more. Their morale is the treasury: unpaid, they melt away.', dp: { cityDef: 1.4, homeDef: 1.15, aloss: 1.1 } },
    order: { key: 'ac_bounty', name: 'Bounties', gold: 60, cd: 180, range: 999,
      desc: 'Post bounties on the enemy’s officers and depots: their attack falls 12% for three months, and the hunters are paid partly out of the enemy’s own treasury.',
      run: (G, n, Dn) => { ID.addMod(Dn, 'atk', -0.12, 3, 'Bounties on officers'); const take = Math.min(120, Math.max(0, Dn.gold) * 0.1); Dn.gold -= take; n.gold += take * 0.5; return 'Bounty hunters go to work in ' + Dn.name + ': attack −12% for three months.'; }, ai: () => true },
    month, extra,
  };
  ACap.foe = (G, n) => { let best = null; for (const e of ID.Diplomacy.enemies(G, n)) if (!best || ID.Diplomacy.power(e) > ID.Diplomacy.power(best)) best = e; return best; };
  ACap.ransom = (e) => Math.round(150 + Math.max(0, e.troops) * 0.4);

  /* ================================================================ the inner circle */
  const L = (id, name, desc, lean, mods, now, sig, ai) => ({ id, name, desc, lean, mods, now: now || [], sig: sig || 0, ai: ai || (() => 1) });
  R.body.ancap = { circle: 'Board of Arbitration', session: 'Covenant Meeting', every: 36, purge: 'dismiss',
    t: { army: 'Director of the Defence Agency', police: 'Chief Arbitrator', economy: 'Chair of the Exchange', ideology: 'Editor of the Covenant Review', foreign: 'Envoy of the Proprietors' } };
  R.lines.ancap = [
    L('ac_lean', 'Leaner contracts', 'Rebid every contract, every year, to the cheapest agency that passes the audit.', 'ancap', { eff: 0.04, def: -0.04 }, [], 0.4, () => 1.3),
    L('ac_guard', 'Guard the frontier', 'Longer contracts for the defence agencies, and a bonus for every border post manned.', 'minarchy', { def: 0.06, rev: -0.03 }, [], -0.3, (n) => (n.a.threatened || n.nwars ? 2 : 0.6)),
    L('ac_incorp', 'Incorporate', 'Let the great proprietors merge the agencies they own into one holding company.', 'nrx', { prod: 0.05, trade: 0.03 }, [['sup', 'capital', 4]], -0.6, () => 0.7),
  ];

  /* ================================================================ forbidden verbs */
  ID.FORBID.ancap = {
    emergency: 'There is no state to declare an emergency: the covenant has members, not subjects.',
    'dec:martial_law': 'There is no state to declare martial law.', 'dec:emergency_committee': 'There is no state to declare an emergency.',
    'build:factory': 'The covenant builds nothing: firms build what pays, and charters are not ours to sell.',
    'build:city': 'The covenant founds no towns: towns are founded by contract, or not at all.',
    'law:recruit:*': 'No one is drafted into a covenant: every soldier is a hired company.',
  };

  /* ================================================================ dispatches */
  EV.push({ id: 'ac_monopoly', sys: 1, tone: 'mixed', sfx: 'stamp', title: (n) => { const t = n.sigx && n.sigx.ag ? ACap.top(n.sigx.ag) : null; return (t ? t.name : 'One agency') + ' is buying its rivals'; },
    text: (n) => { const ag = n.sigx.ag || [], t = ACap.top(ag); return t.name + ' now holds ' + pct(t.s) + ' of the covenant’s contracts and is making offers for the rest. Its patrols are the best paid and best armed in the territory, its fees are rising, and its directors have started using the word “we” about the covenant.'; },
    opts: [
      { label: 'Spread the contracts (120 gold)', tip: 'Pay the smaller agencies to stay in the market. Competition rises sharply.', can: (n) => n.gold >= 120, fx: [['gold', -120], ['fn', (G, n) => ACap.spread(G, n, 0.6)]], ai: 2 },
      { label: 'Sign it to a long contract', tip: 'Defence +12% for two years, and the agency grows faster still. A strong guard, and a state in waiting.', fx: [['fn', (G, n) => { n.sigx.excl = G.tick + 2 * YEAR; }], ['mod', 'def', 0.12, 24, 'Exclusive contract']], ai: 1 },
      { label: 'Let the market decide', tip: 'Customers may yet switch. Or not.', fx: [['note', 'Nothing changes for now', null]], ai: 1 },
    ] });
  const isA = (n) => n.ideo === 'ancap';
  EV.push({ id: 'd_ap_poor', tone: 'mixed', theme: 'money', title: 'The quarter nobody insures', w: (n) => (isA(n) ? 1.5 : 0),
    text: 'The agencies have stopped patrolling the dockside quarter: its residents pay too little to cover the risk. Since Tuesday it has had no police, no court and three fires.',
    opts: [
      { label: 'Let the market price it', fx: [['sup', 'workers', -8], ['unrest', 4], ['sup', 'capital', 4]], ai: 1 },
      { label: 'A charity contract', tip: 'The proprietors pay one agency to cover the quarter, as a gift. The biggest agency gets the job.', fx: [['gold', -60], ['sup', 'workers', 6], ['sig', -4]], ai: 1 },
      { label: 'Let the dockers form their own agency', tip: 'One more competitor, owned by the people it guards. Their politics come with it.', fx: [['sup', 'workers', 4], ['sig', 6], ['opp', 6]], ai: 0.5 },
    ] });
  EV.push({ id: 'd_ap_feud', tone: 'bad', theme: 'army', title: 'Two agencies, one warehouse', w: (n) => (isA(n) && n.sigx && n.sigx.ag ? 1.2 : 0),
    text: (n) => { const ag = (n.sigx.ag || []).slice().sort((a, b) => b.s - a.s); return (ag[0] ? ag[0].name : 'One agency') + ' and ' + (ag[1] ? ag[1].name : 'another') + ' both claim to guard the same grain warehouse, and both have sent men with rifles. Arbitration is scheduled for next month; the shooting started this morning.'; },
    opts: [
      { label: 'Pay for an emergency arbitration', fx: [['gold', -40], ['stab', 2]], ai: 2 },
      { label: 'Let them settle it', tip: 'The winner takes customers from the loser: the biggest agency grows.', fx: [['stab', -4], ['fn', (G, n) => { const ag = ACap.agencies(G, n), t = ACap.top(ag); t.s += 0.08; norm(ag); n.sig = ACap.comp(ag); }]], ai: 1 },
    ] });
  EV.push({ id: 'ac_state', sys: 1, tone: 'bad', sfx: 'alarm', title: (n, G, c) => c.name + ' is the state now',
    text: (n, G, c) => c.name + ' controls the courts, the roads and every rifle in the covenant. Its directors have stopped renewing contracts and started issuing regulations. They offer you a seat on the board, as long as you understand who chairs it.',
    opts: [
      { label: 'Let it govern', tip: 'The covenant becomes a state again: a junta if the agency is a defence firm, a sovereign corporation if not. You keep playing.', fx: [['fn', (G, n, c) => ACap.agencyState(G, n, { name: c.name })]] },
      { label: 'Buy it out (400 gold, 30 authority)', tip: 'The members pool their money and buy the agency’s rivals back into business.', can: (n) => n.gold >= 400 && n.auth >= 30, fx: [['gold', -400], ['auth', -30], ['fn', (G, n) => ACap.spread(G, n, 0.8)]] },
      { label: 'Break it by force', tip: 'Civil war: the agency holds the provinces where its patrols are, a share as large as its share of the market; the other agencies fight for the covenant.', fx: [['fn', (G, n, c) => {
        const t = (n.sigx.ag || []).find((a) => a.name === c.name) || { s: 0.6 }, capP = G.prov[n.capital], mine = [];
        for (let p = 1; p < G.provinces.length; p++) if (G.provinces[p].owner === n.id && p !== capP) mine.push(G.provinces[p]);
        G.rng.shuffle ? G.rng.shuffle(mine) : mine.sort(() => G.rng.next() - 0.5);
        const provs = mine.slice(0, Math.max(1, Math.round(mine.length * clamp(t.s * 0.6, 0.2, 0.55)))).map((x) => x.id);
        if (provs.length) P().civilWar(G, n, 'junta', provs, 0); ACap.spread(G, n, 0.9);
      }]] },
    ] });
})();
