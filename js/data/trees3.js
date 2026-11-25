/* IRON DIALECTIC — the late century (session 15). Every national tree and every family tree gains a branch of seven
   for the 1960s and 1970s: a root, then two roads that rule each other out, three programmes each. Every ideology tree
   gains a branch of five after its 1958 pair: a root, then two roads of two. Bonuses last twenty years.
   Loads after data/campaign13.js (which rewrites Tessaly's and Meridia's trees) and data/afterdest.js. */
(function () {
  'use strict';
  const ID = (globalThis.ID = globalThis.ID || {});
  const B = ID.B, LONG = 240;
  const M = (k, v, l) => ['mod', k, v, LONG, l];
  const L = (v, l) => ['legitmod', v, LONG, l];
  const n2 = (b, k) => ['note2', b, k];
  const S = (sfx, s, x, y, o) => Object.assign({ id: sfx, name: s[0], desc: s[1], fx: s[2], x, y, days: 160 }, o);

  /* nb(list, year, root, [a1, a2, a3], [b1, b2, b3], all): a branch of seven to the right of everything drawn in the
     tree (all: the list plus any projects shown with it). Each spec [name, desc, fx]. */
  const nb = (Lst, year, root, A, Bs, all) => {
    if (!Lst) return;
    const pre = Lst[0].id.split('_')[0] + '_y', x0 = Math.max(...(all || Lst).map((f) => f.x)) + 1.4;
    Lst.push(S(pre + 'r', root, x0 + 0.5, 0, { year, days: 200 }));
    A.forEach((s, i) => Lst.push(S(pre + 'a' + (i + 1), s, x0, i + 1, { req: [i ? pre + 'a' + i : pre + 'r'], excl: i ? undefined : [pre + 'b1'] })));
    Bs.forEach((s, i) => Lst.push(S(pre + 'b' + (i + 1), s, x0 + 1, i + 1, { req: [i ? pre + 'b' + i : pre + 'r'], excl: i ? undefined : [pre + 'a1'] })));
  };
  const nat = (b, year, root, A, Bs) => { const Lst = ID.FOCUS.nations[b]; if (Lst) nb(Lst, year, root, A, Bs, Lst.concat((ID.FOCUS.projects || {})[b] || [])); };

  /* ================================================================ national trees */
  nat('Aurelia', 1960, ['The northern route', 'A generation that never knew the old empire looks north, to the ice and what lies under it.', [M('sci', 0.03, 'The polar institutes'), ['glory', 4]]],
    [['The icebreakers', 'Nuclear icebreakers that keep the northern sea open all year.', [M('navy', 0.2, 'The icebreakers'), M('trade', 0.02, 'Northern shipping')]],
      ['The northern sea route', 'Ships from the western ports to the eastern ones, along our coast, paying our dues.', [M('trade', 0.04, 'The northern sea route'), M('rev', 0.03, 'Northern dues')]],
      ['The arctic cities', 'Cities on the permafrost, built on stilts, paid double.', [['build', B.CITY, 1], M('growth', 0.03, 'Arctic cities')]]],
    [['The housing estates', 'Five-storey blocks in every town, with hot water and a lift that sometimes works.', [['build', B.CITY, 1], M('ls', 1, 'Housing estates')]],
      ['The car factory', 'A foreign licence, a city built around the plant, and a car for the patient.', [['build', B.FACTORY, 1], M('ls', 1, 'The family car')]],
      ['A television in every flat', 'The evening news, the football and the long serial, in every home.', [M('unrest', -3, 'Television'), L(3, 'Television')]]]);
  nat('Cassine', 1960, ['The long boom', 'Twenty years of growth, and a generation that takes it for granted.', [M('prod', 0.03, 'The long boom')]],
    [['The space agency', 'One agency for every rocket the republic builds.', [M('sci', 0.04, 'The space agency')]],
      ['The moon landing', 'Footprints in the dust, watched by every television on earth.', [['glory', 12], ['opAll', 2]]],
      ['The satellite network', 'Telephone calls and television bounced off the sky.', [M('trade', 0.04, 'Satellites'), M('eff', 0.02, 'Satellites')]]],
    [['The campus protests', 'Students occupy the universities and demand everything at once.', [['sup', 'intelligentsia', 6], M('unrest', 1, 'Campus protests')]],
      ['The peace movement', 'Half a million on the mall against the war, any war.', [['opAll', 4], M('wePace', -0.15, 'The peace movement')]],
      ['The new consensus', 'The protesters grow up, run for office and win.', [L(4, 'The new consensus'), M('unrest', -3, 'The new consensus')]]]);
  nat('Norvik', 1966, ['Oil under the northern sea', 'Drillers find oil where the trawlers used to fish.', [['gold', 150]]],
    [['The state oil company', 'The state takes half of every field, by licence.', [M('rev', 0.05, 'State oil')]],
      ['The petroleum fund', 'The oil money saved abroad, untouchable by any government.', [['gold', 200]]],
      ['The fund for the grandchildren', 'The fund pays a pension to a country that has not yet been born.', [M('ls', 2, 'The fund'), L(3, 'Prudence')]]],
    [['The platforms', 'Steel towers in the storm, built in our yards.', [['build', B.FACTORY, 1], M('prod', 0.03, 'The platforms')]],
      ['The northern towns', 'Fishing villages become oil towns overnight.', [['build', B.CITY, 1]]],
      ['The boom coast', 'Every harbour on the coast is suddenly rich, and suddenly expensive.', [M('trade', 0.05, 'The boom'), M('growth', 0.05, 'The boom')]]]);
  nat('Tessaly', 1962, ['The second network', 'The old wires are replaced with something faster, and the cantons argue about who controls it.', [M('sci', 0.04, 'The second network')]],
    [['The chip foundries', 'Clean rooms under the mountains, making the circuits for every machine in the cantons.', [['build', B.FACTORY, 1], ['techUp', 'ind']]],
      ['The personal terminal', 'A terminal small enough for a kitchen table.', [M('eff', 0.03, 'Personal terminals'), ['particip', 4]]],
      ['The network of networks', 'Every network on the continent connected to ours.', [M('sci', 0.05, 'The network of networks'), ['subvertNb', 4]]]],
    [['The alpine reactors', 'Reactors in the valleys, powering the automated works.', [['build', B.FACTORY, 1], M('prod', 0.03, 'Alpine reactors')]],
      ['The base tunnel', 'A tunnel under the whole range, for trains at full speed.', [['build', B.CITY, 1], M('trade', 0.03, 'The base tunnel')]],
      ['The automated valleys', 'Whole valleys of works with nobody in them.', [M('prod', 0.04, 'Automated valleys'), M('ls', 1, 'Automated valleys')]]]);
  nat('Verano', 1962, ['The second generation', 'Children born after the general strike now run the communes.', [['particip', 4]]],
    [['The free radio', 'A transmitter on the coast, heard in every neighbouring country.', [['subvertNb', 6]]],
      ['The summer of the communes', 'Young people from every country come to Verano for one summer and some stay.', [['glory', 6], ['fervor', 6], M('growth', 0.04, 'Those who stay')]],
      ['The new left abroad', 'The students of the west read our pamphlets and copy our communes.', [['subvert', 'Cassine', 6], ['subvert', 'Drava', 6], ['glory', 6]]]],
    [['The cooperative shops', 'Shops owned by their customers, in every town.', [M('ls', 2, 'Cooperative shops')]],
      ['The tourist communes', 'Communes on the coast that host the tourists and keep the profits.', [M('trade', 0.04, 'Tourist communes'), ['gold', 60]]],
      ['The prosperous federation', 'The syndicates turn out to be good at business.', [M('prod', 0.03, 'Prosperity'), M('unrest', -2, 'Prosperity')]]]);
  nat('Drava', 1960, ['The river after the dams', 'The rivers that drowned the plains now light the cities.', [M('food', 0.03, 'Tamed rivers')]],
    [['The hydro cascade', 'Twelve dams in a row on the great river.', [['build', B.FACTORY, 1], M('prod', 0.03, 'The hydro cascade')]],
      ['The aluminium town', 'A new town around a smelter, powered by the dams.', [['build', B.CITY, 1]]],
      ['River exports', 'Barges of aluminium downstream to the sea.', [M('trade', 0.04, 'River exports')]]],
    [['The army modernised', 'New tanks for a small army that means to stay small and dangerous.', [['techUp', 'mil']]],
      ['National service', 'Every young man and woman serves a year.', [M('regen', 0.1, 'National service')]],
      ['The armed neutral', 'Drava joins no bloc and fears none.', [M('def', 0.05, 'Armed neutrality'), ['opAll', 2]]]]);
  nat('Lys', 1962, ['The jet age', 'Aircraft fly over the straits instead of through them, and Lys must find another toll.', [['gold', 80], M('rev', 0.02, 'Airport duties')]],
    [['The offshore banks', 'Accounts in any currency, taxed by nobody.', [M('rev', 0.05, 'Offshore banks')]],
      ['The tax treaties', 'Treaties that let foreign firms pay their taxes here, at our rates.', [['opAll', -2], ['gold', 120]]],
      ['The world’s treasury', 'Half the world’s hot money sleeps in Lys.', [M('trade', 0.05, 'The world’s treasury')]]],
    [['The airport of the continents', 'An airport on reclaimed land, the busiest between the continents.', [['build', B.CITY, 1], M('trade', 0.03, 'The airport')]],
      ['The cruise harbour', 'White ships full of tourists in the old arsenal.', [['build', B.PORT, 1], M('trade', 0.03, 'Cruise ships')]],
      ['The island of tourists', 'More visitors every summer than citizens.', [M('ls', 2, 'Tourism'), ['gold', 80]]]]);
  nat('Karsova', 1957, ['The space programme', 'The rocket designers are given everything they ask for, and a little more.', [M('sci', 0.04, 'The space programme')]],
    [['The launch complex', 'A city of gantries in the steppe, invisible on every map.', [['techUp', 'mil']]],
      ['The man in orbit', 'A pilot from a village nobody had heard of circles the earth.', [['glory', 12]]],
      ['The station called Peace', 'A station in orbit, crewed year round.', [M('sci', 0.05, 'The orbital station')]]],
    [['The ministries computerised', 'Every ministry’s ledgers moved onto machines.', [M('eff', 0.04, 'Computerised ministries')]],
      ['The new towns of the east', 'Towns in the taiga for the gas and the oil.', [['build', B.CITY, 1], M('growth', 0.05, 'New towns')]],
      ['The gas pipeline west', 'A pipeline to the old enemy, paid in machinery.', [M('trade', 0.05, 'The gas pipeline'), ['op', 'Hesperia', 8]]]]);
  nat('Ruthe', 1962, ['The emigrants return', 'The sons of the emigrants come home with foreign money and foreign ideas.', [M('growth', 0.04, 'Returning emigrants')]],
    [['The national theatre', 'Plays in Ruthene, about Ruthene things, every night.', [['sup', 'intelligentsia', 4], L(2, 'The national theatre')]],
      ['The language law', 'Ruthene in every office, every school and every court.', [M('unrest', -2, 'The language law')]],
      ['The folk revival', 'Songs from every village recorded before the old singers die.', [['glory', 4], ['tradition', 6]]]],
    [['The motorway west', 'A road to the western markets.', [['build', B.CITY, 1], M('trade', 0.03, 'The motorway')]],
      ['The guest workers', 'Ruthene workers in western factories, sending money home.', [['gold', 80], M('growth', -0.03, 'Workers abroad')]],
      ['The tourist mountains', 'Hotels in the mountains for western tourists.', [M('trade', 0.04, 'Tourism')]]]);
  nat('Suyan', 1960, ['The new long march', 'A generation of plans to catch up with the world in fifteen years.', [M('prod', 0.03, 'The new long march')]],
    [['The third front', 'Whole industries moved inland, out of reach of any fleet.', [['build', B.FACTORY, 1], M('def', 0.03, 'The third front')]],
      ['The bomb', 'A test in the western desert, and the world takes notice.', [['build', B.SILO, 1], ['techUp', 'mil'], ['threat', 8]]],
      ['The satellite', 'A satellite that plays a revolutionary song from orbit.', [['glory', 8], M('sci', 0.03, 'The satellite')]]],
    [['The green revolution', 'New seeds, fertiliser and pumps for every commune.', [M('food', 0.06, 'The green revolution')]],
      ['The township enterprises', 'Factories owned by the villages, selling to anyone.', [['build', B.FACTORY, 1], M('prod', 0.03, 'Township enterprises')]],
      ['The export coast', 'The coastal cities open to foreign buyers.', [M('trade', 0.05, 'The export coast')]]]);
  nat('Hesperia', 1958, ['The economic wonder', 'From rubble to the third economy on earth in fifteen years.', [M('prod', 0.03, 'The economic wonder')]],
    [['The motorways', 'Roads without speed limits from the mountains to the sea.', [['build', B.CITY, 1], M('speed', 0.03, 'The motorways')]],
      ['The people’s car', 'A small, round car that every family can afford.', [['build', B.FACTORY, 1], M('ls', 2, 'The people’s car')]],
      ['Machine-tool exports', 'Every factory on three continents uses Hesperian machines.', [M('trade', 0.05, 'Machine-tool exports')]]],
    [['The guest workers', 'Workers from the south, invited for two years, staying for twenty.', [M('growth', 0.05, 'Guest workers'), M('prod', 0.02, 'Guest workers')]],
      ['The student revolt', 'The children ask their parents what they did in the war.', [['sup', 'intelligentsia', 6], M('unrest', 1, 'The student revolt'), L(2, 'Facing the past')]],
      ['The new eastern policy', 'Treaties with the east, accepting the borders as they are.', [['opAll', 4], n2('Karsova', 'treaty'), M('trade', 0.04, 'Eastern markets')]]]);
  nat('Irkal', 1960, ['The oil boom', 'The price of oil doubles, and then doubles again.', [['gold', 150]]],
    [['The refineries', 'Refineries of our own, on our own coast.', [['build', B.FACTORY, 1]]],
      ['The petrochemical port', 'Tankers loaded with our own products, not just our crude.', [['build', B.PORT, 1], M('trade', 0.03, 'Petrochemicals')]],
      ['The oil cities', 'New cities in the desert, built in five years.', [['build', B.CITY, 1], M('growth', 0.04, 'Oil cities')]]],
    [['The holy city restored', 'The shrines of the holy city rebuilt in marble and gold.', [['sup', 'clergy', 6], L(2, 'The holy city')]],
      ['The pilgrims’ airport', 'An airport for a million pilgrims a year.', [M('trade', 0.03, 'Pilgrims')]],
      ['The great seminary', 'The largest seminary of the faith, in our holy city.', [['sup', 'clergy', 4], M('sci', 0.02, 'The great seminary'), M('rev', 0.03, 'Pilgrims’ dues')]]]);
  nat('Pavon', 1960, ['After the Marshal’s era', 'A country that has to decide what to do without him.', [L(2, 'A new era')]],
    [['Mountain hydro', 'Dams in every high valley.', [['build', B.FACTORY, 1]]],
      ['The winter resorts', 'Ski lifts where the guard posts were.', [M('trade', 0.04, 'Winter resorts')]],
      ['The mountain airport', 'An airport carved out of a plateau.', [['build', B.CITY, 1]]]],
    [['The mountain brigades', 'Brigades trained to fight in snow and rock.', [M('def', 0.04, 'Mountain brigades')]],
      ['The tunnel forts', 'Forts inside the mountains, connected by tunnels.', [['build', B.FORT, 2]]],
      ['Armed neutrality', 'Pavon will fight anyone who enters, and tells everyone so.', [['opAll', 3], M('def', 0.03, 'Armed neutrality')]]]);
  nat('Meridia', 1960, ['The second directorate', 'A younger generation of engineers takes over the directorate.', [M('eff', 0.03, 'The second directorate')]],
    [['The research parks', 'Parks of laboratories around every university.', [M('sci', 0.05, 'Research parks')]],
      ['The computer works', 'Calculating machines made in Meridia, for Meridia.', [['build', B.FACTORY, 1], ['techUp', 'ind']]],
      ['The southern circuits', 'Meridian circuits in every machine on the continent.', [M('trade', 0.04, 'Circuit exports')]]],
    [['The motorway grid', 'A grid of motorways, planned to the metre.', [['build', B.CITY, 1]]],
      ['The new universities', 'Five new universities, all of them technical.', [M('sci', 0.03, 'New universities')]],
      ['Engineers for export', 'Meridian engineers build dams and bridges for every neighbour.', [['opAll', 3], ['gold', 80]]]]);
  nat('Antara', 1962, ['The copper boom', 'Copper prices soar with every war on other continents.', [['gold', 120]]],
    [['The national copper company', 'The mines bought out, mine by mine.', [M('rev', 0.05, 'National copper')]],
      ['The refinery coast', 'Copper refined at home before it is shipped.', [['build', B.FACTORY, 1]]],
      ['The copper council', 'The copper states agree on a price.', [n2('Meridia', 'treaty'), M('trade', 0.03, 'The copper council')]]],
    [['The agrarian reform', 'The great estates divided among the people who work them.', [['law', 'land', 'smallholder'], ['sup', 'peasants', 6]]],
      ['The wine valleys', 'Vineyards replanted, and the wine sold abroad.', [M('trade', 0.03, 'Wine'), M('food', 0.03, 'The valleys')]],
      ['The southern road', 'A road the length of the country.', [['build', B.CITY, 1]]]]);
  nat('Kelda', 1960, ['The jet-set island', 'The rich of three continents fly in for the weekend.', [['gold', 100]]],
    [['The offshore registry', 'Companies registered on the island, at a price, with no questions.', [M('rev', 0.05, 'The registry')]],
      ['The captive insurers', 'The world’s firms insure themselves here, with themselves.', [['gold', 120]]],
      ['The island of trusts', 'More trusts on the island than people.', [M('trade', 0.04, 'Trusts')]]],
    [['The casino', 'A casino on the cliffs, open all night.', [['gold', 80], ['sup', 'clergy', -4]]],
      ['The marina', 'Yachts from every port in the old fishing harbour.', [['build', B.PORT, 1], M('trade', 0.03, 'The marina')]],
      ['The island of the rich', 'Everyone on Kelda seems to have money, including the fishermen.', [M('ls', 2, 'Wealth')]]]);
  nat('Vess', 1960, ['The fishing wars', 'Foreign trawlers in our waters, and our gunboats cutting their nets.', [M('food', 0.03, 'Our waters'), ['threat', 2]]],
    [['The gunboat trawlers', 'Trawlers with guns, crewed by the harbour councils.', [M('navy', 0.2, 'Gunboat trawlers')]],
      ['The fishing limit', 'A limit two hundred miles out, enforced by the cruiser.', [M('food', 0.04, 'The fishing limit'), ['opAll', -2]]],
      ['The cod victory', 'The foreign fleets give up and go home.', [['glory', 8]]]],
    [['The northern ferries', 'Ferries to every free port in the north.', [['build', B.PORT, 1]]],
      ['The free port', 'Any ship may trade here, under any flag.', [M('trade', 0.04, 'The free port')]],
      ['The island of exiles', 'Every rebel on three continents knows the way to Vess.', [M('growth', 0.05, 'Exiles'), ['subvertNb', 4]]]]);
  nat('Varanth', 1960, ['The republic’s middle age', 'The founder is long dead, and his republic must decide what it is now.', [L(2, 'The middle age')]],
    [['The northern alliance', 'A seat in the western alliance, and its guarantees.', [n2('Cassine', 'treaty'), M('def', 0.03, 'The alliance')]],
      ['The air bases', 'Western air bases on our soil, and rent for them.', [M('atk', 0.03, 'The air bases'), ['gold', 80]]],
      ['Guardian of the straits', 'The straits guarded by our navy for the whole alliance.', [M('navy', 0.2, 'Guardian of the straits')]]],
    [['Workers abroad', 'Varanthine workers in western factories, sending money home.', [['gold', 100]]],
      ['The great dam of the east', 'A dam on the eastern river, irrigating the plains.', [M('food', 0.04, 'The great dam'), ['build', B.CITY, 1]]],
      ['The textile boom', 'Our mills clothe half the continent.', [['build', B.FACTORY, 1], M('trade', 0.03, 'Textiles')]]]);
  nat('Khemra', 1956, ['The canal crisis', 'The canal is nationalised, the old powers land troops, and the world tells them to leave.', [['glory', 6], ['op', 'Norvik', -8]]],
    [['The conference of the non-aligned', 'Leaders of the new states meet in our capital.', [['opAll', 3], ['glory', 4]]],
      ['The union with the east', 'A union with Baskhar, proclaimed in a stadium.', [n2('Baskhar', 'bloc'), M('def', 0.03, 'The union')]],
      ['The voice of the Old Lands', 'Our radio is heard in every country of the region.', [['subvertNb', 6], ['glory', 6]]]],
    [['The open door', 'Foreign investors invited back, on our terms.', [M('trade', 0.04, 'The open door'), ['op', 'Cassine', 6]]],
      ['Cities in the desert', 'New cities built in the desert to take the overflow of the capital.', [['build', B.CITY, 1]]],
      ['The tourist river', 'Cruise boats on the river, past the ancient temples.', [M('trade', 0.03, 'Tourism'), ['gold', 60]]]]);
  nat('Baskhar', 1962, ['The oil nationalisation', 'The foreign oil company’s concession taken back, field by field.', [M('rev', 0.05, 'Our oil')]],
    [['The national oil company', 'Baskhari engineers run the fields.', [['gold', 100]]],
      ['Pipelines to the sea', 'Oil pumped to our own ports, not theirs.', [M('trade', 0.03, 'Our pipelines')]],
      ['The petro-state', 'The richest state in the Old Lands, for now.', [['gold', 150]]]],
    [['The marsh drainage', 'The southern marshes drained for farmland.', [M('food', 0.04, 'Drained marshes')]],
      ['The literacy drive', 'Every adult taught to read.', [M('sci', 0.03, 'Literacy')]],
      ['Northern autonomy', 'The northern provinces govern themselves.', [M('unrest', -3, 'Autonomy')]]]);
  nat('Amaran', 1964, ['The generation of the camps', 'Children born in the camps grow up and organise.', [['fervor', 4]]],
    [['The national council', 'A council in exile that speaks for every Amarani.', [L(2, 'The national council'), ['particip', 4]]],
      ['The diplomatic campaign', 'Every capital is asked to recognise us.', [['opAll', 4]]],
      ['A seat at the assembly', 'The assembly of nations seats our delegation.', [['glory', 8]]]],
    [['Schools in the camps', 'Every child in the camps goes to school.', [M('sci', 0.03, 'Camp schools')]],
      ['The diaspora’s money', 'Amaranis abroad send money home.', [['gold', 100]]],
      ['Workshops of the return', 'Workshops that train the young for the day they go home.', [['build', B.FACTORY, 1]]]]);
  nat('Tyrrha', 1960, ['The banking boom', 'The oil money of the region flows into our banks.', [['gold', 100]]],
    [['The beach resorts', 'Hotels along the whole coast.', [M('trade', 0.03, 'Beach resorts')]],
      ['The mountain villas', 'Villas in the mountains for the oil sheikhs.', [['gold', 60]]],
      ['The playground of the Old Lands', 'Every rich family in the region summers on our coast.', [M('trade', 0.03, 'The playground'), M('ls', 1, 'The playground')]]],
    [['The army strengthened', 'An army that can hold the state together.', [M('def', 0.03, 'The army')]],
      ['The national pact renewed', 'The faiths agree again on how to share the state.', [M('unrest', -3, 'The pact')]],
      ['A census at last', 'The first census in forty years, and everyone accepts it.', [L(3, 'The census')]]]);
  nat('Sahrem', 1962, ['The oil price', 'Sahrem sets the price of oil for the world.', [['gold', 150]]],
    [['The five-year plan', 'Hospitals, schools and roads for the whole country.', [['build', B.CITY, 1]]],
      ['The airports', 'An airport in every province.', [M('trade', 0.03, 'Airports')]],
      ['The welfare state of the desert', 'Free schooling, free care and no taxes.', [M('ls', 2, 'Oil welfare')]]],
    [['The national guard', 'A guard recruited from the loyal tribes, to watch the army.', [M('coup', -0.2, 'The national guard')]],
      ['The tribal militias', 'Every tribe armed and paid by the state.', [M('regen', 0.1, 'Tribal militias')]],
      ['The palace guard', 'A guard picked from the most loyal families.', [M('def', 0.03, 'The palace guard')]]]);
  nat('Zandar', 1962, ['The land reform', 'The great estates divided by decree.', [['sup', 'peasants', 6]]],
    [['The secret police', 'A police that answers only to the head of state.', [['law', 'security', 'secret'], M('coup', -0.2, 'The secret police')]],
      ['The army of the gulf', 'The largest army in the region, armed by whoever will sell.', [M('atk', 0.03, 'The army of the gulf')]],
      ['Gendarme of the gulf', 'Our navy polices the gulf, and every tanker knows it.', [M('navy', 0.2, 'Gendarme of the gulf')]]],
    [['The bazaar’s credit', 'The old merchants lend to the new industries.', [M('trade', 0.03, 'The bazaar'), ['sup', 'capital', 4]]],
      ['The universities expanded', 'A university in every province.', [M('sci', 0.03, 'Universities')]],
      ['Oil money at home', 'The oil money spent on the people.', [M('ls', 2, 'Oil money at home')]]]);

  /* ================================================================ family trees ({A}, {N}: the state's adjective and name) */
  const F = ID.FOCUS.families || {};
  nb(F.socialist, 1960, ['The second plan', 'A plan for the generation born after the revolution.', [M('prod', 0.03, 'The second plan')]],
    [['The rocket bureau', 'A bureau of rocket designers, given everything they ask for.', [['techUp', 'mil']]],
      ['The satellite', 'A satellite of {N} crosses every sky.', [['glory', 8]]],
      ['The missile shield', 'Missiles around the capital, ready for anything.', [M('def', 0.04, 'The missile shield')]]],
    [['The housing drive', 'A flat for every family.', [['build', B.CITY, 1]]],
      ['The consumer plan', 'Refrigerators and televisions as targets of the plan.', [M('ls', 2, 'The consumer plan')]],
      ['The thaw', 'The censors relax, and the poets read in public.', [L(3, 'The thaw'), M('unrest', -2, 'The thaw')]]]);
  nb(F.anarchist, 1960, ['The second generation of the free', 'Children who have never known a boss grow up.', [['particip', 4]]],
    [['The free radio', 'A transmitter heard in every neighbouring country.', [['subvertNb', 6]]],
      ['The festival of the free', 'Young people from everywhere come to {N} for the summer.', [['glory', 4], ['fervor', 4], M('unrest', -2, 'The festival')]],
      ['The new movements abroad', 'Our pamphlets read in every university abroad.', [['subvertNb', 6], ['glory', 6]]]],
    [['The cooperative stores', 'Shops owned by their customers.', [M('ls', 2, 'Cooperative stores')]],
      ['The common machines', 'Machines held in common by the communes.', [['build', B.FACTORY, 1]]],
      ['The quiet communes', 'The communes settle into a long, quiet prosperity.', [M('unrest', -2, 'Quiet communes')]]]);
  nb(F.liberal, 1960, ['The affluent years', 'Wages rise every year, and nobody remembers the slump.', [M('ls', 1, 'Affluence')]],
    [['The motorways', 'Roads from every city to every other.', [['build', B.CITY, 1]]],
      ['The supermarkets', 'Everything under one roof, in every suburb.', [M('ls', 1, 'Supermarkets'), M('trade', 0.02, 'Supermarkets')]],
      ['The suburbs', 'A house and a garden for every family.', [M('growth', 0.04, 'The suburbs')]]],
    [['The universities opened', 'Universities for everyone with the grades.', [M('sci', 0.04, 'Open universities')]],
      ['The campus protests', 'The students demand a say in everything.', [['sup', 'intelligentsia', 6], M('unrest', 1, 'Campus protests')]],
      ['The reform decade', 'The protesters’ demands become the government’s programme.', [L(3, 'Reform')]]]);
  nb(F.conservative, 1960, ['The crown in the television age', 'The old order learns to live with the camera.', [L(2, 'The television age')]],
    [['The broadcast coronation', 'A coronation watched by the whole country.', [['tradition', 6]]],
      ['The royal tours', 'The royal family visits every friendly capital.', [['opAll', 3]]],
      ['The modern monarchy', 'An old crown with a modern face.', [M('unrest', -2, 'The modern monarchy')]]],
    [['The estates modernised', 'Tractors on the old estates.', [M('food', 0.04, 'Modern estates')]],
      ['The temple schools', 'Schools run by the temple, paid for by the state.', [['sup', 'clergy', 4], M('sci', 0.02, 'Temple schools')]],
      ['The old order holds', 'The world changes. {N} changes slowly.', [L(3, 'The old order')]]]);
  nb(F.authoritarian, 1960, ['The regime’s second decade', 'The regime settles in for the long term.', [['discipline', 4]]],
    [['The armoured units', 'Tanks for the regime’s army.', [['techUp', 'mil']]],
      ['The air force', 'Jets for the regime’s pilots.', [M('atk', 0.03, 'The air force')]],
      ['The regional power', '{N} means to be the strongest state in its region.', [['claimsAll'], ['threat', 4]]]],
    [['The development plan', 'Factories built by the state, for the state.', [['build', B.FACTORY, 1]]],
      ['The housing blocks', 'Flats for the workers of the new factories.', [['build', B.CITY, 1]]],
      ['The quiet prosperity', 'Order, and full shops.', [M('ls', 2, 'Quiet prosperity')]]]);
  nb(F.heterodox, 1960, ['The new decade', '{N} looks for a new road in a new decade.', [M('eff', 0.02, 'The new decade')]],
    [['The trading houses', 'Trading houses on every friendly coast.', [M('trade', 0.03, 'The trading houses')]],
      ['The offshore bank', 'A bank for the world’s hot money.', [M('rev', 0.03, 'The offshore bank')]],
      ['The world market', '{A} goods on every market.', [['gold', 100]]]],
    [['The experiments', 'Every ministry runs an experiment, and publishes the results.', [M('sci', 0.03, 'Experiments')]],
      ['The new institutions', 'Institutions built for the new road.', [L(2, 'New institutions')]],
      ['The model abroad', 'Other countries copy the {A} way.', [['opAll', 3], ['glory', 4]]]]);

  /* ================================================================ ideology trees: a branch of five after the 1958 pair */
  const ib = (ideo, year, root, A, Bs) => {
    const T = ID.FOCUS.ideos && ID.FOCUS.ideos[ideo]; if (!T) return;
    const pre = T[0].id.split('_')[0] + '_i_z', my = Math.max(...T.map((f) => f.y)), ends = T.filter((f) => f.y === my).map((f) => f.id);
    T.push(S(pre + 'r', root, 0.5, my + 1, { reqAny: ends, year, days: 180 }),
      S(pre + 'a1', A[0], 0, my + 2, { req: [pre + 'r'], excl: [pre + 'b1'], days: 180 }), S(pre + 'a2', A[1], 0, my + 3, { req: [pre + 'a1'], days: 180 }),
      S(pre + 'b1', Bs[0], 1, my + 2, { req: [pre + 'r'], excl: [pre + 'a1'], days: 180 }), S(pre + 'b2', Bs[1], 1, my + 3, { req: [pre + 'b1'], days: 180 }));
  };
  ib('ml', 1964, ['Developed socialism', 'The revolution is over; the plan is permanent.', [['sig', 6], M('prod', 0.02, 'Developed socialism')]],
    [['The new constitution', 'The party’s leading role written into the constitution.', [['discipline', 6]]], ['The gerontocracy', 'The same men in the same chairs, for twenty years.', [M('coup', -0.3, 'The gerontocracy'), M('eff', -0.02, 'Old men')]]],
    [['The computerised plan', 'The plan calculated by machines.', [M('eff', 0.04, 'The computerised plan')]], ['Restructuring', 'The party opens the books and asks the people what went wrong.', [L(3, 'Restructuring'), ['sup', 'intelligentsia', 6], ['discipline', -6]]]]);
  ib('trot', 1964, ['The new left', 'A new generation of students discovers the old prophet.', [['subvertNb', 6]]],
    [['The student cadres', 'Cadres recruited on every campus.', [['sup', 'intelligentsia', 6]]], ['The May days', 'Barricades in every university town abroad.', [['subvertNb', 8], ['sig', 6]]]],
    [['Entryism', 'Our members join every other party of the left.', [['opAll', 2]]], ['The united front', 'One front of the whole left.', [L(2, 'The united front'), ['sig', 4]]]]);
  ib('council', 1964, ['The councils at fifty', 'Fifty years of councils, and the founders’ grandchildren in the chair.', [['particip', 6]]],
    [['Rotation of delegates', 'No delegate may serve more than two years.', [['bureau', -8]]], ['The open councils', 'Any citizen may speak at any council.', [['sig', 8], L(2, 'Open councils')]]],
    [['The council computers', 'The councils’ decisions tallied by machine.', [M('eff', 0.04, 'Council computers')]], ['The planned federation', 'The councils agree one plan for the federation.', [M('prod', 0.03, 'The planned federation')]]]);
  ib('mao', 1964, ['The cultural revolution', 'The young are told to bombard the headquarters, and they do.', [['sig', 10], ['sup', 'intelligentsia', -8], M('unrest', 2, 'The cultural revolution')]],
    [['The red guards', 'Students in armbands hunt for enemies of the revolution.', [['fervor', 10], ['discipline', -4], ['sig', 6]]], ['Down to the countryside', 'The students sent to the villages to learn from the peasants.', [M('food', 0.03, 'Sent-down youth'), ['sup', 'intelligentsia', -4]]]],
    [['The opening', 'Diplomats from the old enemy invited to dinner.', [M('trade', 0.05, 'The opening')]], ['Reform and opening', 'The communes dissolved, the markets opened, the slogans kept.', [M('prod', 0.05, 'Reform and opening'), ['sig', -6]]]]);
  ib('marketsoc', 1964, ['The second reform', 'The first reform worked. The second goes further.', [M('eff', 0.03, 'The second reform')]],
    [['The stock exchange', 'Shares in the people’s enterprises traded in the open.', [M('rev', 0.03, 'The stock exchange')]], ['The private plots', 'Every family may farm a plot of its own.', [M('food', 0.04, 'Private plots')]]],
    [['The workers’ councils', 'Every enterprise run by a council of its workers.', [['particip', 6]]], ['Self-management everywhere', 'No enterprise without its council.', [M('eff', 0.03, 'Self-management'), ['sig', 6]]]]);
  ib('demsoc', 1964, ['The second programme', 'The party writes a new programme for a new generation.', [['sig', 6]]],
    [['The wealth tax', 'A tax on great fortunes.', [M('rev', 0.04, 'The wealth tax'), ['sup', 'capital', -6]]], ['The wage-earner funds', 'Funds that buy shares in every firm for the workers.', [['sup', 'workers', 6], M('eff', 0.02, 'Wage-earner funds')]]],
    [['The mixed economy settled', 'The left accepts the market; the right accepts the welfare state.', [L(3, 'The settlement')]], ['The social market', 'A market economy with a social conscience.', [M('prod', 0.03, 'The social market')]]]);
  ib('ansyn', 1964, ['The great strike remembered', 'Every union marches on the anniversary of the great strike.', [['sig', 6]]],
    [['The federations renewed', 'New federations for the new industries.', [M('eff', 0.03, 'Renewed federations')]], ['The general assembly of labour', 'Every worker may vote on the plan.', [['particip', 6]]]],
    [['The international unions', 'Unions abroad affiliate with ours.', [['subvertNb', 6]]], ['One union across the sea', 'The dockers of three continents in one union.', [M('trade', 0.03, 'One union')]]]);
  ib('ancom', 1964, ['The second generation', 'Children of the free communes grow up free.', [['sig', 6]]],
    [['The free universities', 'Universities with no fees, no exams and no rectors.', [M('sci', 0.04, 'Free universities')]], ['The communes of knowledge', 'Whole communes devoted to research.', [['sup', 'intelligentsia', 6]]]],
    [['The free federation abroad', 'Communes abroad join the federation.', [['subvertNb', 6]]], ['Mutual aid by air', 'Aid flown to any commune in need, anywhere.', [['opAll', 3]]]]);
  ib('liberal', 1964, ['The welfare debate', 'The liberals argue about whether the state has grown too big.', [['sig', 4]]],
    [['Sound money', 'The central bank told to fight inflation above all else.', [['inflation', -10], ['sup', 'capital', 4]]], ['Privatisation', 'The state’s firms sold to the public.', [M('eff', 0.04, 'Privatisation'), ['sup', 'workers', -4]]]],
    [['The civil rights acts', 'Equal rights for every citizen, enforced by law.', [['sup', 'intelligentsia', 6], L(2, 'Civil rights')]], ['The open society abroad', 'Liberal democracy promoted everywhere.', [['opAll', 4]]]]);
  ib('socdem', 1964, ['The golden age of welfare', 'The welfare state at its height.', [M('ls', 1, 'The golden age')]],
    [['Comprehensive schools', 'One school for every child.', [M('sci', 0.03, 'Comprehensive schools')]], ['Universities for all', 'A university place for every school leaver who wants one.', [['sup', 'intelligentsia', 6]]]],
    [['Wage solidarity', 'Equal pay for equal work, across every industry.', [['sup', 'workers', 6]]], ['Industrial democracy', 'Workers on the board of every firm.', [M('eff', 0.03, 'Industrial democracy')]]]);
  ib('ancap', 1964, ['The open-source covenant', 'The covenant’s two pages are copied by a dozen towns abroad.', [['sig', 6], ['opAll', 2]]],
    [['Private currencies', 'Three moneys, two of them backed by gold.', [M('trade', 0.04, 'Private currencies'), ['inflation', -10]]], ['Toll roads everywhere', 'Every road a company, every company a toll.', [M('eff', 0.03, 'Toll roads'), ['sup', 'workers', -4]]]],
    [['The arbitration exchange', 'Courts compete on a public exchange of verdicts.', [M('eff', 0.03, 'Arbitration exchange'), ['grievance', -6]]], ['Charter towns', 'Whole towns founded by contract, with their own agencies.', [['gold', 120], M('growth', 0.05, 'Charter towns')]]]);
  ib('minarchy', 1964, ['The tax revolt', 'The citizens vote to cut every tax in half.', [['sig', 6]]],
    [['The flat tax', 'One rate for everyone, and capital arrives to pay it.', [M('rev', -0.02, 'The flat tax'), ['sup', 'capital', 6], M('prod', 0.03, 'New investment')]], ['Private roads', 'Roads built and run by companies.', [M('eff', 0.03, 'Private roads')]]],
    [['Free banking zones', 'Zones where any bank may issue its own money.', [M('trade', 0.04, 'Free banking')]], ['The sea-steads', 'Platforms at sea, outside every jurisdiction.', [['gold', 100]]]]);
  ib('conmon', 1964, ['The crown on television', 'The royal family lets the cameras in.', [L(2, 'The crown on television')]],
    [['The royal walkabouts', 'The monarch shakes hands in the street.', [M('unrest', -2, 'Walkabouts')]], ['The bicycling monarchy', 'A monarch who rides a bicycle to work.', [['sig', 6]]]],
    [['The commonwealth games', 'Games for every realm of the crown.', [['opAll', 3]]], ['Crowned diplomacy', 'The monarch as the country’s best ambassador.', [['glory', 4]]]]);
  ib('absmon', 1964, ['The oil throne', 'The crown discovers oil, and with it, money.', [['gold', 100]]],
    [['The crown’s secret police', 'A police that answers only to the throne.', [M('coup', -0.2, 'The secret police')]], ['The throne alone', 'No parliament, no party, no rival.', [['sig', 8]]]],
    [['The constitution granted', 'A constitution, granted by the crown, revocable by the crown.', [L(3, 'The constitution'), ['particip', 4]]], ['The reforming king', 'A king who builds schools and frees the press.', [['sup', 'intelligentsia', 6]]]]);
  ib('theocracy', 1964, ['The revival', 'A new generation returns to the faith.', [['sig', 6]]],
    [['The religious police', 'Patrols that enforce the law of the faith.', [M('unrest', -2, 'The religious police')]], ['The pure law', 'Every law reviewed by the jurists of the faith.', [['sup', 'clergy', 6]]]],
    [['The religious universities', 'Universities that teach science under the faith.', [M('sci', 0.03, 'Religious universities')]], ['The council of the faiths', 'A council of every faith, meeting in our holy city.', [['opAll', 3]]]]);
  ib('agrarian', 1964, ['The tractor age', 'Tractors replace horses on every farm.', [M('food', 0.03, 'The tractor age')]],
    [['The farmers’ party', 'A party for the farmers, run by the farmers.', [['particip', 4], ['sup', 'peasants', 6]]], ['The rural parliament', 'The countryside outvotes the cities.', [['sig', 6], L(3, 'The rural parliament'), M('food', 0.03, 'Farm prices')]]],
    [['The fertiliser works', 'Fertiliser made at home.', [['build', B.FACTORY, 1]]], ['Export harvests', 'The harvest sold abroad.', [M('trade', 0.04, 'Export harvests')]]]);
  ib('junta', 1964, ['The second junta', 'A younger generation of officers takes over the junta.', [['discipline', 4]]],
    [['The dirty war', 'Opponents vanish, and nobody asks where they went.', [M('unrest', -3, 'Fear'), ['sup', 'intelligentsia', -8], ['sig', 6]]], ['The national security doctrine', 'The army as the guardian of the nation against its own people.', [M('coup', -0.3, 'National security')]]],
    [['The transition plan', 'A timetable for elections, published in advance.', [L(2, 'The transition plan'), M('unrest', -2, 'A timetable')]], ['The civilian cabinet', 'Civilians appointed to the cabinet.', [['particip', 6], ['sig', -6], M('coup', -0.2, 'Back to barracks'), ['opAll', 4]]]]);
  ib('corporatist', 1964, ['The corporations modernised', 'The old guilds become modern corporations.', [M('eff', 0.02, 'Modern corporations')]],
    [['The state holdings', 'A state holding company that owns half the industry.', [['build', B.FACTORY, 1]]], ['National champions', 'One firm in every industry, backed by the state.', [M('trade', 0.04, 'National champions')]]],
    [['The social pact', 'Labour and capital sign a pact for the decade.', [M('unrest', -2, 'The social pact'), ['sup', 'workers', 4]]], ['The corporate senate', 'A senate of the corporations.', [['sig', 6], L(3, 'The corporate senate')]]]);
  ib('technocracy', 1964, ['The systems age', 'Every problem treated as a system.', [M('eff', 0.03, 'The systems age')]],
    [['The computer census', 'A census on punched cards.', [M('sci', 0.03, 'The computer census')]], ['The cybernetic ministries', 'Ministries run by feedback loops.', [M('eff', 0.03, 'Cybernetic ministries')]]],
    [['The think tanks', 'Institutes that think about everything.', [['sup', 'intelligentsia', 6]]], ['The scenario plans', 'Plans for every possible future.', [M('def', 0.03, 'Scenario plans')]]]);
  ib('personalist', 1964, ['The Leader ages', 'The Leader is old, and everyone is thinking about what comes next.', [['charisma', -4], ['sig', 4]]],
    [['The heir apparent', 'The Leader’s son is named heir.', [M('coup', -0.2, 'The heir apparent')]], ['The family state', 'The Leader’s family holds every important post.', [['tradition', 6]]]],
    [['The Leader’s monuments', 'Statues of the Leader in every square.', [['charisma', 6], ['gold', -80], M('unrest', -2, 'The cult')]], ['The eternal Leader', 'The Leader will never die, the newspapers say.', [['sig', 8], L(4, 'The eternal Leader')]]]);
  ib('merchant', 1964, ['Trade in the jet age', 'Air freight and container ships change the trade.', [M('trade', 0.03, 'The jet age')]],
    [['The container ports', 'Cranes for the new container ships.', [['build', B.PORT, 1]]], ['The shipping conferences', 'The great shipping lines agree on rates.', [M('trade', 0.03, 'Shipping conferences')]]],
    [['The offshore currency market', 'A market in other countries’ money.', [M('rev', 0.04, 'The offshore market')]], ['The tax havens', 'The world’s money parked here, at no tax.', [['gold', 100]]]]);
  ib('cybernetic', 1964, ['The network at scale', 'The network grows from a ministry to the whole country.', [M('eff', 0.03, 'The network at scale')]],
    [['The microprocessor plan', 'A plan to build the plan’s own computers.', [['techUp', 'ind']]], ['The household terminals', 'A terminal in every home, connected to the plan.', [['particip', 6]]]],
    [['The open models', 'The plan’s models published for anyone to check.', [M('sci', 0.03, 'Open models')]], ['The planetary model', 'A model of the whole world economy, offered to every country.', [['subvertNb', 4]]]]);
  ib('natpop', 1964, ['The movement in power again', 'The movement returns to power on a wave of resentment.', [['charisma', 4]]],
    [['The rallies', 'Rallies in every stadium.', [['sig', 6], ['charisma', 6]]], ['The plebiscites', 'Every important question put to the people, and answered as expected.', [L(3, 'The plebiscites'), M('unrest', -3, 'The plebiscites')]]],
    [['National champions', 'Firms backed by the state, in every industry.', [['build', B.FACTORY, 1]]], ['The welfare of the nation', 'Pensions and housing for the nation’s own.', [M('ls', 2, 'The welfare of the nation')]]]);
  ib('thirdpos', 1964, ['The developmental decade', 'A decade of plans for the new nations.', [M('prod', 0.02, 'The developmental decade')]],
    [['Import substitution', 'Factories that make what we used to import.', [['build', B.FACTORY, 1]]], ['The national industries', 'Steel, cement and textiles, all made at home.', [M('prod', 0.03, 'National industries')]]],
    [['The non-aligned bank', 'A bank of the non-aligned states.', [['opAll', 3], M('trade', 0.03, 'The non-aligned bank')]], ['The tricontinental conference', 'The new states of three continents meet in our capital.', [['glory', 6], M('def', 0.03, 'Many friends')]]]);
  ib('pannat', 1964, ['The union attempted again', 'The party tries again to unite the nation across its borders.', [['sig', 6]]],
    [['The joint command', 'A joint command with our sister parties.', [M('def', 0.03, 'The joint command')]], ['The federation proclaimed', 'A federation proclaimed on paper.', [['glory', 8]]]],
    [['The party’s purge', 'The party purged of doubters.', [['discipline', 6]]], ['The single-party state', 'One party, one leader, one nation.', [M('coup', -0.2, 'The single-party state')]]]);
  ib('revival', 1964, ['The revolution’s second decade', 'The revolution settles into power.', [['sig', 6]]],
    [['The guardians’ militia', 'A militia that guards the revolution.', [M('regen', 0.1, 'The guardians’ militia')]], ['Exporting the revolution', 'The revolution offered to every neighbour.', [['subvertNb', 6]]]],
    [['The pragmatists', 'A faction that wants trade more than war.', [M('trade', 0.03, 'The pragmatists')]], ['The reconstruction', 'The country rebuilt after the revolution’s wars.', [['build', B.CITY, 1]]]]);
  ib('juche', 1964, ['The third seven-year plan', 'Another plan, and the same slogans.', [M('prod', 0.02, 'The seven-year plan')]],
    [['Tunnels under the border', 'Tunnels dug under the frontier, for the day of reunification.', [M('def', 0.04, 'Tunnels')]], ['The nuclear deterrent', 'A bomb, tested underground.', [['techUp', 'mil'], ['threat', 6]]]],
    [['The light industry revolution', 'Shoes and soap, at last.', [M('ls', 1, 'Light industry')]], ['The joint venture law', 'Foreign firms allowed in, carefully.', [M('trade', 0.03, 'Joint ventures'), ['sig', -4]]]]);
  ib('natsyn', 1964, ['The syndicates reformed', 'The vertical syndicates are given a little independence.', [['sig', 4]]],
    [['The vertical unions', 'One union per industry, chaired by the state.', [M('unrest', -2, 'Vertical unions')]], ['The national producer', 'Every producer organised for the nation.', [M('prod', 0.03, 'The national producer')]]],
    [['The technocrats’ cabinet', 'Economists given the ministries.', [M('eff', 0.03, 'The technocrats')]], ['The opening to the west', 'Trade with the old enemies.', [M('trade', 0.04, 'The opening')]]]);
  ib('technosoc', 1964, ['The second acceleration', 'Faster machines, faster plans, faster change.', [M('sci', 0.04, 'The second acceleration')]],
    [['The automated plan', 'The plan executed by machines.', [M('prod', 0.03, 'The automated plan')]], ['The planetary grid', 'The plan connected to every comrade on earth.', [['subvertNb', 6]]]],
    [['The open laboratories', 'Every laboratory open to every citizen.', [M('sci', 0.03, 'Open laboratories')]], ['The leisure economy', 'The machines work; the people live.', [M('ls', 2, 'The leisure economy')]]]);
  ib('nrx', 1964, ['The second exit', 'Citizens who dislike the company may leave, and some companies leave too.', [M('eff', 0.02, 'The second exit')]],
    [['The neocameral board', 'A board of shareholders runs the state.', [M('coup', -0.2, 'The board')]], ['The sovereign dividend', 'Every shareholder paid a dividend from the state’s profit.', [M('ls', 1, 'The dividend'), ['gold', 80]]]],
    [['The charter zones', 'Zones governed by private charter.', [M('trade', 0.04, 'Charter zones')]], ['The patchwork treaty', 'A treaty between the sovereign companies.', [['opAll', 2]]]]);
  ib('natsoc', 1964, ['The ageing regime', 'The party’s founders are old, and their war is long over.', [['sig', -4], M('eff', -0.02, 'An ageing regime')]],
    [['The congress of the old guard', 'The old men of the party meet and change nothing.', [['discipline', 6]]], ['The fortress mentality', 'The regime closes its borders and waits.', [M('def', 0.04, 'Fortress'), ['opAll', -3]]]],
    [['The technocrats’ faction', 'Engineers and economists take the ministries.', [M('eff', 0.03, 'The technocrats')]], ['The quiet dismantling', 'The regime is taken apart, one office at a time.', [['sig', -8], L(3, 'The dismantling')]]]);
  ib('nazacc', 1964, ['After the ash', 'The ash has settled. Something must grow in it, or nothing will.', [['sig', -6]]],
    [['The last bunkers', 'The faithful retreat underground.', [M('def', 0.04, 'The last bunkers')]], ['The final order', 'One last order, and no one left to obey it.', [['sig', 8], M('prod', -0.04, 'The final order')]]],
    [['The survivors’ council', 'The survivors elect a council to run what is left.', [['stab', 6]]], ['The rebuilding', 'Houses built where the bunkers were.', [['build', B.CITY, 1], ['sig', -10]]]]);
})();
