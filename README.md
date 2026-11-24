# Iron Dialectic

A grand strategy of belief and power, playable in the browser. You run a state from 1910 to
1976. War is simple to operate (one troop pool, a percentage slider, a fluid pixel front); the
depth is in politics. Each of the 31 ideologies changes how the economy works, how the army is
raised, which factions can bring you down, where legitimacy comes from, what you are allowed to
order directly, and what winning means.

No build step, no backend, no dependencies. Open `index.html` through any static web server.

## Host it on GitHub Pages

1. Create a new public repository on GitHub.
2. Upload the **contents** of this folder (so `index.html` sits at the repository root).
3. In the repository: **Settings → Pages → Build and deployment → Source: Deploy from a branch**,
   branch `main`, folder `/ (root)`. Save.
4. After a minute the game is live at `https://<your-username>.github.io/<repository>/`.

To play locally, run a static server from this folder, for example `python3 -m http.server`,
then open `http://localhost:8000`. (Opening the file directly with `file://` also works in most
browsers.)

## Controls

Everything works with a trackpad. Nothing needs a right-click.

| Action | Input |
|---|---|
| Pan | drag the map, two-finger scroll, arrow keys or WASD |
| Zoom | pinch, mouse wheel, `+` / `−` |
| Select a tile or state | click |
| Attack the selected enemy, or expand into selected hinterland | `Enter`, the Attack/Expand button, or double-click |
| Artillery barrage / air raid | click the order on the war bar, then click enemy land (`Esc` cancels) |
| Pause / speed | `Space` / `1`–`5` |
| Panels | `R` ministers' report · `G` state · `I` regime · `E` economy · `L` laws · `P` programme · `M` war · `F` foreign · `U` sovereignty · `O` world · `H` handbook |
| Map modes | `Z` political · `X` ideology · `C` opposition · `V` unrest · `B` supply · `N` terrain |
| Close / menu | `Esc` |
| Answer a dispatch | click an option (crises stop the clock; ordinary dispatches wait at the left of the map), or press its number |

Hover anything for an explanation. If two-finger scrolling zooms instead of panning on your
machine, change it in **Settings**.

**On a phone or tablet**, either way up: drag to pan, pinch to zoom, tap to select, double-tap to
attack or expand, and press and hold anything (a tile, a number, a button) for its explanation. The
» button at the top changes speed; the Map and ⚠ buttons under the top band open the map modes and
the alerts; "Orders" on the war bar folds out posture, barrages and attack styles. Tap an aimed order
again to cancel it.

## What is in it

