/* Làng (thuần logic): đơn hàng ngày, điểm danh 7 ngày, thành tựu. Số liệu ở EcoData.village.
   Trạng thái: s.village={od:{date,done:[]},orders,ci:{last,day,total},ach:[],best}. Mọi hàm nhận ngày dạng 'YYYY-MM-DD'. */
const Village=(()=>{
 const V=EcoData.village,crops=EcoData.farm.crops,BAIT_CAP=EcoData.fishing.baitCap;
 const cropOf=id=>crops.find(c=>c.id===id);
 const hash=str=>{let h=2166136261;for(const c of str){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0};
 const r5=n=>Math.max(5,Math.round(n/5)*5);
 const nn=(v,d=0)=>Number.isSafeInteger(v)&&v>=0?v:d;
 const prev=date=>{const [y,m,d]=date.split('-').map(Number);return new Date(Date.UTC(y,m-1,d-1)).toISOString().slice(0,10)};
 function normalize(s,date){
  const v=s.village&&typeof s.village==='object'&&!Array.isArray(s.village)?s.village:(s.village={});
  v.orders=nn(v.orders);v.best=nn(v.best);
  const o=v.od&&typeof v.od==='object'?v.od:{};
  v.od={date:o.date===date?date:date,done:o.date===date&&Array.isArray(o.done)?[...new Set(o.done.filter(i=>Number.isInteger(i)&&i>=0&&i<3))]:[]};
  const c=v.ci&&typeof v.ci==='object'?v.ci:{};
  v.ci={last:typeof c.last==='string'?c.last:'',day:Math.min(V.checkin.length,nn(c.day)),total:nn(c.total)};
  v.ach=[...new Set((Array.isArray(v.ach)?v.ach:[]).filter(x=>typeof x==='string'))];
  if(s.dq&&Number.isSafeInteger(s.dq.streak))v.best=Math.max(v.best,s.dq.streak);
  return v;
 }
 /* ---- Đơn hàng ---- */
 const pick=(list,date,i)=>list[hash(date+'@'+i)%list.length];
 function orders(date){
  const a=pick(V.crops,date,0),b=pick(V.fish,date,1),m=pick(V.mixed,date,2),M=V.orderMult;
  const ca=cropOf(a.crop),cm=cropOf(m.crop);
  return [
   {slot:0,icon:ca.icon,label:`${a.n} ${ca.name}`,need:{crop:{[a.crop]:a.n}},reward:r5(a.n*ca.sell*M[0])},
   {slot:1,icon:'🐟',label:`${b.n} con cá từ ${b.min} xu`,need:{fish:{n:b.n,min:b.min}},reward:r5(b.n*b.min*M[1])},
   {slot:2,icon:'🧺',label:`${m.c} ${cm.name} + ${m.n} con cá từ ${m.min} xu`,need:{crop:{[m.crop]:m.c},fish:{n:m.n,min:m.min}},reward:r5((m.c*cm.sell+m.n*m.min)*M[2])}
  ];
 }
 const bucketOf=s=>Array.isArray(s.fishing&&s.fishing.bucket)?s.fishing.bucket:[];
 const barnOf=s=>s.farm&&s.farm.barn&&typeof s.farm.barn==='object'?s.farm.barn:{};
 function pickFish(s,fn){ // chỉ số các con cá rẻ nhất đủ điều kiện
  const idx=bucketOf(s).map((x,i)=>[x.v,i]).filter(([v])=>v>=fn.min).sort((p,q)=>p[0]-q[0]||p[1]-q[1]).slice(0,fn.n).map(p=>p[1]);
  return idx.length>=fn.n?idx:null;
 }
 function canFill(s,o){
  const barn=barnOf(s);
  for(const [id,n] of Object.entries(o.need.crop||{}))if((barn[id]||0)<n)return false;
  return !o.need.fish||!!pickFish(s,o.need.fish);
 }
 function status(s,date){
  const v=normalize(s,date);
  return orders(date).map(o=>({...o,done:v.od.done.includes(o.slot),can:canFill(s,o)}));
 }
 function deliver(s,date,slot){
  const v=normalize(s,date),o=orders(date)[slot];
  if(!o)return {ok:false,message:'Không có đơn này.'};
  if(v.od.done.includes(slot))return {ok:false,message:'Đã giao đơn này hôm nay.'};
  if(!canFill(s,o))return {ok:false,message:'Chưa đủ hàng để giao.'};
  const barn=barnOf(s);
  for(const [id,n] of Object.entries(o.need.crop||{})){barn[id]-=n;if(!barn[id])delete barn[id]}
  if(o.need.fish){const del=new Set(pickFish(s,o.need.fish));s.fishing.bucket=bucketOf(s).filter((_,i)=>!del.has(i))}
  s.coins+=o.reward;v.od.done.push(slot);v.orders++;
  return {ok:true,paid:o.reward,message:'Giao đơn xong · +'+o.reward+' xu'};
 }
 /* ---- Điểm danh (xoay vòng, bỏ ngày không bị phạt) ---- */
 function checkinStatus(s,date){
  const c=normalize(s,date).ci,L=V.checkin.length,claimed=c.last===date,next=claimed?c.day:(c.day%L)+1,doneDays=claimed?c.day:(c.day>=L?0:c.day);
  return {claimed,day:c.day,next,total:c.total,days:V.checkin.map((r,i)=>({...r,day:i+1,got:i+1<=doneDays,today:i+1===next}))};
 }
 function checkin(s,date){
  const v=normalize(s,date),c=v.ci;
  if(c.last===date)return {ok:false,message:'Hôm nay đã điểm danh rồi.'};
  const day=(c.day%V.checkin.length)+1,r=V.checkin[day-1];
  let msg;
  if(r.coins){s.coins+=r.coins;msg='Điểm danh ngày '+day+' · +'+r.coins+' xu'}
  else{
   const f=s.fishing&&typeof s.fishing==='object'?s.fishing:(s.fishing={});
   f.bait&&typeof f.bait==='object'||(f.bait={});
   const have=nn(f.bait[r.bait]);f.bait[r.bait]=Math.min(BAIT_CAP,have+r.n);
   msg='Điểm danh ngày '+day+' · +'+(f.bait[r.bait]-have)+' mồi';
  }
  c.last=date;c.day=day;c.total++;
  return {ok:true,day,message:msg};
 }
 /* ---- Thành tựu ---- */
 function stats(s,date){
  const v=normalize(s,date),caught=(s.fishing&&s.fishing.caught)||{},d=s.dollhouse&&s.dollhouse.rooms||{};
  return {
   species:Object.keys(caught).length,
   fish:Object.values(caught).reduce((a,n)=>a+(n>0?n:0),0),
   harvest:nn(s.farm&&s.farm.harvested),
   collect:Array.isArray(s.collection)?s.collection.length:0,
   pets:Array.isArray(s.pets)?s.pets.length:0,
   streak:v.best,orders:v.orders,checkin:v.ci.total,
   rooms:Object.values(d).filter(r=>r&&r.built).length
  };
 }
 function achievements(s,date){
  const v=normalize(s,date),st=stats(s,date);
  return V.ach.map(a=>{
   const val=st[a.metric],tiers=a.tiers.map(([t,reward],i)=>({t,reward,key:a.id+':'+(i+1),done:val>=t,claimed:v.ach.includes(a.id+':'+(i+1))}));
   const next=tiers.find(x=>!x.claimed);
   return {...a,value:val,tiers,next,ready:tiers.filter(x=>x.done&&!x.claimed).length};
  });
 }
 function claimAch(s,date,key){
  const a=achievements(s,date).flatMap(x=>x.tiers.map(t=>({...t,label:x.label}))).find(t=>t.key===key);
  if(!a)return {ok:false,message:'Không có thành tựu này.'};
  if(a.claimed)return {ok:false,message:'Đã nhận rồi.'};
  if(!a.done)return {ok:false,message:'Chưa đạt thành tựu.'};
  s.village.ach.push(key);s.coins+=a.reward;
  return {ok:true,paid:a.reward,message:'Thành tựu · +'+a.reward+' xu'};
 }
 const badge=(s,date)=>{
  const o=status(s,date).filter(x=>x.can&&!x.done).length,a=achievements(s,date).reduce((n,x)=>n+x.ready,0);
  return o+a+(checkinStatus(s,date).claimed?0:1);
 };
 const maxOrdersDaily=()=>{const M=V.orderMult;return Math.max(...V.crops.map(x=>cropOf(x.crop).sell*x.n))*M[0]+Math.max(...V.fish.map(x=>x.n*x.min))*M[1]+Math.max(...V.mixed.map(x=>cropOf(x.crop).sell*x.c+x.n*x.min))*M[2]};
 return {normalize,orders,status,deliver,checkinStatus,checkin,stats,achievements,claimAch,badge,maxOrdersDaily,prev};
})();
