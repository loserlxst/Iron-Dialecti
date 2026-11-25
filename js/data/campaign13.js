/* IRON DIALECTIC — two countries of The Three Continents remade around the accelerated systems (session 14).
   Loads last of the data files and replaces, for each, everything the older layers built: the starting system,
   identity, inner circle, national question, the whole national tree (programmes, projects, destinies) and the
   national chapters of the storyline.

   TESSALY — Techno-Socialist Accelerationism. The mountain cantons were taken from within in 1909 by
   their watchmakers, telegraphists and dam-builders; every peak carries a transmitter. National question: the
   Wire and the Valleys (speed against consent). Four roads: the planetary signal, the federation of free
   signals, the Thermidor in the mountains (Juche), the automated cantons. Neighbours: Verano’s syndicates (one
   federation, or swallow them), Cassine’s bankers (the broadcast), Karsova’s party (join or denounce), Vess.

   MERIDIA — NRX Accelerationism. The southern republic defaulted on its bridges in 1906 and its bondholders
   foreclosed on the state: a sovereign corporation with the best laboratories on two continents. National
   question: the Patchwork (one company, or a hundred charter cities). Three roads: the singularity, the
   patchwork of free cities, the crowned company; and the secret road of the Model. Neighbours: Antara’s copper
   and colonels, Cassine’s exchange, Hesperia’s arms contracts, the Old Lands.

   The two are rivals by doctrine and meet in the race for the thinking machine (1947). */
