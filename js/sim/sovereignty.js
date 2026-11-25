/* IRON DIALECTIC — sovereignty: who owns what, and how to get it back. No DOM.
   Four generic mechanics, used by The Three Continents (where data/oldlands.js gives them names and dates)
   and by random worlds alike:
   - Dependency. n.dep = {over, kind, since, share, gar, res}: an overlord takes a share of revenue and oil,
     may veto wars and laws, garrisons troops, and can depose the government. res is the gauge from
     collaboration (0) to resistance (100). Ways out: a treaty (petition), a rising, the overlord's collapse,
     a liberation front, or a chapter of history.
   - Oil. Provinces carry P.oil (fields), P.oilFound and P.oilCo (the company's country) with P.oilShare (its
     cut). Income rises with the era. Concessions can be sold; nationalising one is a crisis the company's
     country answers with an embargo, a coup, an invasion or a settlement.
   - Intervention. Great powers court the unaligned, arm both sides of each other's quarrels, take bases and
     invade to "restore order".
   - Union. Two pan-national states may merge: the junior partner becomes a dependency of kind 'union' whose
     res is the union's tension; at 100, or when the junior's regime changes, the union breaks.
   Plus liberation fronts (G.fronts): peoples without a state, defined in data, that become states. */
(function () {
  'use strict';
  const ID = (globalThis.ID = globalThis.ID || {});
  const clamp = ID.clamp, MAXN = ID.MAXN;
  const Sv = (ID.Sov = {});
  const D = () => ID.Diplomacy;
  const alive = (G, id) => id && G.nations[id] && G.nations[id].alive ? G.nations[id] : null;
  const human = (G, n) => n.id === G.player && !G.autoPlayer;
  const fam = (n) => ID.ideo(n).family;

  /* ---------------------------------------------------------------- dependency */
  Sv.KIND = {
    vilayet: { name: 'Vilayet', share: 0.25, veto: { war: 1, law: 1 }, depose: 1, drift: 0.12,
      desc: 'A province of an empire with its own governor. The capital takes a quarter of the revenue, decides war and peace, and appoints and dismisses the government.' },
    protectorate: { name: 'Protectorate', share: 0.2, veto: { war: 1, law: 1 }, depose: 1, drift: 0.18,
      desc: 'A state with a flag and a ruler, and a foreign Resident who decides everything that matters: war, trade and who governs.' },
    mandate: { name: 'Mandate', share: 0.15, veto: { war: 1, law: 1 }, depose: 1, drift: 0.24,
      desc: 'Held in trust by a great power "until it can stand alone". The trustee decides when that is.' },
    treaty: { name: 'Treaty state', share: 0.05, veto: { war: 1 }, depose: 0, drift: 0.12, base: 1,
      desc: 'Independent in name: the former overlord keeps its bases, its advisers and a small share, and still forbids wars it dislikes.' },
    client: { name: 'Client', share: 0, veto: {}, depose: 0, drift: -0.08, base: 1, aid: 1,
      desc: 'A friend with a foreign base on its soil: protection and aid in return for loyalty. Nothing is taken, nothing is forbidden, everything is noticed.' },
    union: { name: 'Region of a union', share: 0.1, veto: { war: 1, law: 1 }, depose: 0, drift: 0.3,
      desc: 'Joined to a larger pan-national state in a union governed from its capital. The gauge is the union’s tension: at 100 it breaks.' },
  };
  Sv.kindOf = (n) => (n && n.dep ? Sv.KIND[n.dep.kind] : null);
  Sv.over = (G, n) => (n && n.dep ? alive(G, n.dep.over) : null);
  Sv.dependents = (G, n) => ID.alive(G).filter((o) => o.dep && o.dep.over === n.id);
  Sv.inUnion = (G, n) => !!((n.dep && n.dep.kind === 'union') || Sv.dependents(G, n).some((o) => o.dep.kind === 'union'));
  Sv.unionCount = (G, n) => Math.max(n.cnt.unions || 0, Sv.dependents(G, n).filter((o) => o.dep.kind === 'union').length);
  Sv.vetoes = (G, n, what) => { const K = Sv.kindOf(n); return !!(K && K.veto[what] && Sv.over(G, n)); };

  Sv.bind = function (G, n, over, kind, quiet) {
    if (!n || !over || n === over || !n.alive || !over.alive) return;
    const K = Sv.KIND[kind];
    n.dep = { over: over.id, kind, since: G.tick, share: K.share, gar: kind === 'client' || kind === 'treaty' ? 0.3 : 0.6, res: n.dep ? n.dep.res : kind === 'client' ? 25 : 40 };
    n.flags.dependent = 1;
    if (n.bloc && K.veto.war) D().leaveBloc(G, n, false);
    if (ID.atWar(G, n.id, over.id)) D().endWarState(G, n, over, true);
    ID.addOpBoth(G, n.id, over.id, 10);
    if (!quiet) {
      ID.news(G, n.name + ' becomes a ' + K.name.toLowerCase() + ' of ' + over.name + '.', 'dip', over.id, n.id);
      ID.chron(G, 'dependency', n.name + ' passes under the rule of ' + over.name + ' (' + K.name.toLowerCase() + ').', over.id, n.id);
      if (n.id === G.player) ID.headline(G, { kicker: K.name, title: over.base + ' takes charge', sub: K.desc, a: over.id, b: n.id, tone: 'bad' });
    }
    G.uiDirty = true;
  };
  /* how: 'treaty' (keeps bases), 'rising', 'collapse', 'grant', 'story', 'union' (a union breaks) */
  Sv.free = function (G, n, how, quiet) {
    if (!n.dep) return;
    const over = G.nations[n.dep.over], wasUnion = n.dep.kind === 'union';
    if (how === 'treaty' && over && over.alive) { n.dep.kind = 'treaty'; n.dep.share = Sv.KIND.treaty.share; n.dep.res = Math.min(n.dep.res, 45); n.dep.gar = 0.3; }
    else { n.dep = null; n.flags.dependent = 0; n.flags.wasDependent = 1; }
    if (wasUnion) { ID.applyIdeology(G, n, n.ideo); n.flags.unionBroke = 1; }
    n.cnt.independence = (n.cnt.independence || 0) + (n.dep ? 0 : 1);
    if (quiet) return;
    const T = { treaty: ' signs a treaty with ' + (over ? over.name : 'its overlord') + ': independent in name, with foreign bases.', rising: ' wins its independence by force of arms.', collapse: ' is free: its overlord can no longer hold it.', grant: ' is granted its independence.', story: ' is independent.', union: ' leaves the union with ' + (over ? over.name : 'its partner') + '.' };
    ID.news(G, n.name + (T[how] || T.story), 'dip', n.id, over ? over.id : 0);
    ID.chron(G, 'independence', n.name + (T[how] || T.story), n.id, over ? over.id : 0);
    if (ID.Press) ID.Press.add(G, { w: 3, kind: 'pol', a: n.id, b: over ? over.id : 0, art: 'crowd', key: 'free' + n.id, title: wasUnion ? 'The union breaks' : n.base + (how === 'treaty' ? ' signs its treaty' : ' is free'),
      text: wasUnion ? 'The union is over. Officers of the ' + n.adj + ' region have sent the governor from ' + (over ? over.base : 'the capital') + ' home on the first aeroplane, and the radio plays the old anthem. Each side says the other betrayed the nation.' : n.base + (T[how] || T.story) + ' Crowds in the capital tear down the coat of arms of the old masters and argue, the same evening, about what to put in its place.' });
    if (n.id === G.player) ID.headline(G, { kicker: how === 'treaty' ? 'A treaty' : 'Independence', title: how === 'treaty' ? 'Independent in name' : n.base + ' is free', sub: how === 'treaty' ? 'The bases stay. The flag over the palace is ours.' : 'No Resident, no governor, no garrison. Whatever happens now is ours to answer for.', a: n.id, tone: 'good' });
    if (over && over.id === G.player) ID.headline(G, { kicker: 'The empire shrinks', title: n.base + ' slips away', sub: n.name + T[how], a: over.id, b: n.id, tone: 'bad' });
    G.uiDirty = true;
  };
  /* the dependent's own levers (player and AI): petition, rise, collaborate, resist */
  Sv.ACTS = {
    petition: { name: 'Petition for a treaty', desc: 'Send a delegation to the overlord’s capital and ask for a treaty: independence in name, the bases kept.', res: 55, auth: 15 },
    rise: { name: 'Raise the country', desc: 'Declare independence and fight for it. The garrison becomes an enemy army.', res: 80, auth: 25 },
    collaborate: { name: 'Work with the overlord', desc: 'Loyal service buys aid, gold and a quieter Resident. The nationalists call it treason.', res: 0, auth: 5 },
    resist: { name: 'Organise resistance', desc: 'Boycotts, strikes and a newspaper the censors cannot catch. The gauge moves toward resistance; the overlord notices.', res: 0, auth: 10 },
  };
  Sv.actBlock = function (G, n, k) {
    const A = Sv.ACTS[k], over = Sv.over(G, n); if (!A || !over) return 'Not a dependency.';
    if (n.dep.kind === 'client' && k !== 'rise') return 'A client is free to leave: renounce the base treaty instead.';
    if ((n.cd['sov_' + k] || 0) > G.tick) return 'Available again ' + ID.dateOf(n.cd['sov_' + k]).short + '.';
    if (n.dep.res < A.res) return 'Resistance must reach ' + A.res + ' first (now ' + Math.round(n.dep.res) + ').';
    if (n.auth < A.auth) return 'Needs ' + A.auth + ' authority.';
    if (k === 'petition' && n.dep.kind === 'treaty') return 'You already have your treaty. Only a rising, or the overlord’s weakness, removes the bases.';
    return '';
  };
  /* odds that the overlord grants a petition: its weakness, its wars, the era, and how hard the country pushes */
  Sv.petitionOdds = (G, n) => { const o = Sv.over(G, n); if (!o) return 0; const r = D().power(o) / Math.max(1, D().power(n)); return clamp(0.15 + (n.dep.res - 55) * 0.012 + (o.nwars ? 0.2 : 0) + (o.stab < 40 ? 0.15 : 0) + ID.eraOf(G.tick) * 0.07 - Math.min(0.3, r * 0.03) + (n.dep.kind === 'mandate' ? 0.1 : 0), 0.05, 0.9); };
  Sv.act = function (G, n, k) {
    const why = Sv.actBlock(G, n, k); if (why) return why;
    const A = Sv.ACTS[k], over = Sv.over(G, n);
    n.auth -= A.auth; n.cd['sov_' + k] = G.tick + (k === 'collaborate' || k === 'resist' ? 360 : 720);
    if (k === 'petition') {
      if (G.rng.chance(Sv.petitionOdds(G, n))) { Sv.free(G, n, 'treaty'); return ''; }
      n.dep.res = Math.min(100, n.dep.res + 8); ID.addOpBoth(G, n.id, over.id, -8);
      ID.news(G, over.name + ' refuses ' + n.name + '’s petition. The delegation comes home to a crowd.', 'dip', over.id, n.id);
      return over.base + ' refuses. Resistance grows.';
    }
    if (k === 'rise') { Sv.rise(G, n); return ''; }
    if (k === 'collaborate') { n.dep.res = Math.max(0, n.dep.res - 12); n.gold += 60; ID.addOpBoth(G, n.id, over.id, 10); n.sm.intelligentsia -= 4; return ''; }
    if (k === 'resist') { n.dep.res = Math.min(100, n.dep.res + 12); ID.addOpBoth(G, n.id, over.id, -10); n.sm.intelligentsia += 4; ID.addMod(n, 'unrest', 2, 12, 'Resistance'); return ''; }
    return '';
  };
  Sv.rise = function (G, n) {
    const over = Sv.over(G, n); if (!over) return;
    const gar = n.dep.gar * Math.min(over.troops * 0.08, n.troops * 0.6 + 20);
    n.dep = null; n.flags.dependent = 0; n.flags.wasDependent = 1; n.flags.rose = 1;
    over.troops = Math.max(0, over.troops - gar * 0.5);
    D().startWar(G, n, over, 'independence');
    n.fervor = Math.min(100, n.fervor + 20); n.glory = Math.min(100, n.glory + 8);
    ID.news(G, 'RISING: ' + n.name + ' declares its independence from ' + over.name + '.', 'rev', n.id, over.id);
    ID.chron(G, 'independence', n.name + ' rises against ' + over.name + '.', n.id, over.id);
    if (ID.Press) ID.Press.add(G, { w: 4, kind: 'war', a: n.id, b: over.id, art: 'war', key: 'rise' + n.id, title: n.base + ' rises', text: 'The garrison of ' + over.adj + ' troops in ' + n.base + ' woke to find the barracks surrounded. ' + n.name + ' has declared its independence, and ' + over.name + ' must now decide whether the country is worth a war.' });
    if (n.id === G.player || over.id === G.player) ID.headline(G, { kicker: 'A rising', title: n.base + ' takes up arms', sub: n.name + ' declares its independence from ' + over.name + '.', a: n.id, b: over.id, tone: 'war' });
  };
  Sv.depose = function (G, n) {
    const over = Sv.over(G, n); if (!over) return;
    if (human(G, n)) { if (!ID.Events.pending(G, 'sov_depose')) ID.Events.queue(G, n, 'sov_depose', { over: over.id }); return; }
    Sv.deposeNow(G, n, over);
  };
  Sv.deposeNow = function (G, n, over) {
    const friendly = ID.ideoAffinity(n.ideo, over.ideo) < 0 ? (fam(over) === 'socialist' ? over.ideo : ID.ideo(over).family === 'liberal' ? 'conmon' : over.ideo) : null;
    if (friendly && friendly !== n.ideo && ID.IDEOLOGIES[friendly] && !ID.saturated(G, friendly)) ID.Politics.changeIdeology(G, n, friendly, 'imposed', over.id);
    else if (ID.Politics.newLeader) ID.Politics.newLeader(G, n);
    n.dep.res = Math.max(0, n.dep.res - 18); n.legit = Math.max(0, n.legit - 10); n.stab = Math.max(0, n.stab - 4);
    n.flags.deposed = (n.flags.deposed || 0) + 1;
    ID.news(G, over.name + '’s troops surround the palace in ' + n.base + '. A more agreeable government is sworn in by morning.', 'pol', over.id, n.id);
    if (ID.Press) ID.Press.add(G, { w: 3, kind: 'pol', a: n.id, b: over.id, art: 'crown', key: 'depose' + n.id, gap: 1440, title: 'Tanks at the palace in ' + n.base, text: 'The ' + over.adj + ' Resident arrived at the palace in ' + n.base + ' at nine in the evening with an ultimatum and an armoured column. By midnight the government had resigned. The new ministers, the Resident assures reporters, enjoy the full confidence of the nation.' });
  };

  function depMonth(G, n) {
    const over = Sv.over(G, n);
    if (!over) { Sv.free(G, n, 'collapse'); return; }
    const K = Sv.KIND[n.dep.kind], dp = n.dep, era = ID.eraOf(G.tick);
    // tribute: a share of revenue and of what the oil earns
    const take = Math.max(0, (n.rev || 0) + (n.a.oilInc || 0)) * dp.share;
    if (take > 0) { ID.flow(n, 'Tribute to ' + over.base, -take); ID.flow(over, 'Tribute from ' + n.base, take); n.a.tribute = take; } else n.a.tribute = 0;
    // the garrison: protection and quiet, and the reminder of who rules
    if (dp.gar > 0) { Sv.setMod(n, 'def', 0.1 * dp.gar, 'The ' + over.adj + ' garrison'); Sv.setMod(n, 'unrest', -3 * dp.gar, 'The ' + over.adj + ' garrison'); }
    if (K.aid) { n.gold += 4; Sv.setMod(n, 'trade', 0.04, 'A friend with a base'); }
    // resistance: the kind, the ideology, the share taken, the overlord's strength and troubles, the era
    let d = K.drift + dp.share * 1.2 + era * 0.06;
    const I = ID.ideo(n);
    if (n.ideo === 'thirdpos' || n.ideo === 'pannat' || n.ideo === 'revival' || n.ideo === 'juche' || n.ideo === 'natsyn' || n.ideo === 'natsoc' || n.ideo === 'nazacc') d += 0.45; else if (I.family === 'heterodox' || I.family === 'authoritarian' || I.family === 'socialist') d += 0.2;
    if (over.nwars) d += 0.25;
    if (over.stab < 35) d += 0.35;
    if (over.lostWarAt != null && over.age - over.lostWarAt < 24) d += 0.5;
    d -= dp.gar * 0.15;
    d -= clamp(ID.op(G, n.id, over.id), -50, 60) * 0.004;
    if (n.dep.kind === 'union') d += clamp((D().power(over) / Math.max(1, D().power(n)) - 1.5) * 0.15, 0, 0.5) + (n.fp.military > 22 ? 0.2 : 0) - (over.charisma - 50) * 0.01 - ((over.sig || 0) - 50) * 0.006;
    dp.res = clamp(dp.res + d, 0, 100);
    // effects of the gauge: the nationalists gain as resistance grows; collaboration buys quiet
    Sv.setMod(n, 'legit', I.family === 'heterodox' || I.family === 'authoritarian' ? (dp.res - 50) * 0.05 : (50 - dp.res) * 0.04, 'Under ' + over.adj + ' rule');
    if (dp.res > 70) Sv.setMod(n, 'unrest', (dp.res - 70) * 0.12, 'Resistance to ' + over.adj + ' rule');
    // a union breaks at full tension, or when the junior's regime is no longer of the nation
    if (n.dep.kind === 'union') { if (dp.res >= 100 || !ID.ideo(n).flags.panNation) Sv.free(G, n, 'union'); return; }
    if (over.alive && over.tiles < n.tiles * 0.5 && dp.kind !== 'client') { Sv.free(G, n, 'collapse'); return; }
    // the overlord's hand (AI overlords; a human overlord acts from the Sovereignty panel)
    const script = G.historical && dp.script;
    if (!human(G, over) && !script) {
      if (K.depose && dp.res > 78 && D().power(over) > D().power(n) * 2 && G.rng.chance(0.025)) Sv.depose(G, n);
      else if (dp.kind !== 'client' && dp.kind !== 'treaty' && dp.res > 60 && (over.nwars > 1 || over.stab < 30 || (era >= 3 && dp.kind === 'mandate')) && G.rng.chance(0.02)) Sv.free(G, n, 'treaty');
    }
    if (!n.dep) return;
    // the dependent's choices (AI)
    if (!human(G, n) && !script) {
      if (dp.res >= 85 && dp.kind !== 'client' && (D().power(n) > D().power(over) * 0.45 || over.nwars) && G.rng.chance(0.06)) Sv.rise(G, n);
      else if (dp.res >= 58 && G.rng.chance(0.04) && !Sv.actBlock(G, n, 'petition')) Sv.act(G, n, 'petition');
      else if (dp.res < 35 && n.gold < 40 && G.rng.chance(0.08) && !Sv.actBlock(G, n, 'collaborate')) Sv.act(G, n, 'collaborate');
    } else if (dp.res >= 80 && !n.a.riseAsked && dp.kind !== 'client') { n.a.riseAsked = G.tick; ID.Events.queue(G, n, 'sov_moment', { over: over.id }); }
  }
  /* a labelled modifier refreshed every month (removed and re-added, never piling up) */
  Sv.setMod = function (n, k, v, label) {
    for (let i = n.mods.length - 1; i >= 0; i--) if (n.mods[i].label === label && n.mods[i].k === k) n.mods.splice(i, 1);
    if (Math.abs(v) > 1e-4) n.mods.push({ k, v, m: 2, label });
  };
  /* overlord's own levers */
  Sv.OVER = {
    tribute: { name: 'Raise the tribute', desc: 'Take a larger share of their revenue. They will remember.' },
    ease: { name: 'Ease the burden', desc: 'Halve the share taken. Resistance falls.' },
    garrison: { name: 'Reinforce the garrison', desc: 'Send troops: quiet streets, and a bill for the barracks.' },
    depose: { name: 'Depose the government', desc: 'Replace the government with one that knows its place.' },
    grant: { name: 'Grant independence', desc: 'Let them go, keeping goodwill and, for a former colony, a base by treaty.' },
  };
  Sv.overAct = function (G, over, n, k) {
    if (!n.dep || n.dep.over !== over.id) return 'Not your dependency.';
    if ((over.cd['sovo_' + k + n.id] || 0) > G.tick) return 'Available again ' + ID.dateOf(over.cd['sovo_' + k + n.id]).short + '.';
    const K = Sv.KIND[n.dep.kind];
    if (k === 'tribute') { if (n.dep.share >= 0.4) return 'They cannot pay more.'; n.dep.share = Math.min(0.4, n.dep.share + 0.08); n.dep.res = Math.min(100, n.dep.res + 10); }
    else if (k === 'ease') { n.dep.share = n.dep.share / 2; n.dep.res = Math.max(0, n.dep.res - 10); ID.addOpBoth(G, n.id, over.id, 8); }
    else if (k === 'garrison') { if (over.gold < 60) return 'Needs 60 gold.'; over.gold -= 60; over.troops *= 0.98; n.dep.gar = Math.min(1.5, n.dep.gar + 0.3); n.dep.res = Math.min(100, n.dep.res + 3); }
    else if (k === 'depose') { if (!K.depose) return 'A ' + K.name.toLowerCase() + ' cannot simply be deposed.'; if (over.auth < 20) return 'Needs 20 authority.'; over.auth -= 20; Sv.depose(G, n); }
    else if (k === 'grant') { Sv.free(G, n, n.dep.kind === 'vilayet' || n.dep.kind === 'union' ? 'grant' : 'treaty'); ID.addOpBoth(G, n.id, over.id, 20); return ''; }
    over.cd['sovo_' + k + n.id] = G.tick + 360;
    return '';
  };

  /* ---------------------------------------------------------------- oil */
  Sv.PRICE = [3, 6, 10, 16]; // gold per field per month, by era
  Sv.price = (G) => Sv.PRICE[ID.eraOf(G.tick)] * (G.world.oilShock ? 2.5 : 1);
  Sv.fields = (G, n, found) => { let f = 0; for (let p = 1; p < G.provinces.length; p++) { const P = G.provinces[p]; if (P.oil && P.owner === n.id && (!found || P.oilFound)) f += P.oil; } return f; };
  Sv.oilProvs = (G, n) => { const out = []; for (let p = 1; p < G.provinces.length; p++) { const P = G.provinces[p]; if (P.oil && P.oilFound && P.owner === n.id) out.push(P); } return out; };
  Sv.held = (G, n) => { const out = []; for (let p = 1; p < G.provinces.length; p++) { const P = G.provinces[p]; if (P.oil && P.oilFound && P.oilCo === n.id && P.owner !== n.id) out.push(P); } return out; };
  Sv.nearest = (G, x, y) => { let best = null, bd = 1e9; const tx = x * G.W, ty = y * G.H; for (let p = 1; p < G.provinces.length; p++) { const P = G.provinces[p], d = (P.cx - tx) ** 2 + (P.cy - ty) ** 2; if (d < bd) { bd = d; best = P; } } return best; };
  Sv.unbound = (G, n) => !n.dep && !Sv.oilProvs(G, n).some((P) => P.oilCo && P.oilCo !== n.id);
  /* random worlds: oil in the deserts and a little elsewhere; scenarios list their fields */
  Sv.initOil = function (G, list) {
    const rng = G.rng;
    if (list) {
      for (const o of list) {
        let best = null, bd = 1e9; const tx = o[0] * G.W, ty = o[1] * G.H;
        for (let p = 1; p < G.provinces.length; p++) { const P = G.provinces[p]; const d = (P.cx - tx) ** 2 + (P.cy - ty) ** 2; if (d < bd) { bd = d; best = P; } }
        if (!best) continue;
        best.oil = (best.oil || 0) + o[2]; best.oilAt = o[3] || 0; if (o[3] === 1) best.oilFound = 1;
        if (o[4]) { const c = ID.byBase(G, o[4]); if (c) { best.oilCo = c.id; best.oilShare = 0.75; } }
      }
      return;
    }
    for (let p = 1; p < G.provinces.length; p++) {
      const P = G.provinces[p], t = Math.max(1, P.tiles), desert = P.tc[ID.T.DESERT] / t;
      if (desert > 0.35 ? rng.chance(0.25) : P.tc[ID.T.PLAINS] / t > 0.4 && rng.chance(0.03)) P.oil = rng.int(1, 2);
    }
  };
  function oilMonth(G) {
    const era = ID.eraOf(G.tick), price = Sv.price(G), yr = ID.yearOf(G.tick);
    for (const n of G.nations) if (n) { n.a.oilInc = 0; n.a.oilCoInc = 0; }
    for (let p = 1; p < G.provinces.length; p++) {
      const P = G.provinces[p]; if (!P.oil) continue;
      const n = alive(G, P.owner);
      if (!P.oilFound) {
        if (P.oilAt > 1 ? yr >= P.oilAt : G.rng.chance([0.0004, 0.004, 0.008, 0.012][era])) Sv.discover(G, P);
        continue;
      }
      if (!n) continue;
      let v = P.oil * price;
      if (n.a.embargoed && G.tick < n.a.embargoed) v *= n.a.embargoBuyer ? 0.6 : 0.3;
      const co = P.oilCo && P.oilCo !== n.id ? alive(G, P.oilCo) : null;
      if (co && !ID.atWar(G, co.id, n.id)) { const c = v * (P.oilShare || 0.7); ID.flow(co, 'Oil concessions abroad', c); co.a.oilCoInc += c; v -= c; }
      ID.flow(n, 'Oil', v); n.a.oilInc += v;
    }
  }
  Sv.discover = function (G, P) {
    P.oilFound = 1;
    const n = alive(G, P.owner); if (!n) return;
    n.flags.oil = 1;
    ID.news(G, 'Oil is struck in ' + n.name + '.', 'eco', n.id);
    if (n.id === G.player) ID.headline(G, { kicker: 'A gusher', title: 'Oil in ' + n.base, sub: 'A column of black oil higher than the shrine towers. Foreign companies will be at the door within the week.', a: n.id, tone: 'good' });
    else if (ID.Press && ID.eraOf(G.tick) >= 1) ID.Press.add(G, { w: 2, kind: 'eco', a: n.id, key: 'oil' + n.id, gap: 3600, title: 'Oil in ' + n.base, text: 'Drillers working for ' + (P.oilCo && G.nations[P.oilCo] ? 'a ' + G.nations[P.oilCo].adj + ' company' : 'the government') + ' have struck oil in ' + n.name + '. Geologists say the field is large. Diplomats say the country has just become interesting.' });
    // whoever already holds sway takes the concession
    if (!P.oilCo) { const over = Sv.over(G, n); if (over) { P.oilCo = over.id; P.oilShare = 0.75; } }
  };
  /* sell a concession on every unconceded field to a buyer: gold now, a share for ever */
  Sv.concessionValue = (G, n) => Math.round(Sv.oilProvs(G, n).filter((P) => !P.oilCo || P.oilCo === n.id).reduce((s, P) => s + P.oil, 0) * Sv.price(G) * 14);
  Sv.sell = function (G, n, buyer) {
    const L = Sv.oilProvs(G, n).filter((P) => !P.oilCo || P.oilCo === n.id); if (!L.length || !buyer || buyer === n) return 'Nothing to sell.';
    const v = Sv.concessionValue(G, n); n.gold += v; buyer.gold -= v * 0.5;
    for (const P of L) { P.oilCo = buyer.id; P.oilShare = 0.7; }
    n.flags.oilSold = 1; ID.addOpBoth(G, n.id, buyer.id, 12);
    ID.news(G, n.name + ' sells an oil concession to a ' + buyer.adj + ' company for ' + v + ' gold.', 'eco', n.id, buyer.id);
    return '';
  };
  /* nationalise every foreign-held field: the crisis */
  Sv.nationaliseAll = function (G, n) {
    const hit = {};
    for (const P of Sv.oilProvs(G, n)) if (P.oilCo && P.oilCo !== n.id) { hit[P.oilCo] = (hit[P.oilCo] || 0) + P.oil; P.oilCo = 0; }
    for (const k in hit) Sv.crisis(G, n, G.nations[+k], hit[k]);
    return Object.keys(hit).length;
  };
  Sv.crisis = function (G, n, co, fields) {
    if (!co || !co.alive) return;
    const forced = n.a.forceAnswer; delete n.a.forceAnswer;
    n.flags.nationalised = 1; n.glory = Math.min(100, n.glory + 8); n.sm.workers += 4; n.sm.capital -= 6;
    if (n.dep && n.dep.over === co.id) n.dep.res = Math.min(100, n.dep.res + 15);
    ID.news(G, n.name + ' nationalises the ' + co.adj + ' oil company.', 'eco', n.id, co.id);
    ID.chron(G, 'oil', n.name + ' nationalises the oil held by ' + co.name + '.', n.id, co.id);
    if (ID.Press) ID.Press.add(G, { w: 4, kind: 'eco', a: n.id, b: co.id, art: 'industry', key: 'nat' + n.id + '_' + co.id, gap: 1440, title: 'The oil is ' + n.adj, text: 'The government of ' + n.base + ' has nationalised the fields worked by ' + co.adj + ' companies. Troops guard the refineries; the crowds outside parliament chant the prime minister’s name. In ' + co.base + ', the cabinet is meeting tonight to decide between an embargo, a quiet word with certain colonels, a fleet, and swallowing it.' });
    if (human(G, co)) { ID.Events.queue(G, co, 'sov_nat', { from: n.id, fields }); return; }
    if (forced && (forced !== 'invade' || !D().warBlock(G, co, n))) { Sv.answer(G, co, n, forced, fields); return; }
    // the company's country answers
    const r = D().power(co) / Math.max(1, D().power(n)), era = ID.eraOf(G.tick);
    const w = { accept: 1 + (co.nwars ? 2 : 0) + (r < 1.5 ? 2 : 0) + (era >= 3 ? 1 : 0) + (ID.ideo(co).family === 'socialist' ? 2 : 0),
      embargo: 2 + (co.bloc ? 1 : 0), coup: ID.ideo(n).flags.noCoup ? 0 : 1.5 + (ID.ideo(co).dip.export > 0.3 ? 1 : 0),
      invade: r > 2 && !co.nwars && !D().warBlock(G, co, n) && (ID.borders(G, co.id, n.id) || co.nb[ID.B.PORT]) ? 1.2 + (era <= 1 ? 1 : 0) : 0 };
    Sv.answer(G, co, n, G.rng.weighted(Object.keys(w), (k) => w[k]), fields);
  };
  Sv.answer = function (G, co, n, k, fields) {
    if (!n.alive || !co.alive) return;
    if (k === 'accept') { n.gold -= Math.min(Math.max(0, n.gold), fields * 30); co.gold += fields * 30; ID.news(G, co.name + ' accepts compensation for its oil in ' + n.base + '.', 'dip', co.id, n.id); n.flags.oilWon = 1; }
    else if (k === 'embargo') { const rival = ID.alive(G).find((o) => o !== co && o.bloc && o.bloc !== co.bloc && G.blocs[o.bloc] && G.blocs[o.bloc].leader === o.id && ID.op(G, o.id, n.id) > -20); n.a.embargoed = G.tick + 36 * 30; n.a.embargoBuyer = rival ? rival.id : 0; ID.addMod(n, 'trade', -0.2, 36, co.adj + ' embargo'); ID.dipOf(G, co.id, n.id).trade = 0; ID.addOpBoth(G, co.id, n.id, -25); if (rival) ID.addOpBoth(G, rival.id, n.id, 15); ID.news(G, co.name + ' embargoes ' + n.name + '’s oil' + (rival ? '; ' + rival.name + ' offers to buy it.' : '.'), 'dip', co.id, n.id); }
    else if (k === 'coup') { const ok = D().plotBest && D().plotBest(G, co, n); if (ok) { co.gold += 80; D().startOp(G, co, 'coup', n); const op = D().plotOp(co, n), f = op && D().plotFig(n, op.seat); if (f) f.prep = Math.max(f.prep || 0, 35); } ID.addOpBoth(G, co.id, n.id, -15); n.a.coupBacked = co.id; ID.news(G, 'Rumours in ' + n.base + ': ' + co.adj + ' money is reaching certain colonels.', 'pol', co.id, n.id); }
    else if (k === 'invade') { D().startWar(G, co, n, 'order'); }
    if (ID.Press) ID.Press.add(G, { w: 3, kind: 'dip', a: co.id, b: n.id, key: 'ans' + co.id + '_' + n.id, gap: 1440, title: { accept: co.base + ' swallows it', embargo: 'An embargo on ' + n.base + '’s oil', coup: 'Colonels and suitcases', invade: co.base + ' sends the fleet' }[k] || 'The answer',
      text: { accept: co.name + ' will accept compensation for the nationalised fields. Its press calls it a humiliation; its treasury calls it a settlement.', embargo: 'No tanker will load at ' + n.base + '’s terminals under ' + co.adj + ' insurance. The government says it will sell to anyone who will buy.', coup: 'Visitors from ' + co.base + ' with heavy suitcases have been seen at the officers’ club in ' + n.base + '. The prime minister says he is not afraid.', invade: co.name + ' has landed troops to "protect lives and property" and restore order in ' + n.base + '.' }[k] || '' });
  };

  /* ---------------------------------------------------------------- intervention and the blocs */
  Sv.tradeFamilies = (G, n) => { const f = new Set(); for (const o of ID.alive(G)) if (o !== n) { const d = ID.dipOf(G, n.id, o.id); if (d && d.trade) f.add(fam(o)); } return f.size; };
  const leaders = (G) => G.blocs.filter((b) => b && b.members.length > 1 && alive(G, b.leader)).map((b) => G.nations[b.leader]);
  function interveneMonth(G) {
    const era = ID.eraOf(G.tick); if (era < 1) return;
    const L = leaders(G), rng = G.rng;
    for (const P of L) {
      if (P.gold < 150 || P.stab < 35 || !rng.chance(era >= 3 ? 0.3 : 0.15)) continue;
      // arms to one side of a war whose other side leans to a rival bloc: the proxy war
      for (const n of ID.alive(G)) {
        if (n === P || n.bloc === P.bloc && P.bloc || !n.nwars || n.id === G.player && !G.autoPlayer) continue;
        const foes = D().enemies(G, n); if (!foes.length) continue;
        const rival = foes.find((e) => e.bloc && e.bloc !== P.bloc && G.blocs[e.bloc] && G.blocs[e.bloc].leader !== P.id || (e.dep && Sv.over(G, e) && Sv.over(G, e).bloc && Sv.over(G, e).bloc !== P.bloc));
        if (!rival || ID.op(G, P.id, n.id) < 0 || n.a['arms' + P.id] > G.tick) continue;
        const t = Math.min(P.troops * 0.03, n.troops * 0.25 + 20); P.troops -= t; n.troops += t; P.gold -= 40; n.equip = Math.min(1.4, n.equip + 0.05);
        n.a['arms' + P.id] = G.tick + 360; ID.addOpBoth(G, P.id, n.id, 8); ID.addOpBoth(G, P.id, rival.id, -6);
        ID.news(G, P.name + ' ships arms to ' + n.name + ' for its war with ' + rival.name + '.', 'dip', P.id, n.id);
        if (ID.Press) ID.Press.add(G, { w: 2, kind: 'war', a: n.id, b: P.id, key: 'proxy' + n.id, gap: 720, title: 'Guns for ' + n.base, text: 'Crates marked as agricultural machinery are being unloaded in ' + n.base + ' from ' + P.adj + ' freighters. The war with ' + rival.base + ' is no longer only theirs.' });
        break;
      }
      // courting the unaligned (from the Age of Total War): aid offered by each bloc to the states that belong to none
      if (era >= 2) {
        const c = ID.alive(G).filter((o) => o !== P && !o.bloc && !o.dep && (ID.ideo(o).flags.nonAligned || o.tiles < P.tiles * 0.6) && ID.op(G, P.id, o.id) > -30 && (!o.a['court' + P.id] || G.tick - o.a['court' + P.id] > 720));
        const o = c.length ? rng.weighted(c, (x) => 1 + Sv.fields(G, x, true) + (ID.ideo(x).flags.nonAligned ? 3 : 0)) : null;
        if (o) {
          o.a['court' + P.id] = G.tick;
          if (human(G, o)) { const other = Object.keys(o.a).filter((k) => /^court\d+$/.test(k) && +k.slice(5) !== P.id && G.tick - o.a[k] < 720).map((k) => +k.slice(5))[0]; if (!ID.Events.pending(G, 'sov_court')) ID.Events.queue(G, o, 'sov_court', { a: P.id, b: other || 0 }); }
          else { o.gold += 50; P.gold -= 50; ID.addOpBoth(G, P.id, o.id, 6); if (ID.ideo(o).flags.nonAligned && o.sig != null) o.sig = Math.min(100, o.sig + 3); else if (ID.op(G, o.id, P.id) > 55 && rng.chance(0.25) && Sv.wantsBase(G, P, o)) Sv.bind(G, o, P, 'client'); }
        }
      }
      // order: a client or dependent in civil war, with rebels hostile to the patron
      for (const n of Sv.dependents(G, P)) if (n.civil && alive(G, n.civil) && !ID.atWar(G, P.id, n.civil) && ID.ideoAffinity(P.ideo, G.nations[n.civil].ideo) < 0 && rng.chance(0.25)) { D().startWar(G, P, G.nations[n.civil], 'order'); break; }
    }
  }
  Sv.wantsBase = (G, P, o) => !o.dep && !o.bloc && o.id !== G.player && !ID.ideo(o).flags.nonAligned && Sv.dependents(G, P).filter((x) => x.dep.kind === 'client').length < 3;

  /* ---------------------------------------------------------------- union */
  Sv.unionCands = (G, n) => ID.alive(G).filter((m) => m !== n && ID.ideo(m).flags.panNation && !m.dep && !Sv.dependents(G, m).length && !ID.atWar(G, n.id, m.id) && !m.civilOf
    && (ID.borders(G, n.id, m.id) || Math.hypot((m.capital % G.W) - (n.capital % G.W), ((m.capital / G.W) | 0) - ((n.capital / G.W) | 0)) < 70) && (G.scenario !== 'meridia' || !G.historical || (G.provinces[G.prov[m.capital]].region === G.provinces[G.prov[n.capital]].region)));
  Sv.proposeUnion = function (G, n) {
    if (!ID.ideo(n).flags.panNation || n.dep) return 'Only a free pan-national state can propose a union.';
    const c = Sv.unionCands(G, n); if (!c.length) return 'No state of the nation is ready for union.';
    const m = c.sort((a, b) => ID.op(G, n.id, b.id) - ID.op(G, n.id, a.id))[0];
    if (human(G, m)) { ID.Events.queue(G, m, 'sov_union', { from: n.id }); return ''; }
    const ok = ID.op(G, m.id, n.id) + (m.sig || 50) * 0.4 - 20 + (m.stab < 40 ? 15 : 0) + G.rng.range(-15, 15) > 0;
    if (!ok) { ID.news(G, m.name + ' declines ' + n.name + '’s call for union.', 'dip', m.id, n.id); return m.base + ' declines.'; }
    Sv.unite(G, n, m); return '';
  };
  Sv.unite = function (G, a, b) {
    const senior = D().power(a) >= D().power(b) ? a : b, junior = senior === a ? b : a;
    Sv.bind(G, junior, senior, 'union', true);
    junior.dep.res = 20; junior.dep.gar = 0;
    senior.cnt.unions = Math.max(senior.cnt.unions || 0, Sv.dependents(G, senior).filter((x) => x.dep.kind === 'union').length);
    ID.addOpBoth(G, a.id, b.id, 40);
    senior.name = 'United Republic of ' + senior.base + ' and ' + junior.base; junior.name = 'United Republic (' + junior.base + ' region)';
    for (const e of D().enemies(G, senior)) if (!ID.atWar(G, junior.id, e.id) && !D().warBlock(G, junior, e)) D().startWar(G, junior, e, 'alliance');
    ID.news(G, 'UNION: ' + senior.base + ' and ' + junior.base + ' proclaim the United Republic.', 'dip', senior.id, junior.id);
    ID.chron(G, 'union', senior.base + ' and ' + junior.base + ' unite in a single republic.', senior.id, junior.id);
    if (ID.Press) ID.Press.add(G, { w: 4, kind: 'pol', a: senior.id, b: junior.id, art: 'crowd', key: 'union' + senior.id + '_' + junior.id, gap: 3600, title: 'One republic of the nation', text: 'Crowds a million strong in two capitals: ' + senior.base + ' and ' + junior.base + ' are one state. The flag has two stars. The officers of ' + junior.base + ' have been promised equal rank; the civil servants of ' + senior.base + ' are already packing for the move.' });
    if (a.id === G.player || b.id === G.player) ID.headline(G, { kicker: 'The United Republic', title: 'Two states, one nation', sub: senior.base + ' and ' + junior.base + ' unite.', a: senior.id, b: junior.id, tone: 'good' });
  };

  /* ---------------------------------------------------------------- liberation fronts and new states */
  /* Make a new state from provinces (a partition, a front that wins, a mandate carved out). o: {base, adj,
     ideo, provs:[ids], war: id to fight, sit, color, blurb}. Population and troops move with the land. */
  Sv.spawn = function (G, o) {
    if (G.nations.length >= MAXN - 2) return null;
    const set = new Set(o.provs); let R = G.nations.find((x) => x && x.key === o.base && !x.alive) || null;
    const fresh = !R;
    if (!R) R = ID.makeNation(G, { base: o.base, adj: o.adj, sit: o.sit || 'small', color: o.color, blurb: o.blurb || '' });
    if (!R) return null;
    R.alive = true; R.nwars = 0; R.bloc = 0; R.ops = []; R.civil = 0; R.civilOf = 0; R.dep = null; R.region = o.region || R.region;
    const losers = {};
    for (let i = 0; i < G.N; i++) { const ow = G.owner[i]; if (ow !== R.id && G.terrain[i] !== ID.T.SEA && set.has(G.prov[i])) { if (!ow) { ID.setOwner(G, i, R.id, true); continue; } if (!losers[ow]) losers[ow] = { land: G.nations[ow].popLand, pop: G.nations[ow].pop, troops: G.nations[ow].troops, tiles: G.nations[ow].tiles }; ID.setOwner(G, i, R.id, true); } }
    if (!R.tiles) { R.alive = false; return null; }
    let pop = 0, troops = 0;
    for (const k in losers) { const L = G.nations[+k], b = losers[k]; const sh = clamp(1 - L.popLand / Math.max(1, b.land), 0, 0.9); const mv = b.pop * sh; L.pop -= mv; pop += mv; const tm = b.troops * clamp(1 - L.tiles / Math.max(1, b.tiles), 0, 0.6) * 0.5; L.troops -= tm; troops += tm; }
    let big = null; for (const p of o.provs) { const Pr = G.provinces[p]; if (G.owner[Pr.center] === R.id) { Pr.core = R.id; Pr.owner = R.id; Pr.integ = 90; Pr.unrest = 15; Pr.oppStr = 0; Pr.opp = null; if (!big || Pr.tiles > big.tiles) big = Pr; } }
    R.capital = big ? big.center : -1; if (R.capital < 0) for (let i = 0; i < G.N; i++) if (G.owner[i] === R.id) { R.capital = i; break; }
    if (!G.bld[R.capital]) ID.placeBuilding(G, R.capital, ID.B.CITY);
    R.pop = Math.max(pop, R.popLand * 0.4); R.laws = fresh ? {} : R.laws; R.mob = 0.06;
    ID.applyIdeology(G, R, o.ideo, true);
    const any = G.nations[+Object.keys(losers)[0]];
    R.tech = Object.assign({}, any ? any.tech : { ind: 0, mil: 0, agr: 0 }); R.troops = Math.max(troops, R.pop * Math.min(ID.maxMob(R), 0.08)); R.gold = o.gold || 80;
    R.stab = 58; R.legit = 60; R.fervor = 75; R.glory = 40; R.mandate = 55; R.tradition = 20; R.charisma = 60;
    R.startTiles = R.peakTiles = R.tiles; R.a = R.a || {}; R.a.startIdeo = R.ideo;
    for (const x of G.nations) if (x && x !== R) G.rel[R.id * MAXN + x.id] = G.rel[x.id * MAXN + R.id] = clamp(ID.ideoAffinity(R.ideo, x.ideo) + G.rng.range(-5, 5), -100, 100);
    for (const k in losers) ID.addOpBoth(G, R.id, +k, -30);
    ID.recalcBorders(G); ID.Politics.initNation(G, R); if (ID.Regime) ID.Regime.ensure(G, R);
    if (o.tree && ID.FOCUS.nations[o.tree]) R.tree = o.tree;
    if (o.war && alive(G, o.war)) D().startWar(G, R, G.nations[o.war], 'independence');
    if (!G.headless) G.dirtyAll = true;
    return R;
  };
  /* provinces nearest a list of map points ([x, y] fractions), plus their neighbours within reach */
  Sv.provsAt = function (G, pts, reach) {
    const out = new Set();
    for (const pt of pts) {
      const tx = pt[0] * G.W, ty = pt[1] * G.H;
      for (let p = 1; p < G.provinces.length; p++) { const P = G.provinces[p]; if (Math.hypot(P.cx - tx, P.cy - ty) <= (reach || 12)) out.add(p); }
    }
    return [...out];
  };
  function frontMonth(G) {
    if (!G.fronts) return;
    for (const k in G.fronts) {
      const F = G.fronts[k]; if (F.state) continue;
      const def = ID.FRONTS && ID.FRONTS[k]; if (!def) continue;
      // the host is whoever holds most of the people's provinces now
      const cnt = {}; for (const p of F.provs) { const o = G.provinces[p].owner; if (o) cnt[o] = (cnt[o] || 0) + 1; }
      const host = alive(G, +Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a])[0]); if (!host) continue;
      F.host = host.id;
      let d = (def.grow || 0.15) + (F.sponsor && alive(G, F.sponsor) ? 0.25 : 0) + (host.nwars ? 0.25 : 0) + (host.stab < 40 ? 0.2 : 0) - (host.laws.security === 'secret' || host.laws.security === 'terror' ? 0.2 : 0) + (host.dep ? 0.1 : 0);
      if (def.drift) { try { d += def.drift(G, F, host) || 0; } catch (e) { /* data error: ignore */ } }
      F.str = clamp(F.str + d, 0, 100);
      for (const p of F.provs) { const Pr = G.provinces[p]; if (Pr.owner === host.id) Pr.unrest = clamp(Pr.unrest + F.str * 0.004, 0, 100); }
      if (F.str >= (def.riseAt || 85) && (host.stab < 50 || host.nwars) && G.rng.chance(0.08)) Sv.frontRise(G, k);
    }
  }
  Sv.frontRise = function (G, k, opts) {
    const F = G.fronts[k], def = ID.FRONTS[k]; if (!F || F.state) return null;
    const host = alive(G, F.host);
    const R = Sv.spawn(G, { base: def.base, adj: def.adj, ideo: (opts && opts.ideo) || def.ideo, provs: F.provs, war: opts && opts.peace ? 0 : host ? host.id : 0, region: def.region, tree: def.base, blurb: def.blurb });
    if (!R) return null;
    F.state = R.id; F.born = G.tick;
    if (F.sponsor && alive(G, F.sponsor)) ID.addOpBoth(G, R.id, F.sponsor, 40);
    ID.news(G, (opts && opts.peace ? '' : 'RISING: ') + def.name + ' proclaims ' + R.name + '.', 'rev', R.id, host ? host.id : 0);
    ID.chron(G, 'independence', def.name + ' proclaims ' + R.name + (host && !(opts && opts.peace) ? ', at war with ' + host.name : '') + '.', R.id, host ? host.id : 0);
    if (ID.Press) ID.Press.add(G, { w: 4, kind: 'war', a: R.id, b: host ? host.id : 0, art: 'crowd', key: 'front' + k, gap: 9999, title: R.base + ' is proclaimed', text: def.born || (def.name + ' has proclaimed a state of its own.') });
    if (host && host.id === G.player) ID.headline(G, { kicker: 'A new state', title: R.base + ' is proclaimed', sub: def.name + ' takes up arms in our provinces.', a: R.id, b: host.id, tone: 'war' });
    return R;
  };

  /* ---------------------------------------------------------------- effect keys
     ['dep', 'res', v]            move the resistance gauge (or a union's tension)
     ['dep', 'bind', base, kind]  become base's dependency of that kind
     ['dep', 'free', how]         independence ('treaty' keeps the bases)
     ['oil', 'find']              discover every field we own
     ['oil', 'nationalise']       nationalise every foreign-held field (the crisis)
     ['oil', 'sell', base]        sell our concessions to base
     ['front', key, v]            a liberation front grows or shrinks; ['front', key, 'sponsor'] makes us its sponsor
     ['union']                    call for union with the nearest pan-national state */
  if (ID.Focus) {
    const FX = ID.Focus.FX, DS = ID.Focus.DESC;
    FX.dep = (G, n, f) => {
      if (f[1] === 'res') { if (n.dep) n.dep.res = clamp(n.dep.res + f[2], 0, 100); }
      else if (f[1] === 'bind') { const o = ID.byBase(G, f[2]); if (o && o !== n) Sv.bind(G, n, o, f[3] || 'protectorate'); }
      else if (f[1] === 'free') Sv.free(G, n, f[2] || 'story');
    };
    FX.oil = (G, n, f) => {
      if (f[1] === 'find') { for (let p = 1; p < G.provinces.length; p++) { const P = G.provinces[p]; if (P.oil && !P.oilFound && P.owner === n.id) Sv.discover(G, P); } }
      else if (f[1] === 'nationalise') Sv.nationaliseAll(G, n);
      else if (f[1] === 'sell') { const b = ID.byBase(G, f[2]); if (b) Sv.sell(G, n, b); }
    };
    FX.front = (G, n, f) => { const F = G.fronts && G.fronts[f[1]]; if (!F) return; if (f[2] === 'sponsor') F.sponsor = n.id; else F.str = clamp(F.str + f[2], 0, 100); };
    FX.union = (G, n) => { Sv.proposeUnion(G, n); };
    // generic neighbour interactions (data/trees2.js): military steps unsettle the neighbours, economic ones open a treaty
    FX.nbOp = (G, n, f) => { for (const k in G.border[n.id] || {}) { const o = G.nations[+k]; if (o && o.alive && o !== n) ID.addOp(G, o.id, n.id, f[1]); } };
    FX.nbTreaty = (G, n) => { let best = null, bv = 10; for (const k in G.border[n.id] || {}) { const o = G.nations[+k]; if (o && o.alive && o !== n && !ID.dipOf(G, n.id, o.id).trade && ID.op(G, o.id, n.id) > bv) { bv = ID.op(G, o.id, n.id); best = o; } } if (best) D().note(G, n, best, 'treaty'); };
    DS.nbOp = (f) => ({ t: 'Neighbours’ opinion of us ' + (f[1] > 0 ? '+' : '−') + Math.abs(f[1]), good: f[1] > 0 });
    DS.nbTreaty = () => ({ t: 'Proposes a treaty to our friendliest neighbour', good: true });
    DS.dep = (f) => (f[1] === 'res' ? { t: (f[2] > 0 ? 'Resistance to the overlord +' : 'Collaboration with the overlord +') + Math.abs(f[2]), good: null } : f[1] === 'bind' ? { t: 'Becomes a ' + (Sv.KIND[f[3] || 'protectorate'].name.toLowerCase()) + ' of ' + f[2], good: false } : { t: f[2] === 'treaty' ? 'Independence by treaty (the bases stay)' : 'Independence', good: true });
    DS.oil = (f) => ({ t: f[1] === 'find' ? 'Drilling: any oil under our land is found' : f[1] === 'nationalise' ? 'Nationalises the foreign oil companies (a crisis)' : 'Sells the oil concession to ' + f[2], good: f[1] === 'find' ? true : null });
    DS.front = (f) => ({ t: f[2] === 'sponsor' ? 'We sponsor ' + ((ID.FRONTS && ID.FRONTS[f[1]] && ID.FRONTS[f[1]].name) || 'a front') : ((ID.FRONTS && ID.FRONTS[f[1]] && ID.FRONTS[f[1]].name) || 'The front') + ' ' + (f[2] > 0 ? 'grows' : 'weakens'), good: null });
    DS.union = () => ({ t: 'Calls for union with a state of the nation', good: null });
  }

  /* ---------------------------------------------------------------- the month */
  Sv.init = function (G, sc) {
    G.fronts = G.fronts || null;
    if (sc && sc.region) for (let p = 1; p < G.provinces.length; p++) { const P = G.provinces[p]; if (P.cy >= sc.region.y * G.H) P.region = sc.region.key; }
    Sv.initOil(G, sc ? sc.oil : null);
    if (sc && sc.canal) { const c = sc.canal; Sv.initOil(G, [[c[0], c[1], c[2], 1, c[3]]]); const P = Sv.nearest(G, c[0], c[1]); if (P) P.canal = 1; }
    if (sc) for (const d of sc.nations) if (d.over) { const n = ID.byBase(G, d.key || d.base), o = ID.byBase(G, d.over); if (n && o) { Sv.bind(G, n, o, d.dep || 'protectorate', true); n.dep.script = 1; } }
    if (sc && ID.FRONTS && G.historical) {
      G.fronts = {};
      for (const k in ID.FRONTS) { const F = ID.FRONTS[k]; G.fronts[k] = { key: k, provs: Sv.provsAt(G, F.at, F.reach), str: F.str || 10, host: 0, sponsor: 0, state: 0, born: 0 }; }
    }
  };
  Sv.month = function (G) {
    for (const n of ID.alive(G)) {
      if (n.dep) depMonth(G, n);
      if (!n.bloc && !n.dep && ID.ideo(n).flags.nonAligned && G.tick % 360 === 0) n.cnt.nonaligned = (n.cnt.nonaligned || 0) + 1;
    }
    oilMonth(G);
    interveneMonth(G);
    frontMonth(G);
    // pan-national states call for union now and then (AI)
    if (G.rng.chance(0.08)) { const c = ID.alive(G).filter((n) => ID.ideo(n).flags.panNation && !n.dep && !human(G, n) && !n.nwars && n.stab > 40); if (c.length) Sv.proposeUnion(G, G.rng.pick(c)); }
    // AI: sell a concession when broke, nationalise when the mood turns
    for (const n of ID.alive(G)) {
      if (human(G, n) || !Sv.oilProvs(G, n).length) continue;
      const free = Sv.oilProvs(G, n).some((P) => !P.oilCo), foreign = Sv.oilProvs(G, n).some((P) => P.oilCo && P.oilCo !== n.id && G.nations[P.oilCo] && G.nations[P.oilCo].alive);
      if (free && n.gold < 60 && G.rng.chance(0.04)) { const b = ID.alive(G).filter((o) => o !== n && ID.rankOf(G, o, 'power') <= 5 && ID.op(G, n.id, o.id) > -10).sort((x, y) => D().power(y) - D().power(x))[0]; if (b) Sv.sell(G, n, b); }
      else if (foreign && !n.dep && ID.eraOf(G.tick) >= 2 && (ID.ideo(n).flags.nonAligned || ID.ideo(n).flags.panNation || ID.ideo(n).family === 'socialist' || n.ideo === 'revival') && G.rng.chance(0.03) && !(G.historical && n.flags.histOil)) Sv.nationaliseAll(G, n);
    }
  };
})();
