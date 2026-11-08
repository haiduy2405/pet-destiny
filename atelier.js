homeItems.push(
 {id:'duckboss',name:'Vịt giám đốc',icon:'🦆',price:35,kind:'toy',tab:'meme',line:'Quạc! Cuộc họp hôm nay: đi ngủ.'},
 {id:'powerbanana',name:'Chuối quyền lực',icon:'🍌',price:30,kind:'toy',tab:'meme',line:'Trượt nhẹ một cái… vẫn giữ thần thái!'},
 {id:'emotionalrock',name:'Đá hỗ trợ tinh thần',icon:'🪨',price:20,kind:'decor',tab:'meme',line:'Bạn đá đang lắng nghe. Rất kiên nhẫn.'},
 {id:'cone',name:'Nón công trình tâm hồn',icon:'🚧',price:40,kind:'decor',tab:'meme',line:'Đang sửa chữa sự lười biếng… 99%.'},
 {id:'moai',name:'Tượng mặt tỉnh bơ',icon:'🗿',price:120,kind:'decor',tab:'meme',line:'Không nói gì. Nhưng hiểu tất cả.'},
 {id:'throne',name:'Ngai vàng suy ngẫm',icon:'🚽',price:110,kind:'house',tab:'meme',line:'Nơi những ý tưởng lớn được sinh ra.'},
 {id:'ufo',name:'Đĩa bay tìm sen',icon:'🛸',price:180,kind:'toy',tab:'meme',line:'Bíp bíp! Xin một phần đồ ăn Trái Đất.'},
 {id:'disco',name:'Sàn nhảy cuối tuần',icon:'🪩',price:95,kind:'toy',tab:'home',line:'Nhạc lên! Chân ngắn vẫn nhảy dài.'},
 {id:'noodles',name:'Mì đêm huyền thoại',icon:'🍜',price:65,kind:'decor',tab:'meme',line:'Mùi thơm này chỉ để ngắm thôi nha.'},
 {id:'boxhouse',name:'Biệt thự thùng giấy',icon:'📦',price:60,kind:'house',tab:'home',line:'Nhà không cần to. Hộp cần vừa.'},
 {id:'gamingchair',name:'Ghế game thủ',icon:'🪑',price:85,kind:'house',tab:'home',line:'Ngồi nghiêm túc… rồi ngủ nghiêm túc.'},
 {id:'rainbow',name:'Cầu vồng bỏ túi',icon:'🌈',price:75,kind:'decor',tab:'decor',line:'Hôm nay nhiều màu hơn một chút!'},
 {id:'cactus',name:'Xương rồng hướng nội',icon:'🌵',price:45,kind:'decor',tab:'decor',line:'Thương từ xa thôi, bạn này hơi gai.'},
 {id:'headphones',name:'Tai nghe chill',icon:'🎧',price:90,kind:'accessory',tab:'style'},
 {id:'royalcrown',name:'Vương miện tự phong',icon:'👑',price:180,kind:'hat',tab:'meme'},
 {id:'graduation',name:'Mũ tốt nghiệp ngủ trưa',icon:'🎓',price:100,kind:'hat',tab:'meme'},
 {id:'woodsign',name:'Biển tên gỗ mật ong',icon:'🪧',price:45,kind:'sign',tab:'decor',line:'Chiếc biển nhỏ làm căn phòng giống nhà mình hơn!'},
 {id:'flowersign',name:'Biển tên vườn hoa',icon:'🌸',price:75,kind:'sign',tab:'decor',line:'Mỗi bông hoa trên biển đều chào bạn đó!'}
);
let roomDraft=null,roomPreview=null,idlePetTimer=null,petActionTimer=null,petActionGeneration=0;
let reducePetMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;try{const stored=localStorage.getItem('pet-destiny-reduced-motion');if(stored==='1'||stored==='0')reducePetMotion=stored==='1'}catch{}
function isRoomItem(x){return ['toy','house','decor','sign'].includes(x.kind)}
function signLabel(text) {
 const pet=homePet();
 return text ? Atelier.escape(text) : pet ? petName(pet) : 'Tổ ấm nhỏ';
}
function signMarkup(item,text){
 return `<span class="room-sign ${item.id}"><small aria-hidden="true">${item.id==='flowersign'?'✿ ✦ ✿':'✦  ❧  ✦'}</small><b data-sign-label>${signLabel(text)}</b></span>`;
}
function roomObjectMarkup(o,editing=false){const x=homeItems.find(x=>x.id===o.id);return x?`<button class="room-object ${x.kind==='sign'?'room-sign-object':''} ${editing?'editable-object':''} ${roomDraft?.selected===o.id?'selected-object':''}" data-room-object="${o.id}" aria-label="${editing?'Chọn để sửa':'Tương tác với'} ${x.name}" style="left:${o.x}%;top:${o.y}%;--object-scale:${o.scale};--object-rotation:${o.rotation}deg;--object-flip:${o.flip?-1:1};z-index:${o.z+2}">${x.kind==='sign'?signMarkup(x,o.text):`<span>${x.icon}</span>`}</button>`:''}
function roomEditing(){return roomDraft&&roomDraft.slot===activeSlot&&roomDraft.page===state.homePage}
function drawAtelierRoom(){const scene=document.querySelector('.pet-home-scene');if(!scene)return;const h=activeHome(),editing=roomEditing();if($('featuredPet'))$('featuredPet').disabled=!!editing;scene.classList.toggle('room-editing',!!editing);scene.classList.toggle('reduce-pet-motion',reducePetMotion);scene.classList.toggle('allow-pet-motion',!reducePetMotion);scene.querySelectorAll('.home-house,.home-toy,.home-decor,.room-object,.room-preview,.pet-speech,.pet-emote,.room-mode-label').forEach(x=>x.remove());
 const objects=editing?roomDraft.objects:Atelier.objects(h);scene.insertAdjacentHTML('beforeend',objects.map(o=>roomObjectMarkup(o,editing)).join('')+'<div class="pet-emote" aria-hidden="true"></div><div class="pet-speech" role="status"></div>');
 if(roomPreview&&roomPreview.slot===activeSlot&&roomPreview.page===state.homePage){const x=homeItems.find(x=>x.id===roomPreview.id);if(x.kind==='sign')scene.insertAdjacentHTML('beforeend',`<div class="room-preview sign-preview">${signMarkup(x,'')}</div>`);else if(isRoomItem(x))scene.insertAdjacentHTML('beforeend',`<div class="room-preview" style="left:70%;top:66%">${x.icon}<small>Xem thử</small></div>`);else if(x.kind==='theme'){const t={sunset:'#f7c596',moonlight:'#9ba8d4',dream:'#eac0db'};scene.style.setProperty('--room-tint',t[x.id]||'#bbdfc7')}else{scene.querySelector('.pet-wear.'+x.kind)?.remove();const el=document.createElement('span');el.className='pet-wear '+x.kind+' room-preview-wear';el.textContent=x.icon;scene.querySelector('#featuredPet')?.append(el)}}
 scene.querySelectorAll('[data-room-object]').forEach(b=>{
  b.onclick=()=>editing?selectRoomItem(b.dataset.roomObject):interactRoomItem(b.dataset.roomObject);
 });
 drawPetWear(scene,h,editing);
 if(editing){bindRoomGestures(scene);scene.insertAdjacentHTML('beforeend','<span class="room-mode-label">✥ Kéo, chụm hoặc xoay</span>');drawRoomControls()}
 const old=document.querySelector('.atelier-tools');if(old)old.remove();const tools=document.createElement('section');tools.className='atelier-tools';tools.innerHTML=editing?'':roomPreview?'<div class="room-preview-bar"><b>Đang xem thử · chưa trừ xu</b><button id="buyRoomPreview">Mua · '+homeItems.find(x=>x.id===roomPreview.id).price+' xu</button><button class="secondary" id="cancelRoomPreview">Thôi</button></div>':`<div class="actions"><button class="secondary" id="editPetRoom">✥ Sắp xếp phòng</button><button class="secondary" id="togglePetMotion">${reducePetMotion?'🌿 Bật chuyển động':'🌿 Giảm chuyển động'}</button></div>${homePet()?'<div class="pet-emote-menu" aria-label="Biểu cảm và hành động"><button data-pet-action="love" aria-label="Thả tim">💗</button><button data-pet-action="dance" aria-label="Nhảy múa">🕺</button><button data-pet-action="jump" aria-label="Nhảy vui">✨</button><button data-pet-action="sleep" aria-label="Ngủ gật">😴</button><button data-pet-action="surprised" aria-label="Ngạc nhiên">😮</button><button data-pet-action="grumpy" aria-label="Dỗi đáng yêu">😤</button></div><small class="muted">Biểu cảm miễn phí · Chạm đồ trong phòng để chơi cùng thú</small>':''}`;
 scene.after(tools);if($('editPetRoom'))$('editPetRoom').onclick=startRoomEditor;if($('togglePetMotion'))$('togglePetMotion').onclick=()=>{reducePetMotion=!reducePetMotion;try{localStorage.setItem('pet-destiny-reduced-motion',reducePetMotion?'1':'0')}catch{}render()};tools.querySelectorAll('[data-pet-action]').forEach(b=>b.onclick=()=>petAct(b.dataset.petAction));if($('cancelRoomPreview'))$('cancelRoomPreview').onclick=()=>{roomPreview=null;render();showShop()};if($('buyRoomPreview')){const x=homeItems.find(x=>x.id===roomPreview.id),owned=h.owned.includes(x.id);$('buyRoomPreview').textContent=owned?'Dùng món đã mua':'Mua · '+x.price+' xu';$('buyRoomPreview').disabled=!owned&&state.coins<x.price;$('buyRoomPreview').onclick=()=>{const id=roomPreview.id;buyAtelierItem(id,true)}};
}
function petAct(action,line){const scene=document.querySelector('.pet-home-scene'),pet=$('featuredPet');if(!scene||!pet||roomEditing())return;clearTimeout(petActionTimer);const token=++petActionGeneration;pet.dataset.action=action;const emotes={love:['💗','Mình thích ở đây cùng bạn!'],dance:['🎶','Nhún nhảy một chút nào!'],jump:['✨','Yay! Một ngày thật vui!'],sleep:['💤','Cho mình ngủ thêm 5 phút…'],surprised:['❗','Ủa? Gì dễ thương vậy?'],grumpy:['💢','Dỗi có 2 giây thôi đó!'],eat:['🍎','Nom nom… ngon quá!'],bath:['🫧','Sạch thơm rồi nè!'],train:['🏅','Mạnh hơn một chút mỗi ngày!'],curious:['👀','Có gì hay ở đằng kia nhỉ?']},e=emotes[action]||emotes.love;scene.querySelector('.pet-emote').textContent=e[0];scene.querySelector('.pet-speech').textContent=line||e[1];scene.classList.add('pet-reacting');if(!reducePetMotion)for(let i=0;i<6;i++){const sparkle=document.createElement('span');sparkle.className='pet-particle';sparkle.textContent=action==='love'?'💗':action==='bath'?'🫧':'✦';sparkle.style.setProperty('--particle-x',(i-2.5)*24+'px');sparkle.style.left=(42+i*3)+'%';scene.append(sparkle);setTimeout(()=>sparkle.remove(),1300)}petActionTimer=setTimeout(()=>{if(token!==petActionGeneration)return;pet.dataset.action='idle';scene.classList.remove('pet-reacting')},action==='sleep'?6000:4000)}
function interactRoomItem(id){const x=homeItems.find(x=>x.id===id);if(!x)return;const actions={disco:'dance',powerbanana:'surprised',throne:'grumpy',ufo:'surprised',gamingchair:'sleep',boxhouse:'sleep',duckboss:'dance',teddy:'love',ball:'jump'};petAct(actions[id]||'curious',x.line||('Chơi với '+x.name+' nhé!'));const b=document.querySelector('[data-room-object="'+id+'"]');b?.classList.remove('object-boing');requestAnimationFrame(()=>b?.classList.add('object-boing'));sound('pet')}
function equippedWear() {
 if (!homePet()) return [];
 return ['hat', 'outfit', 'accessory'].map(kind => homeGear(activeHome(), kind)).filter(Boolean);
}

