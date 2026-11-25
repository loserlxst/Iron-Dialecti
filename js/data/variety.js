/* IRON DIALECTIC — variety: the dispatches that come round most often are given several faces, and
   a second shelf of ordinary dispatches is added so that a long campaign does not read the same
   page twice. Loads after data/fortune.js and data/arcs.js.
   vary(id, [[title, text, [labels]?], ...]): alternative tellings of an existing dispatch. The
   choices and their effects stay the same; only the story (and optionally the labels) changes.
   The engine never shows the same telling twice running (sim/events.js). Themes keep two
   dispatches on the same subject from arriving back to back. */
(function () {
  'use strict';
  const ID = (globalThis.ID = globalThis.ID || {});
  const E = ID.EVENT_DEFS;
  const I = (n) => ID.ideo(n);
  const S = (n, f) => n.fs[f];
  const fam = (n, ...f) => f.indexOf(I(n).family) >= 0;
  const model = (n, ...m) => m.indexOf(I(n).econ.model) >= 0;
  const priv = (n) => model(n, 'market', 'mixed', 'pact', 'trade');
  const law = (n, c, ...o) => o.indexOf(n.laws[c]) >= 0;
  const closed = (n) => law(n, 'press', 'censored', 'propaganda');
  const PERM = 600;
  const def = (id) => E.find((x) => x.id === id);
  const fnOf = (v) => (typeof v === 'function' ? v : () => v);

  function vary(id, list) {
    const d = def(id); if (!d) return;
    const t0 = fnOf(d.title), x0 = fnOf(d.text);
    d.variants = list.length + 1;
    const V = (c) => (c && c.v ? list[c.v - 1] : null);
    d.title = (n, G, c) => { const v = V(c); return v ? v[0] : t0(n, G, c); };
    d.text = (n, G, c) => { const v = V(c); return v ? v[1] : x0(n, G, c); };
    if (Array.isArray(d.opts)) d.opts.forEach((o, k) => { const l0 = fnOf(o.label); o.label = (n, G, c) => { const v = V(c); return v && v[2] && v[2][k] ? v[2][k] : l0(n, G, c); }; });
  }
  const theme = (t, ids) => { for (const id of ids) { const d = def(id); if (d) d.theme = t; } };

  /* ================================================================ other tellings */
  vary('strike_wave', [
    ['The docks are shut', 'The dockers have walked out over the new piece rates and the cranes stand idle over forty ships. The carters and the warehousemen have come out in sympathy. Perishable cargo is going over the side.'],
    ['No trains today', 'The railwaymen stopped work at midnight. Coal is not reaching the power stations, milk is not reaching the towns, and the union says the footplate crews will stay out until the eight-hour day is in writing.'],
    ['The pits are silent', 'Sixty thousand miners have refused to go down until the owners restore last year’s wage cut. The winding wheels have stopped across the whole coalfield, and the stockpiles will last three weeks.', ['Restore the cut', 'Wait them out', 'Send the troops to the pitheads']],
    ['Lock-out in the mills', 'The mill owners have locked the gates on forty thousand spinners rather than recognise their union. The women have set up soup kitchens outside and the shopkeepers are extending credit to them, not to the owners.', ['Make the owners recognise the union', 'Stay out of it', 'Clear the pickets']],
    ['The trams stand in their sheds', 'Tram drivers and conductors want a wage they can live on in the capital. The city is walking to work, in the rain, and deciding whom to blame.'],
    ['The clerks walk out', 'For the first time anyone can remember, the post office clerks, telegraphists and junior civil servants are on strike. No letters, no telegrams, no stamps on any document. The ministries discover what they ran on.'],
  ]);
  vary('general_strike', [
    ['The country stops', 'It began in one engineering works and by the third day there was no bread baked, no newspaper printed and no train moving anywhere. The strike committee sits in the trades hall and the prefects telephone it for permission to move ambulances.'],
    ['The folded arms', 'Every union in the federation has called its members out together. The workers have not gone home: they are sitting in the factories, with the machines greased and guarded, and they say they will leave when there is a different government.'],
  ]);
  vary('bread_riots', [
    ['The market is sacked', 'A dealer raised the price of flour twice in one morning. By noon his stall was firewood and the crowd had moved on to the grain merchants’ warehouses by the river.'],
    ['Queues in the industrial suburbs', 'The night shift came off to find the bakeries empty again. They did not go home. They went, eleven thousand of them, to the town hall, and they have taken the mayor’s keys.'],
    ['The hunger march', 'Columns of the unemployed and their families are walking on the capital from the mill towns, sleeping in temple halls. They are orderly, hungry, and three days away.', ['Feed them from the state granaries', 'Turn them back at the bridges', 'Blame the speculators']],
  ]);
  vary('student_protests', [
    ['A professor is dismissed', 'The ministry removed a popular professor for a lecture nobody has read. The students have barricaded the faculty, the staff are divided, and the engineering school has sent delegates with a printing press.'],
    ['The young take the square', 'It started as a protest about examination fees. It is now a permanent meeting of several thousand in the main square, with its own newspaper, its own marshals, and speakers the government has never heard of.'],
  ]);
  vary('corruption_scandal', [
    ['The army contracts', 'An auditor has found that the boots supplied to the army last winter had cardboard soles, and that the contractor is the brother-in-law of a minister. The auditor has been transferred. His report has not.'],
    ['The customs house', 'A clerk has gone to the newspapers with the customs ledgers. For ten years, it seems, one cargo in five has entered the country as “ballast”, and the men who signed for it now sit in the cabinet.'],
    ['The minister’s villa', 'A minister on a state salary has built a villa with a marble staircase. The photographs are passing from hand to hand, and the stonemasons were never paid.'],
  ]);
  vary('border_incident', [
    ['A village on the wrong side', 'Surveyors from the neighbouring state have planted boundary stones a mile inside what our maps show as ours. The villagers pulled them up; their gendarmes came back with rifles. Two men are dead.'],
    ['The aeroplane', 'One of their military aircraft has come down in our territory with a camera aboard. The pilot says he was lost. Their government demands him back within the week.', ['Hold him and demand an apology', 'Return him quietly', 'Reinforce the frontier']],
    ['The customs post burns', 'Smugglers, or men dressed as smugglers, burned our customs post and withdrew across the border under covering fire. Their newspapers call it an invention. Ours call it an act of war.'],
  ]);
  vary('harvest_failure', [
    ['The rains do not stop', 'It has rained for six weeks. The rivers are over the dykes, the wheat has rotted where it stood, and potatoes are coming out of the ground black.'],
    ['Blight', 'A rust has got into the wheat and is moving north at ten miles a day. The agronomists know what it is and do not know how to stop it. Farmers are cutting green fields for fodder.'],
    ['Locusts', 'The swarm took an afternoon to pass over the southern provinces and left nothing behind it that was green. Bread prices in the market towns doubled before the telegrams reached the capital.'],
  ]);
  vary('mine_disaster', [
    ['The dam at the reservoir', 'The dam above the mill town gave way at night. The engineers had reported cracks; the report is in a ministry file with a note saying “next year’s budget”. Four hundred dead.', ['An inspection law with teeth', 'Compensation for the families', 'Blame saboteurs']],
    ['Fire at the works', 'The doors of the match factory were locked from outside, as they were every shift. A hundred and forty women died at the windows. The owner is insured.', ['A factory law with teeth', 'Compensation for the families', 'Blame saboteurs']],
    ['The night express', 'Two trains met on a single track because a signalman had been on duty for nineteen hours. Ninety dead, among them a deputy. The railway company’s shares rose on the news that it was not at fault.', ['A safety law with teeth', 'Compensation for the families', 'Blame saboteurs']],
  ]);
  vary('assassination', [
    ['A bomb at the opera', 'The device was under the wrong box. The ruler arrived late and walked in through the smoke. Eleven of the audience are dead, and the man who placed it has not been found.'],
    ['The knife in the crowd', 'A young man stepped out of the crowd at the unveiling with a kitchen knife. A guard took it in the arm. The prisoner says he acted alone and for everyone.'],
  ]);
  vary('peasant_petition', [
    ['The burning of the title deeds', 'In the river provinces the villagers have gone up to the manor houses, quite politely, asked for the estate papers, and burned them in the yard. They then ploughed the home farm. Nobody has been hurt, yet.'],
    ['The rent strike in the villages', 'The tenants of forty estates have agreed among themselves to pay half rent this year and to see that no bailiff evicts anyone. The landlords want troops; the priests are reading the tenants’ letter from the pulpit.'],
  ]);
  vary('officers_petition', [
    ['A dinner at the staff college', 'Sixty officers dined together at the staff college and drank a toast that was not to the government. The text of the after-dinner speech has reached you, with the names of those who applauded.'],
    ['The general’s article', 'A serving general has published an article, under his own name, on “the army’s duty when the politicians fail”. The war ministry says it cannot find the regulation that forbids it.'],
  ]);
  vary('bank_run', [
    ['The savings banks', 'A rumour that the postal savings bank cannot pay has emptied every branch in the country by nightfall. The rumour was false this morning. It is not false now.'],
    ['The house of cards', 'A great trading house has failed, owing money to nine banks which had each believed it was the only lender. Two of the nine have closed their doors and the others are counting.'],
  ]);
  vary('tax_revolt', [
    ['The shopkeepers shut', 'Every shop in the capital has its shutters down against the new turnover tax. The traders’ league says it can keep this up longer than the treasury can.'],
    ['The province will not pay', 'The assembly of the richest province has voted, almost unanimously, to hold back its taxes until the government accounts for how it spent last year’s.'],
  ]);
  vary('veterans_march', [
    ['The limbless at the ministry', 'Men who left their legs at the front have been wheeled to the steps of the finance ministry by their wives. They have their medals on and a banner asking for the pension they were promised.'],
    ['The demobbed', 'Half a million men have been sent home with a suit, a railway ticket and no work. They have their old sergeants, their old songs and, in a good many cases, their old rifles.'],
  ]);
  vary('mutiny', [
    ['The fleet raises a red flag', 'The crews of three battleships have locked up their officers and elected committees. They will fight if the enemy comes, they say, but they will not sail on another “death ride” for the admirals’ honour.'],
    ['The leave trains', 'Men coming back from leave are refusing to board the trains for the front. At two junctions they have uncoupled the engines. The gendarmes sent to arrest them joined the meeting.'],
  ]);
  vary('shortages', [
    ['Soap', 'There has been no soap in the shops for five months. The plan for soap was fulfilled by weight, in bars nobody can lift. Women are boiling ashes, and saying what they think while they do it.'],
    ['The coat that never came', 'The clothing trust has delivered its winter coats in April, all in one size. The stores are full and the queues outside them are for something else.'],
  ]);
  vary('capital_flight', [
    ['The night trains to the frontier', 'Every sleeping car to the frontier is booked by gentlemen with heavy luggage. The banks report that their safe-deposit vaults are being emptied faster than their accounts.'],
    ['The bond market closes', 'The last issue of state bonds found no buyers at any price, and those who hold the old ones are selling them for foreign currency at half their face value.'],
  ]);
  vary('ambitious_general', [
    ['The victor comes home', 'The general who won the campaign has been given a triumph by the capital without asking anybody. Flowers, bands, schoolchildren. He rode past the ministry without turning his head.'],
    ['A book of memoirs', 'A retired marshal has published his memoirs. They sell out in a day and say, on every page, that the politicians lost what the army won. He is thinking, he tells a reporter, of public life.'],
  ]);
  vary('inflation_spiral', [
    ['A wheelbarrow of notes', 'The central bank has issued a new note with three more noughts on it. Shopkeepers weigh money instead of counting it, and the peasants will sell food only for cloth, nails or tobacco.'],
  ]);
  vary('brain_drain', [
    ['The conservatory empties', 'First the physicists, now the musicians: the country’s best orchestra went abroad on tour and a third of it stayed. The ones who came back are asked every day why.'],
    ['The engineers’ steamer', 'A foreign firm is hiring our engineers at four times their salary and paying the passage. The last steamer took ninety of them and their families.'],
  ]);
  vary('peace_movement', [
    ['The mothers', 'Every Thursday women in black stand in silence in the main square holding photographs. There are more of them each week, and the police have asked what offence they are to be charged with.'],
    ['The letter from the trenches', 'A letter signed by two thousand front-line soldiers has been printed, illegally, in half a million copies. It asks one question: what are the war aims, and who decided them?'],
  ]);
  vary('planners_error', [
    ['The nails', 'The nail factory fulfilled its plan, set in tons, by making only the largest nails. Builders across the country have a great many very large nails and nothing to hang a door with.'],
    ['The canal', 'The great canal has been declared complete on schedule. It is, on inspection, four feet deep. The barges it was built for draw nine.'],
  ]);
  vary('bureaucrats_fiefs', [
    ['Two ministries, one bridge', 'The ministry of transport built half a bridge from the north bank and the ministry of construction half from the south. They do not meet. Each has produced a memorandum proving the other’s error.'],
    ['The form', 'To obtain a permit one now needs a certificate, to obtain the certificate a stamp, and the stamp is issued only to holders of a permit. The officials concerned are all in favour of reform.'],
  ]);

  /* ---- themes: two dispatches on the same subject do not arrive back to back */
  theme('labour', ['strike_wave', 'general_strike', 'union_congress', 'mine_disaster', 'foreign_strike']);
  theme('food', ['bread_riots', 'harvest_failure', 'bumper_harvest', 'peasant_petition', 'village_vs_factory']);
  theme('army', ['officers_petition', 'ambitious_general', 'veterans_march', 'mutiny', 'arms_race', 'border_incident']);
  theme('money', ['bank_run', 'capital_flight', 'inflation_spiral', 'speculation_boom', 'tax_revolt', 'corruption_scandal']);
  theme('mind', ['student_protests', 'brain_drain', 'dissident_novel', 'bishops_letter', 'heretical_preacher']);
  theme('plan', ['planners_error', 'shortages', 'bureaucrats_fiefs', 'organs_overreach', 'network_fault']);

  /* ================================================================ a second shelf of dispatches */
  const ev = (o) => E.push(Object.assign({ tone: 'mixed' }, o));
  const anyNb = (G, n, f) => { for (const k in G.border[n.id] || {}) { const o = G.nations[+k]; if (o && o.alive && f(o)) return o; } return null; };

  ev({ id: 'v_flood', tone: 'bad', theme: 'nature', title: 'The river takes the lower town', cd: 110,
    text: 'After a week of rain the river came over the embankment at night. The lower town is under six feet of water, the bridges are gone, and forty thousand people are sitting on roofs.',
    w: (n) => (n.tiles > 300 ? 1.6 : 0.8),
    opts: [
      { label: 'Send the army with boats and bread', fx: [['gold', -50], ['sup', 'workers', 6], ['sup', 'peasants', 5], ['sup', 'military', 2]] },
      { label: 'Rebuild the embankments properly', tip: 'Dear, slow, and it will not happen again.', fx: [['gold', -110], ['mod', 'food', 0.03, PERM, 'River works'], ['sup', 'peasants', 4]] },
      { label: 'Leave it to the municipalities', fx: [['sup', 'workers', -6], ['legitmod', -3, 12, 'The flood']] },
    ] });
  ev({ id: 'v_quake', tone: 'bad', theme: 'nature', title: 'Earthquake', cd: 200,
    text: 'The shock lasted forty seconds. In the old quarter of the second city hardly a wall is standing, the gas mains are alight, and the survivors are digging with their hands.',
    w: () => 0.7,
    opts: [
      { label: 'A national relief fund', fx: [['gold', -90], ['supAll', 3], ['legitmod', 4, 18, 'The relief']] },
      { label: 'Accept the foreign aid offered', tip: 'Every embassy has offered. Some offers come with photographers.', fx: [['gold', 40], ['opAll', 4], ['sup', 'military', -3]] },
      { label: 'Martial law in the ruins', fx: [['sup', 'workers', -5], ['stab', 2], ['grievance', 4]] },
    ] });
  ev({ id: 'v_fire', tone: 'bad', theme: 'nature', title: 'The great fire', cd: 160,
    text: 'It started in a timber yard and the wind did the rest. A third of the port is ash, including the bonded warehouses and the records of who owned what.',
    w: (n) => (n.nb[3] ? 1.2 : 0.5),
    opts: [
      { label: 'Rebuild in stone, on a plan', fx: [['gold', -100], ['mod', 'trade', 0.05, PERM, 'The new port'], ['sup', 'capital', 4]] },
      { label: 'Let the owners rebuild as they can', fx: [['sup', 'capital', 2], ['sup', 'workers', -4], ['mod', 'trade', -0.05, 18, 'The burnt port']] },
    ] });
  ev({ id: 'v_winter', tone: 'bad', theme: 'nature', title: 'The winter of the wolves', cd: 130,
    text: 'The coldest winter in sixty years. The canals froze in November, coal cannot be moved, and in the hill villages the wolves are coming down to the graveyards.',
    w: () => 1.2,
    opts: [
      { label: 'Requisition coal for the towns', fx: [['sup', 'workers', 5], ['sup', 'capital', -5], ['gold', -30]] },
      { label: 'Open the barracks and schools as shelters', fx: [['sup', 'military', -2], ['sup', 'peasants', 5], ['sup', 'workers', 3]] },
      { label: 'It will thaw', fx: [['pop', -0.004], ['legitmod', -3, 10, 'The hard winter']] },
    ] });
  ev({ id: 'v_film', tone: 'mixed', theme: 'mind', era: 1, title: 'The film everyone is seeing', cd: 110,
    text: 'A film about a mutiny, a strike, a girl and a general is playing to full houses three times a day. The audiences cheer in the wrong places. The censor passed it without watching the last reel.',
    w: (n) => 1.3 + (closed(n) ? 0.8 : 0),
    opts: [
      { label: 'Let it run', fx: [['sup', 'intelligentsia', 5], ['sup', 'workers', 3], ['opp', 3]] },
      { label: 'Withdraw it', fx: [['sup', 'intelligentsia', -6], ['grievance', 3]] },
      { label: 'Commission a better one', tip: 'With a larger budget and a different ending.', fx: [['gold', -50], ['legitmod', 3, 18, 'The state’s own picture'], ['sup', 'intelligentsia', -2]] },
    ] });
  ev({ id: 'v_radio', tone: 'mixed', theme: 'mind', era: 1, title: 'A voice from across the border', cd: 120,
    text: 'A powerful transmitter in a neighbouring country has begun broadcasting in our language every evening: dance music, then the news as they see it. People are building sets from wire and cigar boxes.',
    w: (n, G) => (anyNb(G, n, (o) => ID.ideoAffinity(n.ideo, o.ideo) < -10) ? 1.6 : 0),
    opts: [
      { label: 'Jam it', fx: [['gold', -40], ['sup', 'intelligentsia', -4], ['mod', 'opp', -0.1, 24, 'Jamming']] },
      { label: 'Answer it: our own evening programme', fx: [['gold', -60], ['legitmod', 3, 24, 'The evening programme']] },
      { label: 'Ignore it', fx: [['opp', 4], ['driftAll', 2]] },
    ] });
  ev({ id: 'v_census', tone: 'mixed', theme: 'state', title: 'The census is in', cd: 150,
    text: 'The census commissioners have delivered their volumes. There are a good many more people in the towns than the tax rolls say, a good many fewer in the villages than the army lists say, and one province that has been reporting the same figures since the last reign.',
    w: () => 1,
    opts: [
      { label: 'Tax by the new figures', fx: [['mod', 'rev', 0.05, 60, 'The new tax rolls'], ['sup', 'workers', -3], ['sup', 'capital', -3]] },
      { label: 'Redraw the constituencies by them', can: (n) => !!I(n).elections, fx: [['mandate', 6], ['sup', 'workers', 4], ['sup', 'aristocracy', -5]] },
      { label: 'Conscript by them', fx: [['troops', 0.04], ['sup', 'peasants', -3]] },
    ] });
  ev({ id: 'v_spy', tone: 'bad', theme: 'state', title: 'The colonel’s second salary', cd: 130,
    text: 'A colonel of the general staff has been living beyond his pay for years. He shot himself when the detectives called. In his flat were the mobilisation plans, photographed, and receipts from a foreign embassy.',
    w: (n, G) => (anyNb(G, n, (o) => ID.op(G, o.id, n.id) < -20) ? 1.5 : 0.3),
    opts: [
      { label: 'Publish everything and expel the attaché', fx: [['fn', (G, n) => { const o = anyNb(G, n, (x) => ID.op(G, x.id, n.id) < -20); if (o) ID.addOpBoth(G, n.id, o.id, -15); }], ['sup', 'military', -4], ['legitmod', 2, 12, 'The spy unmasked']] },
      { label: 'Hush it up and change the plans', fx: [['gold', -40], ['mod', 'def', 0.03, 24, 'New mobilisation plans']] },
      { label: 'Feed them false plans through his successor', tip: 'Risky, slow, and satisfying.', fx: [['mod', 'def', 0.06, 36, 'The double game'], ['corr', 2]] },
    ] });
  ev({ id: 'v_defector', tone: 'good', sfx: 'good', theme: 'state', title: 'A man with a suitcase', cd: 140,
    text: 'An official of a hostile government has walked into our legation abroad with a suitcase of documents and asked for a passport. He knows a great deal and wants a house by a lake.',
    w: (n, G) => (ID.alive(G).some((o) => o !== n && ID.op(G, o.id, n.id) < -30) ? 1.1 : 0),
    opts: [
      { label: 'Give him the house', fx: [['gold', -30], ['tech', 120], ['mod', 'def', 0.03, 24, 'What the defector knew']] },
      { label: 'Parade him before the press', fx: [['legitmod', 3, 12, 'The defector speaks'], ['opAll', -2]] },
      { label: 'Hand him back, for a price', fx: [['gold', 80], ['sup', 'intelligentsia', -4]] },
    ] });
  ev({ id: 'v_smugglers', tone: 'mixed', theme: 'money', title: 'The smugglers’ coast', cd: 110,
    text: 'Half the tobacco, most of the spirits and all of the silk stockings sold in the country now come in by night without paying duty. The coastguard knows the boats by name and the boatmen know the coastguard’s price.',
    w: (n) => (n.coastTiles > 10 && priv(n) ? 1.4 : 0),
    opts: [
      { label: 'New cutters and new officers', fx: [['gold', -60], ['mod', 'rev', 0.04, 48, 'Customs reform'], ['corr', -3]] },
      { label: 'Lower the duties until smuggling does not pay', fx: [['mod', 'trade', 0.06, 48, 'Lower duties'], ['mod', 'rev', -0.02, 24, 'Lower duties'], ['sup', 'capital', 3]] },
      { label: 'Take the coastguard’s share for the treasury', tip: 'The practice is old. Only the recipient is new.', fx: [['gold', 60], ['corr', 5]] },
    ] });
  ev({ id: 'v_rent', tone: 'bad', theme: 'labour', title: 'The tenants will not pay', cd: 110,
    text: 'In the tenements of the capital the women have organised, staircase by staircase. No one is paying rent until it comes down, and when the bailiffs come the whole street turns out with saucepans.',
    w: (n) => (priv(n) && S(n, 'workers') < 52 ? 1.6 : 0),
    opts: [
      { label: 'A rent restriction act', fx: [['sup', 'workers', 9], ['sup', 'capital', -7], ['conf', -4]] },
      { label: 'Build municipal housing', fx: [['gold', -90], ['sup', 'workers', 6], ['mod', 'ls', 2, 48, 'Municipal housing']] },
      { label: 'Protect the bailiffs', fx: [['sup', 'workers', -8], ['sup', 'capital', 4], ['grievance', 4]] },
    ] });
  ev({ id: 'v_coop', tone: 'good', sfx: 'good', theme: 'labour', title: 'The co-operative that works', cd: 140,
    text: 'A consumers’ co-operative founded by eleven weavers now has two hundred shops, a flour mill and a bank. It pays a dividend to its members and asks nothing from the state except to be left alone.',
    w: (n) => (fam(n, 'liberal', 'socialist', 'anarchist', 'heterodox') ? 1.1 : 0.4),
    opts: [
      { label: 'A co-operatives act, with tax relief', fx: [['sup', 'workers', 6], ['sup', 'capital', -3], ['mod', 'ls', 2, 60, 'Co-operative stores']] },
      { label: 'Bring it into the plan', can: (n) => model(n, 'plan', 'cyber', 'mixed'), fx: [['mod', 'eff', 0.02, 60, 'Co-operative trade'], ['sup', 'workers', -2]] },
      { label: 'Leave it alone, as asked', fx: [['sup', 'workers', 3], ['particip', 3]] },
    ] });
  ev({ id: 'v_football', tone: 'mixed', theme: 'crowd', era: 1, title: 'Ninety minutes', cd: 120,
    text: 'The national side has lost at home to the neighbours, by a goal the referee should not have given. Their consulate has no windows left, and the crowd is now discussing who else is to blame.',
    w: (n, G) => (anyNb(G, n, () => true) ? 1.1 : 0),
    opts: [
      { label: 'Apologise and pay for the windows', fx: [['gold', -10], ['fn', (G, n) => { const o = anyNb(G, n, () => true); if (o) ID.addOpBoth(G, n.id, o.id, 6); }], ['glory', -2]] },
      { label: 'Say nothing; let them shout', fx: [['unrest', -3], ['fn', (G, n) => { const o = anyNb(G, n, () => true); if (o) ID.addOpBoth(G, n.id, o.id, -8); }]] },
      { label: 'Build a national stadium', fx: [['gold', -70], ['legitmod', 3, 36, 'The national stadium'], ['sup', 'workers', 4]] },
    ] });
  ev({ id: 'v_pilgrims', tone: 'mixed', theme: 'faith', title: 'The pilgrimage', cd: 130,
    text: 'A shepherd girl has seen something on a hillside, and a hundred thousand people have come to stand where she stood. The high priest is cautious, the innkeepers are not, and the prefect wants to know whether it is a religious matter or a public order one.',
    w: (n) => (n.tradition > 35 ? 1.4 : 0.5),
    opts: [
      { label: 'Send the ruler to kneel there', fx: [['sup', 'clergy', 8], ['sup', 'peasants', 5], ['sup', 'intelligentsia', -5], ['tradition', 3]] },
      { label: 'Build a road and a railway halt', fx: [['gold', -40], ['sup', 'clergy', 3], ['sup', 'capital', 3]] },
      { label: 'Send doctors to examine the girl', fx: [['sup', 'clergy', -7], ['sup', 'intelligentsia', 5], ['tradition', -3]] },
    ] });
  ev({ id: 'v_exile', tone: 'mixed', theme: 'mind', title: 'The exile’s book', cd: 130,
    text: 'A man who fled the country ten years ago has published, abroad, a history of how it is really governed. It names names. Copies are coming in sewn into coat linings, and are being read aloud.',
    w: (n) => (closed(n) || n.grievance > 25 ? 1.5 : 0.4),
    opts: [
      { label: 'Invite him home under amnesty', fx: [['sup', 'intelligentsia', 7], ['grievance', -5], ['auth', -5]] },
      { label: 'Answer it in print, line by line', fx: [['gold', -20], ['legitmod', 2, 12, 'The reply'], ['opp', 2]] },
      { label: 'Seize the copies', fx: [['sup', 'intelligentsia', -5], ['grievance', 4]] },
    ] });
  ev({ id: 'v_airship', tone: 'good', sfx: 'good', theme: 'crowd', title: 'The airship comes', cd: 300, once: 1,
    text: 'A foreign airship, the length of two great temples, is crossing the country on a goodwill flight. Schools are closed so the children can watch it pass. The general staff is watching it too.',
    w: (n, G) => (ID.eraOf(G.tick) <= 1 ? 1.1 : 0),
    opts: [
      { label: 'A reception at the aerodrome', fx: [['opAll', 3], ['sup', 'intelligentsia', 3]] },
      { label: 'Order one of our own', fx: [['gold', -80], ['tech', 150], ['glory', 4]] },
    ] });
  ev({ id: 'v_motor', tone: 'mixed', theme: 'crowd', title: 'The motor car', cd: 300, once: 1,
    text: 'There are now four thousand motor cars in the capital and they killed two hundred people last year. The cab drivers want them banned, the manufacturers want roads, and the general staff has noticed that they do not need hay.',
    w: (n, G) => (ID.eraOf(G.tick) <= 1 && n.ind > 20 ? 1.2 : 0),
    opts: [
      { label: 'A national roads board', fx: [['gold', -80], ['mod', 'prod', 0.03, PERM, 'Motor roads'], ['sup', 'capital', 4]] },
      { label: 'Tax them for the benefit of the railways', fx: [['gold', 40], ['sup', 'capital', -3]] },
      { label: 'Buy lorries for the army', fx: [['gold', -60], ['equip', 0.04], ['sup', 'military', 4]] },
    ] });
  ev({ id: 'v_wireless', tone: 'good', sfx: 'good', theme: 'mind', era: 1, title: 'The first broadcast', cd: 300, once: 1,
    text: 'A concert, a weather forecast and a talk on bee-keeping have been transmitted from the capital and heard, on eleven hundred receiving sets, as far as the frontier. Someone will have to decide who owns the air.',
    w: () => 1.2,
    opts: [
      { label: 'A state monopoly', fx: [['legitmod', 3, 60, 'The state wireless'], ['sup', 'intelligentsia', -3]] },
      { label: 'A public corporation at arm’s length', can: (n) => fam(n, 'liberal', 'socialist', 'conservative'), fx: [['sup', 'intelligentsia', 6], ['particip', 3]] },
      { label: 'Licences to whoever will pay', can: (n) => priv(n), fx: [['gold', 60], ['sup', 'capital', 4], ['opp', 2]] },
    ] });
  ev({ id: 'v_university', tone: 'good', sfx: 'good', theme: 'mind', title: 'A bequest', cd: 160,
    text: 'A manufacturer with no children has left his fortune to found a technical university, on condition that it admits anyone who passes the examination, whoever their parents were.',
    w: (n) => (priv(n) ? 0.9 : 0),
    opts: [
      { label: 'Accept, and match it', fx: [['gold', -60], ['mod', 'sci', 0.08, PERM, 'The technical university'], ['sup', 'intelligentsia', 6]] },
      { label: 'Accept the money, amend the condition', fx: [['mod', 'sci', 0.04, PERM, 'The technical university'], ['sup', 'aristocracy', 3], ['sup', 'workers', -3]] },
    ] });
  ev({ id: 'v_emigrants', tone: 'mixed', theme: 'crowd', title: 'The emigrant ships', cd: 140,
    text: 'Forty thousand people left for the new countries last year, most of them young, and the agents of the shipping lines are in every village with posters of wheat fields. The landowners complain that wages are rising.',
    w: (n) => (n.ls < 48 ? 1.4 : 0.3),
    opts: [
      { label: 'Let them go; they send money home', fx: [['pop', -0.01], ['gold', 40], ['sup', 'peasants', 3], ['mod', 'unrest', -3, 24, 'The safety valve']] },
      { label: 'Give them land at home instead', fx: [['gold', -70], ['sup', 'peasants', 8], ['sup', 'aristocracy', -5]] },
      { label: 'Forbid the agents', fx: [['sup', 'peasants', -5], ['sup', 'aristocracy', 4]] },
    ] });
  ev({ id: 'v_trial', tone: 'mixed', theme: 'state', title: 'The trial of the century', cd: 150,
    text: 'An officer was convicted of treason on evidence that now turns out to have been forged, by another officer, with the knowledge of the minister. Half the country wants the case reopened. The other half says the honour of the army is at stake.',
    w: (n) => (I(n).control.type === 'parliament' || n.fp.military > 14 ? 1.1 : 0.3),
    opts: [
      { label: 'Reopen it, whatever it costs', fx: [['sup', 'intelligentsia', 9], ['sup', 'military', -8], ['legitmod', 3, 24, 'Justice done'], ['corr', -3]] },
      { label: 'The verdict stands', fx: [['sup', 'military', 6], ['sup', 'intelligentsia', -9], ['grievance', 4]] },
      { label: 'Pardon him without clearing him', tip: 'Nobody will be satisfied, which some call statesmanship.', fx: [['sup', 'intelligentsia', -3], ['sup', 'military', -2]] },
    ] });
  ev({ id: 'v_suffrage', tone: 'mixed', theme: 'crowd', title: 'Votes for women', cd: 300, once: 1,
    text: 'A procession of forty thousand women has delivered a petition to the chamber. Some of them have chained themselves to its railings, and one has slapped a minister.',
    w: (n) => (I(n).elections ? 1.5 : 0),
    opts: [
      { label: 'Give them the vote', fx: [['mandate', 8], ['particip', 8], ['sup', 'clergy', -4], ['sup', 'intelligentsia', 6]] },
      { label: 'Promise a commission', fx: [['sup', 'intelligentsia', -4], ['later', 30, 'v_suffrage2']] },
      { label: 'Arrest the ringleaders', fx: [['sup', 'intelligentsia', -8], ['grievance', 4], ['later', 30, 'v_suffrage2']] },
    ] });
  ev({ id: 'v_suffrage2', sys: 1, always: 1, tone: 'bad', title: 'They are back', text: 'The commission never reported. The women are back in front of the chamber, more of them than before, and this time the tram drivers’ union is marching with them.',
    opts: [{ label: 'Give them the vote', fx: [['mandate', 5], ['particip', 8], ['sup', 'clergy', -4]] }, { label: 'Hold the line', fx: [['sup', 'workers', -5], ['sup', 'intelligentsia', -6], ['opp', 5]] }] });
  ev({ id: 'v_monopoly', tone: 'mixed', theme: 'money', title: 'The trust', cd: 130,
    text: 'One company now refines nine tenths of the country’s oil, owns the pipelines, and has just bought the last independent newspaper that criticised it. Its chairman would like a word about the new tariff.',
    w: (n) => (model(n, 'market', 'mixed', 'trade') ? 1.3 : 0),
    opts: [
      { label: 'Break it up', fx: [['sup', 'capital', -9], ['sup', 'workers', 5], ['sup', 'intelligentsia', 4], ['mod', 'eff', 0.02, 60, 'Competition']] },
      { label: 'Regulate its prices', fx: [['sup', 'capital', -4], ['mod', 'ls', 1.5, 36, 'Regulated prices']] },
      { label: 'Take the word, and the donation', fx: [['gold', 90], ['corr', 6], ['sup', 'workers', -4]] },
    ] });
  ev({ id: 'v_gold', tone: 'good', sfx: 'good', theme: 'money', title: 'Gold in the hills', cd: 300,
    text: 'A prospector’s mule kicked over a stone, and now there are eleven thousand men with pans in a valley that had forty inhabitants. The assay office confirms it is the real thing.',
    w: (n) => (n.tc && n.tc[4] + n.tc[5] > 60 ? 0.7 : 0),
    opts: [
      { label: 'A state mine', fx: [['gold', 160], ['mod', 'rev', 0.03, 60, 'The gold field'], ['sup', 'capital', -3]] },
      { label: 'Sell concessions', fx: [['gold', 110], ['sup', 'capital', 5], ['corr', 3]] },
      { label: 'Let the diggers keep what they find', fx: [['sup', 'workers', 6], ['pop', 0.005], ['inflation', 3]] },
    ] });
  ev({ id: 'v_epidemic', tone: 'bad', theme: 'nature', title: 'Fever in the port', cd: 150,
    text: 'A ship from the south landed a sick stoker, and there are now three hundred cases in the dock quarter. The doctors want a cordon; the merchants say a cordon will ruin the season.',
    w: (n) => (n.nb[3] ? 1.2 : 0.4),
    opts: [
      { label: 'Close the port for six weeks', fx: [['mod', 'trade', -0.1, 4, 'Quarantine'], ['sup', 'capital', -5], ['sup', 'workers', 3]] },
      { label: 'Drains, clean water and a board of health', tip: 'It will not help this year. It will help every year after.', fx: [['gold', -90], ['mod', 'growth', 0.1, PERM, 'Public health'], ['pop', -0.003]] },
      { label: 'Keep the port open', fx: [['pop', -0.012], ['legitmod', -3, 12, 'The fever']] },
    ] });
  ev({ id: 'v_polar', tone: 'good', sfx: 'good', theme: 'crowd', title: 'They reached it', cd: 300, once: 1,
    text: 'A telegram from the end of the world: the expedition has planted the flag where nobody has stood before, and all but two of its members are coming home. The newspapers have put out special editions with black and gold borders.',
    w: (n) => (n.gold > 200 ? 0.7 : 0),
    opts: [
      { label: 'A state welcome', fx: [['glory', 6], ['legitmod', 3, 18, 'The expedition'], ['gold', -20]] },
      { label: 'Fund the next one, and a research institute', fx: [['gold', -70], ['mod', 'sci', 0.05, PERM, 'The polar institute'], ['glory', 4]] },
    ] });
  ev({ id: 'v_deserters', tone: 'mixed', theme: 'army', title: 'Men from across the line', cd: 110,
    text: 'Soldiers of a neighbouring army have been crossing the frontier in twos and threes with their rifles, asking for asylum. Their government demands them back as deserters. Some of them have families here.',
    w: (n, G) => (anyNb(G, n, (o) => o.nwars && o.we > 35 && !ID.atWar(G, n.id, o.id)) ? 1.8 : 0),
    opts: [
      { label: 'Asylum', fx: [['fn', (G, n) => { const o = anyNb(G, n, (x) => x.nwars && x.we > 35); if (o) ID.addOpBoth(G, n.id, o.id, -10); }], ['troops', 0.01], ['sup', 'intelligentsia', 3]] },
      { label: 'Intern them until the war ends', fx: [['gold', -15]] },
      { label: 'Send them back', fx: [['fn', (G, n) => { const o = anyNb(G, n, (x) => x.nwars && x.we > 35); if (o) ID.addOpBoth(G, n.id, o.id, 8); }], ['sup', 'intelligentsia', -4], ['sup', 'clergy', -3]] },
    ] });
  ev({ id: 'v_loan', tone: 'good', sfx: 'good', theme: 'money', title: 'The bankers call', cd: 120,
    text: 'A syndicate of foreign banks has offered a long loan on easy terms. Their only request is a seat for an “adviser” in the finance ministry, who will naturally have no powers.',
    w: (n) => (n.gold < 120 && n.debt < 400 ? 1.5 : 0),
    opts: [
      { label: 'Take the loan and the adviser', fx: [['gold', 220], ['debt', 200], ['sup', 'capital', 4], ['auth', -5]] },
      { label: 'Take half, with no adviser', fx: [['gold', 90], ['debt', 100]] },
      { label: 'Decline', fx: [['sup', 'workers', 2], ['legitmod', 2, 12, 'Nobody’s debtor']] },
    ] });
  ev({ id: 'v_minority', tone: 'mixed', theme: 'state', title: 'The language question', cd: 130,
    text: 'The people of the border districts want their children taught in their own language, their street signs in two alphabets and a clerk in the courthouse who understands them. The schoolmasters’ union is against it.',
    w: (n, G) => { let c = 0; for (let p = 1; p < G.provinces.length; p++) { const Pr = G.provinces[p]; if (Pr.owner === n.id && Pr.core !== n.id) c++; } return c ? 1.6 : 0; },
    opts: [
      { label: 'Grant it', fx: [['mod', 'unrest', -5, 48, 'Two languages'], ['sup', 'intelligentsia', 3], ['sup', 'military', -3]] },
      { label: 'One state, one language', fx: [['mod', 'unrest', 5, 36, 'The language law'], ['sup', 'military', 3], ['tradition', 2]] },
      { label: 'Schools yes, courts no', fx: [['mod', 'unrest', -2, 36, 'A half measure']] },
    ] });
  ev({ id: 'v_delegation', tone: 'good', sfx: 'good', theme: 'state', title: 'Visitors who came to learn', cd: 140,
    text: 'A delegation from a smaller country has spent a month touring our ministries, factories and barracks with notebooks. They would like to send their officers and engineers here to be trained, and to buy what they were shown.',
    w: (n, G) => (ID.rankOf && ID.rankOf(G, n, 'power') <= 6 ? 1 : 0.2),
    opts: [
      { label: 'Train them and sell to them', fx: [['gold', 70], ['opAll', 2], ['mod', 'trade', 0.04, 36, 'The foreign orders']] },
      { label: 'Train them for nothing; friends are worth more', fx: [['opAll', 5], ['glory', 2]] },
    ] });
  // session 10: the dispatches that still came round most often get more faces
  vary('bumper_harvest', [
    ['The granaries overflow', 'The co-operatives have run out of sacks and the railways out of wagons. In the south they are storing wheat in the temples.'],
    ['A year of plenty', 'The old men say they have not seen a harvest like it since they were boys. The price of bread has fallen for the first time in a decade.'],
  ]);
  vary('record_year', [
    ['The ledgers balance', 'For the first time in memory every ministry has spent less than it was given and every factory made more than it was asked. The finance minister has framed the accounts.'],
    ['Full order books', 'The steelworks have orders for three years ahead and are hiring in the villages. The newspapers call it a boom; the old bankers call it a warning.'],
  ]);
  vary('inventor', [
    ['A garage in the suburbs', 'Two brothers working in a garage have built a machine that the patent office cannot classify and the army wants to buy before anyone else sees it.'],
    ['The professor’s discovery', 'A professor at the provincial university has published a paper that the foreign journals are calling the most important of the decade. He would like a laboratory.'],
  ]);
  vary('foreign_capital', [
    ['The bankers from abroad', 'A consortium of foreign banks wants to finance a railway, a port and a power station, at interest and with a seat on the board of each.'],
    ['An offer from overseas', 'A foreign motor company wants to build its largest factory abroad here: ten thousand jobs, no taxes for twenty years, and the right to send its profits home.'],
  ]);
  vary('village_vs_factory', [
    ['The river turns black', 'The new tannery upstream has turned the river black, and the villages downstream have stopped drinking from it. The owner says he employs four hundred men.'],
    ['Smoke over the orchards', 'The smelter’s fumes have killed the orchards for five miles around. The orchard owners have sent a petition; the smelter’s workers have sent a bigger one.'],
  ]);
  vary('expert_report', [
    ['The auditors’ report', 'The auditors have found that a fifth of the state’s budget is spent on things nobody can identify. Their report recommends a commission to look into it.'],
  ]);
  // the harvest is seasonal: it may come round up to five times, each time later than the last (sim/events.js)
  for (const id of ['bumper_harvest', 'harvest_failure']) { const d = def(id); if (d) d.recur = 1; }
  // tones for the draw
  for (const d of E) if (d.id && d.id.indexOf('v_') === 0 && !d.theme) d.theme = 'misc';
})();
