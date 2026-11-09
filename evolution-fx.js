/* Growth stages (by total XP) + evolution cutscene. */
const STAGES=[[0,'🥚','Mới nở'],[25,'🌱','Thiếu niên'],[60,'🌿','Trưởng thành'],[100,'⭐','Sẵn sàng tiến hóa']];
function stageOf(p){
  if(p.evolution)return {i:4,icon:'👑',name:'Đã tiến hóa',scale:1.25};
  const xp=p.totalXP??p.xp??0;let i=0;STAGES.forEach((s,k)=>{if(xp>=s[0])i=k});
  return {i,icon:STAGES[i][1],name:STAGES[i][2],scale:[.62,.78,.92,1.05][i],next:STAGES[i+1]};
}
petArt=function(p){
  const st=stageOf(p);
  return `<div class="pet-art stage-${st.i} ${p.evolution?'evolved':''}" style="--growth:${st.scale}">${sprite(p.species,'',p.color)}<span class="stage-chip" title="${st.name}">${st.icon}</span></div>`;
};
/* stage-up toast */
const fxXp=PetHomes.xp;
PetHomes.xp=function(p,n){
  const before=stageOf(p).i;fxXp(p,n);const after=stageOf(p);
  if(after.i>before)setTimeout(()=>{notice(`${after.icon} ${petName(p)} đã lên giai đoạn «${after.name}»!`);burst(after.icon);sound('reward')},1300);
};
/* detail panel: stage track */
const fxDrawPanel=drawGardenPanel;
drawGardenPanel=function(){
  fxDrawPanel();
  const p=gardenPanel&&state.pets.find(x=>x.id===gardenPanel.id),lvl=gardenDialog.querySelector('.home-detail-level');
  if(!p||!lvl||gardenDialog.querySelector('.stage-track'))return;
  const st=stageOf(p),xp=p.totalXP??p.xp,el=document.createElement('div');el.className='stage-track';
  const steps=STAGES.map((s,k)=>`<span class="${st.i>=k?'on':''}">${s[1]}<small>${s[2]}</small></span>`).join('')+`<span class="${p.evolution?'on':''}">👑<small>Tiến hóa</small></span>`;
  const goal=p.evolution?'Đã đạt mốc cao nhất 👑':st.next?`Còn ${st.next[0]-xp} XP để lên «${st.next[2]}»`:'Làm nhiệm vụ tiến hóa để nhận vương miện!';
  el.innerHTML=`<div class="stage-steps">${steps}</div><p>${goal}</p>`;lvl.after(el);
};
/* evolution cutscene */
const fxEvolve=Adventure.evolve;
Adventure.evolve=function(s,id,d){
  const p=s.pets.find(x=>x.id===id),ok=fxEvolve(s,id,d);
  if(ok&&p)setTimeout(()=>playEvolution(p),50);
  return ok;
};
function playEvolution(p){
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches,o=document.createElement('div');
  o.className='evo-overlay';o.setAttribute('role','dialog');o.setAttribute('aria-label','Tiến hóa');
  const art=(cls)=>`<div class="pet-art ${cls}" style="--growth:${cls==='evolved'?1.25:1.05}">${sprite(p.species,'',p.color)}${cls==='evolved'?'<span class="stage-chip">👑</span>':''}</div>`;
  o.innerHTML=`<div class="evo-rays"></div><div class="evo-rings"><i></i><i></i><i></i></div><div class="evo-stage"><div class="evo-old">${art('')}</div><div class="evo-new">${art('evolved')}</div></div><div class="evo-flash"></div><div class="evo-text"><h2>✦ ${petName(p)} tiến hóa! ✦</h2><p>Thu nhập tăng · giá trị +25 · nhận vương miện 👑</p><button id="evoDone">Tuyệt vời!</button></div>`;
  document.body.append(o);sound('reward');
  const end=()=>{o.remove();render()};
  $('evoDone').onclick=end;
  setTimeout(()=>{burst('✨');burst('👑')},reduce?100:2100);
  if(reduce)o.classList.add('reduce');
}