function updateWearStyle(element, pose) {
 if (!element) return;
 element.style.translate = `${pose.x}px ${pose.y}px`;
 element.style.scale = String(pose.scale);
 element.style.rotate = pose.rotation + 'deg';
}

function drawPetWear(scene, home, editing) {
 const pet = scene.querySelector('#featuredPet');
 if (!pet) return;
 const preview = roomPreview && homeItems.find(item => item.id === roomPreview.id);
 const layer = editing ? document.createElement('div') : null;
 if (layer) {
  layer.className = 'home-featured-pet wear-editor-layer';
  scene.append(layer);
 }
 for (const element of pet.querySelectorAll('.pet-wear')) {
  const kind = ['hat', 'outfit', 'accessory'].find(key => element.classList.contains(key));
  const item = element.classList.contains('room-preview-wear') ? preview : homeGear(home, kind);
  if (!item) continue;
  const pose = Atelier.wearPose(item.id, (editing ? roomDraft.wear : home.wearLayout)?.[item.id]);
  if (!layer) {
   element.dataset.wearObject = item.id;
   updateWearStyle(element, pose);
   continue;
  }
  const handle = document.createElement('button');
  handle.type = 'button';
  handle.className = 'pet-wear ' + kind + ' wear-edit-handle';
  handle.dataset.wearObject = item.id;
  handle.setAttribute('aria-label', 'Chỉnh ' + item.name);
  handle.setAttribute('aria-pressed', String(roomDraft.selected === item.id));
  handle.textContent = item.icon;
  updateWearStyle(handle, pose);
  handle.onclick = () => selectRoomItem(item.id, true);
  layer.append(handle);
  element.hidden = true;
 }
}

