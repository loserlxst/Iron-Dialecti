/* IRON DIALECTIC — AI: each state manages its own politics, pursues its ideology's ends,
   builds blocs, subverts rivals, betrays when it pays, and fights OpenFront-style. No DOM. */
(function () {
  'use strict';
  const ID = (globalThis.ID = globalThis.ID || {});
  const clamp = ID.clamp, B = ID.B, T = ID.T;
  const AI = (ID.AI = {});
  const D = () => ID.Diplomacy;
  const ERA_AGG = [0.6, 0.95, 1.4, 1.1];
  /* the two world wars of the historical campaign: alliances drag everyone in, and no war is phony */
  const worldWar = (G) => { if (!G.historical) return false; const y = ID.yearOf(G.tick); return (y >= 1914 && y < 1919) || (y >= 1939 && y < 1946); };

  function threats(G, n) {
    let worst = null, ws = 0;
    for (const k in G.border[n.id] || {}) {
      const o = G.nations[+k]; if (!o.alive) continue;
      if (ID.atWar(G, n.id, o.id)) { const s = 2 + D().power(o) / Math.max(1, D().power(n)); if (s > ws) { ws = s; worst = o; } continue; }
      if (ID.sameBloc(G, n.id, o.id)) continue;
      const hostile = -ID.op(G, o.id, n.id) / 100, ratio = D().power(o) / Math.max(1, D().power(n));
      const s = hostile > 0.25 && ratio > 0.8 ? hostile * ratio : 0;
      if (s > ws) { ws = s; worst = o; }
    }
    n.a.threatened = ws > 0.3; n.a.worst = worst ? worst.id : 0;
    return worst;
  }

  /* ---------------------------------------------------------------- domestic management */
  function budget(G, n) {
    const I = ID.ideo(n), e = I.econ, base = I.budget, E = ID.Economy;
    if (e.model === 'council') return;
    if (I.flags.fiveYear) { if (!n.plan && n.auth >= 15) ID.Events.runDecision(G, n, 'five_year_plan'); if (n.plan) return; }
    const b = Object.assign({ welfare: 0, security: 0, science: 0, arms: 0, heavy: 0 }, base);
    if (n.nwars) { b.arms += 0.14; b.welfare -= 0.04; b.science -= 0.03; if (ID.Economy.monthsLeft(n) < 12) { b.arms += 0.08; b.welfare -= 0.04; } }
    else if (n.equip < 0.9 && n.gold > 200) b.arms += 0.05; // restock after a war
    else if (n.a.threatened) { b.arms += 0.07; b.science -= 0.02; }
    if (n.fs.workers < 40 || n.fs.peasants < 38) b.welfare += 0.06;
    if (n.coupRisk > 0.01) { b.arms += 0.05; b.security += 0.03; }
    if ((n.a.opp || 0) > 35) b.security += 0.04;
    if (n.fs.intelligentsia < 35) b.science += 0.03;
    if (n.debt > E.debtCap(n) * 0.5 || (n.gold < 40 && n.net < 0)) {
      n.a.austerity = Math.min(0.6, (n.a.austerity || 0) + 0.1);
    } else if (n.gold > 150) n.a.austerity = Math.max(0, (n.a.austerity || 0) - 0.1);
    if (n.a.austerity) { const k = 1 - n.a.austerity; b.welfare *= k; b.science *= k; b.heavy *= k; b.security *= 0.5 + k / 2; if (!n.nwars) b.arms *= 0.5 + k / 2; }
    if (n.gold > 500 && n.net > 0) { b.welfare += 0.05; b.science += 0.05; }
    for (const c of E.CATS) n.budget[c] = clamp(b[c], 0, E.budgetMax(n, c));
    if (e.taxMin != null) {
      if (n.fs.capital < 34 && n.tax > e.taxMin + 2) n.tax -= 2;
      else if ((n.net < 0 || n.nwars) && n.fs.capital > 48 && n.tax < e.taxMax - 2) n.tax += 2;
      else if (n.gold > 500 && n.tax > e.tax) n.tax -= 1;
    }
    if (e.model === 'manor') { if (n.fs.peasants < 40 && n.rent > e.rentMin + 3) n.rent -= 3; else if (n.net < 0 && n.fs.peasants > 52 && n.rent < e.rentMax - 3) n.rent += 2; }
    if (e.model === 'pact') { if (n.fs.workers < n.fs.capital - 10) n.pact = Math.min(75, n.pact + 2); else if (n.fs.capital < n.fs.workers - 10) n.pact = Math.max(25, n.pact - 2); }
  }

  function mobilise(G, n) {
    const mx = ID.maxMob(n); const r = ID.RECRUIT[n.laws.recruit];
    let t = n.nwars ? 0.96 : n.a.threatened ? 0.7 : 0.42;
    if (ID.ideo(n).dip.agg > 0.6 && !n.nwars) t = Math.max(t, 0.6);
    if (n.net < -5 && !n.nwars) t *= 0.8;
    n.mob += (mx * t - n.mob) * 0.4;
    if (r.hire) {
      const want = n.pop * n.mob;
      while (n.troops < want * 0.9 && n.gold > (n.nwars ? 130 : 320)) { n.gold -= 100; n.troops += Math.max(40, n.pop * 0.008); }
    }
    if (n.nwars && n.laws.mobil === 'peace' && n.auth >= 4 && (n.we > 15 || G.rng.chance(0.3))) ID.Politics.setLaw(G, n, 'mobil', ID.eraOf(G.tick) >= 2 && n.a.losing ? 'total' : 'partial');
    else if (!n.nwars && n.laws.mobil !== 'peace') { n.laws.mobil = 'peace'; n.mob = Math.min(n.mob, ID.maxMob(n)); }
  }

  function borderTile(G, n, o) {
    const W = G.W, H = G.H;
    for (let t = 0; t < 500; t++) {
      const i = G.rng.int(0, G.N - 1); if (G.owner[i] !== n.id || G.bld[i]) continue;
      const x = i % W, y = (i / W) | 0;
      for (const [dx, dy] of [[4, 0], [-4, 0], [0, 4], [0, -4]]) {
        const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
        if (G.owner[yy * W + xx] === o.id) return i;
      }
    }
    return -1;
  }
  function build(G, n) {
    const I = ID.ideo(n);
    let pending = 0; for (const q of G.builds) if (q.owner === n.id) pending++;
    if (pending >= (n.gold > 700 ? 4 : 2)) return;
    const can = (type) => n.gold > ID.buildCost(G, n, type) * 1.25 + (n.nwars ? 60 : 20);
    // wrecks first: half price, half the time
    if (n.a.wrecks) for (const t of [B.FACTORY, B.CITY, B.PORT, B.FORT, B.SILO]) {
      const i = G.blist.find((j) => G.bld[j] === t && !G.hp[j] && G.owner[j] === n.id && !ID.canRebuild(G, n, j));
      if (i != null && n.gold > ID.rebuildCost(G, n, i) * 1.5 + 40) { ID.startRebuild(G, n, i); return; }
    }
    const worst = n.a.worst ? G.nations[n.a.worst] : null;
    if (worst && worst.alive && n.nb[B.FORT] < 1 + n.tiles / 800 && can(B.FORT) && G.rng.chance(0.6)) { const i = borderTile(G, n, worst); if (i >= 0) { ID.startBuild(G, n, i, B.FORT); return; } }
    const era = ID.eraOf(G.tick);
    if (era >= 2 && n.tech.mil >= 4 && n.nb[B.SILO] < 2 && n.gold > 900) { const s = ID.spotNear(G, n.capital, n.id, 12); if (s >= 0) { ID.startBuild(G, n, s, B.SILO); return; } }
    // the bomb: only great powers, or a state facing one that has it, and only when rich; slow either way
    const at = ID.Economy.atom(n), major = ID.isMajor(G, n), menaced = worst && worst.alive && (worst.nukes > 0 || (worst.thermo || 0) > 0);
    if (!at.on && at.lv === 0 && n.tech.mil >= 6 && (major || menaced) && n.gold > 2500 && G.rng.chance(major ? 0.06 : 0.015)) ID.Events.runDecision(G, n, 'atom_programme');
    else if (!at.on && at.lv === 1 && n.tech.mil >= ID.Economy.ATOM.thermo.mil && major && n.gold > 6000 && G.rng.chance(0.03)) ID.Events.runDecision(G, n, 'thermo_programme');
    if (n.nb[B.SILO]) {
      if (at.lv >= 2 && (n.thermo || 0) < 1 && n.gold > 9000) ID.Events.runDecision(G, n, 'build_thermo');
      else if (at.lv >= 1 && n.nukes < 2 && n.gold > 3500) ID.Events.runDecision(G, n, 'build_nuke');
      else if (n.missiles < 2 && n.gold > 450) ID.Events.runDecision(G, n, 'build_missile');
    }
    const seaWant = (n.a.routes || []).filter((r) => !r.border && !r.sea && (r.oPort || 0) >= 0.5).length; // treaties stuck overland for want of ports
    if (n.coastTiles > 8 && (n.nb[B.PORT] < (I.flags.navalPower ? 5 : 1 + (n.tiles > 2000 ? 1 : 0)) || (seaWant >= 2 && n.nb[B.PORT] < 6)) && can(B.PORT)) {
      for (let t = 0; t < 200; t++) { const i = G.rng.int(0, G.N - 1); if (G.owner[i] === n.id && G.coast[i] && !G.bld[i]) { ID.startBuild(G, n, i, B.PORT); return; } }
    }
    const cap = ID.popCap(n);
    if ((n.pop > cap * 0.8 || n.gold > 600) && n.nb[B.CITY] < n.tiles / (n.gold > 600 ? 170 : 260) && can(B.CITY)) {
      let best = null; for (let p = 1; p < G.provinces.length; p++) { const Pr = G.provinces[p]; if (Pr.owner === n.id && !Pr.nCity && G.owner[Pr.center] === n.id && !G.bld[Pr.center] && G.terrain[Pr.center] !== T.MOUNTAIN && (!best || Pr.fertile * Pr.tiles > best.fertile * best.tiles)) best = Pr; }
      if (best) { ID.startBuild(G, n, best.center, B.CITY); return; }
    }
    const facMax = I.flags.antiIndustry ? n.tiles / 600 : n.tiles / 85;
    if (n.nb[B.FACTORY] < facMax && can(B.FACTORY)) {
      const cities = G.blist.filter((i) => G.bld[i] === B.CITY && G.owner[i] === n.id);
      const s = ID.spotNear(G, cities.length ? G.rng.pick(cities) : n.capital, n.id, 8);
      if (s >= 0) ID.startBuild(G, n, s, B.FACTORY);
    }
  }

  function research(G, n) {
    if (ID.Economy.harvest(n) < 1.04 && n.tech.agr <= n.tech.ind) n.focus = 'agr';
    else if ((n.nwars || n.a.threatened || ID.ideo(n).dip.agg > 0.6) && n.tech.mil <= n.tech.ind) n.focus = 'mil';
    else if (n.tech.ind <= n.tech.mil + 1) n.focus = 'ind';
    else n.focus = n.tech.agr < n.tech.mil ? 'agr' : 'mil';
    const cap = ID.ERAS[ID.eraOf(G.tick)].techCap;
    if (n.tech[n.focus] >= cap) for (const k of ['ind', 'mil', 'agr']) if (n.tech[k] < cap) { n.focus = k; break; }
  }

  function decisions(G, n) {
    const run = (id) => ID.Events.runDecision(G, n, id) === '';
    const I = ID.ideo(n), rng = G.rng, ids = ID.Events.decisionsFor(G, n).map((d) => d.id);
    const has = (id) => ids.indexOf(id) >= 0;
    if (n.coupRisk > (ID.leaderLean(n, 'purge') ? 0.01 : 0.02) && has('purge_officers') && rng.chance(0.4)) run('purge_officers');
    if (n.discipline < 40 && has('party_purge')) run('party_purge');
    if (n.a.unrest > 45 && has('martial_law')) run('martial_law');
    if (n.legit < 42 && has('propaganda_drive') && n.gold > 120) run('propaganda_drive');
    if (n.stab < 36 && has('scapegoat') && rng.chance(0.5)) run('scapegoat');
    if (has('plebiscite') && n.charisma > 62 && n.mandate < 50) run('plebiscite');
    if (has('nationalise') && n.fs.workers > 52 && n.stab > 48 && rng.chance(0.12)) run('nationalise');
    if (has('name_heir') && n.leader.age > 58) run('name_heir');
    if (has('holy_war') && n.nwars) run('holy_war');
    if (has('missionaries') && n.gold > 150 && rng.chance(0.3)) run('missionaries');
    if (has('expand_network') && n.load > 0.88 && n.gold > 200) run('expand_network');
    if (has('thaw') && n.dist > 65 && n.grievance > 40 && rng.chance(0.2)) run('thaw');
    if (has('cultural_revolution') && n.bureau > 72 && rng.chance(0.08)) run('cultural_revolution');
    if (has('great_leap') && n.fervor > 60 && rng.chance(0.03)) run('great_leap');
    if (has('world_congress') && n.gold > 220 && rng.chance(0.15)) run('world_congress');
    if (has('social_pact') && n.fs.workers < 48 && n.gold > 150) run('social_pact');
    if (has('chamber_arbitration') && Math.min(n.fs.workers, n.fs.capital) < 36) run('chamber_arbitration');
    if (has('royal_progress') && n.tradition < 60 && n.gold > 150) run('royal_progress');
    if (has('cult_campaign') && n.charisma < 50 && n.gold > 160) run('cult_campaign');
    if (has('recall_delegates') && n.bureau > 30) run('recall_delegates');
    if (has('end_emergency') && n.emergency && !n.nwars && n.stab > 40) run('end_emergency');
    if (has('orbital') && n.gold > 1800) run('orbital');
    if (has('print_money') && n.debt > ID.Economy.debtCap(n) * 0.8 && n.inflation < 25) run('print_money');
    // concessions to the angriest powerful faction
    let worst = null;
    for (const f of ID.FACTION_IDS) if (n.fs[f] < 38 && n.fp[f] > 11 && (!worst || n.fs[f] * 1 - n.fp[f] < n.fs[worst] - n.fp[worst])) worst = f;
    if (worst && n.gold > 130) run('conc_' + worst);
    // ride a drift deliberately when it suits a failing regime
    if (n.stab < 30 && n.auth >= 50 && !n.trans) for (const k in n.drift) if (n.drift[k] > 55 && rng.chance(0.25)) { ID.Events.embrace(G, n, k); break; }
  }

  /* ---------------------------------------------------------------- diplomacy */
  function proposeTo(G, n, o, kind) {
    if (o.id === G.player && !G.autoPlayer) {
      if ((n.cd['prop_' + kind] || 0) > G.tick) return false;
      n.cd['prop_' + kind] = G.tick + (kind === 'peace' ? 180 : 540);
      if (!G.offers) G.offers = [];
      if (!G.offers.some((x) => x.from === n.id && x.kind === kind)) { G.offers.push({ from: n.id, kind, until: G.tick + 120 }); ID.sfx(G, kind === 'peace' || kind === 'ally' ? 'event' : 'click'); G.uiDirty = true; }
      return true;
    }
    return D().propose(G, n, o, kind) === '';
  }

  function diplomacy(G, n) {
    const I = ID.ideo(n), rng = G.rng, ns = ID.alive(G), Dp = D();
    const myP = Dp.power(n);
    // trade
    if (n.laws.trade !== 'autarky' && rng.chance(0.5)) {
      const c = ns.filter((o) => o !== n && !ID.atWar(G, n.id, o.id) && !ID.dipOf(G, n.id, o.id).trade && ID.op(G, n.id, o.id) > -5 && (ID.borders(G, n.id, o.id) || (n.nb[B.PORT] && o.nb[B.PORT])));
      if (c.length) { const o = rng.pick(c); if (Dp.evalProposal(G, n, o, 'trade').ok && (o.ai || Dp.evalProposal(G, o, n, 'trade').ok)) proposeTo(G, n, o, 'trade'); }
    }
    // blocs
    if (!n.bloc && !(n.dep && ID.Sov.vetoes(G, n, 'war')) && !(I.flags.nonAligned && !n.a.threatened)) {
      let best = null, bs = 12;
      for (const bl of G.blocs) {
        if (!bl || !bl.members.length) continue; const L = G.nations[bl.leader]; if (!L.alive || bl.coalition) continue;
        if (ID.areRivals(n.ideo, L.ideo)) continue;
        const s = ID.ideoAffinity(n.ideo, L.ideo) * 0.6 + ID.op(G, n.id, L.id) * 0.5 + (n.a.threatened ? 12 : 0) - 30;
        if (s > bs) { bs = s; best = L; }
      }
      if (best && rng.chance(0.5)) proposeTo(G, n, best, 'ally');
      else if (!best && !(G.historical && ID.yearOf(G.tick) < 1939) && (ID.rankOf(G, n, 'power') <= 4 || n.a.threatened) && rng.chance(0.35)) {
        const c = ns.filter((o) => o !== n && !o.bloc && !ID.areRivals(n.ideo, o.ideo) && ID.ideoAffinity(n.ideo, o.ideo) > 8 && ID.op(G, o.id, n.id) > 25);
        if (c.length) proposeTo(G, n, rng.pick(c), 'ally');
      }
    } else if (n.bloc) {
      const bl = G.blocs[n.bloc];
      // join an ally's war
      for (const mid of bl.members) {
        const m = G.nations[mid]; if (m === n || !m.alive || !m.nwars) continue;
        for (const e of Dp.enemies(G, m)) {
          if (ID.atWar(G, n.id, e.id) || Dp.warBlock(G, n, e) || n.nwars >= 2 || n.stab < 35) continue;
          const w = Dp.warOf(G, m.id, e.id); if (w.cb === 'civil') continue;
          // only members that border the enemy join, unless the ally is losing badly
          const ww = worldWar(G) || bl.coalition === e.id; // a coalition exists to fight its menace, wherever it is
          if ((ID.borders(G, n.id, e.id) || ((ww || Dp.warScore(G, m, e) < -0.3) && n.nb[B.PORT])) && rng.chance(ww ? (bl.leader === mid ? 0.35 : 0.18) : bl.leader === mid ? 0.2 : 0.08)) { Dp.startWar(G, n, e, 'alliance'); break; }
        }
      }
      // betrayal: a ruthless member turns on a weak, estranged bloc
      const L = G.nations[bl.leader];
      if (L !== n && L.alive && ID.op(G, n.id, L.id) < -5 && rng.chance(0.3)) Dp.leaveBloc(G, n, true);
    }
    // foreign civil wars: back the side closer to us
    if (rng.chance(0.4) && n.stab > 40) {
      for (const R of ns) {
        if (!R.civilOf || R === n) continue; const Gv = G.nations[R.civilOf]; if (!Gv || !Gv.alive || Gv === n || !ID.atWar(G, R.id, Gv.id)) continue;
        const lean = ID.ideoAffinity(n.ideo, R.ideo) - ID.ideoAffinity(n.ideo, Gv.ideo);
        if (Math.abs(lean) < 30) continue;
        const side = lean > 0 ? R : Gv, foe = lean > 0 ? Gv : R;
        if (!(ID.borders(G, n.id, side.id) || ID.borders(G, n.id, foe.id) || ID.rankOf(G, n, 'power') <= 4)) continue;
        if (n.gold > 120 && n.troops > 60) {
          const t = n.troops * 0.04; n.troops -= t; side.troops += t; n.gold -= 30; side.gold += 30; ID.addOpBoth(G, n.id, side.id, 6); ID.addOpBoth(G, n.id, foe.id, -6);
          if (!side.a['aid' + n.id]) { side.a['aid' + n.id] = 1; ID.news(G, n.name + ' sends arms and volunteers to ' + side.name + '.', 'dip', n.id, side.id); }
        }
        if (I.dip.agg > 0.45 && ID.borders(G, n.id, foe.id) && !n.nwars && !Dp.warBlock(G, n, foe) && rng.chance(0.15)) Dp.startWar(G, n, foe, 'liberate');
        break;
      }
    }
    // non-aggression with the neighbour we fear, when busy elsewhere
    const worst = n.a.worst ? G.nations[n.a.worst] : null;
    if (worst && !ID.atWar(G, n.id, worst.id) && !ID.dipOf(G, n.id, worst.id).nap && (n.nwars || Dp.power(worst) > myP * 1.3) && rng.chance(0.4)) proposeTo(G, n, worst, 'nap');
    // coalition against a menace
    const top = G.stats.top;
    if (top && top !== n.id && G.nations[top].alive) {
      const Tn = G.nations[top];
      if ((Tn.threat > 55 || G.stats.topShare > 0.3) && ID.op(G, n.id, Tn.id) < -15 && !ID.sameBloc(G, n.id, Tn.id)) {
        let co = null; for (const bl of G.blocs) if (bl && bl.coalition === Tn.id && bl.members.length) co = bl;
        if (!co && !n.bloc && myP > Dp.power(Tn) * 0.25) { co = Dp.formBloc(G, n); co.coalition = Tn.id; co.name = 'Coalition against ' + Tn.base; ID.news(G, 'A coalition forms against ' + Tn.name + '.', 'dip', n.id, Tn.id); if (Tn.id === G.player) ID.headline(G, { kicker: 'Encirclement', title: 'The world turns on ' + Tn.base, sub: n.name + ' leads a coalition against us.', a: n.id, b: Tn.id, tone: 'bad' }); ID.chron(G, 'bloc', 'A coalition forms against ' + Tn.name + ', led by ' + n.name + '.', n.id, Tn.id); }
        else if (co && n.bloc !== co.id && (!n.bloc || G.blocs[n.bloc].leader !== n.id) && rng.chance(0.5)) Dp.joinBloc(G, n, co.id);
        // a coalition that is strong enough together goes to war with its menace
        if (co && co.leader === n.id && G.stats.topShare > 0.33 && !ID.atWar(G, n.id, Tn.id) && !Dp.warBlock(G, n, Tn) && rng.chance(0.06)) {
          let cp = 0; for (const m of co.members) if (G.nations[m] && G.nations[m].alive) cp += Dp.power(G.nations[m]);
          if (cp >= Dp.power(Tn) * 0.8) Dp.startWar(G, n, Tn, 'coalition');
        }
      }
    }
    // peace
    for (const e of Dp.enemies(G, n)) {
      // a phony war: no front and nothing taken for a year ends in a white peace
      const w = Dp.warOf(G, n.id, e.id);
      if (w && w.cb !== 'civil') { const moved = (w.ta || 0) + (w.tb || 0); if (w.mv !== moved) { w.mv = moved; w.mvAt = G.tick; } }
      const coal = (x, y) => x.bloc && G.blocs[x.bloc] && G.blocs[x.bloc].coalition === y.id;
      const phony = w && w.cb !== 'civil' && !worldWar(G) && !coal(n, e) && !coal(e, n) && !ID.borders(G, n.id, e.id) && G.tick - (w.mvAt || w.start) > 360;
      if (phony) { if (e.id === G.player && !G.autoPlayer) proposeTo(G, n, e, 'peace'); else Dp.peace(G, n, e); continue; }
      if (!Dp.wantsPeace(G, n, e)) continue;
      if (e.id === G.player && !G.autoPlayer) proposeTo(G, n, e, 'peace');
      else if (Dp.wantsPeace(G, e, n) || (G.tick - Dp.warOf(G, n.id, e.id).start) / 30 > 50) Dp.peace(G, n, e);
    }
    // subversion
    const diffS = ID.DIFFICULTY[G.difficulty];
    if (I.dip.export >= 0.3 && n.gold > 160 && n.ops.length < 2 && rng.chance(0.3 * I.dip.export + 0.1)) {
      const c = ns.filter((o) => o !== n && ID.ideo(o).family !== I.family && ID.op(G, n.id, o.id) < 5 && !ID.sameBloc(G, n.id, o.id) && (ID.borders(G, n.id, o.id) || ID.rankOf(G, n, 'power') <= 5));
      const t = rng.weighted(c, (o) => (100 - o.stab) + (o.a.unrest || 0) + (o.id === G.player ? 25 * diffS.subvert : 0));
      if (t) Dp.startOp(G, n, 'fund', t);
    }
    if (n.ops.length && n.gold < 30) for (let k = n.ops.length - 1; k >= 0; k--) Dp.stopOp(G, n, k); // stopOp also frees a recruited figure
    if (I.dip.export >= 0.2 && !I.flags.broadcast && n.gold > 380 && n.ops.length < 3 && rng.chance(0.035)) { // a broadcasting revolution spreads by the signal, not by colonels
      const c = ns.filter((o) => o !== n && !ID.ideo(o).flags.noCoup && ID.op(G, n.id, o.id) < -25 && ID.ideo(o).family !== I.family && !o.civilOf && Dp.plotBest(G, n, o));
      const t = c.length ? rng.weighted(c, (o) => Math.max(1, 100 - o.stab + (o.id === G.player ? 10 * diffS.subvert : 0))) : null;
      if (t) Dp.startOp(G, n, 'coup', t);
    }
    if (I.flags.generalStrike && n.gold > 120 && n.auth >= 20 && rng.chance(0.3)) {
      const c = ns.filter((o) => o !== n && o.fs.workers < 45 && o.laws.labor !== 'control' && ID.op(G, n.id, o.id) < -10 && (n.cd['strike_' + o.id] || 0) <= G.tick);
      if (c.length) Dp.startOp(G, n, 'strike', rng.pick(c));
    }
    considerWar(G, n);
  }

  function considerWar(G, n) {
    const I = ID.ideo(n), rng = G.rng, Dp = D();
    if (n.a.grace == null) n.a.grace = 360 + rng.int(0, 540);
    if (n.stab < 34 || n.we > 30 || n.age < 12 || n.trans > 0 || G.tick - G.startTick < n.a.grace) return;
    if (n.nwars >= (ID.rankOf(G, n, 'power') <= 2 ? 2 : 1)) return;
    const rested = !n.a.lastPeace || G.tick - n.a.lastPeace > 4 * 360; // four years of peace after every war
    if (n.civil && G.nations[n.civil].alive) return;
    const era = ID.eraOf(G.tick); const diffA = ID.DIFFICULTY[G.difficulty].aiAgg;
    const myP = Dp.power(n) * (n.nwars ? 0.6 : 1);
    let best = null, bs = 0, bcb = null;
    const cands = new Set(Object.keys(G.border[n.id] || {}).map(Number));
    if (n.nb[B.PORT] && (I.flags.navalPower || cands.size < 1 || rng.chance(0.1))) {
      const W = G.W, range = ID.Combat.navalRange(G, n) * 0.8, cx = n.capital % W, cy = (n.capital / W) | 0;
      for (const o of ID.alive(G)) if (o.coastTiles > 0 && Math.hypot((o.capital % W) - cx, ((o.capital / W) | 0) - cy) < range) cands.add(o.id);
    }
    for (const id of cands) {
      const o = G.nations[id]; if (!o || !o.alive || o === n || Dp.warBlock(G, n, o)) continue;
      // rest after a war, unless the target is in civil war or is the runaway power everyone fears
      if (!rested && !(o.civil && G.nations[o.civil] && G.nations[o.civil].alive) && !(G.stats.top === o.id && (o.threat > 50 || G.stats.topShare > 0.3))) continue;
      const d = ID.dipOf(G, n.id, o.id);
      let theirs = Dp.power(o);
      if (o.dep && G.nations[o.dep.over] && G.nations[o.dep.over].alive && o.dep.over !== n.id) theirs += Dp.power(G.nations[o.dep.over]) * 0.6;
      if (o.bloc) for (const m of G.blocs[o.bloc].members) if (m !== o.id && G.nations[m].alive && !ID.atWar(G, m, n.id)) theirs += Dp.power(G.nations[m]) * 0.45;
      // rivals who might step in for the victim
      for (const x of ID.alive(G)) if (x !== n && x !== o && !x.nwars && ID.op(G, x.id, n.id) < -22 && (ID.borders(G, x.id, n.id) || ID.borders(G, x.id, o.id)) && !ID.sameBloc(G, x.id, n.id)) theirs += Dp.power(x) * 0.35;
      const ratio = myP / Math.max(1, theirs);
      const op = ID.op(G, n.id, o.id);
      const cb = Dp.casusBelli(G, n, o);
      let s = (Math.min(ratio, 2.4) - 1.2) * 1.0 + clamp(-op / 100, -0.5, 1) * 0.6 + (cb ? 0.28 : 0) - 1.2 + I.dip.agg * 0.9 * ERA_AGG[era] + ID.leaderLean(n, 'agg');
      if (ratio < 0.9) s -= 0.5;
      if (o.nwars) s += 0.1;
      if (o.civil && G.nations[o.civil] && G.nations[o.civil].alive) s += 0.3;
      if (o.stab < 30) s += 0.15;
      if (cb === 'coalition' || (G.stats.top === o.id && o.threat > 50)) s += 0.3;
      if (d.nap) { if (I.dip.agg > 0.65 && op < -30 && ratio > 1.6) s -= 0.35; else continue; }
      if (!ID.borders(G, n.id, o.id)) s -= 0.7;
      if (o.id === G.player) s = s * diffA + (diffA - 1) * 0.3;
      if ((o.nukes > 0 || o.thermo > 0) && n.nukes === 0) s -= o.thermo > 0 ? 0.9 : 0.5;
      if (G.historical && ID.yearOf(G.tick) < 1939) s -= 0.45;
      else if (G.historical && ID.yearOf(G.tick) >= 1946) s -= 0.15; // the cold war is fought by proxies (sim/sovereignty.js)
      if (s > bs) { bs = s; best = o; bcb = cb; }
    }
    if (best && rng.chance(Math.min(0.5, bs * 0.55))) Dp.declare(G, n, best);
  }

  /* ---------------------------------------------------------------- war */
  function pickStyle(G, n, e, pool) {
    const st = ID.ideo(n).doctrine.styles, C = ID.Combat;
    const rough = (e.tc[T.FOREST] + e.tc[T.HILLS] + e.tc[T.MOUNTAIN]) / Math.max(1, e.tiles);
    let best = 'advance', bv = st.advance || 1;
    const tryS = (s, v) => { if (C.styleOk(n, s) && v > bv) { bv = v; best = s; } };
    tryS('blitz', n.gold > 150 ? (st.blitz || 0) * (rough < 0.4 ? 1.5 : 0.7) : 0);
    tryS('infiltrate', (st.infiltrate || 0) * (rough > 0.45 ? 1.25 : 0.8));
    tryS('siege', n.gold > 100 && e.nb[B.FORT] >= 2 ? (st.siege || 0) * 1.15 : 0);
    tryS('assault', pool > e.troops * 2.5 ? (st.assault || 0) * 1.2 : 0);
    return best;
  }
  function landingTile(G, n, e) {
    const W = G.W, cx = e.capital % W, cy = (e.capital / W) | 0; let best = -1, bd = 1e9;
    for (let t = 0; t < 500; t++) {
      const i = G.rng.int(0, G.N - 1); if (G.owner[i] !== e.id || !G.coast[i]) continue;
      const d = Math.hypot((i % W) - cx, ((i / W) | 0) - cy) + (G.fortCov[i] === e.id ? 60 : 0);
      if (d < bd) { bd = d; best = i; }
    }
    return best;
  }
  AI.war = function (G, n) {
    const Dp = D(), C = ID.Combat, I = ID.ideo(n);
    const enemies = Dp.enemies(G, n); if (!enemies.length) return;
    const target = Math.max(1, n.pop * n.mob);
    const cap = n.emergency ? 1 : I.control.cap;
    let incoming = 0, losing = false;
    for (const a of G.attacks) if (a.to === n.id) incoming += a.troops;
    for (const e of enemies) if (Dp.warScore(G, n, e) < -0.25) losing = true;
    n.a.losing = losing;
    { const want = losing ? (n.flags.ld_depth ? 'depth' : 'defend') : n.nwars && n.troops > n.pop * ID.maxMob(n) * 0.6 && G.rng.chance(0.5) ? 'attack' : 'balanced'; if ((n.posture || 'balanced') !== want && (!n.postureAt || G.tick - n.postureAt > 120)) C.setPosture(G, n, want); }
    // pockets: aim at an enemy landing's beach or port (taking it cuts the pocket off), relieve our own
    // encircled pockets, and send a pocket whose beach is wearing out toward the nearest enemy port
    for (const a of G.attacks) {
      if (!(a.pk >= 0)) continue;
      if (a.to === n.id && a.sea >= 0 && G.owner[a.sea] === a.from && G.rng.chance(0.5)) (n.objs = n.objs || {})[a.from] = a.sea;
      else if (a.from === n.id && a.to) {
        const p = C.pocketInfo(G, a); if (!p) continue;
        if (p.enc && a.bo >= 0) { let best = -1, bd = 1e9; const W = G.W, bx = a.bo % W, by = (a.bo / W) | 0; for (const v of a.heap.v) { if (G.owner[v] !== a.to) continue; const d = Math.abs(v % W - bx) + Math.abs(((v / W) | 0) - by); if (d < bd) { bd = d; best = v; } } if (best >= 0) (n.objs = n.objs || {})[a.to] = best; }
        else if (!p.enc && p.sea !== 'port' && (a.pobj == null || a.pobj < 0 || G.owner[a.pobj] !== a.to)) { const W = G.W, x0 = a.pk % W, y0 = (a.pk / W) | 0; let bd = 40; a.pobj = -1; for (const i of G.blist) if (G.bld[i] === B.PORT && G.owner[i] === a.to) { const d = Math.abs(i % W - x0) + Math.abs(((i / W) | 0) - y0); if (d < bd) { bd = d; a.pobj = i; } } }
      }
    }
    // landward enemies sorted by threat
    const land = enemies.filter((e) => ID.borders(G, n.id, e.id) > 0);
    land.sort((a, c) => Dp.power(c) - Dp.power(a));
    let pool = n.troops;
    const readiness = pool / target;
    for (const e of land) {
      let mine = null, theirs = null;
      for (const a of G.attacks) { if (a.from === n.id && a.to === e.id) mine = a; else if (a.from === e.id && a.to === n.id) theirs = a; }
      const ratio = (pool + (mine ? mine.troops : 0)) / Math.max(1, e.troops + (theirs ? theirs.troops : 0));
      // recall a losing push
      if (mine && theirs && mine.troops < theirs.troops * 0.3 && ratio < 0.6 && G.rng.chance(0.3)) { C.cancel(G, mine); continue; }
      let commit = 0;
      if (theirs && (!mine || mine.troops < theirs.troops * 0.7)) commit = Math.min(pool * 0.55, theirs.troops * 0.9);
      else if (readiness > 0.62 && (!mine || mine.troops < pool * 0.25)) {
        const reserve = land.length > 1 ? 0.45 : n.a.threatened && !losing ? 0.4 : 0.3;
        if (ratio > 0.75 || e.troops < e.pop * 0.01 || G.rng.chance(0.15)) commit = pool * (1 - reserve) / Math.min(2, land.length);
      } else if (e.troops < 8 && pool > 20 && !mine) commit = pool * 0.3;
      commit = Math.min(commit, pool * cap);
      if (commit > Math.max(5, target * 0.04)) {
        if (C.objOf(G, n, e.id) < 0 && G.rng.chance(0.5)) { const t = C.aiObjective(G, n, e); if (t >= 0) (n.objs = n.objs || {})[e.id] = t; }
        const r = C.launch(G, n.id, e.id, commit, pickStyle(G, n, e, pool));
        if (r && typeof r !== 'string') pool = n.troops;
      }
    }
    // guns and bombers on the busiest front
    if (n.gold > 110 && G.tick % 8 === 0) {
      const myAt = G.attacks.filter((a) => a.from === n.id && a.to && a.heap.size);
      if (myAt.length) {
        const a = myAt[G.rng.int(0, myAt.length - 1)], v = a.heap.v, t = v[G.rng.int(0, v.length - 1)];
        if (G.owner[t] === a.to) {
          // bombers go for the factories, ports and cities behind the front; guns for the line, fortresses first
          let bt = -1;
          if (n.tech.mil >= 3 && n.gold > 220 && (n.cd.ab_airraid || 0) <= G.tick) {
            const W = G.W, tx = t % W, ty = (t / W) | 0, cand = G.blist.filter((i) => G.owner[i] === a.to && G.hp[i] && (G.bld[i] === B.FACTORY || G.bld[i] === B.PORT || G.bld[i] === B.CITY) && Math.hypot((i % W) - tx, ((i / W) | 0) - ty) < 50);
            if (cand.length) bt = G.rng.pick(cand);
          }
          if (bt >= 0 && !C.abilBlock(G, n, 'airraid', bt)) C.useAbil(G, n, 'airraid', bt);
          else { let st = t; for (let k = 0; k < 6; k++) { const u = v[G.rng.int(0, v.length - 1)]; if (G.owner[u] === a.to && G.fortCov[u] === a.to) { st = u; break; } } if (!C.abilBlock(G, n, 'barrage', st)) C.useAbil(G, n, 'barrage', st); }
        }
      }
      if (losing && n.gold > 150 && !C.abilBlock(G, n, 'reserves')) C.useAbil(G, n, 'reserves');
      // the doctrine's own order
      const ord = ID.Doctrine.orderOf(n);
      if (ord && G.rng.chance(0.35)) {
        let tile = null;
        if (!ord.self) { const fr = G.attacks.filter((x) => x.from === n.id && x.to && x.heap.size); if (fr.length) { const x = fr[G.rng.int(0, fr.length - 1)], v = x.heap.v; tile = v[G.rng.int(0, v.length - 1)]; } else { const e = enemies[0]; tile = e ? e.capital : null; } }
        let want = false; try { want = !ord.ai || ord.ai(G, n); } catch (e) { want = false; }
        if (want && tile !== -1 && !C.abilBlock(G, n, ord.key, tile)) C.useAbil(G, n, ord.key, tile);
      }
    }
    // naval landings against enemies we cannot reach by land
    if (n.nb[B.PORT] && readiness > 0.6 && (n.a.navalCd || 0) <= G.tick) {
      const sea = enemies.filter((e) => !ID.borders(G, n.id, e.id) && e.coastTiles > 0 && C.crossing(n, e).sunk < 0.3);
      if (sea.length && !G.boats.some((b) => b.owner === n.id)) {
        const e = G.rng.pick(sea); let tile = C.bestLanding(G, n, e, true); if (tile < 0) tile = landingTile(G, n, e);
        if (tile >= 0) { const r = C.launchBoat(G, n, tile, Math.min(pool * 0.5, pool * cap), pickStyle(G, n, e, pool)); n.a.navalCd = G.tick + (typeof r === 'string' ? 120 : 45); }
      }
    }
    // strategic weapons
    if (n.nb[B.SILO] && (n.missiles > 0 || n.nukes > 0 || n.thermo > 0) && G.tick % 20 === 0) {
      const avenge = n.a.nukedBy && G.nations[n.a.nukedBy] && G.nations[n.a.nukedBy].alive && G.tick - n.a.nukedAt < 720 ? G.nations[n.a.nukedBy] : null;
      for (const e of enemies) {
        const dying = losing && n.tiles < (n.a.warTiles || n.tiles) * 0.45;
        const useNuke = n.thermo > 0 && (avenge === e || (dying && I.dip.agg > 0.6)) ? 'thermo'
          : n.nukes > 0 && (avenge === e || (losing && I.dip.agg > 0.5 && (e.nukes === 0 || n.tiles < (n.a.warTiles || n.tiles) * 0.6))) ? 'atom' : '';
        if (!useNuke && n.missiles < 1) continue;
        let tgt = -1; for (const i of G.blist) if (G.owner[i] === e.id && (G.bld[i] === B.CITY || G.bld[i] === B.FORT || G.bld[i] === B.SILO) && typeof C.canMissile(G, n, i, useNuke) !== 'string') { tgt = i; if (G.rng.chance(0.4)) break; }
        if (tgt >= 0) { C.launchMissile(G, n, tgt, useNuke); break; }
      }
    }
  };

  function expand(G, n) {
    if (!G.wildB || !G.wildB[n.id]) return;
    if (G.attacks.some((a) => a.from === n.id && a.to === 0) || G.boats.some((b) => b.owner === n.id && b.relief === 0)) return;
    const target = Math.max(1, n.pop * n.mob), ready = n.troops / target;
    if (ready < 0.5 || n.a.losing) return;
    const share = n.nwars ? 0.12 : n.a.threatened ? 0.2 : 0.3;
    ID.Combat.launch(G, n.id, 0, n.troops * share, 'advance');
  }
  /* Settling empty islands by sea, in peacetime and mostly in the early eras. Colonising systems and seafaring
     states go often; the anti-colonial systems (the socialist and anarchist families, the Third Position, the
     Revival, pan-nationalists, Juche) rarely or never. */
  const SETTLE_W = { merchant: 2.2, liberal: 1.4, conmon: 1.6, absmon: 1.6, minarchy: 1.3, ancap: 1.3, nrx: 1.3, corporatist: 1.1, natpop: 0.9, natsoc: 1.2, junta: 0.8, personalist: 0.8, theocracy: 0.8, technocracy: 0.8, socdem: 0.7, agrarian: 0.4, thirdpos: 0, revival: 0, pannat: 0, juche: 0, nazacc: 0 };
  AI.settleWeight = (n) => { const I = ID.ideo(n); const w = SETTLE_W[n.ideo] != null ? SETTLE_W[n.ideo] : I.family === 'socialist' || I.family === 'anarchist' ? 0.15 : 0.6; return w * (I.flags.navalPower ? 1.5 : 1); };
  function settle(G, n) {
    const C = ID.Combat;
    if (n.nwars || n.a.threatened || !n.nb[B.PORT] || n.gold < 160 || n.troops < 40 || n.trans > 0) return;
    if (G.boats.some((b) => b.owner === n.id) || G.attacks.some((a) => a.from === n.id && a.to === 0 && a.pk >= 0)) return; // one colony at a time
    const w = AI.settleWeight(n) * [1.0, 0.8, 0.5, 0.3][ID.eraOf(G.tick)] * (1 + Math.min(1, C.seaPower(n) / 8));
    if (!w || !G.rng.chance(clamp(0.006 * w, 0, 0.06))) return;
    const t = C.bestSettle(G, n); if (t < 0) return;
    C.settle(G, n, t);
  }
  AI.month = function (G, n) {
    threats(G, n);
    expand(G, n);
    settle(G, n);
    budget(G, n);
    mobilise(G, n);
    research(G, n);
    ID.Focus.aiPick(G, n);
    const phase = (Math.floor(G.tick / 30) + n.id) % 3;
    if (phase === 0) build(G, n);
    else if (phase === 1) diplomacy(G, n);
    else decisions(G, n);
    if (n.nwars && phase !== 0) build(G, n);
    if (phase !== 1 || n.stab < 40) ID.Doctrine.aiMonth(G, n);
  };
})();
