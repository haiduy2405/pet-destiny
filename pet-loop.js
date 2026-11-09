const cameraShapes=[['circle','Hình tròn','Bánh xe, miệng cốc, đồng xu'],['triangle','Hình tam giác','Thước ê-ke, biển hình tam giác'],['square','Hình vuông','Tờ giấy vuông, viên gạch'],['rectangle','Hình chữ nhật','Quyển sách, hộp, khung ảnh']];
arcadeGames.push(['math','➕','Quầy tính nhanh','Giải 5 phép cộng, trừ nhỏ.',8],['odd','🦋','Tìm bạn khác biệt','Chạm vào biểu tượng khác nhóm trong 5 lượt.',7],['path','🐾','Theo dấu chân','Nhớ và chạm lại chuỗi 4 dấu chân.',9]);
function winMini(){if(!miniSession||miniSession.slot!==activeSlot)return;const type=miniSession.type,game=arcadeGames.find(g=>g[0]===type);miniSession=null;const backup=SaveStore.copy(state);const payout=Balance.pay(state,day(),type,0);recordEvent('mini');recordEvent('mini_'+type);state.coins+=payout;if(type==='math')EggJourney.stamp(state,'math',5,5,day());if(!save()){state=backup;return}$('coins').textContent=state.coins;adventureDialog.innerHTML=`<div class="mini-win">🏆</div><h2>+${payout} xu!</h2><p>Đem xu về mua thức ăn, đồ chăm sóc hoặc nâng cấp vườn. Chơi lại vẫn nhận đủ xu.</p><div class="actions"><button id="replayMini">Chơi tiếp</button><button class="secondary" id="finishMini">Về vườn</button></div>`;$('replayMini').onclick=()=>{startMini(type)};$('finishMini').onclick=()=>{adventureDialog.close();current='garden';render();window.scrollTo(0,0)};bindJourneyReturn($('finishMini'));if(evolutionGame?.slot===activeSlot){$('finishMini').textContent='Về nhiệm vụ tiến hóa';$('finishMini').onclick=()=>adventureDialog.close()}sound('reward');burst()};
function renderFortune(){const f=state.fortune;$('view').innerHTML=`<div class="eyebrow">GAME CAMERA · XỬ LÝ TRÊN ĐIỆN THOẠI</div><h2>Săn sắc màu</h2><p class="muted">Tìm một vật ngoài đời có màu gần mẫu, chụp ảnh và chạm vào vùng màu. Mỗi lần thành công: <b>15 xu</b>. Chơi không giới hạn.</p><article class="card">${f===null?'<h3>Sẵn sàng khám phá?</h3><p class="muted">Bắt đầu để nhận màu mục tiêu ngẫu nhiên.</p><button id="draw">Nhận màu mục tiêu</button>':`<h3>${COLORS[f][0]}</h3><div class="swatch" style="background:${COLORS[f][1]}"></div><button id="take">📷 Chụp / chọn ảnh</button><button class="secondary" id="newColor">Đổi màu mục tiêu</button>`}</article><div class="actions"><button class="secondary" id="goShapes">📐 Săn hình dáng</button><button class="secondary" id="backGarden">Về vườn</button></div>`;if($('draw'))$('draw').onclick=()=>{state.fortune=rand(12);save();render()};if($('newColor'))$('newColor').onclick=()=>{state.fortune=(state.fortune+1+rand(11))%12;save();render()};if($('take'))$('take').onclick=()=>$('photo').click();$('goShapes').onclick=()=>startShapeCamera();$('backGarden').onclick=()=>{current='garden';render()}};
$('claim').textContent='Nhận 15 xu';$('claim').onclick=()=>{if(!match||state.fortune!==photoTarget||activeSlot===null)return;const backup=SaveStore.copy(state);state.coins+=15;recordEvent('color');state.fortune=null;if(!save()){state=backup;return}match=false;$('photoDialog').close();render();notice('Săn màu thành công · +15 xu')};
const cameraGames = [
  ['colorMain', '🎨', 'Săn sắc màu', 'Chụp và chọn vùng màu của đồ vật quanh bạn.', 24],
  ['shapeMain', '📐', 'Săn hình dáng', 'Chụp vật có đường viền giống hình mẫu, khoanh vùng để kiểm tra.', 24]
];