(function () {
  'use strict';
  const ID = (globalThis.ID = globalThis.ID || {});
  const E = ID.EVENT_DEFS, PERM = 600, LONG = 120, FACT = 4, FORT = 2, SILO = 5;
  const RED = '#b5221a', INK = '#17140f', PAPER = '#ebe2cc', GOLD = '#d4a12a', VIOLET = '#6a2bb0', LIME = '#7fb014', TEAL = '#1d7b80', SNOW = '#f2efe6';
  const P = (id, name, x, y, o) => Object.assign({ id, name, x, y, days: 120 }, o || {});
  const by = (G, b) => ID.byBase(G, b);
  const on = (b, fn) => ['fn', (G, n) => { const t = by(G, b); if (t && t.alive && t !== n) fn(G, n, t); }];
  const fam = (n) => ID.ideo(n).family;
  const fig = (n, k) => (ID.Regime ? ID.Regime.figByKey(n, k) : null);
  const nm = (n, k, alt) => { const f = fig(n, k); return f ? f.name : alt; };
  const story = (o) => { o.sys = 1; o.story = 1; E.push(o); };
  const beat = (b) => ID.STORY.push(b);
  const nat = (o) => { o.sys = 1; o.national = 1; if (!o.tone) o.tone = 'bad'; E.push(o); };
  /* a destiny is a turning point, not a fortress (as in data/destiny.js) */
  const tame = (L) => { for (const f of L) if (f.dest) { for (const x of f.fx) { if (x[0] === 'legitmod' && x[2] >= PERM) x[2] = LONG; if (x[0] === 'mod' && x[1] === 'def' && x[2] > 0.12) x[2] = 0.12; if (x[0] === 'mod' && x[1] === 'ls' && x[2] > 4) x[2] = 4; } f.fx.push(['threat', 8]); f.days = 150; } };
  const exclAll = (L) => { const d = L.filter((f) => f.dest).map((f) => f.id); for (const f of L) if (f.dest) f.excl = (f.excl || []).concat(d.filter((x) => x !== f.id)); };
  const scen = (base) => { for (const k in ID.SCENARIOS || {}) { const S = ID.SCENARIOS[k]; const L = S.nations || S.list || []; const x = L.find && L.find((o) => o.base === base); if (x) return x; } return null; };

  /* ================================================================ TESSALY */
  const SIG = ['socialist', 'anarchist'];
  const tessaly = [
    /* ---- the signal: the revolution abroad */
    P('tn_masts', 'A transmitter on every peak', 1, 0, { hist: 1, fams: SIG, desc: 'The mountains are the tallest aerials in the west. Every summit gets a mast, and every mast a voice that carries into three countries.', fx: [['sig', 6], ['subvert', 'Cassine', 6], ['subvert', 'Verano', 4], ['mod', 'sci', 0.03, PERM, 'The masts']] }),
    P('tn_vfed', 'One federation of the southwest', 0, 1, { hist: 1, req: ['tn_masts'], excl: ['tn_vabsorb'], can: (n, G) => (by(G, 'Verano') ? '' : 'Verano no longer exists.'), desc: 'Verano’s syndicates and our network sign a pact: their general strike, our transmitters. Every union hall in Verano gets a receiver; every receiver gets a vote.', fx: [['ally', 'Verano'], ['op', 'Verano', 25], ['sup', 'workers', 4], ['sig', 4]] }),
    P('tn_vabsorb', 'The network swallows the unions', 2, 1, { req: ['tn_masts'], excl: ['tn_vfed'], fams: SIG, can: (n, G) => (by(G, 'Verano') ? '' : 'Verano no longer exists.'), desc: 'Verano’s syndicates debate every decision for a week. Our broadcast reaches their members faster than their own delegates can, and tells them so.', fx: [['subvert', 'Verano', 18], ['op', 'Verano', -25], ['sig', 8]] }),
    P('tn_cassine', 'The broadcast to Cassine', 1, 2, { hist: 1, req: ['tn_masts'], year: 1916, fams: SIG, desc: 'Cassine’s exchange runs on the telegraph. So does its working class. Every night at ten, the mill-hands of Cassine hear what their employers earned that day.', fx: [['subvert', 'Cassine', 14], ['op', 'Cassine', -20], on('Cassine', (G, n, t) => ID.addMod(t, 'conf', -6, 24, 'The Tessalian broadcast')), ['note', 'Cassine’s business confidence −6 for two years'], ['sig', 6]] }),
    P('tn_comintern', 'The Karsovan offer', 0, 3, { req: ['tn_cassine'], excl: ['tn_denounce'], year: 1920, can: (n, G) => (by(G, 'Karsova') ? '' : 'Karsova no longer exists.'), desc: 'Karsova offers grain, rifles and a seat on its committee, if the broadcast follows its line. The grain is real. So is the line.', fx: [['ally', 'Karsova'], ['op', 'Karsova', 30], ['gold', 150], ['drift', 'ml', 20], ['sig', -10]] }),
    P('tn_denounce', 'Denounce the Thermidor', 2, 3, { hist: 1, req: ['tn_cassine'], excl: ['tn_comintern'], year: 1920, fams: SIG, desc: 'Karsova’s party is a bureaucracy with a red flag. The broadcast says so, in Karsovan, every night, and the Karsovan workers listen under their blankets.', fx: [['op', 'Karsova', -35], ['subvert', 'Karsova', 12], ['fervor', 12], ['sig', 10]] }),
    P('tn_intl', 'The Network International', 1, 4, { hist: 1, reqAny: ['tn_comintern', 'tn_denounce'], year: 1925, fams: SIG, desc: 'Sections in forty countries, one wavelength, no headquarters. Nobody can arrest a frequency.', fx: [['fn', (G, n) => { for (const o of ID.alive(G)) if (o !== n && (fam(o) === 'socialist' || fam(o) === 'anarchist')) ID.addOpBoth(G, n.id, o.id, 12); }], ['note', 'Socialist and anarchist states think better of you'], ['subvertNb', 8], ['sig', 10]] }),
    P('tn_vess', 'The northern relay', 2, 4, { req: ['tn_denounce'], year: 1925, can: (n, G) => (by(G, 'Vess') ? '' : 'Vess no longer exists.'), desc: 'The mutineers of Vess hold the only free harbour in the north, and a cruiser with the most powerful radio room on the northern sea.', fx: [['ally', 'Vess'], ['op', 'Vess', 25], ['subvert', 'Norvik', 8], ['sig', 6]] }),

    /* ---- the machines */
    P('tn_hydro', 'White coal', 3.5, 0, { hist: 1, desc: 'Every torrent in the passes turned into kilowatts, owned by the cantons that hold the water and sold by the network to anyone who will run a factory on it.', fx: [['build', FACT, 2], ['mod', 'prod', 0.05, PERM, 'White coal']] }),
    P('tn_watch', 'The watchmakers’ precision', 3.5, 1, { hist: 1, req: ['tn_hydro'], desc: 'Ten thousand watchmakers retooled to make relays, valves and calculating gears. Nobody in the world builds small things better.', fx: [['mod', 'sci', 0.08, PERM, 'Watchmakers’ precision'], ['mod', 'eff', 0.03, PERM, 'Watchmakers’ precision'], ['tech', 150]] }),
    P('tn_accel', 'Production first: accelerate', 3, 2, { hist: 1, req: ['tn_watch'], excl: ['tn_free'], desc: 'The machines must outrun the old world before they free anyone. Three shifts in every valley until the curve bends upward, and then faster.', fx: [['mod', 'prod', 0.06, PERM, 'Acceleration'], ['sig', 8], ['mod', 'ls', -2, 60, 'Three shifts'], ['sup', 'workers', -4]] }),
    P('tn_free', 'Freedom first: the fifteen-hour week', 4, 2, { req: ['tn_watch'], excl: ['tn_accel'], desc: 'What is the machine for, if not to give us our lives back? Every gain in productivity becomes free time. The broadcast will have to wait for the weekend.', fx: [['mod', 'ls', 3, PERM, 'The fifteen-hour week'], ['particip', 8], ['mod', 'stab', 3, PERM, 'The fifteen-hour week'], ['mod', 'prod', -0.02, PERM, 'Fewer hours'], ['sig', -4]] }),
    P('tn_labs', 'The Jura laboratories', 3, 3, { hist: 1, reqAny: ['tn_accel', 'tn_free'], year: 1930, desc: 'Every lab in the federation answerable to the network, and every result published to it the same day.', fx: [['techUp', 'ind'], ['mod', 'sci', 0.1, PERM, 'The Jura laboratories']] }),
    P('tn_automated', 'The automated cantons', 4, 3, { req: ['tn_free'], year: 1938, desc: 'Looms that run themselves, dairies that milk themselves, a post office that sorts itself. The valleys have never been so rich or so idle.', fx: [['mod', 'ls', 2, PERM, 'The automated cantons'], ['mod', 'prod', 0.05, PERM, 'The automated cantons'], ['sup', 'workers', 8]] }),
    P('tn_engine', 'The engine under the mountain', 3, 4, { hist: 1, req: ['tn_labs'], year: 1944, desc: 'A calculating engine of forty thousand valves in a cavern under the Grimsel, built to plan the whole federation and answer any question a canton sends it by wire.', fx: [['tech', 400], ['mod', 'eff', 0.05, PERM, 'The engine'], ['sig', 10]] }),
    P('tn_leak', 'Publish the blueprints', 3, 5, { hist: 1, req: ['tn_engine'], excl: ['tn_secret'], desc: 'Every circuit diagram printed and posted to every university in the world, Meridia’s included. Let them all build one; ours came first, and theirs will belong to everyone.', fx: [['opAll', 8], ['sig', 12], ['fn', (G, n) => { for (const o of ID.alive(G)) if (o !== n && fam(o) === 'socialist') o.sci += 150; const m = by(G, 'Meridia'); if (m && m.ideo === 'nrx') m.sig = Math.max(0, m.sig - 10); }], ['note', 'Every socialist state gains research; a corporate Meridia loses its monopoly (acceleration −10)']] }),
    P('tn_secret', 'The engine stays in the mountain', 4, 5, { req: ['tn_engine'], excl: ['tn_leak'], desc: 'The engine is the revolution’s advantage. Nobody else gets the drawings, not even our friends.', fx: [['tech', 300], ['mod', 'sci', 0.08, PERM, 'The secret engine'], ['mod', 'def', 0.05, PERM, 'The secret engine']] }),

    /* ---- the cantons: who decides, and how fast */
    P('tn_charter', 'The Red Canton Charter', 6, 0, { hist: 1, desc: 'Written in the winter of 1909 by watchmakers and telegraphists, with one article no assembly may ever amend: the revolution must never stop moving.', fx: [['sig', 8], ['particip', 6], ['sup', 'workers', 6]] }),
    P('tn_wire', 'The wire decides', 5, 1, { hist: 1, req: ['tn_charter'], excl: ['tn_valleys'], desc: 'One exchange in the capital and every canton a line on its board. Decisions at the speed of a telegram, and nobody in the valleys was asked.', fx: [['nq', 15], ['auth', 15], ['sig', 6], ['particip', -6]] }),
    P('tn_valleys', 'The valleys decide', 7, 1, { req: ['tn_charter'], excl: ['tn_wire'], desc: 'Every decision goes out to the valleys by wire and comes back as a vote. Slower, and nobody can say it is not theirs.', fx: [['nq', -15], ['particip', 10], ['mod', 'stab', 3, PERM, 'The valleys decide'], ['sig', -4]] }),
    P('tn_organs', 'Signal Security', 5, 2, { hist: 1, req: ['tn_wire'], year: 1922, desc: 'Somebody must stop the enemy using our own wires. A bureau under Paul Rüegg reads every telegram in the federation, for the revolution’s sake.', fx: [['mod', 'opp', -0.06, PERM, 'Signal Security'], ['mod', 'coup', -0.2, PERM, 'Signal Security'], ['bureau', 8], ['drift', 'ml', 8], ['figLoy', 'police', 10]] }),
    P('tn_referendum', 'Referendum by telegraph', 7, 2, { req: ['tn_valleys'], year: 1922, desc: 'A voting key in every post office, and the result of a federal referendum by midnight. The fastest democracy in the world, and still slower than the wire.', fx: [['particip', 12], ['legitmod', 4, LONG, 'Referendum by telegraph'], ['mod', 'eff', -0.02, PERM, 'Every law a vote'], ['nq', -8]] }),
    P('tn_purge', 'Purge the organs', 5, 3, { hist: 1, req: ['tn_organs'], excl: ['tn_consolidate'], year: 1928, desc: 'Rüegg’s bureau has begun to read the Network Congress’s own telegrams. It is dissolved overnight, and the revolution starts moving again.', fx: [['figPurge', 'police'], ['sig', 12], ['stab', -6], ['bureau', -8]] }),
    P('tn_consolidate', 'Consolidate the revolution', 6, 3, { req: ['tn_organs'], excl: ['tn_purge'], year: 1928, ideos: ['technosoc', 'trot', 'ml'], desc: 'Rüegg’s memorandum: the revolution has spread far enough and must now be defended. One centre, one line, the transmitters under the organs, the passes closed. The valleys are sealed, and the network turns inward.', fx: [['figHeir', 'police'], ['ideology', 'juche', 'reform'], ['law', 'trade', 'autarky']] }),
    P('tn_councils', 'Councils on the wire', 7, 3, { req: ['tn_referendum'], year: 1930, desc: 'Every workshop a council, every council a node, and the network nothing but the wire between them.', fx: [['particip', 10], ['drift', 'council', 10], ['sup', 'workers', 6], ['sig', 4]] }),

    /* ---- the militia */
    P('tn_militia', 'The red militia of the passes', 8.5, 0, { hist: 1, desc: 'Every worker keeps a rifle and a field telephone. The militia elects its officers by wire.', fx: [['mod', 'def', 0.08, PERM, 'Red militia'], ['troops', 0.06]] }),
    P('tn_lightning', 'Lightning revolution', 8, 1, { hist: 1, req: ['tn_militia'], excl: ['tn_redoubt'], fams: SIG, desc: 'The army is a broadcast with rifles: it arrives before the enemy has finished reading the news.', fx: [['mod', 'speed', 0.08, PERM, 'Lightning revolution'], ['mod', 'atk', 0.05, PERM, 'Lightning revolution']] }),
    P('tn_redoubt', 'The alpine redoubt', 9, 1, { req: ['tn_militia'], excl: ['tn_lightning'], desc: 'Let them come up the valleys. The guns are in the rock, the bridges are mined, and every pass is a wall.', fx: [['build', FORT, 3], ['mod', 'def', 0.08, PERM, 'The redoubt']] }),
    P('tn_brigades', 'The international brigades', 8, 2, { hist: 1, req: ['tn_lightning'], year: 1934, desc: 'Volunteers from every country the signal reaches, trained in the passes and sent wherever a revolution needs rifles.', fx: [['troops', 0.05], ['glory', 6], ['fn', (G, n) => { for (const o of ID.alive(G)) if (o !== n && fam(o) === 'socialist') ID.addOp(G, o.id, n.id, 6); }], ['note', 'Socialist states think better of you'], ['sig', 4]] }),
    P('tn_arsenals', 'The mountain arsenals', 9, 2, { req: ['tn_redoubt'], year: 1932, desc: 'Factories cut into the rock, out of reach of any bomber.', fx: [['equip', 0.08], ['mod', 'def', 0.06, PERM, 'Mountain arsenals']] }),
    P('tn_wirewar', 'War by wire', 8, 3, { req: ['tn_brigades'], year: 1940, desc: 'Every battalion on the network; every attack planned to the minute from a cavern under the Grimsel.', fx: [['mod', 'speed', 0.06, PERM, 'War by wire'], ['mod', 'atk', 0.04, PERM, 'War by wire'], ['sig', 6]] }),

    /* ---- destinies */
    P('tn_d_planet', 'The Planetary Signal', 1, 6, { hist: 1, req: ['tn_intl'], reqAny: ['tn_purge', 'tn_councils', 'tn_wirewar'], year: 1950, ideos: ['technosoc', 'trot'],
      desc: 'The broadcast no longer belongs to Tessaly. Tessaly belongs to the broadcast.',
      dest: { name: 'Planetary Commune of Tessaly', motto: 'Faster than borders.', epithet: 'The Red Signal', leader: 'Chair of the Network, Mira Ostrand', art: 'revolution',
        quote: 'They asked us where our border is. It is wherever the signal reaches tonight.', by: 'Mira Ostrand, Chair of the Network',
        text: 'On the night of the proclamation every receiver from the northern ice to the Old Lands picked up three minutes of silence, and then the same calm voice, in forty languages, reading the same short text. By morning there were strikes in eleven countries.',
        flag: { p: 'sunburst', a: VIOLET, b: INK, e: 'bolt', ef: SNOW } },
      fx: [['sig', 20], ['subvertNb', 12], ['mod', 'sci', 0.15, PERM, 'The Planetary Signal'], ['legitmod', 8, PERM, 'The Planetary Signal']] }),
    P('tn_d_luxury', 'The Automated Commonwealth', 3.5, 6, { req: ['tn_automated'], reqAny: ['tn_leak', 'tn_secret'], year: 1950, ideos: ['technosoc', 'cybernetic', 'demsoc', 'marketsoc', 'council'],
      desc: 'The machines work. The cantons live.',
      dest: { name: 'Automated Commonwealth of Tessaly', motto: 'Work is optional.', epithet: 'The Leisure Republic', leader: 'Chair of the Commons, Hedwig Baer', art: 'industry',
        quote: 'My grandfather worked sixty hours a week to make watches for rich men. My grandson asks me what an hour of work was for.', by: 'Hedwig Baer, Chair of the Commons',
        text: 'The factories in the valleys hum all night with no one in them. The town squares are full by ten in the morning. Visitors from both continents come to see how it works, and stay for the concerts.',
        flag: { p: 'hband', a: VIOLET, b: SNOW, e: 'cog', ef: VIOLET } },
      fx: [['mod', 'ls', 4, PERM, 'Automated abundance'], ['mod', 'prod', 0.08, PERM, 'Automated abundance'], ['particip', 10], ['legitmod', 8, PERM, 'The Automated Commonwealth']] }),
    P('tn_d_fortress', 'The Alpine Fortress', 5.5, 6, { req: ['tn_consolidate'], reqAny: ['tn_redoubt', 'tn_arsenals', 'tn_organs'], year: 1935, ideos: ['juche', 'ml'],
      desc: 'The network turned inward. The valleys sealed. The man who reads every telegram now writes them.',
      dest: { name: 'Fortress Republic of the Alps', motto: 'The mountains need no one.', epithet: 'The Sealed Valleys', leader: 'Great Leader Paul Rüegg', art: 'mountain',
        quote: 'We broadcast to the world for twenty years. The world did not answer. Now we will listen only to ourselves.', by: 'Paul Rüegg, Great Leader',
        text: 'The transmitters on the peaks still work. They are pointed inward now, and play the Great Leader’s speeches to the valleys from six in the morning. Nobody has crossed a pass without a permit in eleven years.',
        flag: { p: 'border', a: '#5a0d1a', b: SNOW, e: 'ringstar', ef: '#5a0d1a' } },
      fx: [['mod', 'def', 0.12, PERM, 'The Alpine Fortress'], ['sig', 15], ['charisma', 15], ['legitmod', 8, PERM, 'The Alpine Fortress']] }),
    P('tn_d_federation', 'The Federation of Free Signals', 7.5, 6, { req: ['tn_councils'], year: 1945, ideos: ['technosoc', 'council', 'ansyn', 'ancom'],
      desc: 'Every canton a commune, every commune a node, and nobody at the centre because there is no centre.',
      dest: { name: 'Free Signal Federation of the Cantons', motto: 'Every valley a voice.', epithet: 'The Federated Wire', leader: 'Rotating Delegate of the Grimsel Node, Paul Moser', art: 'commune',
        quote: 'You cannot decapitate a network. We have tried, to see.', by: 'Paul Moser, delegate of the Grimsel node for this month',
        text: 'There is no capital any more, only a hundred and forty switching stations, each run by the valley around it. Every decision crosses the whole federation in an evening and comes back as a vote by morning.',
        flag: { p: 'cross', a: VIOLET, b: SNOW, e: 'node', ef: VIOLET } },
      fx: [['particip', 15], ['mod', 'def', 0.12, PERM, 'No centre to strike'], ['mod', 'eff', 0.05, PERM, 'The federated wire'], ['sig', 10]] }),
  ];

  /* ================================================================ MERIDIA */
  const meridia = [
    /* ---- the company */
    P('mx_receiver', 'The Receivership Charter', 1, 0, { hist: 1, desc: 'The bondholders’ committee becomes the Board, the ministries become divisions, and the country becomes a company with one product: growth.', fx: [['sig', 8], ['auth', 10], ['sup', 'capital', 8]] }),
    P('mx_shares', 'Citizenship as shares', 0, 1, { hist: 1, req: ['mx_receiver'], excl: ['mx_exit'], desc: 'Every resident receives a share; every share is a vote; more shares, more votes. Democracy, priced.', fx: [['nq', -10], ['sup', 'capital', 6], ['mod', 'stab', 3, PERM, 'Citizen shareholders'], ['sup', 'workers', -4]] }),
    P('mx_exit', 'The right of exit', 2, 1, { req: ['mx_receiver'], excl: ['mx_shares'], desc: 'No vote, no voice, no complaints: anyone may leave, and the Board must compete to keep them. The first charter cities apply for their licences the same week.', fx: [['nq', 15], ['mod', 'unrest', -3, PERM, 'The right of exit'], ['pop', -0.02]] }),
    P('mx_cathedral', 'Dismantle the Cathedral', 0, 2, { hist: 1, reqAny: ['mx_shares', 'mx_exit'], excl: ['mx_buyuni'], year: 1918, desc: 'The old universities and the respectable newspapers of the defaulted republic still believe they govern by deciding what may be said. Their charters are revoked and their endowments sold.', fx: [['sup', 'intelligentsia', -10], ['law', 'press', 'regulated'], ['mod', 'coup', -0.2, PERM, 'Nobody left to set the agenda'], ['sig', 8]] }),
    P('mx_buyuni', 'Buy the Cathedral', 2, 2, { reqAny: ['mx_shares', 'mx_exit'], excl: ['mx_cathedral'], year: 1918, desc: 'Why abolish the professors when you can employ them? Every university becomes a subsidiary of the Polytechnic.', fx: [['sup', 'intelligentsia', 8], ['mod', 'sci', 0.06, PERM, 'Corporate universities'], ['gold', -100]] }),
    P('mx_formalism', 'Formalism', 0, 3, { hist: 1, reqAny: ['mx_cathedral', 'mx_buyuni'], excl: ['mx_founder'], year: 1925, desc: 'Every power in the company written down, priced and assigned to someone. Nobody governs by custom, sentiment or pretending.', fx: [['mod', 'eff', 0.05, PERM, 'Formalism'], ['corr', -10], ['mod', 'stab', 2, PERM, 'Formalism']] }),
    P('mx_founder', 'The founder’s golden share', 2, 3, { reqAny: ['mx_cathedral', 'mx_buyuni'], excl: ['mx_formalism'], year: 1925, desc: 'One share outvotes all the others: the Chief Executive’s. The Board keeps its chairs and loses its point.', fx: [['auth', 20], ['mod', 'coup', -0.3, PERM, 'The golden share'], ['figLoy', 'police', 10], ['drift', 'personalist', 10]] }),
    P('mx_charters', 'The first charter cities', 1, 4, { reqAny: ['mx_exit', 'mx_formalism'], year: 1930, desc: 'Three empty bays leased for ninety-nine years to whichever company offers the best law. Residents choose with their feet.', fx: [['nq', 20], ['mod', 'trade', 0.08, PERM, 'Charter cities'], ['gold', 120]] }),
    P('mx_court', 'The executive’s court', 2, 4, { req: ['mx_founder'], year: 1935, desc: 'A palace for the Chief Executive, a guard in the company’s colours and an heir trained at the Polytechnic.', fx: [['auth', 10], ['tradition', 10], ['figHeir', 'economy']] }),

    /* ---- the curve */
    P('mx_grid', 'The southern grid, incorporated', 4, 0, { hist: 1, desc: 'Dams on every river that falls to the sea, one control room, and a tariff on every kilowatt.', fx: [['build', FACT, 2], ['mod', 'prod', 0.05, PERM, 'The southern grid']] }),
    P('mx_poly', 'The Polytechnic, Limited', 3.5, 1, { hist: 1, req: ['mx_grid'], desc: 'The best scientists on two continents, at the best salaries, with stock options.', fx: [['mod', 'sci', 0.12, PERM, 'The Polytechnic'], ['tech', 150]] }),
    P('mx_foundry', 'Self-replicating foundries', 4.5, 1, { req: ['mx_grid'], year: 1922, desc: 'Foundries whose first product is the next foundry. The curve begins to steepen by itself.', fx: [['build', FACT, 2], ['mod', 'prod', 0.04, PERM, 'Self-replicating foundries'], ['sig', 8]] }),
    P('mx_sunstone', 'Project Sunstone', 3.5, 2, { hist: 1, req: ['mx_poly'], year: 1940, desc: 'The atom, split in the southern desert by a division of the company, and listed on the exchange the next morning.', fx: [['techUp', 'mil'], ['build', SILO, 1]] }),
    P('mx_engines', 'The difference engines', 4, 3, { hist: 1, reqAny: ['mx_poly', 'mx_foundry'], year: 1944, desc: 'Calculating machines in every office of the company, then in every decision the offices used to make.', fx: [['tech', 400], ['mod', 'eff', 0.05, PERM, 'The difference engines'], ['sig', 10]] }),
    P('mx_orbit', 'The orbital franchise', 3, 4, { hist: 1, req: ['mx_sunstone'], year: 1955, desc: 'The first company in orbit sells the view, the weather and the radio relays, and leases the rest of the sky to anyone who can pay.', fx: [['tech', 500], ['glory', 10], ['gold', 150]] }),
    P('mx_poach', 'Buy the Tessalian engineers', 4, 5, { hist: 1, req: ['mx_engines'], excl: ['mx_jam'], year: 1947, desc: 'Tessaly’s engineers work for the revolution for a worker’s wage. Meridia offers ten times that, a villa by the sea and no meetings.', fx: [['tech', 400], on('Tessaly', (G, n, t) => { ID.addMod(t, 'sci', -0.06, 60, 'Engineers bought by Meridia'); ID.addOpBoth(G, n.id, t.id, -20); }), ['note', 'Tessaly loses 6% research for five years and is furious']] }),
    P('mx_jam', 'Jam the red signal', 5, 5, { req: ['mx_engines'], excl: ['mx_poach'], year: 1947, desc: 'A wall of noise on every wavelength the Tessalian transmitters use, from a station on every Meridian hill.', fx: [['mod', 'opp', -0.05, PERM, 'The jamming stations'], on('Tessaly', (G, n, t) => { if (t.ideo === 'technosoc') t.sig = Math.max(0, t.sig - 12); ID.addOpBoth(G, n.id, t.id, -15); }), ['note', 'A techno-socialist Tessaly loses 12 velocity']] }),

    /* ---- the markets */
    P('mx_bonds', 'The bond market', 6.5, 0, { hist: 1, desc: 'Meridian paper sells in every exchange on two continents: the only country in the world that is also a share.', fx: [['gold', 150], ['mod', 'trade', 0.05, PERM, 'The bond market']] }),
    P('mx_cassine', 'Listed in Cassine', 6, 1, { hist: 1, req: ['mx_bonds'], excl: ['mx_hesperia'], desc: 'Meridia, Inc. on the Cassine exchange, between the railways and the copper trusts.', fx: [['note2', 'Cassine', 'treaty'], ['op', 'Cassine', 20], ['gold', 120], ['conf', 6]] }),
    P('mx_hesperia', 'Hesperian contracts', 7, 1, { req: ['mx_bonds'], excl: ['mx_cassine'], desc: 'Hesperia’s chambers want guns, turbines and no questions. Meridia sells all three.', fx: [['op', 'Hesperia', 25], ['op', 'Cassine', -15], ['gold', 160], ['mod', 'prod', 0.03, PERM, 'Arms contracts']] }),
    P('mx_copper', 'The copper concession', 6, 2, { hist: 1, reqAny: ['mx_cassine', 'mx_hesperia'], excl: ['mx_officers'], year: 1920, can: (n, G) => (by(G, 'Antara') ? '' : 'Antara no longer exists.'), desc: 'Antara’s government needs money, and Meridia has it, at nine per cent, secured on the copper.', fx: [['gold', 100], ['mod', 'trade', 0.04, PERM, 'Antaran copper'], on('Antara', (G, n, t) => { if (t.nq) t.nq.v = Math.max(0, t.nq.v - 12); ID.addOpBoth(G, n.id, t.id, -10); }), ['note', 'Antara’s copper slips toward the companies']] }),
    P('mx_officers', 'The officers’ account', 7, 2, { reqAny: ['mx_cassine', 'mx_hesperia'], excl: ['mx_copper'], year: 1920, can: (n, G) => (by(G, 'Antara') ? '' : 'Antara no longer exists.'), desc: 'An account at a Meridian bank in the name of a colonel of the Antaran general staff, and another for the opposition press.', fx: [on('Antara', (G, n, t) => { ID.docSeed(G, t, 'junta', 14, 4, n.id); ID.addMod(t, 'coup', 0.4, 36, 'Meridian money'); ID.addOpBoth(G, n.id, t.id, -25); }), ['note', 'Antara’s officers grow bolder: coup risk +40% for three years']] }),
    P('mx_oldlands', 'Engineers for the Old Lands', 6.5, 3, { reqAny: ['mx_copper', 'mx_officers'], year: 1946, desc: 'Dams, refineries and power stations for the Old Lands, built by Meridian firms and paid for in concessions.', fx: [['note2', 'Khemra', 'aid'], ['note2', 'Baskhar', 'aid'], ['gold', 100], ['mod', 'trade', 0.05, PERM, 'Contracts abroad']] }),
    P('mx_lease', 'A bay on a long lease', 6.5, 4, { req: ['mx_oldlands'], year: 1955, desc: 'A ninety-nine-year lease on a bay in the Old Lands, with its own law, its own police and Meridian management.', fx: [['gold', 200], ['mod', 'trade', 0.06, PERM, 'The leased bay'], ['opAll', -4], ['nq', 8]] }),

    /* ---- security */
    P('mx_contracts', 'Security by contract', 8.5, 0, { hist: 1, desc: 'The army is a contractor. It is paid by results, and the results are audited.', fx: [['equip', 0.08], ['mod', 'atk', 0.05, PERM, 'Contract army']] }),
    P('mx_automatic', 'The automatic army', 8.5, 1, { req: ['mx_contracts'], year: 1930, desc: 'Machine-guns that aim themselves, shells that find their range, and fewer young men in the casualty lists.', fx: [['mod', 'aloss', -0.1, PERM, 'The automatic army'], ['tech', 150]] }),
    P('mx_deterrent', 'A deterrent for sale', 8.5, 2, { req: ['mx_automatic'], year: 1950, desc: 'The company keeps a bomb, and lets it be known that the bomb is not for sale. Almost.', fx: [['build', SILO, 1], ['gold', 100]] }),

    /* ---- destinies */
    P('mx_d_singularity', 'The Singularity', 4.5, 6, { hist: 1, req: ['mx_engines'], reqAny: ['mx_formalism', 'mx_poach', 'mx_jam'], year: 1955, ideos: ['nrx', 'technocracy'],
      desc: 'Hand the company to the curve, and let the curve decide what it wants.',
      dest: { name: 'The Meridian Continuum', motto: 'The curve does not bend.', epithet: 'The Runaway Republic', leader: 'THE BOARD', art: 'machine',
        quote: 'We no longer understand the quarterly report. It is the best quarterly report in history.', by: 'Octavio Restrepo, the last human Chief Executive',
        text: 'The machines draft the plans, price the goods, design the next machines and propose the dividend. The Board still meets on Thursdays, to approve. Nobody can remember the last time it did not.',
        flag: { p: 'diag', a: LIME, b: INK, e: 'ffwd', ef: INK } },
      fx: [['sig', 25], ['mod', 'sci', 0.2, PERM, 'The Singularity'], ['mod', 'prod', 0.1, PERM, 'The Singularity'], ['grievance', 10]] }),
    P('mx_d_patchwork', 'The Patchwork', 1, 6, { req: ['mx_charters'], year: 1945, ideos: ['nrx', 'minarchy', 'liberal', 'merchant'],
      desc: 'Break the company into a hundred companies, and let each one compete for every resident.',
      dest: { name: 'Free Cities of the Meridian Patchwork', motto: 'Exit is freedom.', epithet: 'The Patchwork', leader: 'Chair of the Arbitration Board, Inés Quiroga', art: 'crowd',
        quote: 'Every city is a company. Every company is a country. Every country is a door you may walk out of.', by: 'Inés Quiroga, Chair of the Arbitration Board',
        text: 'There are a hundred and twelve sovereign cities on the Meridian coast now, each with its own law, its own currency and its own advertisements on the others’ trams. Moving house is an act of politics. Nobody calls it that.',
        flag: { p: 'stripes', a: LIME, b: SNOW, c: TEAL, e: 'diamond', ef: INK } },
      fx: [['mod', 'trade', 0.12, PERM, 'The Patchwork'], ['mod', 'eff', 0.06, PERM, 'The Patchwork'], ['nq', 20], ['opAll', 8]] }),
    P('mx_d_crown', 'The Crowned Company', 2.5, 6, { req: ['mx_court'], year: 1940, ideos: ['nrx', 'personalist', 'absmon'],
      desc: 'A sovereign who owns his country outright has every reason to keep it in good repair.',
      dest: { name: 'Kingdom of Meridia, Incorporated', motto: 'One owner, one will.', epithet: 'The Crowned Company', leader: 'Octavio I, King and Chief Executive', art: 'crown',
        quote: 'A king who owns his kingdom keeps it the way a man keeps his house. The republics rented theirs.', by: 'Octavio I, King and Chief Executive',
        text: 'The coronation was paid for by sponsorship and broadcast with advertisements. The crown is insured. The kingdom has never been so well run, or so quiet.',
        flag: { p: 'canton', a: GOLD, b: INK, c: LIME, e: 'crown', ef: GOLD } },
      fx: [['auth', 20], ['mod', 'coup', -0.4, PERM, 'The crowned company'], ['legitmod', 8, PERM, 'The Crowned Company'], ['tradition', 20]] }),
  ];

  tame(tessaly); exclAll(tessaly); tame(meridia); exclAll(meridia);
  ID.FOCUS.nations.Tessaly = tessaly; ID.FOCUS.nations.Meridia = meridia;
  if (ID.FOCUS.projects) { ID.FOCUS.projects.Tessaly = []; ID.FOCUS.projects.Meridia = []; }

  /* ================================================================ identity */
  const sp = (name, desc, fx) => ({ name, desc, fx });
  ID.IDENTITY.Tessaly = { motto: 'Faster than borders.', anthem: 'The Song of the Masts',
    lore: 'Mountain cantons that federated to keep the empires out, and were taken from within in the winter of 1909 by their own watchmakers, telegraphists and dam-builders. The Red Canton Charter has one article no assembly may amend: the revolution must never stop moving. A transmitter stands on every peak, and on clear nights the mountains of Tessaly can be heard in three countries.',
    spirits: [sp('The Tallest Aerials in the West', 'Every summit carries a transmitter, and the broadcast reaches further from Tessaly than from anywhere else.', [['mod', 'sci', 0.05, 900, 'The Tallest Aerials']]),
      sp('Watchmakers’ Hands', 'Ten thousand precision workers who can build anything small.', [['mod', 'eff', 0.04, 900, 'Watchmakers’ Hands']])] };
  ID.IDENTITY.Meridia = { motto: 'Exit is freedom.', anthem: 'Hymn to the Southern Grid',
    lore: 'A southern republic whose parliament defaulted on its bridges in 1906. The bondholders foreclosed on the country, took the treasury, the railways and the ministries as collateral, and never gave them back. Meridia is a sovereign corporation: its residents hold shares, its Board answers to one question every quarter, whether the curve is rising, and anyone who dislikes it may leave. It has the best laboratories on two continents and almost no politicians.',
    spirits: [sp('The Receivership', 'The bondholders own the state and run it like a company.', [['mod', 'eff', 0.05, 900, 'The Receivership']]),
      sp('The Polytechnic', 'The best scientists on two continents, at the best salaries.', [['mod', 'sci', 0.08, 900, 'The Polytechnic']])] };

  /* ================================================================ the starting setup */
  for (const [base, ideo, sit, blurb] of [
    ['Tessaly', 'technosoc', 'middling', 'The watchmakers and telegraphists took the cantons in 1909 and put a transmitter on every peak. The revolution must reach the next valley before the last one grows bored.'],
    ['Meridia', 'nrx', 'rich', 'Its bondholders foreclosed on the republic in 1906 and never gave it back. A sovereign corporation with the best laboratories on two continents, a Board that answers to its shareholders, and a door marked Exit.'],
  ]) { const s = scen(base); if (s) { s.ideo = ideo; s.sit = sit; s.blurb = blurb; } }

  /* ================================================================ national questions and inner circles */
  const N = ID.NATIONAL;
  N.Tessaly = {
    ideo: 'technosoc', leader: ['Anselm Gerber', 49, ['visionary', 'orator'], 'Chairman of the Network'],
    cast: [['aske', 'army', 'General Corin Aske', 'trot', 2, 60, 70, 44], ['ruegg', 'police', 'Paul Rüegg', 'juche', 3, 55, 78, 50],
      ['baer', 'economy', 'Hedwig Baer', 'cybernetic', 3, 70, 45, 41], ['ostrand', 'ideology', 'Mira Ostrand', 'technosoc', 3, 80, 55, 33], ['favre', 'foreign', 'Henri Favre', 'socdem', 2, 50, 40, 62]],
    names: [['Konrad', 'Ulrich', 'Mira', 'Henri', 'Walter', 'Hedwig', 'Louis', 'Jakob'], ['Imhof', 'Gerber', 'Moser', 'Rochat', 'Brunner', 'Keller', 'Vuilleumier', 'Zbinden']],
    q: { name: 'The Wire and the Valleys', low: 'The valleys decide', high: 'The wire decides', init: 55,
      desc: 'The revolution moves at the speed of the telegraph; the cantons move at the speed of a mountain referendum. Centralise and the network flies while the valleys grumble that nobody asked them. Devolve and the revolution belongs to everyone, and goes nowhere fast. The wire feeds velocity; the valleys drain it.',
      drift: (n) => (n.ideo === 'technosoc' ? ((n.sig || 50) > 70 ? 0.3 : (n.sig || 50) < 35 ? -0.3 : 0.05) : -0.2),
      fx: (n, v) => ({ sci: (v - 50) * 0.0016, eff: (v - 50) * 0.001, stab: (50 - v) * 0.05, def: (50 - v) * 0.002, unrest: v > 75 ? (v - 75) * 0.12 : 0 }),
      tick: (n, G, v) => { if (n.ideo === 'technosoc' && n.sig != null) n.sig = Math.max(0, Math.min(100, n.sig + (v - 50) * 0.012)); },
      acts: [
        { id: 'tn_q_mast', name: 'Another mast on another peak', desc: 'A new transmitter, and a new valley whose every decision now goes through the capital’s exchange.', cost: { gold: 60 }, cd: 12, dv: 8, fx: [['sig', 5]] },
        { id: 'tn_q_vote', name: 'Put it to the valleys', desc: 'A federal referendum by telegraph on the network’s next step. It will pass, slowly.', cost: { auth: 8 }, cd: 18, dv: -12, fx: [['particip', 6], ['mod', 'unrest', -3, 12, 'A vote in every valley']] },
        { id: 'tn_q_decree', name: 'Decree by wire', desc: 'The Network Congress decides overnight and the valleys read it in the morning.', cd: 12, dv: 10, fx: [['auth', 10], ['grievance', 4]] },
      ],
      hi: 'nq_tn_hi', hiAt: 88, lo: 'nq_tn_lo', loAt: 12 },
  };
  nat({ id: 'nq_tn_hi', title: 'The mountain league', text: 'Seven farming cantons have voted to leave a federation that decides everything by telegram. They have their own militia, their own priests and a flag older than the revolution, and they have cut the wires to the capital.',
    opts: [
      { label: 'Give the valleys their say', fx: [['nq', -25], ['sig', -10], ['particip', 10]] },
      { label: 'Broadcast into the valleys', tip: 'Talk them round, night after night. It may work; it will certainly annoy them.', fx: [['nq', -8], ['sig', 6], ['grievance', 10], ['mod', 'unrest', 4, 24, 'The mountain league']] },
      { label: 'Let it come to a fight', tip: 'The league will fight for its valleys: a civil war of the villages against the wire.', fx: [['nq', -20], ['civilwar', 'agrarian', 0.18]] },
    ] });
  nat({ id: 'nq_tn_lo', title: 'The valleys vote to slow down', text: 'A federal referendum, called by forty thousand signatures, asks whether the broadcast should be suspended for a year “to let the country catch its breath”. The count is tomorrow. It is going to pass.',
    opts: [
      { label: 'Respect the vote', fx: [['sig', -20], ['particip', 10], ['legitmod', 5, 24, 'The people’s pause']] },
      { label: 'Postpone the count', tip: 'The wire decides, after all.', fx: [['nq', 20], ['particip', -10], ['grievance', 10], ['sig', 5]] },
    ] });

  N.Meridia = {
    ideo: 'nrx', leader: ['Octavio Restrepo', 55, ['economist', 'visionary'], 'Chief Executive'],
    cast: [['arce', 'army', 'General Julio Arce', 'junta', 2, 55, 70, 53], ['montalvo', 'police', 'Clara Montalvo', 'personalist', 2, 70, 60, 44],
      ['ibarra', 'economy', 'Tomás Ibarra', 'nrx', 3, 64, 72, 36], ['saldivar', 'ideology', 'Elena Saldívar', 'technocracy', 3, 74, 50, 46], ['echeverri', 'foreign', 'Luis Echeverri', 'liberal', 2, 62, 45, 51]],
    names: [['Julio', 'Tomás', 'Luis', 'Elena', 'Andrés', 'Rafael', 'Inés', 'Mateo'], ['Arce', 'Ibarra', 'Saldívar', 'Echeverri', 'Montalvo', 'Quiroga', 'Ospina', 'Vargas']],
    q: { name: 'The Patchwork', low: 'One company', high: 'A hundred charter cities', init: 35,
      desc: 'Is Meridia one sovereign corporation, or a federation of competing city-companies? One company is strong, obedient and slow. A patchwork trades, experiments and accelerates, until the cities start asking why they need the Board at all.',
      drift: (n) => (n.ideo === 'nrx' && (n.sig || 50) > 70 ? 0.2 : 0) - (n.nwars ? 0.3 : 0),
      fx: (n, v) => ({ trade: (v - 50) * 0.003, eff: (v - 50) * 0.0012, def: (50 - v) * 0.003, unrest: v > 75 ? (v - 75) * 0.1 : 0, coup: v < 25 ? (25 - v) * 0.01 : 0 }),
      tick: (n, G, v) => { if (n.ideo === 'nrx' && n.sig != null) n.sig = Math.max(0, Math.min(100, n.sig + (v - 45) * 0.008)); },
      acts: [
        { id: 'mx_q_charter', name: 'Charter a new city', desc: 'An empty bay leased for ninety-nine years to the company with the best law.', cd: 18, dv: 10, fx: [['gold', 100], ['mod', 'trade', 0.03, 24, 'A new charter city']] },
        { id: 'mx_q_takeover', name: 'A hostile takeover', desc: 'The Board buys out a charter city that has grown too independent.', cost: { gold: 80 }, cd: 18, dv: -12, fx: [['auth', 10], ['sup', 'capital', -4]] },
        { id: 'mx_q_dividend', name: 'Pay a special dividend', desc: 'Every shareholder receives a cheque. Every shareholder remembers who signed it.', cost: { gold: 80 }, cd: 24, dv: 0, fx: [['sup', 'capital', 8], ['mod', 'stab', 3, 24, 'The dividend']] },
      ],
      hi: 'nq_mx_hi', hiAt: 88, lo: 'nq_mx_lo', loAt: 10 },
  };
  nat({ id: 'nq_mx_hi', title: 'The charter cities want out', text: 'The eleven richest charter cities have hired their own lawyers, their own security firms and a public relations agency. Their joint statement says they no longer see what the Board adds, apart from the Board’s fee.',
    opts: [
      { label: 'Buy them back', fx: [['gold', -200], ['nq', -25]] },
      { label: 'Let them go', tip: 'The free cities will fight to keep their freedom: a war of the patchwork against the company.', fx: [['nq', -20], ['civilwar', 'minarchy', 0.15]] },
      { label: 'Lower the fee', fx: [['nq', -10], ['mod', 'rev', -0.06, 36, 'A lower fee'], ['sig', 6]] },
    ] });
  nat({ id: 'nq_mx_lo', title: 'The monopoly stagnates', text: 'One company, one Board, one plan for the whole coast, and the curve has gone flat. The analysts use the word nobody in Meridia is supposed to use: bureaucracy.',
    opts: [
      { label: 'Break it up', fx: [['nq', 20], ['sig', 10], ['sup', 'capital', -4]] },
      { label: 'The founder takes control', fx: [['drift', 'personalist', 20], ['auth', 20], ['sig', 4]] },
    ] });

  /* ================================================================ the storyline */
  for (let k = ID.STORY.length - 1; k >= 0; k--) if (ID.STORY[k].id === 'st_te_strike' || ID.STORY[k].id === 'st_me_election') ID.STORY.splice(k, 1);
  const tsOk = (G) => { const n = by(G, 'Tessaly'); return !!(n && !n.civilOf && n.ideo === 'technosoc'); };
  const nxOk = (G) => { const n = by(G, 'Meridia'); return !!(n && !n.civilOf && n.ideo === 'nrx'); };

  beat({ id: 'st_tn_cassine', date: [1912, 4], nation: 'Tessaly', cond: (G) => tsOk(G) && !!by(G, 'Cassine') });
  story({ id: 'st_tn_cassine', title: 'The broadcast reaches the sea', text: 'For the first time the transmitters on the Grimsel reach the Cassine coast. Every night at ten a calm voice tells the mill-hands of Cassine what their employers earned that day. The Cassine ambassador has delivered a note: the broadcast stops, or Cassine will treat it as an act of war.',
    opts: [
      { label: 'The signal does not stop', hist: 1, sf: 'tn_loud', tip: 'Velocity and a growing movement in Cassine, and a dangerous neighbour.', fx: [['sig', 8], ['subvert', 'Cassine', 10], ['op', 'Cassine', -20]] },
      { label: 'A wavelength treaty', sf: 'tn_quiet', tip: 'Peace with the bankers, at the price of the revolution’s momentum.', fx: [['op', 'Cassine', 15], ['gold', 80], ['sig', -12]] },
    ] });
  beat({ id: 'st_tn_verano', date: [1917, 6], nation: 'Tessaly', cond: (G) => { const v = by(G, 'Verano'); return tsOk(G) && !!v && ID.ideo(v).family === 'anarchist'; } });
  story({ id: 'st_tn_verano', title: 'The syndicates come over the passes', text: 'Delegates of the Veranese unions have walked over the passes in the snow. They propose One Federation of the Southwest: their general strike and our transmitters. They also propose that every decision be debated in every union hall first, which by our calculations would take about a year per decision.',
    opts: [
      { label: 'One federation', hist: 1, sf: 'tn_vfed', fx: [['ally', 'Verano'], ['op', 'Verano', 25], ['sig', 6], ['nq', -6]] },
      { label: 'The network does not wait for meetings', sf: 'tn_vsplit', tip: 'Our broadcast will reach their members anyway.', fx: [['subvert', 'Verano', 15], ['op', 'Verano', -20], ['sig', 8]] },
    ] });
  beat({ id: 'st_tn_memo', date: [1928, 3], nation: 'Tessaly', cond: (G) => tsOk(G) && !!fig(by(G, 'Tessaly'), 'ruegg') });
  story({ id: 'st_tn_memo', title: 'Rüegg’s memorandum', text: (n) => nm(n, 'ruegg', 'The head of Signal Security') + ' has sent the Network Congress a memorandum of forty pages. Its conclusion is one sentence: the revolution has spread far enough and must now be defended, by one centre, one line, and the transmitters under his bureau. Half the Congress has already signed it.',
    opts: [
      { label: 'Purge the organs', hist: 1, tip: 'The revolution keeps moving. Signal Security does not survive the night.', fx: [['figPurge', 'police'], ['sig', 12], ['stab', -6]] },
      { label: 'Sign the memorandum', tip: 'Thermidor in the mountains: Rüegg becomes the heir, the passes close, and the regime slides toward Juche.', fx: [['figHeir', 'police'], ['discipline', 10], ['drift', 'juche', 30], ['sig', -15]] },
    ] });
  beat({ id: 'st_tn_race', date: [1947, 4], nation: 'Tessaly', cond: (G) => tsOk(G) && !!by(G, 'Meridia') });
  story({ id: 'st_tn_race', title: 'The race for the thinking machine', text: 'Meridia’s laboratories have built a calculating engine for the Board, and the Board means to sell its answers. Ours is half finished in the cavern under the Grimsel. The engineers ask the Network Congress the question that has divided the revolution since the first mast went up: do we race them, or do we give it away?',
    opts: [
      { label: 'Give it to the world', hist: 1, tip: 'Every circuit diagram published. Socialist states everywhere gain research, and Meridia’s monopoly cracks.', fx: [['sig', 12], ['opAll', 6], ['fn', (G, n) => { for (const o of ID.alive(G)) if (o !== n && fam(o) === 'socialist') o.sci += 120; const m = by(G, 'Meridia'); if (m && m.ideo === 'nrx') m.sig = Math.max(0, m.sig - 10); }], ['note', 'Meridia’s acceleration −10']] },
      { label: 'Race them in secret', fx: [['tech', 400], ['mod', 'sci', 0.06, 120, 'The race'], ['op', 'Meridia', -10]] },
    ] });

  beat({ id: 'st_mx_vote', date: [1919, 5], nation: 'Meridia', cond: nxOk });
  story({ id: 'st_mx_vote', title: 'The residents’ petition', text: 'Forty thousand residents have signed a petition asking for something the Receivership Charter does not contain: a vote. The Board’s lawyers point out that the Charter does contain a door.',
    opts: [
      { label: 'Show them the door', hist: 1, sf: 'mx_door', tip: 'The malcontents leave. The curve does not care.', fx: [['pop', -0.015], ['sig', 8], ['mod', 'unrest', -3, 24, 'The malcontents left'], ['nq', 6]] },
      { label: 'Sell them a share', fx: [['nq', -10], ['sup', 'workers', 6], ['mod', 'stab', 3, 60, 'A share each'], ['sig', -4]] },
      { label: 'Grant a parliament', tip: 'An elected chamber with real powers. The shareholders will sell.', fx: [['drift', 'liberal', 25], ['sig', -15], ['particip', 12]] },
    ] });
  beat({ id: 'st_mx_antara', date: [1931, 9], nation: 'Meridia', cond: (G) => { const a = by(G, 'Antara'); return nxOk(G) && !!a && (fam(a) === 'socialist' || fam(a) === 'liberal'); } });
  story({ id: 'st_mx_antara', title: 'Antara takes the copper', text: 'Antara’s congress has voted to nationalise the copper mines, including the four that belong to Meridian shareholders. The compensation offered is a sum the Board’s accountants describe as an insult with decimals. General Arce mentions, unprompted, that he went to staff college with half the Antaran general staff.',
    opts: [
      { label: 'Sue them in every court', hist: 1, fx: [['op', 'Antara', -15], on('Antara', (G, n, t) => ID.addMod(t, 'trade', -0.06, 36, 'Meridian lawsuits')), ['gold', 60]] },
      { label: 'Pay the colonels', sf: 'mx_colonels', tip: 'Money for the Antaran officers and the opposition press. A coup becomes likely.', fx: [on('Antara', (G, n, t) => { ID.docSeed(G, t, 'junta', 20, 5, n.id); ID.addMod(t, 'coup', 0.5, 36, 'Meridian money'); }), ['op', 'Antara', -30], ['sig', 8]] },
      { label: 'Write it off', fx: [['sig', -10], ['op', 'Antara', 10]] },
    ] });
  beat({ id: 'st_mx_race', date: [1947, 4], nation: 'Meridia', cond: (G) => nxOk(G) && !!by(G, 'Tessaly') });
  story({ id: 'st_mx_race', title: 'The red engine', text: 'Our agents report that Tessaly is building a calculating engine of its own, under a mountain, and intends to give the drawings away. If it does, the most valuable thing the company owns will be worth nothing by midwinter.',
    opts: [
      { label: 'Buy their engineers', hist: 1, tip: 'Ten times their wage and a villa by the sea.', fx: [['tech', 300], on('Tessaly', (G, n, t) => { ID.addMod(t, 'sci', -0.05, 60, 'Engineers bought by Meridia'); ID.addOpBoth(G, n.id, t.id, -15); })] },
      { label: 'Patent everything first', fx: [['gold', 200], ['sig', 8], ['op', 'Tessaly', -10]] },
      { label: 'Jam their signal', fx: [on('Tessaly', (G, n, t) => { if (t.ideo === 'technosoc') t.sig = Math.max(0, t.sig - 12); }), ['mod', 'opp', -0.05, 120, 'Jamming stations']] },
    ] });
  beat({ id: 'st_mx_crash', date: [1953, 10], nation: 'Meridia', cond: nxOk });
  story({ id: 'st_mx_crash', title: 'Black Thursday on the Meridian exchange', text: 'The curve broke at eleven in the morning. By noon a third of the company’s value had gone; by evening the charter cities were printing their own money. The Board meets at midnight with three proposals and no coffee.',
    opts: [
      { label: 'Let it burn through', hist: 1, tip: 'The weak firms die, the strong get stronger, and the workers pay for both.', fx: [['mod', 'prod', -0.1, 24, 'The crash'], ['sig', 10], ['sup', 'workers', -8]] },
      { label: 'Bail out the shareholders', fx: [['gold', -200], ['sig', -5], ['sup', 'capital', 8]] },
      { label: 'Hand the company to the engineers', tip: 'Elena Saldívar’s directorate of experts takes over.', fx: [['ideology', 'technocracy', 'coup']] },
    ] });

  /* ================================================================ neighbours that knew the old Tessaly */
  const patch = (base, id, fn) => { const f = (ID.FOCUS.nations[base] || []).concat((ID.FOCUS.projects || {})[base] || []).find((x) => x.id === id); if (f) fn(f); };
  patch('Cassine', 'ca_league', (f) => { f.fx = f.fx.map((x) => (x[0] === 'ally' && x[1] === 'Tessaly' ? ['ally', 'Norvik'] : x)); f.fx.push(['op', 'Tessaly', -15]); });
  patch('Cassine', 'ca_f_lend', (f) => { f.fx = f.fx.map((x) => (x[0] === 'note2' && x[1] === 'Tessaly' ? ['note2', 'Kelda', 'aid'] : x)); });
  patch('Verano', 've_front', (f) => { f.desc = 'Every enemy of the generals under one banner, and the Tessalian transmitters to carry it.'; });

})();
