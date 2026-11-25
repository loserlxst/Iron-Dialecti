/* IRON DIALECTIC — the specialization engines (PLAN.md). Loaded after every doctrine, it layers onto
   ID.DOCTRINE through each doctrine's month, extra and acts, and adds the dispatches only they receive.
   Engine B for Marxism-Leninism (plan quotas) lives in sim/economy.js; everything else is here.
   A  pledges            liberal, conmon, demsoc, natpop (promises); junta (the handover clock); theocracy (edicts)
   B  targets            technocracy (forecasts), marketsoc (the quota and the market), cybernetic (the network's
                         focus), nrx (guidance)
   C  the table          socdem, corporatist, junta (the services), council (motions), thirdpos (the blocs),
                         personalist (loyalty tests)
   D  the chain          trot, pannat, technosoc, revival
   E  occupied land      ancom
   F  province orders    minarchy (charters), merchant (routes), juche (guidance), theocracy (holy sites)
   G  stockpiles         ansyn (the strike fund), agrarian (the village granary)
   H  the heir           absmon, conmon, juche, personalist
   I  the instrument     mao (Red Guards), natsyn (squads), revival (the guard), natsoc (the street army)
   Each system's forbidden verb is in ID.FORBID, read by laws, decisions, proposals, building and emergency rule.
   State lives in n.sigx (reset with the doctrine on a change of system). */
