/* Engine âm thanh (WebAudio tổng hợp, không cần file): thay sound() và musicPlay(), thêm tiếng phím đàn, đúng/sai, xu, chuyển tab.
   Công thức + giới hạn tần suất: sfx-core.js. Load sau mobile.js/music.js/prosperity.js, trước rewards.js. */
let sfxCtx=null,sfxMaster=null,sfxVoices=0,sfxLastClick=0;const sfxLast={};
if(localStorage.getItem('pet-destiny-sound')===null)soundOn=true; /* mặc định BẬT; người chơi vẫn tắt được bằng nút 🔊 */
function sfxEnsure(){
  if(!sfxCtx){
    const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;
    sfxCtx=new C();const comp=sfxCtx.createDynamicsCompressor();comp.threshold.value=-18;comp.ratio.value=6;
    sfxMaster=sfxCtx.createGain();sfxMaster.gain.value=.85;sfxMaster.connect(comp);comp.connect(sfxCtx.destination);
  }
  if(sfxCtx.state==='suspended')sfxCtx.resume().catch(()=>{});
  return sfxCtx;
}
/* 1 giọng: dạng sóng + (tuỳ chọn) họa âm chuông; bao hình tấn công nhanh, tắt dần */
function sfxVoice(freq,start,dur,wave,gain,bell){
  const ctx=sfxCtx;if(!ctx||sfxVoices>=Sfx.MAX_VOICES*2)return;
  const from=Array.isArray(freq)?freq[0]:freq,to=Array.isArray(freq)?freq[1]:freq;
  const mk=(mult,g,w)=>{
    const o=ctx.createOscillator(),a=ctx.createGain();o.type=w;
    o.frequency.setValueAtTime(from*mult,start);if(to!==from)o.frequency.exponentialRampToValueAtTime(to*mult,start+dur);
    a.gain.setValueAtTime(0.0001,start);a.gain.linearRampToValueAtTime(g,start+Math.min(.012,dur/3));a.gain.exponentialRampToValueAtTime(0.0001,start+dur);
    o.connect(a);a.connect(sfxMaster);o.start(start);o.stop(start+dur+.03);sfxVoices++;o.onended=()=>{sfxVoices--};
  };
  mk(1,gain,wave);if(bell)mk(2,gain*.28,'sine');
}
function sfxPlay(name){
  if(!soundOn)return;
  const r=Sfx.recipes[name],at=performance.now();if(!r)return;
  /* tiếng xu không chồng lên màn thắng vừa phát */
  if(name==='coin'&&sfxLast.win!==undefined&&at-sfxLast.win<800)return;
  if(!Sfx.shouldPlay(name,at,sfxLast))return;
  try{const ctx=sfxEnsure();if(!ctx)return;const t0=ctx.currentTime+.005;for(const n of r)sfxVoice(n.f,t0+n.t,n.d,n.w,n.g,n.b)}catch{}
}
/* nốt đàn: thân + họa âm 2,3,4, tắt dần ~1 giây */
function sfxPiano(freq,delay=0,dur=1.05,gain=.17){
  try{
    const ctx=sfxEnsure();if(!ctx)return;const t=ctx.currentTime+.005+delay;
    [[1,'triangle',1],[2,'sine',.38],[3,'sine',.16],[4,'sine',.07]].forEach(([m,w,k])=>{
      if(sfxVoices>=Sfx.MAX_VOICES*2)return;
      const o=ctx.createOscillator(),a=ctx.createGain(),d=dur/(1+(m-1)*.45);o.type=w;o.frequency.value=freq*m;
      a.gain.setValueAtTime(0.0001,t);a.gain.linearRampToValueAtTime(gain*k,t+.008);a.gain.exponentialRampToValueAtTime(0.0001,t+d);
      o.connect(a);a.connect(sfxMaster);o.start(t);o.stop(t+d+.03);sfxVoices++;o.onended=()=>{sfxVoices--};
    });
  }catch{}
}
/* ---- thay các hàm âm thanh cũ ---- */
sound=function(kind='tap'){
  /* nút bấm đã có tiếng chạm riêng (listener bên dưới), nên bỏ tiếng 'tap' cũ để khỏi chồng */
  if(kind==='tap'&&Date.now()-sfxLastClick<500)return;
  sfxPlay(Sfx.recipes[kind]?kind:'tap');
};
musicPlay=function(notes){
  /* nghe nốt là hoạt động chính của bài nhạc: luôn phát, kể cả khi âm thanh nền đang tắt */
  try{
    if(!sfxEnsure())throw Error('no audio');
    notes.forEach((n,i)=>sfxPiano(n.frequency,i*.5,.95,.2));
  }catch{notice('Trình duyệt chưa phát được âm thanh. Bạn vẫn có thể luyện bằng hình.')}
};
/* ---- tiếng khi người chơi chạm ---- */
const sfxLetters='CDEFGAB';
document.addEventListener('pointerdown',()=>{sfxLastClick=Date.now();sfxEnsure()},{capture:true,passive:true});
document.addEventListener('keydown',()=>{sfxLastClick=Date.now()},{capture:true,passive:true});
document.addEventListener('click',e=>{
  const b=e.target.closest&&e.target.closest('button');if(!b||b.disabled)return;
  if(b.dataset.noteAnswer!==undefined){if(soundOn)sfxPiano(Sfx.freq(sfxLetters[Number(b.dataset.noteAnswer)]||'C',4));return}
  if(b.dataset.earNote!==undefined){if(soundOn&&typeof earNotes==='function'){const n=earNotes()[Number(b.dataset.earNote)];if(n)sfxPiano(n.frequency)}return}
  if(b.dataset.rhythm!==undefined){const k=Math.min(4,Math.max(1,Number(b.dataset.rhythm)||1));for(let i=0;i<k;i++)setTimeout(()=>sfxPlay('drum'),i*170);return}
  if(b.closest('#nav')){sfxPlay('nav');return}
  if(b.dataset.card!==undefined){sfxPlay('flip');return}
  sfxPlay('tap');
},true);
/* ---- tiếng theo kết quả: đọc lời phản hồi, xu tăng/giảm, màn thắng ---- */
const sfxSeen=new Map();
function sfxFeedback(el){
  const text=el.textContent,kind=Sfx.classify(text);if(!kind)return;
  const key=el.id||el.className||'x',prev=sfxSeen.get(key);
  if(prev&&prev.text===text&&Date.now()-prev.at<400)return;
  sfxSeen.set(key,{text,at:Date.now()});sfxPlay(kind);
}
const sfxSel='[role=status],[id$=Feedback],#miniStatus,.music-feedback';
let sfxCoins=null;
new MutationObserver(list=>{
  for(const m of list){
    const el=m.target.nodeType===3?m.target.parentElement:m.target.nodeType===1?m.target:null;if(!el)continue;
    if(el.id==='coins'||(el.closest&&el.closest('#coins'))){
      const v=parseInt(String($('coins')?.textContent||'').replace(/\D/g,''),10);
      if(Number.isFinite(v)){if(sfxCoins!==null&&Date.now()-sfxLastClick<4000){if(v>sfxCoins)sfxPlay('coin');else if(v<sfxCoins)sfxPlay('spend')}sfxCoins=v}
      continue;
    }
    const st=el.closest&&el.closest(sfxSel);if(st&&m.type!=='childList'||(st&&m.type==='childList'))sfxFeedback(st);
    if(m.type==='childList')for(const n of m.addedNodes){
      if(n.nodeType!==1)continue;
      n.querySelectorAll?.(sfxSel).forEach(sfxFeedback);
      if(el.id==='adventureDialog'&&(n.matches?.('.mini-win')||n.querySelector?.('.mini-win')))sfxPlay('win');
    }
  }
}).observe(document.body,{subtree:true,childList:true,characterData:true});
document.addEventListener('visibilitychange',()=>{if(!sfxCtx)return;document.hidden?sfxCtx.suspend().catch(()=>{}):sfxCtx.resume().catch(()=>{})});
