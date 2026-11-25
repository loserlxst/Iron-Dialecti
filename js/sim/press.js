/* IRON DIALECTIC — the press: what happens in other countries, written up as newspaper stories.
   Stories are collected in G.press.q as they happen; ID.Press.month bundles them into editions
   (a lead story and a column of briefs) which the interface shows as a front page. No DOM.
   A story: { t, w (1 brief .. 5 stop the presses), kind, a, b, title, text, art }. */
(function () {
  'use strict';
  const ID = (globalThis.ID = globalThis.ID || {});
  const Pr = (ID.Press = {});
  const clamp = ID.clamp;
  Pr.NAME = 'The World Dispatch';
  Pr.state = (G) => G.press || (G.press = { q: [], arch: [], last: 0, seen: {}, no: 0 });

  const major = (G, n) => !!(n && ID.isMajor(G, n));
  const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
  const lc = (s) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);
  const leaderOf = (n) => (n.leader ? ((n.leader.title ? n.leader.title + ' ' : '') + n.leader.name).trim() : 'the government');
  /* "the Kingdom of Norvik", but "Greater Ruthe" and plain "Lys". */
  const the = (n) => (n.name === n.base || /^(Greater|The|Free City) /.test(n.name) ? n.name : 'the ' + n.name);
  const The = (n) => { const t = the(n); return t.charAt(0).toUpperCase() + t.slice(1); };
  const theS = (s, n) => (n && s === n.base ? s : /^(Greater|The) /.test(s) ? s : 'the ' + s);
  const months = (m) => (m >= 24 ? Math.round(m / 12) + ' years' : m >= 12 ? 'a year' : Math.max(1, Math.round(m)) + ' months');

  /* Add a story. The player's own country is left out: they lived it. */
  Pr.add = function (G, o) {
    if (!G.player || G.over) return;
    if (!o.own && (o.a === G.player || (o.b === G.player && !o.both))) return;
    const S = Pr.state(G);
    if (o.key) { if (S.seen[o.key] != null && G.tick - S.seen[o.key] < (o.gap || 720)) return; S.seen[o.key] = G.tick; }
    S.q.push({ t: G.tick, w: o.w || 2, kind: o.kind || 'pol', a: o.a || 0, b: o.b || 0, title: o.title, text: o.text, art: o.art || null, pre: o.pre || null });
    if (S.q.length > 30) { let k = 0; for (let i = 1; i < S.q.length; i++) if (S.q[i].w < S.q[k].w) k = i; S.q.splice(k, 1); }
  };

  /* ---------------------------------------------------------------- story builders */
  /* How a country stands, in a clause: used to explain why things happen there. */
  Pr.mood = function (G, n) {
    const P = ID.Politics, why = P && P.troubleOf ? P.troubleOf(G, n) : '';
    if (why) return why;
    if (n.stab < 35) return 'a government that had lost its grip';
    if ((n.a.opp || 0) > 40) return 'an opposition grown too large to police';
    return '';
  };
  /* The neighbour that will like this least. */
  function alarmed(G, n) {
    let best = null, bs = 12;
    for (const k in G.border[n.id] || {}) {
      const o = G.nations[+k]; if (!o || !o.alive || o.id === n.id) continue;
      const s = -ID.ideoAffinity(n.ideo, o.ideo); if (s > bs) { bs = s; best = o; }
    }
    return best;
  }

  Pr.regime = function (G, n, oldName, oldIdeo, mode, why, sponsor) {
    const I = ID.ideo(n), Io = ID.IDEOLOGIES[oldIdeo], big = major(G, n), sp = sponsor && G.nations[sponsor] && G.nations[sponsor].alive ? G.nations[sponsor] : null;
    const al = alarmed(G, n), tail = al ? ' In ' + al.base + ', which shares a border and nothing else with the new regime, the garrisons have been put on alert.' : '';
    const what = ' ' + I.name + ' means, in a sentence: ' + lc(I.short || I.name) + (/[.!?]$/.test(I.short || '') ? '' : '.');
    let title, text, w = 2, art = 'parliament';
    if (mode === 'revolution') {
      title = 'Revolution in ' + n.base; w = big ? 5 : 4; art = 'revolution';
      text = cap(theS(oldName, n)) + ' no longer exists. After ' + (why || 'months of unrest') + ', crowds and mutinous regiments carried the ' + I.name + ' movement into the capital, and ' + the(n) + ' was proclaimed from the steps of the old ministry. ' + leaderOf(n) + ' heads the new government.' + (sp ? ' The money and the pamphlets came from ' + the(sp) + ', which has not troubled to deny it.' : '') + what + tail;
    } else if (mode === 'coup') {
      title = 'Coup in ' + n.base; w = big ? 4 : 3; art = 'army';
      text = 'Armoured cars stand at the crossroads of the capital and the radio plays marches. After ' + (why || 'a long quarrel between the ministers and the barracks') + ', officers have deposed the ' + Io.name + ' government of ' + theS(oldName, n) + (sp ? ' with money and advice from ' + the(sp) : '') + '. ' + The(n) + ' has been proclaimed under ' + leaderOf(n) + '.' + what + tail;
    } else if (mode === 'election') {
      title = n.base + ' votes for a new order'; w = big ? 3 : 2; art = 'crowd';
      text = 'The voters of ' + theS(oldName, n) + ' have turned out their ' + Io.name + ' government. ' + leaderOf(n) + ' forms a ministry of a different colour, and the country will now be known as ' + the(n) + '.' + what;
    } else if (mode === 'imposed') {
      title = 'A new regime for ' + n.base; w = 3; art = 'wall';
      text = (sp ? The(sp) + ' has' : 'The victors have') + ' installed a government of their own choosing in the defeated country, which will be called ' + the(n) + '. Its ministers were sworn in under foreign bayonets.' + what;
    } else if (mode === 'succession') {
      title = 'A change at the top in ' + n.base; w = 2; art = 'crown';
      text = 'Power has changed hands in ' + theS(oldName, n) + ', and the system with it. ' + leaderOf(n) + ' now rules ' + the(n) + '.' + what;
    } else {
      title = n.base + ' remakes itself'; w = big ? 3 : 2; art = 'parliament';
      text = 'Without a shot fired, ' + theS(oldName, n) + ' has become ' + the(n) + '. ' + (mode === 'reform' ? 'The change was decreed from above by ' + leaderOf(n) + '.' : 'Nobody decreed it: the old arrangements simply stopped being believed.') + what + tail;
    }
    Pr.add(G, { w, kind: 'rev', a: n.id, title, text, art });
  };

  Pr.coupFails = function (G, n, backer) {
    const sp = backer && G.nations[backer] ? G.nations[backer] : null;
    Pr.add(G, { w: major(G, n) ? 3 : 2, kind: 'pol', a: n.id, art: 'army', title: 'Coup attempt fails in ' + n.base, key: 'coupfail' + n.id, gap: 360,
      text: 'A group of officers tried to seize the ministries of ' + the(n) + ' before dawn and had been arrested by noon. ' + (sp ? 'The government says the plot was paid for by ' + the(sp) + ' and has expelled its ambassador.' : 'The government says the conspiracy was small. The number of arrests suggests otherwise.') + ' The army that stayed loyal will expect to be thanked.' });
  };

  Pr.war = function (G, A, B, cb) {
    const names = ID.Diplomacy.CB_NAMES, bigA = major(G, A), bigB = major(G, B);
    const w = bigA && bigB ? 4 : bigA || bigB ? 3 : 2;
    const ratio = ID.Diplomacy.power(A) / Math.max(1, ID.Diplomacy.power(B));
    const odds = ratio > 1.8 ? 'Few expect ' + B.base + ' to hold for long.' : ratio < 0.7 ? 'On paper the attacker is the weaker side, which suggests it knows something or fears something.' : 'The two are closely matched, and nobody is predicting a short war.';
    const why = { cores: A.base + ' says it is taking back provinces that were always its own.', claims: A.base + ' has pressed claims on the border provinces for years; now it presses them with artillery.', ally: A.base + ' says it is honouring an alliance.', coalition: A.base + ' says the world can no longer live beside ' + B.base + '.', holy: 'The war has been proclaimed in the name of the faith.', liberate: A.base + ' says it comes as a liberator.', containment: A.base + ' calls it containment.', alliance: A.base + ' is honouring its treaty.', none: 'No reason was given that anyone abroad believes.' }[cb || 'none'] || '';
    const bloc = B.bloc && G.blocs[B.bloc] ? ' ' + B.base + ' belongs to the ' + G.blocs[B.bloc].name + ', whose members must now decide what their signatures were worth.' : '';
    Pr.add(G, { w, kind: 'war', a: A.id, b: B.id, art: 'war', title: A.base + ' declares war on ' + B.base, key: 'war' + A.id + '_' + B.id, gap: 200,
      text: The(A) + ' is at war with ' + the(B) + ' (' + lc(names[cb || 'none'] || 'war') + '). ' + why + ' ' + A.base + ' has ' + ID.fmtPop(A.troops) + ' men under arms against ' + ID.fmtPop(B.troops) + '. ' + odds + bloc });
  };
  Pr.peace = function (G, A, B, win, w0) {
    const m = w0 ? (G.tick - w0.start) / 30 : 12;
    Pr.add(G, { w: major(G, A) && major(G, B) ? 3 : major(G, A) || major(G, B) ? 2 : 1, kind: 'dip', a: A.id, b: B.id, art: 'peace', title: 'Peace between ' + A.base + ' and ' + B.base,
      text: 'After ' + months(m) + ' of war, ' + the(A) + ' and ' + the(B) + ' have signed a peace. ' + (win ? The(win) + ' keeps what its armies hold; ' + (win === A ? B : A).base + ' has signed away the rest and will not forget it.' : 'Neither side took what it wanted, and the frontier is where the exhausted armies stopped.') + ' A five-year truce binds both.' });
  };
  Pr.fall = function (G, L, W, mode) {
    const big = major(G, L) || (major(G, W) && L.startTiles > 500), small = L.startTiles < 260 && !big;
    Pr.add(G, { w: big ? 4 : small ? 2 : 3, kind: 'war', a: W.id, b: L.id, both: 1, art: mode === 'annex' ? 'wall' : 'peace', title: mode === 'annex' ? L.base + ' wiped from the map' : L.base + ' capitulates',
      text: mode === 'annex' ? The(L) + ' has ceased to exist. Its last government has fled or been arrested, and its provinces are now administered from ' + W.base + '. The other states of the world are counting their own divisions.'
        : mode === 'install' ? The(L) + ' has laid down its arms. ' + The(W) + ' has installed a government of its own choosing in the capital and bound the country to its bloc.'
          : The(L) + ' has laid down its arms, paid an indemnity to ' + the(W) + ' and been left its borders.' });
  };
  Pr.pocket = function (G, W, L, troops, near) {
    Pr.add(G, { w: major(G, W) || major(G, L) ? 3 : 2, kind: 'war', a: W.id, b: L.id, both: 1, art: 'war', title: 'A ' + L.adj + ' army surrenders' + (near ? ' at ' + near : ''), key: 'pocket' + L.id, gap: 120,
      text: 'Cut off from the sea and from home, ' + ID.fmtPop(troops) + ' ' + L.adj + ' troops' + (near ? ' around ' + near : '') + ' have laid down their arms to ' + the(W) + '. They held out for weeks on dwindling rations; the columns of prisoners are being marched inland. ' + The(L) + ' calls it a regrouping.' });
  };
  Pr.civil = function (G, n, R, share, why, sponsor) {
    const sp = sponsor && G.nations[sponsor] ? G.nations[sponsor] : null;
    Pr.add(G, { w: major(G, n) ? 4 : 3, kind: 'rev', a: n.id, b: R.id, art: 'revolution', title: 'Civil war in ' + n.base,
      text: (why ? 'After ' + why + ', ' + the(n) : The(n)) + ' has split in two. The rebels hold ' + Math.round(share * 100) + '% of the country and have proclaimed ' + the(R) + ' under the banner of ' + ID.ideo(R).name + '.' + (sp ? ' Their rifles are of ' + sp.adj + ' manufacture.' : '') + ' Both sides claim to be the only government, and both are asking the powers for arms.' });
  };
  Pr.civilEnds = function (G, by, lost) {
    Pr.add(G, { w: major(G, by) ? 4 : 3, kind: 'rev', a: by.id, art: 'peace', title: 'The civil war in ' + by.base + ' is over',
      text: The(by) + ' now rules the whole country. The last forces of ' + the(lost) + ' have surrendered or crossed the frontier. The victors promise reconciliation; the prisons are being enlarged.' });
  };
  /* A dispatch answered by another government: the heart of the foreign pages. */
  Pr.story = function (G, n, def, o, ctx) {
    const E = ID.Events; let title, text, pick;
    try { title = E.txt(def.title, G, n, ctx); text = E.txt(def.text, G, n, ctx); pick = E.txt(o.label, G, n, ctx); } catch (e) { return; }
    if (!title || !text) return;
    const diverged = def.story && G.historical && !o.hist && E.options(G, n, def, ctx).some((x) => x.hist);
    Pr.add(G, { w: def.story ? (major(G, n) ? 4 : 3) : 2, kind: 'pol', a: n.id, art: def.art || null, title: n.base + ': ' + lc(title),
      text: text + ' The decision in ' + n.base + ': ' + lc(pick).replace(/[.]$/, '') + '.' + (diverged ? ' It is not what anyone expected.' : '') });
  };
  Pr.destiny = function (G, n, old, d) {
    Pr.add(G, { w: major(G, n) ? 4 : 3, kind: 'pol', a: n.id, art: d.art || 'crowd', title: old + ' becomes the ' + n.destiny.name.replace(/^The /, ''),
      text: old + ' has taken a new name, a new flag and a motto: “' + n.destiny.motto + '” The proclamation was read by ' + leaderOf(n) + '. “' + d.quote + '”' });
  };
  Pr.bloc = function (G, leader, name) {
    Pr.add(G, { w: major(G, leader) ? 3 : 2, kind: 'dip', a: leader.id, art: 'peace', title: 'A new alliance: the ' + name.replace(/^The /, ''), key: 'bloc' + leader.id, gap: 1080,
      text: The(leader) + ' has founded the ' + name.replace(/^The /, '') + ' and invited states of like mind to join it. Its rivals describe the treaty as an encirclement; its signatories as an insurance policy.' });
  };
  Pr.palace = function (G, n, f, won, toIdeo) {
    Pr.add(G, { w: major(G, n) ? 4 : 3, kind: 'pol', a: n.id, art: won ? 'army' : 'crown', title: won ? 'Palace coup in ' + n.base : 'A plot uncovered in ' + n.base, key: 'palace' + n.id, gap: 240,
      text: won ? f.name + ', who held ' + f.title + ' under the old leader, has taken his place. The move came from inside the inner circle; the streets learned of it from the radio.' + (toIdeo ? ' The new master is expected to bring ' + ID.IDEOLOGIES[toIdeo].name + ' with him.' : '')
        : f.name + ', until yesterday one of the most powerful figures in ' + the(n) + ', has been arrested with his associates. The official communiqué speaks of treason. Foreign embassies speak of a succession struggle.' });
  };
  Pr.death = function (G, n, oldName, heir) {
    Pr.add(G, { w: major(G, n) ? 3 : 2, kind: 'pol', a: n.id, art: 'crown', title: 'The ruler of ' + n.base + ' is dead', key: 'death' + n.id, gap: 240,
      text: oldName + ' is dead. ' + (heir ? 'The succession had been prepared: ' : 'No successor had been named, and after some days of silence the name announced was ') + leaderOf(n) + '. The first test of any new ruler is whether the old one’s men obey him.' });
  };
  Pr.line = function (G, n, body, line) {
    if (!major(G, n)) return;
    Pr.add(G, { w: 1, kind: 'pol', a: n.id, title: n.base + ': ' + lc(line.name), key: 'line' + n.id, gap: 300, text: body + ' of ' + the(n) + ' has set the line for the coming years: ' + lc(line.name) + '. ' + (line.desc || '') });
  };
  Pr.slump = function (G) {
    Pr.add(G, { w: 5, kind: 'eco', own: 1, art: 'crisis', title: 'The markets collapse', key: 'slump', gap: 3600,
      text: 'Share prices on every exchange fell together and went on falling. Banks have closed their doors on their depositors; factories that were hiring last month are padlocked. Economists disagree about the cause and agree that it will last years. Governments that depend on the confidence of business are the most exposed. Those that abolished business are saying so loudly.' });
  };

  /* A world chapter of the storyline, written up as it happens. */
  Pr.beat = function (G, b) {
    const nw = ID.PRESS_NOW && ID.PRESS_NOW[b.id]; if (!nw) return;
    Pr.add(G, { w: nw.w || 4, kind: 'pol', own: 1, art: nw.art || null, title: nw.title, text: nw.text });
  };

  /* ---------------------------------------------------------------- rumours before the dated chapters */
  function rumours(G, S) {
    if (!G.historical || !ID.PRESS_PRE || !ID.STORY || !ID.Story) return;
    for (const b of ID.STORY) {
      const pre = ID.PRESS_PRE[b.id]; if (!pre) continue;
      if ((G.story && G.story.done[b.id]) || S.seen['pre_' + b.id]) continue;
      const at = ID.Story.at(b), lead = (pre.months || 3) * 30;
      if (G.tick < at - lead || G.tick >= at) continue;
      if (pre.cond) { try { if (!pre.cond(G)) continue; } catch (e) { continue; } }
      if (b.cond) { try { if (!b.cond(G)) continue; } catch (e) { continue; } }
      S.seen['pre_' + b.id] = G.tick;
      const n = b.nation ? ID.byBase(G, b.nation) : null;
      Pr.add(G, { w: pre.w || 3, kind: 'pol', a: n ? n.id : 0, own: 1, art: pre.art || null, title: pre.title, text: pre.text, pre: b.id });
    }
  }

  /* ---------------------------------------------------------------- editions */
  const GAP = [0, 360, 300, 150, 75, 12];
  Pr.month = function (G) {
    if (!G.player || G.over) return;
    const S = Pr.state(G);
    rumours(G, S);
    for (let k = S.q.length - 1; k >= 0; k--) { const x = S.q[k]; if (G.tick - x.t > (x.w >= 3 ? 420 : 240) || (x.pre && G.story && G.story.done[x.pre])) S.q.splice(k, 1); }
    if (!S.q.length) return;
    let lead = S.q[0]; for (const x of S.q) if (x.w > lead.w || (x.w === lead.w && x.t > lead.t)) lead = x;
    // a warning is worth nothing after the event: what is building up goes to press within the month
    const warn = S.q.find((x) => x.pre);
    if (warn && G.tick - S.last >= 25 && lead.w < 5) lead = warn;
    else if (G.tick - S.last < GAP[clamp(lead.w, 1, 5)]) return;
    if (lead.w <= 2 && S.q.length < 3) return;
    const rest = S.q.filter((x) => x !== lead).sort((a, b) => b.w - a.w || b.t - a.t).slice(0, 4);
    const ed = { no: ++S.no, t: G.tick, lead, briefs: rest, box: Pr.box(G) };
    S.q = S.q.filter((x) => x !== lead && rest.indexOf(x) < 0);
    S.arch.push(ed); if (S.arch.length > 24) S.arch.shift();
    S.last = G.tick; S.fresh = ed.no;
    if (!G.headless) G.uiDirty = true;
  };
  /* The standing box at the foot of the page: who is strongest, who is fighting. */
  Pr.box = function (G) {
    const ns = ID.alive(G).filter((n) => !n.civilOf).sort((a, b) => ID.Diplomacy.power(b) - ID.Diplomacy.power(a));
    const wars = []; const seen = {};
    for (const k in G.dip) { const d = G.dip[k]; if (!d.war) continue; const a = G.nations[d.war.a], b = G.nations[d.war.b]; if (!a || !b || !a.alive || !b.alive) continue; const key = Math.min(a.id, b.id) + '_' + Math.max(a.id, b.id); if (seen[key]) continue; seen[key] = 1; wars.push([a.id, b.id, Math.round((G.tick - d.war.start) / 30)]); }
    return { top: ns.slice(0, 4).map((n) => [n.id, n.name, ID.ideo(n).name]), wars: wars.slice(0, 5), nwars: wars.length, tension: Math.round(G.world.tension || 0) };
  };
})();
