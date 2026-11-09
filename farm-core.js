/* Nông trại: trồng hạt giống chờ thời gian (đồng hồ thiết bị), bán nông sản theo giá chợ mỗi ngày, mở thêm thửa đất,
   và phối giống 2 thú để ra trứng. Pure: truyền thời gian `at` (ms) và rnd() để test. */
const Farm=(()=>{
 const MIN=6e4,HOUR=36e5;
 const crops=EcoData.farm.crops;
 const E=EcoData.farm,START_PLOTS=E.startPlots,PLOT_COSTS=E.plotCosts,MAX_PLOTS=START_PLOTS+PLOT_COSTS.length;
 const WATER_CUT=E.waterCut,BONUS_CHANCE=E.bonusChance,BARN_CAP=E.barnCap;
 const BREED_COST=E.breedCost,BREED_MS=E.breedMs,BREED_COOLDOWN=E.breedCooldown,MIN_XP=E.minXp,MIN_CARE=E.minCare,MUTATION=E.mutation,COLOR_MUT=E.colorMutation;
 const find=id=>crops.find(c=>c.id===id);
 const num=(v,d=0)=>Number.isFinite(v)?v:d;
 function normalize(s){
  const f=(s.farm&&typeof s.farm==='object')?s.farm:(s.farm={});
  f.plots=Array.isArray(f.plots)?f.plots.slice(0,MAX_PLOTS):[];
  f.unlocked=Math.min(MAX_PLOTS,Math.max(START_PLOTS,Math.floor(num(f.unlocked,START_PLOTS))));
  while(f.plots.length<f.unlocked)f.plots.push(null);
  f.plots=f.plots.map(p=>p&&find(p.crop)&&Number.isFinite(p.at)?{crop:p.crop,at:p.at,watered:!!p.watered}:null);
  if(!f.barn||typeof f.barn!=='object'||Array.isArray(f.barn))f.barn={};
  for(const k of Object.keys(f.barn))if(!find(k)||!(f.barn[k]>0))delete f.barn[k];else f.barn[k]=Math.min(BARN_CAP,Math.floor(f.barn[k]));
  f.earned=Math.max(0,num(f.earned));f.harvested=Math.max(0,Math.floor(num(f.harvested)));f.bred=Math.max(0,Math.floor(num(f.bred)));
  if(!f.cd||typeof f.cd!=='object'||Array.isArray(f.cd))f.cd={};
  const j=f.job;f.job=j&&typeof j==='object'&&j.a&&j.b&&Number.isFinite(j.ready)?{a:String(j.a),b:String(j.b),ready:j.ready}:null;
  return f;
 }
 /* giá chợ hôm nay: 0.85–1.25 (xác định theo ngày + loại cây, ai cũng thấy giống nhau) */
 function market(day,id){
  let h=2166136261;for(const ch of day+'|'+id){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)>>>0}
  return 0.85+(h%9)*0.05;
 }
 const price=(day,id)=>{const c=find(id);return c?Math.max(1,Math.round(c.sell*market(day,id))):0};
 function plotInfo(p,at){
  if(!p)return {state:'empty'};
  const c=find(p.crop),total=c.grow,done=Math.max(0,at-p.at),left=Math.max(0,total-done);
  return {state:left===0?'ripe':'growing',crop:c,left,progress:Math.min(1,done/total),watered:p.watered};
 }
 function plant(s,i,cropId,at){
  const f=normalize(s),c=find(cropId);
  if(!c)return {ok:false,message:'Không có hạt giống này.'};
  if(!Number.isInteger(i)||i<0||i>=f.unlocked)return {ok:false,message:'Thửa đất này chưa mở.'};
  if(f.plots[i])return {ok:false,message:'Thửa đất đang có cây.'};
  if(s.coins<c.seed)return {ok:false,message:'Chưa đủ xu mua hạt giống.'};
  s.coins-=c.seed;f.plots[i]={crop:c.id,at,watered:false};return {ok:true,paid:c.seed};
 }
 /* tưới nước: giảm 20% thời gian trồng, mỗi cây 1 lần */
 function water(s,i,at){
  const f=normalize(s),p=f.plots[i];
  if(!p)return {ok:false,message:'Thửa đất trống.'};
  if(p.watered)return {ok:false,message:'Cây đã được tưới rồi.'};
  if(plotInfo(p,at).state==='ripe')return {ok:false,message:'Cây đã chín rồi!'};
  p.watered=true;p.at-=Math.round(find(p.crop).grow*WATER_CUT);return {ok:true};
 }
 function harvest(s,i,at,rnd=Math.random){
  const f=normalize(s),p=f.plots[i];
  if(!p)return {ok:false,message:'Thửa đất trống.'};
  if(plotInfo(p,at).state!=='ripe')return {ok:false,message:'Cây chưa chín.'};
  if((f.barn[p.crop]||0)>=BARN_CAP)return {ok:false,message:'Kho đầy, hãy bán bớt nông sản.'};
  const bonus=rnd()<BONUS_CHANCE,n=bonus?2:1;
  f.barn[p.crop]=Math.min(BARN_CAP,(f.barn[p.crop]||0)+n);f.plots[i]=null;f.harvested+=n;
  return {ok:true,crop:p.crop,n,bonus};
 }
 function sell(s,cropId,n,day){
  const f=normalize(s),have=f.barn[cropId]||0,k=n==='all'?have:Math.floor(n);
  if(!find(cropId)||!(k>0)||k>have)return {ok:false,message:'Không có đủ nông sản.'};
  const unit=price(day,cropId),coins=unit*k;
  f.barn[cropId]=have-k;if(!f.barn[cropId])delete f.barn[cropId];
  s.coins+=coins;f.earned+=coins;return {ok:true,coins,unit,n:k};
 }
 const plotCost=s=>{const f=normalize(s);return f.unlocked>=MAX_PLOTS?null:PLOT_COSTS[f.unlocked-START_PLOTS]};
 function buyPlot(s){
  const f=normalize(s),cost=plotCost(s);
  if(cost===null)return {ok:false,message:'Đã mở hết thửa đất.'};
  if(s.coins<cost)return {ok:false,message:'Chưa đủ xu mở thửa đất.'};
  s.coins-=cost;f.unlocked++;f.plots.push(null);return {ok:true,paid:cost};
 }
 /* ---- phối giống ---- */
 const xpOf=p=>num(p.totalXP??p.xp);
 const careOf=p=>(num(p.food)+num(p.clean)+num(p.joy)+num(p.energy))/4;
 function parentIssue(f,p,at){
  if(xpOf(p)<MIN_XP)return 'cần lớn hơn (giai đoạn Thiếu niên trở lên)';
  if(careOf(p)<MIN_CARE)return 'đang mệt hoặc đói, hãy chăm sóc trước';
  if((f.cd[p.id]||0)>at)return 'đang nghỉ sau lần phối giống trước';
  return null;
 }
 function startBreed(s,aId,bId,at){
  const f=normalize(s);
  if(f.job)return {ok:false,message:'Chuồng phối giống đang bận.'};
  if(!aId||!bId||aId===bId)return {ok:false,message:'Hãy chọn 2 thú khác nhau.'};
  const a=s.pets.find(p=>p.id===aId),b=s.pets.find(p=>p.id===bId);
  if(!a||!b)return {ok:false,message:'Không tìm thấy thú.'};
  for(const p of [a,b]){const why=parentIssue(f,p,at);if(why)return {ok:false,message:`${p.nickname||'Thú'} ${why}.`}}
  if(s.coins<BREED_COST)return {ok:false,message:'Chưa đủ xu phối giống.'};
  s.coins-=BREED_COST;f.job={a:aId,b:bId,ready:at+BREED_MS};
  f.cd[aId]=f.cd[bId]=at+BREED_MS+BREED_COOLDOWN;
  return {ok:true,paid:BREED_COST};
 }
 const jobState=(s,at)=>{const f=normalize(s);return f.job?{ready:f.job.ready<=at,left:Math.max(0,f.job.ready-at)}:null};
 /* nhận trứng: loài của bố hoặc mẹ (10% đột biến loài lạ), màu của bố/mẹ (12% màu lạ) */
 function collect(s,at,rnd=Math.random,makeId=()=>'egg-'+Math.floor(rnd()*1e9)){
  const f=normalize(s),j=f.job;
  if(!j)return {ok:false,message:'Chưa có gì để nhận.'};
  if(j.ready>at)return {ok:false,message:'Trứng chưa sẵn sàng.'};
  const a=s.pets.find(p=>p.id===j.a),b=s.pets.find(p=>p.id===j.b);
  const pick=(x,y)=>rnd()<.5?x:y;
  const sa=a?a.species:0,sb=b?b.species:sa,ca=a?a.color:0,cb=b?b.color:ca;
  let species=pick(sa,sb),color=pick(ca,cb),mutantSpecies=false,mutantColor=false;
  if(rnd()<MUTATION){species=Math.floor(rnd()*12);mutantSpecies=species!==sa&&species!==sb}
  if(rnd()<COLOR_MUT){color=Math.floor(rnd()*12);mutantColor=color!==ca&&color!==cb}
  const egg={id:makeId(),species,color,hatchAt:null,bred:true};
  s.eggs.push(egg);f.job=null;f.bred++;
  return {ok:true,egg,mutantSpecies,mutantColor,parents:[sa,sb]};
 }
 function breedable(s,at){const f=normalize(s);return s.pets.map(p=>({pet:p,issue:parentIssue(f,p,at)}))}
 return {crops,find,normalize,market,price,plotInfo,plant,water,harvest,sell,plotCost,buyPlot,startBreed,jobState,collect,breedable,
  START_PLOTS,MAX_PLOTS,PLOT_COSTS,BREED_COST,BREED_MS,BREED_COOLDOWN,MIN_XP,MIN_CARE,BARN_CAP,WATER_CUT,BONUS_CHANCE,MIN,HOUR};
})();
