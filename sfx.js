/* Engine âm thanh (WebAudio tổng hợp, không cần file): thay sound() và musicPlay(), thêm tiếng phím đàn, đúng/sai, xu, chuyển tab.
   Công thức + giới hạn tần suất: sfx-core.js. Load sau mobile.js/music.js/prosperity.js, trước rewards.js. */
let sfxCtx=null,sfxMaster=null,sfxReverb=null,sfxVoices=0,sfxLastClick=0;const sfxLast={},sfxDir=Sfx.newDirector();
if(localStorage.getItem('pet-destiny-sound')===null)soundOn=true; /* mặc định BẬT; người chơi vẫn chỉnh được bằng nút loa */
/* mức âm lượng 0..3 (Tắt/Nhẹ/Vừa/To), nhớ lại lần sau; soundOn (cũ) = mức > 0 */
let sfxLevel=(()=>{try{const v=Number(localStorage.getItem('pet-destiny-volume'));if(localStorage.getItem('pet-destiny-volume')!==null&&v>=0&&v<=3)return v}catch{}return soundOn?2:0})();
soundOn=sfxLevel>0;
const sfxGain=()=>.8*Sfx.LEVELS[sfxLevel].v;
function sfxApplyLevel(){soundOn=sfxLevel>0;if(sfxMaster&&sfxCtx)sfxMaster.gain.setTargetAtTime(sfxGain(),sfxCtx.currentTime,.03)}
function sfxIcon(){return Sfx.LEVELS[sfxLevel].i}
function sfxLabel(){return 'Âm lượng: '+Sfx.LEVELS[sfxLevel].n+' (bấm để đổi)'}
function sfxCycleLevel(){
  sfxLevel=(sfxLevel+1)%Sfx.LEVELS.length;try{localStorage.setItem('pet-destiny-volume',String(sfxLevel));localStorage.setItem('pet-destiny-sound',sfxLevel>0?'on':'off')}catch{}
  sfxApplyLevel();if(sfxLevel>0){sfxEnsure();sfxApplyLevel();sfxPlay('coin')}
}
/* hồ âm nhỏ (tự tạo xung phản hồi, không cần file): làm chuông và đàn "tròn" hơn thay vì khô và chói */
function sfxMakeReverb(ctx){
  const len=Math.floor(ctx.sampleRate*1.1),buf=ctx.createBuffer(2,len,ctx.sampleRate);
  for(let c=0;c<2;c++){const d=buf.getChannelData(c);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,3.2)}
  const cv=ctx.createConvolver();cv.buffer=buf;return cv;
}
function sfxEnsure(){
  if(!sfxCtx){
    const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;
    sfxCtx=new C();const comp=sfxCtx.createDynamicsCompressor();comp.threshold.value=-20;comp.knee.value=18;comp.ratio.value=5;comp.attack.value=.004;comp.release.value=.18;
    const soft=sfxCtx.createBiquadFilter();soft.type='lowpass';soft.frequency.value=9000;soft.Q.value=.5; /* cắt bớt chói ở dải cao */
    sfxMaster=sfxCtx.createGain();sfxMaster.gain.value=sfxGain();
    sfxMaster.connect(soft);soft.connect(comp);comp.connect(sfxCtx.destination);
    try{sfxReverb=sfxMakeReverb(sfxCtx);const wet=sfxCtx.createGain();wet.gain.value=.9;sfxReverb.connect(wet);wet.connect(sfxMaster)}catch{sfxReverb=null}
  }
  if(sfxCtx.state==='suspended')sfxCtx.resume().catch(()=>{});
  return sfxCtx;
}
/* ---- mẫu âm thật: tải nền sau lần chạm đầu tiên; chưa tải xong thì dùng tiếng tổng hợp ---- */
const sfxBuf={},sfxLoading={};
function sfxLoad(url){
  if(sfxBuf[url]||sfxLoading[url]||!sfxCtx)return;
  sfxLoading[url]=true;
  fetch(url).then(r=>r.ok?r.arrayBuffer():Promise.reject()).then(data=>new Promise((ok,no)=>{const p=sfxCtx.decodeAudioData(data,ok,no);if(p&&p.catch)p.catch(no)}))
    .then(buf=>{sfxBuf[url]=buf}).catch(()=>{}).finally(()=>{delete sfxLoading[url]});
}
let sfxPreloaded=false;
function sfxPreload(){
  if(sfxPreloaded||!sfxCtx)return;sfxPreloaded=true;
  new Set(Object.values(Sfx.samples).map(x=>x[0])).forEach(c=>sfxLoad(Sfx.uiFile(c)));
  setTimeout(()=>Sfx.pianoMidi.forEach(([,n])=>sfxLoad(Sfx.pianoFile(n))),1200);
}
function sfxSample(buf,vol,rate=1,dur=0,wet=0){
  const ctx=sfxCtx;if(sfxVoices>=Sfx.MAX_VOICES*2)return;
  const src=ctx.createBufferSource(),g=ctx.createGain(),t=ctx.currentTime+.005;src.buffer=buf;src.playbackRate.value=rate;
  g.gain.setValueAtTime(vol,t);
  if(wet>0&&sfxReverb){const send=ctx.createGain();send.gain.value=wet;g.connect(send);send.connect(sfxReverb)}
  if(dur&&dur<buf.duration/rate){g.gain.setValueAtTime(vol,t+Math.max(0,dur-.18));g.gain.linearRampToValueAtTime(0.0001,t+dur)}
  src.connect(g);g.connect(sfxMaster);src.start(t);sfxVoices++;src.onended=()=>{sfxVoices--};
}
/* 1 giọng: dạng sóng + (tuỳ chọn) họa âm chuông; bao hình tấn công nhanh, tắt dần */
function sfxVoice(freq,start,dur,wave,gain,bell){
  const ctx=sfxCtx;if(!ctx||sfxVoices>=Sfx.MAX_VOICES*2)return;
  const from=Array.isArray(freq)?freq[0]:freq,to=Array.isArray(freq)?freq[1]:freq;
  const mk=(mult,g,w)=>{
    const o=ctx.createOscillator(),a=ctx.createGain();o.type=w;
    o.frequency.setValueAtTime(from*mult,start);if(to!==from)o.frequency.exponentialRampToValueAtTime(to*mult,start+dur);
    a.gain.setValueAtTime(0.0001,start);a.gain.linearRampToValueAtTime(g,start+Math.min(.012,dur/3));a.gain.exponentialRampToValueAtTime(0.0001,start+dur);
    o.connect(a);a.connect(sfxMaster);
    if(bell&&sfxReverb){const send=ctx.createGain();send.gain.value=.35;a.connect(send);send.connect(sfxReverb)}
    o.start(start);o.stop(start+dur+.03);sfxVoices++;o.onended=()=>{sfxVoices--};
  };
  mk(1,gain,wave);if(bell)mk(2,gain*.28,'sine');
}
const sfxWetCue=new Set(['good','win','reward','coin','harvest','pet','egg','reveal_rare','reveal_epic','catch']);
function sfxHaptic(name){
  try{if(!soundOn||!navigator.vibrate||matchMedia('(prefers-reduced-motion: reduce)').matches)return;const h=Sfx.HAPTIC[name];if(h)navigator.vibrate(h)}catch{}
}
/* mọi tiếng đi qua đây: giới hạn tần suất → bộ điều phối (ưu tiên/dời/bỏ) → phát */
let sfxPendingUI=0;
function sfxPlay(name,fromDefer){
  if(!soundOn)return;
  /* tiếng nút/giao diện chờ 40ms: nếu ngay sau đó có tiếng kết quả (xu, đúng/sai, thưởng) thì bỏ tiếng nút, khỏi chồng lên nhau */
  const pri=Sfx.PRI[name]||2;
  if(pri>=3)clearTimeout(sfxPendingUI);
  const r=Sfx.recipes[name],at=performance.now();if(!r)return;
  /* tiếng xu không chồng lên màn thắng vừa phát */
  if(name==='coin'&&sfxLast.win!==undefined&&at-sfxLast.win<800)return;
  if(!fromDefer&&!Sfx.shouldPlay(name,at,sfxLast))return;
  if(pri===1&&!fromDefer){clearTimeout(sfxPendingUI);sfxPendingUI=setTimeout(()=>sfxPlay(name,true),40);return}
  const d=Sfx.decide(name,at,sfxDir,!!fromDefer);
  if(d.act==='drop')return;
  if(d.act==='defer'){setTimeout(()=>sfxPlay(name,true),d.ms);return}
  sfxHaptic(name);
  try{
    const ctx=sfxEnsure();if(!ctx)return;
    const sm=Sfx.samples[name],buf=sm&&sfxBuf[Sfx.uiFile(sm[0])];
    if(buf){sfxSample(buf,sm[1],name==='tap'?1+(Math.random()-.5)*.08:1,0,sfxWetCue.has(name)?.18:0);return}
    const t0=ctx.currentTime+.005;for(const n of r)sfxVoice(n.f,t0+n.t,n.d,n.w,n.g,n.b);
  }catch{}
}
/* nốt đàn: thân + họa âm 2,3,4, tắt dần ~1 giây */
function sfxPiano(freq,delay=0,dur=1.05,gain=.17){
  Sfx.holdPiano(sfxDir,performance.now(),delay*1000+Math.min(dur,.9)*1000);
  try{
    const ctx=sfxEnsure();if(!ctx)return;
    const np=Sfx.nearestPiano(freq),pb=sfxBuf[Sfx.pianoFile(np.name)];
    if(pb){
      const vol=Math.min(.95,gain*4.4);
      if(delay>0)setTimeout(()=>sfxSample(pb,vol,np.rate,dur,.3),delay*1000);else sfxSample(pb,vol,np.rate,dur,.3);
      return;
    }
    const t=ctx.currentTime+.005+delay;
    [[1,'triangle',1],[2,'sine',.38],[3,'sine',.16],[4,'sine',.07]].forEach(([m,w,k])=>{
      if(sfxVoices>=Sfx.MAX_VOICES*2)return;
      const o=ctx.createOscillator(),a=ctx.createGain(),d=dur/(1+(m-1)*.45);o.type=w;o.frequency.value=freq*m;
      a.gain.setValueAtTime(0.0001,t);a.gain.linearRampToValueAtTime(gain*k,t+.008);a.gain.exponentialRampToValueAtTime(0.0001,t+d);
      o.connect(a);a.connect(sfxMaster);o.start(t);o.stop(t+d+.03);sfxVoices++;o.onended=()=>{sfxVoices--};
    });
  }catch{}
}
/* tiếng cho thông báo (toast): mobile.js gọi hàm này thay vì phát tiếng thưởng cho mọi dòng chữ */
function noticeSound(message){const k=Sfx.noticeKind(message);if(k)sfxPlay(k)}
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
document.addEventListener('pointerdown',()=>{sfxLastClick=Date.now();if(sfxEnsure())sfxPreload()},{capture:true,passive:true});
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
