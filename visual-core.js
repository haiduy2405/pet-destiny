const Visuals=(()=>{
 const shapes=[['circle','Hình tròn','<circle cx="50" cy="50" r="33"/>'],['square','Hình vuông','<rect x="18" y="18" width="64" height="64" rx="8"/>'],['triangle','Hình tam giác','<path d="M50 13 89 82H11Z" stroke-linejoin="round"/>'],['rectangle','Hình chữ nhật','<rect x="10" y="28" width="80" height="44" rx="6"/>'],['star','Ngôi sao','<path d="m50 8 12 27 30 3-23 21 7 31-26-16-26 16 7-31L8 38l30-3Z"/>'],['heart','Trái tim','<path d="M50 86C-9 49 14 1 50 30 86 1 109 49 50 86Z"/>'],['diamond','Hình thoi','<path d="m50 9 34 41-34 41-34-41Z"/>'],['hexagon','Hình lục giác','<path d="M29 13h42l21 37-21 37H29L8 50Z"/>']];
 function round(target,random=Math.random){const choices=Array.from({length:8},(_,i)=>({shape:(target+1+i%7)%8,color:Math.floor(random()*12)}));choices.push({shape:target,color:Math.floor(random()*12)});for(let i=choices.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[choices[i],choices[j]]=[choices[j],choices[i]]}return choices}
 function channel(v){return [0,v*.09,v*.3,v*.65,v,Math.min(1,v+.28)].map(x=>x.toFixed(4)).join(' ')}
 function palette(hex){return hex.slice(1).match(/../g).map(v=>channel(parseInt(v,16)/255))}
 return {shapes,round,palette};
})();