function wearEditorButtons() {
 const items = equippedWear();
 if (!items.length) return '<p class="muted">Trang bị mũ, trang phục hoặc phụ kiện trong shop để chỉnh trên thú.</p>';
 return '<p><b>Đang đeo</b></p><div class="room-inventory">' + items.map(item =>
  `<button class="secondary" data-wear-select="${item.id}" aria-pressed="${roomDraft.selected === item.id}">${item.icon} ${item.name}</button>`
 ).join('') + '</div>';
}

function selectRoomItem(id, wear=false) {
 if (wear) roomDraft.wear[id] = Atelier.wearPose(id, roomDraft.wear[id]);
 roomDraft.selected = id;
 document.querySelectorAll('.room-object').forEach(element => {
  element.classList.toggle('selected-object', !wear && element.dataset.roomObject === id);
 });
 document.querySelectorAll('.wear-edit-handle').forEach(element => {
  element.setAttribute('aria-pressed', String(element.dataset.wearObject === id));
 });
 drawRoomControls();
}

function bindRoomGestures(scene) {
 const points=new Map();
 let target, id, wear, pose, baseline, startPose, xUnits, yUnits, canDrag;
 const point=e=>({x:e.clientX,y:e.clientY});
 const measure=()=>Atelier.gesture([...points.values()]);
 const rebase=()=>{baseline=measure();startPose={...pose}};
 function pick(element){
  target=element;
  wear=!!target.dataset.wearObject;
  id=target.dataset.wearObject||target.dataset.roomObject;
  selectRoomItem(id,wear);
  pose=wear?roomDraft.wear[id]:roomDraft.objects.find(o=>o.id===id);
  const rect=scene.getBoundingClientRect();
  xUnits=wear?1:100/rect.width;
  yUnits=wear?1:100/rect.height;
 }
 function apply(next){
  if(wear){
   next.rotation=((next.rotation+180)%360+360)%360-180;
   Object.assign(pose,Atelier.wearPose(id,next));
   updateWearStyle(target,pose);
  }else{
   Object.assign(pose,Atelier.normalize(next));
   updateObjectStyle(pose);
  }
 }
 scene.onpointerdown=e=>{
  if(e.button!==0||points.size===2||(points.size&&e.pointerType!=='touch'))return;
  if(!points.size){
   const hit=e.target.closest('[data-room-object], .wear-edit-handle');
   const selected=e.pointerType==='touch'&&scene.querySelector('.wear-edit-handle[aria-pressed="true"], .room-object.selected-object');
   const element=hit||selected;
   if(!element)return;
   canDrag=!!hit;
   pick(element);
  }else canDrag=true;
  e.preventDefault();
  points.set(e.pointerId,point(e));
  scene.setPointerCapture(e.pointerId);
  rebase();
 };
 scene.onpointermove=e=>{
  if(!points.has(e.pointerId))return;
  points.set(e.pointerId,point(e));
  if(canDrag)apply(Atelier.transform(startPose,baseline,measure(),xUnits,yUnits));
 };
 scene.onpointerup=scene.onpointercancel=scene.onlostpointercapture=e=>{
  if(!points.delete(e.pointerId))return;
  if(points.size)rebase();
  else drawRoomControls();
 };
 scene.onkeydown=e=>{
  const element=e.target.closest('[data-room-object], .wear-edit-handle');
  const delta={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];
  if(!element||!delta||points.size)return;
  e.preventDefault();
  pick(element);
  const step=wear?4:2;
  apply({...pose,x:pose.x+delta[0]*step,y:pose.y+delta[1]*step});
  drawRoomControls();
 };
}

