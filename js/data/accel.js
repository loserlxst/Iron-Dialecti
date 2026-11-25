/* IRON DIALECTIC — the accelerated systems and National Socialism (session 13).
   Four doctrines with mechanics of their own, run monthly through D.month (called from sim/doctrine.js),
   with figures for the State panel in D.extra, and the dispatches only they receive.

   The accelerated systems share one rule: enormous advantages while the gauge is high, and a gauge that
   falls fast unless it is fed. Slow down and the advantages turn into penalties, then into collapse.
   - technosoc  Techno-Socialist Accelerationism. Velocity, fed by spreading: the broadcast seeds the
                movement abroad every month (more countries the faster you go) and ripe countries tip into
                revolution. Stall and the bureaucrats take over (ts_thermidor).
   - nrx        NRX Accelerationism. Acceleration, fed by industrial growth, new technology and confidence.
                High: industry, research, a free factory a year, and the intelligence explosion (research
                multiplied). Low: capital flight, then the shareholders revolt (nx_board).
   - nazacc     Nazi Accelerationism. The fire, falling 4 a month, fed only by conquest, new wars and states
                destroyed. Devastating dispatches every few months; when the fire goes out the regime falls.
   National Socialism is not accelerated but has its own machinery: rearmament on secret credit whose bills
   only plunder can pay (ns_bills), ultimatums that take provinces without war while the world's patience
   lasts, a radicalisation gauge that only ratchets upward, and at its peak the road into the fire
   (ns_twilight). Persecution is modelled as what it was, a crime with costs, and recorded in the chronicle. */
