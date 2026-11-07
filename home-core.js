const PetHomes=(()=>{
 const keys=['food','clean','joy','energy'],grace=30*60000;
 function normalize(s,t=Date.now()){
  s.stats??={};s.habitJobs??={};s.gardenLevel??=0;
  const migrating=s.homeVersion!==1;
  if(migrating){const ids=[...new Set((s.pens||[]).filter(id=>s.pets.some(p=>p.id===id)))];const count=1+4*Math.max(0,s.gardenLevel||0);s.homes=Array.from({length:count},(_,i)=>({petId:ids[i]||(i===0?s.pets[0]?.id:null)||null,owned:[],equipped:{}}));const h=s.homes[0],shop=s.shop||{};h.owned=[...(shop.owned||[])];h.theme=shop.theme||'classic';h.decor=[...(shop.decor||[])];s.homeVersion=1;s.homePage=0}
  if(!s.homes?.length)s.homes=[{petId:null,owned:[],equipped:{}}];
  const assigned=new Set();for(const h of s.homes){h.owned??=[];h.equipped??={};h.decor??=[];h.theme??='classic';if(!s.pets.some(p=>p.id===h.petId)||assigned.has(h.petId))h.petId=null;if(h.petId)assigned.add(h.petId)}
  s.homePage=Math.max(0,Math.min(s.homes.length-1,s.homePage||0));
  for(const p of s.pets){p.totalXP=Math.max(0,Number(p.totalXP??p.xp)||0);p.xp=Math.min(100,p.totalXP);p.evolution??=0;p.capital??=10;p.evolutionCredits??=p.evolution?1:0;p.reserve??={};for(const k of keys){p[k]=Math.max(0,Number(p[k])||0);p.reserve[k]=Math.max(0,Number(p.reserve[k])||0)}if(assigned.has(p.id)){p.sickness=discount(p,t);p.waitUntil=null;}else if(!p.waitUntil)p.waitUntil=t+(migrating?24*3600000:grace)}
  s.pens=s.homes.map(h=>h.petId);return s;
 }
 function xp(p,n){p.totalXP=Math.max(0,(p.totalXP??p.xp??0)+n);p.xp=Math.min(100,p.totalXP)}
 function level(p){return 1+Math.floor((p.totalXP??p.xp??0)/100)}
 function rawValue(p){return (p.capital??10)+Math.floor((p.totalXP??p.xp??0)/10)+25*(p.evolutionCredits??(p.evolution?1:0))}
 function discount(p,t){return Math.max(p.sickness||0,p.waitUntil&&t>=p.waitUntil?Math.min(.5,.1*(1+Math.floor((t-p.waitUntil)/grace))):0)}
 function price(p,t){return Math.floor(rawValue(p)*(1-discount(p,t)))}
 function pagePrice(s){return 120+90*(s.homes.length-1)}
 function buyPage(s){const cost=pagePrice(s);if(s.coins<cost)return false;s.coins-=cost;s.homes.push({petId:null,owned:[],equipped:{},theme:'classic',decor:[]});s.homePage=s.homes.length-1;s.pens=s.homes.map(h=>h.petId);return true}
 function assign(s,index,id,t){normalize(s,t);const h=s.homes[index];if(!h||id&&!s.pets.some(p=>p.id===id))return false;const displaced=s.pets.find(p=>p.id===h.petId);if(displaced&&displaced.id!==id)displaced.waitUntil=t+grace;for(const x of s.homes)if(x.petId===id)x.petId=null;h.petId=id;normalize(s,t);return true}
 function merge(s,targetId,sourceId,t){normalize(s,t);if(targetId===sourceId)return false;const a=s.pets.find(p=>p.id===targetId),b=s.pets.find(p=>p.id===sourceId);if(!a||!b)return false;
  xp(a,b.totalXP);a.lastTreat=Math.max(a.lastTreat||0,b.lastTreat||0);a.capital+=b.capital;a.evolutionCredits+=b.evolutionCredits;a.evolution=Math.max(a.evolution,b.evolution);if(b.evoStart){a.evoStart??={...b.evoStart};for(const k of new Set([...Object.keys(a.evoStart),...Object.keys(b.evoStart)]))a.evoStart[k]=Math.min(a.evoStart[k]||0,b.evoStart[k]||0)}
  for(const k of keys){const sum=a[k]+a.reserve[k]+b[k]+b.reserve[k];a[k]=Math.min(100,sum);a.reserve[k]=Math.max(0,sum-100)}
  const sourcePage=s.homes.findIndex(h=>h.petId===b.id),targetPage=s.homes.findIndex(h=>h.petId===a.id);for(const h of s.homes)if(h.petId===b.id)h.petId=null;if(targetPage<0&&sourcePage>=0)s.homes[sourcePage].petId=a.id;
  s.pets=s.pets.filter(p=>p.id!==b.id);normalize(s,t);return true;
 }
 function remove(s,id,t){normalize(s,t);const p=s.pets.find(p=>p.id===id);if(!p)return false;const coins=price(p,t);s.coins+=coins;s.pets=s.pets.filter(p=>p.id!==id);for(const h of s.homes)if(h.petId===id)h.petId=null;normalize(s,t);return coins}
 return {normalize,xp,level,rawValue,discount,price,pagePrice,buyPage,assign,merge,remove,keys};
})();
