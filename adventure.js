let miniSession=null;const adventureDialog=document.createElement('dialog');adventureDialog.id='adventureDialog';document.body.append(adventureDialog);
function recordEvent(type){if(activeSlot===null)return;Adventure.event(state,type,day())}
function petName(p){return p.nickname ? Atelier.escape(p.nickname) : SPECIES[p.species][0]+' '+COLORS[p.color][0]}
function petArt(p){return `<div class="pet-art ${p.evolution?'evolved':''}" style="--growth:${.65+p.xp*.0035}">${sprite(p.species,'',p.color)}${p.evolution?'<span class="pet-crown">👑</span>':''}</div>`}
const oldAdventureRender=render;render=function(){Adventure.normalize(state);oldAdventureRender()};
let evolutionGame = null;

function evolutionDialog(id) {
  const pet = state.pets.find(p => p.id === id);
  if (!pet || pet.xp < 100 || pet.evolution) return;
  if (!pet.evoStart) {
    Adventure.startEvolution(state, id);
    save();
  }
  const steps = Adventure.evolution(state, pet);
  const ready = steps.every(([, done, target]) => done >= target);
  const buttons = {
    camera: cameraGames.map(([game, , label]) => [game, label]),
    mini: [['count', 'Đếm đom đóm']],
    variety: ['memory', 'count']
      .filter(game => Adventure.evolutionCount(state, pet, 'mini_' + game) === 0)
      .slice(0, 1)
      .map(game => [game, arcadeGames.find(([key]) => key === game)[2]])
  };
  const rows = steps.map(([name, done, target, shortcut]) => {
    const complete = done >= target;
    const games = complete ? [] : (buttons[shortcut] || []);
    return `<li>${complete ? '✅' : '○'} ${name} <b>${Math.min(done, target)}/${target}</b>
      ${games.length ? `<div class="evo-game-links">${games.map(([game, label]) =>
        `<button class="secondary" data-evolution-game="${game}">${label} →</button>`).join('')}</div>` : ''}</li>`;
  }).join('');
  const careOptions = Adventure.evolutionCareOptions(state, pet);
  const careLabels = { food: 'Kiểm tra bữa ăn', clean: 'Lau nhẹ', joy: 'Vuốt ve', energy: 'Ru ngủ' };
  adventureDialog.innerHTML = `<div class="eyebrow">NGHI THỨC DUYÊN SẮC</div><h2>Tiến hóa ${petName(pet)}</h2>
    <p class="muted">Thú đã lớn đủ 100%. Hoàn thành các mục sau kể từ lúc nhận nhiệm vụ; tiến độ giữ qua ngày và khi đổi ô lưu.</p>
    <ul class="evo-steps">${rows}</ul>
    ${careOptions.length ? `<p class="muted"><strong>Chăm sóc nhẹ</strong> khi chỉ số đã đủ. Miễn phí và được tính vào nhiệm vụ.</p>
      <div class="evo-game-links">${careOptions.map(type =>
        `<button class="secondary" data-evolution-care="${type}">${careLabels[type]}</button>`).join('')}</div>` : ''}
    <p class="muted">Phần thưởng: dạng Linh thú với vương miện, hào quang và 25 xu. Mỗi thú tiến hóa một lần ở bản này.</p>
    <div class="actions"><button class="secondary" id="closeAdventure">Để sau</button><button id="evolvePet" ${ready ? '' : 'disabled'}>✦ Tiến hóa</button></div>`;
  adventureDialog.querySelectorAll('[data-evolution-game]').forEach(button => {
    button.onclick = () => {
      const game = button.dataset.evolutionGame;
      if (game === 'colorMain' || game === 'shapeMain') {
        adventureDialog.close();
        openCameraGame(game);
        return;
      }
      evolutionGame = { id, slot: activeSlot };
      startMini(game);
      adventureDialog.scrollTop = 0;
      adventureDialog.querySelector('button')?.focus();
    };
  });
  adventureDialog.querySelectorAll('[data-evolution-care]').forEach(button => {
    button.onclick = () => {
      const type = button.dataset.evolutionCare;
      const currentPet = state.pets.find(candidate => candidate.id === id);
      if (!Adventure.evolutionCareOptions(state, currentPet).includes(type)) return;
      const saved = homeTransaction(() => {
        recordEvent('care');
        recordEvent('care_' + type);
      }, 'Đã tính một lượt chăm sóc nhẹ');
      if (!saved) return;
      const scroll = adventureDialog.scrollTop;
      evolutionDialog(id);
      adventureDialog.scrollTop = scroll;
      (adventureDialog.querySelector(`[data-evolution-care="${type}"]`) ||
        adventureDialog.querySelector('[data-evolution-care]') || $('closeAdventure')).focus({ preventScroll: true });
    };
  });
  $('closeAdventure').onclick = () => adventureDialog.close();
  $('evolvePet').onclick = () => {
    if (!Adventure.evolve(state, id, day())) return;
    state.coins += 25;
    save();
    adventureDialog.close();
    render();
    notice('Thú đã tiến hóa! 👑 +25 xu');
  };
  if (!adventureDialog.open) adventureDialog.showModal();
}

