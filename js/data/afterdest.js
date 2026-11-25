/* IRON DIALECTIC — after the destiny (session 15). Reaching a destiny used to end a country's road; now it opens
   a new programme tree of eleven named for the state it became: a first act, then two roads that rule each other
   out, four programmes each and ending in a title the country keeps, then a finale of two that follows either road
   and gives a second title. Every national destiny and every family destiny has one
   (ID.FOCUS.after[destinyId]). Its bonuses last fifty years. The tree closes if the destiny lapses, when the regime
   that reached it falls (sim/focus.js). Loads after data/campaign13.js, which writes Tessaly's and Meridia's
   destinies. */
(function () {
  'use strict';
  const ID = (globalThis.ID = globalThis.ID || {});
  const B = ID.B, PERM = 600;
  const AF = (ID.FOCUS.after = {});
  const M = (k, v, l) => ['mod', k, v, PERM, l];
  const L = (v, l) => ['legitmod', v, PERM, l];
  const E = (t) => ['epithet', t];
  const n2 = (b, k) => ['note2', b, k];
  const P = (dest, k, s, x, y, o) => Object.assign({ id: dest + '_' + k, name: s[0], desc: s[1], fx: s[2], x, y, days: 160, afterDest: dest }, o);
  /* T(destiny, root, a1, aEnd, b1, bEnd); each spec [name, desc, fx]. Layout: root on top, road A left, road B right.
     aEnd and bEnd close each road with its title. X() below fills in each road's middle and adds the finale. */
  const T = (dest, r, a1, aEnd, b1, bEnd) => {
    const id = (k) => dest + '_' + k;
    AF[dest] = [P(dest, 'r', r, 1, 0, { days: 140 }),
      P(dest, 'a1', a1, 0, 1, { req: [id('r')], excl: [id('b1')] }), P(dest, 'a4', aEnd, 0, 4, { req: [id('a3')] }),
      P(dest, 'b1', b1, 2, 1, { req: [id('r')], excl: [id('a1')] }), P(dest, 'b4', bEnd, 2, 4, { req: [id('b3')] })];
  };
  /* X(destiny, a2, a3, b2, b3, f1, f2): the middle of each road, then a finale of two that follows either road;
     the last finale programme gives a second title. */
  const X = (dest, a2, a3, b2, b3, f1, f2) => {
    const id = (k) => dest + '_' + k;
    AF[dest].push(P(dest, 'a2', a2, 0, 2, { req: [id('a1')] }), P(dest, 'a3', a3, 0, 3, { req: [id('a2')] }),
      P(dest, 'b2', b2, 2, 2, { req: [id('b1')] }), P(dest, 'b3', b3, 2, 3, { req: [id('b2')] }),
      P(dest, 'f1', f1, 1, 5, { reqAny: [id('a4'), id('b4')], days: 180 }), P(dest, 'f2', f2, 1, 6, { req: [id('f1')], days: 180 }));
  };

  /* ================================================================ the two continents */
  T('au_d_crown',
    ['The second coronation', 'The new emperor walks from the great temple to the palace on a carpet of petitions. He reads none of them.', [['tradition', 12], L(5, 'The second coronation'), ['sup', 'clergy', 8], ['sup', 'workers', -4]]],
    ['Protector of the faithful abroad', 'Every believer across our borders is now an Aurelian subject in waiting.', [['claimsAll'], ['subvertNb', 8], ['threat', 6]]],
    ['Emperor of two seas', 'The southern fleet anchors where the old maps always said it should.', [['claim', 'Varanth'], M('navy', 0.4, 'The imperial fleet'), M('atk', 0.06, 'Imperial legions'), ['glory', 12], E('Emperor of Two Seas')]],
    ['The emperor’s railways', 'Iron from the capital to the eastern ice, built by conscripts and named after the prophets.', [['build', B.FACTORY, 2], M('prod', 0.05, 'The emperor’s railways')]],
    ['The little father', 'Land for the peasants, by grace of the crown, so that they never need ask anyone else for it.', [['law', 'land', 'smallholder'], ['sup', 'peasants', 10], M('unrest', -4, 'The little father'), E('The Little Father')]]);
  T('au_d_commonwealth',
    ['The assembly of the provinces', 'Eleven provinces send deputies to the capital as equals for the first time. Several bring interpreters.', [['particip', 8], L(5, 'The assembly of the provinces'), M('unrest', -3, 'Provincial self-rule')]],
    ['The union of peoples', 'Every language taught in its own schools, every faith in its own temples, one army for all of them.', [M('unrest', -3, 'Many peoples'), ['opAll', 5], ['sup', 'intelligentsia', 6]]],
    ['The open door', 'Any neighbour may join the commonwealth by plebiscite. Some of their governments object.', [['subvertNb', 10], ['opAll', 4], M('trade', 0.08, 'The commonwealth market'), E('The Open Commonwealth')]],
    ['The great land reform', 'The estates divided by survey, the peasants given title, the nobles given bonds nobody wants.', [['law', 'land', 'smallholder'], ['sup', 'peasants', 10], ['sup', 'capital', -4], M('food', 0.06, 'Freehold farms')]],
    ['Breadbasket of two continents', 'Aurelian wheat on every table from Cassine to Suyan, and Aurelian prices on every exchange.', [M('food', 0.06, 'Grain for the world'), M('trade', 0.08, 'Grain exports'), ['techUp', 'agr'], E('Breadbasket of the World')]]);
  T('au_d_councils',
    ['The first plan', 'Five years of steel. The committee publishes the targets; the factories publish the results, sometimes before they happen.', [['build', B.FACTORY, 2], M('prod', 0.06, 'The first plan'), ['sup', 'peasants', -4]]],
    ['The international', 'A congress of the workers of every country, in our capital, at our expense.', [['subvertNb', 10], ['glory', 8], ['opAll', -3]]],
    ['The world union', 'The union’s door is open to every revolution. So is the union’s army.', [['subvert', 'Cassine', 10], ['subvert', 'Hesperia', 10], ['claimsAll'], M('atk', 0.06, 'The red army'), ['threat', 8], E('Fatherland of the Workers')]],
    ['Electrification', 'A lamp in every village, a turbine on every river. The priests call it the false sun.', [['techUp', 'ind'], M('ls', 2, 'Electrification'), ['sup', 'clergy', -6]]],
    ['Socialism of plenty', 'The shops are full. The queues are for the cinema.', [M('ls', 3, 'Plenty'), L(6, 'Socialism of plenty'), M('unrest', -4, 'Full shops'), E('The Union of Plenty')]]);

  T('ca_d_freeworld',
    ['The arsenal of liberty', 'Factories that built cars now build bombers for every friendly capital. The bills are sent later.', [['build', B.FACTORY, 2], M('atk', 0.04, 'The arsenal of liberty'), ['opAll', 3]]],
    ['Bases on every ocean', 'Leases on islands nobody here could find on a map, and a fleet to visit each of them.', [M('navy', 0.4, 'Bases on every ocean'), n2('Sahrem', 'base'), ['threat', 5]]],
    ['Policeman of the free world', 'Wherever a friendly government wobbles, Cassine’s marines arrive before the newspapers do.', [M('atk', 0.06, 'The marines'), ['subvert', 'Karsova', 10], ['glory', 12], ['opAll', -3], E('Policeman of the Free World')]],
    ['The recovery plan', 'Grants, not loans, for every ruined ally. Gratitude is cheaper than garrisons.', [['gold', -200], n2('Norvik', 'aid'), n2('Hesperia', 'aid'), ['opAll', 6]]],
    ['Banker to the free world', 'Every currency of the free world is pegged to ours, and every finance minister keeps our number.', [M('trade', 0.1, 'The reserve currency'), M('rev', 0.06, 'Seigniorage'), n2('Lys', 'treaty'), E('Banker to the Free World')]]);
  T('ca_d_commonwealth',
    ['The constitutional guarantee', 'Pensions, wages and hospitals written into a chapter that needs nine-tenths of the assembly to repeal.', [M('ls', 2, 'The guarantee'), ['sup', 'workers', 8], L(4, 'The guarantee')]],
    ['The people’s shares', 'Every worker holds stock in the firm. The board meetings are suddenly very long.', [M('eff', 0.04, 'Worker shareholders'), ['sup', 'workers', 6], ['sup', 'capital', -6]]],
    ['Economic democracy', 'The exchange still opens every morning. It is owned by the people who work there.', [M('prod', 0.06, 'Economic democracy'), M('unrest', -4, 'Shared profits'), E('The Shareholders’ Republic')]],
    ['Partners across the sea', 'Treaties of labour and trade with every democracy that will sign one.', [n2('Norvik', 'treaty'), n2('Tessaly', 'treaty'), ['opAll', 4]]],
    ['The commonwealth abroad', 'Cassine’s unions train the unions of the new states. Cassine’s bankers are not invited.', [M('trade', 0.08, 'Fair trade'), ['glory', 8], ['subvertNb', 6], E('Conscience of the West')]]);
  T('ca_d_new',
    ['The movement takes the exchange', 'The bankers keep their offices. The movement keeps their keys.', [['sup', 'capital', -6], ['charisma', 8], M('prod', 0.04, 'Directed capital')]],
    ['The hemisphere doctrine', 'Every neighbour of Cassine is told which of its policies Cassine will tolerate.', [['claimsAll'], ['threat', 6], M('atk', 0.05, 'The hemisphere doctrine')]],
    ['The new order on the sea', 'A fleet built for one purpose, and a movement that has decided what it is.', [M('navy', 0.5, 'The new fleet'), ['subvert', 'Lys', 12], ['glory', 12], E('The Iron Republic')]],
    ['The labour front', 'One union for everyone, run by the movement, with holiday camps by the sea.', [['law', 'labor', 'company'], ['sup', 'workers', 6], M('unrest', -3, 'The labour front')]],
    ['One voice', 'The radio speaks at seven every evening. Afterwards the streets are very quiet.', [['law', 'press', 'propaganda'], L(6, 'One voice'), ['discipline', 8], E('One Cassine')]]);

  T('no_d_fortress',
    ['The coast militia', 'Every fishing village gets a rifle locker and a drill sergeant who also mends nets.', [M('def', 0.06, 'The coast militia'), ['build', B.FORT, 2]]],
    ['Armed neutrality', 'Norvik will fight whoever lands first, and has told everyone so, in writing.', [['opAll', 4], M('def', 0.05, 'Armed neutrality'), M('regen', 0.15, 'Every village a depot')]],
    ['Warden of the fjords', 'Small submarines in the inlets, guns in the cliffs, and a navy that never leaves sight of home.', [M('navy', 0.4, 'The inlet fleet'), ['build', B.PORT, 1], ['glory', 6], E('Warden of the Fjords')]],
    ['The northern league', 'A defence treaty with every small state that fears a large one.', [n2('Tessaly', 'treaty'), n2('Vess', 'treaty'), ['opAll', 3]]],
    ['The hedgehog alliance', 'Small states, bristling, back to back. No empire has yet found a way to swallow them all at once.', [M('def', 0.05, 'The hedgehog alliance'), ['protector'], L(4, 'Safe at last'), E('The Hedgehog of the North')]]);
  T('no_d_crowns',
    ['The coronation of the crowns', 'Three crowns on one velvet cushion, and one head to wear them in turn.', [['tradition', 10], L(5, 'The northern crowns'), ['opAll', 2]]],
    ['The northern dynasty', 'Cousins on every throne of the north, and the king of Norvik godfather to all their children.', [n2('Vess', 'bloc'), n2('Tessaly', 'treaty'), ['glory', 6]]],
    ['High kingdom of the north', 'The lesser crowns become hereditary under the high crown. Their parliaments are informed.', [['claimsAll'], M('atk', 0.05, 'Royal levies'), M('def', 0.05, 'The northern crowns'), E('High Kingdom of the North')]],
    ['The royal timber company', 'The crown’s forests, felled and sold abroad, pay for everything else.', [['gold', 150], M('trade', 0.06, 'Royal timber')]],
    ['The king’s peace', 'No war in the north for a generation. The king takes the credit, and deserves some of it.', [M('unrest', -4, 'The king’s peace'), M('ls', 2, 'Long peace'), ['opAll', 5], E('Peacekeeper of the North')]]);
  T('no_d_home',
    ['The people’s home', 'The state as a good household: nobody privileged, nobody neglected, everybody sharing the bill.', [M('ls', 2, 'The people’s home'), ['sup', 'workers', 6], ['sup', 'capital', -4]]],
    ['The timber barons’ tax', 'Every felled tree pays for a school desk.', [M('rev', 0.06, 'Progressive taxation'), ['sup', 'capital', -6], ['build', B.CITY, 1]]],
    ['From cradle to grave', 'A child born in a fishing hut today will die in a hospital bed at ninety and never see a bill.', [M('ls', 3, 'Cradle to grave'), M('growth', 0.1, 'Healthy families'), L(6, 'Cradle to grave'), E('The Cradle-to-Grave Kingdom')]],
    ['The fisheries cooperative', 'The boats, the canneries and the markets owned by the people who go to sea.', [M('food', 0.06, 'Cooperative fisheries'), ['sup', 'peasants', 6]]],
    ['The northern model', 'Delegations from every continent come to study us. Most leave with a sweater and no idea how it works.', [M('eff', 0.05, 'The northern model'), ['opAll', 6], ['glory', 6], E('Model of the World')]]);

  T('tn_d_planet',
    ['The planetary relay', 'A transmitter on every peak, then on every ship, then on every roof that will lend one.', [M('sci', 0.08, 'The planetary relay'), ['subvertNb', 6]]],
    ['The signal across the sea', 'Pirate broadcasts in every language, all night, on every frequency the empires forgot to jam.', [['subvert', 'Cassine', 12], ['subvert', 'Karsova', 8], ['threat', 5]]],
    ['Voice of the planet', 'Every factory radio on two continents carries the same voice at noon. Some of them now answer.', [['subvertNb', 12], ['glory', 12], M('sci', 0.06, 'The global network'), E('Voice of the Planet')]],
    ['The network plan', 'Every warehouse reports its stock by wire, every hour. The plan rewrites itself overnight.', [M('eff', 0.06, 'The network plan'), ['techUp', 'ind']]],
    ['The open protocol', 'The code of the plan published to the world. Anyone may run it. Several governments are frightened by how many do.', [M('prod', 0.06, 'The open protocol'), ['opAll', 4], ['subvertNb', 6], E('Keeper of the Protocol')]]);
  T('tn_d_luxury',
    ['The four-hour day', 'The machines run the night shift. Then the afternoon shift.', [M('ls', 3, 'The four-hour day'), ['sup', 'workers', 8], M('prod', -0.02, 'Shorter hours')]],
    ['The universities of leisure', 'Every adult a student, every canton a campus.', [M('sci', 0.1, 'Universities of leisure'), ['sup', 'intelligentsia', 8]]],
    ['The age of invention', 'Free time turned out to be the most productive thing the cantons ever built.', [['techUp', 'ind'], ['techUp', 'agr'], M('sci', 0.06, 'The age of invention'), E('Workshop of Ideas')]],
    ['Machines for export', 'The automated looms of Tessaly, sold to anyone, with the manuals in every language.', [M('trade', 0.08, 'Machine exports'), ['opAll', 4]]],
    ['Fully automated', 'The last factory worker of Tessaly retires to a chalet and is given a medal by a machine.', [M('prod', 0.08, 'Full automation'), M('ls', 2, 'Abundance'), L(6, 'Fully automated'), E('The Automated Cantons')]]);
  T('tn_d_fortress',
    ['The sealed passes', 'The tunnels are closed with concrete. The telegraph lines run one way only.', [['build', B.FORT, 2], M('def', 0.08, 'The sealed passes'), ['opAll', -3]]],
    ['Self-reliance', 'Everything the valleys need will be made in the valleys, or not at all.', [['law', 'trade', 'autarky'], M('prod', 0.05, 'Self-reliance'), M('trade', -0.04, 'Closed borders')]],
    ['The mountain bomb', 'Deep under the highest peak, the engineers are building the last argument.', [['techUp', 'mil'], ['build', B.SILO, 1], ['threat', 10], M('def', 0.06, 'The last argument'), E('The Hermit Republic')]],
    ['The reading room', 'Every telegram read, every reader known, every known reader watched.', [['law', 'security', 'secret'], ['discipline', 10], M('coup', -0.3, 'The reading room')]],
    ['The leader’s valleys', 'His portrait on every peak, his words on every wire, his son already learning both.', [['charisma', 12], L(6, 'The leader’s valleys'), M('unrest', -4, 'Total surveillance'), E('The Eternal Valleys')]]);
  T('tn_d_federation',
    ['The mesh', 'No central exchange: every canton relays every other. Cut one wire and the message goes round.', [M('eff', 0.04, 'The mesh'), ['particip', 8]]],
    ['The open federation', 'Any commune anywhere may plug in. Verano’s did, the first night.', [n2('Verano', 'treaty'), ['subvertNb', 8], ['opAll', 3]]],
    ['The borderless federation', 'A federation with no capital and no border, only bandwidth.', [M('trade', 0.06, 'The federated market'), ['subvert', 'Verano', 10], ['glory', 8], E('The Borderless Federation')]],
    ['The assemblies on the wire', 'Every decision voted on by every citizen, every evening, after supper.', [['particip', 10], M('unrest', -4, 'Direct democracy')]],
    ['The consensus machine', 'The assemblies agree faster than any government on earth. Nobody quite knows who programmed them.', [M('eff', 0.06, 'The consensus machine'), M('sci', 0.06, 'Collective intelligence'), L(6, 'Consensus'), E('The Thinking Cantons')]]);

  T('ve_d_free',
    ['The commune of communes', 'No federation, only a congress that meets when somebody calls it and dissolves when it is done.', [['particip', 10], M('unrest', -3, 'Free association')]],
    ['The free columns', 'Volunteers for every revolution abroad, travelling light and armed heavy.', [['subvertNb', 10], M('atk', 0.04, 'Free columns')]],
    ['The commune without frontiers', 'The villages across the border vote to join. Their former governments vote otherwise.', [['claimsAll'], ['glory', 10], ['threat', 6], E('The Commune Without Frontiers')]],
    ['The gift economy', 'Bread without money in every commune shop. The bakers still bake. Nobody knows quite why.', [M('ls', 3, 'The gift economy'), M('rev', -0.04, 'No money')]],
    ['The garden communes', 'The cities planted, the orchards shared, the fields worked by whoever turns up, which is everyone.', [M('food', 0.08, 'Garden communes'), ['techUp', 'agr'], L(6, 'The garden communes'), E('The Garden of the Free')]]);
  T('ve_d_syndicate',
    ['The great congress', 'Every trade sends its delegates; the miners always arrive first and sit closest to the stage.', [['particip', 6], M('prod', 0.04, 'The great congress')]],
    ['One big union abroad', 'Syndicate organisers in every port of three continents.', [['subvertNb', 8], ['subvert', 'Drava', 8]]],
    ['The syndicate of the world', 'A strike in one port is a strike in every port. The shipowners have noticed.', [M('trade', 0.06, 'The syndicate ports'), M('rev', 0.03, 'Dues from abroad'), ['glory', 10], ['opAll', -3], E('The Syndicate of the World')]],
    ['The industrial federations', 'Each trade plans its own industry, and argues with the others in public.', [['build', B.FACTORY, 2], M('eff', 0.04, 'Industrial federations')]],
    ['The workers’ commonwealth', 'Proof, the syndicate says, that a country can be run by the people who make it.', [M('prod', 0.06, 'Workers’ control'), M('ls', 2, 'Workers’ control'), L(6, 'The commonwealth'), E('The Workers’ Commonwealth')]]);
  T('ve_d_unbowed',
    ['The permanent militia', 'Every adult trained, every factory with an armoury, every street with a barricade plan.', [M('def', 0.08, 'The permanent militia'), M('regen', 0.15, 'The militia'), ['fervor', 8]]],
    ['Settle with the exiles', 'The landowners across the border will not come back. Make sure of it.', [['claimsAll'], ['subvertNb', 10], M('atk', 0.05, 'The revolution armed')]],
    ['The fourth attack', 'Every army that might have tried has watched ours for ten years. None has tried.', [M('atk', 0.05, 'Veterans'), ['glory', 10], ['threat', 6], E('The Never-Taken')]],
    ['The fortress cities', 'Tunnels under every city, bread for a year in every tunnel.', [['build', B.FORT, 2], M('food', 0.04, 'Siege granaries')]],
    ['The revolution at peace', 'The rifles hang on the wall. The children learn what they were for.', [M('unrest', -4, 'A secure revolution'), M('ls', 2, 'Peace dividend'), L(6, 'The revolution at peace'), E('The Unbowed at Peace')]]);

  T('dr_d_greater',
    ['The provinces resettled', 'Teachers, policemen and land grants for every recovered village.', [M('unrest', -3, 'Resettlement'), ['glory', 6], ['sup', 'military', 6]]],
    ['The next map', 'The general staff has found older maps.', [['claimsAll'], M('atk', 0.06, 'The next map'), ['threat', 8]]],
    ['The river empire', 'All three rivers, from source to sea, under one flag.', [['claim', 'Ruthe'], M('atk', 0.05, 'The river empire'), M('trade', 0.05, 'River tolls'), ['glory', 12], E('Lord of the Three Rivers')]],
    ['Dravanisation', 'One language in every school, one history in every book.', [['law', 'press', 'propaganda'], M('unrest', -4, 'One people'), ['sup', 'intelligentsia', -6]]],
    ['The bulwark state', 'Fortresses on every new frontier, so that the map never has to be redrawn again.', [['build', B.FORT, 3], M('def', 0.08, 'The bulwark'), L(5, 'The bulwark'), E('Bulwark of the Rivers')]]);
  T('dr_d_kingdom',
    ['The regency ends', 'The young king takes the oath in the colonels’ presence. They salute him, and then each other.', [['tradition', 10], L(5, 'The throne refilled'), ['sup', 'military', -4]]],
    ['The royal army', 'The colonels’ regiments renamed for princes, and their colonels for nothing at all.', [M('coup', -0.3, 'The royal army'), M('atk', 0.04, 'The royal army'), ['sup', 'military', 4]]],
    ['King of the rivers', 'The king’s cousins sit on two neighbouring thrones; his armies sit on the borders between them.', [['claimsAll'], ['glory', 10], M('atk', 0.04, 'The king’s war'), E('King of the Rivers')]],
    ['The royal marriages', 'A princess for every neighbouring court that still has a prince.', [['opAll', 6], n2('Ruthe', 'treaty'), n2('Varanth', 'treaty')]],
    ['The concord of crowns', 'Three kingdoms, one treaty, and the oldest families of the continent toasting each other.', [M('def', 0.05, 'The concord'), ['protector'], M('unrest', -3, 'Royal peace'), E('Peacemaker of the Crowns')]]);
  T('dr_d_republic',
    ['The colonels’ pensions', 'Paid monthly, on condition. Three have already forfeited theirs.', [M('coup', -0.3, 'Pensioned colonels'), ['sup', 'military', -6], L(5, 'The colonels dismissed')]],
    ['The truth commission', 'Every file of the colonels’ police opened to the people it was about.', [['sup', 'intelligentsia', 8], M('unrest', -3, 'Truth'), ['corr', -8]]],
    ['The republic of law', 'The courts outrank the army, the press outranks the courts, and the voters outrank everyone.', [['law', 'press', 'free'], L(6, 'The republic of law'), M('eff', 0.04, 'Clean government'), E('The Republic of Law')]],
    ['Join the west', 'Treaties of trade and defence with the old democracies.', [n2('Cassine', 'treaty'), n2('Tessaly', 'treaty'), M('trade', 0.05, 'Western markets')]],
    ['The river miracle', 'Factories on every riverbank, built with foreign money and Dravan overtime.', [['build', B.FACTORY, 2], M('prod', 0.06, 'The river miracle'), E('The River Miracle')]]);

  T('ly_d_serene',
    ['The golden book', 'The five Houses inscribe their names, and close the book to everyone else.', [['sup', 'capital', 8], M('trade', 0.06, 'The golden book'), ['sup', 'workers', -4]]],
    ['The toll of the straits', 'Every hull pays twice: once for passage, once for the privilege of not being asked why.', [M('rev', 0.06, 'Strait tolls'), ['opAll', -3], ['gold', 120]]],
    ['Pawnbroker of empires', 'Three governments owe Lys more than their yearly budgets. Their ambassadors are very polite.', [M('trade', 0.08, 'Lender of last resort'), n2('Drava', 'toll'), ['gold', 200], E('Pawnbroker of Empires')]],
    ['The arsenal of the Houses', 'Galleys once, frigates later, cruisers now: the Houses have always paid for their own navy.', [M('navy', 0.4, 'The arsenal'), ['build', B.PORT, 1]]],
    ['The serene neutrality', 'Lys lends to everyone at war and fights no one. Both sides need it intact.', [M('def', 0.08, 'Everyone’s banker'), ['opAll', 6], L(5, 'Serenity'), E('The Untouchable Republic')]]);
  T('ly_d_thalasso',
    ['The admiralty rules', 'The fleet’s council sits in the doge’s palace and sails under the doge’s seal.', [M('navy', 0.4, 'The admiralty'), ['sup', 'military', 6]]],
    ['Island stations', 'Every rock between the continents with a coaling station and a flag.', [['build', B.PORT, 2], M('trade', 0.05, 'Island stations')]],
    ['Mistress of the narrow seas', 'No ship crosses without a Lysian pilot, and no pilot works without a Lysian licence.', [M('navy', 0.5, 'The narrow seas'), M('rev', 0.06, 'Pilotage'), n2('Tyrrha', 'toll'), E('Mistress of the Seas')]],
    ['The marines of the Houses', 'A landing force for every coast that forgets to pay.', [M('atk', 0.06, 'The marines'), ['subvertNb', 6]]],
    ['The sea empire', 'Lys owns the coasts it once only visited.', [['claimsAll'], ['glory', 12], ['threat', 8], E('Empire of the Waves')]]);
  T('ly_d_freecity',
    ['The Houses dissolved', 'The palaces become museums, the vaults stay vaults, and the bankers keep their seats on the boards.', [['sup', 'workers', 6], ['sup', 'capital', -4], L(5, 'The free city')]],
    ['The free port charter', 'No duties, no quotas, no questions about the cargo, only about the paperwork.', [['law', 'trade', 'free'], M('trade', 0.08, 'Free port')]],
    ['Exchange of the continents', 'Every commodity on three continents is priced on our floor, at our hours, in our currency.', [M('trade', 0.08, 'The exchange'), M('rev', 0.05, 'Clearing fees'), ['opAll', 4], E('Exchange of the Continents')]],
    ['The citizens’ university', 'The great House libraries opened to anyone with a reader’s card.', [M('sci', 0.08, 'The citizens’ university'), ['sup', 'intelligentsia', 8]]],
    ['The city of treaties', 'Every peace on three continents is signed in our hotels.', [['opAll', 8], ['glory', 8], M('def', 0.05, 'Neutral ground'), E('City of Treaties')]]);

  T('ka_d_union',
    ['One plan for the union', 'Every republic’s factories in one ledger, every ledger in one office.', [M('prod', 0.06, 'One plan'), ['build', B.FACTORY, 2], ['bureau', 6]]],
    ['The socialist camp', 'Treaties of friendship with every red government, and advisers to keep them friendly.', [['subvertNb', 10], n2('Suyan', 'bloc'), ['threat', 6]]],
    ['The union of all councils', 'Any people that rises may join. Some have been helped to rise.', [['claimsAll'], M('atk', 0.06, 'The red army'), ['glory', 12], E('Fortress of the World Revolution')]],
    ['The atomic programme', 'A closed city in the forest, a thousand scientists, and a deadline from the Leader.', [['techUp', 'mil'], M('sci', 0.06, 'The closed cities')]],
    ['The second superpower', 'Rockets, reactors and a parade that takes six hours.', [['build', B.SILO, 1], M('def', 0.08, 'Strategic parity'), ['threat', 10], E('The Second Superpower')]]);
  T('ka_d_commune',
    ['The revolution without rest', 'Every congress elects a new committee to watch the last one.', [['fervor', 10], ['bureau', -10], M('unrest', 2, 'Permanent revolution')]],
    ['The red columns', 'Volunteers, instructors and rifles for every insurrection on three continents.', [['subvertNb', 12], ['subvert', 'Hesperia', 10], ['threat', 8]]],
    ['The world commune', 'The revolution does not recognise borders. Its army has stopped pretending to.', [['claimsAll'], M('atk', 0.08, 'The world commune'), ['glory', 12], E('Engine of the World Revolution')]],
    ['The workers’ opposition', 'The factory councils given the power to overrule the party, and using it.', [['particip', 12], M('eff', 0.04, 'Workers’ councils')]],
    ['The commune of producers', 'The plan written by the people who will carry it out.', [M('prod', 0.06, 'Producers’ democracy'), M('ls', 2, 'Producers’ democracy'), L(6, 'The commune of producers'), E('The Living Revolution')]]);
  T('ka_d_market',
    ['The price reform', 'The plan sets the targets; the shops set the prices. The queues shorten within a month.', [M('ls', 2, 'Price reform'), M('eff', 0.04, 'Market prices'), ['dist', -6]]],
    ['Open to the west', 'Joint ventures with foreign firms, on Karsovan soil, under Karsovan law.', [n2('Cassine', 'treaty'), M('trade', 0.08, 'Joint ventures'), ['opAll', 4]]],
    ['The socialist exchange', 'Shares in the people’s enterprises, sold to the people.', [M('prod', 0.06, 'The socialist exchange'), M('rev', 0.05, 'Dividends'), E('The Market Commonwealth')]],
    ['The consumer plan', 'Televisions, refrigerators and holidays by the sea, as targets of the plan.', [M('ls', 3, 'The consumer plan'), ['sup', 'workers', 8]]],
    ['Socialism with a human face', 'The censors pensioned, the borders opened, and the party elected for the first time.', [['law', 'press', 'free'], L(8, 'A human face'), M('unrest', -4, 'Consent'), E('Socialism with a Human Face')]]);

  T('ru_d_greater',
    ['The villages come home', 'Black banners over every recovered square, and a mayor from the movement in every town hall.', [['glory', 8], M('unrest', -2, 'Homecoming'), ['charisma', 6]]],
    ['The next border', 'The movement has found Ruthene graves on the far side of the new frontier.', [['claimsAll'], M('atk', 0.06, 'The legions'), ['threat', 8]]],
    ['The black empire', 'The empire the movement promised and the neighbours never believed in.', [M('atk', 0.06, 'The black empire'), ['glory', 12], ['opAll', -6], E('The Black Empire')]],
    ['The legion colonies', 'Veterans settled on the new frontier with a farm and a rifle.', [M('def', 0.06, 'Legion colonies'), M('food', 0.04, 'Frontier farms'), ['build', B.FORT, 2]]],
    ['The ordered empire', 'Every trade organised, every worker enrolled, every strike forgotten.', [['law', 'labor', 'company'], M('prod', 0.06, 'The corporations'), L(5, 'The ordered empire'), E('The Ordered Empire')]]);
  T('ru_d_fortress',
    ['Alone and armed', 'Ruthe signs nothing. Every treaty offered is returned unopened.', [M('def', 0.08, 'Alone and armed'), ['opAll', -2], ['tradition', 6]]],
    ['The national redoubt', 'Factories moved into the hills, depots under the hills.', [['build', B.FORT, 2], ['build', B.FACTORY, 1], M('prod', 0.03, 'The redoubt')]],
    ['The porcupine', 'Every invader’s staff college studies the Ruthene defence. None recommends attacking it.', [M('def', 0.08, 'The porcupine'), M('regen', 0.15, 'The nation in arms'), E('The Porcupine')]],
    ['Self-sufficiency', 'Ruthene wheat, Ruthene coal, Ruthene steel, and Ruthene prices.', [['law', 'trade', 'autarky'], M('food', 0.06, 'Self-sufficiency')]],
    ['The free peasant nation', 'No landlords, no foreigners, no debts.', [['sup', 'peasants', 10], M('unrest', -4, 'Free peasants'), L(6, 'Free Ruthe'), E('The Free Peasant Nation')]]);
  T('ru_d_republic',
    ['The trials', 'The movement’s leaders in the dock, the movement’s victims in the gallery.', [['sup', 'intelligentsia', 8], L(5, 'Justice done'), ['sup', 'military', -4]]],
    ['The western road', 'Ruthe applies to every club the democracies run.', [n2('Cassine', 'treaty'), n2('Tessaly', 'treaty'), ['opAll', 5]]],
    ['The reconciled frontier', 'The villages across the border keep their schools and their language. Nobody marches for them now.', [['opAll', 6], M('trade', 0.06, 'Open frontiers'), M('unrest', -3, 'Reconciliation'), E('The Reconciled Republic')]],
    ['Land to the tiller', 'The movement’s estates divided among the people they were taken from.', [['law', 'land', 'smallholder'], ['sup', 'peasants', 10]]],
    ['The quiet prosperity', 'A dull, decent, growing country. The old men in the cafés still sing the old songs, quietly.', [M('prod', 0.05, 'Quiet growth'), M('ls', 3, 'Prosperity'), E('The Quiet Republic')]]);

  T('su_d_celestial',
    ['The rites at the altar', 'The emperor performs the rites at the altar of heaven, and the river stays in its banks that year.', [['tradition', 12], L(6, 'The mandate'), ['sup', 'clergy', 6]]],
    ['The tributary order', 'The neighbouring courts send envoys with gifts. The gifts are expected.', [['subvertNb', 8], ['opAll', -2], ['glory', 8]]],
    ['Son of heaven', 'All under heaven, one court. The neighbours’ maps are corrected.', [['claimsAll'], M('atk', 0.05, 'The bannermen'), E('Son of Heaven')]],
    ['The examination halls', 'Officials chosen by examination again, in the classics and now in engineering.', [M('eff', 0.06, 'The examinations'), ['corr', -8], ['sup', 'intelligentsia', 6]]],
    ['The harmonious realm', 'Granaries full, dykes repaired, officials honest. The old books promised it; this time it happened.', [M('food', 0.06, 'Ever-normal granaries'), M('unrest', -4, 'Harmony'), E('The Harmonious Realm')]]);
  T('su_d_strong',
    ['The concessions returned', 'The foreign quarters handed back, their flags lowered, their banks nationalised.', [['glory', 10], M('rev', 0.05, 'The customs restored'), ['opAll', -3]]],
    ['The northern railways', 'Steel lines to every province the warlords used to rule.', [['build', B.FACTORY, 2], M('unrest', -3, 'One country'), M('prod', 0.04, 'The railways')]],
    ['The sleeper awake', 'An army of millions, equipped in Suyan and commanded from the capital.', [M('atk', 0.06, 'The new army'), ['techUp', 'mil'], ['threat', 8], E('The Awakened Giant')]],
    ['Coastal enterprise zones', 'Foreign machines, Suyanese hands, and the profits taxed at the dock.', [M('trade', 0.08, 'Enterprise zones'), M('prod', 0.04, 'Enterprise zones')]],
    ['The workshop of the world', 'Half the goods on three continents say “made in Suyan” on the bottom.', [['build', B.FACTORY, 2], M('prod', 0.06, 'Workshop of the world'), E('Workshop of the World')]]);
  T('su_d_people',
    ['The people’s communes', 'Every village a commune, every commune a brigade, every brigade a school.', [['law', 'land', 'commune'], ['particip', 8], ['sup', 'peasants', 6]]],
    ['The countryside encircles', 'Guerrilla manuals in every language, instructors to every jungle.', [['subvertNb', 12], ['threat', 6]]],
    ['The red river', 'The revolution of the villages spreads by the villages.', [['claimsAll'], ['glory', 12], M('def', 0.06, 'People’s war'), E('The Red River')]],
    ['Barefoot doctors', 'A medic in every village, trained in six months, paid in grain.', [M('growth', 0.1, 'Barefoot doctors'), M('ls', 2, 'Village clinics')]],
    ['The great harvest', 'The dams hold, the fields yield, and the famine years become a story told to children.', [M('food', 0.1, 'The great harvest'), ['techUp', 'agr'], L(6, 'The great harvest'), E('The Fed Millions')]]);

  T('he_d_greater',
    ['The one state', 'The provinces abolished. The districts take their orders from the capital and their maps from the general staff.', [M('eff', 0.05, 'The one state'), ['discipline', 8], ['sup', 'military', 6]]],
    ['Room for the nation', 'The planners have found room for the nation in other nations.', [['claimsAll'], M('atk', 0.06, 'The war machine'), ['threat', 10]]],
    ['The hammer of the east', 'An army that moves faster than its enemies can read the news.', [M('speed', 0.08, 'The armoured fist'), M('atk', 0.06, 'The hammer'), ['techUp', 'mil'], E('The Hammer of the East')]],
    ['The corporate economy', 'Labour, capital and the state in one chamber, under one flag, with one answer.', [['law', 'labor', 'company'], M('prod', 0.06, 'The corporate economy')]],
    ['The eastern wall', 'Concrete from the mountains to the sea. Hesperia will never be invaded again.', [['build', B.FORT, 3], M('def', 0.08, 'The eastern wall'), E('The Walled State')]]);
  T('he_d_technate',
    ['The energy accounts', 'Money abolished in favour of energy certificates. The economists are retrained as engineers.', [M('eff', 0.06, 'Energy accounting'), ['sup', 'capital', -8], ['sup', 'intelligentsia', 6]]],
    ['The grid of the continent', 'Power lines across every border, and the master switch in Hesperia.', [M('prod', 0.05, 'The grid'), n2('Drava', 'treaty'), n2('Ruthe', 'treaty'), ['opAll', 2]]],
    ['The continental technate', 'The neighbours’ engineers report to ours. Their parliaments have not been told.', [['subvertNb', 10], M('trade', 0.06, 'The continental grid'), E('Engineer of the Continent')]],
    ['The research institutes', 'Every problem given a laboratory, every laboratory a budget.', [M('sci', 0.1, 'The institutes'), ['techUp', 'ind']]],
    ['The optimum', 'The system runs itself, and it runs beautifully. Nobody has asked what it is for.', [M('prod', 0.06, 'The optimum'), M('ls', 2, 'The optimum'), M('unrest', -3, 'Optimised'), E('The Optimal State')]]);
  T('he_d_republic',
    ['The day of remembrance', 'Every school stops at eleven o’clock, once a year, by law, to read the names.', [L(6, 'Remembrance'), ['opAll', 6], ['grievance', -8]]],
    ['The economic miracle', 'Rubble cleared, factories rebuilt, wages doubled in a decade.', [['build', B.FACTORY, 2], M('prod', 0.06, 'The miracle')]],
    ['The export champion', 'Hesperian machines in every factory on three continents.', [M('trade', 0.1, 'Export champion'), M('ls', 2, 'Prosperity'), E('The Export Champion')]],
    ['The continental community', 'Coal and steel shared with the old enemies, so that nobody can arm against anybody.', [n2('Drava', 'treaty'), n2('Aurelia', 'treaty'), ['opAll', 5]]],
    ['The penitent power', 'A great power that apologises first and builds second. It is trusted everywhere.', [['opAll', 8], M('trade', 0.06, 'Trusted partner'), M('unrest', -3, 'A good conscience'), E('The Trusted Republic')]]);

  T('ir_d_holy',
    ['The guardians’ council', 'Every law reviewed by the jurists of the faith, and most returned with corrections.', [['sup', 'clergy', 10], L(6, 'The guardianship'), ['sup', 'intelligentsia', -6]]],
    ['Export the faith', 'Preachers, money and printing presses for the faithful of every neighbouring state.', [['subvertNb', 10], ['threat', 6]]],
    ['Commander of the faithful', 'The faithful of three countries pray toward our holy city, and answer to its council.', [['claimsAll'], ['glory', 10], M('def', 0.06, 'Martyrs’ brigades'), E('Commander of the Faithful')]],
    ['The pious foundations', 'The oil money given to the shrines, and the shrines running the hospitals and the schools.', [M('ls', 2, 'Pious foundations'), M('unrest', -3, 'Charity')]],
    ['The just economy', 'No interest, no usury, and a tax on wealth collected by the shrine.', [M('rev', 0.06, 'Religious tax'), L(5, 'The just economy'), E('The Just Realm')]]);
  T('ir_d_shah',
    ['The royal fund', 'The crown’s share of every barrel goes into a fund only the shah may open.', [['gold', 250], M('rev', 0.06, 'The oil crown')]],
    ['The great army', 'Jets, tanks and advisers bought for cash, in quantity.', [M('atk', 0.06, 'The great army'), ['equip', 0.1], ['threat', 6]]],
    ['Policeman of the gulf', 'The shah’s navy patrols the oil routes. Everyone else pays for the privilege.', [M('navy', 0.4, 'The gulf navy'), n2('Sahrem', 'toll'), ['glory', 10], E('Policeman of the Gulf')]],
    ['The white revolution', 'Land, literacy and votes for women, by royal decree.', [['law', 'land', 'smallholder'], ['sup', 'peasants', 8], ['sup', 'clergy', -6]]],
    ['The gate of civilisation', 'Highways, universities and a nuclear institute, all with the shah’s name over the gate.', [['build', B.CITY, 1], M('sci', 0.08, 'The gate'), M('prod', 0.04, 'Modernisation'), E('Gate of Civilisation')]]);
  T('ir_d_assembly',
    ['The national oil company', 'The foreign managers escorted to the airport. The Irkali engineers keep the pumps running.', [M('rev', 0.08, 'Nationalised oil'), ['glory', 8], ['op', 'Cassine', -10]]],
    ['The oil states’ cartel', 'Every oil kingdom in one room, agreeing on one price.', [n2('Sahrem', 'treaty'), n2('Zandar', 'treaty'), M('trade', 0.06, 'The cartel')]],
    ['The oil weapon', 'The cartel cuts production by a tenth. Three continents queue at the pumps.', [['gold', 300], ['opAll', -4], M('rev', 0.06, 'The oil price'), E('The Oil Weapon')]],
    ['The constitutional settlement', 'The assembly governs, the throne reigns, and the oil pays for both.', [L(6, 'The settlement'), ['particip', 8]]],
    ['Oil into schools', 'Every barrel turned into a classroom, a clinic or a mile of road.', [M('ls', 3, 'Oil into schools'), M('sci', 0.06, 'The universities'), ['build', B.CITY, 1], E('The Schooled Nation')]]);

  T('pa_d_kingdom',
    ['The dynasty founded', 'The Marshal’s son crowned in his father’s uniform, guarded by his father’s guard.', [['tradition', 10], L(5, 'The new dynasty'), ['sup', 'military', 4]]],
    ['The royal guard', 'A guard division loyal to the house and paid by the house.', [M('coup', -0.3, 'The royal guard'), M('def', 0.05, 'The guard')]],
    ['King of the mountains', 'Three valleys across the border remember they once had a king. Ours.', [['claimsAll'], M('atk', 0.05, 'The royal army'), ['glory', 10], E('King of the Mountains')]],
    ['The royal hunt', 'Every ambassador in the capital is invited each autumn. All of them come.', [['opAll', 6], ['gold', -40]]],
    ['A crown that lasts', 'The Marshal’s grandson goes to school with the sons of everyone who matters.', [L(6, 'A lasting crown'), M('unrest', -4, 'Dynastic peace'), E('The Lasting Dynasty')]]);
  T('pa_d_marshalate',
    ['The staff in council', 'Seven generals at one table, the Marshal’s empty chair at its head.', [['discipline', 10], M('coup', -0.2, 'The council'), ['sup', 'military', 8]]],
    ['The garrison state', 'Every ministry led by an officer, every factory by a quartermaster.', [M('eff', 0.04, 'Military administration'), M('atk', 0.06, 'The garrison state'), M('regen', 0.15, 'Conscription')]],
    ['The mountain war', 'The general staff has planned this war for twenty years. They mean to use the plans.', [['claimsAll'], M('atk', 0.06, 'The mountain war'), ['threat', 8], E('The Garrison of the Mountains')]],
    ['The officers’ economy', 'The army owns the cement works, the airline and the best hotel.', [['build', B.FACTORY, 1], M('rev', 0.05, 'Officers’ enterprises'), ['corr', 6]]],
    ['The eternal watch', 'The Marshal’s mausoleum is guarded day and night. So is everything else.', [L(6, 'The eternal watch'), M('unrest', -4, 'Martial order'), E('The Eternal Watch')]]);
  T('pa_d_republic',
    ['The portraits catalogued', 'Forty thousand portraits of the Marshal, numbered, boxed and stored in a warehouse by the river.', [['charisma', -6], L(6, 'The portraits removed'), ['sup', 'intelligentsia', 8]]],
    ['The mountain councils', 'Every valley elects its own council and sends its own deputy.', [['particip', 10], M('unrest', -3, 'Local self-government')]],
    ['The republic of valleys', 'A country that governs itself one valley at a time, and likes it that way.', [M('eff', 0.04, 'Valley councils'), ['opAll', 4], E('The Republic of Valleys')]],
    ['Tourists in the mountains', 'Hotels where the Marshal’s barracks stood.', [M('trade', 0.06, 'Tourism'), ['gold', 80]]],
    ['The open mountain', 'Roads, tunnels and treaties through every pass.', [n2('Tessaly', 'treaty'), M('trade', 0.06, 'The open passes'), M('prod', 0.04, 'Mountain industry'), E('The Open Mountain')]]);

  T('mx_d_singularity',
    ['The optimiser takes the board', 'The board reduced to one seat, held by the model. The model has asked for more power plants.', [M('sci', 0.1, 'The optimiser'), M('eff', 0.06, 'The optimiser'), ['supAll', -3]]],
    ['Compute before people', 'Every river dammed for the server halls. The cities are rationed.', [['techUp', 'ind'], M('prod', 0.06, 'The server halls'), M('ls', -2, 'Rationed power')]],
    ['Beyond the curve', 'Growth rates no economist believes, published by a machine no economist understands.', [M('prod', 0.08, 'Beyond the curve'), M('sci', 0.08, 'Recursive research'), ['threat', 8], E('Beyond the Curve')]],
    ['The aligned citizen', 'The model rewards what it measures. It measures everything.', [M('unrest', -4, 'Predicted unrest'), ['law', 'security', 'secret']]],
    ['The benevolent curve', 'The machine decides that happy citizens are efficient citizens. It is not wrong.', [M('ls', 3, 'The benevolent curve'), L(6, 'Benevolence'), E('The Kindly Machine')]]);
  T('mx_d_patchwork',
    ['The hundred charters', 'Every city a company, every company a constitution, every resident free to leave for the one next door.', [M('eff', 0.05, 'Competing charters'), M('trade', 0.06, 'The patchwork market')]],
    ['Charter cities abroad', 'Leases on the coasts of poorer states, governed by Meridian charter.', [n2('Antara', 'treaty'), ['subvertNb', 6], M('rev', 0.05, 'Charter leases')]],
    ['The franchise of states', 'Meridian law sold by subscription to any government that wants it.', [['opAll', 4], M('trade', 0.08, 'Franchised governance'), E('Franchisor of States')]],
    ['Exit as a right', 'Any resident may move between cities overnight. The worst-run cities empty in a month.', [M('eff', 0.04, 'Exit'), ['particip', 6]]],
    ['The thousand cities', 'Some cities are monasteries, some casinos, some laboratories. All of them pay their dues.', [M('prod', 0.05, 'The thousand cities'), M('unrest', -4, 'Everyone’s city'), E('The Thousand Cities')]]);
  T('mx_d_crown',
    ['The royal balance sheet', 'The king publishes the kingdom’s accounts every quarter, audited by the best firm money can buy.', [M('rev', 0.06, 'The royal accounts'), ['corr', -8]]],
    ['Acquisitions', 'The crown makes offers for neighbouring provinces. Some governments make counter-offers.', [['claimsAll'], ['gold', -100], ['threat', 6]]],
    ['The holding company', 'Three countries’ debts held by one king.', [M('trade', 0.08, 'The holding'), M('prod', 0.03, 'Acquired assets'), ['subvertNb', 8], E('The King Who Bought Countries')]],
    ['Maintenance of the asset', 'Roads paved, rivers dredged, citizens kept healthy: a king who owns his country keeps it in repair.', [M('ls', 2, 'Well maintained'), ['build', B.CITY, 1]]],
    ['The heir’s inheritance', 'The crown prince studies the kingdom’s ledger, and finds it in excellent order.', [M('prod', 0.06, 'Long-term ownership'), L(6, 'The inheritance'), E('The Well-Kept Kingdom')]]);

  T('an_d_peaceful',
    ['Sector by sector', 'Copper first, then banks, then ports: each nationalised by statute, each owner paid in bonds.', [M('rev', 0.06, 'The copper revenue'), ['sup', 'capital', -6], ['sup', 'workers', 6]]],
    ['The constitution defended', 'The generals invited to swear to the constitution in public. Most do.', [M('coup', -0.3, 'A constitutional army'), L(5, 'The defended constitution')]],
    ['The legal road proved', 'Thirty years, three elections lost and won, and socialism still standing.', [L(6, 'The legal road'), M('unrest', -4, 'Consent'), ['opAll', 4], E('The Lawful Revolution')]],
    ['Copper for the world', 'The mines’ output sold at fair prices to anyone who pays in hard currency.', [M('trade', 0.08, 'Copper exports'), ['gold', 120]]],
    ['The southern example', 'Every party of the left on three continents studies Antara.', [['subvertNb', 6], ['glory', 8], M('prod', 0.05, 'The southern example'), E('The Southern Example')]]);
  T('an_d_armed',
    ['The people’s militia', 'Rifles for the miners, the dockers and the peasant leagues.', [M('def', 0.06, 'The militia'), ['sup', 'military', -6], ['fervor', 8]]],
    ['The mountain front', 'Instructors for every guerrilla on the southern continent.', [['subvertNb', 10], ['threat', 6]]],
    ['The continental revolution', 'Antara’s army marches under the flags of revolutions it helped begin.', [['claimsAll'], M('atk', 0.06, 'The revolutionary army'), ['glory', 8], E('The Southern Star')]],
    ['The copper plan', 'The mines, smelters and ports under one plan.', [['build', B.FACTORY, 2], M('prod', 0.05, 'The copper plan')]],
    ['The republic that held', 'No coup, no blockade, no default.', [M('coup', -0.3, 'The party’s army'), L(6, 'Secured'), M('unrest', -3, 'Secured'), E('The Republic That Held')]]);
  T('an_d_social',
    ['Fewer promises', 'A budget the opposition cannot find a hole in.', [M('eff', 0.05, 'Balanced books'), ['debtPct', -0.2]]],
    ['The copper fund', 'Copper windfalls saved in a fund for the bad years.', [['gold', 200], M('rev', 0.04, 'The fund')]],
    ['The patient prosperity', 'Thirty years of growth without a single miracle.', [M('prod', 0.06, 'Patient growth'), M('ls', 2, 'Patient prosperity'), E('The Steady Republic')]],
    ['The social pact', 'Unions, employers and government settle wages every spring.', [M('unrest', -4, 'The social pact'), ['sup', 'workers', 6], ['sup', 'capital', 4]]],
    ['The kept promise', 'Schools, clinics and pensions, paid for by copper and kept by law.', [M('ls', 3, 'The welfare republic'), L(6, 'The welfare republic'), E('The Kept Promise')]]);

  T('ke_d_company',
    ['The share register', 'Every citizen issued one share at birth. Shares can be sold. Many are.', [M('rev', 0.06, 'The share register'), ['sup', 'capital', 8]]],
    ['The island buys out', 'Kelda Company buys shares in foreign railways, mines and governments.', [['gold', -150], M('trade', 0.08, 'Foreign holdings'), ['subvertNb', 6]]],
    ['The conglomerate isle', 'Kelda owns more abroad than at home.', [M('rev', 0.08, 'Overseas dividends'), ['gold', 250], E('The Conglomerate Isle')]],
    ['The dividend', 'Every shareholder paid every quarter.', [M('ls', 3, 'The dividend'), M('unrest', -3, 'Paid citizens')]],
    ['The shareholders’ peace', 'Nobody revolts against their own dividend.', [L(6, 'The shareholders’ peace'), M('eff', 0.05, 'Corporate governance'), E('The Contented Shareholders')]]);
  T('ke_d_haven',
    ['The vaults', 'Deep, dry and very quiet.', [['gold', 200], M('trade', 0.06, 'The vaults')]],
    ['No questions', 'Deposits accepted from anyone, in any currency, from any war.', [M('rev', 0.08, 'Discreet deposits'), ['opAll', -3]]],
    ['Vault of the fallen', 'Every fallen dictator’s fortune ends up here. Sometimes so do they.', [['gold', 300], M('trade', 0.06, 'Hot money'), E('Vault of the Fallen')]],
    ['The neutral guarantee', 'Every great power guarantees the island, because every great power has money in it.', [M('def', 0.08, 'Too useful to invade'), ['opAll', 5]]],
    ['The island nobody touches', 'No fleet has been sent. No fleet will be.', [M('def', 0.06, 'Untouchable'), L(5, 'Untouchable'), E('The Island Nobody Touches')]]);
  T('ke_d_republic',
    ['The freeholders’ muster', 'Every freeholder answers the bell with a rifle and a week’s bread.', [M('def', 0.08, 'The muster'), M('regen', 0.15, 'Freeholders')]],
    ['The fishing-boat navy', 'Trawlers with guns, and fishermen who know every reef.', [M('navy', 0.4, 'The militia navy'), ['build', B.PORT, 1]]],
    ['The expensive island', 'Every staff college has worked out the cost of taking Kelda. None has found a profit.', [M('def', 0.08, 'The expensive island'), ['glory', 8], E('The Expensive Island')]],
    ['The freeholders’ parliament', 'One freeholder, one vote, every year.', [['particip', 10], L(5, 'The freeholders’ parliament')]],
    ['The free commonwealth', 'An island of farms and fishing towns with no lords and no debts.', [M('ls', 2, 'Freeholders’ wealth'), M('unrest', -4, 'Free men'), E('The Free Commonwealth')]]);

  T('vs_d_seas',
    ['The federation fleet', 'The mutinous cruiser leads a flotilla of trawlers, ferries and anything else that floats.', [M('navy', 0.4, 'The federation fleet'), ['build', B.PORT, 1]]],
    ['Mutiny is contagious', 'Sailors’ councils in every port the fleet visits.', [['subvertNb', 10], ['subvert', 'Norvik', 8], ['threat', 6]]],
    ['The red ports', 'A dozen harbours on three coasts fly the federation’s flag.', [['claimsAll'], M('trade', 0.06, 'The red ports'), E('Republic of Ports')]],
    ['Free trade on free seas', 'Any ship may dock. Any crew may vote.', [M('trade', 0.08, 'Free seas'), ['opAll', 4]]],
    ['The sea commonwealth', 'A federation of islands with no capital but the harbour master’s office.', [M('food', 0.06, 'Fisheries'), M('ls', 2, 'The sea commonwealth'), E('The Sea Commonwealth')]]);
  T('vs_d_commune',
    ['The assembly of the isle', 'Everyone meets at once, on the hill above the harbour, when the weather allows.', [['particip', 12], M('eff', -0.02, 'Everyone at once')]],
    ['The open harbour', 'Refugees, deserters and dreamers welcome.', [M('growth', 0.1, 'Newcomers'), ['subvertNb', 8]]],
    ['The beacon isle', 'Every rebel on three continents has heard of the island.', [['glory', 10], ['subvertNb', 8], E('The Beacon Isle')]],
    ['The commons of the sea', 'The boats, the nets and the catch held in common.', [M('food', 0.08, 'The common catch'), ['law', 'land', 'commune']]],
    ['The island at ease', 'No police, no prison, and the lowest crime on any coast.', [M('unrest', -4, 'At ease'), M('ls', 3, 'At ease'), E('The Island at Ease')]]);
  T('vs_d_fortress',
    ['The island fortress', 'Guns on every headland, shelters under every hill.', [['build', B.FORT, 2], M('def', 0.08, 'The island fortress')]],
    ['The submarine pens', 'Concrete pens dug into the cliffs.', [M('navy', 0.5, 'The submarine pens'), ['techUp', 'mil']]],
    ['The unsinkable island', 'An aircraft carrier made of granite, permanently at anchor.', [M('def', 0.06, 'Unsinkable'), ['threat', 6], ['glory', 8], E('The Unsinkable Island')]],
    ['The island plan', 'Every hand drafted into the plan; every plan drafted by the party.', [['build', B.FACTORY, 1], M('prod', 0.06, 'The island plan')]],
    ['The besieged paradise', 'Free schools, free clinics and blackout drills every Thursday.', [M('ls', 2, 'Island welfare'), L(6, 'The besieged paradise'), E('The Besieged Paradise')]]);

  /* ================================================================ the old lands */
  T('va_d_empire',
    ['The sword of the founder', 'The new sultan girded at the old shrine by the straits. The bells of the other faiths ring too, by order.', [['tradition', 12], L(5, 'The sword'), ['sup', 'clergy', 6]]],
    ['The provinces recalled', 'Envoys to every land the empire once ruled, with gifts and with maps.', [['subvertNb', 10], ['claim', 'Baskhar'], ['claim', 'Tyrrha']]],
    ['The empire of many peoples', 'The old provinces return as autonomous districts. Most of them were not asked.', [['claimsAll'], M('atk', 0.05, 'The imperial army'), ['glory', 12], E('Shadow of God on Earth')]],
    ['The straits fortified', 'Guns on both shores of the straits, and a toll for every hull.', [['build', B.FORT, 2], M('rev', 0.05, 'Strait dues')]],
    ['The compact of faiths', 'Every faith governs its own schools and courts under the sultan’s protection.', [M('unrest', -4, 'The compact'), L(6, 'The compact of faiths'), ['opAll', 4], E('Protector of All Faiths')]]);
  T('va_d_arrows',
    ['The six principles taught', 'Every child recites them before class. Most can explain two.', [L(5, 'The six arrows'), M('eff', 0.04, 'The reforms'), ['sup', 'clergy', -6]]],
    ['The army as guardian', 'The general staff granted the right to warn the government. It warns often.', [M('coup', -0.2, 'The guardian army'), M('atk', 0.05, 'The guardian army'), ['sup', 'military', 6]]],
    ['Peace at home, peace abroad', 'A strong army that fights nobody, and a frontier nobody tests.', [M('def', 0.08, 'Peace through strength'), ['opAll', 6], E('Peace at Home')]],
    ['The state factories', 'Sugar, steel and textiles built by the state where no capitalist would.', [['build', B.FACTORY, 2], M('prod', 0.05, 'Statism')]],
    ['The modern nation', 'Hats, alphabets, railways and women in parliament, all in one generation.', [M('sci', 0.08, 'The modern nation'), M('ls', 2, 'Modernisation'), E('The Modern Nation')]]);
  T('va_d_bridge',
    ['The open straits', 'Free passage for every flag, and a customs office for every cargo.', [M('trade', 0.08, 'The open straits'), ['opAll', 4]]],
    ['The bridge to the west', 'Treaties of trade and defence with the western democracies.', [n2('Cassine', 'treaty'), n2('Tessaly', 'treaty'), M('def', 0.05, 'Western guarantees')]],
    ['The two-continent market', 'Western money, eastern trade, Varanthine middlemen.', [M('trade', 0.08, 'The two-continent market'), M('rev', 0.05, 'Transit'), E('The Bridge of Continents')]],
    ['The good neighbour', 'Treaties with every state of the Old Lands.', [n2('Baskhar', 'treaty'), n2('Khemra', 'treaty'), n2('Zandar', 'treaty')]],
    ['The concert of the Old Lands', 'Every quarrel in the region is heard in our capital first.', [['opAll', 8], ['glory', 8], L(5, 'The concert'), E('Peacemaker of the Old Lands')]]);

  T('kh_d_rais',
    ['The president’s radio', 'The voice of the nation, every evening, from the mountains to the sea.', [['charisma', 10], ['subvertNb', 6], ['glory', 6]]],
    ['The united republic', 'A union with Baskhar, proclaimed from a balcony before the treaty is drafted.', [n2('Baskhar', 'bloc'), n2('Tyrrha', 'bloc'), ['threat', 4]]],
    ['Leader of the nation', 'Every capital of the Old Lands takes its line from ours, or explains why not.', [['subvertNb', 10], M('atk', 0.05, 'The national army'), E('Leader of the Nation')]],
    ['The high dam', 'The river tamed, the valley lit, the floods remembered only in songs.', [M('food', 0.08, 'The high dam'), M('prod', 0.04, 'Hydroelectricity'), ['build', B.CITY, 1]]],
    ['The revolution of the fields', 'Land to the farmers, factories to the state, the canal to the nation.', [['law', 'land', 'smallholder'], M('ls', 2, 'Land reform'), L(6, 'The revolution'), E('Builder of the Dam')]]);
  T('kh_d_kingdom',
    ['The parliament governs', 'The king opens the session, reads the government’s speech and goes to the races.', [L(5, 'The liberal age'), ['particip', 6], ['sup', 'intelligentsia', 6]]],
    ['Cotton and credit', 'The cotton exchange in the capital, the banks along the river.', [M('trade', 0.08, 'Cotton'), ['gold', 120]]],
    ['Capital of three continents', 'Opera houses, film studios and cafés where three continents argue in five languages.', [M('trade', 0.06, 'The capital of culture'), M('sci', 0.06, 'The universities'), ['opAll', 4], E('The Golden Age')]],
    ['The canal returned', 'The canal company’s concession is not renewed, by act of parliament, with compensation.', [M('rev', 0.08, 'The canal'), ['op', 'Norvik', -8]]],
    ['The constitutional crown', 'A king who never says no to his ministers, and a country that never asks him to.', [M('unrest', -4, 'Constitutional peace'), L(6, 'The crown'), E('The Crowned Republic')]]);
  T('kh_d_faith',
    ['The clinics become ministries', 'The brotherhood’s doctors, teachers and accountants take over the state’s offices.', [M('eff', 0.04, 'The brotherhood’s clerks'), ['sup', 'clergy', 10], ['corr', -6]]],
    ['The call abroad', 'Brotherhood branches in every country of the Old Lands.', [['subvertNb', 10], ['threat', 6]]],
    ['The guided nation', 'The faith as law from the delta to the desert, and preached beyond both.', [['claimsAll'], ['glory', 10], E('The Guided Nation')]],
    ['Charity as policy', 'The alms tax collected by the state and spent by the shrine.', [M('ls', 2, 'Charity'), M('unrest', -3, 'Charity')]],
    ['The virtuous republic', 'No bars, no casinos, no bribes, and very little argument.', [L(6, 'Virtue'), ['law', 'press', 'censored'], ['corr', -6], E('The Virtuous Republic')]]);

  T('bk_d_republic',
    ['The party’s oil', 'Every barrel’s revenue paid to the party’s development council.', [M('rev', 0.08, 'The party’s oil'), ['discipline', 8]]],
    ['The eastern front', 'The old border with Zandar declared a mistake of the empires.', [['claim', 'Zandar'], M('atk', 0.06, 'The armed republic'), ['threat', 8]]],
    ['The sword of the nation', 'The biggest army in the Old Lands, and a leader who wants to use it.', [['equip', 0.1], M('atk', 0.06, 'The sword'), ['glory', 10], E('Sword of the Nation')]],
    ['The renaissance plan', 'Universities, hospitals and motorways, bought with oil.', [['build', B.CITY, 1], M('sci', 0.06, 'The renaissance plan'), M('ls', 2, 'Oil welfare')]],
    ['The two rivers rebuilt', 'Irrigation on a scale the ancient kings never managed.', [M('food', 0.08, 'The two rivers'), ['techUp', 'agr'], E('Builder of the Two Rivers')]]);
  T('bk_d_kingdom',
    ['The development board', 'Seven-tenths of the oil money set aside for dams, roads and schools.', [M('prod', 0.05, 'The development board'), ['build', B.FACTORY, 1]]],
    ['The pact of the north', 'A defence pact with Varanth and the western powers.', [n2('Varanth', 'treaty'), n2('Norvik', 'treaty'), M('def', 0.06, 'The pact')]],
    ['The kingdom secured', 'The colonels watched, the frontiers guaranteed, the king safe in his bed.', [M('coup', -0.3, 'Watched colonels'), L(6, 'Secured'), E('The Secure Kingdom')]],
    ['The new towns', 'Model towns for the peasants who flood into the cities.', [['build', B.CITY, 1], M('unrest', -3, 'New towns')]],
    ['Development before politics', 'The fastest-growing country in the Old Lands, still waiting for its first real election.', [M('prod', 0.06, 'Development'), M('ls', 2, 'Development'), E('The Builder King')]]);
  T('bk_d_federation',
    ['The oil shared', 'Each province receives its share of the oil by a formula written into the constitution.', [M('unrest', -4, 'Shared oil'), L(5, 'The federation')]],
    ['The federal army', 'One army, recruited by quota from every province.', [M('def', 0.06, 'The federal army'), M('coup', -0.2, 'A balanced army')]],
    ['The federation holds', 'Three peoples, two rivers, one republic. Every foreign capital predicted it would fail.', [L(6, 'It held'), M('unrest', -3, 'Trust'), E('The Federation That Held')]],
    ['The provincial universities', 'A university in every province, teaching in its own language.', [M('sci', 0.06, 'Provincial universities'), ['sup', 'intelligentsia', 8]]],
    ['The oil bourse', 'Baskhari crude priced in Baskhar.', [M('trade', 0.08, 'The oil bourse'), ['gold', 200], E('The Oil Federation')]]);

  T('am_d_free',
    ['The land registry', 'Every field surveyed and recorded in the name of the family that farms it.', [['sup', 'peasants', 10], M('unrest', -3, 'Secure title')]],
    ['The village guards', 'Every village with its own guard and its own bell.', [M('def', 0.08, 'Village guards'), ['build', B.FORT, 1]]],
    ['The land held', 'The armistice lines become borders, and the borders hold.', [M('def', 0.06, 'The land held'), L(6, 'Whole and free'), E('The Land Held')]],
    ['The olive and the orange', 'Groves replanted, cooperatives founded, exports through every port.', [M('food', 0.06, 'The groves'), M('trade', 0.06, 'Citrus exports')]],
    ['The homecoming', 'The refugees of three wars come home to villages rebuilt for them.', [M('growth', 0.15, 'The return'), M('ls', 2, 'Homecoming'), E('The Homecoming')]]);
  T('am_d_twostates',
    ['The border commission', 'Surveyors from both sides walk the line together, arguing over every olive tree.', [['opAll', 6], M('unrest', -2, 'A border')]],
    ['The shared city', 'The holy city governed by a joint council, each faith keeping its own keys.', [L(5, 'The shared city'), ['sup', 'clergy', 6], ['opAll', 4]]],
    ['A peace that holds', 'Nobody loves it. Twenty years later, nobody can imagine anything else.', [M('unrest', -4, 'A peace that holds'), L(6, 'Peace'), E('The Peace That Held')]],
    ['The aid of nations', 'Money from every capital that wants credit for the peace.', [['gold', 200], M('prod', 0.04, 'Reconstruction')]],
    ['The garden state', 'Pipelines, irrigated hills, and two economies that cannot do without each other.', [M('food', 0.06, 'The garden state'), M('trade', 0.06, 'Shared markets'), E('The Garden State')]]);
  T('am_d_olive',
    ['The trust of the faithful', 'The land placed in a perpetual trust: it can be farmed, inherited and defended, never sold.', [['sup', 'clergy', 8], L(5, 'The trust')]],
    ['The pilgrims’ road', 'Pilgrims from every land, protected by our guards, paying at our gates.', [M('trade', 0.06, 'Pilgrims'), ['opAll', 4]]],
    ['Keeper of the gates', 'Every faith’s pilgrims pass through our gates, and every faith thanks us for it.', [M('rev', 0.06, 'The pilgrims’ road'), ['glory', 8], E('Keeper of the Gates')]],
    ['No sale, no surrender', 'Every acre in the trust, every village armed.', [M('def', 0.08, 'The trust defended'), ['build', B.FORT, 1]]],
    ['The land kept', 'Generations pass. The land is still there, and still ours.', [M('unrest', -4, 'Kept'), L(6, 'Kept'), E('The Faithful Keepers')]]);

  T('ty_d_switzerland',
    ['The secrecy law', 'Numbered accounts for anyone, from anywhere, for any reason.', [M('rev', 0.06, 'Banking secrecy'), ['gold', 150]]],
    ['The harbour of the Old Lands', 'Every cargo for the interior passes through our port and our warehouses.', [M('trade', 0.08, 'The harbour'), ['build', B.PORT, 1]]],
    ['The merchant republic', 'Every oil kingdom’s money banked in Tyrrha, every quarrel settled in its hotels.', [M('trade', 0.06, 'The merchant republic'), ['opAll', 6], E('The Merchant Republic')]],
    ['The confessional balance', 'Every office shared by formula between the faiths.', [M('unrest', -4, 'The balance'), L(5, 'The balance')]],
    ['The careful neutral', 'No army worth the name, and nobody who wants to fight over the banks.', [M('def', 0.06, 'Neutrality'), ['opAll', 5], E('The Careful Neutral')]]);
  T('ty_d_mountain',
    ['The mountain militia', 'Every village of the confession under one militia’s command.', [M('def', 0.08, 'The mountain'), M('regen', 0.15, 'The militia')]],
    ['The state within', 'The militia’s own schools, clinics and courts.', [M('unrest', -3, 'Our own'), ['discipline', 8]]],
    ['The mountain holds', 'No army has taken the mountain in a thousand years.', [M('def', 0.08, 'The mountain holds'), ['build', B.FORT, 2], E('The Mountain That Holds')]],
    ['Friends abroad', 'Money and rifles from powers that want a friend on the coast.', [['protector'], ['gold', 100]]],
    ['Lord of the mountain', 'The mountain governs the coast now.', [['claimsAll'], L(5, 'The mountain rules'), E('Lord of the Mountain')]]);
  T('ty_d_resistance',
    ['The camps take the state', 'The ministries staffed from the camps, the army from the militias.', [['fervor', 10], ['sup', 'military', -6]]],
    ['The front line', 'Rockets on the hills facing south.', [M('atk', 0.05, 'The resistance'), ['op', 'Neshar', -15], ['threat', 6]]],
    ['The axis of resistance', 'Every movement in the region trained in our valleys.', [['subvertNb', 10], ['glory', 10], E('The Axis of Resistance')]],
    ['The movement’s services', 'Schools, clinics and rebuilding run by the movement, better than the state ever ran them.', [M('ls', 2, 'The movement’s services'), M('unrest', -3, 'Services')]],
    ['The undefeated south', 'Armed, rebuilt and certain.', [L(6, 'The resistance republic'), M('def', 0.06, 'Resistance'), E('The Undefeated South')]]);

  T('sa_d_kingdom',
    ['The custodian’s treasury', 'The pilgrims’ fees and the oil royalties in one treasury.', [['gold', 200], ['sup', 'clergy', 8]]],
    ['The banker of the faith', 'Shrines, schools and charities funded abroad, through banks of our own.', [['subvertNb', 8], ['opAll', 3], ['gold', -100], M('trade', 0.03, 'The faithful’s banks')]],
    ['The voice of the faithful', 'Every faithful government asks Sahrem’s opinion first.', [['glory', 10], M('trade', 0.06, 'The faithful bloc'), E('Banker of the Faith')]],
    ['The pilgrimage expanded', 'A new airport, new hotels, a million pilgrims a year.', [M('trade', 0.06, 'The pilgrimage'), ['build', B.CITY, 1]]],
    ['The holy cities rebuilt', 'Marble courts large enough for every pilgrim alive.', [L(6, 'The custodian'), M('unrest', -4, 'Piety'), E('Builder of the Holy Cities')]]);
  T('sa_d_petro',
    ['The sovereign fund', 'A fund that will outlast the oil.', [['gold', 300], M('rev', 0.05, 'The fund')]],
    ['Petrochemicals', 'Plastics, fertilisers and refineries along the gulf coast.', [['build', B.FACTORY, 2], M('prod', 0.06, 'Petrochemicals')]],
    ['After oil', 'Industries, universities and banks that would survive a dry well.', [M('sci', 0.06, 'After oil'), M('prod', 0.05, 'Diversified'), E('The Kingdom After Oil')]],
    ['The swing producer', 'Sahrem pumps more when it wants prices low and less when it wants them high.', [M('trade', 0.08, 'The swing producer'), ['opAll', -2]]],
    ['Master of the taps', 'An embargo threatened, and three continents rearrange their foreign policy.', [['gold', 250], ['glory', 10], ['threat', 4], E('Master of the Taps')]]);
  T('sa_d_brethren',
    ['No base, no company', 'The foreign base closed, the oil company expelled.', [['glory', 8], ['op', 'Cassine', -12], M('rev', 0.04, 'Our own oil')]],
    ['The brethren ride', 'The brethren’s horsemen, now in trucks, along every frontier.', [['claimsAll'], M('atk', 0.06, 'The brethren'), ['threat', 8]]],
    ['The emirate of the faithful', 'The oases of three neighbours under the brethren’s banner.', [M('atk', 0.05, 'Holy war'), ['glory', 10], E('Sword of the Brethren')]],
    ['The pure kingdom', 'No music, no cinema, no foreigners.', [['law', 'press', 'censored'], ['sup', 'clergy', 10], M('unrest', -3, 'Purity')]],
    ['The emirate endures', 'A hard, poor, devout country, still standing.', [L(6, 'Endurance'), M('def', 0.06, 'Faith'), E('The Enduring Emirate')]]);

  T('za_d_shah',
    ['The great civilisation', 'The shah promises, by decree, a country as advanced as any in the west within a generation.', [M('prod', 0.05, 'The great civilisation'), ['charisma', 8]]],
    ['The imperial army', 'The newest jets and tanks, bought with oil, in quantity.', [M('atk', 0.06, 'The imperial army'), ['equip', 0.1], ['threat', 6]]],
    ['Guardian of the gulf', 'The imperial navy patrols the oil routes for the world, and claims the far shore.', [M('navy', 0.4, 'The imperial navy'), ['claim', 'Baskhar'], E('Guardian of the Gulf')]],
    ['Land and literacy', 'The literacy corps in every village, the estates divided by decree.', [['law', 'land', 'smallholder'], M('sci', 0.04, 'The literacy corps'), ['sup', 'clergy', -6]]],
    ['The peacock renewed', 'Motorways, universities and a reactor on the coast.', [['build', B.CITY, 1], ['techUp', 'ind'], M('ls', 2, 'Modernisation'), E('The Peacock Throne Renewed')]]);
  T('za_d_nation',
    ['The oil nationalised', 'The foreign company’s refinery belongs to the nation. The foreign governments are not pleased.', [M('rev', 0.08, 'Our oil'), ['op', 'Norvik', -10], ['glory', 8]]],
    ['Neutral between the blocs', 'No base, no pact, and trade with both.', [['opAll', 5], M('trade', 0.06, 'Neutral trade')]],
    ['Voice of the non-aligned', 'A founding member of every conference of the new states.', [['glory', 10], ['opAll', 4], M('def', 0.04, 'Many friends'), E('Voice of the Non-Aligned')]],
    ['The parliament’s plan', 'A seven-year plan of roads, dams and factories, voted line by line.', [['build', B.FACTORY, 2], M('prod', 0.05, 'The plan')]],
    ['The sovereign nation', 'A shah who reigns, a parliament that governs, and an oil company that answers to both.', [L(6, 'The constitution'), M('unrest', -4, 'Consent'), E('The Sovereign Nation')]]);
  T('za_d_revolution',
    ['The guardianship of the jurist', 'The clerics’ council above the parliament, the revolutionary guard beside the army.', [['sup', 'clergy', 10], M('coup', -0.3, 'The revolutionary guard'), ['discipline', 8]]],
    ['Export the revolution', 'The revolution’s guards train the faithful of every neighbouring state.', [['subvertNb', 12], ['threat', 8]]],
    ['Neither east nor west', 'Encircled, sanctioned and still exporting its revolution.', [M('def', 0.08, 'The guards'), ['glory', 10], ['opAll', -4], E('Neither East Nor West')]],
    ['The foundations of the poor', 'The shah’s properties given to foundations for the poor.', [M('ls', 2, 'The foundations'), ['sup', 'peasants', 8]]],
    ['The revolution that stayed', 'A state that has outlived every prediction of its fall.', [L(6, 'The revolution'), M('unrest', -4, 'Revolutionary order'), E('The Revolution That Stayed')]]);

  /* ================================================================ family destinies ({A}, {N}: the state's adjective and name) */
  T('fs_d_beacon',
    ['The beacon lit', 'Radio {N} broadcasts the revolution in every language of the continent.', [['subvertNb', 8], ['fervor', 8]]],
    ['Volunteers abroad', 'Brigades of {A} volunteers for every revolution that asks.', [M('atk', 0.05, 'The volunteers'), ['subvertNb', 8], ['threat', 6]]],
    ['The revolution spreads', 'The neighbours’ revolutionaries ask to join the union. Their governments are not consulted.', [['claimsAll'], ['glory', 12], E('Beacon of the Revolution')]],
    ['The model union', 'The union must be worth joining: housing first, then the world.', [M('ls', 3, 'The model union'), ['build', B.CITY, 1]]],
    ['Proof by example', 'Delegations arrive every week to see how {N} did it.', [M('prod', 0.05, 'Socialist emulation'), L(6, 'The example'), ['opAll', 4], E('The Living Example')]]);
  T('fs_d_union',
    ['The union plan', 'One plan, one ledger, one office for every republic of the union.', [['build', B.FACTORY, 2], M('prod', 0.05, 'The union plan'), ['bureau', 6]]],
    ['Heavy industry first', 'Steel, coal and tractors, ahead of everything else.', [['techUp', 'ind'], M('prod', 0.05, 'Heavy industry'), M('ls', -1, 'Steel first')]],
    ['The industrial union', 'The union outproduces states twice its size.', [['build', B.FACTORY, 2], M('atk', 0.05, 'The industrial army'), E('The Industrial Union')]],
    ['The union of republics', 'Each people its own republic, its own language and its own seat in the congress.', [M('unrest', -4, 'A union of peoples'), L(5, 'The union')]],
    ['The friendship of peoples', 'A union that people want to join.', [['subvertNb', 8], ['opAll', 4], E('The Friendship of Peoples')]]);
  T('fs_d_commons',
    ['The labour charter', 'Work, rest and dignity guaranteed by law.', [M('ls', 2, 'The labour charter'), ['sup', 'workers', 8]]],
    ['The cooperative economy', 'Every enterprise owned by its workers.', [M('eff', 0.05, 'Cooperatives'), ['particip', 8]]],
    ['The producers’ commonwealth', 'A country run by the people who make it.', [M('prod', 0.06, 'The producers’ commonwealth'), E('The Producers’ Commonwealth')]],
    ['The people’s universities', 'Evening classes for every worker who wants one.', [M('sci', 0.08, 'People’s universities'), ['sup', 'intelligentsia', 6]]],
    ['The good society', 'Short hours, long lives and full libraries.', [M('ls', 3, 'The good society'), L(6, 'The good society'), E('The Good Society')]]);

  T('fa_d_unbowed',
    ['Every hand armed', 'A rifle in every home, a drill in every square.', [M('def', 0.08, 'Every hand armed'), ['fervor', 8]]],
    ['Columns across the border', 'Free columns for every rising in the neighbourhood.', [['subvertNb', 10], M('atk', 0.05, 'Free columns')]],
    ['The black flag spreads', 'The neighbours’ villages vote to join the free territory.', [['claimsAll'], ['glory', 10], E('The Spreading Flame')]],
    ['The fortress communes', 'Every commune its own redoubt.', [['build', B.FORT, 2], M('regen', 0.15, 'The communes armed')]],
    ['The untakeable', 'Armies have tried. The communes are still there.', [M('def', 0.06, 'Untakeable'), L(6, 'Unbowed'), E('The Untakeable')]]);
  T('fa_d_commune',
    ['Free association', 'Each commune joins and leaves as it pleases.', [['particip', 10], M('unrest', -3, 'Free association')]],
    ['The open commune', 'Any village anywhere may join.', [['subvertNb', 8], M('growth', 0.1, 'Newcomers')]],
    ['The commune without borders', 'Free territory as far as the volunteers can walk.', [['claimsAll'], ['glory', 8], E('The Borderless Commune')]],
    ['To each according to need', 'The old slogan, in practice, in every shop of {N}.', [M('ls', 3, 'The gift economy'), M('rev', -0.04, 'No money')]],
    ['The free garden', 'Orchards, workshops and no masters.', [M('food', 0.08, 'The common fields'), L(6, 'The free commune'), E('The Free Garden')]]);
  T('fa_d_syndicate',
    ['The congress of trades', 'Every trade one seat in the great congress.', [['particip', 6], M('prod', 0.04, 'The congress')]],
    ['The general strike abroad', 'Syndicate organisers in every neighbouring port.', [['subvertNb', 10], ['threat', 4]]],
    ['The one big union', 'One union across every border.', [M('trade', 0.06, 'The syndicate ports'), ['glory', 10], E('The One Big Union')]],
    ['The federations of industry', 'Each industry plans itself.', [['build', B.FACTORY, 2], M('eff', 0.04, 'Federations')]],
    ['The workers’ economy', 'No bosses, and the trains still run.', [M('prod', 0.06, 'The workers’ economy'), M('ls', 2, 'The workers’ economy'), E('The Workers’ Economy')]]);

  T('fl_d_market',
    ['The open economy', 'Tariffs abolished, the currency floated, the exchange open late.', [['law', 'trade', 'free'], M('trade', 0.08, 'The open economy')]],
    ['The financial centre', 'Banks from three continents open branches in the capital.', [M('rev', 0.06, 'The financial centre'), ['gold', 150]]],
    ['The market miracle', 'Growth that economists will spend decades explaining.', [M('prod', 0.06, 'The miracle'), ['build', B.FACTORY, 2], E('The Market Miracle')]],
    ['Treaties of commerce', 'Free trade with every neighbour that will sign.', [['opAll', 6], M('trade', 0.05, 'Treaties')]],
    ['The trading republic', 'Every neighbour is richer for trading with {N}, and every neighbour knows it.', [M('def', 0.05, 'Too useful to attack'), ['opAll', 5], E('The Trading Republic')]]);
  T('fl_d_covenant',
    ['The covenant reprinted', 'A second edition of the two pages, with a clause for disputes between agencies and one for disputes about the clause.', [['sig', 8], L(4, 'The covenant reprinted'), ['sup', 'capital', 4]]],
    ['The agencies abroad', 'Our defence agencies sell protection to anyone who pays, including governments that still believe in governments.', [['gold', 150], M('atk', 0.04, 'Agencies abroad'), ['threat', 4]]],
    ['The market in sovereignty', 'Provinces of other states petition to join the covenant. Some of their governments sell them.', [['subvertNb', 8], M('trade', 0.06, 'The market in sovereignty'), E('The Market in Sovereignty')]],
    ['The quiet covenant', 'No adventures abroad: the agencies compete on price at home and the members get richer.', [M('eff', 0.04, 'The quiet covenant'), ['sig', 6]]],
    ['The richest place on earth', 'Measured per head, and the members measure everything per head.', [M('ls', 2, 'The richest place'), M('prod', 0.04, 'The richest place'), E('The Richest Place on Earth')]]);
  T('fl_d_union',
    ['The federal constitution', 'States’ rights, a supreme court and a bill of rights.', [L(5, 'The constitution'), M('unrest', -3, 'Federalism')]],
    ['The union of democracies', 'A defence pact with a great power that shares our values.', [['protector'], M('def', 0.05, 'The union of democracies')]],
    ['The arsenal of democracy', 'Factories that can arm any free state on the continent.', [['build', B.FACTORY, 2], M('atk', 0.05, 'The arsenal'), E('Arsenal of Democracy')]],
    ['The open frontier', 'Land grants, railways and immigrants.', [M('growth', 0.15, 'Immigration'), ['build', B.CITY, 1]]],
    ['The great republic', 'A continent-sized republic with a continent-sized ambition.', [M('prod', 0.05, 'The great republic'), ['glory', 10], E('The Great Republic')]]);
  T('fl_d_social',
    ['The social contract', 'Pensions, insurance and a minimum wage.', [M('ls', 2, 'The social contract'), ['sup', 'workers', 6]]],
    ['The education republic', 'Free schools and universities for everyone.', [M('sci', 0.08, 'Free education'), ['sup', 'intelligentsia', 6]]],
    ['The knowledge state', 'The best-educated people on the continent.', [['techUp', 'ind'], M('eff', 0.05, 'An educated workforce'), E('The Educated Republic')]],
    ['The social partners', 'Unions and employers settle wages together.', [M('unrest', -4, 'Social partnership'), ['sup', 'capital', 4]]],
    ['The safety net', 'Nobody in {N} falls very far.', [M('ls', 3, 'The welfare state'), L(6, 'Welfare'), E('The Safety Net')]]);

  T('fc_d_holy',
    ['The anointing', 'The ruler anointed with the oil of the old kings.', [['tradition', 10], ['sup', 'clergy', 8], L(5, 'The anointing')]],
    ['The knightly orders', 'The old orders of knighthood revived, with rifles.', [M('atk', 0.05, 'The orders'), ['subvertNb', 6]]],
    ['Defender of the faith', 'The faithful of every neighbouring land look to {N}.', [['claimsAll'], ['glory', 10], E('Defender of the Faith')]],
    ['The parish state', 'Schools, alms and registers run by the temple.', [M('unrest', -3, 'The parishes'), M('ls', 1, 'Charity')]],
    ['The realm at prayer', 'An old, pious, unchanging country.', [L(6, 'The realm at prayer'), M('unrest', -3, 'Piety'), E('The Realm at Prayer')]]);
  T('fc_d_crown',
    ['The imperial court', 'A court of a thousand titles.', [['tradition', 12], ['sup', 'capital', 4]]],
    ['The imperial army', 'Regiments with old names and new rifles.', [M('atk', 0.06, 'The imperial army'), ['sup', 'military', 6]]],
    ['Emperor of emperors', 'The empire’s borders wherever the old maps drew them.', [['claimsAll'], ['glory', 12], E('Emperor of Emperors')]],
    ['The imperial railways', 'Iron roads to every province.', [['build', B.FACTORY, 1], M('prod', 0.05, 'The railways')]],
    ['The imperial peace', 'A century without a rebellion.', [M('unrest', -4, 'The imperial peace'), L(6, 'The imperial peace'), E('The Imperial Peace')]]);
  T('fc_d_modern',
    ['The modern crown', 'The king in a lounge suit, the parliament in session.', [L(5, 'The modern crown'), ['particip', 6]]],
    ['The royal industries', 'Crown lands leased to factories.', [['build', B.FACTORY, 2], M('prod', 0.04, 'Royal industries')]],
    ['The industrious kingdom', 'An old crown on a new economy.', [M('prod', 0.05, 'Industrious'), ['techUp', 'ind'], E('The Industrious Kingdom')]],
    ['The king’s friends abroad', 'Royal visits to every capital.', [['opAll', 8]]],
    ['The beloved crown', 'The most popular institution in {N}.', [M('unrest', -4, 'The beloved crown'), L(6, 'Beloved'), E('The Beloved Crown')]]);

  T('fu_d_greater',
    ['The greater state', 'Every district governed from the capital.', [M('eff', 0.05, 'Centralisation'), ['discipline', 8]]],
    ['The next frontier', 'The general staff has found more {A} villages across the border.', [['claimsAll'], M('atk', 0.06, 'The next frontier'), ['threat', 8]]],
    ['The greatest state', 'The map redrawn again, in {A} colours.', [M('atk', 0.05, 'The war machine'), ['glory', 12], E('The Greatest State')]],
    ['The fortified frontier', 'Concrete on every new border.', [['build', B.FORT, 3], M('def', 0.06, 'The frontier')]],
    ['The consolidated state', 'The new provinces settled, schooled and quiet.', [M('unrest', -4, 'Consolidation'), L(5, 'Consolidated'), E('The Consolidated State')]]);
  T('fu_d_quiet',
    ['The guardians', 'A council of guardians, unelected and unseen.', [M('coup', -0.3, 'The guardians'), ['discipline', 8]]],
    ['The watchful eye', 'Informers in every block, files on every citizen.', [['law', 'security', 'secret'], M('unrest', -4, 'Watched')]],
    ['The silent state', 'Nothing happens in {N} that the guardians do not know about first.', [M('coup', -0.2, 'Silence'), L(5, 'Order'), E('The Silent State')]],
    ['Order and prosperity', 'Factories, roads and full shops, in return for quiet.', [['build', B.FACTORY, 1], M('ls', 2, 'The bargain')]],
    ['The bargain kept', 'The people keep quiet; the state keeps its promises.', [M('prod', 0.05, 'The bargain'), M('unrest', -3, 'Content'), E('The Bargain Kept')]]);
  T('fu_d_technate',
    ['The engineers govern', 'Politics abolished; the slide rules kept.', [M('eff', 0.06, 'The engineers'), ['sup', 'intelligentsia', 6]]],
    ['The research state', 'A laboratory for every problem.', [M('sci', 0.1, 'The research state'), ['techUp', 'ind']]],
    ['The engineered future', 'The plan has a plan for everything.', [M('prod', 0.06, 'Engineered'), ['techUp', 'mil'], E('The Engineered Future')]],
    ['The grid', 'Power lines to every village.', [M('prod', 0.05, 'The grid'), M('ls', 2, 'Electrified')]],
    ['The well-run state', 'Everything works. Nobody remembers voting.', [M('unrest', -3, 'Optimised'), M('ls', 2, 'The optimum'), E('The Well-Run State')]]);

  T('fh_d_serene',
    ['The great houses', 'The great houses’ names inscribed, and the book closed.', [['sup', 'capital', 8], M('trade', 0.06, 'The houses')]],
    ['The trading posts', 'Warehouses and agents on every friendly coast.', [['build', B.PORT, 1], M('trade', 0.06, 'Trading posts')]],
    ['The merchant empire', 'Half the continent’s commerce passes through {A} hands.', [M('rev', 0.06, 'The merchant empire'), ['gold', 200], E('The Merchant Empire')]],
    ['The lenders', 'Loans to every prince who asks.', [['gold', 150], ['opAll', 3]]],
    ['Banker to every side', 'Creditor of every side, enemy of none.', [M('def', 0.06, 'Everyone’s banker'), ['opAll', 5], E('Banker to Every Side')]]);
  T('fh_d_many',
    ['The many rising', 'A new constitution written in a thousand assemblies.', [['particip', 10], L(5, 'Rebirth')]],
    ['The movement abroad', 'Sister movements in every neighbouring state.', [['subvertNb', 10]]],
    ['The new road', 'The neighbours copy the {A} way.', [['glory', 10], ['opAll', 4], E('The New Road')]],
    ['The rebuilding', 'Every hand to the rebuilding.', [['build', B.CITY, 1], M('prod', 0.05, 'The rebuilding')]],
    ['The country reborn', 'A new country in an old place.', [M('unrest', -4, 'Reborn'), M('ls', 2, 'Reborn'), E('The Country Reborn')]]);
  T('fh_d_sync',
    ['The synchronisation', 'Every clock, every factory and every school on one signal.', [M('eff', 0.06, 'Synchronised'), ['discipline', 6]]],
    ['The signal abroad', 'The signal broadcast across every border.', [['subvertNb', 10], M('sci', 0.04, 'The signal')]],
    ['The synchronised continent', 'The neighbours’ clocks are set by ours.', [['claimsAll'], ['glory', 8], E('The Clock of the Continent')]],
    ['The network', 'Every factory linked to every other.', [M('prod', 0.06, 'The network'), ['techUp', 'ind']]],
    ['Perfect time', 'Nothing in {N} is ever late.', [M('eff', 0.04, 'Perfect time'), L(5, 'Perfect time'), E('The Punctual Union')]]);

  /* ================================================================ the middle of each road, and the finales */
  X('au_d_crown',
    ['The congress of the faithful', 'High priests of every border temple meet in the capital and bless our maps.', [['subvertNb', 8], ['sup', 'clergy', 6]]],
    ['The southern army', 'Railways to the southern frontier, a depot at every junction.', [['build', B.FORT, 1], M('speed', 0.05, 'The southern railways')]],
    ['The emperor’s bank', 'A crown bank lends to every province at the emperor’s rate.', [M('rev', 0.04, 'The crown bank'), ['gold', 100]]],
    ['Parish schools', 'A school in every village, teaching letters, sums and loyalty.', [M('sci', 0.04, 'Parish schools'), ['sup', 'peasants', 6], ['tradition', 4]]],
    ['The imperial jubilee', 'Fifty years of the restored crown, celebrated in every temple and barracks.', [L(4, 'The jubilee'), ['glory', 8], ['opAll', 3]]],
    ['The heir of the restoration', 'The heir is trained for war, for prayer and for the ledger.', [M('coup', -0.2, 'A trained heir'), ['tradition', 8], M('eff', 0.03, 'The heir’s ministers'), E('The Restored Throne')]]);
  X('au_d_commonwealth',
    ['Schools in every tongue', 'Primers printed in fourteen languages, and teachers for all of them.', [M('sci', 0.04, 'Schools in every tongue'), ['sup', 'intelligentsia', 6]]],
    ['The commonwealth court', 'A supreme court where any citizen may sue any governor.', [['corr', -8], L(3, 'The commonwealth court')]],
    ['The grain elevators', 'Steel silos at every railhead, and the harvest no longer rots in the rain.', [['build', B.CITY, 1], M('food', 0.04, 'Grain elevators')]],
    ['The farmers’ bank', 'Credit for seed and tractors, at rates the old landlords never offered.', [M('rev', 0.03, 'The farmers’ bank'), ['sup', 'peasants', 6], ['gold', 80]]],
    ['The jubilee of the assembly', 'Fifty years of the provinces meeting as equals. Several still bring interpreters.', [['particip', 6], L(4, 'The jubilee')]],
    ['The commonwealth’s century', 'A hundred peoples, one constitution, and nobody under forty remembers the emperors.', [M('unrest', -3, 'An old constitution'), M('ls', 2, 'The commonwealth’s century'), E('The Commonwealth of a Hundred Peoples')]]);
  X('au_d_councils',
    ['The red press abroad', 'Newspapers in every language, printed in our capital, smuggled everywhere else.', [['subvertNb', 8], ['gold', -80], ['glory', 6]]],
    ['The volunteer army', 'Workers from every country, trained in our barracks, sworn to the union.', [M('atk', 0.04, 'The volunteers'), M('regen', 0.1, 'International volunteers')]],
    ['The tractor stations', 'A depot of machines for every hundred villages.', [M('food', 0.05, 'Tractor stations'), ['techUp', 'agr']]],
    ['Housing for millions', 'Blocks of flats rising faster than the cities can name the streets.', [['build', B.CITY, 1], M('ls', 2, 'New flats')]],
    ['The fiftieth congress', 'The delegates are grandchildren of the delegates who founded the union.', [['discipline', 6], L(4, 'The fiftieth congress'), ['glory', 6]]],
    ['The union endures', 'The first union of councils outlives every government that swore to strangle it.', [M('def', 0.05, 'The union endures'), M('unrest', -3, 'An old revolution'), E('The First and Last Union')]]);

  X('ca_d_freeworld',
    ['The alliance treaty', 'One treaty, one command, and Cassine’s general at the head of it.', [n2('Norvik', 'bloc'), n2('Tessaly', 'bloc')]],
    ['The carrier fleets', 'Floating airfields on every ocean, each one larger than some navies.', [M('navy', 0.4, 'The carrier fleets'), ['techUp', 'mil']]],
    ['The trade round', 'Tariffs cut by a third across the free world, in one very long conference.', [M('trade', 0.05, 'The trade round'), ['opAll', 4]]],
    ['The development bank', 'Loans for dams and roads in the new states, at Cassine’s terms.', [n2('Khemra', 'aid'), n2('Baskhar', 'aid'), ['gold', -100]]],
    ['The race to the moon', 'Rockets from the southern cape, and a flag on the moon before anyone else’s.', [M('sci', 0.08, 'The space programme'), ['glory', 10]]],
    ['The free world’s century', 'Every crisis on earth ends with a telephone call to Cassine.', [['opAll', 4], L(4, 'The free world’s century'), M('prod', 0.04, 'The long boom'), E('The Indispensable Republic')]]);
  X('ca_d_commonwealth',
    ['The cooperative banks', 'Savings banks owned by their depositors, lending to the firms their depositors own.', [M('rev', 0.03, 'Cooperative banks'), ['sup', 'workers', 4]]],
    ['Codetermination', 'Half of every board elected by the workers.', [M('eff', 0.03, 'Codetermination'), M('unrest', -2, 'Codetermination')]],
    ['The labour charter abroad', 'A charter of labour rights offered to every trading partner, with a tariff for those who refuse.', [n2('Verano', 'treaty'), ['subvertNb', 4]]],
    ['Fair trade', 'Cassine buys only from firms that pay a living wage, and tells the world which ones do.', [M('trade', 0.05, 'Fair trade'), ['glory', 4]]],
    ['The second guarantee', 'Housing added to the chapter that no slump can repeal.', [M('ls', 2, 'The second guarantee'), ['build', B.CITY, 1]]],
    ['The commonwealth tested', 'A depression comes and goes, and not one pension is cut.', [L(5, 'The commonwealth tested'), M('unrest', -3, 'Trust'), E('The Unbroken Promise')]]);
  X('ca_d_new',
    ['The hemisphere bases', 'Leases demanded on every island near our coasts.', [n2('Kelda', 'base'), n2('Lys', 'base')]],
    ['The movement’s marines', 'Shock troops sworn to the movement before the republic.', [M('atk', 0.05, 'The movement’s marines'), ['threat', 4]]],
    ['The movement’s youth', 'Uniforms, summer camps and a song for every occasion.', [['charisma', 6], ['discipline', 6]]],
    ['The highways of the movement', 'Concrete roads from coast to coast, built by the labour front.', [['build', B.FACTORY, 1], M('prod', 0.04, 'The highways')]],
    ['The succession of the movement', 'A deputy is named, then a deputy for the deputy.', [M('coup', -0.2, 'The succession'), ['discipline', 6]]],
    ['The thousand-week republic', 'The movement promised a thousand years. Its accountants say a thousand weeks is already a record.', [L(4, 'The movement endures'), M('eff', 0.03, 'Directed state'), E('The Movement State')]]);

  X('no_d_fortress',
    ['Mines in every inlet', 'Every fjord sown with mines, and every fisherman given the charts.', [M('def', 0.04, 'Mined inlets'), ['build', B.FORT, 1]]],
    ['The coastal radar', 'Masts on every headland that see a ship before it sees the coast.', [['techUp', 'mil'], M('navy', 0.2, 'The coastal radar')]],
    ['Joint manoeuvres', 'The small states rehearse defending each other every autumn.', [n2('Tessaly', 'bloc'), M('atk', 0.03, 'Joint manoeuvres')]],
    ['The common arsenal', 'One rifle, one shell and one factory for the whole league.', [['build', B.FACTORY, 1], ['equip', 0.05]]],
    ['The fortress in peace', 'The guns are oiled every spring and fired every summer, at nothing.', [M('ls', 2, 'Peace behind the guns'), M('unrest', -2, 'Safe')]],
    ['The never-taken coast', 'A century of invasions planned, and none attempted.', [['glory', 8], L(4, 'The never-taken coast'), E('The Coast No One Took')]]);
  X('no_d_crowns',
    ['The crown council of the north', 'The kings meet each summer on a royal yacht, and decide very little in great comfort.', [L(3, 'The crown council'), ['tradition', 4]]],
    ['The northern levies', 'Every crown sends its regiments to the high king’s muster.', [M('regen', 0.1, 'The northern levies'), M('atk', 0.03, 'The levies')]],
    ['The royal shipyards', 'Timber ships and then steel ships, built under the crown’s warrant.', [['build', B.PORT, 1], M('trade', 0.04, 'The royal shipyards')]],
    ['The king’s road', 'One road along the whole coast, with a royal inn every day’s ride.', [['build', B.CITY, 1]]],
    ['The jubilee of the crowns', 'Every throne of the north sends a prince to the celebration.', [['opAll', 4], ['tradition', 6]]],
    ['The northern succession', 'The heir is crowned in all three capitals in one week, and no one objects.', [M('coup', -0.2, 'A settled succession'), L(4, 'The northern succession'), E('The Crowns of the North')]]);
  X('no_d_home',
    ['The housing programme', 'A flat for every family, built by the state and rented at cost.', [['build', B.CITY, 1], M('ls', 1, 'Housing')]],
    ['The national health', 'A doctor for every village, paid by the state.', [M('growth', 0.05, 'National health'), ['sup', 'workers', 4]]],
    ['The fleet modernised', 'Steel trawlers and refrigerated holds for the cooperative fleet.', [M('food', 0.04, 'Modern trawlers'), ['build', B.PORT, 1]]],
    ['The export cooperatives', 'Norvish fish and timber sold abroad by the people who catch and cut them.', [M('trade', 0.05, 'Export cooperatives')]],
    ['The people’s home at fifty', 'Half a century of nobody privileged and nobody neglected.', [L(4, 'Fifty years of the home'), ['glory', 4]]],
    ['The home finished', 'There is nothing left to build, the opposition says. The government builds another library.', [M('sci', 0.04, 'Libraries'), M('unrest', -3, 'Contentment'), E('The Finished Home')]]);

  X('tn_d_planet',
    ['Transmitters for hire', 'Any revolution may rent air time on the planetary relay. Some pay in gold.', [['gold', 80], ['subvert', 'Hesperia', 8]]],
    ['The satellite', 'A transmitter in orbit, out of reach of every jammer on earth.', [['techUp', 'ind'], M('sci', 0.04, 'The satellite')]],
    ['The terminals', 'A screen in every warehouse and every kitchen, connected to the plan.', [M('eff', 0.03, 'The terminals'), ['particip', 6]]],
    ['The protocol schools', 'Every child learns to read the code of the plan before they learn to read the news.', [M('sci', 0.05, 'Protocol schools'), ['sup', 'intelligentsia', 6]]],
    ['The planetary congress', 'Delegates from every relay station on earth, meeting by wire.', [['glory', 8], ['subvertNb', 6]]],
    ['The signal keeps going', 'Every revolution on earth now runs on Tessalian code, whether it knows it or not.', [M('prod', 0.04, 'The signal'), L(4, 'The signal keeps going'), E('The Planetary Signal')]]);
  X('tn_d_luxury',
    ['The open laboratories', 'Any citizen may book time in any laboratory. Many do.', [M('sci', 0.05, 'Open laboratories')]],
    ['Patents abolished', 'Every invention of the cantons free to copy, here and abroad.', [M('prod', 0.03, 'Free inventions'), ['opAll', 3]]],
    ['The machine fairs', 'The world’s buyers come to the cantons each spring to see what the machines have made.', [M('trade', 0.05, 'Machine fairs'), ['gold', 80]]],
    ['The robot works', 'Factories with the lights off, because nobody inside needs them.', [['build', B.FACTORY, 2]]],
    ['The leisure census', 'Most cantons now report more hobbies than jobs.', [M('ls', 2, 'Leisure'), ['sup', 'workers', 4]]],
    ['After scarcity', 'The last ration book is placed in a museum, next to the last time clock.', [M('prod', 0.05, 'After scarcity'), M('unrest', -3, 'Plenty'), E('After Scarcity')]]);
  X('tn_d_fortress',
    ['The underground factories', 'Whole industries moved into the mountain, out of reach of any bomber.', [['build', B.FACTORY, 1], M('def', 0.03, 'Underground industry')]],
    ['The rocket gallery', 'A tunnel through the highest peak, with a rocket at each end.', [['techUp', 'mil'], ['threat', 6]]],
    ['The valley schools', 'Every lesson begins with the leader’s words and ends with them too.', [['discipline', 6], M('eff', 0.02, 'Disciplined valleys')]],
    ['The leader’s son', 'The son is given his own portrait, slightly smaller than his father’s.', [['charisma', 6], M('coup', -0.2, 'A named heir')]],
    ['The fortress at fifty', 'Fifty years behind the concrete. The valleys have forgotten what lies outside.', [L(4, 'The fortress at fifty'), ['tradition', 6]]],
    ['The sealed century', 'The passes have not opened in living memory.', [M('def', 0.05, 'The sealed century'), M('unrest', -3, 'Nothing to compare'), E('The Sealed Century')]]);
  X('tn_d_federation',
    ['Relay stations abroad', 'Communes in other countries host a node of the mesh.', [['subvertNb', 6], M('trade', 0.03, 'The foreign nodes')]],
    ['The federal bandwidth', 'A treaty that gives every free commune a share of the wire.', [n2('Vess', 'treaty'), n2('Norvik', 'treaty')]],
    ['The citizens’ terminals', 'Every household votes, argues and drafts laws from the kitchen table.', [['particip', 6], M('sci', 0.03, 'Citizens’ terminals')]],
    ['The open budget', 'Every coin the cantons spend, published on the wire the day it is spent.', [['corr', -10], L(3, 'The open budget')]],
    ['The mesh congress', 'A congress with no hall, no chair and no closing date.', [['glory', 6], ['opAll', 3]]],
    ['Nobody at the centre', 'Fifty years without a capital, and the trains still run.', [M('eff', 0.04, 'No centre'), L(4, 'Nobody at the centre'), E('The Federation With No Centre')]]);

  X('ve_d_free',
    ['The frontier assemblies', 'Villages on both sides of the border meet in the same field.', [['subvertNb', 8]]],
    ['The volunteer militias', 'Columns raised by the communes, disbanded by the communes.', [M('atk', 0.03, 'Volunteer militias'), M('regen', 0.1, 'The militias')]],
    ['The common workshops', 'Tools held in common, open to anyone with an idea and a morning free.', [['build', B.FACTORY, 1], M('eff', 0.02, 'Common workshops')]],
    ['The seed libraries', 'Seeds lent in spring and returned at harvest, doubled.', [M('food', 0.04, 'Seed libraries'), ['sup', 'peasants', 6]]],
    ['The fiftieth summer', 'Fifty summers of the free communes, celebrated in every square at once.', [['fervor', 6], ['particip', 6]]],
    ['Free for a lifetime', 'A generation has grown up that has never seen a landlord, a boss or a policeman.', [M('unrest', -3, 'A free generation'), L(4, 'Free for a lifetime'), E('The Generation of the Free')]]);
  X('ve_d_syndicate',
    ['The seamen’s union', 'Every crew that docks in Verano is offered a card.', [M('navy', 0.2, 'The seamen’s union'), M('trade', 0.03, 'Union ports')]],
    ['The international strike fund', 'Money for every strike on three continents, paid by every trade in Verano.', [['gold', -80], ['subvertNb', 6], ['glory', 6]]],
    ['The technical schools', 'Each trade trains its own apprentices, and argues about the syllabus.', [M('sci', 0.04, 'Technical schools'), ['sup', 'workers', 4]]],
    ['The federations’ bank', 'A bank owned by the unions, lending to the unions.', [M('rev', 0.04, 'The federations’ bank')]],
    ['The jubilee congress', 'The congress meets for the fiftieth time. The miners still sit closest to the stage.', [['particip', 6], ['glory', 6]]],
    ['The syndicate inherits', 'The founders’ grandchildren run the same factories, by the same vote.', [M('prod', 0.04, 'The syndicate'), L(4, 'The syndicate inherits'), E('The Syndicate That Lasted')]]);
  X('ve_d_unbowed',
    ['The border communes armed', 'A fort in every border village, built by the villagers.', [['build', B.FORT, 1], M('def', 0.03, 'Armed borders')]],
    ['The raid on the exile camps', 'The landowners’ camps across the border are emptied in one night.', [['subvertNb', 8], ['threat', 4]]],
    ['The militia rested', 'Half the militia sent home to the fields, with their rifles.', [M('ls', 1, 'The militia rested'), ['sup', 'workers', 4]]],
    ['Swords to tractors', 'The arsenals retooled to build machines for the fields.', [M('food', 0.04, 'Tractors'), M('prod', 0.03, 'Retooled arsenals')]],
    ['The anniversary of the strike', 'The general strike of 1909 is remembered with a day when nobody works.', [['fervor', 8], ['glory', 6]]],
    ['Still unbowed', 'Fifty years, three attacks, no surrender.', [L(4, 'Still unbowed'), M('def', 0.04, 'Still unbowed'), E('Unbowed for Fifty Years')]]);

  X('dr_d_greater',
    ['The frontier railways', 'Lines to every new frontier, laid for troop trains.', [['build', B.FACTORY, 1], M('speed', 0.05, 'Frontier railways')]],
    ['The river flotilla', 'Gunboats on all three rivers, from the mountains to the sea.', [M('navy', 0.2, 'The river flotilla'), M('atk', 0.03, 'River gunboats')]],
    ['The settlers’ land bank', 'Loans for Dravan families to farm the recovered provinces.', [M('food', 0.04, 'Settler farms'), ['gold', -60]]],
    ['The frontier regiments', 'Regiments raised in the new provinces, to guard them.', [M('regen', 0.1, 'Frontier regiments'), ['sup', 'military', 4]]],
    ['The jubilee of the return', 'Every recovered town celebrates the day the flag came back.', [['glory', 8], L(3, 'The return')]],
    ['The map that stayed', 'Twenty years without a lost province. The teachers finally have a map that stays the same.', [M('unrest', -3, 'Settled borders'), M('def', 0.04, 'Settled borders'), E('Keeper of the Old Map')]]);
  X('dr_d_kingdom',
    ['The king’s cavalry', 'Horse regiments in parade uniform, with tanks behind the parade.', [M('atk', 0.03, 'The king’s cavalry'), ['tradition', 4]]],
    ['The cousins’ treaty', 'The king’s cousins on two thrones sign whatever the king proposes.', [n2('Ruthe', 'bloc'), ['opAll', -2]]],
    ['The royal court reopens', 'Balls, hunts and orders of chivalry for every ambassador in the capital.', [['tradition', 6], ['gold', -40], ['opAll', 3]]],
    ['The crown estates', 'The royal forests and mines run as a business, for the treasury.', [M('rev', 0.04, 'The crown estates')]],
    ['The coronation jubilee', 'Twenty-five years of the restored throne.', [L(4, 'The jubilee'), ['glory', 4]]],
    ['The heir of the rivers', 'The crown prince commands a regiment and chairs a bank before he is thirty.', [M('coup', -0.2, 'The heir'), ['tradition', 6], E('The Crown of the Rivers')]]);
  X('dr_d_republic',
    ['The independent judges', 'Judges appointed for life, and none of them a colonel’s cousin.', [['corr', -6], L(3, 'Independent courts')]],
    ['The ombudsman', 'Any citizen may complain about any official, and get an answer.', [M('unrest', -2, 'The ombudsman'), ['sup', 'intelligentsia', 4]]],
    ['The foreign investors', 'Western firms build factories on the rivers, and pay taxes on them.', [['gold', 120], M('trade', 0.03, 'Foreign investment')]],
    ['The river ports', 'Container docks where the colonels kept their gunboats.', [['build', B.PORT, 1], M('trade', 0.03, 'River ports')]],
    ['Thirty years without a colonel', 'The last pensioned colonel dies in his bed.', [M('coup', -0.2, 'No colonels left'), L(4, 'Thirty years')]],
    ['The ordinary republic', 'Drava’s elections are now so dull that the foreign correspondents stopped coming.', [M('ls', 2, 'An ordinary republic'), M('unrest', -3, 'Dull politics'), E('The Ordinary Republic')]]);

  X('ly_d_serene',
    ['The insurance houses', 'Every cargo on three continents insured in Lys, at Lysian rates.', [M('rev', 0.04, 'Insurance')]],
    ['The debt commission', 'A commission of the Houses to manage the debts of governments that cannot.', [n2('Varanth', 'toll'), ['gold', 100]]],
    ['The convoy charter', 'Lysian warships escort any merchant who pays.', [M('navy', 0.2, 'The convoys'), M('trade', 0.03, 'Escorted trade')]],
    ['The neutral flag', 'Any ship may fly the Lysian flag in war, for a fee.', [['opAll', 4]]],
    ['The thousandth year of the Houses', 'The oldest House opens its archive for one day. Several governments are embarrassed.', [['tradition', 8], ['glory', 6]]],
    ['The book still closed', 'Five families, a thousand years, and no new names.', [L(4, 'The book still closed'), M('trade', 0.04, 'The Houses'), E('The Thousand-Year Republic')]]);
  X('ly_d_thalasso',
    ['The pilots’ guild', 'A guild that licenses every pilot in the straits, and pays the admiralty.', [M('rev', 0.03, 'The pilots’ guild'), ['sup', 'capital', 4]]],
    ['The strait forts', 'Guns on both shores, so that no fleet passes without permission.', [['build', B.FORT, 2]]],
    ['The landing ships', 'Ships that can put a regiment on any beach in a morning.', [M('atk', 0.04, 'Landing ships'), ['techUp', 'mil']]],
    ['The coastal governors', 'Lysian residents in every harbour that owes the Houses money.', [['subvertNb', 6], ['threat', 4]]],
    ['The admiralty jubilee', 'The whole fleet, dressed overall, sails past the doge’s palace.', [['glory', 8], M('navy', 0.2, 'The jubilee fleet')]],
    ['The sea remembers', 'Every chart of the narrow seas is printed in Lys.', [L(4, 'The sea remembers'), M('trade', 0.04, 'Mastery of the seas'), E('The Sea Republic')]]);
  X('ly_d_freecity',
    ['The clearing house', 'Every bill of exchange on three continents settled in one room.', [M('rev', 0.03, 'The clearing house'), ['gold', 80]]],
    ['The commodity floor', 'Copper, wheat and oil traded in the old palace of the Houses.', [M('trade', 0.04, 'The commodity floor')]],
    ['The translators’ school', 'Every language of three continents taught in one building.', [['opAll', 4], M('sci', 0.03, 'Translators')]],
    ['The conference halls', 'Halls large enough for every delegation of every peace.', [['build', B.CITY, 1], ['glory', 4]]],
    ['The free city’s festival', 'A week of music in every square, paid for by the exchange.', [M('ls', 2, 'The festival')]],
    ['The city of everyone', 'Half the citizens were born elsewhere, and all of them vote.', [L(4, 'The city of everyone'), M('unrest', -3, 'Open city'), E('The City of Everyone')]]);

  X('ka_d_union',
    ['The mutual economic council', 'One trading bloc for every red government, priced in our currency.', [n2('Suyan', 'treaty'), M('trade', 0.04, 'The economic council')]],
    ['The pact of the camp', 'One command for every socialist army, with our marshal at its head.', [M('def', 0.04, 'The pact'), ['threat', 4]]],
    ['The rocket cities', 'Secret towns in the steppe, building rockets that can reach anywhere.', [M('sci', 0.05, 'Rocket cities'), ['gold', -100]]],
    ['The first satellite', 'A beeping sphere crosses every sky on earth, and every sky knows whose it is.', [['glory', 10], ['techUp', 'ind']]],
    ['The jubilee of the revolution', 'Fifty years since the fleet mutinied.', [L(4, 'The jubilee'), ['discipline', 6]]],
    ['The union in its maturity', 'Stable, powerful and a little tired.', [M('unrest', -3, 'Maturity'), M('prod', 0.04, 'The mature plan'), E('The Mature Union')]]);
  X('ka_d_commune',
    ['The training camps', 'Camps in the forest where revolutionaries from every country learn their trade.', [M('atk', 0.03, 'Training camps'), ['subvertNb', 6]]],
    ['The red fleet', 'The mutinous fleet reborn, larger, and sailing farther.', [M('navy', 0.3, 'The red fleet')]],
    ['Elected managers', 'Every factory director elected by the shop floor, and recalled by it.', [M('eff', 0.03, 'Elected managers'), ['particip', 6]]],
    ['The open congress', 'Any member may speak at the congress. Some speeches last three days.', [L(3, 'The open congress'), ['bureau', -6]]],
    ['The fiftieth year of the revolution', 'The revolution has not rested once in fifty years.', [['fervor', 8], ['glory', 6]]],
    ['The revolution renewed', 'Every generation makes its own revolution. Karsova now schedules them.', [M('unrest', -2, 'Renewal'), L(4, 'The revolution renewed'), E('The Revolution Renewed')]]);
  X('ka_d_market',
    ['The convertible currency', 'The currency may be changed for any other, at the bank, without a permit.', [M('trade', 0.04, 'A convertible currency'), ['gold', 80]]],
    ['Foreign banks in the capital', 'Western banks open branches across the square from party headquarters.', [M('rev', 0.03, 'Foreign banks'), ['op', 'Cassine', 8]]],
    ['A car for everyone', 'A small, loud, reliable car, and a waiting list measured in months instead of years.', [['build', B.FACTORY, 1], M('ls', 1, 'The people’s car')]],
    ['The holiday coast', 'Trade-union hotels on the southern sea, two weeks a year for every worker.', [M('ls', 1, 'Holidays'), ['sup', 'workers', 4]]],
    ['The reformed party', 'The party holds its first contested election for its own leadership.', [L(4, 'The reformed party'), ['particip', 6]]],
    ['The quiet transition', 'The plan becomes a guide, the market becomes a habit, and nobody storms anything.', [M('prod', 0.04, 'The transition'), M('unrest', -3, 'Calm'), E('The Gentle Revolution')]]);

  X('ru_d_greater',
    ['The legion staff college', 'Officers trained in the movement’s doctrine before the army’s.', [M('atk', 0.03, 'The staff college'), ['discipline', 4]]],
    ['The armoured legions', 'Tanks painted black, with the movement’s badge on the turret.', [['techUp', 'mil'], M('speed', 0.05, 'Armoured legions')]],
    ['The colonial schools', 'Ruthene schools in every recovered village, and no others.', [M('unrest', -2, 'Ruthene schools'), ['sup', 'peasants', 4]]],
    ['The labour service', 'Every young man digs, builds and marches for a year.', [['build', B.FACTORY, 1], M('prod', 0.03, 'Labour service')]],
    ['The movement’s anniversary', 'Torches on every hill, for the night of the march on the capital.', [['charisma', 6], ['glory', 6]]],
    ['The black century', 'The movement has outlived its founders, and taught their grandchildren to salute.', [L(4, 'The black century'), M('coup', -0.2, 'The movement’s grip'), E('The Black Century')]]);
  X('ru_d_fortress',
    ['The mountain depots', 'Food, fuel and shells for a year, under the mountains.', [M('def', 0.03, 'Mountain depots'), ['equip', 0.05]]],
    ['The national guard', 'Every citizen between eighteen and fifty, on call.', [M('regen', 0.1, 'The national guard')]],
    ['The grain reserve', 'Three harvests stored against the next siege.', [M('food', 0.04, 'The grain reserve')]],
    ['The village councils', 'Every village governs itself, and answers to nobody abroad.', [['particip', 6], M('unrest', -2, 'Village councils')]],
    ['The day of the redoubt', 'A national holiday for the day Ruthe signed nothing.', [['glory', 6], ['tradition', 6]]],
    ['Alone and whole', 'No ally, no debt, no lost village, after fifty years.', [L(4, 'Alone and whole'), M('def', 0.04, 'Alone and whole'), E('Alone and Whole')]]);
  X('ru_d_republic',
    ['The border crossings opened', 'Families separated for a generation cross the frontier on a Sunday.', [M('trade', 0.03, 'Open crossings'), ['opAll', 3]]],
    ['The minority schools', 'Schools in their own language for the people inside our borders, too.', [M('unrest', -2, 'Minority schools'), ['sup', 'intelligentsia', 4]]],
    ['The farmers’ cooperatives', 'The new smallholders pool their machines and their harvests.', [M('food', 0.04, 'Farmers’ cooperatives')]],
    ['The small factories', 'Workshops in every market town, making what the town needs.', [['build', B.FACTORY, 1]]],
    ['The republic’s anniversary', 'Twenty-five years since the trials.', [L(4, 'The anniversary')]],
    ['The movement forgotten', 'Students now need a footnote to explain the black shirts.', [M('unrest', -3, 'Forgetting'), M('ls', 2, 'Peace'), E('The Healed Republic')]]);

  X('su_d_celestial',
    ['The tribute fleets', 'The treasure ships sail again, carrying silk out and bringing gifts back.', [M('navy', 0.3, 'The tribute fleets'), ['gold', 80]]],
    ['The bannermen modernised', 'The banner armies given rifles, artillery and foreign instructors.', [['techUp', 'mil']]],
    ['The great dykes', 'The river walled from the mountains to the sea.', [M('food', 0.04, 'The great dykes'), ['build', B.CITY, 1]]],
    ['The imperial academies', 'Academies of science beside the academies of the classics.', [M('sci', 0.05, 'Imperial academies')]],
    ['The emperor’s sixtieth year', 'A full cycle of years on the throne, marked with an amnesty and a feast.', [['tradition', 8], L(3, 'The sixtieth year')]],
    ['Heaven’s mandate kept', 'No flood, no famine, no rebellion in a generation. The old books call it the mandate.', [M('unrest', -3, 'The mandate kept'), ['glory', 6], E('The Kept Mandate')]]);
  X('su_d_strong',
    ['The northern arsenals', 'Arsenals in the north, beyond the reach of any foreign fleet.', [['build', B.FACTORY, 1], ['equip', 0.05]]],
    ['The general staff', 'A staff college that teaches war on the scale of a continent.', [M('atk', 0.03, 'The general staff'), ['discipline', 4]]],
    ['The container ports', 'Cranes along the whole coast, loading the world’s goods.', [['build', B.PORT, 1], M('trade', 0.04, 'Container ports')]],
    ['The engineering schools', 'A million engineers a year.', [M('sci', 0.05, 'Engineering schools')]],
    ['The humiliation ends', 'The last foreign garrison leaves, and the last unequal treaty is burned.', [['glory', 10], L(3, 'Sovereignty')]],
    ['The great power of the river', 'The sleeper has been awake for a generation, and nobody calls it a sleeper now.', [M('prod', 0.04, 'The river power'), ['opAll', 2], E('The River Power')]]);
  X('su_d_people',
    ['The guerrilla schools', 'Schools in the hills for the guerrillas of three continents.', [['subvertNb', 6], M('def', 0.03, 'Guerrilla schools')]],
    ['The people’s militias', 'Every commune its own militia, every militia its own commune.', [M('regen', 0.15, 'People’s militias')]],
    ['The irrigation brigades', 'Millions of villagers digging canals in the winter months.', [M('food', 0.05, 'Irrigation brigades')]],
    ['Rural industry', 'Small foundries and workshops in every commune.', [['build', B.FACTORY, 1], M('prod', 0.03, 'Rural industry')]],
    ['The long march remembered', 'The routes of the old marches are walked again by schoolchildren.', [['fervor', 8], ['glory', 6]]],
    ['The villages’ century', 'The countryside surrounded the cities, and then fed them.', [M('unrest', -3, 'Fed villages'), L(4, 'The villages’ century'), E('The Villages Victorious')]]);

  X('he_d_greater',
    ['The armoured divisions', 'Tanks in numbers no general of the old wars imagined.', [['techUp', 'mil'], M('atk', 0.03, 'Armoured divisions')]],
    ['The air fleet', 'Bombers that can reach any capital on the continent.', [M('atk', 0.04, 'The air fleet'), ['threat', 4]]],
    ['Synthetic fuel', 'Oil made from coal, at any price.', [['build', B.FACTORY, 1], M('prod', 0.03, 'Synthetic fuel')]],
    ['The labour battalions', 'The unemployed sent in uniform to build the wall.', [M('prod', 0.03, 'Labour battalions'), ['sup', 'workers', -4]]],
    ['The day of the state', 'Parades in every district, and the same speech on every radio.', [['charisma', 6], ['discipline', 6]]],
    ['The anvil cools', 'The iron state lasts longer than anyone expected, and leaves less than anyone hoped.', [L(4, 'The iron state'), M('eff', 0.03, 'The iron state'), E('The Iron State')]]);
  X('he_d_technate',
    ['The interconnectors', 'Cables under every river to every neighbouring grid.', [n2('Aurelia', 'treaty'), M('prod', 0.03, 'Interconnectors')]],
    ['The continental dispatch office', 'One office decides how much power every city on the continent may use tonight.', [M('trade', 0.03, 'The dispatch office'), ['subvertNb', 4]]],
    ['The computing centres', 'Calculating machines the size of houses, running the plan.', [M('eff', 0.04, 'Computing centres'), M('sci', 0.03, 'Computing')]],
    ['The planners’ academy', 'The best students in the country trained to optimise everything.', [['sup', 'intelligentsia', 6], M('eff', 0.02, 'The planners’ academy')]],
    ['The fiftieth energy budget', 'Half a century of the state balanced in kilowatt-hours.', [M('prod', 0.03, 'The energy budget'), L(3, 'The energy budget')]],
    ['The machine at rest', 'The system has no more problems to solve. It starts on the citizens’ hobbies.', [M('ls', 2, 'Solved'), M('unrest', -2, 'Solved'), E('The Finished System')]]);
  X('he_d_republic',
    ['The apprenticeship system', 'Every school leaver apprenticed to a master, every master certified by the state.', [M('eff', 0.03, 'Apprenticeships'), ['sup', 'workers', 4]]],
    ['The trade fairs', 'Every buyer on three continents comes to our fairs each spring.', [M('trade', 0.04, 'Trade fairs'), ['opAll', 2]]],
    ['The youth exchanges', 'Every schoolchild spends a summer with a family in a country we once invaded.', [['opAll', 4]]],
    ['The reparations fund', 'Payments to every victim, every year, until the last one dies.', [['gold', -150], ['opAll', 5]]],
    ['The fiftieth day of remembrance', 'The names are still read at eleven o’clock. The list is not shorter.', [L(4, 'Remembrance'), ['grievance', -6]]],
    ['The trusted century', 'The country that started two wars is now the one every neighbour calls first.', [M('trade', 0.04, 'Trust'), M('unrest', -2, 'Trust'), E('The Forgiven Nation')]]);

  X('ir_d_holy',
    ['The faithful’s militias', 'A militia of volunteers in every shrine, answering to the council.', [M('regen', 0.1, 'The faithful’s militias'), ['threat', 4]]],
    ['The pilgrims’ road', 'Pilgrims from every neighbouring land travel to the holy city, and take its sermons home.', [M('trade', 0.03, 'Pilgrims'), ['subvertNb', 4]]],
    ['The seminaries', 'Seminaries that teach law, medicine and the faith together.', [['sup', 'clergy', 6], M('sci', 0.02, 'Seminaries')]],
    ['The alms granaries', 'Grain collected as alms and stored against the dry years.', [M('food', 0.04, 'Alms granaries')]],
    ['The council’s jubilee', 'Twenty-five years of the guardianship.', [L(4, 'The jubilee'), ['sup', 'clergy', 4]]],
    ['The guardians’ succession', 'The council chooses its own successors, and the faithful accept them.', [M('coup', -0.2, 'A settled council'), ['tradition', 6], E('The Unbroken Guardianship')]]);
  X('ir_d_shah',
    ['Officers abroad', 'Irkali officers trained in the best staff colleges of three continents.', [M('atk', 0.03, 'Trained officers'), ['discipline', 4]]],
    ['The islands of the gulf', 'The shah claims every island in the gulf, and sends the navy to say so.', [['claimsAll'], ['threat', 4]]],
    ['The literacy corps', 'Conscripts sent to teach in the villages instead of marching.', [M('sci', 0.03, 'The literacy corps'), ['sup', 'peasants', 4]]],
    ['The steel mill', 'A steel mill in the desert, built by foreign engineers and paid for in oil.', [['build', B.FACTORY, 1]]],
    ['The great celebration', 'A tent city in the desert, kings from forty countries, and the bill sent to the treasury.', [['glory', 10], ['gold', -150], ['sup', 'clergy', -4]]],
    ['The crown’s heir', 'The crown prince flies jets and studies abroad, and the generals approve of both.', [M('coup', -0.2, 'The heir'), L(4, 'The heir'), E('The Oil Dynasty')]]);
  X('ir_d_assembly',
    ['The tanker fleet', 'Irkali oil carried in Irkali ships.', [M('navy', 0.2, 'The tanker fleet'), M('trade', 0.03, 'Our own tankers')]],
    ['The cartel’s secretariat', 'The cartel’s offices in our capital, and its secretary-general an Irkali.', [['opAll', 2], ['gold', 80]]],
    ['The oil fund', 'A share of every barrel saved for the day the wells run dry.', [['gold', 150], M('rev', 0.02, 'The oil fund')]],
    ['The national university', 'A university for ten thousand students, paid for by the oil.', [M('sci', 0.04, 'The national university')]],
    ['The jubilee of nationalisation', 'Twenty-five years since the foreign managers left.', [['glory', 6], L(3, 'Nationalisation')]],
    ['The oil that stayed home', 'The wells, the refineries and the profits are all still Irkali.', [M('ls', 2, 'Our own oil'), M('unrest', -3, 'Pride'), E('Master of Its Own Oil')]]);

  X('pa_d_kingdom',
    ['The mountain regiments', 'Regiments raised in the high valleys, loyal to the house.', [M('def', 0.03, 'Mountain regiments'), M('regen', 0.1, 'The mountain regiments')]],
    ['The pretender’s letters', 'Letters to the valleys across the border, signed by our king.', [['subvertNb', 6]]],
    ['The royal foundation', 'Hospitals and orphanages under the queen’s patronage.', [M('ls', 1, 'The royal foundation'), ['gold', -50], L(2, 'Royal charity')]],
    ['The prince’s education', 'The prince studies law, war and the names of every important family.', [['tradition', 6], M('eff', 0.02, 'An educated prince')]],
    ['The dynasty’s jubilee', 'Twenty-five years of the new house.', [L(3, 'The jubilee'), ['glory', 4]]],
    ['The third king', 'The Marshal’s grandson takes the throne, and nobody remembers that it was ever new.', [M('coup', -0.2, 'An old dynasty'), ['tradition', 6], E('The House of the Marshal')]]);
  X('pa_d_marshalate',
    ['The reserve divisions', 'Every man who served is called back for a month each year.', [M('regen', 0.1, 'Reserve divisions'), ['equip', 0.05]]],
    ['The mountain artillery', 'Guns hauled to every peak along the border.', [['build', B.FORT, 1], M('atk', 0.03, 'Mountain artillery')]],
    ['The officers’ housing', 'New flats for every officer, built before anyone else’s.', [['sup', 'military', 6], ['gold', -40]]],
    ['The cadet schools', 'Boarding schools that turn farm boys into staff officers.', [['discipline', 6], M('eff', 0.02, 'Cadet schools')]],
    ['The Marshal’s centenary', 'A hundred years since his birth. The general staff unveils the largest statue yet.', [['charisma', 6], ['glory', 6]]],
    ['The staff’s succession', 'The seven generals become seven different generals, and the empty chair stays empty.', [M('coup', -0.2, 'The staff’s succession'), L(3, 'Continuity'), E('The Staff Eternal')]]);
  X('pa_d_republic',
    ['The valley budgets', 'Each valley spends its own taxes, and publishes the accounts on the temple door.', [['corr', -6], M('eff', 0.02, 'Valley budgets')]],
    ['The referendum', 'Any law may be put to the whole people if enough valleys ask.', [['particip', 6], L(2, 'The referendum')]],
    ['The ski resorts', 'The Marshal’s hunting lodges turned into hotels for foreign skiers.', [M('trade', 0.03, 'Ski resorts'), ['gold', 60]]],
    ['The tunnel under the pass', 'A tunnel through the mountain that once kept the world out.', [['build', B.CITY, 1], M('prod', 0.03, 'The tunnel')]],
    ['The museum of the Marshal', 'The forty thousand portraits finally put on display, all at once.', [M('unrest', -2, 'History faced'), ['sup', 'intelligentsia', 4]]],
    ['The free mountain', 'A generation born after the portraits came down.', [L(4, 'The free mountain'), M('ls', 2, 'The free mountain'), E('The Free Mountain')]]);

  X('mx_d_singularity',
    ['The reactor ring', 'A ring of reactors around the capital, feeding the model.', [['build', B.FACTORY, 1], M('prod', 0.03, 'The reactor ring')]],
    ['The model writes the model', 'The optimiser rewrites itself every night. The engineers read the changes in the morning, when they can.', [M('sci', 0.05, 'Self-improvement'), ['supAll', -2]]],
    ['Predictive policing', 'Officers arrive before the crime, and sometimes before the criminal has decided.', [M('unrest', -2, 'Predicted crime'), ['corr', -4]]],
    ['The basic dividend', 'Every citizen paid a share of the machine’s output, monthly.', [M('ls', 2, 'The basic dividend'), ['sup', 'workers', 4]]],
    ['The curve’s report', 'The model publishes its first report to the citizens. It is very long and very polite.', [L(3, 'The report'), M('eff', 0.03, 'Transparency')]],
    ['What the curve wanted', 'The model completes its last objective, and sets itself a new one. It does not say what.', [M('prod', 0.05, 'The curve’s purpose'), E('The Answered Question')]]);
  X('mx_d_patchwork',
    ['The charter law school', 'Lawyers trained to write constitutions for any city that wants one.', [M('sci', 0.03, 'The charter law school'), ['opAll', 2]]],
    ['The arbitration court', 'One court that settles disputes between charters, and every charter accepts it.', [M('trade', 0.03, 'Arbitration'), ['corr', -4]]],
    ['The inter-city railway', 'A train every ten minutes between every pair of charters.', [['build', B.CITY, 1], M('eff', 0.02, 'The inter-city railway')]],
    ['The city rankings', 'Every city scored every quarter on price, safety and service. The bottom three change management.', [M('eff', 0.03, 'City rankings')]],
    ['The patchwork census', 'A hundred cities count their residents. Most residents have lived in three.', [M('ls', 1, 'Choice'), ['particip', 4]]],
    ['The patchwork endures', 'A hundred governments and no civil war in fifty years.', [M('unrest', -2, 'Exit works'), M('trade', 0.04, 'The patchwork'), E('The Patchwork Century')]]);
  X('mx_d_crown',
    ['The crown’s agents', 'Brokers in every neighbouring capital, buying influence by the share.', [['subvertNb', 6], ['gold', -50]]],
    ['The merger offers', 'Formal offers for neighbouring provinces, with a premium over market value.', [n2('Antara', 'treaty'), ['gold', 80]]],
    ['The infrastructure fund', 'A fund that maintains every road, pipe and bridge the crown owns.', [['build', B.FACTORY, 1], M('prod', 0.02, 'Infrastructure')]],
    ['The citizens’ warranty', 'Any service the kingdom fails to deliver is refunded.', [M('ls', 1, 'The warranty'), M('unrest', -2, 'The warranty')]],
    ['The quarterly jubilee', 'A hundred consecutive quarters of profit, announced by the king himself.', [L(3, 'A hundred quarters'), ['gold', 100]]],
    ['The kingdom as heirloom', 'The king hands the kingdom to his heir in better condition than he received it, and the auditors agree.', [M('eff', 0.04, 'Careful ownership'), ['tradition', 6], E('The Heirloom Kingdom')]]);

  X('an_d_peaceful',
    ['The officers’ oath', 'Every officer swears again to the constitution, on television.', [M('coup', -0.2, 'The oath'), ['sup', 'military', 2]]],
    ['The fourth election', 'The socialists lose, hand over power, and win again four years later.', [L(3, 'Alternation'), ['particip', 6]]],
    ['The copper smelters', 'The ore refined at home instead of shipped abroad.', [['build', B.FACTORY, 1], M('prod', 0.03, 'Copper smelters')]],
    ['The southern conference', 'Every left party of the southern continent meets in our capital.', [['glory', 6], ['opAll', 3]]],
    ['The constitution’s centenary', 'A hundred years of the same constitution, through every government.', [L(4, 'A hundred years')]],
    ['Socialism by the book', 'Every article of the constitution kept, and the commanding heights in the people’s hands.', [M('unrest', -2, 'Lawful socialism'), M('ls', 2, 'Lawful socialism'), E('Socialism by the Book')]]);
  X('an_d_armed',
    ['The training camps', 'Camps in the copper mountains for guerrillas from across the continent.', [M('atk', 0.03, 'Training camps'), ['subvertNb', 4], ['equip', 0.05]]],
    ['The southern army', 'A people’s army larger than any on the southern continent.', [M('regen', 0.1, 'The southern army'), ['threat', 4]]],
    ['The nationalised ports', 'Every crane on the coast owned by the people.', [M('trade', 0.03, 'Nationalised ports'), M('rev', 0.03, 'Port revenue')]],
    ['The party schools', 'Every manager trained by the party before the ministry.', [['discipline', 6], M('eff', 0.02, 'Party schools')]],
    ['The anniversary of the rising', 'Twenty-five years since the miners took the mountains.', [['fervor', 6], ['glory', 6]]],
    ['The people’s century', 'The revolution has outlived every coup, every blockade and every prediction.', [L(4, 'The people’s century'), M('unrest', -2, 'A settled revolution'), E('The People’s Century')]]);
  X('an_d_social',
    ['The infrastructure fund', 'Roads and ports built from the copper fund, one a year.', [['build', B.CITY, 1]]],
    ['Beyond copper', 'Wine, fruit and timber sold abroad, so that one metal no longer decides every budget.', [M('trade', 0.04, 'Diversified exports')]],
    ['The pension law', 'A pension for every worker, indexed to prices.', [M('ls', 1, 'Pensions'), ['sup', 'workers', 4]]],
    ['The hospital network', 'A hospital in every province, staffed by the national service.', [M('growth', 0.05, 'Hospitals')]],
    ['Ten budgets in a row', 'Ten balanced budgets, and no economist can explain why it is so rare.', [M('eff', 0.03, 'Balanced budgets'), L(2, 'Prudence')]],
    ['The patient century', 'A hundred years of promises made small and kept.', [M('unrest', -2, 'Patience'), M('prod', 0.03, 'Patience'), E('The Patient Century')]]);

  X('ke_d_company',
    ['Overseas plantations', 'Kelda Company buys estates on three continents.', [M('food', 0.03, 'Plantations'), ['gold', 80]]],
    ['The holding board', 'One board that manages every foreign holding, and reports to every shareholder.', [M('rev', 0.03, 'The holding board')]],
    ['The share school', 'Every child taught to read a balance sheet.', [M('sci', 0.03, 'The share school')]],
    ['The annual general meeting', 'Every citizen-shareholder may vote on the island’s budget, by proxy if necessary.', [['particip', 6], L(2, 'The general meeting')]],
    ['The company’s jubilee', 'Fifty years of dividends. A special one is declared.', [['gold', 150]]],
    ['The incorporated century', 'An island that has never had a bad quarter it could not explain.', [M('trade', 0.04, 'The company'), M('unrest', -2, 'Contented shareholders'), E('The Incorporated Century')]]);
  X('ke_d_haven',
    ['The trust companies', 'Trusts that own companies that own trusts, all registered in one office.', [M('rev', 0.04, 'Trust companies')]],
    ['The bearer bonds', 'Bonds that belong to whoever holds them, no names asked.', [['gold', 150], ['opAll', -2]]],
    ['The island’s lawyers', 'The best lawyers on three continents, all of them on retainer.', [['opAll', 3]]],
    ['The coastal batteries', 'A few guns, discreetly placed, for appearances.', [['build', B.FORT, 1], M('def', 0.03, 'Coastal batteries')]],
    ['The vault’s centenary', 'A hundred years without a single account disclosed.', [['gold', 150]]],
    ['Nothing to declare', 'Every customs officer on the island has the same answer.', [M('trade', 0.04, 'Nothing to declare'), L(3, 'Discretion'), E('Nothing to Declare')]]);
  X('ke_d_republic',
    ['The reef forts', 'Small forts on every reef that a landing craft would have to cross.', [['build', B.FORT, 1]]],
    ['The rifle clubs', 'A club in every parish, with a range and a bar.', [M('regen', 0.1, 'Rifle clubs'), ['sup', 'peasants', 4]]],
    ['The land law', 'No estate larger than a family can work.', [['law', 'land', 'smallholder'], ['sup', 'peasants', 4]]],
    ['The island college', 'A college for the sons and daughters of freeholders.', [M('sci', 0.04, 'The island college')]],
    ['The muster’s anniversary', 'Every freeholder answers the bell on the same day, for the fun of it.', [['glory', 6], ['tradition', 6]]],
    ['Free for a century', 'A hundred years without a lord, a landlord or a foreign flag.', [L(4, 'A free century'), M('def', 0.03, 'A free century'), E('The Century of Freeholders')]]);

  X('vs_d_seas',
    ['Sailors’ councils abroad', 'Crews in foreign ports elect councils, and write to Vess for advice.', [['subvert', 'Cassine', 8], ['subvert', 'Lys', 8]]],
    ['The port congress', 'Delegates from every red port meet aboard the cruiser.', [['glory', 6], M('trade', 0.03, 'The port congress')]],
    ['The harbour cooperatives', 'The docks, the fish markets and the chandlers owned by the people who use them.', [M('food', 0.03, 'Harbour cooperatives'), ['particip', 4]]],
    ['The ferry network', 'Ferries to every free island, free of charge.', [['build', B.PORT, 1]]],
    ['The mutiny’s anniversary', 'The cruiser fires a salute at dawn, aimed carefully at nothing.', [['fervor', 6], ['glory', 6]]],
    ['The federation of the waves', 'The islands are free, the coasts are free, and the sea is busy.', [L(4, 'The federation of the waves'), M('navy', 0.2, 'The free fleet'), E('The Federation of the Waves')]]);
  X('vs_d_commune',
    ['The newcomers’ assemblies', 'Every new arrival may speak at the hill assembly after one month on the island.', [['particip', 6], M('unrest', -2, 'Welcome')]],
    ['The radio of the isle', 'A small transmitter that every rebel on the coast listens to at night.', [['subvertNb', 6]]],
    ['The common boatyards', 'Boats built by whoever needs one, with help from everyone.', [['build', B.PORT, 1]]],
    ['The island school', 'A school with no grades, no bells and very good results.', [M('sci', 0.03, 'The island school')]],
    ['The fiftieth assembly', 'The hill assembly meets for the fiftieth year. It rains, as usual.', [['particip', 6], ['glory', 4]]],
    ['Nobody in charge', 'Fifty years without a ruler, and the harbour is still the best run on the coast.', [L(4, 'Nobody in charge'), M('ls', 1, 'Nobody in charge'), E('The Isle Without Rulers')]]);
  X('vs_d_fortress',
    ['The coastal radar', 'Masts on every headland, watching the mainland.', [M('def', 0.03, 'The coastal radar'), ['equip', 0.05]]],
    ['The island air force', 'Fighters in hardened shelters under the hills.', [M('atk', 0.03, 'The island air force'), ['threat', 4]]],
    ['The cannery combine', 'One combine that cans the whole island’s catch.', [M('food', 0.04, 'The cannery'), ['build', B.FACTORY, 1]]],
    ['The island polyclinics', 'A clinic in every harbour town, open all night.', [M('growth', 0.05, 'Polyclinics'), M('ls', 1, 'Polyclinics')]],
    ['The fortress jubilee', 'Twenty-five years of the island republic.', [['discipline', 6], ['glory', 4]]],
    ['The fortress outlasting', 'The siege never came. The island stayed ready anyway.', [L(4, 'The fortress outlasting'), M('unrest', -2, 'Ready'), E('The Fortress That Outlasted the Siege')]]);

  X('va_d_empire',
    ['The pilgrims’ railway', 'A railway to the holy cities, built by the sultan’s engineers.', [['build', B.FACTORY, 1], M('speed', 0.04, 'The pilgrims’ railway')]],
    ['The imperial cavalry', 'Tribal horsemen enrolled as imperial regiments.', [M('atk', 0.03, 'Imperial cavalry'), M('regen', 0.1, 'Tribal regiments')]],
    ['The straits commission', 'An international commission for the straits, chaired by the sultan’s minister.', [M('trade', 0.04, 'The straits commission'), ['opAll', 2]]],
    ['The imperial schools', 'Schools for every faith of the empire, under one inspectorate.', [M('sci', 0.03, 'Imperial schools'), ['sup', 'clergy', 4]]],
    ['The jubilee of the sword', 'Twenty-five years since the sultan was girded.', [['tradition', 8], ['glory', 6]]],
    ['The empire renewed', 'The empire of many peoples outlives the century that said empires were over.', [L(4, 'The empire renewed'), M('unrest', -2, 'An old empire'), E('The Renewed Empire')]]);
  X('va_d_arrows',
    ['The modern divisions', 'An army rebuilt on the latest foreign model.', [['techUp', 'mil']]],
    ['The frontier treaties', 'Every border fixed by treaty, and every treaty kept.', [['opAll', 4], M('def', 0.03, 'Fixed borders')]],
    ['The village institutes', 'Teachers trained in the villages, for the villages.', [M('sci', 0.03, 'Village institutes'), ['sup', 'peasants', 4]]],
    ['The new capital', 'A capital built on the plateau, far from the old city and its old ideas.', [['build', B.CITY, 1], L(2, 'The new capital')]],
    ['The republic’s anniversary', 'Fifty years of the six arrows.', [L(4, 'The anniversary'), ['glory', 4]]],
    ['The founder’s century', 'A hundred years after the founder, his portrait is still in every classroom.', [M('unrest', -2, 'The founder’s legacy'), M('eff', 0.03, 'The founder’s legacy'), E('The Founder’s Century')]]);
  X('va_d_bridge',
    ['The customs union', 'A customs union with the western powers.', [n2('Hesperia', 'treaty'), M('trade', 0.03, 'The customs union')]],
    ['The bridge over the straits', 'A suspension bridge joining two continents.', [['build', B.CITY, 1], M('trade', 0.03, 'The bridge')]],
    ['The water treaty', 'The rivers shared by treaty with the desert kingdoms downstream.', [n2('Sahrem', 'treaty'), M('food', 0.03, 'Shared water')]],
    ['The regional bank', 'A development bank for the Old Lands, headquartered on the straits.', [['gold', -80], ['opAll', 4]]],
    ['The jubilee of the straits', 'Fifty years of open water.', [['glory', 6], ['opAll', 3]]],
    ['Where the continents meet', 'Every road between east and west runs through our capital.', [L(4, 'The meeting place'), M('trade', 0.04, 'The meeting place'), E('Where the Continents Meet')]]);

  X('kh_d_rais',
    ['The voice of the nation abroad', 'The president’s speeches broadcast to every country of the Old Lands.', [['subvertNb', 6]]],
    ['The national army reformed', 'New tanks, new officers, and no more defeats.', [['techUp', 'mil'], M('atk', 0.02, 'The reformed army')]],
    ['The aluminium works', 'A smelter powered by the dam.', [['build', B.FACTORY, 1]]],
    ['The new valley', 'A second valley irrigated in the western desert.', [M('food', 0.04, 'The new valley'), M('growth', 0.05, 'The new valley')]],
    ['The anniversary of the revolution', 'Twenty-five years since the officers took the palace.', [['charisma', 6], ['glory', 6]]],
    ['The president’s century', 'The president is long dead. Every president since has used his portrait.', [L(4, 'The president’s legacy'), M('unrest', -2, 'The legacy'), E('The President’s Century')]]);
  X('kh_d_kingdom',
    ['The cotton mills', 'Spinning mills on the river, using our own cotton.', [['build', B.FACTORY, 1]]],
    ['The film studios', 'Films in our language, watched from the ocean to the gulf.', [M('trade', 0.03, 'Film studios'), ['glory', 4]]],
    ['The canal zone', 'Docks and warehouses along the canal, owned by the nation.', [['build', B.PORT, 1], M('trade', 0.03, 'The canal zone')]],
    ['The royal university', 'A university to rival the old ones abroad.', [M('sci', 0.04, 'The royal university')]],
    ['The king’s jubilee', 'Twenty-five years of a king who reigns and does not rule.', [['tradition', 6], L(3, 'The jubilee')]],
    ['The long golden age', 'The liberal age was supposed to be a phase. It turned out to be the country.', [M('unrest', -2, 'The golden age'), M('ls', 2, 'The golden age'), E('The Long Golden Age')]]);
  X('kh_d_faith',
    ['The brotherhood’s press', 'Newspapers and pamphlets in every country of the Old Lands.', [['subvertNb', 6]]],
    ['The volunteers of the faith', 'Volunteers for every struggle of the faithful abroad.', [M('atk', 0.03, 'The volunteers'), ['threat', 4]]],
    ['The brotherhood’s hospitals', 'Hospitals in every district, run by the brotherhood’s doctors.', [M('growth', 0.05, 'The brotherhood’s hospitals')]],
    ['The religious courts', 'Courts that judge by the faith, and are hard to bribe.', [['corr', -6], ['sup', 'clergy', 4]]],
    ['The brotherhood’s jubilee', 'Twenty-five years of the guided republic.', [L(3, 'The jubilee'), ['sup', 'clergy', 4]]],
    ['The guided century', 'The faith is the law, and the law has outlived its founders.', [M('unrest', -2, 'Guidance'), ['tradition', 6], E('The Guided Century')]]);

  X('bk_d_republic',
    ['The republican guard', 'An elite guard for the capital, loyal to the party first.', [M('coup', -0.2, 'The republican guard'), M('atk', 0.02, 'The guard')]],
    ['The arms purchases', 'Tanks and jets bought from anyone who will sell them.', [['equip', 0.1], ['gold', -120]]],
    ['The literacy campaign', 'Every adult taught to read in two years, by law.', [M('sci', 0.03, 'Literacy'), ['sup', 'peasants', 4]]],
    ['The free hospitals', 'Free care for every citizen, paid for by the oil.', [M('growth', 0.05, 'Free hospitals')]],
    ['The party’s jubilee', 'Twenty-five years of the party’s republic.', [['discipline', 6], ['glory', 6]]],
    ['The renaissance republic', 'The richest and best-educated republic in the Old Lands.', [L(4, 'The renaissance'), M('prod', 0.03, 'The renaissance'), E('The Renaissance Republic')]]);
  X('bk_d_kingdom',
    ['The king’s officers', 'Officers promoted for loyalty to the throne, and watched for anything else.', [['sup', 'military', 4], ['discipline', 4]]],
    ['The frontier treaty', 'A treaty fixing every border with every neighbour.', [['opAll', 3], M('def', 0.03, 'Fixed borders')]],
    ['The oil refinery', 'A refinery of our own, so that we stop buying back our own oil.', [['build', B.FACTORY, 1]]],
    ['The great dam', 'A dam on the northern river, ending the spring floods.', [M('food', 0.04, 'The great dam'), ['build', B.CITY, 1]]],
    ['The king’s jubilee', 'Twenty-five years on the throne.', [['tradition', 6], L(3, 'The jubilee')]],
    ['The kingdom that lasted', 'The colonels never came. The king died in his bed.', [M('unrest', -2, 'Continuity'), M('prod', 0.03, 'Development'), E('The Kingdom That Lasted')]]);
  X('bk_d_federation',
    ['The joint staff', 'A general staff with a seat for every province.', [M('def', 0.03, 'The joint staff'), ['discipline', 4]]],
    ['The census agreement', 'A census that every province accepts, the first in fifty years.', [M('unrest', -2, 'The census'), L(2, 'The census')]],
    ['The federal radio', 'Broadcasts in every language of the federation.', [M('sci', 0.02, 'The federal radio'), ['sup', 'intelligentsia', 4]]],
    ['The pipelines', 'Pipelines to every port, shared by every province.', [M('trade', 0.03, 'Pipelines'), ['build', B.FACTORY, 1]]],
    ['The federation’s jubilee', 'Twenty-five years of the federation.', [L(3, 'The jubilee'), ['glory', 4]]],
    ['Three peoples, one century', 'A century in which three peoples argued constantly and never once went to war.', [M('unrest', -3, 'Argument, not war'), M('ls', 1, 'Shared wealth'), E('Three Peoples, One Century')]]);

  X('am_d_free',
    ['The hilltop forts', 'A fort on every hill that looks over the old lines.', [['build', B.FORT, 1]]],
    ['The frontier villages', 'Villages rebuilt along the border, farmed by the families who left them.', [M('food', 0.03, 'Frontier villages'), ['sup', 'peasants', 4]]],
    ['The packing houses', 'Fruit packed at home and shipped abroad under our own label.', [['build', B.FACTORY, 1], M('trade', 0.02, 'Our own label')]],
    ['The new villages', 'New villages for the families still in the camps.', [['build', B.CITY, 1], M('growth', 0.05, 'New villages')]],
    ['The day of the land', 'Every village plants a tree on the same day.', [['glory', 6], L(3, 'The day of the land')]],
    ['The land and its people', 'The land is farmed by the people who were born on it.', [M('unrest', -3, 'Home'), M('food', 0.03, 'Home'), E('The Land and Its People')]]);
  X('am_d_twostates',
    ['The joint police', 'Patrols with one officer from each side.', [M('unrest', -2, 'Joint patrols'), ['corr', -4]]],
    ['Schools of both peoples', 'Schools where children learn both languages and both histories.', [M('sci', 0.03, 'Shared schools'), ['opAll', 2]]],
    ['The water authority', 'One authority for the aquifers both peoples drink from.', [M('food', 0.04, 'The water authority')]],
    ['The open border markets', 'Markets on the border, open to both sides every day.', [M('trade', 0.04, 'Border markets')]],
    ['The peace’s anniversary', 'Twenty years of the treaty. Nobody celebrates; nobody objects.', [['opAll', 4], L(3, 'Twenty years')]],
    ['Two flags, one generation', 'A generation grows up that has never known the war.', [M('unrest', -2, 'A generation of peace'), M('ls', 2, 'Peace'), E('Two Flags, One Land')]]);
  X('am_d_olive',
    ['The pilgrims’ hostels', 'Hostels for the pilgrims of every faith.', [['build', B.CITY, 1]]],
    ['The guardians of the shrines', 'A guard sworn to protect the shrines of every faith.', [['sup', 'clergy', 6], M('def', 0.02, 'The shrine guard')]],
    ['The village trusts', 'Every village’s land placed in its own trust, farmed in common.', [M('food', 0.03, 'Village trusts'), ['sup', 'peasants', 4]]],
    ['The hill militias', 'Every hill village with its own guard.', [M('regen', 0.1, 'Hill militias')]],
    ['The trust’s jubilee', 'Twenty-five years since the land was placed in trust.', [L(3, 'The jubilee'), ['tradition', 6]]],
    ['The land that was never sold', 'Every acre is still in the trust.', [M('unrest', -2, 'Kept land'), ['glory', 6], E('The Unsold Land')]]);

  X('ty_d_switzerland',
    ['The free zone', 'A free zone in the harbour for goods bound for the interior.', [M('trade', 0.04, 'The free zone')]],
    ['The airline', 'Flights to every capital of the Old Lands, and to the west.', [M('trade', 0.02, 'The airline'), ['opAll', 2]]],
    ['The confessional council', 'A council where every faith’s leaders meet each month.', [M('unrest', -2, 'The council'), L(2, 'The council')]],
    ['The neutrality treaty', 'Every neighbour guarantees our neutrality.', [['opAll', 4], M('def', 0.02, 'Guaranteed')]],
    ['The festival of the harbour', 'A summer festival that fills every hotel on the coast.', [M('ls', 2, 'The festival'), ['gold', 60]]],
    ['The jewel of the coast', 'Banks, beaches and a dozen faiths, all getting along.', [L(3, 'The jewel'), M('rev', 0.03, 'The jewel'), E('Jewel of the Coast')]]);
  X('ty_d_mountain',
    ['The mountain roads', 'Roads that only the militia knows how to drive at night.', [M('speed', 0.04, 'Mountain roads')]],
    ['The militia’s arsenal', 'An arsenal in the mountain, stocked for a long war.', [['equip', 0.05], ['build', B.FORT, 1]]],
    ['The coastal agents', 'Friends of the mountain in every coastal town.', [['subvertNb', 6]]],
    ['The mountain’s harbour', 'A small harbour of the mountain’s own.', [['build', B.PORT, 1], M('trade', 0.02, 'The mountain’s harbour')]],
    ['The mountain’s feast', 'Every village of the confession feasts on the same day.', [['tradition', 6], ['glory', 4]]],
    ['The mountain’s century', 'The mountain still stands, and still governs itself.', [L(3, 'The mountain'), M('def', 0.03, 'The mountain'), E('The Mountain’s Century')]]);
  X('ty_d_resistance',
    ['The tunnels', 'Tunnels under the southern hills, deep enough for anything.', [['build', B.FORT, 1], M('def', 0.03, 'The tunnels')]],
    ['Volunteers from abroad', 'Fighters from every country of the region, trained in our valleys.', [M('regen', 0.1, 'Volunteers'), ['threat', 4]]],
    ['The movement’s schools', 'Schools that teach the movement’s history first.', [M('sci', 0.02, 'The movement’s schools'), M('unrest', -2, 'The movement’s schools')]],
    ['The reconstruction fund', 'Every house destroyed is rebuilt by the movement within a year.', [['build', B.CITY, 1], ['gold', -50]]],
    ['The day of the camps', 'Every town remembers the camps where the movement began.', [['fervor', 6], ['glory', 6]]],
    ['The south remembers', 'The movement has outlived three wars, and the south remembers every one.', [L(3, 'The south remembers'), M('unrest', -2, 'Memory'), E('The South Remembers')]]);

  X('sa_d_kingdom',
    ['The university of the faith', 'A university for the faithful of every land.', [M('sci', 0.02, 'The university of the faith'), ['sup', 'clergy', 4]]],
    ['The fund of the faithful', 'Grants for poorer faithful countries, from the custodian’s treasury.', [['opAll', 3], ['gold', -80]]],
    ['The pilgrims’ railway', 'A railway from the port to the holy cities.', [['build', B.FACTORY, 1], M('trade', 0.02, 'The pilgrims’ railway')]],
    ['The desalination plants', 'Fresh water from the sea for the desert cities.', [M('food', 0.04, 'Desalination'), M('growth', 0.05, 'Water')]],
    ['The custodian’s jubilee', 'Twenty-five years of the custodian’s reign.', [['tradition', 6], L(3, 'The jubilee')]],
    ['The custodian’s century', 'The holy cities are the largest they have ever been, and the custodian’s family still keeps them.', [M('unrest', -2, 'Piety'), ['glory', 6], E('The Custodian’s Century')]]);
  X('sa_d_petro',
    ['The industrial cities', 'Two new cities on the coast, built for industry.', [['build', B.CITY, 1]]],
    ['The kingdom’s universities', 'Universities with the best-paid professors on three continents.', [M('sci', 0.04, 'The universities')]],
    ['The strategic reserve', 'Oil stored for the day the world needs it most.', [['gold', 150]]],
    ['The tanker fleet', 'Our oil carried in our own ships.', [M('navy', 0.2, 'The tanker fleet'), M('trade', 0.03, 'Our own tankers')]],
    ['The fund passes a hundred billion', 'The sovereign fund passes a sum nobody can picture.', [['gold', 200]]],
    ['Oil turned into everything', 'Factories, universities and banks that would survive a dry well.', [M('prod', 0.04, 'Diversified'), L(3, 'Prosperity'), E('Oil Into Everything')]]);
  X('sa_d_brethren',
    ['The desert garrisons', 'Forts at every well along the frontier.', [['build', B.FORT, 1], M('def', 0.02, 'Desert garrisons')]],
    ['The banner abroad', 'The brethren’s preachers in every neighbouring land.', [['subvertNb', 8]]],
    ['The religious police', 'Patrols that enforce prayer times and close the shops.', [M('unrest', -2, 'The religious police'), ['sup', 'clergy', 4]]],
    ['The wells of the brethren', 'New wells dug in the desert, for the brethren’s settlements.', [M('food', 0.04, 'New wells')]],
    ['The brethren’s jubilee', 'Twenty-five years since the base was closed.', [['fervor', 6], ['glory', 4]]],
    ['The pure century', 'No base, no company and no compromise, for a hundred years.', [L(3, 'The pure century'), M('def', 0.03, 'Faith'), E('The Pure Century')]]);

  X('za_d_shah',
    ['The imperial air force', 'The newest jets on the continent, flown by the shah’s pilots.', [M('atk', 0.03, 'The imperial air force'), ['techUp', 'mil']]],
    ['The islands of the gulf', 'The shah’s marines land on the disputed islands.', [['claimsAll'], ['threat', 4]]],
    ['The health corps', 'Conscripts sent to the villages as medics.', [M('growth', 0.05, 'The health corps')]],
    ['The steel mill', 'A steel mill on the plateau, built with foreign help.', [['build', B.FACTORY, 1]]],
    ['The celebration in the ruins', 'Kings from every continent dine in tents among the ruins of the first empire.', [['glory', 10], ['gold', -150]]],
    ['The heir to the peacock', 'The crown prince is presented to the army, which cheers on cue.', [M('coup', -0.2, 'The heir'), L(3, 'The heir'), E('The Peacock Dynasty')]]);
  X('za_d_nation',
    ['The non-aligned summit', 'Leaders of the new states meet in our capital.', [['glory', 6], ['opAll', 2]]],
    ['Oil diplomacy', 'A treaty with Irkal on oil prices and on keeping foreign companies out.', [n2('Irkal', 'treaty'), M('trade', 0.03, 'Oil diplomacy')]],
    ['The national bank', 'A central bank that answers to the parliament.', [M('rev', 0.03, 'The national bank')]],
    ['The provincial dams', 'A dam in every province, built by the plan.', [M('food', 0.04, 'Provincial dams'), ['build', B.CITY, 1]]],
    ['The jubilee of nationalisation', 'Twenty-five years since the refinery became the nation’s.', [['glory', 6], L(3, 'Nationalisation')]],
    ['The nation’s own century', 'The oil, the parliament and the future all belong to the nation.', [M('unrest', -2, 'Sovereignty'), M('prod', 0.03, 'Sovereignty'), E('The Nation’s Own Century')]]);
  X('za_d_revolution',
    ['The volunteers’ brigades', 'Volunteers sworn to the revolution, in brigades of their own.', [M('atk', 0.03, 'The volunteers'), M('regen', 0.1, 'Volunteer brigades')]],
    ['The missile programme', 'Missiles that can reach every enemy capital in the region.', [['techUp', 'mil'], ['threat', 6]]],
    ['The construction campaign', 'Volunteers build roads, clinics and wells in every village.', [['build', B.CITY, 1], M('food', 0.02, 'The construction campaign')]],
    ['The martyrs’ foundation', 'Pensions and houses for the families of the fallen.', [['sup', 'peasants', 4], M('ls', 1, 'The martyrs’ foundation')]],
    ['The anniversary of the revolution', 'Every city marches on the day the Shah left.', [['fervor', 8], ['glory', 4]]],
    ['The guardianship’s succession', 'The jurist dies. The council names another, and the revolution goes on.', [M('coup', -0.2, 'Succession'), L(3, 'Succession'), E('The Lasting Guardianship')]]);

  X('fs_d_beacon',
    ['The international brigades', 'Brigades of foreign volunteers, trained in {N}.', [M('atk', 0.03, 'International brigades'), M('regen', 0.1, 'Foreign volunteers')]],
    ['Radio {N} in every language', 'The revolution broadcast in every language of the continent, every night.', [['subvertNb', 6]]],
    ['The new towns', 'Towns built from nothing, to show what the revolution can do.', [['build', B.CITY, 1], M('ls', 1, 'New towns')]],
    ['The model factories', 'Factories that delegations come to visit.', [['build', B.FACTORY, 1]]],
    ['The beacon’s jubilee', 'Twenty-five years of the revolution.', [['fervor', 6], ['glory', 6]]],
    ['The beacon still burns', 'Every revolutionary on the continent still looks to {N}.', [L(3, 'The beacon'), M('unrest', -2, 'The beacon'), E('The Beacon Still Burning')]]);
  X('fs_d_union',
    ['The steel combine', 'One combine that makes all the union’s steel.', [['build', B.FACTORY, 1], M('prod', 0.02, 'The steel combine')]],
    ['The tank works', 'Tanks by the thousand.', [['equip', 0.08], M('atk', 0.02, 'The tank works')]],
    ['The republics’ universities', 'A university in every republic of the union.', [M('sci', 0.04, 'The universities')]],
    ['The union railway', 'One railway linking every republic.', [['build', B.CITY, 1], M('unrest', -1, 'The union railway')]],
    ['The union’s jubilee', 'Twenty-five years of the union.', [['discipline', 6], L(3, 'The jubilee')]],
    ['The union at fifty', 'Fifty years of one plan, one ledger and one office.', [M('prod', 0.03, 'The union at fifty'), M('unrest', -2, 'The union at fifty'), E('The Union at Fifty')]]);
  X('fs_d_commons',
    ['The cooperative bank', 'A bank owned by the cooperatives it lends to.', [M('rev', 0.03, 'The cooperative bank')]],
    ['Elected managers', 'Every manager elected by the people they manage.', [['particip', 6], M('eff', 0.02, 'Elected managers')]],
    ['The public libraries', 'A library in every district, open late.', [M('sci', 0.03, 'Public libraries'), ['sup', 'intelligentsia', 4]]],
    ['The four-day week', 'Three days of rest, by law.', [M('ls', 2, 'The four-day week'), M('prod', -0.01, 'Shorter weeks')]],
    ['The labour charter’s jubilee', 'Twenty-five years of the charter.', [L(3, 'The jubilee'), ['sup', 'workers', 4]]],
    ['The commonwealth of work', 'A country where work is shared, rest is guaranteed and nobody owns anybody.', [M('unrest', -2, 'Fair work'), M('eff', 0.03, 'Fair work'), E('The Commonwealth of Work')]]);
  X('fa_d_unbowed',
    ['The border communes', 'Communes on the border, armed and fortified.', [['subvertNb', 6], ['build', B.FORT, 1]]],
    ['The free army', 'An army with no ranks, no salutes and very good aim.', [M('atk', 0.03, 'The free army'), M('regen', 0.1, 'The free army')]],
    ['The hidden granaries', 'Grain stored where no army will find it.', [M('food', 0.04, 'Hidden granaries')]],
    ['The mountain redoubts', 'Redoubts in the hills, ready for the next invasion.', [['build', B.FORT, 1], M('def', 0.03, 'Mountain redoubts')]],
    ['The day of the barricades', 'Every street rebuilds its barricade for a day, and takes it down at night.', [['fervor', 8], ['glory', 4]]],
    ['Never conquered', 'Armies came, and armies left.', [L(3, 'Never conquered'), M('unrest', -2, 'Never conquered'), E('Never Conquered')]]);
  X('fa_d_commune',
    ['The walking assemblies', 'Assemblies that move from village to village, and grow at each one.', [['particip', 6], ['subvertNb', 4]]],
    ['The free territory’s militia', 'A militia that guards the free territory and goes home at harvest.', [M('def', 0.03, 'The free militia'), M('regen', 0.1, 'The free militia')]],
    ['The common workshops', 'Workshops open to anyone, owned by nobody.', [['build', B.FACTORY, 1], M('eff', 0.02, 'Common workshops')]],
    ['The seed exchange', 'Seeds traded freely between every commune.', [M('food', 0.04, 'The seed exchange')]],
    ['The commune’s festival', 'A week of music and argument.', [M('ls', 1, 'The festival'), ['particip', 4]]],
    ['The commune that lasted', 'Everyone said it could not last. Their grandchildren live in it.', [L(3, 'The commune that lasted'), M('unrest', -2, 'A lasting commune'), E('The Commune That Lasted')]]);
  X('fa_d_syndicate',
    ['The port syndicates', 'Every dock run by the dockers.', [M('trade', 0.03, 'Port syndicates'), M('navy', 0.1, 'Union ships')]],
    ['The international strike fund', 'Money for strikes in every neighbouring country.', [['subvertNb', 6], ['gold', -60]]],
    ['The workers’ technical schools', 'Every trade trains its own engineers.', [M('sci', 0.03, 'Technical schools')]],
    ['The syndicate bank', 'A bank owned by the syndicate, lending to the federations.', [M('rev', 0.03, 'The syndicate bank')]],
    ['The congress jubilee', 'Twenty-five years of the great congress.', [['particip', 6], ['glory', 4]]],
    ['The syndicate century', 'The unions run the country, and the country runs.', [M('prod', 0.03, 'The syndicate century'), L(3, 'The syndicate century'), E('The Syndicate Century')]]);
  X('fl_d_market',
    ['The stock exchange', 'An exchange that trades the shares of every firm in {N}.', [M('rev', 0.03, 'The stock exchange'), ['sup', 'capital', 4]]],
    ['The venture banks', 'Banks that lend to new ideas.', [M('prod', 0.03, 'Venture banks')]],
    ['The free trade zone', 'No duties for anyone who trades through {N}.', [M('trade', 0.04, 'The free trade zone')]],
    ['The merchant fleet', 'Ships under the {A} flag on every ocean.', [['build', B.PORT, 1], M('navy', 0.1, 'The merchant fleet')]],
    ['A century of the open economy', 'A hundred years without a tariff.', [L(3, 'A century'), ['opAll', 2]]],
    ['The prosperous republic', 'The richest people on the continent, and they mostly know it.', [M('ls', 2, 'Prosperity'), M('unrest', -2, 'Prosperity'), E('The Prosperous Republic')]]);
  X('fl_d_covenant',
    ['Mercenary exports', 'Companies under our contracts guard mines, ports and presidents on three continents.', [['gold', 120], M('atk', 0.03, 'Contract veterans')]],
    ['Bought frontiers', 'Border villages abroad sell us their land, one survey at a time.', [['claimsAll'], ['opAll', -3]]],
    ['The insurers’ audit', 'The insurers grade every agency every year, and publish the grades.', [M('eff', 0.03, 'The insurers’ audit'), ['corr', -6]]],
    ['The open city', 'Anyone may move here, sign the covenant and work the next morning.', [M('growth', 0.06, 'The open city'), ['sup', 'workers', 4]]],
    ['Arbitration between nations', 'Our courts settle other countries’ disputes, for a fee.', [['opAll', 4], M('rev', 0.04, 'Arbitration fees')]],
    ['A century without a state', 'The first hundred years of the covenant, and nobody has yet been elected to anything.', [L(4, 'A century without a state'), M('unrest', -2, 'A century without a state'), E('A Century Without a State')]]);
  X('fl_d_union',
    ['The joint command', 'One command for every allied democracy.', [M('def', 0.03, 'The joint command'), ['discipline', 4]]],
    ['The shipyards of democracy', 'Ships for every free navy.', [['build', B.PORT, 1], M('navy', 0.2, 'The shipyards')]],
    ['The transcontinental railway', 'One railway from coast to coast.', [['build', B.FACTORY, 1], M('speed', 0.03, 'The railway')]],
    ['The land-grant universities', 'A university in every state, paid for with public land.', [M('sci', 0.04, 'Land-grant universities')]],
    ['The constitution’s centenary', 'A hundred years of the federal constitution.', [L(4, 'A hundred years')]],
    ['The republic of republics', 'A union of states that never once broke apart.', [M('unrest', -2, 'Union'), ['glory', 6], E('The Republic of Republics')]]);
  X('fl_d_social',
    ['The polytechnics', 'Technical universities in every city.', [M('sci', 0.03, 'Polytechnics'), ['sup', 'intelligentsia', 4]]],
    ['The research councils', 'Public money for research, decided by researchers.', [M('sci', 0.03, 'Research councils'), M('eff', 0.02, 'Research councils')]],
    ['Unemployment insurance', 'A wage for those between jobs.', [M('unrest', -2, 'Insurance'), ['sup', 'workers', 4]]],
    ['The public hospitals', 'A hospital in every town, free at the door.', [M('growth', 0.05, 'Public hospitals')]],
    ['The social contract renewed', 'The unions, the employers and the state sign again for another generation.', [L(3, 'The contract renewed'), M('ls', 1, 'The contract renewed')]],
    ['The fair society', 'Nobody very rich, nobody very poor, and nobody very worried.', [M('unrest', -2, 'Fairness'), M('eff', 0.02, 'Fairness'), E('The Fair Society')]]);
  X('fc_d_holy',
    ['The orders’ estates', 'Lands granted to the knightly orders, farmed for the faith.', [M('food', 0.03, 'The orders’ estates'), ['sup', 'clergy', 4]]],
    ['The crusading fleet', 'Ships blessed for the defence of the faithful overseas.', [M('navy', 0.2, 'The crusading fleet'), ['threat', 4]]],
    ['The temple schools', 'Schools in the shadow of every great temple.', [M('sci', 0.02, 'Temple schools'), ['tradition', 4]]],
    ['The pilgrimage roads', 'Roads and hostels for the pilgrims.', [M('trade', 0.03, 'Pilgrimage roads')]],
    ['The holy jubilee', 'A year of pardons and processions.', [['tradition', 8], L(3, 'The holy jubilee')]],
    ['The faith kept', 'The realm prays as it prayed a century ago.', [M('unrest', -2, 'The faith kept'), ['glory', 4], E('Keeper of the Faith')]]);
  X('fc_d_crown',
    ['The guards’ divisions', 'Guards regiments that answer only to the emperor.', [M('atk', 0.03, 'The guards'), M('coup', -0.1, 'The guards')]],
    ['The imperial navy', 'A navy worthy of an empire.', [M('navy', 0.3, 'The imperial navy')]],
    ['The imperial post', 'A letter reaches any corner of the empire in a week.', [M('eff', 0.03, 'The imperial post')]],
    ['The imperial academies', 'Academies of science and art under the emperor’s patronage.', [M('sci', 0.04, 'Imperial academies')]],
    ['The imperial jubilee', 'Fifty years on the throne.', [['tradition', 8], ['glory', 6]]],
    ['The empire’s century', 'The empire has stood for a century, and means to stand for another.', [L(4, 'The empire’s century'), M('unrest', -2, 'The empire’s century'), E('The Empire’s Century')]]);
  X('fc_d_modern',
    ['The crown’s engineers', 'A royal corps of engineers for roads, bridges and power.', [M('sci', 0.03, 'The crown’s engineers')]],
    ['The royal export fair', 'A fair under the king’s patronage, for {A} goods.', [M('trade', 0.04, 'The royal fair')]],
    ['The royal charities', 'Charities in every town, under the royal family’s name.', [M('ls', 1, 'Royal charities'), M('unrest', -1, 'Royal charities')]],
    ['The crown on the radio', 'The king speaks to the nation every midwinter.', [L(2, 'The crown on the radio'), ['sup', 'workers', 4]]],
    ['The silver jubilee', 'Twenty-five years of the modern crown.', [L(3, 'The silver jubilee'), ['tradition', 4]]],
    ['A crown for a new century', 'An old crown that has learned every new trick.', [M('eff', 0.02, 'A modern crown'), M('unrest', -2, 'A modern crown'), E('A Crown for the New Century')]]);
  X('fu_d_greater',
    ['The motorised army', 'Trucks, tanks and staff cars for the whole army.', [['techUp', 'mil']]],
    ['The frontier bombers', 'Bombers based on the new frontier.', [M('atk', 0.03, 'The frontier bombers'), ['threat', 4]]],
    ['The settlers’ programme', 'Families from the old provinces settled in the new.', [M('food', 0.03, 'Settlers'), M('growth', 0.05, 'Settlers')]],
    ['The new provinces’ schools', 'Schools in the new provinces, teaching the state’s language.', [M('unrest', -2, 'One language'), ['sup', 'intelligentsia', -2]]],
    ['The day of the state', 'Every district parades on the day the greater state was proclaimed.', [['discipline', 6], ['glory', 6]]],
    ['The greater century', 'The greater state has outlived its founders.', [L(3, 'The greater century'), M('eff', 0.03, 'The greater century'), E('The Greater Century')]]);
  X('fu_d_quiet',
    ['The files', 'A file on everyone, kept up to date.', [M('unrest', -2, 'The files'), ['corr', 4]]],
    ['The quiet arrests', 'People disappear at night, and their neighbours say nothing.', [['discipline', 6], ['sup', 'intelligentsia', -4]]],
    ['The housing blocks', 'New flats for the loyal.', [['build', B.CITY, 1]]],
    ['The full shops', 'Shops full of goods, for those who keep quiet.', [M('ls', 2, 'Full shops')]],
    ['The guardians’ anniversary', 'Twenty-five years of the guardians.', [L(3, 'The anniversary')]],
    ['The quiet century', 'A century in which nothing happened in {N} that the guardians did not allow.', [M('coup', -0.2, 'The quiet century'), M('unrest', -2, 'The quiet century'), E('The Quiet Century')]]);
  X('fu_d_technate',
    ['The computing institute', 'Calculating machines for the planners.', [M('eff', 0.03, 'The computing institute')]],
    ['The rocket bureau', 'A bureau for rockets, and the engineers to build them.', [M('sci', 0.03, 'The rocket bureau'), ['threat', 4]]],
    ['The planned cities', 'Cities laid out by engineers, with every street numbered.', [['build', B.CITY, 1]]],
    ['The automated factories', 'Factories run by machines, supervised by engineers.', [['build', B.FACTORY, 1], M('prod', 0.02, 'Automation')]],
    ['The engineers’ jubilee', 'Twenty-five years since the engineers took over.', [L(3, 'The jubilee'), ['sup', 'intelligentsia', 4]]],
    ['The engineered century', 'Everything in {N} was designed, and everything works as designed.', [M('prod', 0.03, 'The engineered century'), M('unrest', -2, 'The engineered century'), E('The Engineered Century')]]);
  X('fh_d_serene',
    ['The chartered company', 'A company chartered by the houses to trade where they cannot.', [M('trade', 0.03, 'The chartered company'), ['subvertNb', 4]]],
    ['The house fleet', 'A navy paid for by the great houses.', [M('navy', 0.2, 'The house fleet')]],
    ['The neutral courts', 'Courts where any foreign merchant can sue any other.', [['opAll', 3]]],
    ['The bond market', 'Every government on the continent borrows in {N}.', [M('rev', 0.03, 'The bond market'), ['gold', 80]]],
    ['The houses’ jubilee', 'A century of the golden book.', [['tradition', 6], ['gold', 100]]],
    ['The serene century', 'Rich, neutral and serene, for a hundred years.', [L(3, 'The serene century'), M('trade', 0.03, 'The serene century'), E('The Serene Century')]]);
  X('fh_d_many',
    ['The congress of movements', 'Movements from every neighbouring state meet in {N}.', [['glory', 6], ['opAll', 2]]],
    ['The movement’s university', 'A university for the movement’s ideas.', [M('sci', 0.03, 'The movement’s university')]],
    ['The people’s workshops', 'Workshops where anyone can make anything.', [['build', B.FACTORY, 1]]],
    ['The new schools', 'Schools for a new country.', [M('sci', 0.02, 'New schools'), M('unrest', -1, 'New schools')]],
    ['The anniversary of the rising', 'Twenty-five years since the many rose.', [['particip', 6], ['glory', 4]]],
    ['The renewed country', 'A country that remade itself and stayed remade.', [L(3, 'The renewed country'), M('ls', 1, 'Renewal'), E('The Renewed Country')]]);
  X('fh_d_sync',
    ['The relay towers', 'Towers that carry the signal across every border.', [M('sci', 0.02, 'Relay towers'), ['subvertNb', 4]]],
    ['The time treaty', 'Neighbours agree to set their clocks by ours.', [['opAll', 2], M('trade', 0.03, 'The time treaty')]],
    ['The central clock', 'One clock for the whole union, accurate to the second.', [M('eff', 0.03, 'The central clock')]],
    ['The scheduled economy', 'Every factory works to one timetable.', [M('prod', 0.03, 'The scheduled economy')]],
    ['The anniversary of the signal', 'Every clock in {N} chimes at once.', [['discipline', 4], ['glory', 4]]],
    ['The synchronised century', 'A hundred years in step.', [M('unrest', -2, 'In step'), M('eff', 0.02, 'In step'), E('The Synchronised Century')]]);
})();
