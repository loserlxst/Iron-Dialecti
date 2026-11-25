/* IRON DIALECTIC — patch notes shown from the title menu (ui/screens.js, acts.patchNotes). Newest first. */
(function () {
  'use strict';
  const ID = (globalThis.ID = globalThis.ID || {});
  ID.PATCH_NOTES = [
    { date: '25 November 2026', title: 'The treasury tells the truth, and the world keeps to itself', items: [
      'Fixed: the monthly balance on the top band only counted taxes and the budget. Oil money, concessions abroad, tribute paid and received, payments from dependencies, repairs, loans and debt repayments now count too, so the number matches what your treasury really does. The Treasury tooltip lists each of them.',
      'The world is now self-contained. Dispatches, programmes and stories no longer mention real countries, peoples, cities or religions: the faithful pray in temples and shrines, the comparisons are to Tessaly and Norvik, and borrowed foreign titles are gone.',
    ] },
    { date: '25 November 2026', title: 'Prisoners, and smaller fixes', items: [
      'Troops taken prisoner in a pocket are now held until the peace, and six in ten of them come home when it is signed.',
      'States that have settled an island keep expanding into their own hinterland at the same time.',
      'Under Anarcho-Capitalism, a province is only reported as leaving when it actually leaves.',
      'A coup that was under way in an older save is fought out under the new rules when you load it.',
    ] },
    { date: '25 November 2026', title: 'Settling empty islands', items: [
      'Empty islands no longer stay empty. Any state with a port can send a settling expedition by sea: settlers and some troops, for gold and a few weeks at sea. They found a beachhead and claim the land around it.',
      'Select an unclaimed coast and press Settle: the cost and the travel time are on the button.',
      'Colonies are supplied through their beach and later through a port. In a war they can be cut off like any other pocket.',
      'Merchant republics, monarchies and liberal states settle most, mostly in the early decades. Revolutionary and anti-colonial systems rarely or never do.',
      'Two states racing for the same island do not like each other much afterwards. The World Dispatch reports new colonies, and you hear when a rival plants its flag near you.',
    ] },
    { date: '25 November 2026', title: 'A new system: Anarcho-Capitalism', items: [
      'No state at all. Defence, courts and roads are bought from competing private agencies, and the members’ fees are whatever the agencies charge: you never set a tax.',
      'Competition between the agencies keeps protection cheap and the economy efficient, and thin when war comes. Let one agency take over the market and it becomes strong, expensive, and in the end the state itself.',
      'Every soldier is a hired company. They fight hard for cities and home ground while they are paid, and walk away when the money runs out.',
      'Land is property. Buy a border province from a neighbour that needs the money, with no war at all. But your own unhappy provinces can leave for a neighbour, and nobody may stop them.',
      'You can also buy your way out of a war. No taxes, no conscription, no public works and no rule by decree.',
      'It has its own programmes, inner circle, dispatches, a destiny (The Free Covenant) with a tree after it, and roads in from Minarchism and NRX and out to a junta or a corporation. It can rise as a hard-right revolt in a market crash.',
    ] },
    { date: '25 November 2026', title: 'Coups, rebuilt', items: [
      'A coup now needs plotters, and the game tells you who they are: the army, a member of your inner circle, a foreign power paying one of them, or bankers hiring officers.',
      'A content army (military support 60 or more) no longer stages coups of its own. If you are overthrown with a happy army, it was someone else, and the dispatch names them.',
      'Plots build up over months: grumbling, then meetings, then a date. Your security services can find them at each stage, and you can purge, buy off, reassign units, arrest or concede. Under civil liberties with little money for security, a coup can still come without warning, and the game says that is why.',
      'The coup itself is fought out over several days: the garrison, the radio, the palace and the regiments outside the city. You choose how to meet it (call in loyal regiments, arm the workers, negotiate, flee) and how to spend the second night.',
      'The odds you are shown are the exact odds, with every reason behind them, and they are the odds that are rolled.',
      'Losing a coup no longer ends the campaign. Fight on from the provinces, go into exile and try a counter-coup later, or serve the new regime. You can still accept defeat if you want to.',
    ] },
    { date: '25 November 2026', title: 'Encirclement', items: [
      'Troops in a pocket now belong to that pocket. A landing or a cut-off salient fights with what it has; the enemy’s home army can no longer feed it across your country.',
      'A landing is supplied over its beach for about four months. After that it needs a captured port. Take its beach, its port or its whole coast, or bring a navy three times stronger than theirs, and it is cut off.',
      'Reinforcements reach a pocket only by sea, a limited number a day (more through its ports and with a strong navy). You can see them sailing as boats.',
      'An encircled pocket cannot advance. It loses men and nerve every day, can only try to break out toward its own lines, and surrenders when the countdown runs out. The side that holds the ring takes prisoners and glory, and pays a little war weariness while the pocket holds.',
      'In the Supply map mode, encircled pockets have a red outline with their troops and the days left. Alerts warn you when enemy troops are encircled, and when your own army is, you decide: fight out, hold for relief, or surrender on terms.',
      'The AI goes for the beach or port of a landing on its soil, tries to relieve its own pockets, and keeps its fronts broader instead of driving thin salients.',
    ] },
    { date: '24 November 2026', title: 'Small things and fixes', items: [
      'The dev console can now be opened on phones and tablets too, for those who know where to look.',
      'Fixed: while an expansion into the hinterland was under way, the War tab showed whichever tab you had open before.',
      'Fixed: the same could happen to the Regime tab in Baskhar, because of one programme that changes the recruitment law.',
    ] },
    { date: '24 November 2026', title: 'Rewrite the world before you start', items: [
      'On the new campaign screen, “Rewrite other countries’ governments” lets you choose the starting system of every country, not only your own.',
      'Each country starts with laws, a leader, politics and relations to match. “Restore history” puts them all back.',
      'Not available in challenges.',
    ] },
    { date: '24 November 2026', title: 'Life after a destiny, and longer trees', items: [
      'Reaching a destiny no longer ends your country’s road. It opens a new programme tree named after the state you became: 91 trees, one for every destiny, eleven programmes each.',
      'Each tree starts with a first act, then splits into two roads of four that rule each other out, such as conquest or consolidation, the world or home. A finale of two follows whichever road you took.',
      'The end of each road and the end of the finale each give your country a title it keeps, such as “Emperor of Two Seas” or “The Restored Throne”. Their bonuses last fifty years.',
      'If the regime that reached the destiny falls, its tree closes with it. Other countries walk their own trees too.',
      'Every national tree and every family tree gains a branch for the 1960s and 1970s: oil booms, space programmes, guest workers, student revolts and the like, with two roads to choose between.',
      'Every ideology tree gains five programmes after its 1958 pair, from 1964 on.',
      '1,366 new programmes in all. A full playthrough of the shortest national tree now takes about 32 years instead of 23.',
    ] },
    { date: '23 November 2026', title: 'Every system plays its own way', items: [
      'Marxist-Leninist states have yearly plan quotas. Miss one and you can report false figures, but a war tends to find them out.',
      'Democracies make dated promises that voters judge at the next election; democratic socialists who keep too many test the officers’ patience.',
      'Juntas promise a handover date and keep pushing it back. Theocracies proclaim edicts that can never be repealed.',
      'Social democracies, corporatist chambers and juntas hold yearly bargains, and whoever is refused bears a grudge. Councils vote on motions you can only lobby.',
      'Monarchs educate and marry off an heir. Maoists, national syndicalists, the Revival and National Socialists have a force that grows on its own and can turn on them.',
      'Technocracies publish forecasts, market socialists set a quota against inequality, NRX states guide their shareholders, and cybernetic networks catch other planners’ lies.',
      'Strike funds, village granaries, charters, merchant trade routes, holy sites, guidance tours, partisan orders and chains of revolutions abroad.',
      'Every system has things it cannot do, shown greyed out with the reason: a liberal government cannot rule by decree, a minarchy builds no public works.',
      'Peace terms depend on the victor: liberals take reparations and bases, monarchies take tribute, socialists leave their movement behind.',
      'No single ideology can sweep the map any more: the world resists any system that spreads too far.',
      'Merchant trade routes and holy sites are drawn on the map.',
    ] },
    { date: '22 November 2026', title: 'Food rework', items: [
      'Granaries store surplus grain and are drawn down before anyone goes hungry, so famine comes with months of warning.',
      'Population grows only while the harvest can feed it.',
      'Cities have markets that add to the harvest instead of causing famine.',
    ] },
  ];
})();
