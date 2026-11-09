/* Difficulty picker + reward hook. Games with levels = every practiceGames entry + the six arcade games rebuilt in
   arcade-levels.js. Dễ pays the old flat reward; Vừa/Khó add a level bonus on completion (see levels-core.js).
   Must load after rewards.js and arcade-levels.js. */
let levelSession=null;
/* thưởng nền theo công sức từng game (balance-core.js); chỉ để hiển thị, tiền thật tính qua Balance.pay */
arcadeGames.forEach(g=>{g[4]=Balance.baseOf(g[0])});
Object.entries(practiceGames).forEach(([id,g])=>{g.reward=Balance.baseOf(id)});
const levelHas=type=>!!practiceGames[type]||Levels.arcadeTypes.includes(type);
const levelNow=type=>levelSession&&levelSession.type===type&&levelSession.slot===activeSlot?levelSession.level:1;
function levelReport(type,ratio,first){if(levelSession&&levelSession.type===type){levelSession.ratio=ratio;levelSession.first=first}}
/* practice-style games: trim/pad the answer list to the level's size, borrowing answers from other rounds as extra distractors */
function levelOptions(q,session){
  const n=Levels.def(session.level).options;
  if(q.audio||!Array.isArray(q.options)||q.options.length<=2)return q.options;
  let extras=[];
  if(q.options.length<n){
    const seen=new Set();
    for(const r of shuffle([...Array(session.rounds).keys()].filter(r=>r!==session.round))){
      if(seen.size>=n)break;
      try{const x=session.game.question(r,session);if(typeof x.answer==='string'&&x.answer!==q.answer)seen.add(x.answer)}catch{}
    }
    extras=[...seen];
  }
  return Levels.fitOptions(q.options,q.answer,extras,n);
}
const levelStartBase=startMini;
startMini=function(type){
  if(!levelHas(type)){levelSession=null;return levelStartBase(type)}
  levelPicker(type);
};
function levelPicker(type){
  const g=arcadeGames.find(x=>x[0]===type),p=Levels.progress(state,type);
  adventureDialog.innerHTML=`<div class="eyebrow">CHỌN MỨC ĐỘ</div><h2>${g[1]} ${g[2]}</h2><p class="muted">Mức khó hơn thì thưởng cao hơn. Đạt từ ${Math.round(Levels.UNLOCK*100)}% câu đúng ngay lần đầu để mở mức tiếp theo.</p><div class="level-list">${Levels.defs.map(d=>{
    const ok=d.id<=p.max,r=Levels.payRange(d.id,g[4]),best=p.best[d.id];
    return `<button class="level-card lv${d.id} ${ok?'':'locked'}" data-level="${d.id}" ${ok?'':'disabled'}><span class="level-icon" aria-hidden="true">${ok?d.icon:'🔒'}</span><span class="level-main"><b>${d.name}</b><small>${ok?d.about:'Mở khóa ở mức '+Levels.def(d.id-1).name}</small>${best!==undefined?`<small>Tốt nhất: ${Math.round(best*100)}%</small>`:''}</span><span class="level-pay">🪙 ${r[0]}–${r[1]}</span></button>`}).join('')}</div><button class="secondary close-mini">Đóng</button>`;
  adventureDialog.querySelectorAll('[data-level]').forEach(b=>b.onclick=()=>{levelSession={type,level:Number(b.dataset.level),slot:activeSlot};levelStartBase(type)});
  adventureDialog.querySelector('.close-mini').onclick=()=>adventureDialog.close();
  if(!adventureDialog.open)adventureDialog.showModal();
  adventureDialog.scrollTop=0;
  (adventureDialog.querySelector(`[data-level="${p.max}"]`)||adventureDialog.querySelector('[data-level]')).focus({preventScroll:true});
}
const levelEventBase=recordEvent;
recordEvent=function(type){
  const s=levelSession,game=/^mini_/.test(type)?type.slice(5):null;
  if(game&&activeSlot!==null){
    /* thưởng mức khó cũng giảm khi lặp một trò; ghi nhận lượt chơi + thưởng đa dạng (mốc 3/6/10 trò khác nhau/ngày) */
    const f=Balance.factor(state,day(),game);
    let extra=0,res=null,d=null;
    if(s&&s.slot===activeSlot&&!s.paid&&game===s.type){
      s.paid=true;d=Levels.def(s.level);
      extra=Math.round((Levels.bonus(s.level,Balance.baseOf(game))+Levels.firstTryExtra(s.level,s.first??0))*f);
      res=Levels.record(state,s.type,s.level,s.ratio??1);
    }
    const v=Balance.record(state,day(),game);
    state.coins+=extra+v.bonus;
    if(extra>0||(res&&res.unlockedNext)||v.bonus>0)setTimeout(()=>{
      if(extra>0||(res&&res.unlockedNext))notice(`${d.icon} Mức ${d.name}${extra>0?': +'+extra+' xu':''}${res.unlockedNext?' · Mở khóa mức '+Levels.def(res.level).name+'!':''}`);
      if(v.bonus>0)setTimeout(()=>{notice(`🌈 Đã chơi ${v.distinct} trò khác nhau hôm nay: +${v.bonus} xu!`);if($('coins'))$('coins').textContent=state.coins},1800);
      if($('coins'))$('coins').textContent=state.coins;
    },1500);
  }
  return levelEventBase(type);
};
