/* Question generators for the two "in the house" maths games: pretend cooking and gardening.
   Pure: pass a rand(n) function. Every question carries `calc` so tests can recompute the answer. */
const HomeGames=(()=>{
 const pick=(arr,rand)=>arr[rand(arr.length)];
 const between=(a,b,rand)=>a+rand(b-a+1);
 function options(answer,near,rand){
  const set=new Set([String(answer)]);
  for(const n of near){if(set.size>=4)break;if(Number.isInteger(n)&&n>=0)set.add(String(n))}
  for(let k=1;set.size<4;k++)set.add(String(answer+k));
  return [...set].slice(0,4);
 }
 const foods=[['🥚','quả trứng'],['🍅','quả cà chua'],['🥕','củ cà rốt'],['🍎','quả táo'],['🥔','củ khoai'],['🍓','quả dâu'],['🧅','củ hành'],['🍋','quả chanh']];
 const dishes=['bánh','salad','súp','món chiên'];
 /* three kinds: multiply (recipe x portions), subtract (what is left), share (equal plates) */
 function cook(round,rand,level=2){
  const [icon,noun]=pick(foods,rand),kind=round%3,hard=level>=3||(level===2&&round>=3),dish=pick(dishes,rand);
  if(kind===0){
   const a=between(2,hard?6:4,rand),b=between(2,hard?5:3,rand),ans=a*b;
   return {kind:'multiply',calc:{a,b},answer:String(ans),options:options(ans,[a+b,ans+a,ans-a,ans+1],rand),
    text:`Mỗi phần ${dish} cần ${a} ${noun}. Làm ${b} phần thì cần bao nhiêu ${noun}?`,icons:icon.repeat(a),
    hint:`Có ${b} phần, mỗi phần ${a}. Hãy cộng ${a} lại ${b} lần.`,explanation:`${a} × ${b} = ${ans} ${noun}.`};
  }
  if(kind===1){
   const n=between(hard?9:6,hard?20:12,rand),u=between(2,n-1,rand),ans=n-u;
   return {kind:'subtract',calc:{n,u},answer:String(ans),options:options(ans,[n+u,ans+1,ans-1,u],rand),
    text:`Bếp có ${n} ${noun}. Em đã dùng ${u} ${noun} để nấu ${dish}. Còn lại bao nhiêu?`,icons:icon.repeat(Math.min(n,12)),
    hint:`Lấy ${n} bớt đi ${u}.`,explanation:`${n} − ${u} = ${ans}.`};
  }
  const k=between(2,hard?6:4,rand),q=between(2,hard?6:4,rand),total=k*q;
  return {kind:'share',calc:{total,k},answer:String(q),options:options(q,[total-k,q+1,q-1,k],rand),
   text:`Em chia đều ${total} ${noun} vào ${k} đĩa. Mỗi đĩa có bao nhiêu ${noun}?`,icons:icon.repeat(Math.min(total,24)),
   hint:`Chia ${total} thành ${k} phần bằng nhau.`,explanation:`${total} ÷ ${k} = ${q}.`};
 }
 const plants=[['🍅','cây cà chua'],['🌻','cây hướng dương'],['🥕','luống cà rốt'],['🌷','bông hoa tulip'],['🍓','bụi dâu']];
 /* three kinds: rows x columns, add, subtract */
 function garden(round,rand,level=2){
  const [icon,noun]=pick(plants,rand),kind=round%3,hard=level>=3||(level===2&&round>=3);
  if(kind===0){
   const r=between(2,hard?5:3,rand),c=between(2,hard?6:4,rand),ans=r*c;
   return {kind:'grid',calc:{r,c},answer:String(ans),options:options(ans,[r+c,ans+r,ans-c,ans+1],rand),
    text:`Bác trồng ${r} hàng, mỗi hàng ${c} ${noun}. Tất cả có bao nhiêu ${noun}?`,icons:(icon.repeat(c)+'\n').repeat(r).trim(),
    hint:`Đếm một hàng có ${c}, rồi cộng cho ${r} hàng.`,explanation:`${r} × ${c} = ${ans}.`};
  }
  if(kind===1){
   const a=between(hard?8:3,hard?20:9,rand),b=between(hard?6:2,hard?15:8,rand),ans=a+b;
   return {kind:'add',calc:{a,b},answer:String(ans),options:options(ans,[ans+1,ans-1,Math.abs(a-b),ans+10],rand),
    text:`Sáng em hái ${a} ${noun}, chiều hái thêm ${b}. Cả ngày em hái được bao nhiêu?`,icons:icon.repeat(Math.min(ans,20)),
    hint:`Gộp hai lần hái lại với nhau.`,explanation:`${a} + ${b} = ${ans}.`};
  }
  const n=between(hard?10:6,hard?24:12,rand),w=between(2,n-1,rand),ans=n-w;
  return {kind:'subtract',calc:{n,w},answer:String(ans),options:options(ans,[n+w,ans+1,ans-1,w],rand),
   text:`Vườn có ${n} ${noun}, ${w} cây bị sâu ăn. Còn lại bao nhiêu cây khỏe?`,icons:icon.repeat(Math.min(n,20)),
   hint:`Lấy ${n} bớt đi ${w}.`,explanation:`${n} − ${w} = ${ans}.`};
 }
 return {cook,garden,options};
})();
