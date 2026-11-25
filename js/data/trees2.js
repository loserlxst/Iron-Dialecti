/* IRON DIALECTIC — longer programme trees (session 10). Every national tree gains a branch of nine:
   a shared root, then two roads that rule each other out (three steps each, ending in different capstones),
   so a country's last decades are a choice, not a list. Great powers' branches act on the Old Lands. Every
   ideology tree gains a late pair of exclusive programmes. Programmes whose effects were only numbers get
   one interaction (neighbours, the inner circle, a treaty) and their "for good" bonuses now last twenty years.
   Branch steps take 160 days of work (200 for the root) before pacing. Loads after data/oldtrees.js. */
(function () {
  'use strict';
  const ID = (globalThis.ID = globalThis.ID || {});
  const PERM = 600, B = ID.B;
  const n2 = (b, k) => ['note2', b, k];
  /* br(base, year, root, [a1, a2, a3], capA, [b1, b2, b3], capB); each spec [name, desc, fx, opts] */
  const br = (base, year, root, A, capA, Bs, capB) => {
    const L = ID.FOCUS.nations[base]; if (!L) return;
    const pre = L[0].id.split('_')[0] + '_x';
    const all = L.concat((ID.FOCUS.projects || {})[base] || []);
    const x0 = Math.max(...all.map((f) => f.x)) + 1.4;
    const P = (sfx, s, x, y, o) => Object.assign({ id: pre + sfx, name: s[0], desc: s[1], fx: s[2], x, y, days: 160 }, s[3] || {}, o);
    const ids = (k, n) => Array.from({ length: n }, (_, i) => pre + k + (i + 1));
    L.push(P('r', root, x0 + 0.5, 0, { year, days: 200 }));
    A.forEach((s, i) => L.push(P('a' + (i + 1), s, x0, i + 1, { req: [i ? pre + 'a' + i : pre + 'r'], excl: i ? undefined : [pre + 'b1'] })));
    Bs.forEach((s, i) => L.push(P('b' + (i + 1), s, x0 + 1, i + 1, { req: [i ? pre + 'b' + i : pre + 'r'], excl: i ? undefined : [pre + 'a1'] })));
    L.push(P('ca', capA, x0, 4, { req: [ids('a', 3)[2]] }));
    L.push(P('cb', capB, x0 + 1, 4, { req: [ids('b', 3)[2]] }));
  };

  /* ================================================================ the two continents */
  br('Aurelia', 1946, ['After the second war', 'The country is in ruins and has an army of millions. The general staff and the planners each have a programme for what comes next.', [['mod', 'prod', 0.03, 240, 'Reconstruction'], ['sup', 'military', 4]]],
    [['The warm-water policy', 'Bases on the southern sea, by treaty or by pressure: the old imperial dream in new uniforms.', [['claim', 'Varanth'], ['op', 'Varanth', -15], ['mod', 'navy', 0.3, 240, 'The southern fleet']]],
      ['Arms for the Nile', 'Tanks and advisers for Khemra, so that the Old Lands stop being somebody else’s lake.', [n2('Khemra', 'arms'), ['op', 'Cassine', -8]]],
      ['A friend on the plateau', 'Credits and a treaty for Zandar, our southern neighbour.', [n2('Zandar', 'treaty'), ['op', 'Zandar', 10]]]],
    ['The southern sea', 'Our ships in the warm seas, our friends in the Old Lands, and an answer to every western base.', [['mod', 'navy', 0.5, 240, 'The southern sea'], ['glory', 10], ['subvert', 'Sahrem', 8]]],
    [['The great reconstruction', 'Rebuild the burned provinces before anything else: housing, rails, grain.', [['build', B.CITY, 1], ['mod', 'ls', 2, 240, 'Reconstruction']]],
      ['Consumer goods', 'Refrigerators, radios and motorcycles in the shops, by order of the plan.', [['mod', 'ls', 3, 240, 'Consumer goods'], ['sup', 'workers', 6], ['mod', 'atk', -0.03, 240, 'Fewer tanks']]],
      ['Détente', 'A treaty with the west on arms and frontiers: trade for recognition.', [n2('Cassine', 'treaty'), ['opAll', 5]]]],
    ['The new Aurelia', 'A country that feeds and houses its people, and lets them travel. The old guard calls it softness.', [['legitmod', 6, 120, 'The new Aurelia'], ['mod', 'unrest', -4, 240, 'Comfort'], ['mod', 'trade', 0.06, 240, 'Open doors']]]);
  br('Cassine', 1945, ['Leader of the free world', 'The war is won and Cassine is the richest country on earth. Its diplomats must decide what that obliges it to do.', [['opAll', 3], ['glory', 6]]],
    [['Oil for protection', 'A base in the desert kingdom and a guarantee to its king, in return for the oil.', [n2('Sahrem', 'base'), n2('Sahrem', 'concession')]],
      ['The northern tier', 'Arms and an alliance for the states that border Karsova: Varanth, Zandar, Baskhar.', [['ally', 'Varanth'], n2('Zandar', 'arms'), n2('Baskhar', 'arms')]],
      ['The special friend', 'Arms and money for Neshar, the one democracy of the Old Lands. Every other capital there will take note.', [n2('Neshar', 'arms'), ['op', 'Neshar', 20], ['op', 'Khemra', -12], ['op', 'Baskhar', -8]]]],
    ['Guarantor of the gulf', 'Fleets in the gulf, bases in the desert, friends in every palace: the oil flows, and Cassine is responsible for everything that happens there.', [['mod', 'navy', 0.4, 240, 'The gulf fleet'], ['mod', 'trade', 0.06, 240, 'Cheap oil'], ['threat', 6]]],
    [['A hemisphere at home', 'Highways, suburbs and universities: the next decade spent at home.', [['build', B.CITY, 1], ['mod', 'ls', 3, 240, 'The suburbs']]],
      ['Civil rights', 'The law of the land enforced in every state, with troops if the governors will not.', [['sup', 'intelligentsia', 8], ['mod', 'unrest', 3, 24, 'Resistance in the south'], ['legitmod', 4, 120, 'Equal rights']]],
      ['The war on poverty', 'Medical care for the old and the poor, schools for the children of the slums.', [['mod', 'ls', 2, 240, 'The war on poverty'], ['gold', -150], ['sup', 'workers', 6]]]],
    ['The great society', 'A country that tries to keep its promises to its own people before it keeps them to anyone else’s.', [['legitmod', 6, 120, 'The great society'], ['mod', 'unrest', -4, 240, 'The great society'], ['opAll', -2]]]);
  br('Norvik', 1945, ['East of the Canal', 'The empire is bankrupt and the Old Lands are restless. Every minister agrees that something must give; none agrees what.', [['gold', -40], ['opAll', 2]]],
    [['Hold the Residency', 'Keep the bases, the mandates and the oil: reinforce every garrison in the Old Lands.', [['fn', (G, n) => { for (const o of ID.Sov.dependents(G, n)) { o.dep.gar = Math.min(1.5, o.dep.gar + 0.4); o.dep.res = Math.min(100, o.dep.res + 6); } }], ['note', 'Every garrison in our dependencies is reinforced'], ['gold', -80]]],
      ['The pact of the northern tier', 'A defence pact with Baskhar and Varanth, with Norvik as its keystone.', [['ally', 'Baskhar'], ['ally', 'Varanth']]],
      ['The Canal base', 'Eighty thousand men on the Canal, for as long as it takes.', [['mod', 'navy', 0.4, 240, 'The Canal base'], ['op', 'Khemra', -20]]]],
    ['The Residency', 'Norvik stays east of the Canal: the bases, the oil and the resentment are all still ours.', [['mod', 'rev', 0.05, 240, 'Imperial revenue'], ['threat', 6], ['glory', 6]]],
    [['The managed retreat', 'Independence for every dependency that asks, on terms: a treaty, a base, a friendship.', [['fn', (G, n) => { for (const o of ID.Sov.dependents(G, n)) if (o.dep.kind !== 'client') ID.Sov.free(G, o, 'treaty'); }], ['note', 'Every dependency becomes a treaty state'], ['opAll', 6]]],
      ['The commonwealth of nations', 'A free association of the former dependencies, with a secretariat in our capital and a cricket tour every summer.', [['opAll', 5], ['mod', 'trade', 0.05, 240, 'The commonwealth']]],
      ['Aid instead of garrisons', 'Engineers, doctors and credits for the new states.', [n2('Khemra', 'aid'), n2('Baskhar', 'aid'), ['gold', -60]]]],
    ['The Commonwealth', 'An empire that dismantled itself before it was dismantled: diminished, solvent, and still invited everywhere.', [['legitmod', 6, 120, 'The Commonwealth'], ['opAll', 8], ['mod', 'trade', 0.06, 240, 'The Commonwealth']]]);
  br('Tessaly', 1946, ['The small republic after the war', 'Tessaly survived the war by being too small to matter. It must now decide whether to stay small.', [['mod', 'eff', 0.03, 240, 'Peace work']]],
    [['The neutral broker', 'Host every conference, sign every convention, offend nobody.', [['opAll', 6], ['gold', 40]]],
      ['Peacekeepers', 'Blue helmets from Tessaly on every armistice line in the Old Lands.', [['op', 'Amaran', 10], ['op', 'Neshar', 10], ['op', 'Khemra', 10], ['glory', 4]]],
      ['The development bank', 'A bank for the new states, run from our capital.', [n2('Khemra', 'aid'), n2('Tyrrha', 'treaty'), ['mod', 'trade', 0.04, 240, 'Development bank']]]],
    ['The conscience of the continents', 'A small country with a large voice: every treaty has a Tessalian clause.', [['legitmod', 6, 120, 'The conscience'], ['opAll', 8], ['mod', 'def', 0.06, 240, 'Everyone’s friend']]],
    [['The western alliance', 'Join Cassine’s alliance: security first.', [['ally', 'Cassine'], ['mod', 'def', 0.08, 240, 'The alliance']]],
      ['The integrated market', 'Customs union with our western neighbours.', [n2('Norvik', 'treaty'), n2('Verano', 'treaty'), ['mod', 'trade', 0.05, 240, 'Customs union']]],
      ['The welfare model', 'Pensions, health and housing for everyone, paid by high taxes and high wages.', [['mod', 'ls', 3, 240, 'The welfare model'], ['sup', 'workers', 6]]]],
    ['The model republic', 'Rich, safe and boring, and proud of all three.', [['legitmod', 6, 120, 'The model republic'], ['mod', 'unrest', -4, 240, 'Contentment']]]);
  br('Verano', 1945, ['The federation after the war', 'The syndicates survived the generals. What they do with the peace will decide whether they survive the peace.', [['particip', 6]]],
    [['Export the revolution', 'Volunteers, printing presses and money for comrades abroad.', [['subvertNb', 8], ['opAll', -4]]],
      ['The camps of Amaran', 'Rifles and instructors for the refugee camps, against the settler state.', [n2('Amaran', 'arms'), ['op', 'Neshar', -15]]],
      ['The tricontinental', 'A conference of liberation movements from three continents in our capital.', [['glory', 6], ['subvert', 'Tyrrha', 6], ['subvert', 'Zandar', 6]]]],
    ['The red harbour', 'The capital of every rebellion on three continents.', [['fervor', 15], ['legitmod', 6, 120, 'The red harbour'], ['threat', 8]]],
    [['The quiet federation', 'Concentrate on the cooperatives at home.', [['mod', 'prod', 0.04, 240, 'Cooperatives']]],
      ['Self-management', 'Every enterprise run by an elected council, with a market between them.', [['mod', 'eff', 0.04, 240, 'Self-management'], ['particip', 6]]],
      ['Trade with all', 'Trade treaties with every bloc.', [n2('Cassine', 'treaty'), n2('Karsova', 'treaty')]]],
    ['The working commonwealth', 'A free federation that works: proof, it says, that the councils can last.', [['legitmod', 6, 120, 'The working commonwealth'], ['mod', 'ls', 3, 240, 'Self-management']]]);
  br('Drava', 1946, ['The colonels’ accounts', 'Drava lost two wars in thirty years. The officers, the high priests and the émigrés each say they know why.', [['sup', 'military', 4]]],
    [['Revanche', 'Every lost province on the classroom map, and a new army to take them back.', [['claimsAll'], ['mod', 'atk', 0.05, 240, 'Revanche']]],
      ['The southern ally', 'A treaty with Varanth, the other loser of the century.', [n2('Varanth', 'treaty'), ['op', 'Varanth', 10]]],
      ['Mobilise the émigrés', 'The diaspora in every neighbouring state organised and funded.', [['subvertNb', 8]]]],
    ['Greater Drava, again', 'The old map, and the old enemies.', [['glory', 10], ['mod', 'atk', 0.06, 240, 'Greater Drava'], ['opAll', -6]]],
    [['Reconciliation', 'Treaties with every neighbour on the borders as they are.', [['opAll', 8], ['mod', 'def', 0.04, 240, 'Secure borders']]],
      ['The river commission', 'A joint commission for the great river with the downstream states.', [n2('Ruthe', 'treaty'), ['mod', 'trade', 0.05, 240, 'The river']]],
      ['The tourist coast', 'Hotels on the coast for the tourists of three countries.', [['mod', 'trade', 0.05, 240, 'Tourists'], ['gold', 60]]]],
    ['The peaceful frontier', 'A small country that has stopped counting its lost provinces.', [['legitmod', 6, 120, 'The peaceful frontier'], ['mod', 'unrest', -4, 240, 'Peace']]]);
  br('Lys', 1950, ['Between three continents', 'The straits matter less in the age of the aeroplane, the Canal and the oil tanker. The houses must find a new trade.', [['gold', 60]]],
    [['The oil exchange', 'Host the oil states’ cartel and the exchange where their crude is priced.', [['mod', 'trade', 0.06, 240, 'The oil exchange'], ['op', 'Sahrem', 10], ['op', 'Zandar', 10]]],
      ['Canal shares', 'Buy the shares of the Canal Company that the Norvish government is selling.', [['gold', -150], ['fn', (G, n) => { for (let p = 1; p < G.provinces.length; p++) { const P = G.provinces[p]; if (P.canal && P.oilCo && G.nations[P.oilCo] && G.nations[P.oilCo].base === 'Norvik') P.oilCo = n.id; } }], ['note', 'Lys takes over the Canal Company’s shares']]],
      ['Petrodollars', 'Deposit accounts for the oil kingdoms, at interest, no questions.', [n2('Sahrem', 'treaty'), ['mod', 'rev', 0.06, 240, 'Petrodollars']]]],
    ['The bank of the oil', 'Every barrel sold in the Old Lands is paid for in Lys.', [['gold', 300], ['mod', 'trade', 0.08, 240, 'The bank of the oil']]],
    [['The neutral strait', 'Free passage for every flag, guaranteed by treaty with every power.', [['opAll', 6], ['mod', 'def', 0.06, 240, 'The guaranteed strait']]],
      ['The shipyards', 'Supertankers built in the old arsenal.', [['build', B.FACTORY, 1], ['mod', 'prod', 0.04, 240, 'Shipyards']]],
      ['The free port', 'No duties on anything, ever.', [['mod', 'trade', 0.06, 240, 'Free port']]]],
    ['The serene neutral', 'Rich, neutral and very old.', [['legitmod', 6, 120, 'The serene neutral'], ['opAll', 6]]]);
  br('Karsova', 1953, ['After the Leader', 'The Leader is dead. The presidium must decide what the revolution is for, now that it has survived.', [['discipline', 4]]],
    [['Arms for the non-aligned', 'Tanks and dams for the new states, without asking them to be communists.', [n2('Khemra', 'arms'), n2('Baskhar', 'arms'), ['op', 'Cassine', -10]]],
      ['The friendship university', 'A university in our capital for students of the new states.', [['op', 'Khemra', 8], ['op', 'Zandar', 8], ['op', 'Varanth', 6], ['mod', 'sci', 0.03, 240, 'Foreign students']]],
      ['The high dam contract', 'Build Khemra’s dam when the west refuses.', [n2('Khemra', 'aid'), ['gold', -100], ['glory', 6]]]],
    ['Friend of the third world', 'Every liberation movement and every new state looks east first.', [['glory', 10], ['opAll', 4], ['threat', 6]]],
    [['Socialism at home', 'Housing estates, televisions and a car for the deserving.', [['mod', 'ls', 3, 240, 'Goulash socialism'], ['sup', 'workers', 6]]],
      ['Economic reform', 'Profit as a measure of success for the factory managers.', [['mod', 'eff', 0.05, 240, 'Reform'], ['dist', -6]]],
      ['Corn on the steppe', 'Plough the virgin lands, plant maize from sea to sea.', [['mod', 'food', 0.06, 240, 'Virgin lands']]]],
    ['Developed socialism', 'Stable, comfortable and getting old.', [['legitmod', 6, 120, 'Developed socialism'], ['mod', 'unrest', -4, 240, 'Stability of cadres']]]);
  br('Ruthe', 1946, ['After the legions', 'The legions are gone. Ruthe must decide whether it is a nation or a cause.', [['charisma', 2]]],
    [['The lost provinces', 'Committees for every lost province.', [['claimsAll'], ['sup', 'military', 4]]],
      ['The southern friend', 'Arms from Varanth.', [n2('Varanth', 'arms')]],
      ['The cause abroad', 'The diaspora as a lobby.', [['subvertNb', 6]]]],
    ['The undying cause', 'A nation defined by what it lost.', [['legitmod', 6, 120, 'The cause'], ['mod', 'atk', 0.05, 240, 'The cause']]],
    [['The western road', 'Trade, tourism and treaties.', [n2('Cassine', 'treaty'), ['mod', 'trade', 0.05, 240, 'West']]],
      ['Land reform', 'The estates to the peasants.', [['sup', 'peasants', 8], ['mod', 'food', 0.04, 240, 'Land reform']]],
      ['A free press', 'The censors retired.', [['law', 'press', 'free'], ['sup', 'intelligentsia', 8]]]],
    ['The quiet republic', 'A small country that has made its peace.', [['legitmod', 6, 120, 'The quiet republic'], ['opAll', 6]]]);
  br('Suyan', 1950, ['The river after the wars', 'Forty years of war are over. The villages want land, peace and water.', [['sup', 'peasants', 4]]],
    [['The communes', 'Every village a commune, every commune a dam.', [['mod', 'food', 0.06, 240, 'The communes'], ['particip', 6]]],
      ['The great canal', 'Water from the south to the north.', [['build', B.CITY, 1], ['mod', 'food', 0.04, 240, 'The canal']]],
      ['Friend of the third world', 'Railways for the new states.', [n2('Khemra', 'aid'), ['glory', 4]]]],
    ['The river mastered', 'Floods and famines are history.', [['legitmod', 6, 120, 'The river mastered'], ['mod', 'unrest', -4, 240, 'Full granaries']]],
    [['Opening to the world', 'Foreign investors invited to special zones on the coast.', [['mod', 'prod', 0.06, 240, 'Special zones'], ['op', 'Cassine', 10]]],
      ['The household farm', 'Each family farms its own plot.', [['mod', 'food', 0.08, 240, 'Household farms'], ['sup', 'peasants', 6]]],
      ['Export industries', 'Factories that sell to the world.', [['build', B.FACTORY, 2]]]],
    ['The workshop of the world', 'Rich, eventually.', [['legitmod', 6, 120, 'The workshop'], ['mod', 'prod', 0.05, 240, 'Exports']]]);
  br('Hesperia', 1939, ['The road to the oil', 'The general staff’s war plans all end in the same place: oil. Hesperia has none.', [['mod', 'atk', 0.02, 240, 'Fuel plans']]],
    [['Synthetic fuel', 'Oil from coal, at three times the price.', [['build', B.FACTORY, 1], ['mod', 'atk', 0.04, 240, 'Synthetic fuel']]],
      ['The Old Lands mission', 'Agents and promises for the colonels of Baskhar and the shah of Zandar.', [['subvert', 'Baskhar', 10], n2('Zandar', 'treaty')]],
      ['The southern campaign', 'An army to the Canal, and beyond it the oil.', [['claim', 'Khemra'], ['mod', 'atk', 0.04, 60, 'The southern campaign']]]],
    ['The oil of the south', 'The panzers will not run dry.', [['mod', 'atk', 0.08, 240, 'Oil of the south'], ['glory', 6]]],
    [['The economic miracle', 'A new currency, open markets, and work.', [['mod', 'prod', 0.06, 240, 'The miracle']]],
      ['Guest workers', 'Workers from Varanth for the factories.', [n2('Varanth', 'treaty'), ['pop', 0.02]]],
      ['The common market', 'A customs union with the neighbours.', [n2('Pavon', 'treaty'), n2('Drava', 'treaty')]]],
    ['The miracle', 'The ruins are a memory.', [['legitmod', 6, 120, 'The miracle'], ['mod', 'ls', 3, 240, 'The miracle']]]);
  br('Irkal', 1945, ['The guardians and the century', 'The world has oil, radios and atheists. The guardians must decide how much of it to let in.', [['tradition', 2]]],
    [['The guardians abroad', 'Preachers for the Old Lands, where the faith is rising.', [['subvert', 'Zandar', 8], ['subvert', 'Baskhar', 6], ['sup', 'clergy', 6]]],
      ['Brothers in the desert', 'A treaty with the kingdom of the holy places.', [n2('Sahrem', 'treaty'), ['op', 'Sahrem', 10]]],
      ['The faith’s radio', 'Sermons broadcast to the whole region.', [['subvertNb', 6]]]],
    ['The guardians of the faith', 'The oldest theocracy, and the most patient.', [['legitmod', 6, 120, 'The guardians'], ['sup', 'clergy', 10]]],
    [['Oil and reform', 'Drill the fields, and let the engineers in.', [['oil', 'find'], ['techUp', 'ind']]],
      ['The seminaries reformed', 'Science taught beside scripture.', [['mod', 'sci', 0.06, 240, 'Reformed seminaries'], ['sup', 'clergy', -6]]],
      ['Elections among believers', 'An assembly elected by the faithful.', [['particip', 8], ['mandate', 6]]]],
    ['The reformed guardianship', 'A theocracy with a parliament.', [['legitmod', 6, 120, 'The reformed guardianship'], ['mod', 'eff', 0.04, 240, 'Reform']]]);
  br('Pavon', 1955, ['After the Marshal’s men', 'The generation that fought with the Marshal is dying. Their sons must decide what Pavon is for.', [['sup', 'military', 2]]],
    [['The fortress forever', 'More bunkers, fewer friends.', [['mod', 'def', 0.06, 240, 'More bunkers'], ['opAll', -4]]],
      ['The eastern friend', 'A treaty with the most distant ally possible.', [n2('Suyan', 'treaty')]],
      ['Self-sufficiency', 'Grow everything, import nothing.', [['law', 'trade', 'autarky'], ['mod', 'food', 0.04, 240, 'Self-sufficiency']]]],
    ['The hermit state', 'Alone and right.', [['legitmod', 6, 120, 'The hermit state'], ['mod', 'def', 0.06, 240, 'The hermit state']]],
    [['Opening the border', 'Tourists, trade and the first foreign newspapers.', [['mod', 'trade', 0.06, 240, 'Open border'], ['opAll', 4]]],
      ['The coast for tourists', 'Hotels where the bunkers were.', [['gold', 80], ['mod', 'trade', 0.04, 240, 'Tourism']]],
      ['A treaty with Hesperia', 'Peace with the old enemy.', [n2('Hesperia', 'treaty')]]],
    ['The open door', 'Pavon rejoins the world.', [['legitmod', 6, 120, 'The open door'], ['opAll', 6]]]);
  br('Meridia', 1950, ['The engineers and the world', 'Meridia’s engineers are the best on three continents. The Directorate asks where they should build next.', [['mod', 'sci', 0.02, 240, 'Engineering']]],
    [['Engineers abroad', 'Dams, refineries and power stations for the Old Lands, built by Meridian firms.', [n2('Khemra', 'aid'), n2('Baskhar', 'aid'), ['gold', 80]]],
      ['The refinery contracts', 'Refineries for the oil kingdoms.', [n2('Sahrem', 'treaty'), ['mod', 'trade', 0.05, 240, 'Refineries']]],
      ['Technical schools for the new states', 'Colleges in three Old Lands capitals.', [['op', 'Zandar', 8], ['op', 'Varanth', 8], ['mod', 'sci', 0.03, 240, 'Teaching']]]],
    ['The builders of the south', 'Meridian concrete holds up half the Old Lands.', [['legitmod', 6, 120, 'The builders'], ['mod', 'trade', 0.06, 240, 'Contracts']]],
    [['The automated factory', 'Machines that run machines.', [['mod', 'prod', 0.06, 240, 'Automation']]],
      ['The national grid', 'One electric grid.', [['mod', 'eff', 0.04, 240, 'The grid']]],
      ['The research council', 'Science planned like everything else.', [['mod', 'sci', 0.06, 240, 'Research council']]]],
    ['The efficient republic', 'Nothing wasted.', [['legitmod', 6, 120, 'The efficient republic'], ['mod', 'eff', 0.04, 240, 'Efficiency']]]);
  br('Antara', 1955, ['The copper question', 'The mines belong to foreign companies; the miners to the unions; the government to whoever wins the next election.', [['sup', 'workers', 2]]],
    [['Nationalise the copper', 'The mines to the nation, by unanimous vote.', [['mod', 'rev', 0.08, 240, 'National copper'], ['op', 'Cassine', -15], ['sup', 'capital', -10]]],
      ['Friends in the non-aligned', 'Trade with the new states.', [n2('Khemra', 'treaty'), n2('Varanth', 'treaty')]],
      ['The people’s militia', 'Arms for the unions, in case.', [['troops', 0.06], ['sup', 'military', -8]]]],
    ['The copper republic', 'The mines are ours, and so are the consequences.', [['legitmod', 6, 120, 'The copper republic'], ['mod', 'prod', 0.04, 240, 'Copper']]],
    [['The investors’ road', 'Tax breaks for the copper companies.', [['mod', 'conf', 8, 240, 'Investors'], ['gold', 100]]],
      ['Free trade zones', 'Ports with no duties.', [['mod', 'trade', 0.06, 240, 'Free zones']]],
      ['The western loan', 'A loan from Cassine.', [n2('Cassine', 'treaty'), ['gold', 120]]]],
    ['The open economy', 'Growth, and inequality.', [['legitmod', 4, 120, 'The open economy'], ['mod', 'prod', 0.05, 240, 'Open economy']]]);
  br('Kelda', 1946, ['The island after the war', 'Kelda sat out the war and banked everyone’s money. The money wants to know what Kelda will do next.', [['gold', 60]]],
    [['The offshore haven', 'No questions for any deposit, from anywhere.', [['mod', 'trade', 0.08, 240, 'Offshore'], ['corr', 6]]],
      ['Oil money', 'Accounts for the oil kings.', [n2('Sahrem', 'treaty'), ['gold', 100]]],
      ['Shipping registry', 'Our flag for every ship that wants it.', [['mod', 'navy', 0.3, 240, 'Flags of convenience'], ['gold', 60]]]],
    ['The vault of the world', 'Everyone’s money, nobody’s business.', [['legitmod', 6, 120, 'The vault'], ['gold', 200]]],
    [['The island republic', 'A real government, at last: schools, roads, a coastguard.', [['mod', 'eff', 0.04, 240, 'A real state']]],
      ['A fishing treaty', 'Our waters, our fish.', [n2('Norvik', 'treaty')]],
      ['Universal schooling', 'Every child in school.', [['mod', 'sci', 0.05, 240, 'Schools']]]],
    ['The commonwealth of the island', 'A small, free, and governed island.', [['legitmod', 6, 120, 'The commonwealth'], ['mod', 'unrest', -4, 240, 'Order']]]);
  br('Vess', 1946, ['The harbour councils after the war', 'Vess survived. The councils argue whether to export the revolution or the fish.', [['particip', 4]]],
    [['The red harbour', 'Every revolutionary ship welcome.', [['subvertNb', 6], ['opAll', -3]]],
      ['Sailors for Amaran', 'Volunteers for the camps.', [n2('Amaran', 'arms')]],
      ['The international of the docks', 'A union of every dockers’ union.', [['subvert', 'Norvik', 6], ['subvert', 'Cassine', 6]]]],
    ['The mutiny that won', 'Every port on two seas sings our song.', [['legitmod', 6, 120, 'The mutiny that won'], ['fervor', 10]]],
    [['The free ports league', 'Trade with every port.', [n2('Lys', 'treaty'), n2('Kelda', 'treaty')]],
      ['The fishing cooperatives', 'Modern trawlers, owned by their crews.', [['mod', 'food', 0.06, 240, 'Trawlers']]],
      ['The ferries', 'A ferry line to the mainland.', [['mod', 'trade', 0.05, 240, 'Ferries']]]],
    ['The working harbour', 'Prosperous, and still run by its councils.', [['legitmod', 6, 120, 'The working harbour'], ['mod', 'ls', 3, 240, 'Prosperity']]]);

  /* ================================================================ the Old Lands */
  br('Varanth', 1960, ['The bridge or the barracks', 'Varanth is in the western alliance and on the edge of the Old Lands. The next decade decides which it belongs to.', [['mandate', 4]]],
    [['The application to the west', 'Apply to join the western common market.', [n2('Cassine', 'treaty'), n2('Hesperia', 'treaty'), ['mod', 'trade', 0.05, 240, 'The application']]],
      ['Guest workers abroad', 'A million workers to Hesperia’s factories; their wages come home.', [['pop', -0.02], ['gold', 120], ['op', 'Hesperia', 10]]],
      ['The island intervention', 'Troops to protect our minority on a disputed island. The west objects.', [['claim', 'Tyrrha'], ['op', 'Cassine', -10], ['glory', 8]]]],
    ['The western republic', 'A member of the west, with its own ideas.', [['legitmod', 6, 120, 'The western republic'], ['mod', 'prod', 0.05, 240, 'Western markets']]],
    [['The eastern turn', 'Leave the alliance; trade with Karsova.', [n2('Karsova', 'treaty'), ['op', 'Cassine', -15]]],
      ['The Old Lands brotherhood', 'Lead the region instead of guarding its border.', [['op', 'Khemra', 12], ['op', 'Baskhar', 12], ['op', 'Sahrem', 12]]],
      ['The pious revival', 'Let the shrines back into politics.', [['sup', 'clergy', 10], ['drift', 'revival', 8]]]],
    ['Leader of the Old Lands', 'The old imperial capital speaks for the region again.', [['legitmod', 6, 120, 'Leader of the Old Lands'], ['glory', 10]]]);
  br('Khemra', 1965, ['The river and the millions', 'Thirty million people on the river, and a million more every year. The dam is not enough.', [['mod', 'food', 0.02, 240, 'Planning']]],
    [['Reclaim the desert', 'New valleys irrigated from the lake.', [['mod', 'food', 0.06, 240, 'Reclaimed desert']]],
      ['New towns in the sand', 'Satellite cities for the overflowing capital.', [['build', B.CITY, 1], ['mod', 'unrest', -3, 240, 'New towns']]],
      ['The canal widened', 'Supertankers through the Canal.', [['mod', 'trade', 0.06, 240, 'The wider canal']]]],
    ['The green desert', 'The river’s gift extended.', [['legitmod', 6, 120, 'The green desert'], ['mod', 'food', 0.05, 240, 'Green desert']]],
    [['Sons abroad', 'Teachers, engineers and labourers to the oil kingdoms; their wages come home.', [['pop', -0.02], ['gold', 150], ['op', 'Sahrem', 10]]],
      ['The army of the Old Lands', 'Khemran officers train every army in the region.', [['op', 'Baskhar', 8], ['op', 'Tyrrha', 8], ['mod', 'atk', 0.04, 240, 'Experience']]],
      ['The voice of the region', 'Cinema, music and newspapers for the whole Old Lands.', [['subvertNb', 4], ['glory', 6]]]],
    ['Mother of the world', 'The cultural capital of the Old Lands.', [['legitmod', 6, 120, 'Mother of the world'], ['opAll', 6]]]);
  br('Baskhar', 1968, ['After the revolutions', 'Four coups in ten years. The army and the party must decide which of them governs.', [['sup', 'military', 2]]],
    [['The oil boom', 'Production doubled, prices quadrupled.', [['oil', 'find'], ['gold', 200]]],
      ['Hospitals and highways', 'The best health service in the Old Lands.', [['mod', 'ls', 3, 240, 'Oil welfare']]],
      ['The nuclear reactor', 'A research reactor, bought abroad.', [['mod', 'sci', 0.06, 240, 'The reactor'], ['op', 'Neshar', -15]]]],
    ['The oil state', 'Rich, modern and watched.', [['legitmod', 6, 120, 'The oil state'], ['mod', 'prod', 0.05, 240, 'Oil wealth']]],
    [['The war economy', 'Everything for the front.', [['mod', 'atk', 0.06, 240, 'War economy'], ['mod', 'ls', -2, 240, 'War economy']]],
      ['Arms from both blocs', 'Buy from east and west alike.', [n2('Karsova', 'arms'), n2('Hesperia', 'arms')]],
      ['The people’s army', 'A militia of the party.', [['troops', 0.08], ['mod', 'coup', -0.3, 240, 'The party militia']]]],
    ['The armed republic', 'The largest army in the Old Lands.', [['legitmod', 6, 120, 'The armed republic'], ['mod', 'atk', 0.06, 240, 'The armed republic']]]);
  br('Amaran', 1950, ['The years in the camps', 'The camps are a country now: its schools, its organisations and its grief.', [['legitmod', 2, 60, 'The camps']]],
    [['The registry of villages', 'A record of every family’s village, key and deed.', [['legitmod', 4, 120, 'The registry']]],
      ['The stones', 'Children with stones against soldiers with rifles; the cameras watch.', [['opAll', 6], ['op', 'Neshar', -10], ['dep', 'res', 8]]],
      ['The general strike of the territories', 'Every shop shut, every worker home, every tax unpaid.', [['mod', 'unrest', 4, 24, 'The strike'], ['op', 'Neshar', -10], ['opAll', 4]]]],
    ['The uprising', 'A generation that has never known anything but occupation rises.', [['legitmod', 6, 120, 'The uprising'], ['fervor', 15]]],
    [['The state in exile', 'Ministries, embassies and a parliament abroad.', [['opAll', 6], ['legitmod', 4, 120, 'The state in exile']]],
      ['The diaspora’s money', 'Engineers in the oil kingdoms fund the cause.', [['gold', 120], n2('Sahrem', 'treaty')]],
      ['Recognition', 'A hundred states recognise us.', [['opAll', 8]]]],
    ['A state on paper', 'Recognised by the world, and still without its land.', [['legitmod', 6, 120, 'Recognition'], ['opAll', 6]]]);
  br('Tyrrha', 1960, ['The golden decade', 'Banks, beaches and casinos: Tyrrha is rich. The poor south is not.', [['gold', 60]]],
    [['Reconstruction', 'After every war, the builders.', [['build', B.CITY, 1], ['mod', 'trade', 0.04, 240, 'Reconstruction']]],
      ['The airline', 'A national airline to three continents.', [['mod', 'trade', 0.05, 240, 'The airline']]],
      ['The university of the region', 'Students from every Old Lands state.', [['mod', 'sci', 0.05, 240, 'The university'], ['opAll', 3]]]],
    ['The Jewel of the Old Lands', 'Glamorous, fragile, and loved.', [['legitmod', 6, 120, 'The Jewel of the Old Lands'], ['mod', 'trade', 0.06, 240, 'Glamour']]],
    [['The militia state', 'Each confession its own state within the state.', [['nq', -15], ['mod', 'def', 0.06, 240, 'Militias']]],
      ['Foreign patrons', 'Each militia its own foreign friend.', [n2('Varanth', 'arms'), n2('Khemra', 'arms')]],
      ['The green line', 'A front through the capital.', [['mod', 'def', 0.08, 240, 'The green line'], ['mod', 'trade', -0.06, 240, 'The green line']]]],
    ['The divided capital', 'Two cities, one name.', [['legitmod', 4, 120, 'The divided capital'], ['mod', 'def', 0.06, 240, 'Fortified quarters']]]);
  br('Sahrem', 1970, ['After the price rose', 'The oil price has quadrupled. The kingdom has more money than it can spend, and must decide how to try.', [['gold', 100]]],
    [['The sovereign fund', 'A share of every great company on earth.', [['mod', 'rev', 0.08, 240, 'The sovereign fund']]],
      ['Desalination', 'Water from the sea.', [['mod', 'food', 0.06, 240, 'Desalination']]],
      ['Universities for the princesses', 'Women’s universities, over the scholars’ objections.', [['mod', 'sci', 0.05, 240, 'Women’s universities'], ['sup', 'clergy', -6]]]],
    ['The kingdom of tomorrow', 'Oil turned into a country.', [['legitmod', 6, 120, 'The kingdom of tomorrow'], ['mod', 'ls', 3, 240, 'Oil wealth']]],
    [['The guardians of the faith abroad', 'Shrines and schools on three continents.', [['subvertNb', 6], ['sup', 'clergy', 8]]],
      ['The religious police', 'Morals enforced in every street.', [['mod', 'unrest', -3, 240, 'The religious police'], ['sup', 'intelligentsia', -6]]],
      ['Aid for the brethren', 'Money for fighters of the faith abroad.', [n2('Amaran', 'aid'), ['opAll', -3]]]],
    ['The fortress of the faith', 'The faith is the state, and the state is rich.', [['legitmod', 6, 120, 'The fortress of the faith'], ['sup', 'clergy', 10]]]);
  br('Zandar', 1965, ['The great civilisation', 'Oil money and a plan to make the plateau a great power in a generation.', [['gold', 60]]],
    [['The nuclear programme', 'Twenty reactors, bought abroad.', [['mod', 'sci', 0.06, 240, 'Nuclear programme'], ['op', 'Baskhar', -8]]],
      ['The steel mill', 'Karsova builds it, the Shah opens it.', [n2('Karsova', 'treaty'), ['build', B.FACTORY, 2]]],
      ['The gendarme’s navy', 'A fleet for the gulf.', [['mod', 'navy', 0.4, 240, 'The gulf fleet']]]],
    ['The fifth power', 'In ten years, the Shah says.', [['legitmod', 6, 120, 'The fifth power'], ['mod', 'prod', 0.05, 240, 'Industry']]],
    [['The bazaar republic', 'Let the merchants and the shrines run the economy.', [['sup', 'capital', 6], ['sup', 'clergy', 6]]],
      ['Cooperatives of the faithful', 'Charity and credit through the shrines.', [['mod', 'ls', 2, 240, 'Charity']]],
      ['Neither east nor west', 'Leave the alliance.', [['opAll', -3], ['sig', 10]]]],
    ['The independent plateau', 'Nobody’s gendarme.', [['legitmod', 6, 120, 'The independent plateau'], ['mod', 'def', 0.06, 240, 'Independence']]]);

  /* Amaran and Tyrrha are small and their stories short; one more early programme each */
  for (const [base, id, name, desc, fx, req] of [
    ['Amaran', 'am_hills', 'The hill villages’ guard', 'Night watchmen and old rifles for every village on the hills.', [['mod', 'def', 0.05, 240, 'The village guard'], ['front', 'return', -3]], 'am_villages'],
    ['Tyrrha', 'ty_press', 'The free press of the Old Lands', 'Newspapers banned everywhere else in the region are printed here.', [['sup', 'intelligentsia', 6], ['subvertNb', 4]], 'ty_schools'],
  ]) { const L = ID.FOCUS.nations[base]; if (L) L.push({ id, name, desc, fx, x: 1, y: 3, days: 140, req: [req] }); }

  /* ================================================================ ideology trees: a late pair */
  const late = (ideo, a, b) => {
    const T = ID.FOCUS.ideos[ideo]; if (!T) return;
    const last = T[T.length - 1], pre = last.id.split('_i_')[0] + '_i_';
    T.push({ id: pre + 'la', name: a[0], desc: a[1], fx: a[2], x: 0, y: 5, days: 180, req: [last.id], excl: [pre + 'lb'], year: 1958, ideos: [ideo] });
    T.push({ id: pre + 'lb', name: b[0], desc: b[1], fx: b[2], x: 1, y: 5, days: 180, req: [last.id], excl: [pre + 'la'], year: 1958, ideos: [ideo] });
  };
  late('ml', ['The thaw', 'Rehabilitate the purged and let the poets publish.', [['sup', 'intelligentsia', 8], ['discipline', -6], ['mod', 'unrest', -3, 240, 'The thaw']]], ['Stability of cadres', 'Nobody is removed; nobody is promoted.', [['discipline', 8], ['mod', 'coup', -0.3, 240, 'Stability of cadres'], ['bureau', 6]]]);
  late('trot', ['The world party', 'Sections in fifty countries.', [['subvertNb', 8], ['opAll', -4]]], ['The workers’ state reformed', 'Councils with real elections.', [['particip', 10], ['sup', 'workers', 6]]]);
  late('council', ['The federation of federations', 'Councils linked across borders.', [['subvertNb', 6], ['particip', 6]]], ['Councils and computers', 'The plan computed by the councils.', [['mod', 'eff', 0.05, 240, 'Computed councils']]]);
  late('mao', ['Continuing revolution', 'Bombard the headquarters again.', [['fervor', 15], ['discipline', -10]]], ['Four modernisations', 'Agriculture, industry, defence, science.', [['mod', 'prod', 0.06, 240, 'Four modernisations'], ['fervor', -10]]]);
  late('marketsoc', ['Worker shareholders', 'Every worker owns shares in the firm.', [['sup', 'workers', 6], ['mod', 'prod', 0.04, 240, 'Shares']]], ['The open market', 'Competition between cooperatives.', [['mod', 'eff', 0.05, 240, 'Competition']]]);
  late('demsoc', ['The commanding heights', 'Banks and heavy industry public.', [['sup', 'capital', -10], ['mod', 'prod', 0.04, 240, 'Public industry']]], ['The mixed road', 'A truce with capital.', [['sup', 'capital', 8], ['mod', 'conf', 6, 240, 'Truce']]]);
  late('ansyn', ['One big union', 'Every worker in one federation.', [['sup', 'workers', 10], ['particip', 6]]], ['The free communes', 'The federation loosened.', [['particip', 10], ['mod', 'eff', -0.03, 240, 'Looser federation']]]);
  late('ancom', ['The gift economy', 'No money at all.', [['particip', 10], ['mod', 'ls', 2, 240, 'Free goods']]], ['The armed communes', 'Every commune a fortress.', [['mod', 'def', 0.08, 240, 'Armed communes']]]);
  late('liberal', ['Deregulation', 'Fewer rules, more markets.', [['mod', 'prod', 0.05, 240, 'Deregulation'], ['sup', 'workers', -6]]], ['The civil liberties act', 'Rights entrenched.', [['sup', 'intelligentsia', 8], ['mod', 'legit', 3, 240, 'Rights']]]);
  late('socdem', ['The full welfare state', 'Cradle to grave.', [['mod', 'ls', 3, 240, 'Welfare state'], ['gold', -80]]], ['The third way', 'Markets with a conscience.', [['mod', 'conf', 6, 240, 'Third way'], ['sup', 'capital', 6]]]);
  late('minarchy', ['The charter cities', 'Cities run by companies.', [['mod', 'trade', 0.06, 240, 'Charter cities']]], ['The citizens’ militia', 'Every citizen armed.', [['mod', 'def', 0.08, 240, 'Citizen militia']]]);
  late('ancap', ['Private space', 'Rockets built on contract, launched from a private pad, insured at the exchange’s rates.', [['mod', 'sci', 0.06, 240, 'Private space'], ['gold', -100]]], ['The insurance state', 'Every risk priced, every resident insured, every agency audited by the insurers.', [['mod', 'unrest', -3, 240, 'The insurance state'], ['sig', 6]]]);
  late('conmon', ['The people’s monarchy', 'The crown on television.', [['tradition', 6], ['legitmod', 4, 120, 'The people’s monarchy']]], ['A crowned republic', 'The crown as a ceremony.', [['particip', 8], ['tradition', -6]]]);
  late('absmon', ['The white revolution', 'Reform from the throne.', [['mod', 'sci', 0.06, 240, 'Reform'], ['sup', 'clergy', -6]]], ['The eternal throne', 'Nothing changes.', [['tradition', 10], ['mod', 'coup', -0.2, 240, 'The guard']]]);
  late('theocracy', ['The council of scholars', 'Rule by the learned.', [['mod', 'eff', 0.04, 240, 'Scholars']]], ['Missions to the world', 'Preachers everywhere.', [['subvertNb', 6]]]);
  late('agrarian', ['The green revolution', 'New seeds, new yields.', [['mod', 'food', 0.08, 240, 'Green revolution']]], ['The village republic', 'Every village self-governing.', [['particip', 8]]]);
  late('junta', ['Return to the barracks', 'Elections, eventually.', [['drift', 'liberal', 15], ['mandate', 8]]], ['The national security state', 'Permanent emergency.', [['mod', 'coup', -0.3, 240, 'Security state'], ['grievance', 8]]]);
  late('corporatist', ['The social market', 'Chambers and welfare.', [['mod', 'ls', 2, 240, 'Social market']]], ['The armed economy', 'Everything for defence.', [['mod', 'atk', 0.06, 240, 'Armed economy']]]);
  late('technocracy', ['The systems state', 'Government by model.', [['mod', 'eff', 0.06, 240, 'Systems']]], ['Open data', 'Every statistic published.', [['sup', 'intelligentsia', 8], ['mod', 'legit', 3, 240, 'Open data']]]);
  late('personalist', ['The dynasty', 'The leader’s son prepared.', [['mod', 'coup', -0.3, 240, 'Dynasty'], ['charisma', 6]]], ['The leader’s testament', 'A council to succeed him.', [['mod', 'stab', 4, 240, 'The testament']]]);
  late('merchant', ['The world’s exchange', 'Every currency traded here.', [['mod', 'trade', 0.08, 240, 'World exchange']]], ['The great houses united', 'One house to rule them all.', [['mod', 'eff', 0.05, 240, 'United houses']]]);
  late('cybernetic', ['The global network', 'Linked to every friendly plan.', [['mod', 'trade', 0.06, 240, 'Network'], ['opAll', 3]]], ['The self-correcting plan', 'The model plans itself.', [['mod', 'eff', 0.08, 240, 'Self-correcting plan']]]);
  late('natpop', ['The permanent campaign', 'A new enemy every year.', [['charisma', 8], ['opAll', -4]]], ['The movement settles', 'Offices instead of rallies.', [['mod', 'eff', 0.04, 240, 'Settled movement']]]);
  late('thirdpos', ['Positive neutrality', 'Aid from both, alliance with neither.', [['sig', 12], ['gold', 100]]], ['The open door', 'Foreign capital back.', [['mod', 'conf', 8, 240, 'Open door'], ['drift', 'liberal', 10]]]);
  late('pannat', ['Union or nothing', 'Every resource for unity.', [['sig', 12], ['union']]], ['Socialism in one region', 'Build the party at home.', [['mod', 'prod', 0.05, 240, 'Regional socialism']]]);
  late('revival', ['The guardianship deepened', 'One guide, final word.', [['mod', 'coup', -0.3, 240, 'Guardianship']]], ['The reformists', 'Elections among believers.', [['particip', 10], ['drift', 'liberal', 8]]]);
  late('juche', ['The red dynasty', 'The son succeeds the father, and the grandson the son.', [['tradition', 12], ['flag', 'heir']]], ['The special zones', 'A fenced city for foreign capital.', [['mod', 'trade', 0.08, 240, 'Special zones'], ['drift', 'marketsoc', 10]]]);
  late('natsyn', ['The revolution postponed', 'The employers keep the syndicates.', [['sup', 'capital', 10], ['mod', 'conf', 6, 240, 'Peace with the employers'], ['drift', 'corporatist', 10]]], ['The second revolution', 'The squads march again.', [['fervor', 12], ['sup', 'capital', -8], ['sig', 8]]]);
  late('technosoc', ['The world network', 'Every revolution wired to every other.', [['sig', 12], ['subvertNb', 10]]], ['Fully automated socialism', 'The machines make abundance at home.', [['mod', 'ls', 3, 240, 'Automated abundance'], ['mod', 'prod', 0.05, 240, 'Automated abundance']]]);
  late('nrx', ['The patchwork', 'A hundred city-companies.', [['mod', 'trade', 0.08, 240, 'The patchwork'], ['drift', 'minarchy', 10]]], ['The machine sovereign', 'The board hands its decisions to its computers.', [['mod', 'eff', 0.06, 240, 'The machine sovereign'], ['mod', 'sci', 0.08, 240, 'The machine sovereign'], ['grievance', 6]]]);
  late('natsoc', ['The new order', 'The conquered lands organised for the Realm.', [['mod', 'prod', 0.05, 240, 'The new order'], ['opAll', -6]]], ['The Leader’s succession', 'A successor named, and the party’s grip made permanent.', [['flag', 'heir'], ['mod', 'coup', -0.3, 240, 'The succession settled']]]);
  late('nazacc', ['Nothing left standing', 'Burn what cannot be held.', [['sig', 20], ['mod', 'prod', -0.1, 120, 'Nothing left standing']]], ['The last weapon', 'Everything into one final blow.', [['sig', 15], ['mod', 'atk', 0.1, 24, 'The last weapon'], ['gold', -200]]]);

  /* ================================================================ fewer flat steps */
  /* Programmes of the national trees whose effects were only numbers get one interaction, chosen by what
     they do, and their "for good" bonuses now last twenty years. Military steps unsettle the neighbours;
     economic ones open a treaty with the friendliest; social and administrative ones bind the inner circle. */
  const STRUCT = ['note2', 'war', 'ally', 'claim', 'claimsAll', 'subvert', 'subvertNb', 'op', 'flag', 'nq', 'law', 'ideology', 'build', 'techUp', 'figLoy', 'figPurge', 'figHeir', 'figLeader', 'circleLoy', 'line', 'civilwar', 'protector', 'fn', 'dep', 'oil', 'front', 'union', 'later', 'opAll', 'nbOp', 'nbTreaty'];
  const MIL = { atk: 1, def: 1, troops: 1, navy: 1, mob: 1, speed: 1, aloss: 1, cityDef: 1 }, ECO = { trade: 1, rev: 1, gold: 1, prod: 1, conf: 1 };
  let flat = 0;
  for (const base in ID.FOCUS.nations) for (const f of ID.FOCUS.nations[base].concat((ID.FOCUS.projects || {})[base] || [])) {
    if (f.dest || !f.fx || f.fx.some((x) => STRUCT.indexOf(x[0]) >= 0)) continue;
    flat++;
    for (const x of f.fx) if (x[0] === 'mod' && x[3] >= PERM) x[3] = 240;
    const keys = f.fx.map((x) => (x[0] === 'mod' ? x[1] : x[0]));
    if (keys.some((k) => MIL[k])) f.fx.push(['nbOp', -3]);
    else if (keys.some((k) => ECO[k])) f.fx.push(['nbTreaty']);
    else f.fx.push(['circleLoy', 3]);
  }
  ID.FOCUS.flatUpgraded = flat;

  /* Programmes added by the later layers that took a name already used in the same tree (often a destiny's),
     which made players think they were done. Each gets a name of its own. */
  const RENAME = { ca_xr: 'The postwar order', ca_xcb: 'The society of plenty', no_p_people: 'A kingdom for the people', dr_p_greater: 'The lost provinces regained',
    ka_p_nep: 'The market in the villages', ru_fever: 'Cool heads', ru_p_greater: 'The map on every wall', su_xca: 'Masters of the river',
    pv_f_protect: 'Under the Hesperian wing', an_f_nation: 'Nationalise without compensation' };
  for (const base in ID.FOCUS.nations) for (const f of ID.FOCUS.nations[base].concat((ID.FOCUS.projects || {})[base] || [])) if (RENAME[f.id]) f.name = RENAME[f.id];
})();
