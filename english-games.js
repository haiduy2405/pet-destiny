/* English vocabulary games: Hangman ("Giải cứu từ"), scramble, listen, fill-in-the-blank. */
const ENG=[
['apple','🍎','quả táo','A red or green fruit','Một loại quả màu đỏ hoặc xanh','I eat an apple.','Tôi ăn một quả táo.'],
['banana','🍌','quả chuối','A long yellow fruit','Quả dài màu vàng','A banana is yellow.','Quả chuối màu vàng.'],
['milk','🥛','sữa','A white drink from cows','Thức uống màu trắng từ bò','I drink milk every morning.','Tôi uống sữa mỗi sáng.'],
['bread','🍞','bánh mì','Food made from flour','Món ăn làm từ bột mì','She has bread for breakfast.','Cô ấy ăn bánh mì buổi sáng.'],
['cat','🐱','con mèo','A small pet that says meow','Thú cưng nhỏ kêu meo','The cat sleeps on the sofa.','Con mèo ngủ trên ghế sofa.'],
['dog','🐶','con chó','A pet that barks','Thú cưng biết sủa','My dog likes to run.','Con chó của tôi thích chạy.'],
['fish','🐟','con cá','It lives in water','Sống dưới nước','The fish swims fast.','Con cá bơi nhanh.'],
['bird','🐦','con chim','It has wings and can fly','Có cánh và biết bay','A bird sits in the tree.','Một con chim đậu trên cây.'],
['sun','☀️','mặt trời','It shines in the day','Chiếu sáng ban ngày','The sun is hot.','Mặt trời rất nóng.'],
['moon','🌙','mặt trăng','You see it at night','Bạn thấy nó vào ban đêm','The moon is bright tonight.','Tối nay trăng sáng.'],
['star','⭐','ngôi sao','It twinkles in the night sky','Lấp lánh trên bầu trời đêm','I see a star.','Tôi thấy một ngôi sao.'],
['rain','🌧️','mưa','Water falls from clouds','Nước rơi từ mây xuống','I take an umbrella in the rain.','Tôi mang ô khi trời mưa.'],
['tree','🌳','cái cây','It is tall and has leaves','Cao và có lá','The tree is very tall.','Cái cây rất cao.'],
['flower','🌸','bông hoa','It smells nice and has petals','Thơm và có cánh hoa','She gives me a flower.','Cô ấy tặng tôi một bông hoa.'],
['book','📚','quyển sách','You read it','Bạn đọc nó','I read a book at night.','Tôi đọc sách vào buổi tối.'],
['pencil','✏️','bút chì','You write with it','Bạn viết bằng nó','I write with a pencil.','Tôi viết bằng bút chì.'],
['school','🏫','trường học','Children learn here','Nơi trẻ em đến học','I go to school by bike.','Tôi đi học bằng xe đạp.'],
['house','🏠','ngôi nhà','People live in it','Nơi mọi người sinh sống','Our house is small.','Nhà của chúng tôi nhỏ.'],
['car','🚗','xe ô tô','It has four wheels','Có bốn bánh','The car is red.','Chiếc xe ô tô màu đỏ.'],
['bike','🚲','xe đạp','You ride it with pedals','Bạn đạp để đi','I ride my bike to the park.','Tôi đạp xe đến công viên.'],
['water','💧','nước','You drink it every day','Bạn uống mỗi ngày','Drink water every day.','Hãy uống nước mỗi ngày.'],
['hand','✋','bàn tay','It has five fingers','Có năm ngón','I raise my hand.','Tôi giơ tay lên.'],
['eye','👁️','con mắt','You see with it','Bạn nhìn bằng nó','My eye is blue.','Mắt tôi màu xanh.'],
['happy','😊','vui vẻ','The feeling when you smile','Cảm giác khi bạn mỉm cười','I am happy today.','Hôm nay tôi vui.'],
['red','🔴','màu đỏ','The color of a ripe tomato','Màu của quả cà chua chín','The ball is red.','Quả bóng màu đỏ.'],
['green','🟢','màu xanh lá','The color of grass','Màu của cỏ','The grass is green.','Cỏ có màu xanh lá.'],
['ball','⚽','quả bóng','You kick or throw it','Bạn đá hoặc ném nó','We play with a ball.','Chúng tôi chơi với quả bóng.'],
['cake','🎂','bánh ngọt','Sweet food for birthdays','Món ngọt cho ngày sinh nhật','The cake is sweet.','Chiếc bánh rất ngọt.'],
['rabbit','🐰','con thỏ','It has long ears and hops','Tai dài và biết nhảy','The rabbit eats a carrot.','Con thỏ ăn cà rốt.'],
['teacher','👩‍🏫','giáo viên','A person who helps you learn','Người giúp bạn học','My teacher is kind.','Cô giáo của tôi rất hiền.'],
['music','🎵','âm nhạc','You listen to it and sing','Bạn nghe và hát','I love music.','Tôi yêu âm nhạc.']
];
const engPick=(n,filter)=>shuffle(ENG.filter(filter||(()=>true))).slice(0,n);
function engSay(word){
  if(!('speechSynthesis' in window))return false;
  try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(word);u.lang='en-US';u.rate=.8;speechSynthesis.speak(u);return true}catch(e){return false}
}
adventureDialog.addEventListener('click',e=>{const b=e.target.closest('[data-say]');if(b&&!engSay(b.dataset.say))notice('Máy chưa hỗ trợ phát âm. Từ này là “'+b.dataset.say+'”.')});

