/* IRON DIALECTIC — names, scenarios, starting situations, challenges. */
(function () {
  'use strict';
  const ID = (globalThis.ID = globalThis.ID || {});

  const PRE = ['Val', 'Kor', 'Ast', 'Bel', 'Dor', 'Eld', 'Fen', 'Gal', 'Hal', 'Ist', 'Jor', 'Kal', 'Lor', 'Mar', 'Nor', 'Ost', 'Par', 'Quel', 'Rov', 'Sar', 'Tal', 'Ul', 'Ver', 'Wes', 'Yar', 'Zel', 'Ard', 'Bry', 'Cal', 'Dra', 'Est', 'Fal', 'Gor', 'Hes', 'Ir', 'Kes', 'Lun', 'Mor', 'Nev', 'Or', 'Pol', 'Rhen', 'Sel', 'Tor', 'Um', 'Vos', 'Zar', 'Cas', 'Tes', 'Aur'];
  const MID = ['', '', 'a', 'e', 'o', 'an', 'en', 'or', 'ar', 'el', 'ov', 'is', 'im', 'ad'];
  const SUF = [['ia', 'ian'], ['ia', 'ian'], ['ia', 'ian'], ['mark', 'markish'], ['ovia', 'ovian'], ['ar', 'ari'], ['on', 'onian'], ['heim', 'heimer'], ['or', 'orian'], ['ene', 'enian'], ['una', 'unan'], ['ara', 'aran'], ['esh', 'eshi'], ['ay', 'ayan'], ['ica', 'ican'], ['und', 'undian'], ['ava', 'avan'], ['is', 'isian']];
  ID.genName = (rng, used) => {
    for (let t = 0; t < 50; t++) {
      const s = rng.pick(SUF);
      let stem = rng.pick(PRE) + rng.pick(MID);
      if (/[aeiou]$/.test(stem) && /^[aeiou]/.test(s[0])) stem = stem.slice(0, -1);
      const base = stem + s[0];
      if (base.length < 5 || base.length > 10 || used.has(base) || /(.)\1\1/.test(base) || /[aeiou]{3}/.test(base)) continue;
      used.add(base);
      return { base, adj: stem + s[1] };
    }
    const b = 'Terra' + used.size; used.add(b); return { base: b, adj: b + 'n' };
  };

  const FIRST = ['Aldric', 'Benno', 'Casimir', 'Dario', 'Emil', 'Farid', 'Gregor', 'Henrik', 'Ilya', 'Joren', 'Kemal', 'Lucan', 'Marek', 'Nadir', 'Oskar', 'Pavel', 'Quint', 'Rurik', 'Stefan', 'Tomas', 'Ulric', 'Viktor', 'Yusuf', 'Zoran', 'Anya', 'Brisa', 'Celia', 'Dara', 'Elin', 'Freya', 'Greta', 'Hana', 'Irena', 'Jana', 'Katya', 'Lena', 'Mira', 'Nora', 'Olga', 'Petra', 'Rosa', 'Sana', 'Tilda', 'Vera'];
  const LAST = ['Varga', 'Kessler', 'Dorn', 'Halloran', 'Ivanek', 'Morrow', 'Castell', 'Brandt', 'Orlov', 'Sabine', 'Tarrant', 'Veld', 'Arkady', 'Lindqvist', 'Montague', 'Navarro', 'Okoro', 'Petrescu', 'Rahimi', 'Sokol', 'Tanaka', 'Ueda', 'Volkov', 'Weiss', 'Yilmaz', 'Zamora', 'Achebe', 'Barros', 'Chen', 'Dimitrov', 'Estrada', 'Falk', 'Grau', 'Hoxha', 'Ito', 'Jansen'];
  const TITLES = {
    ml: 'General Secretary', trot: 'Chairman of the Council of Commissars', council: 'Speaker of the Congress', mao: 'Chairman', marketsoc: 'Premier', demsoc: 'Prime Minister',
    ansyn: 'Federation Secretary', ancom: 'Rotating Delegate', liberal: 'President', socdem: 'Chancellor', minarchy: 'First Citizen', conmon: 'Monarch', absmon: 'Emperor',
    theocracy: 'Supreme Guardian', agrarian: 'Elder of the Assembly', junta: 'General', corporatist: 'Head of Government', technocracy: 'Director-General', personalist: 'The Leader',
    merchant: 'Doge', cybernetic: 'Chief Co-ordinator', natpop: 'The Tribune', thirdpos: 'Chairman of the Command Council', pannat: 'Secretary of the Regional Command', revival: 'Guide of the Revolution',
    juche: 'Great Leader', natsyn: 'National Chief', technosoc: 'Chairman of the Network', nrx: 'Chief Executive', ancap: 'Chair of Arbitration', natsoc: 'Führer', nazacc: 'Führer',
  };
  ID.genLeader = (rng, ideo) => ({ name: rng.pick(FIRST) + ' ' + rng.pick(LAST), age: rng.int(38, 62), title: TITLES[ideo] || 'Head of State', traits: ID.rollTraits ? ID.rollTraits(rng, ideo) : [] });
  /* the sum of a leader's AI leanings: agg (war appetite), peace (willingness to settle), reform, purge */
  ID.leaderLean = (n, k) => { let s = 0; for (const t of (n.leader && n.leader.traits) || []) { const T = ID.TRAITS && ID.TRAITS[t]; if (T && T.ai && T.ai[k]) s += T.ai[k]; } return s; };
  ID.leaderTitle = (ideo) => TITLES[ideo] || 'Head of State';
  ID.nationTitle = (n, ideo) => ID.IDEOLOGIES[ideo].title.replace('{N}', n.base).replace('{A}', n.adj);

  /* Starting situations. diff 1..5 is shown as a rating on the nation picker. */
  ID.SITUATIONS = {
    great: { name: 'Great power', diff: 2, text: 'Large, stable and watched by everyone. Your problems are the ones success brings.' },
    sick: { name: 'Sick empire', diff: 4, text: 'Vast and rotten. Restless provinces, a corrupt administration, and neighbours measuring the corpse.' },
    rich: { name: 'Rich and divided', diff: 3, text: 'Factories, banks and a class war simmering in every city.' },
    small: { name: 'Small and threatened', diff: 4, text: 'A minor state beside a hungry one. Survival will take diplomacy before it takes arms.' },
    backwater: { name: 'Agrarian backwater', diff: 3, text: 'Wide fields, few factories, old loyalties. Modernise and risk the order — or don’t, and risk the border.' },
    revolution: { name: 'Young revolution', diff: 5, text: 'The old regime fell last year. Fervour is high, the treasury empty, and every neighbour wants you strangled in the cradle.' },
    trader: { name: 'Trading state', diff: 2, text: 'Ports, ships and money. Rich for your size and dependent on open seas.' },
    middling: { name: 'Middle power', diff: 3, text: 'Neither prey nor predator, yet.' },
  };

  /* Handcrafted scenario. Coordinates are fractions of the map. The world of 1910 was first drawn on a
     384×216 map with two continents; the Old Lands were added below it, so the map grew to 384×288. The first
     two continents keep their tiles: their y values are scaled by 216/288 and the noise is scaled to the old
     height (noiseH). Saves made on the old map rebuild it from the legacy layout (ID.mapOpts). */
  const TWO = [[0.22, 0.34, 0.165], [0.15, 0.55, 0.12], [0.30, 0.53, 0.11], [0.25, 0.73, 0.09], [0.17, 0.2, 0.07],
        [0.63, 0.29, 0.17], [0.76, 0.43, 0.15], [0.68, 0.61, 0.125], [0.86, 0.27, 0.09], [0.55, 0.42, 0.07],
        [0.48, 0.81, 0.095], [0.585, 0.85, 0.075], [0.44, 0.335, 0.036], [0.455, 0.47, 0.04], [0.41, 0.17, 0.04], [0.905, 0.7, 0.06], [0.065, 0.78, 0.04], [0.37, 0.9, 0.035]];
  const Y = 216 / 288;
  const OLD_LANDS = [[0.40, 0.815, 0.085], [0.52, 0.855, 0.085], [0.63, 0.84, 0.075], [0.49, 0.915, 0.09], [0.215, 0.875, 0.085], [0.30, 0.865, 0.06], [0.335, 0.815, 0.04], [0.57, 0.80, 0.045]];
  ID.SCENARIOS = {
    meridia: {
      id: 'meridia', name: 'The Three Continents, 1910', seed: 19100101, size: 'hist', noiseH: 216, land: 0.335,
      desc: 'A handcrafted world: old Aurelia and its rivals in the west, the young Karsovan republic and the eastern powers across the Lysian straits, new states in the south, and below them the Old Lands, an empire’s last provinces with oil under the sand.',
      blobs: TWO.map((b) => [b[0], b[1] * Y, b[2]]).concat(OLD_LANDS), legacy: TWO,
      nations: [
        { base: 'Aurelia', adj: 'Aurelian', ideo: 'absmon', x: 0.22, y: 0.27, w: 1.7, sit: 'sick', blurb: 'The oldest throne in the west. Devout, enormous, and three bad harvests from revolution.' },
        { base: 'Cassine', adj: 'Cassinese', ideo: 'liberal', x: 0.31, y: 0.4125, w: 0.95, sit: 'rich', blurb: 'Banks, mills and a parliament. The richest state on the continent and the most divided.', tutorial: 1 },
        { base: 'Norvik', adj: 'Norvish', ideo: 'conmon', x: 0.165, y: 0.1575, w: 0.9, sit: 'middling', blurb: 'A cautious northern kingdom with a parliament, a navy and a long memory.' },
        { base: 'Tessaly', adj: 'Tessalian', ideo: 'socdem', x: 0.13, y: 0.42, w: 0.85, sit: 'middling', blurb: 'A small republic that has bought social peace and would like to keep it.' },
        { base: 'Verano', adj: 'Veranese', ideo: 'ansyn', x: 0.25, y: 0.555, w: 0.6, sit: 'revolution', blurb: 'The unions took the factories last spring. Nobody has yet come to take them back.' },
        { base: 'Drava', adj: 'Dravan', ideo: 'junta', x: 0.33, y: 0.3, w: 0.8, sit: 'small', blurb: 'Colonels who promised order and now need a victory to prove it.' },
        { base: 'Lys', adj: 'Lysian', ideo: 'merchant', x: 0.445, y: 0.255, w: 0.5, sit: 'trader', blurb: 'The houses of Lys hold the straits between two continents and charge for the view.' },
        { base: 'Karsova', adj: 'Karsovan', ideo: 'ml', x: 0.63, y: 0.2025, w: 1.5, sit: 'revolution', blurb: 'The first state to call itself a workers’ republic. Encircled, planned, and in a hurry.' },
        { base: 'Ruthe', adj: 'Ruthene', ideo: 'natpop', x: 0.535, y: 0.315, w: 0.7, sit: 'small', blurb: 'A movement in power, with a map of everything it believes was stolen.' },
        { base: 'Suyan', adj: 'Suyanese', ideo: 'agrarian', x: 0.78, y: 0.3375, w: 1.2, sit: 'backwater', blurb: 'Ten thousand villages that have outlasted every dynasty and intend to outlast the factories.' },
        { base: 'Hesperia', adj: 'Hesperian', ideo: 'corporatist', x: 0.69, y: 0.465, w: 1.0, sit: 'great', blurb: 'Labour and capital marched into the same chamber. The chamber faces outward.' },
        { base: 'Irkal', adj: 'Irkali', ideo: 'theocracy', x: 0.86, y: 0.2025, w: 0.8, sit: 'backwater', blurb: 'The guardians rule by revelation and regard the Karsovan border as the edge of the world.' },
        { base: 'Pavon', adj: 'Pavonian', ideo: 'personalist', x: 0.66, y: 0.33, w: 0.8, sit: 'middling', blurb: 'One marshal, one portrait in every office, and no plan for the day after.' },
        { base: 'Meridia', adj: 'Meridian', ideo: 'technocracy', x: 0.48, y: 0.6, w: 0.9, sit: 'middling', blurb: 'A southern republic handed to its engineers. It works, so far.' },
        { base: 'Antara', adj: 'Antaran', ideo: 'demsoc', x: 0.59, y: 0.6375, w: 0.7, sit: 'small', blurb: 'An elected socialist government, a hostile officer corps, and foreign money in the opposition press.' },
        { base: 'Kelda', adj: 'Keldan', ideo: 'minarchy', x: 0.905, y: 0.525, w: 0.6, sit: 'trader', blurb: 'An island of freeholders with almost no government and no intention of acquiring one.' },
        { base: 'Vess', adj: 'Vessian', ideo: 'council', x: 0.41, y: 0.1275, w: 0.5, sit: 'revolution', blurb: 'A northern island run by its dockers’ and miners’ councils. The mainland calls it a mutiny.' },
        // the Old Lands (oldlands.js has their national content). over/dep: their overlord in 1910.
        { base: 'Varanth', adj: 'Varanthine', ideo: 'absmon', x: 0.40, y: 0.815, w: 1.45, sit: 'sick', region: 'old', blurb: 'Six centuries of empire, four hundred years of decline and one sultan who reads the foreign newspapers. Its creditors already hold the customs.' },
        { base: 'Baskhar', adj: 'Baskhari', ideo: 'absmon', x: 0.53, y: 0.86, w: 0.9, sit: 'backwater', region: 'old', over: 'Varanth', dep: 'vilayet', blurb: 'Three provinces between two rivers, ruled from Varanth by a governor who has never seen the marshes. Under the marshes: oil.' },
        { base: 'Amaran', adj: 'Amarani', ideo: 'agrarian', x: 0.295, y: 0.875, w: 0.55, sit: 'backwater', region: 'old', over: 'Varanth', dep: 'vilayet', blurb: 'Olive terraces, holy cities and a land that two peoples will each come to call the only one they have.' },
        { base: 'Tyrrha', adj: 'Tyrrhan', ideo: 'merchant', x: 0.335, y: 0.812, w: 0.35, sit: 'trader', region: 'old', over: 'Varanth', dep: 'vilayet', blurb: 'A mountain and a harbour shared by seventeen confessions, each with its own bank, its own militia and its own foreign friend.' },
        { base: 'Khemra', adj: 'Khemran', ideo: 'conmon', x: 0.215, y: 0.875, w: 0.95, sit: 'middling', region: 'old', over: 'Norvik', dep: 'protectorate', blurb: 'Twelve million people on a ribbon of river, a khedive in a palace, and a Norvish Resident in the building across the square who decides everything.' },
        { base: 'Sahrem', adj: 'Sahremi', ideo: 'theocracy', x: 0.49, y: 0.92, w: 1.0, sit: 'backwater', region: 'old', blurb: 'An emir, his preachers and a desert nobody else wants. Nobody else wants it yet.' },
        { base: 'Zandar', adj: 'Zandari', ideo: 'conmon', x: 0.63, y: 0.835, w: 0.85, sit: 'sick', region: 'old', blurb: 'A shah, a new parliament, and a Norvish company with a sixty-year concession for everything under the ground.' },
      ],
    },
  };

  /* Unlockable challenges. unlock(meta) -> bool. */
  ID.CHALLENGES = [
    { id: 'besieged', name: 'The Besieged Commune', desc: 'Play Verano, the syndicalist union, on Dialectic difficulty with every neighbour already hostile.',
      hint: 'Finish any campaign, win or lose.', unlock: (m) => m.runs.length >= 1,
      setup: { scenario: 'meridia', nation: 'Verano', difficulty: 'dialectic', hostile: 1 } },
    { id: 'lastemperor', name: 'The Last Emperor', desc: 'Aurelia with an ailing monarch, stability at 30 and an empty treasury.',
      hint: 'Suffer one collapse.', unlock: (m) => m.runs.some((r) => r.result === 'defeat'),
      setup: { scenario: 'meridia', nation: 'Aurelia', difficulty: 'iron', frail: 1 } },
    { id: 'onecountry', name: 'Socialism in One Country', desc: 'Karsova under total embargo: no trade treaties are possible for the first fifteen years.',
      hint: 'Survive until 1930 in any campaign.', unlock: (m) => m.runs.some((r) => r.year >= 1930),
      setup: { scenario: 'meridia', nation: 'Karsova', difficulty: 'iron', embargo: 1 } },
    { id: 'blackmonday', name: 'Black Monday', desc: 'Kelda, the night-watchman island, with the Great Depression arriving in your first year.',
      hint: 'Reach the Age of Masses (1925).', unlock: (m) => m.runs.some((r) => r.year >= 1925),
      setup: { scenario: 'meridia', nation: 'Kelda', difficulty: 'iron', earlyDepression: 1 } },
    { id: 'worldonfire', name: 'World on Fire', desc: 'A random world that begins in 1940, in the Age of Total War, with every state armed and aggressive.',
      hint: 'Win a civil war, or survive until 1950.', unlock: (m) => m.runs.some((r) => r.year >= 1950 || r.civilWarsWon > 0),
      setup: { scenario: 'random', difficulty: 'iron', startYear: 1940 } },
    { id: 'ironman', name: 'No Second Drafts', desc: 'A random world on Dialectic with manual saving disabled. The autosave is the only record.',
      hint: 'Win any victory.', unlock: (m) => m.runs.some((r) => r.result === 'victory'),
      setup: { scenario: 'random', difficulty: 'dialectic', ironman: 1 } },
  ];

  /* Weights for starting ideologies in random worlds. */
  ID.START_WEIGHTS = { ancap: 0.25, absmon: 3, conmon: 3, liberal: 3, junta: 2, theocracy: 1.5, agrarian: 1.5, socdem: 1.5, personalist: 1.5, merchant: 1, corporatist: 1, natpop: 1, ml: 1.1, demsoc: 0.8, minarchy: 0.7, technocracy: 0.6, ansyn: 0.6, mao: 0.6, council: 0.5, trot: 0.5, marketsoc: 0.5, ancom: 0.4, cybernetic: 0.3, thirdpos: 0.7, pannat: 0.5, revival: 0.4, juche: 0.3, natsyn: 0.6, technosoc: 0.15, nrx: 0.15, natsoc: 0.4, nazacc: 0 };
  ID.SIT_FOR = {
    absmon: ['sick', 'backwater', 'great'], conmon: ['great', 'middling', 'trader'], liberal: ['rich', 'great', 'trader'], junta: ['small', 'middling', 'great'],
    theocracy: ['backwater', 'middling'], agrarian: ['backwater', 'small'], socdem: ['rich', 'middling'], personalist: ['middling', 'sick', 'great'], merchant: ['trader'],
    corporatist: ['great', 'middling'], natpop: ['small', 'middling'], ml: ['revolution', 'great'], demsoc: ['small', 'rich'], minarchy: ['trader', 'small'], technocracy: ['middling', 'rich'],
    ansyn: ['revolution', 'small'], mao: ['revolution', 'backwater'], council: ['revolution', 'small'], trot: ['revolution'], marketsoc: ['middling', 'rich'], ancom: ['revolution', 'small'], cybernetic: ['middling', 'rich'],
    thirdpos: ['middling', 'backwater', 'revolution'], pannat: ['revolution', 'middling'], revival: ['revolution', 'backwater'],
    juche: ['revolution', 'backwater', 'small'], natsyn: ['middling', 'small'], technosoc: ['revolution', 'middling'], nrx: ['rich', 'trader'], ancap: ['trader', 'rich', 'small'], natsoc: ['great', 'middling'], nazacc: ['great'],
  };
})();