adventureDialog.addEventListener('close', () => {
  if (!evolutionGame || adventureDialog.open) return;
  const { id, slot } = evolutionGame;
  evolutionGame = null;
  miniSession = null;
  if (slot === activeSlot) evolutionDialog(id);
});
function startMini(type){miniSession={type,slot:activeSlot,sequence:Array.from({length:3},()=>rand(4)),step:0,count:3+rand(6)};if(type==='memory'){adventureDialog.innerHTML=`<h2>Nhớ thứ tự nhé!</h2><div class="memory-sequence">${miniSession.sequence.map(i=>['🍎','🌼','🍃','💧'][i]).join(' → ')}</div><p class="muted">Khi đã nhớ, bấm nút để bắt đầu chọn lại.</p><button id="memoryReady">Tôi đã nhớ</button><button class="secondary close-mini">Đóng</button>`;$('memoryReady').onclick=drawMemory}else drawCount();adventureDialog.querySelector('.close-mini').onclick=()=>adventureDialog.close();if(!adventureDialog.open)adventureDialog.showModal()}
function drawMemory(){adventureDialog.innerHTML=`<h2>Chọn đúng thứ tự</h2><p id="miniStatus">${miniSession.step}/3 biểu tượng đúng</p><div class="mini-options">${['🍎','🌼','🍃','💧'].map((s,i)=>`<button data-memory="${i}" aria-label="${['Táo','Hoa','Lá','Nước'][i]}">${s}</button>`).join('')}</div><button class="secondary close-mini">Đóng</button>`;adventureDialog.querySelectorAll('[data-memory]').forEach(b=>b.onclick=()=>{if(Number(b.dataset.memory)!==miniSession.sequence[miniSession.step]){miniSession.step=0;$('miniStatus').textContent='Chưa đúng. Thử lại từ đầu: 0/3';return}miniSession.step++;if(miniSession.step===3)winMini();else $('miniStatus').textContent=miniSession.step+'/3 biểu tượng đúng'});adventureDialog.querySelector('.close-mini').onclick=()=>adventureDialog.close()}
function drawCount(){adventureDialog.innerHTML=`<h2>Có bao nhiêu đom đóm?</h2><div class="firefly-field" aria-label="Các đom đóm cần đếm">${Array.from({length:miniSession.count},(_,i)=>`<span style="left:${10+(i*29)%78}%;top:${12+(i*37)%70}%">✦</span>`).join('')}</div><div class="mini-options">${Array.from({length:6},(_,i)=>i+3).map(n=>`<button data-count="${n}">${n}</button>`).join('')}</div><p id="miniStatus"></p><button class="secondary close-mini">Đóng</button>`;adventureDialog.querySelectorAll('[data-count]').forEach(b=>b.onclick=()=>{if(Number(b.dataset.count)===miniSession.count)winMini();else $('miniStatus').textContent='Chưa đúng, quan sát thêm một chút nhé.'});adventureDialog.querySelector('.close-mini').onclick=()=>adventureDialog.close()}

