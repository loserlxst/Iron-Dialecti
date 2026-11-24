/* IRON DIALECTIC — dev console for recording videos. Toggle with the backquote key (`), or five quick taps on the date. Cheats only touch the player. */
(function () {
  'use strict';
  const ID = (globalThis.ID = globalThis.ID || {});
  const UI = ID.UI, C = ID.Combat, D = ID.Diplomacy;
  const Dev = (ID.Dev = { gold: false, nukes: false, strike: '', hyper: false });
  const G = () => UI.G, P = () => UI.G && UI.G.nations[UI.G.player];
  const say = (t) => UI.toast(t, true);
  const selNation = () => { const g = G(); const o = g && UI.sel >= 0 ? g.owner[UI.sel] : 0; return o && o !== g.player ? g.nations[o] : null; };
  const needSel = (fn) => () => { const t = selNation(); if (!t || !t.alive) return say('Select a tile of another state first.'); fn(t); };
  const refresh = () => { const g = G(); if (!g) return; g.dirtyAll = true; if (UI.after) UI.after(); };

  /* Infinite warheads: no silo, range, war or stock limits; launches from your capital. */
  const canMissile = C.canMissile;
  C.canMissile = function (g, n, target, nuke) {
    if (!Dev.nukes || n.id !== g.player) return canMissile.apply(this, arguments);
    const kind = nuke === true || nuke === 1 ? 'atom' : nuke || '', W = g.W, from = n.capital;
    return { from, dist: Math.hypot((from % W) - (target % W), ((from / W) | 0) - ((target / W) | 0)), kind };
  };
  const fire = (i, kind) => { const g = G(); C.launchMissile(g, P(), i, kind); };
  const randTile = (pred) => { const g = G(); for (let k = 0; k < 4000; k++) { const i = (Math.random() * g.N) | 0; if (pred(i)) return i; } return -1; };

  /* Strike mode: a map click fires instead of selecting. */
  const clickTile = UI.clickTile;
  UI.clickTile = function (i) {
    if (Dev.strike && i >= 0 && G()) { const was = Dev.nukes; Dev.nukes = true; fire(i, Dev.strike === 'missile' ? '' : Dev.strike); Dev.nukes = was; return; }
    return clickTile.apply(this, arguments);
  };

  setInterval(() => {
    const n = P(); if (!n || !n.alive) return;
    if (Dev.gold) { n.gold = Math.max(n.gold, 1e6); n.debt = 0; }
    if (Dev.nukes) { const a = ID.Economy.atom(n); a.lv = Math.max(a.lv, 2); n.nukes = n.missiles = n.thermo = 99; }
  }, 100);

  const toggles = {
    gold: ['Infinite gold', () => { Dev.gold = !Dev.gold; }],
    nukes: ['Infinite warheads, no silo / range / cooldown', () => { Dev.nukes = !Dev.nukes; }],
    hyper: ['Hyperspeed (speed 5 = 400 days/s)', () => { Dev.hyper = !Dev.hyper; ID.SPEEDS[5] = Dev.hyper ? 400 : 48; }],
    hud: ['Hide HUD (clean shots)', () => { const h = document.getElementById('hud'); h.style.visibility = h.style.visibility ? '' : 'hidden'; }],
  };
  const STRIKES = ['', 'missile', 'atom', 'thermo'];
  const actions = [
    ['Troops ×2', () => { P().troops *= 2; }],
    ['Troops ×10', () => { P().troops *= 10; }],
    ['+1,000,000 gold', () => { P().gold += 1e6; }],
    ['Max tech', () => { const n = P(); for (const k in n.tech) n.tech[k] = 9; }],
    ['Max stability & kit', () => { const n = P(); n.stab = 100; n.equip = 1.4; n.we = 0; }],
    ['War on selected', needSel((t) => D.startWar(G(), P(), t, 'none'))],
    ['War on the world', () => { const g = G(); for (const o of ID.alive(g)) if (o !== P()) D.startWar(g, P(), o, 'none'); }],
    ['Annex selected', needSel((t) => { const g = G(); for (let i = 0; i < g.N; i++) if (g.owner[i] === t.id) ID.setOwner(g, i, g.player); D.eliminate(g, t, P(), true); })],
    ['Wipe selected army', needSel((t) => { t.troops = 0; })],
    ['Thermo rain on selected (10)', needSel((t) => { const was = Dev.nukes; Dev.nukes = true; for (let k = 0; k < 10; k++) { const i = randTile((j) => G().owner[j] === t.id); if (i >= 0) fire(i, 'thermo'); } Dev.nukes = was; })],
    ['Armageddon (thermo on every capital)', () => { const g = G(), was = Dev.nukes; Dev.nukes = true; for (const o of ID.alive(g)) if (o !== P()) fire(o.capital, 'thermo'); Dev.nukes = was; }],
    ['Play as selected', needSel((t) => { const g = G(); g.player = t.id; UI.start(g); })],
  ];

  const css = '#dev{position:fixed;top:60px;right:12px;z-index:9999;width:300px;max-height:80vh;overflow:auto;background:rgba(18,16,12,.94);color:#eee;border:1px solid #c8281e;border-radius:6px;padding:10px;font:13px system-ui,sans-serif}' +
    '#dev h4{margin:0 0 8px;color:#ff5a4a;font-size:14px}#dev button{display:block;width:100%;margin:3px 0;padding:6px 8px;text-align:left;background:#2a2620;color:#eee;border:1px solid #444;border-radius:4px;cursor:pointer;font:inherit}' +
    '#dev button:hover{border-color:#c8281e}#dev button.on{background:#c8281e;border-color:#ff5a4a}#dev hr{border:0;border-top:1px solid #444;margin:8px 0}#dev small{color:#999}';
  const box = document.createElement('div'); box.id = 'dev'; box.hidden = true;
  document.head.insertAdjacentHTML('beforeend', '<style>' + css + '</style>');
  document.body.appendChild(box);
  function render() {
    const hudOff = !!document.getElementById('hud').style.visibility;
    box.innerHTML = '<h4>DEV CONSOLE <small>(` or five taps on the date to close)</small></h4>' +
      Object.keys(toggles).map((k) => '<button data-dt="' + k + '" class="' + ((k === 'hud' ? hudOff : Dev[k]) ? 'on' : '') + '">' + toggles[k][0] + '</button>').join('') +
      '<button data-ds class="' + (Dev.strike ? 'on' : '') + '">Click-to-strike: ' + (Dev.strike || 'off') + '</button><hr>' +
      actions.map((a, k) => '<button data-da="' + k + '">' + a[0] + '</button>').join('') +
      '<hr><small>"Selected" = the state owning the tile you last clicked.</small>';
  }
  box.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    e.stopPropagation();
    if (!G()) { say('Start a game first.'); return; }
    if (b.dataset.dt) toggles[b.dataset.dt][1]();
    else if (b.dataset.ds != null) { Dev.strike = STRIKES[(STRIKES.indexOf(Dev.strike) + 1) % STRIKES.length]; document.getElementById('map').classList.toggle('aim', !!Dev.strike); }
    else actions[+b.dataset.da][1]();
    render(); refresh();
  });
  const toggle = () => { box.hidden = !box.hidden; if (!box.hidden) render(); };
  document.addEventListener('keydown', (e) => {
    if (e.key !== '`' || (e.target.tagName === 'INPUT' && e.target.type === 'text')) return;
    toggle();
  });
  /* Phones have no backquote key: five quick taps on the date in the top bar. */
  let taps = [];
  document.addEventListener('click', (e) => {
    if (!e.target.closest || !e.target.closest('#t-date')) return;
    const t = Date.now(); taps = taps.filter((x) => t - x < 2000); taps.push(t);
    if (taps.length >= 5) { taps = []; toggle(); }
  });
})();
