/* Tab "Nông trại": trồng cây chờ thời gian, bán ở chợ (giá đổi mỗi ngày), mở thêm thửa đất, phối giống ra trứng.
   Logic + cân bằng: farm-core.js. Load after dollhouse.js, before rewards.js/slots.js. */
let fmTab='plots',fmSeedFor=null,fmTimer=null,fmPickA=null,fmPickB=null,fmReveal=null;
const fmBaseRender=render;
render=function(){
  const mine=current==='farm';
  if(mine)current='collection';
  fmBaseRender();
  if(mine)current='farm';
  clearInterval(fmTimer);fmTimer=null;
  fmNav();
  if(mine){document.body.dataset.page='farm';renderFarm()}
};
function fmNav(){
  const nav=$('nav');if(!nav)return;let b=nav.querySelector('[data-tab="farm"]');
  if(!b){b=document.createElement('button');b.dataset.tab='farm';b.innerHTML='<span class="nav-icon" aria-hidden="true">🌾</span><span>Nông trại</span>';b.onclick=()=>{current='farm';fmSeedFor=null;render();window.scrollTo(0,0)};nav.append(b)}
  if(current==='farm')nav.querySelectorAll('[data-tab]').forEach(x=>{const on=x.dataset.tab==='farm';x.classList.toggle('active',on);on?x.setAttribute('aria-current','page'):x.removeAttribute('aria-current')});
  const vis=[...nav.children].filter(x=>getComputedStyle(x).display!=='none').length||4;nav.style.gridTemplateColumns=`repeat(${vis},minmax(0,1fr))`;
}
const fmF=()=>Farm.normalize(state);
const fmMin=ms=>{const s=Math.ceil(ms/1000);if(s>=3600)return Math.floor(s%3600/60)?`${Math.floor(s/3600)} giờ ${Math.floor(s%3600/60)} phút`:`${Math.floor(s/3600)} giờ`;if(s>=60)return s%60?`${Math.floor(s/60)} phút ${s%60} giây`:`${Math.floor(s/60)} phút`;return `${s} giây`};
/* giao dịch an toàn: lưu hỏng thì hoàn lại */
function fmDo(fn){
  if(activeSlot===null)return null;
  const backup=SaveStore.copy(state),res=fn();
  if(!res||!res.ok){state=backup;if(res&&res.message)notice(res.message);return res}
  if(!save()){state=backup;notice('Chưa lưu được, thử lại nhé.');return {ok:false}}
  if($('coins'))$('coins').textContent=state.coins;
  return res;
}
function renderFarm(){
  const f=fmF(),at=now(),t=fmTab;
  const tabs=[['plots','🌱 Trồng trọt'],['market','🧺 Chợ & kho'],['breed','🥚 Phối giống']];
  $('view').innerHTML=`<div class="eyebrow">NÔNG TRẠI NHỎ</div><h2>🌾 Nông trại</h2><div class="fm-tabs" role="tablist">${tabs.map(([k,l])=>`<button role="tab" aria-selected="${t===k}" class="${t===k?'':'secondary'}" data-fmtab="${k}">${l}</button>`).join('')}</div><div id="fmBody">${t==='plots'?fmPlots(f,at):t==='market'?fmMarket(f):fmBreed(f,at)}</div>`;
  $('view').querySelectorAll('[data-fmtab]').forEach(b=>b.onclick=()=>{fmTab=b.dataset.fmtab;fmSeedFor=null;renderFarm()});
  if(t==='plots')fmBindPlots(f);else if(t==='market')fmBindMarket();else fmBindBreed(f);
  fmTick();
}
function fmTick(){
  fmTimer=setInterval(()=>{
    if(current!=='farm'){clearInterval(fmTimer);return}
    const f=fmF(),at=now();let changed=false;
    document.querySelectorAll('[data-fmplot]').forEach(el=>{
      const i=Number(el.dataset.fmplot),info=Farm.plotInfo(f.plots[i],at);
      if(info.state==='growing'){const l=el.querySelector('.fm-left');if(l)l.textContent=fmMin(info.left);const p=el.querySelector('progress');if(p)p.value=info.progress}
      else if(el.dataset.fmstate==='growing')changed=true;
    });
    const job=document.querySelector('[data-fmjob="wait"]');
    if(job){const j=Farm.jobState(state,at);if(j&&!j.ready){const l=job.querySelector('.fm-left');if(l)l.textContent=fmMin(j.left)}else changed=true}
    if(changed&&!document.querySelector('dialog[open]'))renderFarm();
  },1000);
}
/* ---------- trồng trọt ---------- */
function fmPlots(f,at){
  const day_=day(),cells=f.plots.map((p,i)=>{
    const info=Farm.plotInfo(p,at);
    if(info.state==='empty')return `<button class="fm-plot empty" data-fmplot="${i}" data-fmstate="empty" data-sow="${i}" aria-label="Thửa ${i+1} trống, bấm để gieo hạt"><span class="fm-big">➕</span><small>Gieo hạt</small></button>`;
    if(info.state==='ripe')return `<div class="fm-plot ripe" data-fmplot="${i}" data-fmstate="ripe"><span class="fm-big fm-bounce" aria-hidden="true">${info.crop.icon}</span><b>${info.crop.name}</b><button data-harvest="${i}">Thu hoạch</button></div>`;
    const sprout=info.progress<.34?'🌱':info.progress<.67?'🌿':'🪴';
    return `<div class="fm-plot growing" data-fmplot="${i}" data-fmstate="growing"><span class="fm-big" aria-hidden="true">${sprout}</span><b>${info.crop.name}</b><progress max="1" value="${info.progress}"></progress><small class="fm-left">${fmMin(info.left)}</small><button class="secondary" data-water="${i}" ${info.watered?'disabled':''}>${info.watered?'Đã tưới':'💧 Tưới (−20%)'}</button></div>`;
  });
  const cost=Farm.plotCost(state);
  if(cost!==null)cells.push(`<button class="fm-plot locked" data-buyplot="1" aria-label="Mở thửa đất mới"><span class="fm-big">🔒</span><small>Mở thửa đất</small><b>🪙 ${cost}</b></button>`);
  const ripe=f.plots.filter((p,i)=>Farm.plotInfo(p,at).state==='ripe').length;
  const seed=fmSeedFor!==null?`<section class="fm-seeds card" aria-label="Chọn hạt giống"><h3>Chọn hạt giống cho thửa ${fmSeedFor+1}</h3>${Farm.crops.map(c=>{const pr=Farm.price(day_,c.id),can=state.coins>=c.seed;return `<button class="fm-seed ${can?'':'secondary'}" data-seed="${c.id}" ${can?'':'disabled'}><span class="fm-icon">${c.icon}</span><span class="fm-main"><b>${c.name}</b><small>${fmMin(c.grow)} · bán ~${pr} xu</small></span><span class="fm-cost">🪙 ${c.seed}</span></button>`}).join('')}<button class="secondary" id="fmCancel">Đóng</button></section>`:'';
  return `<p class="muted">Gieo hạt rồi quay lại sau. Cây vẫn lớn khi bạn tắt máy. Tưới nước giúp cây nhanh hơn 20%.</p><div class="fm-grid">${cells.join('')}</div>${ripe>1?`<button id="harvestAll" class="fm-wide">🧺 Thu hoạch tất cả (${ripe})</button>`:''}${seed}`;
}
function fmBindPlots(f){
  const q=s=>$('view').querySelectorAll(s);
  q('[data-sow]').forEach(b=>b.onclick=()=>{fmSeedFor=Number(b.dataset.sow);renderFarm();$('view').querySelector('.fm-seeds')?.scrollIntoView({block:'nearest',behavior:'smooth'})});
  q('[data-seed]').forEach(b=>b.onclick=()=>{
    const i=fmSeedFor,id=b.dataset.seed;fmSeedFor=null;
    const r=fmDo(()=>Farm.plant(state,i,id,now()));if(r&&r.ok){sfxPlay('plant');notice(`Đã gieo ${Farm.find(id).icon} ${Farm.find(id).name}. Quay lại sau ${fmMin(Farm.find(id).grow)} nhé!`)}renderFarm();
  });
  const cancel=$('fmCancel');if(cancel)cancel.onclick=()=>{fmSeedFor=null;renderFarm()};
  q('[data-water]').forEach(b=>b.onclick=()=>{const r=fmDo(()=>Farm.water(state,Number(b.dataset.water),now()));if(r&&r.ok)sfxPlay('water');renderFarm()});
  q('[data-harvest]').forEach(b=>b.onclick=()=>fmHarvest([Number(b.dataset.harvest)]));
  const all=$('harvestAll');if(all)all.onclick=()=>fmHarvest(f.plots.map((p,i)=>Farm.plotInfo(p,now()).state==='ripe'?i:-1).filter(i=>i>=0));
  const bp=$view('[data-buyplot]');if(bp)bp.onclick=()=>{const r=fmDo(()=>Farm.buyPlot(state));if(r&&r.ok){sfxPlay('win');notice('🌾 Đã mở thêm một thửa đất!')}renderFarm()};
}
const $view=s=>$('view').querySelector(s);
function fmHarvest(list){
  let got={},bonus=0,err='';
  const r=fmDo(()=>{for(const i of list){const h=Farm.harvest(state,i,now());if(h.ok){got[h.crop]=(got[h.crop]||0)+h.n;if(h.bonus)bonus++}else if(!err)err=h.message}return Object.keys(got).length?{ok:true}:{ok:false,message:err}});
  if(r&&r.ok){sfxPlay('harvest');notice('Thu hoạch: '+Object.entries(got).map(([k,n])=>`${Farm.find(k).icon}×${n}`).join(' ')+(bonus?' · 🎉 Được mùa!':''));}
  renderFarm();
}
/* ---------- chợ & kho ---------- */
function fmMarket(f){
  const d=day(),rows=Farm.crops.map(c=>{
    const pr=Farm.price(d,c.id),ratio=pr/c.sell,tag=ratio>=1.1?'<b class="fm-up">▲ giá cao</b>':ratio<=.95?'<span class="fm-down">▼ giá thấp</span>':'<span>bình thường</span>';
    const n=f.barn[c.id]||0;
    return `<article class="fm-row"><span class="fm-icon">${c.icon}</span><div class="fm-main"><b>${c.name}</b><small>🪙 ${pr}/củ · ${tag}</small></div><div class="fm-sell"><span class="fm-n" aria-label="Có ${n}">×${n}</span><button data-sell="${c.id}" data-n="1" ${n?'':'disabled'}>Bán 1</button><button class="secondary" data-sell="${c.id}" data-n="all" ${n?'':'disabled'}>Bán hết</button></div></article>`;
  }).join('');
  const total=Farm.crops.reduce((a,c)=>a+(f.barn[c.id]||0)*Farm.price(d,c.id),0),cnt=Object.values(f.barn).reduce((a,n)=>a+n,0);
  return `<p class="muted">Giá chợ đổi mỗi ngày (±). Nông sản có thể giữ trong kho (tối đa ${Farm.BARN_CAP}/loại), chờ giá cao mới bán.</p><div class="fm-rows">${rows}</div>${cnt?`<button id="sellAll" class="fm-wide">Bán tất cả · +${total} xu</button>`:'<p class="empty">Kho đang trống. Thu hoạch cây để có hàng bán.</p>'}<p class="stat">Tổng thu từ nông trại: 🪙 ${f.earned} · đã thu hoạch ${f.harvested} sản phẩm</p>`;
}
function fmBindMarket(){
  $('view').querySelectorAll('[data-sell]').forEach(b=>b.onclick=()=>{
    const r=fmDo(()=>Farm.sell(state,b.dataset.sell,b.dataset.n==='all'?'all':1,day()));
    if(r&&r.ok)notice(`Đã bán · +${r.coins} xu`);renderFarm();
  });
  const all=$('sellAll');if(all)all.onclick=()=>{
    let sum=0;const r=fmDo(()=>{for(const c of Farm.crops){if((fmF().barn[c.id]||0)>0){const x=Farm.sell(state,c.id,'all',day());if(x.ok)sum+=x.coins}}return sum?{ok:true}:{ok:false,message:'Kho trống.'}});
    if(r&&r.ok)notice(`Đã bán hết · +${sum} xu`);renderFarm();
  };
}
/* ---------- phối giống ---------- */
function fmPetCard(p,issue,sel,which){
  return `<button class="fm-pet ${sel?'sel':''}" data-pick="${which}" data-pet="${p.id}" ${issue?'disabled':''} aria-pressed="${sel}">${petArt(p)}<b>${petName(p)}</b><small>${issue?Atelier.escape(issue):'Sẵn sàng'}</small></button>`;
}
function fmBreed(f,at){
  const job=Farm.jobState(state,at);
  if(fmReveal){
    const e=fmReveal,sp=SPECIES[e.egg.species];
    return `<div class="fm-reveal card"><div class="eyebrow">TRỨNG MỚI!</div><div class="egg-preview">${sprite(e.egg.species,'',e.egg.color)}</div><h3>${sp[0]} ${COLORS[e.egg.color][0]}</h3><p class="muted">${e.mutantSpecies?'🌟 Đột biến! Loài khác với bố mẹ.':e.mutantColor?'✨ Màu lạ so với bố mẹ!':'Giống bố hoặc mẹ.'} Trứng đã nằm trong Nhà trứng (tab Vườn thú), bấm ấp để nở.</p><button id="fmRevealOk">Tuyệt vời!</button></div>`;
  }
  if(job){
    const a=state.pets.find(p=>p.id===f.job.a),b=state.pets.find(p=>p.id===f.job.b);
    return `<article class="card fm-job" data-fmjob="${job.ready?'done':'wait'}"><h3>💞 ${a?petName(a):'Thú'} &amp; ${b?petName(b):'Thú'}</h3>${job.ready?'<p>Trứng đã sẵn sàng!</p><button id="fmCollect">🥚 Nhận trứng</button>':`<p class="muted">Đang chờ trứng...</p><p>Còn <b class="fm-left">${fmMin(job.left)}</b></p><p class="muted">Cứ tắt máy đi chơi, trứng vẫn được tạo.</p>`}</article>`;
  }
  const list=Farm.breedable(state,at);
  if(list.length<2)return `<p class="empty">Cần ít nhất 2 thú để phối giống. Hãy ấp thêm trứng ở tab Vườn thú.</p>`;
  const ok=list.filter(x=>!x.issue).length;
  const a=state.pets.find(p=>p.id===fmPickA),b=state.pets.find(p=>p.id===fmPickB);
  const can=a&&b&&state.coins>=Farm.BREED_COST;
  return `<p class="muted">Chọn 2 thú đã lớn (từ giai đoạn Thiếu niên) và đang khỏe. Trứng mang loài và màu của bố hoặc mẹ, thỉnh thoảng đột biến. Mất ${fmMin(Farm.BREED_MS)}, phí 🪙 ${Farm.BREED_COST}.</p>
  <h3>Thú thứ nhất</h3><div class="fm-pets">${list.map(x=>fmPetCard(x.pet,x.issue,x.pet.id===fmPickA,'a')).join('')}</div>
  <h3>Thú thứ hai</h3><div class="fm-pets">${list.map(x=>fmPetCard(x.pet,x.issue||(x.pet.id===fmPickA?'Đã chọn ở trên':null),x.pet.id===fmPickB,'b')).join('')}</div>
  ${ok<2?'<p class="empty">Chưa đủ 2 thú sẵn sàng. Hãy cho thú ăn, chơi, huấn luyện để lớn lên.</p>':''}
  <button id="fmBreed" class="fm-wide" ${can?'':'disabled'}>💞 Phối giống · 🪙 ${Farm.BREED_COST}</button>`;
}
function fmBindBreed(f){
  $('view').querySelectorAll('[data-pick]').forEach(b=>b.onclick=()=>{
    if(b.dataset.pick==='a'){fmPickA=fmPickA===b.dataset.pet?null:b.dataset.pet;if(fmPickB===fmPickA)fmPickB=null}else fmPickB=fmPickB===b.dataset.pet?null:b.dataset.pet;
    renderFarm();
  });
  const go=$('fmBreed');if(go)go.onclick=()=>{
    const r=fmDo(()=>Farm.startBreed(state,fmPickA,fmPickB,now()));
    if(r&&r.ok){fmPickA=fmPickB=null;sfxPlay('pet');notice('💞 Đã bắt đầu phối giống. Quay lại sau nhé!')}renderFarm();
  };
  const col=$('fmCollect');if(col)col.onclick=()=>{
    const r=fmDo(()=>Farm.collect(state,now(),Math.random,()=>crypto.randomUUID()));
    if(r&&r.ok){fmReveal=r;sfxPlay('egg');try{burst('🥚')}catch{}}renderFarm();
  };
  const ok=$('fmRevealOk');if(ok)ok.onclick=()=>{fmReveal=null;renderFarm()};
}