function openCameraGame(id) {
  if (id === 'shapeMain') return startShapeCamera();
  current = 'fortune';
  render();
  window.scrollTo(0, 0);
}

function normalizeGameSearch(text) {
  return text.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/g, 'd');
}

const gameSubjects = [
  ['Toán', ['count', 'order', 'math', 'fractions', 'change', 'clock', 'patterns', 'ruler']],
  ['Âm nhạc', ['music', 'melody', 'rhythm', 'earmemory', 'pitch']],
  ['Tiếng Anh', ['english', 'phrases']],
  ['Tiếng Việt', ['reading']],
  ['Quan sát và trí nhớ', []]
];

function renderQuests() {
  const previousQuery = $('gameSearch')?.value || '';
  const previousSubject = $('gameSubject')?.value || '';
  const games = [...arcadeGames, ...cameraGames];
  const subjects = games.map(([id]) =>
    (gameSubjects.find(([, members]) => members.includes(id)) || gameSubjects.at(-1))[0]);
  $('view').innerHTML = `<h2>Chơi kiếm xu</h2>
    <p class="muted">Chơi bao nhiêu tùy thích, thắng lượt nào nhận xu lượt đó. Dùng xu để chăm thú lớn và tiến hóa.</p>
    <label class="game-search" for="gameSearch">Tìm game</label>
    <input id="gameSearch" type="search" placeholder="Nhập tên hoặc từ khóa" autocomplete="off" aria-controls="gameGrid">
    <label class="game-search" for="gameSubject">Môn học</label>
    <select id="gameSubject" aria-controls="gameGrid"><option value="">Tất cả môn</option>
      ${gameSubjects.map(([subject]) => `<option>${subject}</option>`).join('')}</select>
    <p id="gameSearchStatus" class="muted" role="status"></p>
    <div class="eyebrow game-list-heading">CHỌN GAME · THƯỞNG MỖI LƯỢT</div>
    <div class="grid" id="gameGrid">${games.map(([id, icon, name, desc, coins], index) => {
      const camera = index >= arcadeGames.length;
      return `<article class="card arcade-card"><div class="quest-icon">${icon}</div><h3>${name}</h3>
        <p class="muted">${desc}</p>
        <div class="quest-meta">🪙 ${coins} ${camera ? 'xu / lượt · Xử lý trên thiết bị' : 'xu / lượt thắng'}</div>
        <button ${camera ? 'data-camera-game' : 'data-mini'}="${id}">Chơi · +${coins} xu</button></article>`;
    }).join('')}</div>`;
  const search = $('gameSearch');
  const subject = $('gameSubject');
  const cards = [...$('gameGrid').children];
  const searchText = games.map(([, , name, description], index) =>
    normalizeGameSearch(name + ' ' + description + ' ' + subjects[index] + (index >= arcadeGames.length ? ' camera' : '')));
  cards.forEach(card => {
    const button = card.querySelector('button');
    button.onclick = () => button.dataset.mini ? startMini(button.dataset.mini) : openCameraGame(button.dataset.cameraGame);
  });
  function filterGames() {
    const query = normalizeGameSearch(search.value).trim();
    const words = query ? query.split(/\s+/) : [];
    let count = 0;
    cards.forEach((card, index) => {
      const matches = (!subject.value || subjects[index] === subject.value) &&
        words.every(word => searchText[index].includes(word));
      card.hidden = !matches;
      if (matches) count++;
    });
    $('gameSearchStatus').textContent = !query && !subject.value ? '' :
      count ? count + ' game phù hợp' : 'Không tìm thấy game phù hợp.';
  }
  search.value = previousQuery;
  subject.value = previousSubject;
  search.oninput = subject.onchange = filterGames;
  filterGames();
};
const oldExtraStart=startMini;startMini=function(type){if(!['math','odd','path'].includes(type))return oldExtraStart(type);if(type==='path'){originalStartMini('memory');miniSession.type='path';miniSession.sequence=Array.from({length:4},()=>rand(4));adventureDialog.innerHTML=`<h2>Theo dấu chân</h2><div class="memory-sequence">${miniSession.sequence.map(i=>['🍎','🌼','🍃','💧'][i]).join(' → ')}</div><p>Nhớ 4 biểu tượng rồi chạm lại đúng thứ tự.</p><button id="pathReady">Đã nhớ</button><button class="secondary" id="closePath">Đóng</button>`;$('pathReady').onclick=drawPath;$('closePath').onclick=()=>adventureDialog.close();return}miniSession={type,slot:activeSlot,step:0};drawExtra();if(!adventureDialog.open)adventureDialog.showModal()};
function drawPath(){drawMemory();$('miniStatus').textContent=miniSession.step+'/4 biểu tượng đúng';adventureDialog.querySelectorAll('[data-memory]').forEach(b=>b.onclick=()=>{const s=miniSession;if(!s)return;if(Number(b.dataset.memory)!==s.sequence[s.step]){s.step=0;$('miniStatus').textContent='Thử lại: 0/4';return}if(++s.step===4)return winMini();$('miniStatus').textContent=s.step+'/4 biểu tượng đúng'})}
function drawExtra(){const s=miniSession;if(!s)return;let body;if(s.type==='math'){const a=2+rand(12),b=1+rand(9),plus=rand(2);s.answer=plus?a+b:Math.max(a,b)-Math.min(a,b);const question=plus?a+' + '+b:Math.max(a,b)+' − '+Math.min(a,b);body=`<div class="math-question">${question} = ?</div><div class="mini-options">${shuffle([s.answer,s.answer+1,s.answer+2]).map(n=>`<button data-answer="${n}">${n}</button>`).join('')}</div>`}else{const icons=['🐱','🐶','🐭','🐰','🐸','🐥'],base=rand(6),different=(base+1+rand(5))%6,at=rand(9);s.answer=at;body=`<div class="shape-board">${Array.from({length:9},(_,i)=>`<button class="odd-choice" data-answer="${i}" aria-label="${i===at?icons[different]:icons[base]}">${i===at?icons[different]:icons[base]}</button>`).join('')}</div>`}adventureDialog.innerHTML=`<h2>${s.type==='math'?'Quầy tính nhanh':'Tìm bạn khác biệt'}</h2><p>Lượt ${s.step+1}/5</p>${body}<p id="extraStatus" role="status">Chạm vào đáp án.</p><button class="secondary close-mini">Đóng</button>`;adventureDialog.querySelector('.close-mini').onclick=()=>adventureDialog.close();adventureDialog.querySelectorAll('[data-answer]').forEach(b=>b.onclick=()=>{if(Number(b.dataset.answer)!==s.answer){$('extraStatus').textContent='Chưa đúng, thử lại nhé.';return}if(++s.step===5)return winMini();sound('pet');drawExtra()})}
const loopRender=render;render=function(){loopRender();const names={garden:['🌿','Nuôi thú'],fortune:['🎨','Săn màu'],quests:['🎮','Kiếm xu'],collection:['📖','Sưu tập']};for(const b of document.querySelectorAll('nav [data-tab]')){const [icon,name]=names[b.dataset.tab];b.innerHTML=`<span class="nav-icon" aria-hidden="true">${icon}</span><span>${name}</span>`}const home=document.querySelector('nav [data-tab="garden"]');if(home)$('nav').prepend(home);if(current==='garden'){const hint=document.querySelector('.garden-hint');if(hint)hint.textContent='Chạm thú để chăm sóc, mua đồ hoặc huấn luyện. Chơi cùng nhau giúp các bạn vui hơn, không tăng trưởng thành.';const btn=document.createElement('button');btn.className='earn-cta';btn.textContent='🎮 Chơi game kiếm xu nuôi thú';btn.onclick=()=>{current='quests';render();window.scrollTo(0,0)};document.querySelector('.garden-toolbar').prepend(btn)}};

