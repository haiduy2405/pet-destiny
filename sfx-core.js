/* Âm thanh game: công thức tiếng (dữ liệu thuần), tần số nốt, phân loại lời phản hồi, giới hạn tần suất.
   Engine WebAudio nằm trong sfx.js. Tất cả được giữ NHỎ và NGẮN để game sinh động mà không ồn. */
const Sfx=(()=>{
 const LETTERS={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
 /* tần số nốt: freq('C',4)=261.63 (Đô giữa) */
 const freq=(letter,octave=4)=>{const s=LETTERS[String(letter).toUpperCase()];if(s===undefined)throw Error('Nốt không hợp lệ');return 440*2**((12*(octave+1)+s-69)/12)};
 const midi=m=>440*2**((m-69)/12);
 /* mỗi nốt: f (Hz, hoặc [từ,đến] để trượt), t bắt đầu (s), d dài (s), w kiểu sóng, g âm lượng, b=true thêm họa âm kiểu chuông */
 const chime=(f,t,d,g=.1)=>({f,t,d,w:'sine',g,b:true});
 const recipes={
  tap:[{f:[1100,800],t:0,d:.035,w:'triangle',g:.04}],
  flip:[{f:[700,950],t:0,d:.05,w:'triangle',g:.05}],
  nav:[{f:[520,760],t:0,d:.07,w:'sine',g:.045}],
  good:[chime(784,0,.14,.09),chime(1047,.09,.26,.09)],
  bad:[{f:330,t:0,d:.13,w:'triangle',g:.065},{f:262,t:.1,d:.2,w:'triangle',g:.055}],
  win:[chime(523,0,.16,.08),chime(659,.09,.16,.08),chime(784,.18,.16,.08),chime(1047,.27,.2,.09),chime(523,.4,.55,.06),chime(784,.4,.55,.06),chime(1047,.4,.55,.07)],
  coin:[{f:1568,t:0,d:.07,w:'sine',g:.05},{f:2093,t:.06,d:.2,w:'sine',g:.05,b:true}],
  spend:[{f:[620,420],t:0,d:.09,w:'triangle',g:.045}],
  plant:[{f:[300,720],t:0,d:.12,w:'sine',g:.08},{f:880,t:.1,d:.1,w:'sine',g:.05}],
  water:[{f:[480,900],t:0,d:.07,w:'sine',g:.05},{f:[520,980],t:.1,d:.08,w:'sine',g:.045},{f:[560,1040],t:.2,d:.08,w:'sine',g:.04}],
  harvest:[chime(523,0,.1,.08),chime(659,.07,.1,.08),chime(784,.14,.22,.08)],
  pet:[chime(659,0,.1,.08),chime(880,.08,.22,.08)],
  reward:null, /* alias của win, gán bên dưới */
  shake:[0,.11,.22,.33,.44,.55].map((t,i)=>({f:170+i*14,t,d:.06,w:'triangle',g:.06})),
  egg:[{f:[260,210],t:0,d:.05,w:'triangle',g:.07},{f:[260,210],t:.12,d:.05,w:'triangle',g:.07},{f:[300,240],t:.26,d:.06,w:'triangle',g:.08},chime(1319,.4,.3,.07)],
  reveal_rare:[chime(659,0,.12,.09),chime(880,.1,.12,.09),chime(1175,.2,.12,.09),chime(1568,.3,.4,.1)],
  reveal_epic:[chime(523,0,.12,.09),chime(659,.1,.12,.09),chime(784,.2,.12,.09),chime(1047,.3,.12,.09),chime(1319,.4,.14,.1),chime(1568,.5,.14,.1),chime(2093,.6,.6,.11),chime(784,.6,.6,.07),chime(1047,.6,.6,.07)],
  place:[{f:[400,260],t:0,d:.07,w:'triangle',g:.07}],
  drum:[{f:[190,95],t:0,d:.12,w:'triangle',g:.16}]
 };
 recipes.reward=recipes.win;
 /* nhóm giới hạn: cùng nhóm không phát lại trong khoảng minGap ms */
 const gaps={tap:45,flip:60,nav:120,good:140,bad:140,win:900,reward:900,coin:260,spend:200,plant:150,water:120,harvest:150,pet:150,shake:600,egg:300,reveal_rare:600,reveal_epic:600,place:100,drum:70};
 const alias={reward:'win'};
 const group=n=>alias[n]||n;
 function shouldPlay(name,at,last){
  const g=group(name),min=gaps[name]??80;
  if(last[g]!==undefined&&at-last[g]<min)return false;
  last[g]=at;return true;
 }

 /* ---- mẫu âm thật (CC0 "organic" của UI SFX); thiếu/đang tải thì dùng tiếng tổng hợp ở trên ---- */
 const samples={
  tap:['press',.32],flip:['snap',.4],nav:['forward',.4],good:['check',.55],bad:['blocked',.45],
  win:['level-up',.65],coin:['receive',.42],spend:['purchase',.38],plant:['drop',.55],harvest:['bonus',.55],
  pet:['reaction',.5],egg:['unlock',.55],reveal_rare:['badge',.6],reveal_epic:['achievement',.7],place:['snap',.45]};
 samples.reward=samples.win;
 const uiFile=cue=>`audio/ui/${cue}.mp3`;
 /* Salamander Grand Piano (CC BY 3.0): mỗi quãng tám lấy nốt Đô và Fa thăng, dịch cao độ bằng playbackRate (tối đa ±3 nửa cung) */
 const pianoMidi=[[36,'C2'],[42,'Fs2'],[48,'C3'],[54,'Fs3'],[60,'C4'],[66,'Fs4'],[72,'C5'],[78,'Fs5'],[84,'C6']];
 const pianoFile=n=>`audio/piano/${n}.mp3`;
 const toMidi=f=>69+12*Math.log2(f/440);
 function nearestPiano(freq){
  const m=toMidi(freq);let best=pianoMidi[0];
  for(const p of pianoMidi)if(Math.abs(p[0]-m)<Math.abs(best[0]-m))best=p;
  return {name:best[1],midi:best[0],rate:2**((m-best[0])/12),shift:m-best[0]};
 }
 const MAX_VOICES=14;
 /* phân loại câu phản hồi hiển thị trong game */
 const GOOD=/^(Đúng|Chính xác|Tuyệt|Giỏi|Chuẩn|Xuất sắc)/i,BAD=/^(Chưa|Thử|Sai|Hãy tìm|Hãy chọn|Đó là chiếc lá|Không đúng|Gần đúng)/i;
 function classify(text){
  const t=String(text||'').trim();
  if(!t)return null;
  if(GOOD.test(t))return 'good';
  if(BAD.test(t))return 'bad';
  return null;
 }
 const total=n=>{const r=recipes[n];return r?Math.max(...r.map(x=>x.t+x.d)):0};
 return {freq,midi,recipes,gaps,group,shouldPlay,classify,total,MAX_VOICES,samples,uiFile,pianoMidi,pianoFile,nearestPiano,toMidi};
})();