function engTypos(w){
  const set=new Set(),sw=[...w],sub={a:'o',e:'a',i:'e',o:'u',u:'a'};
  for(let i=0;i<sw.length-1;i++)if(sw[i]!==sw[i+1]){const t=[...sw];[t[i],t[i+1]]=[t[i+1],t[i]];set.add(t.join(''))}
  sw.forEach((c,i)=>{if(sub[c]){const t=[...sw];t[i]=sub[c];set.add(t.join(''))}});
  set.add(w.slice(0,-1));set.add(w+'e');set.delete(w);
  return shuffle([...set]).slice(0,3);
}
const engGames={
  scramble:{icon:'🧩',title:'Xếp chữ cái',rounds:5,reward:15,words:ENG,
    intro:'Các chữ cái bị xáo trộn! Nhìn hình, đọc nghĩa tiếng Việt rồi chọn cách viết đúng của từ tiếng Anh.',
    question(round,session){const [w,icon,vi,cEN,cVI]=session.words[round];let s=w;for(let i=0;i<9&&s===w;i++)s=shuffle([...w]).join('');
      return {prompt:`<p class="practice-word"><span aria-hidden="true">${icon}</span>${vi}</p><p class="practice-pattern">${[...s].map(c=>c.toUpperCase()).join(' ')}</p><p class="muted">${cEN}<br>${cVI}</p>`,
        answer:w,options:[w,...engTypos(w)],hint:`Từ có ${w.length} chữ cái, bắt đầu bằng “${w[0].toUpperCase()}”. (Starts with ${w[0].toUpperCase()}.)`,explanation:`${vi} là “${w}”.`}}},
  listen:{icon:'👂',title:'Nghe và chọn nghĩa',rounds:6,reward:15,words:ENG,
    intro:'Bấm nút để nghe một từ tiếng Anh, rồi chọn nghĩa tiếng Việt đúng. Có thể nghe lại bao nhiêu lần tùy thích.',
    question(round,session){const [w,icon,vi,cEN,cVI]=session.words[round];
      const others=shuffle(ENG.filter(x=>x[0]!==w)).slice(0,3).map(x=>x[2]);
      setTimeout(()=>engSay(w),250);
      return {prompt:`<p><button class="secondary" data-say="${w}">🔈 Nghe từ</button></p><p class="muted">Không nghe được? Từ là “${w}”.</p>`,
        answer:vi,options:[vi,...others],hint:`Gợi ý: ${cEN} / ${cVI}. Từ bắt đầu bằng “${w[0].toUpperCase()}”.`,explanation:`“${w}” nghĩa là ${vi} ${icon}.`}}},
  fillblank:{icon:'✍️',title:'Điền từ vào câu',rounds:5,reward:15,words:ENG.filter(x=>new RegExp('\\b'+x[0]+'\\b','i').test(x[5])),
    intro:'Đọc câu song ngữ Anh – Việt và chọn từ tiếng Anh còn thiếu để câu có nghĩa.',
    question(round,session){const [w,icon,vi,cEN,cVI,exEN,exVI]=session.words[round];
      const others=shuffle(ENG.filter(x=>x[0]!==w)).slice(0,3).map(x=>x[0]);
      return {prompt:`<p class="practice-word"><span aria-hidden="true">${icon}</span>${exEN.replace(new RegExp('\\b'+w+'\\b','i'),'____')}</p>`,
        answer:w,options:[w,...others],hint:`Nghĩa cả câu: ${exVI} Từ cần điền: ${cEN.toLowerCase()} (${cVI.toLowerCase()}).`,explanation:`“${exEN}” – ${exVI}`}}}
};
for(const [id,g] of Object.entries(engGames)){practiceGames[id]=g;arcadeGames.push([id,g.icon,g.title,g.intro,g.reward])}
arcadeGames.push(['hangman','🎈','Giải cứu từ','Đoán từ tiếng Anh từng chữ cái để giữ bóng bay không rơi. Gợi ý song ngữ, combo tặng chữ, nghe phát âm.',15]);
gameSubjects.find(([s])=>s==='Tiếng Anh')[1].push('scramble','listen','fillblank','hangman');

