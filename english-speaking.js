/* English speaking games: no-fear pronunciation practice. Uses the browser's speech recognition when available
   (audio is handled by the browser, never stored by the game); otherwise falls back to self-check. Trying always earns xu. */
const SPK_SR=window.SpeechRecognition||window.webkitSpeechRecognition;
const spkNorm=s=>String(s).toLowerCase().replace(/’/g,"'").replace(/'/g,'').replace(/[^a-z ]/g,' ').split(/\s+/).filter(Boolean);
function spkLev(a,b){const d=Array.from({length:a.length+1},(_,i)=>[i]);for(let j=1;j<=b.length;j++)d[0][j]=j;for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++)d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]===b[j-1]?0:1));return d[a.length][b.length]}
function spkScore(target,alts){const T=spkNorm(target);let best=0;for(const a of alts){const A=spkNorm(a);let hit=0;for(const t of T)if(A.some(x=>x===t||x===t+'s'||(t.length>=4&&spkLev(x,t)<=1)))hit++;best=Math.max(best,hit/T.length)}return best}
function spkListen(){
  return new Promise(res=>{
    if(!SPK_SR)return res({ok:false,reason:'unsupported'});
    let done=false,r;const fin=v=>{if(done)return;done=true;clearTimeout(t);try{r.stop()}catch(e){}res(v)};
    const t=setTimeout(()=>fin({ok:false,reason:'silent'}),9000);
    try{r=new SPK_SR();r.lang='en-US';r.maxAlternatives=5;r.interimResults=false;r.continuous=false;
      r.onresult=e=>{const alts=[];for(const row of e.results)for(const a of row)alts.push(a.transcript);fin({ok:true,alts})};
      r.onerror=e=>fin({ok:false,reason:/not-allowed|service-not-allowed/.test(e.error)?'denied':e.error==='no-speech'?'silent':'error'});
      r.onend=()=>fin({ok:false,reason:'silent'});r.start()}catch(e){fin({ok:false,reason:'error'})}
  });
}
const SPK_PRAISE=['🌟 Tuyệt vời!','👏 Rất rõ ràng!','🎉 Giỏi quá!','💪 Em nói dũng cảm lắm!','✨ Chuẩn rồi!'];
const SPK_PHRASES=[['Good morning!','Chào buổi sáng!','🌅'],['Thank you very much.','Cảm ơn bạn rất nhiều.','🙏'],['How are you?','Bạn khỏe không?','👋'],['Nice to meet you.','Rất vui được gặp bạn.','🤝'],['I like apples.','Tôi thích táo.','🍎'],['See you tomorrow.','Hẹn gặp lại ngày mai.','👋'],['I am happy today.','Hôm nay tôi vui.','😊'],['Can I have some water?','Cho tôi xin ít nước được không?','💧'],['What is your name?','Bạn tên là gì?','🧒'],['I love my family.','Tôi yêu gia đình mình.','👨‍👩‍👧']];
const SPK_CHAT=[['Hello! What is your name?','Xin chào! Bạn tên là gì?','My name is Lan.'],['How old are you?','Bạn bao nhiêu tuổi?','I am eight years old.'],['What is your favorite color?','Màu bạn thích là gì?','My favorite color is blue.'],['Do you like cats or dogs?','Bạn thích mèo hay chó?','I like dogs.'],['What do you eat for breakfast?','Bạn ăn gì vào bữa sáng?','I eat bread.'],['How do you feel today?','Hôm nay bạn thấy thế nào?','I feel happy.'],['What is your favorite animal?','Con vật bạn thích nhất?','I like rabbits.']];
const SPK_TWISTERS=[['She sells sea shells.','Cô ấy bán vỏ sò biển.','🐚'],['Red lorry, yellow lorry.','Xe tải đỏ, xe tải vàng.','🚚'],['I scream, you scream, we all scream.','Tôi hét, bạn hét, cả nhà cùng hét.','🍦'],['Fresh fried fish.','Cá chiên tươi.','🐟'],['Three free throws.','Ba quả ném phạt.','🏀'],['Big black bear.','Con gấu đen to.','🐻']];
const SPK_GAMES={
  echo:{icon:'🦜',title:'Vẹt con nhại lại',n:6,thr:.99,intro:'Chú vẹt đọc một từ, em nói theo thật to! Nói chưa chuẩn cũng không sao, thử lại là được xu.',items:()=>shuffle(ENG).slice(0,6).map(([w,e,vi])=>({say:w,vi,emoji:e}))},
  shadow:{icon:'🗣️',title:'Nói theo câu',n:5,thr:.7,intro:'Nghe cả câu rồi nói theo như một người bạn nước ngoài. Có nút nghe chậm để theo kịp.',items:()=>shuffle(SPK_PHRASES).slice(0,5).map(([say,vi,emoji])=>({say,vi,emoji}))},
  chat:{icon:'🎭',title:'Trò chuyện cùng thú',n:5,thr:0,any:true,intro:'Thú hỏi em một câu tiếng Anh, em trả lời bằng tiếng Anh. Không có đúng hay sai, chỉ cần dám nói!',items:()=>shuffle(SPK_CHAT).slice(0,5).map(([say,vi,model])=>({say,vi,emoji:'🐾',model,reply:true}))},
  twister:{icon:'🌀',title:'Líu lưỡi vui vẻ',n:4,thr:.5,intro:'Câu líu lưỡi khó với cả người bản xứ! Nói chậm trước, rồi nhanh dần. Nhận sao theo độ trôi chảy.',items:()=>shuffle(SPK_TWISTERS).slice(0,4).map(([say,vi,emoji])=>({say,vi,emoji,twist:true}))}
};
for(const [id,g] of Object.entries(SPK_GAMES))arcadeGames.push([id==='echo'?'speakecho':'speak'+id,g.icon,g.title,g.intro,15]);
/* ear training (multiple choice, no microphone) */
practiceGames.minpair={icon:'👂',title:'Tai tinh: nghe đúng âm',rounds:6,reward:15,
  intro:'Nhiều từ tiếng Anh nghe rất giống nhau (ship – sheep). Nghe kỹ rồi chọn đúng từ được đọc.',
  words:[['ship','sheep','chip'],['sit','seat','set'],['pull','pool','pole'],['bed','bad','bat'],['think','sink','thing'],['three','tree','free'],['light','right','night'],['very','berry','merry'],['cap','cab','cat'],['bag','back','bat'],['thin','tin','fin'],['bit','beat','bet']],
  question(r,s){const set=s.words[r],a=set[rand(3)];setTimeout(()=>engSay(a),250);
    return {prompt:`<p><button class="secondary" data-say="${a}">🔈 Nghe</button> <button class="secondary" data-say="${a}" data-rate="0.5">🐢 Nghe chậm</button></p><p class="muted">Không nghe được? Từ được đọc là “${a}”.</p>`,options:set,answer:a,hint:'Bấm nghe chậm. Chú ý nguyên âm (dài hay ngắn) và phụ âm cuối.',explanation:`Từ được đọc là “${a}”. Ba từ dễ nhầm: ${set.join(' – ')}.`}}};
