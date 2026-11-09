/* "Ngôi nhà của em": build rooms, buy furniture, decorate; the pet cheers every step. */
let dhRoom=null,dhSel=null,dhTab='mine',dhCat='furn',dhDrag=null,dhBubbleTimer=null;
const dhBaseRender=render;
render=function(){
  const mine=current==='dollhouse';
  if(mine)current='collection';
  dhBaseRender();
  if(mine)current='dollhouse';
  dhNav();
  if(mine&&!dhDrag){document.body.dataset.page='dollhouse';renderDollhouse()}
};
function dhNav(){
  const nav=$('nav');if(!nav)return;let b=nav.querySelector('[data-tab="dollhouse"]');
  if(!b){b=document.createElement('button');b.dataset.tab='dollhouse';b.innerHTML='<span class="nav-icon" aria-hidden="true">🏡</span><span>Ngôi nhà</span>';b.onclick=()=>{current='dollhouse';dhRoom=null;dhSel=null;render();window.scrollTo(0,0)};nav.append(b)}
  if(current==='dollhouse')nav.querySelectorAll('[data-tab]').forEach(x=>{const on=x.dataset.tab==='dollhouse';x.classList.toggle('active',on);on?x.setAttribute('aria-current','page'):x.removeAttribute('aria-current')});
  const vis=[...nav.children].filter(x=>getComputedStyle(x).display!=='none').length||4;nav.style.gridTemplateColumns=`repeat(${vis},minmax(0,1fr))`;
}
const dhD=()=>DollHouse.normalize(state);
const dhRawName=()=>{const n=state.saveName||'';return /^Game \d+$/.test(n)?'':n};
const dhWho=()=>Atelier.escape(dhRawName()||'bạn');
function dhPet(){return state.pets.find(p=>p.id===activeHome()?.petId)||state.pets[0]}
const dhPetArt=()=>{const p=dhPet();return p?petArt(p):sprite(4)};
function dhTx(fn){const backup=SaveStore.copy(state);if(fn()===false){state=backup;return false}if(!save()){state=backup;notice('Chưa lưu được. Thử lại nhé.');render();return false}return true}
const dhBg=(list,id)=>(list.find(x=>x.id===id)||list[0]).bg;
function dhSay(text,cheer=true){
  const el=$('dhBubble');if(!el)return;el.textContent=text;el.hidden=false;
  const pet=document.querySelector('.dh-pet');if(pet&&cheer){pet.classList.remove('cheer');void pet.offsetWidth;pet.classList.add('cheer')}
  clearTimeout(dhBubbleTimer);dhBubbleTimer=setTimeout(()=>{const e=$('dhBubble');if(e)e.hidden=true},4200);
}
const dhObjHtml=(o,mini)=>{const x=DollHouse.find(o.id);return `<span class="dh-obj ${mini?'mini':''}" ${mini?'':`role="button" tabindex="0" data-u="${o.u}" aria-label="${x.name}"`} style="left:${o.x}%;top:${o.y}%;--s:${o.s};--f:${o.f?-1:1};z-index:${Math.round(o.y*10)}">${x.icon}</span>`};
const dhStars=n=>'★'.repeat(n)+'☆'.repeat(3-n);

