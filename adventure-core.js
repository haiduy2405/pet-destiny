const Adventure=(()=>{
 const clone=x=>JSON.parse(JSON.stringify(x));
 function normalize(s){s.stats??={};s.habitJobs??={};s.pens??=[null,null,null,null];s.pens=Array.from({length:4},(_,i)=>s.pets.some(p=>p.id===s.pens[i])?s.pens[i]:null);s.pens=s.pens.map((id,i)=>id&&s.pens.indexOf(id)!==i?null:id);for(const p of s.pets){p.xp=Math.max(0,Math.min(100,Number(p.xp)||0));p.evolution??=0}return s}
 function daily(s,date){if(s.questDay?.date!==date)s.questDay={date,counts:{},claimed:[]};return s.questDay}
 function event(s,type,date){normalize(s);const d=daily(s,date);s.stats[type]=(s.stats[type]||0)+1;d.counts[type]=(d.counts[type]||0)+1}
 function growth(s,amount){const p=s.pets.find(p=>p.id===s.pens.find(Boolean))||s.pets[0];if(p&&!p.evolution)p.xp=Math.min(100,p.xp+amount)}
 function startEvolution(s,id){normalize(s);const p=s.pets.find(p=>p.id===id);if(!p||p.xp<100||p.evolution||p.evoStart)return false;p.evoStart=clone(s.stats);return true}
 function evolution(s,p){const delta=k=>Math.max(0,(s.stats[k]||0)-(p.evoStart?.[k]||0));return [['Tìm đúng 2 màu',delta('color'),2],['Chăm sóc 3 lần',delta('care'),3],['Dùng 2 cách chăm sóc khác nhau',['food','clean','joy','energy'].filter(k=>delta('care_'+k)>0).length,2],['Hoàn thành 1 trò chơi',delta('mini'),1],['Chơi 2 trò khác nhau',Math.max(delta('positive')*2,['memory','count','pairs','snacks','colors','order'].filter(k=>delta('mini_'+k)>0).length),2]]}
 function evolve(s,id,date){const p=s.pets.find(p=>p.id===id);if(!p||!p.evoStart||p.evolution||evolution(s,p).some(([,n,target])=>n<target))return false;p.evolution=1;event(s,'evolve',date);return true}
 function assign(s,index,id){normalize(s);if(!Number.isInteger(index)||index<0||index>3||id!==null&&!s.pets.some(p=>p.id===id))return false;if(id)s.pens=s.pens.map(p=>p===id?null:p);s.pens[index]=id;return true}
 return {normalize,daily,event,growth,startEvolution,evolution,evolve,assign};
})();
