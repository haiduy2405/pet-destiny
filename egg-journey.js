let journeyPracticeSlot = null;

function bindJourneyReturn(button) {
  if (journeyPracticeSlot === null || journeyPracticeSlot !== activeSlot) return;
  button.textContent = 'Về Viện ươm';
  button.onclick = () => adventureDialog.close();
}

adventureDialog.addEventListener('close', () => {
  if (journeyPracticeSlot === null) return;
  const slot = journeyPracticeSlot;
  journeyPracticeSlot = null;
  if (slot !== activeSlot || adventureDialog.open) return;
  render();
  showEggJourney();
});

function paintEggJourneyBalance() {
  const claim = $('claimJourneyEgg');
  if (!claim || activeSlot === null) return;
  const journey = EggJourney.normalize(state);
  const today = journey.lastClaim === day();
  const missing = Math.max(0, 3 - journey.stamps.length);
  const shortfall = Math.max(0, 60 - state.coins);
  $('eggJourneyCoins').textContent = state.coins + ' xu';
  claim.disabled = journey.starter && (today || missing > 0 || shortfall > 0);
  claim.textContent = !journey.starter ? 'Nhận trứng khởi đầu · Miễn phí' :
    today ? 'Hẹn ngày mai' : 'Đón trứng · 60 xu';
  $('eggJourneyStatus').textContent = !journey.starter ? '' :
    today ? 'Đã nhận trứng học tập hôm nay.' :
    missing ? 'Cần thêm ' + missing + ' dấu từ các trò khác nhau.' :
    shortfall ? 'Đủ dấu, còn thiếu ' + shortfall + ' xu.' : 'Đã đủ điều kiện đón trứng!';
}

function showEggJourney() {
  const journey = EggJourney.normalize(state);
  const count = Math.min(journey.stamps.length, 3);
  const games = Object.entries(EggJourney.kinds);
  games.sort(([a], [b]) => Number(journey.stamps.includes(a)) - Number(journey.stamps.includes(b)));
  if (gardenDialog.open) closeGardenPanel();

  const taskButtons = games.map(([id, name]) => {
    const earned = journey.stamps.includes(id);
    const requirement = id === 'math' ? 'Hoàn thành 5 phép tính' : 'Đúng ngay ≥60%, không gợi ý';
    return '<button class="secondary ' + (earned ? 'chosen' : '') +
      '" data-egg-practice="' + id + '"><b>' + (earned ? '✓ ' : '▶ ') + name +
      '</b><small>' + (earned ? 'Đã có dấu · Chơi lại' : requirement) + '</small></button>';
  }).join('');

  adventureDialog.innerHTML = '<div class="eyebrow">VIỆN ƯƠM DUYÊN SẮC</div>' +
    '<h2>🥚 Một người bạn đặc biệt</h2><p>' +
    (journey.starter ? 'Kiếm dấu từ 3 trò khác nhau và dùng 60 xu để đón trứng. Tối đa 1 trứng học tập mỗi ngày.' :
      'Nhận một trứng khởi đầu miễn phí cho ô save này. Lượt ấp đầu cũng miễn phí.') +
    '</p><div class="egg-journey-progress"><b>' + count + '/3 dấu cần có</b> · 🪙 <span id="eggJourneyCoins"></span>' +
    '<progress value="' + count + '" max="3" aria-label="Tiến độ đủ ba dấu"></progress>' +
    '<p id="eggJourneyStatus"></p></div><div class="egg-stamp-grid">' + taskButtons +
    '</div><p class="muted">Dấu giữ qua ngày. Sau khi nhận trứng, bạn có thể bắt đầu bộ mới vào ngày sau.</p>' +
    '<button id="claimJourneyEgg"></button><button class="secondary" id="closeEggJourney">Đóng</button>';

  adventureDialog.querySelectorAll('[data-egg-practice]').forEach(button => {
    button.onclick = () => {
      // Keep the shared dialog open so its queued close handlers cannot clear the new session.
      journeyPracticeSlot = activeSlot;
      startMini(button.dataset.eggPractice);
      adventureDialog.scrollTop = 0;
    };
  });
  $('closeEggJourney').onclick = () => adventureDialog.close();
  $('claimJourneyEgg').onclick = () => {
    const backup = SaveStore.copy(state);
    const result = EggJourney.claim(state, day(), () => ({
      id: crypto.randomUUID(), species: rand(12), color: rand(12), hatchAt: null
    }));
    if (!result.ok) return notice(result.message);
    const egg = state.eggs[state.eggs.length - 1];
    const key = egg.species + '-' + egg.color;
    if (!state.collection.includes(key)) state.collection.push(key);
    if (!save()) {
      state = backup;
      return;
    }
    render();
    showEggJourney();
    notice('Đã đón một trứng · Vào Nhà trứng để ấp');
  };
  paintEggJourneyBalance();
  if (!adventureDialog.open) adventureDialog.showModal();
  adventureDialog.scrollTop = 0;
}

