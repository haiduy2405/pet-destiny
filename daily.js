/* Tab Làng: Nhiệm vụ ngày (quests-core.js) · Đơn hàng · Thành tựu · Điểm danh (village-core.js). Số liệu ở EcoData.quests / EcoData.village. */
(()=>{
 const counts=()=>Adventure.daily(state,day()).counts;
 const stat=()=>Quests.status(state,counts(),day());
 const go={mini:['quests'],variety:['quests'],care:['garden'],fish:['fish'],hunt:['fortune']};
 function jump(metric){const [to]=go[metric]||['quests'];current=to;if(to==='fish'&&Tabs.find('fish')?.open)Tabs.find('fish').open();render();window.scrollTo(0,0)}
 let sub='quests';
 const SUBS=[['quests','📜','Nhiệm vụ'],['orders','📦','Đơn hàng'],['ach','🏆','Thành tựu'],['checkin','📅','Điểm danh']];
 const subBadge=id=>{const st=stat();return id==='quests'?st.items.filter(x=>x.done&&!x.claimed).length+(st.canBonus?1:0):id==='orders'?Village.status(state,day()).filter(x=>x.can&&!x.done).length:id==='ach'?Village.achievements(state,day()).reduce((n,x)=>n+x.ready,0):Village.checkinStatus(state,day()).claimed?0:1};
 const tabs=()=>`<div class="vl-tabs" role="tablist">${SUBS.map(([id,ic,lb])=>{const b=subBadge(id);return `<button role="tab" class="vl-tab ${sub===id?'on':''}" data-sub="${id}" aria-selected="${sub===id}"><span>${ic}</span>${lb}${b?`<i class="vl-dot">${b}</i>`:''}</button>`}).join('')}</div>`;
 function bindTabs(){document.querySelectorAll('[data-sub]').forEach(b=>b.onclick=()=>{sub=b.dataset.sub;render();window.scrollTo(0,0)})}
 function drawQuests(){
  const st=stat(),done=st.items.filter(x=>x.claimed).length,pct=Math.round(done/st.items.length*100);
  $('view').innerHTML=tabs()+`<section class="dq-hero"><div class="dq-streak"><span class="dq-flame">🔥</span><b>${st.streak}</b><small>ngày liên tiếp</small></div>
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
 function drawOrders(){
  const list=Village.status(state,day()),done=list.filter(x=>x.done).length;
  const need=o=>[...Object.entries(o.need.crop||{}).map(([id,n])=>{const c=Farm.crops.find(x=>x.id===id),have=(state.farm?.barn?.[id])||0;return `<span class="vl-need ${have>=n?'ok':''}">${c.icon} ${Math.min(have,n)}/${n}</span>`}),...(o.need.fish?[(()=>{const f=o.need.fish,have=(state.fishing?.bucket||[]).filter(x=>x.v>=f.min).length;return `<span class="vl-need ${have>=f.n?'ok':''}">🐟 ${Math.min(have,f.n)}/${f.n} (≥${f.min} xu)</span>`})()]:[])].join('');
  $('view').innerHTML=tabs()+`<section class="vl-hero"><span class="vl-hero-ic">🏘️</span><div><div class="eyebrow">ĐƠN HÀNG LÀNG</div><h2>${done}/${list.length} đã giao</h2><small>Dân làng đặt hàng mỗi ngày · thưởng cao hơn bán chợ. Hàng lấy từ kho nông sản và giỏ cá.</small></div></section>
  <div class="dq-list">${list.map(o=>`<article class="dq-row ${o.done?'is-claimed':o.can?'is-ready':''}"><span class="dq-icon">${o.icon}</span><div class="dq-body"><strong>${o.label}</strong><div class="vl-needs">${need(o)}</div></div>${o.done?'<span class="dq-done">✓</span>':o.can?`<button class="dq-claim" data-deliver="${o.slot}">Giao +${o.reward} 🪙</button>`:`<span class="vl-reward">+${o.reward} 🪙</span>`}</article>`).join('')}</div>`;
  bindTabs();document.querySelectorAll('[data-deliver]').forEach(b=>b.onclick=()=>claim(()=>Village.deliver(state,day(),+b.dataset.deliver)));
 }
 function drawAch(){
  const list=Village.achievements(state,day()),got=list.reduce((n,a)=>n+a.tiers.filter(t=>t.claimed).length,0),all=list.reduce((n,a)=>n+a.tiers.length,0);
  $('view').innerHTML=tabs()+`<section class="vl-hero"><span class="vl-hero-ic">🏆</span><div><div class="eyebrow">THÀNH TỰU</div><h2>${got}/${all} mốc</h2><small>Mỗi mốc nhận thưởng một lần.</small></div></section>
  <div class="dq-list">${list.map(a=>{const nx=a.next,pct=nx?Math.min(100,a.value/nx.t*100):100,rd=a.tiers.find(t=>t.done&&!t.claimed);
   return `<article class="dq-row ${rd?'is-ready':!nx?'is-claimed':''}"><span class="dq-icon">${a.icon}</span><div class="dq-body"><strong>${a.label}</strong><div class="dq-bar small"><i style="width:${pct}%"></i></div><small>${nx?`${Math.min(a.value,nx.t)}/${nx.t}`:'Hoàn thành'} · ${a.tiers.map(t=>t.claimed?'★':'☆').join('')}</small></div>${rd?`<button class="dq-claim" data-ach="${rd.key}">+${rd.reward} 🪙</button>`:nx?`<span class="vl-reward">+${nx.reward} 🪙</span>`:'<span class="dq-done">✓</span>'}</article>`}).join('')}</div>`;
  bindTabs();document.querySelectorAll('[data-ach]').forEach(b=>b.onclick=()=>claim(()=>Village.claimAch(state,day(),b.dataset.ach)));
 }
 function drawCheckin(){
  const c=Village.checkinStatus(state,day());
  $('view').innerHTML=tabs()+`<section class="vl-hero"><span class="vl-hero-ic">📅</span><div><div class="eyebrow">ĐIỂM DANH 7 NGÀY</div><h2>${c.total} ngày đã điểm danh</h2><small>Bỏ lỡ một ngày cũng không sao, cứ tiếp tục vòng quà.</small></div></section>
  <div class="vl-days">${c.days.map(d=>`<div class="vl-day ${d.got?'got':''} ${d.today&&!c.claimed?'today':''}"><small>Ngày ${d.day}</small><span>${d.got?'✓':d.coins?'🪙':(Fishing.bait(d.bait)?.icon||'🪱')}</span><b>${d.coins?'+'+d.coins:'+'+d.n+' mồi'}</b></div>`).join('')}</div>
  <button id="ciBtn" class="dq-claim vl-ci" ${c.claimed?'disabled':''}>${c.claimed?'Hôm nay đã nhận · mai quay lại nhé':'Điểm danh nhận quà'}</button>`;
  bindTabs();$('ciBtn').onclick=()=>claim(()=>Village.checkin(state,day()));
 }
 function draw(){(sub==='orders'?drawOrders:sub==='ach'?drawAch:sub==='checkin'?drawCheckin:drawQuests)();if(sub==='quests')bindTabs()}
 function claim(fn){const r=txn(fn);if(r&&r.ok)notice(r.message);render()}
 Tabs.register({id:'daily',icon:'🏘️',label:'Làng',draw,badge:()=>SUBS.reduce((n,[id])=>n+subBadge(id),0)});
})();