(function () {
  'use strict';
  const ID = (globalThis.ID = globalThis.ID || {});
  const D = ID.DOCTRINE, E = ID.EVENT_DEFS, PERM = 600;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const losing = (n) => !!(n.nwars && n.a.losing);
  const isP = (G, n) => n.id === G.player && !G.autoPlayer;
  const Dp = () => ID.Diplomacy;
  const draft = (G, n, share, equipHit) => { const add = Math.max(0, Math.min(n.pop * share, n.pop * ID.maxMob(n) * 1.3 - n.troops)); n.troops += add; if (equipHit && add > 0) n.equip = Math.max(0.5, n.equip - equipHit); return add; };
  const feed = (n, v) => { n.sig = clamp((n.sig || 0) + v, 0, 100); };
  const date = (t) => ID.dateOf(t).short;
  /* what happened since last month: land taken, wars begun, enemies destroyed */
  const track = (G, n) => {
    const x = n.sigx, out = { tiles: 0, newWars: 0, consumed: 0 };
    if (x.t0 != null) out.tiles = n.tiles - x.t0; x.t0 = n.tiles;
    if (x.w0 != null && n.nwars > x.w0) out.newWars = n.nwars - x.w0; x.w0 = n.nwars;
    for (const id of x.foes || []) { const o = G.nations[id]; if (o && !o.alive) out.consumed++; }
    if (out.consumed) n.cnt.consumed = (n.cnt.consumed || 0) + out.consumed;
    x.foes = Dp().enemies(G, n).map((o) => o.id);
    return out;
  };
  /* the weakest neighbour we may attack, preferring one that holds land we claim */
  const target = (G, n) => {
    let best = null, bv = Infinity;
    for (const k in G.border[n.id] || {}) {
      const t = G.nations[+k]; if (!t || !t.alive || t === n || Dp().warBlock(G, n, t)) continue;
      const v = Dp().power(t) * (n.claims.some((p) => G.provinces[p].owner === t.id) ? 0.7 : 1);
      if (v < bv) { bv = v; best = t; }
    }
    return best;
  };
  const declare = (G, n, t) => { if (t && t.alive && !Dp().warBlock(G, n, t)) Dp().startWar(G, n, t, Dp().casusBelli(G, n, t) || 'none'); };
  const seedSome = (G, n, ideo, cnt, amt, prov, filter) => {
    const L = ID.alive(G).filter((o) => o !== n && o.ideo !== ideo && (!filter || filter(o)));
    let k = 0;
    for (; k < cnt && L.length; k++) {
      const t = G.rng.weighted(L, (o) => Math.max(1, 70 - o.stab) * (ID.op(G, n.id, o.id) < 10 ? 1.4 : 1) * (ID.ideo(o).family === ID.ideo(n).family ? 0.6 : 1));
      if (!t) break; L.splice(L.indexOf(t), 1);
      ID.docSeed(G, t, ideo, amt * (t.id === G.player ? 0.5 : 1), prov, n.id);
    }
    return k;
  };

  /* ================================================================ Techno-Socialist Accelerationism */
  D.technosoc = {
    name: 'Revolution at the Speed of the Wire', gauge: 'Velocity', init: 70,
    desc: 'How fast the revolution is moving. It falls hard every month unless the revolution spreads or the machines advance: movements growing abroad, revolutions carried into other countries, offensives that advance, new technology. High velocity is the strongest research and the fastest army in the game; low velocity cripples both and hands the state to its bureaucrats.',
    drift: (n, G) => { const x = n.sigx || {}; const recent = n.a.spreadAt != null && G.tick - n.a.spreadAt < 720 ? 1.5 : 0; return -2.6 + recent + (x.techGain || 0) * 3 + Math.min(2.2, (x.abroad || 0) * 0.08) + (n.nwars && !losing(n) ? 0.6 : 0) - (losing(n) ? 1 : 0) + (n.tech.ind - 4) * 0.1; },
    fx: (n, v) => { const d = v - 50; return { sci: d * 0.008, atk: d * 0.004, speed: d * 0.003, prod: d * 0.002, ls: d > 0 ? d * 0.04 : 0, legit: d * 0.12, unrest: d < 0 ? -d * 0.08 : 0, driftK: v < 35 ? (35 - v) * 0.04 : 0 }; },
    low: 'Low velocity: a revolution standing still, and a bureaucracy noticing.',
    high: 'High velocity: the signal is in every country before the censors wake up.',
    acts: [
      { id: 'ts_broadcast', name: 'Broadcast the revolution', desc: 'Every transmitter we own, on every wavelength, for a week: instructions for strikes, councils and barricades in forty languages.', cost: { gold: 30 }, cd: 6, sig: 5, fx: [['fn', (G, n) => { seedSome(G, n, 'technosoc', 3, 12, 2); }], ['note', 'Our movement grows in three foreign countries']], ai: (n, v) => v < 85 && n.gold > 80 },
      { id: 'ts_open', name: 'Open-source the revolution', desc: 'The manuals for organising a factory council and building a transmitter, printed by the million and given away at every border.', cost: { auth: 10 }, cd: 24, sig: 10, fx: [['fn', (G, n) => { for (const k in G.border[n.id] || {}) { const t = G.nations[+k]; if (t && t.alive && t.ideo !== 'technosoc') ID.docSeed(G, t, 'technosoc', 10, 2, n.id); } }], ['note', 'Our movement grows in every neighbouring country'], ['tech', 120]], ai: (n, v) => v < 70 },
      { id: 'ts_machines', name: 'Seize the machines', desc: 'The most advanced plant left in private hands, taken over in one night and automated by the morning shift.', cost: { auth: 15 }, cd: 36, sig: 8, fx: [['mod', 'prod', 0.08, 36, 'Seized machines'], ['techUp', 'ind'], ['sup', 'capital', -10]], ai: (n, v) => v < 60 },
      { id: 'ts_brigades', name: 'The international brigades', desc: 'Volunteers from every country the signal reaches arrive at our stations, wanting rifles.', cost: { gold: 80 }, cd: 36, sig: 8, fx: [['fn', (G, n) => { draft(G, n, 0.01, 0); for (const o of ID.alive(G)) if (o !== n && ID.ideo(o).family === 'socialist') ID.addOp(G, o.id, n.id, 5); }], ['note', 'Troops +1% of the population; socialist states think better of you']], ai: (n) => n.nwars > 0 },
    ],
    war: { name: 'Lightning revolution', desc: 'Fronts move a fifth faster and the first months of every war a third faster; the front raises the enemy’s own workers. Lose a tenth of the homeland and morale breaks by a sixth.', dp: { speed: 1.2, blitz: 0.33, liberate: 1, brittle: 0.15 } },
    order: { key: 'ts_signal', name: 'The signal', gold: 60, cd: 180, target: 1, range: 999,
      desc: 'A single word on every frequency of the enemy country: our movement surges in six of its provinces, and if its government is already shaky (stability under 45) the revolution breaks out at once.',
      run: (G, n, t) => { ID.docSeed(G, t, 'technosoc', 25, 6, n.id); if (t.id !== G.player && t.stab < 45 && !ID.Politics.inCivil(G, t) && !ID.saturated(G, 'technosoc') && ID.Politics.movement(G, t).ideo === 'technosoc') { ID.Politics.uprising(G, t, 'technosoc'); return 'The signal goes out, and ' + t.base + ' rises.'; } return 'The signal goes out across ' + t.base + '.'; },
      ai: (G, n) => n.nwars > 0 },
    month: (G, n) => {
      const x = n.sigx, ts = n.tech.ind + n.tech.mil + n.tech.agr;
      x.techGain = x.tech0 == null ? 0 : Math.max(0, ts - x.tech0); x.tech0 = ts;
      // one network: however many techno-socialist states there are, they share one broadcast
      const nets = ID.alive(G).filter((o) => o.ideo === 'technosoc'), net = Math.max(1, nets.length);
      x.net = net; x.hub = nets.every((o) => o.tiles <= n.tiles); // the largest is the hub of the network
      x.reach = seedSome(G, n, 'technosoc', Math.max(1, Math.round((1 + Math.floor(n.sig / 25)) / net)), (4 + n.sig * 0.1) / net, 2);
      let ab = 0, abN = 0;
      for (let p = 1; p < G.provinces.length; p++) { const Pr = G.provinces[p]; if (Pr.opp === 'technosoc' && Pr.owner && Pr.owner !== n.id && Pr.oppStr >= 30) { ab += Pr.oppStr / 100; abN++; } }
      x.abroad = ab; x.abN = abN;
      // a ripe country tips over
      if (x.hub && net <= 4 && n.sig >= 60 && G.tick % 90 < 30) for (const t of ID.alive(G)) {
        if (t === n || t.id === G.player || t.ideo === 'technosoc' || t.stab >= 40 || ID.Politics.inCivil(G, t)) continue;
        const mv = ID.Politics.movement(G, t);
        if (mv.ideo === 'technosoc' && mv.share >= 0.2 && G.rng.chance(0.25)) { ID.Politics.uprising(G, t, 'technosoc'); break; }
      }
      // the network goes cold
      if (n.sig < 8 && (x.coldAt == null || G.tick - x.coldAt > 360) && G.rng.chance(0.3)) { x.coldAt = G.tick; ID.Events.queue(G, n, 'ts_thermidor', {}); }
    },
    extra: (n, G) => {
      const x = n.sigx || {}, recent = n.a.spreadAt != null && G.tick - n.a.spreadAt < 720;
      return [['The broadcast reaches', (x.reach || 0) + ' countries a month (one more for every 25 velocity, shared among ' + (x.net || 1) + ' network states)', (x.reach || 0) >= 2],
        ['Hub of the network', x.hub ? ((x.net || 1) <= 4 ? 'yes: ripe countries can be tipped into revolution' : 'yes, but a network of more than four states is too wide to tip new countries') : 'no: a larger techno-socialist state leads the network', !!x.hub && (x.net || 1) <= 4],
        ['The revolution is growing in', (x.abN || 0) + ' foreign provinces', (x.abN || 0) >= 10],
        ['Last revolution carried abroad', n.a.spreadAt != null ? date(n.a.spreadAt) + (recent ? ' (still feeding velocity)' : ' (too long ago)') : 'none yet', recent]];
    },
  };
  E.push({ id: 'ts_thermidor', sys: 1, tone: 'bad', sfx: 'alarm', kicker: 'The network goes cold',
    title: 'The apparatus moves against the network',
    text: 'The revolution has stopped spreading, and the people who run the ministries have noticed. A majority of the Network Congress proposes to “consolidate”: one centre, one line, the transmitters under the security organs, and an end to adventures abroad. It is Thermidor, and they are not even embarrassed to call it stability.',
    opts: [
      { label: 'Accept Thermidor', tip: 'The state becomes an ordinary Marxist-Leninist party state. Quieter, slower, and no longer yours.', fx: [['ideology', 'ml', 'coup']], ai: 1 },
      { label: 'Purge the apparatus and go faster', tip: 'Recall every delegate who voted for consolidation and start broadcasting again tonight.', fx: [['fn', (G, n) => feed(n, 25)], ['note', 'Velocity +25'], ['stab', -15], ['grievance', 15], ['sup', 'bureaucracy', -15]], ai: 1.5 },
    ] });

  /* ================================================================ NRX Accelerationism */
  D.nrx = {
    name: 'The Runaway Machine', gauge: 'Acceleration', init: 60,
    desc: 'How fast capital is compounding. Above 50 it dissolves tradition and the clergy’s hold. It falls every month unless industry grows, technology advances, research is funded and confidence holds; slumps, strikes and welfare brake it. High acceleration is the strongest industry and research in the game, a free factory every year and, above 80, an intelligence explosion that multiplies research. Low acceleration means collapse and capital flight.',
    drift: (n) => { const x = n.sigx || {}; return -2.4 + clamp((x.indG || 0) * 250, -3, 3) + (x.techGain || 0) * 4 + ((n.conf || 50) - 50) * 0.03 + (n.budget.science || 0) * 5 - (n.depression ? 1.5 : 0) - (n.strike ? 0.6 : 0) - ((n.budget.welfare || 0) > 0.06 ? 0.6 : 0) - (losing(n) ? 0.8 : 0); },
    fx: (n, v) => { const d = v - 50; return { prod: d * 0.005, sci: d * 0.008, eff: d * 0.002, conf: d * 0.1, legit: d * 0.08, unrest: Math.max(0, v - 55) * 0.05 + (v < 30 ? (30 - v) * 0.06 : 0) }; },
    low: 'Low acceleration: the shareholders are selling and the engineers are leaving.',
    high: 'High acceleration: the curve has stopped asking anyone’s permission.',
    acts: [
      { id: 'nx_zones', name: 'Charter zones', desc: 'Enclaves with their own law, their own courts and no taxes, leased to whoever bids highest.', cost: { auth: 10 }, cd: 48, sig: 10, fx: [['gold', 150], ['sup', 'capital', 6], ['mod', 'trade', 0.08, 60, 'Charter zones'], ['mod', 'unrest', 2, 60, 'Charter zones']], ai: (n, v) => v < 65 },
      { id: 'nx_labs', name: 'Unleash the laboratories', desc: 'Every restriction on research lifted, and a blank cheque for anyone who can make a machine think faster.', cost: { gold: 100 }, cd: 24, sig: 10, fx: [['tech', 250], ['mod', 'sci', 0.1, 24, 'Unleashed laboratories']], ai: (n, v) => v < 75 && n.gold > 200 },
      { id: 'nx_dissolve', name: 'Dissolve the last regulations', desc: 'The labour code, the factory inspectorate and the central bank’s rate committee, abolished in one board meeting.', cost: { auth: 20 }, cd: 60, sig: 14, fx: [['law', 'labor', 'banned'], ['sup', 'workers', -10], ['sup', 'capital', 10], ['conf', 10]], ai: (n, v) => v < 45 },
      { id: 'nx_cathedral', name: 'Dismantle the Cathedral', desc: 'The old universities, the respectable newspapers and the civil service that think they govern by setting what may be said: their charters revoked, their endowments sold, their staff invited to compete for jobs in the private laboratories.', cost: { auth: 15 }, cd: 72, sig: 10, fx: [['sup', 'intelligentsia', -10], ['sup', 'bureaucracy', -8], ['mod', 'sci', -0.05, 24, 'The universities dissolved'], ['mod', 'coup', -0.2, 60, 'No one left to set the agenda'], ['law', 'press', 'regulated']], ai: (n, v) => v < 55 && n.fs.intelligentsia < 45 },
      { id: 'nx_exit', name: 'Free exit', desc: 'Anyone who dislikes the company may leave. Many do; the ones who stay stop complaining.', cost: { auth: 10 }, cd: 60, sig: 6, fx: [['pop', -0.02], ['mod', 'unrest', -5, 36, 'Free exit'], ['sup', 'workers', 4]], ai: (n) => (n.a.unrest || 0) > 30 },
    ],
    war: { name: 'Capital at war', desc: 'Superior machines: a stronger industry than the enemy’s tells, equipment comes back half again as fast, and barrages and air raids are cheaper, quicker and deadlier.', dp: { materiel: 1, equipRegen: 1.5, precision: 1 } },
    order: { key: 'nx_contract', name: 'Hire a private army', gold: 160, cd: 240, self: 1,
      desc: 'A security firm sends its battalions, fully equipped: troops equal to 1.5% of the population at once.',
      run: (G, n) => { const a = draft(G, n, 0.015, 0); return ID.fmtPop(a) + ' contractors sign on.'; }, ai: (G, n) => losing(n) && n.gold > 300 },
    month: (G, n) => {
      const x = n.sigx, ind = n.ind || 0, ts = n.tech.ind + n.tech.mil + n.tech.agr;
      x.indG = x.ind0 ? (ind - x.ind0) / x.ind0 : 0; x.ind0 = ind;
      x.techGain = x.tech0 == null ? 0 : Math.max(0, ts - x.tech0); x.tech0 = ts;
      const pts = x.sci0 == null ? 0 : Math.max(0, (n.sciTotal || 0) - x.sci0);
      x.pts = pts;
      // the intelligence explosion: above 80, research feeds on itself
      x.boom = n.sig >= 80 ? pts * (n.sig - 75) / 25 : 0;
      if (x.boom) { n.sci += x.boom; n.sciTotal = (n.sciTotal || 0) + x.boom; }
      x.sci0 = n.sciTotal || 0;
      // capital builds itself
      if (n.sig >= 70) { x.build = (x.build || 0) + 1; if (x.build >= 12) { x.build = 0; ID.Events.applyFx(G, n, [['build', ID.B.FACTORY, 1]], {}); if (isP(G, n)) ID.news(G, 'Capital builds itself: a new factory rises without a single order from the board.', 'good', n.id); } }
      else x.build = 0;
      // capital dissolves every tradition in its way
      if (n.sig > 50) { n.tradition = Math.max(0, n.tradition - (n.sig - 50) * 0.01); n.fs.clergy = Math.max(0, n.fs.clergy - (n.sig - 50) * 0.004); }
      // capital flight, then the shareholders revolt
      if (n.sig < 25) { n.gold -= Math.max(0, n.gold) * 0.06; n.conf = Math.max(0, (n.conf || 50) - 2); }
      if (n.sig < 10 && (x.boardAt == null || G.tick - x.boardAt > 360) && G.rng.chance(0.3)) { x.boardAt = G.tick; ID.Events.queue(G, n, 'nx_board', {}); }
    },
    extra: (n) => {
      const x = n.sigx || {};
      const rows = [['Industry growth', ((x.indG || 0) * 100).toFixed(1) + '% last month', (x.indG || 0) > 0],
        ['Research last month', Math.round(x.pts || 0) + (x.boom ? ' + ' + Math.round(x.boom) + ' from the intelligence explosion' : (n.sig >= 80 ? '' : ' (the intelligence explosion starts at 80)')), x.boom > 0],
        ['Next free factory', n.sig >= 70 ? 12 - (x.build || 0) + ' months' : 'needs acceleration 70', n.sig >= 70]];
      if (n.sig < 25) rows.push(['Capital flight', '6% of the treasury leaves every month', false]);
      return rows;
    },
  };
  E.push({ id: 'nx_board', sys: 1, tone: 'bad', sfx: 'alarm', kicker: 'The shareholders revolt',
    title: 'The board meets without the chief executive',
    text: 'The curve has flattened and the shareholders want their money back. The directors met last night without informing the chief executive; this morning they presented three options, and made it clear that a fourth would be his resignation.',
    opts: [
      { label: 'Hand the company to the engineers', tip: 'The technical staff run the country as a directorate of experts.', fx: [['ideology', 'technocracy', 'coup']], ai: 1 },
      { label: 'Crown the chief executive', tip: 'One founder with a vision and a security detail. The board is dissolved.', fx: [['ideology', 'personalist', 'coup']], ai: 1 },
      { label: 'Cut everything and go faster', tip: 'Wages, pensions and inspectors cut to nothing, all at once.', fx: [['fn', (G, n) => feed(n, 25)], ['note', 'Acceleration +25'], ['sup', 'workers', -15], ['mod', 'ls', -6, 24, 'Everything cut'], ['mod', 'unrest', 5, 24, 'Everything cut']], ai: 1.5 },
    ] });

  /* ================================================================ National Socialism */
  const billsDue = (n) => Math.round(80 + (n.rev || 0) * 24);
  const ultimatum = (G, n) => {
    const x = n.sigx; if (x.patience == null) x.patience = 100;
    const cands = () => { const out = []; for (const k in G.border[n.id] || {}) { const t = G.nations[+k]; if (!t || !t.alive || t === n || ID.atWar(G, n.id, t.id) || ID.sameBloc(G, n.id, t.id)) continue; if (n.claims.some((p) => G.provinces[p].owner === t.id)) out.push(t); } return out; };
    let C = cands(); if (!C.length) { ID.genClaims(G, n); C = cands(); }
    if (!C.length) { if (isP(G, n)) ID.news(G, 'No neighbour holds land we claim. The ultimatum is never sent.', 'pol', n.id); return; }
    C.sort((a, b) => Dp().power(a) - Dp().power(b));
    const t = C[0];
    // demand two provinces at a time, not the whole claim
    const ask = n.claims.filter((p) => G.provinces[p].owner === t.id).slice(0, 2), rest = n.claims.filter((p) => ask.indexOf(p) < 0);
    // the player answers later, from whatever is claimed then: drop every claim on them but the two demanded
    if (t.id === G.player && !G.autoPlayer) { x.patience -= 10; n.claims = rest.filter((p) => G.provinces[p].owner !== t.id).concat(ask); Dp().note(G, n, t, 'cede'); return; }
    const r = Dp().power(n) / Math.max(1, Dp().power(t));
    const odds = clamp(0.15 + (x.patience / 100) * 0.5 + (r - 1) * 0.12 - (t.bloc ? 0.15 : 0) - (ID.ideo(t).family === 'socialist' ? 0.1 : 0), 0.05, 0.9);
    const yes = G.rng.chance(odds);
    n.claims = ask; Dp().noteAnswer(G, n, t, 'cede', yes); n.claims = rest.concat(n.claims);
    if (yes) { n.cnt.ultimatums = (n.cnt.ultimatums || 0) + 1; x.patience -= 22; ID.chron(G, 'ultimatum', t.name + ' hands provinces to ' + n.name + ' under an ultimatum.', n.id, t.id); }
    else x.patience -= 8;
    if (isP(G, n)) ID.headline(G, { kicker: 'Ultimatum', title: yes ? t.base + ' gives way' : t.base + ' refuses', sub: yes ? 'The provinces are ours without a shot. The world’s patience is wearing thin (' + Math.max(0, Math.round(x.patience)) + ').' : 'We now have a cause for war against ' + t.name + '.', a: n.id, b: t.id, tone: yes ? 'good' : 'war' });
  };
  D.natsoc = {
    name: 'Cumulative Radicalisation', gauge: 'Radicalisation', init: 35,
    desc: 'Party, army, police and industry compete to anticipate the Leader’s will, and every step removes a restraint. Radicalisation never drifts back down: it hardens the army, silences opposition and makes coups unthinkable, while it drives the scientists abroad, poisons every foreign relation and, at its peak, opens the road to the fire.',
    drift: (n) => { const x = n.sigx || {}; return (n.sig - 50) * 0.035 + 0.08 + (n.nwars ? 0.2 : 0) + (n.charisma > 60 ? 0.08 : 0) + ((x.bills || 0) > 300 ? 0.1 : 0); },
    fx: (n, v) => { const r = n.sigx && n.sigx.rearm; return { atk: v * 0.0018 + (r ? 0.05 : 0), mob: v * 0.0006, coup: -v * 0.006, unrest: -v * 0.03, legit: (v - 40) * 0.06, sci: -v * 0.003, trade: -v * 0.003, prod: r ? 0.12 : 0 }; },
    low: 'Low radicalisation: a nationalist government that still has to ask the generals.',
    high: 'High radicalisation: nothing restrains the regime any more, including its own interest.',
    acts: [
      { id: 'ns_rearm', name: 'Secret rearmament (start or stop)', desc: 'Rearmament paid with promissory notes from a front company. While it runs, industry +12% and attack +5%, and the bills pile up in secret. Conquered land pays them off; nothing else does.', cost: { auth: 10 }, cd: 12, sig: 0, fx: [['fn', (G, n) => { n.sigx.rearm = n.sigx.rearm ? 0 : 1; if (isP(G, n)) ID.news(G, n.sigx.rearm ? 'Secret rearmament begins. The bills will come due.' : 'Rearmament is suspended. The bills already signed remain.', 'pol', n.id); }], ['note', 'Turns rearmament on or off']],
        ai: (n) => { const x = n.sigx || {}; return x.rearm ? (x.bills || 0) > billsDue(n) * 0.9 && !n.nwars : (x.bills || 0) < billsDue(n) * 0.5; } },
      { id: 'ns_ultimatum', name: 'An ultimatum', desc: 'Two provinces of the weakest neighbour that holds land we claim, by Saturday, or else. The weaker the neighbour and the more patient the world, the likelier it gives way; every success uses up the world’s patience faster.', cost: { auth: 15 }, cd: 12, sig: 3,
        can: (n) => ((n.sigx && n.sigx.appeaseOver) ? 'The world will not give way again.' : ''), fx: [['fn', (G, n) => ultimatum(G, n)], ['note', 'Demand provinces without a war']], ai: (n) => !n.nwars },
      { id: 'ns_knives', name: 'Purge the street army', desc: 'The party’s own militia has become a rival to the army. Its leaders are shot in one weekend, and the generals swear their oath to the Leader in gratitude.', cost: { auth: 20 }, cd: 600, sig: 4, fx: [['sup', 'military', 15], ['mod', 'coup', -0.4, 120, 'The army bound to the Leader'], ['grievance', 10], ['sup', 'workers', -4]], ai: (n) => n.coupRisk > 0.004 },
      { id: 'ns_kdf', name: 'The people’s community', desc: 'Cheap radios, holiday cruises for factory workers, a car promised to every family and paid for in advance by stamps that will never buy one. Consent for the war that is coming.', cost: { gold: 60 }, cd: 36, sig: 2, fx: [['mod', 'ls', 2, 36, 'The people’s community'], ['sup', 'workers', 6], ['mod', 'unrest', -2, 36, 'The people’s community']], ai: (n) => n.fs.workers < 40 && n.gold > 150 },
      { id: 'ns_laws', name: 'Laws against the “enemy within”', desc: 'Citizens the regime declares enemies by birth are stripped of their rights, property and professions. Scientists, doctors and writers flee abroad; the world takes note, and so will history.', cost: { auth: 10 }, cd: 48, sig: 10,
        fx: [['sup', 'intelligentsia', -12], ['mod', 'sci', -0.1, PERM, 'Scientists driven abroad'], ['opAll', -8], ['grievance', 8], ['fn', (G, n) => { n.cnt.persecutions = (n.cnt.persecutions || 0) + 1; ID.chron(G, 'crime', 'The ' + n.adj + ' regime strips those it calls enemies of the nation of their rights, property and livelihoods.', n.id); }]], ai: (n, v) => v < 40 },
    ],
    war: { name: 'Lightning war', desc: 'Armour and aircraft concentrated at one point: the first five months of every war move 40% faster and fronts 8% faster. Lose a tenth of the homeland and morale falls by a fifth.', dp: { blitz: 0.4, speed: 1.08, brittle: 0.2 } },
    order: { key: 'ns_armour', name: 'Concentrate the armour', gold: 60, cd: 240, self: 1,
      desc: 'Every tank and aircraft on one sector for two months: attack +12% and fronts 30% faster.',
      run: (G, n) => { ID.addMod(n, 'atk', 0.12, 2, 'Concentrated armour'); ID.addMod(n, 'speed', 0.3, 2, 'Concentrated armour'); return 'The armour concentrates.'; }, ai: (G, n) => !losing(n) },
    month: (G, n) => {
      const x = n.sigx; if (x.patience == null) x.patience = 100; if (x.bills == null) x.bills = 0;
      const g = track(G, n), due = billsDue(n);
      if (x.rearm) x.bills += 4 + (n.rev || 0) * 0.25;
      if (g.tiles > 0 && x.bills > 0) x.bills = Math.max(0, x.bills - g.tiles * (2 + (n.rev || 0) * 0.08));
      if (g.consumed) x.bills *= 0.6;
      if (!n.nwars && !x.appeaseOver) x.patience = Math.min(100, x.patience + 0.3);
      if (x.bills > due && (x.billsAt == null || G.tick - x.billsAt > 360)) { x.billsAt = G.tick; ID.Events.queue(G, n, 'ns_bills', { t: (target(G, n) || {}).id || 0 }); }
      if (x.patience <= 0 && !x.appeaseOver) {
        x.appeaseOver = 1; n.threat = Math.max(n.threat, 75);
        for (const o of ID.alive(G)) if (o !== n && ID.ideo(o).family !== 'authoritarian') ID.addOp(G, o.id, n.id, -20);
        ID.news(G, 'The end of appeasement: the world will give ' + n.name + ' nothing more without a war.', 'war', n.id);
        ID.chron(G, 'appeasement', 'The great powers resolve to stop ' + n.name + ', by force if necessary.', n.id);
        if (isP(G, n)) ID.headline(G, { kicker: 'The end of appeasement', title: 'No more concessions', sub: 'Every power now has a cause for war against ' + n.name + '.', a: n.id, tone: 'war' });
      }
      if (n.sig >= 92 && n.nwars && (losing(n) || x.bills > due * 1.5 || n.we > 60) && (x.fireAt == null || G.tick - x.fireAt > 1440)) { x.fireAt = G.tick; ID.Events.queue(G, n, 'ns_twilight', {}); }
    },
    extra: (n) => {
      const x = n.sigx || {}, due = billsDue(n), b = x.bills || 0, pat = x.patience == null ? 100 : x.patience;
      return [['Secret rearmament', x.rearm ? 'running: industry +12%, attack +5%' : 'stopped', !!x.rearm],
        ['Rearmament bills', Math.round(b) + ' of ' + due + ' before they fall due (conquered land pays them off)', b < due * 0.7],
        ['The world’s patience', x.appeaseOver ? 'exhausted: every power has a cause for war against you' : Math.round(pat) + ' (each ultimatum uses some)', !x.appeaseOver && pat > 30],
        ['Provinces taken by ultimatum', String(n.cnt.ultimatums || 0)]];
    },
  };
  E.push({ id: 'ns_bills', sys: 1, tone: 'bad', sfx: 'alarm', kicker: 'The bills fall due',
    title: 'The rearmament bills fall due',
    text: 'The promissory notes that paid for the tanks were meant to be redeemed out of growth. They were not, and the front company that issued them cannot pay. The president of the central bank says there are four ways out, that three of them are ruinous, and that the fourth is a war.',
    opts: [
      { label: (n, G, c) => 'Pay with plunder: war on ' + G.nations[c.t].name, can: (n, G, c) => !!(c.t && G.nations[c.t] && G.nations[c.t].alive && !ID.Diplomacy.warBlock(G, n, G.nations[c.t])), tip: 'Their gold, their factories and their land will settle the account. If we win.', fx: [['fn', (G, n, c) => declare(G, n, G.nations[c.t])], ['fn', (G, n) => feed(n, 8)], ['note', 'Radicalisation +8']], ai: 3 },
      { label: 'Print the money', tip: 'The bills are paid in new money; the money is worth less every week.', fx: [['inflation', 35], ['conf', -15], ['fn', (G, n) => { n.sigx.bills *= 0.5; }], ['note', 'Rearmament bills halved']], ai: 1 },
      { label: 'Guns before butter', tip: 'Rations, wage cuts and a halt to everything but armaments.', fx: [['mod', 'ls', -8, 24, 'Guns before butter'], ['mod', 'unrest', 4, 24, 'Guns before butter'], ['fn', (G, n) => { n.sigx.bills *= 0.7; }], ['note', 'Rearmament bills cut by 30%']], ai: 1 },
      { label: 'Default', tip: 'Admit the money is gone. Rearmament stops, the bills are written off, and the economy takes the blow.', fx: [['stab', -15], ['mod', 'prod', -0.15, 24, 'Default'], ['opAll', -5], ['fn', (G, n) => { n.sigx.bills = 0; n.sigx.rearm = 0; }], ['note', 'Bills written off; rearmament stops']], ai: 0.5 },
    ] });
  E.push({ id: 'ns_twilight', sys: 1, tone: 'bad', sfx: 'alarm', kicker: 'Twilight',
    title: 'The Leader speaks of fire',
    text: 'The war is going badly, the money is gone, and radicalisation has burned away every restraint the regime once had. In the Leader’s study the talk is no longer of victory but of destruction: if the nation cannot win, it does not deserve to outlive its defeat, and neither do its enemies. The generals are silent. The party is not.',
    opts: [
      { label: 'Let it burn', tip: 'The regime becomes Nazi Accelerationism: overwhelming strength while it conquers, and collapse the moment it stops.', fx: [['ideology', 'nazacc', 'reform']], ai: 1 },
      { label: 'Hold back', tip: 'The generals and the industrialists persuade the Leader to fight on as a state rather than a fire. For now.', fx: [['fn', (G, n) => feed(n, -12)], ['note', 'Radicalisation −12'], ['stab', -6], ['sup', 'military', 6]], ai: 1 },
    ] });

  /* ================================================================ Nazi Accelerationism */
  const burnout = (G, n) => {
    const was = n.name, player = isP(G, n);
    ID.chron(G, 'fall', 'The fire goes out in ' + was + '. The surviving generals arrest the Bunker and ask for terms.', n.id);
    ID.Politics.changeIdeology(G, n, 'junta', 'coup');
    n.troops *= 0.6; n.stab = Math.min(n.stab, 15); n.we = Math.max(n.we, 85);
    for (const e of Dp().enemies(G, n)) ID.addOpBoth(G, n.id, e.id, 30);
    if (player) ID.Events.queue(G, n, 'nz_ashes', { was });
  };
  const DEV = ['nz_nero', 'nz_children', 'nz_ally', 'nz_cities', 'nz_wonder', 'nz_generals', 'nz_starve'];
  const friend = (G, n) => { let best = null, bv = -1e9; for (const o of ID.alive(G)) { if (o === n || ID.atWar(G, n.id, o.id)) continue; const v = ID.op(G, n.id, o.id) + (ID.sameBloc(G, n.id, o.id) ? 40 : 0); if (v > bv) { bv = v; best = o; } } return bv > 10 ? best : null; };
  D.nazacc = {
    name: 'The Fire', gauge: 'The fire', init: 80,
    desc: 'The regime is a fire and nothing else. It falls by about four every month, faster the larger it has grown and the longer it has burned, and is fed only by conquest: land taken, new wars begun, states destroyed. While it burns high it gives the strongest attack, the fastest fronts and the most fanatical army in the game. When it goes out, the regime falls.',
    drift: (n) => -4.2 + (n.sig - 50) * 0.035 - (losing(n) ? 1.5 : 0),
    fx: (n, v) => { const d = v - 30; return { atk: d * 0.004, speed: d * 0.003, def: d * 0.002, mob: v * 0.0012, wePace: -v * 0.008, legit: (v - 50) * 0.12, stab: (v - 40) * 0.08, prod: d * 0.002, ls: -4, growth: -0.03, sci: -0.3, trade: -0.5 }; },
    low: 'A dying fire: the army is exhausted, the people are starving and the generals are counting the days.',
    high: 'A roaring fire: the armies move faster than the maps can be redrawn.',
    acts: [
      { id: 'nz_speech', name: 'The last broadcast', desc: 'The Leader speaks of new weapons, new armies and a victory just past the next ridge. Nobody who has been to the front believes a word.', cost: { gold: 40 }, cd: 12, sig: 8, fx: [['charisma', 4], ['we', -8]], ai: (n, v) => v < 60 && n.gold > 60 },
      { id: 'nz_levy', name: 'Total levy', desc: 'Every male who can hold a rifle, and some who cannot.', cost: { auth: 15 }, cd: 24, sig: 10, fx: [['fn', (G, n) => { draft(G, n, 0.03, 0.03); }], ['note', 'Troops +3% of the population'], ['mod', 'growth', -0.06, 36, 'Total levy']], ai: (n, v) => losing(n) || v < 50 },
      { id: 'nz_scorch', name: 'Scorched earth', desc: 'Everything in the enemy’s path destroyed before he reaches it, including what our own people need to live.', cost: { auth: 10 }, cd: 24, sig: 12, fx: [['mod', 'def', 0.15, 12, 'Scorched earth'], ['mod', 'prod', -0.12, 24, 'Scorched earth']], ai: (n) => losing(n) },
      { id: 'nz_terror', name: 'Courts-martial for defeatism', desc: 'Flying courts in every town. The gallows feed the fire as surely as the front does.', cost: { auth: 10 }, cd: 12, sig: 10, fx: [['mod', 'unrest', -8, 12, 'Courts-martial'], ['grievance', 15], ['supAll', -3], ['pop', -0.005]], ai: (n, v) => v < 40 },
    ],
    war: { name: 'No retreat', desc: 'No step back, ever: the front holds half again as long, attacks cost more men, defenders sell every province dearly, occupiers bleed, and war weariness grows half as fast.', dp: { holdFast: 0.5, martyr: 0.3, aloss: 1.15, bleed: 1.3, wePace: 0.5 } },
    order: { key: 'nz_all', name: 'Everything to the front', gold: 0, cd: 180, self: 1,
      desc: 'Every reserve, every training battalion and every last tank: troops equal to 2% of the population, attack +15% for two months, and the fire +10.',
      run: (G, n) => { const a = draft(G, n, 0.02, 0.04); ID.addMod(n, 'atk', 0.15, 2, 'Everything to the front'); feed(n, 10); return ID.fmtPop(a) + ' more thrown into the fire.'; }, ai: (G, n) => losing(n) || n.sig < 50 },
    month: (G, n) => {
      const x = n.sigx, g = track(G, n);
      if (!x.size0) x.size0 = Math.max(1, n.tiles);
      // the bigger the fire and the longer it has burned, the more it needs
      x.hunger = Math.max(0, n.tiles / x.size0 - 1) * 1.5 + (n.age / 12) * 0.4;
      feed(n, -x.hunger);
      let fed = 0;
      if (g.tiles > 0) fed += Math.min(10, (g.tiles / Math.max(1, n.tiles)) * 300);
      fed += g.newWars * 12 + g.consumed * 25;
      if (fed) feed(n, fed);
      x.fed = fed;
      // the fire hunts
      if (!isP(G, n)) { if (!n.nwars || (n.sig < 60 && n.nwars < 3 && G.rng.chance(0.3))) declare(G, n, target(G, n)); }
      else if (!n.nwars && (x.hungerAt == null || G.tick - x.hungerAt >= 90)) { x.hungerAt = G.tick; ID.Events.queue(G, n, 'nz_hunger', { t: (target(G, n) || {}).id || 0 }); }
      // the devastating choices
      if (x.nextDev == null) x.nextDev = G.tick + 90;
      if (G.tick >= x.nextDev) {
        x.nextDev = G.tick + G.rng.int(4, 7) * 30;
        const ctx = { t: (friend(G, n) || {}).id || 0 };
        const pool = DEV.filter((id) => { const d = ID.Events.def(id); return d && (!d.when || d.when(n, G, ctx)) && (!x.last || x.last !== id); });
        if (pool.length) { const id = G.rng.pick(pool); x.last = id; ID.Events.queue(G, n, id, ctx); }
      }
      if (n.sig <= 0.5 && n.ideo === 'nazacc') burnout(G, n);
    },
    extra: (n) => {
      const x = n.sigx || {};
      return [['The fire', 'falls ' + (4 + (x.hunger || 0)).toFixed(1) + ' a month unless it is fed with conquest (more as it grows and ages)', false],
        ['Fed last month', x.fed ? '+' + Math.round(x.fed) : 'nothing', (x.fed || 0) >= 4],
        ['At this rate it goes out in', n.sig > 0 ? Math.max(1, Math.round(n.sig / (4 + (x.hunger || 0)))) + ' months without new conquests' : 'it is out', n.sig > 40],
        ['States consumed', String(n.cnt.consumed || 0)]];
    },
  };
  const fire = (v) => ['fn', (G, n) => feed(n, v)];
  const fireNote = (v) => ['note', 'The fire ' + (v > 0 ? '+' : '−') + Math.abs(v)];
  const dev = (o) => E.push(Object.assign({ sys: 1, tone: 'bad', sfx: 'alarm', kicker: 'The fire' }, o));
  dev({ id: 'nz_hunger', title: 'The fire is hungry',
    text: 'Peace is suffocating the regime. The Bunker demands a new war by the end of the month; the generals say there is nothing left to attack with; the radio says the enemy is everywhere. Something has to burn.',
    opts: [
      { label: (n, G, c) => 'War on ' + G.nations[c.t].name, can: (n, G, c) => !!(c.t && G.nations[c.t] && G.nations[c.t].alive && !ID.Diplomacy.warBlock(G, n, G.nations[c.t])), tip: 'A new war feeds the fire at once.', fx: [['fn', (G, n, c) => declare(G, n, G.nations[c.t])], ['note', 'War; the fire +12']], ai: 3 },
      { label: 'Turn the fire inward', tip: 'Purges, show trials and executions. If there is no enemy abroad, there will be one at home.', fx: [fire(20), fireNote(20), ['stab', -12], ['grievance', 15], ['pop', -0.01], ['sup', 'military', -6]], ai: 1 },
      { label: 'Let it burn low', fx: [fire(-25), fireNote(-25)], ai: 0.3 },
    ] });
  dev({ id: 'nz_nero', when: (n) => n.nwars > 0, title: 'The decree of destruction',
    text: 'The Bunker orders every factory, bridge, power station and grain store in the path of the enemy destroyed, so that nothing is left to the victors, or to our own people after them. The minister of armaments has the order in his hand and has not yet passed it on.',
    opts: [
      { label: 'Carry it out', tip: 'The enemy advances over ruins. So will our own people, for a generation.', fx: [['mod', 'def', 0.15, 18, 'The decree of destruction'], ['mod', 'prod', -0.2, 36, 'The decree of destruction'], ['mod', 'ls', -6, 36, 'The decree of destruction'], fire(15), fireNote(15)], ai: 2 },
      { label: 'The minister quietly disobeys', tip: 'The factories survive. If the Bunker finds out, so will nobody involved.', fx: [fire(-15), fireNote(-15), ['sup', 'capital', 6], ['mod', 'coup', 0.3, 12, 'Disobedience']], ai: 1 },
    ] });
  dev({ id: 'nz_children', title: 'The last levy',
    text: 'Boys of fifteen and men of sixty are handed a rifle and an armband. The posters call them the nation’s last wall. Their mothers are not asked.',
    opts: [
      { label: 'Call them up', tip: 'More men at the front now, and a hole in the nation that will not close for decades.', fx: [['fn', (G, n) => { draft(G, n, 0.03, 0.04); }], ['note', 'Troops +3% of the population'], ['mod', 'growth', -0.08, 120, 'The lost generation'], ['mod', 'ls', -3, 24, 'The last levy'], fire(12), fireNote(12)], ai: 2 },
      { label: 'Spare them', fx: [fire(-12), fireNote(-12), ['sup', 'military', -6]], ai: 1 },
    ] });
  dev({ id: 'nz_ally', when: (n, G, c) => !!(c.t && G.nations[c.t] && G.nations[c.t].alive && !ID.atWar(G, n.id, c.t)), title: 'The ally falters',
    text: (n, G, c) => G.nations[c.t].name + ', the nearest thing we have to a friend, has been seen talking to the enemy through a neutral embassy. The Bunker says an ally who doubts is an enemy who has not yet declared.',
    opts: [
      { label: (n, G, c) => 'Strike first: invade ' + G.nations[c.t].base, tip: 'Betrayal feeds the fire like anything else. Nobody will ever trust us again; nobody does now.', fx: [['fn', (G, n, c) => { const t = G.nations[c.t]; if (!t || !t.alive) return; if (n.bloc && ID.sameBloc(G, n.id, t.id)) ID.Diplomacy.leaveBloc(G, n, true); declare(G, n, t); }], fire(20), fireNote(20), ['opAll', -10]], ai: 2 },
      { label: 'Keep faith with them', fx: [fire(-10), fireNote(-10), ['fn', (G, n, c) => { if (G.nations[c.t]) ID.addOpBoth(G, n.id, c.t, 10); }]], ai: 1 },
    ] });
  dev({ id: 'nz_cities', when: (n) => n.nwars > 0, title: 'The order to raze',
    text: 'The Bunker orders the conquered cities levelled as a warning to the next enemy, and to anyone at home who still thinks of surrender. The commanders in the field have asked for the order in writing.',
    opts: [
      { label: 'Give the order', tip: 'A crime the world will not forget or forgive. Every power turns against us; the occupied provinces will never be quiet again.', fx: [fire(18), fireNote(18), ['opAll', -20], ['threat', 30], ['mod', 'unrest', 6, 36, 'The razed cities'], ['fn', (G, n) => { ID.chron(G, 'crime', 'The ' + n.adj + ' regime orders the cities it has conquered destroyed.', n.id); }]], ai: 1.5 },
      { label: 'Refuse to put it in writing', fx: [fire(-12), fireNote(-12), ['sup', 'military', 4]], ai: 1 },
    ] });
  dev({ id: 'nz_wonder', title: 'The wonder weapon',
    text: 'The engineers promise a weapon that will turn the war, if they are given the last of the steel, the last of the fuel and the last of the treasury. They have promised before.',
    opts: [
      { label: 'Give them everything', tip: 'Half the treasury and a year of industry. It may work. It usually does not.', fx: [['fn', (G, n) => { n.gold -= Math.max(0, n.gold) * 0.6; if (G.rng.chance(0.45)) { ID.addMod(n, 'atk', 0.2, 12, 'The wonder weapon'); feed(n, 20); if (isP(G, n)) ID.news(G, 'The wonder weapon works. For now, the front moves again.', 'good', n.id); } else { feed(n, -10); if (isP(G, n)) ID.news(G, 'The wonder weapon is a failure. The steel is gone.', 'bad', n.id); } }], ['note', '60% of the treasury; a 45% chance of attack +20% and the fire +20, otherwise the fire −10'], ['mod', 'prod', -0.1, 12, 'The wonder weapon']], ai: 1.5 },
      { label: 'There is no wonder weapon', fx: [fire(-10), fireNote(-10), ['charisma', -6]], ai: 1 },
    ] });
  dev({ id: 'nz_generals', when: (n) => n.nwars > 0, title: 'The generals ask to retreat',
    text: 'Every commander on the main front asks permission to shorten the line before it breaks. The Bunker answers that no soldier may take a single step back, and asks for the names of the generals who asked.',
    opts: [
      { label: 'Not one step back', tip: 'The line holds a little longer, and the armies in it die where they stand.', fx: [['mod', 'def', 0.1, 6, 'Not one step back'], ['troops', -0.08], fire(10), fireNote(10)], ai: 2 },
      { label: 'Shoot the generals', tip: 'Fanatics replace professionals. The fire roars; the staff work does not.', fx: [['sup', 'military', -15], ['mod', 'atk', -0.08, 12, 'Generals shot'], ['mod', 'coup', -0.3, 24, 'Generals shot'], fire(15), fireNote(15)], ai: 1 },
      { label: 'Let them shorten the line', fx: [fire(-12), fireNote(-12), ['mod', 'def', 0.05, 6, 'A shorter line']], ai: 1 },
    ] });
  dev({ id: 'nz_starve', title: 'The cities go hungry',
    text: 'Every train carries ammunition and none carries food. The ration has fallen below what a body needs, and the queues outside the bakeries are longer than the queues outside the recruiting offices.',
    opts: [
      { label: 'The front comes first', tip: 'The armies eat; the cities do not.', fx: [['mod', 'ls', -10, 12, 'Hunger'], ['mod', 'unrest', 6, 12, 'Hunger'], ['mod', 'growth', -0.05, 24, 'Hunger'], fire(8), fireNote(8)], ai: 2 },
      { label: 'Feed the cities', fx: [fire(-12), fireNote(-12), ['mod', 'atk', -0.05, 6, 'Rations diverted']], ai: 1 },
    ] });
  E.push({ id: 'nz_ashes', sys: 1, tone: 'bad', sfx: 'defeat', kicker: 'The fire goes out',
    title: 'Ashes',
    text: (n, G, c) => 'There was nothing left to burn. The surviving generals arrested the Bunker this morning and asked the enemy for terms; the radio, for the first time in years, played no anthem at all. What was ' + (c.was || 'the Realm') + ' is now ' + n.name + ', a ruin governed by officers who did not want it. The fire is out.',
    opts: [{ label: 'It is over', fx: [] }] });
})();