arcadeGames.push(['minpair',practiceGames.minpair.icon,practiceGames.minpair.title,practiceGames.minpair.intro,15]);
gameSubjects.find(([s])=>s==='Tiếng Anh')[1].push('minpair','speakecho','speakshadow','speakchat','speaktwister');

let spk=null;
Games.on(['speakecho','speakshadow','speakchat','speaktwister'],function(type){
  const key={speakecho:'echo',speakshadow:'shadow',speakchat:'chat',speaktwister:'twister'}[type];
  const g=SPK_GAMES[key];spk={slot:activeSlot,type,g,items:g.items(),i:0,first:0,tries:0,busy:false,done:false};
  adventureDialog.innerHTML=`<h2>${g.icon} ${g.title}</h2><p>${g.intro}</p>
  <ul class="muted"><li>🎤 Bấm nút micro, cho phép trình duyệt dùng micro, rồi nói.</li><li>Nói sai <b>không bị trừ xu</b>. Cứ thử là có xu!</li><li>${SPK_SR?'Máy này nhận diện được giọng nói.':'Máy này chưa nhận diện được giọng nói → em đọc to rồi tự bấm “Em đã đọc to”.'}</li></ul>
  <p>${g.n} câu · thưởng theo công sức, thêm tối đa +5 cho câu nói chuẩn ngay lần đầu.</p><button id="spkBegin">Bắt đầu</button><button class="secondary close-mini">Đóng</button>`;
  $('spkBegin').onclick=spkDraw;adventureDialog.querySelector('.close-mini').onclick=()=>adventureDialog.close();
  if(!adventureDialog.open)adventureDialog.showModal();
});
function spkDraw(){
  const s=spk;if(!s||s.slot!==activeSlot)return;const it=s.items[s.i];
  adventureDialog.innerHTML=`<div class="eyebrow">CÂU ${s.i+1}/${s.g.n}${s.first?' · ⭐'.repeat(Math.min(3,s.first)):''}</div>
  <p class="practice-word"><span aria-hidden="true">${it.emoji}</span>${it.say}</p><p class="muted">${it.vi}${it.model?`<br>Gợi ý trả lời: <i>${it.model}</i>`:''}</p>
  <div class="actions"><button class="secondary" data-say="${it.say.replace(/"/g,'')}">🔈 Nghe</button><button class="secondary" data-say="${it.say.replace(/"/g,'')}" data-rate="0.5">🐢 Nghe chậm</button></div>
  <button class="spk-mic" id="spkMic">🎤 Nhấn và nói</button><p id="spkMsg" class="muted" role="status">${it.reply?'Trả lời bằng tiếng Anh nhé.':'Nghe rồi nói theo nhé.'}</p>
  <button id="spkNext" hidden>${s.i===s.g.n-1?'Nhận xu':'Câu tiếp theo →'}</button>
  <button class="secondary" id="spkSelf">🙋 Em đã đọc to (không dùng micro)</button><button class="secondary close-mini">Đóng</button>`;
  s.tries=0;s.busy=false;s.done=false;
  if(s.g.any){setTimeout(()=>engSay(it.say),250)}
  $('spkMic').onclick=async()=>{
    if(spk!==s||s.busy||s.done)return;s.busy=true;$('spkMic').textContent='🎙️ Đang nghe… nói đi nào!';$('spkMic').classList.add('on');
    const r=await spkListen();if(spk!==s||s.slot!==activeSlot)return;
    s.busy=false;$('spkMic').classList.remove('on');$('spkMic').textContent='🎤 Nhấn và nói';
    if(!r.ok)return spkMsg(r.reason==='silent'?'Mình chưa nghe thấy gì. Nói to hơn một chút rồi bấm lại nhé! 🙂':r.reason==='denied'?'Trình duyệt chưa cho phép micro. Em bấm “Em đã đọc to” để vẫn nhận xu nhé.':'Máy chưa nhận diện được giọng nói. Em bấm “Em đã đọc to” nhé.');
    const heard=r.alts[0]||'';if(!heard.trim())return spkMsg('Mình chưa nghe thấy gì. Nói to hơn một chút rồi bấm lại nhé! 🙂');const score=s.g.any?(spkNorm(heard).length?1:0):spkScore(it.say,r.alts);
    if(score>=s.g.thr&&score>0||(s.g.any&&heard))spkPass(s.tries===0,heard,score);
    else{s.tries++;if(s.tries<2)spkMsg(`Gần đúng rồi! Mình nghe được: “${heard}”. Nghe lại rồi thử lần nữa nhé 💪`);else spkEnd(`Không sao đâu, ai cũng cần luyện tập! Câu này là “${it.say}”. Mình thử câu tiếp nhé.`)}
  };
  $('spkSelf').onclick=()=>{if(spk===s&&!s.done)spkPass(s.tries===0,'',1)};
  $('spkNext').onclick=()=>{if(s.i===s.g.n-1)return spkFinish();s.i++;spkDraw()};
  adventureDialog.querySelector('.close-mini').onclick=()=>adventureDialog.close();
}
function spkMsg(t){const m=$('spkMsg');if(m)m.textContent=t}
function spkEnd(t){const s=spk;s.done=true;spkMsg(t);$('spkNext').hidden=false;$('spkNext').focus();$('spkMic').disabled=true;$('spkSelf').hidden=true}
function spkPass(firstTry,heard,score){
  const s=spk,it=s.items[s.i];if(firstTry)s.first++;
  const stars=it.twist?` ${'⭐'.repeat(Math.max(1,Math.round(score*3)))}`:'';
  spkEnd(`${SPK_PRAISE[rand(SPK_PRAISE.length)]}${stars}${heard?` Mình nghe: “${heard}”.`:''}`);sound('reward');
}
function spkFinish(){
  const s=spk;if(!s||s.slot!==activeSlot)return;
  const backup=SaveStore.copy(state),coins=Balance.pay(state,day(),s.type,s.first);
  state.coins+=coins;recordEvent('mini');recordEvent('mini_'+s.type);
  if(!save()){state=backup;return}
  $('coins').textContent=state.coins;spk=null;
  adventureDialog.innerHTML=`<h2>🏆 Dũng cảm lắm! +${coins} xu</h2><p>Em đã nói tiếng Anh ${s.g.n} lần hôm nay. Mỗi lần nói là một bước tiến! ${s.first}/${s.g.n} câu chuẩn ngay lần đầu.</p><button id="spkAgain">Chơi tiếp</button><button class="secondary" id="spkHome">Đóng</button>`;
  $('spkAgain').onclick=()=>startMini(s.type);$('spkHome').onclick=()=>{adventureDialog.close();render()};bindJourneyReturn($('spkHome'));sound('reward');burst();
}
adventureDialog.addEventListener('close',()=>{spk=null;try{speechSynthesis.cancel()}catch(e){}});