(function () {
  'use strict';
  const ID = (globalThis.ID = globalThis.ID || {});
  const D = ID.DOCTRINE, EV = ID.EVENT_DEFS;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const isP = (G, n) => n.id === G.player && !G.autoPlayer;
  const P = () => ID.Politics, Dp = () => ID.Diplomacy;
  const YEAR = 360, MO = 30, PERM = 9999;
  const date = (t) => ID.dateOf(t).short;
  const fx = (G, n, list) => ID.Events.applyFx(G, n, list, {});
  const say = (G, n, txt, cat) => { if (n.id === G.player) ID.news(G, txt, cat || 'pol', n.id); };
  const feed = (n, v) => { n.sig = clamp((n.sig || 0) + v, 0, 100); };
  const civil = (G, n) => P().inCivil(G, n) || (n.a.civilEnd != null && G.tick - n.a.civilEnd < YEAR);
  /* a modifier that lasts while it is refreshed each month (timed modifiers stack, so replace our own) */
  const keep = (n, label, k, v) => {
    for (let i = n.mods.length - 1; i >= 0; i--) if (n.mods[i].label === label && n.mods[i].k === k) n.mods.splice(i, 1);
    if (v) n.mods.push({ k, v, m: 2, label });
  };
  const cnt = (n, k, v) => { n.cnt[k] = (n.cnt[k] || 0) + (v == null ? 1 : v); };
  /* layer an engine onto a doctrine: month and extra chain after the doctrine's own; acts are appended (drop replaces) */
  const OFF = ((globalThis.process && process.env && process.env.ID_ENG_OFF) || '').split(','); // tools: leave some systems' engines out
  const hook = (key, h) => {
    const d = D[key]; if (!d || OFF.includes(key)) return;
    if (h.month) { const m0 = d.month; d.month = m0 ? (G, n) => { m0(G, n); if (n.alive) h.month(G, n); } : h.month; }
    if (h.extra) { const e0 = d.extra; d.extra = e0 ? (n, G) => (e0(n, G) || []).concat(h.extra(n, G) || []) : h.extra; }
    if (h.acts) d.acts = d.acts.filter((a) => !(h.drop || []).includes(a.id)).concat(h.acts);
  };
  const ev = (o) => EV.push(o);
  const yearly = (G, n, key, every) => { const x = n.sigx; if (x[key] == null) { x[key] = G.tick + G.rng.int(3, 11) * MO; return false; } if (G.tick < x[key]) return false; x[key] = G.tick + (every || YEAR); return true; };

  /* ================================================================ forbidden verbs */
  const deny = (why) => () => why;
  const NOEMERG = { emergency: 1, 'dec:martial_law': 1, 'dec:emergency_committee': 1 };
  const noEmergency = (why) => { const o = {}; for (const k in NOEMERG) o[k] = why; return o; };
  ID.FORBID = {
    trot: { ally: (G, n, t) => (t && ID.ideo(t).family !== 'socialist' ? 'Permanent revolution makes no alliance with a capitalist state.' : '') },
    mao: { 'dec:thaw': 'The Chairman does not thaw; he rectifies.' },
    marketsoc: { 'law:labor:company': 'Self-managed enterprises do not have company unions.' },
    demsoc: noEmergency('The Peaceful Road never suspends the constitution.'),
    ansyn: { 'law:recruit:*': 'The unions will not draft anyone. Every column is a volunteer column.' },
    ancom: noEmergency('There is no centre to issue emergency measures.'),
    liberal: noEmergency('Parliament does not rule by decree, and elections are not postponed.'),
    socdem: { 'law:labor:company': 'Social democracy bargains with free unions; it does not tame them.' },
    minarchy: { 'build:factory': 'The night-watchman state builds no works. Sell a charter and let a company build.', 'build:city': 'The night-watchman state founds no towns; it guards the ones there are.' },
    conmon: noEmergency('The crown does not govern; it reigns.'),
    agrarian: { 'build:factory': (G, n) => (n.nb[ID.B.FACTORY] >= n.tiles / 600 ? 'The villages will have no more smokestacks.' : '') },
    corporatist: { 'law:labor:*': 'Strikes and free unions have no place in the chambers.' },
    technocracy: { 'law:press:censored': 'Credibility needs published figures: the experts do not censor.' },
    merchant: { 'law:recruit:*': 'The republic hires its armies; it does not draft its citizens.' },
    natpop: { peace: (G, n) => ((n.a.coreLost || 0) > 0.02 ? 'The movement will never sign away the nation’s land: no peace while the enemy holds it.' : '') },
    thirdpos: { ally: 'The Third Position joins no bloc.' },
    pannat: { nap: 'A pact would recognise the borders that divide the nation.' },
    revival: { trade: (G, n, t) => (t && t.id === leadPower(G) ? 'No normal relations with the leading power.' : ''), nap: (G, n, t) => (t && t.id === leadPower(G) ? 'No normal relations with the leading power.' : '') },
    natsyn: { 'law:labor:*': 'The national revolution does not recognise class struggle.' },
    theocracy: {
      'law:trade:free': (G, n) => (n.flags.edict_usury ? 'The edict against usury stands for ever.' : ''),
      nap: (G, n, t) => (n.flags.edict_war && t && !['theocracy', 'revival'].includes(t.ideo) ? 'The edict of holy war allows no pact with the unbeliever.' : ''),
      'law:press:regulated': (G, n) => (n.flags.edict_pure ? 'The edict of purity stands for ever.' : ''),
    },
  };
  /* the strongest liberal or market state: the leading power the revival will not treat with */
  function leadPower(G) {
    if (G._lead && G._lead.t === G.tick) return G._lead.id;
    let best = -1, bp = 0; for (const o of ID.alive(G)) { const f = ID.ideo(o).family; if (f !== 'liberal') continue; const p = Dp().power(o); if (p > bp) { bp = p; best = o.id; } }
    G._lead = { t: G.tick, id: best }; return best;
  }
  /* '' or why the system forbids it; verb: 'law:cat:opt', 'dec:id', 'ally', 'nap', 'trade', 'peace', 'build:factory', 'build:city', 'emergency' */
  /* wild: also read 'law:cat:*', which only explains options the system's law list already excludes */
  const FORBID_OFF = ((globalThis.process && process.env && process.env.ID_FORBID_OFF) || '').split(','); // tools: test without some systems' bans
  ID.forbid = function (G, n, verb, t, wild) {
    const F = ID.FORBID[n.ideo]; if (!F || FORBID_OFF.includes(n.ideo) || FORBID_OFF.includes('all')) return '';
    let r = F[verb];
    if (r == null && wild && verb.startsWith('law:')) r = F[verb.split(':').slice(0, 2).join(':') + ':*'];
    return typeof r === 'function' ? r(G, n, t) || '' : r || '';
  };

  /* ================================================================ A. pledges */
  const PL = {
    liberal: [
      { id: 'tax', name: 'No new taxes', desc: 'Read my lips. Not a penny more, for four years.', now: [['sup', 'capital', 6]], snap: (n) => n.tax || 0, test: (n, v) => (n.tax || 0) <= v + 0.5 },
      { id: 'peace', name: 'Keep us out of war', desc: 'Not one of our sons will die in a foreign quarrel.', now: [['we', -6], ['sup', 'intelligentsia', 3]], always: (n) => !n.nwars },
      { id: 'ls', name: 'A better life by the next election', desc: 'Wages, houses and cheaper bread, measured by the time you vote again.', now: [['sup', 'workers', 5]], snap: (n) => n.ls, test: (n, v) => n.ls >= v + 2 },
      { id: 'clean', name: 'Clean up government', desc: 'Every contract published, every minister’s accounts audited.', now: [['sup', 'intelligentsia', 5]], snap: (n) => n.corr, test: (n, v) => n.corr <= v - 4 },
    ],
    demsoc: [
      { id: 'welfare', name: 'A health service for all', desc: 'Free at the point of use, paid for by those who can afford it.', now: [['sup', 'workers', 6]], test: (n) => (n.budget.welfare || 0) >= 0.18 },
      { id: 'land', name: 'Land reform', desc: 'The great estates broken up and given to those who work them.', now: [['sup', 'peasants', 6]], test: (n) => ['smallholder', 'commune'].includes(n.laws.land) },
      { id: 'wages', name: 'A living wage', desc: 'A legal minimum, indexed to prices.', now: [['sup', 'workers', 5]], snap: (n) => n.ls, test: (n, v) => n.ls >= v + 2 },
      { id: 'councils', name: 'Workers on every board', desc: 'Elected workers in the boardroom of every large firm.', now: [['sup', 'workers', 4], ['particip', 4]], test: (n) => ['control', 'free'].includes(n.laws.labor) && n.particip >= 45 },
    ],
    natpop: [
      { id: 'land', name: 'The lost provinces by the deadline', desc: 'The nation whole again, and soon.', now: [['charisma', 4]], snap: (n) => n.tiles, test: (n, v) => n.tiles >= v * 1.03 },
      { id: 'work', name: 'Work and bread for every family', desc: 'No more queues at the labour exchange.', now: [['sup', 'workers', 5]], snap: (n) => n.ls, test: (n, v) => !n.depression && n.ls >= v + 1 },
      { id: 'enemy', name: 'The enemy will be punished', desc: 'They will pay for what they did to us.', now: [['fervor', 6]], snap: (n) => n.cnt.warsWon || 0, test: (n, v) => (n.cnt.warsWon || 0) > v },
      { id: 'order', name: 'Order in the streets', desc: 'No more strikes, no more marches, no more disorder.', now: [['sup', 'capital', 5]], always: (n) => !n.strike },
    ],
  };
  PL.conmon = PL.liberal;
  const openPl = (n) => (n.sigx.pl = n.sigx.pl || []);
  const monthsTo = (G, t) => Math.max(1, Math.ceil((t - G.tick) / MO));
  const plDue = (G, n) => (ID.ideo(n).elections && n.electionAt > G.tick ? Math.min(n.electionAt, G.tick + 4 * YEAR) : G.tick + (n.ideo === 'natpop' ? 2 : 3) * YEAR);
  const plAct = (key, p) => ({
    id: 'pl_' + key + '_' + p.id, name: 'Promise: ' + p.name.toLowerCase(), desc: p.desc + ' (A dated promise: it pays now; break it and the bill comes due.)', cost: { auth: 5 }, cd: 12, sig: key === 'natpop' ? 6 : 0,
    can: (n) => (openPl(n).length >= 3 ? 'You already have three open promises.' : openPl(n).some((q) => q.id === p.id) ? 'Already promised.' : ''),
    fx: [...p.now, ['fn', (G, n) => { openPl(n).push({ id: p.id, at: G.tick, due: plDue(G, n), v: p.snap ? p.snap(n) : 0, bad: false, backed: false }); }]],
    ai: (n, v, G) => openPl(n).length < 2 && (key !== 'natpop' || v < 60) && (!ID.ideo(n).elections || n.electionAt - G.tick < 2 * YEAR),
  });
  /* what a kept or broken promise does, system by system (the twist) */
  const PL_OUT = {
    liberal: (G, n, p, kept) => {
      const m = monthsTo(G, n.electionAt || G.tick + YEAR) + 1;
      if (kept) { ID.addMod(n, 'vote', 0.04, m, 'A promise kept'); return; }
      ID.addMod(n, 'vote', -0.06, m, 'A promise broken');
      if (G.rng.chance(0.3)) { ID.addMod(n, 'legit', -4, 12, 'The opposition exposes a broken promise'); say(G, n, 'The opposition reads out the broken promise in the chamber, word for word.'); }
    },
    conmon: (G, n, p, kept) => {
      if (kept) { n.mandate = clamp(n.mandate + 8, 0, 100); return; }
      n.mandate = clamp(n.mandate - 25, 0, 100); n.stab -= 4;
      say(G, n, 'A broken promise brings down the cabinet; the sovereign sends for a new prime minister.');
      if (p.backed) { feed(n, -15); say(G, n, 'The crown had backed that promise. Royal prestige suffers with the government.'); }
    },
    demsoc: (G, n, p, kept) => {
      const x = n.sigx; if (x.patience == null) x.patience = 100;
      if (kept) { fx(G, n, [['sup', 'workers', 4]]); x.patience -= 22; say(G, n, 'A promise kept. In the officers’ clubs and the bankers’ dining rooms, patience wears thinner.'); return; }
      fx(G, n, [['sup', 'workers', -6]]); P().boostOpp(G, n, 8); say(G, n, 'A broken promise splits the left of the party.');
    },
    natpop: (G, n, p, kept) => {
      if (kept) { feed(n, 15); return; }
      const k = 1 + 0.5 * (n.sigx.ladder || 0); feed(n, -Math.round(20 * k)); fx(G, n, [['unrest', Math.round(6 * k)]]);
      say(G, n, 'The deadline passes. The crowd that cheered the promise now asks where it is.');
    },
  };
  const plMonth = (key) => (G, n) => {
    const L = openPl(n), rule = PL[key];
    for (let i = L.length - 1; i >= 0; i--) {
      const q = L[i], p = rule.find((r) => r.id === q.id); if (!p) { L.splice(i, 1); continue; }
      if (p.always && !p.always(n)) q.bad = true;
      if (G.tick < q.due) continue;
      const kept = !q.bad && (!p.test || p.test(n, q.v));
      L.splice(i, 1); cnt(n, kept ? 'pledgeKept' : 'pledgeBroken');
      say(G, n, 'Promise ' + (kept ? 'kept' : 'broken') + ': ' + p.name.toLowerCase() + '.', kept ? 'good' : 'bad');
      PL_OUT[key](G, n, q, kept);
    }
  };
  const plExtra = (key) => (n, G) => {
    const L = openPl(n), rule = PL[key];
    return L.map((q) => { const p = rule.find((r) => r.id === q.id); const ok = !q.bad && (!p.test || p.test(n, q.v)); return ['Promise: ' + p.name.toLowerCase(), (ok ? 'on track' : 'not met yet') + ', due ' + date(q.due) + (q.backed ? ' (backed by the crown)' : ''), ok]; });
  };
  for (const key of ['liberal', 'conmon', 'demsoc', 'natpop']) hook(key, { month: plMonth(key), extra: plExtra(key), acts: PL[key].map((p) => plAct(key, p)) });
  /* democratic socialism: kept promises wear down capital's and the officers' patience */
  hook('demsoc', {
    month: (G, n) => {
      const x = n.sigx; if (x.patience == null) x.patience = 100;
      x.patience = clamp(x.patience + 0.6, 0, 100);
      if (x.patience <= 0 && !civil(G, n)) { x.patience = 55; cnt(n, 'demsocCoup'); say(G, n, 'Tanks in the avenue at dawn. The officers have run out of patience.', 'bad'); P().coup(G, n, 0); }
    },
    extra: (n) => { const v = n.sigx.patience == null ? 100 : n.sigx.patience; return [['Patience of capital and the officers', Math.round(v) + ' (each promise kept costs 22; at 0 the officers move)', v > 35]]; },
  });
  /* national populism: the only way to buy time is a bigger promise */
  hook('natpop', {
    acts: [{ id: 'np_more', name: 'Promise even more', desc: 'A bigger rally, a bigger promise: every open deadline moves eighteen months, and every future failure will cost more.', cost: { gold: 30 }, cd: 18, sig: 8,
      can: (n) => (openPl(n).length ? '' : 'Nothing has been promised yet.'), fx: [['fn', (G, n) => { for (const q of openPl(n)) q.due += 18 * MO; n.sigx.ladder = (n.sigx.ladder || 0) + 1; }], ['note', 'The price of failure rises', false]],
      ai: (n, v, G) => openPl(n).some((q) => q.due - G.tick < 4 * MO) && (n.sigx.ladder || 0) < 3 }],
    extra: (n) => ((n.sigx.ladder || 0) ? [['Promises escalated', n.sigx.ladder + ' times: a broken one now costs ' + Math.round((1 + 0.5 * n.sigx.ladder) * 100) + '%', false]] : []),
  });
  /* constitutional monarchy: three prerogatives a reign; a fourth wakes the republicans */
  const reign = (n) => { const x = n.sigx; if (x.reignOf !== n.leader.name) { x.reignOf = n.leader.name; x.prerog = 0; x.abolished = 0; } return x; };
  const prerog = (id, name, desc, f, ai) => ({ id, name, desc: desc + ' (A royal prerogative: three a reign are accepted; each one after that strengthens the republicans.)', cost: { auth: 5 }, cd: 24, sig: -6,
    fx: [...f, ['fn', (G, n) => { const x = reign(n); x.prerog++; cnt(n, 'prerog'); if (x.prerog > 3 && n.drift.liberal != null) { n.drift.liberal = clamp(n.drift.liberal + 15, 0, 100); say(G, n, 'The crown has meddled once too often. Republican clubs fill up.', 'bad'); } }]], ai });
  hook('conmon', {
    acts: [
      prerog('cm_dissolve', 'Dissolve parliament', 'The sovereign grants the government a new election.', [['fn', (G, n) => { n.electionAt = G.tick + 2 * MO; }]], (n, v, G) => n.mandate < 30 && n.electionAt - G.tick > YEAR),
      prerog('cm_back', 'The crown backs the government’s promise', 'The sovereign says in public that the promise will be kept. If it is broken, the crown pays too.', [['mandate', 8], ['fn', (G, n) => { const q = openPl(n).find((p) => !p.backed); if (q) q.backed = true; }]], (n) => openPl(n).length > 0 && n.mandate < 45),
      prerog('cm_refuse', 'Refuse the prime minister', 'The sovereign will not ask the leader of the largest party to form a government. A national government is formed instead.', [['stab', 6], ['mandate', -10], ['sup', 'military', 4]], (n) => n.stab < 30),
    ],
    extra: (n) => { const x = reign(n); return [['Prerogatives used this reign', x.prerog + ' of 3', x.prerog <= 3]]; },
  });

  /* military junta: the handover clock */
  hook('junta', {
    month: (G, n) => {
      const x = n.sigx;
      if (x.ho == null) { x.ho = G.tick + 8 * YEAR; x.won0 = n.cnt.warsWon || 0; x.cw0 = n.cnt.civilWarsWon || 0; x.post = 0; }
      const won = n.cnt.warsWon || 0, cw = n.cnt.civilWarsWon || 0;
      if (won > x.won0) { x.ho += YEAR; say(G, n, 'Victory buys the officers another year before the handover.'); }
      if (cw > x.cw0) { x.ho += 2 * YEAR; say(G, n, 'The rising is crushed; the handover is put back two years.'); }
      x.won0 = won; x.cw0 = cw;
      if (G.tick >= x.ho && !ID.Events.pending(G, 'ju_deadline') && !civil(G, n)) { x.ho = G.tick + 6 * MO; ID.Events.queue(G, n, 'ju_deadline', { post: x.post }); }
    },
    acts: [{ id: 'ju_postpone', name: 'Postpone the handover', desc: 'Three more years “to finish the job”. The services do not agree on what the job is.', cost: { auth: 15 }, cd: 24, sig: -15,
      fx: [['fn', (G, n) => { n.sigx.ho = Math.max(n.sigx.ho, G.tick) + 3 * YEAR; n.sigx.post = (n.sigx.post || 0) + 1; grudge(n, G.rng.pick(['army', 'navy', 'air']), 1); cnt(n, 'postponed'); }], ['note', 'One of the services is offended', false]],
      ai: (n, v, G) => n.sigx.ho - G.tick < 6 * MO && (n.nwars || n.stab < 45) }],
    extra: (n, G) => [['Promised handover', date(n.sigx.ho || G.tick) + ((n.sigx.post || 0) ? ' (postponed ' + n.sigx.post + ' times)' : ''), (n.sigx.ho || 0) - G.tick > YEAR]],
  });
  ev({ id: 'ju_deadline', sys: 1, tone: 'mixed', title: 'The date has come', text: (n, G, c) => 'The officers promised to hand power back by now. The newspapers have printed the date every morning for a month.' + (c.post >= 2 ? ' Some of the younger officers say that if the council will not keep its word, they will keep it for the council.' : ''),
    opts: [
      { label: 'Hand over to an elected government', fx: [['ideology', 'liberal', 'election']], ai: (n) => (n.stab > 60 ? 1 : 0.3) },
      { label: 'Postpone it again', tip: 'The services split further; the more often it is put off, the likelier a younger officer’s coup.', fx: [['sig', -20], ['fn', (G, n) => { n.sigx.post = (n.sigx.post || 0) + 1; n.sigx.ho = G.tick + 2 * YEAR; if (n.sigx.post >= 3 && !civil(G, n)) { cnt(n, 'colonelsCoup'); P().coup(G, n, 0); } }]], ai: 1 },
    ] });

  /* theocracy: edicts that close an option for ever */
  /* an edict that bans the law in force replaces it with the system's default */
  const dropBanned = (G, n) => { for (const c of ID.LAW_CATS) if (ID.forbid(G, n, 'law:' + c + ':' + n.laws[c])) P().applyLaw(G, n, c, ID.ideo(n).lawDef[c]); };
  const fewEdicts = (n) => Object.keys(n.flags).filter((f) => f.startsWith('edict_')).length < 2;
  const edict = (k, name, desc, f, note) => ({ id: 'th_' + k, name: 'Edict: ' + name, desc: desc + ' Edicts cannot be repealed.', cost: { auth: 20 }, cd: 12, sig: 15,
    can: (n) => (n.flags['edict_' + k] ? 'Proclaimed already, for ever.' : ''), fx: [...f, ['flag', 'edict_' + k], ['fn', dropBanned], ['note', note, false]], ai: (n, v) => v < 45 && fewEdicts(n) });
  hook('theocracy', { acts: [
    edict('usury', 'against usury', 'Interest is forbidden; the moneylenders close.', [['mod', 'legit', 4, PERM, 'Edict against usury'], ['mod', 'rev', -0.05, PERM, 'Edict against usury'], ['sup', 'peasants', 6]], 'Free trade is closed for ever'),
    edict('war', 'of holy war', 'The faithful are called to arms against the unbeliever.', [['mod', 'atk', 0.08, PERM, 'Edict of holy war'], ['fervor', 10]], 'No pact with an unbeliever, ever'),
    edict('pure', 'of purity', 'Books, films and songs judged by the clergy.', [['mod', 'unrest', -4, PERM, 'Edict of purity'], ['mod', 'sci', -0.08, PERM, 'Edict of purity']], 'The press can never be loosened'),
  ] });

  /* ================================================================ B. targets */
  /* a year's industrial growth, announced in advance (technocracy's forecast, NRX's guidance): set it, then reckon */
  const target = (store, id, name, desc, g, big, sig, busy, ai) => ({ id, name, desc, cost: {}, cd: 6, sig,
    can: (n) => (n.sigx[store] ? busy : ''), fx: [['fn', (G, n) => { n.sigx[store] = { due: G.tick + YEAR, base: Math.max(1, n.ind), g, big }; }]], ai });
  const reckon = (store, hitK, missK, done) => (G, n) => {
    const f = n.sigx[store]; if (!f || G.tick < f.due) return;
    n.sigx[store] = null; const g = n.ind / f.base - 1, hit = g >= f.g; cnt(n, hit ? hitK : missK); done(G, n, f, g, hit);
  };
  const targetRow = (label, store, none) => (n) => { const f = n.sigx[store]; return [label, f ? '+' + Math.round(f.g * 100) + '% industry by ' + date(f.due) + ' (now ' + ((n.ind / f.base - 1) * 100).toFixed(1) + '%)' : none, f ? n.ind / f.base - 1 >= f.g : null]; };
  const pc = (g) => (g * 100).toFixed(1) + '%';

  /* technocracy: public forecasts, no lie button; two misses running and the experts go */
  hook('technocracy', {
    drop: ['tc_publish'],
    acts: [target('fc', 'tc_fc_bold', 'Publish a bold forecast', 'Industry 6% higher within a year, in every newspaper. Beat it and credibility rises; miss it and everyone knows.', 0.06, true, 6, 'A forecast is already out.', (n, v) => v > 65),
      target('fc', 'tc_fc_safe', 'Publish a cautious forecast', 'Industry 1% higher within a year. Beat it and credibility rises; miss it and everyone knows.', 0.01, false, 2, 'A forecast is already out.', (n, v) => v <= 65)],
    month: reckon('fc', 'fcHit', 'fcMiss', (G, n, f, g, hit) => {
      const x = n.sigx;
      if (hit) { feed(n, f.big ? 12 : 4); x.misses = 0; say(G, n, 'The forecast is met: industry ' + pc(g) + ' up.', 'good'); return; }
      feed(n, -14); ID.addMod(n, 'legit', -4, 12, 'A missed forecast'); x.misses = (x.misses || 0) + 1;
      say(G, n, 'The forecast is missed (' + pc(g) + ' against ' + Math.round(f.g * 100) + '%). Every newspaper prints both figures.', 'bad');
      if (x.misses >= 2 && !civil(G, n)) { x.misses = 0; ID.Events.queue(G, n, 'tc_replaced', {}); }
    }),
    extra: (n) => [targetRow('Forecast', 'fc', 'none published')(n), ['Missed forecasts running', (n.sigx.misses || 0) + ' (two and the experts are replaced)', !(n.sigx.misses > 0)]],
  });
  ev({ id: 'tc_replaced', sys: 1, title: 'The experts have been wrong twice', text: 'Two forecasts in a row, missed in public. The ministries no longer believe the planning office, and the generals have begun to ask for its figures.',
    opts: [
      { label: 'Appoint new experts', tip: 'A new head of government from the planning office’s rivals.', fx: [['auth', -20], ['sig', 20], ['fn', (G, n) => P().newLeader(G, n, 'ousted')]], ai: 2 },
      { label: 'Let the generals take over', fx: [['ideology', 'junta', 'coup']], ai: 1 },
    ] });

  /* market socialism: set the quota; above it the market sells, and inequality grows */
  const MS_SHARE = [0.5, 0.3, 0.12];
  hook('marketsoc', {
    acts: [
      { id: 'ms_q_down', name: 'Lower the plan quota', desc: 'More of every factory’s output may be sold at market prices.', cost: { auth: 6 }, cd: 12, sig: 8, can: (n) => ((n.sigx.q == null ? 1 : n.sigx.q) <= 0 ? 'The quota is already at its lowest.' : ''), fx: [['fn', (G, n) => { n.sigx.q = (n.sigx.q == null ? 1 : n.sigx.q) - 1; }]], ai: (n) => (n.sigx.ineq || 0) < 35 && (n.sigx.q == null ? 1 : n.sigx.q) > 0 && n.gold < 150 },
      { id: 'ms_q_up', name: 'Raise the plan quota', desc: 'The plan takes back a larger share of output; the market and its fortunes shrink.', cost: { auth: 6 }, cd: 12, sig: -8, can: (n) => ((n.sigx.q == null ? 1 : n.sigx.q) >= 2 ? 'The quota is already at its highest.' : ''), fx: [['fn', (G, n) => { n.sigx.q = (n.sigx.q == null ? 1 : n.sigx.q) + 1; }]], ai: (n) => (n.sigx.ineq || 0) > 60 },
    ],
    month: (G, n) => {
      const x = n.sigx; if (x.q == null) x.q = 1; if (x.ineq == null) x.ineq = 20;
      const m = MS_SHARE[x.q];
      keep(n, 'The market share', 'prod', m * 0.16);
      ID.flow(n, 'Market sales', (n.ind || 0) * m * 0.015);
      x.ineq = clamp(x.ineq + m * 1.6 - 0.45, 0, 100);
      keep(n, 'Inequality', 'unrest', Math.max(0, x.ineq - 40) * 0.08);
      n.corr = clamp(n.corr + Math.max(0, x.ineq - 50) * 0.01, 0, 100); // the princelings
      if (x.ineq >= 70 && (x.squareAt == null || G.tick - x.squareAt > 5 * YEAR) && !civil(G, n)) { x.squareAt = G.tick; cnt(n, 'square'); ID.Events.queue(G, n, 'ms_square', {}); }
    },
    extra: (n) => { const x = n.sigx, q = x.q == null ? 1 : x.q; return [['Sold at market', Math.round(MS_SHARE[q] * 100) + '% of output (quota ' + ['low', 'middle', 'high'][q] + ')', null], ['Inequality', Math.round(x.ineq || 0) + (x.ineq >= 70 ? ': the students are in the square' : ' (at 70 the students take to the square)'), (x.ineq || 0) < 50]]; },
  });
  ev({ id: 'ms_square', sys: 1, sfx: 'alarm', title: 'Students in the square', text: 'The sons of the directors drive imported cars; the sons of the workers do not. Ten thousand students have occupied the main square, and the workers from the steelworks have joined them.',
    opts: [
      { label: 'Clear the square', fx: [['stab', -10], ['sup', 'intelligentsia', -15], ['sig', 10], ['fn', (G, n) => { n.sigx.ineq -= 10; }], ['opAll', -6]], ai: 2 },
      { label: 'Raise the quota and punish the princelings', fx: [['sig', -15], ['sup', 'workers', 8], ['fn', (G, n) => { n.sigx.ineq -= 30; n.sigx.q = 2; n.corr = Math.max(0, n.corr - 10); }]], ai: 1 },
      { label: 'Talk to them', tip: 'Concessions and a dialogue. It may calm the square, or it may grow.', fx: [['auth', -20], ['legitmod', 3, 24, 'The dialogue'], ['fn', (G, n) => { n.sigx.ineq -= 15; if (G.rng.chance(0.4) && !P().inCivil(G, n)) P().uprising(G, n, 'demsoc'); }]], ai: 1 },
    ] });

  /* cybernetic planning: point the network; it cannot lie, and it sees through others' lies (economy.js) */
  const FOCUS = { econ: ['the economy', [['eff', 0.06]]], army: ['the army', [['atk', 0.05], ['def', 0.05]]], people: ['the people', [['unrest', -4], ['opp', -0.1]]] };
  hook('cybernetic', {
    acts: Object.keys(FOCUS).map((k) => ({ id: 'cy_point_' + k, name: 'Point the network at ' + FOCUS[k][0], desc: { econ: 'The machines model every factory: efficiency +6%.', army: 'The machines model every front: attack and defence +5%.', people: 'The machines read every complaint before it becomes a protest: unrest −4.' }[k] + ' The network can watch one thing at a time.', cost: { auth: 5 }, cd: 12, sig: 2,
      can: (n) => (n.sigx.focus === k ? 'The network is already watching ' + FOCUS[k][0] + '.' : ''), fx: [['fn', (G, n) => { n.sigx.focus = k; }]],
      ai: (n) => (k === 'army' ? n.nwars > 0 : k === 'people' ? !n.nwars && n.stab < 45 : !n.nwars && n.stab >= 45) })),
    month: (G, n) => { const f = n.sigx.focus; for (const k in FOCUS) for (const [m, v] of FOCUS[k][1]) keep(n, 'The network watches ' + FOCUS[k][0], m, f === k ? v : 0); },
    extra: (n) => [['The network watches', n.sigx.focus ? FOCUS[n.sigx.focus][0] : 'nothing in particular', !!n.sigx.focus], ['Lying planners abroad', 'every planned economy that falsifies its figures is found out half again as often while the network runs', true]],
  });

  /* NRX: guidance to the shareholders; guiding low is punished too; the board can replace the chief executive */
  hook('nrx', {
    acts: [target('gd', 'nx_guide_high', 'Guide high', 'Tell the shareholders industry will grow 5% this year. Beat the guidance and acceleration jumps; miss it and they sell.', 0.05, true, 0, 'Guidance is already out.', (n, v) => v > 55),
      target('gd', 'nx_guide_low', 'Guide low', 'Tell the shareholders to expect 1%. They will sell some stock on the news. Beat the guidance and acceleration jumps; miss it and they sell.', 0.01, false, -3, 'Guidance is already out.', (n, v) => v <= 55)],
    month: reckon('gd', 'gdHit', 'gdMiss', (G, n, f, g, hit) => {
      if (hit) { feed(n, f.big ? 15 : 5); say(G, n, 'Guidance beaten: industry ' + pc(g) + ' up. The stock soars.', 'good'); return; }
      feed(n, -15); say(G, n, 'Guidance missed (' + pc(g) + ' against ' + Math.round(f.g * 100) + '%). The shareholders sell.', 'bad');
      if (f.big && n.sig < 30 && G.rng.chance(0.35)) { cnt(n, 'ceoOut'); say(G, n, 'The board replaces the chief executive. Nobody fires a shot.', 'bad'); P().newLeader(G, n, 'ousted'); }
    }),
    extra: (n) => [targetRow('Guidance', 'gd', 'none given')(n)],
  });

  /* ================================================================ C. the table */
  function grudge(n, seat, v) { const g = (n.sigx.gr = n.sigx.gr || {}); g[seat] = clamp((g[seat] || 0) + v, 0, 5); }
  const gr = (n, seat) => (n.sigx.gr && n.sigx.gr[seat]) || 0;
  const SEATS = {
    socdem: { unions: ['the unions', [['a 6% rise', [['sup', 'workers', 6], ['gold', -60]]], ['a shorter week', [['sup', 'workers', 5], ['mod', 'prod', -0.02, 24, 'A shorter week']]]]],
      employers: ['the employers', [['a lower profits tax', [['sup', 'capital', 6], ['mod', 'rev', -0.03, 24, 'Profits tax cut']]], ['wage restraint', [['sup', 'capital', 5], ['sup', 'workers', -3]]]]],
      treasury: ['the treasury', [['a balanced budget', [['debtPct', -0.1], ['mod', 'ls', -1, 24, 'Austerity']]], ['a rate rise', [['inflation', -8], ['conf', -4]]]]] },
    corporatist: { industry: ['the chamber of industry', [['state orders', [['sup', 'capital', 5], ['gold', -50]]], ['a strike ban', [['sup', 'capital', 4], ['sup', 'workers', -4]]]]],
      land: ['the chamber of agriculture', [['a grain price', [['sup', 'peasants', 6], ['mod', 'food', 0.03, 24, 'Grain price']]], ['tariffs', [['sup', 'peasants', 4], ['mod', 'trade', -0.04, 24, 'Farm tariffs']]]]],
      commerce: ['the chamber of commerce', [['an export bounty', [['mod', 'trade', 0.06, 24, 'Export bounty'], ['gold', -40]]], ['a cartel', [['sup', 'capital', 4], ['corr', 3]]]]] },
    junta: { army: ['the army', [['new rifles', [['gold', -60], ['sup', 'military', 4]]], ['the war ministry', [['sup', 'military', 5]]]]],
      navy: ['the navy', [['two cruisers', [['gold', -70], ['sup', 'military', 3]]], ['the coast guard budget', [['gold', -30]]]]],
      air: ['the air force', [['a bomber wing', [['gold', -70], ['sup', 'military', 3]]], ['a new academy', [['gold', -30], ['sup', 'intelligentsia', 2]]]]] },
  };
  /* what a grudge does, refreshed each month (the twist) */
  const GRUDGE = {
    socdem: (G, n) => { keep(n, 'The employers’ grudge', 'conf', -3 * gr(n, 'employers')); keep(n, 'The treasury’s grudge', 'rev', -0.015 * gr(n, 'treasury')); if (gr(n, 'unions') >= 2 && !n.strike && G.rng.chance(0.04 * gr(n, 'unions'))) { fx(G, n, [['strike', 3]]); say(G, n, 'The unions remember the last table: a strike.', 'bad'); } },
    corporatist: (G, n) => { let s = 0; for (const k in SEATS.corporatist) s += gr(n, k); keep(n, 'Captured chambers', 'prod', -0.012 * s); n.corr = clamp(n.corr + s * 0.02, 0, 100); },
    junta: (G, n) => { keep(n, 'The army’s grudge', 'atk', -0.03 * gr(n, 'army')); keep(n, 'The navy’s grudge', 'def', -0.03 * gr(n, 'navy')); keep(n, 'The air force’s grudge', 'speed', -0.03 * gr(n, 'air')); },
  };
  const tableCtx = (G, n, sys) => { const S = SEATS[sys]; const seats = Object.keys(S).filter((k) => !(n.sigx.gone || {})[k]); return { sys, seats, dem: seats.map((k) => G.rng.int(0, S[k][1].length - 1)) }; };
  const demTxt = (c, i) => { const s = SEATS[c.sys][c.seats[i]]; return s[0] + (/s$/.test(s[0]) ? ' want ' : ' wants ') + s[1][c.dem[i]][0]; };
  const GRUDGE_TXT = { unions: 'strikes', employers: 'lower business confidence', treasury: 'lower revenue', industry: 'a captured chamber', land: 'a captured chamber', commerce: 'a captured chamber', army: 'a weaker attack', navy: 'a weaker defence', air: 'slower fronts' };
  const TABLE_TWIST = { socdem: ' Whatever one side gets, the other notices.', corporatist: ' A refused chamber falls into one boss’s hands.', junta: ' A refused service fights worse in the next war.' };
  const grant = (G, n, c, i) => fx(G, n, SEATS[c.sys][c.seats[i]][1][c.dem[i]][1]);
  const settle = (G, n, c, refuse) => {
    for (let i = 0; i < c.seats.length; i++) {
      const k = c.seats[i];
      if (i === refuse) { grudge(n, k, 1); continue; }
      grant(G, n, c, i); grudge(n, k, -0.5);
      if (c.sys === 'socdem' && (k === 'unions' || k === 'employers')) grudge(n, k === 'unions' ? 'employers' : 'unions', 0.5); // the other side notices
    }
    cnt(n, 'tables');
  };
  ev({ id: 'table', sys: 1, tone: 'mixed', tray: 1, title: (n, G, c) => ({ socdem: 'The annual bargain', corporatist: 'The chambers sit', junta: 'The services want their share' })[c.sys],
    text: (n, G, c) => 'Around the table: ' + c.seats.map((_, i) => demTxt(c, i)).join('; ') + '. There is money and patience for ' + (c.seats.length > 2 ? 'two of them' : 'one of them') + '.' + TABLE_TWIST[c.sys],
    opts: (G, n, c) => c.seats.map((k, r) => ({ label: (nn, GG, cc) => 'Refuse ' + SEATS[cc.sys][k][0], tip: (nn, GG, cc) => 'Grant ' + cc.seats.map((s2, i) => (i === r ? '' : SEATS[cc.sys][s2][0] + ' ' + SEATS[cc.sys][s2][1][cc.dem[i]][0])).filter(Boolean).join(' and ') + '. ' + SEATS[cc.sys][k][0].replace(/^the /, 'The ') + ' will carry a grudge (now ' + gr(nn, k).toFixed(1) + ' of 5): ' + GRUDGE_TXT[k] + '.', fx: [['fn', (G2, n2, c2) => settle(G2, n2, c2, r)]], ai: (nn) => Math.max(0.1, 1 - gr(nn, k) * 0.3 + (k === 'treasury' ? 0.5 : 0)) }))
      .concat([{ label: 'Impose a settlement', tip: 'Nobody gets what they asked for, everyone a little grudge.', can: (nn) => nn.auth >= 20, fx: [['auth', -20], ['sig', -10], ['fn', (G2, n2, c2) => { for (const k of c2.seats) grudge(n2, k, 0.5); cnt(n2, 'tables'); }]], ai: 0.3 }]) });
  for (const sys of ['socdem', 'corporatist', 'junta']) hook(sys, {
    month: (G, n) => { GRUDGE[sys](G, n); if (yearly(G, n, 'tableAt') && !civil(G, n)) { const g = n.sigx.gr || {}; for (const k in g) g[k] = Math.max(0, g[k] - 0.5); ID.Events.queue(G, n, 'table', tableCtx(G, n, sys)); } },
    extra: (n) => Object.keys(SEATS[sys]).filter((k) => !(n.sigx.gone || {})[k]).map((k) => ['Grudge of ' + SEATS[sys][k][0], gr(n, k).toFixed(1), gr(n, k) < 1.5]),
  });
  hook('corporatist', { acts: [{ id: 'cp_abolish', name: 'Abolish the most troublesome chamber', desc: 'Once a reign, a chamber that has become one man’s fief can be merged into the others.', cost: { auth: 25 }, cd: 12, sig: -6,
    can: (n) => (reign(n).abolished ? 'Already done this reign.' : ''), fx: [['sup', 'capital', -8], ['fn', (G, n) => { const ks = Object.keys(SEATS.corporatist).filter((k) => !(n.sigx.gone || {})[k]); ks.sort((a, b) => gr(n, b) - gr(n, a)); const k = ks[0]; if (ks.length > 2) { (n.sigx.gone = n.sigx.gone || {})[k] = 1; if (n.sigx.gr) n.sigx.gr[k] = 0; } reign(n).abolished = 1; }]],
    ai: (n) => Object.keys(SEATS.corporatist).some((k) => gr(n, k) >= 3) }] });

  /* council communism: you lobby, the congress votes, you live with it */
  const MOTIONS = [
    { id: 'peace', t: 'peace with every enemy now', can: (n) => n.nwars > 0, fx: [['fn', (G, n) => { for (const e of Dp().enemies(G, n)) if (Dp().wantsPeace(G, e, n) || G.rng.chance(0.5)) Dp().peace(G, n, e); }]] },
    { id: 'disarm', t: 'half the militia home for the harvest', can: (n) => !n.nwars, fx: [['troops', -0.25], ['sup', 'peasants', 6]] },
    { id: 'wages', t: 'equal wages in every trade', fx: [['sup', 'workers', 6], ['sup', 'intelligentsia', -6], ['mod', 'sci', -0.05, 24, 'Equal wages']] },
    { id: 'aid', t: 'arms for the comrades abroad', fx: [['gold', -60], ['fn', (G, n) => { const t = G.rng.pick(ID.alive(G).filter((o) => ID.ideo(o).family !== 'socialist')); if (t) ID.docSeed(G, t, n.ideo, 15, 3, n.id); }]] },
    { id: 'build', t: 'a new works in every district', fx: [['gold', -80], ['mod', 'prod', 0.05, 36, 'District works']] },
    { id: 'open', t: 'open borders for every refugee', fx: [['pop', 0.02], ['sup', 'workers', -3], ['particip', 4]] },
  ];
  ev({ id: 'co_motions', sys: 1, tone: 'mixed', tray: 1, title: 'The congress votes', text: (n, G, c) => 'Three motions before the congress: ' + c.m.map((i) => MOTIONS[i].t).join('; ') + '. Each passes by its odds; your delegates can lobby for two of them.',
    opts: (G, n, c) => [[0, 1], [0, 2], [1, 2]].map(([a, b]) => ({ label: (nn, GG, cc) => 'Lobby for ' + MOTIONS[cc.m[a]].t + ' and ' + MOTIONS[cc.m[b]].t, fx: [['auth', -8], ['fn', (G2, n2, c2) => vote(G2, n2, c2, [a, b])]], ai: 1 }))
      .concat([{ label: 'Let the congress decide', fx: [['particip', 3], ['fn', (G2, n2, c2) => vote(G2, n2, c2, [])]], ai: 1 }]) });
  function vote(G, n, c, lobbied) {
    const out = [];
    c.m.forEach((i, k) => { const pass = G.rng.chance(0.45 + (lobbied.includes(k) ? 0.3 : 0) + (n.particip - 50) * 0.004); if (pass) fx(G, n, MOTIONS[i].fx); out.push(MOTIONS[i].t + (pass ? ' (passed)' : ' (rejected)')); cnt(n, pass ? 'motionPass' : 'motionFail'); });
    say(G, n, 'The congress has voted: ' + out.join('; ') + '.');
  }
  hook('council', { month: (G, n) => { if (yearly(G, n, 'coAt') && !civil(G, n)) { const L = MOTIONS.map((m, i) => i).filter((i) => !MOTIONS[i].can || MOTIONS[i].can(n)); const m = []; while (m.length < 3 && L.length) m.push(L.splice(G.rng.int(0, L.length - 1), 1)[0]); ID.Events.queue(G, n, 'co_motions', { m }); } } });

  /* third positionism: one sealed offer from each bloc a year */
  ev({ id: 'tp_offers', sys: 1, tone: 'mixed', tray: 1, title: 'Two envelopes', text: 'The western ambassador offers a loan for the dam; the eastern ambassador offers rifles and engineers. Each has asked, separately and politely, whether the other has called.',
    opts: [
      { label: 'Take the western loan', fx: [['gold', 90], ['sig', -6]], ai: 1 },
      { label: 'Take the eastern arms', fx: [['equip', 0.04], ['gold', 30], ['sig', -6]], ai: 1 },
      { label: 'Take both, quietly', tip: 'Twice the money. If either finds out (about one year in three), both cut you off and say so in public.', fx: [['fn', (G, n) => { if (G.rng.chance(0.35)) { cnt(n, 'tpCaught'); fx(G, n, [['sig', -15], ['opAll', -6], ['mod', 'trade', -0.1, 24, 'Both blocs cut aid']]); say(G, n, 'Both blocs have found out about the other envelope.', 'bad'); } else fx(G, n, [['gold', 120], ['equip', 0.04]]); }]], ai: (n) => (n.gold < 80 ? 1.5 : 0.6) },
      { label: 'Refuse both', fx: [['sig', 10], ['legitmod', 3, 12, 'Independence']], ai: (n) => (n.sig < 45 ? 2 : 0.6) },
    ] });
  hook('thirdpos', { month: (G, n) => { if (yearly(G, n, 'tpAt')) ID.Events.queue(G, n, 'tp_offers', {}); } });

  /* personalist dictatorship: put a member of the circle to the test (seats are people, not groups) */
  hook('personalist', { acts: [{ id: 'pe_test', name: 'A loyalty test', desc: 'One of the circle is given an order nobody loyal would refuse. Then you watch.', cost: { auth: 8 }, cd: 18, sig: 4,
    can: (n) => (n.circle && n.circle.length ? '' : 'There is nobody to test.'), fx: [['fn', (G, n) => { const g = n.circle.slice().sort((a, b) => a.loy - b.loy)[0]; ID.Events.queue(G, n, 'pe_test', { seat: g.seat, name: g.name, loy: Math.round(g.loy) }); }]],
    ai: (n, v) => v < 50 && n.circle && n.circle.some((g) => g.loy < 35) }] });
  ev({ id: 'pe_test', sys: 1, tone: 'mixed', tray: 1, title: (n, G, c) => c.name + ' is tested', text: (n, G, c) => c.name + ' was told to arrest an old friend. ' + (c.loy < 40 ? 'The arrest was made, late, and the friend had already left the country.' : 'The arrest was made within the hour.'),
    opts: [
      { label: 'Show mercy', tip: 'Loyalty rises if the loyalty was real; if not, a plotter has been warned.', fx: [['fn', (G, n, c) => { const g = ID.Regime && ID.Regime.fig(n, c.seat); if (!g) return; if (c.loy >= 40) g.loy = clamp(g.loy + 15, 0, 100); else g.plot = (g.plot || 0) + 2; }]], ai: (n, G, c) => (c.loy >= 40 ? 2 : 0.3) },
      { label: 'Purge', fx: [['fn', (G, n, c) => { fx(G, n, [['figPurge', c.seat]]); }], ['grievance', 4], ['charisma', 2]], ai: (n, G, c) => (c.loy < 40 ? 2 : 0.4) },
      { label: 'Promote, and watch', fx: [['gold', -50], ['fn', (G, n, c) => { const g = ID.Regime && ID.Regime.fig(n, c.seat); if (g) g.loy = clamp(g.loy + 8, 0, 100); }]], ai: 0.6 },
    ] });

  /* ================================================================ G. stockpiles */
  /* anarcho-syndicalism: the strike fund, spent all at once */
  const FUND_MAX = 400, STRIKE_MO = 60;
  hook('ansyn', {
    acts: [
      { id: 'an_dues', name: 'Dues for the strike fund', desc: 'A day’s wage a month from every member, into the fund and nowhere else.', cost: { gold: 60 }, cd: 6, sig: 3, can: (n) => ((n.sigx.fund || 0) >= FUND_MAX ? 'The fund is full.' : ''), fx: [['fn', (G, n) => { n.sigx.fund = Math.min(FUND_MAX, (n.sigx.fund || 0) + 60); }]], ai: (n) => n.gold > 70 && (n.sigx.fund || 0) < 300 },
      { id: 'an_gstrike', name: 'Call the general strike', desc: 'Every works in the country stops until the owners give way. It lasts as long as the fund does; called on an empty fund, it collapses.', cost: { auth: 10 }, cd: 36, sig: 0,
        fx: [['fn', (G, n) => { const f = n.sigx.fund || 0; n.sigx.fund = 0; cnt(n, 'gstrikes');
          if (f < STRIKE_MO) { feed(n, -25); fx(G, n, [['sup', 'workers', -10]]); say(G, n, 'The general strike collapses in its first week: the fund was empty.', 'bad'); return; }
          const m = Math.round(f / STRIKE_MO); feed(n, 6 + m * 3); fx(G, n, [['strike', m], ['sup', 'capital', -15], ['sup', 'workers', 10], ['gold', Math.round(f * 0.4)], ['mod', 'ls', 2, 24, 'The general strike won']]);
          say(G, n, 'The general strike holds for ' + m + ' months. The owners give way.', 'good'); }]],
        ai: (n) => (n.sigx.fund || 0) >= 150 },
    ],
    month: (G, n) => { if (n.sigx.fund) n.sigx.fund *= 0.99; },
    extra: (n) => [['Strike fund', Math.round(n.sigx.fund || 0) + ' / ' + FUND_MAX + ' (a strike lasts a month for every ' + STRIKE_MO + ')', (n.sigx.fund || 0) >= STRIKE_MO]],
  });
  if (D.ansyn && D.ansyn.order) { // the strike across the border also lasts as long as the fund
    const r0 = D.ansyn.order.run;
    D.ansyn.order.run = (G, n, t) => { const f = n.sigx.fund || 0, add = Math.floor(f / STRIKE_MO); n.sigx.fund = 0; const r = r0(G, n, t); if (add && t) fx(G, t, [['strike', 2 + add]]); return r + (add ? ' The fund keeps it going ' + add + ' months longer.' : ''); };
  }
  /* agrarian traditionalism: the village granary, the villages' to give */
  hook('agrarian', {
    month: (G, n) => {
      const E = ID.Economy;
      if (G.tick % YEAR === 8 * MO && !civil(G, n)) ID.Events.queue(G, n, 'ag_harvest', {});
      if (E.harvest(n) < 1 && E.grainMonths(n) < 6 && (n.sigx.askAt == null || G.tick - n.sigx.askAt > 2 * YEAR)) { n.sigx.askAt = G.tick; ID.Events.queue(G, n, 'ag_consent', {}); }
    },
  });
  ev({ id: 'ag_harvest', sys: 1, tone: 'mixed', tray: 1, title: 'The harvest is in', text: 'The village councils meet in the threshing yards to decide what becomes of the year’s grain.',
    opts: [
      { label: 'Fill the village stores', fx: [['fn', (G, n) => { n.grain = Math.min(ID.Economy.GRAIN_MAX, (n.grain || 0) + 1.5); }], ['note', 'Granaries +1.5 months'], ['sig', 2]], ai: (n) => (ID.Economy.harvest(n) < 1.05 ? 2 : 0.7) },
      { label: 'Sell to the cities', fx: [['gold', 90], ['sup', 'workers', 4], ['fn', (G, n) => { n.grain = Math.max(0, (n.grain || 0) - 1); }], ['note', 'Granaries −1 month', false]], ai: (n) => (n.gold < 100 ? 1.5 : 0.7) },
      { label: 'Hold the harvest festival', fx: [['sup', 'peasants', 6], ['stab', 3], ['sig', 8], ['fn', (G, n) => { n.grain = Math.max(0, (n.grain || 0) - 1.5); }], ['note', 'Granaries −1.5 months', false]], ai: (n) => ((n.grain || 0) > 4 ? 1.5 : 0.3) },
    ] });
  ev({ id: 'ag_consent', sys: 1, sfx: 'alarm', title: 'The cities are hungry', text: 'The harvest fell short and the town bakeries are empty. The grain is in the village stores, and the villages have not been asked.',
    opts: [
      { label: 'Ask the villages to open their stores', fx: [['sup', 'peasants', -6], ['sig', -8], ['sup', 'workers', 4]], ai: 2 },
      { label: 'Respect the villages', tip: 'The village grain stays in the villages; the towns go short.', fx: [['sup', 'peasants', 4], ['sup', 'workers', -8], ['unrest', 6], ['mod', 'food', -0.06, 12, 'The village stores stay shut']], ai: 1 },
    ] });

  /* ================================================================ I. the unruly instrument */
  const INST = {
    mao: { name: 'Red Guards', grow: (G, n) => (ID.hasMod(n, 'The great campaign') ? 3 : -1) + (n.bureau > 40 ? 0.6 : 0) },
    natsyn: { name: 'The squads', grow: (G, n) => 1.2 + (n.fs.capital > 55 ? 0.6 : 0) },
    revival: { name: 'The revolutionary guard', grow: () => 1.1 },
    natsoc: { name: 'The street army', grow: (G, n) => (n.flags.knives ? -100 : 1.5) },
  };
  const loose = (key, id, name, desc, f, ai) => ({ id, name, desc, cost: { auth: 10 }, cd: 24, sig: 6, can: (n) => ((n.sigx.inst || 0) < 25 ? INST[key].name + ' are too few to use (25).' : ''), fx: [...f, ['fn', (G, n) => { n.sigx.inst = clamp((n.sigx.inst || 0) + 10, 0, 100); cnt(n, 'instUsed'); }], ['note', INST[key].name + ' +10', false]], ai });
  const rein = (key, id, name, desc, cost, f, ai) => ({ id, name, desc, cost, cd: 24, sig: -4, can: (n) => ((n.sigx.inst || 0) < 20 ? 'Nothing to rein in.' : ''), fx: [...f, ['fn', (G, n) => { n.sigx.inst = clamp((n.sigx.inst || 0) - 40, 0, 100); cnt(n, 'instReined'); }], ['note', INST[key].name + ' −40']], ai: ai || ((n) => (n.sigx.inst || 0) > 78) });
  const instActs = {
    mao: [loose('mao', 'mao_bombard', 'Bombard the headquarters', 'The Red Guards are turned on the party’s own apparatus.', [['bureau', -15], ['discipline', 8], ['sup', 'bureaucracy', -10], ['sup', 'intelligentsia', -8], ['mod', 'sci', -0.1, 12, 'Cultural revolution']], (n) => n.bureau > 45 && (n.sigx.inst || 0) < 70),
      rein('mao', 'mao_sendown', 'Send them down to the countryside', 'Twenty million young people to the villages, to learn from the peasants.', { auth: 10 }, [['mod', 'prod', -0.06, 24, 'Sent down'], ['sup', 'peasants', -4]])],
    natsyn: [loose('natsyn', 'nsy_loose', 'Set the squads on the strikers', 'The strike committee is beaten up and the print shop burned.', [['fn', (G, n) => { n.strike = 0; }], ['sup', 'workers', -8], ['opp', -6], ['grievance', 6]], (n) => n.strike > 0),
      rein('natsyn', 'nsy_rein', 'Fold the squads into the police', 'Uniforms, pensions and a chain of command that ends in the ministry.', { auth: 15 }, [['sup', 'military', 4]]),
      { id: 'nsy_pay', name: 'Pay the squads', desc: 'The movement’s own money, so that the squads do not take the owners’.', cost: { gold: 60 }, cd: 12, sig: 4, fx: [['fn', (G, n) => { n.sigx.pay = (n.sigx.pay || 0) + 25; }]], ai: (n) => (n.sigx.capPay || 0) > (n.sigx.pay || 0) + 10 }],
    revival: [loose('revival', 'rv_loose', 'Loose the guard on the liberals', 'The newspapers that mocked the revolution close in one night.', [['opp', -8], ['sup', 'intelligentsia', -8], ['grievance', 5]], (n) => n.opp > 30),
      rein('revival', 'rv_rein', 'Audit the guard’s foundations', 'Its factories and import licences, brought back under the ministry.', { auth: 15, gold: 100 }, [['mod', 'rev', 0.04, 36, 'The guard’s businesses audited']])],
    natsoc: [loose('natsoc', 'ns_sa_loose', 'The street army in the streets', 'The opposition’s meetings are broken up and its offices smashed.', [['opp', -8], ['grievance', 8], ['sig', 4]], (n) => n.opp > 25 && !n.flags.knives)],
  };
  for (const key in INST) hook(key, {
    acts: instActs[key],
    month: (G, n) => {
      const x = n.sigx; if (x.inst == null) x.inst = 20;
      if (key === 'natsoc' && n.flags.knives) { x.inst = 0; return; }
      x.inst = clamp(x.inst + INST[key].grow(G, n), 0, 100);
      if (key === 'revival') keep(n, 'The guard’s foundations', 'rev', -x.inst / 1000);
      if (key === 'natsyn') { x.capPay = clamp((x.capPay || 0) + (n.fs.capital - 45) * 0.08, 0, 100); x.pay = Math.max(0, (x.pay || 0) - 1.5);
        if (x.inst > 50 && x.capPay > x.pay + 25 && (x.capAt == null || G.tick - x.capAt > 3 * YEAR) && !civil(G, n)) { x.capAt = G.tick; ID.Events.queue(G, n, 'nsy_capital', {}); } }
      if (x.inst > 80) keep(n, INST[key].name + ' out of hand', 'unrest', (x.inst - 80) * 0.2); else keep(n, INST[key].name + ' out of hand', 'unrest', 0);
      if (x.inst > 85 && !civil(G, n) && !ID.Events.pending(G, 'inst_turn') && (x.turnAt == null || G.tick - x.turnAt > YEAR) && G.rng.chance(0.08)) { x.turnAt = G.tick; cnt(n, 'instTurned'); ID.Events.queue(G, n, 'inst_turn', { key }); }
    },
    extra: (n) => (key === 'natsoc' && n.flags.knives ? [['The street army', 'purged; there will not be another', true]] : [[INST[key].name, Math.round(n.sigx.inst || 0) + (n.sigx.inst > 80 ? ': acting on its own' : ' (past 80 it acts on its own)'), (n.sigx.inst || 0) <= 70]]
      .concat(key === 'natsyn' ? [['Who pays the squads', 'the movement ' + Math.round(n.sigx.pay || 0) + ', the owners ' + Math.round(n.sigx.capPay || 0), (n.sigx.pay || 0) >= (n.sigx.capPay || 0) - 25]] : [])),
  });
  if (D.natsoc) { const k = D.natsoc.acts.find((a) => a.id === 'ns_knives'); if (k) k.fx = k.fx.concat([['flag', 'knives']]); }
  ev({ id: 'inst_turn', sys: 1, sfx: 'alarm', title: (n, G, c) => INST[c.key].name + ' turn on the regime', text: (n, G, c) => INST[c.key].name + ' have stopped waiting for orders. They have their own lists now, and some of the names on them sit in the government.',
    opts: [
      { label: 'Give them the heads they want', tip: 'The leader is replaced by someone they trust.', fx: [['fn', (G, n) => { P().newLeader(G, n, 'ousted'); n.sigx.inst -= 40; }], ['stab', -8]], ai: 1 },
      { label: 'Send in the army', fx: [['fn', (G, n) => { n.sigx.inst = 5; }], ['stab', -15], ['sup', 'military', 8], ['sig', -10], ['grievance', 10]], ai: 2 },
      { label: 'Ride the tiger', tip: 'Let them run. The state shakes, the gauge soars, and they stay out of hand.', fx: [['sig', 12], ['stab', -10], ['unrest', 10]], ai: 0.5 },
    ] });
  ev({ id: 'nsy_capital', sys: 1, title: 'The owners pay the squads more than we do', text: 'The squads have been breaking strikes at the owners’ request, and at the owners’ rates. The movement’s own commanders now dine with the industrialists.',
    opts: [
      { label: 'Outbid the owners', fx: [['gold', -150], ['fn', (G, n) => { n.sigx.pay = (n.sigx.pay || 0) + 50; }]], can: (n) => n.gold >= 150, ai: 1 },
      { label: 'Let them have the squads', tip: 'The national revolution becomes a business arrangement: the state turns corporatist.', fx: [['ideology', 'corporatist', 'drift']], ai: 1 },
    ] });

  /* ================================================================ H. the heir */
  const EDU = { soldier: ['a soldier', [['atk', 0.06]]], scholar: ['a scholar', [['sci', 0.08]]], priest: ['a priest', [['legit', 4]]], engineer: ['an engineer', [['prod', 0.04]]] };
  const heirOf = (n) => (n.sigx.heir = n.sigx.heir || { edu: null, prog: 0 });
  const onSuccession = (G, n, key) => {
    const x = n.sigx, h = heirOf(n), s = n.cnt.successions || 0; // a death on the throne, not a retirement at an election
    if (x.succ0 == null) { x.succ0 = s; return; }
    if (x.succ0 === s) return;
    x.succ0 = s; cnt(n, 'heirReigns');
    if (h.edu && h.prog >= 100) { for (const [k, v] of EDU[h.edu][1]) ID.addMod(n, k, v, 20 * 12, 'Raised as ' + EDU[h.edu][0]); say(G, n, 'The new ruler was raised as ' + EDU[h.edu][0] + ', and it shows.', 'good'); }
    else if (key === 'juche' && h.prog < 100) { cnt(n, 'heirCrisis'); fx(G, n, [['stab', -20], ['mod', 'legit', -10, 24, 'An heir not ready']]); say(G, n, 'The Leader is dead and the heir was not ready. The party watches the son, and the son watches the party.', 'bad'); }
    n.sigx.heir = { edu: null, prog: 0 };
  };
  const eduAct = (key) => ({ id: 'hr_edu_' + key, name: 'Choose the heir’s education', desc: 'Soldier, scholar, priest or engineer: it shapes the next reign, and closes the other roads.', cost: { gold: 30 }, cd: 12, sig: 2,
    can: (n) => (heirOf(n).edu ? 'The heir is already being raised as ' + EDU[heirOf(n).edu][0] + '.' : ''), fx: [['fn', (G, n) => ID.Events.queue(G, n, 'heir_edu', {})]], ai: () => true });
  ev({ id: 'heir_edu', sys: 1, tone: 'mixed', tray: 1, title: 'The heir’s education', text: 'The tutors are waiting to be told what kind of ruler to make.',
    opts: Object.keys(EDU).map((k) => ({ label: 'Raise the heir as ' + EDU[k][0], tip: 'For twenty years of the next reign: ' + EDU[k][1].map(([m, v]) => ({ atk: 'attack', sci: 'research', legit: 'legitimacy', prod: 'industry' })[m] + ' +' + (m === 'legit' ? v : Math.round(v * 100) + '%')).join(', ') + '.', fx: [['fn', (G, n) => { heirOf(n).edu = k; }]], ai: (n) => ({ soldier: n.nwars ? 2 : 1, scholar: 1, priest: n.legit < 50 ? 1.5 : 0.7, engineer: 1 })[k] })) });
  const heirMonth = (key) => (G, n) => {
    onSuccession(G, n, key);
    const h = heirOf(n);
    if (key !== 'juche' && h.edu && h.prog < 100) { h.prog = Math.min(100, h.prog + 1.4); if (h.prog >= 100) { n.flags.heir = 1; say(G, n, 'The heir’s education is complete.', 'good'); } }
    if (key === 'conmon' && h.prog >= 100 && n.drift.liberal != null) n.drift.liberal = Math.max(0, n.drift.liberal - 0.15); // a popular heir shields the crown
    if (key === 'personalist' && n.sigx.succ) n.charisma = clamp(n.charisma - 0.3, 0, 100); // the successor's popularity drains the ruler's
    if (key === 'absmon' && n.sigx.spouse != null && G.tick % YEAR === 0 && G.rng.chance(0.04)) {
      const s = G.nations[n.sigx.spouse];
      if (s && s.alive) { const pr = []; for (let p = 1; p < G.provinces.length; p++) if (G.provinces[p].owner === s.id) pr.push(p); const add = pr.slice(0, 2).filter((p) => !n.claims.includes(p)); n.claims.push(...add); cnt(n, 'inheritClaims'); say(G, n, 'The king of ' + s.base + ' dies without an heir. Through the marriage, the crown inherits a claim to ' + add.length + ' of his provinces.', 'good'); }
    }
  };
  const heirExtra = (key) => (n) => { const h = heirOf(n); return [['The heir', key === 'juche' ? 'titles ' + Math.round(h.prog) + ' / 100 (an heir under 100 when the Leader dies means a crisis)' : h.edu ? 'raised as ' + EDU[h.edu][0] + ', ' + Math.round(h.prog) + '% educated' : 'no education chosen', h.prog >= 100 ? true : h.edu || key === 'juche' ? null : false]] // red only when something is wrong
    .concat(key === 'absmon' ? [['Married into', n.sigx.spouse != null && n.sigx.spouse >= 0 && n.sigx.spouseName ? n.sigx.spouseName : 'no foreign house', n.sigx.spouse != null]] : [])
    .concat(key === 'personalist' ? [['Named successor', n.sigx.succ ? 'yes: his popularity drains yours' : 'none', !n.sigx.succ]] : []); };
  hook('absmon', { month: heirMonth('absmon'), extra: heirExtra('absmon'), acts: [eduAct('absmon'),
    { id: 'am_marry', name: 'A dynastic marriage', desc: 'The heir marries into a foreign royal house: an ally, and perhaps one day an inheritance.', cost: { gold: 80 }, cd: 60, sig: 6,
      can: (n, G) => (n.sigx.spouse != null ? 'The heir is already married.' : ''), fx: [['fn', (G, n) => { const c = ID.alive(G).filter((o) => o !== n && ['absmon', 'conmon'].includes(o.ideo) && !ID.atWar(G, n.id, o.id)); if (!c.length) { say(G, n, 'No royal house will have us.'); return; } c.sort((a, b) => ID.op(G, n.id, b.id) - ID.op(G, n.id, a.id)); const s = c[0]; n.sigx.spouse = s.id; n.sigx.spouseName = s.base; ID.addOpBoth(G, n.id, s.id, 20); cnt(n, 'marriages'); say(G, n, 'The heir marries into the royal house of ' + s.base + '.', 'good'); }]],
      ai: (n) => n.gold > 200 }] });
  hook('conmon', { month: heirMonth('conmon'), extra: heirExtra('conmon'), acts: [eduAct('conmon')] });
  hook('juche', { month: heirMonth('juche'), extra: heirExtra('juche'), acts: [{ id: 'jc_title', name: 'A new title for the heir', desc: 'Another title, another portrait, another mountain where he was born.', cost: { auth: 10 }, cd: 12, sig: 3, can: (n) => (heirOf(n).prog >= 100 ? 'The heir is ready.' : ''), fx: [['fn', (G, n) => { const h = heirOf(n); h.prog = Math.min(100, h.prog + 20); if (h.prog >= 100) n.flags.heir = 1; }]], ai: () => true }] });
  hook('personalist', { month: heirMonth('personalist'), extra: heirExtra('personalist'), acts: [
    { id: 'pe_succ', name: 'Name a successor', desc: 'The most capable figure of the circle is named heir. The succession is safe; your own star dims as his rises.', cost: { auth: 15 }, cd: 24, sig: 0, can: (n) => (n.sigx.succ ? 'A successor is named.' : !n.circle || !n.circle.length ? 'There is nobody to name.' : ''), fx: [['fn', (G, n) => { const g = n.circle.slice().sort((a, b) => b.comp - a.comp)[0]; fx(G, n, [['figHeir', g.seat]]); n.sigx.succ = g.seat; }]], ai: (n) => (n.leader.age || 50) > 62 },
    { id: 'pe_unsucc', name: 'Disgrace the successor', desc: 'The heir’s portraits come down. The ruler shines again; the succession is open again.', cost: { auth: 10 }, cd: 24, sig: 6, can: (n) => (n.sigx.succ ? '' : 'Nobody is named.'), fx: [['fn', (G, n) => { fx(G, n, [['figPurge', n.sigx.succ]]); n.sigx.succ = null; n.flags.heir = 0; }], ['charisma', 6], ['grievance', 5]], ai: (n) => n.charisma < 35 }] });

  /* ================================================================ E. occupied land: anarcho-communism */
  const occupier = (G, n) => { const s = {}; for (let p = 1; p < G.provinces.length; p++) { const Pr = G.provinces[p]; if (Pr.core === n.id && Pr.owner && Pr.owner !== n.id && ID.atWar(G, n.id, Pr.owner)) s[Pr.owner] = (s[Pr.owner] || 0) + 1; } let best = null, bv = 0; for (const k in s) if (s[k] > bv) { bv = s[k]; best = G.nations[+k]; } return best; };
  const occ = (id, name, desc, gold, f, ai) => ({ id, name, desc: desc + ' Only where the enemy holds our communes; every order needs supplies sent from free land.', cost: { gold }, cd: 6, sig: 4,
    can: (n, G) => (occupier(G, n) ? '' : 'No commune is under occupation.'), fx: [['fn', (G, n) => { const t = occupier(G, n); if (!t) return; n.sigx.sent = (n.sigx.sent || 0) + gold; cnt(n, 'occOrders'); f(G, n, t); }]], ai });
  hook('ancom', {
    acts: [
      occ('ac_ambush', 'Ambush the garrisons', 'The occupied communes strike at night.', 30, (G, n, t) => { t.troops *= 0.98; t.we = clamp(t.we + 4, 0, 100); say(G, n, 'Ambushes across the occupied communes: ' + t.base + ' loses men every night.', 'good'); }, () => true),
      occ('ac_rail', 'Cut the railways', 'Every line through the occupied land, cut in a hundred places.', 40, (G, n, t) => { ID.addMod(t, 'atk', -0.1, 6, 'Railways cut by partisans'); }, (n) => n.nwars > 0),
      occ('ac_rise', 'The communes rise', 'The occupied communes rise all at once.', 60, (G, n, t) => { ID.addMod(n, 'def', 0.15, 12, 'The communes rise'); for (let p = 1; p < G.provinces.length; p++) { const Pr = G.provinces[p]; if (Pr.core === n.id && Pr.owner === t.id) Pr.unrest = clamp(Pr.unrest + 25, 0, 100); } }, (n) => (n.a.coreLost || 0) > 0.15),
    ],
    month: (G, n) => { const x = n.sigx; x.sent = Math.max(0, (x.sent || 0) - 10); if (occupier(G, n) && x.sent < 20) feed(n, -0.8); }, // unsupplied communes are crushed one by one
    extra: (n, G) => { const t = occupier(G, n); return t ? [['Occupied communes', 'held by ' + t.base + '; supplies sent recently ' + Math.round(n.sigx.sent || 0) + (n.sigx.sent < 20 ? ': the communes are being crushed' : ''), n.sigx.sent >= 20]] : []; },
  });

  /* ================================================================ F. province orders */
  /* minarchy: sell charters; the company builds what pays */
  hook('minarchy', {
    acts: [{ id: 'mi_charter', name: 'Sell a charter', desc: 'A company buys the right to build and run a works for thirty years. It chooses what; the treasury gets the price now and the works in six months.', cost: {}, cd: 24, sig: 6,
      fx: [['gold', 120], ['sup', 'capital', 4], ['fn', (G, n) => { (n.sigx.ch = n.sigx.ch || []).push({ at: G.tick + 6 * MO, port: G.rng.chance(0.3) }); n.sigx.charters = (n.sigx.charters || 0) + 1; cnt(n, 'charters'); }]], ai: () => true }],
    month: (G, n) => {
      const x = n.sigx;
      for (const c of (x.ch || []).filter((c) => G.tick >= c.at)) { fx(G, n, [['build', c.port ? ID.B.PORT : ID.B.FACTORY, 1]]); say(G, n, 'A chartered company opens its ' + (c.port ? 'harbour' : 'works') + '.', 'good'); }
      x.ch = (x.ch || []).filter((c) => G.tick < c.at);
      if ((x.charters || 0) >= 4 && yearly(G, n, 'coAt2') && G.rng.chance(0.25) && !civil(G, n)) ID.Events.queue(G, n, 'mi_company', {});
    },
    extra: (n) => [['Charters sold', (n.sigx.charters || 0) + ((n.sigx.charters || 0) >= 4 ? ': the companies have become powers of their own' : ''), (n.sigx.charters || 0) < 4], ['Public building', 'forts and harbours only: works come from charters', null]],
  });
  ev({ id: 'mi_company', sys: 1, title: 'A state within the state', text: 'The largest chartered company has its own police, its own courts and its own flag over its harbour. Its directors write to say they would prefer to be left alone.',
    opts: [
      { label: 'Buy them out', fx: [['gold', -300], ['fn', (G, n) => { n.sigx.charters = 1; }], ['sig', -6]], can: (n) => n.gold >= 300, ai: 1 },
      { label: 'Leave them alone', fx: [['mod', 'rev', -0.06, PERM, 'The companies keep their revenue'], ['sup', 'capital', 6], ['sig', 6]], ai: 1 },
      { label: 'Send the night-watchman', tip: 'The state does the one thing it exists for.', fx: [['stab', -10], ['sup', 'capital', -12], ['fn', (G, n) => { n.sigx.charters = 0; }]], ai: 0.5 },
    ] });
  /* merchant republic: routes to foreign ports; a war between the two ends cuts them */
  hook('merchant', {
    acts: [{ id: 'me_route', name: 'Open a trade route', desc: 'A convoy line to a foreign port: trade income +6% while the route runs. A war with that state cuts it, and every cut shakes credit.', cost: { gold: 80 }, cd: 12, sig: 4,
      can: (n) => ((n.sigx.routes || []).length >= 5 ? 'Five routes is all the fleet can carry.' : ''), fx: [['fn', (G, n) => { const L = n.sigx.routes = n.sigx.routes || []; const c = ID.alive(G).filter((o) => o !== n && !ID.atWar(G, n.id, o.id) && !L.includes(o.id)); if (!c.length) return; c.sort((a, b) => ID.op(G, n.id, b.id) - ID.op(G, n.id, a.id)); L.push(c[0].id); cnt(n, 'routes'); say(G, n, 'A trade route opens to ' + c[0].base + '.', 'good'); }]], ai: (n) => n.gold > 200 }],
    month: (G, n) => {
      const L = n.sigx.routes = (n.sigx.routes || []).filter((id) => { const o = G.nations[id]; if (!o || !o.alive) return false; if (ID.atWar(G, n.id, id)) { feed(n, -12); cnt(n, 'routesCut'); say(G, n, 'War cuts the route to ' + o.base + '. Credit trembles on the exchange.', 'bad'); return false; } return true; });
      keep(n, 'Trade routes', 'trade', 0.06 * L.length);
    },
    extra: (n, G) => [['Trade routes (gold lines on the map)', (n.sigx.routes || []).length ? (n.sigx.routes || []).map((id) => G.nations[id].base).join(', ') : 'none', (n.sigx.routes || []).length > 0 ? true : null]],
  });
  /* juche: on-the-spot guidance, large and short, and the rest of the country stalls */
  hook('juche', { acts: [{ id: 'jc_guide', name: 'On-the-spot guidance', desc: 'The Leader tours one province for six months: its unrest vanishes and industry rises, while the rest of the country waits for him.', cost: { auth: 8 }, cd: 12, sig: 4,
    fx: [['fn', (G, n) => { let best = null; for (let p = 1; p < G.provinces.length; p++) { const Pr = G.provinces[p]; if (Pr.owner === n.id && (!best || Pr.unrest > best.unrest)) best = Pr; } if (best) { best.unrest = Math.max(0, best.unrest - 30); n.sigx.guided = best.name || 'a province'; } cnt(n, 'guidance'); }], ['mod', 'prod', 0.08, 6, 'On-the-spot guidance'], ['mod', 'eff', -0.03, 6, 'The Leader is away']], ai: () => true }],
    extra: (n) => (n.sigx.guided ? [['Last guidance', n.sigx.guided, true]] : []) });
  /* theocracy: holy sites fixed on the map; hold them or take them */
  /* three holy sites, chosen from the map seed (not the game's random numbers), so the map can show them from the start */
  const holy = (ID.holySites = (G) => {
    if (G.holy) return G.holy;
    const L = []; for (let p = 1; p < G.provinces.length; p++) if (G.provinces[p].tiles > 0) L.push(p); // the map alone decides, not who owns what when first asked
    G.holy = []; let h = (G.seed >>> 0) || 1;
    while (G.holy.length < 3 && L.length) { h = Math.imul(h ^ (h >>> 15), 2654435761) >>> 0; G.holy.push(L.splice(h % L.length, 1)[0]); }
    return G.holy;
  });
  hook('theocracy', {
    month: (G, n) => {
      const H = holy(G), held = H.filter((p) => G.provinces[p].owner === n.id).length, x = n.sigx;
      if (x.held != null && held < x.held) { feed(n, -15); say(G, n, 'A holy site is lost to the unbeliever.', 'bad'); }
      if (x.held != null && held > x.held) { feed(n, 15); cnt(n, 'holyTaken'); say(G, n, 'A holy site is ours again.', 'good'); }
      x.held = held; keep(n, 'Holy sites held', 'legit', held * 2);
      for (const p of H) if (G.provinces[p].owner !== n.id && !n.claims.includes(p)) n.claims.push(p);
    },
    extra: (n, G) => [['Holy sites (gold diamonds on the map)', holy(G).map((p) => { const o = G.nations[G.provinces[p].owner]; return o === n ? 'ours' : 'held by ' + (o && o.alive ? o.base : 'nobody'); }).join(', '), holy(G).some((p) => G.provinces[p].owner === n.id)]],
  });

  /* ================================================================ D. the chain */
  /* who changed system this month (computed once per month for everyone) */
  const changes = (G) => {
    if (G._chg && G._chg.t === G.tick) return G._chg.list;
    const prev = G._ideo || {}, list = [], now = {};
    for (const o of ID.alive(G)) { now[o.id] = o.ideo; if (prev[o.id] && prev[o.id] !== o.ideo) list.push({ id: o.id, from: prev[o.id], to: o.ideo }); }
    G._ideo = now; G._chg = { t: G.tick, list }; return list;
  };
  const CHAIN = {
    trot: { counts: (c) => ID.IDEOLOGIES[c.to].family === 'socialist' && ID.IDEOLOGIES[c.from].family !== 'socialist', name: 'socialist revolutions' },
    pannat: { counts: (c) => c.to === 'pannat', name: 'states won to the nation' },
    technosoc: { counts: () => false, name: 'revolutions carried by the signal' },
    revival: { counts: (c) => (c.to === 'revival' || c.to === 'theocracy') && c.from !== 'revival' && c.from !== 'theocracy', name: 'conversions' },
  };
  for (const key in CHAIN) hook(key, {
    month: (G, n) => {
      const x = n.sigx, L = changes(G).filter((c) => c.id !== n.id && CHAIN[key].counts(c));
      let links = Math.min(2, L.length); // at most two a month, in case nobody watched for a while
      if (key === 'technosoc' && n.a.spreadAt != null && n.a.spreadAt !== x.spread0) { if (x.spread0 != null) links++; x.spread0 = n.a.spreadAt; }
      if (x.chain == null) { x.chain = 0; x.link = G.tick; }
      if (links) {
        x.chain = Math.min(4, x.chain + links); x.link = G.tick; cnt(n, 'links', links); feed(n, 6 * links);
        n.threat = (n.threat || 0) + 3 * links; // every link raises the world's guard
        if (key === 'pannat') x.wing = (x.wing || 0) + 12 * links;
        if (key === 'revival') x.inst = clamp((x.inst || 0) + 10 * links, 0, 100);
        say(G, n, 'The chain grows: ' + x.chain + ' ' + CHAIN[key].name + ' in a row.', 'good');
      }
      if (x.chain && G.tick - x.link > 2 * YEAR) { x.chain = 0; x.breaks = (x.breaks || 0) + 1; cnt(n, 'chainBroken'); say(G, n, 'Two years without a link: the chain is broken.', 'bad'); if (key === 'trot' && x.breaks >= 2 && !civil(G, n)) { x.breaks = 0; ID.Events.queue(G, n, 'tr_chain_thermidor', {}); } }
      const same = Math.max(1, ID.alive(G).filter((o) => o.ideo === n.ideo).length), m = x.chain / same; // the multiplier is shared by the whole bloc
      keep(n, 'The chain', 'legit', Math.min(3, m));
      if (m && key !== 'technosoc' && G.tick % (3 * MO) === 0) { const L2 = ID.alive(G).filter((o) => o !== n && o.ideo !== n.ideo); for (let i = 0; i < Math.ceil(m) && L2.length; i++) ID.docSeed(G, L2.splice(G.rng.int(0, L2.length - 1), 1)[0], n.ideo, 6 * m, 2, n.id); } // techno-socialism's reach is the broadcast's, with its own guards (accel.js)
      if (key === 'pannat') { x.wing = Math.max(0, (x.wing || 0) - 0.5); if (x.wing >= 100 && !civil(G, n)) { x.wing = 60; cnt(n, 'schism'); ID.Events.queue(G, n, 'pn_schism', {}); } }
    },
    extra: (n, G) => [['The chain', (n.sigx.chain || 0) + ' ' + CHAIN[key].name + (n.sigx.chain ? ', last ' + date(n.sigx.link) + ' (breaks after two years)' : ''), (n.sigx.chain || 0) > 0 ? true : null]].concat(key === 'pannat' ? [['The other wing', Math.round(n.sigx.wing || 0) + ' (at 100 the party splits)', (n.sigx.wing || 0) < 70]] : []),
  });
  ev({ id: 'tr_chain_thermidor', sys: 1, title: 'The revolution stops spreading', text: 'Twice now the wave abroad has died away. In the commissariats, a quieter faction speaks of building socialism at home first.',
    opts: [
      { label: 'Socialism in one country', fx: [['ideology', 'ml', 'reform']], ai: 1 },
      { label: 'Expel them and carry on', fx: [['stab', -10], ['sig', 15], ['grievance', 8]], ai: 1 },
    ] });
  ev({ id: 'pn_schism', sys: 1, sfx: 'alarm', title: 'Two capitals, two wings', text: 'Every new state that joined the nation brought its own party branch, and the branches now answer to another capital. The other wing has called its own congress.',
    opts: [
      { label: 'Purge the other wing', fx: [['stab', -15], ['grievance', 10], ['fn', (G, n) => { n.sigx.wing = 0; }]], ai: 1 },
      { label: 'Share the leadership', fx: [['sig', -20], ['legitmod', 4, 24, 'A shared leadership']], ai: 1 },
    ] });
})();
