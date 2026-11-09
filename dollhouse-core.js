/* Pure logic for "Ngôi nhà của em": rooms to build, furniture to buy and place, star ratings. */
const DollHouse=(()=>{
 const cats={furn:'Nội thất',kitchen:'Bếp',bath:'Phòng tắm',toy:'Đồ chơi',plant:'Cây cối',wall:'Treo tường',cute:'Điểm nhấn'};
 const I=(cat,list)=>list.map(([id,icon,name,price,line])=>({id,icon,name,price,cat,line}));
 const items=[
  ...I('furn',[['sofa','🛋️','Ghế sofa',45,'Sofa êm ơi là êm! Mình muốn nằm ngay.'],['bed','🛏️','Giường ngủ',60,'Giường này ngủ chắc ngon lắm!'],['chair','🪑','Ghế gỗ',15,'Một chiếc ghế xinh để ngồi đọc sách.'],['tv','📺','Ti vi',50,'Tới giờ xem phim hoạt hình rồi!'],['radio','📻','Đài radio',20,'Bật nhạc lên nào!'],['lamp','💡','Đèn bàn',15,'Căn phòng sáng hơn hẳn!'],['door','🚪','Cửa ra vào',30,'Cửa đẹp quá, khách đến chơi nhé!'],['window','🪟','Cửa sổ',30,'Nắng vào phòng rồi, ấm quá!'],['fire','🔥','Lò sưởi',40,'Ấm áp như được ôm vậy.'],['piano','🎹','Đàn piano',90,'Ting ting! Bạn chơi cho mình nghe nhé?'],['books','📚','Giá sách',35,'Nhiều sách thế, bạn thông minh ghê!'],['mirror','🪞','Gương soi',35,'Mình soi thấy mình xinh hơn rồi!'],['vase','🏺','Bình hoa',20,'Bình này làm phòng sang hẳn lên.']]),
  ...I('kitchen',[['pot','🍲','Nồi canh',20,'Thơm quá! Chắc là canh ngon lắm.'],['teapot','🫖','Ấm trà',20,'Mời cả nhà uống trà nào!'],['cake','🍰','Bánh kem',15,'Ôi bánh kem! Mình thèm quá.'],['pizza','🍕','Bánh pizza',15,'Tiệc pizza nào mọi người!'],['juice','🧃','Nước ép',10,'Ực ực, mát ghê!'],['bread','🥖','Bánh mì',10,'Bánh mì nóng giòn!'],['icecream','🍦','Kem',15,'Kem mát lạnh, yummy!'],['coffee','☕','Cốc cà phê',15,'Một tách nóng cho buổi sáng.']]),
  ...I('bath',[['tub','🛁','Bồn tắm',70,'Bồn tắm đầy bọt! Mình nhảy vào được không?'],['shower','🚿','Vòi sen',45,'Tắm mát rồi thơm tho!'],['soap','🧼','Xà phòng',10,'Rửa tay sạch sẽ nhé!'],['brush','🪥','Bàn chải',10,'Đánh răng mỗi ngày là răng khỏe!'],['duck','🦆','Vịt cao su',15,'Quạc quạc! Bạn vịt đến tắm cùng.'],['toilet','🚽','Bồn cầu',40,'Một phòng tắm đầy đủ rồi!']]),
  ...I('toy',[['teddy','🧸','Gấu bông',25,'Gấu bông mềm quá, mình ôm được không?'],['ball','⚽','Quả bóng',12,'Đá bóng thôi!'],['blocks','🧱','Khối xếp hình',15,'Xây gì tiếp đây nhỉ?'],['train','🚂','Tàu hỏa',40,'Tu tu! Tàu sắp chạy!'],['kite','🪁','Diều giấy',20,'Diều bay cao lắm luôn!'],['guitar','🎸','Đàn guitar',50,'Bạn gảy một bài nhé!'],['paint','🎨','Bảng màu vẽ',20,'Hôm nay vẽ gì nè?'],['robot','🤖','Rô-bốt',45,'Bíp bíp! Xin chào chủ nhà!'],['doll','🪆','Búp bê',30,'Búp bê xinh ghê!'],['puzzle','🧩','Xếp hình',20,'Thử ghép xem nào!'],['horse','🐴','Ngựa gỗ',35,'Hí hí! Phi nước đại!']]),
  ...I('plant',[['pot2','🪴','Chậu cây',20,'Cây xanh làm phòng tươi mát.'],['tulip','🌷','Hoa tulip',10,'Hoa thơm quá!'],['cactus','🌵','Xương rồng',15,'Bạn này hơi gai nhưng dễ thương.'],['sunflower','🌻','Hoa hướng dương',15,'Luôn hướng về phía mặt trời!'],['tree','🌳','Cây to',40,'Cây to cho bóng mát.'],['palm','🌴','Cây dừa',40,'Cảm giác như đi biển vậy!'],['bamboo','🎍','Tre may mắn',25,'Tre may mắn đem tới niềm vui.'],['mushroom','🍄','Nấm đáng yêu',15,'Nấm này xinh ghê!'],['rose','🌹','Hoa hồng',15,'Hoa hồng đỏ thắm.']]),
  ...I('wall',[['frame','🖼️','Khung tranh',25,'Bức tranh này ai vẽ mà đẹp thế!'],['ribbon','🎀','Nơ xinh',10,'Cái nơ điệu quá!'],['banner','🎌','Cờ treo',20,'Căn phòng thêm rộn ràng!'],['sparkle','✨','Dây đèn lấp lánh',15,'Lung linh như sao trời!'],['medal','🏅','Huy chương',15,'Huy chương xứng đáng cho bạn!'],['star','⭐','Ngôi sao',10,'Ngôi sao nhỏ lấp lánh.'],['moon','🌙','Trăng treo tường',15,'Trăng treo cho đêm ngủ ngon.'],['rainbow','🌈','Cầu vồng',30,'Cầu vồng bảy sắc, vui quá!'],['clock','🕰️','Đồng hồ',25,'Tích tắc, tới giờ chơi rồi!']]),
  ...I('cute',[['unicorn','🦄','Kỳ lân',80,'Ôi kỳ lân! Phép màu đến nhà mình rồi.'],['balloon','🎈','Bóng bay',10,'Bay bay bay!'],['gift','🎁','Hộp quà',20,'Quà gì trong này nhỉ?'],['crown','👑','Vương miện',100,'Nhà của một vị vua, vị hoàng hậu thực thụ!'],['trophy','🏆','Cúp vàng',60,'Cúp vàng cho nhà thiết kế giỏi!'],['fountain','⛲','Đài phun nước',80,'Róc rách, nghe mà dễ chịu.'],['tent','⛺','Lều cắm trại',70,'Tối nay cắm trại trong nhà nhé!'],['castle','🏰','Lâu đài',150,'Một tòa lâu đài trong nhà luôn! Quá đỉnh!'],['carousel','🎠','Đu quay',120,'Quay quay quay! Vui quá!'],['ferris','🎡','Vòng quay',150,'Cả công viên giải trí trong nhà bạn!']])
 ];
 const walls=[['cream','Kem sữa','#fff1d6',0],['sky','Trời xanh','#cfe8ff',15],['mint','Bạc hà','#d3f2e0',15],['pink','Hồng phấn','#ffd9e6',20],['lavender','Oải hương','#e5dcff',20],['stripe','Sọc hồng','repeating-linear-gradient(90deg,#ffe3ec 0 18px,#fff7fa 18px 36px)',30],['dots','Chấm bi','radial-gradient(#ffd166 22%,transparent 24%) 0 0/26px 26px,#fff6d9',30],['stars','Đêm sao','radial-gradient(#fff 8%,transparent 10%) 0 0/34px 34px,#2f3a78',45],['brick','Gạch đỏ','repeating-linear-gradient(0deg,#c8765a 0 14px,#e9d3c4 14px 16px),#c8765a',40]].map(([id,name,bg,price])=>({id,name,bg,price}));
 const floors=[['wood','Gỗ ấm','repeating-linear-gradient(90deg,#d9a566 0 38px,#c98f52 38px 40px)',0],['tile','Gạch ô vuông','repeating-conic-gradient(#fff 0 25%,#d7e4ea 0 50%) 0 0/48px 48px',15],['carpet','Thảm đỏ','#d9605e',25],['pinkrug','Thảm hồng','#f3a6c3',25],['blue','Sàn xanh','#8fc1e8',20],['grass','Cỏ xanh','repeating-linear-gradient(90deg,#8ad07a 0 12px,#7cc46c 12px 24px)',30],['marble','Đá cẩm thạch','linear-gradient(135deg,#f4f4f6,#d9dbe3 45%,#f4f4f6)',40]].map(([id,name,bg,price])=>({id,name,bg,price}));
 const rooms=[{id:'living',name:'Phòng khách',icon:'🛋️',cost:0,wall:'cream',floor:'wood'},{id:'bedroom',name:'Phòng ngủ',icon:'🛏️',cost:120,wall:'cream',floor:'wood'},{id:'kitchen',name:'Nhà bếp',icon:'🍳',cost:150,wall:'cream',floor:'tile'},{id:'bath',name:'Phòng tắm',icon:'🛁',cost:100,wall:'sky',floor:'tile'},{id:'play',name:'Phòng chơi',icon:'🧸',cost:200,wall:'cream',floor:'wood'},{id:'garden',name:'Sân vườn',icon:'🌳',cost:250,wall:'sky',floor:'grass'}];
 const roofs=['#d9534f','#4f8bd9','#4fb286','#e07bb0','#8a6ad9','#e8b830'];
 const STAR_COINS=[10,25,50],PARTY_COINS=100,MAX_OBJ=40;
 const find=id=>items.find(x=>x.id===id),room=id=>rooms.find(r=>r.id===id);
 const clamp=(v,a,b,d)=>Number.isFinite(+v)?Math.min(b,Math.max(a,+v)):d;
 function normalize(s){
  const d=s.dollhouse??={};d.v=1;
  d.owned=[...new Set((Array.isArray(d.owned)?d.owned:[]).filter(id=>find(id)))];
  d.styles=[...new Set((Array.isArray(d.styles)?d.styles:[]).filter(id=>walls.some(w=>w.id===id)||floors.some(f=>f.id===id)))];
  d.rooms&&typeof d.rooms==='object'||(d.rooms={});d.claimed&&typeof d.claimed==='object'||(d.claimed={});
  d.n=Math.max(0,Math.floor(+d.n||0));d.party=Math.max(0,Math.floor(+d.party||0));
  d.roof=roofs.includes(d.roof)?d.roof:roofs[0];d.name=typeof d.name==='string'?[...d.name].slice(0,24).join(''):'';
  for(const r of rooms){
   const o=d.rooms[r.id]&&typeof d.rooms[r.id]==='object'?d.rooms[r.id]:(d.rooms[r.id]={});
   o.built=r.cost===0||o.built===true;
   o.wall=walls.some(w=>w.id===o.wall)?o.wall:r.wall;o.floor=floors.some(f=>f.id===o.floor)?o.floor:r.floor;
   o.objs=(Array.isArray(o.objs)?o.objs:[]).filter(x=>x&&find(x.id)&&d.owned.includes(x.id)).slice(0,MAX_OBJ).map(x=>({u:Math.floor(+x.u)||++d.n,id:x.id,x:clamp(x.x,2,98,50),y:clamp(x.y,8,98,70),s:clamp(x.s,.5,3,1),f:x.f===true}));
  }
  return d;
 }
 const owns=(d,id)=>d.owned.includes(id);
 function buy(s,id){const d=normalize(s),x=find(id);if(!x)return {ok:false,message:'Không có món này.'};if(owns(d,id))return {ok:true,paid:0};if(s.coins<x.price)return {ok:false,message:'Chưa đủ xu cho món này.'};s.coins-=x.price;d.owned.push(id);return {ok:true,paid:x.price}}
 function build(s,rid){const d=normalize(s),r=room(rid);if(!r)return {ok:false,message:'Không có phòng này.'};if(d.rooms[rid].built)return {ok:false,message:'Phòng đã xây rồi.'};if(s.coins<r.cost)return {ok:false,message:'Chưa đủ xu để xây phòng này.'};s.coins-=r.cost;d.rooms[rid].built=true;return {ok:true,paid:r.cost}}
 function setStyle(s,rid,kind,id){const d=normalize(s),o=d.rooms[rid],list=kind==='wall'?walls:floors,x=list.find(z=>z.id===id);if(!o?.built||!x)return {ok:false,message:'Không đổi được.'};const free=x.price===0||d.styles.includes(id);if(!free){if(s.coins<x.price)return {ok:false,message:'Chưa đủ xu cho kiểu này.'};s.coins-=x.price;d.styles.push(id)}o[kind]=id;return {ok:true,paid:free?0:x.price}}
 function place(s,rid,id,x=50,y=72){const d=normalize(s),o=d.rooms[rid];if(!o?.built||!owns(d,id)||o.objs.length>=MAX_OBJ)return null;const obj={u:++d.n,id,x:clamp(x,2,98,50),y:clamp(y,8,98,72),s:1,f:false};o.objs.push(obj);return obj}
 function update(s,rid,u,patch){const o=normalize(s).rooms[rid],obj=o?.objs.find(x=>x.u===u);if(!obj)return false;if('x'in patch)obj.x=clamp(patch.x,2,98,obj.x);if('y'in patch)obj.y=clamp(patch.y,8,98,obj.y);if('s'in patch)obj.s=clamp(patch.s,.5,3,obj.s);if('f'in patch)obj.f=!!patch.f;return true}
 function remove(s,rid,u){const o=normalize(s).rooms[rid],n=o?.objs.length;if(!o)return false;o.objs=o.objs.filter(x=>x.u!==u);return o.objs.length<n}
 function rate(s,rid){const d=normalize(s),o=d.rooms[rid],r=room(rid),n=o.objs.length,kinds=new Set(o.objs.map(x=>find(x.id).cat)).size,custom=o.wall!==r.wall&&o.floor!==r.floor;
  const stars=n>=8&&kinds>=4&&custom?3:n>=5&&kinds>=3?2:n>=2?1:0;
  const need=stars===0?`Đặt ${Math.max(0,2-n)} món nữa để được ★1`:stars===1?`Cần ${Math.max(0,5-n)} món nữa và ${Math.max(0,3-kinds)} loại đồ khác để được ★2`:stars===2?`★3: đủ 8 món, 4 loại đồ, và đổi cả tường lẫn sàn (${n}/8 món · ${kinds}/4 loại · ${custom?'đã':'chưa'} đổi tường & sàn)`:'Phòng hoàn hảo! ★★★';
  return {stars,items:n,kinds,custom,need}}
 function claim(s,rid){const d=normalize(s),st=rate(s,rid).stars,out=[];for(let k=1;k<=st;k++){const key=rid+':'+k;if(!d.claimed[key]){d.claimed[key]=true;s.coins+=STAR_COINS[k-1];out.push({stars:k,coins:STAR_COINS[k-1]})}}return out}
 const builtRooms=s=>rooms.filter(r=>normalize(s).rooms[r.id].built);
 function pride(s){const b=builtRooms(s),stars=b.reduce((a,r)=>a+rate(s,r.id).stars,0);return {stars,max:b.length*3,rooms:b.length}}
 function partyReady(s){const b=builtRooms(s);return b.length>=3&&b.every(r=>rate(s,r.id).stars>=2)}
 function party(s){const d=normalize(s);if(!partyReady(s))return {ok:false};d.party++;let coins=0;if(!d.claimed.party){d.claimed.party=true;coins=PARTY_COINS;s.coins+=coins}return {ok:true,coins}}
 /* The pet visits furniture: what it does there, where it stands, and what it visits next. */
 const POSES=['sit','sleep','eat','play','watch','music','bath','sniff','admire'];
 const catPose={furn:['sit','💖'],kitchen:['eat','😋'],bath:['bath','🫧'],toy:['play','🎉'],plant:['sniff','🌸'],wall:['admire','✨'],cute:['play','🌟']};
 const idPose={bed:['sleep','💤'],tent:['sleep','💤'],sofa:['sit','💖'],chair:['sit','💖'],fire:['sit','🔥'],books:['sit','📖'],tv:['watch','📺'],radio:['music','🎵'],piano:['music','🎵'],guitar:['music','🎵'],lamp:['admire','💡'],mirror:['admire','✨'],door:['admire','👋'],window:['admire','☀️'],vase:['sniff','🌸'],train:['play','🚂'],paint:['play','🎨'],fountain:['play','💦'],robot:['play','🤖'],kite:['play','🪁']};
 function reaction(id){const x=find(id);if(!x)return null;const [pose,fx]=idPose[id]||catPose[x.cat];return {pose,fx,line:x.line}}
 function petSpot(obj,pose){const side=pose==='sit'||pose==='sleep'?0:6,lift=pose==='sleep'?3:pose==='sit'?0:-2;return {x:clamp(obj.x+side,13,87,50),y:clamp(obj.y+lift,36,98,70)}}
 function pickTarget(objs,lastU,rnd=Math.random){const list=(Array.isArray(objs)?objs:[]).filter(o=>find(o.id)),pool=list.filter(o=>o.u!==lastU),from=pool.length?pool:list;return from.length?from[Math.min(from.length-1,Math.floor(rnd()*from.length))]:null}
 return {cats,items,walls,floors,rooms,roofs,find,room,normalize,buy,build,setStyle,place,update,remove,rate,claim,pride,partyReady,party,builtRooms,reaction,petSpot,pickTarget,POSES,STAR_COINS,PARTY_COINS,MAX_OBJ};
})();
