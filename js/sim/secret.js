/* IRON DIALECTIC — secret roads. Five countries of The Three Continents hide a road that no
   menu shows: when the player's country stands in the right place at the right time, a dispatch
   reveals it. Taking it opens a secret programme tab, a secret ideology (a variant of an existing one,
   registered in ID.IDEOLOGIES but not in ID.IDEO_LIST, so it never appears in lists or random picks)
   and a secret ending: the ideology's objective, won like any other.
   ID.SECRETS[key] = { key, base, parent, ideo: {..overrides}, when(G, n), reveal: {title, text, yes, no},
     tab, tree: [programmes], ending }. No DOM. */
(function () {
  'use strict';
  const ID = (globalThis.ID = globalThis.ID || {});
  const Sc = (ID.Secret = {});
  const PERM = 600;
  const b = (v) => (v ? 1 : 0);
  const SECRETS = (ID.SECRETS = {});
  const yr = (G) => ID.yearOf(G.tick);
  /* Share of the provinces that were this country's at the start that it still holds. */
  const coresHeld = (G, n) => { let a = 0, h = 0; for (let p = 1; p < G.provinces.length; p++) { const P = G.provinces[p]; if (P.core !== n.id) continue; a++; if (P.owner === n.id) h++; } return a ? h / a : 0; };
  const topPowers = (G, n, k) => ID.alive(G).filter((o) => o !== n && !o.civilOf).sort((x, y) => ID.Diplomacy.power(y) - ID.Diplomacy.power(x)).slice(0, k);
  const trading = (G, n, o) => { const d = ID.dipOf(G, n.id, o.id); return !!(d && d.trade); };

  function def(o) {
    SECRETS[o.key] = o;
    const P = ID.IDEOLOGIES[o.parent], I = Object.assign({}, P, o.ideo);
    I.secret = 1; I.parentId = o.parent; I.flags = Object.assign({}, P.flags, o.ideo.flags || {});
    I.drift = o.ideo.drift || [];
    I.css = 'rgb(' + I.color.join(',') + ')';
    ID.IDEOLOGIES[I.id] = I;
    o.ideoId = I.id;
    if (ID.DOCTRINE && ID.DOCTRINE[o.parent] && !ID.DOCTRINE[I.id]) ID.DOCTRINE[I.id] = ID.DOCTRINE[o.parent];
    const R = ID.REGIME; if (R) { if (o.body) R.body[I.id] = o.body; else if (R.body[o.parent]) R.body[I.id] = R.body[o.parent]; if (!R.lines[I.id] && R.lines[o.parent]) R.lines[I.id] = R.lines[o.parent]; }
    // the tab: programmes are positioned in a column pair, marked secret
    (ID.FOCUS.secret || (ID.FOCUS.secret = {}))[o.key] = o.tree.map((f) => Object.assign({ days: 150, secret: 1 }, f));
    ID.EVENT_DEFS.push({ id: 'sec_' + o.key, sys: 1, tone: 'mixed', sfx: 'stamp', art: o.reveal.art || null, kicker: 'A door opens',
      title: o.reveal.title, text: o.reveal.text,
      opts: [
        { label: o.reveal.yes, tip: 'Opens a secret programme, “' + o.tab + '”, and a road to an ending no other country can reach.', fx: [['fn', (G, n) => { n.flags.secret = o.key; G.uiDirty = true; }], ['note', 'A new programme tab: ' + o.tab]] },
        { label: o.reveal.no, tip: 'The door closes and does not open again.', fx: [['fn', (G, n) => { n.flags.secretNo = 1; }], ['note', 'The road is not taken']] },
      ] });
  }

  /* ---------------------------------------------------------------- Pavon: the last fortress */
  def({
    key: 'fortress', base: 'Pavon', parent: 'ml', tab: 'The Fortress',
    when: (G, n) => yr(G) >= 1918 && n.nq && n.nq.v >= 75 && (n.nq.bunkers || 0) >= 3 && !n.bloc && ['personalist', 'ml', 'junta'].indexOf(n.ideo) >= 0,
    reveal: { art: 'mountain', title: 'The Marshal’s blue notebook',
      text: 'Among the Marshal’s papers the archivists have found a school exercise book with a blue cover. In it, in his own hand, is a plan for a country that needs nobody: no ally, no creditor, no import, a bunker for every family and a party that has kept the faith when every other has betrayed it. The last page is a date, thirty years from now, with the words “they will not come”.',
      yes: 'Build the fortress', no: 'Put the notebook back in the archive' },
    tree: [
      { id: 'sx_pv_count', name: 'The bunker census', desc: 'Count every bunker in the country, and draw the map on which the rest will stand: one for every family.', x: 0.5, y: 0, days: 120,
        fx: [['nq', 6], ['fn', (G, n) => { n.nq.bunkers = (n.nq.bunkers || 0) + 10; }], ['note', 'Bunkers +10'], ['mod', 'cityDef', 0.15, PERM, 'The bunker map']] },
      { id: 'sx_pv_break', name: 'Break with every ally', desc: 'Every friend of Pavon has turned out to be a revisionist. Recall the ambassadors and return the gifts.', x: 0, y: 1, req: ['sx_pv_count'],
        fx: [['nq', 10], ['opAll', -12], ['fn', (G, n) => { for (const o of ID.alive(G)) { if (o === n) continue; const d = ID.dipOf(G, n.id, o.id); if (d) d.alliance = 0; } }], ['mod', 'legit', 6, PERM, 'Alone and right'], ['auth', 15]] },
      { id: 'sx_pv_self', name: 'Self-reliance', desc: 'What the country eats, it grows; what it fires, it makes. Every import is a hostage.', x: 1, y: 1, req: ['sx_pv_count'],
        fx: [['law', 'trade', 'autarky'], ['mod', 'food', 0.08, PERM, 'Self-reliance'], ['mod', 'prod', 0.05, PERM, 'Self-reliance'], ['sup', 'peasants', 5]] },
      { id: 'sx_pv_line', name: 'The only correct line', desc: 'Karsova has betrayed, Suyan has betrayed, the whole world has betrayed. Pavon alone has not. The party proclaims it.', x: 0.5, y: 2, req: ['sx_pv_break', 'sx_pv_self'], days: 180,
        fx: [['ideology', 'antirev', 'reform'], ['nq', 8]] },
      { id: 'sx_pv_700', name: 'Seven hundred thousand', desc: 'A concrete dome on every hill, at every crossroads, in every schoolyard and on every beach, all facing outward.', x: 0.5, y: 3, req: ['sx_pv_line'], days: 240,
        fx: [['fn', (G, n) => { n.nq.bunkers = (n.nq.bunkers || 0) + 40; }], ['note', 'Bunkers +40'], ['mod', 'def', 0.15, PERM, 'Seven hundred thousand bunkers'], ['mod', 'cityDef', 0.3, PERM, 'Seven hundred thousand bunkers'], ['mod', 'prod', -0.06, PERM, 'Concrete instead of houses']] },
    ],
    ideo: { id: 'antirev', name: 'Anti-Revisionism', color: [120, 20, 24], title: 'People’s Socialist Republic of {N}', banner: 'leader',
      short: 'The last correct communist party on earth, alone in its fortress, waiting for the attack that justifies it.',
      flags: { cult: 1, noDecap: 1, partisans: 1 },
      doctrine: Object.assign({}, ID.IDEOLOGIES.ml.doctrine, { atk: 0.95, def: 1.3, home: 1.4 }),
      dip: { export: 0, agg: 0.15, trade: 0, cb: [] },
      objective: { name: 'The Last Fortress', desc: 'Sixty bunkers in the ledger, every Pavonian province held, no ally and no master, for twelve years.',
        sustain: (n) => !n.bloc && n.stab >= 35,
        parts: (n, G) => [['Bunkers', (n.nq && n.nq.bunkers) || 0, 60], ['Pavonian provinces held', coresHeld(G, n), 1, '%'], ['Years alone (no bloc, stability 35+)', n.cnt.sustain || 0, 12]] },
      ending: 'The fortress is finished. Every family has its dome of concrete, every hill its gun slit, and every one of them faces the sea and the mountains from which the enemy was to come. Nobody came. The world outside has changed its governments, its weapons and its quarrels several times over, and has forgotten Pavon entirely. The party considers this its greatest victory. The bunkers will outlast it, and the party, and everyone who built them.',
      perks: ['Defence and city defence far above any other system.', 'The cult of the Leader holds the country together.'], flaws: ['No trade, no allies, no friends.', 'Concrete instead of houses.'] },
    body: null,
  });

  /* ---------------------------------------------------------------- Lys: the bank of the world */
  def({
    key: 'ledger', base: 'Lys', parent: 'merchant', tab: 'The Ledger',
    when: (G, n) => yr(G) >= 1920 && n.gold >= 1200 && n.ideo === 'merchant' && ID.alive(G).filter((o) => o !== n && trading(G, n, o)).length >= 5,
    reveal: { art: 'sea', title: 'A proposal from the Bank',
      text: 'The governors of the Bank of Lys have asked for a private audience. Their proposal is simple. Every belligerent on both continents needs money; Lys has it. Lend to all of them, at once, on the security of their customs and their railways, and in twenty years there will be no government in the world that can afford to quarrel with the Serene Republic. The governors add, as an afterthought, that the Great Council would then be somewhat redundant.',
      yes: 'Open the ledger', no: 'The Republic is not for sale' },
    tree: [
      { id: 'sx_ly_both', name: 'Lend to both sides', desc: 'Every war on two continents is a client. The Bank takes the customs of both belligerents as collateral.', x: 0.5, y: 0, days: 120,
        fx: [['fn', (G, n) => { n.flags.lendBoth = 1; }], ['note', 'Every war in the world pays the Bank interest each month'], ['gold', 150]] },
      { id: 'sx_ly_neutral', name: 'The neutral strait', desc: 'Lys guarantees free passage to every flag, for a fee. No navy may close what everyone needs open.', x: 0, y: 1, req: ['sx_ly_both'],
        fx: [['nq', -15], ['opAll', 8], ['mod', 'trade', 0.12, PERM, 'The neutral strait'], ['mod', 'def', 0.06, PERM, 'Guaranteed by all']] },
      { id: 'sx_ly_boards', name: 'A seat on every board', desc: 'The Bank’s men sit on the boards of the great railways, mines and shipping lines of every great power.', x: 1, y: 1, req: ['sx_ly_both'],
        fx: [['fn', (G, n) => { for (const o of topPowers(G, n, 6)) { ID.addOpBoth(G, n.id, o.id, 15); const d = ID.dipOf(G, n.id, o.id); if (d && !d.war && o.laws.trade !== 'autarky' && n.laws.trade !== 'autarky') d.trade = 1; } }], ['note', 'Trade treaties and +15 relations with the six greatest powers']] },
      { id: 'sx_ly_bank', name: 'The Bank is the State', desc: 'The Great Council votes, for the last time, to hand its powers to the governors of the Bank, who will exercise them more efficiently.', x: 0.5, y: 2, req: ['sx_ly_neutral', 'sx_ly_boards'], days: 180,
        fx: [['ideology', 'bancocracy', 'reform']] },
      { id: 'sx_ly_creditor', name: 'Creditor of the world', desc: 'Consolidate every loan into a single instrument, guaranteed by every government that signed one.', x: 0.5, y: 3, req: ['sx_ly_bank'], days: 210,
        fx: [['gold', 400], ['mod', 'rev', 0.12, PERM, 'The world’s debts'], ['opAll', 5]] },
    ],
    ideo: { id: 'bancocracy', name: 'Bancocracy', color: [214, 176, 72], title: 'The Most Serene Bank of {N}',
      short: 'Government by the creditors: the state is a bank, the citizens are depositors, and every foreign government is a client.',
      dip: { export: 0, agg: 0.05, trade: 1, cb: [] },
      objective: { name: 'The Bank of the World', desc: 'Five thousand in gold, trade with five of the six greatest powers, and ten years without a war.',
        sustain: (n) => !n.nwars,
        parts: (n, G) => [['Gold in the vaults', Math.round(n.gold), 5000], ['Great powers trading with Lys', topPowers(G, n, 6).filter((o) => trading(G, n, o)).length, 5], ['Years at peace', n.cnt.sustain || 0, 10]] },
      ending: 'No army has crossed the straits, and none needs to. Every treasury on two continents now owes the Serene Bank of Lys more than it collects in a year, and every finance minister in the world begins his morning with the Lysian exchange rate. When two great powers quarrelled last spring, the Bank declined to roll over their loans, and the quarrel was over by the summer. The Doge’s palace is a museum. The Bank’s directors have never been photographed.',
      perks: ['Every war in the world pays the Bank.', 'Trade and revenue above every other system.'], flaws: ['No one fights for a bank.'] },
    body: null,
  });

  /* ---------------------------------------------------------------- Meridia: the last decision */
  def({
    key: 'model', base: 'Meridia', parent: 'technocracy', tab: 'The Model',
    // the end of the curve: a corporate Meridia at full acceleration, or an engineers' Meridia whose model is never wrong
    when: (G, n) => yr(G) >= 1930 && n.stab >= 50 && ((n.ideo === 'nrx' && (n.sig || 0) >= 82) || ((n.ideo === 'technocracy' || n.ideo === 'cybernetic') && (n.sig || 0) >= 70)),
    reveal: { art: 'machine', title: 'The model asks a question',
      text: 'Meridia’s rulers asked the planning model for its forecast of the next five years. The model returned it, and a recommendation nobody had asked for: that the forecast would improve by eleven per cent if decisions were no longer referred to the Directorate. The engineers have checked the arithmetic three times. It is correct.',
      yes: 'Let the model decide', no: 'Pull the plug' },
    tree: [
      { id: 'sx_me_sensor', name: 'Every factory a sensor', desc: 'Telegraph lines from every factory floor to the model, reporting output by the hour.', x: 0.5, y: 0, days: 120,
        fx: [['mod', 'eff', 0.05, PERM, 'The sensor network'], ['nq', 6]] },
      { id: 'sx_me_minutes', name: 'No minutes', desc: 'The Directorate’s deliberations are no longer recorded. The model’s are recorded in full.', x: 0, y: 1, req: ['sx_me_sensor'],
        fx: [['circleLoy', -8], ['auth', 20], ['mod', 'unrest', -3, PERM, 'Decisions without faces']] },
      { id: 'sx_me_prices', name: 'Prices by computation', desc: 'Every price in the country is set each night by the model and posted in the morning.', x: 1, y: 1, req: ['sx_me_sensor'],
        fx: [['mod', 'prod', 0.06, PERM, 'Computed prices'], ['mod', 'ls', 2, PERM, 'Computed prices'], ['sup', 'capital', -8]] },
      { id: 'sx_me_govern', name: 'The model governs', desc: 'The last meeting of the Directorate has one item on the agenda: its own abolition. It passes without a vote.', x: 0.5, y: 2, req: ['sx_me_minutes', 'sx_me_prices'], days: 180,
        fx: [['ideology', 'algocracy', 'reform']] },
      { id: 'sx_me_last', name: 'The last decision', desc: 'The model is given the one power it does not yet have: to choose what it optimises for.', x: 0.5, y: 3, req: ['sx_me_govern'], days: 210,
        fx: [['mod', 'eff', 0.08, PERM, 'The model’s own goals'], ['mod', 'stab', 6, PERM, 'Nobody to blame'], ['mod', 'sci', 0.15, PERM, 'The model’s own goals']] },
    ],
    ideo: { id: 'algocracy', name: 'Algocracy', color: [70, 150, 160], title: 'The {A} Computation', banner: null,
      short: 'Government by calculation: no minister, no vote and no signature, only the model and its forecasts.',
      objective: { name: 'The Last Decision', desc: 'Stability 75, living standards 65, and ten years in which the model has governed alone.',
        sustain: (n) => n.stab >= 55,
        parts: (n, G) => [['Stability', Math.round(n.stab), 75], ['Living standards', Math.round(n.ls), 65], ['Years the model has governed (stability 55+)', n.cnt.sustain || 0, 10]] },
      ending: 'No one in Meridia has made a political decision for ten years. The trains run at intervals the model chooses, wages are posted each morning with the prices, and the crime rate is a figure in the evening bulletin, falling. Visitors find the country prosperous, calm and oddly quiet, like a house in which someone is sleeping. The engineers who built the model still maintain it. They no longer understand it, and they say so with pride.',
      perks: ['Efficiency, stability and science no human government can match.'], flaws: ['Nobody can be blamed, or persuaded.'] },
    body: null,
  });

  /* ---------------------------------------------------------------- Karsova: red star */
  def({
    key: 'cosmos', base: 'Karsova', parent: 'ml', tab: 'Red Star',
    when: (G, n) => yr(G) >= 1940 && ['ml', 'trot', 'mao'].indexOf(n.ideo) >= 0 && n.stab >= 40 && (n.tech.ind + n.tech.mil + n.tech.agr) >= 12,
    reveal: { art: 'space', title: 'A novel from 1908',
      text: 'The rocket engineers of the Karsovan design bureaus have a book they pass from hand to hand: a novel written by an old revolutionary before the revolution, about a communist society on another planet. Its author believed that communism’s real task was to conquer nature itself: space, then age, then death. The engineers believe it is time. They have drawings, and a request for a budget the size of the army’s.',
      yes: 'The common task begins', no: 'File the drawings' },
    tree: [
      { id: 'sx_ka_blood', name: 'The institute of the common task', desc: 'An institute for the prolongation of life, with laboratories, a sanatorium and a free hand.', x: 0.5, y: 0, days: 120,
        fx: [['mod', 'growth', 0.12, PERM, 'The institute'], ['mod', 'sci', 0.1, PERM, 'The institute'], ['sup', 'intelligentsia', 8]] },
      { id: 'sx_ka_cities', name: 'The rocket cities', desc: 'Closed towns in the steppe, with no name on any map and the best-fed workers in the country.', x: 0, y: 1, req: ['sx_ka_blood'],
        fx: [['gold', -250], ['mod', 'sci', 0.15, PERM, 'The rocket cities'], ['techUp', 'mil']] },
      { id: 'sx_ka_poster', name: 'The sky belongs to us', desc: 'Every schoolroom gets the same poster: a rocket, a worker and a red star above the earth.', x: 1, y: 1, req: ['sx_ka_blood'],
        fx: [['mod', 'legit', 6, PERM, 'The sky belongs to us'], ['sup', 'workers', 6], ['glory', 4]] },
      { id: 'sx_ka_cosm', name: 'Cosmism', desc: 'The party declares its ultimate aim: not the classless society, which is merely the beginning, but the conquest of space and of death.', x: 0.5, y: 2, req: ['sx_ka_cities', 'sx_ka_poster'], days: 180,
        fx: [['ideology', 'cosmism', 'reform']] },
      { id: 'sx_ka_orbit', name: 'A man in orbit', desc: 'A farm boy from the Volga provinces, ninety minutes around the world, and a smile the whole planet sees.', x: 0, y: 3, req: ['sx_ka_cosm'], days: 210,
        fx: [['glory', 10], ['mod', 'legit', 8, PERM, 'A man in orbit'], ['opAll', 6]] },
      { id: 'sx_ka_moon', name: 'The flight to the Moon', desc: 'Three men, a capsule and a flag. The rest of the world will be listening.', x: 1, y: 3, req: ['sx_ka_orbit'], days: 360, year: 1958,
        fx: [['fn', (G, n) => { n.flags.moon = 1; ID.headline(G, { kicker: 'The common task', title: 'A red flag on the Moon', sub: n.name + ' has landed three men on the Moon, and they are coming home.', a: n.id, tone: 'good' }); if (ID.Press) ID.Press.add(G, { own: 1, w: 5, kind: 'pol', a: n.id, art: 'space', title: 'Karsovans on the Moon', text: 'Three Karsovan cosmonauts have walked on the Moon, planted a red flag in the dust of the Sea of Tranquillity, and taken off again. Their capsule is due to come down in the steppe on Thursday. Every government in the world has sent congratulations, and every general staff has done some arithmetic.' }); }], ['note', 'Men on the Moon'], ['glory', 20]] },
    ],
    ideo: { id: 'cosmism', name: 'Cosmism', color: [190, 40, 70], title: 'Cosmist Union of {N}',
      short: 'Communism as the first step of the common task: the conquest of space, of age, and in the end of death.',
      flags: { sciBonus: 0.3 },
      objective: { name: 'Red Star', desc: 'Men on the Moon, and five years in which the common task has held the country together.',
        sustain: (n) => n.stab >= 45,
        parts: (n, G) => [['The flight to the Moon', b(n.flags.moon), 1], ['Years of the common task (stability 45+)', n.cnt.sustain || 0, 5]] },
      ending: 'There is a Karsovan flag on the Moon, and the dust around it carries the bootprints of three men from the steppe. The design bureaus are already drawing the next ships, for Mars, and in a sanatorium outside the capital the institute of the common task keeps its first patients in cold sleep, waiting for the science that will wake them. The Cosmists say the conquest of space was the easy part. The next task is the dead.',
      perks: ['Science and prestige above every other socialist system.'], flaws: ['The budget of the stars comes out of the shops.'] },
    body: null,
  });

  /* ---------------------------------------------------------------- Amaran: the shared house */
  def({
    key: 'house', base: 'Amaran', parent: 'socdem', tab: 'The Shared House',
    when: (G, n) => yr(G) >= 1936 && yr(G) <= 1947 && n.nq && n.nq.v >= 38 && n.nq.v <= 62 && n.stab >= 45 && !(G.fronts && G.fronts.return && G.fronts.return.state) && !n.nwars,
    reveal: { art: 'peace', title: 'Two doors in one house',
      text: 'An old schoolteacher from the hill villages and a doctor of the Return have been running a joint clinic in the market town for ten years. They have written a short proposal, two pages long, and both peoples’ newspapers have printed it on the same morning: one state, two languages, a constitution that neither people can change without the other, and a house with two doors. Most people on both sides think they are mad. Not all of them.',
      yes: 'Open both doors', no: 'There is no such house' },
    tree: [
      { id: 'sx_am_clinic', name: 'The joint clinics', desc: 'A clinic in every mixed town, staffed by both peoples, open to both.', x: 0.5, y: 0, days: 120,
        fx: [['mod', 'unrest', -3, PERM, 'The joint clinics'], ['fn', (G, n) => { if (n.nq) n.nq.v += (50 - n.nq.v) * 0.3; }], ['note', 'The land question moves toward the middle']] },
      { id: 'sx_am_unions', name: 'One union for both', desc: 'Orange packers, dockers and railwaymen of both peoples in one union, with one strike fund.', x: 0, y: 1, req: ['sx_am_clinic'],
        fx: [['sup', 'workers', 10], ['front', 'return', -10], ['mod', 'prod', 0.04, PERM, 'One union']] },
      { id: 'sx_am_charter', name: 'The two-door charter', desc: 'A constitution with two chambers, two languages and a court of six judges, three from each people.', x: 1, y: 1, req: ['sx_am_clinic'],
        fx: [['legitmod', 6, 120, 'The charter'], ['particip', 10], ['opAll', 6]] },
      { id: 'sx_am_house', name: 'The Shared House', desc: 'The two peoples proclaim one republic. The extremists of both sides call it treason, and promise to make it fail.', x: 0.5, y: 2, req: ['sx_am_unions', 'sx_am_charter'], days: 180,
        fx: [['fn', (G, n) => { const F = G.fronts && G.fronts.return; if (F && !F.state) { F.str = 0; F.state = n.id; } if (n.dep) ID.Sov.free(G, n, 'story'); }], ['ideology', 'binational', 'reform']] },
      { id: 'sx_am_return', name: 'Both returns', desc: 'The refugees of one people and the immigrants of the other are both admitted, by the same law and the same quota.', x: 0.5, y: 3, req: ['sx_am_house'], days: 210,
        fx: [['pop', 0.04], ['mod', 'growth', 0.06, PERM, 'Both returns'], ['opAll', 6], ['mod', 'unrest', 3, 60, 'Newcomers']] },
    ],
    ideo: { id: 'binational', name: 'Binationalism', color: [214, 140, 60], title: 'Shared Republic of {N}',
      short: 'One land, two peoples, and a constitution that neither can change without the other.',
      dip: { export: 0.1, agg: 0.1, trade: 0.9, cb: [] },
      objective: { name: 'The House With Two Doors', desc: 'Keep the two peoples in balance (the land question between 40 and 60), hold every province of the land, and survive twelve years with stability 45 or more.',
        sustain: (n) => n.stab >= 45 && n.nq && n.nq.v >= 40 && n.nq.v <= 60,
        parts: (n, G) => [['The land question in balance (40–60)', n.nq ? b(n.nq.v >= 40 && n.nq.v <= 60) : 0, 1], ['Provinces of the land held', coresHeld(G, n), 1, '%'], ['Years the house has stood (stability 45+, in balance)', n.cnt.sustain || 0, 12]] },
      ending: 'Twelve years on, the house still stands. It is not a happy house: the two chambers quarrel, the court is deadlocked half the year, and there are still men on both sides who would burn it down. But the children of the joint clinics are grown, they speak both languages, and when the old schoolteacher was buried, the procession was led by the doctor. The rest of the Old Lands watches and does not quite believe it. Neither, some mornings, does Amaran.',
      perks: ['No partition, no war between the peoples, no camps.', 'Trade and goodwill from the whole world.'], flaws: ['Every decision needs both peoples.', 'Extremists on both sides want it to fail.'] },
    body: null,
  });

  /* ---------------------------------------------------------------- engine */
  /* Monthly, for the player only: a secret reveals itself once its moment comes. */
  Sc.month = function (G) {
    const n = G.nations[G.player];
    if (!n || !n.alive || G.over || !G.historical || G.scenario !== 'meridia') return;
    // the Bank's income from every war in the world
    if (n.flags.lendBoth) { let w = 0; for (const k in G.dip) { const d = G.dip[k]; if (d.war) w++; } if (w) { n.gold += Math.min(30, w * 3); n.a.lendIncome = Math.min(30, w * 3); } else n.a.lendIncome = 0; }
    if (n.flags.secret || n.flags.secretNo || n.flags.secretAsked || n.civilOf) return;
    for (const k in SECRETS) {
      const S = SECRETS[k]; if (S.base !== n.base) continue;
      let ok = false; try { ok = S.when(G, n); } catch (e) { ok = false; }
      if (!ok) continue;
      n.flags.secretAsked = 1;
      ID.Events.queue(G, n, 'sec_' + k, {});
      return;
    }
  };
  /* The secret tab, once opened. */
  Sc.tree = (n) => { const S = n.flags && n.flags.secret && SECRETS[n.flags.secret]; return S && ID.FOCUS.secret[S.key] ? { key: 'sec', name: S.tab, list: ID.FOCUS.secret[S.key], secret: 1 } : null; };
})();