/* Hangman, kid version: wrong letters pop balloons (no hanging). */
let hang=null;
const beforeHangStart=startMini;
startMini=function(type){
  if(type!=='hangman')return beforeHangStart(type);
  hang={slot:activeSlot,words:engPick(4),i:0,first:0};
  adventureDialog.innerHTML=`<h2>🎈 Giải cứu từ</h2><p>Mỗi từ có <b>5 quả bóng 🎈</b>. Đoán sai một chữ → nổ một quả. Hết bóng thì từ rơi xuống (vẫn được xem đáp án).</p>
  <ul class="muted"><li>Có hình + nghĩa tiếng Việt + gợi ý tiếng Anh.</li><li>🔥 Đoán đúng 3 chữ liên tiếp → tặng một chữ miễn phí.</li><li>💡 Gợi ý mạnh: lộ một chữ + câu ví dụ song ngữ (tốn 1 bóng).</li><li>Mỗi từ đoán đúng không sai, không gợi ý: +1 xu thưởng.</li></ul>
  <p>4 từ · 15 xu, thưởng tối đa +4.</p><button id="hangBegin">Bắt đầu</button><button class="secondary close-mini">Đóng</button>`;
  $('hangBegin').onclick=hangWord;adventureDialog.querySelector('.close-mini').onclick=()=>adventureDialog.close();
  if(!adventureDialog.open)adventureDialog.showModal();
};
function hangWord(){
  const h=hang;if(!h||h.slot!==activeSlot)return;
  Object.assign(h,{g:new Set(),lives:5,streak:0,wrong:0,assist:false,hinted:false,over:false});hangDraw();
}
function hangDraw(){
  const h=hang,[w,icon,vi,cEN,cVI,exEN,exVI]=h.words[h.i],W=w.toUpperCase(),won=[...W].every(c=>h.g.has(c)),lost=h.lives<=0;
  h.over=won||lost;
  const slots=[...W].map(c=>`<span class="hang-slot">${h.g.has(c)||lost?c:'&nbsp;'}</span>`).join('');
  const keys=[...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].map(c=>`<button class="hang-key ${h.g.has(c)?(W.includes(c)?'ok':'bad'):''}" data-key="${c}" ${h.g.has(c)||h.over?'disabled':''}>${c}</button>`).join('');
  const hint=h.hinted?`<p class="hang-clue">💡 <i>${exEN.replace(new RegExp('\\b'+w+'\\b','i'),'____')}</i><br>${exVI}</p>`:'';
  adventureDialog.innerHTML=`<div class="eyebrow">TỪ ${h.i+1}/4 · ${'🔥'.repeat(Math.min(2,h.streak))}${h.streak?` combo ${h.streak}/3`:''}</div>
  <div class="hang-balloons" aria-label="${h.lives} quả bóng còn lại">${'🎈'.repeat(h.lives)}${'💥'.repeat(5-h.lives)}</div>
  <p class="practice-word"><span aria-hidden="true">${icon}</span>${vi}</p>
  <p class="muted">${cEN} · ${w.length} chữ cái<br>${cVI} · ${w.length} chữ cái</p>${hint}
  <div class="hang-word">${slots}</div>
  ${h.over?`<h3>${won?'🎉 Giỏi lắm!':'🌧️ Lần sau nhé!'} <button class="secondary" data-say="${w}">🔈 ${w}</button></h3><p>“${exEN}”<br>${exVI}</p><button id="hangNext">${h.i===3?'Nhận xu':'Từ tiếp theo →'}</button>`
  :`<div class="hang-keys">${keys}</div><div class="actions"><button class="secondary" id="hangHint" ${h.hinted||h.lives<2?'disabled':''}>💡 Gợi ý (−1 🎈)</button><button class="secondary close-mini">Đóng</button></div>`}`;
  if(won&&!h.wrong&&!h.assist&&!h.counted){h.counted=1;h.first++}
  if(h.over){if(won){sound('reward')}$('hangNext').onclick=()=>{h.counted=0;if(h.i===3)return hangFinish();h.i++;hangWord()};$('hangNext').focus();return}
  adventureDialog.querySelectorAll('[data-key]').forEach(b=>b.onclick=()=>hangGuess(b.dataset.key));
  $('hangHint').onclick=()=>{h.hinted=h.assist=true;h.lives--;const W2=[...W].filter(c=>!h.g.has(c));if(W2.length)h.g.add(shuffle(W2)[0]);hangDraw()};
  adventureDialog.querySelector('.close-mini').onclick=()=>adventureDialog.close();
}
function hangGuess(c){
  const h=hang;if(!h||h.slot!==activeSlot||h.over||h.g.has(c))return;
  const W=h.words[h.i][0].toUpperCase();h.g.add(c);
  if(W.includes(c)){h.streak++;if(h.streak>=3){h.streak=0;const left=[...W].filter(x=>!h.g.has(x));if(left.length){h.g.add(shuffle(left)[0]);notice('🔥 Combo! Tặng bạn một chữ')}}}
  else{h.streak=0;h.wrong++;h.lives--}
  hangDraw();
}
document.addEventListener('keydown',e=>{if(hang&&adventureDialog.open&&!hang.over&&hang.g&&/^[a-z]$/i.test(e.key)&&!e.ctrlKey&&!e.metaKey)hangGuess(e.key.toUpperCase())});
function hangFinish(){
  const h=hang;if(!h||h.slot!==activeSlot)return;
  const backup=SaveStore.copy(state),coins=15+Math.min(h.first,5);
  state.coins+=coins;recordEvent('mini');recordEvent('mini_hangman');
  if(!save()){state=backup;return}
  $('coins').textContent=state.coins;hang=null;
  adventureDialog.innerHTML=`<h2>🏆 Hoàn thành · +${coins} xu</h2><p>${h.first}/4 từ đoán hoàn hảo. Từ mới đã vào túi kiến thức!</p><button id="hangAgain">Chơi tiếp</button><button class="secondary" id="hangHome">Đóng</button>`;
  $('hangAgain').onclick=()=>startMini('hangman');$('hangHome').onclick=()=>{adventureDialog.close();render()};bindJourneyReturn($('hangHome'));sound('reward');burst();
}
adventureDialog.addEventListener('close',()=>{hang=null});
