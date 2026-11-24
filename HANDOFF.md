# IRON DIALECTIC — build handoff

Read this first if you are picking the project up mid-build. It records what exists, what is
verified, what is left, and the conventions the code relies on. `DESIGN.md` is the design
document (pillars, systems, data schema, art direction); this file is the working state.

The original brief is a browser grand-strategy game "in the spirit of Hearts of Iron IV"
where politics and ideology are the core and combat is OpenFront-style. Hard requirements:
static site (HTML/CSS/JS, **no build step, no backend**) for GitHub Pages; **no right-click
anywhere** (trackpad: left-click, drag, scroll/pinch, keyboard); canvas map at 60fps;
localStorage saves with multiple slots + autosave; pause on space with adjustable speed;
readable text (no tiny fonts, good contrast, tooltips on everything).

The user's feedback on earlier games built this way, which this build must not repeat:
laggy, odd sound effects, unreadable text, unclear visuals, "not fun", nothing that makes
people want to keep playing. Prioritise legibility, performance, and a clear reason to act.

## Status

| Layer | State |
|---|---|
| Design doc (`DESIGN.md`) | written |
| Data: terrain, buildings, laws, recruitment, styles, factions, eras (`js/data/base.js`) | done |
| Data: 31 ideologies (`js/data/ideologies.js`) | done |
| Data: names, handcrafted scenario, situations, challenges (`js/data/names.js`) | done |
| Data: ~75 events and ~45 decisions (`js/data/events.js`) | done |
| Sim: mapgen, world, combat, economy, politics, diplomacy, events engine, AI, game loop/save | done, runs headless |
| AI-vs-AI balance | three passes done; see "Balance" |
| Fonts (`fonts/`, Barlow + Barlow Condensed, OFL) | copied in |
| UI: `index.html`, `css/style.css`, `js/ui/render.js` (canvas map), `audio.js` (WebAudio synth), `ui.js` (top band, rail, selection card, attack bar, alerts, events, tooltips, keys), `panels.js` (State/Economy/Laws/War/Foreign/World/Handbook), `screens.js` (title, setup, saves, settings, challenges, records, end screens), `tutorial.js` (coach as Cassine), `main.js` (loop, pointer input) | written, loads with no console errors in headless Chrome |
| Browser test harness: `/home/claude/scripts/shot.js` (puppeteer-core in /tmp/pp; serve with `python3 -m http.server 8765` from the project root) | working (session 11 used the desktop app's browser pane with a small static server instead) |
| Browser passes (session 2): title, setup, all panels, tutorial to the war step, save/load round trip, forced defeat post-mortem, chronicle, retry, victory — no console errors. Perf in 1944 at speed 5: every frame on the 60fps budget, a month of sim 2–5 ms, save 158 KB | done |
| README, zip, publish | done at the end of session 2 (see below) |

## How to run what exists

```
node tools/simulate.js --runs 5 --years 66            # full AI-vs-AI campaigns, summary table
node tools/simulate.js --runs 1 --years 20 --verbose  # with 6-yearly snapshots
node tools/probe.js 5 18 meridia                      # per-nation internals every 6 years
node tools/fates.js ml,agrarian,trot 66               # why did states of these ideologies end?
node tools/structures.js                              # self-check: buildings, forts, trade, arms, the bomb, saves
node tools/metrics.js econ --runs 8 [--random]        # trade share, output spread, kit, damage, the bomb
```

A 66-year campaign on the standard map takes about 5 seconds in Node. `/usr/bin/google-chrome`
exists in the sandbox for headless browser checks (use puppeteer-core from npm or Chrome's
`--headless --screenshot`).

## Architecture and conventions

- Plain `<script>` tags, no modules. Every file is an IIFE that hangs things off one global,
  `ID` (`globalThis.ID`). Load order: `core/util` → `data/base` → `data/ideologies` →
  `data/names` → `data/events` → `data/focus` → `sim/mapgen` → `sim/world` → `sim/combat` →
  `sim/economy` → `sim/politics` → `sim/diplomacy` → `sim/events` → `sim/focus` → `sim/ai` →
  `sim/game` → `ui/*` (`ui/programme.js` after `ui/panels.js`). `index.html` is the one list: the
  tools load the sim through `tools/load.js`, which reads the core, data and sim script tags from it (session 10).
- **`js/sim` and `js/data` never touch the DOM.** The UI reads the game object `G` and calls
  sim functions. Keep it that way so the Node tools keep working.
- `G` is one plain object made by `ID.newGame(opts)` (`sim/world.js`). `ID.setPlayer(G, id,
  ideoOverride)` hands a nation to the human. `ID.rewriteRegime(G, n, ideo)` gives any nation another
  system before the start; the setup screen keeps the choices in `S.ideos` and rebuilds the world from
  its seed with them applied. `ID.Game.tick(G)` advances one day.
- Time: 1 tick = 1 day, 30-day months, 360-day years, 1910 → 1976. Monthly logic runs in
  `ID.Game.month`. Eras at 1910 / 1925 / 1940 / 1957.
- Map: `G.W × G.H` tiles (std 384×216). Typed arrays indexed by `y*W+x`: `terrain`, `river`,
  `coast`, `prov` (province id), `owner` (nation id, 0 = none/sea), `bld`, `cut` (0 supplied,
  1 cut off, 2 sea-supplied), `cutAge`, `fortCov`, `rad`.
  **Always change ownership through `ID.setOwner(G, i, to)`** — it maintains every aggregate.
- Nations: `G.nations[id]` (index 0 is null). Fields are listed in `ID.makeNation`. Scratch
  and cached values live in `n.a` (e.g. `n.a.atk`, `n.a.unrest`, `n.a.dem`, `n.a.mv`).
  `n.fs` = true faction support, `n.rep` = what the player is *shown* (biased under
  censorship), `n.fp` = faction power %, `n.src` = legitimacy sources.
- Provinces: `G.provinces[p]` with `owner` (majority holder), `core`, `unrest`, `opp`
  (opposition ideology id), `oppStr`, `integ`, `urban`, `cnt` (tiles per nation), `center`.
- Diplomacy state: `ID.dipOf(G,a,b)` → `{war, truce, nap, trade, embargo}`; `ID.atWar`;
  opinions `ID.op(G,a,b)` (a's view of b); blocs in `G.blocs`.
- UI hooks the sim already fills (only when `!G.headless`): `G.dirty` (tile indices to
  repaint), `G.dirtyAll`, `G.fx` (visual effects: `{type,i,t,d}` with types build, revolt,
  ideology, nuke, boom, land, capital, subvert), `G.sfx` (sound cue names: tick, build, boat,
  launch, boom, nuke, war, revolt, event, alarm, stamp, good, bad, victory, defeat, crash,
  era), `G.news` (ticker), `G.chronicle`, `G.evq` (events awaiting the player), `G.over`
  (end state with `pm` post-mortem), `G.uiDirty`, `G.wantAutosave`, `G.world.waves`.
- Player actions the UI should call:
  - war/peace: `ID.Diplomacy.declare`, `.propose(G, from, to, kind)` (trade, nap, ally,
    peace, embargo, cancel_trade, cancel_nap), `.evalProposal`, `.casusBelli`, `.warBlock`
  - combat: `ID.Combat.launch(G, from, to, troops, style)`, `.cancel`, `.planBoat`,
    `.launchBoat`, `.canMissile`, `.launchMissile`, `.styleOk`
  - building: `ID.canBuild`, `ID.buildCost`, `ID.startBuild`
  - politics: `ID.Politics.setLaw`, `.lawAllowed`, `.lawCost`, `.vote`, `.demands`,
    `.electionForecast`, `.coupOdds`
  - economy: `ID.Economy.setBudget`, `.budgetLock`, `.budgetMax`, `.motion`, `.debtCap`;
    direct fields `n.tax`, `n.rent`, `n.pact`, `n.mob`, `n.focus`
  - events/decisions: `ID.Events.choose(G, k)`, `.options`, `.describe`, `.txt`,
    `.decisionsFor`, `.decisionBlock`, `.runDecision`, `.embrace`, `.embraceBlock`
  - covert: `ID.Diplomacy.startOp(G, n, 'fund'|'coup'|'strike', target)`, `.stopOp`, `.opCost`
  - victory: `ID.Victory.progress(G, n)`; end screens: `G.over`, `ID.Game.chronicle(G)`. Victory does not end the
    game: `ID.Game.canCarryOn(G)` / `ID.Game.carryOn(G)` clear `G.over` (see Session 14); `G.won` records wins.
  - saves: `ID.Game.save(G)` → JSON string, `ID.Game.load(str)` → `G`
- Events and decisions are data. Effects are arrays like `['sup','workers',10]`; the
  vocabulary is in `ID.Events.applyFx` and `ID.Events.describe` (`sim/events.js`).
- Player events pause nothing in the sim by themselves: the UI must stop ticking while
  `G.evq.length > 0` and show the event at the head of the queue.
- `G.autoPlayer = true` makes the AI play the player's nation too (useful for soak tests).

## Planned UI (agreed art direction)

"Constructivist plotting table": a **light** paper chart, not a dark dashboard.
Palette: paper `#ebe2cc`, ink `#17140f`, signal red `#c8281e`, chart sea `#abbcb8`,
ochre `#c99a2e`, steel `#3d5a6c`, olive `#5d7a3a` (good values). Type: Barlow for body
(14.5px base, never under 13px), Barlow Condensed 700/800 for headings and the poster title;
fonts are local in `fonts/` via `@font-face`. Hard offset shadows, ink borders, one diagonal
cut on panel headers; caps only for major titles.

Layout: ink top band (nation, ideology, gold/industry/food/pop/troops, stability /
legitimacy / authority, date, pause + speeds 1–5, menu) · left rail of tabs · 410px drawer
panel · map · selection card top-right · alerts · attack bar bottom-centre · map-mode
switch · news ticker along the bottom. Event "dispatch" modal in the centre.

Keys: Space pause, 1–5 speed, arrows/WASD pan, +/− zoom, G government, E economy, L laws,
P programme, M military, F foreign, O world, H handbook, Z X C V B N map modes (political, ideology,
opposition, stability, supply, terrain), Esc close.

Map renderer: one offscreen canvas at 1px per tile (ImageData via a Uint32Array), repaint
only `G.dirty` tiles plus neighbours, `drawImage` scaled with smoothing off; vector overlays
per frame for buildings, capitals, labels, fronts, boats, missiles, effects, wave rings.
Title screen: the poster title over a live AI-vs-AI world running in the background.

Screens still to build: title/new game (scenario, seed, size, difficulty, nation pick with
situation blurbs and an ideology override), load/save slots (3 + autosave), challenges and
run records (localStorage key suggestion `id_meta`), encyclopedia generated from
`ID.IDEOLOGIES` / `ID.ECON` / `ID.CONTROL` / `ID.LAWS`, guided tutorial as Cassine in the
handcrafted scenario (nation has `tutorial: 1`; script a neighbour's attack so the war is
defensive and needs no vote), defeat post-mortem (`G.over.pm`), victory + chronicle.

## Balance — where it stands

Economy pass after the UI went in (session 2): upkeep cut ~40% so default budgets run a small surplus;
1910 starts with trade treaties between friendly reachable states; trade income now uses production
(`n.prod`) not GDP, removing a feedback loop that made merchant republics absurdly rich; research
cost is `200 × 1.55^level` so era ceilings are reached late in each era; newGame runs one economy
month so the opening screen shows real figures. `tools/budget.js` shows every nation's treasury if
left on defaults.


Tuning so far, all in the sim files (search for the constants):
- conquest pace `BASE_RATE` 0.095 and ratio factor capped at 1.8 (`combat.js`)
- limited vs total war aims, so most wars end in border changes, not annexation
  (`diplomacy.js: startWar / wantsPeace`); capitulation needs the capital and <34% of
  pre-war land
- rivals intervene for much weaker victims; AI counts likely interveners before declaring
- AI grace period of 2–4.5 years at game start; era aggression `[0.7, 1.0, 1.4, 1.15]`
- faction support is squashed with tanh so it sits mostly in 15–85 (`politics.js: support`)
- baseline unrest tied to living standards; legitimacy sources no longer saturate

Typical 66-year AI world now: 18 states → 12–18 alive, largest holds ~20–26% of land,
13–50 wars, 7–15 civil wars, a few dozen ideology changes by coup, revolution, election,
drift and imposition. Every ideology survives somewhere; juntas and liberal states are the
most common end states.

Known soft spots to revisit once a human-facing build exists:
- some worlds have a single country that relapses into civil war repeatedly
- the social-democrat objective (living standards ≥ 82) may be too easy; check thresholds
- rich AI states can hoard gold (worse after session 11's richer trade: ~51K per state at the end)
- player-side difficulty has only been reasoned about, not played: run soak tests with
  `G.autoPlayer` on a chosen nation and read the post-mortems

## Soak tests (session 2)

`node tools/soak.js meridia iron` — passive player (never touches a lever): 14 of 17 starts fall,
mostly conquered 1917–1930. `node tools/soak.js meridia iron auto` — AI plays the player's nation:
8 of 17 fall, 2 win (Karsova ideological 1973, Meridia grand objective 1970). That is the intended
"hard by default" curve: competent humans should beat the AI-played results.

AI diplomatic offers to the player (trade, pact, alliance, peace) are non-blocking cards in the
alert column (`G.offers`), not dispatches; they lapse after 120 days.

## Session 3: "more immersive and more action"

- Hinterland land race: `world.js` (generation: each state's farthest 30% of tiles left unclaimed,
  `opts.wild`), `combat.js` (`seedWild`, `processExpand`, `C.launch(G, from, 0, ...)`, settler
  landings), `ai.js` (`expand`), `G.wildB[id]` = frontier length with unclaimed land.
- War orders: `combat.js` `C.ABIL`, `abilBlock`, `useAbil`, `G.shock` (shaken areas); AI uses them
  on its busiest front. UI: war-bar buttons plus click-to-aim (`UI.aim`, `UI.fireAbil`).
- Headlines: sim calls `ID.headline(G, {kicker,title,sub,a,b,tone})`; UI shows one card at a time
  (`UI.tickHeadlines`), 4.6 s, click to dismiss.
- `js/ui/flags.js`: `ID.Flags.svg/html/img/banner`; `R.swatch` now returns a mini flag everywhere.
- Render: particle system (`R.burst`, `R.floatText`), attack arrows square to the local front,
  troop counts and flags under map labels, sea waves, screen shake on big moments.
- Score: `ID.Music` in `audio.js`, moods title / peace / war / crisis chosen in `main.js` each
  frame; music volume and toggle in Settings (`UI.settings.music`, `musicOn`).
- Soak after these changes: passive player falls in 10 of 17 starts; AI-played player falls in 6,
  no outright wins. The hinterland makes the opening gentler; if playtesting says it is too easy,
  raise `aiAgg` on Iron or shorten the AI grace period in `ai.js considerWar`.

## Session 4: programmes and historical mode

The user asked for "a toggleable historical mode similar to HOI4's where there's a fixed storyline
with multiple progression paths for countries". What exists:

- **Programmes (focus trees).** `js/data/focus.js` → `ID.FOCUS = { general, nations: {Base: [...]}}`.
  24 general programmes for every state (industry, farming, army, state, foreign columns plus three
  repeatables) and 8–12 national ones for each of the 17 countries of The Two Continents (138 in
  all). Fields: `{id, name, x, y, days, req, reqAny, excl, year, after, ideos, fams, can, fx, hist,
  ai, repeat, desc}`. `hist: 1` marks the path taken in history. `after: 'st_x'` makes a programme
  wait for that story beat, but only in historical mode (used where a programme and a story event
  would otherwise collide, e.g. Cassine's New Deal waits for the 1932 election).
- **Engine** `js/sim/focus.js`: `ID.Focus` (`trees`, `block`, `state`, `available`, `start`,
  `cancel`, `tick` every 5 days, `complete`, `aiPick` monthly from `AI.month`, `progress`,
  `current`). State per nation: `n.path = {cur, start, end, done: {id: tick}}`; `n.tree` = the
  national tree key (set in `newGame` for scenario nations; rebels inherit it). One programme at a
  time. Ideology-changing programmes are blocked during a civil war.
- **New effect vocabulary** (handled by `ID.Focus.FX` / `ID.Focus.DESC`, reached from the default
  branch of `Events.applyFx` / `describe`, so events and decisions can use them too):
  `['ideology', id, mode]`, `['claim', Base]`, `['claimsAll']`, `['war', Base, cb]`,
  `['ally', Base]`, `['op', Base, v]`, `['build', B.TYPE, k]`, `['techUp', 'ind'|'mil'|'agr']`,
  `['law', cat, opt]`, `['subvert', Base, v]`, `['civilwar', ideo, share]`, `['protector']`.
  Countries are named by base name and resolved with `ID.byBase(G, base)` (the lawful government
  over rebels, then the largest).
- **Storyline** `ID.STORY` (25 beats, 1911–1973) at the bottom of `data/focus.js`. A beat with
  `nation` queues the story event of the same id to that country (`sys: 1, story: 1`, options
  with `hist: 1`); a beat with `run(G)` is a world beat. Helpers: `ID.storyWar` (asks the player
  through the `story_war` dispatch instead of declaring for them), `ID.storyBloc`, `ID.storyPeace`
  (offers peace to the player instead of forcing it), `ID.storyUnion` / `ID.storyAnnex`
  (Hesperia–Pavon; the `st_ultimatum` dispatch if the player is the target). `ID.Story.month`
  runs from `Game.month` and only when `G.historical`; `ID.Story.upcoming`, `.past`, `.init`.
  `G.story.done[id]` is 1 when fired, 2 when skipped because its condition failed, 3 when it
  falls before the campaign's start date.
- **Historical mode** (`G.historical`, meridia only, saved and loaded): story beats fire; AI
  countries take `hist` options of story events (`Events.auto`) and weight `hist` national
  programmes 40 and non-historical ones 0; the Slump is fixed at October 1929; before 1939 AI war
  scores take −0.45 and AI states cannot found new blocs (`ai.js`). Free mode: no story, AI picks
  programmes freely (war and ideology programmes weighted down).
- **UI**: setup screen History toggle (Historical / Free, default Historical, hidden for random
  worlds and challenges); `Programme` rail tab (key P) with a red progress strip; panel
  `ID.Panels.prog` and the tree modal (kind `'tree'`, `UI.renderTree`, `acts.tree`,
  `acts.startFocus`, `acts.cancelFocus`) in `js/ui/programme.js`; "No programme" alert; story
  dispatches are labelled HISTORY and their historical option is tagged "as it happened";
  Handbook page "Programmes and history"; World panel shows the mode. Alerts move up above the
  attack bar while a drawer is open (`#alerts.shift`).
- **Tools**: `node tools/history.js --runs 3 [--free] [--verbose] [--start 1925]` runs The Two
  Continents headless and prints which beats fired, which programmes each country completed,
  and the final regimes. `node tools/soak.js meridia iron [auto] [hist]`. Browser check:
  `/home/claude/scripts/hist.js`.

- **Balance notes (session 4).** The first version of the general tree made AI worlds much calmer
  (random maps: wars 28 → 19, civil wars 8 → 5.6 on the same nine seeds) because it handed every
  state free factories, technology levels, missile silos and permanent stability. Now general
  programmes trade off (gold costs, faction costs, temporary rather than permanent stability, research
  points instead of free tech levels, no free silos) and the same seeds give about 23 wars and 6–8
  civil wars. `node tools/simulate.js --nofocus` turns AI programmes off for comparison; seed-to-seed
  variance is large (4–49 wars), so compare at least nine runs. Historical mode on The Two
  Continents is busier than free mode (25–45 wars, many civil wars after 1950 in the east); that is
  intended. Soak with the AI playing the player's nation: free mode 10 of 17 fall, historical 9 of
  17 fall and Antara reached its objective in 1924. A passive player (no programmes, no levers)
  now falls in 16 of 17 starts, because every AI state develops through its programmes. AI gold
  hoarding got worse with programme income (thousands by the 1950s); still on the soft-spot list.

## Session 5: destinies, identity, family trees

The user asked for more branching paths, more countries with content, and for players to feel
connected to their country ("think it's awesome"). They clarified: no export or edit tools; make the
game itself worth making edits about, with narrative lines and slogans in the spirit of the memorable
writing in big strategy mods. What exists:

- **`js/data/destiny.js`** (loads after `data/focus.js`):
  - `ID.IDENTITY[base]` = motto, anthem title, lore and two national spirits (applied once at
    `newGame` by `ID.Focus.applySpirits`; names kept in `n.spirits`) for the 17 countries.
  - Appends 6–8 programmes to every national tree, including **three destinies each** (51). A
    destiny is a programme with `dest = { name, motto, epithet, quote, by, text, flag, leader }`;
    destinies in a tree exclude each other (`exclAll`). `patch()` adds exclusions to existing
    programmes (Hesperia's and Pavon's new democratic branches, Irkal's assembly vs the shah).
  - `ID.FOCUS.families[family]`: a 10-programme tree with 3 destinies for each ideology family,
    used by every state without a national tree (random worlds, breakaway states). Names use `{A}`
    and `{N}` (`ID.Focus.sub`, `ID.Focus.nm`).
  - Story beats get `sup = { quote, by, text, ok, sound }` superevents (great war, armistice,
    second war, atomic test, second peace, iron curtain, straits crisis, 1968).
  - `tame()` at the end keeps destinies from freezing the world: legitimacy and order bonuses last
    ten years, defence bonuses are capped at +12%, and every destiny adds threat.
- **Engine** (`sim/focus.js`): `Fo.destiny` renames the state (`n.destiny = {id, title, name, motto,
  epithet, flag, ideo, t, lapsed}`), renames the leader, adds the epithet, headlines, chronicles
  (`type: 'destiny'`) and queues a superevent for the player in `G.superq`. A later change of
  ideology sets `destiny.lapsed` in `ID.applyIdeology` and the state goes back to its normal name
  and flag. One destiny per state. `ID.addEpithet` (also from capitulations and civil-war victories
  in `diplomacy.js`); `ID.identityOf(G, n)` gives motto, anthem, lore and spirits for any state,
  generated from family pools where nothing is written. New effect `['subvertNb', v]`. In free mode
  AI states only take regime-changing programmes if they drift that way or are one of the ~30%
  marked `n.a.reformer`.
- **Flags** (`ui/flags.js`): `destFlag(spec)` draws destiny flags; the cache key includes the
  destiny id.
- **Anthems** (`ui/audio.js`): `ID.Audio.anthem(seed, family, short)` writes and plays a march
  from the state's name (seed = base + family + destiny); `stopAnthem`, `anthemPlaying`.
- **UI** (`ui/nation.js`): the Nation screen (click the flag and name in the top band:
  `acts.nation`) with flag, epithets, motto, anthem button, lore, spirits, annals and the state of
  each destiny; `UI.showSuper` / `acts.superOk` for full-screen superevents (kind `'super'`),
  shown from `UI.frame` before dispatches. Destiny programmes are gold in the tree and show the
  name the state will take.
- Tests: `/home/claude/scripts/nation.js`, `/home/claude/scripts/super.js` (WHO=Cassine
  DEST=ca_d_freeworld to force a destiny), `node tools/history.js` now lists destinies reached.

## Session 6: superevents, civil wars, the tray, autocrat madness, the Report, emergency measures

User feedback after playing Aurelia: superevents "look lame"; a civil war went wrong (a rebel rump
on a few provinces kept 600k people, double the player's); expand the programme trees; the
country "just crumbling and not knowing what to do". Then: absolute monarchs and absolute
dictators should "go crazy with pop ups, distortions and visuals", and the UI blocks the game.

- **Population follows land.** `ID.setOwner(G, i, to, keepPop)` moves people with each tile
  (`pop × share of populated land`, 85% arrives); civil wars and secessions pass `keepPop`
  because they move pop themselves. Population above the cap decays faster (0.006/day). A state
  with no tiles is eliminated monthly (the player gets `defeat 'disintegration'`). Provinces of
  a state in civil war cannot secede back to its parent. Diagnostic: `/tmp/diag/cw.js`.
- **Superevents** (`ui/nation.js` `UI.showSuper`, `ui/scenes.js`): a dossier layout with a
  painted scene per destiny/beat (`ID.Scene.svg(theme, seed, {flag, war})`, 17 themes; destiny
  → theme in `ART` in `data/destiny.js`), typewriter quote (Special Elite font, Apache 2.0), stamp
  motto, anthem or sting. Story superevents use class `hist`.
- **Dispatch tray** (`ui/tray.js`): ordinary dispatches wait at the left of the map while time
  runs (`G.tray`; `Ev.urgent(def)` = `def.sys || def.story` still stops the clock). Only the
  newest card shows its choices; left three months, `Gm.month` has the ministers settle it
  (`Ev.choose(G, -1, idx, true)`). Settings: "Ordinary dispatches" (tray / stop the clock).
  Headlines are shorter and click-through.
- **Autocrat madness** (`ui/madness.js`): for `absmon` (crown) and `personalist` (leader).
  Level 0–100 from authority, tradition or charisma, regime age, press and security laws,
  leader's age, destiny, low stability; stages at 22/44/64/80. Tint, vignette, scanlines,
  watermark, slogan popups (max 2 on screen, 4 at stage 4), lying stat values, glitches and a
  full-screen flash at stage 4. Runs only while unpaused with no modal. Settings: "Regime
  distortion". Respects reduced motion.
- **Ministers' report** (`ui/advice.js`, rail tab **Report**, key R): `ID.Advice.list(G, n)`
  ranks problems (civil war, collapsing front, stability with its biggest drag, angry factions
  with their worst grievances, weakest legitimacy pillar, drift, coups, elections, food, money,
  inflation, war weariness, unrest, strikes, idle programme) and attaches one-click levers:
  decisions, emergency measures, peace offers, the panel that holds the lever. Urgent items
  (sev ≥ 70) light the rail pip and add a "Ministers’ report" alert.
- **Emergency measures** (`data/expand.js` `ID.FOCUS.crisis`, tree key `cri`, `f.tree =
  'crisis'`, `f.crisis = 1`): 16 short repeatable programmes gated by `can` on the trouble they
  answer. Starting one while an ordinary programme runs **shelves** it (`p.shelf = {id, start,
  end, at}`); `resume()` in `sim/focus.js` takes it back up on completion, cancel or abandonment.
  A measure is never abandoned because the trouble passed. AI weight 5 when idle.
- **Home-front branches** (`data/expand.js` `home()`): every national tree gains root → choice
  of two (exclusive) → capstone, placed in a new column to the right (68 programmes). Not hist,
  so historical-mode AI does not take them.
- Tests: `/home/claude/scripts/report.js`, `report_all.js` (Report for all 17 nations, no
  errors), `mad.js` (WHO=Pavon), `flows.js`, `hist.js`; `/tmp/diag/cri.js` (shelving).
  AI-played historical soak after these changes: 1 win, 7 survive, 9 fall.

### Session 6, later: fortune (fewer runs of bad news)

The user found the dispatches "just spam unfortunate events", Karsova worst. Measured with
`/tmp/diag/evspam.js Karsova hist 30 4 auto`: about 41 problem dispatches in 30 years against 10
windfalls, up to 5 problems in one year.

- **`js/data/fortune.js`** (loads after `data/events.js`): `tone` for every dispatch ('bad',
  'good', 'mixed'; untagged sys events count as bad, story beats as mixed), damped weights for the
  busiest problems of socialist and authoritarian states, and 17 good-news dispatches (record
  year, aviator, inventor, emigrants, a friendly neighbour, the games, a mild winter; ahead of the
  plan, hero of labour, the metro, the last illiterate, the virgin lands, fraternal aid for planned
  and socialist states; a jubilee for crowns; foreign capital for market economies; a festival for
  anarchists and councils) plus the sys dispatch `plan_fulfilled`, queued by `endPlan`.
- **Engine** (`sim/events.js`): `Ev.tone(def)`; every queued dispatch moves `n.a.luck` (bad +1,
  good −1.5, decays 6% a month). The monthly draw divides bad weights by `1 + 0.9 × luck`,
  multiplies good ones by `1.5 + 0.7 × luck`, and draws no new problem within eight months (five
  for AI) of the last bad news (`n.a.lastBad`). Good news never stops the clock (`Ev.urgent`),
  shows a green "Good news" tag in the tray and "GOOD NEWS" on the dispatch.
- Result for Karsova over 30 years: about 26 problems, 21 good, 8 mixed; other countries similar.
  AI-played historical soak: 5 wins, 4 survive, 8 fall.

## Session 7: doctrines, leaders, ideology programmes, divergent history, arcs

Feedback: it felt like early beta; programmes finished very fast; everyone kept collapsing; after
a few campaigns the other countries were predictable; ideologies should change combat and
politics fundamentally (enhance each one rather than add more); not enough levers to balance the
country; the storyline should branch more and react to choices; more narrative, fewer random blows.

- **Pacing** (`sim/focus.js` `Fo.PACE`): national and ideology programmes ×2.5, general ×2,
  repeatable ×1.6, emergency ×1.4. A national programme is now about 300 days.
- **Collapse rate** (historical mode, `/tmp/diag/collapse.js hist 6`): civil wars per run 12 → ~4.5,
  revolutions 6 → ~2, secessions 6.5 → ~4. Changes in `sim/politics.js`: movements of the regime's
  own ideology are cleared (fixed regimes "revolting" into themselves); uprisings need stability
  below 33 for six months (`n.a.fuse`), new regimes get two years' grace, a loyal army (military
  support ≥ 50) crushes minority risings 65% of the time; revolutionary waves weaker; secession
  rarer; war weariness falls faster in peace and tired states seek peace sooner (`diplomacy.js`).
- **Doctrines** (`data/doctrine.js`, engine `sim/doctrine.js`): for each of the 22 ideologies a
  signature gauge `n.sig` (own monthly drift plus pull to 50; effects through `n.sigm`, read by
  `ID.mod`, which now also adds `n.sigm`), 3–5 actions, 68 in all (`Dc.run`, AI `Dc.aiMonth`), a war trait
  (`dp`, applied in `Combat.refresh` and `processAttack`: holdFast, moraleFloor, homeDef, cityDef,
  capitalDef, roughLoss/roughDef, speed, aloss, blitz, brittle, liberate, materiel, precision,
  logistics, wePace, equipRegen, bleed, martyr, leaderAtk, atkMul) and a war order registered into
  `Combat.ABIL` with `ideos`/`doctrine`/`run` (self or targeted; range 999 = any enemy). New mod
  channels: `auth`, `coup`, `driftK`, `wePace`, `speed`, `aloss`, `cityDef`, `lure`. The absolute
  monarchy's court favourite lives in `n.sigx.fav`. Emergency drafts never exceed 130% of the
  mobilisation ceiling. Mastery: `['master']` sets `n.flags['dcm_' + ideo]` (benefits ×1.25, war
  advantages a third stronger, order cooldown ×0.7).
- **Leader traits** (`ID.TRAITS`, `ID.rollTraits` in `data/doctrine.js`; `ID.genLeader` rolls them):
  20 traits with fx (same channels) and AI leanings (`ID.leaderLean(n, 'agg'|'peace'|'reform'|'purge')`,
  used in AI war choice, peace, reform programmes, purges). Leaders of non-dynastic systems now
  retire or die (`P.newLeader`), and parties change leaders between elections.
- **Ideology programmes** (`data/ideotrees.js`, `ID.FOCUS.ideos`, tree key `ideo`, `f.ideoTree`):
  7 programmes per ideology (154): root, a choice of two, second steps, a capstone that masters
  the doctrine, and a post-war programme. AI weight 2.5, historical mode included.
- **Branching history** (`data/story2.js`): story options carry `sf` flags (`G.story.flags`,
  `ID.Story.flag`), choices recorded in `G.story.picks` (`Ev.storyPick`). 24 new beats: Aurelia
  (white crown, white generals, Kronstadt, famine), Karsova (red march, Kirov, pact of the wolves,
  the first weeks of Thunder, the Leader's death), Cassine (League, infamy, reconstruction, red scare,
  civil rights), Hesperia (Grand Council), Verano (May Days), Suyan (great leap, cultural revolution),
  Antara (1970 election), world (red decade, axis, satellite), and two player-only beats
  (`player: 1`, `pcond`): volunteers for Verano and the lakeside conference. A third road in
  February (a constitution). `st_second_war` depends on isolation and guarantees. `ID.storyWar`
  now breaks truces. **Divergent** history (`G.story.loose`, default; setup: As it happened /
  Divergent / Free): AI countries take a non-historical option at a turning point 15% of the time
  and may take non-historical programme branches, regime-changing ones only when drifting that way.
- **Arcs** (`data/arcs.js`, queued from `sim/politics.js` for the player): `arc_rev1` (the first
  month a rising is brewing) and `arc_rev2` (the fourth), `arc_coup` (coup risk above 0.008),
  `arc_heir` (dynastic ruler at 66 without an heir), `arc_weary` (war weariness 55; peace feelers
  set `n.a.feelers`, which makes enemies readier to settle) and `arc_promise`, `arc_drift` (a drift
  reaching 70). `def.tray` keeps a sys event out of the clock-stopping queue. Headlines for coups,
  revolutions and civil wars of major powers give a cause (`P.troubleOf`).
- **UI** (`ui/doctrine.js`): leader line and doctrine card on the State panel, the doctrine at war
  on the War panel, doctrine orders on the war bar and the selection card, a Doctrines handbook
  page, trait tags on the Nation screen; the Report flags a failing doctrine gauge.
- Tests: `/home/claude/scripts/doctrine.js` (WHO=…), `branch.js`, `report_all.js`, `hist.js`
  (updated for the three-way history setting), `flows.js`, `perf.js`; `/tmp/diag/doc.js`,
  `docpush.js` (gauge equilibria), `collapse.js`, `lowstab.js`, `east.js`, `hes.js`, `reform.js`.

## Session 9: supply and landings, The World Dispatch, secret roads, conspiracies, balance

Feedback (playing Lys): conquered islands lost supply at once; landings were thrown out with no
opposition and the troops went invisible; supply vanished mid-invasion; objective marker stayed
after peace; the Thalassocracy could still go Classical Liberal; atomic headlines on every strike;
superevents felt random (wanted HOI4-style newspapers about other countries); programmes should
involve other countries; better sponsored coups; nerf Karsova; repetitive random events; small
powers should be able to compete with skill; equipment and supply unclear. Plus: secret endings
with secret ideologies. Work was started under Fable and finished under Opus.

- **Supply and landings** (`sim/combat.js`): beachheads `G.beach = [{i, o, t}]` supply every tile
  joined to them by land (state 2, like a port); an overseas holding no enemy touches gets a
  beachhead automatically, so it is never cut off in peacetime or away from the front; only real
  encirclements collapse. Landings: `C.planBoat`, `C.bestLanding` (the "Land in X" button when there
  is no land front; AI uses it too), `seize()` takes the beach (up to 12 tiles), then a normal attack
  launches from it with a 30-day surge; boats move 2 tiles a day. Sea power `C.seaPower(n)` (ports ×
  seafaring × doctrine.naval × tech × `navy` mod channel) decides how much of a convoy the defender
  sinks (`C.crossing`: 11% per ratio point, max 50%) and the beach cost. Attacks with no front left
  return to the pool after 14 days with a news line. Map: beachhead markers; Army panel: a Supply
  section and an Equipment tooltip that shows need vs paid (`n.a.armsNeed`, `armsPaid`, `eqTarget`).
- **Fixes**: objectives exist only while the war does (`C.objOf` checks `atWar`, peace deletes
  `objs`, boats to that enemy are recalled); a reached destiny rules out any programme that would
  change the ideology to something else (`Fo.block`/`Fo.state`); nukes: 900 gold, 18-month cooldown,
  two per silo, one front page per bomber per three years.
- **The World Dispatch** (`sim/press.js`, `data/press.js`, `ui/press.js`): stories from other
  countries collected in `G.press.q` (revolutions, coups, failed coups, wars, peaces, conquests,
  civil wars, deaths, palace coups, session lines of great powers, other governments' choices in
  story/national dispatches, destinies, blocs, the slump, notes) and printed as editions (a lead and
  four briefs, a balance-of-power box). `ID.PRESS_PRE[beatId]` (53) prints what is building up a
  few months before each dated chapter; `ID.PRESS_NOW` (7) prints world chapters. Settings: every
  issue / great events only / never pop up; back issues under World.
- **Secret roads** (`sim/secret.js`, historical, player only): Pavon "The Fortress" (Anti-
  Revisionism, ending "The Last Fortress"), Lys "The Ledger" (Bancocracy, "The Bank of the World"),
  Meridia "The Model" (Algocracy, "The Last Decision"), Karsova "Red Star" (Cosmism, "Red Star").
  Each: a hidden trigger (`when`), a reveal dispatch `sec_<key>`, a secret programme tab
  (`ID.FOCUS.secret`, `f.secret`), a secret ideology cloned from a parent (in `ID.IDEOLOGIES`, not
  in `ID.IDEO_LIST`; doctrine/regime tables aliased) whose objective is the ending; the end screen
  shows "A SECRET ENDING" with `I.ending`. Test: `/tmp/diag/secret.js`, `/home/claude/scripts/secretui.js`.
- **Conspiracies** (`sim/diplomacy.js` `D.plot*`, Foreign panel): "Back a coup" is now a
  conspiracy around one named member of the target's inner circle: approach (cost by competence;
  openness from loyalty, ambition, shared convictions), monthly preparation, their police may find
  it, pay the garrison, give the signal (odds shown). Success makes your man leader, ends the war,
  brings the country into your bloc or a pact. AI runs them too (~3.5 successes per 40-year run).
- **Foreign programmes** (`data/foreign.js`): two exclusive programmes per historical country aimed
  at named neighbours, acting through diplomatic notes (`['note2', base, kind]`: treaty, cede, bloc,
  aid, toll). The player answers notes as dispatches (`fp_note`); AI weighs power and opinion
  (`D.noteWould`). Answers are printed in the paper.
- **Event variety** (`data/variety.js`): 56 alternative tellings of the 26 most common dispatches
  (`d.variants`, ctx.v, never the same telling twice running), 30 new dispatches, themes so two on
  one subject do not come back to back, and a repeat damper (`n.a.evN`).
- **Balance**: overstretch (over 7% of the world's land: up to −12% output, −8% attack, +4 unrest)
  and "small and well run" (under 3.5%: efficiency, science, defence, trade) refreshed each year as
  labelled mods (`Rg.sizeMods`); underdog defence up to +35% against a much stronger attacker
  (`C.underdog`, shown on the war cards); Karsova starts with "The backward giant" and related
  mods (`ID.NATIONAL.Karsova.mods`). Karsova's 1950 land share ~15% (was ~19%).
- 221 events, 735 programmes. Tools: `/tmp/diag/files.js` lists the load order for headless tests.

## Session 8: the regime, national questions, strategic combat, the banner

Feedback: longer and more impactful programme trees; more strategic combat; more specialisation
per ideology and more narrative woven into each country's play, with mechanics rather than
visuals ("like the Pavon personalist dictatorship, for every country, 10x"); the dictator
visuals should be one big banner of text; national flavour belongs to the main map, less of it
in free play.

- **The regime** (`data/regime.js`, engine `sim/regime.js`, panel `ui/regime.js`, tab **Regime**,
  key I): every state has an inner circle of five seats (army, police, economy, ideology, foreign;
  titles and body names per ideology in `ID.REGIME.body`). Figures `{k, seat, name, lean, comp,
  loy, amb, age, plot, heir}` give seat effects scaled by competence and loyalty (`Rg.SEATFX`,
  added to `n.sigm` after the doctrine), disloyal holders work against you, and holders whose
  `lean` differs pull `n.drift[lean]`. Loyalty settles toward a target (own convictions, the
  line, stability, fear after purges); disloyal and ambitious figures build `plot`: at 3 a warning
  (`rg_plot` for the player, `Rg.aiPlot` for AI), at 7 `Rg.strike` (a coup from inside; success
  makes the plotter leader and may change the ideology to his lean). Actions: win over (gold),
  name heir (auth; sets `n.flags.heir`), purge/recall/dismiss/disgrace (auth; seat weaker if
  the purged was capable). Successions (`P.newLeader`, `P.succession`) now go to the heir or the
  strongest figure (`Rg.successor`); a change of system keeps figures who believed in the new
  order and promotes one (`Rg.onIdeology`, not after elections or reforms).
- **Sessions**: each ideology has a session (party congress, imperial council, government
  programme after every election, party rally...) every 3–5 years (`body.every`) with three
  **lines** (`ID.REGIME.lines`, 66 in all): modifiers while the line stands, a one-off effect,
  gauge drift, and loyalty for the figures whose lean it matches. Player: urgent `rg_session`
  dispatch; AI: weighted pick. "Convene it now" costs 25 authority.
- **National layer** (`data/national.js`, historical campaigns on The Two Continents only,
  `Rg.national`): each of the 17 countries has a fixed cast (leader with title and traits, five
  named figures with leans; e.g. Karsova's Bronov/Dzhavakh/Burov, Pavon's Marshal Rrapaj and
  Shqiri, Antara's General Ugarte) and a **national question**: a two-pole gauge `n.nq.v` with
  monthly drift, effects, optional side effects (`tick`), three national actions and turning-point
  events at each end (34 events, `nq_*`). Pavon's bunkers are counted in `n.nq.bunkers`.
- **National projects** (`data/projects.js`): seven programmes per country appended to the
  national tree in historical campaigns (`ID.FOCUS.projects`, `f.proj`), two exclusive roads
  pulling the national question toward its poles. New fx keys: `nq`, `figLoy`, `figPurge`,
  `figHeir`, `figLeader`, `circleLoy`, `line`. Lasting modifiers of the older national
  programmes are now 1.5 times as strong. Ten national chapters (dated beats) for the countries
  that had few: Pavon (the Marshal's suspicion), Irkal (the general's ambition), Norvik, Tessaly,
  Drava, Lys (the Doge's election), Ruthe, Meridia, Kelda, Vess. 680 programmes in all.
- **Strategic combat** (`sim/combat.js`): objectives (`n.objs[enemyId] = tile`; the attack heap
  gets an A*-style distance bias `C.OBJK`, so the front becomes a spearhead; 10% faster, 6%
  costlier; taking it routs 2–6% of the defender, costs it stability, adds war weariness and
  gives a three-week surge `a.surge`). Army posture `n.posture` (Offensive, Balanced, Dig in,
  Elastic defence; 20 days of reorganisation after a change). Land doctrines in the general tree
  (staff college, then one of manoeuvre / firepower / defence in depth / the nation in arms,
  flags `ld_*`; new mod channel `mob` for the mobilisation ceiling). AI picks objectives (50%)
  and postures; the map draws the player's objectives.
- **The banner** (`ui/madness.js`): the tint, pop-ups, lying numbers, glitches and flashes are
  gone; under an absolute monarch or a personal dictator a large skewed banner of slogans scrolls
  across the map now and then (every 75 s at the first stage, every 20 s at the fourth; 7–14 s on
  screen). Settings: "Propaganda banners".
- Balance checks: historical civil wars ~4 per run, AI-played soak 5 wins / 3 survive / 9 fall,
  random-world largest state 22% on average. Tests: `/home/claude/scripts/regime.js` (WHO=...),
  `warobj.js`, `treeproj.js`, `banner.js`; `/tmp/diag/regime.js`, `objtest.js`.

## Session 10: the Old Lands, sovereignty, and three universal fixes

Brief: (A) a third continent for the historical campaign modelled on the Middle East and the post-colonial
world, whose history is done to it before it is something it does; (B) fewer repeated events, more peace, longer
programme trees. Planned in plan mode first; every metric below comes from `node tools/metrics.js`.

- **Map** (`sim/mapgen.js`, `data/names.js`): the scenario is now *The Three Continents, 1910* (id still
  `meridia`) on a new hidden size `hist` (384×288). The old blobs and nations keep their tiles (y scaled by
  216/288, noise scaled with `noiseH`; 96.6% of the old continents' tiles unchanged). The Old Lands fill the new
  southern band (`province.region = 'old'`, rows below 0.76). Saves of the old `std` map load with `sc.legacy`
  through `ID.mapOpts`.
- **States**: Varanth (empire → officers' republic), Baskhar, Amaran, Tyrrha (vilayets → mandates), Khemra
  (Norvish protectorate, the Canal), Sahrem (desert emirate, oil), Zandar (shahdom, oil concession). The Return
  (→ Neshar) and the Dersan Front (→ Dersa) are liberation fronts (`ID.FRONTS`, `G.fronts`) that become states.
- **Engine** `sim/sovereignty.js` (`ID.Sov`, generic, random worlds too): dependency (`n.dep = {over, kind, share,
  gar, res, script}`; kinds vilayet, protectorate, mandate, treaty, client, union; tribute, vetoes in
  `D.warBlock` and `Politics.lawAllowed`, garrison, deposition, petition/rise/collapse; an overlord defends its
  dependencies; a great power may take a capitulating small state as a protectorate), oil (`P.oil`, `oilFound`,
  `oilAt`, `oilCo`, `oilShare`, `canal`; price by era, ×2.5 after the 1973 shock; sell/nationalise; the crisis
  answer: accept, embargo, coup with a head start, invade with the new cb `order`), intervention (bloc leaders arm
  proxies, court the unaligned, take client bases, restore order), unions (`Sv.unite`: junior becomes kind
  `union`, tension = res), fronts (`Sv.spawn`, `Sv.frontRise`). Scenario dependencies carry `dep.script`: in
  historical mode the AI on either side waits for the chapters. New effect keys `dep`, `oil`, `front`, `union`,
  `nbOp`, `nbTreaty`; new note kinds `concession`, `base`, `arms`. Saved: provinces' oil fields, `G.fronts`.
- **Ideologies**: Third Positionism (`thirdpos`), Pan-Nationalism (`pannat`; two pan-national states not in one
  union get −75 opinion: the rival wings), Religious Revival (`revival`). Every table filled; `node
  tools/metrics.js tables` checks all 25 against every per-ideology table. Drift roads into them from junta,
  theocracy and absolute monarchy.
- **Content** `data/oldlands.js`: national layer for the seven (casts, national questions, 14 turning points),
  identities, oil fields and the Canal, about 35 chapters 1911–1975 with press stories and four superevents
  (mandates, partition, the setback of 1967, the embargo), player-only beats for Norvik, Cassine, Karsova,
  Hesperia and Aurelia. Structural beats (`b.struct`) also run quietly for campaigns that start after them
  (`ID.Story.structural`). `data/oldtrees.js`: trees, destinies, projects, foreign programmes. Fifth secret road:
  Amaran, *The Shared House* (`binational`, sim/secret.js), tested end to end.
- **UI** `ui/sovereignty.js`: the Sovereignty panel (rail tab, key U), Report items, handbook page
  "Sovereignty and oil"; oil derricks on the map (`ui/render.js`, zoom 2+). Setup lists the 24 states.
- **Events** (`data/dispatches.js` 74 new ordinary dispatches + 5 sovereignty dispatches; 6 new variant sets in
  `data/variety.js`; engine `sim/events.js`): at most 3 per kind per campaign (`def.recur`: the two harvest
  dispatches, 5), each repeat's cooldown multiplied by its count, none for the player within 3 months of a
  system/story/national dispatch (`n.a.lastSys`), at most 4 AI random draws a month world-wide, player draw
  chance capped at 0.2 and cooldown 6 months.
- **Pacing** (`sim/ai.js`, `sim/diplomacy.js`): truces 8 years; an AI state rests 4 years after a peace
  (except against a state in civil war or the runaway power); offensive call-ins only for members bordering the
  enemy, except in the two world wars (historical) and in coalitions; defensive call-ins for members that can
  reach the war; phony wars (no border, nothing taken for a year) end in white peace outside those cases; peace
  offers to a human every 6 months instead of 18; era aggression `[0.6, 0.95, 1.4, 1.1]`; historical AI −0.15
  after 1945; a coalition strong enough together declares war on its menace.
- **Trees** (`data/trees2.js`): a nine-programme branch per national tree (root → two exclusive roads of three →
  two capstones; great powers' branches act on the Old Lands), a late exclusive pair per ideology tree, and a
  mechanical pass over the 286 programmes whose effects were only numbers: each gets a neighbour, treaty or
  inner-circle effect and its "for good" modifiers last 240 months.

| Measure (10 runs, 60 years) | Before | After |
|---|---|---|
| Random dispatches to the player | 60.0 | 39.9 |
| Distinct share (avg / worst run) | 71% / 57% | 90% / 78% |
| Most times one dispatch fired | 5 | 3 |
| Pool of random dispatches | 102 | 176 |
| Historical: country-months at war (all / outside world wars) | 11% / 7% | 7% / 4% |
| Historical: peace spell median (mean) | 4.4 y (9.1) | 7.5 y (12.8) |
| Historical: world-war years at war (1916, 1940) | 34%, 50% | 38%, 27% |
| Historical: wars per run / civil wars | 23.3 / 4.2 (17 states) | 27.9 / 3.3 (24 states) |
| Historical: alliance call-ins per run | 61.5 | 52.6 |
| Historical: largest state (avg / max) | 24% / 36% | 19% / 25% |
| Random: at war / peace median / largest (avg, max) | 10% / 4.0 y / 24%, 41% | 5% / 9.5 y / 24%, 42% |
| Human proxy (accepts half of peace offers): at war / outside world wars / peace median / fell | 9% / 9% / 4.4 y / 6 of 10 | 6% / 3% / 5.4 y / 4 of 10 |
| Soak, AI playing the player (historical): won / survived / fell | 5 / 3 / 9 of 17 | 6 / 6 / 12 of 24 |
| National trees: fewest programmes / shortest playthrough | 23 / 18.0 y | 32 / 25.1 y |
| Ideology trees | 7 | 9 |

Notes: before-numbers were re-measured on the original code with the same tool (pacing runs have no player; a
first version of the tool stopped a run when the AI-played player fell). Wars per run went up in historical mode
because there are 24 states and the new continent's own wars (independence, partition, 1967, 1974); per state it
fell from 1.37 to 1.16. The target of 15 wars a run was not met. Simulate: 9 random runs, largest 23% avg, 42%
max. Fixed on the way: two crashes when a great power the chapters name has been destroyed (the 1953 coup),
and an old one in the AI's coup targeting when every candidate has stability 100. Tested by hand in the browser: setup (24 states), a Khemra campaign run 22 years in the page with every
dispatch settled by the ministers, every panel and the handbook page rendered, the programme tree, save/load
(330 KB) with oil, Canal and fronts restored, no console errors. Not seen in the browser: the oil marks on the
map, a superevent of the Old Lands, a nationalisation crisis or union from the player's side.

## Session 11: structures, industry, trade, artillery and bombing, the bomb

Brief (session 1 of 2): buildings that can be damaged, destroyed and rebuilt; fortresses with a visible, numeric
effect; industry with a real output; ports that carry trade; trade and industry that are ideological in real numbers;
a revision of artillery and bombing; an atomic bomb that is scarce, slow, costly and much stronger, plus a very late
thermonuclear bomb. The user also asked that none of it be hidden: they had played several runs without noticing
how well supplied their army was. **Session 2 (not done): cities replace the provincial "primary opposition"**
(`Pr.opp` / `Pr.oppStr` feed uprisings, civil wars, secession, liberation wars, subversion ops, three arcs, doctrine
actions, programmes, the Opposition map mode and the save format; see the plan in the session log).

- **Condition** (`sim/world.js`): `G.hp` (Uint8, 0–100, saved as `hp`; saves without it load at 100) for every
  building tile. `ID.damage(G, i, pts)`, `ID.structMonth(G, countOnly)` (monthly, first thing in `Game.month`: repairs
  +6 a month in peace, +2 at war, ×0.5–1.5 with industrial capacity, paid 0.5% of base cost per point; fills
  `n.a.nbe[type]` = buildings counted by condition, `n.a.wrecks`, `n.a.damaged`, `n.a.repairPaid`), `ID.nbe(n, t)` (falls
  back to `n.nb` for states made mid-month). A wreck (hp 0) keeps its tile and type and does nothing:
  `ID.canRebuild` / `ID.startRebuild` (half price, half time; `G.builds` entry with `re: 1`). Capture in war
  (`setOwner` while `warM` is set) costs `ID.CAPTURE_DMG` (city 30, port and factory 40; forts and silos are still
  destroyed). `n.nb` still counts every building, wrecks included (it sets build prices); everything that *does*
  something reads `ID.nbe`: output, population capacity, sea power, sea routes, the bomb's factory requirement.
- **Fortresses**: `G.fortQ` holds the condition of the strongest fort covering each tile (`recomputeForts`);
  `ID.FORT = { cost: 0.8, loss: 1.5, shelter: 0.5 }`, `ID.fortFx(G, i, style)` gives speed/loss/shelter multipliers
  after the style's `ignoreFort` (recomputes cover first if it is dirty). Same full-strength numbers as before
  (×1.8 progress cost, ×2.5 losses), now scaled by condition; new: shelling and bombing kill half as many under cover.
- **Industry** (`sim/economy.js`): `n.a.ic` = factories by condition × 12 × (1 + 0.1 × ind tech) × ore. Arms:
  `E.armsCap(n)` = ic × 0.25 (×1.2 planned); arms money beyond it buys abroad at 1.5× from trade partners with fit ≥ 1
  and spare capacity (`n.a.icSpare`), up to a quarter of need; autarky buys nothing.
- **The arsenal** (`E.ARS`, `E.arsenalMonth`, `E.kitTarget`; `n.ars`, saved with the nation; old saves and new states
  get one from their kit via `E.initArsenal`). Kit is no longer a gauge drifting toward a budget ratio (the first
  session-11 version; the user found it "not a fun mechanic"): it is a stock. In: arms made + bought each month
  (`n.a.refill`), depots captured with enemy factories and cities (3% of their arsenal each, in `setOwner`). Out: 1/24
  ages out monthly; at war `E.warBurn` = 0.6 × a month's needs × posture (attack 1.3, balanced 1, dig in 0.7, elastic
  0.9; ×0.3 with no front moving); the kit of the fallen (arsenal × 0.25 × casualties ÷ troops); shells for every
  barrage, raid or doctrine order (30% of its gold). Kit = 62% + 38% × arsenal ÷ (24 × need), 62–135%; need = army
  size smoothed over ~a year (`E.army`) × `G.stats.armsRef` (world arms per soldier, drifting 5% a month). Peace
  settles where the old formula did; a great-power war drains it over 1–2 years (Aurelia and Karsova from the high 80s
  to ~68% in 1914–16, rebuilt after). `E.monthsLeft(n)`. AI adds 8% arms when an arsenal will run dry within a year,
  and restocks after a war. Council congresses keep arms motions they passed (`n.a.mot`); budget changes and motions
  show the new target at once (`E.kitNow`); countries start at the kit they can keep.
  **Player forgiveness** (players found kit confusing and always ran dry at war): the player's war burn, fallen kit
  and shells × `E.ARS.player` 0.4 (`E.drainK`), its refill × `E.ARS.playerIn` 1.5; AI unchanged. Hands-off player,
  historical, 4 runs: median kit at war 67% → 110%, war months under 75% kit 77% → 0%. Check in `tools/structures.js`.
- **Trade**: one route per treaty in `n.a.routes` (`{o, base, fit, border, oPort, port, reach, sea, v}`). Value =
  (0.8 + `E.ROUTE_K` 0.04 × the smaller output) × reach × fit × law. Neighbours full reach; others through a working
  port at each end, `E.PORT_ROUTES` = 3 per port at full value, the rest overland at `E.OVERLAND` 35% (the old flat
  +7%-per-port bonus is gone). Fit `E.fit` = 1 + 0.3 × affinity/45 (clamped ±1) + 0.2 in a shared bloc. Who keeps it:
  market economies reinvest 30% of trade (`E.PRIV_TRADE`, into `privCap`); planned economies add 40% of trade to
  revenue (`E.PLAN_TRADE`) and value routes with market economies at ×0.8; commercial ×1.6 as before. Food imports
  need a neighbour or sea route. The AI builds ports when treaties are stuck overland.
- **Artillery and bombing** (`sim/combat.js` `C.ABIL`): kills = their troops × kill × (their land in the radius ÷
  their land), capped, × your kit × tech, ÷ their defence, × fortress shelter; per-type condition damage `dmg`.
  Barrage (kill 0.6, cap 3%): forts −50, others −15, the shaken zone as before. "Bombing raid" (renamed from air raid;
  kill 0.15, cap 1%): factories and ports −40, cities −30 with civilian deaths and war weariness, forts −15, silos −20,
  ±10% per military tech level between the two sides. The AI bombs factories, ports and cities within 50 tiles of
  its front and shells forts first. Each strike reports what it hit (news line, floating text on the map).
- **The bomb**: `E.ATOM` and `E.atom(n)` → `n.atom = {lv, on, prog, make, leaked}` (old saves: a state that built
  warheads keeps lv 1). Decisions (hidden from the State list, shown on the War panel): `atom_programme` (mil 6, 8
  working factories, 1,200 gold, then 8% of revenue a month; progress 1.2 × (ic/120, 0.4–1.6) × (0.8 + 2 × science
  share) a month to 100; foreign intelligence learns at 50), `build_nuke` (2,000 gold, 3 years, one at a time, two per
  silo), `thermo_programme` (lv 1, mil 7, 14 factories, 3,000 + 15% of revenue), `build_thermo` (6,000, 5 years, one
  per silo; `n.thermo`). `E.atomMonth` pays and advances (in `Economy.month`'s spending). The 1945 story chapter
  `sunrise` grants lv 1. `C.BOMB.atom` (destroys all within 12, ring to 18 at −50, rad 20 years, deaths 2.8 × the
  share of the country's people in the blast, at most 60%) and `C.BOMB.thermo` (22 / 34 at −70 with fallout for 10
  years, deaths 3.2 ×, at most 90%; world opinion −60, threat +120). Missiles unchanged. AI: majors (and states facing
  a nuclear enemy) start programmes when rich; thermonuclear devices are used only when dying or avenging.
- **Shown, not hidden** (`ui/ui.js`, `ui/panels.js`, `ui/render.js`, `ui/advice.js`): the arsenal card at the top of
  the War panel (store, months of needs, net flow, every flow in and out in its tooltip `UI.kitText`), months of war
  left in the top band and an "Arsenal running dry" alert at war, the enemy's kit and months left on its tile card and
  in the war list; top band (Troops shows
  `kit N%` with ▲/▼, Industry shows wrecks; both tooltips give the formula and the limiting factor), tile card
  (`UI.bldCard`: condition, what the building does now in numbers, repair rate and cost, Rebuild button; fortress
  cover row with speed/loss multipliers and a tooltip for each style; atomic and thermonuclear strike buttons with
  `UI.bombTip`), map (condition bars under damaged buildings, crossed-out grey wrecks, dashed fortress-cover rings for
  your forts and your enemies', blast and fallout rings, strike results floating over the target, trade routes drawn
  from your capital with their value while the Economy panel is open), Economy panel (industrial capacity, a Trade
  section listing each route's reach, fit and value, the Built section with wrecked/damaged counts and "Rebuild every
  wreck"), War panel (`weaponsCard`: programme progress, pace, monthly cost, stall and leak; warhead production),
  alerts (short of kit at war; wrecked buildings), the Report (kit, wrecks, stalled programme) and a Handbook page,
  "Industry, trade and the bomb", with every formula.
- Tools: `node tools/structures.js` (33 checks: damage, repair, wreck and rebuild, capture, fort numbers, a barrage
  on a fort, ports and sea trade, the arms cap, the programme, warhead production, both bombs, save round trip, an
  old save without `hp`/`atom`), `node tools/metrics.js econ [--random]` (trade share, output spread, kit, damage,
  the bomb, wars).

Before/after, same tools and seeds (`metrics.js econ`/`pacing`/`human` 8 runs, `simulate.js` 9 runs, `soak.js meridia
iron auto hist`); "before" was measured on a copy of the session 10 code:

| Measure | Before | After |
|---|---|---|
| Trade share of output, historical 1925 / 1950 / 1970 | 25% / 27% / 26% | 30% / 32% / 31% |
| Trade share of output, random | 12% / 16% / 17% | 16% / 20% / 23% |
| Output: top three states' share / richest ÷ median (historical) | 35% / 4.5× | 37% / 4.0× |
| Same, random | 44% / 3.5× | 51% / 4.1× |
| Kit at the end: average / weakest army (historical) | 1.32 / 0.96 | 1.10 / 0.75 |
| Same, random | 1.23 / 0.89 | 1.09 / 0.76 |
| States with warheads / warheads built / first warhead (historical) | 17.4 / 34.3 / 1942 | 5.1 / 9.6 / 1949 |
| Same, random | 10.4 / 20.1 / 1943 | 4.1 / 7.6 / 1952 |
| Thermonuclear states per run (historical / random) | — | 0.1 / 0.1 (0.8 in an earlier random pass) |
| Atomic strikes per run (historical) | 0.4 | 0.0 |
| Barrages / bombing raids per run (historical) | 540 / 195 | 543 / 199 |
| Historical: wars / civil wars / peace median / at war (8 runs) | 27.0 / 3.0 / 8.1 y / 7% | 28.5 / 3.3 / 7.1 y / 7% |
| Historical, 20 runs: wars / civil wars / peace median | 30.0 / 3.1 / 7.3 y | 29.3 / 3.5 / 7.0 y |
| Historical: largest state avg (max) | 19% (25%) | 20% (25%) |
| Random (simulate): wars / largest avg (max) | 21.7 / 23% (42%) | 22.2 / 24% (47%) |
| Human proxy: at war / peace median / fell | 7% / 5.2 y / 3 of 8 | 6% / 6.3 y / 5 of 8 |
| Soak, AI playing the player (historical): won / survived / fell | 6 / 6 / 12 of 24 | 3 / 10 / 11 of 24 |
| AI treasury per state at the end (historical / random) | 38.6K / 21.1K | 51.5K / 30.9K |

**After the arsenal** (same tools): kit at the end 1.11 average, 0.73 weakest; historical 20 runs: wars 31.4 (session 10
code 30.0), civil wars 3.5 (3.1), peace median 6.2 y (7.3), largest 22% (20%), max 28%; human proxy at war 7%, peace
median 6.9 y, fell 4 of 8; soak won 7 / survived 9 / fell 8 of 24; random: wars 25.6, largest avg 25%, max 56% (one
run); atomic strikes 0.5 a run. A drained state looks weak to the AI (power uses attack, which uses kit), so wars come
a little more often and peace spells are about a year shorter. If that is too much, have `considerWar` discount a
target's low kit, or slow the drain (`E.ARS.war`).

Notes: the 8-run war rise (27 → 28.5) is seed luck; on 20 runs old and new code are level (30.0 / 29.3), and with the
old kit formula the new code also gave 30.5. Soak outcomes change country by country with any code change (Cassine
conquered in 1916 before, a winner in 1950 after; Tessaly the reverse); falls are level, wins 6 → 3 on one sample
each. `metrics.js events` now shows ~60 random dispatches per run against 39 because the AI-played Aurelia and
Cassine fell within a few years in the old runs (8 and 7 dispatches) and survived in the new ones; the per-survivor
rate is unchanged (~60–64), max repeats 3 in both. **Gold hoarding got worse** (richer trade, and AI does not spend
it): a soft spot to fix with an AI spending pass. The AI almost never uses the bomb now (aura, but untested in play).

Tested in the browser pane (1952 Cassine save from a 42-year AI-played historical campaign): Economy panel with the
trade table and route lines on the map, Built section, tile cards for a fortress (exact numbers), a damaged factory
(condition, repair rate) and an enemy fort, an enemy bombing raid on our factories (news line, floating text,
condition bars and a crossed-out wreck on the map, the wreck alert, the Report item), our barrage on an enemy fort, an
atomic strike from the tile card button (blast, irradiation, headline, news), the War panel's Strategic weapons card,
the Handbook page, the troops/industry tooltips, every panel opened and six seconds of play with no console errors,
save and reload through `localStorage`. Also seen: a running thermonuclear programme's card (progress, pace, cost,
formula tooltip) and a thermonuclear strike from the tile card (51% of Aurelia dead, the region white with
irradiation). Not seen in the browser: the old-save path (headless only), the AI deciding to use the bomb.

## Session 12: phones and tablets

The game now plays on a phone in either orientation. Desktop layout is unchanged (screenshots at
1440×900 match the previous build pixel for pixel).

- **Two switches.** `UI.touch` (`(pointer: coarse)`) changes wording ("tap", "press and hold") and
  turns on press-and-hold tooltips; `UI.compact` (`(max-width: 760px), (max-height: 500px)`) is the
  phone layout. Both live at the top of `js/ui/ui.js` and re-render the HUD when they change. The
  `<html>` element carries `.touch` for CSS.
- **CSS.** Everything is in the last section of `css/style.css` ("phones and tablets"): a shared
  compact block, a portrait block (`max-width: 760px and min-height: 501px`: panel tabs on a bar at
  the bottom, stats on a second, sideways-scrolling row of the top band, selection as a bottom
  sheet) and a landscape block (`max-height: 500px`: left rail scrolls, one-row top band, selection
  on the right). Key off height for landscape: an iPhone on its side is only 750px wide.
- **Folding.** On a phone the map modes and the alerts each fold into one button (`acts.modesTog`,
  `acts.alertsTog`); the war bar folds its posture/order/style rows behind "Orders" (`acts.atkTog`);
  numbered speed buttons give way to one cycling button (`acts.speedCycle`). With a panel open the
  floating cards hide (`#hud.dopen`); in portrait the war bar hides under the selection sheet
  (`#hud.selopen`). Setup puts the nation card inline at the top of the list (`.pickcard.inl`).
- **Touch input.** Holding a finger 460 ms on anything with `data-tip` shows its tooltip above the
  finger and swallows the click; holding on the map shows the tile summary the mouse gets on hover
  (`tileTip` in `js/ui/main.js`). The fake mousemove a tap produces is ignored, and `UI.retip` only
  refreshes a tooltip already open while the last input was a finger, so tooltips no longer stick
  after taps. Tapping an aimed order again cancels it (there is no Esc). Autosave also runs on
  `pagehide` and when the tab is hidden on a touch device. The viewport disallows page zoom and iOS
  `gesturestart` is cancelled, so pinching the interface never zooms the page.
- **Wording.** The tutorial has a `TOUCH` table of replacement texts by step; the Handbook's
  first page gains an "On a touch screen" controls table; title and toasts say tap, not Space.
- Checked in Chromium emulation (iPhone 13 both ways, iPhone SE, Pixel 7) with real touch events:
  tap, hold, drag, folding, speed, modes, panels, dialogs, programme tree, tutorial. Not checked
  on a physical device.

## Session 13: four more ideologies

The user asked for Juche, Left Accelerationism, Right Accelerationism and National Syndicalism. Each is
wired the way the session 10 systems are, so the checklist for a new ideology is now:

1. `data/ideologies.js`: the `def({...})`, plus drift roads from older systems in the loop after it.
2. `data/doctrine.js`: `D[id]` (gauge, drift, fx, low/high, 4 actions, war trait `dp`, war order).
3. `data/regime.js`: `R.body[id]` and three `R.lines[id]`.
4. `data/ideotrees.js` `tree(...)` and `data/trees2.js` `late(...)`.
5. `data/names.js`: leader title, `START_WEIGHTS`, `SIT_FOR`. `ui/flags.js`: `EMBLEM_OF` (and an emblem in `EMB`).
6. `sim/politics.js`: `classSupport` and `pickOpp` if the family default does not fit; `ELECTORAL` if it can
   win elections; `oppositionParty` if it holds them.
7. Decisions in `data/events.js` gate by `ideos: [...]`; add the new id where a decision fits.
8. `node tools/ideocheck.js` checks 1–5 for every ideology, then forces the named ones on states and runs
   four 30-year worlds exercising every action and order, with a save round trip.

What the four are:

- **Juche** (`juche`, socialist, ringstar): plan economy with Five-Year Plans, `succession` + `cult` flags and
  `banner: 'leader'` (the autocrat's banner of `ui/madness.js`). Gauge *Self-reliance*: fed by autarky,
  drained by trade, dependence, famine and defeat; high = legitimacy, stability, defence, low trade and
  efficiency. War: the fortress country (home defence, capital, hold fast). Order: the reserve militia.
  Objective: twenty years of autarky, a succession, self-reliance 70. Drifts to absmon (red dynasty),
  junta, marketsoc; reached from ml and mao by drift. Opens five_year_plan, party_purge, cult_campaign,
  autarky_drive.
- **National Syndicalism** (`natsyn`, authoritarian, arrows): a pact economy leaning to labour, workers and
  military ruling. Gauge *Syndical mobilisation* (workers' support, victories, fervour; capital's power
  drains it). War: shock squads (atkMul, aloss, brittle). Order: a national strike in the enemy's factories.
  Drifts to corporatist, ansyn, natpop; reached from ansyn, natpop, corporatist, and now one of the
  ideologies a coup can install (`P.coupIdeo`). Opposition movements grow among unhappy urban workers in
  unstable states.
- **Left/Right Accelerationism** were replaced in the same session (see Session 13b).

Calibration (6 unforced 66-year worlds, 3 Three Continents + 3 random): as opposition movements the four
sit with the rarer systems (province-years: rightacc ~1600, juche ~700, natsyn ~550, leftacc ~470, against
liberal ~12000 and technocracy ~180); as regimes they arise about as often as trot, pannat or thirdpos
(0–1 per world). They can always be chosen on the setup screen.

Also fixed two session 10 war traits that used multipliers as if they were bonuses: Third Positionism's
`homeDef: 0.15` (home defence ×0.15) is now 1.15, and the Religious Revival's `wePace: -0.5, bleed: 0.15`
(war weariness *falling* with casualties, occupiers bleeding less) is now `wePace: 0.5, bleed: 1.15`.

## Session 13b: the accelerated systems and National Socialism

The user found the two accelerationisms dull and asked for **Techno-Socialist Accelerationism** ("ultra-trotskyism,
spread your ideas fast"), **NRX/Landian Accelerationism** (industry and research) and **National Socialism**, which
can become **Nazi Accelerationism** ("a fire which must feed on more countries or die out", devastating choices and
pop-ups). Accelerationist systems get major advantages and punish being slow. `leftacc`/`rightacc` are gone.

- **New file `js/data/accel.js`** (loads after `data/doctrine.js`) holds the four doctrines and their dispatches.
  Two engine hooks were added: a doctrine may define `month(G, n)` (called from `Doctrine.month` after the gauge
  moves; errors are not swallowed) and `extra(n, G)` (rows `[label, text, good]` shown on the doctrine card).
  The accelerated gauges cancel or exceed the usual pull toward 50 so they fall hard unless fed; direct feeding
  in `month` bypasses the ±4 monthly clamp.
- **technosoc** (socialist, permRev): gauge *Velocity* (−2.6 a month, fed by movement strength abroad, a
  revolution carried abroad in the last two years, advancing wars, industry). ±50 around the middle gives up to
  ±40% research, ±20% attack, ±15% front speed, ±6 legitimacy, unrest and faster drift when low. Monthly
  broadcast seeds its movement in 1 + velocity/25 countries, shared among all techno-socialist states (one
  network: reach / count, strength / √count); the largest of them (the hub) can tip a ripe country (movement
  20%+, stability < 40) into revolution. Velocity < 8 brings `ts_thermidor` (become ml, or purge and go faster).
  Order: *The signal* (targeted seeding, instant uprising if stability < 45). `dip.export` 1.0: at 1.4 the AI
  ran coup plots everywhere and one random world ended with 21 techno-socialist states.
- **nrx** (heterodox, market): gauge *Acceleration* (−2.4 a month, fed by industry growth ×250, +4 per tech
  level gained, confidence, the science budget; slumps, strikes, welfare and losing wars brake it). High: up to
  +25% industry, +40% research, a free factory every 12 months at 70+, and above 80 the *intelligence explosion*
  adds research equal to last month's × (gauge−75)/25. Below 25 capital flight (6% of the treasury a month);
  below 10 `nx_board` (technocracy, personalist, or cut everything and go faster).
- **natsoc** (authoritarian, ELECTORAL, succession + cult, the leader banner): gauge *Radicalisation*, a ratchet
  (drift cancels the pull to 50; climbs ~6 years to 100 with programmes and wars). It gives attack, mobilisation,
  coup protection and quiet streets, and costs research and trade. Mechanics in `sigx`: `rearm` (secret
  rearmament: industry +12%, attack +5%, `bills` grow by 4 + revenue/4 a month), `bills` (paid off by conquered
  tiles, 40% off per state destroyed; above `80 + 24×revenue` the `ns_bills` crisis: war, print money, guns before
  butter, or default), `patience` (the world's, 100; each ultimatum −22 on success, −8 on refusal; at 0 the end of
  appeasement: threat ≥ 75 so every power has the coalition cause for war). *An ultimatum* demands two claimed
  provinces of the weakest claimed neighbour through `Diplomacy.noteAnswer('cede')` (the player as target gets
  the normal `fp_note`). Persecution is the act *Laws against the "enemy within"*: radicalisation, and only costs
  (research −10% for good, intelligentsia, opinion), recorded in the chronicle as a crime. At radicalisation 92+
  in a war going badly, `ns_twilight` offers the road into the fire (plus a drift to nazacc).
- **nazacc** (authoritarian, `noPeace`, the new `fire` banner in `ui/madness.js`): gauge *The fire*, −4 a month
  plus `hunger` = 1.5 × (growth over its size when it became the fire) + 0.4 × years in power. Fed by land taken
  (up to +10 a month), +12 per new war, +25 per enemy state destroyed (`n.cnt.consumed`). Up to +28% attack,
  +21% speed, +12% mobilisation and weariness growth ×0.3 at 100. It cannot propose or accept peace while the fire
  is above 10 (`Diplomacy.wantsPeace`/`evalProposal`), always annexes what capitulates (`Diplomacy.capitulate`),
  AI declares on the weakest neighbour whenever at peace, the player gets `nz_hunger`. Every 4–7 months one of
  seven devastating dispatches (`nz_nero`, `nz_children`, `nz_ally`, `nz_cities`, `nz_wonder`, `nz_generals`,
  `nz_starve`; `when(n, G, ctx)` gates them). At 0 the fire goes out: coup to junta, troops ×0.6, stability 15,
  weariness 85, `nz_ashes` for the player.
- Calibration (one state forced into each, 4 seeds × 2 maps, 40 years, AI only): nazacc grows 2–7× and burns out
  in 6–10 years; natsoc lasts 8–36 years and in about half the runs becomes the fire; technosoc either stalls and
  falls within 6–20 years or spreads to 2–10 states; nrx holds 16–40 years with the gauge mostly 70–95, then the
  curve breaks and the board revolts. Unforced worlds: technosoc and nrx movements appear from 1940 in
  industrial states; natsoc rarely takes power on its own (drifts are rare everywhere in this game).
- Content choices: no swastika or SS imagery (natsoc has an eagle in a ring, nazacc a flame), no real-world
  extremist slogans in the banner; the theory texts describe these systems critically, and atrocity choices carry
  heavy costs and are recorded in the chronicle.

## Session 14: carrying on, the doctrine audit, Tessaly and Meridia remade

- **No forced ending** (`sim/game.js`, `ui/screens.js`). `G.won[type]` records each victory; `V.yearly` skips
  what the player has already won. `Gm.canCarryOn` / `Gm.carryOn`: after a victory, the 1976 verdict
  (`G.endless`), another power's domination (`G.ack['dom' + id]`), or a coup or revolution that leaves the
  country alive (the player then leads the new regime through `changeIdeology`). The end screen shows
  *Keep playing* / *Play on past 1976* / *Fight on anyway* / *Carry on under the new regime*. Saved.
- **Doctrine audit** (theory against mechanics): Juche loses self-reliance as someone else's junior partner
  and arms the whole people (mob); National Syndicalism's war order is now *Squads behind the lines* (a
  nationalist movement does not call international strikes; key `nsy_squads`); technosoc velocity is fed by
  new technology too and pays an automation dividend in living standards; NRX erodes tradition and the
  clergy above 50 and gains *Dismantle the Cathedral*; National Socialism gains *The people's community*.
- **Tessaly and Meridia** (`js/data/campaign13.js`, loaded last): replaces their scenario entry (ideology,
  situation, blurb), `ID.IDENTITY`, `ID.NATIONAL` (leader, cast, national question with `tick`), the whole
  national tree (`ID.FOCUS.nations`, projects emptied; destinies tamed as in destiny.js), and their story
  chapters (`st_te_strike` and `st_me_election` removed; `st_tn_cassine` 1912, `st_tn_verano` 1917,
  `st_tn_memo` 1928, `st_tn_race` / `st_mx_race` 1947, `st_mx_vote` 1919, `st_mx_antara` 1931, `st_mx_crash`
  1953). Tessaly's tree: the signal (Verano federation or absorption, the broadcast to Cassine, Karsova's
  offer or denunciation, the Network International, Vess), the machines (white coal, watchmakers, accelerate
  or the fifteen-hour week, the engine under the mountain, publish or keep it), the cantons (the wire or the
  valleys, Signal Security, purge or *Consolidate* into Juche, councils on the wire), the militia (lightning
  revolution or the alpine redoubt); destinies Planetary Signal, Automated Commonwealth, Alpine Fortress,
  Federation of Free Signals. Meridia's tree: the company (shares or exit, dismantle or buy the Cathedral,
  formalism or the founder's golden share, charter cities, the executive's court), the curve (grid,
  Polytechnic, foundries, Sunstone, difference engines, orbit, buy Tessaly's engineers or jam its signal), the
  markets (Cassine listing or Hesperian contracts, Antara's copper concession or the officers' account, the
  Old Lands, a leased bay), security; destinies Singularity, Patchwork, Crowned Company. The secret road of the
  Model now opens to an NRX Meridia at acceleration 82 (or an engineers' Meridia at 70). Cassine's League now
  allies Norvik instead of Tessaly; its arsenal aid goes to Kelda.
- **Spread of techno-socialism** after the campaign tests (in one early version 20+ states went techno-socialist):
  the broadcast's reach and strength are divided by the number of network states, only the hub tips countries
  and only while the network has four states or fewer, `dip.export` 0.6, and the AI does not back coups for a
  broadcasting ideology (`flags.broadcast`; the player still may). Six historical and six free campaigns
  afterwards: Tessaly usually survives to the late 1940s or 50s, ends anywhere from the Planetary Commune to
  the Alpine Fortress, and in one run in three its revolution spreads to a dozen states; Meridia survives in
  all, ending as the Continuum, the Patchwork, the Crowned Company, a junta or a social democracy.

## Food rework: granaries, growth that follows the harvest, city markets

Players found food the worst mechanic: famine came out of nowhere and cities caused it (each city is room for
400 people, they grew into it, and 96 more food a month tipped the country under the 93% line).
- **Granaries** (`n.grain`, months of need, saved with the nation; `E.GRAIN_START` 3, `E.GRAIN_MAX` 6): surplus
  fills them, a shortfall draws them down before grain is bought abroad; famine only when both run out.
  `n.a.harvest` = harvest ÷ need before stores and imports (read it through `E.harvest(n)`); `n.foodBal` is now
  what people actually eat. AI research, the focus picker and the two food crisis measures read the harvest.
  `E.grainMonths(n)` is the clock: on the top band (only while draining), food tooltip, Economy panel, an alert
  under 12 months (red under 4) and advice.
- **Growth follows food** (`C.tickPop`): growth × clamp((harvest − `E.GROW_AT` 1.05) × 20, 0, 1), so a population
  settles where its land feeds it and never grows into famine.
- **City markets**: each working city adds `E.CITY_FOOD` 4% to the harvest (up to `E.CITY_FOOD_MAX` 25%).
- Measured with `node tools/food.js` (self-check plus 4 runs × 40 years): famine 0.2% → 0% of country-months
  in normal play; famine still follows a real shock (a 70% harvest under autarky starves after the stores, ~30
  months in the check). World population +25% at 40 years (cities now fill), troops +5%, living standards
  +2, stability +2.

## Plan quotas: the first specialization engine (PLAN.md engine B, Marxism-Leninism)

- **Yearly quotas** (`flags.quotas`, Marxism-Leninism only; Maoism and Juche keep the old end-of-plan check).
  `E.startPlan` adds `p.grain` (harvest against need, 100–105%) and `p.arms` (arms output, `n.a.armsMade`) to
  the industry target. On each anniversary `quotaYear` checks all three (2% tolerance); industry follows
  `(y/5)^2` of the way to the plan target, the curve plans actually grow on. All met: fervour and party unity,
  no prompt. A miss queues `plan_short` (a tray dispatch): admit, blame the managers, find the saboteurs, or
  **report false figures** (`E.lie`: the claimed figure goes to `n.paper`, distortion +6).
- **The paper** (`n.paper`, `n.paperSince`; cleared on a change of regime). A gap closes when the real figure
  catches up. The next plan starts from the reported industry figure (`p.lie` records the lift).
  `E.paperRisk` (a month) = gap × 0.012 × (0.5 + distortion/100) × (1 + times buried); the arms gap counts ×4
  while the army is fighting. Exposure (`plan_exposed`, never in or within a year of a civil war): shoot the
  planners, publish the true figures, or bury it again (authority 20, the next leak comes sooner).
  `E.clearPaper` rebases a lifted plan on the real figures.
- Economy panel: this year's three quotas, what is on paper since when, and the exposure risk (low, rising, high).
- `node tools/quotas.js [--runs 16 --years 60]`: self-check plus the PLAN.md bands. First tuning: a straight
  industry path and a kit-based arms quota missed in 76% of plan years; now about 37%.

## The specialization engines (PLAN.md engines A, C–I, and B beyond Marxism-Leninism)

`js/data/engines.js`, loaded last among the data scripts. `hook(key, {month, extra, acts, drop})` layers each
engine onto a doctrine: its `month` runs after the doctrine's own, its `extra` rows follow, its actions are
appended (`drop` removes old ones). State lives in `n.sigx` and resets with the doctrine on a change of system.
Continuous effects use `keep(n, label, k, v)`, a two-month modifier refreshed each month (timed modifiers stack).
- **Forbidden verbs**: `ID.FORBID[ideo][verb]` (a reason or a function), read through `ID.forbid(G, n, verb, t, wild)`
  by `P.lawAllowed` ('law:cat:opt'; 'law:cat:*' only explains options the law list already excludes),
  `Ev.decisionBlock` ('dec:id'), `Ev.options` ('emergency': options that start emergency rule are not offered;
  the AI's annulled election is skipped too), `D.evalProposal` ('ally', 'nap', 'trade', 'peace', from the
  proposer's side) and `ID.canBuild` ('build:factory', 'build:city'; forts and ports are never forbidden). `buildFree` (programme and charter buildings)
  does not check it.
- **A, pledges** (liberal, conmon, demsoc, natpop): up to three dated promises (`n.sigx.pl`), acts `pl_<ideo>_<id>`;
  `always` promises break the moment they fail, the rest are judged at the due date (the next election for the
  democracies). `PL_OUT` holds each twist. Democratic socialism's `patience` (−22 per promise kept, coup at 0);
  natpop's `np_more` ladder; conmon's three prerogatives a reign (`cm_dissolve`, `cm_back`, `cm_refuse`).
  The junta's handover clock (`x.ho`, victories +1 year, civil wars won +2, `ju_postpone`, `ju_deadline`; a third
  postponement brings a coup). Theocracy's three edicts set `n.flags.edict_*`, which `ID.FORBID.theocracy` reads.
- **B, targets**: technocracy forecasts (`tc_fc_bold` 6%, `tc_fc_safe` 1%; two misses → `tc_replaced`); market
  socialism's quota (`x.q`, share sold at market 50/30/12%, `x.ineq`, `ms_square` at 70); cybernetic focus
  (`cy_point_*`; any cybernetic state makes plan lies 1.5× likelier to be exposed, in `E.paperRisk`); NRX guidance
  (`nx_guide_high` 5%, `nx_guide_low` 1%; a missed high guidance under acceleration 30 can cost the leader).
- **C, the table** (`table` dispatch, ctx `{sys, seats, dem}`): socdem, corporatist and junta seats in `SEATS`,
  grudges `x.gr` (0–5, −0.5 a year) and their effects in `GRUDGE`; corporatist `cp_abolish` once a reign.
  Council `co_motions` (lobby two of three, each passes on its odds). Third Positionism `tp_offers`. Personalist
  `pe_test` on the least loyal figure of the circle.
- **G**: the anarcho-syndicalist strike fund (`x.fund`, `an_dues`, `an_gstrike`; the war order's strike also
  lasts longer from the fund). Agrarian `ag_harvest` each autumn and `ag_consent` when the cities go hungry.
- **I, the instrument** (`x.inst`; mao, natsyn, revival, natsoc): growth in `INST`, a loose and a rein action
  each, unrest past 80, `inst_turn` past 85. Natsyn's squads can be bought by capital (`nsy_capital`); the
  revival's guard skims revenue; `ns_knives` ends the street army for good (`n.flags.knives`).
- **H, the heir** (absmon, conmon, juche, personalist): `x.heir {edu, prog}`, `heir_edu`, twenty years of the
  education's bonus after a succession (a rise in `n.cnt.successions`, so a leader retiring at an election does not count); `am_marry` and inherited claims;
  juche's `jc_title` track (a succession under 100 is a crisis); personalist `pe_succ` / `pe_unsucc`.
- **E**: anarcho-communist orders in occupied communes (`ac_ambush`, `ac_rail`, `ac_rise`; unsupplied communes
  drain the gauge). **F**: minarchist charters (`mi_charter`, a free building six months later, `mi_company` at four),
  merchant routes (`x.routes`, +6% trade each, cut by war), juche guidance (`jc_guide`), theocratic holy sites
  (`G.holy` via `ID.holySites(G)`: three provinces picked from the map seed, not `G.rng`, so the map can draw them
  from the start; claimed by every theocracy). `ui/render.js` draws both after the capitals: every merchant
  republic's routes as gold dashed curves (the player's bold), holy sites as gold diamonds, labelled when zoomed in.
- **D, the chain** (trot, pannat, technosoc, revival): links from `changes(G)` (who changed system this month),
  or the broadcast's `n.a.spreadAt` for technosoc; at most four, broken after two years; the multiplier is the
  chain divided by the number of states of that system; each link raises threat. Trotskyism broken twice →
  `tr_chain_thermidor`; Pan-Nationalism's other wing → `pn_schism`.
- **Balance, measured** (`tools/engines.js --runs 16`, against `ID_SKIP=engines`). A scenario fixes its own seed,
  so historical runs only differ when the tool reseeds `G.rng` after `newGame` (it does now); before that, the
  four historical games of an 8-run soak were one game counted four times, and the snowball figure flipped
  between 0 and 4 of 8 on any change. With varied runs: a chain system above 25% of the states in 5 of 16
  games with the engines and 4 of 16 without (the techno-socialist spread of session 14, one historical run in
  three); techno-socialism 1172 state-years with the engines, 1447 without. Kept from the misleading round:
  minarchies may build forts and ports (only works and towns are forbidden) and techno-socialism's chain adds
  no broadcasts.
- **The world pushes back** (`sim/world.js`: `ID.ideoShare`, `ID.spreadDamp`, `ID.saturated`), for every ideology:
  movements seeded abroad with a sponsor (`ID.docSeed`) grow fully below 8% of the living states and not at all
  at 20%; a victor whose system holds 15% annexes instead of installing (`diplomacy.js`), an overlord no longer
  imposes it on a dependency (`sovereignty.js`), and techno-socialism's signal sparks no instant uprising.
  Measured (16 varied games, `$TEMP/routes.js`-style count of `changeIdeology` into technosoc): the spread came
  from sponsored revolutions (19) and governments imposed after wars (16), never on its own. After: a chain
  system above 25% of the states in 0 of 16 games (largest 23%, was 63%), techno-socialism 816 state-years
  (1447 in the base game). `ID_ENG_OFF=ideo,…` and `ID_FORBID_OFF=all|ideo,…` switch parts off (both skip the self-check).
- `node tools/engines.js [--runs 16 --years 50 --seed 17]`: self-check (every system for four years with every action,
  every new dispatch, seven forbidden verbs, and the twists: a broken promise at the election, a grudge, the
  officers' coup, laws a new system forbids, the usury edict, holy war and fellow theocracies) and the soak. `ID_SKIP=engines` (read by `tools/load.js`) measures the
  game without the file.

## Peace by ideology (`sim/diplomacy.js`)

- `D.terms(G, win, lose, score)`, called by every negotiated peace with a winner (not civil wars), returns the
  clause the news adds. Liberal family: reparations of 40 + 260 × |score| that the loser borrows (`debt`) and the
  victor banks, and bases (a `treaty` dependency) when the score is above 0.35 and the loser is not a major
  power. Conservative family: `lose.trib = {to, share 6–16%, until}`, paid monthly out of revenue in `D.month`
  (ends after ten years, or at war with the receiver). Socialist and anarchist families: the victor's movement
  seeded in the loser (damped by `ID.spreadDamp`). Others: land only, as before.
- `D.dictate(G, L, Wn)`: a capitulation on liberal or conservative terms. The loser is released, then bound as
  a treaty state after 300 in reparations (liberal) or as a vilayet (absmon, theocracy, revival) or protectorate
  (conmon, agrarian). The AI uses it instead of annexing any state over 60 tiles; the player gets *Reparations
  and bases* or *Make them a tributary* on the capitulation dispatch.
- Alert: *Tribute to X* while one is owed. Counters `cnt.reparations`, `cnt.tributes`, `cnt.dictated`.

## Published (end of session 2)

- Playable artifact: slug `b44285db-2e8b-4266-bfe0-39315542a8b3` (https://claude.ai/artifact/PG38qVqd6iMyayLf4gaVKx), live version `1795284426-2662` (version 15) with the dev console (` key, js/ui/devconsole.js),
  published from files (index.html, css, js, fonts). To update after edits, republish with
  `publish_files` using the slug and the live version from `get_artifact`.
- GitHub Pages zip: `/home/claude/iron-dialectic.zip` (rebuild with the zip command in the session log:
  `zip -rq ../iron-dialectic.zip index.html README.md DESIGN.md HANDOFF.md css js fonts tools`).

Ideas not yet done, in rough priority: a second handcrafted scenario; per-ideology unique events
for the rarer systems (cybernetic, minarchy, merchant have few); a "keep watching" mode after
defeat; touch-screen layout for tablets; translating the handbook theory text into in-game
examples drawn from the current campaign.

## Deliverables at the end

1. The folder zipped for GitHub Pages (upload contents to a repo, enable Pages on the root).
2. `README.md` with controls and how to host.
3. Optionally a single-file bundle for an instant-play artifact (inline CSS/JS/fonts).
4. Update `DESIGN.md` §8 if file layout changes, and delete or update this handoff file.
