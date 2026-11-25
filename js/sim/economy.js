/* IRON DIALECTIC — economy: eight models sharing one accounting frame. Runs monthly per nation. No DOM. */
(function () {
  'use strict';
  const ID = (globalThis.ID = globalThis.ID || {});
  const B = ID.B, clamp = ID.clamp;
  const E = (ID.Economy = {});
  const CATS = (E.CATS = ['welfare', 'security', 'science', 'arms', 'heavy']);
  const PRIVATE = { market: 1, mixed: 1, pact: 1, trade: 1 };
  const DEBT_OK = { market: 1, mixed: 1, pact: 1, trade: 1, manor: 1 };

  E.budgetMax = function (n, cat) {
    const I = ID.ideo(n);
    if (cat === 'heavy') return I.econ.model === 'plan' || I.econ.model === 'cyber' ? 0.35 : 0;
    if (I.bmax && I.bmax[cat] != null) return I.bmax[cat];
    return 0.4;
  };
  /* Who may change the budget right now? '' = free, else a reason. */
  E.budgetLock = function (n) {
    const I = ID.ideo(n);
    if (I.econ.model === 'council') return 'The ' + I.control.body + ' sets the budget each January. You may table motions.';
    if (I.flags.fiveYear && n.plan) return 'The Five-Year Plan fixes these shares until ' + ID.dateOf(n.plan.end).short + '.';
    return '';
  };
  E.setBudget = function (n, cat, v) {
    v = clamp(v, 0, E.budgetMax(n, cat));
    let others = 0; for (const c of CATS) if (c !== cat) others += n.budget[c];
    n.budget[cat] = Math.min(v, Math.max(0, 0.88 - others));
  };
  E.debtCap = (n) => Math.max(120, n.gdp * 14);

  /* The ideological market. fit: how much a trade route is worth between two systems, from their ideological
     affinity (−60 … +45) and a shared bloc. */
  E.ROUTE_K = 0.04; E.PORT_ROUTES = 3; E.OVERLAND = 0.35; E.FIT = 0.3; E.BLOC_FIT = 0.2; E.PLAN_TRADE = 0.4; E.PRIV_TRADE = 0.3; E.ARMS_K = 0.25; E.PLAN_ARMS = 1.2; E.IMPORT_SHARE = 0.25;
  /* Kit target from a month's arms money; fills the n.a.arms* figures the interface shows. */
  E.kitTarget = function (G, n, arms, routes) {
    const aNeed = Math.max(1, E.army(n) * (G.stats.armsRef || 0.035)), armsCap = E.armsCap(n);
    const made = Math.min(arms, armsCap);
    let spare = 0; for (const r of routes || []) if (r.fit >= 1 && G.nations[r.o]) spare += G.nations[r.o].a.icSpare || 0;
    const impCap = Math.min(aNeed * E.IMPORT_SHARE, spare);
    const imp = n.laws.trade === 'autarky' ? 0 : Math.max(0, Math.min((arms - made) / 1.5, impCap));
    const refill = (made + imp) * (n.a.dp && n.a.dp.equipRegen ? n.a.dp.equipRegen : 1) * (n.a.shortage ? 0.75 : 1) * (n.id === G.player ? E.ARS.playerIn : 1), burn = E.warBurn(G, n, aNeed);
    const eq = clamp(0.62 + 0.38 * Math.max(0, refill - burn) / aNeed, 0.62, 1.35); // where the arsenal settles if nothing changes
    Object.assign(n.a, { eqTarget: eq, armsPaid: arms, armsNeed: aNeed, armsCap, armsMade: made, armsImp: imp, armsImpCap: impCap, armsWaste: Math.max(0, arms - made - imp * 1.5), refill, burn });
    return eq;
  };

  /* ---------------------------------------------------------------- the arsenal
     A stockpile of equipment. Refilled each month by the arms the factories make (and imports); 1/24 of it ages out each
     month; war burns it: about a month of the army's needs per month of active fighting (× posture), and the kit of every
     soldier lost. Kit = 62% + 38% × arsenal ÷ (24 months of needs), at most 135%. Peacetime it settles where the old
     equipment did; at war, unless the arms flow rises, it drains over about two years. */
  /* food: granaries in months of need; each working city's market adds CITY_FOOD to the harvest (up to CITY_FOOD_MAX);
     population stops growing when the harvest is under GROW_AT of need, so it settles where the land feeds it */
  E.NEED = 0.3; E.GRAIN_MAX = 6; E.GRAIN_START = 3; E.CITY_FOOD = 0.04; E.CITY_FOOD_MAX = 0.25; E.GROW_AT = 1.05;
  E.harvest = (n) => (n.a.harvest != null ? n.a.harvest : n.foodBal);

  /* The grain year. Each spring the coming harvest is forecast (input randomness: the player learns it six months
     ahead); it arrives in September and lasts a year. A bad year makes the next one gentler, so no run of bad luck
     piles up. What to do with grain is a policy: export the surplus (gold now, two months in store), feed the
     people (the surplus makes the population grow faster and further, four months in store), or fill
     the granaries (a year in store, half the growth, a small storage bill). Grain is bought and sold at a world price
     that rises when the world's harvest is poor. */
  E.WX = [
    { k: 'failed', name: 'Failed harvest', m: 0.72, p: 0.06 }, { k: 'poor', name: 'Poor harvest', m: 0.86, p: 0.18 }, { k: 'fair', name: 'Fair harvest', m: 1, p: 0.32 },
    { k: 'good', name: 'Good harvest', m: 1.08, p: 0.29 }, { k: 'bumper', name: 'Bumper harvest', m: 1.2, p: 0.15 },
  ];
  E.wxOf = (k) => E.WX.find((w) => w.k === k) || E.WX[2];
  E.POLICY = {
    export: { name: 'Export the surplus', store: 2, grow: 0, desc: 'Sell every harvest above 110% of need abroad at the world price. Gold every month; only two months in store, and the surplus feeds no extra growth.' },
    feed: { name: 'Feed the people', store: 4, grow: 1, desc: 'The surplus stays at home: the population grows faster (up to 70% faster while the harvest runs well above need) and past what the land alone supports. Four months in store.' },
    stock: { name: 'Fill the granaries', store: 12, grow: 0.5, desc: 'Put grain away: up to a year in store against a failed harvest, a war or a blockade, and stability +2 while nine months are in store. When the world’s harvest fails and grain is dear, part of the store is sold at that price. Half the extra growth; storage costs a little gold.' },
  };
  E.pol = (n) => E.POLICY[n.grainPol] || E.POLICY.feed;
  E.GRAIN_PRICE = 0.011; // gold per person-month of grain at a normal world harvest
  E.grainPrice = (G) => (G.world && G.world.grainP) || E.GRAIN_PRICE;
  /* Spring: the forecast; September: the harvest comes in. The world price follows the world's harvest. */
  E.weatherMonth = function (G) {
    const mo = Math.floor(G.tick / 30) % 12;
    for (const n of G.nations) {
      if (!n || !n.alive) continue;
      const w = n.wx || (n.wx = { cur: 'fair', next: null, last: 'fair' });
      if (mo === 2 || !w.next) {
        const bad = w.cur === 'poor' || w.cur === 'failed';
        w.next = G.rng.weighted(E.WX, (x) => x.p * (bad && x.k === 'failed' ? 0 : bad && x.k === 'poor' ? 0.5 : 1)).k;
        if (n.id === G.player && mo === 2 && w.next !== 'fair' && w.next !== 'good') ID.news(G, 'The forecast for this year’s harvest: ' + E.wxOf(w.next).name.toLowerCase() + ', in by September.', w.next === 'bumper' ? 'good' : 'bad', n.id);
      }
      if (mo === 8) { w.last = w.cur; w.cur = w.next; }
    }
    let s = 0, k = 0; for (const n of G.nations) if (n && n.alive && n.wx) { s += E.wxOf(n.wx.cur).m; k++; }
    G.world.grainP = E.GRAIN_PRICE * clamp(1 + (1 - (k ? s / k : 1)) * 5, 0.6, 2);
  };
  E.grainMonths = (n) => (E.harvest(n) >= 1 ? Infinity : (n.grain || 0) / (1 - E.harvest(n))); // until the granaries are empty
  E.ARS = { life: 24, war: 0.6, idle: 0.3, lossK: 0.25, loot: 0.03, shells: 0.3, player: 0.4, playerIn: 1.5 };
  /* Players found the drain confusing and ran dry at every war: the player's war burn, fallen kit and shells × 0.4, its refill × 1.5. The AI is unchanged. */
  E.drainK = (G, n) => (G && n.id === G.player ? E.ARS.player : 1);
  E.POSTURE_BURN = { attack: 1.3, balanced: 1, defend: 0.7, depth: 0.9 };
  E.active = (G, n) => G.attacks.some((a) => a.to && (a.from === n.id || a.to === n.id));
  E.warBurn = (G, n, need) => (n.nwars ? need * E.ARS.war * (E.active(G, n) ? 1 : E.ARS.idle) * (E.POSTURE_BURN[n.posture] || 1) * E.drainK(G, n) : 0);
  E.army = (n) => (n.a.armyAvg != null ? n.a.armyAvg : n.troops); // army size, smoothed over about a year: a draft dilutes kit gradually
  E.kitOf = (n, need) => clamp(0.62 + 0.38 * (n.ars || 0) / (E.ARS.life * Math.max(1, need)), 0.62, 1.35);
  E.initArsenal = (G, n) => { if (n.ars == null) { const need = Math.max(1, n.troops * ((G.stats && G.stats.armsRef) || 0.035)); n.ars = Math.max(0, (n.equip - 0.62) / 0.38) * E.ARS.life * need; } };
  /* Months of fighting the arsenal can carry at the present flow (Infinity if it is not falling). */
  E.monthsLeft = (n) => { const net = (n.a.burn || 0) + (n.ars || 0) / E.ARS.life - (n.a.refill || 0); return net > 0.01 ? (n.ars || 0) / net : Infinity; };
  E.arsenalMonth = function (G, n) {
    E.initArsenal(G, n);
    n.a.armyAvg = n.a.armyAvg == null ? n.troops : n.a.armyAvg + (n.troops - n.a.armyAvg) * 0.12;
    const lost = n.troops > 0 ? n.ars * E.ARS.lossK * Math.min(0.5, (n.casM || 0) / n.troops) * E.drainK(G, n) : 0; // the kit of the fallen
    const aged = n.ars / E.ARS.life;
    n.ars = Math.max(0, n.ars + (n.a.refill || 0) - aged - (n.a.burn || 0) - lost);
    n.a.arsIn = n.a.refill || 0; n.a.arsAged = aged; n.a.arsLost = lost; n.a.lootM = n.a.loot || 0; n.a.loot = 0; n.a.shellsM = n.a.shells || 0; n.a.shells = 0;
    n.equip = E.kitOf(n, n.a.armsNeed);
  };
  /* After a budget change: show the new target now rather than next month. */
  E.kitNow = (G, n) => { if (G && n.rev != null && n.a.armsNeed) E.kitTarget(G, n, Math.max(0, n.rev) * n.budget.arms, n.a.routes); };
  E.fit = (G, n, o) => 1 + E.FIT * clamp(ID.ideoAffinity(n.ideo, o.ideo) / 45, -1, 1) + (ID.sameBloc(G, n.id, o.id) ? E.BLOC_FIT : 0);
  E.armsCap = (n) => (n.a.ic || 0) * E.ARMS_K * (ID.ideo(n).econ.model === 'plan' || ID.ideo(n).econ.model === 'cyber' ? E.PLAN_ARMS : 1);

  /* ---------------------------------------------------------------- the bomb
     A programme, then warheads one at a time. Progress per month = rate × (industrial capacity) × (science share). */
  E.ATOM = {
    atom: { start: 1200, share: 0.08, need: 100, mil: 6, fac: 8, rate: 1.2, icRef: 120, head: 2000, days: 1080, perSilo: 2 },
    thermo: { start: 3000, share: 0.15, need: 100, mil: 7, fac: 14, rate: 0.9, icRef: 220, head: 6000, days: 1800, perSilo: 1 },
  };
  E.atom = (n) => n.atom || (n.atom = { lv: (n.cnt && n.cnt.nukesBuilt) || n.nukes ? 1 : 0, prog: 0, on: '', make: null }); // old saves: a state that built warheads keeps the bomb
  const LV = { atom: 1, thermo: 2 };
  E.atomRate = (n, kind) => { const A = E.ATOM[kind]; return A.rate * clamp((n.a.ic || 0) / A.icRef, 0.4, 1.6) * (0.8 + 2 * (n.budget.science || 0)); };
  E.atomBlock = function (G, n, kind) {
    const A = E.ATOM[kind], s = E.atom(n);
    if (s.lv >= LV[kind]) return kind === 'thermo' ? 'You already have the thermonuclear bomb.' : 'You already have the bomb.';
    if (s.on) return 'A programme is already running.';
    if (kind === 'thermo' && s.lv < 1) return 'First you need the atomic bomb.';
    if (n.tech.mil < A.mil) return 'Needs military technology ' + A.mil + '.';
    if (ID.nbe(n, B.FACTORY) < A.fac) return 'Needs ' + A.fac + ' working factories (you have ' + Math.floor(ID.nbe(n, B.FACTORY)) + ').';
    return '';
  };
  E.startAtom = function (G, n, kind) {
    const s = E.atom(n); s.on = kind; s.prog = 0; s.startAt = G.tick; s.leaked = 0;
    if (n.id === G.player) ID.news(G, (kind === 'thermo' ? 'The thermonuclear programme' : 'The atomic programme') + ' begins. It will take ' + Math.round(E.ATOM[kind].need / Math.max(0.1, E.atomRate(n, kind)) / 12) + ' years at the present pace.', 'eco', n.id);
  };
  E.makeBlock = function (G, n, kind) {
    const A = E.ATOM[kind], s = E.atom(n);
    if (s.lv < LV[kind]) return kind === 'thermo' ? 'Finish the thermonuclear programme first.' : 'Finish the atomic programme first.';
    if (s.make) return 'A device is already being built (ready ' + ID.dateOf(s.make.done).short + ').';
    if (!n.nb[B.SILO]) return 'Build a missile silo first.';
    const have = kind === 'thermo' ? n.thermo || 0 : n.nukes;
    if (have >= n.nb[B.SILO] * A.perSilo) return 'Your silos are full: ' + A.perSilo + ' per silo.';
    return '';
  };
  E.startMake = function (G, n, kind) { E.atom(n).make = { kind, start: G.tick, done: G.tick + E.ATOM[kind].days }; };
  /* Monthly; returns what the programme cost this month. */
  E.atomMonth = function (G, n, rev) {
    const s = n.atom; if (!s) return 0;
    if (s.make && G.tick >= s.make.done) {
      const k = s.make.kind; s.make = null;
      if (k === 'thermo') { n.thermo = (n.thermo || 0) + 1; n.cnt.thermoBuilt = (n.cnt.thermoBuilt || 0) + 1; n.threat += 15; }
      else { n.nukes++; n.cnt.nukesBuilt = (n.cnt.nukesBuilt || 0) + 1; n.threat += 8; }
      if (n.id === G.player) { ID.news(G, (k === 'thermo' ? 'A thermonuclear device' : 'An atomic warhead') + ' is ready in the silos.', 'good', n.id); ID.sfx(G, 'alarm'); }
    }
    if (!s.on) { n.a.atomCost = 0; return 0; }
    const A = E.ATOM[s.on], cost = Math.max(0, rev) * A.share;
    n.a.atomCost = cost; n.a.atomStall = n.gold < cost;
    if (n.a.atomStall) return 0; // no money, no progress this month
    s.prog += E.atomRate(n, s.on);
    if (!s.leaked && s.prog >= A.need * 0.5) { // intelligence services find out
      s.leaked = 1;
      for (const o of G.nations) if (o && o.alive && o !== n && !ID.sameBloc(G, o.id, n.id)) ID.addOp(G, o.id, n.id, s.on === 'thermo' ? -10 : -6);
      if (ID.isMajor(G, n) || n.id === G.player) ID.news(G, 'Intelligence services report that ' + n.name + ' is building ' + (s.on === 'thermo' ? 'a thermonuclear weapon.' : 'an atomic bomb.'), 'bad', n.id);
      if (ID.Press && n.id !== G.player) ID.Press.add(G, { w: 2, kind: 'nuke', a: n.id, title: n.base + ' and the bomb', text: 'Defectors and photographs from the air say that ' + n.name + ' has built a closed city around a ' + (s.on === 'thermo' ? 'second, larger' : 'reactor') + ' project. Its government denies everything. Its neighbours have stopped believing it.' });
    }
    if (s.prog >= A.need) {
      const k = s.on; s.lv = LV[k]; s.on = ''; s.prog = 0; s.testAt = G.tick;
      n.threat += k === 'thermo' ? 40 : 25; G.world.tension = Math.min(100, G.world.tension + (k === 'thermo' ? 20 : 10));
      ID.chron(G, 'nuke', n.name + (k === 'thermo' ? ' tests a thermonuclear weapon.' : ' becomes an atomic power.'), n.id);
      ID.news(G, n.name + (k === 'thermo' ? ' has tested a thermonuclear device. The test island no longer exists.' : ' has tested an atomic bomb.'), 'bad', n.id);
      if (ID.isMajor(G, n) || n.id === G.player) ID.headline(G, { kicker: k === 'thermo' ? 'A thousand times the first bomb' : 'A new kind of weapon', title: k === 'thermo' ? n.base + ' tests the sun-weapon' : n.base + ' has the bomb', sub: k === 'thermo' ? 'One device can now erase a country. Every capital is in range of someone.' : n.name + ' tests an atomic device. The flash is seen two hundred miles away.', a: n.id, tone: 'bad' });
      if (n.id === G.player) ID.sfx(G, 'nuke');
    }
    return cost;
  };

  /* Congress of councils sets the budget (council model). */
  E.congress = function (G, n) {
    const I = ID.ideo(n); const b = Object.assign({ welfare: 0, security: 0, science: 0, arms: 0, heavy: 0 }, I.budget);
    if (n.nwars) { b.arms += 0.16; b.welfare -= 0.08; }
    else if (n.a.threatened) { b.arms += 0.07; b.welfare -= 0.03; }
    if (n.famine) { b.welfare += 0.05; b.science -= 0.03; }
    if (n.fs.workers < 45) { b.welfare += 0.05; b.arms -= 0.02; }
    const mo = n.a.mot || {}; for (const c of CATS) b[c] += mo[c] || 0; // motions the congress has passed stay passed
    for (const c of CATS) b[c] = clamp(b[c], 0, 0.45);
    n.budget = b; n.motions = 0;
  };
  E.motion = function (G, n, from, to) {
    if (n.motions >= 3) return 'The congress will hear no more motions this year.';
    if (n.auth < 10) return 'Not enough authority (10).';
    if (n.budget[from] < 0.04) return 'Nothing left to move from there.';
    if (to === 'security' && ID.ideo(n).family === 'anarchist') return 'The federation will not fund a security apparatus.';
    n.auth -= 10; n.motions++; n.budget[from] -= 0.04; n.budget[to] = clamp(n.budget[to] + 0.04, 0, 0.5);
    const mo = n.a.mot || (n.a.mot = {}); mo[from] = (mo[from] || 0) - 0.04; mo[to] = (mo[to] || 0) + 0.04;
    E.kitNow(G, n); // the new target shows at once
    return '';
  };

  E.startPlan = function (G, n) {
    const heavy = n.budget.heavy, P = n.paper || {};
    const base = Math.max(1, n.ind, P.ind || 0); // false figures raise the bar: the new plan starts from what was reported
    n.plan = { start: G.tick, end: G.tick + 5 * 360, base, target: base * (1.1 + heavy * 1.5), shares: Object.assign({}, n.budget) };
    if (ID.ideo(n).flags.quotas) Object.assign(n.plan, {
      y: 0, lie: base / Math.max(1, n.ind), // how far the reported figures lifted this plan
      grain: clamp(Math.max(E.harvest(n) + 0.02, P.grain || 0), 1, 1.05),
      arms: Math.max(n.a.armsMade || 0, P.arms || 0), // hold arms output: missed when bombing, strikes or lost factories cut it
    });
  };

  /* Plan quotas (flags.quotas): three yearly targets — industry on the plan's path, grain (harvest against need) and
     arms output. Industry is the ambition; grain and arms are missed in shocks. A miss is answered in plan_short; false figures book the reported figure in n.paper, a hidden gap the
     next plan is built on, closed only by growing into it or by exposure (plan_exposed). War checks the arms books. */
  E.QUOTA = { tol: 0.98, risk: 0.012, warArms: 4 };
  E.QUOTA_NAME = { ind: 'Industry', grain: 'The harvest', arms: 'Arms output' };
  // the plan's grain figure forgives half of a bad year's weather (the planners blame the sky, and the sky is half right)
  E.quotaReal = (n, k) => (k === 'ind' ? n.ind : k === 'grain' ? E.harvest(n) / Math.sqrt(Math.min(1, E.wxOf(n.wx ? n.wx.cur : 'fair').m)) : n.a.armsMade || 0);
  // industry follows the curve plans actually grow on (slow while the new factories are built): (y/5)^2 of the way
  E.quotaTarget = (p, k, y) => (k === 'ind' ? p.base + (p.target - p.base) * Math.pow(Math.min(5, Math.max(1, y)) / 5, 2) : p[k]);
  E.quotaFmt = (k, v) => (k === 'grain' ? Math.round(v * 100) + '%' : k === 'ind' ? Math.round(v) + '' : Math.round(v * 10) / 10 + '');
  /* the hidden gaps as fractions of what was reported, the arms gap ×4 while the army is fighting */
  E.paperGap = (G, n, war) => {
    let g = 0;
    for (const k in n.paper || {}) g += Math.max(0, n.paper[k] - E.quotaReal(n, k)) / n.paper[k] * (war && k === 'arms' && n.nwars && E.active(G, n) ? E.QUOTA.warArms : 1);
    return g;
  };
  // a month; a cybernetic network anywhere sees through planners' lies half again as often
  E.paperRisk = (G, n) => E.paperGap(G, n, true) * E.QUOTA.risk * (0.5 + n.dist / 100) * (1 + (n.a.buried || 0)) * (ID.alive(G).some((o) => o.ideo === 'cybernetic') ? 1.5 : 1);
  E.lie = function (G, n, miss) {
    n.paper = n.paper || {};
    for (const m of miss) n.paper[m.k] = Math.max(n.paper[m.k] || 0, m.t);
    if (n.paperSince == null) { n.paperSince = G.tick; n.cnt.paperStreaks = (n.cnt.paperStreaks || 0) + 1; }
    n.cnt.lies = (n.cnt.lies || 0) + 1;
  };
  /* the truth is out: the paper goes, and a plan built on it is rebased on the real figures */
  E.clearPaper = (n) => {
    n.paper = null; n.paperSince = null; n.a.buried = 0;
    const p = n.plan; if (p && p.lie > 1) { p.base /= p.lie; p.target /= p.lie; p.lie = 1; }
  };
  function quotaYear(G, n) {
    const p = n.plan, y = Math.floor((G.tick - p.start) / 360);
    if (y <= (p.y || 0) || y > 5) return;
    p.y = y;
    const miss = [];
    for (const k of ['ind', 'grain', 'arms']) {
      const real = E.quotaReal(n, k), t = E.quotaTarget(p, k, y);
      if (n.paper && n.paper[k] && real >= n.paper[k]) delete n.paper[k]; // grown into the lie: the books balance
      if (real < t * E.QUOTA.tol) miss.push({ k, real, t });
    }
    if (n.paper && !Object.keys(n.paper).length) { n.paper = null; n.paperSince = null; n.a.buried = 0; } // grown into: the plan built on it stands
    n.cnt.quotaYears = (n.cnt.quotaYears || 0) + 1;
    if (!miss.length) {
      n.fervor = clamp(n.fervor + 3, 0, 100); if (ID.Focus.FX.sig) ID.Focus.FX.sig(G, n, ['sig', 2]);
      if (n.id === G.player) ID.news(G, 'Year ' + y + ' of the plan: every quota met. Heroes of labour are decorated in the capital.', 'eco', n.id);
      return;
    }
    n.cnt.quotaMiss = (n.cnt.quotaMiss || 0) + 1;
    ID.Events.queue(G, n, 'plan_short', { miss, y });
  }
  E.paperMonth = function (G, n) {
    if (!n.paper || ID.Events.pending(G, 'plan_exposed') || ID.Politics.inCivil(G, n) || (n.a.civilEnd != null && G.tick - n.a.civilEnd < 360)) return;
    if (!G.rng.chance(E.paperRisk(G, n))) return;
    const war = !!(n.paper.arms && n.nwars && E.active(G, n));
    n.cnt.exposed = (n.cnt.exposed || 0) + 1;
    ID.Events.queue(G, n, 'plan_exposed', { gap: E.paperGap(G, n, false), war, since: n.paperSince });
  };

  function endPlan(G, n) {
    const p = n.plan; n.plan = null;
    const ratio = n.ind / p.target;
    if (ratio >= 1) {
      n.cnt.plans = (n.cnt.plans || 0) + 1; n.discipline = Math.min(100, n.discipline + 12); n.fervor = Math.min(100, n.fervor + 10);
      ID.addMod(n, 'legit', 6, 24, 'Plan fulfilled');
      ID.news(G, n.name + ' announces its Five-Year Plan fulfilled (' + Math.round(ratio * 100) + '% of target).', 'eco', n.id);
      if (n.id === G.player) { n.a.planRatio = ratio; ID.Events.queue(G, n, 'plan_fulfilled'); }
    } else if (ID.ideo(n).flags.quotas) {
      // the fifth year's reckoning (quotaYear) has already answered for the shortfall
    } else if (n.id === G.player) {
      n.a.planRatio = ratio; ID.Events.queue(G, n, 'plan_failed');
    } else {
      if (G.rng.chance(0.5)) { n.dist = Math.min(100, n.dist + 12); n.discipline += 4; } else { n.discipline -= 10; n.fervor -= 6; }
    }
  }

  function autoBuild(G, n, type) {
    // place a factory near a city (or a port on the coast for commercial states)
    const cities = []; for (const i of G.blist) if (G.bld[i] === B.CITY && G.owner[i] === n.id) cities.push(i);
    if (!cities.length) cities.push(n.capital);
    for (let t = 0; t < 6; t++) {
      const s = ID.spotNear(G, G.rng.pick(cities), n.id, 9, type === B.PORT);
      if (s >= 0 && !G.rad[s]) { ID.placeBuilding(G, s, type); if (n.id === G.player) ID.fx(G, 'build', s); return true; }
    }
    return false;
  }

  E.month = function (G, n) {
    const I = ID.ideo(n), e = I.econ, model = e.model, L = ID.LAWS;
    const landLaw = L.land.opts[n.laws.land], laborLaw = L.labor.opts[n.laws.labor], tradeLaw = L.trade.opts[n.laws.trade], pressLaw = L.press.opts[n.laws.press], mobLaw = L.mobil.opts[n.laws.mobil];
    const rec = ID.RECRUIT[n.laws.recruit];
    if (model === 'council' && (G.tick % 360 < 30 || !n.a.congress)) { E.congress(G, n); n.a.congress = 1; }
    if (I.flags.fiveYear && n.plan) { n.budget = Object.assign({}, n.plan.shares); if (I.flags.quotas) quotaYear(G, n); if (G.tick >= n.plan.end) endPlan(G, n); }
    if (n.paper) E.paperMonth(G, n);
    for (const c of CATS) n.budget[c] = clamp(n.budget[c], 0, model === 'council' ? 0.5 : E.budgetMax(n, c));

    /* labour */
    const workers = Math.max(1, n.pop - n.troops);
    const labor = clamp(workers / (n.pop * 0.94), 0.4, 1.03);
    const strike = n.strike > 0 ? 0.7 : 1;

    /* trade: one route per treaty. Value = (0.8 + 0.04 × the smaller output) × reach × ideological fit.
       Neighbours trade overland at full reach; others by sea through a working port at each end (each port carries
       three routes at full value), or overland through third countries at 35%. */
    const planned = model === 'plan' || model === 'cyber', routes = [];
    let nt = 0, sea = 0;
    const PC = ID.nbe(n, B.PORT);
    for (const o of G.nations) {
      if (!o || !o.alive || o === n) continue;
      const d = G.dip[ID.dkey(n.id, o.id)]; if (!d || !d.trade || d.war) continue;
      nt++;
      const border = ID.borders(G, n.id, o.id) > 0, fit = E.fit(G, n, o);
      const oPlan = ID.ideo(o).econ.model === 'plan' || ID.ideo(o).econ.model === 'cyber';
      const base = (0.8 + E.ROUTE_K * Math.min(n.prod || 20, o.prod || 20)) * fit * (planned && !oPlan ? 0.8 : 1);
      routes.push({ o: o.id, base, fit, border, oPort: ID.nbe(o, B.PORT), port: border ? 0 : Math.min(1, PC, ID.nbe(o, B.PORT)), reach: border ? 1 : E.OVERLAND, v: 0 });
    }
    routes.sort((a, b) => b.base - a.base);
    let seaCap = E.PORT_ROUTES * PC, trade = 0;
    for (const r of routes) {
      if (!r.border && r.port > E.OVERLAND && seaCap > 0) { const use = Math.min(1, seaCap); seaCap -= use; r.reach = E.OVERLAND + (r.port - E.OVERLAND) * use; r.sea = 1; sea++; }
      r.v = r.base * r.reach; trade += r.v;
    }
    const tradeK = tradeLaw.trade * (model === 'trade' ? 1.6 : 1) * (1 + ID.mod(n, 'trade')) * (n.depression ? 0.7 : 1);
    trade *= tradeK; for (const r of routes) r.v *= tradeK;
    n.tradeInc = trade; n.ntrade = nt; n.a.routes = routes; n.a.seaRoutes = sea;

    /* agriculture and food */
    let food = n.foodLand * (1 + 0.09 * n.tech.agr) * landLaw.food * labor * (1 + ID.mod(n, 'food'));
    if (e.rural) food *= 1.15;
    if (e.smallholder) food *= 1.05;
    if (model === 'manor' && n.rent > 35) food *= 1 - (n.rent - 35) * 0.008;
    if (model === 'plan' || model === 'cyber') food *= clamp(0.9 + n.budget.welfare * 0.6, 0.9, 1.06);
    if (rec.harvest && n.mob > 0.05) food *= 1 - (n.mob - 0.05) * 2;
    food *= 1 + Math.min(E.CITY_FOOD_MAX, E.CITY_FOOD * ID.nbe(n, B.CITY)); // market towns: cities pay for part of their own bread
    const wxm = E.wxOf(n.wx ? n.wx.cur : 'fair').m;
    const need = Math.max(1, n.pop * E.NEED), pol = E.pol(n), price = E.grainPrice(G), trades = n.laws.trade !== 'autarky' && routes.some((r) => r.border || r.sea);
    n.a.harvestAvg = food / need; // in an ordinary year: what the land carries, before the weather
    food *= wxm;
    let bal = food / need, importCost = 0;
    // the surplus sold abroad (export policy): gold now, nothing left over to grow on
    if (pol === E.POLICY.export && trades && bal > 1.1 && (n.grain || 0) >= pol.store - 0.01) { const sold = bal - 1.1; ID.flow(n, 'Grain exports', sold * need * price * 0.8); bal = 1.1; }
    n.a.harvest = bal;
    /* granaries: surplus fills them (in months of need, up to the policy's store), a shortfall draws them down before anyone goes hungry */
    if (n.grain == null) n.grain = E.GRAIN_START;
    if (bal >= 1) n.grain = Math.min(pol.store, n.grain + (bal - 1));
    else { const draw = Math.min(n.grain, 1 - bal); n.grain -= draw; bal += draw; }
    if (pol === E.POLICY.stock && n.grain > 6) {
      // when the world goes hungry and grain is dear, full granaries sell part of their store at that price
      if (trades && price > E.GRAIN_PRICE * 1.25) { const sold = Math.min(n.grain - 6, 1); n.grain -= sold; ID.flow(n, 'Grain sold from store', sold * need * price); }
      else ID.flow(n, 'Grain storage', -(n.grain - 6) * need * 0.00015);
    }
    // a country that knows its granaries are full sleeps better
    for (let i = n.mods.length - 1; i >= 0; i--) if (n.mods[i].label === 'Full granaries') n.mods.splice(i, 1);
    if (n.grain >= 9) ID.addMod(n, 'stab', 2, 2, 'Full granaries');
    // what the surplus lets the people grow to (read by ID.popCap): up to a third more than the land alone supports
    n.a.foodCap = n.popLand * clamp(n.a.harvestAvg - 1.15, 0, 0.35) * pol.grow;
    // and grows faster on it: up to +70% growth while the harvest runs well above need (it fades as the people catch up)
    // (an overstretched state, over 7% of the world's land, cannot settle its people as fast: the bonus fades, so conquest does not snowball through the harvest)
    n.a.growK = 1 + clamp(bal - 1.1, 0, 0.6) * 1.2 * pol.grow * clamp(1 - (n.tiles / Math.max(1, G.landCount) - 0.07) * 8, 0.2, 1);
    if (bal < 1 && trades && n.gold > 20) {
      const buy = Math.min(1 - bal, 0.25); importCost = buy * need * price; bal += buy;
    }
    n.foodBal = bal;
    if (bal < 0.93) {
      if (!n.famine) { ID.news(G, 'Famine in ' + n.name + '.', 'bad', n.id); ID.logGrief(n, G.tick, 'Famine began (food at ' + Math.round(bal * 100) + '% of need).'); }
      n.famine++;
      n.pop *= 1 - Math.min(0.012, (1 - bal) * 0.03);
    } else n.famine = 0;
    const agr = food * 0.02;

    /* industry */
    /* industrial capacity: what the factories can make, by condition. It is output, and the ceiling on arms. */
    const fac = ID.nbe(n, B.FACTORY);
    const oreF = clamp(0.78 + n.oreLand / Math.max(1, fac * 55), 0.78, 1.22);
    const ic = fac * 12 * (1 + 0.1 * n.tech.ind) * oreF;
    n.a.ic = ic; n.a.oreF = oreF;
    let ind = (ic + ID.nbe(n, B.CITY) * 6) * labor * strike * (1 + (laborLaw.prod || 0) + (tradeLaw.ind || 0) + ID.mod(n, 'prod'));
    if (e.rural) ind *= 0.85;
    n.ind = ind; n.agr = agr;

    /* efficiency by model */
    let eff = e.eff || 1, rev = 0;
    const corrF = 1 - n.corr / 220;
    if (PRIVATE[model]) {
      let avgU = n.a.unrest || 0;
      const tgt = 56 + (n.fs.capital - 50) * 0.5 - (n.tax - 22) * 0.7 - avgU * 0.3 - (n.nwars ? 8 : 0) + (n.laws.trade === 'free' ? 5 : 0) - n.inflation * 0.25 - (n.depression ? 28 : 0) + ID.mod(n, 'conf');
      n.conf += (clamp(tgt, 0, 100) - n.conf) * 0.1;
      n.cyc += 0.07;
      eff *= 0.8 + n.conf / 240 + Math.sin(n.cyc) * 0.09 * e.cycle;
      if (n.depression) { eff *= 1 - 0.22 * Math.min(1.3, e.cycle); n.depression--; if (!n.depression) ID.news(G, 'The slump in ' + n.name + ' is over.', 'eco', n.id); }
      else if (!G.world.depression && n.conf < 38 && Math.cos(n.cyc) < 0 && G.rng.chance(0.012 * e.cycle)) {
        n.depression = G.rng.int(12, 22); n.conf -= 12;
        ID.news(G, 'Panic on the ' + n.adj + ' exchanges: a slump begins.', 'bad', n.id); ID.logGrief(n, G.tick, 'A financial panic began a slump.');
        if (n.id === G.player) ID.sfx(G, 'bad');
      }
      if (model === 'pact') {
        const lo = Math.min(n.fs.workers, n.fs.capital);
        if (!n.pactBroken && lo < 26) { n.pactBroken = true; ID.news(G, 'The social pact in ' + n.name + ' has broken down.', 'bad', n.id); ID.logGrief(n, G.tick, 'The corporatist pact broke down (' + (n.fs.workers < n.fs.capital ? 'workers' : 'capital') + ' at ' + Math.round(lo) + ').'); }
        else if (n.pactBroken && lo > 40) { n.pactBroken = false; ID.news(G, 'Labour and capital in ' + n.name + ' return to the chambers.', 'eco', n.id); }
        eff *= n.pactBroken ? 0.72 : 0.97 + lo / 600;
      }
      if (I.flags.compromise) eff *= n.fs.workers >= 45 && n.fs.capital >= 45 ? 1.05 : (n.fs.workers < 30 || n.fs.capital < 30 ? 0.93 : 1);
    } else if (model === 'plan') {
      const grow = (e.dist || 0.1) * (1 + pressLaw.bias / 28) * (1 + n.gdp / 2500) - n.budget.science * 0.2 - (n.laws.press === 'free' ? 0.1 : 0) + ID.mod(n, 'dist');
      n.dist = clamp(n.dist + grow, 0, 100);
      eff *= (1 - n.dist / 170) * (I.flags.fiveYear && !n.plan ? 0.92 : 1);
      if (I.flags.permRev && n.isolated) eff *= 0.92;
    } else if (model === 'cyber') {
      const cap = 70 + (n.sciTotal || 0) * 0.3 + fac * 3 + n.tech.ind * 45;
      n.load = (agr + ind) / cap;
      eff *= n.load <= 1 ? 1 : Math.max(0.5, 1 - (n.load - 1) * 0.9);
      if (n.laws.press === 'censored') eff *= 0.82;
      if (n.load > 1.15 && !n.a.overloadNote) { n.a.overloadNote = 1; ID.news(G, 'The planning network of ' + n.name + ' is overloaded.', 'bad', n.id); ID.logGrief(n, G.tick, 'The planning network overloaded (load ' + n.load.toFixed(2) + ').'); }
      if (n.load <= 1) n.a.overloadNote = 0;
    } else if (model === 'council') {
      eff *= 0.9 + n.fs.workers / 420;
    }
    eff *= 1 + ID.mod(n, 'eff');
    if (n.trans > 0) eff *= 0.9;
    n.eff = eff;
    n.prod = (agr + ind) * eff;
    const gdp = Math.max(1, n.prod + trade);
    n.gdp = gdp;

    if (model === 'market' || model === 'mixed' || model === 'pact') rev = gdp * (n.tax / 100) * corrF;
    else if (model === 'trade') rev = (gdp - trade) * (n.tax / 100) * corrF + trade * 0.55;
    else if (model === 'plan') rev = gdp * e.share * (1 - n.dist / 400) * (1 - n.corr / 260);
    else if (model === 'cyber') rev = gdp * e.share;
    else if (model === 'council') rev = gdp * e.share * (0.75 + n.particip / 400);
    else if (model === 'manor') rev = (agr * eff * (n.rent / 100) + ind * eff * 0.18 + trade * 0.3) * corrF;
    if (planned) rev += trade * E.PLAN_TRADE; // the state's foreign-trade monopoly
    rev *= 1 + ID.mod(n, 'rev') + 0.04 * (n.cnt.nationalized || 0);
    if (n.strike > 0) n.strike--;

    /* spending */
    const b = n.budget;
    const welfare = rev * b.welfare, security = rev * b.security, science = rev * b.science, arms = rev * b.arms, heavy = rev * b.heavy;
    let bu = 0; for (let t = 1; t <= 5; t++) bu += n.nb[t] * ID.BUILDINGS[t].upkeep;
    const upkeep = n.troops * 0.018 * rec.upkeep + bu + n.tiles * 0.0016 * (1 + n.tiles / 9000);
    let ops = 0; for (const o of n.ops) ops += o.cost;
    const interest = n.debt * 0.006;
    const atom = E.atomMonth(G, n, rev);
    const exp = welfare + security + science + arms + heavy + upkeep + ops + interest + importCost + atom;
    n.rev = rev; n.exp = exp; n.net = rev - exp; n.a.upkeep = upkeep; n.a.secSpend = security;
    n.a.flow = n.a.flowNow || null; n.a.flowNow = null; // last month's flows outside the budget (ID.flow)
    n.gold += n.net;
    if (n.gold < 0) {
      if (DEBT_OK[model]) {
        n.debt += -n.gold; ID.flow(n, 'Borrowed', -n.gold); n.inflation += 0.4;
        if (n.debt > E.debtCap(n) && !n.flags.debtCrisis) {
          n.flags.debtCrisis = 1; ID.logGrief(n, G.tick, 'The state could no longer service its debt.');
          if (n.id === G.player) ID.Events.queue(G, n, 'debt_crisis'); else { n.debt *= 0.4; n.conf -= 25; n.sm.capital -= 15; ID.addMod(n, 'rev', -0.15, 24, 'Default'); n.flags.debtCrisis = 0; }
        }
      } else { n.a.shortage = Math.min(1, -n.gold / Math.max(1, rev)); n.gold = 0; }
    } else { n.a.shortage = 0; if (n.debt > 0 && n.gold > 120) { const pay = Math.min(n.debt, (n.gold - 120) * 0.25); n.debt -= pay; ID.flow(n, 'Debt repaid', -pay); } }
    n.inflation = Math.max(0, n.inflation - 1.2 + (n.nwars && PRIVATE[model] ? 0.5 : 0));

    /* investment funds: private capital or the plan build factories on their own */
    const facCap = Math.max(2, n.tiles / 55);
    if (PRIVATE[model]) n.privCap += gdp * (1 - n.tax / 100) * e.invest * Math.pow(n.conf / 100, 1.5) * (n.depression ? 0.3 : 1) * 0.36 + trade * E.PRIV_TRADE; // merchants reinvest their profits
    else if (heavy > 0) n.privCap += heavy * 1.15;
    const fc = ID.buildCost(G, n, B.FACTORY);
    if (n.privCap >= fc && fac < facCap && !(I.flags.antiIndustry && fac >= n.tiles / 500)) {
      const type = model === 'trade' && n.coastTiles > 0 && n.nb[B.PORT] < 10 && G.rng.chance(0.4) ? B.PORT : B.FACTORY;
      if (autoBuild(G, n, type)) n.privCap -= type === B.PORT ? ID.buildCost(G, n, B.PORT) : fc;
    }
    if (n.privCap > fc * 3) n.privCap = fc * 3;

    /* living standards */
    const ref = G.stats.gdppcRef || 16;
    const gdppc = (gdp / Math.max(1, n.pop)) * 1000; n.gdppc = gdppc;
    let ls = 20 + 25 * Math.pow(clamp(gdppc / ref, 0.25, 2.6), 0.75);
    ls += b.welfare * 56 * Math.sqrt(clamp(rev / gdp / 0.3, 0.2, 2.2));
    if (bal < 1) ls -= (1 - bal) * 110;
    if (n.famine) ls -= 12;
    ls -= n.inflation * 0.35 + n.we * 0.12;
    ls += (tradeLaw.ls || 0) + (mobLaw.ls || 0) + ID.mod(n, 'ls');
    if (n.depression) ls -= 9 * Math.min(1.3, e.cycle || 0.5);
    if (PRIVATE[model]) ls -= Math.max(0, n.tax - 28) * 0.12;
    if (n.a.shortage) ls -= n.a.shortage * 30;
    n.a.lsHist = n.a.lsHist || []; n.a.lsHist.push(n.ls); if (n.a.lsHist.length > 12) n.lsPrev = n.a.lsHist.shift(); else n.lsPrev = n.a.lsHist[0];
    n.ls += (clamp(ls, 0, 100) - n.ls) * 0.2;

    /* equipment */
    /* equipment: arms money buys kit only as fast as the factories can make it (more for a planned economy); the rest
       can be bought abroad at 1.5× from friendly trade partners with spare capacity, up to a quarter of need. 100% means
       as much kit per soldier as the world's average army, so it is an arms race: a bigger army or a smaller industry dilutes it */
    E.kitTarget(G, n, arms, routes);
    n.a.icSpare = Math.max(0, n.a.armsCap - n.a.armsMade);
    E.arsenalMonth(G, n);

    /* research */
    let pts = science * (1 + pressLaw.sci + (I.flags.sciBonus || 0) - (I.flags.sciPenalty || 0)) * (0.7 + n.fs.intelligentsia / 160) * (1 + ID.mod(n, 'sci'));
    if (e.privSci) pts += gdp * 0.045 * (n.conf / 100);
    n.sci += pts; n.sciTotal = (n.sciTotal || 0) + pts;
    const lv = n.tech[n.focus], capL = ID.ERAS[ID.eraOf(G.tick)].techCap;
    if (lv < capL) {
      const lead = (G.stats.techMax && G.stats.techMax[n.focus]) || 0;
      const cost = 200 * Math.pow(1.55, lv) * (lv < lead ? 0.65 : 1);
      n.a.techCost = cost;
      if (n.sci >= cost) {
        n.sci -= cost; n.tech[n.focus]++;
        if (n.id === G.player) { ID.news(G, 'Research complete: ' + { ind: 'industrial', mil: 'military', agr: 'agricultural' }[n.focus] + ' technology ' + n.tech[n.focus] + '.', 'good', n.id); ID.sfx(G, 'good'); }
        if (n.focus === 'mil' && n.tech.mil === 6 && n.id === G.player) ID.news(G, 'Our physicists say an atomic bomb is possible. It would take years and a great industry: see Strategic weapons on the War panel.', 'good', n.id);
      }
    } else { n.a.techCost = 0; if (n.sci > 400) n.sci = 400; }

    /* slow variables */
    const secLaw = L.security.opts[n.laws.security];
    let dc = pressLaw.corr * 0.5 + (secLaw.repress > 0.5 ? 0.08 : 0) + (I.flags.corrGrow || 0) + n.tiles / 26000 + (model === 'plan' ? 0.06 : 0) - (n.laws.security === 'liberties' ? 0.08 : 0) - b.security * 0.6 - (n.corr - 15) * 0.008;
    if (model === 'council') dc = n.corr > 8 ? -0.5 : 0;
    n.corr = clamp(n.corr + dc, 0, 100);
    let db = (model === 'plan' ? 0.12 : 0.02) + (secLaw.bureau || 0) + (n.nwars ? 0.08 : 0) + (n.fp.bureaucracy - 20) * 0.004 - (I.control.type === 'assembly' ? 0.3 : 0) - (n.bureau - 10) * 0.003 + ID.mod(n, 'bureau');
    n.bureau = clamp(n.bureau + db, 0, 100);

    /* crises count (for competence legitimacy and events) */
    n.crises = (n.depression ? 1 : 0) + (n.famine ? 1 : 0) + (n.pactBroken ? 1 : 0) + (n.strike > 0 ? 1 : 0) + (n.inflation > 60 ? 1 : 0) + (n.flags.debtCrisis ? 1 : 0) + (n.load > 1.15 ? 1 : 0) + (n.a.unrest > 45 ? 1 : 0);
    if (n.inflation > 60 && !n.a.hyper) { n.a.hyper = 1; ID.news(G, 'Hyperinflation grips ' + n.name + '.', 'bad', n.id); ID.logGrief(n, G.tick, 'Hyperinflation: prices out of control.'); }
    if (n.inflation < 35) n.a.hyper = 0;

    /* expire modifiers */
    for (let k = n.mods.length - 1; k >= 0; k--) if (--n.mods[k].m <= 0) n.mods.splice(k, 1);
  };

  /* World economy: the Great Depression. */
  E.worldMonth = function (G) {
    E.weatherMonth(G);
    const w = G.world;
    if (w.depression > 0) w.depression--;
    if (!w.depressionDone && G.tick >= w.depressionAt) {
      w.depressionDone = 1; w.depression = 40; w.tension += 15;
      ID.news(G, 'THE GREAT SLUMP: markets collapse across the world.', 'bad');
      ID.headline(G, { kicker: 'Black week on the exchanges', title: 'The Great Slump', sub: 'Markets collapse across the world. Planned and peasant economies watch from the sidelines.', tone: 'bad' });
      ID.chron(G, 'world', 'The Great Slump begins. Market economies everywhere contract; planned and subsistence economies watch.');
      if (ID.Press) ID.Press.slump(G);
      ID.sfx(G, 'crash');
      for (const n of G.nations) {
        if (!n || !n.alive) continue;
        const I = ID.ideo(n), e = I.econ;
        const c = PRIVATE[e.model] ? (e.cycle || 0.5) * ID.LAWS.trade.opts[n.laws.trade].contagion : 0;
        if (c > 0.25 && !I.flags.depressionProof) {
          n.depression = Math.round(38 * Math.min(1.4, c)); n.conf = Math.max(5, n.conf - 30 * c);
          ID.logGrief(n, G.tick, 'The Great Slump reached the country.');
          if (n.id === G.player) ID.Events.queue(G, n, 'great_slump');
        } else if (e.model === 'plan' || e.model === 'cyber' || e.model === 'council') { ID.addMod(n, 'legit', 5, 30, 'Untouched by the Slump'); n.fervor = Math.min(100, n.fervor + 6); }
      }
    }
  };
})();
