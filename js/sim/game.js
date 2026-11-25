/* IRON DIALECTIC — game loop, world statistics, victory and defeat, chronicle, save/load. No DOM. */
(function () {
  'use strict';
  const ID = (globalThis.ID = globalThis.ID || {});
  const clamp = ID.clamp, MAXN = ID.MAXN, B = ID.B;
  const Gm = (ID.Game = {});
  const V = (ID.Victory = {});

  /* ---------------------------------------------------------------- helpers used by objectives */
  ID.popShare = (G, pred) => { let s = 0; for (const n of G.nations) if (n && n.alive && pred(ID.ideo(n))) s += n.pop; return s / Math.max(1, G.stats.pop); };
  ID.campShare = (G, n) => { let s = 0; for (const o of G.nations) if (o && o.alive && (o === n || o.ideo === n.ideo || ID.sameBloc(G, n.id, o.id))) s += o.pop; return s / Math.max(1, G.stats.pop); };
  ID.blocCount = (G, n, pred) => { if (!n.bloc) return 0; let c = 0; for (const m of G.blocs[n.bloc].members) { const o = G.nations[m]; if (o !== n && o.alive && pred(ID.ideo(o))) c++; } return c; };
  ID.worldCount = (G, n, pred) => { let c = 0; for (const o of G.nations) if (o && o.alive && o !== n && pred(ID.ideo(o))) c++; return c; };
  ID.rankOf = (G, n, key) => { const r = G.stats.rank && G.stats.rank[key]; return r ? (r[n.id] || 99) : 99; };
  ID.claimShare = (G, n) => { if (!n.claims.length) return 0; let c = 0; for (const p of n.claims) if (G.provinces[p].owner === n.id) c++; return c / n.claims.length; };
  ID.tradeCoverage = (G, n) => { const others = ID.alive(G).length - 1; return others > 0 ? (n.ntrade || 0) / others : 0; };

  Gm.updateStats = function (G) {
    const st = G.stats; const ns = ID.alive(G);
    st.pop = 0; st.gdp = 0; st.trade = 0; st.tiles = 0; st.byIdeo = {}; st.byFam = {}; st.techMax = { ind: 0, mil: 0, agr: 0 };
    const vals = { ind: [], gdp: [], power: [], gdppc: [], pop: [], tiles: [], score: [] };
    const pcs = [];
    let totP = 0, kit = 0, men = 0;
    for (const n of ns) {
      st.pop += n.pop; st.gdp += n.gdp; st.trade += n.tradeInc; st.tiles += n.tiles;
      if (n.a.armsMade != null) { kit += n.a.armsMade + n.a.armsImp; men += n.troops; }
      const I = ID.ideo(n);
      (st.byIdeo[n.ideo] = st.byIdeo[n.ideo] || { n: 0, pop: 0, tiles: 0 }); st.byIdeo[n.ideo].n++; st.byIdeo[n.ideo].pop += n.pop; st.byIdeo[n.ideo].tiles += n.tiles;
      (st.byFam[I.family] = st.byFam[I.family] || { n: 0, pop: 0, tiles: 0 }); st.byFam[I.family].n++; st.byFam[I.family].pop += n.pop; st.byFam[I.family].tiles += n.tiles;
      for (const k of ['ind', 'mil', 'agr']) if (n.tech[k] > st.techMax[k]) st.techMax[k] = n.tech[k];
      const pw = ID.Diplomacy.power(n); n.a.power = pw; totP += pw;
      n.a.score = V.score(G, n);
      vals.ind.push([n.id, n.ind]); vals.gdp.push([n.id, n.gdp]); vals.power.push([n.id, pw]); vals.gdppc.push([n.id, n.gdppc || 0]); vals.pop.push([n.id, n.pop]); vals.tiles.push([n.id, n.tiles]); vals.score.push([n.id, n.a.score]);
      pcs.push((n.gdp / Math.max(1, n.pop)) * 1000);
    }
    const ref = men > 0 ? Math.max(0.02, kit / men) : 0.035; // the world's kit per soldier: equipment 100% means this much
    st.armsRef = st.armsRef ? st.armsRef + (ref - st.armsRef) * 0.05 : ref; // it drifts slowly, so your own changes are what you see
    st.rank = {};
    for (const k in vals) { vals[k].sort((a, b) => b[1] - a[1]); st.rank[k] = {}; vals[k].forEach((v, i) => { st.rank[k][v[0]] = i + 1; }); }
    st.top = vals.power.length ? vals.power[0][0] : 0;
    st.topShare = vals.power.length ? vals.power[0][1] / Math.max(1, totP) : 0;
    st.power = totP;
    pcs.sort((a, b) => a - b);
    if (!st.gdppcRef0 && pcs.length) st.gdppcRef0 = pcs[pcs.length >> 1] || 16;
    // the reference rises slowly with world development so growth registers as rising living standards
    st.gdppcRef = pcs.length ? st.gdppcRef0 * 0.15 + (pcs[pcs.length >> 1] || 16) * 0.85 : 16;
    st.count = ns.length;
  };

  V.score = function (G, n) {
    return n.pop * 0.02 + n.gdp * 1.2 + n.tiles * 0.06 + (n.tech.ind + n.tech.mil + n.tech.agr) * 25 + n.glory * 1.5 + n.stab * 1.5 + (n.bloc ? G.blocs[n.bloc].members.length * 20 : 0);
  };

  /* Progress toward each victory, for the interface. p is 0..1. */
  V.progress = function (G, n) {
    const I = ID.ideo(n), st = G.stats, out = [];
    out.push({ id: 'domination', name: 'Domination', desc: 'Hold 55% of the world’s land.', p: clamp(n.tiles / (G.landCount * 0.55), 0, 1), parts: [['World land held', n.tiles / G.landCount, 0.55, '%']] });
    const fam = st.byFam[I.family] ? st.byFam[I.family].pop / Math.max(1, st.pop) : 0;
    let largest = true; for (const o of G.nations) if (o && o.alive && o !== n && ID.ideo(o).family === I.family && o.pop > n.pop) largest = false;
    out.push({ id: 'ideological', name: 'Ideological victory', desc: '60% of the world’s people live under ' + ID.FAMILIES[I.family].name.toLowerCase() + ' systems, and yours is the largest such state.', p: clamp(fam / 0.6, 0, 1) * (largest ? 1 : 0.9), parts: [['World population under your family', fam, 0.6, '%'], ['You are its largest state', largest ? 1 : 0, 1]] });
    const gs = n.gdp / Math.max(1, st.gdp), tc = ID.tradeCoverage(G, n), hy = n.cnt.hegYears || 0;
    out.push({ id: 'hegemony', name: 'Economic hegemony', desc: '35% of world output and trade treaties with 60% of states, held for five years.', p: Math.min(clamp(gs / 0.35, 0, 1), clamp(tc / 0.6, 0, 1)) * 0.8 + (hy / 5) * 0.2, parts: [['Share of world output', gs, 0.35, '%'], ['Trade treaty coverage', tc, 0.6, '%'], ['Years held', hy, 5]] });
    const parts = I.objective.parts(n, G); let p = 0;
    for (const x of parts) p += clamp(x[1] / x[2], 0, 1);
    out.push({ id: 'objective', name: I.objective.name, desc: I.objective.desc, p: p / parts.length, parts, grand: true });
    return out;
  };

  V.yearly = function (G) {
    for (const n of ID.alive(G)) {
      const I = ID.ideo(n);
      if (I.objective.sustain) { if (I.objective.sustain(n, G)) n.cnt.sustain = (n.cnt.sustain || 0) + 1; else n.cnt.sustain = 0; }
      const heg = n.gdp / Math.max(1, G.stats.gdp) >= 0.35 && ID.tradeCoverage(G, n) >= 0.6;
      n.cnt.hegYears = heg ? (n.cnt.hegYears || 0) + 1 : 0;
    }
    if (G.over) return;
    const y = ID.yearOf(G.tick);
    for (const n of ID.alive(G)) {
      const pr = V.progress(G, n); let won = null;
      for (const v of pr) {
        if (n.id === G.player && G.won && G.won[Gm.winKey(n, v.id)]) continue; // already achieved: the campaign carries on
        let ok = v.p >= 0.999;
        if (v.id === 'objective') ok = v.parts.every((x) => x[1] >= x[2]);
        if (v.id === 'ideological') ok = v.parts.every((x) => x[1] >= x[2]);
        if (v.id === 'hegemony') ok = v.parts.every((x) => x[1] >= x[2]);
        if (ok) { won = v; break; }
      }
      if (!won) continue;
      if (n.id === G.player) { Gm.victory(G, won.id, won.name); return; }
      if (won.id === 'domination' && G.ack && G.ack['dom' + n.id]) continue;
      if (won.id === 'domination') { if (G.player) { Gm.defeat(G, 'eclipsed', { by: n.id, how: won.name }); return; } G.over = { result: 'ai', type: won.id, by: n.id, year: y }; return; }
    }
    if (y >= ID.END_YEAR && !G.endless) {
      const pl = G.nations[G.player];
      if (pl && pl.alive) { const rk = ID.rankOf(G, pl, 'score'); if (rk === 1) Gm.victory(G, 'verdict', 'The Verdict of History'); else Gm.end(G, 'survived', 'verdict', { rank: rk }); }
      else if (!G.player) G.over = { result: 'time', type: 'verdict', year: y };
    }
  };

  /* ---------------------------------------------------------------- endings */
  const ADVICE = {
    workers: 'Workers turn when living standards fall or their organisations are banned. Welfare spending, a wage decree, or a freer labour law would have bought time.',
    peasants: 'Peasants turn over land, rent, famine and conscription. A land law they could live with, lower rent, or a smaller army would have kept the countryside quiet.',
    capital: 'Capital turns over taxes, nationalisation and disorder. Either keep it comfortable or reduce its power before you squeeze it.',
    military: 'The army turns when it is starved of money and glory, or when a general outshines the state. Fund it, purge it, or keep it too busy to plot.',
    clergy: 'The clergy turn when the law turns against the faith. Where they are powerful, secularise slowly or not at all.',
    intelligentsia: 'The intelligentsia turn over censorship and repression. They are few, but research and foreign opinion follow them.',
    bureaucracy: 'The apparatus turns when it is purged or starved. Without it nothing you order actually happens.',
  };
  function postMortem(G, n, type, info) {
    const I = ID.ideo(n); const lines = [];
    let turned = null;
    for (const f of ID.FACTION_IDS) if (n.fp[f] > 9 && (!turned || n.fs[f] - n.fp[f] * 0.5 < n.fs[turned] - n.fp[turned] * 0.5)) turned = f;
    if (turned && n.fs[turned] >= 40) turned = null;
    let head = '', cause = '';
    switch (type) {
      case 'coup': head = 'Overthrown by a coup'; cause = 'The army seized the state' + (info.backer ? ', with money from ' + G.nations[info.backer].name : '') + ' and proclaimed ' + ID.IDEOLOGIES[info.ideo].name + '. Military support stood at ' + Math.round(n.fs.military) + ' with ' + Math.round(n.fp.military) + '% of political power; stability was ' + Math.round(n.stab) + ' and legitimacy ' + Math.round(n.legit) + '.'; turned = 'military'; break;
      case 'revolution': head = 'Swept away by revolution'; cause = 'A movement for ' + ID.IDEOLOGIES[info.ideo].name + ' rose across ' + Math.round(info.share * 100) + '% of the country and the regime had no one left to defend it. Stability was ' + Math.round(n.stab) + '; the army’s support was ' + Math.round(n.fs.military) + '.'; break;
      case 'civilwar': head = 'Defeated in civil war'; cause = 'The other government won. ' + (info.by ? G.nations[info.by].name + ' now rules the whole country.' : ''); break;
      case 'conquered': head = 'Conquered'; cause = (info.by ? G.nations[info.by].name : 'An enemy') + ' broke your armies and took the capital. You held ' + n.tiles + ' tiles at the end, from a peak of ' + n.peakTiles + '.'; break;
      case 'disintegration': head = 'The state dissolved'; cause = 'Stability stayed at zero for most of a year. Ministries stopped answering, provinces stopped paying, and one morning there was no government left to overthrow.'; break;
      case 'eclipsed': head = 'Eclipsed'; cause = G.nations[info.by].name + ' achieved ' + info.how + '. The century belongs to someone else.'; break;
      default: head = 'The regime has fallen'; cause = '';
    }
    lines.push(cause);
    const recent = n.log.slice(-7);
    const fname = turned ? ID.factionName(n, turned) : '';
    const dem = turned && n.a.dem && n.a.dem[turned] ? n.a.dem[turned].slice().sort((a, b) => a[1] - b[1]).filter((x) => x[1] < -2).slice(0, 3) : [];
    return {
      head, cause, turned, fname,
      demands: dem.map((x) => x[0] + ' (' + Math.round(x[1]) + ')'),
      support: turned ? Math.round(n.fs[turned]) : 0, power: turned ? Math.round(n.fp[turned]) : 0,
      timeline: recent.map((x) => ({ date: ID.dateOf(x.t).short, text: x.text })),
      advice: type === 'conquered' ? 'Wars are lost before they start: in alliances not made, forts not built, and troops committed on one front while another lay open. Watch the supply map — encircled pockets take their soldiers with them.'
        : type === 'eclipsed' ? 'A runaway rival has to be stopped early: join or found a coalition while its threat is high, and fund the opposition inside it.'
        : type === 'disintegration' ? 'Stability is legitimacy plus the support of whoever holds power. When your ideology’s legitimacy source fails, nothing else holds the floor up.'
        : turned ? ADVICE[turned] : '',
      legit: Object.keys(I.legit).map((k) => [ID.LEGIT[k].name, Math.round(n.src[k]), Math.round(I.legit[k] * 100)]),
      stats: { stab: Math.round(n.stab), legit: Math.round(n.legit), unrest: Math.round(n.a.unrest || 0), we: Math.round(n.we), ls: Math.round(n.ls), grievance: Math.round(n.grievance) },
    };
  }
  /* Observer mode: the AI plays every state and G.player is only the camera. Nothing ends the watch: when the
     followed state falls the camera moves to the strongest one left, a victory is news, and 1976 is passed by. */
  Gm.strongest = (G, not) => ID.alive(G).filter((x) => x.id !== not).sort((a, b) => ID.Diplomacy.power(b) - ID.Diplomacy.power(a))[0] || null;
  Gm.follow = function (G, id) {
    const n = G.nations[id]; if (!n || !n.alive) return;
    for (const x of G.nations) if (x) x.ai = true;
    G.player = id; G.dirtyAll = true; G.uiDirty = true;
  };
  Gm.observe = function (G, id) {
    G.observer = true; G.autoPlayer = true; G.endless = true; G.evq.length = 0; if (G.tray) G.tray.length = 0;
    Gm.follow(G, id && G.nations[id] && G.nations[id].alive ? id : (Gm.strongest(G) || {}).id);
  };
  Gm.defeat = function (G, type, info) {
    if (G.over) return;
    const n = G.nations[G.player]; if (!n) return;
    if (G.observer) {
      if (type === 'eclipsed' && info && info.by) { (G.ack = G.ack || {})['dom' + info.by] = 1; ID.news(G, G.nations[info.by].name + ' now dominates the world.', 'war', info.by); return; }
      const s = Gm.strongest(G, n.id); if (s) { ID.news(G, n.name + ' has fallen. The camera follows ' + s.name + '.', 'pol', s.id); Gm.follow(G, s.id); }
      return;
    }
    const pm = postMortem(G, n, type, info || {});
    ID.chron(G, 'end', n.name + ': ' + pm.head.toLowerCase() + '.', n.id);
    G.over = { result: 'defeat', type, info: info || {}, pm, year: ID.yearOf(G.tick), nation: n.id };
    ID.sfx(G, 'defeat');
  };
  /* a grand objective belongs to an ideology: winning one does not forbid winning another system's later */
  Gm.winKey = (n, type) => (type === 'objective' ? 'objective:' + n.ideo : type);
  Gm.victory = function (G, type, name) {
    if (G.over) return;
    const n = G.nations[G.player];
    (G.won = G.won || {})[Gm.winKey(n, type)] = ID.yearOf(G.tick);
    if (G.observer) { ID.chron(G, 'end', n.name + ' achieves ' + name + '.', n.id); ID.news(G, n.name + ' achieves ' + name + '.', 'good', n.id); return; }
    ID.chron(G, 'end', n.name + ' achieves ' + name + '.', n.id);
    G.over = { result: 'victory', type, name, year: ID.yearOf(G.tick), nation: n.id };
    ID.sfx(G, 'victory');
  };
  /* Nothing has to end the campaign while the player's state still stands: after a victory, after another power's
     domination, at the close of the century, or after losing power to a coup or a revolution (the player then
     leads the new regime), the player may carry on. */
  Gm.canCarryOn = function (G) {
    const o = G.over, n = o && G.nations[G.player];
    if (!n || !n.alive || G.tut) return false;
    return o.result !== 'defeat' || o.type === 'eclipsed' || ((o.type === 'coup' || o.type === 'revolution') && o.info && ID.IDEOLOGIES[o.info.ideo]);
  };
  Gm.carryOn = function (G) {
    if (!Gm.canCarryOn(G)) return false;
    const o = G.over, n = G.nations[G.player];
    G.over = null;
    if (o.result === 'defeat' && (o.type === 'coup' || o.type === 'revolution')) { ID.Politics.changeIdeology(G, n, o.info.ideo, o.type, o.info.backer); ID.chron(G, 'carry', 'The new rulers of ' + n.name + ' take up the government.', n.id); }
    else if (o.type === 'eclipsed') { (G.ack = G.ack || {})['dom' + o.info.by] = 1; ID.chron(G, 'carry', n.name + ' refuses to accept the verdict and fights on.', n.id); }
    else if (o.type === 'verdict' || o.result === 'survived') { G.endless = true; ID.chron(G, 'carry', 'The century closes, and ' + n.name + ' goes on.', n.id); }
    else ID.chron(G, 'carry', n.name + ' carries on after ' + (o.name || 'its triumph') + '.', n.id);
    G.paused = true; G.uiDirty = true;
    return true;
  };
  Gm.end = function (G, result, type, info) { if (G.over) return; G.over = { result, type, info, year: ID.yearOf(G.tick), nation: G.player }; };

  /* Chronicle summary for the end screen. */
  Gm.chronicle = function (G) {
    const n = G.nations[G.over && G.over.nation ? G.over.nation : G.player];
    const count = (t) => G.chronicle.filter((c) => c.type === t).length;
    const mine = G.chronicle.filter((c) => c.a === n.id || c.b === n.id || c.type === 'world' || c.type === 'end');
    const fate = G.stats.byIdeo[n.ideo] || { n: 0, pop: 0 };
    const Istart = ID.IDEOLOGIES[n.a.startIdeo || n.ideo];
    return {
      nation: n, entries: mine, all: G.chronicle,
      wars: count('war'), revolutions: G.chronicle.filter((c) => c.type === 'ideology' && /revolution|coup/.test(c.text)).length, civilWars: Math.ceil(count('civilwar') / 2), conquests: count('conquest'), nukes: count('nuke'),
      fate: { name: ID.ideo(n).name, n: fate.n, share: fate.pop / Math.max(1, G.stats.pop), started: Istart.name, changed: Istart.id !== n.ideo },
      peak: n.peakTiles, start: n.startTiles, now: n.tiles, years: ID.yearOf(G.tick) - ID.yearOf(G.startTick || 0),
      losses: n.losses, kills: n.kills,
    };
  };

  /* ---------------------------------------------------------------- the loop */
  Gm.month = function (G) {
    ID.recalcProvinceOwners(G); ID.recalcBorders(G);
    ID.structMonth(G);
    ID.Economy.worldMonth(G);
    // a state whose last province broke away no longer exists
    for (const n of ID.alive(G)) if (n.tiles <= 0) {
      if (n.id === G.player && !G.autoPlayer) { Gm.defeat(G, 'disintegration', {}); return; }
      ID.Diplomacy.eliminate(G, n, G.nations[G.owner[n.capital]] || null);
    }
    // dispatches left in the tray are settled by the ministers after three months
    if (G.tray && G.tray.length) for (let k = G.tray.length - 1; k >= 0; k--) if (G.tick - G.tray[k].t > 90 || k < G.tray.length - 6) ID.Events.choose(G, -1, k, true);
    const ns = ID.alive(G);
    for (const n of ns) if (n.alive) { ID.Doctrine.month(G, n); if (n.alive) ID.Regime.month(G, n); if (n.alive) ID.Economy.month(G, n); }
    ID.Politics.provinces(G);
    for (const n of ns) { if (n.alive) ID.Politics.month(G, n); if (G.over) return; }
    for (const n of ns) if (n.alive) { ID.Diplomacy.opsMonth(G, n); ID.Events.month(G, n); }
    ID.Diplomacy.month(G);
    if (ID.Sov) ID.Sov.month(G);
    for (const n of ns) if (n.alive && (n.ai || G.autoPlayer)) ID.AI.month(G, n);
    ID.Story.month(G);
    ID.Combat.tickRadiation(G);
    if (G.offers && G.offers.length) G.offers = G.offers.filter((o) => o.until > G.tick && G.nations[o.from].alive && (o.kind === 'peace') === ID.atWar(G, o.from, G.player));
    Gm.updateStats(G);
    const era = ID.eraOf(G.tick);
    if (era !== G.era) {
      G.era = era;
      if (G.tick > 0) { ID.news(G, 'A NEW ERA: the ' + ID.ERAS[era].name + ' begins. ' + ID.ERAS[era].desc, 'era'); ID.headline(G, { kicker: ID.ERAS[era].from + '', title: 'The ' + ID.ERAS[era].name, sub: ID.ERAS[era].desc, tone: 'era' }); ID.chron(G, 'world', 'The ' + ID.ERAS[era].name + ' begins.'); ID.sfx(G, 'era'); }
    }
    if (ID.Press) ID.Press.month(G);
    if (ID.Secret) ID.Secret.month(G);
    if (G.challengeMods) G.challengeMods(G);
    if (G.tick % 360 === 0) { V.yearly(G); G.wantAutosave = true; }
    if (!G.headless) G.uiDirty = true;
  };
  Gm.tick = function (G) {
    if (G.over) return;
    G.tick++;
    ID.Combat.tick(G);
    ID.tickBuilds(G);
    const ns = G.nations;
    for (let i = 1; i < ns.length; i++) { const n = ns[i]; if (n.alive) ID.Combat.tickPop(G, n); }
    ID.Politics.tickVotes(G);
    { const pn = ns[G.player]; if (pn && pn.coupNow) ID.Coup.day(G, pn); }
    if ((G.tick & 3) === 0) for (let i = 1; i < ns.length; i++) { const n = ns[i]; if (n.alive && n.nwars && (n.ai || G.autoPlayer)) ID.AI.war(G, n); }
    if (G.tick % 5 === 0) ID.Focus.tick(G);
    if (G.tick % 30 === 0) Gm.month(G);
  };

  /* ---------------------------------------------------------------- save / load */
  function rle(arr) { const out = []; let v = arr[0], c = 1; for (let i = 1; i < arr.length; i++) { if (arr[i] === v) c++; else { out.push(v, c); v = arr[i]; c = 1; } } out.push(v, c); return out; }
  function unrle(list, arr) { let p = 0; for (let i = 0; i < list.length; i += 2) { arr.fill(list[i], p, p + list[i + 1]); p += list[i + 1]; } }
  Gm.save = function (G) {
    const nN = G.nations.length;
    const rel = []; for (let a = 1; a < nN; a++) for (let b = 1; b < nN; b++) rel.push(Math.round(G.rel[a * MAXN + b]));
    const o = {
      v: 1, seed: G.seed, size: G.size, scenario: G.scenario, map: G.map, difficulty: G.difficulty, challenge: G.challenge, ironman: G.ironman, tick: G.tick, startTick: G.startTick || 0, speed: G.speed, rng: G.rng.s, era: G.era,
      owner: rle(G.owner), bld: rle(G.bld), hp: rle(G.hp), rad: G.radList.map((i) => [i, G.rad[i]]),
      nations: G.nations, player: G.player, rel,
      prov: G.provinces.slice(1).map((P) => [P.core, Math.round(P.unrest * 10) / 10, P.opp, Math.round(P.oppStr * 10) / 10, Math.round(P.integ), P.lastOwner, P.sponsor, P.oil || 0, P.oilFound || 0, P.oilCo || 0, P.oilShare || 0, P.oilAt || 0, P.canal || 0]), fronts: G.fronts || null,
      attacks: G.attacks.map((a) => ({ id: a.id, from: a.from, to: a.to, troops: a.troops, committed: a.committed, style: a.style, amphib: a.amphib, taken: a.taken, pk: a.pk, enc: a.enc, bo: a.bo, bd: a.bd, out: a.out, holdX: a.holdX, give: a.give, last: a.last, pobj: a.pobj })),
      boats: G.boats, missiles: G.missiles, builds: G.builds, dip: G.dip, blocs: G.blocs, news: G.news.slice(-60), chronicle: G.chronicle, world: G.world, flags: G.flags,
      evq: G.evq, tray: G.tray || [], votes: G.votes, nextId: G.nextId, over: G.over, won: G.won || null, ack: G.ack || null, endless: !!G.endless, observer: !!G.observer, autoPlayer: !!G.autoPlayer, tut: G.tut, offers: G.offers || [], shock: G.shock || [], historical: !!G.historical, story: G.story || null, beach: G.beach || [], press: G.press || null, pow: G.pow || null,
    };
    return JSON.stringify(o, (k, v) => (k === 'dem' || k === 'lsHist' ? undefined : typeof v === 'number' && !Number.isInteger(v) ? Math.round(v * 1000) / 1000 : v));
  };
  Gm.load = function (str) {
    const o = typeof str === 'string' ? JSON.parse(str) : str;
    const sc = o.scenario === 'custom' ? o.map : o.scenario && o.scenario !== 'random' ? ID.SCENARIOS[o.scenario] : null;
    if (o.scenario === 'custom' && !sc) throw new Error('This save is on a custom map but carries no map.');
    const map = ID.genMap(ID.mapOpts(sc, o.seed, o.size));
    const N = map.N;
    const G = {
      v: 1, seed: o.seed, size: o.size, scenario: o.scenario, map: o.scenario === 'custom' ? sc : undefined, difficulty: o.difficulty, headless: false, challenge: o.challenge, ironman: o.ironman, rng: new ID.RNG(1), tick: o.tick, startTick: o.startTick || 0, speed: o.speed || 2, paused: true, era: o.era,
      W: map.W, H: map.H, N, terrain: map.terrain, river: map.river, coast: map.coast, prov: map.prov, provinces: map.provinces, landCount: map.landCount,
      owner: new Uint8Array(N), bld: new Uint8Array(N), hp: new Uint8Array(N), cut: new Uint8Array(N), cutAge: new Uint8Array(N), fortCov: new Uint8Array(N), fortQ: new Uint8Array(N), rad: new Uint8Array(N),
      nations: o.nations, player: o.player, attacks: [], boats: o.boats || [], missiles: o.missiles || [], builds: o.builds || [], blist: [],
      dip: o.dip || {}, warM: new Uint8Array(MAXN * MAXN), rel: new Float32Array(MAXN * MAXN), blocs: o.blocs, wars: [], border: [],
      news: o.news || [], chronicle: o.chronicle || [], stats: { pop: 1, gdp: 1, trade: 1, byIdeo: {}, byFam: {} }, world: o.world,
      flags: o.flags || {}, dirty: [], dirtyAll: true, radList: [], mapMode: 'political', fx: [], sfx: [], capLost: [], evq: o.evq || [], tray: o.tray || [], votes: o.votes || [], over: o.over || null, won: o.won || null, ack: o.ack || null, endless: !!o.endless, observer: !!o.observer, autoPlayer: !!o.autoPlayer, nextId: o.nextId || 1, fortsDirty: true, tut: o.tut || null, offers: o.offers || [], shock: o.shock || [], beach: o.beach || [], press: o.press || null, pow: o.pow || null,
    };
    G.rng.s = o.rng >>> 0;
    G.historical = !!o.historical; G.story = o.story || null; G.fronts = o.fronts || null; if (G.historical && !G.story) ID.Story.init(G);
    for (const n of G.nations) if (n && !n.key) n.key = n.base; // saves from before the key split: the display name was the key
    if (sc) for (const n of G.nations) if (n && !n.tree && !n.civilOf && ID.FOCUS.nations[n.key]) n.tree = n.key; // saves from before programmes existed
    ID.Custom.setRen(G);
    unrle(o.owner, G.owner); unrle(o.bld, G.bld); if (o.hp) unrle(o.hp, G.hp); else for (let i = 0; i < N; i++) if (G.bld[i]) G.hp[i] = 100; // saves from before building condition
    for (const [i, v] of o.rad || []) { G.rad[i] = v; G.radList.push(i); }
    for (let p = 1; p < G.provinces.length; p++) {
      const P = G.provinces[p], s = o.prov[p - 1];
      P.cnt = {}; P.core = s[0]; P.unrest = s[1]; P.opp = s[2]; P.oppStr = s[3]; P.integ = s[4]; P.lastOwner = s[5]; P.sponsor = s[6]; P.oil = s[7] || 0; P.oilFound = s[8] || 0; P.oilCo = s[9] || 0; P.oilShare = s[10] || 0; P.oilAt = s[11] || 0; P.canal = s[12] || 0; if (sc && sc.region && o.size === sc.size && P.cy >= sc.region.y * G.H) P.region = sc.region.key; P.nCity = 0; P.nFact = 0; P.owner = 0; P.urban = 0.06;
    }
    for (let i = 0; i < N; i++) {
      const ow = G.owner[i]; if (ow) { const P = G.provinces[G.prov[i]]; P.cnt[ow] = (P.cnt[ow] || 0) + 1; }
      const b = G.bld[i]; if (b) { G.blist.push(i); const P = G.provinces[G.prov[i]]; if (b === B.CITY) P.nCity++; else if (b === B.FACTORY) P.nFact++; }
    }
    for (let p = 1; p < G.provinces.length; p++) { const P = G.provinces[p]; let best = 0, bc = 0; for (const k in P.cnt) if (P.cnt[k] > bc) { bc = P.cnt[k]; best = +k; } P.owner = best; P.urban = clamp(0.06 + P.nCity * 0.32 + P.nFact * 0.12, 0, 0.92); }
    const nN = G.nations.length; let k = 0;
    for (let a = 1; a < nN; a++) for (let b = 1; b < nN; b++) G.rel[a * MAXN + b] = o.rel[k++];
    for (const key in G.dip) if (G.dip[key].war) { const w = G.dip[key].war; G.warM[w.a * MAXN + w.b] = G.warM[w.b * MAXN + w.a] = 1; }
    G._mark = new Int32Array(N);
    for (const a of o.attacks || []) { a.heap = new ID.Heap(); a.prog = 0; a.base = G.tick; a.scan = -999; a.idle = 0; G.attacks.push(a); }
    ID.recalcBorders(G); ID.recomputeForts(G); ID.structMonth(G, true);
    for (const n of G.nations) if (n && n.alive) ID.Combat.refresh(G, n);
    ID.Combat.updateSupply(G); Gm.updateStats(G); ID.Custom.restore(G);
    // saves from before the coup model (session 15): a coup waiting in the queue is fought out anew
    for (const e of G.evq.slice()) { const n = G.nations[e.n]; if (e.id === 'coup' && n && n.alive && !n.coupNow) { G.evq.splice(G.evq.indexOf(e), 1); ID.Coup.launch(G, n, e.ctx && e.ctx.backer ? { src: 'foreign', backer: e.ctx.backer } : { src: 'army' }); } }
    return G;
  };
})();
