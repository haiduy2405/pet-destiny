/* The six arcade games rebuilt with difficulty levels (Dễ = the original game). Winning still goes through winMini()
   (pet-loop.js), so coins, daily bonus and quests are unchanged; levels.js adds the level bonus. Load before levels.js. */
const alSyms=['🍎','🌼','🍃','💧','🍄','🐞'],alNames=['Táo','Hoa','Lá','Nước','Nấm','Bọ rùa'],alAnimals=['🐱','🐲','🐶','🐰','🦊','🐼','🐸','🐵'];
const alStartBase=startMini;
function alShell(type,level,html,status=''){
  const g=arcadeGames.find(x=>x[0]===type),d=Levels.def(level);
  adventureDialog.innerHTML=`<div class="eyebrow">${d.icon} MỨC ${d.name.toUpperCase()} · KHÔNG ĐẾM GIỜ</div><h2>${g[1]} ${g[2]}</h2>${html}<p id="arcadeStatus" role="status">${status}</p><button class="secondary close-mini">Đóng</button>`;
  adventureDialog.querySelector('.close-mini').onclick=()=>{miniSession=null;adventureDialog.close()};
  if(!adventureDialog.open)adventureDialog.showModal();
}
const alSay=t=>{const e=$('arcadeStatus');if(e)e.textContent=t};
function alMemory(level){
  const p=Levels.arcade.memory(level),seq=Levels.sequence(p.len,p.symbols),syms=alSyms.slice(0,p.symbols);let step=0;
  alShell('memory',level,`<div class="memory-sequence">${seq.map(i=>syms[i]).join(' → ')}</div><p class="muted">Nhớ ${p.len} biểu tượng theo đúng thứ tự, rồi bấm nút để chọn lại.</p><button id="memoryReady">Tôi đã nhớ</button>`);
  $('memoryReady').onclick=()=>{
    alShell('memory',level,`<p id="miniStatus">0/${p.len} biểu tượng đúng</p><div class="mini-options">${syms.map((s,i)=>`<button data-memory="${i}" aria-label="${alNames[i]}">${s}</button>`).join('')}</div>`);
    adventureDialog.querySelectorAll('[data-memory]').forEach(b=>b.onclick=()=>{
      if(miniSession?.slot!==activeSlot)return;
      if(Number(b.dataset.memory)!==seq[step]){step=0;$('miniStatus').textContent=`Chưa đúng. Thử lại từ đầu: 0/${p.len}`;return}
      step++;if(step===p.len)return winMini();$('miniStatus').textContent=`${step}/${p.len} biểu tượng đúng`;
    });
  };
}
const AL_COUNT_ROUNDS=5;
function alCount(level,done=0){
  const p=Levels.arcade.count(level),count=p.min+rand(p.max-p.min+1),choices=Levels.countChoices(count,p.min,p.max,p.choices);
  alShell('count',level,`<p class="mini-progress">Đếm đúng ${done}/${AL_COUNT_ROUNDS} lần</p><div class="firefly-field" aria-label="Các đom đóm cần đếm">${Array.from({length:count},(_,i)=>`<span style="left:${8+(i*29+Math.floor(i/6)*11)%80}%;top:${10+(i*37+Math.floor(i/5)*17)%72}%">✦</span>`).join('')}</div><div class="mini-options">${choices.map(n=>`<button data-count="${n}">${n}</button>`).join('')}</div>`);
  adventureDialog.querySelectorAll('[data-count]').forEach(b=>b.onclick=()=>{
    if(miniSession?.slot!==activeSlot)return;
    if(Number(b.dataset.count)===count){if(done+1>=AL_COUNT_ROUNDS)return winMini();return alCount(level,done+1)}
    /* đoán bừa không có lợi: sai thì mất 1 lần đúng và đổi sang đàn đom đóm khác */
    alCount(level,Math.max(0,done-1));alSay('Chưa đúng, đàn mới rồi. Đếm kỹ hơn nhé!');
  });
}
function alPairs(level){
  const p=Levels.arcade.pairs(level),deck=Levels.pairDeck(p.pairs,alAnimals);let open=[],matched=[];
  const draw=()=>{
    alShell('pairs',level,`<p class="mini-progress">Đã ghép ${matched.length/2}/${p.pairs} cặp</p><div class="pair-board" style="grid-template-columns:repeat(${p.pairs>3?4:3},1fr)">${deck.map((icon,i)=>{const up=open.includes(i)||matched.includes(i);return `<button data-card="${i}" ${up||open.length===2?'disabled':''} class="${up?'revealed':''}" aria-label="${up?icon:'Lật thẻ '+(i+1)}">${up?icon:'?'}</button>`}).join('')}</div>${open.length===2?'<button class="secondary" id="retryPair">Thử cặp khác</button>':''}`);
    adventureDialog.querySelectorAll('[data-card]').forEach(b=>b.onclick=()=>{
      const i=Number(b.dataset.card);if(miniSession?.slot!==activeSlot||open.length===2||open.includes(i)||matched.includes(i))return;
      open.push(i);
      if(open.length===2&&deck[open[0]]===deck[open[1]]){matched.push(...open);open=[];sound('pet');if(matched.length===deck.length)return winMini()}
      draw();
    });
    if($('retryPair'))$('retryPair').onclick=()=>{open=[];draw()};
  };
  draw();
}
function alSnacks(level){
  const p=Levels.arcade.snacks(level),cols=p.cells>9?4:3;let step=0;
  const draw=()=>{
    const target=rand(p.cells);
    alShell('snacks',level,`<p class="mini-progress">Đã nhặt ${step}/${p.need} trái cây</p><p class="muted">Chạm vào trái cây. Những chiếc lá cứ để lại cho vườn nhé.</p><div class="snack-board" style="grid-template-columns:repeat(${cols},1fr)">${Array.from({length:p.cells},(_,i)=>`<button data-snack="${i===target?'fruit':'leaf'}" aria-label="${i===target?'Trái cây':'Lá cây'}">${i===target?['🍎','🍊','🍓','🍐'][step%4]:'🍃'}</button>`).join('')}</div>`);
    adventureDialog.querySelectorAll('[data-snack]').forEach(b=>b.onclick=()=>{
      if(miniSession?.slot!==activeSlot)return;
      if(b.dataset.snack!=='fruit')return alSay('Đó là chiếc lá. Tìm trái cây nhé!');
      step++;sound('pet');if(step===p.need)return winMini();draw();
    });
  };
  draw();
}
function alOrder(level){
  const p=Levels.arcade.order(level),numbers=Levels.shuffle(Array.from({length:p.n},(_,i)=>i+1));let step=0;
  const draw=()=>{
    alShell('order',level,`<p class="mini-progress">Chạm số <strong>${step+1}</strong> tiếp theo (đến ${p.n})</p><div class="number-board" style="grid-template-columns:repeat(${p.n>9?5:3},1fr)">${numbers.map(n=>`<button data-number="${n}" ${n<=step?'disabled':''}>${n<=step?'✓':n}</button>`).join('')}</div>`);
    adventureDialog.querySelectorAll('[data-number]').forEach(b=>b.onclick=()=>{
      if(miniSession?.slot!==activeSlot)return;
      if(Number(b.dataset.number)!==step+1)return alSay('Hãy tìm số '+(step+1)+' trước nhé.');
      step++;sound('pet');if(step===p.n)return winMini();draw();
    });
  };
  draw();
}
function alColors(level){
  const p=Levels.arcade.colors(level);let step=0,last=-1;
  const draw=()=>{
    let target=rand(12);if(target===last)target=(target+5)%12;last=target;
    const choices=Levels.colorChoices(target,p.choices);
    alShell('colors',level,`<p class="mini-progress">Lượt ${step+1}/${p.rounds}</p><div class="color-question" role="img" aria-label="Màu cần đoán" style="background:${COLORS[target][1]}"></div><p class="muted">Màu này tên là gì?</p><div class="color-answers">${choices.map(i=>`<button class="secondary" data-color-answer="${i}">${COLORS[i][0]}</button>`).join('')}</div>`);
    adventureDialog.querySelectorAll('[data-color-answer]').forEach(b=>b.onclick=()=>{
      if(miniSession?.slot!==activeSlot)return;
      if(Number(b.dataset.colorAnswer)!==target)return alSay('Chưa đúng, thử một tên khác nhé.');
      step++;if(step===p.rounds)return winMini();draw();
    });
  };
  draw();
}
const alGames={memory:alMemory,count:alCount,pairs:alPairs,snacks:alSnacks,order:alOrder,colors:alColors};
startMini=function(type){
  if(!alGames[type])return alStartBase(type);
  miniSession={type,slot:activeSlot};
  alGames[type](levelNow(type));
};
