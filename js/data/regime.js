/* IRON DIALECTIC — the regime: the people around the ruler and the meetings where the line is set.
   ID.REGIME.seats      the five seats of every inner circle (portfolio, faction it answers to, what it does)
   ID.REGIME.body[i]    what the circle and its session are called under each ideology, and seat titles
   ID.REGIME.lines[i]   the three lines a session can adopt: [id, name, desc, lean, mods, now, sig, ai]
                        mods hold while the line stands (channels as in sim/doctrine.js), now applies once,
                        sig moves the doctrine gauge every month, lean is the ideology the line leans toward.
   Engine in sim/regime.js. */
(function () {
  'use strict';
  const ID = (globalThis.ID = globalThis.ID || {});
  const R = (ID.REGIME = {});

  R.seats = {
    army: { name: 'Army', fac: 'military', desc: 'Attack and defence. A loyal army chief makes coups unlikely; a disloyal one makes them easy.' },
    police: { name: 'Security', fac: 'bureaucracy', desc: 'Unrest and opposition movements. Watches the others.' },
    economy: { name: 'Economy', fac: 'capital', desc: 'Industry and efficiency.' },
    ideology: { name: 'Ideology', fac: 'intelligentsia', desc: 'Legitimacy, and the doctrine gauge.' },
    foreign: { name: 'Foreign affairs', fac: 'intelligentsia', desc: 'Trade and revenue from abroad.' },
  };
  R.SEATS = ['army', 'police', 'economy', 'ideology', 'foreign'];

  /* [circle, session, every (months), seat titles army/police/economy/ideology/foreign, purge verb] */
  const B = (circle, session, every, t, purge) => ({ circle, session, every, t: { army: t[0], police: t[1], economy: t[2], ideology: t[3], foreign: t[4] }, purge });
  const PARTY = ['Commissar for Defence', 'Chief of the Organs', 'Chairman of the Plan', 'Secretary for Ideology', 'Commissar for Foreign Affairs'];
  const CAB = ['Minister of War', 'Minister of the Interior', 'Minister of Finance', 'Party Chairman', 'Foreign Minister'];
  const DEL = ['Commander of the Militias', 'Delegate for Public Safety', 'Delegate for Production', 'Editor of the People’s Press', 'Delegate for External Relations'];
  R.body = {
    ml: B('Political Bureau', 'Party Congress', 60, PARTY, 'purge'),
    trot: B('Revolutionary Council', 'Congress of the International', 48, ['Commissar for War', 'Chief of Revolutionary Security', 'Chairman of the Economic Council', 'Secretary of the International', 'Commissar for Foreign Affairs'], 'purge'),
    mao: B('Standing Committee', 'Plenum of the Central Committee', 48, ['Vice-Chairman for the Army', 'Director of Public Security', 'Head of the Planning Commission', 'Head of the Cultural Group', 'Foreign Minister'], 'purge'),
    cybernetic: B('Co-ordinating Board', 'Plan Revision', 48, ['Director of Defence Systems', 'Director of Data Integrity', 'Director of Production Flows', 'Director of Public Feedback', 'Director of External Exchange'], 'purge'),
    council: B('Presidium of the Councils', 'Congress of Councils', 36, DEL, 'recall'),
    ansyn: B('National Committee', 'Union Congress', 36, ['Secretary of the Defence Committees', 'Secretary for Public Safety', 'Secretary of the Industrial Federations', 'Editor of the Union Daily', 'Secretary for International Solidarity'], 'recall'),
    ancom: B('Federal Liaison Committee', 'Federal Assembly', 36, DEL, 'recall'),
    agrarian: B('Peasant Executive', 'Peasant Congress', 36, ['Commander of the Green Guard', 'Delegate for Order', 'Delegate for the Co-operatives', 'Editor of the Village Press', 'Delegate for Foreign Affairs'], 'recall'),
    marketsoc: B('Political Bureau', 'Party Congress', 60, ['Minister of Defence', 'Minister of State Security', 'Chairman of the Reform Commission', 'Head of Propaganda', 'Foreign Minister'], 'dismiss'),
    demsoc: B('Cabinet', 'Government Programme', 48, CAB, 'dismiss'),
    liberal: B('Cabinet', 'Government Programme', 48, ['Secretary of War', 'Attorney-General', 'Secretary of the Treasury', 'Party Chairman', 'Secretary of State'], 'dismiss'),
    socdem: B('Cabinet', 'Government Programme', 48, CAB, 'dismiss'),
    minarchy: B('Council of Freeholders', 'Annual Moot', 36, ['Captain of the Militia', 'High Sheriff', 'Keeper of the Accounts', 'Editor of the Freeholder', 'Envoy Abroad'], 'dismiss'),
    conmon: B('Privy Council', 'Speech from the Throne', 48, ['Minister of War', 'Home Secretary', 'Chancellor of the Exchequer', 'Leader of the House', 'Foreign Secretary'], 'dismiss'),
    merchant: B('Signoria', 'Great Council of the Houses', 48, ['Admiral of the Fleet', 'Head of the Council of Ten', 'Treasurer of the Houses', 'Chancellor of the Republic', 'First Ambassador'], 'dismiss'),
    absmon: B('Court', 'Imperial Council', 48, ['Minister of War', 'Chief of the Gendarmes', 'Minister of Finance', 'Procurator of the High Council of Priests', 'Chancellor'], 'disgrace'),
    theocracy: B('Council of the Learned', 'Assembly of the Learned', 48, ['Commander of the Guardians', 'Keeper of Morals', 'Keeper of the Treasury', 'Chief Jurist', 'Envoy of the Faithful'], 'disgrace'),
    junta: B('Junta', 'Junta in Session', 36, ['Chief of the General Staff', 'Director of Internal Security', 'Minister of the Economy', 'Minister of National Guidance', 'Foreign Minister'], 'purge'),
    corporatist: B('Grand Council', 'Grand Chamber', 48, ['Marshal of the Army', 'Chief of Police', 'Minister of Corporations', 'Party Secretary', 'Foreign Minister'], 'purge'),
    technocracy: B('Directorate', 'Directorate Review', 48, ['Director of Defence', 'Director of Public Order', 'Director of Production', 'Director of Statistics', 'Director of Foreign Trade'], 'dismiss'),
    personalist: B('Inner Circle', 'The Leader’s Address', 36, ['Commander of the Guard', 'Head of State Security', 'Minister of the Economy', 'Keeper of the Cult', 'Foreign Minister'], 'purge'),
    thirdpos: B('Revolutionary Command Council', 'Session of the Command Council', 36, ['Commander-in-Chief', 'Minister of the Interior', 'Minister of Industry', 'Minister of National Guidance', 'Foreign Minister'], 'dismiss'),
    pannat: B('Regional Command', 'Regional Congress', 48, ['Head of the Military Committee', 'Director of State Security', 'Minister of Planning', 'Secretary for Ideology', 'Foreign Minister'], 'purge'),
    revival: B('Council of Guardians', 'Assembly of Experts', 48, ['Commander of the Guard', 'Minister of Intelligence', 'Head of the Foundations', 'Leader of Friday Prayers', 'Foreign Minister'], 'disgrace'),
    juche: B('Political Bureau', 'Conference of the Party', 60, ['Minister of the People’s Armed Forces', 'Minister of State Security', 'Chairman of the State Planning Commission', 'Director of Propaganda and Agitation', 'Foreign Minister'], 'purge'),
    natsyn: B('National Council of the Movement', 'Congress of the Syndicates', 48, ['Chief of the Militias', 'Delegate for Public Order', 'National Delegate of the Syndicates', 'National Delegate for Propaganda', 'Foreign Minister'], 'purge'),
    technosoc: B('Network Presidium', 'Congress of the Network', 36, ['Commissar for Lightning War', 'Commissar for Signal Security', 'Chairman of the Automation Council', 'Director of the Broadcast', 'Commissar for World Revolution'], 'purge'),
    nrx: B('Board of Directors', 'Shareholders’ Meeting', 36, ['Director of Security Contracts', 'Director of Compliance', 'Chief Operating Officer', 'Chief Scientist', 'Director of External Markets'], 'dismiss'),
    natsoc: B('The Leader’s Circle', 'Party Rally', 36, ['Minister of War', 'Chief of the Political Police', 'Plenipotentiary for Rearmament', 'Minister of Propaganda', 'Foreign Minister'], 'purge'),
    nazacc: B('The Bunker', 'Situation Conference', 12, ['Chief of the Supreme Command', 'Chief of the Terror Apparatus', 'Minister of Destruction', 'Minister of Propaganda', 'Foreign Minister'], 'purge'),
    natpop: B('Movement Leadership', 'Party Rally', 36, ['Commander of the Legions', 'Chief of the Political Police', 'Minister of Economics', 'Chief of Propaganda', 'Foreign Minister'], 'purge'),
  };
  R.purgeName = { purge: 'Purge', recall: 'Recall', dismiss: 'Dismiss', disgrace: 'Disgrace' };
  R.purgeDesc = {
    purge: 'Arrest, trial, confession. The rest of the circle will be more careful; the country will be more afraid.',
    recall: 'The congress recalls the delegate. Nobody is shot; the seat goes to whoever the base sends next.',
    dismiss: 'A resignation is announced, for reasons of health. The seat goes to someone safer.',
    disgrace: 'Banished from court to an estate in the provinces. The family will not forgive it.',
  };

  /* lines: [id, name, desc, lean, mods, now, sig, ai(n,G)] */
  const L = (id, name, desc, lean, mods, now, sig, ai) => ({ id, name, desc, lean, mods, now: now || [], sig: sig || 0, ai: ai || (() => 1) });
  R.lines = {
    ml: [
      L('ml_plan', 'Fulfil the plan', 'The plan is law. Steel first, everything else after.', 'ml', { prod: 0.07, ls: -2 }, [['discipline', 5], ['sup', 'peasants', -4]], 0.3, (n) => 1.5),
      L('ml_course', 'The new course', 'Fewer slogans, more shoes. The consumer is also a worker.', 'marketsoc', { ls: 2, eff: 0.03, prod: 0.02 }, [['sup', 'workers', 5]], -0.25, (n) => (n.stab < 40 ? 2 : 0.7)),
      L('ml_vigil', 'Revolutionary vigilance', 'The class enemy grows more desperate as he loses. Tighten every screw.', 'personalist', { opp: -0.08, unrest: -3, coup: -0.2, legit: -2 }, [['grievance', 8]], 0.4, (n) => (n.sig < 40 ? 2 : 0.6)),
    ],
    trot: [
      L('tr_export', 'Export the revolution', 'Money, rifles and agitators for every party abroad that asks.', 'trot', { atk: 0.05, opp: 0.02 }, [['subvertNb', 10]], 0.5, (n) => (n.nwars ? 0.6 : 1.5)),
      L('tr_base', 'Build the base', 'A revolution needs factories. The world can wait a five-year plan.', 'ml', { prod: 0.06, stab: 2 }, [], -0.4, (n) => (n.stab < 40 ? 2 : 0.8)),
      L('tr_demo', 'Workers’ democracy', 'Open the councils to every platform. Let the argument be the revolution.', 'council', { legit: 3, eff: 0.02, auth: -0.1 }, [['particip', 8]], 0, () => 0.8),
    ],
    mao: [
      L('mz_politics', 'Politics in command', 'Red before expert. Every question is a political question.', 'mao', { def: 0.04, legit: 3, eff: -0.02 }, [['fervor', 8]], 0.6, () => 1.3),
      L('mz_readjust', 'Readjustment', 'Rest the communes, restore the private plots, count the grain honestly.', 'marketsoc', { food: 0.06, eff: 0.03 }, [['sup', 'peasants', 6]], -0.5, (n) => (n.foodBal < 1 ? 3 : 0.7)),
      L('mz_war', 'Prepare for war, prepare for famine', 'Dig tunnels deep, store grain everywhere, never seek hegemony.', 'mao', { def: 0.07, food: 0.03, ls: -1 }, [], 0.2, (n) => (n.a.threatened ? 2 : 0.6)),
    ],
    cybernetic: [
      L('cy_realtime', 'The real-time plan', 'Every factory reports every hour; every hour the plan learns.', 'cybernetic', { eff: 0.06 }, [], 0.3, () => 1.3),
      L('cy_terminals', 'The people’s terminals', 'Terminals in every workplace, and a button marked “disagree”.', 'council', { legit: 3, eff: 0.02 }, [['particip', 6]], 0.2, () => 0.8),
      L('cy_hardware', 'Hardware first', 'More machines, faster machines. The software can catch up.', 'technocracy', { sci: 0.1, prod: 0.02 }, [], -0.2, () => 0.8),
    ],
    council: [
      L('cc_base', 'All power to the base', 'Every decision goes back to the factory floor before it is final.', 'council', { stab: 2, def: 0.04, eff: -0.01 }, [['particip', 8], ['bureau', -6]], 0.5, () => 1.4),
      L('cc_commissars', 'A council of commissars', 'For the duration, a small committee decides and the congress ratifies.', 'ml', { eff: 0.05, prod: 0.03, auth: 0.15 }, [['particip', -6]], -0.5, (n) => (n.nwars ? 2 : 0.5)),
      L('cc_federate', 'Federate the producers', 'Industry councils plan their own branches and trade with each other.', 'ansyn', { prod: 0.04, trade: 0.05 }, [], 0.1, () => 0.9),
    ],
    ansyn: [
      L('as_union', 'One great union', 'Every trade in one federation and every federation in the union.', 'ansyn', { prod: 0.04, stab: 2 }, [], 0.4, () => 1.3),
      L('as_arm', 'Arm the federations', 'Every local its rifle rack and its drill night.', 'ansyn', { def: 0.07, regen: 0.15 }, [], 0.1, (n) => (n.a.threatened || n.nwars ? 2 : 0.6)),
      L('as_gov', 'A workers’ government', 'Just this once, the union takes the ministries.', 'council', { eff: 0.05, auth: 0.1 }, [['particip', -6]], -0.5, (n) => (n.stab < 35 ? 1.5 : 0.4)),
    ],
    ancom: [
      L('ax_free', 'Free communes', 'Every commune its own law, and the federation for what cannot be done alone.', 'ancom', { def: 0.06, stab: 2 }, [], 0.4, () => 1.3),
      L('ax_plan', 'Plan the commons', 'A common inventory of what the federation has and what it needs.', 'council', { eff: 0.05, prod: 0.03 }, [], -0.4, () => 0.8),
      L('ax_spread', 'Spread the commune', 'Delegates over every border with seed, rifles and pamphlets.', 'ancom', { legit: 2, opp: 0.02 }, [['subvertNb', 8]], 0.2, () => 0.8),
    ],
    agrarian: [
      L('ag_land', 'The land is ours', 'The village first, the town second, the state a distant third.', 'agrarian', { food: 0.07, prod: -0.02 }, [['sup', 'peasants', 6]], 0.4, () => 1.3),
      L('ag_factory', 'Village and factory', 'Machines for the fields, grain for the mills, a bargain with the towns.', 'socdem', { prod: 0.04, food: 0.02 }, [['sup', 'workers', 4]], -0.2, () => 1),
      L('ag_guard', 'The green guard', 'Every village a company, every company its own rifles.', 'agrarian', { def: 0.07, regen: 0.15 }, [], 0.1, (n) => (n.a.threatened ? 2 : 0.6)),
    ],
    marketsoc: [
      L('mk_open', 'Reform and opening', 'Let some get rich first. Open the coast to foreign money.', 'marketsoc', { trade: 0.1, prod: 0.04, unrest: 2 }, [], 0.4, () => 1.3),
      L('mk_stable', 'Stability above all', 'Nothing must be allowed to disturb the order that makes growth possible.', 'ml', { stab: 3, opp: -0.05, prod: 0.01 }, [], -0.3, (n) => (n.stab < 40 ? 2 : 0.7)),
      L('mk_common', 'Common prosperity', 'Growth has made millionaires. Now it must make the provinces rich too.', 'demsoc', { ls: 3, rev: -0.03 }, [['sup', 'workers', 6]], -0.1, () => 0.8),
    ],
    demsoc: [
      L('dm_deepen', 'Deepen the reforms', 'Nationalise the next sector, widen the welfare state, move faster than the opposition.', 'demsoc', { legit: 3, prod: -0.01 }, [['sup', 'workers', 6], ['sup', 'capital', -6]], 0.3, () => 1.2),
      L('dm_reassure', 'Consolidate and reassure', 'No new nationalisations this term. Tell the investors and the officers.', 'socdem', { conf: 8, stab: 2, coup: -0.15 }, [['sup', 'capital', 5], ['sup', 'workers', -3]], -0.2, (n) => (n.coupRisk > 0.005 ? 2 : 0.8)),
      L('dm_base', 'Mobilise the base', 'The unions, the neighbourhood committees and the cordons into the street.', 'council', { vote: 0.03, coup: 0.15 }, [['particip', 8]], 0.3, () => 0.7),
    ],
    liberal: [
      L('lb_sound', 'Sound money', 'Balance the budget, defend the currency, keep the state out of the way.', 'liberal', { conf: 8, rev: 0.03, ls: -1 }, [['inflation', -10]], 0.2, (n) => (n.inflation > 20 ? 2 : 1)),
      L('lb_square', 'A square deal', 'Regulate the trusts, protect the worker, give every family a fair shot.', 'socdem', { ls: 2, vote: 0.03, conf: -4 }, [['sup', 'workers', 5], ['sup', 'capital', -4]], 0.1, (n) => (n.fs.workers < 40 ? 2 : 0.8)),
      L('lb_order', 'Law and order', 'Strikes broken, agitators deported, the streets quiet for business.', 'conmon', { unrest: -3, opp: -0.05, legit: -1 }, [['sup', 'intelligentsia', -4]], -0.2, (n) => ((n.a.unrest || 0) > 25 ? 2 : 0.5)),
    ],
    socdem: [
      L('sd_home', 'The people’s home', 'Pensions, housing and schools: build the house everyone lives in.', 'socdem', { ls: 3, rev: -0.03 }, [], 0.3, () => 1.3),
      L('sd_modern', 'Modernise industry', 'Rationalise the firms, retrain the workers, let the weakest plants close.', 'liberal', { prod: 0.05, eff: 0.02 }, [['sup', 'workers', -3]], -0.1, () => 0.9),
      L('sd_econdem', 'Economic democracy', 'Wage-earner funds that buy the firms, slowly, for the people who work in them.', 'demsoc', { legit: 2, prod: 0.02 }, [['sup', 'capital', -6], ['sup', 'workers', 6]], 0.1, () => 0.7),
    ],
    minarchy: [
      L('mn_alone', 'Leave it alone', 'Nothing to report this year, which is the report.', 'minarchy', { growth: 0.1, trade: 0.06, rev: -0.04 }, [], 0.4, () => 1.3),
      L('mn_watch', 'A watchful state', 'A few more constables and a few more judges. Nothing more.', 'liberal', { unrest: -2, rev: 0.03 }, [], -0.3, (n) => ((n.a.unrest || 0) > 20 ? 2 : 0.6)),
      L('mn_free', 'Freeholders first', 'Every freeholder armed, every rifle registered to nobody.', 'minarchy', { def: 0.06, conf: 5 }, [], 0.2, (n) => (n.a.threatened ? 2 : 0.6)),
    ],
    conmon: [
      L('cm_crown', 'Crown and continuity', 'Nothing new under the throne, and that is the point.', 'conmon', { stab: 3, legit: 2 }, [['tradition', 6]], 0.3, () => 1.3),
      L('cm_reform', 'The reforming ministry', 'Votes for all, a pension for the old, a new navy for the sea.', 'liberal', { eff: 0.03, prod: 0.03, legit: -1 }, [['sup', 'workers', 4]], -0.2, () => 0.9),
      L('cm_national', 'A national government', 'Every party in one cabinet under the crown, for the emergency.', 'absmon', { auth: 0.15, unrest: -2, vote: -0.02 }, [], 0.1, (n) => (n.stab < 40 || n.nwars ? 2 : 0.4)),
    ],
    merchant: [
      L('me_open', 'Open water', 'Lower dues, fewer patrols, more ships.', 'merchant', { trade: 0.12, def: -0.03 }, [], 0.4, () => 1.3),
      L('me_convoy', 'Arm the convoys', 'Every merchantman its guns and every convoy its frigate.', 'merchant', { def: 0.06, atk: 0.03, rev: -0.03 }, [], 0.1, (n) => (n.a.threatened || n.nwars ? 2 : 0.5)),
      L('me_buy', 'Buy the neighbours', 'Loans to every court that might otherwise be hostile.', 'liberal', { stab: 1 }, [['gold', -100], ['opAll', 6]], 0, () => 0.8),
    ],
    absmon: [
      L('ab_unbound', 'Autocracy unbound', 'No assembly, no charter, no apologies. The sovereign’s word is law.', 'absmon', { auth: 0.25, unrest: -3, legit: -2 }, [], 0.5, () => 1.2),
      L('ab_concede', 'Concessions from above', 'A charter, a parliament with limited powers, a minister for the land question.', 'conmon', { legit: 3, stab: 2, auth: -0.15 }, [['sup', 'intelligentsia', 6]], -0.4, (n) => (n.stab < 35 ? 2 : 0.6)),
      L('ab_old', 'The old ways', 'The temple, the village commune and the nobility: what held for three centuries will hold.', 'theocracy', { stab: 2, sci: -0.05 }, [['tradition', 8]], 0.2, () => 0.9),
    ],
    theocracy: [
      L('th_pure', 'Purity of faith', 'The faithful must be guarded against every corruption.', 'theocracy', { unrest: -3, sci: -0.05 }, [], 0.5, () => 1.3),
      L('th_just', 'The just economy', 'Charity is a duty; usury a sin; the poor have a claim on the rich.', 'agrarian', { ls: 2, food: 0.04 }, [['sup', 'peasants', 4]], 0, () => 1),
      L('th_defend', 'Holy defence', 'The frontiers of the faith are its first duty.', 'theocracy', { def: 0.07, atk: 0.03 }, [], 0.2, (n) => (n.a.threatened || n.nwars ? 2 : 0.5)),
    ],
    junta: [
      L('ju_order', 'Order and progress', 'Roads, schools and discipline. Politics can wait for the next generation.', 'junta', { eff: 0.04, prod: 0.03, unrest: -2 }, [], 0.2, () => 1.3),
      L('ju_barracks', 'Prepare the return to barracks', 'A constitution, elections in three years, and an amnesty for the officers.', 'liberal', { legit: 4, coup: 0.2, auth: -0.15 }, [], -0.4, (n) => (n.age > 120 ? 1 : 0.2)),
      L('ju_crusade', 'The national holy war', 'The army will finish what the politicians lost.', 'natpop', { atk: 0.06, legit: 2, wePace: -0.1 }, [], 0.3, (n) => (n.claims && n.claims.length ? 1.5 : 0.6)),
    ],
    corporatist: [
      L('cp_autarky', 'Autarky', 'Everything the nation needs, made in the nation.', 'corporatist', { prod: 0.05, trade: -0.06 }, [], 0.3, () => 1.3),
      L('cp_share', 'Labour’s share', 'Higher wages, holiday camps and a seat in every chamber for the unions.', 'socdem', { ls: 2, stab: 2, prod: -0.01 }, [['sup', 'workers', 5]], 0.1, () => 0.9),
      L('cp_armed', 'The armed economy', 'Guns before butter, and the chambers will decide how much butter.', 'natpop', { atk: 0.04, prod: 0.03, ls: -2 }, [], 0.1, (n) => (n.a.threatened || n.nwars ? 2 : 0.6)),
    ],
    technocracy: [
      L('tc_opt', 'Optimise', 'Every process measured, every waste removed, every year a little better.', 'technocracy', { eff: 0.06 }, [], 0.3, () => 1.3),
      L('tc_science', 'Big science', 'Accelerators, observatories and a computing institute in every university.', 'cybernetic', { sci: 0.12, rev: -0.03 }, [], 0, () => 1),
      L('tc_account', 'Public accountability', 'Publish every forecast, and every mistake.', 'liberal', { legit: 4, eff: -0.01 }, [], -0.2, (n) => (n.legit < 40 ? 2 : 0.6)),
    ],
    personalist: [
      L('pe_glory', 'Glory to the Leader', 'A new statue in every town and a new title for the Leader.', 'personalist', { legit: 3, unrest: -2 }, [['charisma', 8]], 0.5, () => 1.3),
      L('pe_peace', 'The Leader’s peace', 'The Leader is tired of enemies. Let the country rest and be grateful.', 'conmon', { stab: 3, ls: 1 }, [], -0.3, (n) => (n.stab < 40 ? 2 : 0.6)),
      L('pe_fortress', 'The fortress nation', 'Enemies on every border; traitors behind every door. The nation must be a fortress.', 'personalist', { def: 0.08, trade: -0.08, coup: -0.2 }, [], 0.3, (n) => (n.a.threatened ? 2 : 0.8)),
    ],
    thirdpos: [
      L('tp_build', 'Build the nation', 'The dam, the steel mill and the fertiliser plant before anything else.', 'thirdpos', { prod: 0.05, ls: -1 }, [], 0.3, (n) => (n.tech.ind < 5 ? 1.6 : 0.8)),
      L('tp_neutral', 'Positive neutrality', 'Take aid from both blocs, sign nothing with either.', 'thirdpos', { trade: 0.06, legit: 2 }, [['gold', 60]], 0.5, (n) => (n.bloc ? 0.3 : 1.4)),
      L('tp_west', 'The open door', 'Foreign capital back in, the chambers loosened, the officers richer.', 'liberal', { conf: 6, prod: 0.03, legit: -2 }, [['sup', 'capital', 8]], -0.6, (n) => (n.gold < 50 ? 1.6 : 0.5)),
    ],
    pannat: [
      L('pn_union_line', 'Union now', 'Every resource of the party for unity with the brother states.', 'pannat', { legit: 3, trade: -0.03 }, [], 0.6, () => 1.2),
      L('pn_region', 'The region first', 'Build the party at home before exporting it; the brother capitals can wait.', 'junta', { stab: 3, prod: 0.03 }, [], -0.2, (n) => (n.stab < 45 ? 1.8 : 0.7)),
      L('pn_iron', 'The iron hand', 'Informers in every block, the other wing in prison, the army watched by the party and the party by the army.', 'personalist', { unrest: -4, coup: -0.25, legit: -2 }, [['grievance', 8]], 0.2, (n) => (n.coupRisk > 0.005 ? 2 : 0.6)),
    ],
    revival: [
      L('rv_export', 'Export the revolution', 'Our revolution is the beginning of a world revolution of the oppressed.', 'revival', { legit: 2, trade: -0.05 }, [], 0.6, () => 1.1),
      L('rv_govern', 'Govern the republic', 'Ministries, budgets and roads: a revolution must also run the buses.', 'theocracy', { stab: 3, eff: 0.03 }, [], -0.4, (n) => (n.stab < 45 ? 1.8 : 0.7)),
      L('rv_war', 'The sacred defence', 'Every family gives a son; every street is named for a martyr.', 'revival', { def: 0.08, wePace: -0.3, ls: -2 }, [['fervor', 8]], 0.4, (n) => (n.nwars ? 2 : 0.4)),
    ],
    natpop: [
      L('np_march', 'The march goes on', 'The movement must keep moving or it dies.', 'natpop', { atk: 0.06, legit: 2, ls: -1 }, [], 0.6, () => 1.3),
      L('np_community', 'The people’s community', 'Holidays, cheap radios and a car promised to every family.', 'corporatist', { ls: 2, stab: 2 }, [], -0.3, (n) => (n.stab < 40 ? 2 : 0.7)),
      L('np_purify', 'Purify the nation', 'Name the enemy within, and remove him.', 'natpop', { unrest: -3, opp: -0.06, trade: -0.05 }, [['grievance', 10]], 0.4, () => 0.7),
    ],
    juche: [
      L('jc_self', 'Self-reliance in all things', 'Build everything ourselves, however long it takes and whatever it costs.', 'juche', { def: 0.04, trade: -0.06, legit: 2 }, [], 0.5, () => 1.3),
      L('jc_army', 'The army first', 'The army is the party, the people and the state.', 'junta', { atk: 0.06, coup: -0.2, ls: -2 }, [['sup', 'military', 8]], 0.2, (n) => (n.nwars || n.a.threatened ? 2 : 0.8)),
      L('jc_zones', 'The special zones', 'A fenced coastal city where foreign firms may build, and nobody else may go.', 'marketsoc', { trade: 0.06, prod: 0.03, legit: -2 }, [['gold', 60]], -0.6, (n) => (n.ls < 35 ? 1.6 : 0.4)),
    ],
    technosoc: [
      L('ts_faster', 'Faster', 'Every resource for the broadcast and the brigades: the revolution must reach the next country before the last one cools.', 'technosoc', { atk: 0.05, sci: 0.05, ls: -1 }, [], 0.8, () => 1.4),
      L('ts_build', 'Build the machine', 'Automate at home first; a richer revolution will spread itself.', 'cybernetic', { prod: 0.05, eff: 0.03 }, [], -0.4, (n) => (n.stab < 45 ? 1.6 : 0.6)),
      L('ts_apparatus', 'Discipline the network', 'Unify the wires under one centre and one line.', 'ml', { stab: 3, coup: -0.2 }, [['bureau', 8]], -0.3, (n) => (n.coupRisk > 0.005 ? 1.6 : 0.4)),
    ],
    nrx: [
      L('nx_curve', 'Up and to the right', 'Every quarter faster than the last, whatever it costs anyone.', 'nrx', { prod: 0.05, sci: 0.05, unrest: 2 }, [], 0.8, () => 1.4),
      L('nx_patch', 'The patchwork', 'Let every city become its own company and compete for residents.', 'minarchy', { trade: 0.06, auth: -0.1 }, [], 0.2, () => 0.8),
      L('nx_ceo', 'The chief executive rules', 'One will, one vision, no committee.', 'personalist', { auth: 0.15, coup: -0.15, legit: -2 }, [], 0.2, (n) => (n.stab < 40 ? 1.8 : 0.6)),
    ],
    natsoc: [
      L('ns_guns', 'Guns before butter', 'Every factory converted, every budget line turned to the army.', 'natsoc', { atk: 0.06, ls: -2 }, [], 0.25, () => 1.3),
      L('ns_party', 'The party above the state', 'The movement’s own men in every ministry, every court and every barracks.', 'natsoc', { coup: -0.25, unrest: -2 }, [['grievance', 6]], 0.2, (n) => (n.coupRisk > 0.004 ? 1.8 : 0.8)),
      L('ns_respect', 'Respectability', 'The industrialists and the generals reassured: the revolution is over.', 'corporatist', { stab: 3, conf: 6 }, [['sup', 'capital', 8], ['sup', 'military', 6]], -0.6, (n) => (n.stab < 40 ? 1.6 : 0.5)),
    ],
    nazacc: [
      L('nz_fire', 'Total destruction', 'There will be nothing left for the victors.', 'nazacc', { atk: 0.08, prod: -0.05 }, [], 1.0, () => 1.5),
      L('nz_hold', 'Hold every metre', 'No retreat anywhere, for any reason.', 'nazacc', { def: 0.1, regen: -0.1 }, [], 0.6, (n) => (n.a.losing ? 2 : 0.7)),
      L('nz_terms', 'Feel for terms', 'A few officers make quiet contact with the enemy through a neutral embassy.', 'junta', { stab: 2 }, [], -1.0, (n) => (n.we > 70 ? 1.5 : 0.2)),
    ],
    natsyn: [
      L('ns_pending', 'The pending revolution', 'Land, banks and syndicates: finish what the movement promised.', 'natsyn', { prod: 0.03, legit: 2 }, [['sup', 'capital', -6], ['sup', 'workers', 4]], 0.5, () => 1.2),
      L('ns_order', 'Order and the employers', 'Shelve the revolution and let the industrialists run the syndicates in peace.', 'corporatist', { stab: 3, conf: 6 }, [['sup', 'capital', 8], ['sup', 'workers', -6]], -0.5, (n) => (n.gold < 50 ? 1.6 : 0.6)),
      L('ns_empire', 'The will to empire', 'A people of producers needs room: the squads become regiments.', 'natsyn', { atk: 0.06, trade: -0.04 }, [], 0.3, (n) => (n.nwars ? 1.8 : 0.7)),
    ],
  };
})();
