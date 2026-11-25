/* IRON DIALECTIC — coups: one model for all of them. No DOM.
   A coup needs plotters, and they come from somewhere: the army, a figure of the inner circle, a foreign power
   through a figure it has bought, or big business hiring officers. A plot grows through three stages over months
   (grumbling, meetings, a date). The security services decide what the government sees of it, and it can act at
   every stage. When the date comes, the coup is fought over a few days in the capital at odds that are the same
   number the player is shown, and losing it opens a road on (civil war, exile, the new regime) rather than an end.
   Sources: n.plot (army, capital), figure plots (f.plot in sim/regime.js), foreign plots (f.backer, f.prep in
   sim/diplomacy.js). The player's coup in progress is n.coupNow. Every resolution is logged in G.coupLog. */
(function () {
  'use strict';
  const ID = (globalThis.ID = globalThis.ID || {});
  const clamp = ID.clamp, c100 = (v) => clamp(v, 0, 100);
  const Cp = (ID.Coup = {});
  const P = () => ID.Politics, Rg = () => ID.Regime, Dp = () => ID.Diplomacy;
  const fig = (n, seat) => (n.circle || []).find((f) => f.seat === seat) || null;
  const pct = (v) => Math.round(v * 100) + '%';
  const sgn = (v) => (v > 0 ? '+' : '−') + Math.abs(Math.round(v * 100)) + '%';

  Cp.STAGES = ['', 'Grumbling', 'Meetings', 'A date is set'];
  Cp.stage = (prog) => (prog >= 67 ? 3 : prog >= 34 ? 2 : prog > 0 ? 1 : 0);
  /* A content army (support 60+) does not stage coups of its own; a disloyal army chief is a plotter of his own (a figure plot). */
  Cp.content = (n) => n.fs.military >= 60;
  /* What the security services can see: the chance a month to find a plot, from the security law, its budget and the police chief. */
  Cp.intel = function (n) {
    const sec = ID.LAWS.security.opts[n.laws.security], pol = fig(n, 'police');
    return clamp((0.06 + sec.detect * 1.1 + (pol && pol.loy >= 50 && !pol.plot ? pol.comp * 0.03 : 0)) * clamp(n.budget.security / 0.08, 0.3, 1.2), 0, 0.95);
  };
  Cp.WEAK = 0.15; // below this the date of a plot can come without warning

  /* Every plot against n, most advanced first: {src, prog, stage, seat, fig, backer, known, f}. */
  Cp.plots = function (G, n) {
    const out = [];
    if (n.plot) out.push(Object.assign({}, n.plot, { stage: Cp.stage(n.plot.prog) }));
    for (const f of n.circle || []) {
      if (f.backer && G.nations[f.backer] && G.nations[f.backer].alive && (f.prep || 0) > 0) out.push({ src: 'foreign', seat: f.seat, fig: f.name, backer: f.backer, prog: f.prep, stage: Cp.stage(f.prep), known: f.known || 0, f });
      else if (f.plot >= 1) { const prog = Math.min(100, f.plot / 7 * 100); out.push({ src: 'figure', seat: f.seat, fig: f.name, prog, stage: Cp.stage(prog), known: f.known || 0, f }); }
    }
    return out.sort((a, b) => b.prog - a.prog);
  };
  /* Who the plotters are, in a phrase. */
  Cp.who = function (G, n, pl) {
    if (pl.src === 'army') return 'officers of the army';
    if (pl.src === 'capital') return 'financiers and the officers they pay';
    const t = pl.seat && Rg() ? Rg().title(n, pl.seat) : 'a minister';
    if (pl.src === 'foreign') return (pl.fig || 'a man') + ' (' + t + '), paid by ' + (G.nations[pl.backer] ? G.nations[pl.backer].name : 'a foreign power');
    return (pl.fig || 'a man') + ' (' + t + ')';
  };

  /* The plotters' chance of taking the state if the coup came today, with its reasons: {p, rows: [[label, delta]]}.
     The same number is shown to the player, used by a paymaster abroad, and rolled when it happens. */
  Cp.odds = function (G, n, pl) {
    const rows = [], add = (t, v) => { if (Math.abs(v) >= 0.005) rows.push([t, v]); return v; };
    const sec = ID.LAWS.security.opts[n.laws.security], rec = ID.RECRUIT[n.laws.recruit];
    const army = fig(n, 'army'), pol = fig(n, 'police'), plotter = pl.seat ? fig(n, pl.seat) : null;
    let p = add('A plot that reaches its date', 0.3);
    if (pl.src === 'army') p += add('The army itself moves (support ' + Math.round(n.fs.military) + ')', 0.12 + (55 - n.fs.military) / 100);
    else if (pl.seat === 'army') p += add('The army chief brings his own regiments', 0.12 + (50 - n.fs.military) / 200);
    else p += add(n.fs.military >= 60 ? 'A content army stands by the government' : 'The army’s mood (support ' + Math.round(n.fs.military) + ')', n.fs.military >= 60 ? -0.15 - (n.fs.military - 60) / 200 : (50 - n.fs.military) / 150);
    if (army && army !== plotter) p += add(army.name + ', the army chief, ' + (army.loy > 60 ? 'is loyal' : army.loy < 35 ? 'is wavering' : 'waits to see'), army.loy > 60 ? -0.12 : army.loy < 35 ? 0.08 : 0);
    if (plotter) p += add(plotter.name + '’s ability and nerve', (plotter.comp - 1.9) * 0.08 + (plotter.amb - 60) / 300);
    p += add('Security: ' + sec.name, -sec.detect * 0.25);
    if (pl.seat === 'police') p += add('The police are in it', 0.1);
    else if (pol && pol.loy > 60) p += add(pol.name + ', the police chief, is loyal', -0.06);
    p += add('Stability ' + Math.round(n.stab), (50 - n.stab) / 150);
    p += add('Legitimacy ' + Math.round(n.legit), (50 - n.legit) / 150);
    if (pl.src === 'foreign') { const B = G.nations[pl.backer]; p += add('Money and arms from ' + (B ? B.name : 'abroad'), 0.06 + (pl.prep || 0) * 0.003 + (B && ID.ideo(B).flags.permRev ? 0.06 : 0)); }
    if (pl.src === 'capital') p += add('Bankers have money but few guns', -0.08);
    if (n.ideo === 'junta' || n.ideo === 'personalist') p += add('A regime born of a coup breeds coups', 0.18);
    if (rec.coup != null && rec.coup !== 1) p += add(rec.name, (rec.coup - 1) * 0.1);
    const m = ID.mod(n, 'coup'); if (m) p += add('Programmes and laws against coups', clamp(m * 0.3, -0.15, 0.15));
    if (n.a.reassign > G.tick) p += add('Suspect units sent to the frontier', -0.1);
    const cn = n.coupNow;
    if (cn) {
      if (cn.loyal) p += add('Loyal units called in', -0.15);
      if (cn.armed) p += add('Armed workers in the streets', -0.2);
      if (cn.radio) p += add('Your broadcast', cn.radio);
      if (cn.amnesty) p += add('The amnesty you offered', -0.06);
      if (cn.adj) p += add('How the days have gone', cn.adj);
    }
    return { p: clamp(p, 0.05, 0.92), rows };
  };
  /* What a coup would install. */
  Cp.ideoFor = function (G, n, pl) {
    if (pl.src === 'foreign') return P().coupIdeo(G, n, pl.backer);
    if (pl.src === 'capital') return G.rng.pick(ID.IDEOLOGIES.ancap ? ['corporatist', 'junta', 'liberal', 'ancap'] : ['corporatist', 'junta', 'liberal']);
    if (pl.src === 'figure') { const f = fig(n, pl.seat); return f && f.lean !== n.ideo && ID.IDEOLOGIES[f.lean] && ID.ideo(n).control.type !== 'parliament' && G.rng.chance(0.6) ? f.lean : n.ideo; }
    return P().coupIdeo(G, n, 0);
  };

  /* ---------------------------------------------------------------- the months before */
  /* Who has a motive this month, how plots grow, and what the state finds out. Called from Politics.month. */
  Cp.month = function (G, n, rec, diffP) {
    const I = ID.ideo(n), rng = G.rng, isP = n.id === G.player && !G.autoPlayer;
    let army = 0, gen = 0, cap = 0;
    if (!I.flags.noCoup && !P().coupShield(G, n) && !n.coupNow) {
      const shaky = Math.min(3, 1 + Math.max(0, 45 - n.stab) / 15 + Math.max(0, 45 - n.legit) / 20);
      army = (Math.max(0, 56 - n.fs.military) / 56) * (n.fp.military / 16) * (rec.coup != null ? rec.coup : 1) * (1 + Math.min(n.prestige, 60) / 90) * shaky * 0.016;
      if (I.flags.colonels && n.fs.military < 50) army += 0.008;
      if (n.prestige > 65 && n.legit < 45 && n.ideo !== 'junta') gen = 0.01; // a popular general: the army chief plots on his own account
      if (n.fs.capital < 25 && n.fp.capital > 15 && n.fs.military < 50) cap = 0.012;
      if (Cp.content(n)) { army *= 0.03; gen *= 0.5; cap *= 0.3; }
      const k = (n.ai ? 0.8 : diffP.crisis) * Math.max(0.15, 1 + ID.mod(n, 'coup')) * (n.age < 18 ? 0.3 : 1) * (n.a.coupAt != null && G.tick - n.a.coupAt < (isP ? 1440 : 720) ? 0.2 : 1);
      army *= k; gen *= k; cap *= k;
      if (n.id === G.player) { const s = army + gen + cap; if (s > 0.02) { const f = 0.02 / s; army *= f; gen *= f; cap *= f; } }
    }
    n.coupRisk = army + gen + cap; n.a.coupWhy = { army, gen, cap };
    // a popular general's ambition feeds his own plot in the inner circle
    if (gen > 0) { const a = fig(n, 'army'); if (a) a.plot = (a.plot || 0) + gen * 120; }
    // regimes born of a coup breed colonels: an ambitious, half-loyal figure plots even when the army is content
    if ((n.ideo === 'junta' || n.ideo === 'personalist') && !I.flags.noCoup && !n.coupNow) for (const f of n.circle || []) if (f.amb > 62 && f.loy < 50 && !f.backer) f.plot = (f.plot || 0) + 0.25 + (50 - n.stab) / 100;
    // the army's or the bankers' plot is born, grows while the motive lasts, and fades without it
    let pl = n.plot;
    if (!pl && army + cap > 0.002 && rng.chance((army + cap) * 1.5)) pl = n.plot = { src: rng.chance(army / (army + cap)) ? 'army' : 'capital', prog: 1, since: G.tick, known: 0 };
    if (pl) {
      const mot = pl.src === 'army' ? army : cap;
      pl.prog += mot > 0.002 ? (9 + 14 * Math.min(1, mot / 0.012)) * (1 - ID.LAWS.security.opts[n.laws.security].detect * 0.3) : -15;
      if (pl.prog <= 0) n.plot = pl = null;
    }
    // the security services look
    const intel = Cp.intel(n);
    for (const q of Cp.plots(G, n)) {
      const holder = q.f || n.plot; if (!holder) continue;
      if (q.stage <= (holder.known || 0)) continue;
      if (rng.chance(intel * (q.stage === 1 ? 0.4 : q.stage === 2 ? 0.8 : 1)) || (q.stage >= 3 && intel >= Cp.WEAK)) {
        holder.known = q.stage;
        if (isP) { if (!ID.Events.pending(G, 'plot_stage')) ID.Events.queue(G, n, 'plot_stage', { src: q.src, seat: q.seat || '', backer: q.backer || 0, fig: q.fig || '', stage: q.stage }); }
        else Cp.aiAct(G, n, q);
      }
    }
    // the date comes
    if (n.plot && n.plot.prog >= 100 && !n.coupNow) {
      const q = n.plot; n.plot = null;
      if (q.src === 'army' && Cp.content(n)) { if (isP && q.known) ID.news(G, 'The officers’ plot comes to nothing: a content army will not follow them.', 'good', n.id); }
      else Cp.launch(G, n, { src: q.src, known: q.known || 0 });
    }
    if (isP && n.a.restore && G.tick >= n.a.restore.at && !ID.Events.pending(G, 'coup_restore')) { n.a.restore.at = G.tick + 360; ID.Events.queue(G, n, 'coup_restore', {}); }
  };

  /* What an AI government does about a plot it has found. */
  Cp.aiAct = function (G, n, q) {
    const rng = G.rng;
    if (q.src === 'figure' || q.src === 'foreign') { if (q.f && rng.chance(q.stage >= 3 ? 0.9 : q.stage === 2 ? 0.6 : 0.3)) Rg().aiPlot(G, n, q.f); return; }
    if (!n.plot) return;
    if (q.src === 'army') {
      if (n.auth >= 15 && rng.chance(0.35 + 0.15 * q.stage)) Cp.act(G, n, 'purge', q);
      else if (n.gold > 120 && rng.chance(0.5)) Cp.act(G, n, 'buy', q);
      else if (rng.chance(0.4)) Cp.act(G, n, 'reassign', q);
    } else if (rng.chance(0.6)) Cp.act(G, n, n.auth >= 15 ? 'arrest' : 'concede', q);
  };

  /* ---------------------------------------------------------------- what the government can do about a plot */
  Cp.ACTS = {
    purge: { name: 'Purge', desc: { army: 'Retire or arrest the officers involved. The plot dies; the army is weaker for a year and a half, and resents it.', capital: 'Arrest the bankers. The plot dies; investors take fright.', figure: 'Remove him from the inner circle.', foreign: 'Remove him and name his paymaster.' } },
    buy: { name: 'Buy them off', desc: { army: 'Pay rises and promotions. The plot loses half its momentum and the army warms to you.', capital: 'Contracts and tax favours. The plot loses half its momentum.', figure: 'A dacha, a pension and a seat at the top table.', foreign: 'Outbid his paymaster: a dacha, a pension and a seat at the top table.' } },
    reassign: { name: 'Reassign units', desc: { army: 'Send the suspect regiments to the frontier. The plot loses a third of its momentum, and for a year any coup is 10% less likely to succeed; the front loses some punch.' } },
    arrest: { name: 'Arrest them', desc: { any: 'The police move in. The plot dies if they are good enough to catch everyone; under weak security half of them slip away. Grievance grows.' } },
    concede: { name: 'Concede', desc: { army: 'Give the army what it wants: money, status and a voice. The plot ends; you lose authority.', capital: 'Give business what it wants. The plot ends; the workers notice.', figure: 'Give him more power and the promise of more. The plot ends; you lose authority.', foreign: 'Make your peace with his paymaster. The plot ends; you lose authority.' } },
  };
  Cp.acts = function (n, q) {
    const out = [], sec = ID.LAWS.security.opts[n.laws.security];
    out.push('purge');
    if (q.src !== 'capital' || n.gold >= 60) out.push('buy');
    if (q.src === 'army' || q.seat === 'army') out.push('reassign');
    if (q.stage >= 2 && sec.detect > 0) out.push('arrest');
    out.push('concede');
    return out;
  };
  Cp.actDesc = (k, q) => { const d = Cp.ACTS[k].desc; return d[q.src] || d.any || d.army; };
  Cp.buyCost = (n, q) => (q.f ? Math.round(40 + 25 * q.f.comp) : Math.round(60 + n.gdp * 0.5));
  /* Do it. Returns '' or a reason. */
  Cp.act = function (G, n, k, q) {
    const pl = n.plot, f = q.f && n.circle.indexOf(q.f) >= 0 ? q.f : null, isP = n.id === G.player;
    const end = () => { if (q.src === 'army' || q.src === 'capital') n.plot = null; else if (f) { f.plot = 0; f.known = 0; } };
    if (k === 'purge') {
      if (f) { Rg().purge(G, n, f.seat, true); return ''; }
      if (q.src === 'army') { n.sm.military -= 6; ID.addMod(n, 'atk', -0.1, 18, 'Officer purge'); n.prestige = Math.max(0, n.prestige - 20); n.grievance = c100(n.grievance + 4); n.auth = Math.max(0, n.auth - 10); }
      else { n.sm.capital -= 10; n.conf = c100((n.conf || 50) - 10); n.auth = Math.max(0, n.auth - 8); }
      n.a.coupAt = G.tick; end();
    } else if (k === 'buy') {
      const c = Cp.buyCost(n, q);
      if (f) { Rg().winOver(G, n, f.seat, true); f.plot = Math.max(0, f.plot - 3); f.prep = Math.floor((f.prep || 0) / 2); return ''; }
      n.gold -= c; if (pl) pl.prog *= 0.5;
      if (q.src === 'army') n.sm.military += 8; else n.sm.capital += 6;
    } else if (k === 'reassign') {
      n.a.reassign = G.tick + 360; ID.addMod(n, 'atk', -0.03, 12, 'Reshuffled commands');
      if (pl) pl.prog *= 0.66; if (f) { f.plot = Math.max(0, f.plot - 2); if (f.prep) f.prep *= 0.66; }
    } else if (k === 'arrest') {
      const sec = ID.LAWS.security.opts[n.laws.security];
      n.grievance = c100(n.grievance + 6); n.stab -= 2;
      if (G.rng.chance(clamp(0.5 + sec.detect, 0, 1))) { if (f) Rg().purge(G, n, f.seat, true); else end(); n.a.coupAt = G.tick; }
      else { if (pl) pl.prog *= 0.8; if (f) f.plot = Math.max(0, f.plot - 1); if (isP) ID.news(G, 'Half the plotters slip away before the police arrive. The plot goes on, smaller.', 'bad', n.id); }
    } else if (k === 'concede') {
      n.auth = Math.max(0, n.auth - 12);
      if (q.src === 'army') { n.sm.military += 12; ID.addMod(n, 'coup', -0.2, 12, 'The army placated'); }
      else if (q.src === 'capital') { n.sm.capital += 12; n.sm.workers -= 5; }
      else if (q.src === 'foreign') { const B = G.nations[q.backer]; if (B) { ID.addOpBoth(G, n.id, B.id, 15); const o = Dp().plotOp(B, n); if (o) Dp().stopOp(G, B, B.ops.indexOf(o)); } if (f) { f.backer = 0; f.prep = 0; } }
      else if (f) { f.loy = c100(f.loy + 20); f.amb = c100(f.amb + 5); }
      end();
    }
    if (isP) G.uiDirty = true;
    return '';
  };

  /* ---------------------------------------------------------------- the days of the coup */
  Cp.STEPS = [
    { k: 'garrison', name: 'the capital garrison', won: 'The capital garrison goes over to the plotters.', held: 'The capital garrison stays in its barracks and stays loyal.', w: 0.25 },
    { k: 'radio', name: 'the radio station', won: 'The plotters take the radio station and read their proclamation.', held: 'The radio station is still ours; the plotters’ proclamation is never read.', w: 0.2 },
    { k: 'palace', name: 'the palace', won: 'The palace guard lays down its arms.', held: 'The palace holds through the night.', w: 0.25 },
    { k: 'army', name: 'the regiments outside the city', won: 'The regiments outside the city declare for the plotters.', held: 'The regiments outside the city refuse to march.', w: 0.3 },
  ];
  /* The date has come. AI governments: one roll at the odds. The player: a few days of events with choices. */
  Cp.launch = function (G, n, pl) {
    if (!n.alive || n.coupNow) return;
    pl.to = pl.to || Cp.ideoFor(G, n, pl);
    if (pl.seat && !pl.fig) { const f = fig(n, pl.seat); if (f) pl.fig = f.name; }
    n.a.coupAt = G.tick;
    if (n.id === G.player && !G.autoPlayer) {
      n.coupNow = { src: pl.src, seat: pl.seat || '', fig: pl.fig || '', backer: pl.backer || 0, prep: pl.prep || 0, to: pl.to, day: -1, adj: 0, seen: pl.known || 0, old: n.ideo, at: G.tick };
      ID.Events.queue(G, n, 'coup', {});
      return;
    }
    Cp.resolve(G, n, pl, G.rng.chance(Cp.odds(G, n, pl).p));
  };
  /* A day of the player's coup (from Game.tick): the next place falls or holds, weighted by the odds; the odds move so
     that, before any choice, today's number is still the true chance of the whole coup. */
  Cp.day = function (G, n) {
    const cn = n.coupNow; if (!cn || cn.day < 0 || ID.Events.pending(G, 'coup') || ID.Events.pending(G, 'coup_day')) return;
    if (cn.day >= Cp.STEPS.length) {
      const won = G.rng.chance(Cp.odds(G, n, cn).p);
      Cp.resolve(G, n, cn, won);
      return;
    }
    const s = Cp.STEPS[cn.day], p0 = Cp.odds(G, n, cn).p, won = G.rng.chance(p0);
    cn.adj += won ? (1 - p0) * s.w : -p0 * s.w;
    (cn.log = cn.log || []).push([s.k, won]);
    ID.news(G, 'Day ' + (cn.day + 1) + ' of the coup: ' + (won ? s.won : s.held) + ' The loyalists’ chance is now ' + pct(1 - Cp.odds(G, n, cn).p) + '.', won ? 'bad' : 'good', n.id);
    ID.sfx(G, won ? 'bad' : 'good');
    cn.day++;
    if (cn.day === 2 && !cn.c2) ID.Events.queue(G, n, 'coup_day', {});
  };
  Cp.resolve = function (G, n, pl, won) {
    const old = n.ideo;
    (G.coupLog = G.coupLog || []).push({ t: G.tick, ideo: old, src: pl.src, mil: n.fs.military, stab: n.stab, ok: won });
    n.coupNow = null;
    if (won) Cp.won(G, n, pl);
    else Cp.lost(G, n, pl);
  };
  /* The plotters win. For the player this is a dispatch first (Cp.after), not the end. */
  Cp.won = function (G, n, pl) {
    const isP = n.id === G.player && !G.autoPlayer;
    if (isP) {
      if (pl.armed) { // the workers hold the cities, the army takes the countryside
        const capP = G.prov[n.capital], mine = [];
        for (let p = 1; p < G.provinces.length; p++) if (G.provinces[p].owner === n.id && p !== capP) mine.push(G.provinces[p]);
        mine.sort((a, c) => a.urban - c.urban);
        const provs = mine.slice(0, Math.max(1, Math.round(mine.length * 0.55))).map((x) => x.id);
        if (provs.length) { ID.logGrief(n, G.tick, 'The coup half-succeeded: the army took the countryside.'); P().civilWar(G, n, pl.to, provs, pl.backer); return; }
      }
      n.a.coupLost = { src: pl.src, seat: pl.seat || '', fig: pl.fig || '', backer: pl.backer || 0, to: pl.to, fled: !!pl.fled, loyal: !!pl.loyal, neg: !!pl.neg };
      ID.Events.queue(G, n, 'coup_lost', {});
      return;
    }
    Cp.install(G, n, pl);
  };
  /* The plotters take the state. */
  Cp.install = function (G, n, pl) {
    if (pl.src === 'foreign' && G.nations[pl.backer] && G.nations[pl.backer].alive) { const f = fig(n, pl.seat); if (f) { Dp().plotWon(G, G.nations[pl.backer], n, f, pl.to); return; } }
    if (pl.src === 'figure') { const f = fig(n, pl.seat); if (f) { Rg().strikeWon(G, n, f, pl.to); return; } }
    P().changeIdeology(G, n, pl.to || P().coupIdeo(G, n, 0), 'coup', pl.backer || 0);
  };
  Cp.lost = function (G, n, pl) {
    const isP = n.id === G.player && !G.autoPlayer;
    n.flags.coupSurvived = 1; n.a.coupAt = G.tick;
    if (pl.src === 'foreign' && G.nations[pl.backer]) { const f = fig(n, pl.seat); Dp().plotLost(G, G.nations[pl.backer], n, f); }
    else if (pl.src === 'figure') { const f = fig(n, pl.seat); if (f) Rg().strikeLost(G, n, f); }
    else {
      n.stab -= isP ? 10 : 8;
      if (pl.src === 'army') { n.sm.military += 12; n.fs.military = Math.min(100, n.fs.military + (isP ? 10 : 0)); ID.addMod(n, 'atk', -0.08, 18, 'Officer purge'); n.prestige = Math.max(0, n.prestige - 25); }
      else { n.sm.capital -= 10; }
      if (!isP) { ID.news(G, 'A coup attempt in ' + n.name + ' fails.', 'pol', n.id); if (ID.Press) ID.Press.coupFails(G, n, pl.backer || 0); }
    }
    if (isP) {
      if (pl.armed) { n.sm.military -= 22; n.fervor = Math.min(100, n.fervor + 15); n.sm.workers += 10; }
      if (pl.amnesty) n.prestige = Math.min(100, n.prestige + 15);
      n.stab = clamp(n.stab, 0, 100);
      if (pl.src === 'figure' || pl.src === 'foreign') return;
      ID.news(G, 'The coup collapses. ' + (pl.fig ? pl.fig + ' and the' : 'The') + ' plotters are under arrest.', 'good', n.id); ID.sfx(G, 'good');
      ID.headline(G, { kicker: 'The coup has failed', title: 'The government holds', sub: 'The plotters are in the cells and the radio is ours again. The army that stayed loyal will expect to be thanked.', a: n.id, tone: 'good' });
    }
  };

  /* ---------------------------------------------------------------- the player's dispatches */
  const E = ID.EVENT_DEFS;
  const plOf = (n, c) => c && c.src ? c : n.coupNow || {};
  const oddsLine = (G, n, c) => { const o = Cp.odds(G, n, plOf(n, c)); return 'The loyalists’ chance: ' + pct(1 - o.p) + '. The plotters’ ' + pct(o.p) + ' is made of: ' + o.rows.map((r, k) => (k ? r[0] + ' ' + sgn(r[1]) : r[0].toLowerCase() + ' starts at ' + pct(r[1]))).join('; ') + (o.p <= 0.05 || o.p >= 0.92 ? ' (never below 5% or above 92%)' : '') + '.'; };
  const wantTxt = (G, n, pl) => (pl.to && pl.to !== n.ideo ? ' They mean to proclaim ' + ID.IDEOLOGIES[pl.to].name + '.' : ' They mean to keep the system and change the man at the top.');
  // a plot found at one of its stages: act now, or watch
  E.push({ id: 'plot_stage', sys: 1, tone: 'bad', sfx: 'alarm',
    title: (n, G, c) => (c.stage >= 3 ? 'A date has been set' : c.stage === 2 ? 'Meetings at night' : 'Grumbling') + ': ' + (c.src === 'army' ? 'the officers' : c.src === 'capital' ? 'the bankers' : c.fig),
    text: (n, G, c) => {
      const st = ['', 'Your people hear grumbling: ', 'Your people have names and meeting places: ', 'Your people know the day: '][c.stage];
      const sec = ID.LAWS.security.opts[n.laws.security];
      return st + Cp.who(G, n, c) + (c.stage >= 3 ? ' will move within weeks.' : c.stage === 2 ? ' are meeting at night and sounding out the garrison.' : ' are talking about what they would do in your place.') +
        ' Your ' + sec.name.toLowerCase() + ' found it at the stage of ' + Cp.STAGES[c.stage].toLowerCase() + '. ' + oddsLine(G, n, c);
    },
    opts: (G, n, c) => {
      const q = Cp.plots(G, n).find((x) => x.src === c.src && (x.seat || '') === (c.seat || ''));
      if (!q) return [{ label: 'The danger has passed', fx: [] }];
      const out = Cp.acts(n, q).map((k) => {
        const A = Cp.ACTS[k], cost = k === 'buy' ? Cp.buyCost(n, q) : 0;
        return { label: A.name + (cost ? ' (' + cost + ' gold)' : ''), tip: Cp.actDesc(k, q), can: (nn) => k !== 'buy' || nn.gold >= cost, ai: k === 'purge' ? 2 : 1,
          fx: [['fn', (GG, nn) => { const qq = Cp.plots(GG, nn).find((x) => x.src === c.src && (x.seat || '') === (c.seat || '')); if (qq) Cp.act(GG, nn, k, qq); }]] };
      });
      out.push({ label: 'Watch and wait', tip: 'Let the plot ripen where you can see it. If it reaches its date, it is fought out in the streets.', fx: [['note', 'The plot goes on', false]] });
      return out;
    } });
  // the coup itself: day one
  E.push({ id: 'coup', sys: 1, tone: 'bad', sfx: 'alarm', title: 'Tanks in the capital',
    text: (n, G) => {
      const cn = n.coupNow || {};
      const why = !cn.seen ? (Cp.intel(n) < Cp.WEAK ? ' Nobody saw it coming: with ' + ID.LAWS.security.opts[n.laws.security].name.toLowerCase() + ' and little money for the security services, the state had no eyes on the barracks.' : ' Your security services missed it.') : '';
      return 'Before dawn, ' + Cp.who(G, n, cn) + ' move on the ministries.' + wantTxt(G, n, cn) + why + ' It will be decided over the next days: the garrison, the radio, the palace and the regiments outside the city. ' + oddsLine(G, n, cn);
    },
    opts: (G, n) => {
      const cn = n.coupNow; if (!cn) return [{ label: 'It is over', fx: [] }];
      const go = (k) => ['fn', (GG, nn) => { const c = nn.coupNow; if (!c) return; if (k) c[k] = 1; c.day = 0; c.c1 = 1; if (k === 'fled') { c.day = 99; Cp.resolve(GG, nn, c, true); } }];
      const S = (nn, f) => nn.fs[f];
      return [
        { label: 'Call in the loyal regiments', tip: 'Pull loyal units back from the frontier: the plotters’ chance −15%. The front is weaker for half a year.', can: (nn) => S(nn, 'military') >= 30 || ((fig(nn, 'army') || {}).loy || 0) > 55, fx: [go('loyal'), ['mod', 'atk', -0.05, 6, 'Regiments recalled to the capital']] },
        { label: 'Arm the workers', tip: 'The plotters’ chance −20%. If it still fails, the country splits: you keep the cities. If it succeeds, the army will never forgive you.', can: (nn) => S(nn, 'workers') >= 50 || ['socialist', 'anarchist'].indexOf(ID.ideo(nn).family) >= 0, fx: [go('armed')] },
        { label: 'Negotiate', tip: 'Talk to them while it is fought out. The odds do not change; if they win, you can stay in the new government.', fx: [go('neg')] },
        { label: 'Flee abroad', tip: 'Leave tonight. The plotters take the capital; you can fight on from the provinces or from exile.', fx: [go('fled')] },
        { label: 'Take the chair they are offering', tip: 'Join the plotters and lead the new regime. You keep playing as the government the coup creates.', fx: [['fn', (GG, nn) => { const c = nn.coupNow; nn.coupNow = null; nn.flags.everEmergency = 1; (GG.coupLog = GG.coupLog || []).push({ t: GG.tick, ideo: nn.ideo, src: c ? c.src : 'army', mil: nn.fs.military, ok: true }); if (c) Cp.install(GG, nn, c); }]] },
      ];
    } });
  // the middle of it: one more choice
  E.push({ id: 'coup_day', sys: 1, tone: 'bad', sfx: 'alarm', title: 'The second night',
    text: (n, G) => { const cn = n.coupNow || {}; const L = (cn.log || []).map(([k, w]) => (w ? 'lost ' : 'held ') + Cp.STEPS.find((s) => s.k === k).name).join(', '); return 'So far we have ' + L + '. The palace and the regiments outside the city are still to decide. ' + oddsLine(G, n, cn); },
    opts: (G, n) => {
      const cn = n.coupNow; if (!cn) return [{ label: 'It is over', fx: [] }];
      const radioOk = (cn.log || []).some(([k, w]) => k === 'radio' && !w);
      return [
        { label: 'Go on the radio', tip: radioOk ? 'Speak to the country while the station is ours. The better your hold on the people, the more it helps (' + sgn(-(n.charisma > 50 || n.legit > 55 ? 0.08 : 0.03)) + ' to their chance).' : 'The station is theirs: only a short-wave transmitter is left (−2% to their chance).', fx: [['fn', (GG, nn) => { const c = nn.coupNow; if (c) { c.radio = radioOk ? (nn.charisma > 50 || nn.legit > 55 ? -0.08 : -0.03) : -0.02; c.c2 = 1; } }]] },
        { label: 'Offer an amnesty', tip: 'Any officer who goes home tonight is pardoned: −6% to their chance. If you win, the pardoned are still there.', fx: [['fn', (GG, nn) => { const c = nn.coupNow; if (c) { c.amnesty = 1; c.c2 = 1; } }]] },
        { label: 'Hold the palace to the last', tip: 'No change to the odds. No promises either.', fx: [['fn', (GG, nn) => { const c = nn.coupNow; if (c) c.c2 = 1; }]] },
        { label: 'Flee while you can', tip: 'The plotters take the capital; you can fight on from the provinces or from exile.', fx: [['fn', (GG, nn) => { const c = nn.coupNow; if (c) { c.fled = 1; Cp.resolve(GG, nn, c, true); } }]] },
      ];
    } });
  // they have won: the road on
  E.push({ id: 'coup_lost', sys: 1, tone: 'bad', sfx: 'bad', title: 'The plotters hold the capital',
    text: (n, G) => { const c = n.a.coupLost || {}; return (c.fled ? 'You are out of the city, with a handful of loyal officers and the state seal. ' : 'The ministries have fallen. ') + Cp.who(G, n, c).replace(/^./, (x) => x.toUpperCase()) + ' rule in the capital.' + wantTxt(G, n, c) + ' It does not have to end here.'; },
    opts: (G, n) => {
      const c = n.a.coupLost || {}, to = c.to || 'junta', old = n.ideo;
      const provs = []; for (let p = 1; p < G.provinces.length; p++) if (G.provinces[p].owner === n.id && p !== G.prov[n.capital]) provs.push(G.provinces[p]);
      const out = [];
      if (provs.length >= 3 && (n.fs.military >= 25 || c.loyal || c.fled)) out.push({ label: 'Fight on from the provinces', tip: 'Civil war: you lead the old government from the provinces farthest from the capital, the plotters hold the rest. Win it and the country is yours again.', fx: [['fn', (GG, nn) => Cp.fightOn(GG, nn, c)]] });
      out.push({ label: c.fled ? 'A government in exile' : 'Go into exile and plot your return', tip: 'You keep playing the country under the new regime, and the old order waits abroad. In a year or two you can try a counter-coup, at odds that depend on how the new rulers are doing.', fx: [['fn', (GG, nn) => { nn.a.restore = { ideo: old, at: GG.tick + GG.rng.int(360, 720), tries: 0 }; Cp.install(GG, nn, c); nn.stab = Math.max(0, nn.stab - 6); }]] });
      out.push({ label: c.neg ? 'Take the post they promised' : 'Serve the new regime', tip: 'Keep playing as the government the coup creates.', fx: [['fn', (GG, nn) => Cp.install(GG, nn, c)]] });
      out.push({ label: 'Accept defeat', tip: 'The campaign ends here.', fx: [['fn', (GG, nn) => ID.Game.defeat(GG, 'coup', { ideo: to, backer: c.backer })]] });
      return out;
    } });
  // a year or two later: the counter-coup
  E.push({ id: 'coup_restore', sys: 1, tone: 'mixed', sfx: 'alarm', title: 'The old order calls',
    text: (n, G) => { const r = n.a.restore || {}; return 'Officers loyal to the old ' + (ID.IDEOLOGIES[r.ideo] ? ID.IDEOLOGIES[r.ideo].name : 'order') + ' have kept in touch with the exiles. They say the new regime is ' + (n.stab < 45 ? 'shaky' : 'holding') + ', and that one night would be enough. The counter-coup’s chance: ' + pct(Cp.restoreOdds(G, n)) + '.'; },
    opts: (G, n) => [
      { label: 'Strike now', tip: 'Win and the old order returns. Lose and the exiles are finished.', fx: [['fn', (GG, nn) => Cp.restore(GG, nn)]] },
      { label: 'Wait another year', tip: 'The officers will ask again.', fx: [['note', 'The exiles wait', null]] },
      { label: 'Let the old order go', tip: 'No more counter-coups.', fx: [['fn', (GG, nn) => { nn.a.restore = null; }]] },
    ] });
  Cp.restoreOdds = (G, n) => clamp(0.2 + (50 - n.stab) / 120 + (50 - n.legit) / 150 + (Cp.content(n) ? -0.1 : 0.05), 0.08, 0.7);
  Cp.restore = function (G, n) {
    const r = n.a.restore; if (!r) return;
    const won = G.rng.chance(Cp.restoreOdds(G, n));
    (G.coupLog = G.coupLog || []).push({ t: G.tick, ideo: n.ideo, src: 'restore', mil: n.fs.military, ok: won });
    n.a.restore = null;
    if (won && ID.IDEOLOGIES[r.ideo]) { P().changeIdeology(G, n, r.ideo, 'coup'); ID.news(G, 'The counter-coup succeeds: the old order is back.', 'good', n.id); }
    else { n.stab = Math.min(100, n.stab + 4); ID.news(G, 'The counter-coup fails. The exiles’ officers are shot.', 'bad', n.id); }
  };
  /* Civil war: the old government (the player) holds the provinces farthest from the capital, the plotters the rest. */
  Cp.fightOn = function (G, n, c) {
    const W = G.W, cx = n.capital % W, cy = (n.capital / W) | 0, capP = G.prov[n.capital], old = n.ideo, mine = [];
    for (let p = 1; p < G.provinces.length; p++) { const Pr = G.provinces[p]; if (Pr.owner === n.id && p !== capP) mine.push(Pr); }
    mine.sort((a, b) => Math.hypot(b.center % W - cx, ((b.center / W) | 0) - cy) - Math.hypot(a.center % W - cx, ((a.center / W) | 0) - cy));
    const provs = mine.slice(0, Math.max(1, Math.round(mine.length * (c.loyal ? 0.5 : 0.4)))).map((x) => x.id);
    P().civilWar(G, n, old, provs, 0);
    const R = G.nations[n.civil]; if (!R || !R.alive) { Cp.install(G, n, c); return; }
    // the player crosses to the loyalist government; the capital falls to the plotters
    n.ai = true; R.ai = false; G.player = R.id; R.log = (n.log || []).slice(); R.hist = (n.hist || []).slice(); R.name = n.name; G.dirtyAll = true;
    n.a.coupLost = null;
    Cp.install(G, n, c);
    ID.news(G, 'The loyal government fights on from ' + (ID.placeName ? ID.placeName(G, R.capital) : 'the provinces') + '.', 'rev', R.id);
  };
})();
