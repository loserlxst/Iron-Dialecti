/* IRON DIALECTIC — a third shelf of ordinary dispatches, and the dispatches of sovereignty.
   Session 10 found the same random dispatches coming round four and five times a campaign. The engine now
   caps repeats and spaces them (sim/events.js); this file widens the pool so the cap does not leave the
   page empty. Every dispatch here is tied to a circumstance: an ideology, an era, a region, a size, a war
   just lost, a long peace, a slump, a foreign overlord, oil, a union. tone and theme as in data/fortune.js
   and data/variety.js. The sov_* dispatches belong to sim/sovereignty.js (both campaign modes). */
(function () {
  'use strict';
  const ID = (globalThis.ID = globalThis.ID || {});
  const E = ID.EVENT_DEFS, PERM = 600;
  const ev = (o) => E.push(Object.assign({ tone: 'mixed', cd: 120 }, o));
  const I = (n) => ID.ideo(n);
  const is = (n, ...k) => k.indexOf(n.ideo) >= 0;
  const fam = (n, ...f) => f.indexOf(I(n).family) >= 0;
  const model = (n, ...m) => m.indexOf(I(n).econ.model) >= 0;
  const law = (n, c, ...o) => o.indexOf(n.laws[c]) >= 0;
  const b = (v) => (v ? 1 : 0);
  const era = (G) => ID.eraOf(G.tick);
  const share = (G, n) => n.tiles / Math.max(1, G.landCount);
  const oldL = (G, n) => n.region === 'old' || (G.provinces[G.prov[n.capital]] || {}).region === 'old';
  const island = (G, n) => !Object.keys(G.border[n.id] || {}).length;
  const lost = (n) => n.lostWarAt != null && n.age - n.lostWarAt < 36;
  const peaceful = (n) => !n.nwars && (n.lostWarAt == null || n.age - n.lostWarAt > 120) && n.age > 120;
  const oil = (G, n) => (ID.Sov ? ID.Sov.fields(G, n, true) : 0);

  /* ================================================================ sovereignty (sim/sovereignty.js) */
  E.push({ id: 'sov_depose', sys: 1, tone: 'bad', sfx: 'alarm', kicker: 'The overlord',
    title: (n, G, c) => G.nations[c.over].adj + ' tanks at the palace',
    text: (n, G, c) => 'The ' + G.nations[c.over].adj + ' Resident has surrounded the palace with armoured cars and delivered an ultimatum: the government resigns by six o’clock in favour of ministers he will name, or the ruler abdicates. The garrison is his; the crowd outside is ours, for now.',
    opts: [
      { label: 'Yield', tip: 'New ministers chosen abroad. The humiliation will not be forgotten, by the crowd or by the officers.', fx: [['fn', (G, n, c) => { const o = G.nations[c.over]; if (o && o.alive && n.dep) ID.Sov.deposeNow(G, n, o); }], ['dep', 'res', 15]] },
      { label: 'Refuse, and dare them', tip: 'If they shoot, the country rises. If they do not, they lose face. If the army will not stand with us, we lose everything.', fx: [['fn', (G, n, c) => { const o = G.nations[c.over]; if (!o || !o.alive || !n.dep) return; if (G.rng.chance(0.5)) ID.Sov.deposeNow(G, n, o); else { n.dep.res = Math.min(100, n.dep.res + 20); n.legit = Math.min(100, n.legit + 8); } }], ['note', 'Even odds.', null]] },
    ] });
  E.push({ id: 'sov_moment', sys: 1, tone: 'mixed', sfx: 'stamp', kicker: 'The moment',
    title: (n, G, c) => 'The country is ready to rise',
    text: (n, G, c) => 'Resistance to ' + G.nations[c.over].name + ' has reached the point where the garrison stays in its barracks after dark and the Resident’s car is stoned in the street. The leaders of the movement say the moment has come. They may be right; the overlord has an army, and has used it before.',
    opts: [
      { label: 'Rise now', tip: 'A war of independence. The garrison becomes an enemy army.', fx: [['fn', (G, n) => { if (n.dep) ID.Sov.rise(G, n); }]] },
      { label: 'Petition first', tip: 'Ask for a treaty. A refusal will only make the rising stronger.', fx: [['fn', (G, n) => { if (n.dep && !ID.Sov.actBlock(G, n, 'petition')) ID.Sov.act(G, n, 'petition'); }]] },
      { label: 'Not yet', fx: [['dep', 'res', -6]] },
    ] });
  E.push({ id: 'sov_nat', sys: 1, tone: 'bad', sfx: 'alarm', kicker: 'Nationalisation',
    title: (n, G, c) => G.nations[c.from].base + ' takes our oil',
    text: (n, G, c) => 'The government of ' + G.nations[c.from].name + ' has nationalised the concessions worked by our companies: ' + c.fields + ' fields, and the royalties of every one of them. Our shareholders want their property back. Our generals want to know how much force we are prepared to use, and our diplomats how much of the world’s goodwill we are prepared to spend.',
    opts: [
      { label: 'Accept compensation', tip: 'Some money now and a friendlier government later, perhaps. The press will call it a humiliation.', fx: [['fn', (G, n, c) => ID.Sov.answer(G, n, G.nations[c.from], 'accept', c.fields)]] },
      { label: 'An embargo', tip: 'No tanker loads their oil under our flag. A rival bloc may buy it.', fx: [['fn', (G, n, c) => ID.Sov.answer(G, n, G.nations[c.from], 'embargo', c.fields)]] },
      { label: 'Talk to certain colonels', tip: 'A conspiracy with a head start. It costs less than a war and works more often than it should.', fx: [['fn', (G, n, c) => ID.Sov.answer(G, n, G.nations[c.from], 'coup', c.fields)]] },
      { label: 'Send the fleet', tip: 'War, "to restore order". The other great powers may not let it stand.', can: (n, G, c) => !ID.Diplomacy.warBlock(G, n, G.nations[c.from]), fx: [['fn', (G, n, c) => ID.Sov.answer(G, n, G.nations[c.from], 'invade', c.fields)]] },
    ] });
  E.push({ id: 'sov_court', sys: 1, tone: 'good', sfx: 'stamp', kicker: 'Courted',
    title: (n, G, c) => (c.b ? 'Two blocs want to build our dam' : G.nations[c.a].base + ' offers aid'),
    text: (n, G, c) => (c.b ? G.nations[c.a].name + ' and ' + G.nations[c.b].name + ' have each offered to finance our great dam, our steel mill and our air force, and each has made it plain that the other’s offer comes with chains. Neither has yet said what its own chains are.' : G.nations[c.a].name + ' offers credits, engineers and a friendship treaty. Its ambassador says there are no conditions. Its newspapers have been less discreet.'),
    opts: (G, n, c) => {
      const A = G.nations[c.a], B = c.b ? G.nations[c.b] : null, out = [];
      out.push({ label: 'Take ' + A.adj + ' aid', tip: 'Gold and engineers; we lean toward ' + A.base + ', and the other bloc notices.', fx: [['gold', 140], ['fn', (G2, m) => { ID.addOpBoth(G2, m.id, A.id, 15); if (B) ID.addOpBoth(G2, m.id, B.id, -10); }], ['mod', 'prod', 0.03, 60, A.adj + ' engineers']] });
      if (B) out.push({ label: 'Take ' + B.adj + ' aid', tip: 'Gold and engineers; we lean toward ' + B.base + '.', fx: [['gold', 140], ['fn', (G2, m) => { ID.addOpBoth(G2, m.id, B.id, 15); ID.addOpBoth(G2, m.id, A.id, -10); }], ['mod', 'prod', 0.03, 60, B.adj + ' engineers']] });
      out.push({ label: 'Take a little from everyone', tip: 'Positive neutrality: less from each, and nobody owns us.', fx: [['gold', 80], ['fn', (G2, m) => { if (m.sig != null && ID.ideo(m).flags.nonAligned) m.sig = Math.min(100, m.sig + 8); }], ['opAll', 2]] });
      return out;
    } });
  E.push({ id: 'sov_union', sys: 1, tone: 'mixed', sfx: 'stamp', kicker: 'The nation calls',
    title: (n, G, c) => G.nations[c.from].base + ' proposes union',
    text: (n, G, c) => G.nations[c.from].name + ' proposes that our two states become one republic of the nation, with one flag, one army and one president, who would be theirs. The crowds in our capital are already chanting for it. Our officers are asking who will command the army.',
    opts: [
      { label: 'Unite', tip: 'We become a region of the United Republic. If the union’s tension reaches 100, it breaks.', fx: [['fn', (G, n, c) => { const o = G.nations[c.from]; if (o && o.alive) ID.Sov.unite(G, o, n); }]] },
      { label: 'Decline', fx: [['fn', (G, n, c) => { const o = G.nations[c.from]; if (o) ID.addOpBoth(G, n.id, o.id, -15); }], ['legitmod', -3, 24, 'The union refused']] },
    ] });

  /* ================================================================ ordinary dispatches */
  // ---- the post-colonial systems
  ev({ id: 'd_tp_dam_lake', tone: 'mixed', theme: 'works', title: 'The lake drowns the temples', era: 2, w: (n) => (is(n, 'thirdpos', 'pannat') ? 1.4 : 0),
    text: 'The new reservoir is filling. It will irrigate a million acres and light every village on the river; it will also drown a valley of ancient temples and the villages of a hundred thousand people who have lived there since before the pharaohs. Foreign archaeologists offer to move the largest temple, stone by stone, at a price.',
    opts: [{ label: 'Pay to move the temple', fx: [['gold', -90], ['opAll', 6], ['glory', 4]] }, { label: 'Let the water rise', fx: [['mod', 'food', 0.04, 60, 'The new lake'], ['sup', 'peasants', -4]] }] });
  ev({ id: 'd_tp_conference', tone: 'good', theme: 'abroad', title: 'An invitation to the non-aligned', era: 2, w: (n) => (I(n).flags.nonAligned && !n.bloc ? 1.6 : 0),
    text: 'Twenty-nine new states will meet in a tropical capital to declare that they belong to neither bloc. They have asked us to give the opening speech.',
    opts: [{ label: 'Speak for the third world', fx: [['opAll', 5], ['glory', 6], ['charisma', 4]] }, { label: 'Send the foreign minister', fx: [['opAll', 2]] }] });
  ev({ id: 'd_pn_wing', tone: 'bad', theme: 'party', title: 'The other wing’s newspaper', w: (n, G) => (is(n, 'pannat') && ID.alive(G).some((o) => o !== n && o.ideo === 'pannat') ? 1.6 : 0),
    text: 'A newspaper printed in the capital of the other pan-national regime is being smuggled across the border in crates of oranges. It calls our leadership traitors to the nation and its readers are our own party members.',
    opts: [{ label: 'Close the border to oranges', fx: [['mod', 'trade', -0.03, 24, 'The orange war'], ['discipline', 4]] }, { label: 'Answer with our own paper', fx: [['gold', -30], ['sig', 4]] }, { label: 'Purge the readers', fx: [['discipline', 8], ['grievance', 6], ['sup', 'intelligentsia', -6]] }] });
  ev({ id: 'd_pn_anthem', tone: 'good', theme: 'party', title: 'The anthem of the whole nation', w: (n) => (is(n, 'pannat') ? 1 : 0),
    text: 'A schoolteacher has written a song that is being sung in the cafés of four capitals. It names every province of the nation, from the mountains to the sea, including several that belong to other states.',
    opts: [{ label: 'Make it the anthem', fx: [['sig', 8], ['opAll', -2]] }, { label: 'Leave it to the cafés', fx: [['sup', 'intelligentsia', 4]] }] });
  ev({ id: 'd_rv_cassettes', tone: 'mixed', theme: 'faith', title: 'Cassette tapes in the bazaar', era: 3, w: (n) => (fam(n, 'conservative') || is(n, 'revival') ? 0.9 : 0) + b(n.laws.religion === 'secular') * 0.8,
    text: 'Sermons recorded abroad are being copied on cheap cassette recorders and sold in the bazaar for less than a glass of tea. The censors have no idea how many there are. The taxi drivers play them all day.',
    opts: [{ label: 'Confiscate the recorders', fx: [['drift', 'revival', 6], ['grievance', 6]] }, { label: 'Put our own preachers on the radio', fx: [['sup', 'clergy', 4], ['gold', -30]] }] });
  ev({ id: 'd_rv_charity', tone: 'good', theme: 'faith', title: 'The foundations feed the city', w: (n) => (is(n, 'revival', 'theocracy') && n.ls < 50 ? 1.4 : 0),
    text: 'The charitable foundations have opened soup kitchens in every poor district of the capital, staffed by volunteers and paid for by the bazaar. The queues are long and quiet.',
    opts: [{ label: 'Bless their work', fx: [['sup', 'peasants', 4], ['sup', 'workers', 4], ['mod', 'unrest', -3, 24, 'The foundations']] }, { label: 'Put them under the ministry', fx: [['corr', 4], ['sup', 'clergy', -4], ['mod', 'ls', 1, 24, 'State charity']] }] });
  // ---- the rarer systems
  ev({ id: 'd_cy_outage', tone: 'bad', theme: 'works', title: 'The network goes dark', era: 2, w: (n) => (is(n, 'cybernetic') ? 1.6 : 0),
    text: 'A lightning strike on a relay station has cut the planning network for a weekend. The factories that kept paper ledgers carried on; those that trusted the screens stopped. The engineers are arguing about which lesson to draw.',
    opts: [{ label: 'Duplicate every line', fx: [['gold', -80], ['mod', 'eff', 0.02, 60, 'Redundant network']] }, { label: 'Keep the paper ledgers', fx: [['mod', 'eff', -0.02, 24, 'Paper backups'], ['sup', 'bureaucracy', 4]] }] });
  ev({ id: 'd_mn_toll', tone: 'mixed', theme: 'money', title: 'A private road, a private toll', w: (n) => (is(n, 'minarchy') ? 1.6 : 0),
    text: 'The company that owns the coast road has doubled its toll. The fishermen say they cannot get their catch to market; the company says the market will decide. There is, of course, no ministry of roads.',
    opts: [{ label: 'The market decides', fx: [['sup', 'capital', 6], ['sup', 'peasants', -6]] }, { label: 'A citizens’ meeting buys the road', fx: [['gold', -60], ['sup', 'peasants', 6], ['particip', 4]] }] });
  ev({ id: 'd_me_houses', tone: 'mixed', theme: 'money', title: 'Two houses quarrel', w: (n) => (is(n, 'merchant') ? 1.5 : 0),
    text: 'The two oldest trading houses of the republic have fallen out over a cargo of pepper and a marriage. Each controls a third of the council’s votes. Nothing can pass until they make up.',
    opts: [{ label: 'Arrange a marriage', fx: [['gold', -40], ['sup', 'capital', 6]] }, { label: 'Let the council deadlock', fx: [['mod', 'eff', -0.04, 12, 'Deadlocked council']] }, { label: 'Break the stronger house', fx: [['sup', 'capital', -10], ['auth', 10], ['gold', 100]] }] });
  ev({ id: 'd_ac_assembly', tone: 'mixed', theme: 'party', title: 'The assembly that will not end', w: (n) => (is(n, 'ancom', 'council', 'ansyn') ? 1.2 : 0),
    text: 'The district assembly has been debating the allocation of tractors for nineteen days. Seven motions are on the table, three of them about the procedure for debating the other four.',
    opts: [{ label: 'Let it run its course', fx: [['particip', 6], ['mod', 'food', -0.02, 12, 'Idle tractors']] }, { label: 'Propose a time limit', fx: [['particip', -4], ['mod', 'eff', 0.02, 24, 'Shorter meetings']] }] });
  ev({ id: 'd_tr_letter', tone: 'mixed', theme: 'party', title: 'A letter from the old man in exile', w: (n, G) => (is(n, 'trot', 'ml') ? 0.8 : 0),
    text: 'The founder of the other line, expelled long ago and living on an island abroad, has written an open letter to our party congress. It is long, brilliant, and accuses everyone in the hall by name.',
    opts: [{ label: 'Read it aloud to the congress', fx: [['discipline', -6], ['sup', 'intelligentsia', 6], ['drift', 'trot', 4]] }, { label: 'Ban it', fx: [['discipline', 4], ['grievance', 4]] }] });
  ev({ id: 'd_ms_coop', tone: 'good', theme: 'money', title: 'The cooperative wins the contract', w: (n) => (is(n, 'marketsoc', 'socdem', 'demsoc') ? 1.1 : 0),
    text: 'A workers’ cooperative from a provincial town has underbid every private firm for the new bridge. The bankers say it cannot be done for the price; the cooperative says the bankers have never tried paying themselves the same as everyone else.',
    opts: [{ label: 'Give them the bridge', fx: [['mod', 'prod', 0.02, 36, 'Cooperative bridge'], ['sup', 'workers', 4]] }, { label: 'Play it safe', fx: [['sup', 'capital', 4]] }] });
  ev({ id: 'd_te_report', tone: 'mixed', theme: 'works', title: 'The engineers disagree', w: (n) => (is(n, 'technocracy') ? 1.3 : 0),
    text: 'Two directorates have produced contradictory forecasts for the same harvest, each with three hundred pages of tables. The director-general must choose a forecast, or commission a third.',
    opts: [{ label: 'The optimistic tables', fx: [['mod', 'prod', 0.03, 12, 'Optimism'], ['dist', 4]] }, { label: 'Commission a third report', fx: [['gold', -30], ['mod', 'eff', 0.02, 24, 'Better forecasts']] }] });
  ev({ id: 'd_cm_jubilee', tone: 'good', theme: 'crown', title: 'A jubilee in the rain', w: (n) => (is(n, 'conmon') && n.stab > 45 ? 1 : 0),
    text: 'The monarch has reigned twenty-five years. It rained on the procession; a million people stood in it anyway, and the newspapers of the opposition printed the photographs on page one.',
    opts: [{ label: 'A national holiday', fx: [['tradition', 4], ['legitmod', 3, 24, 'The jubilee'], ['mod', 'prod', -0.01, 2, 'Holiday']] }, { label: 'Keep it modest', fx: [['gold', 30]] }] });
  ev({ id: 'd_ju_stamps', tone: 'mixed', theme: 'army', title: 'A general on the stamps', w: (n) => (is(n, 'junta', 'personalist') ? 1 : 0),
    text: 'The post office has issued a set of stamps with the faces of the five members of the junta. The general on the cheapest stamp has taken it personally.',
    opts: [{ label: 'Reissue them in equal values', fx: [['gold', -20], ['figLoy', 'army', 6]] }, { label: 'He will get over it', fx: [['figLoy', 'army', -8]] }] });
  ev({ id: 'd_ag_fair', tone: 'good', theme: 'land', title: 'The great cattle fair', w: (n) => (is(n, 'agrarian') ? 1.2 : 0),
    text: 'Forty thousand head of cattle, a hundred thousand farmers, and a wrestling tournament that nobody is allowed to win twice. The assembly meets in a tent.',
    opts: [{ label: 'Prizes for the best herds', fx: [['gold', -30], ['mod', 'food', 0.04, 24, 'Better herds']] }, { label: 'Let them trade in peace', fx: [['sup', 'peasants', 4]] }] });
  // ---- by era
  ev({ id: 'd_e0_airship', tone: 'good', theme: 'wonder', title: 'An airship over the capital', w: (n, G) => (era(G) === 0 && n.tech.ind >= 1 ? 1 : 0),
    text: 'A silver airship the length of a city block has crossed the capital at roof height, and a hundred thousand people stopped in the street to watch it. Its inventor wants a state contract.',
    opts: [{ label: 'Buy a fleet of them', fx: [['gold', -70], ['glory', 6], ['mod', 'sci', 0.03, 24, 'The airship works']] }, { label: 'Admire it from the ground', fx: [['legitmod', 2, 12, 'The airship']] }] });
  ev({ id: 'd_e0_telephone', tone: 'good', theme: 'works', title: 'The telephone reaches the provinces', w: (n, G) => (era(G) <= 1 ? 0.8 : 0),
    text: 'A copper line now runs from the capital to every provincial town. The governors can be reached in minutes, which some of them regret.',
    opts: [{ label: 'Wire the ministries first', fx: [['mod', 'eff', 0.03, 60, 'The telephone']] }, { label: 'Public call offices in every town', fx: [['sup', 'intelligentsia', 4], ['gold', -30]] }] });
  ev({ id: 'd_e0_emigrants', tone: 'bad', theme: 'people', title: 'The ships to the new world', w: (n, G) => (era(G) <= 1 && n.ls < 45 ? 1.2 : 0),
    text: 'Whole villages are emptying onto ships bound across the ocean. The landlords complain that there is nobody left to bring in the harvest; the emigrants’ letters home say the streets over there are not paved with gold, but they are paved.',
    opts: [{ label: 'Let them go', fx: [['pop', -0.01], ['sup', 'peasants', 2]] }, { label: 'Close the ports to emigrants', fx: [['sup', 'peasants', -6], ['grievance', 4]] }] });
  ev({ id: 'd_e1_radio_set', tone: 'good', theme: 'wonder', title: 'A wireless in every kitchen', era: 1, w: () => 0.8,
    text: 'Cheap wireless sets have reached the working-class districts. Families gather in the evening to listen to dance music, football and, now and then, the government.',
    opts: [{ label: 'A state broadcaster', fx: [['legitmod', 3, 36, 'The broadcaster'], ['gold', -40]] }, { label: 'Let a hundred stations bloom', fx: [['sup', 'capital', 4], ['sup', 'intelligentsia', 4]] }] });
  ev({ id: 'd_e1_cinema', tone: 'mixed', theme: 'culture', title: 'The picture palaces', era: 1, w: () => 0.7,
    text: 'Every town has a cinema now, and the films come from abroad: love stories, gangsters and a way of life the clergy find shocking and the young find wonderful.',
    opts: [{ label: 'Censor the foreign films', fx: [['sup', 'clergy', 4], ['sup', 'intelligentsia', -4]] }, { label: 'Make our own films', fx: [['gold', -50], ['glory', 4], ['mod', 'legit', 2, 36, 'National cinema']] }, { label: 'Let them watch', fx: [['sup', 'workers', 3]] }] });
  ev({ id: 'd_e1_motorcar', tone: 'mixed', theme: 'works', title: 'The motor car and the horse', era: 1, w: (n) => (n.tech.ind >= 2 ? 0.9 : 0),
    text: 'Motor cars now outnumber carriages in the capital, and the horse traders, the farriers and the coachmen want protection from the future.',
    opts: [{ label: 'Build roads for cars', fx: [['gold', -60], ['mod', 'prod', 0.03, 60, 'Motor roads']] }, { label: 'Tax the motorists', fx: [['gold', 50], ['sup', 'capital', -4]] }] });
  ev({ id: 'd_e1_flight', tone: 'good', theme: 'wonder', title: 'Across the ocean in one night', era: 1, cd: 300, w: () => 0.6,
    text: 'One of our pilots has flown across the ocean alone, without sleep, in a monoplane with a wicker seat. A million people met him at the airfield.',
    opts: [{ label: 'A national hero', fx: [['glory', 8], ['legitmod', 3, 24, 'The flight']] }, { label: 'An air ministry', fx: [['gold', -60], ['mod', 'atk', 0.02, 60, 'Air ministry']] }] });
  ev({ id: 'd_e1_marathon', tone: 'good', theme: 'games', title: 'A gold medal in the marathon', era: 1, cd: 300, w: () => 0.6,
    text: 'A shepherd from the mountains, running barefoot, has won the marathon at the international games. The capital has renamed a street after him before he has even come home.',
    opts: [{ label: 'A parade', fx: [['legitmod', 4, 24, 'The marathon'], ['gold', -20]] }, { label: 'A stadium in his village', fx: [['sup', 'peasants', 4], ['gold', -40]] }] });
  ev({ id: 'd_e2_blackout', tone: 'bad', theme: 'war', title: 'The blackout', era: 2, w: (n) => (n.nwars ? 1.4 : 0),
    text: 'Every window in the capital is covered, every street lamp dark. Traffic accidents kill more people than the bombers so far, and the black market in candles is doing very well.',
    opts: [{ label: 'Enforce it strictly', fx: [['mod', 'def', 0.02, 12, 'The blackout'], ['sup', 'workers', -3]] }, { label: 'Relax it in the provinces', fx: [['mod', 'prod', 0.02, 12, 'Lights on'], ['mod', 'def', -0.02, 12, 'Lights on']] }] });
  ev({ id: 'd_e2_women', tone: 'mixed', theme: 'people', title: 'Women in the factories', era: 2, w: (n) => (n.nwars && n.mob > 0.06 ? 1.4 : 0),
    text: 'With the men at the front, women have taken their places on the assembly lines, in the trams and in the ministries. They do the work as well, and they are paid less. Some of them have noticed.',
    opts: [{ label: 'Equal pay for equal work', fx: [['sup', 'workers', 6], ['sup', 'capital', -4], ['mod', 'prod', 0.04, 24, 'Women in industry']] }, { label: 'Thank them, and send them home after', fx: [['mod', 'prod', 0.03, 24, 'Women in industry'], ['sup', 'intelligentsia', -3]] }] });
  ev({ id: 'd_e2_ration', tone: 'bad', theme: 'people', title: 'The ration books', era: 2, w: (n) => (n.nwars && n.foodBal < 1.1 ? 1.4 : 0),
    text: 'Meat once a week, two eggs a month, and a queue for everything. The black market has everything, at five times the price, and the police shop there too.',
    opts: [{ label: 'Shoot a few black marketeers', fx: [['mod', 'unrest', -3, 12, 'Example made'], ['grievance', 6]] }, { label: 'Dig for victory', fx: [['mod', 'food', 0.04, 24, 'Allotments'], ['sup', 'peasants', 2]] }] });
  ev({ id: 'd_e2_evacuees', tone: 'mixed', theme: 'war', title: 'The children leave the cities', era: 2, w: (n) => (n.nwars ? 1 : 0),
    text: 'Trainloads of children with labels round their necks are leaving the cities for farms and villages they have never seen. Some farmers welcome them; some put them to work.',
    opts: [{ label: 'Inspectors for every billet', fx: [['gold', -30], ['sup', 'workers', 4]] }, { label: 'Trust the villages', fx: [['sup', 'peasants', 2]] }] });
  ev({ id: 'd_e3_tv', tone: 'good', theme: 'wonder', title: 'Television', era: 3, w: () => 0.8,
    text: 'The first television sets are on sale, and the shops that sell them have crowds at the window every evening. Whoever owns the transmitter will own the evenings of the whole country.',
    opts: [{ label: 'A state channel', fx: [['legitmod', 4, 60, 'Television'], ['gold', -60]] }, { label: 'Commercial channels', fx: [['sup', 'capital', 6], ['mod', 'conf', 4, 36, 'Advertising']] }] });
  ev({ id: 'd_e3_jets', tone: 'mixed', theme: 'abroad', title: 'The jet age', era: 3, w: (n) => (n.tech.ind >= 6 ? 0.9 : 0),
    text: 'A jet airliner now crosses the ocean in six hours. Tourists, businessmen and foreign ideas arrive on every flight.',
    opts: [{ label: 'Build a new airport', fx: [['gold', -90], ['mod', 'trade', 0.04, 60, 'The new airport']] }, { label: 'Tourist visas for everyone', fx: [['gold', 40], ['sup', 'clergy', -3]] }] });
  ev({ id: 'd_e3_pill', tone: 'mixed', theme: 'culture', title: 'The pill', era: 3, w: (n) => (fam(n, 'liberal', 'socialist') ? 0.8 : 0.3),
    text: 'A pharmaceutical company asks for a licence to sell a contraceptive pill. The doctors say it is safe; the clergy say it is the end of the family; young women say nothing and wait.',
    opts: [{ label: 'License it', fx: [['sup', 'intelligentsia', 6], ['sup', 'clergy', -8], ['mod', 'growth', -0.04, 120, 'The pill']] }, { label: 'Ban it', fx: [['sup', 'clergy', 6], ['sup', 'intelligentsia', -6]] }] });
  ev({ id: 'd_e3_rock', tone: 'mixed', theme: 'culture', title: 'Long hair and electric guitars', era: 3, w: () => 0.8,
    text: 'A band of four young men with long hair and electric guitars has played a stadium of fifty thousand screaming teenagers. The interior ministry wants to know if it is subversive.',
    opts: [{ label: 'Ban the concerts', fx: [['sup', 'intelligentsia', -6], ['tradition', 4]] }, { label: 'Give them a medal', fx: [['sup', 'intelligentsia', 6], ['opAll', 2], ['tradition', -3]] }] });
  ev({ id: 'd_e3_computer', tone: 'good', theme: 'works', title: 'The electronic brain', era: 3, w: (n) => (n.tech.ind >= 5 ? 0.9 : 0),
    text: 'The university has built a computing machine that fills a basement and can do in an hour what the statistics office does in a year. The ministries are queuing to use it.',
    opts: [{ label: 'Buy one for every ministry', fx: [['gold', -100], ['mod', 'eff', 0.04, 120, 'Computers']] }, { label: 'Keep it for the scientists', fx: [['mod', 'sci', 0.06, 60, 'The electronic brain']] }] });
  ev({ id: 'd_e3_satellite', tone: 'mixed', theme: 'wonder', title: 'A beeping star', era: 3, cd: 600, w: (n, G) => (ID.alive(G).some((o) => o.flags.moon || o.tech.mil >= 9) ? 0.7 : 0),
    text: 'A metal sphere is circling the earth every ninety-six minutes, beeping. Everyone with a short-wave radio can hear it. Our generals want to know what else can be put up there, and pointed down.',
    opts: [{ label: 'A space programme of our own', fx: [['gold', -120], ['mod', 'sci', 0.08, 120, 'Space programme'], ['glory', 4]] }, { label: 'Air-raid drills in the schools', fx: [['mod', 'def', 0.02, 60, 'Civil defence'], ['sup', 'workers', -2]] }] });
  // ---- by region and geography
  ev({ id: 'd_old_locusts', tone: 'bad', theme: 'nature', title: 'The locusts', w: (n, G) => (oldL(G, n) ? 1.2 : 0),
    text: 'A swarm the size of a province has come out of the desert and settled on the fields of the south. In a day it has eaten the crop of a year.',
    opts: [{ label: 'Spray from aircraft', can: (n) => n.tech.ind >= 3, fx: [['gold', -60], ['mod', 'food', -0.04, 6, 'The locusts']] }, { label: 'Dig trenches and burn them', fx: [['mod', 'food', -0.1, 8, 'The locusts'], ['sup', 'peasants', -3]] }] });
  ev({ id: 'd_old_pilgrims', tone: 'good', theme: 'faith', title: 'The pilgrim season', w: (n, G) => (oldL(G, n) ? 1 : 0),
    text: 'Half a million pilgrims are passing through on their way to the holy places, buying bread, renting rooms and hiring camels. The railway is full for the first time this year.',
    opts: [{ label: 'Free water on the pilgrim road', fx: [['gold', -30], ['sup', 'clergy', 6], ['opAll', 2]] }, { label: 'A pilgrim tax', fx: [['gold', 80], ['sup', 'clergy', -4]] }] });
  ev({ id: 'd_old_archaeology', tone: 'mixed', theme: 'abroad', title: 'The foreigners’ excavation', w: (n, G) => (oldL(G, n) ? 1 : 0),
    text: 'A foreign expedition has found a king’s tomb, untouched for three thousand years, full of gold. Its permit says that half of what it finds goes home with it.',
    opts: [{ label: 'Every piece stays here', fx: [['glory', 6], ['opAll', -3], ['legitmod', 3, 36, 'The tomb']] }, { label: 'Honour the permit', fx: [['gold', 60], ['opAll', 3]] }] });
  ev({ id: 'd_old_refugee_camps', tone: 'bad', theme: 'people', title: 'The camps become towns', era: 2, w: (n, G) => (oldL(G, n) && ID.alive(G).some((o) => o.key === 'Neshar') ? 1.2 : 0),
    text: 'The refugee camps on our border have stone houses now, schools run by a relief agency, and a generation of children born there who have never seen the villages they are named after. Their fathers have guns.',
    opts: [{ label: 'Give them citizenship', fx: [['pop', 0.01], ['sup', 'peasants', -3], ['opAll', 2]] }, { label: 'Keep them refugees, and their claim alive', fx: [['mod', 'unrest', 3, 60, 'The camps'], ['legitmod', 2, 60, 'The cause']] }, { label: 'Disarm the camps', fx: [['mod', 'unrest', -2, 24, 'Disarmed camps'], ['grievance', 6]] }] });
  ev({ id: 'd_island_ferry', tone: 'mixed', theme: 'sea', title: 'The ferry company strikes', w: (n, G) => (island(G, n) ? 1.2 : 0),
    text: 'The ferry crews have stopped work. Nothing reaches the outer islands, and nothing leaves them: not the post, not the doctor, not the fish.',
    opts: [{ label: 'Meet their demands', fx: [['gold', -40], ['sup', 'workers', 4]] }, { label: 'The navy runs the ferries', fx: [['sup', 'workers', -6], ['sup', 'military', 2]] }] });
  ev({ id: 'd_island_storm', tone: 'bad', theme: 'nature', title: 'The storm of the century', w: (n, G) => (island(G, n) || n.coastTiles > n.tiles * 0.3 ? 0.8 : 0),
    text: 'A storm surge has breached the sea walls of three harbour towns and sunk half the fishing fleet at its moorings.',
    opts: [{ label: 'Rebuild higher', fx: [['gold', -80], ['mod', 'trade', -0.03, 12, 'The storm']] }, { label: 'Let the towns rebuild themselves', fx: [['mod', 'trade', -0.06, 24, 'The storm'], ['sup', 'peasants', -4]] }] });
  ev({ id: 'd_landlocked_river', tone: 'mixed', theme: 'abroad', title: 'The river and the neighbour’s port', w: (n, G) => (n.coastTiles === 0 ? 1.4 : 0),
    text: 'Every ton we export goes downriver through a neighbour’s port, and the neighbour has raised its transit dues again.',
    opts: [{ label: 'Pay', fx: [['mod', 'trade', -0.03, 24, 'Transit dues']] }, { label: 'Build a railway around them', fx: [['gold', -100], ['mod', 'trade', 0.03, 120, 'Our own railway']] }] });
  ev({ id: 'd_mountain_road', tone: 'good', theme: 'works', title: 'The pass is open all winter', w: (n) => ((n.tc[ID.T.MOUNTAIN] + n.tc[ID.T.HILLS]) / Math.max(1, n.tiles) > 0.3 ? 1 : 0),
    text: 'Engineers have finished the tunnel under the high pass. For the first time in history the mountain valleys are connected to the capital in winter.',
    opts: [{ label: 'A festival in the valleys', fx: [['sup', 'peasants', 4], ['mod', 'unrest', -2, 24, 'The tunnel']] }, { label: 'A garrison at the tunnel', fx: [['mod', 'def', 0.03, 60, 'The tunnel fort']] }] });
  // ---- by size
  ev({ id: 'd_small_neutral', tone: 'mixed', theme: 'abroad', title: 'Everyone’s favourite neutral', w: (n, G) => (share(G, n) < 0.02 && !n.nwars ? 1.2 : 0),
    text: 'Two great powers want to hold secret talks, and both have asked to hold them in our capital, because we are too small to matter to either.',
    opts: [{ label: 'Host them', fx: [['opAll', 5], ['gold', 30]] }, { label: 'Stay out of it', fx: [] }] });
  ev({ id: 'd_small_stamps', tone: 'good', theme: 'money', title: 'Our stamps are worth more than our exports', w: (n, G) => (share(G, n) < 0.02 ? 0.9 : 0),
    text: 'Collectors all over the world want our postage stamps, which are beautiful and rare because there are so few of us. The post office makes more money than the customs.',
    opts: [{ label: 'Issue a set every month', fx: [['gold', 70], ['mod', 'legit', -1, 24, 'Stamp republic']] }, { label: 'Keep them rare', fx: [['gold', 30]] }] });
  ev({ id: 'd_big_provinces', tone: 'bad', theme: 'state', title: 'The governor who rules alone', w: (n, G) => (share(G, n) > 0.09 ? 1.3 : 0),
    text: 'The governor of a distant province has not answered a telegram from the capital in six months. His province pays no taxes and has a police force that answers to him.',
    opts: [{ label: 'Recall him', fx: [['auth', -8], ['mod', 'unrest', 3, 12, 'The recall']] }, { label: 'Make him a minister', fx: [['corr', 4], ['figLoy', 'police', -4]] }, { label: 'Send the army', fx: [['mod', 'rev', 0.02, 24, 'Taxes collected'], ['grievance', 6]] }] });
  ev({ id: 'd_big_census', tone: 'mixed', theme: 'state', title: 'The census finds millions', w: (n, G) => (share(G, n) > 0.08 ? 1 : 0),
    text: 'The first proper census in a generation has found eleven million more people than the ministries thought they governed, most of them paying no tax.',
    opts: [{ label: 'Tax them', fx: [['mod', 'rev', 0.04, 60, 'The census'], ['mod', 'unrest', 3, 24, 'New taxes']] }, { label: 'Build schools for them', fx: [['gold', -60], ['mod', 'sci', 0.04, 60, 'Census schools']] }] });
  // ---- by circumstance
  ev({ id: 'd_peace_generation', tone: 'good', theme: 'people', title: 'A generation that never saw war', w: (n) => (peaceful(n) ? 1.2 : 0),
    text: 'The young men called up this year are the first in living memory who have never heard a shot fired in anger. The old officers complain that they are soft. The economists notice that they are rich.',
    opts: [{ label: 'Shorten military service', fx: [['mod', 'prod', 0.03, 60, 'The peace dividend'], ['sup', 'military', -6]] }, { label: 'Keep them ready', fx: [['mod', 'def', 0.03, 60, 'Ready reserves']] }] });
  ev({ id: 'd_peace_tourists', tone: 'good', theme: 'money', title: 'The tourists discover us', era: 1, w: (n) => (peaceful(n) && n.coastTiles > 0 ? 1 : 0),
    text: 'Guidebooks abroad have called our coast the most beautiful in the world and our prices the lowest. The first package tours have arrived.',
    opts: [{ label: 'Build hotels', fx: [['gold', -60], ['mod', 'trade', 0.05, 120, 'Tourism']] }, { label: 'Keep the coast as it is', fx: [['tradition', 3]] }] });
  ev({ id: 'd_lost_memorial', tone: 'mixed', theme: 'war', title: 'The memorial to a lost war', w: (n) => (lost(n) ? 1.6 : 0),
    text: 'The veterans want a memorial to the dead of the war we lost. The government’s architects have proposed a triumphal arch; the veterans want a wall with every name.',
    opts: [{ label: 'The wall of names', fx: [['legitmod', 3, 36, 'The wall of names'], ['sup', 'military', 4]] }, { label: 'The triumphal arch', fx: [['glory', 4], ['sup', 'intelligentsia', -4]] }] });
  ev({ id: 'd_lost_stab', tone: 'bad', theme: 'war', title: 'The stab in the back', w: (n) => (lost(n) && !fam(n, 'socialist', 'anarchist') ? 1.4 : 0),
    text: 'A pamphlet is selling in tens of thousands: the army was never beaten in the field, it says; it was betrayed at home by politicians, strikers and foreigners. Every veteran has read it.',
    opts: [{ label: 'Ban it', fx: [['grievance', 4], ['sup', 'military', -4]] }, { label: 'Publish the war records', fx: [['sup', 'intelligentsia', 4], ['drift', 'natpop', -6]] }, { label: 'Let it circulate', fx: [['drift', 'natpop', 8], ['sup', 'military', 4]] }] });
  ev({ id: 'd_slump_soup', tone: 'bad', theme: 'money', title: 'Soup kitchens in the capital', w: (n) => (n.depression ? 1.6 : 0),
    text: 'The queues outside the soup kitchens stretch round the block, and some of the men in them wear the suits they wore to the office until last month.',
    opts: [{ label: 'Public works', fx: [['gold', -80], ['sup', 'workers', 6], ['mod', 'prod', 0.02, 24, 'Public works']] }, { label: 'Balance the budget', fx: [['gold', 40], ['sup', 'workers', -8], ['drift', 'natpop', 4]] }] });
  ev({ id: 'd_slump_gold', tone: 'mixed', theme: 'money', title: 'Leave the gold standard?', w: (n) => (n.depression && model(n, 'market', 'mixed', 'trade', 'pact') ? 1.4 : 0),
    text: 'The central bank is defending the currency with gold it does not have. The finance minister wants to float it; the bankers say it would be the end of civilisation.',
    opts: [{ label: 'Float the currency', fx: [['mod', 'prod', 0.04, 24, 'Cheaper exports'], ['inflation', 8], ['sup', 'capital', -4]] }, { label: 'Defend the gold', fx: [['gold', -60], ['sup', 'capital', 4], ['mod', 'prod', -0.03, 12, 'Tight money']] }] });
  ev({ id: 'd_dep_resident', tone: 'bad', theme: 'abroad', title: 'The Resident’s list', w: (n) => (n.dep && n.dep.kind !== 'client' ? 1.4 : 0),
    text: 'The overlord’s Resident has sent the prime minister a list of six officials he wants dismissed for "unfriendly sentiments". They are among the most capable men in the government.',
    opts: [{ label: 'Dismiss them', fx: [['dep', 'res', 8], ['mod', 'eff', -0.03, 24, 'Purged officials']] }, { label: 'Refuse, politely', fx: [['dep', 'res', 4], ['fn', (G, n) => { const o = n.dep && G.nations[n.dep.over]; if (o) ID.addOpBoth(G, n.id, o.id, -10); }]] }] });
  ev({ id: 'd_dep_students', tone: 'mixed', theme: 'abroad', title: 'The students come home', w: (n) => (n.dep ? 1.2 : 0),
    text: 'The first generation of students sent to the overlord’s universities has come home. They speak its language better than their own, quote its philosophers and want everything it has, starting with independence.',
    opts: [{ label: 'Give them posts in the ministries', fx: [['mod', 'eff', 0.03, 60, 'Educated officials'], ['dep', 'res', 6]] }, { label: 'Watch them', fx: [['mod', 'opp', -0.03, 24, 'Watched students'], ['sup', 'intelligentsia', -4]] }] });
  ev({ id: 'd_dep_base', tone: 'mixed', theme: 'abroad', title: 'A brawl outside the base', w: (n) => (n.dep && ID.Sov.KIND[n.dep.kind].base ? 1.4 : 0),
    text: 'Soldiers from the foreign base got drunk in a bar in town; a local man is dead. The base commander says his men will be tried by their own court-martial, at home.',
    opts: [{ label: 'Demand a trial here', fx: [['dep', 'res', 8], ['legitmod', 3, 24, 'Our courts']] }, { label: 'Accept their court-martial', fx: [['dep', 'res', 4], ['legitmod', -3, 24, 'Their courts']] }] });
  ev({ id: 'd_oil_town', tone: 'mixed', theme: 'money', title: 'The company town', w: (n, G) => (oil(G, n) ? 1.2 : 0),
    text: 'The oil company’s compound has swimming pools, a cinema and air conditioning for its foreign staff. The workers’ camp next to it has none of those, and one tap for every hundred men.',
    opts: [{ label: 'Make the company pay for housing', fx: [['sup', 'workers', 6], ['fn', (G, n) => { for (const P of ID.Sov.oilProvs(G, n)) if (P.oilCo && P.oilCo !== n.id) ID.addOpBoth(G, n.id, P.oilCo, -5); }]] }, { label: 'Leave it to the company', fx: [['sup', 'workers', -4], ['drift', 'thirdpos', 3]] }] });
  ev({ id: 'd_oil_sheikhs', tone: 'good', theme: 'money', title: 'Oil money and the palace', w: (n, G) => (oil(G, n) >= 2 && fam(n, 'conservative') ? 1.2 : 0),
    text: 'Royalties from the oil now exceed every other revenue of the state combined. The princes want palaces, the preachers want shrines and the planners want a university. There is enough for everything, this year.',
    opts: [{ label: 'Palaces', fx: [['corr', 6], ['sup', 'military', 4], ['tradition', 4]] }, { label: 'A university', fx: [['mod', 'sci', 0.06, 120, 'The oil university'], ['sup', 'clergy', -3]] }, { label: 'Shrines and seminaries', fx: [['sup', 'clergy', 8]] }] });
  ev({ id: 'd_oil_curse', tone: 'bad', theme: 'money', title: 'Nobody works the fields any more', era: 2, w: (n, G) => (oil(G, n) >= 3 ? 1.2 : 0),
    text: 'Since the oil money came, nobody wants to farm or to work in a factory. The country imports its bread, its shirts and its labourers. Economists have a name for this, and it is not a compliment.',
    opts: [{ label: 'Subsidise farming', fx: [['gold', -60], ['mod', 'food', 0.05, 60, 'Farm subsidies']] }, { label: 'Import what we need', fx: [['mod', 'trade', 0.03, 60, 'Oil buys everything'], ['mod', 'prod', -0.02, 60, 'No industry']] }] });
  ev({ id: 'd_union_flag', tone: 'mixed', theme: 'party', title: 'Two capitals, one ministry', w: (n, G) => (ID.Sov && ID.Sov.inUnion(G, n) ? 1.6 : 0),
    text: 'Every ministry of the union now has two offices in two capitals, and every decision is taken twice. The junior partner’s civil servants say the senior partner’s take all the decisions; the senior partner’s say the junior’s take all the holidays.',
    opts: [{ label: 'One ministry, in the senior capital', fx: [['mod', 'eff', 0.03, 60, 'One ministry'], ['fn', (G, n) => { for (const o of ID.alive(G)) if (o.dep && o.dep.kind === 'union' && (o === n || o.dep.over === n.id)) o.dep.res = Math.min(100, o.dep.res + 10); }]] }, { label: 'Equal rotation', fx: [['mod', 'eff', -0.03, 60, 'Two of everything'], ['fn', (G, n) => { for (const o of ID.alive(G)) if (o.dep && o.dep.kind === 'union' && (o === n || o.dep.over === n.id)) o.dep.res = Math.max(0, o.dep.res - 8); }]] }] });
  ev({ id: 'd_new_regime_portraits', tone: 'mixed', theme: 'state', title: 'Changing the portraits', w: (n) => (n.age < 24 && n.age > 1 ? 1.4 : 0),
    text: 'Every school, post office and police station in the country has a portrait of the old regime’s leader on the wall. The new government must decide what to hang there instead, and what to do with the old ones.',
    opts: [{ label: 'Burn them in the square', fx: [['legitmod', 3, 24, 'The bonfire'], ['tradition', -4]] }, { label: 'Store them, just in case', fx: [['tradition', 2], ['note', 'The cautious keep their options open.', null]] }] });
  ev({ id: 'd_new_regime_exiles', tone: 'mixed', theme: 'state', title: 'The exiles return', w: (n) => (n.age < 30 && n.age > 2 ? 1.2 : 0),
    text: 'Ships and trains are full of returning exiles, men who fled the old regime years ago and expect to be thanked, housed and given ministries.',
    opts: [{ label: 'Give them posts', fx: [['sup', 'intelligentsia', 6], ['figLoy', 'ideology', -4]] }, { label: 'Thank them and nothing more', fx: [['sup', 'intelligentsia', -4]] }] });
  ev({ id: 'd_civil_after', tone: 'mixed', theme: 'war', title: 'After the civil war', w: (n) => (n.civil === 0 && (n.cnt.civilWon || n.flags.civilWon) && n.age < 60 ? 1.4 : 0),
    text: 'The civil war is over, and the prisons hold a hundred thousand men who fought on the other side. Their families live in our villages.',
    opts: [{ label: 'An amnesty', fx: [['mod', 'unrest', -4, 36, 'The amnesty'], ['sup', 'military', -4]] }, { label: 'Tribunals', fx: [['grievance', 10], ['mod', 'opp', -0.05, 36, 'Tribunals']] }] });
  ev({ id: 'd_famine_relief', tone: 'bad', theme: 'people', title: 'A foreign relief mission', w: (n) => (n.famine ? 1.6 : 0),
    text: 'A foreign charity offers to feed a million people through the winter, if its own staff may distribute the food in the villages and report what they see.',
    opts: [{ label: 'Accept', fx: [['mod', 'food', 0.08, 8, 'Relief'], ['opAll', 4], ['legitmod', -3, 24, 'Foreign charity']] }, { label: 'We feed our own', fx: [['gold', -80], ['mod', 'food', 0.04, 8, 'State relief']] }] });
  ev({ id: 'd_coup_rumour', tone: 'bad', theme: 'army', title: 'Officers dining late', w: (n) => (n.coupRisk > 0.005 ? 1.2 : 0),
    text: 'The secret police report that the commanders of three regiments have been dining together every Thursday, very late, with the doors closed.',
    opts: [{ label: 'Transfer them to the provinces', fx: [['mod', 'coup', -0.2, 24, 'Transfers'], ['sup', 'military', -4]] }, { label: 'Invite them to dine with the leader', fx: [['gold', -30], ['sup', 'military', 4]] }] });
  ev({ id: 'd_spy_scandal', tone: 'bad', theme: 'abroad', title: 'A spy in the ministry', era: 1, w: () => 0.6,
    text: 'A senior clerk in the foreign ministry has been arrested at a railway station with a briefcase of cipher tables. He has been passing them to a foreign embassy for nine years.',
    opts: [{ label: 'Expel the embassy’s staff', fx: [['opAll', -2], ['mod', 'def', 0.02, 24, 'New ciphers']] }, { label: 'Turn him, and feed them lies', fx: [['auth', 6], ['note', 'A double agent is a dangerous asset.', null]] }] });
  ev({ id: 'd_scientist_defects', tone: 'mixed', theme: 'abroad', title: 'A physicist asks for asylum', era: 2, w: (n) => (fam(n, 'liberal', 'socialist') ? 0.7 : 0.3),
    text: 'A physicist from a rival power has walked into our embassy abroad and asked for asylum. He says he knows things our scientists would want to know.',
    opts: [{ label: 'Take him in', fx: [['mod', 'sci', 0.06, 60, 'The defector'], ['opAll', -2]] }, { label: 'Send him back', fx: [['opAll', 2]] }] });
  ev({ id: 'd_strike_docks', tone: 'bad', theme: 'labour', title: 'The dockers out', w: (n) => (n.nb[ID.B.PORT] >= 2 && law(n, 'labor', 'free', 'control') ? 1.1 : 0),
    text: 'The dockers have struck for a closed shop and a shorter shift. Ships are waiting at anchor and perishable cargo is rotting in the holds.',
    opts: [{ label: 'Give them the closed shop', fx: [['sup', 'workers', 6], ['sup', 'capital', -6]] }, { label: 'Troops to unload the ships', fx: [['sup', 'workers', -8], ['grievance', 6]] }] });
  ev({ id: 'd_school_reform', tone: 'mixed', theme: 'culture', title: 'Whose history in the schoolbooks?', w: (n) => 0.7,
    text: 'A commission of historians has rewritten the national history textbook. The old one had heroes; the new one has causes, consequences and a chapter on our own mistakes.',
    opts: [{ label: 'Adopt the new book', fx: [['sup', 'intelligentsia', 6], ['tradition', -4]] }, { label: 'Keep the heroes', fx: [['tradition', 4], ['sup', 'intelligentsia', -4]] }] });
  ev({ id: 'd_epidemic_vaccine', tone: 'good', theme: 'people', era: 2, title: 'A vaccine at last', w: () => 0.6, cd: 400,
    text: 'A vaccine against the summer paralysis that has crippled a generation of children has passed its trials. The manufacturer can supply half the country this year.',
    opts: [{ label: 'Free for every child', fx: [['gold', -70], ['mod', 'growth', 0.04, 60, 'The vaccine'], ['legitmod', 4, 36, 'The vaccine']] }, { label: 'Sell it at cost', fx: [['mod', 'growth', 0.02, 60, 'The vaccine'], ['sup', 'workers', -2]] }] });
  ev({ id: 'd_border_river', tone: 'mixed', theme: 'abroad', title: 'The river changes course', w: (n, G) => (Object.keys(G.border[n.id] || {}).length >= 2 ? 0.7 : 0),
    text: 'A spring flood has moved the border river half a mile to the west. A village that was ours is now on the other bank, and the neighbour’s gendarmes have put up a flag.',
    opts: [{ label: 'The border is where the treaty says', fx: [['opAll', -2], ['glory', 2]] }, { label: 'Swap it for a village of theirs', fx: [['opAll', 3]] }] });
  ev({ id: 'd_world_fair_bid', tone: 'good', theme: 'wonder', title: 'A bid for the world’s fair', era: 1, cd: 400, w: (n) => (n.stab > 55 && n.gold > 150 ? 0.7 : 0),
    text: 'Our capital is on the shortlist to host the next world’s fair. The bid will cost a fortune, and so will winning it.',
    opts: [{ label: 'Bid for it', fx: [['gold', -120], ['glory', 8], ['opAll', 5], ['mod', 'trade', 0.04, 36, 'The fair']] }, { label: 'Withdraw', fx: [] }] });
  ev({ id: 'd_heatwave', tone: 'bad', theme: 'nature', title: 'The summer the rivers dried', w: () => 0.6,
    text: 'No rain since spring. The rivers are too low for barges and the reservoirs show the drowned villages beneath them.',
    opts: [{ label: 'Ration water', fx: [['mod', 'food', -0.05, 6, 'Drought'], ['sup', 'workers', -2]] }, { label: 'Dig deeper wells', fx: [['gold', -50]] }] });
  ev({ id: 'd_mine_gold', tone: 'good', theme: 'money', title: 'Gold in the hills', w: (n) => ((n.tc[ID.T.HILLS] + n.tc[ID.T.MOUNTAIN]) > 40 ? 0.6 : 0), cd: 400,
    text: 'A prospector has found gold in a stream in the hills. Within a week ten thousand men are camped along it.',
    opts: [{ label: 'A state mine', fx: [['gold', 140], ['sup', 'bureaucracy', 4]] }, { label: 'Free claims for all', fx: [['gold', 60], ['sup', 'peasants', 6], ['mod', 'unrest', 2, 12, 'Gold rush']] }] });
  ev({ id: 'd_chess', tone: 'good', theme: 'games', title: 'A world chess champion', era: 2, cd: 400, w: () => 0.5,
    text: 'A young player from our country has beaten the world champion in a match followed move by move in every café. Both blocs claim him as proof of something.',
    opts: [{ label: 'A state reception', fx: [['legitmod', 3, 24, 'The champion'], ['sup', 'intelligentsia', 4]] }, { label: 'A chess club in every school', fx: [['mod', 'sci', 0.03, 60, 'Chess clubs']] }] });
})();
