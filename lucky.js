/* Hộp quà may mắn (UI). Card nằm đầu tab "Kiếm xu". Logic + cân bằng: lucky-core.js. Load after levels.js, before slots.js. */
const luckyDialog=document.createElement('dialog');luckyDialog.id='luckyDialog';luckyDialog.setAttribute('aria-label','Hộp quà may mắn');document.body.append(luckyDialog);
let luckyBusy=false,luckyReveal=null;
const luckyRarityName={common:'Thường',uncommon:'Khá',rare:'Hiếm',epic:'Đặc biệt'};
const luckyReduced=()=>window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
function luckyPool(){
  const owned=new Set(DollHouse.normalize(state).owned);
  const free=DollHouse.items.filter(i=>!i.season&&!owned.has(i.id));
  return {common:free.filter(i=>i.price<=45).map(i=>i.id),rare:free.filter(i=>i.price>45&&i.price<=150).map(i=>i.id)};
}
function luckyCost(st){return st.tickets>0?'Dùng vé 🎟️':st.freeReady?'Mở miễn phí hôm nay':`Mua vé · ${st.price} xu`}
function luckyCard(){
  if(activeSlot===null)return '';
  const st=LuckyBox.status(state,day());
  return `<article class="card lucky-card"><div class="eyebrow">THỬ VẬN MAY</div><h3>🎁 Hộp quà may mắn</h3><p class="muted">${st.freeReady?'Hôm nay có 1 lượt mở miễn phí!':st.tickets>0?`Bạn có ${st.tickets} vé miễn phí.`:`Vé ${st.price} xu · còn ${st.left}/${st.cap} vé hôm nay.`}</p><button id="luckyOpen">${luckyCost(st)}</button></article>`;
}
const luckyRenderBase=render;
render=function(){
  luckyRenderBase();
  if(current!=='quests')return;
  const v=$('view');if(!v||v.querySelector('.lucky-card'))return;
  const html=luckyCard();if(!html)return;
  v.insertAdjacentHTML('afterbegin',html);
  $('luckyOpen').onclick=luckyShow;
};
function luckyShow(){
  luckyReveal=null;drawLucky();
  if(!luckyDialog.open)luckyDialog.showModal();
}
function luckyPity(st){
  const left=Math.max(0,st.pityAfter-st.pity);
  return `<div class="lucky-pity" title="Bảo hiểm may mắn"><small>Quà hiếm chắc chắn sau ${left>0?left+' lượt nữa nếu chưa trúng':'lượt này'}</small><progress max="${st.pityAfter}" value="${Math.min(st.pity,st.pityAfter)}"></progress></div>`;
}
function drawLucky(){
  const st=LuckyBox.status(state,day()),r=luckyReveal;
  const item=r&&r.item?DollHouse.find(r.item):null;
  const stage=r?`<div class="lucky-stage reveal ${r.prize.rarity}" role="status"><div class="lucky-burst" aria-hidden="true">${r.prize.rarity==='epic'||r.prize.rarity==='rare'?'✨ ✨ ✨':'✦'}</div><div class="lucky-icon">${item?item.icon:r.prize.icon}</div><b>${item?item.name:r.prize.label}</b><small>${luckyRarityName[r.prize.rarity]}${r.converted?' · đã có hết đồ nên đổi thành '+r.gain+' xu':''}${r.prize.kind==='ticket'?' · +1 vé':''}</small></div>`
   :`<div class="lucky-stage"><div class="lucky-icon box" aria-hidden="true">🎁</div><small>${st.opened?'Đã mở '+st.opened+' hộp':'Bấm nút để mở hộp quà'}</small></div>`;
  const canOpen=!luckyBusy&&(st.tickets>0||st.freeReady||(st.left>0&&state.coins>=st.price));
  const why=st.tickets>0||st.freeReady?'':st.left<=0?'Hôm nay đã hết vé. Mai quay lại nhé!':state.coins<st.price?`Cần ${st.price} xu để mua vé.`:'';
  luckyDialog.innerHTML=`<div class="eyebrow">QUÀ BẤT NGỜ · CHỈ DÙNG XU TRONG GAME</div><h2>🎁 Hộp quà may mắn</h2>${stage}${luckyPity(st)}<div class="actions lucky-actions"><button class="secondary" id="luckyClose">Đóng</button><button id="luckyGo" ${canOpen?'':'disabled'}>${r?'Mở tiếp':luckyCost(st)}</button></div><p class="muted" role="status">${why}</p><details class="lucky-odds"><summary>Tỉ lệ trúng &amp; luật chơi</summary><ul>${LuckyBox.odds().map(o=>`<li><span>${o.icon} ${o.label}</span><b>${o.percent}%</b></li>`).join('')}</ul><p class="muted">Vé ${st.price} xu, mỗi ngày có 1 lượt miễn phí và mua tối đa ${st.cap} vé. Nếu ${st.pityAfter} hộp liên tiếp không có quà hiếm thì hộp kế tiếp chắc chắn có. Trung bình bạn nhận về ít hơn số xu bỏ ra, nên hãy chơi cho vui nhé.</p></details>${st.history.length?`<div class="lucky-history" aria-label="Các lần mở gần đây">${st.history.slice().reverse().map(h=>{const p=LuckyBox.prizes.find(x=>x.id===h.id);return `<span class="lh ${p.rarity}" title="${p.label}">${p.icon}</span>`}).join('')}</div>`:''}`;
  luckyDialog.querySelector('#luckyClose').onclick=()=>luckyDialog.close();
  luckyDialog.querySelector('#luckyGo').onclick=luckyOpenNow;
}
function luckyOpenNow(){
  if(luckyBusy||activeSlot===null)return;
  const slot=activeSlot,backup=SaveStore.copy(state);
  const res=LuckyBox.open(state,{today:day(),pool:luckyPool()});
  if(!res.ok){state=backup;notice(res.message);drawLucky();return}
  if(res.item)DollHouse.normalize(state).owned.push(res.item);
  if(!save()){state=backup;notice('Chưa lưu được, hộp quà bị hủy.');drawLucky();return}
  luckyBusy=true;
  const stage=luckyDialog.querySelector('.lucky-stage');
  if(stage)stage.innerHTML=`<div class="lucky-icon box shake" aria-hidden="true">🎁</div><small>Đang mở...</small>`;
  luckyDialog.querySelector('#luckyGo').disabled=true;
  setTimeout(()=>{
    luckyBusy=false;
    if(activeSlot!==slot||!luckyDialog.open)return;
    luckyReveal=res;try{sound('pet')}catch{}
    if($('coins'))$('coins').textContent=state.coins;
    drawLucky();
    render();
  },luckyReduced()?250:1400);
}