function renderDollhouse(){
  const d=dhD();
  if(dhRoom&&!d.rooms[dhRoom]?.built)dhRoom=null;
  dhRoom?dhEditor(d):dhOverview(d);
}
function dhOverview(d){
  const pr=DollHouse.pride(state),name=d.name||('Nhà của '+(dhRawName()||'em')),ready=DollHouse.partyReady(state);
  const cards=DollHouse.rooms.map(r=>{
    const o=d.rooms[r.id];
    if(!o.built)return `<button class="dh-card locked" data-build="${r.id}"><span class="dh-lock">🔨</span><b>${r.name}</b><small>Xây · ${r.cost} xu</small></button>`;
    const rt=DollHouse.rate(state,r.id);
    return `<button class="dh-card" data-room="${r.id}"><div class="dh-mini"><i style="background:${dhBg(DollHouse.walls,o.wall)}"></i><i style="background:${dhBg(DollHouse.floors,o.floor)}"></i>${o.objs.map(x=>dhObjHtml(x,true)).join('')}</div><b>${r.icon} ${r.name}</b><small class="dh-stars">${dhStars(rt.stars)}</small></button>`}).join('');
  $('view').innerHTML=`<section class="dh"><div class="eyebrow">NGÔI NHÀ CỦA EM</div>
  <input class="dh-name" id="dhName" maxlength="24" value="${Atelier.escape(d.name)}" placeholder="${Atelier.escape(name)}" aria-label="Tên ngôi nhà">
  <p class="muted">❤️ Độ tự hào: <b>${pr.stars}/${pr.max}</b> sao · ${pr.rooms}/${DollHouse.rooms.length} phòng</p>
  <div class="dh-house"><div class="dh-roof" style="--roof:${d.roof}"></div><div class="dh-roofs">${DollHouse.roofs.map(c=>`<button class="dh-dot ${c===d.roof?'on':''}" data-roof="${c}" style="background:${c}" aria-label="Màu mái"></button>`).join('')}</div><div class="dh-grid">${cards}</div></div>
  <button id="dhParty" ${ready?'':'disabled'}>🎊 Tổ chức tiệc tân gia${d.party?` (đã tổ chức ${d.party} lần)`:''}</button>
  <p class="muted">${ready?'Nhà đẹp lắm rồi! Mời các bạn thú đến chung vui nhé.':'Mở khóa tiệc: xây ít nhất 3 phòng và mỗi phòng đạt từ ★★.'}</p>
  <button class="secondary" id="dhEarn">🎮 Chơi game kiếm thêm xu</button></section>`;
  $('dhName').onchange=e=>dhTx(()=>{dhD().name=Atelier.cleanName(e.target.value)});
  document.querySelectorAll('[data-roof]').forEach(b=>b.onclick=()=>{if(dhTx(()=>{dhD().roof=b.dataset.roof}))render()});
  document.querySelectorAll('[data-room]').forEach(b=>b.onclick=()=>{dhRoom=b.dataset.room;dhSel=null;dhTab='mine';render();window.scrollTo(0,0);setTimeout(()=>dhSay(`Chào ${dhWho()}! Hôm nay mình trang trí gì nào?`),200)});
  document.querySelectorAll('[data-build]').forEach(b=>b.onclick=()=>{
    const r=DollHouse.room(b.dataset.build);let res;
    if(!dhTx(()=>{res=DollHouse.build(state,r.id);if(!res.ok){notice(res.message);return false}}))return;
    $('coins').textContent=state.coins;dhRoom=r.id;dhTab='shop';render();sound('reward');burst('🔨');notice(`Đã xây ${r.name}!`);
    setTimeout(()=>dhSay(`Wow, ${r.name} mới tinh! Mình sẽ giúp ${dhWho()} trang trí nhé!`),200)});
  $('dhParty').onclick=dhPartyStart;
  $('dhEarn').onclick=()=>{current='quests';render();window.scrollTo(0,0)};
}
function dhEditor(d){
  const r=DollHouse.room(dhRoom),o=d.rooms[dhRoom],rt=DollHouse.rate(state,dhRoom);
  $('view').innerHTML=`<section class="dh"><div class="dh-top"><button class="secondary" id="dhBack">← Về nhà</button><div><b>${r.icon} ${r.name}</b> <span class="dh-stars">${dhStars(rt.stars)}</span></div></div>
  <div class="dh-scene" id="dhScene"><div class="dh-wall" style="background:${dhBg(DollHouse.walls,o.wall)}"></div><div class="dh-floor" style="background:${dhBg(DollHouse.floors,o.floor)}"></div>${o.objs.map(x=>dhObjHtml(x,false)).join('')}<div class="dh-pet">${dhPetArt()}</div><div class="dh-bubble" id="dhBubble" hidden></div></div>
  <p class="muted dh-need">${rt.need}</p><div id="dhTools"></div>
  <div class="dh-tabs" role="tablist">${[['mine','🎒 Đồ của em'],['shop','🛒 Mua sắm'],['style','🎨 Tường & sàn']].map(([k,n])=>`<button class="${dhTab===k?'on':'secondary'}" data-dhtab="${k}">${n}</button>`).join('')}</div><div id="dhPanel"></div></section>`;
  $('dhBack').onclick=()=>{dhRoom=null;dhSel=null;render();window.scrollTo(0,0)};
  document.querySelectorAll('[data-dhtab]').forEach(b=>b.onclick=()=>{dhTab=b.dataset.dhtab;dhPanel()});
  dhBindObjects();dhPanel();dhTools();
}
function dhPanel(){
  const d=dhD(),o=d.rooms[dhRoom],p=$('dhPanel');if(!p)return;
  document.querySelectorAll('[data-dhtab]').forEach(b=>{b.className=b.dataset.dhtab===dhTab?'on':'secondary'});
  if(dhTab==='mine'){
    p.innerHTML=d.owned.length?`<div class="dh-items">${d.owned.map(id=>{const x=DollHouse.find(id);return `<button class="dh-item" data-place="${id}"><span>${x.icon}</span><small>${x.name}</small></button>`}).join('')}</div>`:'<p class="muted">Em chưa có đồ nào. Sang tab “Mua sắm” chọn vài món nhé!</p>';
  }else if(dhTab==='shop'){
    p.innerHTML=`<div class="dh-cats">${Object.entries(DollHouse.cats).map(([k,n])=>`<button class="${dhCat===k?'on':'secondary'}" data-cat="${k}">${n}</button>`).join('')}</div><div class="dh-items">${DollHouse.items.filter(x=>x.cat===dhCat).map(x=>{const own=d.owned.includes(x.id);return `<button class="dh-item ${own?'own':''}" data-buy="${x.id}"><span>${x.icon}</span><small>${x.name}</small><b>${own?'Đặt thêm':'🪙 '+x.price}</b></button>`}).join('')}</div>`;
  }else{
    const sw=(kind,list,cur)=>list.map(x=>{const own=x.price===0||d.styles.includes(x.id);return `<button class="dh-sw ${cur===x.id?'on':''}" data-style="${kind}:${x.id}" style="background:${x.bg}" aria-label="${x.name}"><small>${cur===x.id?'✔':own?'':'🪙'+x.price}</small></button>`}).join('');
    p.innerHTML=`<p class="muted">Tường</p><div class="dh-swatches">${sw('wall',DollHouse.walls,o.wall)}</div><p class="muted">Sàn nhà</p><div class="dh-swatches">${sw('floor',DollHouse.floors,o.floor)}</div>`;
  }
  p.querySelectorAll('[data-cat]').forEach(b=>b.onclick=()=>{dhCat=b.dataset.cat;dhPanel()});
  p.querySelectorAll('[data-place]').forEach(b=>b.onclick=()=>dhPlace(b.dataset.place,false));
  p.querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>dhPlace(b.dataset.buy,true));
  p.querySelectorAll('[data-style]').forEach(b=>b.onclick=()=>{
    const [k,id]=b.dataset.style.split(':');let res;
    if(!dhTx(()=>{res=DollHouse.setStyle(state,dhRoom,k,id);if(!res.ok){notice(res.message);return false}}))return;
    $('coins').textContent=state.coins;dhRefresh(k==='wall'?'Màu tường mới hợp quá!':'Sàn nhà này đẹp ghê!');
  });
}
const dhPlaceLines=['Ôi đẹp quá!','Chỗ này hợp lắm!','Mình thích món này!','Căn phòng ngày càng xinh!'];
function dhPlace(id,buying){
  const x=DollHouse.find(id);let obj,paid=0;
  if(!dhTx(()=>{const res=DollHouse.buy(state,id);if(!res.ok){notice(res.message);return false}paid=res.paid;obj=DollHouse.place(state,dhRoom,id,15+Math.random()*70,62+Math.random()*30);if(!obj){notice('Phòng đã đầy, hãy bớt một món nhé.');return false}}))return;
  $('coins').textContent=state.coins;dhSel=obj.u;sound('reward');
  dhRefresh(paid?`${x.line} ${dhPlaceLines[rand(dhPlaceLines.length)]}`:x.line);
}
/* re-draw the room after a change, then check for newly earned stars */
function dhRefresh(line){
  const scroll=window.scrollY;render();window.scrollTo(0,scroll);dhSay(line);
  let awards=[];dhTx(()=>{awards=DollHouse.claim(state,dhRoom);if(!awards.length)return false});
  if(awards.length){$('coins').textContent=state.coins;setTimeout(()=>dhCelebrate(dhRoom,awards),700)}
}
/* objects: select + drag + toolbar */
function dhBindObjects(){
  const scene=$('dhScene');if(!scene)return;
  scene.querySelectorAll('.dh-obj').forEach(el=>{
    const u=Number(el.dataset.u);if(u===dhSel)el.classList.add('sel');
    el.onpointerdown=e=>{e.preventDefault();dhSelect(u);const rect=scene.getBoundingClientRect();dhDrag={u,el,rect,moved:false};el.setPointerCapture?.(e.pointerId)};
    el.onpointermove=e=>{if(!dhDrag||dhDrag.u!==u)return;const x=Math.min(98,Math.max(2,(e.clientX-dhDrag.rect.left)/dhDrag.rect.width*100)),y=Math.min(98,Math.max(8,(e.clientY-dhDrag.rect.top)/dhDrag.rect.height*100));el.style.left=x+'%';el.style.top=y+'%';el.style.zIndex=Math.round(y*10);dhDrag.x=x;dhDrag.y=y;dhDrag.moved=true};
    const end=()=>{const g=dhDrag;dhDrag=null;if(g?.moved&&g.x!==undefined)dhTx(()=>DollHouse.update(state,dhRoom,u,{x:g.x,y:g.y}))};
    el.onpointerup=end;el.onpointercancel=end;
    el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();dhSelect(u)}};
  });
  scene.onpointerdown=e=>{if(e.target===scene||e.target.classList.contains('dh-wall')||e.target.classList.contains('dh-floor'))dhSelect(null)};
}
function dhSelect(u){dhSel=u;document.querySelectorAll('.dh-obj').forEach(el=>el.classList.toggle('sel',Number(el.dataset.u)===u));dhTools()}
function dhTools(){
  const box=$('dhTools');if(!box)return;const obj=dhSel&&dhD().rooms[dhRoom]?.objs.find(x=>x.u===dhSel);
  if(!obj){box.innerHTML='<p class="muted">Chạm một món trong phòng để chọn, kéo để di chuyển.</p>';return}
  const x=DollHouse.find(obj.id);
  box.innerHTML=`<div class="dh-tools"><span>${x.icon} ${x.name}</span><button class="secondary" data-t="small" aria-label="Nhỏ lại">➖</button><button class="secondary" data-t="big" aria-label="To ra">➕</button><button class="secondary" data-t="flip" aria-label="Lật">↔️</button><button class="secondary" data-t="del" aria-label="Cất đi">🗑️</button></div>`;
  box.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{
    const t=b.dataset.t,u=obj.u;
    if(t==='del'){if(dhTx(()=>DollHouse.remove(state,dhRoom,u))){dhSel=null;dhRefresh('Mình cất đồ đi nhé. Bạn sắp xếp lại cho đẹp nào!')}return}
    const patch=t==='flip'?{f:!obj.f}:{s:obj.s+(t==='big'?.2:-.2)};
    if(dhTx(()=>DollHouse.update(state,dhRoom,u,patch)))dhRefresh(t==='big'?'To hơn nhìn nổi bật hẳn!':t==='small'?'Nhỏ xinh xắn!':'Quay hướng khác nhìn lạ ghê!');
  });
}
/* celebrations */
const dhPraise=[
  w=>`${w} ơi, phòng bắt đầu đẹp rồi đó! Mình thích lắm!`,
  w=>`Phòng xinh quá, ${w} giỏi ghê! Mình muốn ở lại đây mãi!`,
  w=>`Tuyệt đỉnh! ${w} là nhà thiết kế giỏi nhất mà mình từng gặp! Mình tự hào về bạn lắm! 🏆`];
