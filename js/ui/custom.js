/* IRON DIALECTIC — the country editor: names, colour, flag (built or uploaded), flavour, situation and system for any
   country before the start. Used by the campaign setup (customizations kept in Screens.S.custom by nation key) and by
   the map maker (customizations kept in the map's nation definitions). Validation is ID.Custom's (js/sim/custom.js). */
(function () {
  'use strict';
  const ID = (globalThis.ID = globalThis.ID || {});
  const UI = ID.UI, esc = ID.esc, Cu = ID.Custom, F = ID.Flags;
  const acts = UI.acts, btn = UI.btn, tip = UI.tip;
  const CE = (ID.CustomUI = {});
  const hex = (c) => '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
  const store = { get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } } };

  /* host: { G, n, get() -> customization, set(c) (rebuilds the world), ideo(v), close() } — given by the caller. */
  let H = null, flagMode = null;
  CE.open = function (host) { H = host; flagMode = null; render(); };
  CE.isOpen = () => !!H && UI.modalKind === 'cust';
  CE.refresh = function (host) { if (host) H = host; if (CE.isOpen()) render(); };

  const field = (label, inner, note) => '<div class="field"><label>' + label + '</label>' + inner + (note ? '<small>' + note + '</small>' : '') + '</div>';
  const txt = (f, v, ph, max, area) => area
    ? '<textarea rows="3" maxlength="' + max + '" data-change="custSet" data-f="' + f + '" placeholder="' + esc(ph || '') + '">' + esc(v || '') + '</textarea>'
    : '<input type="text" maxlength="' + max + '" data-change="custSet" data-f="' + f + '" value="' + esc(v || '') + '" placeholder="' + esc(ph || '') + '">';

  function render() {
    const n = H.n(), c = H.get(), G = H.G(), I = ID.IDEOLOGIES[n.ideo];
    const box = document.querySelector('#modal .dbd'), top = box ? box.scrollTop : 0;
    let h = '<div class="dlg wide cust"><div class="dhd"><div class="k">COUNTRY</div><div class="d">' + esc(n.base) + '</div><button class="x" data-act="custClose"' + tip('Done') + '>✕</button></div><div class="dbd">';
    h += '<div class="custtop">' + F.html(n, 'pflag') + '<div><h2>' + esc(n.name) + '</h2><div class="dim">' + esc(I.name) + ' · ' + esc((ID.SITUATIONS[n.sit] || ID.SITUATIONS.middling).name) + (n.leader ? ' · ' + esc(n.leader.title + ' ' + n.leader.name) : '') + '</div></div></div>';
    h += '<div class="custgrid"><div>';
    h += field('Name', txt('base', c.base, n.base, Cu.LIM.base), 'The short name, used on the map and in the news.');
    h += field('Adjective', txt('adj', c.adj, n.adj, Cu.LIM.adj));
    h += field('Full name of the state', txt('full', c.full, ID.IDEOLOGIES[n.ideo].title.replace('{N}', () => n.base).replace('{A}', () => n.adj), Cu.LIM.full), 'Left blank, it follows the system of government, as it always has. A name you write holds until the system changes.');
    h += field('Capital', txt('cap', c.cap, 'Unnamed', Cu.LIM.cap));
    h += field('Leader', txt('leader', c.leader, n.leader ? n.leader.name : '', Cu.LIM.leader), 'Only the first. Successors are chosen in the usual way.');
    h += field('Starting situation', '<select data-change="custSit" style="width:100%">' + Object.keys(ID.SITUATIONS).map((k) => '<option value="' + k + '"' + (k === n.sit ? ' selected' : '') + '>' + esc(ID.SITUATIONS[k].name) + '</option>').join('') + '</select>', esc((ID.SITUATIONS[n.sit] || ID.SITUATIONS.middling).text));
    if (H.ideo) h += field('System of government', ideoSel(n.ideo, H.baseIdeo ? H.baseIdeo() : null));
    h += field('Motto', txt('motto', c.motto, ID.identityOf(G, n).motto, Cu.LIM.motto));
    h += field('Anthem', txt('anthem', c.anthem, ID.identityOf(G, n).anthem, Cu.LIM.anthem));
    h += field('Description', txt('blurb', c.blurb, (!c.blurb && ID.ren(n.blurb)) || (ID.SITUATIONS[n.sit] || {}).text, Cu.LIM.blurb, true), 'Blank fields fall back to the game’s own text.');
    h += '</div><div>';
    // colour
    const col = n.color, clash = Cu.clashes(G, n, col);
    h += field('Map colour', '<div class="swatches">' + Cu.PALETTE.map((p) => '<button class="swatch' + (Cu.dist(p, col) < 3 ? ' on' : '') + '" style="background:' + hex(p) + '" data-act="custColor" data-a="' + JSON.stringify(p) + '"' + tip(clashTip(G, n, p)) + '></button>').join('') + '</div>' +
      (clash.length ? '<div class="note red" style="margin-top:6px">Too close to ' + clash.map((o) => esc(o.base)).join(', ') + ': the border between you will be hard to see.</div>' : ''));
    // flag
    const fl = c.flag, mode = flagMode || (fl ? (fl.img ? 'upload' : 'build') : 'game');
    h += field('Flag', '<div class="seg">' + [['game', 'The game’s'], ['build', 'Build one'], ['upload', 'Upload']].map((x) => '<button class="' + (mode === x[0] ? 'on' : '') + '" data-act="custFlagMode" data-a=\'"' + x[0] + '"\'>' + x[1] + '</button>').join('') + '</div>' + flagEditor(mode, fl, n));
    if (fl) h += '<label class="chk"><input type="checkbox" data-change="custHist"' + (c.hist ? ' checked' : '') + '> Let history change the flag <span class="dim">(a destiny or a new system of government brings its own)</span></label>';
    // presets
    const P = store.get('id_cpresets', []);
    h += field('Presets', '<div class="row">' + btn('Save as a preset', 'custPresetSave', null, { cls: 'sm', tip: 'Keep this country’s name, colour, flag, flavour, situation and system to use again in later campaigns (in this browser).' }) + btn('Reset this country', 'custReset', null, { cls: 'sm ghost' }) + '</div>' +
      (P.length ? '<div class="plist">' + P.map((p, k) => '<div class="prow">' + (p.c.flag ? F.html({ id: -1, key: 'p' + k, ideo: p.c.ideo || n.ideo, color: p.c.color || n.color, cust: { flag: p.c.flag, fv: 'p' + k + ID.hashStr(JSON.stringify(p.c.flag)), ideo: p.c.ideo || n.ideo } }, 'mini') : '') + '<b>' + esc(p.name) + '</b>' + btn('Use', 'custPresetUse', k, { cls: 'sm' }) + btn('Delete', 'custPresetDel', k, { cls: 'sm ghost' }) + '</div>').join('') + '</div>' : ''));
    h += '</div></div><div class="row" style="margin-top:8px">' + btn('Done', 'custClose', null, { cls: 'red' }) + '</div></div></div>';
    UI.modal(h, 'cust');
    const nb = document.querySelector('#modal .dbd'); if (nb) nb.scrollTop = top;
  }
  function clashTip(G, n, p) { const c = Cu.clashes(G, n, p); return c.length ? 'Close to ' + c.map((o) => esc(o.base)).join(', ') : ''; }
  function ideoSel(cur, base) {
    let h = '<select data-change="custIdeo" style="width:100%">';
    for (const fam in ID.FAMILIES) { h += '<optgroup label="' + esc(ID.FAMILIES[fam].name) + '">'; for (const I of ID.IDEO_LIST.filter((i) => i.family === fam)) h += '<option value="' + I.id + '"' + (I.id === cur ? ' selected' : '') + '>' + esc(I.name) + (I.id === base ? ' (historical)' : '') + '</option>'; h += '</optgroup>'; }
    return h + '</select>';
  }
  const SPEC0 = (n) => ({ p: 'hband', a: hex(n.color), b: '#ebe2cc', c: '#17140f', e: F.EMBLEM_OF[n.ideo] || '', ef: '#17140f' });
  function flagEditor(mode, fl, n) {
    if (mode === 'game') return '<small>Drawn from the country’s colour and its system of government, and changed by history.</small>';
    if (mode === 'upload') return '<div class="row" style="margin-top:6px"><label class="b sm">Choose an image<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" data-change="custUpload" hidden></label>' + (fl && fl.img ? '<span class="dim">' + Math.round(fl.img.length / 102.4) / 10 + ' KB</span>' : '') + '</div><small>PNG, JPEG, WebP or GIF. It is cut to 3:2 and shrunk to 60×40.</small>';
    const s = fl && !fl.img ? fl : SPEC0(n);
    const colIn = (k, label) => '<label class="cin">' + label + '<input type="color" value="' + (s[k] || '#ebe2cc') + '" data-change="custFlagCol" data-k="' + k + '"></label>';
    return '<div class="fbuild"><div class="seg wrap">' + Cu.PATTERNS.map((p) => '<button class="' + (s.p === p ? 'on' : '') + '" data-act="custPat" data-a=\'"' + p + '"\'' + tip(p) + '>' + F.destFlag({ p, a: '#7a6a50', b: '#ebe2cc', c: '#17140f' }) + '</button>').join('') + '</div>' +
      '<div class="row">' + colIn('a', 'Field') + colIn('b', 'Second') + colIn('c', 'Third') + colIn('ef', 'Emblem') + '</div>' +
      '<div class="seg wrap emb"><button class="' + (!s.e ? 'on' : '') + '" data-act="custEmb" data-a=\'""\'>none</button>' + F.EMBLEMS.map((e) => '<button class="' + (s.e === e ? 'on' : '') + '" data-act="custEmb" data-a=\'"' + e + '"\'' + tip(e) + '>' + '<svg viewBox="0 0 20 20" width="20" height="20" fill="#17140f" stroke="#17140f" style="--bg:#ebe2cc">' + F.emblemSvg(e) + '</svg></button>').join('') + '</div></div>';
  }

  const upd = (fn) => { const c = Object.assign({}, H.get()); fn(c); H.set(Cu.cleanCustom(c)); render(); };
  acts.custSet = (v, el) => upd((c) => { c[el.dataset.f] = v; if (el.dataset.f === 'base' && !v) delete c.adj; });
  acts.custSit = (v) => upd((c) => { c.sit = v; });
  acts.custIdeo = (v) => { H.ideo(v); render(); };
  acts.custColor = (a) => upd((c) => { c.color = a; });
  acts.custHist = (v, el) => upd((c) => { c.hist = el.checked ? 1 : 0; });
  acts.custFlagMode = (a) => { flagMode = a; if (a === 'game') upd((c) => { delete c.flag; delete c.hist; }); else if (a === 'build' && (!H.get().flag || H.get().flag.img)) upd((c) => { c.flag = SPEC0(H.n()); }); else render(); };
  const spec = (fn) => upd((c) => { const s = Object.assign({}, c.flag && !c.flag.img ? c.flag : SPEC0(H.n())); fn(s); c.flag = s; });
  acts.custPat = (a) => spec((s) => { s.p = a; });
  acts.custEmb = (a) => spec((s) => { if (a) s.e = a; else delete s.e; });
  acts.custFlagCol = (v, el) => spec((s) => { s[el.dataset.k] = v; });
  acts.custUpload = (v, el) => {
    const f = el.files && el.files[0]; if (!f) return;
    if (!/^image\/(png|jpeg|webp|gif)$/.test(f.type)) { UI.toast('That file is not a PNG, JPEG, WebP or GIF image.'); return; }
    if (f.size > 8e6) { UI.toast('That image is larger than 8 MB.'); return; }
    const url = URL.createObjectURL(f), im = new Image();
    im.onload = () => {
      URL.revokeObjectURL(url);
      const cv = document.createElement('canvas'); cv.width = 60; cv.height = 40;
      const x = cv.getContext('2d'), r = im.naturalWidth / im.naturalHeight;
      let sw = im.naturalWidth, sh = im.naturalHeight; if (r > 1.5) sw = sh * 1.5; else sh = sw / 1.5; // cut to 3:2 around the centre
      x.drawImage(im, (im.naturalWidth - sw) / 2, (im.naturalHeight - sh) / 2, sw, sh, 0, 0, 60, 40);
      let d = cv.toDataURL('image/webp', 0.8); if (!/^data:image\/webp/.test(d)) d = cv.toDataURL('image/png');
      if (!Cu.IMG.test(d) || d.length > Cu.LIM.img) { UI.toast('That image could not be stored.'); return; }
      flagMode = 'upload'; upd((c) => { c.flag = { img: d }; });
    };
    im.onerror = () => { URL.revokeObjectURL(url); UI.toast('That file could not be read as an image.'); };
    im.src = url;
  };
  acts.custReset = () => { flagMode = null; H.set({}); if (H.ideo && H.baseIdeo) H.ideo(H.baseIdeo()); render(); };
  acts.custClose = () => { const h = H; H = null; UI.closeModal(); if (h && h.close) h.close(); };
  acts.custPresetSave = () => {
    const n = H.n(), c = Object.assign({}, H.get(), { ideo: n.ideo, sit: n.sit, color: n.color.slice() });
    const P = store.get('id_cpresets', []); const name = c.base || n.base;
    const k = P.findIndex((p) => p.name === name); if (k >= 0) P[k] = { name, c }; else P.unshift({ name, c });
    if (P.length > 30) P.length = 30;
    if (store.set('id_cpresets', P)) UI.toast('Saved “' + name + '” as a preset.', true); else UI.toast('Could not save: this browser’s storage is full or switched off.');
    render();
  };
  acts.custPresetUse = (k) => {
    const p = store.get('id_cpresets', [])[k]; if (!p) return;
    const c = Cu.cleanCustom(p.c); flagMode = null;
    if (c.ideo && H.ideo) H.ideo(c.ideo); delete c.ideo;
    H.set(c); render();
  };
  acts.custPresetDel = (k) => { const P = store.get('id_cpresets', []); P.splice(k, 1); store.set('id_cpresets', P); render(); };
})();
