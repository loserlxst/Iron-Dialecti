/* The world is self-contained: no real countries, peoples, cities, religions, institutions or historical figures in
   anything the player reads. Scans every text string in js/ (single- and double-quoted strings with a space in them;
   ids and code comments are skipped) and fails on any real-world reference.
   node tools/inworld.js */
'use strict';
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..', 'js');
const BAD = new RegExp('\\b(' + [
  // countries, peoples, places
  'Brit(ain|ish|on|ons)', 'England', 'English', 'Scot(land|tish)', 'Irish', 'Ireland', 'Wales', 'Welsh', 'London', 'France', 'French', 'Paris', 'German(y|s)?', 'Berlin',
  'Prussian?', 'Russian?', 'Moscow', 'Soviets?', 'USSR', 'America(n|ns)?', 'Washington', 'China', 'Chinese', 'Peking', 'Beijing', 'Japan(ese)?', 'Tokyo', 'Korean?',
  'Italy', 'Italian', 'Rome', 'Spain', 'Spanish', 'Madrid', 'Portug(al|uese)', 'Austrian?', 'Vienna', 'Hungar(y|ian)', 'Poland', 'Polish', 'Turk(ey|ish|s)', 'Ottoman',
  'Istanbul', 'Persian?', 'Iran(ian)?', 'Arab(s|ia|ian)?', 'Egypt(ian)?', 'India', 'Mexic(o|an)', 'Brazil(ian)?', 'Cuban?', 'Vietnam(ese)?', 'Greece', 'Israel(i)?',
  'Palestin(e|ian)', 'Africa(n)?', 'Europe(an)?', 'Asian?', 'Siberia(n)?', 'Atlantic', 'Pacific', 'Mediterranean', 'Balkans?', 'Switzerland', 'Swiss', 'Dutch',
  'Holland', 'Sweden', 'Swedish', 'Norw(ay|egian)', 'Denmark', 'Danish', 'Finland', 'Finnish', 'Canad(a|ian)', 'Australian?', 'Kremlin', 'Wall Street',
  // religions and their offices
  'Christ(ian|ianity|endom|mas)?', 'Jesus', 'Catholic(s|ism)?', 'Protestant(s|ism)?', 'Lutheran', 'Anglican', 'Popes?', 'Papal', 'Vatican', 'Bibles?', 'Biblical',
  'Islam(ic)?', 'Muslims?', 'Mosques?', 'Minarets?', 'Allah', 'Quran', 'Koran', 'Imams?', 'Ayatollahs?', 'Ulema', 'Jew(s|ish)?', 'Juda(ism|ic)', 'Synagogues?',
  'Rabbis?', 'Zionis(m|t)', 'Buddh(a|ism|ist)', 'Hindus?', 'Sikhs?', 'Shinto', 'Mecca', 'Jerusalem', 'Churches', 'Church', 'Cathedrals?', 'Bishops?', 'Synod',
  'Crusades?', 'Missionar(y|ies)', 'Turbans?',
  // people, parties and institutions of real history
  'Marx', 'Lenin', 'Stalin', 'Trotsky', 'Mao Zedong', 'Hitler', 'Mussolini', 'Churchill', 'Roosevelt', 'Napoleon', 'Bismarck', 'Kaiser', 'Tsar', 'Czar', 'Reich',
  'F(ü|u)hrer', 'Bolsheviks?', 'Mensheviks?', 'Gestapo', 'Cheka', 'NKVD', 'KGB', 'Duma', 'Politburo', 'Cossacks?', 'Lloyd', 'Hoxha',
].join('|') + ')\\b', 'i');
// the one real-world word kept on purpose: NRX's "Cathedral" (its name for the universities and the press)
const ALLOW = [/\bthe Cathedral\b/];
const hits = [];
function scan(p) {
  const s = fs.readFileSync(p, 'utf8'); let i = 0, line = 1;
  while (i < s.length) {
    const c = s[i], d = s[i + 1];
    if (c === '\n') { line++; i++; continue; }
    if (c === '/' && d === '/') { const j = s.indexOf('\n', i); i = j < 0 ? s.length : j; continue; }
    if (c === '/' && d === '*') { const e = s.indexOf('*/', i + 2) + 2; line += (s.slice(i, e).match(/\n/g) || []).length; i = e; continue; }
    if (c === '"' || c === '`' || c === "'") {
      let j = i + 1; while (j < s.length && s[j] !== c && s[j] !== '\n') { if (s[j] === '\\') j++; j++; }
      let lit = s.slice(i + 1, j); for (const a of ALLOW) lit = lit.replace(a, '');
      if (/ /.test(lit)) { const m = BAD.exec(lit); if (m) hits.push(path.relative(root, p) + ':' + line + '  "' + m[0] + '"  ' + lit.slice(Math.max(0, m.index - 40), m.index + 40)); }
      i = j + 1; continue;
    }
    i++;
  }
}
const walk = (d) => { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walk(p); else if (p.endsWith('.js')) scan(p); } };
walk(root);
for (const h of hits) console.log('FAIL ' + h);
console.log(hits.length ? hits.length + ' real-world references in the text' : 'the world is self-contained: no real-world references in the text');
process.exit(hits.length ? 1 : 0);
