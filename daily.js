/* Tab Nhiệm vụ ngày: 4 nhiệm vụ mỗi ngày + rương hoàn thành + chuỗi ngày. Logic ở quests-core.js, số liệu ở EcoData.quests. */
(()=>{
 const counts=()=>Adventure.daily(state,day()).counts;
 const stat=()=>Quests.status(state,counts(),day());
 const go={mini:['quests'],variety:['quests'],care:['garden'],fish:['fish'],hunt:['fortune']};
 function jump(metric){const [to]=go[metric]||['quests'];current=to;if(to==='fish'&&Tabs.find('fish')?.open)Tabs.find('fish').open();render();window.scrollTo(0,0)}
 function draw(){
  const st=stat(),done=st.items.filter(x=>x.claimed).length,pct=Math.round(done/st.items.length*100);
  $('view').innerHTML=`<section class="dq-hero"><div class="dq-streak"><span class="dq-flame">🔥</span><b>${st.streak}</b><small>ngày liên tiếp</small></div>
   <div class="dq-hero-main"><div class="eyebrow">NHIỆM VỤ HÔM NAY</div><h2>${done}/${st.items.length} hoàn thành</h2><div class="dq-bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pct}%"></i></div></div></section>
   <div class="dq-list">${st.items.map(q=>`<article class="dq-row ${q.claimed?'is-claimed':q.done?'is-ready':''}"><span class="dq-icon">${q.icon}</span>
    <div class="dq-body"><strong>${q.label}</strong><div class="dq-bar small"><i style="width:${q.value/q.target*100}%"></i></div><small>${q.value}/${q.target}</small></div>
    ${q.claimed?'<span class="dq-done">✓</span>':q.done?`<button class="dq-claim" data-claim="${q.id}">+${q.reward} 🪙</button>`:`<button class="secondary dq-go" data-go="${q.metric}">Đi · ${q.reward} 🪙</button>`}</article>`).join('')}</div>
   <section class="dq-chest ${st.canBonus?'is-ready':st.bonus?'is-open':''}"><span class="dq-chest-icon">${st.bonus?'🎉':'🎁'}</span>
    <div><strong>Rương hoàn thành ngày</strong><small>${st.bonus?'Đã nhận hôm nay · mai quay lại giữ chuỗi nhé':`Xong cả 4 để nhận +${st.bonusPay} 🪙 (chuỗi ngày ${st.nextStreak})`}</small></div>
    <button id="dqBonus" ${st.canBonus?'':'disabled'}>${st.bonus?'Đã nhận':'Mở rương'}</button></section>`;
  document.querySelectorAll('[data-claim]').forEach(b=>b.onclick=()=>claim(()=>Quests.claim(state,counts(),day(),b.dataset.claim)));
  document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>jump(b.dataset.go));
  $('dqBonus').onclick=()=>claim(()=>Quests.claimBonus(state,counts(),day()));
 }
 function claim(fn){const r=txn(fn);if(r&&r.ok)notice(r.message);render()}
 Tabs.register({id:'daily',icon:'📜',label:'Nhiệm vụ',draw,badge:()=>{const st=stat();return st.items.filter(x=>x.done&&!x.claimed).length+(st.canBonus?1:0)}});
})();
