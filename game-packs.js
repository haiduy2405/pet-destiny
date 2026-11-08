let packReturn = null;

function bindGamePackReturn(button) {
  if (packReturn?.slot !== activeSlot || packReturn.kind !== 'mini') return false;
  button.textContent = 'Về gói game';
  button.onclick = () => adventureDialog.close();
  return true;
}

function returnToGamePack() {
  packReturn = null;
  current = 'quests';
  render();
  const panel = $('gamePackPanel');
  panel.open = true;
  panel.querySelector('summary').focus({preventScroll: true});
  panel.scrollIntoView({block: 'nearest'});
}

adventureDialog.addEventListener('close', () => {
  if (adventureDialog.open || current !== 'quests') return;
  if (packReturn?.kind === 'mini' && packReturn.slot === activeSlot) returnToGamePack();
  else render();
});
shapeDialog.addEventListener('close', () => {
  if (!shapeDialog.open && packReturn?.kind === 'shape' && packReturn.slot === activeSlot) returnToGamePack();
});

function openGamePackEntry(id) {
  const kind = id === 'colorMain' ? 'color' : id === 'shapeMain' ? 'shape' : 'mini';
  packReturn = {slot: activeSlot, kind};
  if (kind === 'mini') {
    startMini(id);
    adventureDialog.scrollTop = 0;
  } else {
    openCameraGame(id);
  }
}

function drawGamePackPanel(open) {
  const games = new Map([...arcadeGames, ...cameraGames].map(([id, icon, name]) => [id, {icon, name}]));
  const ids = [...games.keys()];
  const pack = GamePacks.entries(state);
  const packDone = pack.filter(entry => GamePacks.completed(state, entry)).length;
  const ready = pack.length === GamePacks.size && packDone === GamePacks.size;
  const canClaim = GamePacks.canClaimToday(state, day());
  const practiceReady = GamePacks.practiceReady(state, ids);
  const tried = ids.filter(id => GamePacks.count(state, id) > 0).length;
  const trained = ids.filter(id => GamePacks.count(state, id) >= GamePacks.practiceTarget).length;
  const claimed = new Set(state.gamePacks?.practiceClaimed || []);

  const panel = document.createElement('details');
  panel.id = 'gamePackPanel';
  panel.className = 'card game-pack';
  panel.open = open;
  panel.innerHTML = `<summary><strong>🎒 Gói 5 game · +${GamePacks.reward} xu</strong>
    <small>${!canClaim ? 'Đã nhận hôm nay' : pack.length ? `${packDone}/${GamePacks.size} đã hoàn thành` : 'Ưu tiên trò bạn ít chơi'}</small></summary>
    <div class="game-pack-body">
      <p class="muted">Hoàn thành mỗi game trong gói một lần. Xu của từng lượt vẫn nhận như thường. Thưởng gói tối đa một lần mỗi ngày.</p>
      ${pack.length ? `<ol>${pack.map(entry => {
        const game = games.get(entry.id);
        const label = game ? `${game.icon} ${game.name}` : 'Game đã được thay thế';
        return `<li>${GamePacks.completed(state, entry)
          ? `<span>✓ ${label} · Xong</span>`
          : game ? `<button class="secondary" data-pack-game="${entry.id}">${label} →</button>`
          : `<span>${label}</span>`}</li>`;
      }).join('')}</ol>` : ''}
      ${!canClaim ? '<p>Ngày mai bạn có thể nhận gói mới.</p>' : ready
        ? `<button id="claimGamePack">Nhận +${GamePacks.reward} xu</button>`
        : `<button id="rollGamePack">${pack.length ? '🎲 Đổi các game chưa xong' : '🎲 Nhận gói game'}</button>
           <p class="muted">${pack.length ? 'Đổi miễn phí bao nhiêu lần tùy thích. Các game đã xong vẫn được giữ.' : 'Bạn có thể đổi gói miễn phí và chơi theo nhịp của mình.'}</p>`}
      <div class="game-pack-practice">
        <strong>Thử và luyện</strong>
        <p class="muted">Đã thử ${tried}/${ids.length} game · Luyện đủ ${trained}/${ids.length} game. Mỗi game có một phần thưởng ${GamePacks.practiceReward} xu sau ${GamePacks.practiceTarget} lượt hoàn thành, kể cả khi chơi ngoài gói.</p>
        ${practiceReady.length ? `<button class="secondary" id="claimGamePractice">Nhận thưởng luyện +${practiceReady.length * GamePacks.practiceReward} xu</button>` : ''}
      </div>
    </div>`;
  document.querySelector('.game-search').before(panel);
  for (const button of panel.querySelectorAll('[data-pack-game]')) {
    button.onclick = () => openGamePackEntry(button.dataset.packGame);
  }
  if ($('rollGamePack')) $('rollGamePack').onclick = () => {
    if (homeTransaction(() => GamePacks.roll(state, ids, day()))) $('rollGamePack')?.focus();
  };
  if ($('claimGamePack')) $('claimGamePack').onclick = () => {
    if (homeTransaction(() => GamePacks.claim(state, day()), 'Hoàn thành gói game · +' + GamePacks.reward + ' xu')) {
      $('gamePackPanel').querySelector('summary').focus();
    }
  };
  if ($('claimGamePractice')) $('claimGamePractice').onclick = () => {
    let coins = 0;
    if (homeTransaction(() => (coins = GamePacks.claimPractice(state, ids)) > 0)) {
      notice('Thưởng luyện game · +' + coins + ' xu');
      $('gamePackPanel').querySelector('summary').focus();
    }
  };
  for (const button of $('gameGrid').querySelectorAll('[data-mini], [data-camera-game]')) {
    const id = button.dataset.mini || button.dataset.cameraGame;
    const done = Math.min(GamePacks.practiceTarget, GamePacks.count(state, id));
    const progress = document.createElement('p');
    progress.className = 'game-practice-progress';
    progress.textContent = claimed.has(id) ? '✓ Đã nhận thưởng luyện'
      : done === GamePacks.practiceTarget ? '🎁 Có thưởng luyện'
      : `Luyện ${done}/${GamePacks.practiceTarget} lượt`;
    button.before(progress);
  }
}

const beforeGamePackRender = render;
render = function() {
  const open = $('gamePackPanel')?.open || false;
  beforeGamePackRender();
  if (packReturn?.slot !== activeSlot || (current !== 'quests' && current !== 'fortune')) packReturn = null;
  if (current === 'quests' && activeSlot !== null) {
    if (packReturn?.kind === 'color') packReturn = null;
    drawGamePackPanel(open);
  }
  if (current === 'fortune' && packReturn?.kind === 'color') {
    $('backGarden').textContent = 'Về gói game';
    $('backGarden').onclick = returnToGamePack;
  }
};
