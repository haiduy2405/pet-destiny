const petMoments = [
  ['🍃', 'Nhặt được một chiếc lá đẹp và muốn khoe với bạn.', 'Ngắm chiếc lá cùng nhau', 'Mình tặng bạn chiếc lá này!', 'love'],
  ['🎶', 'Đang nhún nhảy theo một nhịp vui.', 'Vỗ tay theo nhịp', 'Có bạn chơi cùng vui hơn hẳn!', 'dance'],
  ['📖', 'Rúc lại gần, như đang chờ nghe một câu chuyện.', 'Kể một chuyện nhỏ', 'Mình thích nghe bạn kể chuyện.', 'love'],
  ['☔', 'Đang tò mò ngắm mưa qua cửa sổ.', 'Ngồi ngắm mưa cùng nhau', 'Tiếng mưa nghe êm thật!', 'curious'],
  ['🌤️', 'Tìm được một góc nắng ấm trong phòng.', 'Ngồi cạnh một lát', 'Ở cạnh bạn thật dễ chịu.', 'sleep'],
  ['🌟', 'Muốn cho bạn xem cú nhảy vừa tập được.', 'Cổ vũ bạn nhỏ', 'Bạn thấy mình nhảy cao không?', 'jump']
];
const petMomentGap = 4 * 60 * 60 * 1000;

function petMomentStatus(pet, date, time) {
  const bond = pet.bond;
  const today = bond?.date === date ? bond.visits : 0;
  const next = today === 1 ? bond.at + petMomentGap : 0;
  return {today, next, available: today < 2 && time >= next};
}

function bondLabel(pet) {
  const total = pet.bond?.total || 0;
  return (total >= 15 ? 'Tri kỷ' : total >= 5 ? 'Bạn thân' : 'Mới làm quen') + ' · ' + total + ' khoảnh khắc';
}

function paintPetMoment() {
  $('petMomentCard')?.remove();
  if (current !== 'garden' || activeSlot === null) return;
  const scene = document.querySelector('.pet-home-scene');
  const pet = homePet();
  if (!scene || !pet) return;
  const date = day();
  const {today, next, available} = petMomentStatus(pet, date, now());
  const seed = Array.from(date + pet.id).reduce((hash, char) => (hash * 31 + char.codePointAt(0)) >>> 0, 0);
  const [icon, story, action, reply, animation] = petMoments[(seed + today) % petMoments.length];
  const nextTime = new Date(next).toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'});
  const sameDay = new Date(next).toLocaleDateString('en-CA') === date;
  const card = document.createElement('article');
  card.id = 'petMomentCard';
  card.className = 'card pet-moment';
  card.innerHTML = `<h3>${icon} Khoảnh khắc cùng ${petName(pet)}</h3><p class="muted">${bondLabel(pet)}</p>
    ${available ? `<p>${story}</p><button>${action}</button>` :
      `<p>${today === 1 && sameDay ? 'Bạn nhỏ sẽ có khoảnh khắc mới sau ' + nextTime + '.' : 'Mai mình lại dành chút thời gian cùng nhau nhé!'}</p>`}`;
  scene.after(card);
  const button = card.querySelector('button');
  if (button) button.onclick = () => {
    const time = now(), currentDate = day();
    const live = homePet();
    if (roomEditing() || live?.id !== pet.id) return;
    const status = petMomentStatus(live, currentDate, time);
    if (!status.available || currentDate !== date || status.today !== today) return paintPetMoment();
    if (homeTransaction(() => {
      live.bond = {date: currentDate, visits: today + 1, at: time, total: (live.bond?.total || 0) + 1};
    }, reply)) petAct(animation, reply);
  };
}

const beforeBondRender = render;
render = function() {
  beforeBondRender();
  if (current === 'garden') paintPetMoment();
};
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && current === 'garden') paintPetMoment();
});

const beforeBondPanel = drawGardenPanel;
drawGardenPanel = function() {
  beforeBondPanel();
  if (gardenPanel?.mode !== 'pet') return;
  const pet = state.pets.find(candidate => candidate.id === gardenPanel.id);
  if (!pet) return;
  const editor = document.createElement('details');
  editor.className = 'pet-name-editor';
  editor.innerHTML = `<summary>✏️ ${pet.nickname ? 'Đổi tên thú' : 'Đặt tên cho thú'}</summary>
    <form><label class="save-name-label">Tên thú<input name="nickname" maxlength="48" autocomplete="off" placeholder="Ví dụ: Bông"></label>
    <p class="muted">Tối đa 24 ký tự. Để trống để dùng tên mặc định.</p><button>Lưu tên</button></form>`;
  const form = editor.querySelector('form');
  form.elements.nickname.value = pet.nickname || '';
  form.onsubmit = event => {
    event.preventDefault();
    const live = state.pets.find(candidate => candidate.id === pet.id);
    if (!live) return;
    const name = Atelier.cleanName(form.elements.nickname.value);
    if (homeTransaction(() => {
      if (name) live.nickname = name;
      else delete live.nickname;
    }, 'Đã lưu tên thú')) {
      drawGardenPanel();
      gardenDialog.querySelector('.pet-name-editor summary')?.focus();
    }
  };
  const bond = document.createElement('p');
  bond.className = 'muted';
  bond.textContent = '💚 ' + bondLabel(pet);
  $('gardenPanelTitle').after(bond, editor);
};
