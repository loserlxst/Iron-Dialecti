/* IRON DIALECTIC — the Old Lands: the third continent of the historical campaign (The Three Continents).
   An empire's last provinces, mandates and protectorates, oil under the sand and a land two peoples claim.
   Its history is something done to it before it is something it does: the Great War is fought over it, not by
   it; its borders are drawn in other capitals; its oil belongs to foreign companies until someone takes it back.
   This file holds the national layer (casts and national questions), identities, oil fields, the liberation
   fronts, and the dated chapters with their press stories and superevents. The programme trees, destinies and
   foreign programmes are in data/oldtrees.js; the mechanics (dependency, oil, intervention, union, fronts) in
   sim/sovereignty.js. Historical campaigns only, except the generic mechanics. */
(function () {
  'use strict';
  const ID = (globalThis.ID = globalThis.ID || {});
  const E = ID.EVENT_DEFS, PERM = 600;
  const by = (G, b) => ID.byBase(G, b);
  const F = (G, k) => !!(G.story && G.story.flags && G.story.flags[k]);
  const is = (n, ...k) => k.indexOf(n.ideo) >= 0;
  const fam = (n) => ID.ideo(n).family;
  const ev = (o) => { o.sys = 1; o.national = 1; if (!o.tone) o.tone = 'bad'; E.push(o); };
  const story = (o) => { o.sys = 1; o.story = 1; E.push(o); return o; };
  const add = (b) => ID.STORY.push(b);
  const Sv = () => ID.Sov;
  const pre = (id, months, title, text, o) => { ID.PRESS_PRE[id] = Object.assign({ months, title, text, w: 3 }, o || {}); };
  const now = (id, title, text, o) => { ID.PRESS_NOW[id] = Object.assign({ title, text, w: 4 }, o || {}); };
  const old = (G) => ID.alive(G).filter((n) => n.region === 'old' || (G.provinces[G.prov[n.capital]] || {}).region === 'old');
  /* pull a national question toward a value */
  const toward = (target, k) => ['fn', (G, n) => { if (n.nq) n.nq.v += (target - n.nq.v) * k; }];

  /* ================================================================ the map: region, oil and fronts */
  const sc = ID.SCENARIOS.meridia;
  sc.region = { key: 'old', y: 0.76 };
  // [x, y, fields, found (1 = known in 1910) or the year it is struck, the company's country in 1910]
  sc.oil = [
    [0.53, 0.865, 3, 1927], [0.555, 0.835, 2, 1934], // Baskhar: the two rivers
    [0.50, 0.92, 4, 1938], [0.455, 0.935, 2, 1948], // Sahrem: the desert
    [0.645, 0.85, 3, 1, 'Norvik'], [0.61, 0.82, 1, 1950], // Zandar: the concession of 1909
    [0.43, 0.80, 1, 1962], // Varanth
    [0.70, 0.24, 3, 1], [0.31, 0.45, 2, 1], [0.88, 0.22, 2, 1930], [0.62, 0.665, 1, 1940], // Karsova, Cassine, Irkal, Antara
  ];
  // the Canal: tolls on the passage between two seas, owned by a Norvish and Lysian company; it is
  // worked like an oil field (P.canal marks it), and nationalising it is the same crisis
  sc.canal = [0.235, 0.84, 3, 'Norvik'];

  /* Liberation fronts: peoples who exist before their state does (sim/sovereignty.js) */
  ID.FRONTS = {
    return: { name: 'the Return', base: 'Neshar', adj: 'Nesharite', ideo: 'socdem', region: 'old', at: [[0.283, 0.911], [0.313, 0.895], [0.259, 0.904]], reach: 4, str: 6, grow: 0.04, riseAt: 95,
      blurb: 'A state of the Return: refugees from the persecutions of the west, farmers on bought land, and a people that intends never again to depend on anyone’s goodwill.',
      born: 'At four in the afternoon, in a museum hall, the leader of the Return read a declaration of independence to two hundred people and a radio microphone. Outside, the neighbours’ armies were already moving. A state has been born on land another people also calls its only home, and both of them know what that means.',
      drift: (G, F) => (F.str > 60 ? -0.05 : 0) },
    dersa: { name: 'the Dersan Front', base: 'Dersa', adj: 'Dersan', ideo: 'agrarian', region: 'old', at: [[0.53, 0.80], [0.585, 0.805]], reach: 9, str: 14, grow: 0.08, riseAt: 88,
      blurb: 'The mountain people of three empires, promised a state by one treaty and denied it by the next. Their only friends, the saying goes, are the mountains.',
      born: 'The Dersan Front has come down from the mountains and proclaimed a republic in the market town below them. It has a flag, a constitution typed on a borrowed typewriter, and enemies on every side.' },
  };

  /* ================================================================ the national layer */
  const N = ID.NATIONAL;
  N.Varanth = {
    ideo: 'absmon', leader: ['Mahmud VI', 58, ['pious', 'cautious'], 'Sultan'],
    cast: [['riza', 'army', 'Halil Rıza Pasha', 'thirdpos', 3, 48, 82, 44], ['ferit', 'police', 'Kâzım Ferit Bey', 'absmon', 2, 74, 40, 59],
      ['nuri', 'economy', 'Cavit Nuri Bey', 'liberal', 3, 60, 55, 51], ['hamdi', 'ideology', 'Sheikh Hamdi Efendi', 'theocracy', 2, 70, 45, 66], ['kemalettin', 'foreign', 'Reşat Kemalettin Bey', 'conmon', 2, 62, 50, 55]],
    names: [['Halil', 'Kâzım', 'Cavit', 'Reşat', 'Ömer', 'Selim', 'Fethi', 'Nihat', 'Orhan', 'Turgut'], ['Paşaoğlu', 'Demirci', 'Kaya', 'Ertuğ', 'Sezer', 'Tekin', 'Aydın', 'Bilgin', 'Karaca', 'Öztürk']],
    q: { name: 'The Sick Man', low: 'An empire of many peoples', high: 'A nation of one people', init: 28,
      desc: 'Six centuries of empire over a dozen peoples and three faiths. Every reformer since the last century has had to choose: keep the empire by keeping everyone, or save the core by becoming a nation. The second road ends in population exchanges, and everyone knows it.',
      drift: (n) => (is(n, 'absmon', 'theocracy') ? -0.05 : 0.15) + (is(n, 'thirdpos', 'natpop', 'pannat') ? 0.35 : 0) + (n.lostWarAt != null && n.age - n.lostWarAt < 36 ? 0.3 : 0),
      fx: (n, v) => ({ legit: is(n, 'absmon', 'theocracy') ? (50 - v) * 0.05 : (v - 50) * 0.06, unrest: (v - 50) * 0.04, atk: (v - 50) * 0.0015, trade: (50 - v) * 0.0015 }),
      acts: [
        { id: 'va_q_debt', name: 'Accept the creditors’ terms', desc: 'The Debt Commission takes another tax in return for another loan. The empire lives another year on credit.', cd: 24, dv: -6, fx: [['gold', 120], ['mod', 'rev', -0.05, 60, 'The Debt Commission'], ['sup', 'capital', 4]] },
        { id: 'va_q_officers', name: 'Promote the young officers', desc: 'Captains from the staff college who read the foreign press and believe the empire must become a nation to survive.', cost: { auth: 10 }, cd: 36, dv: 10, fx: [['sup', 'military', 8], ['figLoy', 'army', -6], ['mod', 'atk', 0.03, 60, 'The young officers']] },
        { id: 'va_q_exchange', name: 'Exchange the populations', desc: 'Two governments agree to swap their minorities: a million people each way, by ship and by train, carrying what they can. It will quiet the frontier. It is also exactly what it sounds like.', cost: { auth: 25 }, cd: 120, dv: 18, fx: [['pop', -0.03], ['mod', 'unrest', -6, 60, 'The exchange'], ['opAll', -6], ['grievance', 10], ['note', 'There is no clean way to do this.', false]] },
      ],
      hi: 'nq_va_hi', hiAt: 88, lo: 'nq_va_lo', loAt: 8, loIf: (n) => is(n, 'absmon', 'theocracy', 'conmon') },
  };
  ev({ id: 'nq_va_hi', title: 'The minorities’ petition', text: 'The nation-state has a census now, and the census has found two million people who are not of the nation: mountain clans, Old Faith villages, merchants of the coast. Their notables have signed a petition asking what the new republic intends to do with them.',
    opts: [
      { label: 'Citizens like any other', tip: 'One law for all. The officers will call it weakness.', fx: [['nq', -10], ['opAll', 4], ['mod', 'unrest', -3, 36, 'Equal citizens'], ['sup', 'military', -6]] },
      { label: 'Assimilate them', tip: 'One language in the schools, one name on the identity card.', fx: [['nq', 4], ['grievance', 8], ['front', 'dersa', 10], ['mod', 'unrest', 2, 36, 'Assimilation']] },
      { label: 'Move them', tip: 'Resettlement to the interior. There is no gentle version of this, and the text should not pretend there is.', fx: [['nq', 8], ['pop', -0.02], ['opAll', -10], ['front', 'dersa', 15], ['note', 'History will judge this harshly.', false]] },
    ] });
  ev({ id: 'nq_va_lo', title: 'The empire comes apart', text: 'Three provinces have stopped sending their taxes, a fourth has a foreign consul who governs it in all but name, and the Sultan’s firmans are read aloud in empty squares. The court asks for a decision it has postponed for a century.',
    opts: [
      { label: 'Federation of the peoples', tip: 'Autonomy for every province that wants it. The empire as a commonwealth.', fx: [['nq', 12], ['mod', 'unrest', -6, 60, 'Federation'], ['auth', -15], ['tradition', -6]] },
      { label: 'Hold everything by force', tip: 'The garrisons double. So does the debt.', fx: [['mod', 'unrest', -8, 24, 'Martial law'], ['gold', -120], ['grievance', 10], ['nq', 4]] },
    ] });

  N.Khemra = {
    ideo: 'conmon', leader: ['Murad Kamel II', 36, ['spendthrift', 'cautious'], 'Khedive'],
    cast: [['sabri', 'army', 'General Aziz Sabri', 'thirdpos', 2, 50, 78, 41], ['rafaat', 'police', 'Hassan Rafaat Pasha', 'conmon', 2, 70, 40, 57],
      ['yehia', 'economy', 'Mahmoud Yehia Bey', 'liberal', 3, 62, 50, 49], ['mahfouz', 'ideology', 'Sheikh Ali Mahfouz', 'revival', 2, 55, 70, 46], ['lutfi', 'foreign', 'Sa’id Lutfi Bey', 'liberal', 3, 66, 45, 52]],
    names: [['Ahmad', 'Mahmoud', 'Hassan', 'Kamal', 'Salah', 'Gamal', 'Anwar', 'Zakaria', 'Abdel', 'Sami'], ['Sabri', 'Lutfi', 'Hamdi', 'Rifaat', 'Mansour', 'Shukri', 'Fahmi', 'Barakat', 'Ghaleb', 'Wahba']],
    q: { name: 'The Pashas and the Fellahin', low: 'The pashas’ cotton', high: 'Land to the fellahin', init: 20,
      desc: 'Two thousand families own a third of the river’s land and grow cotton for foreign mills; twelve million fellahin grow it for them. Whoever gives the land to those who work it will own the country’s loyalty, and lose its richest men.',
      drift: (n) => (is(n, 'conmon', 'absmon', 'liberal') ? -0.05 : 0.3) + (is(n, 'thirdpos', 'pannat', 'socdem', 'demsoc') ? 0.3 : 0),
      fx: (n, v) => ({ prod: (50 - v) * 0.001, food: (v - 50) * 0.0015, unrest: (40 - v) * 0.05, legit: is(n, 'thirdpos', 'pannat') ? (v - 50) * 0.06 : 0 }),
      acts: [
        { id: 'kh_q_cotton', name: 'Sell the cotton forward', desc: 'Next year’s crop sold this year to the exchange in Norvik, at this year’s price.', cd: 24, dv: -5, fx: [['gold', 110], ['sup', 'capital', 6], ['sup', 'peasants', -4]] },
        { id: 'kh_q_reform', name: 'Break up the estates', desc: 'No family may hold more than two hundred acres; the rest goes to the tenants who work it, with forty years to pay.', cost: { auth: 20 }, cd: 60, dv: 15, fx: [['sup', 'peasants', 12], ['sup', 'capital', -10], ['mod', 'food', 0.05, 120, 'Land reform']] },
        { id: 'kh_q_cooperative', name: 'Village cooperatives', desc: 'Seed, credit and fertiliser through a cooperative in every village, run by the ministry.', cost: { gold: 80 }, cd: 36, dv: 6, fx: [['mod', 'food', 0.04, 60, 'Cooperatives'], ['sup', 'bureaucracy', 4]] },
      ],
      hi: 'nq_kh_hi', hiAt: 85, lo: 'nq_kh_lo', loAt: 6, loIf: (n) => n.stab < 50 },
  };
  ev({ id: 'nq_kh_hi', tone: 'mixed', title: 'The last pasha leaves', text: 'The last of the great cotton families has sold its palace to the ministry of agrarian reform and taken the night boat to the north. The fellahin own their land. They also owe the state for it, and the state has opinions about what they should grow.',
    opts: [
      { label: 'Let them grow what they choose', fx: [['sup', 'peasants', 8], ['mod', 'food', 0.04, 60, 'Free farmers']] },
      { label: 'The plan decides the crop', fx: [['mod', 'prod', 0.04, 60, 'Planned agriculture'], ['sup', 'peasants', -6], ['sup', 'bureaucracy', 6]] },
    ] });
  ev({ id: 'nq_kh_lo', title: 'The village burns the gin', text: 'In a cotton village in the delta, tenants have burned the landlord’s cotton gin and his agent’s house. The provincial governor asks whether to send the camel corps or the land commission.',
    opts: [
      { label: 'The camel corps', fx: [['mod', 'unrest', -6, 12, 'The camel corps'], ['grievance', 10], ['sup', 'peasants', -8]] },
      { label: 'A commission on rents', fx: [['nq', 10], ['sup', 'capital', -6], ['sup', 'peasants', 6]] },
    ] });

  N.Baskhar = {
    ideo: 'absmon', leader: ['Rashid Pasha al-Tikriti', 61, ['corrupt', 'cautious'], 'Governor-General'],
    cast: [['jaber', 'army', 'Colonel Salah Jaber', 'pannat', 2, 46, 84, 38], ['haddad', 'police', 'Nuri Haddad', 'absmon', 2, 66, 50, 52],
      ['karim', 'economy', 'Ja’far Abd al-Karim', 'conmon', 3, 62, 45, 48], ['kashif', 'ideology', 'Sayyid Hadi Kashif', 'theocracy', 2, 58, 60, 63], ['rauf', 'foreign', 'Yasin Rauf', 'conmon', 3, 70, 40, 50]],
    names: [['Nuri', 'Yasin', 'Salah', 'Abd al-Salam', 'Fadhil', 'Hikmat', 'Tahir', 'Kamil', 'Husain', 'Ali'], ['Jaber', 'Rauf', 'Haddad', 'al-Rawi', 'Shabib', 'Mahdawi', 'Jamali', 'al-Bakri', 'Tabaqchali', 'Ghazi']],
    q: { name: 'Three Vilayets', low: 'Three peoples, three provinces', high: 'One Baskhar', init: 32,
      desc: 'The marsh country of the south, the city of the middle and the mountain valleys of the north were three provinces of the empire, each with its own faith, its own families and its own idea of who should rule. A state was drawn around them by a foreign official with a ruler and a pencil.',
      drift: (n) => (is(n, 'pannat', 'thirdpos', 'junta') ? 0.25 : -0.05) + (n.nwars ? 0.15 : 0) - ((n.a.unrest || 0) > 35 ? 0.2 : 0),
      fx: (n, v) => ({ unrest: (50 - v) * 0.05, legit: (v - 50) * 0.05, atk: (v - 50) * 0.001, coup: v > 70 ? (v - 70) * 0.01 : 0 }),
      acts: [
        { id: 'bk_q_sheikhs', name: 'Pay the sheikhs', desc: 'Land titles for the tribal chiefs of the south: their loyalty, and their tenants’ rents, for the state.', cost: { gold: 70 }, cd: 24, dv: -4, fx: [['mod', 'unrest', -4, 36, 'The sheikhs’ bargain'], ['sup', 'peasants', -4], ['sup', 'clergy', 4]] },
        { id: 'bk_q_army', name: 'The army is the nation', desc: 'Conscription for every young man of every province, one uniform, one barracks, one officers’ club.', cost: { auth: 15 }, cd: 36, dv: 10, fx: [['law', 'recruit', 'conscription'], ['sup', 'military', 8], ['front', 'dersa', 4]] },
        { id: 'bk_q_federal', name: 'Autonomy for the north', desc: 'The mountain valleys get their own schools, their own language and their own police.', cost: { auth: 10 }, cd: 60, dv: -8, fx: [['front', 'dersa', -15], ['mod', 'unrest', -4, 60, 'Northern autonomy'], ['sup', 'military', -6]] },
      ],
      hi: 'nq_bk_hi', hiAt: 86, lo: 'nq_bk_lo', loAt: 10, loIf: (n) => n.stab < 55 },
  };
  ev({ id: 'nq_bk_hi', title: 'The census in the north', text: 'The new state has ordered a census of the northern valleys. The mountain villages say the census is the first step to moving them; the army says it is the first step to taxing them. Both may be right.',
    opts: [
      { label: 'Count them under guard', fx: [['front', 'dersa', 15], ['mod', 'rev', 0.03, 60, 'The census'], ['mod', 'unrest', 3, 24, 'Census in the north']] },
      { label: 'Postpone the census', fx: [['nq', -8], ['sup', 'military', -4]] },
    ] });
  ev({ id: 'nq_bk_lo', title: 'The marshes rise', text: 'The marsh tribes of the south have closed the river to government boats. Their sheikhs say the city takes their taxes and sends nothing back; their preachers say the city governs without the faith.',
    opts: [
      { label: 'Bomb the reed villages', tip: 'The air force can be there by noon. The marshes will remember for a century.', fx: [['mod', 'unrest', -8, 12, 'The bombing'], ['grievance', 12], ['sup', 'clergy', -8], ['opAll', -3]] },
      { label: 'Negotiate with the sheikhs', fx: [['nq', 8], ['gold', -60], ['sup', 'clergy', 6]] },
    ] });

  N.Amaran = {
    ideo: 'agrarian', leader: ['Raghib Aref', 57, ['diplomat', 'cautious'], 'Elder of the Notables'],
    cast: [['salameh', 'army', 'Abd al-Qadir Salameh', 'natpop', 2, 52, 80, 34], ['tannous', 'police', 'Jamal Tannous', 'agrarian', 2, 66, 40, 50],
      ['shukri', 'economy', 'Fuad Shukri', 'liberal', 3, 60, 50, 46], ['zuabi', 'ideology', 'Sheikh Taher Zuabi', 'revival', 2, 60, 66, 55], ['nasri', 'foreign', 'Nasri Haddad', 'conmon', 3, 64, 45, 49]],
    names: [['Musa', 'Raghib', 'Jamal', 'Fuad', 'Khalil', 'Awni', 'Hussein', 'Emile', 'Ahmad', 'Yusuf'], ['Aref', 'Tannous', 'Shukri', 'Haddad', 'Khalidi', 'Dajani', 'Nashef', 'Abu Ghosh', 'Barghouti', 'Tamari']],
    q: { name: 'Two Peoples, One Land', low: 'Partition', high: 'The land is ours alone', init: 70,
      desc: 'The olive villages have been here for a thousand years. The Return has come because the west tried to murder its people and no other country would take them. Both have a deed, a grave and a memory on the same hills. Toward one end of this gauge lies partition, toward the other the expulsion of one people by the other. Somewhere in the middle there may be a shared house; nobody has yet found the door.',
      drift: (n, G) => -0.12 - ((G.fronts && G.fronts.return && G.fronts.return.str) || 0) * 0.004 + (n.dep && n.dep.kind === 'mandate' ? -0.1 : 0) + (is(n, 'natpop', 'revival', 'pannat') ? 0.3 : 0),
      fx: (n, v) => ({ unrest: Math.abs(v - 50) * 0.06 - 1, legit: (50 - Math.abs(v - 50)) * 0.04 - 1, trade: (v < 40 ? 0.03 : 0) }),
      acts: [
        { id: 'am_q_land', name: 'Forbid land sales to the Return', desc: 'A decree, and a committee in every village to enforce it. Absentee landlords in other countries will sell anyway.', cost: { auth: 10 }, cd: 24, dv: 8, fx: [['front', 'return', -4], ['sup', 'peasants', 6], ['sup', 'capital', -4]] },
        { id: 'am_q_joint', name: 'Joint workers’ councils', desc: 'One union for the orange packers of both peoples, one strike fund, one picket line.', cost: { auth: 15 }, cd: 36, dv: 0, fx: [toward(50, 0.3), ['sup', 'workers', 6], ['note', 'The gauge moves toward the middle']] },
        { id: 'am_q_strike', name: 'Call a general strike', desc: 'Shops shut, buses still, the ports silent: the country tells the mandate that it will not be governed without its consent.', cost: { auth: 20 }, cd: 48, dv: 10, fx: [['dep', 'res', 12], ['mod', 'prod', -0.08, 6, 'The general strike'], ['sup', 'workers', 4]] },
      ],
      hi: 'nq_am_hi', hiAt: 90, lo: 'nq_am_lo', loAt: 14 },
  };
  ev({ id: 'nq_am_hi', title: 'The night of the burning settlements', text: 'Armed men from three villages attacked two settlements of the Return last night. Twenty-three people are dead, among them children. The villages say the settlements took their land; the settlements say they bought it. Tomorrow the other side will want its revenge, and will take it.',
    opts: [
      { label: 'Arrest the attackers', tip: 'The villages will call it collaboration. It is also the law.', fx: [['nq', -10], ['sup', 'peasants', -6], ['legitmod', 4, 60, 'The law upheld']] },
      { label: 'Say nothing', fx: [['nq', 4], ['front', 'return', 10], ['opAll', -6], ['note', 'Silence is also an answer.', false]] },
    ] });
  ev({ id: 'nq_am_lo', title: 'The commission recommends partition', text: 'A commission of foreign lawyers has spent three months in the country and concluded that the two peoples cannot live together. Its map gives the coast and the valleys to the Return and the hills to the villages. Half a million people are on the wrong side of the line.',
    opts: [
      { label: 'Reject the map', fx: [['nq', 8], ['dep', 'res', 10], ['mod', 'unrest', 4, 24, 'The rejected map']] },
      { label: 'Negotiate the line', tip: 'Better a bad map we drew than a worse one drawn for us. The villages on the wrong side will not forgive it.', fx: [['nq', -6], ['legitmod', -6, 60, 'Negotiated partition'], ['opAll', 5]] },
    ] });

  N.Tyrrha = {
    ideo: 'merchant', leader: ['Elias Boustani', 61, ['diplomat', 'corrupt'], 'President of the Council'],
    cast: [['tannoury', 'army', 'General Fadi Tannoury', 'junta', 2, 58, 60, 50], ['tabet', 'police', 'Selim Tabet', 'merchant', 2, 64, 45, 53],
      ['sursoq', 'economy', 'Nicolas Sursoqi', 'merchant', 3, 70, 40, 58], ['jaafari', 'ideology', 'Preacher Musa Jaafari', 'revival', 2, 54, 72, 44], ['khoury', 'foreign', 'Charles Khoury', 'liberal', 3, 68, 45, 47]],
    names: [['Elias', 'Selim', 'Camille', 'Rashid', 'Kamal', 'Pierre', 'Riad', 'Sabri', 'Fuad', 'Musa'], ['Boustani', 'Tabet', 'Khoury', 'Haddad', 'Salam', 'Frangieh', 'Chamoun', 'Karami', 'Arslan', 'Eddé']],
    q: { name: 'The National Pact', low: 'Every confession for itself', high: 'One Tyrrhan nation', init: 52,
      desc: 'Seventeen confessions share one mountain and one harbour by an unwritten pact: the presidency to one, the premiership to another, the speaker’s chair to a third, and a census that nobody dares take because it would show who has grown. It works as long as nobody counts.',
      drift: (n, G) => -0.12 + (n.stab > 55 ? 0.1 : 0) - (n.nwars ? 0.2 : 0) - (old(G).some((o) => o !== n && is(o, 'pannat', 'revival')) ? 0.12 : 0),
      fx: (n, v) => ({ trade: (v - 30) * 0.002, unrest: (50 - v) * 0.06, coup: (40 - v) * 0.01 }),
      acts: [
        { id: 'ty_q_share', name: 'Share the offices', desc: 'A new ministry for each confession that feels slighted. The budget feels it more.', cost: { gold: 60 }, cd: 24, dv: 8, fx: [['corr', 4], ['mod', 'unrest', -3, 36, 'Shared offices']] },
        { id: 'ty_q_militia', name: 'Let the confessions arm', desc: 'Each confession its own militia, for the defence of the country. In practice, for the defence against each other.', cd: 36, dv: -12, fx: [['mod', 'def', 0.08, 60, 'Confession militias'], ['troops', 0.08]] },
        { id: 'ty_q_bank', name: 'Banking secrecy', desc: 'A law of absolute secrecy for every account in Tyrrha. The money of the whole region arrives within the year.', cost: { auth: 10 }, cd: 120, dv: 4, fx: [['mod', 'trade', 0.08, PERM, 'Banking secrecy'], ['gold', 100], ['corr', 6]] },
      ],
      hi: 'nq_ty_hi', hiAt: 86, lo: 'nq_ty_lo', loAt: 12 },
  };
  ev({ id: 'nq_ty_hi', tone: 'mixed', title: 'Someone proposes a census', text: 'A young deputy has tabled a motion for the first census in thirty years. Every party leader agrees in public that it is a fine idea, and in private that it must never happen.',
    opts: [
      { label: 'Take the census', tip: 'The pact rests on numbers from another generation. The real ones will shake it.', fx: [['nq', -18], ['legitmod', 4, 60, 'The truth counted'], ['mod', 'unrest', 4, 24, 'The census']] },
      { label: 'Bury the motion', fx: [['nq', 4], ['corr', 3]] },
    ] });
  ev({ id: 'nq_ty_lo', title: 'Roadblocks on the mountain road', text: 'Militias of two confessions have set up roadblocks on the road from the harbour to the mountains, checking identity cards. Both say they are protecting their people from the other.',
    opts: [
      { label: 'The army clears the road', fx: [['mod', 'unrest', -5, 12, 'The road cleared'], ['sup', 'military', 4], ['nq', 4], ['grievance', 6]] },
      { label: 'Mediation by the notables', fx: [['nq', 6], ['gold', -50], ['stab', -2]] },
    ] });

  N.Sahrem = {
    ideo: 'theocracy', leader: ['Mansur ibn Hamad', 34, ['soldier', 'pious'], 'Emir'],
    cast: [['khalid', 'army', 'Prince Khalid ibn Mansur', 'absmon', 2, 72, 60, 30], ['zamil', 'police', 'Faisal al-Zamil', 'theocracy', 2, 70, 40, 44],
      ['ghaith', 'economy', 'Hamza Ghaith', 'conmon', 2, 64, 45, 41], ['wahbi', 'ideology', 'Sheikh Muhammad Wahbi', 'theocracy', 3, 76, 50, 58], ['sabbagh', 'foreign', 'Jamil Sabbagh', 'liberal', 2, 60, 45, 46]],
    names: [['Faisal', 'Khalid', 'Saud', 'Turki', 'Mansur', 'Abdullah', 'Sultan', 'Nayef', 'Bandar', 'Majid'], ['ibn Hamad', 'al-Zamil', 'Ghaith', 'Wahbi', 'al-Sudairi', 'al-Rashid', 'Tariqi', 'Yamani', 'al-Suleiman', 'Kabbani']],
    q: { name: 'The Clerics’ Bargain', low: 'The preachers’ kingdom', high: 'The princes’ state', init: 22,
      desc: 'The emir conquered the desert with the preachers’ blessing and holds it on their terms: the faith governs morals and schools, the house governs everything else. Oil money will make the princes rich, the cities modern and the preachers furious. The bargain must be renegotiated with every new thing: the telegraph, the radio, women at the wheel.',
      drift: (n, G) => (ID.Sov ? Math.min(0.4, ID.Sov.fields(G, n, true) * 0.04) : 0) - (n.ideo === 'theocracy' ? 0.06 : 0) - (n.ideo === 'revival' ? 0.4 : 0),
      fx: (n, v) => ({ legit: n.ideo === 'theocracy' ? (50 - v) * 0.05 : (v - 50) * 0.04, sci: (v - 50) * 0.002, unrest: v > 70 ? (v - 70) * 0.08 : 0 }),
      acts: [
        { id: 'sa_q_seminary', name: 'Endow the seminaries', desc: 'A new university of the faith, its rector chosen by the preachers, its students paid to study.', cost: { gold: 80 }, cd: 36, dv: -8, fx: [['sup', 'clergy', 10], ['mod', 'legit', 3, 60, 'The seminaries']] },
        { id: 'sa_q_princes', name: 'Princes to foreign universities', desc: 'The emir’s grandsons to study engineering abroad. They will come back with degrees, and ideas.', cost: { gold: 50 }, cd: 36, dv: 8, fx: [['mod', 'sci', 0.08, 120, 'Foreign degrees'], ['sup', 'intelligentsia', 6], ['sup', 'clergy', -4]] },
        { id: 'sa_q_tribes', name: 'Subsidise the tribes', desc: 'Monthly payments to every tribal chief, in cash, delivered by a prince.', cost: { gold: 60 }, cd: 24, dv: 0, fx: [['stab', 4], ['mod', 'unrest', -4, 24, 'The subsidies'], ['corr', 3]] },
      ],
      hi: 'nq_sa_hi', hiAt: 82, lo: 'nq_sa_lo', loAt: 8 },
  };
  ev({ id: 'nq_sa_hi', title: 'Zealots in the holy shrine', text: 'Two hundred armed zealots have seized the great shrine at dawn prayers and proclaimed that the house has betrayed the faith for foreign money. Their leader names a redeemer. The preachers must decide whether to bless an assault on the holiest place in the kingdom.',
    opts: [
      { label: 'Storm it, with the preachers’ blessing', tip: 'The blessing will be given, and its price will be paid for a generation: every reform since the oil is reversed.', fx: [['nq', -25], ['sup', 'clergy', 10], ['mod', 'sci', -0.06, 120, 'The reforms reversed'], ['stab', -4]] },
      { label: 'Storm it with foreign commandos', fx: [['nq', 5], ['sup', 'clergy', -15], ['opAll', -4], ['drift', 'revival', 15]] },
    ] });
  ev({ id: 'nq_sa_lo', tone: 'mixed', title: 'The preachers ban the radio', text: 'The council of preachers has ruled that the radio is an instrument of corruption. The emir’s new station has been on the air for eleven days.',
    opts: [
      { label: 'The radio reads the Book', tip: 'The station will broadcast scripture first, and the news after. Both sides can call it a victory.', fx: [['nq', 6], ['sup', 'clergy', 2]] },
      { label: 'Shut the station', fx: [['sup', 'clergy', 6], ['mod', 'sci', -0.03, 60, 'No radio']] },
    ] });

  N.Zandar = {
    ideo: 'conmon', leader: ['Kaveh Mirza', 46, ['ailing', 'spendthrift'], 'Shah'],
    cast: [['bakhtar', 'army', 'General Teymour Bakhtar', 'junta', 2, 52, 80, 47], ['daneshvar', 'police', 'Farrokh Daneshvar', 'absmon', 2, 70, 45, 51],
      ['amini', 'economy', 'Davud Amini', 'liberal', 3, 58, 55, 49], ['lankarani', 'ideology', 'Grand Jurist Kazem Lankarani', 'revival', 3, 40, 70, 56], ['nakhjavan', 'foreign', 'Firuz Nakhjavan', 'conmon', 2, 66, 40, 53]],
    names: [['Firuz', 'Davud', 'Teymour', 'Kaveh', 'Bahram', 'Hossein', 'Ali', 'Mehdi', 'Karim', 'Abbas'], ['Bakhtar', 'Amini', 'Daneshvar', 'Nakhjavan', 'Farmanfarma', 'Qavam', 'Esfandiari', 'Zahedi', 'Ghaffari', 'Sanjabi']],
    q: { name: 'The Oil and the Throne', low: 'The shah’s oil', high: 'The nation’s oil', init: 30,
      desc: 'A Norvish company holds the oil by a concession signed in 1909 by a shah who needed money for a trip abroad. The parliament that the revolution of 1906 created says the oil belongs to the nation; the court says the nation is the shah. Whoever wins this argument will rule Zandar.',
      drift: (n, G) => 0.08 + ID.eraOf(G.tick) * 0.06 + (is(n, 'absmon') ? -0.3 : 0) + (n.laws.press === 'free' ? 0.1 : 0) + (n.flags.nationalised ? 0.3 : 0),
      fx: (n, v) => ({ legit: is(n, 'absmon', 'conmon') ? (50 - v) * 0.04 : (v - 50) * 0.05, unrest: (v - 50) * 0.03, coup: is(n, 'conmon', 'liberal') && v > 70 ? (v - 70) * 0.015 : 0 }),
      acts: [
        { id: 'za_q_majlis', name: 'Dissolve the parliament', desc: 'The deputies sent home, the newspapers closed, the oil left with the company and the company’s royalties with the court.', cost: { auth: 20 }, cd: 36, dv: -14, fx: [['particip', -10], ['gold', 80], ['grievance', 8]] },
        { id: 'za_q_terms', name: 'Renegotiate the royalties', desc: 'Ask the company for a quarter of the profits instead of a sixteenth. It will say no, then a fifth.', cost: { auth: 10 }, cd: 48, dv: 6, fx: [['fn', (G, n) => { for (const P of ID.Sov.oilProvs(G, n)) if (P.oilCo && P.oilCo !== n.id) P.oilShare = Math.max(0.5, (P.oilShare || 0.75) - 0.08); }], ['note', 'The company’s share of the oil falls'], ['op', 'Norvik', -8]] },
        { id: 'za_q_white', name: 'A revolution from the throne', desc: 'Land reform, votes for women and literacy corps, decreed by the shah before the street can demand them.', cost: { auth: 15 }, cd: 120, dv: -6, fx: [['sup', 'peasants', 8], ['sup', 'clergy', -10], ['mod', 'sci', 0.06, 120, 'Literacy corps'], ['drift', 'revival', 8]] },
      ],
      hi: 'nq_za_hi', hiAt: 82, lo: 'nq_za_lo', loAt: 8 },
  };
  ev({ id: 'nq_za_hi', title: 'The parliament votes the oil law', text: 'By a unanimous vote, with the galleries full and the crowds outside chanting, the parliament has declared the oil industry the property of the nation. The law needs only the shah’s signature. The company’s manager has asked for an audience.',
    opts: [
      { label: 'Sign it', tip: 'The oil is nationalised: the company’s country will answer, and it has a fleet.', fx: [['oil', 'nationalise'], ['legitmod', 8, 60, 'The oil law'], ['sup', 'workers', 6]] },
      { label: 'Refuse to sign', fx: [['nq', -10], ['particip', -8], ['mod', 'unrest', 6, 24, 'The shah refuses'], ['drift', 'revival', 6]] },
    ] });
  ev({ id: 'nq_za_lo', title: 'The secret police and the seminary', text: 'The security service has raided a seminary in the holy city and arrested forty students and their teacher. The teacher is the most popular preacher in the country. The bazaar has closed in protest.',
    opts: [
      { label: 'Exile the preacher', tip: 'He will preach from abroad, on cassette tapes, to every bazaar in the country.', fx: [['drift', 'revival', 18], ['sup', 'clergy', -10], ['mod', 'unrest', -3, 12, 'The bazaar reopens']] },
      { label: 'Release them all', fx: [['auth', -10], ['sup', 'clergy', 6], ['nq', 6]] },
    ] });

  /* ================================================================ identities */
  const sp = (name, desc, fx) => ({ name, desc, fx });
  Object.assign(ID.IDENTITY, {
    Varanth: { motto: 'The state is eternal.', anthem: 'The March of the Six Arrows',
      lore: 'For six hundred years Varanth ruled from the straits to the deserts, a dozen peoples under one sultan and one law. For the last hundred it has been called the sick man of the continents, and every great power has a doctor ready, and an inheritance in mind.',
      spirits: [sp('The Sublime Porte', 'An old administration that still works, slowly.', [['mod', 'eff', 0.03, PERM, 'The Sublime Porte'], ['tradition', 6]]), sp('The Debt Commission', 'Foreign creditors collect the empire’s best taxes.', [['mod', 'rev', -0.06, 240, 'The Debt Commission']])] },
    Khemra: { motto: 'The river gives, the river remembers.', anthem: 'Mother of the World',
      lore: 'Seven thousand years of civilisation on a ribbon of green between two deserts, and the largest city of the Old Lands. Khemra grows cotton for foreign mills, owns a canal it does not control, and has more university graduates than jobs to give them.',
      spirits: [sp('The Gift of the River', 'The richest farmland in the Old Lands.', [['mod', 'food', 0.08, PERM, 'The Gift of the River']]), sp('The Residency', 'A foreign Resident decides what matters.', [['legitmod', -3, 240, 'The Residency']])] },
    Baskhar: { motto: 'Between the two rivers, one people.', anthem: 'The Palms of the South',
      lore: 'The land between the two rivers was the first place on earth where people wrote down their laws. Since then it has been conquered by everyone who passed. Three provinces, three faiths and a lake of oil under the marshes make it the most coveted and least governable country of the Old Lands.',
      spirits: [sp('The Two Rivers', 'Water and silt enough for an empire.', [['mod', 'food', 0.05, PERM, 'The Two Rivers']]), sp('Three Vilayets', 'Three provinces that never chose to be one country.', [['mod', 'unrest', 2, 360, 'Three Vilayets']])] },
    Amaran: { motto: 'The olive does not leave its hill.', anthem: 'The Terraces',
      lore: 'Terraced hills, olive groves, holy cities that three faiths count as theirs, and a coast of orange groves. Amaran is small, poor and beloved by half the world, which is its misfortune: everyone who loves it has a plan for it.',
      spirits: [sp('The Holy Cities', 'Pilgrims, alms and the world’s attention.', [['mod', 'trade', 0.05, PERM, 'The Holy Cities'], ['tradition', 6]]), sp('Everyone’s Promised Land', 'Every great power has made a promise about it, to someone else.', [['opAll', 4], ['mod', 'unrest', 2, 360, 'Contradictory promises']])] },
    Tyrrha: { motto: 'Seventeen faiths, one harbour.', anthem: 'The Cedar and the Sea',
      lore: 'A mountain of monasteries and a harbour of banks, where seventeen confessions keep a peace by sharing out every office according to a census taken in another century. Tyrrha is the Old Lands’ window, its bank, its printing press and its warning.',
      spirits: [sp('The Bankers of the Old Lands', 'Every fortune in the region has an account here.', [['mod', 'trade', 0.08, PERM, 'The Bankers of the Old Lands'], ['gold', 100]]), sp('The Unwritten Pact', 'Everything shared, nothing decided.', [['mod', 'eff', -0.04, PERM, 'The Unwritten Pact']])] },
    Sahrem: { motto: 'There is no strength but in the faith.', anthem: 'The Sword and the Palm',
      lore: 'A desert of tribes united by a family and a creed within living memory. Sahrem has no factories, no railway and no foreign debt, and its preachers would like to keep it that way. Under its sand lies a quarter of the world’s oil, and nobody knows it yet.',
      spirits: [sp('The Desert Is a Fortress', 'No army has crossed the empty quarter and arrived in fighting order.', [['mod', 'def', 0.1, PERM, 'The Desert Is a Fortress']]), sp('The Preachers’ Blessing', 'The faith is the state’s first pillar.', [['sup', 'clergy', 10]])] },
    Zandar: { motto: 'Kings pass. The plateau remains.', anthem: 'Ode to the High Plateau',
      lore: 'An empire of poets on a high plateau, older than any of its neighbours and humiliated by all of them in turn. Zandar had a constitutional revolution in 1906, a parliament since then, and a Norvish company that owns everything under the ground.',
      spirits: [sp('The Constitution of 1906', 'A parliament, a free press, and a shah who resents both.', [['particip', 10], ['mandate', 6]]), sp('The Concession of 1909', 'The oil belongs to a foreign company for sixty years.', [['mod', 'rev', -0.04, 360, 'The concession']])] },
  });

  /* ================================================================ the chapters */
  const stw = (G, a, b, cb, why) => { const A = by(G, a), B = by(G, b); if (A && B && A !== B && !ID.atWar(G, A.id, B.id)) ID.storyWar(G, a, b, cb || 'claims', why); };
  const rebind = (G, base, over, kind) => { const n = by(G, base), o = by(G, over); if (n && o && n !== o) { ID.Sov.bind(G, n, o, kind, true); n.dep.script = 1; n.dep.res = Math.max(n.dep.res, 45); } };
  const freeQ = (G, base, how) => { const n = by(G, base); if (n && n.dep) ID.Sov.free(G, n, how || 'story'); };
  const depOf = (G, base, over) => { const n = by(G, base); return n && n.dep && G.nations[n.dep.over] && G.nations[n.dep.over].base === over; };

  // 1911 Varanth: the Debt Commission
  add({ id: 'st_ol_debt', date: [1911, 3], nation: 'Varanth', cond: (G) => { const v = by(G, 'Varanth'); return v && is(v, 'absmon', 'conmon'); } });
  story({ id: 'st_ol_debt', title: 'The Debt Commission', text: 'The empire’s foreign creditors want their coupons paid. Their commission already collects the salt, silk and tobacco taxes; now it asks for the customs of the three richest ports, in return for a new loan that will pay the interest on the old ones. The young officers in the staff college have a word for this, and it is not a polite one.',
    opts: [
      { label: 'Sign the new loan', hist: 1, sf: 'debt_signed', tip: 'Another year of solvency. The creditors’ commission becomes the empire’s second government.', fx: [['gold', 160], ['mod', 'rev', -0.08, 120, 'The customs pledged'], ['op', 'Norvik', 10], ['op', 'Cassine', 10], ['nq', -4], ['sup', 'military', -6]] },
      { label: 'Default, and seize the customs', sf: 'debt_default', tip: 'The coupons go unpaid. Every embassy will protest; some will send ships.', fx: [['gold', 100], ['opAll', -12], ['op', 'Norvik', -20], ['nq', 6], ['sup', 'military', 6]] },
      { label: 'A constitution, to reassure the creditors', sf: 'debt_constitution', tip: 'A parliament that answers for the debt. The Sultan keeps his throne and loses his last word.', fx: [['ideology', 'conmon', 'reform'], ['gold', 80], ['nq', 4]] },
    ] });
  pre('st_ol_debt', 2, 'The empire’s coupons fall due', 'Bondholders in Norvik and Cassine are anxious: the Varanthine government has paid its last two coupons with money borrowed for the purpose. The creditors’ commission, which already collects a fifth of the empire’s revenue, is said to be drafting a proposal of its own.');

  // 1912 Zandar: the concession
  add({ id: 'st_ol_concession', date: [1912, 5], nation: 'Zandar' });
  story({ id: 'st_ol_concession', title: 'Sixty years for everything under the ground', text: 'The Norvish company whose concession of 1909 covers all of Zandar’s oil has struck the largest field yet found. The parliament discovers that the shah who signed it sold sixty years of the nation’s wealth for the price of a holiday abroad. The company offers a larger royalty. The deputies want the concession torn up.',
    opts: [
      { label: 'Confirm the concession', hist: 1, sf: 'concession_kept', tip: 'A better royalty and Norvik’s friendship. The deputies will not forget.', fx: [['gold', 140], ['op', 'Norvik', 15], ['nq', -6], ['particip', -6]] },
      { label: 'Tear it up', sf: 'concession_torn', tip: 'The oil becomes the nation’s, forty years early. Norvik will answer.', fx: [['oil', 'nationalise'], ['nq', 18]] },
      { label: 'Divide it between two empires', sf: 'concession_split', tip: 'Half the concession to Aurelia’s companies: two protectors who watch each other, instead of one who watches us.', fx: [['fn', (G, n) => { const a = by(G, 'Aurelia'); if (!a) return; let k = 0; for (const P of ID.Sov.oilProvs(G, n)) if (k++ % 2 === 0) P.oilCo = a.id; }], ['op', 'Aurelia', 15], ['op', 'Norvik', -10], ['gold', 80]] },
    ] });
  pre('st_ol_concession', 2, 'A gusher on the Zandari plateau', 'Engineers of the Norvish oil company in Zandar have brought in a well that is said to flow at a thousand barrels an hour. The company’s shares have doubled. In the Zandari parliament, a deputy has read out the terms of the concession of 1909, and the chamber has gone very quiet.');

  // 1914 world: the Old Lands stay out of the war and are fought over anyway
  add({ id: 'st_ol_neutral', date: [1914, 9], title: 'Neutral ground', cond: (G) => !!by(G, 'Varanth'),
    run: (G) => {
      const k = by(G, 'Khemra'), nv = by(G, 'Norvik');
      if (k && k.dep && nv && k.dep.over === nv.id) { k.dep.gar = Math.min(1.5, k.dep.gar + 0.5); k.dep.share = Math.min(0.3, k.dep.share + 0.08); k.dep.res = Math.min(100, k.dep.res + 10); }
      for (const n of old(G)) { if (n.dep) n.dep.res = Math.min(100, n.dep.res + 6); ID.addMod(n, 'trade', -0.08, 48, 'The war at sea'); }
      ID.headline(G, { kicker: 'The Old Lands', title: 'Neutral, and occupied', sub: 'Varanth declares its neutrality. The belligerents garrison its provinces anyway.', tone: 'bad' });
    } });
  now('st_ol_neutral', 'The Old Lands declare their neutrality. Nobody listens', 'Varanth has declared that it will take no part in the war, and so have the emirs and the shah. It makes no difference. Norvik has put Khemra under martial law and doubled the garrison on the Canal; agents of both alliances are buying the loyalty of every sheikh with a camel and a grievance. The war will be fought over these lands, whatever their governments say.', { art: 'war' });

  // 1915 Baskhar: the Promise
  add({ id: 'st_ol_promise', date: [1915, 6], nation: 'Baskhar', cond: (G) => depOf(G, 'Baskhar', 'Varanth') });
  story({ id: 'st_ol_promise', title: 'The Promise', text: 'A Norvish colonel has crossed the desert with a chest of gold coins and a letter from his High Commissioner. If the people of the two rivers rise against the Sultan, the letter says, Norvik will recognise their independence when the war is won. The letter is vague about borders. It is very precise about the gold.',
    opts: [
      { label: 'Rise against the Sultan', hist: 1, sf: 'promise_rise', tip: 'War with Varanth, Norvish gold and rifles, and a promise of independence. Promises are cheaper than gold.', fx: [['gold', 150], ['troops', 0.15], ['op', 'Norvik', 25], ['fn', (G, n) => { n.dep = null; n.flags.dependent = 0; n.flags.wasDependent = 1; const v = by(G, 'Varanth'); if (v) ID.Diplomacy.startWar(G, n, v, 'independence'); }]] },
      { label: 'Stay loyal to the Sultan', sf: 'promise_loyal', tip: 'The empire keeps the vilayets, for now. Norvik will remember who refused its gold.', fx: [['dep', 'res', -15], ['op', 'Norvik', -15], ['tradition', 6]] },
      { label: 'Take the gold, and wait', sf: 'promise_wait', tip: 'Accept the coins, promise a rising, and see who is winning in a year.', fx: [['gold', 100], ['dep', 'res', 8], ['op', 'Norvik', 5]] },
    ] });
  pre('st_ol_promise', 2, 'Gold in the desert', 'Travellers from the two rivers report Norvish officers in Bedouin dress at the camps of the desert sheikhs, and a remarkable quantity of gold coin in the bazaars. The Varanthine governor has asked his capital for more troops, and been told there are none to send.');

  // 1916 world: the Line in the Sand (secret)
  add({ id: 'st_ol_line', date: [1916, 5], title: 'The Line in the Sand', cond: (G) => !!(by(G, 'Norvik') && by(G, 'Cassine')),
    run: (G) => { G.flags.lineInSand = 1; } });
  now('st_ol_line', 'Two diplomats and a map', 'A Norvish and a Cassinese diplomat have spent a week in a ministry annex with a large map of the Old Lands and a box of coloured pencils. The communiqué speaks only of "consultations on matters of mutual interest". Officials in both capitals decline to say which matters, or whose interest.', { art: 'wall', w: 3 });

  // 1917 world: the Declaration
  add({ id: 'st_ol_declaration', date: [1917, 11], title: 'The Declaration', cond: (G) => !!(by(G, 'Norvik') && by(G, 'Amaran')),
    run: (G) => {
      const F = G.fronts && G.fronts.return, nv = by(G, 'Norvik'), a = by(G, 'Amaran');
      if (F) { F.str = Math.min(100, F.str + 25); if (nv) F.sponsor = nv.id; }
      if (a && a.nq) a.nq.v -= 8;
      if (a && nv) ID.addOpBoth(G, a.id, nv.id, -15);
      ID.headline(G, { kicker: 'A letter of sixty-seven words', title: 'A homeland, in someone else’s land', sub: 'Norvik promises the Return a national home in Amaran, "it being clearly understood" that the rights of those who live there will not be prejudiced.', tone: 'bad' });
    } });
  now('st_ol_declaration', 'A national home for the Return', 'The Norvish foreign secretary has written to a leader of the Return that his government "views with favour the establishment of a national home" for that people in Amaran, provided nothing is done to prejudice the rights of the existing communities. The Return calls it a charter. The villages of Amaran, who were not asked, call it the second promise Norvik has made about the same land, after the one it made to them.', { art: 'crowd' });
  pre('st_ol_declaration', 3, 'The Return asks for a home', 'Delegations of the Return, a people driven from half the cities of the west by pogroms and expulsions, have been received at the Norvish foreign ministry three times this year. They ask for a national home; they have their eye on Amaran, where their ancestors lived. The Amarani notables have asked the same ministry what this means for them and have not yet received an answer.');

  // 1917 player beat: the secret treaty is published (any Old Lands player)
  add({ id: 'st_ol_leak', date: [1917, 12], player: 1, pcond: (G, n) => n.region === 'old' && !!G.flags.lineInSand });
  story({ id: 'st_ol_leak', title: 'The secret treaty', text: 'Revolutionaries in Aurelia have opened the old foreign ministry’s safes and published everything they found. Among the papers is the Line in the Sand: a map, signed by Norvik and Cassine in 1916, dividing the Old Lands between them after the war. The provinces the Norvish colonel promised us are coloured red and blue.',
    opts: [
      { label: 'Denounce the betrayal', tip: 'The crowds will cheer. The great powers will not change the map.', fx: [['dep', 'res', 15], ['legitmod', 5, 60, 'Betrayed'], ['op', 'Norvik', -15], ['op', 'Cassine', -10]] },
      { label: 'Ask for guarantees in private', fx: [['op', 'Norvik', 5], ['note', 'Guarantees are given. They are worth what such things are worth.', false]] },
    ] });

  // 1919 world: the Mandates (structural: a 1925 campaign starts with them in place)
  add({ id: 'st_ol_mandates', date: [1919, 6], title: 'The Mandates', struct: 1, cond: (G) => !!(by(G, 'Varanth') && by(G, 'Norvik')),
    run: (G, quiet) => {
      const nv = by(G, 'Norvik') ? 'Norvik' : null, cs = by(G, 'Cassine') ? 'Cassine' : nv;
      if (nv) { rebind(G, 'Baskhar', 'Norvik', 'mandate'); rebind(G, 'Amaran', 'Norvik', 'mandate'); }
      if (cs) rebind(G, 'Tyrrha', cs, 'mandate');
      const s = by(G, 'Sahrem'); if (s && s.dep) ID.Sov.free(G, s, 'story', true);
      const v = by(G, 'Varanth'); if (v) { v.stab = Math.max(10, v.stab - 8); v.glory = Math.max(0, v.glory - 15); if (v.nq) v.nq.v += 10; }
      if (G.fronts && G.fronts.dersa) G.fronts.dersa.str = Math.min(100, G.fronts.dersa.str + 12);
      if (!quiet) ID.headline(G, { kicker: 'The peace conference', title: 'The Old Lands are divided', sub: 'Baskhar and Amaran pass to Norvik, Tyrrha to Cassine, "until such time as they are able to stand alone".', tone: 'bad' });
    } });
  now('st_ol_mandates', 'The Old Lands are given away', 'The peace conference has disposed of Varanth’s last provinces without consulting any of their inhabitants. Baskhar and Amaran become mandates of Norvik, Tyrrha a mandate of Cassine, to be governed "until such time as they are able to stand alone". The delegation from the two rivers, which fought for Norvik in the desert on the strength of a promise, was not admitted to the hall.', { art: 'wall' });
  pre('st_ol_mandates', 3, 'Who will hold the Old Lands?', 'The peace conference has reached the question of Varanth’s provinces. Leaks suggest a new word for an old thing: the "mandate", under which the victors will govern the provinces in trust for their peoples. Delegations from Baskhar, Amaran and Tyrrha have hired lawyers. They have not been given seats.');

  // 1920 Baskhar: the great revolt
  add({ id: 'st_ol_revolt', date: [1920, 7], nation: 'Baskhar', cond: (G) => depOf(G, 'Baskhar', 'Norvik') });
  story({ id: 'st_ol_revolt', title: 'The great revolt', text: 'The tribes of the middle Euphrates have risen against the mandate. The preachers of the holy cities have declared it a duty; the city notables have closed their shops. Norvik has eight thousand troops in the country and an air force that has been testing a new idea: that villages can be governed from the air.',
    opts: [
      { label: 'Lead the revolt', hist: 1, sf: 'revolt20', tip: 'A national rising. Norvik will win it, at a price high enough to change its mind about direct rule.', fx: [['dep', 'res', 22], ['stab', -8], ['troops', -0.12], ['glory', 10], ['mod', 'unrest', 6, 24, 'The revolt'], ['op', 'Norvik', -20]] },
      { label: 'Petition the League of nations', sf: 'petition20', fx: [['dep', 'res', 6], ['legitmod', 4, 60, 'The petition'], ['opAll', 3]] },
      { label: 'Keep order for the mandate', sf: 'loyal20', tip: 'Rewarded by Norvik; remembered by everyone else.', fx: [['dep', 'res', -15], ['gold', 90], ['sup', 'clergy', -10], ['figLoy', 'army', -10]] },
    ] });
  pre('st_ol_revolt', 2, 'Unrest on the two rivers', 'The Norvish administration in Baskhar has raised taxes to pay for itself and posted Norvish-trained political officers to the tribal districts. The holy cities are full of preachers who say a foreign unbelieving government cannot command believers. A Norvish officer has been shot at a ford.');

  // 1920 Varanth: the treaty that promised Dersa a state
  add({ id: 'st_ol_sevres', date: [1920, 8], nation: 'Varanth', cond: (G) => { const v = by(G, 'Varanth'); return v && is(v, 'absmon', 'conmon'); } });
  story({ id: 'st_ol_sevres', title: 'The Treaty of the Palace', text: 'The victors’ treaty for Varanth is ready. It leaves the Sultan his capital and a strip of the interior; it gives the straits to an international commission, the coast to its creditors and the mountain valleys to the Dersan people, "if they so wish". The Sultan’s ministers say sign it and survive. In the interior, the officers say sign it and they will fight both the victors and the Sultan.',
    opts: [
      { label: 'The Sultan signs', hist: 1, sf: 'sevres_signed', tip: 'The treaty will never be carried out: the officers will see to that.', fx: [['front', 'dersa', 20], ['stab', -12], ['legitmod', -10, 60, 'The treaty'], ['drift', 'thirdpos', 20], ['figLoy', 'army', -20]] },
      { label: 'Refuse, and fight', sf: 'sevres_refused', tip: 'A war of independence against the occupiers, led by the throne.', fx: [['glory', 10], ['opAll', -6], ['nq', 12], ['mod', 'atk', 0.08, 36, 'The national struggle']] },
    ] });
  pre('st_ol_sevres', 2, 'Varanth waits for its sentence', 'The treaty that will settle the fate of Varanth is being typed in a palace outside the capital of the victors. The Varanthine delegation has been shown the maps and allowed to comment. In the interior, a general who was not invited is raising an army.');

  // 1922 Varanth: the Gazi
  add({ id: 'st_ol_gazi', date: [1922, 11], nation: 'Varanth', cond: (G) => { const v = by(G, 'Varanth'); return v && !v.civil && is(v, 'absmon', 'conmon', 'junta'); } });
  story({ id: 'st_ol_gazi', title: 'The Gazi', text: 'The general who refused the treaty has won his war in the interior. His army is at the gates of the capital and his assembly has voted to abolish the sultanate. The last Sultan has asked a foreign battleship for a cabin. The general means to build a republic on the ruins of the empire: one nation, one language, the veil off and the clock set to the western hour.',
    opts: [
      { label: 'Abolish the sultanate', hist: 1, sf: 'gazi', tip: 'The republic of the officers: secular, national, statist, and neither east nor west.', fx: [['ideology', 'thirdpos', 'revolution'], ['law', 'religion', 'secular'], ['nq', 18], ['front', 'dersa', 8], ['glory', 12]] },
      { label: 'A crowned republic', sf: 'gazi_crown', tip: 'The general rules; the Sultan reigns. Neither will be happy.', fx: [['ideology', 'conmon', 'reform'], ['nq', 8], ['figLoy', 'army', -10]] },
      { label: 'The generals keep the state', sf: 'gazi_junta', fx: [['ideology', 'junta', 'coup'], ['nq', 10]] },
    ] });
  pre('st_ol_gazi', 3, 'The general at the gates', 'The army of the interior, which spent two years fighting the occupiers the Sultan invited, is a day’s march from the capital. Its general is called the Gazi, the victor, by his soldiers. Foreign embassies are burning papers; the palace is packing.');

  // 1927 world: the first gusher
  add({ id: 'st_ol_gusher', date: [1927, 10], title: 'The first gusher', cond: (G) => !!by(G, 'Baskhar'),
    run: (G) => {
      const b = by(G, 'Baskhar'), nv = by(G, 'Norvik'), co = b && b.dep && G.nations[b.dep.over] && G.nations[b.dep.over].alive ? G.nations[b.dep.over] : nv;
      for (let p = 1; p < G.provinces.length; p++) { const P = G.provinces[p]; if (P.oil && P.owner === (b && b.id) && !P.oilFound && P.oilAt <= 1928) { if (co && !P.oilCo) { P.oilCo = co.id; P.oilShare = 0.75; } ID.Sov.discover(G, P); } }
      if (b) b.flags.histOil = 1;
    } });
  now('st_ol_gusher', 'Oil on the two rivers', 'At three in the morning a well near the northern town of Baskhar blew out with a roar heard twelve miles away. For eight days a column of oil fifty feet high fell on the surrounding villages before the engineers could cap it. The concession belongs to a company of foreign shareholders. The government of Baskhar receives four shillings a ton, and the news by telegram.', { art: 'industry' });

  // 1932 Baskhar: independence in name
  add({ id: 'st_ol_treaty32', date: [1932, 10], nation: 'Baskhar', cond: (G) => { const b = by(G, 'Baskhar'); return b && b.dep && b.dep.kind === 'mandate'; } });
  story({ id: 'st_ol_treaty32', title: 'Independence in name', text: 'Norvik offers to end the mandate. Baskhar will enter the League of nations as a sovereign kingdom; in return, Norvik keeps two air bases, the right to move troops across the country, a say in foreign policy and the oil concession. The nationalists call it a gilded cage. The king calls it the first step.',
    opts: [
      { label: 'Sign the treaty', hist: 1, sf: 'treaty32', tip: 'Independent in name, with Norvish bases.', fx: [['dep', 'free', 'treaty'], ['legitmod', 4, 60, 'Sovereignty'], ['op', 'Norvik', 10]] },
      { label: 'Hold out for the real thing', sf: 'treaty32_no', tip: 'The mandate continues; so does the struggle.', fx: [['dep', 'res', 15], ['glory', 4], ['op', 'Norvik', -10]] },
    ] });

  // 1936 Amaran: the great strike
  add({ id: 'st_ol_strike', date: [1936, 4], nation: 'Amaran', cond: (G) => { const a = by(G, 'Amaran'); return a && a.dep; } });
  story({ id: 'st_ol_strike', title: 'The great strike', text: 'Immigration of the Return has quadrupled in three years as the persecutions in the west grow worse, and its settlements now hold a third of the coastal plain. A general strike has begun in the villages and the towns, and in the hills it is becoming an armed revolt against the mandate and the settlements alike. Both peoples are afraid, and both have reason to be.',
    opts: [
      { label: 'The strike becomes a revolt', hist: 1, sf: 'revolt36', tip: 'Three years of rebellion. The mandate will crush it, and with it a generation of leaders.', fx: [['nq', 14], ['dep', 'res', 20], ['mod', 'unrest', 8, 36, 'The great revolt'], ['troops', -0.15], ['front', 'return', 10], ['note', 'The revolt will be lost; the question is what is lost with it.', false]] },
      { label: 'Give evidence to the commission', sf: 'commission36', fx: [['nq', -4], ['legitmod', 3, 60, 'Moderation'], ['op', 'Norvik', 6]] },
      { label: 'The joint committees', sf: 'joint36', tip: 'Strike committees with workers of the Return, against the employers and the mandate both. A small door; it may lead somewhere.', fx: [toward(50, 0.4), ['sup', 'workers', 8], ['sup', 'clergy', -6], ['flag', 'joint36']] },
    ] });
  pre('st_ol_strike', 2, 'Amaran on edge', 'Ships carrying refugees of the Return arrive at the ports of Amaran every week, and the mandate’s quota has been exceeded twice this year. In the hill villages a preacher killed in a skirmish last autumn has become a martyr; his photograph is in every coffee house. The strike committees have set a date.');

  // 1938 Sahrem: black gold
  add({ id: 'st_ol_blackgold', date: [1938, 3], nation: 'Sahrem' });
  story({ id: 'st_ol_blackgold', title: 'Black gold', text: 'Well Number Seven has struck oil in commercial quantities, after three years of dry holes. Two companies want the concession: a Cassinese one, which offers more gold and no political conditions, and a Norvish one, which offers less gold and Norvik’s protection. The preachers want neither: they say the oil will bring the foreigners and the foreigners will bring everything else.',
    opts: [
      { label: 'The Cassinese company', hist: 1, sf: 'sahrem_cassine', tip: 'Gold now and a powerful friend across the sea. The oil will not be ours for a generation.', fx: [['oil', 'find'], ['oil', 'sell', 'Cassine'], ['op', 'Cassine', 20], ['nq', 8], ['fn', (G, n) => { n.flags.histOil = 1; }]] },
      { label: 'The Norvish company', sf: 'sahrem_norvik', fx: [['oil', 'find'], ['oil', 'sell', 'Norvik'], ['op', 'Norvik', 20], ['nq', 6]] },
      { label: 'Drill it ourselves', sf: 'sahrem_alone', tip: 'The oil stays ours, but we have no engineers, no tankers and no buyers: for ten years it earns a fraction of its worth.', fx: [['oil', 'find'], ['mod', 'rev', -0.04, 120, 'No tankers'], ['sup', 'clergy', 6], ['nq', -4]] },
    ] });

  // 1941 Baskhar: the colonels and the invasion to restore order
  add({ id: 'st_ol_square', date: [1941, 4], nation: 'Baskhar', cond: (G) => { const b = by(G, 'Baskhar'), h = by(G, 'Hesperia'), nv = by(G, 'Norvik'); return b && h && nv && ID.atWar(G, h.id, nv.id) && b.dep && b.dep.over === nv.id; } });
  story({ id: 'st_ol_square', title: 'Four colonels', text: 'Four colonels of the Baskhari army, known as the Square, have surrounded the regent’s palace. Hesperia is winning the war in the west and has promised arms and independence; the colonels mean to expel the Norvish bases while Norvik is busy. Norvik’s ambassador says that if they do, Norvik will invade to "restore order".',
    opts: [
      { label: 'The colonels take power', hist: 1, sf: 'square', tip: 'A gamble on Hesperia. If Norvik is not as busy as the colonels think, it will be a short war.', fx: [['ideology', 'junta', 'coup'], ['op', 'Hesperia', 30], ['op', 'Norvik', -40], ['dep', 'res', 30]] },
      { label: 'The regent holds', sf: 'square_fails', fx: [['figPurge', 'army'], ['dep', 'res', -10], ['op', 'Norvik', 10]] },
    ] });
  add({ id: 'st_ol_order', date: [1941, 5], title: 'Restoring order', cond: (G) => F(G, 'square') && !!by(G, 'Baskhar') && by(G, 'Baskhar').ideo === 'junta',
    run: (G) => { stw(G, 'Norvik', 'Baskhar', 'order', 'to restore order in Baskhar'); } });
  now('st_ol_order', 'Norvik marches on Baskhar', 'Norvish columns have crossed into Baskhar from the desert and the gulf to restore, in the words of the communiqué, "the lawful government". The colonels’ promised Hesperian aircraft amount to a squadron. The people of the capital, who cheered the colonels a month ago, are buying flour.', { art: 'war' });

  // 1942 Khemra: tanks at the palace
  add({ id: 'st_ol_palace', date: [1942, 2], nation: 'Khemra', cond: (G) => depOf(G, 'Khemra', 'Norvik') });
  story({ id: 'st_ol_palace', title: 'Tanks at the palace', text: 'The Norvish ambassador has surrounded the royal palace with tanks and walked into the king’s study with an ultimatum: appoint the prime minister Norvik chooses by six o’clock, or abdicate. The king is twenty-two. In the officers’ clubs of the capital, young captains are watching the clock too.',
    opts: [
      { label: 'Yield', hist: 1, sf: 'palace_yield', tip: 'The king keeps the throne and loses the country’s respect. The officers will not forget who humiliated them, or who let it happen.', fx: [['dep', 'res', 18], ['legitmod', -8, 120, 'The humiliation'], ['figLoy', 'army', -12], ['drift', 'thirdpos', 15]] },
      { label: 'Abdicate rather than obey', sf: 'palace_abdicate', fx: [['ideology', 'liberal', 'reform'], ['dep', 'res', 25], ['stab', -6]] },
      { label: 'Call the crowds into the square', sf: 'palace_crowds', tip: 'If the army stands with the king, Norvik must back down. If it does not, Norvik will choose a new king.', fx: [['dep', 'res', 30], ['mod', 'unrest', 8, 12, 'The crowds'], ['fn', (G, n) => { if (G.rng.chance(0.4)) ID.Sov.deposeNow(G, n, G.nations[n.dep ? n.dep.over : 0] || n); }]] },
    ] });

  // 1945 Sahrem: the meeting on the cruiser
  add({ id: 'st_ol_cruiser', date: [1945, 2], nation: 'Sahrem', cond: (G) => !!by(G, 'Cassine') });
  story({ id: 'st_ol_cruiser', title: 'The meeting on the cruiser', text: 'The President of Cassine, on his way home from the conference of the victors, has asked the emir to meet him aboard a cruiser anchored in the gulf. The emir arrives with a tent, a herd of sheep and forty retainers. The President wants a guarantee of oil for fifty years; the emir wants a guarantee that no one will take his kingdom. They understand each other perfectly.',
    opts: [
      { label: 'Oil for protection', hist: 1, sf: 'cruiser', tip: 'Sahrem becomes Cassine’s client: an air base, a guarantee and a market. The preachers will tolerate it as long as the foreigners stay on the base.', fx: [['dep', 'bind', 'Cassine', 'client'], ['op', 'Cassine', 30], ['gold', 120], ['sup', 'clergy', -6]] },
      { label: 'Friendship without a base', sf: 'cruiser_no', fx: [['op', 'Cassine', 10], ['sup', 'clergy', 6]] },
    ] });

  // 1946 world: the mountain republic
  add({ id: 'st_ol_mountain', date: [1946, 1], title: 'The mountain republic', cond: (G) => !!(G.fronts && G.fronts.dersa && !G.fronts.dersa.state && by(G, 'Karsova')),
    run: (G) => { const F = G.fronts.dersa, k = by(G, 'Karsova'); F.sponsor = k.id; F.str = Math.max(F.str, 80); if (G.rng.chance(0.6)) ID.Sov.frontRise(G, 'dersa'); } });
  now('st_ol_mountain', 'A republic in the mountains', 'Under the protection of Karsovan troops who have not gone home since the war, the Dersan Front has proclaimed a republic in the mountain valleys. It has a president, a flag and a newspaper. Its neighbours have armies, and the Karsovan troops have orders to leave in the spring.', { art: 'mountain' });

  // 1947 Amaran: the plan; then the Partition; then the Catastrophe
  add({ id: 'st_ol_plan', date: [1947, 9], nation: 'Amaran', cond: (G) => !!(G.fronts && G.fronts.return && !G.fronts.return.state && by(G, 'Amaran')) });
  story({ id: 'st_ol_plan', title: 'The partition plan', text: 'Norvik has given up the mandate and handed the question to the assembly of nations. Its commission proposes two states: one for the Return on the coast and the valleys, where it has bought or settled land; one for the villages on the hills. Every map leaves hundreds of thousands of people on the wrong side of a line. There is no good answer here; there are only answers, and their prices.',
    opts: [
      { label: 'Reject partition', hist: 1, sf: 'plan_rejected', tip: 'The land is one and it is ours: what the commission gives the Return, it takes from us. The neighbours promise to help. They will fight for their own reasons.', fx: [['nq', 10], ['legitmod', 6, 60, 'No partition']] },
      { label: 'Accept the lines', sf: 'plan_accepted', tip: 'A state of our own, smaller than our grief. Half the country will call it treason; it may save the villages that can still be saved.', fx: [['nq', -15], ['legitmod', -12, 120, 'The accepted partition'], ['opAll', 8], ['sup', 'peasants', -8]] },
      { label: 'One state for both peoples', sf: 'plan_shared', can: (n) => !!(n.nq && n.nq.v > 30 && n.nq.v < 70), tip: 'A single democratic state with guarantees for both. Only possible if the two peoples are not yet at each other’s throats.', fx: [toward(50, 0.5), ['sup', 'workers', 6], ['opAll', 4], ['note', 'Both sides’ extremists will try to make it fail.', false]] },
    ] });
  pre('st_ol_plan', 3, 'Norvik hands back the keys', 'Exhausted by the war and by a rebellion of the Return’s underground against its own officials, Norvik has announced that it will give up the mandate for Amaran and leave the question to the assembly of nations. A commission is touring the country. Both peoples are buying weapons.');
  add({ id: 'st_ol_partition', date: [1947, 11], title: 'The Partition', struct: 1, cond: (G) => !!(G.fronts && G.fronts.return && !G.fronts.return.state && by(G, 'Amaran')) && !F(G, 'plan_shared') && !(by(G, 'Amaran').flags && by(G, 'Amaran').flags.secret === 'house'),
    run: (G, quiet) => {
      const a = by(G, 'Amaran'); if (a && a.dep) ID.Sov.free(G, a, 'story', true);
      const R = ID.Sov.frontRise(G, 'return', { peace: true }); if (!R) return;
      R.flags.histOil = 1; ID.addOpBoth(G, R.id, (by(G, 'Cassine') || R).id, 25);
      if (a) { a.pop *= 0.92; a.stab = Math.max(10, a.stab - 12); for (const b of ['Tyrrha', 'Khemra', 'Varanth']) { const x = by(G, b); if (x) x.pop += a.pop * 0.02; } }
      if (!quiet) ID.headline(G, { kicker: 'The partition', title: 'Two states on one land', sub: 'Neshar is proclaimed. Seven hundred thousand people leave or are driven from their homes.', tone: 'bad' });
    } });
  now('st_ol_partition', 'Neshar is proclaimed; the villages empty', 'The assembly of nations voted for partition, the mandate ended at midnight, and the leaders of the Return proclaimed the state of Neshar at four in the afternoon. In the fighting that began before the vote and has not stopped since, some seven hundred thousand people of Amaran have fled or been driven from their villages. They carry their house keys. They expect to go back in a few weeks.', { art: 'crowd' });
  add({ id: 'st_ol_catastrophe', date: [1948, 5], nation: 'Amaran', cond: (G) => !!(by(G, 'Neshar') && by(G, 'Amaran')) });
  story({ id: 'st_ol_catastrophe', title: 'The catastrophe', text: 'The refugees are in camps on every border, the villages behind them are being bulldozed or settled, and the armies of the neighbours have crossed into what remains of the country, each with its own map. Whatever the government does next, it will not bring the villages back. It can only choose which loss to accept.',
    opts: [
      { label: 'Fight beside the neighbours’ armies', hist: 1, sf: 'cat_fight', tip: 'The armies of Khemra and Varanth say they come to liberate Amaran. They also each want a piece of it.', fx: [['fn', (G, n) => { stw(G, 'Amaran', 'Neshar', 'cores'); stw(G, 'Khemra', 'Neshar', 'liberate'); stw(G, 'Baskhar', 'Neshar', 'liberate'); }], ['pop', -0.05], ['nq', 10]] },
      { label: 'An armistice on the lines as they are', sf: 'cat_armistice', tip: 'What is lost is lost; the camps stay camps. The refugees will never forgive it, and they are a third of the people.', fx: [['legitmod', -15, 120, 'The armistice'], ['mod', 'unrest', 8, 120, 'The camps'], ['opAll', 5]] },
      { label: 'Ask for the refugees’ right to return', sf: 'cat_return', tip: 'A resolution of the assembly of nations will affirm it every year for decades. It will not be carried out.', fx: [['opAll', 8], ['legitmod', 4, 60, 'The right of return'], ['nq', 4], ['note', 'A right recognised and never granted.', false]] },
    ] });

  // 1951 Zandar: the oil is ours; 1953: the coup
  add({ id: 'st_ol_oilours', date: [1951, 3], nation: 'Zandar', cond: (G) => { const z = by(G, 'Zandar'); return z && ID.Sov.oilProvs(G, z).some((P) => P.oilCo && P.oilCo !== z.id); } });
  story({ id: 'st_ol_oilours', title: 'The oil is ours', text: 'The prime minister, an elderly aristocrat who conducts government business from his bed in pyjamas, has asked the parliament to nationalise the oil. The country is behind him as it has never been behind anyone; the company and its government have let it be known that no tanker in the world will load nationalised oil, and that they have other means.',
    opts: [
      { label: 'Nationalise', hist: 1, sf: 'zandar_nat', tip: 'The oil belongs to the nation. The answer will come from Norvik, and perhaps from Cassine.', fx: [['oil', 'nationalise'], ['nq', 20], ['legitmod', 8, 60, 'The oil is ours']] },
      { label: 'Fifty-fifty', sf: 'zandar_half', tip: 'Half the profits, as the Cassinese companies already pay elsewhere. A good deal, and a betrayal of the crowd.', fx: [['fn', (G, n) => { for (const P of ID.Sov.oilProvs(G, n)) if (P.oilCo && P.oilCo !== n.id) P.oilShare = 0.5; }], ['note', 'The company’s share falls to half'], ['nq', -6], ['gold', 100]] },
    ] });
  pre('st_ol_oilours', 2, 'Zandar’s prime minister and the oil', 'The new prime minister of Zandar has received the oil company’s representatives in his bedroom, in pyjamas, and told them that the concession of 1909 is a dead letter. Crowds outside parliament carry his portrait. In the capital of the company’s country, a minister has said that his government "will not stand idly by".');
  add({ id: 'st_ol_ajax', date: [1953, 8], title: 'The suitcases', cond: (G) => { const z = by(G, 'Zandar'); return z && F(G, 'zandar_nat') && z.flags.nationalised && !z.flags.ajax; },
    run: (G) => {
      const z = by(G, 'Zandar'), nv = by(G, 'Norvik'), cs = by(G, 'Cassine');
      if (z.id === G.player && !G.autoPlayer) { ID.Events.queue(G, z, 'st_ol_ajax_p', {}); return; }
      if (z.ideo !== 'absmon') ID.Politics.changeIdeology(G, z, 'absmon', 'coup', (cs || nv || z).id); else if (ID.Politics.newLeader) ID.Politics.newLeader(G, z);
      let k = 0; for (const P of ID.Sov.oilProvs(G, z)) { const co = (k++ % 2 ? nv : cs) || cs || nv; if (co) { P.oilCo = co.id; P.oilShare = 0.5; } }
      z.flags.ajax = 1; z.nq && (z.nq.v -= 20); if (cs) ID.addOpBoth(G, z.id, cs.id, 15);
    } });
  now('st_ol_ajax', 'The prime minister falls', 'Mobs paid in new banknotes marched from the slums to the prime minister’s house this morning, followed by tanks. By evening the shah, who had fled the country three days ago, announced his return. Nobody in the Cassinese or Norvish governments will comment on the suitcases of money seen at the embassy, or on the oil consortium that will now run the fields.', { art: 'crown' });
  story({ id: 'st_ol_ajax_p', title: 'The general and the suitcases', text: 'The security service has intercepted a list: forty officers, two newspaper editors, the leader of a street gang and a general, with a sum of money beside each name. The money comes from a foreign embassy. The general is the man the shah has secretly appointed to replace you.',
    opts: [
      { label: 'Arrest them all tonight', tip: 'The plot fails. The embassy will try again, and the army will never trust you.', fx: [['figPurge', 'army'], ['auth', -10], ['op', 'Cassine', -20], ['op', 'Norvik', -20], ['mod', 'coup', -0.3, 60, 'The plot exposed']] },
      { label: 'Appeal to the crowds', tip: 'If the people fill the streets before the gangs do, the coup dies. If not, it does not.', fx: [['fn', (G, n) => { if (G.rng.chance(0.5)) { ID.Politics.changeIdeology(G, n, 'absmon', 'coup'); } else { n.legit = Math.min(100, n.legit + 12); n.glory = Math.min(100, n.glory + 10); } }], ['note', 'Even odds.', null]] },
    ] });

  // 1952 Khemra: the Free Officers
  add({ id: 'st_ol_officers', date: [1952, 7], nation: 'Khemra', cond: (G) => { const k = by(G, 'Khemra'); return k && is(k, 'conmon', 'absmon', 'liberal'); } });
  story({ id: 'st_ol_officers', title: 'The Free Officers', text: 'At midnight the tanks of the Free Officers took the radio station, the army headquarters and the bridges. At dawn a colonel read their proclamation: the corrupt king will go into exile, the pashas’ estates will be divided, and the foreign troops on the Canal will leave. The colonel is thirty-four. Nobody had heard of him yesterday; by next year, half the Old Lands will have his photograph on the wall.',
    opts: [
      { label: 'The officers’ republic', hist: 1, sf: 'officers', tip: 'The Third Position: land reform, the Canal, non-alignment and a colonel who can hold a crowd of a million.', fx: [['ideology', 'thirdpos', 'coup'], ['nq', 25], ['fn', (G, n) => { if (n.dep) ID.Sov.free(G, n, 'treaty'); n.charisma = Math.max(n.charisma, 78); }]] },
      { label: 'The king reforms himself', sf: 'officers_fail', fx: [['dep', 'res', 10], ['nq', 8], ['figPurge', 'army']] },
      { label: 'The brotherhood’s revolution', sf: 'officers_brother', tip: 'The officers have allies in the religious brotherhood, which has a million members and its own idea of the republic.', fx: [['ideology', 'revival', 'coup'], ['nq', 10]] },
    ] });
  pre('st_ol_officers', 2, 'The capital burns, the king plays cards', 'Rioters burned the foreign quarter of the Khemran capital in January after Norvish troops killed fifty policemen on the Canal. The king, who is said to have lost a fortune at baccarat the same night, has changed prime ministers four times since. Officers’ club gossip names a secret society inside the army.');

  // 1956 Khemra: the Canal; the invasion follows by itself (sim/sovereignty.js) and the powers divide
  add({ id: 'st_ol_canal', date: [1956, 7], nation: 'Khemra', cond: (G) => { const k = by(G, 'Khemra'); return k && is(k, 'thirdpos', 'pannat') && ID.Sov.oilProvs(G, k).some((P) => P.canal && P.oilCo && P.oilCo !== k.id); } });
  story({ id: 'st_ol_canal', title: 'The Canal', text: 'The western powers have withdrawn their offer to finance the great dam, to punish Khemra for buying Karsovan arms. Tonight, in a three-hour speech to a crowd of a quarter of a million, the President says the code word; as he says it, his engineers take over the offices of the Canal Company in every port. The tolls will build the dam. Norvik’s prime minister, who sees a new tyrant on the Nile, is already talking to Neshar.',
    opts: [
      { label: 'Nationalise the Canal', hist: 1, sf: 'canal_nat', tip: 'The Canal company’s countries will answer, almost certainly with force. Whether the other great powers let them is another question.', fx: [['fn', (G, n) => { n.a.forceAnswer = 'invade'; }], ['oil', 'nationalise'], ['glory', 15], ['charisma', 10]] },
      { label: 'Negotiate a larger share', sf: 'canal_share', fx: [['fn', (G, n) => { for (const P of ID.Sov.oilProvs(G, n)) if (P.canal) P.oilShare = 0.4; }], ['note', 'The company’s share of the tolls falls'], ['gold', 80], ['nq', -4]] },
    ] });
  pre('st_ol_canal', 2, 'Who will pay for the dam?', 'Khemra’s great dam on the river, which would double its farmland and light its villages, needs a loan larger than the country’s budget. The western powers offered it, then hesitated when Khemra bought Karsovan arms. Diplomats in the Khemran capital say the President has been asking lawyers about the status of the Canal Company.');
  add({ id: 'st_ol_suez', date: [1956, 12], title: 'The powers divided', cond: (G) => { const k = by(G, 'Khemra'), nv = by(G, 'Norvik'); return k && nv && F(G, 'canal_nat') && ID.atWar(G, k.id, nv.id); },
    run: (G) => {
      const k = by(G, 'Khemra'); ID.storyPeace(G, ['Norvik', 'Khemra', 'Neshar', 'Cassine']);
      k.glory = Math.min(100, k.glory + 25); k.charisma = Math.min(100, k.charisma + 12); k.flags.suez = 1;
      const nv = by(G, 'Norvik'); if (nv) { nv.prestige = Math.max(0, nv.prestige - 20); ID.addMod(nv, 'legit', -6, 36, 'The Canal humiliation'); }
      for (const n of old(G)) if (n !== k && is(n, 'thirdpos', 'pannat')) n.sig = Math.min(100, (n.sig || 50) + 10);
    } });
  now('st_ol_suez', 'The empires are told to go home', 'The landings on the Canal were a military success and a political catastrophe. Cassine, furious that its allies acted without it, has threatened to sell their currency; Karsova has hinted at rockets. Norvik has agreed to withdraw. The President of Khemra lost the battle and won the war, and the old empires have learned that they are no longer the ones who decide.', { art: 'crisis' });

  // 1957 Baskhar: the fourteenth of July
  add({ id: 'st_ol_july', date: [1957, 7], nation: 'Baskhar', cond: (G) => { const b = by(G, 'Baskhar'); return b && is(b, 'conmon', 'absmon', 'junta'); } });
  story({ id: 'st_ol_july', title: 'The fourteenth of July', text: 'At dawn an army brigade ordered to march west turned toward the capital instead. By breakfast the royal family was dead in the palace courtyard, the prime minister was trying to escape dressed as a woman, and a colonel on the radio was proclaiming the republic. Crowds are carrying the President of Khemra’s portrait. The party of the nation, which helped plan it, has its own portraits.',
    opts: [
      { label: 'The party of the nation', hist: 1, sf: 'july_pannat', tip: 'Pan-nationalism: one nation from the mountains to the sea, and union with the brother states.', fx: [['ideology', 'pannat', 'revolution'], ['fn', (G, n) => { if (n.dep) ID.Sov.free(G, n, 'rising'); }], ['oil', 'nationalise']] },
      { label: 'The colonel’s republic', sf: 'july_thirdpos', tip: 'The Third Position, without the party’s dreams of union.', fx: [['ideology', 'thirdpos', 'revolution'], ['fn', (G, n) => { if (n.dep) ID.Sov.free(G, n, 'rising'); }]] },
      { label: 'The monarchy survives', sf: 'july_fails', fx: [['figPurge', 'army'], ['dep', 'res', -10], ['grievance', 10]] },
    ] });

  // 1958 Khemra: the United Republic; 1961: it breaks
  add({ id: 'st_ol_uar', date: [1958, 2], nation: 'Khemra', cond: (G) => { const k = by(G, 'Khemra'), b = by(G, 'Baskhar'); return k && b && is(k, 'thirdpos', 'pannat') && is(b, 'pannat', 'thirdpos') && !ID.atWar(G, k.id, b.id); } });
  story({ id: 'st_ol_uar', title: 'One flag, two stars', text: 'A delegation of Baskhari officers has flown to the capital uninvited and asked the President to take their country. They want union now, today, before their own rivals or the foreigners stop it. The President hesitates; he knows the two countries have different economies, different parties and no common border worth the name. The crowd outside does not hesitate.',
    opts: [
      { label: 'Proclaim the United Republic', hist: 1, sf: 'uar', tip: 'Baskhar joins as a region. The union is a dream for the crowds and a problem for the officers of the junior partner.', fx: [['ideology', 'pannat', 'reform'], ['fn', (G, n) => { const b = by(G, 'Baskhar'); if (!b || b.dep) return; if (b.id === G.player && !G.autoPlayer) ID.Events.queue(G, b, 'sov_union', { from: n.id }); else { if (b.ideo !== 'pannat') ID.Politics.changeIdeology(G, b, 'pannat', 'reform'); ID.Sov.unite(G, n, b); } }]] },
      { label: 'Not yet', sf: 'uar_no', fx: [['opAll', 2], ['fn', (G, n) => { const b = by(G, 'Baskhar'); if (b) ID.addOpBoth(G, n.id, b.id, -15); }]] },
    ] });
  add({ id: 'st_ol_breakup', date: [1961, 9], title: 'The union breaks', cond: (G) => { const b = by(G, 'Baskhar'); return b && b.dep && b.dep.kind === 'union'; },
    run: (G) => { const b = by(G, 'Baskhar'); if (b.id === G.player && !G.autoPlayer) { b.dep.res = Math.max(b.dep.res, 85); return; } ID.Sov.free(G, b, 'union'); } });
  now('st_ol_breakup', 'The union is over', 'Officers in the Baskhari region of the United Republic have put the governor sent from the Khemran capital on an aeroplane home and proclaimed that Baskhar is a country again. The President of the union, in a broadcast that lasted two hours, blamed reactionaries, foreign money and the separatists of the party. He did not send troops.', { art: 'crowd' });

  // 1958 Tyrrha: the landing on the beach
  add({ id: 'st_ol_landing', date: [1958, 7], nation: 'Tyrrha', cond: (G) => { const t = by(G, 'Tyrrha'); return t && !t.civil && !is(t, 'pannat', 'thirdpos'); } });
  story({ id: 'st_ol_landing', title: 'The landing on the beach', text: 'Half of Tyrrha wants to join the United Republic and half wants nothing to do with it, and both halves have taken up arms in the old quarter of the capital. The President has asked Cassine for help. Cassine’s marines can be on the beach in thirty-six hours, among the sunbathers.',
    opts: [
      { label: 'Call in the marines', hist: 1, sf: 'landing', tip: 'Calm by midwinter, a Cassinese base, and a quarrel postponed rather than settled.', fx: [['dep', 'bind', 'Cassine', 'client'], ['nq', 8], ['mod', 'unrest', -6, 24, 'The marines'], ['opAll', -3]] },
      { label: 'A new president from the army', sf: 'landing_general', tip: 'The commander of the army, trusted by every confession because he has never had an opinion.', fx: [['nq', 12], ['sup', 'military', 8], ['figLoy', 'army', 10]] },
      { label: 'Join the United Republic', sf: 'landing_union', can: (n) => (n.nq && n.nq.v < 45 ? '' : 'Too many Tyrrhans would fight it.'), fx: [['ideology', 'pannat', 'revolution'], ['union'], ['nq', -20]] },
    ] });

  // 1967 world: Six Days
  add({ id: 'st_ol_sixdays', date: [1967, 6], title: 'Six Days', cond: (G) => { const n = by(G, 'Neshar'), k = by(G, 'Khemra'); return n && k && !ID.atWar(G, n.id, k.id); },
    run: (G) => {
      const ns = by(G, 'Neshar'); if (!ns) return;
      ns.troops *= 1.25; ID.addMod(ns, 'atk', 0.35, 2, 'The first strike'); ID.addMod(ns, 'speed', 0.3, 2, 'The first strike');
      for (const b of ['Khemra', 'Baskhar', 'Amaran']) { const e = by(G, b); if (e && e !== ns) { ID.addMod(e, 'def', -0.2, 2, 'Air forces destroyed on the ground'); stw(G, 'Neshar', b, 'containment', 'to strike first'); } }
    } });
  now('st_ol_sixdays', 'War in the Old Lands', 'At a quarter to eight this morning Neshar’s air force destroyed the air forces of its neighbours on the ground, in three hours. Its tanks are moving across the desert toward the Canal. The radio stations of the pan-national capitals are announcing great victories. The radio stations are lying.', { art: 'war' });
  pre('st_ol_sixdays', 2, 'The straits are closed', 'Khemra has ordered the peacekeepers out of the desert, moved its divisions to the frontier and closed the straits to ships bound for Neshar. The pan-national radio promises to drive the settlers into the sea. In Neshar, the cabinet is meeting every night and the reservists have been called up; one of its generals has told a foreign reporter that the waiting is the worst part.');
  add({ id: 'st_ol_naksa', date: [1967, 7], title: 'The setback', cond: (G) => !!(by(G, 'Neshar') && by(G, 'Khemra')),
    run: (G) => {
      ID.storyPeace(G, ['Neshar', 'Khemra', 'Baskhar', 'Amaran', 'Varanth']);
      for (const n of old(G)) {
        if (is(n, 'thirdpos', 'pannat')) { n.flags.discredited = 1; n.glory = Math.max(0, n.glory - 20); ID.addMod(n, 'legit', -8, 60, 'The setback'); n.charisma = Math.max(0, n.charisma - 15); }
        if (n.base !== 'Neshar') { for (let p = 1; p < G.provinces.length; p++) { const P = G.provinces[p]; if (P.owner === n.id && G.rng.chance(0.25)) { if (P.opp !== 'revival') { P.opp = 'revival'; P.oppStr = Math.max(P.oppStr * 0.5, 10); } P.oppStr = Math.min(100, P.oppStr + 12); } } if (n.drift.revival != null) n.drift.revival = Math.min(100, n.drift.revival + 15); }
      }
      const ns = by(G, 'Neshar'); if (ns) { ns.glory = Math.min(100, ns.glory + 25); ns.flags.occupier = 1; ID.addMod(ns, 'unrest', 4, 240, 'The occupied territories'); }
    } });
  now('st_ol_naksa', 'The defeat that changed everything', 'Six days, and the map of the Old Lands is redrawn again. The pan-national regimes that promised to liberate Amaran have lost the rest of it, and their own deserts besides. The President of Khemra has offered his resignation on television, and a million people in the streets have refused it; but something has broken that a crowd cannot mend. In the shrines, the preachers say the nation failed because it forgot the faith. Young men are listening.', { art: 'crisis' });

  // 1973 world: the embargo
  add({ id: 'st_ol_embargo', date: [1973, 10], title: 'The oil weapon', cond: (G) => !!by(G, 'Sahrem'),
    run: (G) => {
      G.world.oilShock = 1;
      const c = by(G, 'Cassine'), bl = c && c.bloc ? G.blocs[c.bloc] : null;
      for (const m of bl ? bl.members : c ? [c.id] : []) { const n = G.nations[m]; if (n && n.alive && n.region !== 'old') { ID.addMod(n, 'prod', -0.06, 24, 'The oil shock'); ID.addMod(n, 'ls', -2, 24, 'Queues at the pumps'); n.inflation = Math.min(100, (n.inflation || 0) + 8); } }
      for (const n of old(G)) if (ID.Sov.fields(G, n, true)) { n.glory = Math.min(100, n.glory + 8); }
    } });
  now('st_ol_embargo', 'The oil weapon', 'The oil states of the Old Lands have cut production and embargoed the countries that armed Neshar. The price of a barrel has quadrupled in a month. There are queues at the petrol stations of Cassine, speed limits on the motorways of Norvik and candles in the shops. For the first time in a century, the Old Lands have something the rest of the world must ask them for.', { art: 'industry' });
  pre('st_ol_embargo', 2, 'The oil ministers meet', 'The oil ministers of the Old Lands have been meeting in a hotel by the lake in Lys for a week. They have been told that the price of oil is set by the companies; they have begun to doubt it. One of them, a soft-spoken lawyer from Sahrem, has told reporters that "oil is a weapon too".');
  // 1974 world: the war of the marshes, fuelled by both blocs
  add({ id: 'st_ol_marshes', date: [1974, 9], title: 'The war of the marshes', cond: (G) => { const b = by(G, 'Baskhar'), z = by(G, 'Zandar'); return b && z && !ID.atWar(G, b.id, z.id) && !ID.sameBloc(G, b.id, z.id) && b.ideo !== z.ideo; },
    run: (G) => { stw(G, 'Baskhar', 'Zandar', 'claims', 'for the waterway and the oil of the marshes'); const b = by(G, 'Baskhar'), z = by(G, 'Zandar'); if (b) b.a.marshes = 1; if (z) z.a.marshes = 1; } });
  now('st_ol_marshes', 'War on the waterway', 'Baskhar has invaded Zandar across the marshes, to take the waterway and the oil province on its far bank. It expects a short war. Both blocs are already selling arms to both sides; the merchants of death, one newspaper writes, have found a war with no end in sight and two customers who can pay in oil.', { art: 'war' });
  pre('st_ol_marshes', 3, 'Shots across the waterway', 'Patrol boats of Baskhar and Zandar have exchanged fire on the waterway that divides them, for the third time this year. Each government accuses the other of arming its minorities; both are right. Arms dealers from four countries are staying in the same hotel in the Baskhari capital.');
  // 1975 Tyrrha: the sectarian war
  add({ id: 'st_ol_bus', date: [1975, 4], nation: 'Tyrrha', cond: (G) => { const t = by(G, 'Tyrrha'); return t && !t.civil && t.nq && t.nq.v < 60; } });
  story({ id: 'st_ol_bus', title: 'The bus at the crossroads', text: 'Gunmen of one confession have fired on a temple congregation; gunmen of the other have stopped a bus at a crossroads and killed everyone on it. The militias have come out with all their weapons. The army is splitting along the same lines as the country. Whatever you do, Tyrrha will not be the same for fifteen years; the question is only how much of it is left.',
    opts: [
      { label: 'The militias fight it out', hist: 1, sf: 'bus_war', tip: 'Civil war. Every neighbour will arm its own side.', fx: [['civilwar', 'revival', 0.4], ['nq', -20]] },
      { label: 'The army takes the barracks and the radio', sf: 'bus_army', tip: 'If the army holds together, a junta can stop it. If not, there will be two armies.', fx: [['ideology', 'junta', 'coup'], ['nq', 8], ['mod', 'unrest', 8, 36, 'Martial law']] },
      { label: 'Ask a neighbour to keep the peace', sf: 'bus_varanth', tip: 'Varanth’s army will come, will stop the war, and will not leave.', fx: [['dep', 'bind', 'Varanth', 'protectorate'], ['nq', 10], ['legitmod', -10, 120, 'Foreign peacekeepers']] },
    ] });
  // 1975 Zandar: the preachers
  add({ id: 'st_ol_turbans', date: [1975, 11], nation: 'Zandar', cond: (G) => { const z = by(G, 'Zandar'); return z && is(z, 'absmon', 'conmon', 'junta'); } });
  story({ id: 'st_ol_turbans', title: 'The preachers', text: 'A year of strikes, marches and funerals that became new marches. The oil workers are out, the bazaar is shut, and a million people in the capital are chanting the name of a preacher in exile. The shah is ill; his generals are divided; his foreign friends are making contingency plans. The preacher’s representatives say he will return the day the shah leaves.',
    opts: [
      { label: 'The shah leaves', hist: 1, sf: 'turbans', tip: 'The religious revolution: the oil, the bases and the old regime’s generals all go together.', fx: [['ideology', 'revival', 'revolution'], ['oil', 'nationalise'], ['fn', (G, n) => { if (n.dep) ID.Sov.free(G, n, 'rising'); }]] },
      { label: 'The army fires on the crowds', sf: 'turbans_fire', tip: 'It may work. It did not work in any of the other places where it was tried.', fx: [['ideology', 'junta', 'coup'], ['stab', -15], ['drift', 'revival', 25], ['grievance', 20]] },
      { label: 'A constitution, at last', sf: 'turbans_reform', fx: [['ideology', 'conmon', 'reform'], ['drift', 'revival', 10], ['particip', 15]] },
    ] });
  pre('st_ol_turbans', 3, 'Zandar’s long year', 'For eleven months Zandar has had a demonstration every fortieth day, as each funeral of the last one’s dead becomes the next one. The shah has replaced four prime ministers and released two thousand prisoners. The exiled preacher speaks to the country by cassette tape from a suburb abroad; his tapes outsell every singer in the bazaar.');

  // the great powers' moments (player only): the Old Lands in their games too
  add({ id: 'st_ol_mandate_nv', date: [1919, 8], player: 1, pcond: (G, n) => n.base === 'Norvik' && ID.Sov.dependents(G, n).some((o) => o.dep.kind === 'mandate') });
  story({ id: 'st_ol_mandate_nv', title: 'How to rule a mandate', text: 'The peace conference has given Norvik two mandates in the Old Lands and the costs that come with them: garrisons, officials and a promise to prepare them for independence. The colonial office, the treasury and the foreign office each have a plan.',
    opts: [
      { label: 'Indirect rule through kings', tip: 'Install a king in each, advise him closely, keep the bases. Cheap, and it lasts as long as the kings do.', fx: [['fn', (G, n) => { for (const o of ID.Sov.dependents(G, n)) if (o.dep.kind === 'mandate') { o.dep.res = Math.max(0, o.dep.res - 10); o.dep.share = 0.1; } }], ['gold', 60]] },
      { label: 'Direct rule by the colonial office', tip: 'A larger share of their revenue, a larger garrison, and a revolt.', fx: [['fn', (G, n) => { for (const o of ID.Sov.dependents(G, n)) if (o.dep.kind === 'mandate') { o.dep.res = Math.min(100, o.dep.res + 15); o.dep.share = 0.25; o.dep.gar = 1; } }]] },
      { label: 'A timetable for independence', tip: 'Treaties in ten years, bases kept. The liberal press will approve; the empire lobby will not.', fx: [['fn', (G, n) => { for (const o of ID.Sov.dependents(G, n)) if (o.dep.kind === 'mandate') { o.dep.res = Math.max(0, o.dep.res - 20); o.flags.timetable = G.tick + 3600; } }], ['opAll', 4]] },
    ] });
  add({ id: 'st_ol_arms_ka', date: [1955, 9], player: 1, pcond: (G, n) => n.base === 'Karsova' && !!by(G, 'Khemra') && ID.ideo(by(G, 'Khemra')).flags.nonAligned });
  story({ id: 'st_ol_arms_ka', title: 'Arms for the Nile', text: 'The President of Khemra has asked for tanks, fighters and bombers: the western powers refuse to sell him any while he refuses to join their pact. Our ambassador says that if we sell, Khemra will not become socialist, but the Old Lands will stop being a western lake.',
    opts: [
      { label: 'Sell, through a third country', tip: 'The arms go through a fraternal republic so that everyone can pretend. Nobody will pretend.', fx: [['note2', 'Khemra', 'arms'], ['gold', 60], ['op', 'Cassine', -10]] },
      { label: 'Not to a regime that jails communists', fx: [['op', 'Khemra', -10]] },
    ] });
  add({ id: 'st_ol_suez_cs', date: [1956, 11], player: 1, pcond: (G, n) => n.base === 'Cassine' && F(G, 'canal_nat') && !!by(G, 'Norvik') && !!by(G, 'Khemra') && ID.atWar(G, by(G, 'Norvik').id, by(G, 'Khemra').id) });
  story({ id: 'st_ol_suez_cs', title: 'Our allies did not tell us', text: 'Norvik and Neshar have attacked Khemra over the Canal without a word to us, in the same week that Karsova is crushing a rising in its own satellites. If we stand with our allies, the whole of the Old Lands will see us as the new empire. If we do not, we humiliate them.',
    opts: [
      { label: 'Make them withdraw', tip: 'Threaten to sell their currency. They will withdraw, and they will remember who made them.', fx: [['op', 'Norvik', -20], ['fn', (G, n) => { for (const o of old(G)) ID.addOpBoth(G, n.id, o.id, 10); ID.storyPeace(G, ['Norvik', 'Khemra', 'Neshar']); }], ['glory', 6]] },
      { label: 'Stand with our allies', fx: [['op', 'Norvik', 15], ['fn', (G, n) => { for (const o of old(G)) ID.addOpBoth(G, n.id, o.id, -12); }]] },
    ] });
  add({ id: 'st_ol_road_he', date: [1941, 3], player: 1, pcond: (G, n) => n.base === 'Hesperia' && !!by(G, 'Baskhar') && n.nwars > 0 });
  story({ id: 'st_ol_road_he', title: 'The road to the oil', text: 'Colonels in Baskhar want to throw out the Norvish and ask for our help. The oil of the two rivers would fuel our panzers for a year; the general staff says we cannot spare a division, and the foreign office says we can spare promises.',
    opts: [
      { label: 'Send promises and a squadron', fx: [['note2', 'Baskhar', 'arms'], ['subvert', 'Baskhar', 10]] },
      { label: 'Not now', fx: [] },
    ] });
  add({ id: 'st_ol_crowns_au', date: [1913, 5], player: 1, pcond: (G, n) => n.base === 'Aurelia' && !!by(G, 'Varanth') });
  story({ id: 'st_ol_crowns_au', title: 'The warm-water straits', text: 'For two hundred years every emperor of Aurelia has wanted the straits at Varanth: a warm-water outlet to the southern sea. Varanth is bankrupt and friendless. The general staff has a plan, and the foreign ministry a warning: the other powers will not allow it.',
    opts: [
      { label: 'Claim the straits', fx: [['claim', 'Varanth'], ['op', 'Norvik', -10], ['op', 'Varanth', -20]] },
      { label: 'Protect the Sultan instead', tip: 'A friendly sick man is better than a dead one whose estate goes to others.', fx: [['note2', 'Varanth', 'aid'], ['op', 'Varanth', 15]] },
    ] });

  /* superevents for the continent's great moments */
  const SUP = {
    st_ol_mandates: { quote: 'We were promised a kingdom. We were given a mandate. The difference is the width of a pencil line.', by: 'a delegate of the two rivers, outside the conference hall', text: 'The victors divide the provinces of a dead empire among themselves, in trust for peoples who were not asked. Lines drawn this summer will be fought over for a century.', ok: 'It is decided elsewhere', sound: 'stamp', art: 'wall' },
    st_ol_partition: { quote: 'We locked the door and took the key. We would be back in a week.', by: 'a refugee from the coast, fifty years later', text: 'One people gets a state at last, after the worst persecution in its history. Another loses its villages, its fields and its homes, and becomes a people of camps and keys. Both will remember this day, under different names.', ok: 'There is no good answer', sound: 'alarm', art: 'crowd' },
    st_ol_naksa: { quote: 'We lost more than a war. We lost the idea that we would win.', by: 'a poet of the Old Lands, 1967', text: 'Six days end the dream of the secular nation. The officers who promised liberation have delivered defeat, and a generation turns away from them toward the shrine.', ok: 'Mourn the dream', sound: 'alarm', art: 'crisis' },
    st_ol_embargo: { quote: 'For a century they told us what our oil was worth. This month we told them.', by: 'an oil minister of the Old Lands', text: 'The price of oil quadruples. The industrial world queues at its pumps, and the Old Lands discover that they have a weapon, and that it cuts both ways.', ok: 'The world has changed', sound: 'stamp', art: 'industry' },
  };
  for (const b of ID.STORY) if (SUP[b.id]) b.sup = SUP[b.id];
})();
