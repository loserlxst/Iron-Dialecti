/* One state forced into an ideology in 8 worlds: how long it holds, how it ends, how big it gets.
   node tools/forced.js ancap [40]      (ID_FORBID_OFF=ancap to measure what its forbidden verbs cost the AI) */
'use strict';

const ID=require('./load.js');
const ideo=process.argv[2]||'ancap', yrs=+process.argv[3]||40; const res=[];
let fails=0; const ok=(c,m)=>{ console.log((c?'  ok   ':'  FAIL ')+m); if(!c) fails++; };
/* Anarcho-Capitalism's land market: a province is bought from a broke neighbour, and an unhappy one leaves. */
if (ideo==='ancap') {
  console.log('== self-check: land as property ==');
  const A=ID.Ancap, G=ID.newGame({seed:3,scenario:'random',headless:true});
  let n=null, b=null;
  for (const x of ID.alive(G)) { ID.Politics.changeIdeology(G,x,'ancap','reform'); for (const o of ID.alive(G)) if (o!==x&&o.ai) { o.gold=0; o.stab=30; } b=A.offer(G,x); if (b) { n=x; break; } ID.Politics.changeIdeology(G,x,'liberal','reform'); }
  ok(!!b, 'a broke neighbour offers a border province' + (b ? ' (' + b.tiles + ' tiles from ' + b.o.name + ' for ' + b.price + ' gold)' : ''));
  if (b) {
    const t0=n.tiles, o0=b.o.tiles, g0=b.o.gold, Pr=b.Pr; n.gold=b.price+5;
    ok(A.buy(G,n)==='' && n.tiles===t0+b.tiles && b.o.tiles===o0-b.tiles, 'the purchase moves exactly its tiles (' + t0 + ' → ' + n.tiles + ')');
    ok(b.o.gold===g0+b.price && n.gold===5 && n.cnt.bought===1, 'the seller is paid and the buyer pays');
    ok(Pr.core!==b.o.id, 'the seller’s claim goes with the deed');
    n.gold=0; ok(A.buy(G,n)!=='' || !A.offer(G,n), 'no money, no sale');
    // an unhappy province leaves within a few years, and only one every two years
    const capP=G.prov[n.capital], mine=[]; for (let p=1;p<G.provinces.length;p++) if (G.provinces[p].owner===n.id&&p!==capP) mine.push(G.provinces[p]);
    ID.Doctrine.ensure(G,n); ID.Ancap.agencies(G,n); const leaver=mine[0]; n.sigx.exitAt=0; let left=-1;
    for (let m=0;m<240&&left<0;m++) { leaver.unrest=90; G.tick+=30; ID.DOCTRINE.ancap.month(G,n); if (leaver.owner!==n.id||(n.cnt.exits||0)>0) left=m; }
    ok(left>=0 && (n.cnt.exits||0)===1, 'an unhappy province leaves (after ' + left + ' months)');
    const e1=n.cnt.exits||0; for (const P of mine) P.unrest=90; for (let m=0;m<12;m++) { G.tick+=30; ID.DOCTRINE.ancap.month(G,n); }
    ok((n.cnt.exits||0)===e1, 'no second exit within two years');
    const G2=ID.Game.load(ID.Game.save(G)); ok(G2.nations[n.id].cnt.bought===1 && G2.nations[n.id].sigx.ag.length===3, 'a save keeps the deeds and the agencies');
  }
  console.log(fails ? fails + ' FAILED\n' : 'self-check passed\n');
}
for (const scen of ['meridia','random']) for (const seed of [3,11,23,37]) {
  const G=ID.newGame({seed,scenario:scen,headless:true}); G.rng.s=(seed*131+7)>>>0; const al=ID.alive(G); const n=al[(seed*3)%al.length];
  ID.Politics.changeIdeology(G,n,ideo,'reform'); const t0=G.tick, land0=n.tiles; let end=null, peak=n.tiles/G.landCount;
  const ch=ID.Politics.changeIdeology; ID.Politics.changeIdeology=function(G2,nn,to,mode,...r){ if(nn.id===n.id&&nn.ideo===ideo&&!end) end=to+'/'+mode; return ch.call(this,G2,nn,to,mode,...r); };
  while(G.tick<yrs*360&&!G.over){ ID.Game.tick(G); if(n.alive&&n.ideo===ideo) peak=Math.max(peak,n.tiles/G.landCount); if(!n.alive&&!end) end='destroyed'; if(end) break; }
  ID.Politics.changeIdeology=ch;
  res.push({scen,seed,base:n.base,years:Math.round((G.tick-t0)/360),end:end||'held',peak:Math.round(peak*1000)/10,land:Math.round(n.tiles/Math.max(1,land0)*100)+'%',bought:n.cnt.bought||0,exits:n.cnt.exits||0});
}
for (const r of res) console.log(JSON.stringify(r));
const avg=res.reduce((s,r)=>s+r.years,0)/res.length; console.log('avg years',avg.toFixed(1),'held to the end',res.filter(r=>r.end==='held').length+'/'+res.length,'max peak share',Math.max(...res.map(r=>r.peak))+'%');
if (fails) process.exitCode = 1;
