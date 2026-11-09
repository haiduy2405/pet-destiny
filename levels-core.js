/* Difficulty levels (Dễ / Vừa / Khó): pure rules. Harder levels pay more per round than easier ones, so trying the
   hard mode is always worth it. The UI lives in levels.js; this file has no DOM and is unit-tested. */
const Levels=(()=>{
 const BASE_PAY=EcoData.reward.pay,UNLOCK=EcoData.levels.unlock;                     // BASE_PAY = what every game pays at the standard level (rewards.js PAY)
 const defs=[
  {id:1,name:'Dễ',icon:'🌱',mult:EcoData.levels.mult[0],options:3,roundsAdd:-1,hints:true,about:'Nhẹ nhàng, có gợi ý'},
  {id:2,name:'Vừa',icon:'⭐',mult:EcoData.levels.mult[1],options:4,roundsAdd:0,hints:true,about:'Cân bằng, có gợi ý'},
  {id:3,name:'Khó',icon:'🔥',mult:EcoData.levels.mult[2],options:5,roundsAdd:2,hints:false,about:'Thử thách, không gợi ý'}];
 const clampLevel=n=>{n=Math.floor(+n);return n>=1&&n<=3?n:1};
 const def=n=>defs[clampLevel(n)-1];
 const bonus=(n,base=BASE_PAY)=>Math.round(base*(def(n).mult-1));                       // extra paid for finishing at this level
 const firstTryExtra=(n,first)=>Math.round(Math.min(Math.max(0,first|0),5)*(def(n).mult-1));
 const payRange=(n,base=BASE_PAY)=>[base+bonus(n,base),base+bonus(n,base)+5+firstTryExtra(n,5)];
 const roundsFor=(n,base,cap=Infinity)=>Math.max(3,Math.min(cap,base+def(n).roundsAdd));
 function shuffle(a,rnd=Math.random){const r=[...a];for(let i=r.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[r[i],r[j]]=[r[j],r[i]]}return r}
 /* Trim or pad a multiple-choice list to `n` entries. Original wrong answers are kept first; extras fill the gap.
    Two-option (yes/no style) questions are left alone. The answer is always kept. */
 function fitOptions(options,answer,extras,n,rnd=Math.random){
  if(!Array.isArray(options)||options.length<=2)return options;
  const wrong=[...new Set(options.filter(o=>o!==answer))];
  const pool=[...shuffle(wrong,rnd),...shuffle([...new Set((extras||[]).filter(e=>e!==answer&&!wrong.includes(e)))],rnd)];
  return [answer,...pool.slice(0,Math.max(1,n-1))];
 }
 /* progress: state.levels[type] = {max:highest unlocked level, best:{level:best first-try ratio}} */
 function progress(s,type){
  const all=s.levels&&typeof s.levels==='object'?s.levels:(s.levels={}),p=all[type]&&typeof all[type]==='object'?all[type]:(all[type]={});
  p.max=clampLevel(p.max);p.best=p.best&&typeof p.best==='object'?p.best:{};return p;
 }
 const unlocked=(s,type,n)=>clampLevel(n)<=progress(s,type).max;
 /* ratio = share of questions answered right first time (1 for games that are simply won) */
 function record(s,type,n,ratio){
  const p=progress(s,type),l=clampLevel(n),r=Math.max(0,Math.min(1,+ratio||0));
  if(l>p.max)return {unlockedNext:false};
  p.best[l]=Math.max(+p.best[l]||0,r);
  if(l===p.max&&l<3&&r>=UNLOCK){p.max=l+1;return {unlockedNext:true,level:p.max}}
  return {unlockedNext:false};
 }
 /* arcade games rebuilt with levels: sizes per level */
 const pick=(a,n)=>a[clampLevel(n)-1];
 const arcade={
  memory:n=>({len:pick([3,5,7],n),symbols:pick([4,5,6],n)}),
  count:n=>({min:pick([3,6,12],n),max:pick([8,14,24],n),choices:pick([6,6,8],n)}),
  pairs:n=>({pairs:pick([3,5,8],n)}),
  snacks:n=>({cells:pick([9,12,16],n),need:pick([8,10,12],n)}),
  order:n=>({n:pick([9,14,20],n)}),
  colors:n=>({rounds:pick([5,6,8],n),choices:pick([3,4,5],n)})};
 const arcadeTypes=Object.keys(arcade);
 const sequence=(len,symbols,rnd=Math.random)=>Array.from({length:len},()=>Math.floor(rnd()*symbols));
 function countChoices(count,min,max,size,rnd=Math.random){
  const span=Math.max(size,max-min+1),start=Math.max(min,Math.min(max-size+1,count-Math.floor(rnd()*size)));
  return Array.from({length:size},(_,i)=>start+i).filter(x=>x>0);
 }
 function pairDeck(pairs,icons,rnd=Math.random){const set=icons.slice(0,pairs);return shuffle([...set,...set],rnd)}
 function colorChoices(target,size,total=12,rnd=Math.random){
  const out=[target];for(const c of shuffle(Array.from({length:total},(_,i)=>i).filter(i=>i!==target),rnd)){if(out.length>=size)break;out.push(c)}
  return shuffle(out,rnd);
 }
 return {defs,def,clampLevel,BASE_PAY,UNLOCK,bonus,firstTryExtra,payRange,roundsFor,fitOptions,progress,unlocked,record,arcade,arcadeTypes,sequence,countChoices,pairDeck,colorChoices,shuffle};
})();
