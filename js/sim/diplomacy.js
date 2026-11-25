/* IRON DIALECTIC — diplomacy: wars, peace, capitulation, blocs, treaties, covert operations. No DOM. */
(function () {
  'use strict';
  const ID = (globalThis.ID = globalThis.ID || {});
  const clamp = ID.clamp, MAXN = ID.MAXN, B = ID.B;
  const D = (ID.Diplomacy = {});

  D.warOf = (G, a, b) => { const d = G.dip[ID.dkey(a, b)]; return d && d.war ? d.war : null; };
  D.enemies = (G, n) => { const out = []; for (const o of G.nations) if (o && o.alive && o.id !== n.id && ID.atWar(G, n.id, o.id)) out.push(o); return out; };
  D.power = (n) => n.troops * (n.a.atk || 1) + n.pop * 0.02 + n.ind * 2;

  /* ---------------------------------------------------------------- casus belli */
  D.casusBelli = function (G, A, Bn) {
    const I = ID.ideo(A);
    for (let p = 1; p < G.provinces.length; p++) { const Pr = G.provinces[p]; if (Pr.owner === Bn.id && Pr.core === A.id) return 'cores'; }
    if (A.claims.length) for (const p of A.claims) if (G.provinces[p].owner === Bn.id) return 'claims';
    for (const o of G.nations) if (o && o.alive && o.id !== A.id && ID.sameBloc(G, A.id, o.id) && ID.atWar(G, o.id, Bn.id)) return 'ally';
    if (Bn.threat > 60) return 'coalition';
    if (I.dip.cb.indexOf('holy') >= 0 && (Bn.laws.religion === 'secular' || Bn.laws.religion === 'atheism')) return 'holy';
    if (I.dip.cb.indexOf('liberate') >= 0 && Bn.a.mv && Bn.a.mv.ideo && ID.IDEOLOGIES[Bn.a.mv.ideo].family === I.family && (Bn.a.opp || 0) > 30) return 'liberate';
    if (I.dip.cb.indexOf('liberate') >= 0 && (Bn.a.opp || 0) > 45 && ID.ideo(Bn).family !== I.family) return 'liberate';
    if (I.dip.cb.indexOf('containment') >= 0 && Bn.threat > 35) return 'containment';
    return null;
  };
  D.CB_NAMES = { cores: 'Reclaim our provinces', claims: 'Press our claims', ally: 'Defend an ally', coalition: 'Coalition against a menace', holy: 'Holy war', liberate: 'Liberate the oppressed', containment: 'Containment', civil: 'Civil war', independence: 'War of independence', alliance: 'Alliance obligations', order: 'Restore order', none: 'Naked aggression' };

  /* Why can't A declare war on B? '' if it can. */
  D.warBlock = function (G, A, Bn) {
    if (!Bn.alive) return 'That state no longer exists.';
    if (ID.atWar(G, A.id, Bn.id)) return 'Already at war.';
    const d = ID.dipOf(G, A.id, Bn.id);
    if (d.truce > G.tick) return 'Truce until ' + ID.dateOf(d.truce).short + '.';
    if (ID.sameBloc(G, A.id, Bn.id)) return 'You are in the same bloc. Leave it first.';
    if (ID.Sov && A.dep && A.dep.over === Bn.id && A.dep.kind !== 'client') return 'A dependency breaks free by rising, not by declaring war (see Sovereignty).';
    if (ID.Sov && A.dep && A.dep.over !== Bn.id && ID.Sov.vetoes(G, A, 'war')) return 'Your overlord, ' + G.nations[A.dep.over].name + ', forbids it.';
    if (ID.Sov && Bn.dep && Bn.dep.over === A.id && Bn.dep.kind !== 'client') return Bn.base + ' is your own dependency.';
    return '';
  };

  D.startWar = function (G, A, Bn, cb) {
    if (ID.atWar(G, A.id, Bn.id) || A === Bn) return;
    const d = ID.dipOf(G, A.id, Bn.id);
    const brokeNap = d.nap;
    const total = cb === 'civil' || cb === 'independence' || cb === 'liberate' || cb === 'holy' || cb === 'coalition' || Bn.tiles < 450 || ID.ideo(A).dip.agg >= 0.8;
    d.war = { a: A.id, b: Bn.id, start: G.tick, ta: 0, tb: 0, cb: cb || 'none', aim: total ? 'total' : 'limited' };
    d.nap = 0; d.trade = 0; d.truce = 0;
    G.warM[A.id * MAXN + Bn.id] = G.warM[Bn.id * MAXN + A.id] = 1;
    for (const n of [A, Bn]) { if (!n.nwars) { n.a.warTiles = n.tiles; n.a.warInd = n.ind; n.a.capLost = 0; } n.nwars++; }
    Bn.a.defensive = true; if (A.nwars === 1) A.a.defensive = false;
    ID.addOpBoth(G, A.id, Bn.id, -60);
    G.world.tension = Math.min(100, G.world.tension + 2);
    if (cb !== 'civil' && cb !== 'independence' && cb !== 'alliance') {
      A.threat += cb && cb !== 'none' ? 4 : 13;
      if (brokeNap) { A.threat += 15; for (const o of G.nations) if (o && o.alive && o !== A) ID.addOp(G, o.id, A.id, -18); ID.news(G, A.name + ' tears up its pact with ' + Bn.name + '.', 'bad', A.id, Bn.id); }
      if ((!cb || cb === 'none') && ID.ideo(A).elections) A.mandate = Math.max(0, A.mandate - 6);
      for (const o of G.nations) if (o && o.alive && o !== A && o !== Bn && ID.op(G, o.id, Bn.id) > 30) ID.addOp(G, o.id, A.id, -12);
      ID.news(G, 'WAR: ' + A.name + ' declares war on ' + Bn.name + ' (' + D.CB_NAMES[cb || 'none'] + ').', 'war', A.id, Bn.id);
      ID.chron(G, 'war', A.name + ' declares war on ' + Bn.name + '.', A.id, Bn.id);
      if (ID.Press) ID.Press.war(G, A, Bn, cb);
      if (A.id === G.player) ID.headline(G, { kicker: 'Mobilisation', title: 'War with ' + Bn.base, sub: A.name + ' declares war on ' + Bn.name + '. ' + D.CB_NAMES[cb || 'none'] + '.', a: A.id, b: Bn.id, tone: 'war' });
      else if (Bn.id === G.player) ID.headline(G, { kicker: 'Invasion', title: Bn.base + ' attacked', sub: A.name + ' has declared war on us. The army stands to the frontier.', a: A.id, b: Bn.id, tone: 'war' });
      else if (ID.isMajor(G, A) && ID.isMajor(G, Bn)) ID.headline(G, { kicker: 'The powers collide', title: A.base + ' against ' + Bn.base, sub: 'Two of the world’s great powers are at war.', a: A.id, b: Bn.id, tone: 'war' });
      if (A.id === G.player || Bn.id === G.player) ID.sfx(G, 'war');
      // balance of power: rivals of the aggressor may step in for a much weaker victim
      if (D.power(Bn) < D.power(A) * 0.6 && cb !== 'coalition') {
        for (const o of G.nations) {
          if (!o || !o.alive || o === A || o === Bn || o.nwars || ID.sameBloc(G, o.id, A.id) || ID.atWar(G, o.id, Bn.id)) continue;
          if (!(o.ai || G.autoPlayer) || ID.op(G, o.id, A.id) > -22 || D.power(o) < D.power(A) * 0.55 || o.stab < 38) continue;
          if (!ID.borders(G, o.id, A.id) && !ID.borders(G, o.id, Bn.id)) continue;
          if (D.warBlock(G, o, A) || ID.dipOf(G, o.id, A.id).nap) continue;
          if (G.rng.chance(0.3 + (ID.op(G, o.id, Bn.id) > 10 ? 0.2 : 0))) {
            ID.news(G, o.name + ' intervenes to protect ' + Bn.name + '.', 'dip', o.id, Bn.id);
            D.startWar(G, o, A, 'containment'); ID.addOpBoth(G, o.id, Bn.id, 25);
          }
        }
      }
      // an overlord defends its dependency (a union's senior partner is already at war through the union)
      if (ID.Sov && Bn.dep && Bn.dep.kind !== 'union') {
        const ov = G.nations[Bn.dep.over];
        if (ov && ov.alive && ov !== A && !ID.atWar(G, ov.id, A.id) && !D.warBlock(G, ov, A)) {
          if (ov.id === G.player && !G.autoPlayer) ID.Events.queue(G, ov, 'ally_attacked', { ally: Bn.id, enemy: A.id });
          else if (G.rng.chance(0.75)) D.startWar(G, ov, A, 'alliance');
        }
      }
      // defender's bloc is called in
      if (Bn.bloc) {
        const bl = G.blocs[Bn.bloc];
        for (const mid of bl.members.slice()) {
          const m = G.nations[mid]; if (!m || !m.alive || m === Bn || m === A || ID.atWar(G, m.id, A.id)) continue;
          if (m.id === G.player) ID.Events.queue(G, m, 'ally_attacked', { ally: Bn.id, enemy: A.id });
          else if (ID.op(G, m.id, Bn.id) > 10 && (bl.leader === m.id || ID.borders(G, m.id, A.id) || ID.borders(G, m.id, Bn.id) || m.nb[B.PORT]) && G.rng.chance(0.7)) D.startWar(G, m, A, 'alliance'); // defending an ally: members who cannot reach the war stay out
          else if (G.rng.chance(0.3)) D.leaveBloc(G, m, false);
        }
      }
    }
    if (!G.headless) G.dirtyAll = true;
  };

  D.resolveWarVote = function (G, n, v) {
    const t = G.nations[v.target]; if (!t || !t.alive || D.warBlock(G, n, t)) return;
    const res = ID.Politics.vote(G, n, 'war', { target: t.id, cb: v.cb });
    if (res.pass) D.startWar(G, n, t, v.cb || 'none');
    else if (n.id === G.player) ID.news(G, 'The ' + ID.ideo(n).control.body + ' votes against war with ' + t.name + ' (' + Math.round(res.yes) + '% in favour).', 'pol', n.id);
  };
  /* Player/AI entry point. Returns '' if war started or a vote was scheduled; else the reason. */
  D.declare = function (G, A, Bn) {
    const why = D.warBlock(G, A, Bn); if (why) return why;
    const I = ID.ideo(A), cb = D.casusBelli(G, A, Bn);
    if (I.control.warVote && !A.emergency) {
      const res = ID.Politics.vote(G, A, 'war', { target: Bn.id, cb });
      if (I.control.type === 'assembly') {
        if (!res.pass) return 'The ' + I.control.body + ' will not vote for this war (' + Math.round(res.yes) + '% in favour).';
        for (const v of G.votes) if (v.n === A.id && v.kind === 'war' && v.target === Bn.id) return 'The ' + I.control.body + ' is already debating it.';
        G.votes.push({ n: A.id, kind: 'war', target: Bn.id, cb, at: G.tick + (I.control.delay || 30) });
        if (A.id === G.player) ID.news(G, 'The ' + I.control.body + ' opens debate on war with ' + Bn.name + '. A decision is due ' + ID.dateOf(G.tick + I.control.delay).str + '.', 'pol', A.id);
        return '';
      }
      if (!res.pass) { A.auth = Math.max(0, A.auth - 5); return 'The ' + I.control.body + ' rejects the declaration (' + Math.round(res.yes) + '% in favour).'; }
    } else if (I.control.griev && !cb) A.grievance = Math.min(100, A.grievance + I.control.griev * 2);
    D.startWar(G, A, Bn, cb || 'none');
    return '';
  };

  /* War score from A's point of view: -1..1 */
  D.warScore = function (G, A, Bn) {
    const w = D.warOf(G, A.id, Bn.id); if (!w) return 0;
    const mine = w.a === A.id ? w.ta : w.tb, theirs = w.a === A.id ? w.tb : w.ta;
    const base = Math.max(150, Math.min(A.a.warTiles || A.tiles, Bn.a.warTiles || Bn.tiles));
    return clamp((mine - theirs) / base, -1, 1);
  };

  D.endWarState = function (G, A, Bn, truce) {
    const d = ID.dipOf(G, A.id, Bn.id); if (!d.war) return;
    d.war = 0; if (truce) d.truce = G.tick + 8 * 360; // eight years: peace should last long enough to be felt
    A.a.lastPeace = Bn.a.lastPeace = G.tick;
    G.warM[A.id * MAXN + Bn.id] = G.warM[Bn.id * MAXN + A.id] = 0;
    A.nwars = Math.max(0, A.nwars - 1); Bn.nwars = Math.max(0, Bn.nwars - 1);
    ID.Combat.release(G, A, Bn);
    if (A.objs) delete A.objs[Bn.id]; if (Bn.objs) delete Bn.objs[A.id];
    for (let k = G.boats.length - 1; k >= 0; k--) { const bt = G.boats[k], o = G.owner[bt.target]; if ((bt.owner === A.id && o === Bn.id) || (bt.owner === Bn.id && o === A.id)) { G.boats.splice(k, 1); const w = G.nations[bt.owner]; if (w.alive) w.troops += bt.troops; } }
    for (let k = G.attacks.length - 1; k >= 0; k--) {
      const a = G.attacks[k];
      if ((a.from === A.id && a.to === Bn.id) || (a.from === Bn.id && a.to === A.id)) { G.attacks.splice(k, 1); const o = G.nations[a.from]; if (o.alive) o.troops += a.troops; }
    }
  };
  D.peace = function (G, A, Bn) {
    const w = D.warOf(G, A.id, Bn.id); if (!w) return;
    const s = D.warScore(G, A, Bn);
    D.endWarState(G, A, Bn, true);
    const win = s > 0.12 ? A : s < -0.12 ? Bn : null, lose = win === A ? Bn : win === Bn ? A : null;
    if (win) {
      win.glory = clamp(win.glory + 12 + Math.abs(s) * 20, 0, 100); win.prestige += 8 + Math.abs(s) * 14; win.cnt.warsWon = (win.cnt.warsWon || 0) + 1;
      lose.glory = clamp(lose.glory - 14 - Math.abs(s) * 20, 0, 100); lose.lostWarAt = lose.age; lose.stab -= 5;
      if (w.cb === 'holy' && w.a === win.id) win.cnt.holyWars = (win.cnt.holyWars || 0) + 1;
      if ((lose.a.warInd || 0) >= 2 * (win.a.warInd || 1)) win.flags.beatStronger = 1;
      ID.logGrief(lose, G.tick, 'Lost the war against ' + win.name + '.');
    }
    const terms = win && w.cb !== 'civil' ? D.terms(G, win, lose, s) : '';
    ID.news(G, 'Peace between ' + A.name + ' and ' + Bn.name + (win ? ': ' + win.name + ' keeps its gains' + (terms ? '; ' + terms : '') + '.' : ', with nothing settled.'), 'dip', A.id, Bn.id);
    ID.chron(G, 'peace', 'Peace between ' + A.name + ' and ' + Bn.name + (win ? '; ' + win.name + ' is the victor.' : '.'), A.id, Bn.id);
    if (ID.Press && w.cb !== 'civil') ID.Press.peace(G, A, Bn, win, w);
    if (!G.headless) G.dirtyAll = true;
  };
  /* Would the AI nation X accept peace offered by Y? */
  D.wantsPeace = function (G, X, Y) {
    const w = D.warOf(G, X.id, Y.id); if (!w) return false;
    if (w.cb === 'civil') return false;
    if (ID.ideo(X).flags.noPeace && (X.sig || 0) > 10) return false; // the fire cannot make peace while it burns
    const s = D.warScore(G, X, Y), months = (G.tick - w.start) / 30;
    if (months < 4) return false;
    const attacker = w.a === X.id;
    if (attacker && w.aim === 'limited' && s >= 0.28) return true;      // took what it came for
    if (!attacker && w.aim === 'limited' && s <= -0.12) return true;   // cut the losses
    if (months < 8) return false;
    let v = -s * 60 + X.we * 0.9 + (X.we > 60 ? 18 : 0) + ID.leaderLean(X, 'peace') + (Y.a.feelers && G.tick - Y.a.feelers < 360 ? 15 : 0) + (months > 30 ? 15 : 0) + (X.stab < 30 ? 20 : 0) + (X.nwars > 1 ? 12 : 0) - 28;
    if (s > 0.25 && X.troops > Y.troops * 1.3 && w.aim === 'total') v -= 30;
    return v > 0;
  };

  /* ---------------------------------------------------------------- capitals and capitulation */
  D.relocateCapital = function (G, n) {
    const W = G.W, ox = n.capital % W, oy = (n.capital / W) | 0; let best = -1, bs = -1;
    for (const i of G.blist) if (G.bld[i] === B.CITY && G.owner[i] === n.id) { const d = Math.hypot((i % W) - ox, ((i / W) | 0) - oy) + (G.cut[i] ? -500 : 0); if (d > bs) { bs = d; best = i; } }
    if (best < 0) {
      let bp = null; for (let p = 1; p < G.provinces.length; p++) { const Pr = G.provinces[p]; if ((Pr.cnt[n.id] || 0) > (bp ? bp.cnt[n.id] : 0)) bp = Pr; }
      if (bp) { if (G.owner[bp.center] === n.id) best = bp.center; else for (let i = 0; i < G.N; i++) if (G.owner[i] === n.id && G.prov[i] === bp.id) { best = i; break; } }
    }
    if (best >= 0) n.capital = best;
    return best >= 0;
  };
  D.onCapitalLost = function (G, L, Wn) {
    if (!L || !L.alive) return;
    if (L.tiles <= 0) { D.eliminate(G, L, Wn); return; }
    if (G.owner[L.capital] === L.id) return;
    D.relocateCapital(G, L);
    if (!Wn) return;
    const fl = ID.ideo(L).flags;
    const w = D.warOf(G, L.id, Wn.id);
    if (!w) return;
    if (fl.noDecap) { ID.news(G, Wn.name + ' takes the largest town of ' + L.name + '. The communes fight on.', 'war', Wn.id, L.id); return; }
    L.a.capLost = (L.a.capLost || 0) + 1;
    L.stab -= 14; L.glory = Math.max(0, L.glory - 18); ID.addMod(L, 'legit', -8, 12, 'Capital lost');
    Wn.glory = Math.min(100, Wn.glory + 10); Wn.prestige += 8;
    ID.news(G, 'The capital of ' + L.name + ' falls to ' + Wn.name + '.', 'war', Wn.id, L.id);
    if (L.id === G.player) ID.headline(G, { kicker: 'Catastrophe', title: 'The capital has fallen', sub: Wn.name + ' holds the seat of government. The ministries flee to ' + (G.provinces[G.prov[L.capital]] ? 'the provinces' : 'wherever they can') + '.', a: Wn.id, b: L.id, tone: 'bad' });
    else if (Wn.id === G.player) ID.headline(G, { kicker: 'Victory', title: L.base + '’s capital taken', sub: 'Our troops march through the capital of ' + L.name + '.', a: Wn.id, b: L.id, tone: 'good' });
    ID.logGrief(L, G.tick, 'The capital fell to ' + Wn.name + '.');
    ID.fx(G, 'capital', L.capital);
    if (L.id === G.player) ID.sfx(G, 'bad'); else if (Wn.id === G.player) ID.sfx(G, 'good');
    if (G.tick - w.start < 60) return;
    const wt = L.a.warTiles || L.startTiles;
    if (L.tiles < wt * 0.34 || L.troops < L.pop * 0.004) D.capitulate(G, L, Wn);
  };
  D.capitulate = function (G, L, Wn) {
    if (!L.alive || !Wn.alive) return;
    const civil = L.civilOf === Wn.id || L.civil === Wn.id;
    if (civil) { D.resolveCapitulation(G, L, Wn, 'annex'); return; }
    if (L.id === G.player) { ID.Game.defeat(G, 'conquered', { by: Wn.id }); return; }
    if (Wn.id === G.player) { L.a.capitulating = G.tick; ID.Events.queue(G, Wn, 'capitulation', { loser: L.id }); return; }
    if (ID.ideo(Wn).flags.noPeace) { D.resolveCapitulation(G, L, Wn, 'annex'); return; } // the fire consumes; it does not install governments
    // a great power may keep a small defeated state as a protectorate instead of annexing it
    if (ID.Sov && !L.dep && ID.isMajor(G, Wn) && !ID.isMajor(G, L) && L.tiles < Wn.tiles * 0.4 && !Wn.dep && G.rng.chance(0.3)) { D.resolveCapitulation(G, L, Wn, 'release'); ID.Sov.bind(G, L, Wn, 'protectorate'); return; }
    const I = ID.ideo(Wn);
    const mode = (I.flags.satellite || I.dip.export >= 0.5 || (Wn.a.noncoreShare || 0) > 0.3) && L.tiles > 60 && !ID.saturated(G, Wn.ideo) && G.rng.chance(0.7) ? 'install' : 'annex';
    if (mode === 'annex' && L.tiles > 60 && D.dictate(G, L, Wn)) return; // liberals and monarchies take terms, not the whole country
    D.resolveCapitulation(G, L, Wn, mode);
  };
  /* Peace by ideology: what a victor takes besides the land it holds. Liberals: reparations, which the loser borrows,
     and bases (a treaty state); conservative systems: tribute, a share of revenue for ten years; socialists and
     anarchists: their movement follows the army home. Everyone else keeps what it holds. Returns the news clause. */
  D.TRIBUTE_YEARS = 10;
  D.terms = function (G, win, lose, s) {
    const fam = ID.ideo(win).family, k = Math.min(1, Math.abs(s));
    if (fam === 'liberal') {
      const amt = Math.round(40 + k * 260), base = !!ID.Sov && k > 0.35 && !lose.dep && !win.dep && !ID.isMajor(G, lose);
      lose.debt = (lose.debt || 0) + amt; win.gold += amt; win.cnt.reparations = (win.cnt.reparations || 0) + 1;
      if (base) ID.Sov.bind(G, lose, win, 'treaty', true);
      return lose.base + ' pays reparations of ' + amt + (base ? ' and grants bases on its soil' : '');
    }
    if (fam === 'conservative') {
      lose.trib = { to: win.id, share: Math.round((0.06 + k * 0.1) * 100) / 100, until: G.tick + D.TRIBUTE_YEARS * 360 }; win.cnt.tributes = (win.cnt.tributes || 0) + 1;
      return lose.base + ' pays a tribute of ' + Math.round(lose.trib.share * 100) + '% of its revenue for ' + D.TRIBUTE_YEARS + ' years';
    }
    if ((fam === 'socialist' || fam === 'anarchist') && ID.docSeed) { ID.docSeed(G, lose, win.ideo, 10 + k * 15, 3, win.id); return 'the revolution follows its army home'; }
    return '';
  };
  /* A capitulation on a liberal's or a monarch's terms: released, then bound as a treaty state (liberal, after
     reparations) or a tributary (vilayet for the absolute systems, protectorate for the others). false: not theirs to dictate. */
  D.dictate = function (G, L, Wn) {
    const fam = ID.ideo(Wn).family;
    if (!ID.Sov || L.dep || Wn.dep || (fam !== 'liberal' && fam !== 'conservative')) return false;
    D.resolveCapitulation(G, L, Wn, 'release');
    if (fam === 'liberal') { L.debt = (L.debt || 0) + 300; Wn.gold += 300; }
    ID.Sov.bind(G, L, Wn, fam === 'liberal' ? 'treaty' : ['absmon', 'theocracy', 'revival'].includes(Wn.ideo) ? 'vilayet' : 'protectorate');
    Wn.cnt.dictated = (Wn.cnt.dictated || 0) + 1;
    return true;
  };
  D.resolveCapitulation = function (G, L, Wn, mode) {
    if (!L.alive) return;
    const w = D.warOf(G, L.id, Wn.id);
    Wn.glory = clamp(Wn.glory + 18, 0, 100); Wn.prestige += 12; Wn.cnt.warsWon = (Wn.cnt.warsWon || 0) + 1;
    if (L.civilOf !== Wn.id && L.civil !== Wn.id) {
      if (ID.isMajor(G, L) || mode === 'annex') ID.addEpithet(G, Wn, (mode === 'annex' ? 'Conqueror of ' : 'Victor over ') + L.base);
      if (Wn.cnt.warsWon === 3) ID.addEpithet(G, Wn, 'Thrice Victorious');
    }
    if (w && w.cb === 'holy' && w.a === Wn.id) Wn.cnt.holyWars = (Wn.cnt.holyWars || 0) + 1;
    if ((L.a.warInd || 0) >= 2 * (Wn.a.warInd || 1)) Wn.flags.beatStronger = 1;
    if (mode === 'install' || mode === 'release') {
      for (let i = 0; i < G.N; i++) if (G.owner[i] === Wn.id && G.provinces[G.prov[i]].core === L.id) ID.setOwner(G, i, L.id);
      for (const e of D.enemies(G, L)) D.endWarState(G, L, e, true);
      if (G.owner[L.capital] !== L.id) D.relocateCapital(G, L);
      L.troops = L.pop * 0.02; L.we = 20; L.lostWarAt = L.age; L.glory = 10;
      if (mode === 'install') {
        if (L.ideo !== Wn.ideo) ID.Politics.changeIdeology(G, L, Wn.ideo, 'imposed', Wn.id);
        else { Wn.cnt.exported = (Wn.cnt.exported || 0) + 1; Wn.a.spreadAt = G.tick; }
        ID.addOpBoth(G, L.id, Wn.id, 80);
        if (L.bloc) D.leaveBloc(G, L, false);
        if (!Wn.bloc) D.formBloc(G, Wn);
        D.joinBloc(G, L, Wn.bloc);
        Wn.threat += 5;
        ID.news(G, L.name + ' capitulates. ' + Wn.name + ' installs a friendly government.', 'war', Wn.id, L.id);
        if (Wn.id === G.player) ID.headline(G, { kicker: 'Peace dictated', title: L.base + ' capitulates', sub: 'A friendly government takes power under our protection.', a: Wn.id, b: L.id, tone: 'good' });
        ID.chron(G, 'conquest', Wn.name + ' defeats its neighbour and installs a client regime: ' + L.name + '.', Wn.id, L.id);
        if (ID.Press) ID.Press.fall(G, L, Wn, 'install');
      } else {
        Wn.gold += 120 + L.gold * 0.5; L.gold *= 0.5; ID.addOpBoth(G, L.id, Wn.id, 25);
        ID.news(G, L.name + ' capitulates and is released on payment of an indemnity.', 'war', Wn.id, L.id);
        ID.chron(G, 'peace', Wn.name + ' defeats ' + L.name + ' and withdraws.', Wn.id, L.id);
        if (ID.Press) ID.Press.fall(G, L, Wn, 'release');
      }
      if (!G.headless) G.dirtyAll = true;
      return;
    }
    const gained = L.tiles;
    for (let i = 0; i < G.N; i++) if (G.owner[i] === L.id) ID.setOwner(G, i, Wn.id);
    Wn.threat += 10 + (gained / G.landCount) * 220;
    Wn.gold += Math.max(0, L.gold * 0.7);
    D.eliminate(G, L, Wn, true);
  };

  D.eliminate = function (G, n, by, annexed) {
    if (!n.alive) return;
    n.alive = false; n.tiles = Math.max(0, n.tiles);
    for (const o of G.nations) if (o && o !== n && ID.atWar(G, n.id, o.id)) D.endWarState(G, n, o, false);
    for (let k = G.attacks.length - 1; k >= 0; k--) { const a = G.attacks[k]; if (a.from === n.id || a.to === n.id) { G.attacks.splice(k, 1); if (a.from !== n.id) { const o = G.nations[a.from]; if (o.alive) o.troops += a.troops; } } }
    for (let k = G.boats.length - 1; k >= 0; k--) if (G.boats[k].owner === n.id) G.boats.splice(k, 1);
    for (const o of G.nations) if (o && o.ops.length) o.ops = o.ops.filter((x) => x.target !== n.id);
    if (n.bloc) D.leaveBloc(G, n, false);
    n.nwars = 0;
    const civil = by && (n.civilOf === by.id || n.civil === by.id);
    if (civil) {
      for (let p = 1; p < G.provinces.length; p++) { const Pr = G.provinces[p]; if (Pr.core === n.id) { Pr.core = by.id; if (Pr.owner === by.id) Pr.integ = 100; } }
      ID.addEpithet(G, by, by.civilOf ? 'Born of Revolution' : 'Victor of the Civil War');
      by.civil = 0; by.civilOf = 0; by.a.civilEnd = G.tick; by.glory = clamp(by.glory + 20, 0, 100); by.stab = Math.min(100, by.stab + 8); by.cnt.civilWarsWon = (by.cnt.civilWarsWon || 0) + 1;
      if (by.claims.length === 0 && n.claims.length) by.claims = n.claims.slice();
      ID.news(G, 'The civil war is over: ' + by.name + ' rules the whole country.', 'rev', by.id);
      ID.chron(G, 'civilwar', 'The civil war ends. ' + by.name + ' is victorious over ' + n.name + '.', by.id, n.id);
      if (ID.Press) ID.Press.civilEnds(G, by, n);
      if (by.sponsor && G.nations[by.sponsor] && G.nations[by.sponsor].alive) { const s = G.nations[by.sponsor]; s.cnt.exported = (s.cnt.exported || 0) + 1; s.fervor = Math.min(100, s.fervor + 18); s.a.spreadAt = G.tick; by.sponsor = 0; }
      if (by.civilOf === 0 && ID.IDEOLOGIES[by.ideo]) { const W = G.W; G.world.waves.push({ fam: ID.ideo(by).family, ideo: by.ideo, str: 1, m: 0, x: by.capital % W, y: (by.capital / W) | 0, src: by.id }); }
    } else {
      ID.news(G, n.name + (annexed ? ' is annexed by ' + by.name + '.' : ' ceases to exist.'), 'war', by ? by.id : 0, n.id);
      ID.chron(G, 'conquest', n.name + (by ? ' is conquered by ' + by.name + '.' : ' collapses.'), by ? by.id : 0, n.id);
      if (ID.Press && by && !n.civilOf) ID.Press.fall(G, n, by, 'annex');
    }
    if (n.id === G.player && !G.over) ID.Game.defeat(G, civil ? 'civilwar' : 'conquered', { by: by ? by.id : 0 });
    if (by && by.id === G.player) { ID.sfx(G, 'victory'); if (!civil) ID.headline(G, { kicker: 'Annexation', title: n.base + ' is no more', sub: 'Its lands pass to ' + by.name + '.', a: by.id, b: n.id, tone: 'good' }); }
    if (!G.headless) G.dirtyAll = true;
  };

  /* ---------------------------------------------------------------- blocs */
  D.formBloc = function (G, leader) {
    if (leader.bloc) return G.blocs[leader.bloc];
    const fam = ID.ideo(leader).family; let name = ID.FAMILIES[fam].bloc;
    for (const b of G.blocs) if (b && b.name === name && b.members.length) { name = leader.adj + ' Pact'; break; }
    const bl = { id: G.blocs.length, name, leader: leader.id, fam, members: [leader.id], col: leader.color };
    G.blocs.push(bl); leader.bloc = bl.id;
    ID.news(G, leader.name + ' founds the ' + name + '.', 'dip', leader.id);
    ID.chron(G, 'bloc', leader.name + ' founds the ' + name + '.', leader.id);
    if (ID.Press) ID.Press.bloc(G, leader, name);
    return bl;
  };
  D.joinBloc = function (G, n, blocId) {
    const bl = G.blocs[blocId]; if (!bl || n.bloc === blocId) return;
    if (n.bloc) D.leaveBloc(G, n, false);
    bl.members.push(n.id); n.bloc = blocId;
    for (const m of bl.members) if (m !== n.id) { ID.addOpBoth(G, n.id, m, 20); const d = ID.dipOf(G, n.id, m); d.truce = 0; }
    ID.news(G, n.name + ' joins the ' + bl.name + '.', 'dip', n.id);
    if (!G.headless) G.dirtyAll = true;
  };
  D.leaveBloc = function (G, n, hostile) {
    const bl = G.blocs[n.bloc]; if (!bl) { n.bloc = 0; return; }
    bl.members = bl.members.filter((m) => m !== n.id); n.bloc = 0;
    if (hostile) for (const m of bl.members) ID.addOpBoth(G, n.id, m, -25);
    if (bl.leader === n.id && bl.members.length) {
      let best = null; for (const m of bl.members) { const o = G.nations[m]; if (o.alive && (!best || D.power(o) > D.power(best))) best = o; }
      if (best) bl.leader = best.id;
    }
    if (bl.members.length <= 1) { for (const m of bl.members) G.nations[m].bloc = 0; bl.members = []; ID.news(G, 'The ' + bl.name + ' dissolves.', 'dip'); }
    else if (n.alive) ID.news(G, n.name + ' leaves the ' + bl.name + '.', 'dip', n.id);
    if (!G.headless) G.dirtyAll = true;
  };

  /* ---------------------------------------------------------------- proposals (AI acceptance) */
  /* kind: trade | nap | ally | peace | embargo(no acceptance needed) | cancel_trade | cancel_nap. Returns {ok, why}. */
  D.evalProposal = function (G, from, to, kind) {
    const op = ID.op(G, to.id, from.id);
    const If = ID.ideo(from), It = ID.ideo(to);
    const fb = ID.forbid && ID.forbid(G, from, kind, to); if (fb) return { ok: false, why: fb };
    if (ID.atWar(G, from.id, to.id) && kind !== 'peace') return { ok: false, why: 'You are at war.' };
    if (kind === 'trade') {
      if (to.laws.trade === 'autarky' || from.laws.trade === 'autarky') return { ok: false, why: 'Autarky rules out trade treaties.' };
      if (from.flags.embargoed) return { ok: false, why: 'The world has placed you under embargo.' };
      const s = op + 22 * (If.dip.trade + It.dip.trade - 1) + (If.flags.tradeAll || It.flags.tradeAll ? 22 : 0) - from.threat * 0.3;
      return { ok: s > 4, why: s > 4 ? '' : 'They do not trust you enough to trade (need better relations; currently ' + Math.round(op) + ').', s };
    }
    if (kind === 'nap') {
      let s = op + (to.nwars ? 22 : 0) + (D.power(from) > D.power(to) * 1.2 ? 12 : 0) - (D.casusBelli(G, to, from) === 'claims' ? 35 : 0) - from.threat * 0.25;
      return { ok: s > 14, why: s > 14 ? '' : 'They see no reason to tie their hands (relations ' + Math.round(op) + ').', s };
    }
    if (kind === 'ally') {
      if (ID.areRivals(from.ideo, to.ideo)) return { ok: false, why: 'Sectarian rivals will not share a bloc.' };
      if ((from.dep && ID.Sov.vetoes(G, from, 'war')) || (to.dep && ID.Sov.vetoes(G, to, 'war'))) return { ok: false, why: 'A dependency cannot join a bloc while its overlord decides its wars.' };
      if (ID.ideo(to).flags.nonAligned && !to.a.threatened) return { ok: false, why: 'They belong to no bloc, by principle.' };
      const aff = ID.ideoAffinity(from.ideo, to.ideo);
      let common = 0; for (const e of D.enemies(G, to)) if (ID.atWar(G, from.id, e.id) || ID.op(G, from.id, e.id) < -40) common = 18;
      const s = op * 0.8 + aff * 0.6 + common - 38;
      return { ok: s > 0 && aff > -5, why: s > 0 && aff > -5 ? '' : aff <= -5 ? 'Your systems are too far apart for an alliance.' : 'Relations are not close enough (' + Math.round(op) + ').', s };
    }
    if (kind === 'peace' && If.flags.noPeace && (from.sig || 0) > 10) return { ok: false, why: 'The Bunker does not make peace. Only if the fire burns down below 10 will anyone listen.' };
    if (kind === 'peace') { const ok = D.wantsPeace(G, to, from); return { ok, why: ok ? '' : 'They believe they can still win.' }; }
    return { ok: true, why: '' };
  };
  /* Carry out a proposal that has been accepted. */
  D.enact = function (G, from, to, kind) {
    const d = ID.dipOf(G, from.id, to.id);
    if (kind === 'trade') { d.trade = 1; d.embargo = 0; ID.addOpBoth(G, from.id, to.id, 6); ID.news(G, from.name + ' and ' + to.name + ' sign a trade treaty.', 'dip', from.id, to.id); }
    else if (kind === 'nap') { d.nap = 1; ID.addOpBoth(G, from.id, to.id, 8); ID.news(G, from.name + ' and ' + to.name + ' sign a non-aggression pact.', 'dip', from.id, to.id); }
    else if (kind === 'ally') {
      const lead = to.bloc ? to : from.bloc ? from : D.power(to) > D.power(from) ? to : from, other = lead === to ? from : to;
      if (!lead.bloc) D.formBloc(G, lead);
      D.joinBloc(G, other, lead.bloc);
    }
    else if (kind === 'peace') D.peace(G, from, to);
    else if (kind === 'embargo') { d.trade = 0; d.embargo = 1; ID.addOpBoth(G, from.id, to.id, -15); ID.news(G, from.name + ' embargoes ' + to.name + '.', 'dip', from.id, to.id); }
    else if (kind === 'cancel_trade') { d.trade = 0; ID.addOpBoth(G, from.id, to.id, -6); }
    else if (kind === 'cancel_nap') { d.nap = 0; ID.addOpBoth(G, from.id, to.id, -15); from.threat += 4; }
    if (from.id === G.player || to.id === G.player) ID.sfx(G, 'stamp');
  };
  D.propose = function (G, from, to, kind) {
    const r = D.evalProposal(G, from, to, kind);
    if (!r.ok) return r.why || 'They refuse.';
    D.enact(G, from, to, kind); return '';
  };

  /* ---------------------------------------------------------------- covert operations */
  D.opCost = function (G, n, type) {
    const cheap = ID.ideo(n).flags.permRev ? 0.5 : 1;
    return type === 'fund' ? 6 * cheap : type === 'coup' ? Math.round(8 * cheap) : type === 'strike' ? 60 : 0;
  };
  D.startOp = function (G, n, type, target, seat) {
    const I = ID.ideo(n);
    if (!target.alive || target === n) return 'No such target.';
    if (type === 'fund') {
      if (n.ops.some((o) => o.type === 'fund' && o.target === target.id)) return 'You are already funding a movement there.';
      if (n.ops.length >= 3) return 'Your networks are stretched: three operations at most.';
      n.ops.push({ type: 'fund', target: target.id, cost: D.opCost(G, n, 'fund'), since: G.tick });
      return '';
    }
    if (type === 'coup') {
      // a conspiracy is built around one man in their inner circle: recruit him, feed it, then give the signal
      const pick = seat ? D.plotFig(target, seat) : D.plotBest(G, n, target);
      if (!pick) return 'Nobody in their inner circle will listen to you yet.';
      const why = D.plotBlock(G, n, target, pick); if (why) return why;
      n.gold -= D.plotCost(n, pick);
      pick.backer = n.id; pick.prep = 10;
      n.ops.push({ type: 'coup', target: target.id, seat: pick.seat, name: pick.name, cost: D.opCost(G, n, 'coup'), since: G.tick });
      return '';
    }
    if (type === 'strike') {
      if (!I.flags.generalStrike) return 'Only a syndicalist federation can call a general strike abroad.';
      if (n.gold < 60 || n.auth < 20) return 'Needs 60 gold and 20 authority.';
      if ((n.cd['strike_' + target.id] || 0) > G.tick) return 'The unions there need time to recover (until ' + ID.dateOf(n.cd['strike_' + target.id]).short + ').';
      if (target.laws.labor === 'control') return 'The workers there already run their own workplaces.';
      if (target.fs.workers >= 52) return 'Their workers are too content to walk out (support ' + Math.round(target.fs.workers) + ').';
      n.gold -= 60; n.auth -= 20; n.cd['strike_' + target.id] = G.tick + 3 * 360;
      target.strike = 5; target.stab -= 6; ID.Politics.boostOpp(G, target, 10, 0.25); ID.addOpBoth(G, n.id, target.id, -30);
      const won = target.fs.workers < 32;
      if (won) { target.stab -= 10; target.sm.capital -= 10; n.cnt.strikesWon = (n.cnt.strikesWon || 0) + 1; n.fervor = Math.min(100, n.fervor + 10); }
      ID.news(G, 'General strike in ' + target.name + ', called from ' + n.name + (won ? ': the country stops.' : ': it holds for a week.'), 'rev', target.id, n.id);
      ID.logGrief(target, G.tick, 'A general strike called from abroad paralysed industry.');
      if (target.id === G.player) ID.Events.queue(G, target, 'foreign_strike', { from: n.id });
      return '';
    }
    return 'Unknown operation.';
  };
  D.stopOp = function (G, n, idx) {
    const o = n.ops[idx]; if (!o) return;
    if (o.type === 'coup') { const t = G.nations[o.target], f = t && D.plotFig(t, o.seat); if (f && f.backer === n.id && f.name === o.name) { f.backer = 0; f.prep = 0; } }
    n.ops.splice(idx, 1);
  };

  /* ---- diplomatic notes (foreign policy programmes, data/foreign.js) */
  D.note = function (G, A, T, kind) {
    if (!A || !T || !A.alive || !T.alive || A === T || !ID.NOTE_KINDS[kind]) return;
    if (ID.atWar(G, A.id, T.id)) return;
    if (T.id === G.player && !G.autoPlayer) { ID.Events.queue(G, T, 'fp_note', { from: A.id, kind }); return; }
    D.noteAnswer(G, A, T, kind, D.noteWould(G, A, T, kind));
  };
  D.noteWould = function (G, A, T, kind) {
    const r = D.power(A) / Math.max(1, D.power(T)), op = ID.op(G, T.id, A.id), aff = ID.ideoAffinity(A.ideo, T.ideo), rng = G.rng;
    if (kind === 'treaty') return A.laws.trade !== 'autarky' && T.laws.trade !== 'autarky' && op + aff * 0.4 + (r > 1.5 ? 10 : 0) + rng.range(-15, 25) > 0;
    if (kind === 'cede') return r > 2.2 && op > -45 && !T.bloc && rng.chance(clamp((r - 2) / 4, 0, 0.6));
    if (kind === 'bloc') return !T.bloc && !ID.areRivals(A.ideo, T.ideo) && aff + op * 0.5 + rng.range(-10, 15) > 5;
    if (kind === 'aid') return !ID.areRivals(A.ideo, T.ideo) && op > -25;
    if (kind === 'toll') return op > -15 && rng.chance(r < 0.5 ? 0.6 : 0.3);
    if (kind === 'concession') return ID.Sov.oilProvs(G, T).some((P) => !P.oilCo) && op > -20 && (T.gold < 150 || r > 2) && !ID.ideo(T).flags.nonAligned;
    if (kind === 'base') return !T.dep && !T.bloc && !ID.ideo(T).flags.nonAligned && op + aff * 0.3 + (T.a.threatened ? 20 : 0) + rng.range(-15, 15) > 15;
    if (kind === 'arms') return op > -10 && !ID.areRivals(A.ideo, T.ideo);
    return false;
  };
  D.noteAnswer = function (G, A, T, kind, yes) {
    if (!A || !T || !A.alive || !T.alive) return;
    const d = ID.dipOf(G, A.id, T.id), K = ID.NOTE_KINDS[kind];
    if (yes) {
      if (kind === 'treaty') { d.nap = 1; if (A.laws.trade !== 'autarky' && T.laws.trade !== 'autarky') d.trade = 1; ID.addOpBoth(G, A.id, T.id, 15); }
      else if (kind === 'cede') {
        const set = new Set(A.claims.filter((p) => G.provinces[p].owner === T.id));
        if (set.size) { for (let i = 0; i < G.N; i++) if (G.owner[i] === T.id && set.has(G.prov[i]) && T.capital !== i) ID.setOwner(G, i, A.id); A.claims = A.claims.filter((p) => !set.has(p)); ID.recalcBorders(G); ID.recalcProvinceOwners(G); }
        T.stab -= 6; ID.addOpBoth(G, A.id, T.id, -20); A.glory = Math.min(100, (A.glory || 0) + 5);
      } else if (kind === 'bloc') { if (A.bloc && G.blocs[A.bloc]) D.joinBloc(G, T, A.bloc); else { d.nap = 1; ID.addOpBoth(G, A.id, T.id, 20); } }
      else if (kind === 'aid') { const g = Math.min(120, Math.max(0, A.gold)); A.gold -= g; T.gold += g; T.stab += 3; ID.addOpBoth(G, A.id, T.id, 20); }
      else if (kind === 'concession') ID.Sov.sell(G, T, A);
      else if (kind === 'base') ID.Sov.bind(G, T, A, 'client');
      else if (kind === 'arms') { const t = Math.min(A.troops * 0.03, 40 + T.troops * 0.2); A.troops -= t; T.troops += t; A.gold -= 50; T.equip = Math.min(1.4, T.equip + 0.06); ID.addOpBoth(G, A.id, T.id, 15); }
      else if (kind === 'toll') { ID.addMod(T, 'rev', -0.02, 120, 'Toll to ' + A.base); ID.addMod(A, 'rev', 0.03, 120, 'Toll from ' + T.base); ID.addOpBoth(G, A.id, T.id, 10); }
    } else {
      ID.addOpBoth(G, A.id, T.id, kind === 'cede' ? -25 : kind === 'toll' ? -15 : kind === 'treaty' ? -8 : -5);
      if (kind === 'cede') A.flags['cbOn_' + T.id] = G.tick;
    }
    const verb = { concession: yes ? 'sells an oil concession to' : 'refuses an oil concession to', base: yes ? 'grants a base to' : 'refuses a base to', arms: yes ? 'accepts arms from' : 'refuses arms from', treaty: yes ? 'signs a treaty with' : 'refuses a treaty with', cede: yes ? 'hands provinces to' : 'refuses to cede provinces to', bloc: yes ? 'aligns itself with' : 'declines an alliance with', aid: yes ? 'accepts aid from' : 'refuses aid from', toll: yes ? 'agrees to pay a toll to' : 'refuses to pay a toll to' }[kind];
    if (A.id === G.player || T.id === G.player) ID.news(G, T.name + ' ' + verb + ' ' + A.name + '.', yes === (A.id === G.player) ? 'good' : 'dip', T.id, A.id);
    if (ID.Press && (kind === 'cede' || kind === 'bloc' || ID.isMajor(G, A))) ID.Press.add(G, { w: kind === 'cede' ? (yes ? 3 : 2) : 1, kind: 'dip', a: A.id, b: T.id, art: kind === 'cede' ? 'wall' : 'peace', key: 'note' + A.id + kind + T.id, gap: 600,
      title: T.base + ' ' + verb + ' ' + A.base,
      text: K[1].replace(/\{F\}/g, A.name).replace(/\bus\b/g, T.name).replace(/\bour\b/g, T.adj) + ' ' + (yes ? 'The answer from ' + T.base + ' was yes.' : 'The answer from ' + T.base + ' was no.') + (kind === 'cede' && !yes ? ' ' + A.base + ' now has the cause for war it may have been looking for.' : '') });
  };

  /* ---- conspiracies: a foreign power backs one figure of the inner circle */
  D.plotFig = (t, seat) => (t.circle || []).find((f) => f.seat === seat) || null;
  D.plotOp = (n, t) => n.ops.find((o) => o.type === 'coup' && o.target === t.id) || null;
  D.plotCost = (n, f) => Math.round((60 + 30 * f.comp) * (ID.ideo(n).flags.permRev ? 0.5 : 1));
  /* How open a figure is to an approach from n: 0..100. Convictions close to ours, ambition and disloyalty all help. */
  D.plotOpen = function (n, t, f) {
    const mine = f.lean === n.ideo ? 30 : ID.IDEOLOGIES[f.lean] && ID.IDEOLOGIES[f.lean].family === ID.ideo(n).family ? 16 : 0;
    return clamp((70 - f.loy) * 1.1 + (f.amb - 50) * 0.7 + mine + (f.heir ? -25 : 0), 0, 100);
  };
  D.plotBlock = function (G, n, t, f) {
    if (!t.alive || t === n) return 'No such target.';
    if (ID.ideo(t).flags.noCoup) return 'There is no officer corps there to suborn: power lies with the assemblies.';
    if (D.plotOp(n, t)) return 'You already have a man there.';
    if (n.ops.length >= 3) return 'Your networks are stretched: three operations at most.';
    if ((n.cd['coup_' + t.id] || 0) > G.tick) return 'Your contacts there are lying low until ' + ID.dateOf(n.cd['coup_' + t.id]).short + '.';
    if (f.backer && f.backer !== n.id && G.nations[f.backer] && G.nations[f.backer].alive && D.plotOp(G.nations[f.backer], t)) return 'Somebody else got to him first.';
    if (D.plotOpen(n, t, f) < 22) return f.name + ' is loyal and content. He would report the approach.';
    const c = D.plotCost(n, f); if (n.gold < c) return 'Needs ' + c + ' gold.';
    return '';
  };
  D.plotBest = function (G, n, t) {
    let best = null, bs = 0;
    for (const f of t.circle || []) { if (D.plotBlock(G, n, t, f)) continue; const s = D.plotOpen(n, t, f) + (f.seat === 'army' ? 25 : f.seat === 'police' ? 12 : 0); if (s > bs) { bs = s; best = f; } }
    return best;
  };
  /* The odds if the signal were given today. */
  /* The odds if the signal were given today: the target's coup odds with this plotter and this paymaster (sim/coup.js). */
  D.plotOdds = (G, n, t, f) => ID.Coup.odds(G, t, { src: 'foreign', backer: n.id, seat: f.seat, prep: f.prep || 0 }).p;
  /* The plot is found out: the man is gone and the paymaster is named. */
  D.plotExposed = function (G, n, t, f, quiet) {
    const k = n.ops.findIndex((o) => o.type === 'coup' && o.target === t.id); if (k >= 0) n.ops.splice(k, 1);
    n.cd['coup_' + t.id] = G.tick + 3 * 360;
    if (f && t.circle && t.circle.indexOf(f) >= 0) ID.Regime.replace(G, t, f, { loy: G.rng.int(62, 80) });
    ID.addOpBoth(G, n.id, t.id, -35); t.sm.military += 5; n.threat += 3;
    if (!quiet) ID.news(G, t.name + ' exposes a foreign-backed plot and blames ' + n.name + '.', 'dip', t.id, n.id);
    if (n.id === G.player) { ID.sfx(G, 'bad'); ID.headline(G, { kicker: 'Our man is taken', title: 'The plot in ' + t.base + ' is blown', sub: (f ? f.name : 'Our contact') + ' has been arrested. ' + t.name + ' names us as paymaster.', a: t.id, b: n.id, tone: 'bad' }); }
    if (ID.Press) ID.Press.coupFails(G, t, n.id);
  };
  /* Give the signal. Returns '' or the reason it cannot be given. */
  D.plotSignal = function (G, n, t) {
    const o = D.plotOp(n, t); if (!o) return 'You have no conspiracy there.';
    const f = D.plotFig(t, o.seat);
    if (!f || f.backer !== n.id || f.name !== o.name) return 'Your man is gone.';
    if ((f.prep || 0) < 30) return 'Too early: the conspiracy is not yet a third ready.';
    if (t.coupNow) return 'A coup is already under way there.';
    const prep = f.prep || 0;
    n.ops.splice(n.ops.indexOf(o), 1); n.cd['coup_' + t.id] = G.tick + 4 * 360;
    f.backer = 0; f.prep = 0;
    ID.news(G, 'Before dawn, units loyal to ' + f.name + ' move on the ministries of ' + t.name + '.', 'pol', t.id);
    if (t.id === G.player && !G.autoPlayer && ID.Politics.coupShield(G, t)) { t.stab = Math.max(0, t.stab - 3); ID.news(G, 'The plot of ' + f.name + ' fizzles: the army is in no mood for adventures. ' + n.name + ' wasted its money.', 'good', t.id, n.id); return ''; }
    ID.Coup.launch(G, t, { src: 'foreign', backer: n.id, seat: f.seat, fig: f.name, prep, known: f.known || 0 });
    return '';
  };
  /* The paymaster's coup fails (from sim/coup.js). */
  D.plotLost = function (G, n, t, f) {
    {
      if (f) ID.Regime.replace(G, t, f, { loy: G.rng.int(64, 82) });
      t.stab -= 4; t.sm.military += 8; t.flags.coupSurvived = 1; ID.addOpBoth(G, n.id, t.id, -45); n.threat += 4;
      const nm = f ? f.name : 'The plotter';
      ID.news(G, 'The coup in ' + t.name + ' fails. ' + nm + ' is shot; ' + n.name + ' is named as paymaster.', 'dip', t.id, n.id);
      if (n.id === G.player) { ID.sfx(G, 'bad'); ID.headline(G, { kicker: 'It has failed', title: 'The coup in ' + t.base + ' collapses', sub: nm + ' is dead and our part in it is known in every capital.', a: t.id, b: n.id, tone: 'bad' }); }
      if (ID.Press) ID.Press.coupFails(G, t, n.id);
    }
  };
  /* The paymaster's coup succeeds: our man rules, and he remembers who paid. */
  D.plotWon = function (G, n, t, f, to0) {
    const P = ID.Politics, to = to0 || P.coupIdeo(G, t, n.id), old = t.leader.name, man = { name: f.name, age: f.age, seat: f.seat };
    ID.Regime.makeLeader(G, t, f);
    t.a.coupAt = G.tick;
    if (to !== t.ideo) { P.changeIdeology(G, t, to, 'coup', n.id); t.leader.name = man.name; t.leader.age = man.age; t.leader.from = man.seat; }
    else { t.stab -= 8; ID.chron(G, 'coup', f.name + ' overthrows ' + old + ' of ' + t.name + ' with the help of ' + n.name + '.', t.id, n.id); n.cnt.exported = (n.cnt.exported || 0) + 1; if (ID.Press) ID.Press.palace(G, t, { name: f.name, title: 'high office' }, true, null); }
    ID.addOpBoth(G, n.id, t.id, 45);
    for (const e of D.enemies(G, t)) if (e === n) D.peace(G, n, t);
    const d = ID.dipOf(G, n.id, t.id); d.embargo = 0;
    if (n.bloc && !ID.areRivals(n.ideo, t.ideo) && ID.ideoAffinity(n.ideo, t.ideo) > -5) { if (t.bloc !== n.bloc) D.joinBloc(G, t, n.bloc); }
    else { d.nap = 1; if (n.laws.trade !== 'autarky' && t.laws.trade !== 'autarky') d.trade = 1; }
    n.cnt.coupsWon = (n.cnt.coupsWon || 0) + 1; n.glory = Math.min(100, n.glory + 4);
    if (n.id === G.player) { ID.sfx(G, 'good'); ID.headline(G, { kicker: 'Our man in ' + t.base, title: f.name + ' takes power', sub: 'The ministries fell before breakfast. The new government of ' + t.name + ' knows who its friends are.', a: n.id, b: t.id, tone: 'good' }); }
    return '';
  };
  /* Spend to hurry it along. */
  D.plotBoost = function (G, n, t) {
    const o = D.plotOp(n, t); if (!o) return 'You have no conspiracy there.';
    const f = D.plotFig(t, o.seat); if (!f || f.backer !== n.id) return 'Your man is gone.';
    if (n.gold < 100) return 'Needs 100 gold.';
    if ((o.boostAt || -999) > G.tick - 180) return 'The garrison has been paid once this half-year. More would be noticed.';
    n.gold -= 100; o.boostAt = G.tick; f.prep = Math.min(100, (f.prep || 0) + 20); o.heat = (o.heat || 0) + 0.04;
    return '';
  };
  D.opsMonth = function (G, n) {
    if (!n.ops.length) return;
    const I = ID.ideo(n);
    for (let k = n.ops.length - 1; k >= 0; k--) {
      const o = n.ops[k], t = G.nations[o.target];
      if (!t || !t.alive || (n.gold <= 0 && n.debt > 0)) { if (o.type === 'coup' && t) { const f0 = D.plotFig(t, o.seat); if (f0 && f0.backer === n.id) { f0.backer = 0; f0.prep = 0; } } n.ops.splice(k, 1); continue; }
      if (o.type === 'coup') {
        const f = D.plotFig(t, o.seat), isP = n.id === G.player && !G.autoPlayer;
        if (!f || f.backer !== n.id || f.name !== o.name || ID.ideo(t).flags.noCoup) { n.ops.splice(k, 1); if (isP) ID.news(G, 'Your man in ' + t.name + ', ' + o.name + ', is gone from the inner circle. The conspiracy is over.', 'bad', n.id, t.id); continue; }
        const sec = ID.LAWS.security.opts[t.laws.security], pol = D.plotFig(t, 'police');
        f.prep = Math.min(100, (f.prep || 0) + (6 + f.amb * 0.07 + (t.stab < 40 ? 4 : 0) + (t.a.losing ? 3 : 0)) * (1 - sec.detect * 0.5) * (I.flags.permRev ? 1.4 : 1));
        f.loy = Math.max(0, f.loy - 3); f.plot = Math.max(f.plot || 0, f.prep * 0.05);
        // their police may find it
        const watch = 0.008 + sec.detect * 0.03 + (pol && pol !== f ? Math.max(0, ID.Regime.scale(pol)) * 0.012 : 0) + (o.heat || 0);
        if (G.rng.chance(watch)) {
          if (t.id === G.player && !G.autoPlayer) { t.a.knownOps = t.a.knownOps || {}; t.a.knownOps[n.id] = G.tick; f.warned = 1; if (!ID.Events.pending(G, 'rg_plot')) ID.Events.queue(G, t, 'rg_plot', { seat: f.seat, name: f.name, foreign: n.id }); }
          else { D.plotExposed(G, n, t, f); continue; }
        }
        // an AI paymaster gives the signal when the odds are fair or the moment is ripe
        if (!isP) {
          const odds = D.plotOdds(G, n, t, f);
          if ((f.prep >= 70 || (f.prep >= 45 && t.stab < 35)) && odds > 0.25) D.plotSignal(G, n, t);
          else if (f.prep >= 100 && G.tick - o.since > 420) D.stopOp(G, n, k); // it will never be ripe: withdraw quietly
        }
        continue;
      }
      if (o.type !== 'fund') continue;
      const sec = ID.LAWS.security.opts[t.laws.security], press = ID.LAWS.press.opts[t.laws.press];
      const mult = (0.6 + I.dip.export) * (I.flags.permRev ? 2 : 1) * (1 + press.infl) * (1 - sec.repress * 0.35) * (t.id === G.player ? ID.DIFFICULTY[G.difficulty].subvert : 1);
      const mine = []; for (let p = 1; p < G.provinces.length; p++) if (G.provinces[p].owner === t.id) mine.push(G.provinces[p]);
      const sizeK = clamp(mine.length / 8, 0.25, 1);
      for (let c = 0; c < 3 && mine.length; c++) {
        const Pr = G.rng.pick(mine);
        if (Pr.opp !== n.ideo && (Pr.oppStr < 30 || G.rng.chance(0.25))) { Pr.opp = n.ideo; Pr.sponsor = n.id; Pr.oppStr = Math.max(Pr.oppStr * 0.6, 8); }
        if (Pr.opp === n.ideo) { Pr.oppStr = clamp(Pr.oppStr + 3.2 * mult * sizeK, 0, 100); Pr.sponsor = n.id; ID.fx(G, 'subvert', Pr.center, { col: I.color }); }
      }
      if (G.rng.chance(0.03 + sec.detect * 0.07)) {
        ID.addOpBoth(G, n.id, t.id, -18);
        if (t.id === G.player) { ID.news(G, 'Your police trace foreign money in the opposition to ' + n.name + '.', 'bad', t.id, n.id); t.a.knownOps = t.a.knownOps || {}; t.a.knownOps[n.id] = G.tick; }
        else if (n.id === G.player) ID.news(G, t.name + ' has uncovered your network. Relations suffer.', 'bad', n.id, t.id);
      }
    }
  };

  D.onNuke = function (G, A, hit, tile, kind) {
    const th = kind === 'thermo';
    A.threat += th ? 120 : 50; G.world.tension = Math.min(100, G.world.tension + (th ? 45 : 25));
    for (const o of G.nations) if (o && o.alive && o !== A) ID.addOp(G, o.id, A.id, th ? -60 : ID.ideo(o).elections ? -50 : -35);
    A.sm.intelligentsia -= th ? 25 : 14; A.sm.clergy -= th ? 20 : 12; A.sm.workers -= th ? 12 : 6;
    if (th) { A.stab -= 10; ID.addMod(A, 'legit', -8, 120, 'The thermonuclear strike'); G.world.thermoUsed = (G.world.thermoUsed || 0) + 1; }
    if (ID.ideo(A).elections) A.mandate = Math.max(0, A.mandate - 15);
    const names = Object.keys(hit).map((k) => G.nations[+k].name).join(', ');
    ID.news(G, (th ? 'THERMONUCLEAR STRIKE: ' : 'ATOMIC STRIKE: ') + A.name + ' destroys a region of ' + (names || 'empty land') + '.', 'bad', A.id);
    ID.chron(G, 'nuke', A.name + ' uses ' + (th ? 'a thermonuclear' : 'an atomic') + ' weapon against ' + (names || 'no one') + '.', A.id);
    // the front page is for the first bomb, and for the first of each new war: after that the world has no words left
    const first = !G.world.nuked; G.world.nuked = (G.world.nuked || 0) + 1;
    const fresh = !A.a.nukeHl || G.tick - A.a.nukeHl > 1080;
    if (th) {
      A.a.nukeHl = G.tick;
      ID.headline(G, { kicker: G.world.thermoUsed > 1 ? 'Again' : 'The end of the world, rehearsed', title: 'The sun-weapon', sub: A.name + ' has erased ' + (names || 'a stretch of empty land') + '. Fallout is drifting across the borders.', a: A.id, tone: 'bad' });
      if (ID.Press) ID.Press.add(G, { w: 6, kind: 'nuke', a: A.id, title: 'A country burned in an afternoon', text: A.name + ' has used a thermonuclear weapon against ' + (names || 'empty land') + '. The fireball was seen from neighbouring capitals. Nothing stands where the cities were; the cloud that followed is now over ' + (names ? 'their neighbours' : 'the sea') + ', and the radio tells everyone downwind to stay indoors for a month. There is no government left in the zone to ask for terms. Every state on earth has broken with ' + A.base + ' or is about to.' });
    } else if (first || fresh) {
      A.a.nukeHl = G.tick;
      ID.headline(G, first ? { kicker: 'A new kind of war', title: 'Atomic strike', sub: A.name + ' has destroyed a region of ' + (names || 'empty land') + ' with a single weapon.', a: A.id, tone: 'bad' } : { kicker: 'The bomb again', title: A.base + ' strikes', sub: 'A second atomic war. ' + (names || 'Empty land') + ' burns.', a: A.id, tone: 'bad' });
      if (ID.Press) ID.Press.add(G, { w: first ? 5 : 3, kind: 'nuke', a: A.id, title: first ? 'A city gone in a single flash' : A.base + ' uses the bomb again', text: A.name + ' has used an atomic weapon against ' + (names || 'empty land') + '. ' + (first ? 'No weapon like it has been used before. Observers who reached the edge of the zone report nothing standing for miles and a sickness among the survivors that the doctors cannot name. Every chancellery in the world met in emergency session within the day.' : 'It is no longer the first time, and the dispatches are shorter. The dead are not fewer.') });
    }
    for (const k in hit) { G.nations[+k].a.nukedBy = A.id; G.nations[+k].a.nukedAt = G.tick; }
  };

  /* ---------------------------------------------------------------- monthly world diplomacy */
  D.month = function (G) {
    const ns = ID.alive(G);
    for (const a of ns) for (const b of ns) {
      if (a === b) continue;
      const d = G.dip[ID.dkey(a.id, b.id)];
      if (d && d.war) continue;
      let base = ID.ideoAffinity(a.ideo, b.ideo) + (ID.sameBloc(G, a.id, b.id) ? 38 : 0) + (d && d.trade ? 9 : 0) + (d && d.nap ? 6 : 0) - b.threat * (ID.borders(G, a.id, b.id) ? 0.55 : 0.3);
      if (a.claims.length && ID.borders(G, a.id, b.id)) base -= 8;
      // the two wings of a pan-national movement: each regime is the other's traitor, unless they share a union
      if (a.ideo === b.ideo && ID.ideo(a).flags.panNation && !((a.dep && a.dep.over === b.id) || (b.dep && b.dep.over === a.id))) base -= 75;
      const cur = G.rel[a.id * MAXN + b.id];
      G.rel[a.id * MAXN + b.id] = cur + (clamp(base, -100, 100) - cur) * 0.03;
    }
    // tribute owed under a peace treaty (D.terms)
    for (const n of ns) {
      const t = n.trib; if (!t) continue;
      const to = G.nations[t.to];
      if (G.tick >= t.until || !to || !to.alive || ID.atWar(G, n.id, t.to)) { n.trib = null; continue; } // paid off, or the treaty is torn up by war
      const take = Math.max(0, n.rev || 0) * t.share; n.gold -= take; to.gold += take; n.a.tribPaid = take;
    }
    // capitulation of the nearly-destroyed
    for (const n of ns) {
      if (!n.alive || !n.nwars) continue;
      const wt = n.a.warTiles || n.startTiles;
      if (n.tiles < wt * 0.15 && !ID.ideo(n).flags.noDecap) {
        let best = null, bt = -1;
        for (const e of D.enemies(G, n)) { const w = D.warOf(G, n.id, e.id); const t = w.a === e.id ? w.ta : w.tb; if (t > bt) { bt = t; best = e; } }
        if (best && bt > 0) D.capitulate(G, n, best);
      }
    }
    G.world.tension = Math.max(0, G.world.tension - 0.6);
    for (const n of ns) { const sh = n.tiles / Math.max(1, G.landCount); if (sh > 0.18) n.threat = Math.max(n.threat, (sh - 0.18) * 250); }
    // the great war
    let warPow = 0, tot = 0;
    for (const n of ns) { const p = D.power(n); tot += p; if (n.nwars) warPow += p; }
    const share = warPow / Math.max(1, tot);
    if ((!G.world.greatWar || (G.world.greatWar === 2 && G.tick - G.world.greatWarEnd > 3600)) && share > 0.6 && ns.filter((n) => n.nwars).length >= 6) {
      G.world.greatWar = 1; ID.news(G, 'THE GREAT WAR: most of the world’s power is now under arms.', 'war'); ID.headline(G, { kicker: 'The world at war', title: 'The Great War', sub: 'Most of the world’s power is now under arms.', tone: 'war' }); ID.chron(G, 'world', 'A Great War engulfs the world.'); ID.sfx(G, 'war');
    } else if (G.world.greatWar === 1 && share < 0.25) {
      G.world.greatWar = 2; G.world.greatWarEnd = G.tick;
      ID.news(G, 'The Great War is over. Exhausted peoples ask what it was for.', 'rev'); ID.headline(G, { kicker: 'Armistice', title: 'The guns fall silent', sub: 'Exhausted peoples ask what it was for. A revolutionary wave is rising.', tone: 'rev' }); ID.chron(G, 'world', 'The Great War ends. A revolutionary wave follows.');
      for (const n of ns) { if (n.we > 25) { ID.addMod(n, 'opp', 0.8, 30, 'Post-war ferment'); } }
    }
  };
})();
