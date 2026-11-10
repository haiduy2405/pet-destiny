/* Câu cá: mua cần, thuê hồ (vé theo số lượt thả), mua mồi + phụ kiện, mini game kỹ năng (chờ cá cắn → bấm đúng lúc → giữ vùng xanh theo con cá).
   Pure: không đụng DOM; thời gian/ngẫu nhiên truyền vào để test. Xu chỉ ra vào qua state.coins (mua đồ, thuê hồ, bán cá).
   Cân bằng: thưởng theo kỹ năng (cá to hơn nếu kéo giỏi), giảm dần khi thuê lại cùng một hồ trong ngày, hồ đắt khó hơn nhưng cá xịn hơn. */
const Fishing=(()=>{
 const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
 const num=(v,d=0)=>Number.isFinite(v)?v:d;
 /* ---- dữ liệu (giá, cá, độ khó) nằm trong economy-data.js ---- */
 const rods=EcoData.fishing.rods;
 /* ---- phụ kiện (mua 1 lần, dùng mãi) ---- */
 const accs=EcoData.fishing.accs;
 /* ---- mồi: dùng 1 cái mỗi lượt thả. boost>1 → dễ ra cá hiếm hơn ---- */
 const baits=EcoData.fishing.baits;
 const E=EcoData.fishing,BAIT_PACK=E.baitPack,BAIT_CAP=E.baitCap;
 /* ---- hồ: vé = số lượt thả. diff: độ khó kỹ năng (cá nhanh/nhảy hơn, vùng xanh hẹp lại) ---- */
 const lakes=E.lakes;
 const find=(arr,id)=>arr.find(x=>x.id===id);
 const rod=id=>find(rods,id),acc=id=>find(accs,id),bait=id=>find(baits,id),lake=id=>find(lakes,id);
 const allFish=()=>lakes.flatMap(l=>l.fish.map(f=>({...f,lake:l.id})));
 const fishInfo=id=>allFish().find(f=>f.id===id);
 /* hồ rẻ hơn thuê lại lần 2, 3... trong ngày thì cá bán rẻ dần (tránh cày 1 chỗ) */
 const DECAY=E.decay;
 const BUCKET_CAP=E.bucketCap,FIRST_BONUS=E.firstBonus;

 function normalize(s){
  const f=(s.fishing&&typeof s.fishing==='object'&&!Array.isArray(s.fishing))?s.fishing:(s.fishing={});
  f.rod=rod(f.rod)?f.rod:null;
  const a=(f.acc&&typeof f.acc==='object'&&!Array.isArray(f.acc))?f.acc:{};f.acc={};for(const x of accs)f.acc[x.id]=!!a[x.id];
  const b=(f.bait&&typeof f.bait==='object'&&!Array.isArray(f.bait))?f.bait:{};f.bait={};for(const x of baits)f.bait[x.id]=clamp(Math.floor(num(b[x.id])),0,BAIT_CAP);
  f.pick=bait(f.pick)?f.pick:'worm';
  f.bucket=Array.isArray(f.bucket)?f.bucket.filter(x=>x&&fishInfo(x.f)&&Number.isFinite(x.v)&&x.v>0).slice(0,BUCKET_CAP).map(x=>({f:x.f,v:Math.round(x.v),cm:Math.max(1,Math.round(num(x.cm,1)))})):[];
  const t=f.ticket;f.ticket=t&&typeof t==='object'&&lake(t.lake)&&num(t.left,-1)>=0?{lake:t.lake,left:Math.min(lake(t.lake).casts,Math.floor(t.left)),net:!!t.net,mult:clamp(num(t.mult,1),.1,1),catches:Math.max(0,Math.floor(num(t.catches))),casts:Math.max(0,Math.floor(num(t.casts)))}:null;
  const d=(f.day&&typeof f.day==='object'&&!Array.isArray(f.day))?f.day:{};f.day={d:typeof d.d==='string'?d.d:'',n:(d.n&&typeof d.n==='object'&&!Array.isArray(d.n))?d.n:{}};
  for(const k of Object.keys(f.day.n))if(!lake(k)||!(f.day.n[k]>0))delete f.day.n[k];
  const c=(f.caught&&typeof f.caught==='object'&&!Array.isArray(f.caught))?f.caught:{};f.caught={};for(const x of allFish()){const n=Math.floor(num(c[x.id]));if(n>0)f.caught[x.id]=n}
  const r=(f.record&&typeof f.record==='object'&&!Array.isArray(f.record))?f.record:{};f.record={};for(const x of allFish())if(num(r[x.id])>0)f.record[x.id]=Math.round(r[x.id]);
  f.earned=Math.max(0,Math.floor(num(f.earned)));f.spent=Math.max(0,Math.floor(num(f.spent)));f.tickets=Math.max(0,Math.floor(num(f.tickets)));
  return f;
 }
 const ticketsToday=(s,day,id)=>{const f=normalize(s);return f.day.d===day?(f.day.n[id]||0):0};
 const decayFor=n=>DECAY[Math.min(n,DECAY.length-1)];
 const pay=(s,n)=>{s.coins-=n;normalize(s).spent+=n};
 const need=(s,n)=>s.coins>=n;
 /* ---------- cửa hàng ---------- */
 function buyRod(s,id){
  const f=normalize(s),r=rod(id);
  if(!r)return {ok:false,message:'Không có cần câu này.'};
  const have=f.rod?rods.findIndex(x=>x.id===f.rod):-1;
  if(rods.indexOf(r)<=have)return {ok:false,message:'Bạn đã có cần tốt hơn hoặc bằng cần này.'};
  if(!need(s,r.cost))return {ok:false,message:'Chưa đủ xu mua cần câu.'};
  pay(s,r.cost);f.rod=r.id;return {ok:true,paid:r.cost};
 }
 function buyAcc(s,id){
  const f=normalize(s),a=acc(id);
  if(!a)return {ok:false,message:'Không có phụ kiện này.'};
  if(f.acc[id])return {ok:false,message:'Bạn đã có phụ kiện này.'};
  if(!need(s,a.cost))return {ok:false,message:'Chưa đủ xu mua phụ kiện.'};
  pay(s,a.cost);f.acc[id]=true;return {ok:true,paid:a.cost};
 }
 /* mồi bán theo gói 5 */
 function buyBait(s,id){
  const f=normalize(s),b=bait(id);
  if(!b)return {ok:false,message:'Không có loại mồi này.'};
  if(f.bait[id]+BAIT_PACK>BAIT_CAP)return {ok:false,message:`Hộp mồi chứa tối đa ${BAIT_CAP} con mỗi loại.`};
  const cost=b.cost*BAIT_PACK;
  if(!need(s,cost))return {ok:false,message:'Chưa đủ xu mua mồi.'};
  pay(s,cost);f.bait[id]+=BAIT_PACK;return {ok:true,paid:cost,n:BAIT_PACK};
 }
 function pickBait(s,id){const f=normalize(s);if(!bait(id))return false;f.pick=id;return true}
 /* ---------- thuê hồ ---------- */
 function rent(s,id,day){
  const f=normalize(s),l=lake(id);
  if(!l)return {ok:false,message:'Không có hồ này.'};
  if(!f.rod)return {ok:false,message:'Cần mua cần câu trước đã.'};
  if(f.ticket)return {ok:false,message:'Bạn còn vé chưa dùng hết lượt.'};
  if(!need(s,l.ticket))return {ok:false,message:'Chưa đủ xu thuê hồ.'};
  if(f.day.d!==day){f.day.d=day;f.day.n={}}
  const n=f.day.n[id]||0,mult=decayFor(n);
  pay(s,l.ticket);f.day.n[id]=n+1;f.tickets++;
  f.ticket={lake:id,left:l.casts,net:false,mult,catches:0,casts:0};
  return {ok:true,paid:l.ticket,mult,n:n+1};
 }
 function activeBait(s){const f=normalize(s);if(f.bait[f.pick]>0)return f.pick;const o=baits.find(b=>f.bait[b.id]>0);return o?o.id:null}
 /* chờ cá cắn: bắt đầu một lượt thả (trừ 1 mồi, 1 lượt) */
 function cast(s,baitId,rnd=Math.random){
  const f=normalize(s),t=f.ticket,b=bait(baitId);
  if(!t)return {ok:false,message:'Hãy thuê hồ trước.'};
  if(!b||f.bait[baitId]<=0)return {ok:false,message:'Hết mồi rồi, hãy mua thêm.'};
  const l=lake(t.lake);
  f.bait[baitId]--;t.left--;t.casts++;
  const wait=l.wait[0]+rnd()*(l.wait[1]-l.wait[0]);
  return {ok:true,bait:baitId,wait,window:l.window*(f.acc.float?1.5:1),warn:f.acc.glasses?.5:0,left:t.left};
 }
 /* kết quả bấm giật cần: t = thời điểm bấm (giây từ lúc thả), cá cắn ở `wait`, được `window` giây */
 const judgeHook=(t,wait,window)=>t<wait?'early':t<=wait+window?'ok':'late';
 /* chọn cá theo trọng số; mồi tốt làm cá hiếm (cuối danh sách) dễ ra hơn */
 function weights(lakeId,baitId){
  const l=lake(lakeId),b=bait(baitId)||baits[0],n=l.fish.length;
  return l.fish.map((x,i)=>x.w*(1+(b.boost-1)*(n>1?i/(n-1):0)));
 }
 function pickFish(lakeId,baitId,rnd=Math.random){
  const l=lake(lakeId),w=weights(lakeId,baitId);let r=rnd()*w.reduce((a,x)=>a+x,0);
  for(let i=0;i<w.length;i++){r-=w[i];if(r<0)return l.fish[i]}
  return l.fish[l.fish.length-1];
 }
 /* kỳ vọng giá trị 1 lượt thả thành công (trước hệ số giảm theo ngày, giá trị trung bình) */
 function expectedValue(lakeId,baitId){
  const l=lake(lakeId),w=weights(lakeId,baitId),tot=w.reduce((a,x)=>a+x,0);
  return l.fish.reduce((a,x,i)=>a+x.v*w[i]/tot,0);
 }
 /* ---------- mini game kéo cá ---------- */
 /* tham số vật lý cho 1 con cá ở 1 hồ với 1 cần */
 function reelParams(lakeId,fishId,rodId){
  const l=lake(lakeId),fi=find(l.fish,fishId)||l.fish[0],r=rod(rodId)||rods[0],k=l.reel;
  return {h:r.zone*k.zone,speed:k.speed*fi.pw,dart:clamp(k.dart*fi.pw,0,.6),gain:k.gain,loss:k.loss*(.9+.1*fi.pw),maxT:k.maxT,up:2.6,grav:2.1,vmax:1.15};
 }
 /* vị trí: 0 = đáy, 1 = mặt nước. z = đáy vùng xanh, f = vị trí cá (tâm) */
 function reelStart(p,rnd=Math.random){
  return {p,z:0,zv:0,f:clamp(.55+rnd()*.3,.1,.9),tgt:.5,tspd:p.speed,tt:0,prog:.4,T:0,inT:0,over:null,quality:0};
 }
 function reelStep(r,dt,hold,rnd=Math.random){
  if(r.over)return r;
  const p=r.p;
  r.zv=clamp(r.zv+(hold?p.up:-p.grav)*dt,-p.vmax,p.vmax);
  r.z+=r.zv*dt;
  const top=1-p.h;
  if(r.z<0){r.z=0;r.zv=r.zv<0?-r.zv*.25:r.zv}
  if(r.z>top){r.z=top;r.zv=r.zv>0?-r.zv*.25:r.zv}
  r.tt-=dt;
  if(r.tt<=0){
   const dart=rnd()<p.dart;
   r.tgt=dart?(r.f>.5?.08+rnd()*.3:.62+rnd()*.3):.22+rnd()*.56; /* cá bơi quanh tầng giữa: ôm đáy hay ôm mặt đều không bắt được, phải giữ cần vừa phải */
   r.tspd=p.speed*(dart?1.9:1)*(.8+rnd()*.4);
   r.tt=dart?.35+rnd()*.5:.7+rnd()*1.3;
  }
  const d=r.tgt-r.f,stp=r.tspd*dt;r.f+=Math.abs(d)<=stp?d:Math.sign(d)*stp;
  const inside=r.f>=r.z&&r.f<=r.z+p.h;
  /* đỡ người mới: tiến độ sắp cạn thì cá tuột chậm lại (còn thời gian sửa tay), tiến độ khá thì mất bình thường */
  const lossNow=p.loss*(.5+.5*clamp(r.prog/.3,0,1));
  r.prog=clamp(r.prog+(inside?p.gain:-lossNow)*dt,0,1);
  r.T+=dt;if(inside)r.inT+=dt;
  if(r.prog>=1){r.over='caught';r.quality=r.T>0?r.inT/r.T:1}
  else if(r.prog<=0||r.T>=p.maxT)r.over='escaped';
  return r;
 }
 /* tuột cá: có lưới vợt và chưa dùng trong vé này → cho kéo lại từ 35% */
 function rescue(s,r){
  const f=normalize(s),t=f.ticket;
  if(!t||t.net||!f.acc.net||r.over!=='escaped')return false;
  t.net=true;r.over=null;r.prog=.35;r.T=Math.min(r.T,r.p.maxT-8);return true;
 }
 /* ---------- bắt được / hết lượt / bán ---------- */
 /* quality 0..1 → cá to hơn 80%–130% và đáng tiền hơn 80%–120% */
 function land(s,fishId,quality=.7){
  const f=normalize(s),t=f.ticket,fi=fishInfo(fishId);
  if(!t||!fi)return {ok:false,message:'Không có cá để nhận.'};
  const q=clamp(num(quality,.7),0,1),cm=Math.round(fi.cm*(.8+.5*q));
  let v=Math.max(1,Math.round(fi.v*(.8+.4*q)*t.mult));
  const isNew=!f.caught[fishId];let bonus=0;
  if(isNew){bonus=Math.max(2,Math.round(fi.v*FIRST_BONUS));s.coins+=bonus;f.earned+=bonus}
  f.caught[fishId]=(f.caught[fishId]||0)+1;f.record[fishId]=Math.max(f.record[fishId]||0,cm);t.catches++;
  const full=f.bucket.length>=BUCKET_CAP;
  if(!full)f.bucket.push({f:fishId,v,cm});else{s.coins+=v;f.earned+=v}
  return {ok:true,fish:fi,cm,value:v,isNew,bonus,full,mult:t.mult};
 }
 /* kết thúc vé khi hết lượt (gọi sau mỗi lượt xong). Trả true nếu vé đã hết */
 function settle(s){
  const f=normalize(s),t=f.ticket;
  if(t&&t.left<=0){const out={lake:t.lake,catches:t.catches,casts:t.casts};f.ticket=null;return {done:true,...out}}
  return {done:false};
 }
 const bucketValue=s=>normalize(s).bucket.reduce((a,x)=>a+x.v,0);
 function sellAll(s){
  const f=normalize(s);
  if(!f.bucket.length)return {ok:false,message:'Giỏ cá đang trống.'};
  const coins=bucketValue(s),n=f.bucket.length;
  s.coins+=coins;f.earned+=coins;f.bucket=[];
  return {ok:true,coins,n};
 }
 /* huỷ vé còn dở (không hoàn tiền) */
 function dropTicket(s){const f=normalize(s);f.ticket=null}
 return {rods,accs,baits,lakes,rod,acc,bait,lake,fishInfo,allFish,normalize,ticketsToday,decayFor,buyRod,buyAcc,buyBait,pickBait,rent,activeBait,cast,judgeHook,
  weights,pickFish,expectedValue,reelParams,reelStart,reelStep,rescue,land,settle,bucketValue,sellAll,dropTicket,
  DECAY,BAIT_PACK,BAIT_CAP,BUCKET_CAP,FIRST_BONUS};
})();
