const EggJourney=(()=>{
 const kinds={music:'Đọc nốt',melody:'Câu nhạc',rhythm:'Tiết tấu',math:'Tính toán',fractions:'Phân số',change:'Tiền thừa',earmemory:'Nhớ giai điệu'};
 function normalize(s){if(!s.eggJourney)s.eggJourney={starter:!!(s.pets.length||s.eggs.length||s.collection.length),stamps:[],lastClaim:null};return s.eggJourney}
 function stamp(s,type,first,answers,date){const j=normalize(s);if(!kinds[type]||j.lastClaim===date||j.stamps.includes(type))return false;if(type!=='math'&&(!answers||first/answers<.6))return false;j.stamps.push(type);return true}
 function claim(s,date,makeEgg){const j=normalize(s);if(!j.starter){j.starter=true;s.eggs.push(makeEgg());return {ok:true,starter:true}}if(j.lastClaim===date)return {ok:false,message:'Hôm nay đã nhận trứng học tập. Mai lại ghé nhé; xu từ game vẫn không giới hạn.'};if(j.stamps.length<3)return {ok:false,message:'Cần dấu của 3 trò học tập khác nhau.'};if(s.coins<60)return {ok:false,message:'Cần 60 xu phí đón trứng.'};s.coins-=60;j.stamps=[];j.lastClaim=date;s.eggs.push(makeEgg());return {ok:true,starter:false}}
 return {kinds,normalize,stamp,claim};
})();