function dhOverlay(html,cls=''){
  document.querySelector('.dh-cele')?.remove();
  const o=document.createElement('div');o.className='dh-cele '+cls;o.setAttribute('role','dialog');o.innerHTML=html;document.body.append(o);
  const rain=reduce=>{if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;o.insertAdjacentHTML('beforeend','<div class="dh-confetti">'+Array.from({length:26},(_,i)=>`<i style="left:${(i*37)%100}%;animation-delay:${(i%9)*.25}s">${['🎉','⭐','✨','🎊','💖'][i%5]}</i>`).join('')+'</div>')};
  rain();return o;
}
function dhCelebrate(rid,awards){
  const r=DollHouse.room(rid),top=awards[awards.length-1],coins=awards.reduce((a,x)=>a+x.coins,0);
  const o=dhOverlay(`<div class="dh-cele-card"><div class="dh-cele-stars">${dhStars(top.stars).replace(/★/g,'<b>★</b>')}</div><h2>${r.icon} ${r.name} đạt ${top.stars} sao!</h2><div class="dh-cele-pet">${dhPetArt()}</div><p class="dh-speech">“${dhPraise[top.stars-1](dhWho())}”</p><p>🪙 Phần thưởng: +${coins} xu</p><button id="dhThanks">Cảm ơn bạn nhỏ! 💖</button></div>`);
  sound('reward');burst('🎉');$('coins').textContent=state.coins;
  $('dhThanks').onclick=()=>{o.remove();render()};$('dhThanks').focus();
}
function dhPartyStart(){
  let res;if(!dhTx(()=>{res=DollHouse.party(state);if(!res.ok)return false}))return;
  $('coins').textContent=state.coins;const pets=state.pets.slice(0,6);
  const o=dhOverlay(`<div class="dh-cele-card party"><h2>🎊 Tiệc tân gia! 🎊</h2><div class="dh-party">${(pets.length?pets:[{species:4,color:0}]).map((p,i)=>`<div style="animation-delay:${i*.15}s">${p.id?petArt(p):sprite(p.species,'',p.color)}</div>`).join('')}</div><p class="dh-speech">“Chúc mừng ${dhWho()} đã có ngôi nhà tuyệt đẹp! Tất cả chúng mình đều rất tự hào về bạn!”</p>${res.coins?`<p>🏅 Huy hiệu <b>Kiến trúc sư nhí</b> · +${res.coins} xu</p>`:'<p>Tiệc vui quá, mình tổ chức lần nữa nhé!</p>'}<button id="dhThanks">Cùng nhảy nào! 💃</button></div>`,'party');
  sound('reward');burst('🎊');setTimeout(()=>burst('💖'),600);$('dhThanks').onclick=()=>{o.remove();render()};
}