const beforeJourneyRender=render;render=function(){EggJourney.normalize(state);beforeJourneyRender();document.querySelector('nav [data-tab="fortune"]')?.remove();if(current==='garden'||current==='quests'){const j=EggJourney.normalize(state),box=document.createElement('section');box.className='music-hub egg-journey-hub';box.innerHTML=`<div><span class="eyebrow">MỖI TRỨNG LÀ MỘT HÀNH TRÌNH</span><h3>🥚 Viện ươm</h3><p>${!j.starter?'Trứng khởi đầu đang chờ bạn':j.lastClaim===day()?'Đã nhận trứng học tập hôm nay':j.stamps.length+'/3 dấu học tập · 60 xu / trứng'}</p></div><button id="openEggJourney">${!j.starter?'Nhận trứng khởi đầu':'Xem hành trình'}</button>`;$('view').append(box);$('openEggJourney').onclick=()=>showEggJourney()}
 if(current==='quests'){const camera=document.querySelector('.camera-games'),grid=document.querySelector('#view > .grid');if(camera&&grid){for(const [id,icon,name,desc,coins] of [['colorMain','🎨','Săn sắc màu','Chụp và chọn vùng màu của đồ vật quanh bạn.',24],['shapeMain','📐','Săn hình dáng','Chụp vật có đường viền giống hình mẫu, khoanh vùng để kiểm tra.',24]]){const card=document.createElement('article');card.className='card arcade-card';card.innerHTML=`<div class="quest-icon">${icon}</div><h3>${name}</h3><p class="muted">${desc}</p><div class="quest-meta">🪙 ${coins} xu / lượt · Xử lý trên thiết bị</div><button data-camera-game="${id}">Chơi · +${coins} xu</button>`;grid.append(card);card.querySelector('button').onclick=id==='colorMain'?()=>{current='fortune';render();window.scrollTo(0,0)}:()=>startShapeCamera()}camera.remove()}const heading=[...document.querySelectorAll('#view .eyebrow')].find(el=>el.textContent.includes('TRÒ CHƠI NHANH'));if(heading)heading.textContent='CHỌN GAME · THƯỞNG MỖI LƯỢT'}
};
const beforeJourneyShop=drawShop;drawShop=function(){beforeJourneyShop();if(homeShopTab==='care'){const b=document.createElement('button');b.className='egg-shop-entry';b.textContent='🥚 Nhận trứng đặc biệt tại Viện ươm →';b.onclick=()=>{shopDialog.close();showEggJourney()};shopDialog.querySelector('.shop-items').before(b)}};
const beforeJourneyPanel=drawGardenPanel;drawGardenPanel=function(){beforeJourneyPanel();if(gardenPanel?.mode==='eggs'){const b=document.createElement('button');b.textContent='🥚 Đến Viện ươm nhận trứng';b.onclick=showEggJourney;$('closeGardenBottom').before(b)}};
render();
