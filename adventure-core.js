const Adventure=(()=>{
 const clone=x=>JSON.parse(JSON.stringify(x));
 function capacity(s){if(s.homeVersion===1)return s.homes.length;return 4+4*(Number.isSafeInteger(s.gardenLevel)&&s.gardenLevel>=0?s.gardenLevel:0)}
 function normalize(s){if(s.homeVersion===1)return PetHomes.normalize(s);s.stats??={};s.habitJobs??={};s.gardenLevel=Number.isSafeInteger(s.gardenLevel)&&s.gardenLevel>=0?s.gardenLevel:0;const owned=new Set(s.pets.map(p=>p.id)),ids=[...new Set((s.pens||[]).filter(id=>id&&owned.has(id)))];s.pens=ids;if(ids.length<capacity(s))s.pens.push(null);for(const p of s.pets){p.xp=Math.max(0,Math.min(100,Number(p.xp)||0));p.evolution??=0}return s}
 function daily(s,date){if(s.questDay?.date!==date)s.questDay={date,counts:{},claimed:[]};return s.questDay}
 function event(s,type,date){normalize(s);const d=daily(s,date);s.stats[type]=(s.stats[type]||0)+1;d.counts[type]=(d.counts[type]||0)+1}
 function startEvolution(s,id){normalize(s);const p=s.pets.find(p=>p.id===id);if(!p||p.xp<100||p.evolution||p.evoStart)return false;p.evoStart=clone(s.stats);return true}
 const careTypes=['food','clean','joy','energy'],careTarget=3,careVarietyTarget=2;
 function evolutionCount(s,p,key){return Math.max(0,(s.stats[key]||0)-(p.evoStart?.[key]||0))}
 function usedCareTypes(s,p){return careTypes.filter(type=>evolutionCount(s,p,'care_'+type)>0)}
 function evolutionCareOptions(s,p){
  if(!p?.evoStart||p.evolution||p.xp<100||!s.pens.includes(p.id))return [];
  const used=usedCareTypes(s,p);
  const needsCare=evolutionCount(s,p,'care')<careTarget;
  return careTypes.filter(type=>p[type]>=95&&(needsCare||(used.length<careVarietyTarget&&!used.includes(type))));
 }
 function evolution(s,p){
  const delta=key=>evolutionCount(s,p,key);
  const played=['memory','count','pairs','snacks','colors','order','shapes','math','odd','path','music','melody','rhythm','fractions','change','earmemory','clock','patterns','english','ruler','pitch','phrases','reading'].filter(key=>delta('mini_'+key)>0).length;
  return [
   ['Thắng 2 lượt săn màu hoặc săn hình',delta('color')+delta('camera_shape'),2,'camera'],
   ['Chăm sóc 3 lần',delta('care'),careTarget],
   ['Dùng 2 cách chăm sóc khác nhau',usedCareTypes(s,p).length,careVarietyTarget],
   ['Hoàn thành 1 trò chơi',delta('mini'),1,'mini'],
   ['Chơi 2 trò khác nhau',Math.max(delta('positive')*2,played),2,'variety']
  ];
 }
 function evolve(s,id,date){const p=s.pets.find(p=>p.id===id);if(!p||!p.evoStart||p.evolution||evolution(s,p).some(([,n,target])=>n<target))return false;p.evolution=1;if(s.homeVersion===1)p.evolutionCredits=(p.evolutionCredits||0)+1;event(s,'evolve',date);return true}
 return {normalize,daily,event,startEvolution,evolution,evolutionCount,evolutionCareOptions,evolve,capacity};
})();


