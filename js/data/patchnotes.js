/* IRON DIALECTIC — patch notes shown from the title menu (ui/screens.js, acts.patchNotes). Newest first. */
(function () {
  'use strict';
  const ID = (globalThis.ID = globalThis.ID || {});
  ID.PATCH_NOTES = [
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