function startRoomEditor(){roomPreview=null;roomDraft={slot:activeSlot,page:state.homePage,objects:SaveStore.copy(Atelier.objects(activeHome())),wear:SaveStore.copy(activeHome().wearLayout||{}),selected:null};render()}
function drawRoomControls(){document.querySelector('.room-editor-panel')?.remove();const panel=document.createElement('section');panel.className='room-editor-panel';const wear=roomDraft.wear[roomDraft.selected],selected=wear||roomDraft.objects.find(o=>o.id===roomDraft.selected),sign=Atelier.isSign(selected?.id),owned=homeItems.filter(x=>isRoomItem(x)&&activeHome().owned.includes(x.id));panel.innerHTML=`<div class="eyebrow">BẢN NHÁP · CHƯA LƯU</div><h3>✥ Góc của riêng bạn</h3><p>Kéo bằng một ngón. Chụm, mở hoặc xoay hai ngón để chỉnh kích thước và góc. Bạn cũng có thể dùng các thanh chỉnh.</p><div class="room-inventory">${owned.map(x=>`<button class="secondary" data-room-toggle="${x.id}">${x.icon} ${x.name}${roomDraft.objects.some(o=>o.id===x.id)?' ✓':''}</button>`).join('')||'<p>Chưa có nội thất. Ghé shop để chọn đồ nhé.</p>'}</div>${wearEditorButtons()}${selected?`<h4>${homeItems.find(x=>x.id===selected.id).name}</h4>${(wear?[['x','Ngang',-110,110,1],['y','Dọc',-130,130,1],['scale','Kích thước',.35,2.2,.05],['rotation','Xoay',-180,180,1]]:[['x','Ngang',8,92,1],['y','Dọc',sign?10:35,90,1],['scale','Kích thước',.6,1.6,.1],['rotation','Xoay',-45,45,5],['z','Lớp trước / sau',0,10,1]]).map(([key,label,min,max,step])=>`<label class="room-range">${label}<input type="range" data-room-range="${key}" min="${min}" max="${max}" step="${step}" value="${selected[key]}" aria-label="${label}"></label>`).join('')}${sign?'<label class="save-name-label">Chữ trên biển<input id="roomSignText" maxlength="48" placeholder="Để trống để dùng tên thú"></label>':wear?'<button class="secondary" id="resetWearPose">Đặt lại phụ kiện này</button>':'<button class="secondary" id="flipRoomObject">↔ Lật ngang</button>'}`:'<p class="muted">Chọn một món để chỉnh vị trí và kích thước.</p>'}<div class="actions"><button id="saveRoomDraft">Lưu cách sắp xếp</button><button class="secondary" id="cancelRoomDraft">Hủy</button><button class="secondary" id="resetRoomDraft">Xếp lại tự động</button></div>`;document.querySelector('.pet-home-scene').after(panel);
 panel.querySelectorAll('[data-room-toggle]').forEach(b=>b.onclick=()=>{const id=b.dataset.roomToggle,at=roomDraft.objects.findIndex(o=>o.id===id);if(at>=0){roomDraft.objects.splice(at,1);roomDraft.selected=null}else{roomDraft.objects.push(Atelier.pose(id,roomDraft.objects.length));roomDraft.selected=id}render()});panel.querySelectorAll('[data-wear-select]').forEach(button=>button.onclick=()=>selectRoomItem(button.dataset.wearSelect,true));
 panel.querySelectorAll('[data-room-range]').forEach(input=>input.oninput=()=>{selected[input.dataset.roomRange]=Number(input.value);if(wear)updateWearStyle(document.querySelector('[data-wear-object="'+wear.id+'"]'),wear);else updateObjectStyle(selected)});
 const signInput=$('roomSignText');
 if(signInput){
  signInput.value=selected.text||'';
  signInput.oninput=()=>{
   selected.text=Atelier.cleanName(signInput.value);
   document.querySelector('[data-room-object="'+selected.id+'"] [data-sign-label]').innerHTML=signLabel(selected.text);
  };
 }
 if($('resetWearPose'))$('resetWearPose').onclick=()=>{roomDraft.wear[wear.id]=Atelier.wearPose(wear.id);render()};
 if($('flipRoomObject'))$('flipRoomObject').onclick=()=>{selected.flip=!selected.flip;updateObjectStyle(selected)};$('saveRoomDraft').onclick=()=>{const draft=roomDraft;if(!draft||draft.slot!==activeSlot||draft.page!==state.homePage)return;if(homeTransaction(()=>{const home=activeHome();Atelier.commit(home,draft.objects);home.wearLayout=Object.fromEntries(Object.entries(draft.wear).filter(([id])=>home.owned.includes(id)).map(([id,pose])=>[id,Atelier.wearPose(id,pose)]))},'Đã lưu căn phòng')){roomDraft=null;render();petAct('love')}};$('cancelRoomDraft').onclick=()=>{roomDraft=null;render()};$('resetRoomDraft').onclick=()=>{roomDraft.objects=roomDraft.objects.map((o,i)=>({...Atelier.pose(o.id,i),text:o.text}));roomDraft.selected=null;render()};
}
function updateObjectStyle(o){const b=document.querySelector('[data-room-object="'+o.id+'"]');if(!b)return;b.style.left=o.x+'%';b.style.top=o.y+'%';b.style.setProperty('--object-scale',o.scale);b.style.setProperty('--object-rotation',o.rotation+'deg');b.style.setProperty('--object-flip',o.flip?-1:1);b.style.zIndex=o.z+2}
function previewAtelierItem(id){roomDraft=null;roomPreview={slot:activeSlot,page:state.homePage,id};shopDialog.close();current='garden';render();document.querySelector('.pet-home-scene').scrollIntoView({block:'center',behavior:'smooth'})}
const giftThanks=[
 'Bạn chọn món này cho mình sao? Mình thích lắm!',
 'Mình gửi bạn một trái tim thật to nhé!',
 'Cảm ơn bạn đã chăm chút góc nhỏ của mình!',
 'Có bạn chọn đồ cùng, căn phòng ấm áp hẳn!',
 'Mình sẽ khoe món này mỗi khi bạn ghé chơi!'
];
let lastGiftThanks=-1;
function buyAtelierItem(id,fromPreview=false){
 const item=homeItems.find(x=>x.id===id);
 if(!item)return;
 const home=activeHome(),owned=home.owned.includes(id);
 const ok=homeTransaction(()=>{
  Atelier.objects(home);
  if(!owned){
   if(state.coins<item.price){notice('Chưa đủ xu cho món này.');return false}
   state.coins-=item.price;
   home.owned.push(id);
  }
  if(isRoomItem(item)){
   const at=home.roomObjects.findIndex(o=>o.id===id);
   if(owned&&at>=0&&!fromPreview)home.roomObjects.splice(at,1);
   else if(at<0)Atelier.put(home,id);
  }else if(item.kind==='theme')home.theme=owned&&home.theme===id&&!fromPreview?'classic':id;
  else home.equipped[item.kind]=owned&&home.equipped[item.kind]===id&&!fromPreview?null:id;
 });
 if(!ok)return;
 roomPreview=null;
 if(!owned&&homePet()){
  if(shopDialog.open)shopDialog.close();
  current='garden';
  render();
  const choices=giftThanks.map((_,index)=>index).filter(index=>index!==lastGiftThanks);
  lastGiftThanks=choices[rand(choices.length)];
  document.querySelector('.pet-home-scene')?.scrollIntoView({block:'nearest'});
  petAct('love',giftThanks[lastGiftThanks]);
 }else{
  if(fromPreview)render();
  if(shopDialog.open)drawShop();
  if(!owned)notice('Đã mua '+item.name);
 }
}
const beforeStudioShowShop=showShop;showShop=function(){if(roomEditing())return notice('Lưu hoặc hủy bản nháp trước khi mở shop nhé.');beforeStudioShowShop()};
const beforeAtelierShop=drawShop;drawShop=function(){beforeAtelierShop();if(!document.querySelector('[data-home-shop-tab="meme"]')){const b=document.createElement('button');b.className='secondary '+(homeShopTab==='meme'?'chosen':'');b.dataset.homeShopTab='meme';b.textContent='🗿 Góc meme';b.onclick=()=>{homeShopTab='meme';drawShop()};shopDialog.querySelector('.home-shop-tabs').append(b)}shopDialog.querySelectorAll('[data-home-item]').forEach(b=>{const x=homeItems.find(x=>x.id===b.dataset.homeItem),h=activeHome(),owned=h.owned.includes(x.id),placed=isRoomItem(x)&&Atelier.objects(h).some(o=>o.id===x.id);if(isRoomItem(x)&&owned){b.textContent=placed?'Đang đặt · Cất':'Đã mua · Đặt';b.closest('article').classList.toggle('equipped-item',placed)}b.onclick=()=>buyAtelierItem(x.id);const preview=document.createElement('button');preview.className='secondary item-preview-button';preview.textContent='👀 Xem thử';preview.onclick=()=>previewAtelierItem(x.id);b.after(preview)})};
const beforeAtelierRender=render;render=function(){clearInterval(idlePetTimer);if(roomDraft&&(roomDraft.slot!==activeSlot||roomDraft.page!==state.homePage))roomDraft=null;if(roomPreview&&(roomPreview.slot!==activeSlot||roomPreview.page!==state.homePage))roomPreview=null;beforeAtelierRender();if($('openShop'))$('openShop').onclick=()=>showShop();if(current==='garden'){drawAtelierRoom();if(!roomEditing()&&!roomPreview&&!reducePetMotion)idlePetTimer=setInterval(()=>{if(document.hidden||gardenDialog.open||shopDialog.open||adventureDialog.open||document.querySelector('#slotDialog')?.open)return;petAct(['curious','jump','sleep','love'][rand(4)])},8500)}};
const beforeAnimatedCare=care;care=function(id,k){const before=state.pets.find(p=>p.id===id),xp=before?.totalXP,v=before?.[k];beforeAnimatedCare(id,k);const p=state.pets.find(p=>p.id===id);if(p&&(p.totalXP!==xp||p[k]!==v))petAct(({food:'eat',clean:'bath',joy:'dance',energy:'sleep'})[k])};
const beforeAnimatedTraining=training;training=function(id){const xp=state.pets.find(p=>p.id===id)?.totalXP;beforeAnimatedTraining(id);if(state.pets.find(p=>p.id===id)?.totalXP!==xp)petAct('train')};
document.addEventListener('visibilitychange',()=>{if(document.hidden)clearInterval(idlePetTimer);else if(current==='garden')render()});
render();
