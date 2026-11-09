/* Tab "Câu cá": cửa hàng (cần, phụ kiện, mồi), thuê hồ, mini game 3 bước (thả câu → giật đúng lúc → giữ cá trong vùng xanh), sổ cá.
   Điều khiển: chạm/giữ chuột hoặc phím Space/↑ (dùng được trên điện thoại). Logic + cân bằng: fishing-core.js.
   Load after farm.js, before sfx.js/rewards.js (recordEvent('mini_fishing') tự có +10 xu lần đầu mỗi ngày nhờ rewards.js và thưởng đa dạng nhờ levels.js). */
let fsTab='dock',fsG=null,fsRaf=0,fsHold=false;
Tabs.register({id:'fish',icon:'🎣',label:'Câu cá',open(){fsTab='dock'},leave(){fsStop()},draw(){renderFish()}});
const fsF=()=>Fishing.normalize(state);
const fsStop=()=>{if(fsRaf){cancelAnimationFrame(fsRaf);fsRaf=0}fsHold=false};
const fsBuzz=ms=>{try{navigator.vibrate&&navigator.vibrate(ms)}catch{}};
const fsReduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
function renderFish(){
  const f=fsF();
  /* vé đã hết lượt nhưng chưa tất toán (đóng trang giữa chừng) */
  if(!fsG&&activeSlot!==null&&f.ticket&&f.ticket.left<=0)fsSettle();
  /* rời tab giữa lượt câu: cá đã bỏ đi (vòng lặp đã dừng) */
  if(fsG&&['wait','bite','reel'].includes(fsG.stage)){fsG.stage='result';fsG.out={caught:false,msg:'Bạn rời hồ giữa chừng nên cá đã bỏ đi.'}}
  if(fsG){fsPlayRender();return}
  const tabs=[['dock','🎣 Bến câu'],['shop','🛒 Cửa hàng'],['book','📖 Sổ cá']];
  $('view').innerHTML=`<div class="eyebrow">THƯ GIÃN BÊN HỒ</div><h2>🎣 Câu cá</h2><div class="fm-tabs" role="tablist">${tabs.map(([k,l])=>`<button role="tab" aria-selected="${fsTab===k}" class="${fsTab===k?'':'secondary'}" data-fstab="${k}">${l}</button>`).join('')}</div><div id="fsBody">${fsTab==='dock'?fsDock(f):fsTab==='shop'?fsShop(f):fsBook(f)}</div>`;
  $('view').querySelectorAll('[data-fstab]').forEach(b=>b.onclick=()=>{fsTab=b.dataset.fstab;renderFish()});
  if(fsTab==='dock')fsBindDock(f);else if(fsTab==='shop')fsBindShop();
}
/* ---------- bến câu ---------- */
const fsStars=n=>['Dễ','Vừa','Khó'][n-1]+' '+'★'.repeat(n);
function fsGear(f){
  const r=f.rod?Fishing.rod(f.rod):null;
  return `<div class="fs-gear card"><span><b>${r?r.icon+' '+r.name:'Chưa có cần câu'}</b></span><span>${Fishing.accs.map(a=>`<span class="${f.acc[a.id]?'':'fs-off'}" title="${a.name}" aria-label="${a.name}${f.acc[a.id]?'':' (chưa có)'}">${a.icon}</span>`).join('')}</span><span>${Fishing.baits.map(b=>`<span aria-label="${b.name}">${b.icon}×${f.bait[b.id]}</span>`).join(' ')}</span></div>`;
}
function fsDock(f){
  const d=day(),ticket=f.ticket,rodIdx=f.rod?Fishing.rods.findIndex(x=>x.id===f.rod):-1;
  const lakes=Fishing.lakes.map(l=>{
    const n=Fishing.ticketsToday(state,d,l.id),mult=Fishing.decayFor(n),weak=rodIdx<Fishing.rods.findIndex(x=>x.id===l.rec);
    const can=f.rod&&!ticket&&state.coins>=l.ticket;
    return `<article class="fs-lake card"><div class="fs-lhead"><span class="fm-icon">${l.icon}</span><div class="fm-main"><b>${l.name}</b><small>${fsStars(l.stars)} · ${l.casts} lượt thả</small></div><span class="fm-cost">🪙 ${l.ticket}</span></div>
      <p class="fs-fishes" aria-label="Các loài cá">${l.fish.map(x=>`<span title="${x.name}">${f.caught[x.id]?x.icon:'❔'}</span>`).join('')}</p>
      <small class="muted">${n?`Lần thuê thứ ${n+1} hôm nay: cá bán ×${mult}${mult<.5?' — nên đổi hồ khác':''}`:'Lần thuê đầu hôm nay: cá bán đủ giá'}${weak&&f.rod?` · ⚠ nên có ${Fishing.rod(l.rec).name} trở lên`:''}</small>
      <button data-rent="${l.id}" ${can?'':'disabled'}>Thuê hồ · 🪙 ${l.ticket}</button></article>`;
  }).join('');
  const cont=ticket?`<article class="card fs-ticket"><h3>${Fishing.lake(ticket.lake).icon} Vé ${Fishing.lake(ticket.lake).name}</h3><p>Còn <b>${ticket.left}</b> lượt thả · đã bắt ${ticket.catches} con</p><button id="fsGo" class="fm-wide">🎣 Tiếp tục câu</button></article>`:'';
  const bk=f.bucket,tot=Fishing.bucketValue(state);
  const bucket=`<article class="card fs-bucket"><h3>🪣 Giỏ cá (${bk.length})</h3>${bk.length?`<p class="fs-fishes">${bk.slice(0,24).map(x=>`<span title="${Fishing.fishInfo(x.f).name} ${x.cm}cm">${Fishing.fishInfo(x.f).icon}</span>`).join('')}${bk.length>24?'…':''}</p><button id="fsSell" class="fm-wide">Bán tất cả · +${tot} xu</button>`:'<p class="empty">Giỏ trống. Thuê hồ và câu vài con nhé.</p>'}</article>`;
  const intro=f.rod?'':`<p class="empty">Bạn cần một cây cần câu trước. Ghé 🛒 Cửa hàng (cần tre chỉ ${Fishing.rods[0].cost} xu).</p>`;
  return `${fsGear(f)}${intro}${cont}${bucket}<h3>Chọn hồ</h3><p class="muted">Mỗi vé = một số lượt thả, mỗi lượt dùng 1 mồi. Hồ đắt có cá xịn hơn nhưng cá nhanh hơn, vùng giữ hẹp hơn.</p><div class="fs-lakes">${lakes}</div><p class="stat">Đã câu ${Object.values(f.caught).reduce((a,n)=>a+n,0)} con · ${Object.keys(f.caught).length}/${Fishing.allFish().length} loài · thu ${f.earned} xu</p>`;
}
function fsBindDock(f){
  const q=s=>$('view').querySelectorAll(s);
  q('[data-rent]').forEach(b=>b.onclick=()=>{
    const r=txn(()=>Fishing.rent(state,b.dataset.rent,day()));
    if(r&&r.ok){sfxPlay('place');fsEnter()}else renderFish();
  });
  const go=$('fsGo');if(go)go.onclick=fsEnter;
  const sell=$('fsSell');if(sell)sell.onclick=()=>{const r=txn(()=>Fishing.sellAll(state));if(r&&r.ok)notice(`Đã bán ${r.n} con cá · +${r.coins} xu`);renderFish()};
}
/* ---------- cửa hàng ---------- */
function fsShop(f){
  const rodIdx=f.rod?Fishing.rods.findIndex(x=>x.id===f.rod):-1;
  const rows=(items,fn)=>items.map(fn).join('');
  const rods=rows(Fishing.rods,(r,i)=>{const own=i<=rodIdx,use=i===rodIdx,can=!own&&state.coins>=r.cost;return `<article class="fm-row"><span class="fm-icon">${r.icon}</span><div class="fm-main"><b>${r.name}</b><small>Vùng giữ cá ${Math.round(r.zone*100)}% · ${r.note}</small></div><div class="fm-sell fs-one"><button data-buyrod="${r.id}" class="${can?'':'secondary'}" ${can?'':'disabled'}>${use?'✔ Đang dùng':own?'Đã có cần tốt hơn':'Mua · 🪙 '+r.cost}</button></div></article>`});
  const accs=rows(Fishing.accs,a=>{const own=f.acc[a.id],can=!own&&state.coins>=a.cost;return `<article class="fm-row"><span class="fm-icon">${a.icon}</span><div class="fm-main"><b>${a.name}</b><small>${a.note}</small></div><div class="fm-sell fs-one"><button data-buyacc="${a.id}" class="${can?'':'secondary'}" ${can?'':'disabled'}>${own?'✔ Đã có':'Mua · 🪙 '+a.cost}</button></div></article>`});
  const baits=rows(Fishing.baits,b=>{const cost=b.cost*Fishing.BAIT_PACK,can=state.coins>=cost&&f.bait[b.id]+Fishing.BAIT_PACK<=Fishing.BAIT_CAP;return `<article class="fm-row"><span class="fm-icon">${b.icon}</span><div class="fm-main"><b>${b.name}</b><small>🪙 ${b.cost}/con · ${b.note} · đang có ${f.bait[b.id]}</small></div><div class="fm-sell fs-one"><button data-buybait="${b.id}" class="${can?'':'secondary'}" ${can?'':'disabled'}>Mua ${Fishing.BAIT_PACK} · 🪙 ${cost}</button></div></article>`});
  return `<h3>Cần câu</h3><div class="fm-rows">${rods}</div><h3>Phụ kiện</h3><div class="fm-rows">${accs}</div><h3>Mồi</h3><p class="muted">Mồi tốt giúp ra cá hiếm hơn nhưng đắt hơn: giun hợp ao làng, bắp ngô hợp hồ lớn.</p><div class="fm-rows">${baits}</div>`;
}
function fsBindShop(){
  const q=s=>$('view').querySelectorAll(s),buy=(fn,ok)=>{const r=txn(fn);if(r&&r.ok){sfxPlay('place');notice(ok)}renderFish()};
  q('[data-buyrod]').forEach(b=>b.onclick=()=>buy(()=>Fishing.buyRod(state,b.dataset.buyrod),'Đã mua '+Fishing.rod(b.dataset.buyrod).name));
  q('[data-buyacc]').forEach(b=>b.onclick=()=>buy(()=>Fishing.buyAcc(state,b.dataset.buyacc),'Đã mua '+Fishing.acc(b.dataset.buyacc).name));
  q('[data-buybait]').forEach(b=>b.onclick=()=>buy(()=>Fishing.buyBait(state,b.dataset.buybait),'Đã mua mồi '+Fishing.bait(b.dataset.buybait).name));
}
/* ---------- sổ cá ---------- */
function fsBook(f){
  return Fishing.lakes.map(l=>`<h3>${l.icon} ${l.name}</h3><div class="fs-book">${l.fish.map(x=>{const n=f.caught[x.id];return `<article class="fs-card ${n?'':'locked'}"><span class="fs-big" aria-hidden="true">${n?x.icon:'❔'}</span><b>${n?x.name:'Chưa gặp'}</b><small>${n?`Bắt ${n} con · to nhất ${f.record[x.id]||x.cm} cm`:'Hãy thử các loại mồi khác nhau'}</small></article>`}).join('')}</div>`).join('')+`<p class="stat">Sưu tầm ${Object.keys(f.caught).length}/${Fishing.allFish().length} loài. Lần đầu bắt mỗi loài được thưởng thêm xu.</p>`;
}
/* ---------- mini game ---------- */
function fsEnter(){
  const f=fsF();if(!f.ticket)return renderFish();
  if(f.ticket.left<=0){fsSettle();if(!fsG)renderFish();return}
  fsG={stage:'ready',lake:f.ticket.lake};fsHold=false;renderFish();
}
function fsFrameTick(fn){fsRaf=requestAnimationFrame(ts=>{fsRaf=0;fn(ts)})}
function fsStartCast(){
  const f=fsF(),bait=Fishing.activeBait(state);
  if(!bait){notice('Hết mồi rồi! Ghé 🛒 Cửa hàng mua thêm nhé.');return}
  const r=txn(()=>Fishing.cast(state,bait));if(!r||!r.ok)return;
  fsG={stage:'wait',lake:fsG.lake,bait,wait:r.wait,window:r.window,warn:r.warn,warned:false,t0:performance.now(),res:null};
  sfxPlay('cast');fsPlayRender();fsFrameTick(fsWaitLoop);
}
function fsWaitLoop(){
  const g=fsG;if(!g||current!=='fish'||(g.stage!=='wait'&&g.stage!=='bite'))return;
  const t=(performance.now()-g.t0)/1000;
  if(g.stage==='wait'){
    if(g.warn&&!g.warned&&t>=g.wait-g.warn){g.warned=true;sfxPlay('ripple');const fl=$('fsFloat');if(fl)fl.classList.add('ripple')}
    if(t>=g.wait){g.stage='bite';sfxPlay('bite');fsBuzz(60);fsPlayRender()}
  }else{
    const bar=$('fsWin');if(bar)bar.style.width=Math.max(0,100*(1-(t-g.wait)/g.window))+'%';
    if(t>g.wait+g.window){fsCastEnd({caught:false,msg:'Chậm quá, cá đã nhả mồi và bơi đi mất.'});return}
  }
  fsFrameTick(fsWaitLoop);
}
function fsHook(){
  const g=fsG;if(!g||(g.stage!=='wait'&&g.stage!=='bite'))return;
  fsStop();
  const t=(performance.now()-g.t0)/1000,j=Fishing.judgeHook(t,g.wait,g.window);
  if(j==='early')return fsCastEnd({caught:false,msg:'Giật sớm quá, cá giật mình bỏ chạy. Đợi phao chìm xuống nhé!'});
  if(j==='late')return fsCastEnd({caught:false,msg:'Chậm quá, cá đã nhả mồi và bơi đi mất.'});
  const fish=Fishing.pickFish(g.lake,g.bait);
  g.fish=fish;g.reel=Fishing.reelStart(Fishing.reelParams(g.lake,fish.id,fsF().rod));g.stage='reel';g.last=0;g.tick=0;g.net=false;
  fsHold=false;sfxPlay('good');fsBuzz(30);fsPlayRender();fsFrameTick(fsReelLoop);
}
function fsReelLoop(ts){
  const g=fsG;if(!g||current!=='fish'||g.stage!=='reel')return;
  const dt=g.last?Math.min(.05,(ts-g.last)/1000):.016;g.last=ts;
  const r=g.reel;Fishing.reelStep(r,dt,fsHold);
  g.tick+=dt;if(fsHold&&g.tick>=.3){g.tick=0;sfxPlay('reel')}
  const fish=$('fsFish'),zone=$('fsZone'),prog=$('fsProg');
  if(fish)fish.style.bottom=(r.f*100)+'%';
  if(zone){zone.style.bottom=(r.z*100)+'%';zone.style.height=(r.p.h*100)+'%';const inZ=r.f>=r.z&&r.f<=r.z+r.p.h;zone.classList.toggle('in',inZ)}
  if(prog){prog.style.height=(r.prog*100)+'%'}
  if(r.over==='escaped'&&Fishing.rescue(state,r)){
    g.net=true;save();notice('🥅 Lưới vợt cứu được con cá! Kéo tiếp nào!');sfxPlay('good');
  }
  if(r.over==='caught')return fsLanded();
  if(r.over==='escaped')return fsCastEnd({caught:false,msg:`${g.fish.name} giằng mạnh quá và tuột mất rồi. Lần sau thử cần tốt hơn hoặc giữ sát cá hơn nhé.`});
  fsFrameTick(fsReelLoop);
}
function fsLanded(){
  const g=fsG,r=g.reel;fsHold=false;
  const res=txn(()=>Fishing.land(state,g.fish.id,r.quality));
  if(!res||!res.ok)return fsCastEnd({caught:false,msg:'Chưa lưu được con cá này, thử lại nhé.'});
  const lake=Fishing.lake(g.lake),top=g.fish.id===lake.fish[lake.fish.length-1].id;
  sfxPlay(top?'reveal_rare':'catch');fsBuzz(80);try{burst(g.fish.icon)}catch{}
  fsCastEnd({caught:true,res});
}
function fsCastEnd(out){
  const g=fsG;if(!g)return;fsStop();
  g.stage='result';g.out=out;
  if(!out.caught)sfxPlay(out.msg&&/giật sớm/i.test(out.msg)?'bad':'escape');
  fsPlayRender();
}
/* sau mỗi lượt: hết lượt thì tất toán vé (tính vào nhiệm vụ + thưởng đa dạng trong ngày) */
function fsSettle(){
  let st=null;
  txn(()=>{
    st=Fishing.settle(state);
    /* recordEvent đã lo: nhiệm vụ/tiến hóa, +10 xu trò mới hôm nay (rewards.js), thưởng đa dạng 3/6/10 trò (levels.js) */
    if(st.done){recordEvent('mini');recordEvent('mini_fishing')}
    return {ok:true};
  });
  if(st&&st.done){fsG={stage:'summary',lake:st.lake,sum:st};sfxPlay('win');fsPlayRender()}
  else if(fsG&&fsG.stage!=='summary'){fsG={stage:'ready',lake:fsG.lake};fsPlayRender()}
}
function fsLeave(){fsStop();fsG=null;renderFish()}
function fsBaitBar(f){
  return `<div class="fs-baits" role="group" aria-label="Chọn mồi">${Fishing.baits.map(b=>`<button class="${f.pick===b.id?'':'secondary'}" data-pickbait="${b.id}" aria-pressed="${f.pick===b.id}" ${f.bait[b.id]?'':'disabled'}>${b.icon} ${f.bait[b.id]}</button>`).join('')}</div>`;
}
function fsPlayRender(){
  const g=fsG,f=fsF(),lake=Fishing.lake(g.lake),left=f.ticket?f.ticket.left:0;
  const head=`<div class="fs-top"><h2>${lake.icon} ${lake.name}</h2><span class="pill" aria-label="Lượt thả còn lại">🎣 ${left}</span></div>`;
  let body='';
  if(g.stage==='ready'){
    const has=Fishing.activeBait(state);
    body=`${fsBaitBar(f)}<div class="fs-scene"><div class="fs-sky">☁️</div><div class="fs-lakebig">${lake.icon}</div></div><button id="fsCast" class="fs-main" ${has?'':'disabled'}>${has?'🎣 Thả câu':'Hết mồi'}</button>${has?'':'<p class="empty">Hết mồi rồi. Ghé 🛒 Cửa hàng mua thêm nhé.</p>'}<button id="fsLeave" class="secondary fm-wide">Về bến (giữ lại vé)</button>`;
  }else if(g.stage==='wait'||g.stage==='bite'){
    const bite=g.stage==='bite';
    body=`<div class="fs-scene ${bite?'bite':''}"><div class="fs-water2"><span id="fsFloat" class="fs-float" aria-hidden="true">🔴</span></div></div>
    <p class="fs-status" role="status">${bite?'🐟 CÁ CẮN! Giật cần ngay!':'Chờ cá cắn… đừng giật sớm nhé.'}</p>${bite?'<div class="fs-win"><i id="fsWin"></i></div>':''}
    <button id="fsHook" class="fs-main ${bite?'go':''}">${bite?'GIẬT CẦN!':'Giật cần'}</button>`;
  }else if(g.stage==='reel'){
    body=`<p class="fs-status" role="status">${g.net?'🥅 Lưới vợt đã dùng cho vé này. ':''}Giữ để vùng xanh đi lên, thả ra để hạ xuống — giữ con cá trong vùng xanh!</p>
    <div class="fs-reel" id="fsReel"><div class="fs-water"><div class="fs-zone" id="fsZone"></div><span class="fs-fish" id="fsFish" aria-hidden="true">${g.fish.icon}</span></div><div class="fs-prog" aria-label="Tiến độ kéo cá"><i id="fsProg"></i></div></div>
    <button id="fsHoldBtn" class="fs-main go" aria-label="Giữ để kéo cá lên">GIỮ ĐỂ KÉO</button>`;
  }else if(g.stage==='result'){
    const o=g.out;
    body=o.caught?`<article class="card fs-result win"><div class="fs-big fm-bounce" aria-hidden="true">${o.res.fish.icon}</div><h3>${o.res.fish.name} · ${o.res.cm} cm</h3><p>+${o.res.value} xu vào giỏ${o.res.mult<1?` <small class="muted">(×${o.res.mult} vì thuê lại hồ này nhiều lần)</small>`:''}</p>${o.res.isNew?`<p><b>✨ Loài mới trong sổ cá! +${o.res.bonus} xu</b></p>`:''}${o.res.full?'<p class="muted">Giỏ đầy nên bán luôn con này.</p>':''}</article>`
      :`<article class="card fs-result"><div class="fs-big" aria-hidden="true">💨</div><h3>Cá thoát rồi</h3><p>${o.msg}</p></article>`;
    body+=`<button id="fsNext" class="fs-main">${left>0?'Tiếp tục · còn '+left+' lượt':'Xong vé'}</button>`;
  }else if(g.stage==='summary'){
    const s=g.sum;
    body=`<article class="card fs-result win"><div class="fs-big" aria-hidden="true">🏁</div><h3>Hết vé ${Fishing.lake(s.lake).name}</h3><p>Thả ${s.casts} lượt, bắt được <b>${s.catches}</b> con.</p><p class="muted">Nhớ bán cá ở Bến câu để nhận xu nhé.</p></article><button id="fsDone" class="fs-main">Về bến câu</button>`;
  }
  $('view').innerHTML=`<div class="fs-play" data-fsstage="${g.stage}">${head}${body}</div>`;
  fsBindPlay();
}
function fsBindPlay(){
  const v=$('view'),on=(id,fn)=>{const e=$(id);if(e)e.onclick=fn};
  on('fsCast',fsStartCast);on('fsLeave',fsLeave);on('fsNext',()=>fsSettle());on('fsDone',fsLeave);
  v.querySelectorAll('[data-pickbait]').forEach(b=>b.onclick=()=>{Fishing.pickBait(state,b.dataset.pickbait);save();fsPlayRender()});
  /* giật cần: chạm là tính ngay (pointerdown), không chờ nhả tay */
  const hook=$('fsHook');if(hook)hook.onpointerdown=e=>{e.preventDefault();fsHook()};
  const reel=$('fsReel'),hb=$('fsHoldBtn');
  for(const el of [reel,hb]){if(!el)continue;
    el.style.touchAction='none';
    el.onpointerdown=e=>{e.preventDefault();fsHold=true;try{el.setPointerCapture(e.pointerId)}catch{}};
    el.onpointerup=el.onpointercancel=el.onlostpointercapture=()=>{fsHold=false};
  }
}
/* bàn phím: Space / ↑ để giật cần và giữ kéo */
addEventListener('keydown',e=>{
  if(current!=='fish'||!fsG||e.repeat)return;
  if(e.key!==' '&&e.key!=='ArrowUp')return;
  if(document.querySelector('dialog[open]'))return;
  if(fsG.stage==='wait'||fsG.stage==='bite'){e.preventDefault();fsHook()}
  else if(fsG.stage==='reel'){e.preventDefault();fsHold=true}
});
addEventListener('keyup',e=>{if(e.key===' '||e.key==='ArrowUp')fsHold=false});
addEventListener('blur',()=>{fsHold=false});
