const IdleIncome=(()=>{
 const unit=1000000,offlineCap=7200000;
 function rates(s,items){const prices=new Map(items.map(x=>[x.id,x.price]));const raw=s.homes.map((h,page)=>{const p=s.pets.find(p=>p.id===h.petId);if(!p)return {page,petId:null,raw:0};const furnishing=[...new Set(h.owned)].reduce((n,id)=>n+(prices.get(id)||0),0);return {page,petId:p.id,raw:4000+Math.min(16000,800*Math.sqrt((p.totalXP||0)/100))+Math.min(12000,600*Math.sqrt(furnishing/20))+(p.evolution?2000:0)}});const sum=raw.reduce((n,r)=>n+r.raw,0);return raw.map(r=>({page:r.page,petId:r.petId,rate:Math.floor(r.raw*40000/(40000+sum))}))}
 function normalize(s,t,rates){if(!s.income)s.income={last:t,remainder:0,carry:0,total:0,rates};return s.income}
 function settle(s,t,nextRates,online=false){const i=normalize(s,t,nextRates),delta=t-i.last;if(delta<=0)return {coins:0,micro:0,delta:0};const ms=Math.min(delta,online?5000:offlineCap),rate=i.rates.reduce((n,r)=>n+r.rate,0),denominator=online?1000:4000;
  // Carry uses a common denominator of 4000 so splitting time never duplicates money.
  const numerator=ms*rate*(online?4:1)+(i.carry||0),micro=Math.floor(numerator/4000);i.carry=numerator%4000;i.remainder+=micro;i.total+=micro;const coins=Math.floor(i.remainder/unit);i.remainder%=unit;s.coins+=coins;i.last=t;i.rates=nextRates;return {coins,micro,delta:ms};
 }
 function rebase(s,t,nextRates){const i=normalize(s,t,nextRates);i.rates=nextRates;return i}
 return {unit,offlineCap,rates,normalize,settle,rebase};
})();
