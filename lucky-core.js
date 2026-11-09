/* Hộp quà may mắn: mua vé bằng xu để mở quà ngẫu nhiên. Chỉ xu trong game, không tiền thật.
   Cân bằng: kỳ vọng ~75% giá vé (cộng bảo hiểm pity thành ~90%) (hơi lỗ, ai cũng chơi vui nhưng không "cày" ra xu), có bảo hiểm (pity), giới hạn vé mua mỗi ngày
   và 1 vé miễn phí mỗi ngày. Pure: truyền rnd() trong [0,1) để test. */
const LuckyBox=(()=>{
 const PRICE=EcoData.lucky.price,DAILY_CAP=EcoData.lucky.dailyCap,PITY_AFTER=EcoData.lucky.pityAfter,HISTORY=EcoData.lucky.history;
 /* weight trên tổng 1000. value = giá trị quy đổi xu (đồ trang trí tính theo giá trị trung bình) */
 const prizes=EcoData.lucky.prizes;
 const isRare=p=>p.rarity==='rare'||p.rarity==='epic';
 const worth=p=>p.kind==='coins'?p.coins:p.value;
 const total=list=>list.reduce((a,p)=>a+p.weight,0);
 const expected=()=>prizes.reduce((a,p)=>a+worth(p)*p.weight,0)/total(prizes);
 const odds=()=>prizes.map(p=>({id:p.id,label:p.label,icon:p.icon,rarity:p.rarity,percent:Math.round(p.weight/total(prizes)*1000)/10}));
 function norm(s){
  const d=(s.lucky&&typeof s.lucky==='object')?s.lucky:(s.lucky={});
  const n=v=>Number.isFinite(v)&&v>0?Math.floor(v):0;
  d.day=typeof d.day==='string'?d.day:'';d.bought=n(d.bought);d.tickets=n(d.tickets);d.pity=n(d.pity);d.opened=n(d.opened);
  d.freeDay=typeof d.freeDay==='string'?d.freeDay:'';
  d.history=Array.isArray(d.history)?d.history.filter(x=>x&&typeof x.id==='string').slice(-HISTORY):[];
  return d;
 }
 function status(s,today){
  const d=norm(s),bought=d.day===today?d.bought:0;
  return {price:PRICE,tickets:d.tickets,freeReady:d.freeDay!==today,left:Math.max(0,DAILY_CAP-bought),cap:DAILY_CAP,pity:d.pity,pityAfter:PITY_AFTER,opened:d.opened,history:d.history};
 }
 function roll(list,rnd){let r=rnd()*total(list);for(const p of list){r-=p.weight;if(r<0)return p}return list[list.length-1]}
 /* Mở 1 hộp. Thứ tự dùng: vé đang có → vé miễn phí hôm nay → trả xu. Trả {ok,prize,paid,source,gain,item?} */
 function open(s,{rnd=Math.random,today,pool={}}={}){
  const d=norm(s);
  if(d.day!==today){d.day=today;d.bought=0}
  let source;
  if(d.tickets>0)source='ticket';
  else if(d.freeDay!==today)source='free';
  else if(d.bought>=DAILY_CAP)return {ok:false,message:`Hôm nay đã mua đủ ${DAILY_CAP} vé. Mai quay lại nhé!`};
  else if(s.coins<PRICE)return {ok:false,message:'Chưa đủ xu mua vé.'};
  else source='paid';
  let prize=d.pity>=PITY_AFTER?roll(prizes.filter(isRare),rnd):roll(prizes,rnd);
  let item=null,gain=0;
  if(prize.kind==='decor'){
   const list=(pool[prize.tier]||[]).filter(Boolean);
   if(list.length)item=list[Math.floor(rnd()*list.length)];
   else gain=prize.value; /* đã có hết: đổi thành xu */
  }
  if(prize.kind==='coins')gain=prize.coins;
  /* mọi thay đổi chỉ sau khi chắc chắn mở được */
  if(source==='ticket')d.tickets--;
  else if(source==='free')d.freeDay=today;
  else{s.coins-=PRICE;d.bought++}
  if(prize.kind==='ticket')d.tickets++;
  s.coins+=gain;
  d.pity=isRare(prize)?0:d.pity+1;d.opened++;
  d.history.push({id:prize.id,item:item||undefined,gain});if(d.history.length>HISTORY)d.history.shift();
  return {ok:true,prize,item,gain,source,paid:source==='paid'?PRICE:0,converted:prize.kind==='decor'&&!item};
 }
 return {PRICE,DAILY_CAP,PITY_AFTER,prizes,expected,odds,status,open,isRare};
})();
