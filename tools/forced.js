/* One state forced into an ideology in 8 worlds: how long it holds, how it ends, how big it gets.
   node tools/forced.js ancap [40]      (ID_FORBID_OFF=ancap to measure what its forbidden verbs cost the AI) */
'use strict';

const ID=require('./load.js');
const ideo=process.argv[2]||'ancap', yrs=+process.argv[3]||40; const res=[];
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
