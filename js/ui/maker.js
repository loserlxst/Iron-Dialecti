/* IRON DIALECTIC — the scenario maker. What you paint is what you get: terrain, rivers, who owns which tile, cities,
   factories, ports and forts, tile by tile, with brush, fill and pick tools, a preview of the brush, undo and redo.
   The generator that made the starting land is locked unless you open it, and the growth of states into unpainted land
   and the automatic buildings are switches. Scenario options: start year, each state's treasury, stability, alliance and
   overlord. The map is drawn beside the panel (above it on a phone), never under it. Left click, drag, scroll and pinch
   only: a drag with a brush paints, a drag on a capital or a continent handle moves it, two fingers always pan. */
(function () {
  'use strict';
  const ID = (globalThis.ID = globalThis.ID || {});
  const UI = ID.UI, R = ID.Render, M = ID.Maps, esc = ID.esc, T = ID.T, B = ID.B;
  const acts = UI.acts, btn = UI.btn, tip = UI.tip, $ = UI.$;
  const MK = (ID.Maker = {});
  const store = { get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } } };
  const hex = (c) => '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
  const r4 = (v) => Math.round(v * 1e4) / 1e4;
  const NOBODY = 255; // painted as nobody's land

  /* ---------------------------------------------------------------- state */
  let def = null, W = 0, H = 0, N = 0;
  let base = null;            // the generator's land alone ({terrain, river}); all sea when the generator is off
  let pT, pR, O, Bd;          // painted terrain and river (-1: not painted), owner (0: unpainted, k+1, NOBODY), hand-placed building
  let PG = null, checks = [], timer = 0, slot = -1;
  let tab = 'terrain', open = true, genOpen = false, selN = -1, selB = -1, armed = false, grab = null, hov = -1;
  const tool = { mode: 'brush', t: T.PLAINS, river: 0, r: 1, owner: 1, bld: B.CITY };
  const undoS = [], redoS = [];

  const sz = () => ID.MAP_SIZES[def.size];
  const terr = (i) => (pT[i] >= 0 ? pT[i] : base.terrain[i]);
  const riv = (i) => (terr(i) === T.SEA ? 0 : pR[i] >= 0 ? pR[i] : base.river[i]);
  function dims() { W = sz().W; H = sz().H; N = W * H; }
  function relayout() {
    if (def.gen === false) { base = { terrain: new Uint8Array(N), river: new Uint8Array(N) }; return; }
    const o = Object.assign(ID.mapOpts(def, def.seed, def.size), { paint: null, rivers: null, region: null });
    let m = ID.genMap(o);
    if (def.level == null && m.level != null) { def.level = r4(m.level); m = ID.genMap(Object.assign(o, { level: def.level })); } // an absolute sea level: moving one shape moves one coast
    base = { terrain: m.terrain, river: m.river };
  }
  function loadGrids() {
    dims(); pT = new Int8Array(N).fill(-1); pR = new Int8Array(N).fill(-1); O = new Uint8Array(N); Bd = new Uint8Array(N);
    for (const [s, l, v] of def.paint || []) pT.fill(v, s, Math.min(N, s + l));
    for (const [s, l, v] of def.rivers || []) pR.fill(v, s, Math.min(N, s + l));
    for (const [s, l, v] of def.own || []) O.fill(v, s, Math.min(N, s + l));
    for (const [i, t] of def.blds || []) if (i < N) Bd[i] = t;
  }
  /* The grids back into the definition: diffs against the generator, runs of territory, a list of buildings. */
  function saveGrids() {
    const tN = new Uint8Array(N), rN = new Uint8Array(N), bR = base.river.slice(), oN = new Uint8Array(N), blds = [];
    for (let i = 0; i < N; i++) { tN[i] = terr(i); rN[i] = riv(i); if (tN[i] === T.SEA) bR[i] = 0; else { oN[i] = O[i]; if (Bd[i]) blds.push([i, Bd[i]]); } }
    def.paint = M.diff(base.terrain, tN); def.rivers = M.diff(bR, rN); def.own = M.diff(new Uint8Array(N), oN); def.blds = blds;
  }
  function rebuild(layout) {
    clearTimeout(timer); timer = 0; if (!def) return;
    if (layout || !base) relayout();
    saveGrids();
    const cam = Object.assign({}, R.cam), had = !!PG;
    try { PG = M.build(def, { headless: false }); checks = M.check(def, PG); }
    catch (e) { checks = [{ lvl: 'err', text: e.message || String(e) }]; if (!PG) { panel(); return; } }
    PG.paused = true;
    R.setGame(PG); mapMode(); R.quiet = true; R.selected = -1;
    panel();
    if (had) { Object.assign(R.cam, cam); R.pan(0, 0); }
  }
  const mapMode = () => { const m = tab === 'terrain' || tab === 'land' ? 'terrain' : 'political'; if (R.mode !== m || (PG && PG.mapMode !== m)) R.setMode(m); }; // terrain tools show the terrain
  const soon = (layout) => { clearTimeout(timer); timer = setTimeout(() => rebuild(layout), 30); };

  /* ---------------------------------------------------------------- undo */
  const meta = () => { const d = Object.assign({}, def); delete d.paint; delete d.rivers; delete d.own; delete d.blds; return JSON.stringify(d); };
  const snap = () => ({ m: meta(), pT: pT.slice(), pR: pR.slice(), O: O.slice(), Bd: Bd.slice() });
  function push() { undoS.push(snap()); if (undoS.length > 40) undoS.shift(); redoS.length = 0; }
  function restore(s) {
    const lay = JSON.parse(s.m), relay = lay.size !== def.size || lay.seed !== def.seed || lay.level !== def.level || lay.gen !== def.gen || JSON.stringify(lay.blobs) !== JSON.stringify(def.blobs);
    Object.assign(def, lay); dims(); pT = s.pT; pR = s.pR; O = s.O; Bd = s.Bd; if (selN >= def.nations.length) selN = -1; rebuild(relay);
  }
  acts.mkUndo = () => { if (!undoS.length) return; redoS.push(snap()); restore(undoS.pop()); };
  acts.mkRedo = () => { if (!redoS.length) return; undoS.push(snap()); restore(redoS.pop()); };

  /* ---------------------------------------------------------------- entering and leaving */
  MK.open = function (d, s) {
    def = M.validate(JSON.parse(JSON.stringify(d)));
    if (def.mg < 2) def.mg = 2; // older maps are upgraded: provinces and rivers become local, painted borders become possible
    slot = s == null ? -1 : s; PG = null; base = null; selN = -1; selB = -1; armed = false; genOpen = false; open = true; undoS.length = 0; redoS.length = 0; tab = 'terrain';
    ID.Main.mode = 'maker'; ID.Main.bg = null; UI.G = null; UI.closeModal(); $('#hud').hidden = true; $('#coach').hidden = true;
    loadGrids(); relayout();
    const t = $('#title'); t.className = 'screen setup maker'; t.hidden = false;
    R.overlay = overlay; delete $('#map').dataset.mkfit;
    rebuild();
  };
  MK.close = function () { clearTimeout(timer); R.overlay = null; def = null; PG = null; const c = $('#map'); c.style.left = c.style.width = c.style.height = ''; delete c.dataset.mkfit; R.resize(); };
  MK.def = () => def;
  MK.relayout = () => panel();

  /* ---------------------------------------------------------------- the panel */
  const field = (label, inner, note) => '<div class="field"><label>' + label + '</label>' + inner + (note ? '<small>' + note + '</small>' : '') + '</div>';
  const seg = (cur, list, act) => '<div class="seg wrap grow">' + list.map((x) => '<button class="' + (cur === x[0] ? 'on' : '') + '" data-act="' + act + '" data-a=\'' + esc(JSON.stringify(x[0])) + '\'' + (x[2] ? tip(x[2]) : '') + '>' + x[1] + '</button>').join('') + '</div>';
  const slider = (act, v, lo, hi, step, label, shown) => '<div class="sl" style="grid-template-columns:92px 1fr 56px"><span>' + label + '</span><input type="range" min="' + lo + '" max="' + hi + '" step="' + step + '" value="' + v + '" data-change="' + act + '"><b>' + (shown != null ? shown : v) + '</b></div>';
  const toggle = (act, on, label, note) => '<label class="chk"><input type="checkbox" data-change="' + act + '"' + (on ? ' checked' : '') + '> <span>' + label + (note ? ' <span class="dim">' + note + '</span>' : '') + '</span></label>';
  const TABS = [['scenario', 'Scenario'], ['terrain', 'Terrain'], ['territory', 'Borders'], ['states', 'States'], ['buildings', 'Buildings'], ['land', 'Generator']];
  const SIZES = [[0, '1'], [1, '3'], [2, '5'], [3, '7'], [5, '11'], [8, '17'], [12, '25']];
  const HELP = {
    scenario: 'The whole map: its name, start year and size, what the game fills in for you, problems to fix before play, saving and sharing.',
    terrain: 'Paint the ground itself: sea, plains, forest, mountains, rivers. Terrain decides food, people, and how hard land is to attack.',
    territory: 'Paint which state owns each tile. Painted land is theirs at the start, exactly as drawn.',
    states: 'Add, move and edit the states: capital, name and flag, treasury, stability, alliances and overlords.',
    buildings: 'Place cities, factories, ports and forts on exact tiles.',
    land: 'The generator made the starting land from round shapes and noise. Unlock it to reshape continents.',
  };
  function panel() {
    if (!def) return;
    const t = $('#title'), old = t.querySelector('.pick .db'), top = old ? old.scrollTop : 0;
    const errs = checks.filter((c) => c.lvl === 'err').length;
    let h = '<div class="pick maker' + (open ? '' : ' shut') + '"><div class="dh"><h2>Map maker</h2>' +
      '<button class="x" data-act="mkUndo"' + tip('Undo (Ctrl+Z)') + (undoS.length ? '' : ' disabled') + '>↶</button><button class="x" data-act="mkRedo"' + tip('Redo (Ctrl+Y)') + (redoS.length ? '' : ' disabled') + '>↷</button>' +
      '<button class="x" data-act="mkOpen"' + tip(open ? 'Fold the panel away' : 'Show the panel') + '>' + (open ? '–' : '+') + '</button><button class="x" data-act="mkQuit"' + tip('Back to the title screen') + '>✕</button></div>';
    if (open) {
      h += '<div class="mktabs">' + TABS.map((x) => '<button class="' + (tab === x[0] ? 'on' : '') + '" data-act="mkTab" data-a=\'"' + x[0] + '"\'>' + x[1] + (x[0] === 'scenario' && checks.length ? ' <i class="' + (errs ? 'bad' : 'warn') + '">' + checks.length + '</i>' : '') + '</button>').join('') + '</div><div class="db">';
      h += '<p class="mkhelp">' + HELP[tab] + '</p>';
      h += ({ scenario: scenarioPanel, terrain: terrainPanel, territory: borderPanel, states: statesPanel, buildings: bldPanel, land: genPanel })[tab]();
      h += '</div><div class="ft">' + btn('Play this map', 'mkPlay', null, { cls: 'big red', tip: 'Go to the new campaign screen with this map, pick a state and begin.', off: errs ? 'Fix the problems listed under Scenario first.' : '' }) + '<span class="sp"></span>' + btn('Save', 'mkSave', null, { cls: 'ghost', tip: 'Keep this map in this browser. Open it again from Map maker on the title screen.' }) + btn('Share', 'mkCode', null, { cls: 'ghost', tip: 'Make a code anyone can paste into Load code to play or edit this map.' }) + '</div>';
    }
    h += '</div><div id="mkstat"></div>';
    t.innerHTML = h;
    const db = t.querySelector('.pick .db'); if (db) db.scrollTop = top;
    fitCanvas(); status();
  }
  function modes() {
    const what = { brush: 'Drag over the map to paint the tiles under the brush.', fill: 'Click once to paint a whole connected area: every touching tile of the same kind.', pick: 'Click a tile to copy what it is into the brush, then paint with it.' };
    return field('Tool', seg(tool.mode, [['brush', 'Brush', '<h5>Brush (B)</h5>' + what.brush], ['fill', 'Fill', '<h5>Fill (F)</h5>' + what.fill], ['pick', 'Pick', '<h5>Pick (I)</h5>' + what.pick]], 'mkMode'), what[tool.mode]);
  }
  function scenarioPanel() {
    let h = field('Name', '<input type="text" maxlength="' + M.LIM.name + '" value="' + esc(def.name) + '" data-change="mkName" style="width:100%">');
    h += field('Start year', seg(def.year || 1910, M.YEARS.map((y) => [y, y + '', y === 1910 ? 'The Age of Empires' : y === 1925 ? 'The Age of Masses' : 'The Age of Total War: the industry, arms and science of 1940']), 'mkYear'));
    h += field('Map size', seg(def.size, Object.keys(ID.MAP_SIZES).map((k) => [k, ID.MAP_SIZES[k].name + ' <small>' + ID.MAP_SIZES[k].W + '×' + ID.MAP_SIZES[k].H + '</small>']), 'mkSize'), 'Everything you painted is stretched to the new size.');
    h += field('What the game fills in for you', toggle('mkGrow', def.grow !== false, 'States grow into land you have not painted', '(off: only painted land and each capital’s province are owned)') + toggle('mkAutoB', def.autoBld !== false, 'Add the usual cities, factories, ports and forts', '(off: only the ones you place, and a city at each capital)'));
    const errs = checks.filter((c) => c.lvl === 'err');
    h += field('Problems before play', checks.length ? '<ul class="checks">' + checks.map((c) => '<li class="' + (c.lvl === 'err' ? 'bad' : 'warn') + '">' + esc(c.text) + '</li>').join('') + '</ul>' + (errs.length ? '<small>Red problems stop play; fix them first.</small>' : '<small>These are warnings: you can still play.</small>') : '<small class="good">No problems: ready to play.</small>');
    h += field('Save and share', '<div class="row">' + btn('Open a preset or a saved map', 'mkPresets', null, { cls: 'sm' }) + btn(slot >= 0 ? 'Save' : 'Save as a new map', 'mkSave', null, { cls: 'sm', tip: 'Keep this map in this browser.' }) + '</div><div class="row" style="margin-top:6px">' + btn('Copy code', 'mkCode', null, { cls: 'sm', tip: 'A text code for this map that anyone can paste into Load code.' }) + btn('Load code', 'loadCode', null, { cls: 'sm ghost', tip: 'Open a map from a code someone gave you.' }) + btn('Export file', 'mkExport', null, { cls: 'sm ghost', tip: 'Download the map as a .idmap file: easier to share for big maps.' }) + '<label class="b sm ghost"' + tip('Open a .idmap file.') + '>Import file<input type="file" accept=".idmap,application/json" data-change="mkImport" hidden></label></div>');
    h += '<p class="dim" style="font-size:13.5px">Countries of the Three Continents keep their own programmes and destinies wherever you put them. Every other state gets the family and ideology programmes, as on random worlds. The scripted history belongs to the Three Continents campaign.</p>';
    return h;
  }
  function terrainPanel() {
    const TT = ID.TERRAIN;
    let h = modes();
    h += field('Terrain to paint', '<div class="tswatch">' + [0, 1, 2, 3, 4, 5, 6].map((k) => '<button class="' + (!tool.river && tool.t === k ? 'on' : '') + '" data-act="mkBrush" data-a="' + k + '"><i style="background:' + (k === 0 ? '#abbcb8' : hex(TT[k].col)) + '"></i>' + TT[k].name + '</button>').join('') +
      '<button class="' + (tool.river === 1 ? 'on' : '') + '" data-act="mkRiver" data-a="1"' + tip('Add a river along the tiles you paint. Rivers make farmland richer.') + '><i style="background:#4a7a9a"></i>Add river</button><button class="' + (tool.river === -1 ? 'on' : '') + '" data-act="mkRiver" data-a="-1"' + tip('Remove rivers from the tiles you paint.') + '><i class="no"></i>Erase river</button></div>', ID.TERRAIN[tool.t] && !tool.river ? (tool.t === T.SEA ? 'Sea drowns land.' : ID.TERRAIN[tool.t].desc || '') : '');
    if (tool.mode === 'brush') h += field('Brush size <span class="dim" style="font-weight:500">([ and ])</span>', seg(tool.r, SIZES, 'mkSizeB'));
    let n = 0; for (let i = 0; i < N; i++) if (pT[i] >= 0 || pR[i] >= 0) n++;
    h += field('Your terrain painting', '<div class="row"><span>' + n + ' tiles painted</span>' + btn('Erase it all', 'mkClearPaint', null, { cls: 'sm ghost', tip: 'Remove all terrain and rivers you painted: the land goes back to what the generator made.', off: n ? '' : 'Nothing is painted.' }) + '</div>', UI.touch ? 'One finger paints; two fingers move and zoom the map.' : 'Drag to paint. Scroll or two fingers move the map; Ctrl+scroll or pinch zooms.');
    return h;
  }
  function borderPanel() {
    let h = modes();
    h += field('Paint land for', '<div class="olist">' + def.nations.map((d, k) => { const n = PG && PG.nations[k + 1]; return '<button class="' + (tool.owner === k + 1 ? 'on' : '') + '" data-act="mkOwner" data-a="' + (k + 1) + '"><i style="background:' + (n ? n.css : '#888') + '"></i>' + esc(d.base) + '</button>'; }).join('') +
      '<button class="' + (tool.owner === NOBODY ? 'on' : '') + '" data-act="mkOwner" data-a="' + NOBODY + '"' + tip('Nobody’s land: unclaimed hinterland that any state may take without a war.') + '><i style="background:#f0e9d6"></i>Nobody</button><button class="' + (tool.owner === 0 ? 'on' : '') + '" data-act="mkOwner" data-a="0"' + tip('Erase painted borders: the tile goes to whichever state grows into it.') + '><i class="no"></i>Erase</button></div>', def.grow !== false ? 'Land you leave unpainted goes to the nearest states as they grow (switch below).' : 'Land you leave unpainted belongs to nobody (growth is switched off below).');
    if (tool.mode === 'brush') h += field('Brush size', seg(tool.r, SIZES, 'mkSizeB'));
    let n = 0; for (let i = 0; i < N; i++) if (O[i]) n++;
    h += field('Your borders', '<div class="row">' + btn('Lock in the borders you see', 'mkBakeOwn', null, { cls: 'sm', tip: '<h5>Lock in the borders</h5>Paint every tile with the owner it has now. Then nothing you change elsewhere (moving a capital, a new state) moves these borders, and you can adjust them tile by tile.' }) + btn('Erase all', 'mkClearOwn', null, { cls: 'sm ghost', tip: 'Remove all painted borders: every state grows from its capital again.', off: n ? '' : 'Nothing is painted.' }) + '</div><small>' + n + ' tiles painted.</small>' + toggle('mkGrow', def.grow !== false, 'States grow into land you have not painted', '(off: that land belongs to nobody)'));
    return h;
  }
  function statesPanel() {
    let h = '<div class="row" style="margin-bottom:8px">' + btn(armed ? 'Click the map for its capital…' : 'Add a state', 'mkArm', null, { cls: 'sm' + (armed ? ' red' : ''), off: def.nations.length >= M.LIM.nations ? 'A map can have at most ' + M.LIM.nations + ' states.' : '' }) + '<span class="dim">' + def.nations.length + ' states</span></div><small class="dim" style="display:block;margin:-4px 0 8px">' + UI.tap('Click a state on the map or in the list to select it. Drag its square capital marker to move it.') + '</small>';
    const d = def.nations[selN];
    if (d) {
      const n = PG && PG.nations[selN + 1], others = def.nations.filter((x) => x !== d);
      h += '<div class="note mksel"><div class="row nw">' + (n ? ID.Flags.html(n, 'sflag') : '') + '<b style="font-size:17px">' + esc(d.base) + '</b><span class="dim">' + (n ? n.tiles + ' tiles · ' : '') + (ID.FOCUS.nations[d.key] ? esc(d.key) + '’s programmes' : 'family programmes') + '</span></div>';
      h += '<div class="row" style="margin:6px 0">' + btn('Edit country…', 'mkEdit', null, { cls: 'sm red', tip: 'Name, flag, colour, system, situation, leader, motto and more' }) + btn('Paint its land', 'mkPaintAs', null, { cls: 'sm', tip: 'Open the Borders tab with this state on the brush.' }) + btn('Delete', 'mkDelN', null, { cls: 'sm ghost' }) + '</div>';
      if (def.grow !== false) h += slider('mkWeight', d.w, 0.3, 2.5, 0.05, 'Growth') + '<small class="dim">How far it spreads into unpainted land against its neighbours: higher takes more.</small>';
      h += slider('mkGold', d.gold != null ? d.gold : -10, -10, 1500, 10, 'Treasury', d.gold != null ? d.gold : 'default');
      h += slider('mkStab', d.stab != null ? d.stab : 4, 4, 95, 1, 'Stability', d.stab != null ? d.stab : 'default');
      h += '<div class="mkgrid"><label>Alliance</label><select data-change="mkBloc"><option value="0">None</option>' + [1, 2, 3, 4, 5, 6, 7, 8].map((b) => '<option value="' + b + '"' + (d.bloc === b ? ' selected' : '') + '>Alliance ' + 'ABCDEFGH'[b - 1] + ' (' + def.nations.filter((x) => x.bloc === b).length + ')</option>').join('') + '</select>' +
        '<label>Overlord</label><select data-change="mkOver"><option value="">None: independent</option>' + others.map((x) => '<option value="' + esc(x.key) + '"' + (d.over === x.key ? ' selected' : '') + '>' + esc(x.base) + '</option>').join('') + '</select>' +
        (d.over ? '<label>As its</label><select data-change="mkDep">' + Object.keys(ID.Sov.KIND).map((k) => '<option value="' + k + '"' + (d.dep === k ? ' selected' : '') + '>' + esc(ID.Sov.KIND[k].name) + '</option>').join('') + '</select>' : '') + '</div>';
      h += '<small class="dim">Default (far left) lets the game set the treasury and stability from the state’s situation. States in the same alliance start in one bloc. A state with an overlord starts as its dependency: the overlord takes a share of its revenue and decides its wars.</small></div>';
    }
    h += '<div class="mklist">' + def.nations.map((x, k) => { const n = PG && PG.nations[k + 1]; return '<button class="nrow' + (k === selN ? ' on' : '') + '" data-act="mkSelN" data-a="' + k + '">' + (n ? ID.Flags.html(n, 'mini') : '') + '<b>' + esc(x.base) + '</b><small>' + esc(ID.IDEOLOGIES[x.ideo].name) + ' · ' + esc(ID.SITUATIONS[x.sit].name.toLowerCase()) + (x.bloc ? ' · alliance ' + 'ABCDEFGH'[x.bloc - 1] : '') + (x.over ? ' · under ' + esc((def.nations.find((o) => o.key === x.over) || {}).base || '') : '') + '</small></button>'; }).join('') + '</div>';
    return h;
  }
  function bldPanel() {
    const L = [[B.CITY, 'City'], [B.FACTORY, 'Factory'], [B.PORT, 'Port'], [B.FORT, 'Fort'], [0, 'Remove']];
    const WHAT = { [B.CITY]: 'Cities hold people and count toward growth and output.', [B.FACTORY]: 'Factories make industry: arms, building and output.', [B.PORT]: 'Ports carry trade and ships. Only on a coast.', [B.FORT]: 'Forts slow and bleed attackers around them.', 0: 'Remove a building you placed.' };
    let h = field('Click a tile to place', seg(tool.bld, L, 'mkBld'), WHAT[tool.bld] + ' ' + UI.tap('Red squares mark the buildings you placed.'));
    let n = 0; for (let i = 0; i < N; i++) if (Bd[i]) n++;
    h += field('Your buildings', '<div class="row"><span>' + n + ' placed</span>' + btn('Lock in the buildings you see', 'mkBakeB', null, { cls: 'sm', tip: '<h5>Lock in the buildings</h5>Every building now on the map becomes one you placed, and the game stops adding its own. Then remove or add exactly what you want.' }) + btn('Erase all', 'mkClearB', null, { cls: 'sm ghost', off: n ? '' : 'None placed.' }) + '</div>');
    h += toggle('mkAutoB', def.autoBld !== false, 'Also add the usual cities, factories, ports and forts', '(by each state’s size and situation)');
    return h;
  }
  function genPanel() {
    let h = '<p class="dim" style="font-size:14px;margin:-2px 0 10px">What you paint in Terrain lies on top of the generator and always stays.</p>';
    if (def.gen === false) return h + '<div class="note">The generator is off: the map is only what you painted.</div><div class="row" style="margin-top:8px">' + btn('Turn the generator back on', 'mkGenOn', null, { cls: 'sm' }) + '</div>';
    h += toggle('mkGenOpen', genOpen, 'Unlock the generator', '(reshape continents; your painting stays on top)');
    if (genOpen) {
      h += field('Sea level', slider('mkLevel', Math.round((def.level != null ? def.level : 0.4) * 100), -20, 120, 1, 'Level'), 'Higher drowns more land. Only coasts near sea level move.');
      h += field('Noise', '<div class="row nw"><input type="text" value="' + def.seed + '" data-change="mkSeed" style="width:110px">' + btn('New coastlines', 'mkReseed', null, { cls: 'sm ghost', tip: 'A new noise seed: every generated coast changes.' }) + '</div>');
      h += field('Shapes (' + def.blobs.length + ')', '<div class="row">' + btn('Add a continent', 'mkAddBlob', 0.14, { cls: 'sm' }) + btn('Add an island', 'mkAddBlob', 0.04, { cls: 'sm' }) + '</div>' +
        (selB >= 0 && def.blobs[selB] ? '<div class="note" style="margin-top:8px"><b>Selected shape</b>' + slider('mkBlobR', Math.round(def.blobs[selB][2] * 1000), 10, 350, 1, 'Size') + btn('Delete it', 'mkDelBlob', null, { cls: 'sm ghost' }) + '</div>' : ''), UI.tap('Drag a round handle to move a shape; click one to select it.'));
    }
    h += field('Stop generating', '<div class="row">' + btn('Turn the generator off, keep the land', 'mkBake', null, { cls: 'sm', tip: 'All the land becomes painted land. Nothing generated can change it again. The code gets longer.' }) + btn('Empty sea', 'mkEmpty', null, { cls: 'sm ghost', tip: 'Turn the generator off and remove all land you did not paint.' }) + '</div>');
    return h;
  }

  /* The map is drawn beside the panel (above it on a phone held upright); a status line sits on the map. */
  function fitCanvas() {
    const pk = $('#title .pick.maker'), c = $('#map'); if (!pk) return;
    const r = pk.getBoundingClientRect(), sheet = r.top > 40 && r.width >= innerWidth - 4;
    const L = !sheet && open ? Math.round(r.right) : 0, Hh = sheet ? Math.max(140, Math.round(r.top)) : 0;
    const want = [L ? L + 'px' : '', L ? 'calc(100% - ' + L + 'px)' : '', Hh ? Hh + 'px' : ''];
    if (c.style.left !== want[0] || c.style.width !== want[1] || c.style.height !== want[2]) {
      c.style.left = want[0]; c.style.width = want[1]; c.style.height = want[2]; R.resize();
      if (PG && !c.dataset.mkfit) { R.fit(); c.dataset.mkfit = 1; }
    }
    const st = $('#mkstat'); if (st) { st.style.left = (L + 10) + 'px'; st.style.bottom = (sheet ? innerHeight - Hh + 8 : 10) + 'px'; }
  }
  /* What a click or drag on the map does right now, in words. */
  function action() {
    const sizeW = tool.r * 2 + 1, br = tool.mode === 'fill' ? 'Fill' : tool.mode === 'pick' ? 'Pick' : 'Brush ' + sizeW + '×' + sizeW;
    if (tab === 'terrain') return tool.mode === 'pick' ? 'Pick: click to copy a tile’s terrain' : br + ': ' + (tool.river > 0 ? 'add river' : tool.river < 0 ? 'erase river' : ID.TERRAIN[tool.t].name);
    if (tab === 'territory') return tool.mode === 'pick' ? 'Pick: click to copy a tile’s owner' : br + ': ' + (tool.owner === 0 ? 'erase borders' : tool.owner === NOBODY ? 'nobody’s land' : (def.nations[tool.owner - 1] || {}).base);
    if (tab === 'buildings') return 'Click: ' + (tool.bld ? 'place a ' + ID.BUILDINGS[tool.bld].name.toLowerCase() : 'remove a placed building');
    if (tab === 'states') return armed ? 'Click land: new capital' : 'Click: select a state · drag a capital: move it';
    if (tab === 'land' && genOpen) return 'Drag a round handle: move a shape';
    return UI.touch ? 'Two fingers move and zoom' : 'Drag or scroll moves, Ctrl+scroll zooms';
  }
  function status() {
    const st = $('#mkstat'); if (!st || !PG) return;
    if (hov < 0) { st.textContent = action() + (UI.touch ? '' : ' · Ctrl+Z undoes'); return; }
    const i = hov, o = PG.owner[i], P = PG.provinces[PG.prov[i]];
    st.textContent = action() + '  ▸  ' + (i % W) + ', ' + ((i / W) | 0) + ' · ' + ID.TERRAIN[PG.terrain[i]].name + (PG.river[i] ? ', river' : '') + (PG.terrain[i] === T.SEA ? '' : ' · ' + (o ? PG.nations[o].base : 'nobody') + (O[i] ? ' (painted)' : def.grow !== false ? ' (grown)' : '') + (P ? ' · province ' + P.id + ', ' + P.tiles + ' tiles' : '') + (PG.bld[i] ? ' · ' + ID.BUILDINGS[PG.bld[i]].name + (Bd[i] ? ' (placed)' : '') : ''));
  }

  /* ---------------------------------------------------------------- drawing on the map */
  function foot(i) { // the tiles a brush covers
    const out = [], x0 = i % W, y0 = (i / W) | 0, r = tab === 'buildings' ? 0 : tool.r;
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { if (dx * dx + dy * dy > r * r + r) continue; const x = x0 + dx, y = y0 + dy; if (x >= 0 && y >= 0 && x < W && y < H) out.push(y * W + x); }
    return out;
  }
  function overlay(ctx, sx, sy, z) {
    if (!def || !PG) return;
    ctx.save();
    if (z >= 7) { // the tile grid, once tiles can be told apart
      const cv = $('#map'), hw = cv.clientWidth / 2 / z, hh = cv.clientHeight / 2 / z;
      const x0 = Math.max(0, Math.floor(R.cam.x - hw)), x1 = Math.min(W, Math.ceil(R.cam.x + hw)), y0 = Math.max(0, Math.floor(R.cam.y - hh)), y1 = Math.min(H, Math.ceil(R.cam.y + hh));
      ctx.strokeStyle = 'rgba(23,20,15,0.13)'; ctx.lineWidth = 1; ctx.beginPath();
      for (let x = x0; x <= x1; x++) { const X = Math.round(sx(x)) + 0.5; ctx.moveTo(X, sy(y0)); ctx.lineTo(X, sy(y1)); }
      for (let y = y0; y <= y1; y++) { const Y = Math.round(sy(y)) + 0.5; ctx.moveTo(sx(x0), Y); ctx.lineTo(sx(x1), Y); }
      ctx.stroke();
    }
    if (tab === 'buildings') { ctx.strokeStyle = '#c8281e'; ctx.lineWidth = 2; const s = Math.max(6, z * 0.9); for (let i = 0; i < N; i++) if (Bd[i]) ctx.strokeRect(sx(i % W + 0.5) - s, sy(((i / W) | 0) + 0.5) - s, s * 2, s * 2); }
    if (hov >= 0 && (tab === 'terrain' || tab === 'territory' || tab === 'buildings') && tool.mode !== 'fill') { // exactly what the next click changes
      ctx.fillStyle = 'rgba(200,40,30,0.28)'; ctx.strokeStyle = '#c8281e'; ctx.lineWidth = 1.5;
      const L = tool.mode === 'pick' ? [hov] : foot(hov);
      for (const i of L) ctx.fillRect(sx(i % W), sy((i / W) | 0), z, z);
      ctx.strokeRect(sx(hov % W), sy((hov / W) | 0), z, z);
    }
    if (tab === 'land' && genOpen) def.blobs.forEach((b, k) => {
      const X = sx(b[0] * W), Y = sy(b[1] * H), r = b[2] * W * 0.72 * z, on = k === selB;
      ctx.strokeStyle = on ? 'rgba(200,40,30,0.95)' : 'rgba(23,20,15,0.45)'; ctx.lineWidth = on ? 2.5 : 1.5; ctx.setLineDash(on ? [] : [5, 4]);
      ctx.beginPath(); ctx.arc(X, Y, Math.max(4, r), 0, 6.3); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = on ? '#c8281e' : '#ebe2cc'; ctx.strokeStyle = '#17140f'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(X, Y, UI.touch ? 9 : 7, 0, 6.3); ctx.fill(); ctx.stroke();
    });
    if (tab === 'states' || tab === 'territory') {
      ctx.font = '700 13px Barlow Condensed, sans-serif'; ctx.textAlign = 'center';
      def.nations.forEach((d, k) => {
        const n = PG.nations[k + 1]; if (!n) return;
        const ci = n.capital, X = sx(ci % W + 0.5), Y = sy(((ci / W) | 0) + 0.5), on = k === selN && tab === 'states', s = UI.touch ? 8 : 6;
        ctx.fillStyle = n.css; ctx.strokeStyle = on ? '#c8281e' : '#17140f'; ctx.lineWidth = on ? 3.5 : 2; ctx.fillRect(X - s, Y - s, s * 2, s * 2); ctx.strokeRect(X - s, Y - s, s * 2, s * 2);
        if (tab === 'states') { const label = d.base.toUpperCase(), tw = ctx.measureText(label).width + 8; ctx.fillStyle = on ? '#c8281e' : '#17140f'; ctx.fillRect(X - tw / 2, Y + s + 3, tw, 16); ctx.fillStyle = '#ebe2cc'; ctx.fillText(label, X, Y + s + 15); }
      });
    }
    ctx.restore();
  }

  /* ---------------------------------------------------------------- editing tiles */
  function paintTiles(L) {
    for (const i of L) {
      if (tab === 'terrain') {
        if (tool.river) { if (terr(i) !== T.SEA) { pR[i] = tool.river > 0 ? 1 : 0; PG.river[i] = pR[i]; } }
        else { pT[i] = tool.t; PG.terrain[i] = tool.t; if (tool.t === T.SEA) { PG.owner[i] = 0; PG.river[i] = 0; } }
      } else if (tab === 'territory') {
        if (terr(i) === T.SEA) continue;
        O[i] = tool.owner; if (tool.owner && tool.owner !== NOBODY) PG.owner[i] = tool.owner; else if (tool.owner === NOBODY) PG.owner[i] = 0;
      }
      PG.dirty.push(i);
    }
  }
  /* The connected tiles that look the same as the start: same terrain (Terrain) or same owner on land (Borders). */
  function region(i0) {
    if (tab === 'territory' && PG.terrain[i0] === T.SEA) return [];
    const t0 = PG.terrain[i0], o0 = PG.owner[i0];
    const same = tab === 'terrain' ? (i) => PG.terrain[i] === t0 : (i) => PG.terrain[i] !== T.SEA && PG.owner[i] === o0;
    const seen = new Uint8Array(N), out = [i0], st = [i0]; seen[i0] = 1;
    while (st.length) { const c = st.pop(), x = c % W; for (const n of [x > 0 ? c - 1 : -1, x < W - 1 ? c + 1 : -1, c - W, c + W]) if (n >= 0 && n < N && !seen[n] && same(n)) { seen[n] = 1; st.push(n); out.push(n); } }
    return out;
  }
  function pick(i) {
    if (tab === 'terrain') { tool.t = PG.terrain[i]; tool.river = 0; }
    else tool.owner = O[i] || (PG.owner[i] ? PG.owner[i] : NOBODY);
    tool.mode = 'brush'; panel();
  }

  /* ---------------------------------------------------------------- pointer (from js/ui/main.js) */
  const near = (px, py, pts) => { const [mx, my] = R.mapAt(px, py), z = R.cam.z, lim = UI.touch ? 24 : 16; let best = -1, bd = lim; pts.forEach((p, k) => { if (!p) return; const d = Math.hypot((p[0] - mx) * z, (p[1] - my) * z); if (d < bd) { bd = d; best = k; } }); return best; };
  const capPts = () => def.nations.map((d, k) => { const n = PG.nations[k + 1]; return n ? [n.capital % W + 0.5, ((n.capital / W) | 0) + 0.5] : null; });
  const blobPts = () => def.blobs.map((b) => [b[0] * W, b[1] * H]);
  MK.hover = function (px, py) { if (!def || !PG) return; const i = R.tileAt(px, py); if (i !== hov) { hov = i; status(); } };
  MK.down = function (px, py) {
    if (!def || !PG) return false;
    const i = R.tileAt(px, py); hov = i;
    if (tab === 'land' && genOpen) { const k = near(px, py, blobPts()); if (k >= 0) { push(); selB = k; grab = { k: 'blob' }; panel(); return true; } }
    else if (tab === 'states' && !armed) { const k = near(px, py, capPts()); if (k >= 0) { push(); selN = k; grab = { k: 'cap' }; panel(); return true; } }
    else if ((tab === 'terrain' || tab === 'territory') && i >= 0) {
      if (tool.mode === 'pick') { pick(i); return true; }
      push();
      if (tool.mode === 'fill') { paintTiles(region(i)); grab = { k: 'paint' }; return true; }
      grab = { k: 'paint', x: px, y: py }; paintTiles(foot(i)); return true;
    }
    return false;
  };
  MK.move = function (px, py) {
    if (!grab) return;
    const [mx, my] = R.mapAt(px, py), j = R.tileAt(px, py); hov = j;
    if (grab.k === 'blob') { const b = def.blobs[selB]; b[0] = r4(ID.clamp(mx / W, -0.1, 1.1)); b[1] = r4(ID.clamp(my / H, -0.1, 1.1)); }
    else if (grab.k === 'cap') { if (j >= 0 && PG.terrain[j] !== T.SEA) { const d = def.nations[selN]; d.x = r4((j % W + 0.5) / W); d.y = r4((((j / W) | 0) + 0.5) / H); const n = PG.nations[selN + 1]; if (n) n.capital = j; } }
    else if (grab.k === 'paint' && grab.x != null) {
      const steps = Math.max(1, Math.ceil(Math.hypot(px - grab.x, py - grab.y) / Math.max(2, R.cam.z * 0.6)));
      for (let s = 1; s <= steps; s++) { const t = R.tileAt(grab.x + ((px - grab.x) * s) / steps, grab.y + ((py - grab.y) * s) / steps); if (t >= 0) paintTiles(foot(t)); }
      grab.x = px; grab.y = py;
    }
  };
  MK.up = function (tap) {
    const g = grab; grab = null; if (!g) return;
    if (g.k === 'paint') soon(false);
    else if (!tap) soon(g.k === 'blob');
    else undoS.pop(); // a click on a handle that moved nothing
  };
  MK.tap = function (px, py) {
    if (!def || !PG) return;
    const i = R.tileAt(px, py);
    if (tab === 'states') {
      if (armed) { if (i >= 0) addNation(i); return; }
      let k = near(px, py, capPts());
      if (k < 0 && i >= 0 && PG.owner[i]) k = PG.owner[i] - 1;
      selN = k; panel();
    } else if (tab === 'buildings' && i >= 0) {
      if (PG.terrain[i] === T.SEA) return;
      if (tool.bld === B.PORT && !PG.coast[i]) { UI.toast('A port must be on a coast.'); return; }
      if (!tool.bld && !Bd[i] && PG.bld[i]) { UI.toast(def.autoBld !== false ? 'That building is automatic. Press Keep the buildings you see first, then remove it.' : 'That is a capital’s city.'); return; }
      push(); Bd[i] = tool.bld; rebuild();
    } else if (tab === 'land' && genOpen) { selB = near(px, py, blobPts()); panel(); }
  };
  function addNation(i) {
    if (PG.terrain[i] === T.SEA) { UI.toast('A capital must be on land.'); return; }
    push();
    const used = new Set(def.nations.map((d) => d.key).concat(def.nations.map((d) => d.base)));
    const rng = new ID.RNG((Date.now() ^ (i * 2654435761)) >>> 0), nm = ID.genName(rng, used), ideos = Object.keys(ID.START_WEIGHTS).filter((k) => ID.START_WEIGHTS[k] > 0), ideo = rng.weighted(ideos, (k) => ID.START_WEIGHTS[k]);
    def.nations.push({ key: nm.base, base: nm.base, adj: nm.adj, x: r4((i % W + 0.5) / W), y: r4((((i / W) | 0) + 0.5) / H), w: 1, ideo, sit: rng.pick(ID.SIT_FOR[ideo]) });
    selN = def.nations.length - 1; armed = false; rebuild();
  }

  /* ---------------------------------------------------------------- keys */
  document.addEventListener('keydown', (e) => {
    if (ID.Main.mode !== 'maker' || !def || UI.modalKind) return;
    const el = document.activeElement; if (el && ((el.tagName === 'INPUT' && el.type === 'text') || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT')) return;
    const k = e.key.toLowerCase(), mod = e.ctrlKey || e.metaKey;
    if (mod && k === 'z') { e.preventDefault(); if (e.shiftKey) acts.mkRedo(); else acts.mkUndo(); }
    else if (mod && k === 'y') { e.preventDefault(); acts.mkRedo(); }
    else if (mod) return;
    else if (k === 'b' || k === 'f' || k === 'i') { tool.mode = k === 'b' ? 'brush' : k === 'f' ? 'fill' : 'pick'; panel(); }
    else if (k === '[' || k === ']') { const L = SIZES.map((s) => s[0]), j = Math.max(0, Math.min(L.length - 1, L.indexOf(tool.r) + (k === ']' ? 1 : -1))); tool.r = L[j]; panel(); }
  });

  /* ---------------------------------------------------------------- actions */
  const change = (fn, layout) => { push(); fn(); rebuild(layout); };
  acts.mapMaker = () => acts.mkPresets();
  acts.mkQuit = () => { MK.close(); ID.Screens.title(); };
  acts.mkOpen = () => { open = !open; panel(); };
  acts.mkTab = (a) => { tab = a; armed = false; mapMode(); panel(); };
  acts.mkMode = (a) => { tool.mode = a; panel(); };
  acts.mkName = (v) => { def.name = ID.Custom.clean(v, M.LIM.name) || def.name; panel(); };
  acts.mkYear = (a) => change(() => { def.year = a; });
  acts.mkGrow = (v, el) => change(() => { def.grow = el.checked; });
  acts.mkAutoB = (v, el) => change(() => { def.autoBld = el.checked; });
  /* A new size stretches every painted grid to it (nearest tile). */
  acts.mkSize = (a) => {
    if (a === def.size) return; push();
    const oW = W, oH = H, src = { pT, pR, O, Bd };
    def.size = a; def.paint = []; def.rivers = []; def.own = []; def.blds = []; loadGrids();
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const j = Math.min(oH - 1, Math.floor((y * oH) / H)) * oW + Math.min(oW - 1, Math.floor((x * oW) / W)), i = y * W + x; pT[i] = src.pT[j]; pR[i] = src.pR[j]; O[i] = src.O[j]; }
    for (let j = 0; j < src.Bd.length; j++) if (src.Bd[j]) Bd[Math.min(H - 1, Math.floor((((j / oW) | 0) * H) / oH)) * W + Math.min(W - 1, Math.floor(((j % oW) * W) / oW))] = src.Bd[j];
    rebuild(true);
  };
  acts.mkBrush = (a) => { tool.t = a; tool.river = 0; if (tool.mode === 'pick') tool.mode = 'brush'; panel(); };
  acts.mkRiver = (a) => { tool.river = a; tool.mode = 'brush'; panel(); };
  acts.mkSizeB = (a) => { tool.r = a; panel(); };
  acts.mkClearPaint = () => change(() => { pT.fill(-1); pR.fill(-1); });
  acts.mkOwner = (a) => { tool.owner = a; if (tool.mode === 'pick') tool.mode = 'brush'; panel(); };
  acts.mkBakeOwn = () => change(() => { for (let i = 0; i < N; i++) if (PG.terrain[i] !== T.SEA && !O[i]) O[i] = PG.owner[i] || NOBODY; });
  acts.mkClearOwn = () => change(() => O.fill(0));
  acts.mkBld = (a) => { tool.bld = a; panel(); };
  acts.mkBakeB = () => change(() => { for (let i = 0; i < N; i++) if (PG.bld[i] && PG.bld[i] !== B.SILO) Bd[i] = PG.bld[i]; def.autoBld = false; });
  acts.mkClearB = () => change(() => Bd.fill(0));
  acts.mkArm = () => { armed = !armed; panel(); if (armed) UI.toast(UI.tap('Click the land where the new state’s capital should be.'), true); };
  acts.mkSelN = (k) => { selN = k; const n = PG && PG.nations[k + 1]; if (n) R.focus(n.capital); panel(); };
  acts.mkPaintAs = () => { tab = 'territory'; tool.owner = selN + 1; tool.mode = 'brush'; mapMode(); panel(); };
  const setN = (fn) => { const d = def.nations[selN]; if (d) change(() => fn(d)); };
  acts.mkWeight = (v) => setN((d) => { d.w = ID.clamp(+v, 0.3, 2.5); });
  acts.mkGold = (v) => setN((d) => { if (+v < 0) delete d.gold; else d.gold = Math.round(+v); });
  acts.mkStab = (v) => setN((d) => { if (+v < 5) delete d.stab; else d.stab = Math.round(+v); });
  acts.mkBloc = (v) => setN((d) => { if (+v) d.bloc = +v; else delete d.bloc; });
  acts.mkOver = (v) => setN((d) => { if (v) { d.over = v; d.dep = d.dep || 'protectorate'; } else { delete d.over; delete d.dep; } });
  acts.mkDep = (v) => setN((d) => { d.dep = v; });
  acts.mkDelN = () => {
    if (selN < 0) return;
    if (def.nations.length <= 2) { UI.toast('A map needs at least two states.'); return; }
    change(() => {
      const k = selN, key = def.nations[k].key; def.nations.splice(k, 1);
      for (let i = 0; i < N; i++) if (O[i] === k + 1) O[i] = 0; else if (O[i] > k + 1 && O[i] !== NOBODY) O[i]--;
      for (const d of def.nations) if (d.over === key) { delete d.over; delete d.dep; }
      if (tool.owner === k + 1) tool.owner = 0; else if (tool.owner > k + 1 && tool.owner !== NOBODY) tool.owner--;
      selN = -1;
    });
  };
  /* The country editor on a state of this map: its customization lives in the state's own definition. */
  acts.mkEdit = () => {
    const d = def.nations[selN]; if (!d || !PG) return;
    const key = d.key, D = () => def.nations.find((x) => x.key === key);
    const FIELDS = ['adj', 'full', 'cap', 'leader', 'color', 'flag', 'hist', 'motto', 'anthem', 'blurb'];
    const orig = (k) => { const o = ID.SCENARIOS.meridia.nations.find((m) => m.base === k); return o ? o.adj : ID.Custom.adjOf(k); };
    const adj0 = (x) => (x.base !== x.key ? ID.Custom.adjOf(x.base) : orig(x.key));
    push();
    ID.CustomUI.open({
      G: () => PG, n: () => PG.nations[def.nations.indexOf(D()) + 1] || PG.nations[1],
      get: () => { const x = D(), c = {}; for (const k of FIELDS) if (x[k] != null && k !== 'adj') c[k] = x[k]; if (x.base !== x.key) c.base = x.base; if (x.adj !== adj0(x)) c.adj = x.adj; return c; },
      set: (c) => { const x = D(); for (const k of FIELDS) delete x[k]; const nb = c.base; delete c.base; Object.assign(x, c); x.base = nb || x.key; if (!x.adj) x.adj = adj0(x); rebuild(); },
      ideo: (v) => { D().ideo = v; rebuild(); },
      close: () => panel(),
    });
  };
  acts.mkGenOpen = (v, el) => { genOpen = el.checked; panel(); };
  acts.mkGenOn = () => change(() => { def.gen = true; def.level = null; }, true);
  acts.mkLevel = (v) => change(() => { def.level = +v / 100; }, true);
  acts.mkSeed = (v) => change(() => { def.seed = (parseInt(v, 10) >>> 0) || ID.hashStr(String(v)) || 1; }, true);
  acts.mkReseed = () => change(() => { def.seed = ((Math.random() * 1e9) >>> 0) || 1; }, true);
  acts.mkAddBlob = (r) => { if (def.blobs.length >= M.LIM.blobs) { UI.toast('At most ' + M.LIM.blobs + ' shapes.'); return; } const [cx, cy] = R.center(); change(() => { def.blobs.push([r4(cx / W), r4(cy / H), r]); selB = def.blobs.length - 1; }, true); };
  acts.mkBlobR = (v) => { if (def.blobs[selB]) change(() => { def.blobs[selB][2] = +v / 1000; }, true); };
  acts.mkDelBlob = () => { if (selB >= 0) change(() => { def.blobs.splice(selB, 1); selB = -1; }, true); };
  acts.mkBake = () => change(() => { for (let i = 0; i < N; i++) { const t = terr(i); pT[i] = t === T.SEA ? -1 : t; pR[i] = t === T.SEA ? -1 : riv(i); } def.gen = false; genOpen = false; }, true);
  acts.mkEmpty = () => change(() => { def.gen = false; genOpen = false; }, true);
  acts.mkPlay = () => { saveGrids(); let d; try { d = M.validate(JSON.parse(JSON.stringify(def))); } catch (e) { UI.toast(e.message); return; } MK.close(); ID.Screens.setup({ scenario: 'custom', map: d }); };

  /* ---------------------------------------------------------------- presets and saved maps */
  const saved = () => store.get('id_maps', []);
  acts.mkPresets = () => {
    const S = saved();
    let h = '<div class="dlg wide"><div class="dhd"><div class="k">MAP MAKER</div><button class="x" data-act="closeModal">✕</button></div><div class="dbd">';
    h += '<p class="lead">Start from a preset or one of your maps. Paint the land, the borders and the cities exactly as you want them.</p>';
    h += '<h4>Presets</h4><div class="mkpre">' + M.PRESETS.map((p) => '<div class="dec"><h4>' + esc(p.name) + '</h4><p>' + esc(p.desc) + '</p><span></span>' + btn('Open', 'mkFromPreset', p.id, { cls: 'sm red' }) + '</div>').join('') + '</div>';
    h += '<h4 style="margin-top:12px">Your maps</h4>' + (S.length ? S.map((m, k) => '<div class="mkrow"><input type="text" maxlength="' + M.LIM.name + '" value="' + esc(m.name) + '" data-change="mkRename" data-k="' + k + '"' + tip('Rename: type and press Enter') + '><small class="dim">' + new Date(m.at).toLocaleDateString() + '</small>' + btn('Open', 'mkOpenSaved', k, { cls: 'sm' }) + btn('Duplicate', 'mkDup', k, { cls: 'sm ghost' }) + btn('Delete', 'mkDelSaved', k, { cls: 'sm ghost' }) + '</div>').join('') : '<p class="dim">None yet. Press Save in the map maker to keep a map here.</p>');
    h += '<div class="row" style="margin-top:12px">' + btn('Load code', 'loadCode', null, { cls: 'ghost' }) + '<label class="b ghost">Import file<input type="file" accept=".idmap,application/json" data-change="mkImport" hidden></label><span class="sp"></span>' + btn('Close', 'closeModal', null, { cls: 'ghost' }) + '</div></div></div>';
    UI.modal(h, 'menu');
  };
  acts.mkFromPreset = (id) => { let d; try { d = M.preset(id); } catch (e) { UI.toast(e.message); return; } MK.open(d); };
  acts.mkOpenSaved = (k) => { const m = saved()[k]; if (!m) return; try { MK.open(M.validate(m.def), k); } catch (e) { UI.toast('That map could not be opened: ' + e.message); } };
  acts.mkRename = (v, el) => { const S = saved(), m = S[+el.dataset.k]; if (!m) return; m.name = ID.Custom.clean(v, M.LIM.name) || m.name; m.def.name = m.name; store.set('id_maps', S); if (slot === +el.dataset.k && def) { def.name = m.name; panel(); } };
  acts.mkDup = (k) => { const S = saved(), m = S[k]; if (!m) return; const c = JSON.parse(JSON.stringify(m)); c.name = (m.name + ' (copy)').slice(0, M.LIM.name); c.def.name = c.name; c.at = Date.now(); S.splice(k + 1, 0, c); if (!store.set('id_maps', S)) UI.toast('Could not save: this browser’s storage is full.'); if (slot > k) slot++; acts.mkPresets(); };
  acts.mkDelSaved = (k) => { const S = saved(); S.splice(k, 1); store.set('id_maps', S); if (slot === k) slot = -1; else if (slot > k) slot--; acts.mkPresets(); };
  acts.mkSave = () => {
    if (!def) return; saveGrids();
    const S = saved(), m = { name: def.name, at: Date.now(), def: M.pack(def) };
    if (slot >= 0 && S[slot]) S[slot] = m; else { S.unshift(m); slot = 0; }
    if (store.set('id_maps', S)) UI.toast('Saved “' + def.name + '”.', true); else UI.toast('Could not save: this browser’s storage is full. Export a file instead.');
    panel();
  };

  /* ---------------------------------------------------------------- codes and files */
  let codeFull = '', codeLite = '', codeFor = null;
  async function showCode(d, lite) {
    try { codeFull = await M.encode(d); codeLite = d.nations.some((x) => x.flag && x.flag.img) ? await M.encode(d, true) : ''; } catch (e) { UI.toast('The code could not be made: ' + e.message); return; }
    codeFor = d; codeDlg(lite && codeLite ? 'lite' : 'full');
  }
  function codeDlg(which) {
    const code = which === 'lite' ? codeLite : codeFull;
    UI.modal('<div class="dlg"><div class="dhd"><div class="k">MAP CODE</div><button class="x" data-act="closeModal">✕</button></div><div class="dbd">' +
      '<p class="lead">Anyone can paste this code into <b>Load code</b> on the title screen to play or edit <b>' + esc(codeFor.name) + '</b>.</p>' +
      '<textarea class="code" rows="6" readonly>' + esc(code) + '</textarea><p class="dim">' + code.length.toLocaleString() + ' characters' + (code.length > 20000 ? '. A code this long may not fit in a chat message: a file is easier to share.' : '.') + '</p>' +
      (codeLite ? '<div class="field"><label>Uploaded flags</label><div class="seg"><button class="' + (which === 'full' ? 'on' : '') + '" data-act="mkCodeWhich" data-a=\'"full"\'>Include (' + codeFull.length.toLocaleString() + ')</button><button class="' + (which === 'lite' ? 'on' : '') + '" data-act="mkCodeWhich" data-a=\'"lite"\'>Leave out (' + codeLite.length.toLocaleString() + ')</button></div><small>Left out, those countries fly a flag built from their colours. A file keeps everything at any size.</small></div>' : '') +
      '<div class="row">' + btn('Copy', 'mkCopy', which, { cls: 'red' }) + btn('Export file', 'mkExport', null, { cls: 'ghost' }) + '<span class="sp"></span>' + btn('Close', 'closeModal', null, { cls: 'ghost' }) + '</div></div></div>', 'menu');
    const ta = document.querySelector('#modal textarea.code'); if (ta) ta.addEventListener('focus', () => ta.select());
  }
  acts.mkCodeWhich = (a) => codeDlg(a);
  acts.mkCopy = async (which) => {
    const code = which === 'lite' ? codeLite : codeFull, ta = document.querySelector('#modal textarea.code');
    try { await navigator.clipboard.writeText(code); UI.toast('Map code copied (' + code.length.toLocaleString() + ' characters).', true); }
    catch (e) { if (ta) { ta.focus(); ta.select(); } try { document.execCommand('copy'); UI.toast('Map code copied.', true); } catch (x) { UI.toast('Select the code and copy it.'); } }
  };
  acts.mkCode = () => { saveGrids(); showCode(JSON.parse(JSON.stringify(def))); };
  MK.showCode = showCode;
  function download(d) {
    const a = document.createElement('a'), url = URL.createObjectURL(new Blob([M.toFile(d)], { type: 'application/json' }));
    a.href = url; a.download = (d.name.replace(/[^\p{L}\p{N} _-]/gu, '').trim() || 'map') + '.idmap'; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
  acts.mkExport = () => { if (def) { saveGrids(); download(def); } else if (codeFor) download(codeFor); };
  acts.mkImport = (v, el) => {
    const f = el.files && el.files[0]; if (!f) return;
    if (f.size > 4e6) { UI.toast('That file is too large to be a map.'); return; }
    f.text().then((s) => { const d = M.fromFile(s); MK.open(d); UI.toast('Opened “' + d.name + '”.', true); }).catch((e) => UI.toast(e.message || 'That file could not be read.'));
  };
  acts.loadCode = () => {
    UI.modal('<div class="dlg"><div class="dhd"><div class="k">LOAD A MAP CODE</div><button class="x" data-act="closeModal">✕</button></div><div class="dbd">' +
      '<p class="lead">Paste a map code (it begins with IDM1-).</p><textarea class="code" rows="6" id="codein" placeholder="IDM1-…"></textarea><div id="codeerr"></div>' +
      '<div class="row">' + btn('Play it', 'codeGo', 'play', { cls: 'red' }) + btn('Open in the map maker', 'codeGo', 'edit', { cls: 'ghost' }) + '<span class="sp"></span>' + btn('Close', 'closeModal', null, { cls: 'ghost' }) + '</div></div></div>', 'menu');
  };
  acts.codeGo = async (how) => {
    const el = $('#codein'), out = $('#codeerr'); if (!el) return;
    let d; try { d = await M.decode(el.value); M.build(d); } catch (e) { if (out) out.innerHTML = '<div class="note red">' + esc(e.message || 'That code could not be read.') + '</div>'; return; }
    if (how === 'edit') MK.open(d); else { if (def) MK.close(); ID.Screens.setup({ scenario: 'custom', map: d }); }
  };
})();
