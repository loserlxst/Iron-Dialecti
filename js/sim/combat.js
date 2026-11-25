/* IRON DIALECTIC — combat: OpenFront-style fluid fronts, naval landings, supply, strategic weapons. No DOM. */
(function () {
  'use strict';
  const ID = (globalThis.ID = globalThis.ID || {});
  const T = ID.T, B = ID.B, TERR = ID.TERRAIN, clamp = ID.clamp, MAXN = ID.MAXN;
  const C = (ID.Combat = {});
  const BASE_RATE = 0.095;
  const DPZ = { holdFast: 0, homeDef: 1, cityDef: 1, capitalDef: 1, roughLoss: 1, roughDef: 1, speed: 1, aloss: 1, blitz: 0, liberate: 0, logistics: 0 };

  /* Combat multipliers for a nation, cached on n.a (refreshed monthly and after law changes). */
  C.refresh = function (G, n) {
    const I = ID.ideo(n), r = ID.RECRUIT[n.laws.recruit], d = I.doctrine;
    let src;
    if (d.morale === 'legit') src = n.legit; else if (d.morale === 'charisma') src = n.charisma; else if (d.morale === 'gold') src = n.gold > 0 ? 80 : 20; else src = n.fs[d.morale];
    let morale = 0.72 + 0.56 * (src / 100);
    if (r.fervorMorale) morale *= 0.82 + n.fervor / 280;
    morale *= 1 - n.we / 320;
    if (n.trans > 0) morale *= 0.9;
    // the doctrine's war trait
    const dp = ID.Doctrine ? ID.Doctrine.war(n) : null; n.a.dp = dp;
    let mat = 1, mart = 1, lead = 1;
    if (dp) {
      if (dp.moraleFloor) morale = Math.max(morale, dp.moraleFloor);
      if (dp.brittle && (n.a.coreLost || 0) > 0.1) morale *= 1 - dp.brittle;
      if (dp.materiel && G && n.nwars) { const en = ID.Diplomacy.enemies(G, n); if (en.length) { let si = 0; for (const e of en) si += e.ind || 1; mat = clamp(1 + 0.18 * Math.log2(Math.max(1, n.ind) / Math.max(1, si / en.length)), 0.88, 1.25); } }
      if (dp.martyr && ((n.a.coreLost || 0) > 0.1 || n.stab < 35)) mart = 1 + dp.martyr;
      if (dp.leaderAtk) lead = clamp(1 + (n.charisma - 50) * 0.003, 0.85, 1.15);
    }
    n.a.mat = mat;
    const tech = 1 + 0.07 * n.tech.mil;
    const mob = ID.LAWS.mobil.opts[n.laws.mobil].atk || 0, sec = ID.LAWS.security.opts[n.laws.security].atk || 0;
    const bonus = n.ai ? ID.DIFFICULTY[G.difficulty].aiBonus : 1;
    n.a.morale = morale;
    n.a.atk = r.atk * d.atk * morale * n.equip * tech * (1 + mob + sec + ID.mod(n, 'atk')) * bonus * mat * lead * (dp ? dp.atkMul : 1);
    n.a.def = r.def * d.def * morale * Math.pow(n.equip, 0.7) * tech * (1 + sec * 0.5 + ID.mod(n, 'def')) * bonus * mat * mart;
    n.a.home = d.home; n.a.abroad = r.abroad || 1; n.a.rough = r.roughBonus || 1;
    const po = C.POSTURE[n.posture] || C.POSTURE.balanced, reorg = n.postureAt && G && G.tick - n.postureAt < 20 ? 0.92 : 1;
    n.a.atk *= po.atk * reorg; n.a.def *= po.def * reorg;
  };

  /* Army posture: how the whole army stands. Changing it costs twenty days of reorganisation. */
  C.POSTURE = {
    attack: { name: 'Offensive', atk: 1.12, def: 0.9, desc: 'Everything forward. Attack +12%, defence −10%.' },
    balanced: { name: 'Balanced', atk: 1, def: 1, desc: 'Ready for anything, best at nothing.' },
    defend: { name: 'Dig in', atk: 0.85, def: 1.15, desc: 'Trenches, wire and fixed lines. Defence +15%, attack −15%.' },
    depth: { name: 'Elastic defence', atk: 0.95, def: 0.95, depth: 1, desc: 'Give ground slowly and make them pay: enemy offensives against you move 6% faster but lose 30% more men, and your own losses there fall by a quarter.' },
  };
  C.setPosture = function (G, n, k) {
    if (!C.POSTURE[k]) return 'Unknown posture.';
    if ((n.posture || 'balanced') === k) return 'Already in that posture.';
    if (n.postureAt && G.tick - n.postureAt < 30) return 'The army is still reorganising.';
    n.posture = k; n.postureAt = G.tick; C.refresh(G, n);
    return '';
  };
  /* Objectives: the tile an offensive drives toward. */
  C.OBJK = 0.5;
  /* A much stronger attacker meets a whole nation in arms: defence up to +35%. */
  C.underdog = (A, D) => { const r = ID.Diplomacy.power(A) / Math.max(1, ID.Diplomacy.power(D)); return r > 1.6 ? 1 + Math.min(0.35, (r - 1.6) * 0.1) : 1; };
  C.objOf = (G, A, to) => { const t = A.objs && A.objs[to]; return t != null && G.owner[t] === to && ID.atWar(G, A.id, to) ? t : -1; };
  C.setObjective = function (G, n, tile) {
    const o = G.owner[tile]; if (!o || o === n.id) return 'Pick enemy land.';
    if (!ID.atWar(G, n.id, o)) return 'You are not at war with ' + G.nations[o].name + '.';
    (n.objs = n.objs || {})[o] = tile;
    for (const a of G.attacks) if (a.from === n.id && a.to === o) a.scan = -999; // re-plan the front
    return '';
  };

  C.styleOk = function (n, style) {
    const S = ID.STYLES[style]; if (!S) return false;
    if (S.needs === 'mil2' && n.tech.mil < 2) return false;
    return (ID.ideo(n).doctrine.styles[style] || 0) > 0;
  };

  /* An attack belongs to one connected piece of its owner's land (a.ck, kept by updateSupply): the main
     territory, or a pocket. It advances only from tiles of that piece, so the troops in a pocket stay there. */
  const pieceTest = (G, a) => { const own = G.owner, f = a.from, ck = a.ck, comp = G._comp; return ck == null || ck < 0 || !comp ? (q) => own[q] === f : (q) => own[q] === f && comp[q] === ck; };
  /* Where the attack drives: an encircled pocket breaks out toward its own lines, a pocket toward its own objective. */
  C.attackObj = (G, A, a) => (a.enc && a.bo >= 0 ? a.bo : a.pk >= 0 && a.pobj >= 0 && G.owner[a.pobj] === a.to ? a.pobj : C.objOf(G, A, a.to));
  function seedFrontier(G, a) {
    const W = G.W, H = G.H, own = G.owner, t = a.to, mark = G._mark, rng = G.rng, terr = G.terrain, mine = pieceTest(G, a);
    const ob = C.attackObj(G, G.nations[a.from], a), ox = ob % W, oy = (ob / W) | 0; a.obj = ob;
    a.heap.clear();
    const stamp = a.id;
    for (let y = 0; y < H; y++) {
      const row = y * W;
      for (let x = 0; x < W; x++) {
        const i = row + x; if (own[i] !== t) continue;
        if ((x > 0 && mine(i - 1)) || (x < W - 1 && mine(i + 1)) || (y > 0 && mine(i - W)) || (y < H - 1 && mine(i + W))) {
          mark[i] = stamp; a.heap.push(a.base + TERR[terr[i]].cost * (0.5 + rng.next()) + (ob >= 0 ? C.OBJK * (Math.abs(x - ox) + Math.abs(y - oy)) : 0), i);
        }
      }
    }
    a.scan = G.tick;
  }

  function seedWild(G, a) {
    const W = G.W, H = G.H, own = G.owner, mark = G._mark, rng = G.rng, terr = G.terrain, mine = pieceTest(G, a);
    a.heap.clear();
    for (let y = 0; y < H; y++) {
      const row = y * W;
      for (let x = 0; x < W; x++) {
        const i = row + x; if (own[i] !== 0 || terr[i] === T.SEA) continue;
        if ((x > 0 && mine(i - 1)) || (x < W - 1 && mine(i + 1)) || (y > 0 && mine(i - W)) || (y < H - 1 && mine(i + W))) {
          mark[i] = a.id; a.heap.push(a.base + TERR[terr[i]].cost * (0.5 + rng.next()), i);
        }
      }
    }
    a.scan = G.tick;
  }
  C.WILD_LOSS = 0.06;
  /* Expansion into unclaimed land: no war, no defender, only the land itself resists. */
  function processExpand(G, a) {
    const A = G.nations[a.from];
    if (!A || !A.alive || a.troops < 0.5) { endAttack(G, a, false); return; }
    const W = G.W, H = G.H, own = G.owner, terr = G.terrain, mark = G._mark, rng = G.rng;
    if (G.tick - a.scan > 25) seedWild(G, a);
    const heap = a.heap;
    if (!heap.size) { if (++a.idle > 12) endAttack(G, a, true); return; }
    a.idle = 0;
    const S = ID.STYLES[a.style] || ID.STYLES.advance;
    const rate = BASE_RATE * 1.0 * Math.sqrt(Math.min(heap.size, 500) + 4) * clamp(0.4 + a.troops / 160, 0.4, 1.8) * S.speed;
    a.prog = Math.min(a.prog + rate, 40);
    const atk = Math.max(0.4, A.a.atk || 1), mine = pieceTest(G, a), comp = G._comp;
    let n = 0;
    while (a.prog > 0 && heap.size && n < 80) {
      const i = heap.pop(); const pr = heap.topP;
      if (own[i] !== 0 || terr[i] === T.SEA) continue;
      const x = i % W, y = (i / W) | 0;
      if (!((x > 0 && mine(i - 1)) || (x < W - 1 && mine(i + 1)) || (y > 0 && mine(i - W)) || (y < H - 1 && mine(i + W)))) { mark[i] = 0; continue; }
      const tr = TERR[terr[i]];
      const la = Math.max(0.008, (C.WILD_LOSS * tr.def * (G.river[i] ? 1.2 : 1) / atk) * S.lossA * (tr.rough ? A.a.rough : 1) ** -1);
      a.troops -= la; A.pop -= la * 0.6; A.losses += la * 0.6;
      a.prog -= tr.cost * (G.river[i] ? 1.3 : 1); a.taken++; n++;
      ID.setOwner(G, i, a.from); if (comp && a.ck >= 0) comp[i] = a.ck; a.last = i;
      const np = pr + 0.01;
      if (x > 0 && own[i - 1] === 0 && terr[i - 1] !== T.SEA && mark[i - 1] !== a.id) { mark[i - 1] = a.id; heap.push(np + TERR[terr[i - 1]].cost * (0.6 + 0.8 * rng.next()), i - 1); }
      if (x < W - 1 && own[i + 1] === 0 && terr[i + 1] !== T.SEA && mark[i + 1] !== a.id) { mark[i + 1] = a.id; heap.push(np + TERR[terr[i + 1]].cost * (0.6 + 0.8 * rng.next()), i + 1); }
      if (y > 0 && own[i - W] === 0 && terr[i - W] !== T.SEA && mark[i - W] !== a.id) { mark[i - W] = a.id; heap.push(np + TERR[terr[i - W]].cost * (0.6 + 0.8 * rng.next()), i - W); }
      if (y < H - 1 && own[i + W] === 0 && terr[i + W] !== T.SEA && mark[i + W] !== a.id) { mark[i + W] = a.id; heap.push(np + TERR[terr[i + W]].cost * (0.6 + 0.8 * rng.next()), i + W); }
      if (a.troops <= 0.5) break;
    }
    if (n && !G.headless && a.from === G.player && (G.tick & 3) === 0) ID.sfx(G, 'tick');
    if (a.troops <= 0.5) endAttack(G, a, false);
  }
  C.canExpand = (G, n) => (G.wildB && G.wildB[n.id] > 0 ? '' : 'No unclaimed land borders yours. Reach it by sea with a landing.');

  /* Launch or reinforce a land attack (to = 0: expand into unclaimed land). Returns the attack, or a string explaining why not. */
  /* anchor >= 0: the attack (or expansion) of the piece of land that holds that tile (a landing, a pocket, a colony).
     Without it, the main army from the main territory; with no front there, a convoy to a pocket that has one. */
  C.launch = function (G, from, to, troops, style, quiet, anchor) {
    if (!G._comps) C.updateSupply(G);
    if (!G._mark) G._mark = new Int32Array(G.N);
    const A = G.nations[from];
    const pk = anchor != null && anchor >= 0 && G.owner[anchor] === from && G._comp[anchor] !== G._main[from] ? anchor : -1;
    const ck = pk >= 0 ? G._comp[pk] : G._main[from];
    const mk = (s) => ({ id: G.nextId++, from, to, troops, committed: troops, style: s, heap: new ID.Heap(), prog: 0, base: G.tick, scan: 0, idle: 0, amphib: 0, taken: 0, pk, ck });
    const find = () => G.attacks.find((x) => x.from === from && x.to === to && (pk >= 0 ? x.pk >= 0 && x.ck === ck : !(x.pk >= 0)));
    if (to === 0) {
      if (!A || !A.alive) return 'No such state.';
      const why = quiet || pk >= 0 ? '' : C.canExpand(G, A); if (why) return why;
      troops = Math.min(troops, A.troops); if (troops < 1 && pk < 0) return 'No troops to commit.';
      let a = find();
      if (!a && pk < 0) { a = mk('advance'); seedWild(G, a); if (!a.heap.size) { const p = C.seaPiece(G, A, 0); if (p >= 0) return C.relief(G, A, 0, p, troops, 'advance'); } a.troops = 0; a.committed = 0; G.attacks.push(a); }
      if (a) { a.troops += troops; a.committed += troops; a.idle = 0; }
      else { a = mk('advance'); seedWild(G, a); G.attacks.push(a); }
      A.troops -= troops;
      return a;
    }
    const D = G.nations[to];
    if (!A || !D || !D.alive) return 'No such target.';
    if (!ID.atWar(G, from, to)) return 'You are not at war with ' + D.name + '.';
    if (!C.styleOk(A, style)) style = 'advance';
    troops = Math.min(troops, A.troops);
    if (troops < 1) return 'No troops to commit.';
    let a = find();
    if (pk < 0 && (!a || (!a.heap.size && a.idle > 0))) {
      // no front from the main territory: the troops can only go by sea, to a piece of ours that touches the enemy
      if (!a) { a = mk(style); seedFrontier(G, a); }
      if (!a.heap.size) {
        const p = C.seaPiece(G, A, to);
        if (p >= 0) return C.relief(G, A, to, p, troops, style);
        if (G.attacks.some((x) => x.from === from && x.to === to && x.enc)) return 'Our pocket in ' + D.name + ' is encircled: nothing reaches it until the ring is broken. Land elsewhere, or break through to it.';
        if (!quiet) return 'No land front with ' + D.name + '. Use a naval landing.';
      }
      if (G.attacks.indexOf(a) < 0) { a.troops = 0; a.committed = 0; G.attacks.push(a); }
    }
    if (a && G.attacks.indexOf(a) >= 0) { a.troops += troops; a.style = style; a.committed += troops; a.idle = 0; }
    else { a = mk(style); seedFrontier(G, a); G.attacks.push(a); }
    A.troops -= troops;
    return a;
  };

  /* ---------------------------------------------------------------- the sea lift to pockets */
  /* The piece of A's land (not the main territory) that touches enemy `to` and can be reached by sea: the one with the longest front. */
  C.seaPiece = function (G, A, to) {
    const L = G._comps || []; let best = -1, bw = 0;
    for (let id = 0; id < L.length; id++) { const c = L[id]; if (c.o !== A.id || c.st !== 2 || !c.adj) continue; const w = to ? c.adj[to] || 0 : c.wild || 0; if (w > bw) { bw = w; best = id; } }
    return best;
  };
  /* Troops a day the sea lift carries to one pocket: more through its ports, a seafaring system and logistics; less against a strong navy. */
  C.liftCap = function (G, A, to, id) {
    const c = G._comps && G._comps[id], D = G.nations[to];
    const ports = c ? c.ports || 0 : 0, cr = D ? C.crossing(A, D) : { ratio: 0 };
    return 0.8 * (1 + 1.5 * ports) * (ID.ideo(A).doctrine.naval || 1) * Math.max(0.3, 1 + ID.mod(A, 'navy')) * (A.a.dp && A.a.dp.logistics ? 1.5 : 1) / (1 + cr.ratio);
  };
  /* Send reinforcements to a pocket by sea: limited by the lift (a month of it at most is banked), they sail as boats. */
  C.relief = function (G, A, to, id, troops, style) {
    const c = G._comps[id]; if (!c || c.st !== 2) return 'That pocket is cut off: nothing reaches it until the ring is broken.';
    const cap = C.liftCap(G, A, to, id), L = A.lift || (A.lift = {}), k = c.portI >= 0 ? c.portI : c.beachI >= 0 ? c.beachI : c.shore;
    if (k == null || k < 0) return 'The pocket has no coast to land on.';
    const prev = L[k] || { v: cap * 10, t: G.tick };
    const v = Math.min(cap * 30, prev.v + cap * Math.max(0, G.tick - prev.t));
    const send = Math.min(troops, v, A.troops);
    if (send < 0.5) return 'The ships are already carrying all they can to the pocket: about ' + ID.fmtPop(cap) + ' troops a day.';
    const plan = C.planBoat(G, A, k, true); if (typeof plan === 'string') return plan;
    for (const q in L) if (G.owner[q] !== A.id) delete L[q];
    L[k] = { v: v - send, t: G.tick };
    A.troops -= send;
    const bt = { id: G.nextId++, owner: A.id, troops: send, style: C.styleOk(A, style) ? style : 'advance', path: plan.path, pos: 0, target: k, relief: to };
    G.boats.push(bt);
    if (A.id === G.player) ID.sfx(G, 'boat');
    return bt;
  };

  C.cancel = function (G, a) {
    const k = G.attacks.indexOf(a); if (k < 0) return;
    G.attacks.splice(k, 1);
    const A = G.nations[a.from]; if (A && A.alive) A.troops += a.troops * 0.9;
  };
  function endAttack(G, a, refund) {
    const k = G.attacks.indexOf(a); if (k >= 0) G.attacks.splice(k, 1);
    if (refund && a.troops > 0) { const A = G.nations[a.from]; if (A && A.alive) A.troops += a.troops; }
  }

  function processAttack(G, a) {
    const A = G.nations[a.from], D = G.nations[a.to];
    if (!A.alive || !D.alive || !ID.atWar(G, a.from, a.to)) { endAttack(G, a, true); return; }
    if (a.troops < 0.5) { endAttack(G, a, false); return; }
    const W = G.W, H = G.H, own = G.owner, terr = G.terrain, mark = G._mark, rng = G.rng;
    if (G.tick - a.scan > (a.heap.size ? 25 : 4)) seedFrontier(G, a);
    const heap = a.heap;
    if (!heap.size) {
      if (++a.idle > 14) {
        if (a.from === G.player) ID.news(G, 'No front is left against ' + D.name + ': ' + ID.fmtPop(a.troops) + ' troops return to the reserve. Reach them again by land or with a naval landing.', 'war', A.id, D.id);
        endAttack(G, a, true);
      }
      return;
    }
    a.idle = 0;
    // an encircled pocket bleeds every day, first men and then nerve, and can only try to break out
    let encK = 1;
    if (a.enc) {
      const days = G.tick - a.enc, l = a.troops * Math.min(0.02, 0.003 + days * 0.00006) * (a.out ? 1.5 : 1);
      a.troops -= l; A.pop -= l * 0.5; A.losses += l; A.casM += l; D.kills += l * 0.5;
      encK = Math.max(0.2, 1 - days / 120) * (a.out ? 1.5 : 1);
      if (a.troops < 0.5) { endAttack(G, a, false); return; }
    }
    const S = ID.STYLES[a.style], e = ID.ideo(A).doctrine.styles[a.style] || 1;
    if (S.goldDay) { A.gold -= S.goldDay * (1 + a.troops / 400); if (A.gold < -50) a.style = 'advance'; }

    // clash with an opposing attack
    let share = 1;
    for (const o of G.attacks) {
      if (o.from === a.to && o.to === a.from && o.troops > 0.5) {
        share = clamp(a.troops / (a.troops + o.troops) * 1.25, 0.1, 1);
        if (a.id < o.id) {
          const c = Math.min(a.troops, o.troops) * 0.022 + 0.04;
          const k = Math.sqrt(clamp(D.a.atk / A.a.atk, 0.4, 2.5));
          const la = Math.min(a.troops, c * k), lo = Math.min(o.troops, c / k);
          a.troops -= la; o.troops -= lo; A.pop -= la; D.pop -= lo; A.losses += la; D.losses += lo; A.kills += lo; D.kills += la; A.casM += la; D.casM += lo;
        }
        break;
      }
    }

    const ratio = a.troops / Math.max(1, D.troops);
    const war = ID.Diplomacy.warOf(G, a.from, a.to);
    const Ad = A.a.dp || DPZ, Dd = D.a.dp || DPZ;
    const lure = ID.mod(D, 'lure');
    let spd = Ad.speed * (1 + ID.mod(A, 'speed')) * (1 + lure);
    if (Ad.blitz && war && G.tick - war.start < 150) spd *= 1 + Ad.blitz;
    if ((C.POSTURE[D.posture] || {}).depth) spd *= 1.06;
    const ob = C.attackObj(G, A, a); if (ob !== a.obj) { a.obj = ob; a.scan = -999; }
    if (ob >= 0) spd *= 1.1; // a Schwerpunkt: faster, with exposed flanks
    if (a.surge > G.tick) spd *= 1.25;
    const rate = BASE_RATE * Math.sqrt(Math.min(heap.size, 500) + 4) * clamp(0.25 + 0.6 * ratio, 0.3, 1.8) * S.speed * e * share * (1 + 0.04 * A.tech.mil) * spd * encK;
    a.prog = Math.min(a.prog + rate, 40);
    const dd = D.troops / Math.max(D.tiles, 40);
    const mine = pieceTest(G, a), comp = G._comp, bo = a.enc ? a.bo : -1, bx = bo % W, by = (bo / W) | 0;
    const atk = A.a.atk * e, def = D.a.def * C.underdog(A, D);
    const igT = S.ignoreTerrain || 0, igF = S.ignoreFort || 0;
    const holdFast = Dd.holdFast && ratio > 1 ? 1 + Dd.holdFast : 1;
    const depthK = (C.POSTURE[D.posture] || {}).depth ? (D.flags.ld_depth ? 1.6 : 1.3) : 1;
    const alossK = Ad.aloss * Math.max(0.4, 1 + ID.mod(A, 'aloss')) * (lure ? 1 + lure * 1.33 : 1) * depthK * (a.obj >= 0 ? 1.06 : 1);
    const dlossK = depthK > 1 ? (D.flags.ld_depth ? 0.6 : 0.75) : 1;
    const ox = a.obj % W, oy = (a.obj / W) | 0, hk = a.obj >= 0 ? C.OBJK : 0;
    const cityK = Dd.cityDef * (1 + ID.mod(D, 'cityDef')), capP = D.capital >= 0 ? G.prov[D.capital] : -1;
    const cutK = Dd.logistics ? 0.55 : 0.25;
    let libN = 0;
    const holy = ID.ideo(A).flags.holyWar && (D.laws.religion === 'secular' || D.laws.religion === 'atheism') ? 1.2 : 1;
    // the AI keeps its front broad: a tile with fewer than two of our tiles beside it waits (no thin salients it cannot hold)
    const thin = A.id !== G.player, fr = a.from;
    let np = 0;
    const push = (q, qx, qy) => {
      if (own[q] !== a.to || mark[q] === a.id) return;
      mark[q] = a.id;
      let p = np + TERR[terr[q]].cost * (0.6 + 0.8 * rng.next()) + (hk ? hk * (Math.abs(qx - ox) + Math.abs(qy - oy)) : 0);
      if (thin) { const c = (qx > 0 && own[q - 1] === fr) + (qx < W - 1 && own[q + 1] === fr) + (qy > 0 && own[q - W] === fr) + (qy < H - 1 && own[q + W] === fr); if (c < 2) p += (2 - c) * 0.7; }
      heap.push(p, q);
    };
    let n = 0;
    while (a.prog > 0 && heap.size && n < 60) {
      const i = heap.pop(); const pr = heap.topP;
      if (own[i] !== a.to) continue;
      const x = i % W, y = (i / W) | 0;
      if (!((x > 0 && mine(i - 1)) || (x < W - 1 && mine(i + 1)) || (y > 0 && mine(i - W)) || (y < H - 1 && mine(i + W)))) { mark[i] = 0; continue; }
      if (bo >= 0) { const d = Math.abs(x - bx) + Math.abs(y - by); if (d >= a.bd) { mark[i] = 0; continue; } a.bd = d; } // a breakout only moves toward home
      const tr = TERR[terr[i]];
      const P = G.provinces[G.prov[i]];
      const fort = G.fortCov[i] === a.to;
      let cost = 1 + (tr.cost - 1) * (1 - igT);
      let tdef = 1 + (tr.def - 1) * (1 - igT);
      let lossMul = S.lossA;
      if (S.open && tr.rough) { cost *= 3.2; lossMul *= 1.4; }
      if (G.river[i]) { cost *= 1.5; tdef *= 1.3; }
      if (fort) { const fc = (G.fortQ[i] / 100) * (1 - igF); cost *= 1 + ID.FORT.cost * fc; tdef *= 1 + ID.FORT.loss * fc; }
      if (G.bld[i] === B.CITY) { tdef *= 2 * cityK; cost *= 1.5; }
      if (G.shock && G.shock.length && shocked(G, x, y, a.from, a.to)) { tdef *= 0.6; cost *= 0.75; }
      let dmul = def * holdFast, amul = atk * holy;
      if (P.core === a.to) { dmul *= D.a.home * Dd.homeDef; if (G.prov[i] === capP) dmul *= Dd.capitalDef; } else if (P.core === a.from) amul *= 1.15; else dmul *= 0.85;
      if (P.core !== a.from) amul *= A.a.abroad;
      if (tr.rough) { amul *= A.a.rough; dmul *= D.a.rough * Dd.roughDef; lossMul *= Ad.roughLoss; }
      if (P.opp && P.oppStr > 30 && ID.ideo(A).flags.liberator && ID.IDEOLOGIES[P.opp].family === ID.ideo(A).family) amul *= 1.2;
      const cutT = G.cut[i] === 1;
      let la = dd * tdef * (dmul / amul) * lossMul * alossK * (cutT ? cutK : 1);
      if (a.amphib > 0) { la *= 1.3; a.amphib--; }
      if (la < 0.012) la = 0.012;
      const ld = Math.min(D.troops, dd * (cutT ? 1.0 : 0.55) * S.lossD * dlossK * Math.sqrt(clamp(amul / dmul, 0.4, 2.5)));
      a.troops -= la; A.pop -= la; A.losses += la; D.kills += la; A.casM += la;
      D.troops -= ld; D.pop -= ld; D.losses += ld; A.kills += ld; D.casM += ld;
      a.prog -= cost; a.taken++; n++;
      if (war) { if (war.a === a.from) war.ta++; else war.tb++; }
      ID.setOwner(G, i, a.from); if (comp && a.ck >= 0) comp[i] = a.ck; a.last = i;
      if (i === a.obj && !a.enc) { C.objectiveTaken(G, a, A, D, i); }
      if (Ad.liberate && ++libN % 18 === 0 && ID.docSeed) ID.docSeed(G, D, A.ideo, 9, 1, A.id); // revolutionary war: the front raises the enemy's workers
      np = pr + 0.01 - (hk ? hk * (Math.abs(x - ox) + Math.abs(y - oy)) : 0);
      if (x > 0) push(i - 1, x - 1, y);
      if (x < W - 1) push(i + 1, x + 1, y);
      if (y > 0) push(i - W, x, y - 1);
      if (y < H - 1) push(i + W, x, y + 1);
      if (a.troops <= 0.5) break;
    }
    if (n && !G.headless && (a.from === G.player || a.to === G.player) && (G.tick & 3) === 0) ID.sfx(G, 'tick');
    if (D.tiles <= 0) { ID.Diplomacy.eliminate(G, D, A); return; }
    if (a.troops <= 0.5) endAttack(G, a, false);
  }

  /* An objective falls: the defender reels, the attack surges forward for three weeks. */
  C.objectiveTaken = function (G, a, A, D, i) {
    const big = G.bld[i] === B.CITY || G.bld[i] === B.FORT || G.bld[i] === B.PORT || i === D.capital;
    const k = (A.flags.ld_man ? 2 : 1) * (big ? 1.5 : 1);
    D.stab -= 1.5 * k; D.we = Math.min(100, D.we + 3 * k); A.glory = Math.min(100, A.glory + 1.5 * k);
    const rout = D.troops * 0.02 * k; D.troops -= rout; D.losses += rout; A.kills += rout; D.casM += rout;
    a.surge = G.tick + 20 * (A.flags.ld_man ? 1.5 : 1);
    if (A.objs) delete A.objs[D.id];
    a.obj = -1; a.scan = -999;
    const P = G.provinces[G.prov[i]];
    if (A.id === G.player || D.id === G.player) ID.news(G, (A.id === G.player ? 'Objective taken: ' : 'The enemy takes ') + (P && P.name ? P.name : 'the objective') + '. ' + ID.fmtPop(rout) + ' ' + (A.id === G.player ? 'enemy troops routed; the attack surges forward.' : 'of our troops routed.'), A.id === G.player ? 'good' : 'war', A.id, D.id);
    ID.fx(G, 'capital', i, {});
  };
  /* The AI's pick: the enemy city nearest its own capital, or the enemy capital. */
  C.aiObjective = function (G, n, e) {
    const W = G.W, cx = n.capital % W, cy = (n.capital / W) | 0; let best = -1, bd = 1e9;
    for (const i of G.blist) { if (G.owner[i] !== e.id || (G.bld[i] !== B.CITY && G.bld[i] !== B.FORT)) continue; const d = Math.abs(i % W - cx) + Math.abs(((i / W) | 0) - cy); if (d < bd) { bd = d; best = i; } }
    if (best < 0 && e.capital >= 0 && G.owner[e.capital] === e.id) best = e.capital;
    return best;
  };

  /* ---------------------------------------------------------------- naval */
  C.BOAT_SPEED = 2;
  C.navalRange = (G, n) => ID.ERAS[ID.eraOf(G.tick)].range * (ID.ideo(n).flags.navalPower ? 1.4 : 1);
  /* Sea power: ports, a seafaring system, technology and naval programmes. It decides how much of a
     convoy arrives and how hard the beach is: a strong navy guards its own coast and lands cheaply on others'. */
  C.seaPower = (n) => (ID.nbe(n, B.PORT) || 0) * (ID.ideo(n).flags.navalPower ? 1.8 : 1) * (ID.ideo(n).doctrine.naval || 1) * (1 + 0.08 * n.tech.mil) * Math.max(0.3, 1 + ID.mod(n, 'navy'));
  C.crossing = function (A, D) {
    const r = D ? C.seaPower(D) / Math.max(0.5, C.seaPower(A)) : 0;
    return { ratio: r, sunk: clamp(0.11 * r, 0, 0.5), costK: Math.sqrt(clamp(r, 0.45, 2.2)) };
  };

  /* Beachheads: the tile a landing came ashore on supplies everything joined to it by land, like a
     small port, for as long as its owner holds it. G.beach = [{i, o, t}]. */
  C.addBeach = function (G, i, o) {
    const L = G.beach || (G.beach = []);
    for (const b of L) if (b.i === i) { b.o = o; b.t = G.tick; return; }
    L.push({ i, o, t: G.tick });
    if (L.length > 240) L.shift();
    if (!G.headless) G.dirty.push(i);
  };
  C.isBeach = (G, i) => { const L = G.beach; if (L) for (const b of L) if (b.i === i && G.owner[i] === b.o) return true; return false; };

  /* Plan a route from one of n's ports to the coast tile `target`. Returns {path} or a reason string. */
  C.planBoat = function (G, n, target, relief) {
    if (!n.nb[B.PORT]) return 'You need a port to launch a landing.';
    if (G.terrain[target] === T.SEA) return 'Pick a coastal land tile.';
    if (!relief && G.owner[target] === n.id) return 'That coast is already yours.';
    const tsea = ID.seaNeighbors(G, target);
    if (!tsea.length) return 'A landing needs a coastal tile.';
    const range = C.navalRange(G, n);
    const dist = ID.seaDistance(G, tsea, range);
    let best = -1, bd = 1e9, bport = -1;
    for (const i of G.blist) {
      if (G.bld[i] !== B.PORT || !G.hp[i] || G.owner[i] !== n.id || G.cut[i] === 1) continue;
      for (const s of ID.seaNeighbors(G, i)) if (dist[s] >= 0 && dist[s] < bd) { bd = dist[s]; best = s; bport = i; }
    }
    if (best < 0) return 'No sea route within range (' + Math.round(range) + ' tiles from one of your ports).';
    const path = [bport, best]; let c = best; const W = G.W;
    while (dist[c] > 0) {
      const d = dist[c]; let nx = -1;
      for (const s of [c - 1, c + 1, c - W, c + W]) if (s >= 0 && s < G.N && dist[s] === d - 1) { nx = s; break; }
      if (nx < 0) break; c = nx; path.push(c);
    }
    path.push(target);
    return { path };
  };
  /* The best place to come ashore against e: close to our ports, away from fortresses, on a port if there is one. */
  C.bestLanding = function (G, n, e, jitter) {
    if (!n.nb[B.PORT]) return -1;
    const starts = [];
    for (const i of G.blist) if (G.bld[i] === B.PORT && G.hp[i] && G.owner[i] === n.id && G.cut[i] !== 1) for (const s of ID.seaNeighbors(G, i)) starts.push(s);
    if (!starts.length) return -1;
    const dist = ID.seaDistance(G, starts, C.navalRange(G, n));
    const W = G.W, H = G.H, own = G.owner, terr = G.terrain, cx = e.capital % W, cy = (e.capital / W) | 0;
    let best = -1, bs = 1e9;
    for (let i = 0; i < G.N; i++) {
      if (own[i] !== e.id || !G.coast[i]) continue;
      const x = i % W, y = (i / W) | 0; let d = 1e9;
      if (x > 0 && terr[i - 1] === T.SEA && dist[i - 1] >= 0 && dist[i - 1] < d) d = dist[i - 1];
      if (x < W - 1 && terr[i + 1] === T.SEA && dist[i + 1] >= 0 && dist[i + 1] < d) d = dist[i + 1];
      if (y > 0 && terr[i - W] === T.SEA && dist[i - W] >= 0 && dist[i - W] < d) d = dist[i - W];
      if (y < H - 1 && terr[i + W] === T.SEA && dist[i + W] >= 0 && dist[i + W] < d) d = dist[i + W];
      if (d > 1e8) continue;
      const sc = d + (G.fortCov[i] === e.id ? 90 : 0) + (G.bld[i] === B.PORT ? -30 : G.bld[i] === B.CITY ? 25 : 0) + TERR[terr[i]].def * 8 + Math.hypot(x - cx, y - cy) * 0.25 + (jitter ? G.rng.next() * 8 : 0);
      if (sc < bs) { bs = sc; best = i; }
    }
    return best;
  };
  C.launchBoat = function (G, n, target, troops, style) {
    const plan = C.planBoat(G, n, target); if (typeof plan === 'string') return plan;
    troops = Math.min(troops, n.troops); if (troops < 1) return 'No troops to embark.';
    n.troops -= troops;
    const bt = { id: G.nextId++, owner: n.id, troops, style: C.styleOk(n, style) ? style : 'advance', path: plan.path, pos: 0, target };
    G.boats.push(bt);
    if (n.id === G.player) ID.sfx(G, 'boat');
    return bt;
  };
  /* ---------------------------------------------------------------- settling by sea */
  /* A settling expedition: a boat of settlers and some troops to an unclaimed coast, which founds a beachhead and
     expands from it like any expansion. Cost and time: {gold, troops, days, path} or a reason. */
  C.settleCost = function (G, n, target) {
    if (G.owner[target] || G.terrain[target] === T.SEA || !G.coast[target]) return 'Pick an unclaimed coast.';
    const pl = C.planBoat(G, n, target); if (typeof pl === 'string') return pl;
    return { gold: Math.round(60 + pl.path.length * 0.8), troops: clamp(n.troops * 0.1, 8, 60), days: Math.max(1, Math.ceil((pl.path.length - 1) / C.BOAT_SPEED)), path: pl.path };
  };
  C.settle = function (G, n, target) {
    const c = C.settleCost(G, n, target); if (typeof c === 'string') return c;
    if (n.gold < c.gold) return 'The expedition needs ' + c.gold + ' gold.';
    if (n.troops < c.troops + 4) return 'The expedition needs ' + ID.fmtPop(c.troops) + ' troops.';
    if (G.boats.some((b) => b.owner === n.id && b.settle)) return 'An expedition is already at sea.';
    n.gold -= c.gold; n.troops -= c.troops;
    const bt = { id: G.nextId++, owner: n.id, troops: c.troops, style: 'advance', path: c.path, pos: 0, target, settle: 1 };
    G.boats.push(bt);
    if (n.id === G.player) ID.sfx(G, 'boat');
    // a race for the same island: the other claimant takes it badly
    const P0 = G.prov[target], L = G.settleLog || (G.settleLog = []);
    for (const e of L) {
      if (e.o === n.id || G.tick - e.t > 1080 || !G.nations[e.o] || !G.nations[e.o].alive) continue;
      const Pe = G.provinces[e.p]; if (e.p !== P0 && !(Pe && Pe.nb && Pe.nb.indexOf(P0) >= 0)) continue;
      ID.addOpBoth(G, n.id, e.o, -12); n.threat += 2;
      if (n.id === G.player || e.o === G.player) ID.news(G, 'A race for ' + (ID.placeName(G, target) || 'the island') + ': ' + G.nations[e.o].name + ' and ' + n.name + ' have both sent settlers. Neither government is pleased.', 'dip', n.id, e.o);
    }
    L.push({ o: n.id, p: P0, t: G.tick }); if (L.length > 60) L.shift();
    return bt;
  };
  /* The flag is planted: the news, the World Dispatch, and a word to the player when a rival settles near them. */
  C.settled = function (G, A, i) {
    const nm = ID.placeName(G, i) || 'an empty island';
    A.cnt.colonies = (A.cnt.colonies || 0) + 1;
    if (A.id === G.player) { ID.news(G, 'Our settlers plant the flag on ' + nm + '. The beach will supply them until they hold a port.', 'good', A.id); return; }
    const me = G.nations[G.player];
    if (me && me.alive) {
      const W = G.W, x = i % W, y = (i / W) | 0; let near = 1e9;
      for (let p = 1; p < G.provinces.length; p++) { const Pr = G.provinces[p]; if (Pr.owner !== me.id) continue; const d = Math.abs(Pr.center % W - x) + Math.abs(((Pr.center / W) | 0) - y); if (d < near) near = d; }
      if (near < 45) ID.news(G, A.name + ' plants its flag on ' + nm + ', ' + near + ' tiles from our coast.', 'dip', A.id, me.id);
    }
    if (ID.Press) ID.Press.add(G, { w: ID.isMajor(G, A) ? 2 : 1, kind: 'dip', a: A.id, art: 'sea', title: A.base + ' plants its flag on ' + nm, key: 'settle' + A.id, gap: 360,
      text: 'A ' + A.adj + ' expedition has come ashore on ' + nm + ', which no government had claimed. The settlers have a flag, a charter and a few hundred rifles; the nearest neighbours have a list of objections.' });
  };
  /* The AI's pick: an unclaimed coast it can reach and cannot reach by land, rated by size, fertility, oil, distance and
     how close it lies to rivals (a foothold near them is worth more). Returns a tile or -1. */
  C.bestSettle = function (G, n) {
    if (!n.nb[B.PORT]) return -1;
    const starts = [];
    for (const i of G.blist) if (G.bld[i] === B.PORT && G.hp[i] && G.owner[i] === n.id && G.cut[i] !== 1) for (const s of ID.seaNeighbors(G, i)) starts.push(s);
    if (!starts.length) return -1;
    const dist = ID.seaDistance(G, starts, C.navalRange(G, n)), W = G.W, own = G.owner, terr = G.terrain;
    const mine = new Set(); for (let p = 1; p < G.provinces.length; p++) if (G.provinces[p].owner === n.id) mine.add(p);
    const best = {};
    for (let i = 0; i < G.N; i++) {
      if (own[i] || !G.coast[i] || terr[i] === T.SEA) continue;
      const P0 = G.prov[i], Pr = G.provinces[P0]; if (!Pr || Pr.owner || Pr.nb.some((q) => mine.has(q))) continue; // what borders us we take by land
      const x = i % W; let d = 1e9;
      for (const q of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, i - W, i + W]) if (q >= 0 && q < G.N && terr[q] === T.SEA && dist[q] >= 0 && dist[q] < d) d = dist[q];
      if (d > 1e8) continue;
      if (!best[P0] || d < best[P0].d) best[P0] = { i, d };
    }
    let pick = -1, ps = 0;
    for (const k in best) {
      const Pr = G.provinces[+k], b = best[k];
      let rival = 0, land = 0; for (const q of Pr.nb) { const o = G.provinces[q].owner; if (o && o !== n.id) { land = 1; if (ID.op(G, n.id, o) < 0) rival = 1; } }
      // a coast a neighbour can walk to will be theirs before the ships arrive: true islands first
      const sc = Pr.tiles * (0.6 + Pr.fertile) * (1 - Pr.rough * 0.4) * (Pr.oil ? 1.6 : 1) * (1 + rival * 0.3) * (land ? 0.3 : 1) / (25 + b.d);
      if (sc > ps) { ps = sc; pick = b.i; }
    }
    return pick;
  };

  /* The first wave takes the beach itself: open enemy ground within two tiles of the landing point. */
  function seize(G, target, to, max) {
    const W = G.W, H = G.H, own = G.owner, x0 = target % W, y0 = (target / W) | 0;
    const got = [target], seen = new Set(got);
    for (let k = 0; k < got.length && got.length < max; k++) {
      const c = got[k], x = c % W, y = (c / W) | 0;
      for (const q of [x > 0 ? c - 1 : -1, x < W - 1 ? c + 1 : -1, y > 0 ? c - W : -1, y < H - 1 ? c + W : -1]) {
        if (q < 0 || seen.has(q) || own[q] !== to || G.terrain[q] === T.SEA) continue;
        const dx = (q % W) - x0, dy = ((q / W) | 0) - y0; if (dx * dx + dy * dy > 6.5) continue;
        if (to && (G.fortCov[q] === to || G.bld[q] === B.CITY || G.bld[q] === B.FORT)) continue;
        seen.add(q); got.push(q); if (got.length >= max) break;
      }
    }
    return got;
  }
  /* New land taken from the sea: if it touches the main territory it joins it, else it is a piece of its own
     (a fresh entry in G._comps until the next supply pass), with its own attack. Returns the anchor tile. */
  function newPiece(G, o, tiles) {
    if (!G._comps) C.updateSupply(G);
    const comp = G._comp, main = G._main[o], W = G.W, own = G.owner;
    let id = -1;
    for (const t of tiles) for (const q of [t - 1, t + 1, t - W, t + W]) if (q >= 0 && q < G.N && own[q] === o && comp[q] === main && main >= 0) id = main;
    if (id < 0) { id = G._comps.length; G._comps.push({ o, size: tiles.length, st: 2, start: tiles[0], ports: 0, portI: -1, beachT: G.tick, beachI: tiles[0], shore: tiles[0], adj: {} }); }
    for (const t of tiles) comp[t] = id;
    return id === main ? -1 : tiles[0];
  }
  function landBoat(G, bt) {
    const A = G.nations[bt.owner]; if (!A.alive) return;
    const to = G.owner[bt.target];
    if (bt.relief != null) { // reinforcements for a pocket: the enemy navy may meet them, and the beach may be gone
      const E = G.nations[bt.relief];
      if (E && E.alive && ID.atWar(G, A.id, E.id)) { const cr = C.crossing(A, E); if (cr.sunk > 0.02) { const s = bt.troops * cr.sunk * 0.8 * (0.6 + 0.4 * G.rng.next()); bt.troops -= s; A.pop -= s; A.losses += s; A.casM += s; E.kills += s; } }
      if (to === bt.owner && bt.relief === 0) { A.troops += bt.troops; C.launch(G, A.id, 0, bt.troops, 'advance', true, bt.target); }
      else if (to === bt.owner && E && E.alive && ID.atWar(G, A.id, E.id)) { A.troops += bt.troops; C.launch(G, A.id, E.id, bt.troops, bt.style, true, bt.target); }
      else if (to === bt.owner) A.troops += bt.troops;
      else { const lost = bt.troops * 0.4; A.troops += bt.troops - lost; A.pop -= lost; A.losses += lost; if (A.id === G.player) ID.news(G, 'The pocket’s harbour has fallen: the convoy turns back with ' + ID.fmtPop(lost) + ' lost.', 'war', A.id); }
      return;
    }
    if (!to && G.terrain[bt.target] !== T.SEA) {
      const got = seize(G, bt.target, 0, 9);
      for (const q of got) ID.setOwner(G, q, bt.owner);
      C.addBeach(G, bt.target, bt.owner);
      const pk = newPiece(G, bt.owner, got);
      const a = C.launch(G, bt.owner, 0, 0, 'advance', true, pk);
      A.troops += bt.troops;
      if (a && typeof a !== 'string') { a.troops += bt.troops * 0.9; a.committed += bt.troops; A.troops -= bt.troops * 0.9; seedWild(G, a); }
      ID.fx(G, 'land', bt.target);
      if (bt.settle) C.settled(G, A, bt.target);
      else if (A.id === G.player) ID.news(G, 'Settlers come ashore on unclaimed land. The beach will supply them.', 'good', A.id);
      return;
    }
    if (to === bt.owner) { // relief by sea: a cut-off coast gets a beachhead
      A.troops += bt.troops;
      if (G.cut[bt.target] === 1) { C.addBeach(G, bt.target, bt.owner); if (A.id === G.player) ID.news(G, 'Relief convoys reach the pocket: it is supplied by sea again.', 'good', A.id); ID.fx(G, 'land', bt.target); }
      return;
    }
    if (!to || !ID.atWar(G, bt.owner, to)) {
      A.troops += bt.troops;
      if (bt.settle && to && A.id === G.player) ID.news(G, 'Our settlers find ' + (ID.placeName(G, bt.target) || 'the coast') + ' already claimed by ' + G.nations[to].name + '. They sail home.', 'bad', A.id, to);
      return;
    }
    const D = G.nations[to];
    const cr = C.crossing(A, D);
    if (cr.sunk > 0.02) { // the defender's navy meets the convoy
      const sunk = bt.troops * cr.sunk * (0.6 + 0.4 * G.rng.next());
      bt.troops -= sunk; A.pop -= sunk; A.losses += sunk; A.casM += sunk; D.kills += sunk;
      if ((A.id === G.player || D.id === G.player) && sunk > 0.5) ID.news(G, (D.id === G.player ? 'Our navy catches a ' + A.adj + ' convoy' : 'The ' + D.adj + ' navy catches our convoy') + ': ' + ID.fmtPop(sunk) + ' troops go down with their transports.', D.id === G.player ? 'good' : 'war', A.id, D.id);
    }
    const dd = D.troops / Math.max(D.tiles, 40);
    const naval = ID.ideo(A).doctrine.naval || 1;
    const fort = G.fortCov[bt.target] === to ? 1 + ID.FORT.loss * G.fortQ[bt.target] / 100 : 1;
    const cost = (dd * 2.2 * fort * TERR[G.terrain[bt.target]].def * D.a.def / A.a.atk + 0.4) * cr.costK;
    if (bt.troops <= cost * 1.1) {
      const lost = bt.troops * 0.6; A.troops += bt.troops - lost;
      A.pop -= lost; A.losses += lost; A.casM += lost; D.kills += lost;
      ID.news(G, 'A ' + A.adj + ' landing is thrown back into the sea by ' + D.name + '. ' + ID.fmtPop(lost) + ' are lost; the rest sail home.', 'war', A.id, D.id);
      if (A.id === G.player) ID.sfx(G, 'bad');
      return;
    }
    A.pop -= cost; A.losses += cost; A.casM += cost;
    const beach = seize(G, bt.target, to, 12), war = ID.Diplomacy.warOf(G, bt.owner, to);
    for (const q of beach) ID.setOwner(G, q, bt.owner);
    if (war) { if (war.a === bt.owner) war.ta += beach.length; else war.tb += beach.length; }
    C.addBeach(G, bt.target, bt.owner);
    ID.recalcBorders(G);
    A.troops += bt.troops - cost;
    const pk = newPiece(G, bt.owner, beach);
    const a = D.alive ? C.launch(G, bt.owner, to, bt.troops - cost, bt.style, true, pk) : null;
    if (a && typeof a !== 'string') { a.amphib = Math.round(12 / naval); a.surge = Math.max(a.surge || 0, G.tick + 30); seedFrontier(G, a); }
    ID.news(G, A.adj + ' troops land on the coast of ' + D.name + ' and hold a beachhead.', 'war', A.id, D.id);
    if (D.id === G.player) { ID.headline(G, { kicker: 'Invasion from the sea', title: 'They are ashore', sub: A.name + ' has landed troops on our coast. Take the beach back and the landing starves.', a: A.id, b: D.id, tone: 'war' }); }
    ID.fx(G, 'land', bt.target);
    if (D.tiles <= 0) ID.Diplomacy.eliminate(G, D, A);
  }

  /* ---------------------------------------------------------------- strategic weapons */
  C.missileRange = (G) => [0, 110, 200, 320][ID.eraOf(G.tick)];
  /* The two bombs. r: everything inside is destroyed and irradiated for rad months. ring: buildings there lose ringDmg
     condition (and fallout irradiates it for ringRad months). kill: deaths = kill × (the state's people living in the
     blast ÷ its capacity), at most maxDead of the state: the blast, the fire and the sickness after. troop: soldiers
     lost per share of the state's land in the blast. */
  C.BOMB = {
    atom: { name: 'Atomic bomb', r: 12, ring: 18, ringDmg: 50, rad: 240, ringRad: 0, kill: 2.8, maxDead: 0.6, troop: 2.5, stab: 20, we: 25 },
    thermo: { name: 'Thermonuclear bomb', r: 22, ring: 34, ringDmg: 70, rad: 250, ringRad: 120, kill: 3.2, maxDead: 0.9, troop: 3, stab: 35, we: 40 },
  };
  const bombKind = (m) => m.kind || (m.nuke ? 'atom' : ''); // saves from before the thermonuclear bomb
  C.stock = (n, kind) => (kind === 'thermo' ? n.thermo || 0 : kind ? n.nukes : n.missiles);
  C.canMissile = function (G, n, target, nuke) {
    const kind = nuke === true || nuke === 1 ? 'atom' : nuke || '';
    if (!n.nb[B.SILO]) return 'You have no missile silo.';
    if (C.stock(n, kind) < 1) return kind === 'thermo' ? 'No thermonuclear device ready.' : kind ? 'No atomic warhead ready.' : 'No missile ready.';
    const W = G.W, tx = target % W, ty = (target / W) | 0; let best = 1e9, from = -1;
    for (const i of G.blist) if (G.bld[i] === B.SILO && G.hp[i] && G.owner[i] === n.id) { const d = Math.hypot((i % W) - tx, ((i / W) | 0) - ty); if (d < best) { best = d; from = i; } }
    if (from < 0) return 'Every silo you have is wrecked.';
    if (best > C.missileRange(G)) return 'Out of range (' + C.missileRange(G) + ').';
    return { from, dist: best, kind };
  };
  C.launchMissile = function (G, n, target, nuke) {
    const r = C.canMissile(G, n, target, nuke); if (typeof r === 'string') return r;
    if (r.kind === 'thermo') n.thermo--; else if (r.kind) n.nukes--; else n.missiles--;
    G.missiles.push({ owner: n.id, from: r.from, to: target, t: 0, dur: Math.max(6, Math.round(r.dist / 5)), nuke: !!r.kind, kind: r.kind });
    ID.sfx(G, 'launch');
    return '';
  };
  function impact(G, m) {
    const kind = bombKind(m);
    if (kind) return bombImpact(G, m, kind);
    const W = G.W, H = G.H, x0 = m.to % W, y0 = (m.to / W) | 0, R = 3;
    const hit = {};
    for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
      if (dx * dx + dy * dy > R * R) continue;
      const x = x0 + dx, y = y0 + dy; if (x < 0 || y < 0 || x >= W || y >= H) continue;
      const i = y * W + x; if (G.terrain[i] === T.SEA) continue;
      const o = G.owner[i]; if (o) hit[o] = (hit[o] || 0) + 1;
      if (G.bld[i] && G.rng.chance(0.55)) ID.removeBuilding(G, i);
    }
    for (const k in hit) { const v = G.nations[+k]; v.troops *= 0.985; v.stab -= 1.5; }
    ID.fx(G, 'boom', m.to);
    ID.sfx(G, 'boom');
  }
  function bombImpact(G, m, kind) {
    const Bk = C.BOMB[kind], W = G.W, H = G.H, x0 = m.to % W, y0 = (m.to / W) | 0, R = Bk.ring, r2 = Bk.r * Bk.r;
    const A = G.nations[m.owner];
    const hit = {}, people = {}, cap = {}, lost = { bld: 0, dmg: 0 };
    for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
      const d2 = dx * dx + dy * dy; if (d2 > R * R) continue;
      const x = x0 + dx, y = y0 + dy; if (x < 0 || y < 0 || x >= W || y >= H) continue;
      const i = y * W + x; if (G.terrain[i] === T.SEA) continue;
      const o = G.owner[i], v = o ? G.nations[o] : null, core = d2 <= r2, tr = TERR[G.terrain[i]];
      if (v && cap[o] == null) cap[o] = Math.max(1, ID.popCap(v));
      if (core) {
        if (v) { hit[o] = (hit[o] || 0) + 1; people[o] = (people[o] || 0) + (G.rad[i] ? 0 : tr.pop) + (G.bld[i] === B.CITY ? 400 * G.hp[i] / 100 : 0); }
        if (G.bld[i]) { ID.removeBuilding(G, i); lost.bld++; }
      } else if (G.bld[i]) { lost.dmg += ID.damage(G, i, Bk.ringDmg) > 0 ? 1 : 0; }
      const rad = core ? Bk.rad : Bk.ringRad;
      if (rad && !G.rad[i]) {
        if (v) { v.popLand -= tr.pop; v.foodLand -= tr.food * (G.river[i] ? 1.25 : 1); }
        G.rad[i] = rad; G.radList.push(i);
        if (!G.headless) G.dirty.push(i);
      }
    }
    let deadAll = 0;
    for (const k in hit) {
      const v = G.nations[+k];
      const dead = v.pop * Math.min(Bk.maxDead, (people[k] / cap[k]) * Bk.kill); v.pop -= dead; deadAll += dead;
      const tl = v.troops * Math.min(0.7, (hit[k] / Math.max(40, v.tiles)) * Bk.troop); v.troops -= tl;
      v.losses += dead + tl; v.casM += dead * 0.5 + tl; v.stab -= Bk.stab; v.we = Math.min(100, v.we + Bk.we);
      ID.logGrief(v, G.tick, 'A ' + Bk.name.toLowerCase() + ' killed ' + ID.fmtPop(dead + tl) + '.');
      if (v.id === G.player) ID.news(G, Bk.name.toUpperCase() + ': ' + ID.fmtPop(dead) + ' of our people and ' + ID.fmtPop(tl) + ' soldiers are dead. ' + lost.bld + ' buildings are gone' + (Bk.ringRad ? '; fallout poisons the land for ten years beyond the blast' : '') + '.', 'bad', v.id, A.id);
    }
    ID.fx(G, 'nuke', m.to, { r: Bk.r, ring: Bk.ring, thermo: kind === 'thermo' });
    ID.sfx(G, 'nuke');
    if (A.id === G.player) ID.news(G, Bk.name + ' detonated: about ' + ID.fmtPop(deadAll) + ' dead, ' + lost.bld + ' buildings destroyed and ' + lost.dmg + ' damaged.', 'war', A.id);
    ID.Diplomacy.onNuke(G, A, hit, m.to, kind);
  }
  C.tickRadiation = function (G) { // monthly
    const L = G.radList; if (!L || !L.length) return;
    for (let k = L.length - 1; k >= 0; k--) {
      const i = L[k];
      if (--G.rad[i] <= 0) {
        G.rad[i] = 0; L.splice(k, 1);
        const o = G.owner[i], tr = TERR[G.terrain[i]];
        if (o) { const v = G.nations[o]; v.popLand += tr.pop; v.foodLand += tr.food * (G.river[i] ? 1.25 : 1); }
        if (!G.headless) G.dirty.push(i);
      }
    }
  };

  /* ---------------------------------------------------------------- war abilities */
  /* dmg: condition lost by each building type in the radius [-, city, fort, port, factory, silo].
     kill: troops lost = their troops × kill × (their land in the radius / their land), at most cap, × your equipment. */
  C.ABIL = {
    barrage: { name: 'Artillery barrage', gold: 35, cd: 30, r: 4, range: 16, kill: 0.6, cap: 0.03, dmg: [0, 15, 50, 15, 15, 0], shock: 40,
      desc: 'Shell a stretch of the enemy line close to your own. Hits fortresses hard (−50 condition), and kills the troops holding that stretch: the smaller the enemy, the bigger the share of its army that stands there. The area is shaken for forty days: your attacks there cost 40% less and advance 25% faster.' },
    airraid: { name: 'Bombing raid', gold: 90, cd: 50, r: 6, range: 80, kill: 0.15, cap: 0.01, dmg: [0, 30, 15, 40, 40, 20], shock: 45, air: 1,
      desc: 'Bombers strike deep behind the lines at what keeps the enemy fighting: factories and ports lose 40 condition, cities 30 (with civilians killed and war weariness), forts 15. Few soldiers die. Better aircraft count: ±10% damage for each level of military technology you are ahead or behind. Needs military technology 3.' },
    reserves: { name: 'Call up the reserves', gold: 60, cd: 240, self: 1,
      desc: 'Every man who has ever held a rifle reports to the depots. An instant draft of 2% of the population, beyond your normal ceiling. Workers and peasants will not thank you, and the new men are badly equipped.' },
  };
  C.nearOwn = function (G, n, tile, range) {
    const W = G.W, H = G.H, x0 = tile % W, y0 = (tile / W) | 0, own = G.owner;
    for (let r = 0; r <= range; r++) {
      for (let dy = -r; dy <= r; dy++) {
        const y = y0 + dy; if (y < 0 || y >= H) continue;
        const step = Math.abs(dy) === r ? 1 : 2 * r;
        for (let dx = -r; dx <= r; dx += step || 1) { const x = x0 + dx; if (x >= 0 && x < W && own[y * W + x] === n.id) return true; }
      }
    }
    return false;
  };
  C.abilGold = (n, ab) => Math.round(ab.gold * (n.a.dp && n.a.dp.precision && !ab.doctrine ? 0.6 : 1) * (n.flags.ld_fire && !ab.doctrine ? 0.7 : 1));
  C.abilCd = (n, ab) => Math.round(ab.cd * (n.a.dp && n.a.dp.precision && !ab.doctrine ? 0.75 : 1) * (ab.doctrine && ID.Doctrine && ID.Doctrine.mastered(n) ? 0.7 : 1));
  C.abilBlock = function (G, n, key, tile) {
    const ab = C.ABIL[key]; if (!ab) return 'Unknown order.';
    if (ab.ideos && ab.ideos.indexOf(n.ideo) < 0) return 'Not part of your doctrine.';
    const cd = n.cd['ab_' + key] || 0; if (cd > G.tick) return 'Ready again in ' + (cd - G.tick) + ' days.';
    if (n.gold < C.abilGold(n, ab)) return 'Needs ' + C.abilGold(n, ab) + ' gold.';
    if (ab.doctrine) {
      if (!n.nwars) return 'Only in wartime.';
      if (ab.can) { const w = ab.can(G, n); if (w) return w; }
      if (ab.self) return '';
      if (tile == null || tile < 0) return 'Select an enemy tile first.';
      const o = G.owner[tile]; if (!o || o === n.id) return 'Target enemy land.';
      if (!ID.atWar(G, n.id, o)) return 'You are not at war with ' + G.nations[o].name + '.';
      if (ab.range < 999 && !C.nearOwn(G, n, tile, ab.range)) return 'Out of range: within ' + ab.range + ' tiles of your own land.';
      return '';
    }
    if (ab.air && n.tech.mil < 3) return 'Needs military technology 3.';
    if (ab.self) {
      if (!n.nwars) return 'Only in wartime.';
      if (n.troops >= n.pop * ID.maxMob(n) * 1.2) return 'There is no one left to call up.';
      if (ID.RECRUIT[n.laws.recruit].hire) return 'Hired companies have no reserves. Buy more troops instead.';
      return '';
    }
    if (tile == null || tile < 0) return 'Select an enemy tile first.';
    const o = G.owner[tile]; if (!o || o === n.id) return 'Target enemy land.';
    if (!ID.atWar(G, n.id, o)) return 'You are not at war with ' + G.nations[o].name + '.';
    if (!C.nearOwn(G, n, tile, ab.range)) return 'Out of range: within ' + ab.range + ' tiles of your own land.';
    return '';
  };
  C.useAbil = function (G, n, key, tile) {
    const why = C.abilBlock(G, n, key, tile); if (why) return why;
    const ab = C.ABIL[key];
    n.gold -= C.abilGold(n, ab); n.cd['ab_' + key] = G.tick + C.abilCd(n, ab);
    if (!ab.self && n.ars != null) { const sh = ab.gold * ID.Economy.ARS.shells * ID.Economy.drainK(G, n); n.ars = Math.max(0, n.ars - sh); n.a.shells = (n.a.shells || 0) + sh; } // shells and bombs come out of the arsenal
    if (ab.doctrine) {
      const Dn = ab.self ? null : G.nations[G.owner[tile]];
      const msg = ab.run(G, n, Dn, tile) || '';
      n.a.lastAbil = { key, msg, t: G.tick };
      if (!ab.self && tile >= 0) ID.fx(G, 'subvert', tile, { col: ID.ideo(n).color });
      if (n.id === G.player) { ID.news(G, ab.name + ': ' + msg, 'war', n.id); ID.sfx(G, 'drums'); }
      else if (Dn && Dn.id === G.player) ID.news(G, n.name + ' orders: ' + ab.name + '. ' + msg, 'war', n.id, Dn.id);
      ID.Combat.refresh(G, n);
      return '';
    }
    if (ab.self) {
      const add = Math.max(0, Math.min(n.pop * 0.02, n.pop * ID.maxMob(n) * 1.2 - n.troops));
      n.troops += add; n.sm.workers -= 4; n.sm.peasants -= 5; n.we = Math.min(100, n.we + 3); n.equip = Math.max(0.5, n.equip - 0.04);
      if (n.id === G.player) ID.news(G, 'The reserves are called up: ' + ID.fmtPop(add) + ' men report to the depots.', 'war', n.id);
      ID.sfx(G, 'drums');
      return '';
    }
    const D = G.nations[G.owner[tile]], W = G.W, H = G.H, x0 = tile % W, y0 = (tile / W) | 0;
    const airK = ab.air ? clamp(1 + 0.1 * (n.tech.mil - D.tech.mil), 0.6, 1.4) : 1;
    const hits = [0, 0, 0, 0, 0, 0]; let tilesIn = 0, civ = 0;
    for (let dy = -ab.r; dy <= ab.r; dy++) for (let dx = -ab.r; dx <= ab.r; dx++) {
      if (dx * dx + dy * dy > ab.r * ab.r) continue; const x = x0 + dx, y = y0 + dy; if (x < 0 || y < 0 || x >= W || y >= H) continue;
      const i = y * W + x; if (G.owner[i] !== D.id) continue; tilesIn++;
      const b = G.bld[i]; if (!b || !G.hp[i]) continue;
      const got = ID.damage(G, i, ab.dmg[b] * airK * (0.8 + 0.4 * G.rng.next()));
      if (got > 0) { hits[b]++; if (b === B.CITY) civ += 400 * (got / 100) * 0.02; }
    }
    const fx = G.fortCov[tile] === D.id ? ID.fortFx(G, tile) : null;
    const kill = Math.min(D.troops, D.troops * Math.min(ab.cap, ab.kill * tilesIn / Math.max(40, D.tiles)) * n.equip * (1 + 0.08 * n.tech.mil) * airK * (n.a.dp && n.a.dp.precision ? 1.35 : 1) * (n.flags.ld_fire ? 1.25 : 1) * (fx ? fx.shelter : 1) / Math.max(0.7, D.a.def || 1));
    D.troops -= kill; D.pop -= kill + civ; D.losses += kill; D.casM += kill; n.kills += kill;
    (G.shock || (G.shock = [])).push({ x: x0, y: y0, r: ab.r + 1, until: G.tick + ab.shock, by: n.id, vs: D.id });
    if (ab.air) { D.stab -= 1.5 + hits[B.CITY] * 0.5; D.we = Math.min(100, D.we + 1.5 + hits[B.CITY]); }
    const NM = [0, ['city', 'cities'], ['fort', 'forts'], ['port', 'ports'], ['factory', 'factories'], ['silo', 'silos']], parts = [];
    for (let t = 1; t <= 5; t++) if (hits[t]) parts.push(hits[t] + ' ' + NM[t][hits[t] > 1 ? 1 : 0]);
    const what = parts.join(', ');
    const txt = '−' + ID.fmtPop(kill) + (parts.length ? ' · ' + parts.length + ' hit' : '');
    ID.fx(G, key, tile, { r: ab.r, txt: n.id === G.player || D.id === G.player ? txt : '' });
    if (n.id === G.player || D.id === G.player) { ID.sfx(G, key === 'airraid' ? 'airraid' : 'barrage'); }
    const sum = ID.fmtPop(kill) + ' troops' + (civ >= 0.5 ? ' and ' + ID.fmtPop(civ) + ' civilians' : '') + ' killed' + (what ? '; damaged: ' + what : '; no buildings in range') + (fx ? ' (their fortress sheltered ' + Math.round((1 - fx.shelter) * 100) + '% of the garrison)' : '') + '.';
    if (n.id === G.player) ID.news(G, ab.name + ' on ' + D.name + ': ' + sum, 'war', n.id, D.id);
    if (D.id === G.player) ID.news(G, (ab.air ? 'Enemy bombers' : 'Enemy guns') + ' from ' + n.name + ' strike us: ' + sum, 'war', n.id, D.id);
    n.a.lastAbil = { key, kill, hits, civ, t: G.tick };
    return '';
  };
  function shocked(G, x, y, from, to) {
    const L = G.shock; if (!L || !L.length) return false;
    for (let k = 0; k < L.length; k++) { const s = L[k]; if (s.by === from && s.vs === to && (x - s.x) * (x - s.x) + (y - s.y) * (y - s.y) <= s.r * s.r) return true; }
    return false;
  }

  /* ---------------------------------------------------------------- supply & encirclement */
  C.BEACH_DAYS = 120; // a contested beach carries a pocket this long; after that it needs a captured port
  C.BLOCKADE = 3;     // an enemy navy this many times stronger than ours closes the sea to a pocket
  /* Days a pocket holds before it surrenders (cutAge counts in tens of days). */
  C.holdOf = (G, n, id) => {
    const fl = ID.ideo(n).flags; let h = (fl.noDecap || fl.partisans ? 12 : 4) * (n.a.dp && n.a.dp.logistics ? 2 : 1);
    for (const a of G.attacks) if (a.from === n.id && a.ck === id && a.holdX) h += a.holdX;
    return h;
  };
  /* What the map and the war panel show about the pocket an attack stands in: {enc, days, troops, why, sea, lift}. */
  C.pocketInfo = function (G, a) {
    const c = G._comps && G._comps[a.ck]; if (!c || !(a.pk >= 0)) return null;
    const n = G.nations[a.from], enc = c.st === 1;
    const days = enc ? Math.max(0, (C.holdOf(G, n, a.ck) - G.cutAge[c.start]) * 10) : 0;
    return { enc, days, troops: a.troops, why: c.why || '', sea: c.portI >= 0 ? 'port' : c.beachT >= 0 ? 'beach' : '', beachLeft: c.beachT >= 0 && !c.hasPort ? Math.max(0, C.BEACH_DAYS - (G.tick - c.beachT)) : -1, lift: a.to ? C.liftCap(G, n, a.to, a.ck) : 0, at: a.pk };
  };
  ID.placeName = (G, i) => { const P = G.provinces[G.prov[i]]; return (P && P.name) || ''; };
  C.updateSupply = function (G) {
    const W = G.W, N = G.N, own = G.owner;
    const comp = G._comp || (G._comp = new Int32Array(N)), stack = G._stack || (G._stack = new Int32Array(N));
    comp.fill(-1);
    const comps = [];
    const caps = new Int32Array(G.nations.length).fill(-1);
    for (const n of G.nations) if (n && n.alive) caps[n.id] = n.capital;
    for (let s = 0; s < N; s++) {
      const o = own[s]; if (!o || comp[s] >= 0) continue;
      const id = comps.length; let sp = 0, size = 0, hasCap = false, ports = 0, portI = -1;
      stack[sp++] = s; comp[s] = id; const cap = caps[o];
      while (sp) {
        const c = stack[--sp]; size++;
        if (c === cap) hasCap = true;
        if (G.bld[c] === B.PORT && G.hp[c]) { ports++; portI = c; }
        const x = c % W;
        if (x > 0 && own[c - 1] === o && comp[c - 1] < 0) { comp[c - 1] = id; stack[sp++] = c - 1; }
        if (x < W - 1 && own[c + 1] === o && comp[c + 1] < 0) { comp[c + 1] = id; stack[sp++] = c + 1; }
        if (c >= W && own[c - W] === o && comp[c - W] < 0) { comp[c - W] = id; stack[sp++] = c - W; }
        if (c < N - W && own[c + W] === o && comp[c + W] < 0) { comp[c + W] = id; stack[sp++] = c + W; }
      }
      comps.push({ o, size, hasCap, hasPort: ports > 0, ports, portI, start: s, st: 0, beachT: -1, beachI: -1, shore: -1, win: 0 });
    }
    // main component per nation
    const main = new Int32Array(G.nations.length).fill(-1);
    comps.forEach((c, id) => { if (c.hasCap) main[c.o] = id; });
    comps.forEach((c, id) => { if (main[c.o] < 0 || (!comps[main[c.o]].hasCap && c.size > comps[main[c.o]].size)) main[c.o] = id; });
    G._comps = comps; G._main = main;
    const beach = G.beach || (G.beach = []);
    for (let k = beach.length - 1; k >= 0; k--) { const b = beach[k]; if (own[b.i] !== b.o || comp[b.i] < 0) { beach.splice(k, 1); continue; } const c = comps[comp[b.i]]; if (b.t > c.beachT) { c.beachT = b.t; c.beachI = b.i; c.beachB = b; } }
    const cut = G.cut, age = G.cutAge, vis = G._vis || (G._vis = new Int32Array(N));
    // every piece apart from the main territory: who touches it, where its shore is, who rules the sea around it
    for (let id = 0; id < comps.length; id++) {
      const c = comps[id]; if (main[c.o] === id) continue;
      const n = G.nations[c.o], stp = (G._visS = (G._visS || 0) + 1), tiles = [], adj = {};
      let sp = 0, shore = -1, wasMain = 0, wild = 0; stack[sp++] = c.start; vis[c.start] = stp;
      while (sp) {
        const t = stack[--sp]; tiles.push(t); if (cut[t] === 0) wasMain++;
        if (shore < 0 && G.coast[t]) shore = t;
        const x = t % W;
        for (const q of [x > 0 ? t - 1 : -1, x < W - 1 ? t + 1 : -1, t >= W ? t - W : -1, t < N - W ? t + W : -1]) {
          if (q < 0) continue; const oo = own[q];
          if (oo === c.o) { if (comp[q] === id && vis[q] !== stp) { vis[q] = stp; stack[sp++] = q; } }
          else if (oo && G.warM[c.o * MAXN + oo]) adj[oo] = (adj[oo] || 0) + 1;
          else if (!oo && G.terrain[q] !== T.SEA) wild++;
        }
      }
      c.tiles = tiles; c.adj = adj; c.shore = shore; c.fromMain = wasMain * 2 > tiles.length; c.wild = wild;
      let win = 0, wb = 0; for (const k in adj) if (adj[k] > wb) { wb = adj[k]; win = +k; }
      c.win = win;
      if (!win) { // nobody contests it: supplied over its own shore, as in peacetime (an inland enclave stays cut, but nobody besieges it)
        if (shore < 0 && !c.hasPort) { c.st = 1; continue; }
        c.st = 2;
        if (c.beachB) c.beachB.t = G.tick; else if (!c.hasPort) { C.addBeach(G, shore, c.o); c.beachI = shore; }
        c.beachT = c.beachI >= 0 ? G.tick : -1;
        continue;
      }
      let nav = 0; for (const k in adj) { const r = C.seaPower(G.nations[k]) / Math.max(0.5, C.seaPower(n)); if (r > nav) nav = r; }
      c.navy = nav;
      const beachOK = c.beachT >= 0 && G.tick - c.beachT < C.BEACH_DAYS;
      c.st = shore >= 0 && nav < C.BLOCKADE && (c.hasPort || beachOK) ? 2 : 1;
      c.why = c.st === 2 ? '' : shore < 0 ? 'shore' : nav >= C.BLOCKADE ? 'navy' : c.beachT >= 0 ? 'beach' : c.fromMain ? 'land' : 'harbour';
    }
    let anyCut = false;
    for (let i = 0; i < N; i++) {
      const k = comp[i]; if (k < 0) { cut[i] = 0; continue; }
      const st = comps[k].st;
      if (cut[i] !== st && !G.headless && G.mapMode === 'supply') G.dirty.push(i);
      cut[i] = st;
      if (st === 1) { if (age[i] < 250) age[i]++; anyCut = true; } else age[i] = 0;
    }
    pieces(G, comps, main);
    if (!anyCut) return;
    // encircled pockets: the besieger pays while they hold, and they surrender in the end
    for (let id = 0; id < comps.length; id++) {
      const c = comps[id]; if (c.st !== 1 || !c.win) continue;
      const n = G.nations[c.o]; if (!n.alive || !n.nwars) continue;
      let give = false, held = 0;
      for (const a of G.attacks) if (a.from === c.o && a.ck === id) { held += a.troops; if (a.give) give = true; }
      if (held > 0.5) { const Wn = G.nations[c.win]; Wn.we = Math.min(100, Wn.we + 0.12); }
      if (!(give || c.size <= 4 || age[c.start] >= C.holdOf(G, n, id))) continue;
      surrender(G, c, id, n, G.nations[c.win], give);
    }
  };
  /* Attacks follow the pieces: a pocket's attack keeps its anchor, joins the main army when the ring is broken,
     is lost when its last ground falls; a salient cut off takes its share of the troops with it. */
  function pieces(G, comps, main) {
    const own = G.owner, comp = G._comp, W = G.W;
    for (let k = G.attacks.length - 1; k >= 0; k--) {
      const a = G.attacks[k];
      if (a.pk >= 0) {
        let t = own[a.pk] === a.from ? a.pk : a.last >= 0 && own[a.last] === a.from ? a.last : -1;
        if (t < 0) for (const v of a.heap.v) { for (const q of [v - 1, v + 1, v - W, v + W]) if (q >= 0 && q < G.N && own[q] === a.from && comp[q] >= 0 && comp[q] !== main[a.from]) { t = q; break; } if (t >= 0) break; }
        if (t < 0) { // overrun: the last of the pocket is gone
          G.attacks.splice(k, 1);
          const A = G.nations[a.from], D = G.nations[a.to];
          if (D && a.troops > 0.5) { D.kills += a.troops; D.cnt.prisoners = (D.cnt.prisoners || 0) + a.troops; }
          if (A && (A.id === G.player || a.to === G.player) && a.troops >= 1) ID.news(G, 'The last ' + A.adj + ' pocket ' + (D ? 'in ' + D.name + ' ' : '') + 'is overrun: ' + ID.fmtPop(a.troops) + ' troops are taken.', A.id === G.player ? 'war' : 'good', A.id, a.to);
          continue;
        }
        a.ck = comp[t]; a.pk = comps[a.ck].start; // anchor on a tile the piece surely holds
        if (a.ck === main[a.from]) { a.pk = -1; a.enc = 0; a.out = 0; a.holdX = 0; }
      } else a.ck = main[a.from];
    }
    // one attack per piece and enemy
    const seen = {};
    for (let k = G.attacks.length - 1; k >= 0; k--) {
      const a = G.attacks[k], key = a.from + ':' + a.to + ':' + a.ck, b = seen[key];
      if (!b) { seen[key] = a; continue; }
      b.troops += a.troops; b.committed += a.committed; if (!(a.pk >= 0)) { b.pk = -1; b.enc = 0; }
      G.attacks.splice(k, 1);
    }
    // a salient just cut off: the troops on that stretch of the front are inside it
    for (const a of G.attacks.slice()) {
      if (a.pk >= 0 || !a.to || a.troops < 4) continue;
      for (let id = 0; id < comps.length; id++) {
        const c = comps[id]; if (c.o !== a.from || main[a.from] === id || !c.fromMain || !c.adj || !c.adj[a.to] || c.size < 5) continue;
        if (seen[a.from + ':' + a.to + ':' + id]) continue;
        const share = Math.min(0.6, c.adj[a.to] / Math.max(1, ID.borders(G, a.from, a.to) + c.adj[a.to]));
        const tr = a.troops * share; if (tr < 1) continue;
        a.troops -= tr;
        const p = { id: G.nextId++, from: a.from, to: a.to, troops: tr, committed: tr, style: a.style, heap: new ID.Heap(), prog: 0, base: G.tick, scan: -999, idle: 0, amphib: 0, taken: 0, pk: c.start, ck: id };
        G.attacks.push(p); seen[a.from + ':' + a.to + ':' + id] = p;
      }
    }
    // encirclement starts and ends
    for (const a of G.attacks) {
      const c = comps[a.ck]; if (!(a.pk >= 0) || !c || !a.to) continue; // colonies expanding into empty land are never besieged
      a.sea = c.portI >= 0 ? c.portI : c.beachI;
      if (c.st !== 1) { a.enc = 0; a.out = 0; continue; }
      if (a.enc) continue;
      a.enc = G.tick || 1; a.bd = 1e9; a.bo = -1; a.scan = -999;
      // break out toward the nearest ground of the main territory
      const m = main[a.from], x0 = a.pk % W, y0 = (a.pk / W) | 0;
      if (m >= 0) { let bd = 1e9; for (let i = 0; i < G.N; i++) if (comp[i] === m) { const d = Math.abs(i % W - x0) + Math.abs(((i / W) | 0) - y0); if (d < bd) { bd = d; a.bo = i; } } a.bd = bd + 1; }
      const A = G.nations[a.from], D = G.nations[a.to], near = ID.placeName ? ID.placeName(G, a.pk) : '';
      if (a.from === G.player && a.troops >= 1 && ID.Events) ID.Events.queue(G, A, 'enc_pocket', { id: a.id, to: a.to, near });
      if (a.to === G.player && a.troops >= 1) ID.news(G, ID.fmtPop(a.troops) + ' ' + A.adj + ' troops are encircled' + (near ? ' near ' + near : '') + '. Hold the ring and they must surrender.', 'good', A.id, D.id);
    }
  }
  function surrender(G, c, id, n, Wn, give) {
    const tiles = c.tiles;
    const share = tiles.length / Math.max(1, n.tiles);
    const lost = n.troops * Math.min(0.9, share * 0.9);
    let pocket = 0;
    for (let k = G.attacks.length - 1; k >= 0; k--) { const a = G.attacks[k]; if (a.from === n.id && a.ck === id) { pocket += a.troops; G.attacks.splice(k, 1); } }
    const back = give ? pocket * 0.4 : 0; pocket -= back; // a surrender on terms sends the wounded home
    n.troops += back - lost; n.pop -= lost * 0.3 + pocket * 0.3; n.losses += lost + pocket; n.casM += (lost + pocket) * 0.6;
    Wn.kills += lost + pocket; Wn.cnt.prisoners = (Wn.cnt.prisoners || 0) + lost + pocket;
    const near = ID.placeName ? ID.placeName(G, c.start) : '';
    const war = ID.Diplomacy.warOf(G, Wn.id, c.o);
    for (const t of tiles) ID.setOwner(G, t, Wn.id);
    if (war) { if (war.a === Wn.id) war.ta += tiles.length; else war.tb += tiles.length; }
    if (tiles.length > 60 || pocket >= 2) {
      const tot = lost + pocket, k = Math.min(8, 2 + tot / 15);
      ID.news(G, 'Encircled: a ' + n.adj + ' pocket' + (near ? ' near ' + near : '') + ' of ' + tiles.length + ' tiles surrenders to ' + Wn.name + '. ' + ID.fmtPop(tot) + ' troops go into captivity.', n.id === G.player ? 'war' : 'good', Wn.id, n.id);
      if (n.id === G.player) { ID.sfx(G, 'bad'); ID.logGrief(n, G.tick, 'A pocket was encircled and ' + ID.fmtPop(tot) + ' troops surrendered.'); }
      if (Wn.id === G.player) ID.sfx(G, 'good');
      Wn.glory = Math.min(100, Wn.glory + k); n.glory -= k; n.we = Math.min(100, n.we + k * 0.6); Wn.stab = Math.min(100, Wn.stab + k * 0.25);
      if (ID.Press && pocket >= 10) ID.Press.pocket(G, Wn, n, tot, near);
    }
    if (n.tiles <= 0) ID.Diplomacy.eliminate(G, n, Wn);
  }

  /* ---------------------------------------------------------------- per-tick driver */
  C.tick = function (G) {
    const at = G.attacks;
    for (let k = at.length - 1; k >= 0; k--) { if (k < at.length) { if (at[k].to === 0) processExpand(G, at[k]); else processAttack(G, at[k]); } }
    if (G.boats.length) {
      for (let k = G.boats.length - 1; k >= 0; k--) {
        const bt = G.boats[k]; bt.pos += C.BOAT_SPEED;
        if (bt.pos >= bt.path.length - 1) { G.boats.splice(k, 1); landBoat(G, bt); }
      }
    }
    if (G.missiles.length) {
      for (let k = G.missiles.length - 1; k >= 0; k--) { const m = G.missiles[k]; if (++m.t >= m.dur) { G.missiles.splice(k, 1); impact(G, m); } }
    }
    if (G.capLost.length) { const L = G.capLost.splice(0); for (const [from, to] of L) ID.Diplomacy.onCapitalLost(G, G.nations[from], G.nations[to]); }
    if (G.fortsDirty) ID.recomputeForts(G);
    if (G.tick % 10 === 0) { C.updateSupply(G); if (G.shock && G.shock.length) G.shock = G.shock.filter((s) => s.until > G.tick); }
  };

  /* The player's army is encircled: break out, hold for relief, or surrender on terms. */
  ID.EVENT_DEFS.push({ id: 'enc_pocket', sys: 1, tone: 'bad', sfx: 'alarm', press: 0,
    title: (n, G, c) => 'Our army is encircled' + (c.near ? ' near ' + c.near : ''),
    text: (n, G, c) => {
      const a = G.attacks.find((x) => x.id === c.id), p = a && C.pocketInfo(G, a), D = G.nations[c.to];
      if (!p || !p.enc) return 'The ring has already been broken.';
      const why = { navy: 'The ' + (D ? D.adj + ' ' : '') + 'navy rules the sea around it, so no ship gets through.', beach: 'The beach can no longer carry them: it has been under fire for months, and they never took a port.', shore: 'They have lost their last stretch of coast.', harbour: 'The beach is lost and they hold no port: ships have nowhere to land.', land: 'The enemy has closed the ring behind them.' }[p.why] || '';
      return ID.fmtPop(p.troops) + ' of our troops are cut off' + (D ? ' inside ' + D.name : '') + '. ' + why + ' Without supply they lose men and nerve every day and cannot advance; at best they can fight toward our own lines. Unless the ring is broken they must surrender in about ' + p.days + ' days.';
    },
    opts: (G, n, c) => {
      const get = (GG) => GG.attacks.find((x) => x.id === c.id && x.enc);
      if (!get(G)) return [{ label: 'Good news, then', fx: [] }];
      return [
        { label: 'Fight our way out', tip: 'Everything toward our own lines: the breakout moves half again as fast, but the pocket bleeds faster.', ai: 2, fx: [['fn', (GG) => { const a = get(GG); if (a) { a.out = 1; a.surge = GG.tick + 20; a.scan = -999; } }], ['note', 'A breakout toward our lines; heavier losses', null]] },
        { label: 'Hold for relief', tip: 'Dig in and wait for the relief attack. They hold a month longer, and every day costs the besieger war weariness.', ai: 1, fx: [['fn', (GG) => { const a = get(GG); if (a) a.holdX = (a.holdX || 0) + 3; }], ['note', 'The pocket holds about 30 days longer', true]] },
        { label: 'Surrender on terms', tip: 'Spare the men: four in ten come home wounded or exchanged. The ground is lost.', ai: 0.3, fx: [['fn', (GG) => { const a = get(GG); if (a) a.give = 1; }], ['stab', -3], ['note', 'Four in ten of the troops come home', true]] },
      ];
    } });

  /* Daily population and troop pool. */
  C.tickPop = function (G, n) {
    const cap = ID.popCap(n);
    if (n.pop < 1) n.pop = 1;
    // people stop multiplying as the harvest nears what they eat
    const g = 0.00015 * (0.55 + n.ls / 110) * Math.max(0, Math.min(1, (ID.Economy.harvest(n) - ID.Economy.GROW_AT) * 20)) * (1 + ID.mod(n, 'growth'));
    if (n.pop < cap) n.pop += n.pop * g * (1 - n.pop / cap); else n.pop -= (n.pop - cap) * 0.006;
    const r = ID.RECRUIT[n.laws.recruit];
    if (n.troops > n.pop * 0.6) n.troops = n.pop * 0.6;
    if (r.hire) { if (n.gold < 0 && n.troops > 0) n.troops *= 0.995; return; }
    const target = n.pop * n.mob;
    if (n.troops < target) n.troops += (target - n.troops) * 0.0042 * r.regen * (1 + ID.mod(n, 'regen')) * (n.nwars && n.a.defensive ? 2 : 1);
    else n.troops -= (n.troops - target) * 0.01;
  };
})();