- **31 ideologies** in six families, each with its own economy model (market, mixed, plan,
  workers' councils, corporatist pact, agrarian rent, commercial, cybernetic), decision-making
  rules, recruitment laws, attack doctrine, legitimacy sources, drift paths and grand objective.
  Sectarian rivals inside a family treat each other as enemies. The newest: **Juche** (a
  self-reliant fortress around a hereditary Leader), **National Syndicalism** (vertical syndicates
  and shock squads), **National Socialism** (rearmament on secret credit that only plunder repays,
  ultimatums while the world's patience lasts, radicalisation that only ratchets upward) and three
  **accelerationist** systems with huge advantages and a gauge that collapses if you slow down:
  **Techno-Socialist Accelerationism** (the revolution broadcast abroad every month, ripe
  countries tipped into revolution), **NRX Accelerationism** (industry and research compounding
  into an intelligence explosion) and **Nazi Accelerationism**, which a radicalised National
  Socialist state can become: a fire that must keep conquering or burn out, with devastating
  choices every few months.
- **Doctrines**: every system plays differently. Each has its own gauge with its own logic (party
  unity, revolutionary momentum, council vitality, royal will, zeal, credit, national enthusiasm and
  so on), actions only it can take, a way of fighting (commissars, people's war, lightning war,
  martyrs, material superiority, network logistics...) and a war order of its own (deep operation,
  a general strike across the border, lure them in deep, letters of marque...).
- **The regime**: five named people hold the seats that matter (army, police, economy, ideology,
  foreign affairs). Their competence and loyalty decide what each seat does for you; their
  convictions pull the regime toward other systems; the disloyal and ambitious plot. Win them
  over, name an heir, or purge them. Every system holds its own session (a party congress, an
  imperial council, a party rally, a new government's programme) that sets the line for years.
- **Two countries built around the radical systems.** Tessaly is a Techno-Socialist Accelerationist
  network of mountain cantons with a transmitter on every peak (the Wire and the Valleys; Verano's unions,
  Cassine's bankers, Karsova's party; four destinies from the Planetary Signal to an Alpine Fortress under
  its own security chief). Meridia is an NRX sovereign corporation founded when its bondholders foreclosed on
  the state (the Patchwork; Antara's copper and colonels, the Cassine exchange; the Singularity, the
  Patchwork, the Crowned Company, and the secret road of the Model). The two race for the thinking machine.
- **No forced ending.** Reaching a goal is recorded as a victory and you may keep playing; so you may after
  another power's domination, past 1976, or after a coup or revolution that leaves your country standing.
- **Every country has its own story** on *The Three Continents*: a real cast around the ruler and a
  national question (Aurelia's land, Pavon's fortress of bunkers, Karsova's villages, Suyan's
  river, Lys's toll on the straits...) with national actions, turning points at each end and a
  national project in the programme tree that pulls it one way or the other.
- **The Old Lands**: a third continent on the main map, modelled on the century of the post-colonial world. An
  empire's last provinces become mandates of the great powers; oil is found under the sand and belongs to foreign
  companies until someone nationalises it; a land two peoples claim is partitioned; officers take power, pan-national
  states unite and fall apart, a defeat discredits them and a religious revolution follows. Seven new states to play,
  each with its own cast, national question, tree and destinies, and a fifth secret road.
- **Sovereignty** (key U): who rules you and what they take, the gauge from collaboration to resistance, and every
  road to independence with its odds. Oil fields and concessions, nationalisation crises, arms deals and courting by
  both blocs, unions of the nation. These work in random worlds too.
- **The World Dispatch**: a newspaper reports what happens in other countries (revolutions, coups,
  wars, the choices other governments make) and, before each great event of the century, what is
  building up to it.
- **Secret roads**: five countries hide a road no menu shows, with its own ideology and ending.
  Find the moment and a door opens.
- **Conspiracies and notes**: back one named man in a rival's inner circle and give the signal when
  the odds are right; send treaties, demands, offers of alliance, aid and tolls that other
  governments answer.
- **Strategic war**: pick an objective and the front becomes a spearhead toward it; take it and
  the enemy reels. Choose a posture (offensive, dig in, elastic defence) and a land doctrine
  (manoeuvre, firepower, defence in depth, the nation in arms).
- **Leaders with traits**: warlords, reformers, paranoiacs, orators, grey administrators. Every new
  leader rolls new ones, and they change how the country behaves, so no two campaigns run the same.
- **Seven factions** with power drawn from the country's structure and support driven by
  visible, itemised demands. Censorship makes the numbers you see lie.
- **Regime change**: elections, coups, uprisings, reforms, drift and imposed regimes. Civil
  wars split the map along the provinces where the rebels are strong, and you choose a side.
- **Historical mode** on *The Three Continents*: a storyline runs from 1910 to 1976 (a great war,
  revolutions, the Slump of October 1929, a second war, the blocs, a crisis over the straits).
  When history reaches your country you choose, and the option history took is marked. Your choices
  open new chapters: a crown that survives 1917, a party that crushes its sailors, a Senate that
  refuses the League. In **Divergent** history (the default) other countries sometimes take the
  other road too; set it to *As it happened* for the script, or *Free* for no script at all.
- **Warnings before the blow**: risings, coups, successions, weary armies and regimes sliding into
  another system all announce themselves first, with a choice at each stage.
- **Programmes**: every state works through long projects, most of a year each, that pay out when
  they finish. Each of the countries of *The Three Continents* (24 of them) has its own branching tree of more than thirty programmes, with
  paths that rule each other out, change the system of government or start wars; every system of
  government has a programme of its own that can master its doctrine; and every state shares a
  general tree for industry, farming, the army, the state and foreign policy.
- **The ministers' report**: when the state starts to crumble, open the Report (`R`). It names
  each problem, what is causing it, and the levers that answer it, one click away.
- **Emergency measures**: a tree of short measures that open only in trouble (hunger, an empty
  treasury, unrest, a falling government, a drifting regime, restless officers, a losing war,
  civil war). Starting one shelves the programme under way without losing its progress.
- **Home fronts**: every national tree has a domestic branch with a choice of two roads.
- **Destinies**: every country's programme branches into three or more endings. Reach one and
  the state takes a new name and a new flag, with a moment to match ("Ring the bells backward. We
  are returning to the hour before the fall."). Every country on every map has a tree: the 17 of
  *The Three Continents* have their own, and every other state gets one for its family of ideas.
- **The Nation screen**: click your flag for your motto, your anthem (each state has its own
  march, written from its name), its history, its national spirit, the titles it has earned and
  the destinies still open to it.
- **A land race from the first day**: about a quarter of the world starts as unclaimed
  hinterland. Every state pushes into it with troops, no war needed, until the borders close.
- **OpenFront-style war**: fronts advance tile by tile by troop density, terrain, rivers and
  forts; five attack styles; naval landings and settler landings; encircled pockets surrender;
  artillery barrages against the line and its forts, bombing raids against factories, ports and
  cities, and emergency call-ups; missiles; a slow, costly atomic programme and, very late, a
  thermonuclear one.
- **Buildings that matter**: cities, factories, ports, fortresses and silos are damaged by capture,
  shelling and bombing, mend over time and can be rebuilt. Factories set your industrial capacity,
  which caps the arms your army can be given; ports carry overseas trade; every trade route is worth
  more between kindred systems. The handbook page "Industry, trade and the bomb" gives every formula.
- **War you can see and hear**: shell bursts and smoke along every front, attack arrows with
  troop counts, captured-tile counters, screen shake, a generative score that turns martial in
  wartime, and newspaper front pages for wars, revolutions, fallen capitals and new eras.
- **Absolute rule looks the part**: under an absolute monarch or a personal dictator a great banner
  of slogans sweeps across the map, more often as the cult grows. It can be switched off in Settings.
- **Flags** for every state, generated from its name and ideology, that change when the regime does.
- **A living world**: blocs, coalitions against the leader, foreign-funded movements, general
  strikes called from abroad, revolutionary waves, a Great Slump, four eras.
- **344 events (and 67 alternative tellings), 47 decisions, 95 doctrine actions, 90 session lines, 72 national actions and 1,206 programmes**, many with delayed consequences. Bad news and good news are
  balanced: after a run of trouble the dice lean toward a windfall, and problems arrive spaced out.
- **A post-mortem when you fall** naming the faction that turned, what turned it, the last
  years of warnings and what to try next. A chronicle when the campaign ends.
- A handcrafted scenario (*The Three Continents, 1910*: 24 states and two peoples without a state), seeded random worlds in three sizes,
  three difficulties, six unlockable challenges, three save slots plus autosave, run records,
  a guided tutorial and an in-game handbook covering every system and ideology.

## For developers

```
js/core/util.js      RNG, noise, heap, formatting
js/data/*.js         ideologies, laws, factions, buildings, events, decisions, names, scenario
js/sim/*.js          map generation, world, combat, economy, politics, diplomacy, events, AI, loop, saves
js/ui/*.js           canvas renderer, sound, interface, panels, screens, tutorial, main loop
tools/*.js           headless balance tools (Node 18+)
```

The simulation never touches the DOM, so whole campaigns run in Node:

```
node tools/simulate.js --runs 5 --years 66      # AI-vs-AI campaigns with a summary table
node tools/soak.js meridia iron                 # how long a passive human lasts in each nation
node tools/soak.js meridia iron auto            # the same with the AI playing your nation
node tools/budget.js                            # every nation's treasury on default settings
node tools/history.js --runs 3 --verbose        # The Three Continents in historical mode: beats, programmes, regimes
node tools/history.js --runs 3 --free           # the same world with no storyline
node tools/metrics.js events|pacing|human|trees|tables   # event variety, war pacing, tree sizes, ideology tables
node tools/ideocheck.js [ideo,...] [years]      # every ideology fully wired; force some on states and run the world
node tools/afterdest.js                         # destiny trees and late branches: effects, layout, roads, titles, lapse, AI
```

Ideologies, events, programmes and the storyline are plain data: add an ideology by adding one
object to `js/data/ideologies.js`, an event to `js/data/events.js`, a programme or a story beat
to `js/data/focus.js`. `DESIGN.md`
describes the systems and the data schema.

## Credits

Typefaces: Barlow and Barlow Condensed by Jeremy Tribby, SIL Open Font License 1.1; Special Elite by Astigmatic, Apache License 2.0
(`fonts/OFL.txt`). All sound is synthesised in the browser.
