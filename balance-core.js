/* Cân bằng thưởng: xu theo công sức từng game + giảm dần khi lặp 1 game + thưởng đa dạng trong ngày.
   state.plays = {day, counts:{id:n}, bonus:[mốc đã nhận]}. Pure (không đụng DOM). */
const Balance=(()=>{
 /* Thưởng nền ~ công sức: số câu × độ nặng mỗi câu (bấm nhanh ≈ 9–12, tính toán/suy luận ≈ 20–30). Mặc định 15. */
 const base={
  count:10,memory:11,pairs:12,snacks:9,colors:10,order:11,odd:13,path:14,math:15,shapes:18,
  rhythm:18,music:18,melody:18,earmemory:18,fractions:22,change:20,
  clock:15,patterns:30,ruler:18,pitch:11,
  english:18,phrases:12,reading:24,scramble:19,listen:15,fillblank:16,hangman:17,minpair:13,
  tone:12,hoinga:12,spellvn:13,friend:12,oddword:12,proverb:14,wordtype:16,buildsen:20,
  speakecho:20,speakshadow:20,speakchat:20,speaktwister:20,cook:20,garden:18};
 const DEFAULT=15,MIN_PAY=3;
 const DECAY=[1,.7,.45,.25,.12]; /* lượt chơi thứ 1,2,3,4,5+ của cùng 1 game trong ngày */
 const MILESTONES=[[3,15],[6,30],[10,60]]; /* số game khác nhau trong ngày → xu thưởng 1 lần */
 const baseOf=id=>base[id]??DEFAULT;
 function today(s,day){
  const p=(s.plays&&typeof s.plays==='object')?s.plays:(s.plays={});
  if(p.day!==day||!p.counts||typeof p.counts!=='object'){p.day=day;p.counts={};p.bonus=[]}
  if(!Array.isArray(p.bonus))p.bonus=[];
  return p;
 }
 const plays=(s,day,id)=>{const n=today(s,day).counts[id];return Number.isFinite(n)&&n>0?Math.floor(n):0};
 const factor=(s,day,id)=>DECAY[Math.min(plays(s,day,id),DECAY.length-1)];
 /* xu cho 1 lần hoàn thành (chưa cộng thưởng mức khó & thưởng "trò mới hôm nay") */
 const pay=(s,day,id,first=0)=>Math.max(MIN_PAY,Math.round((baseOf(id)+Math.min(Math.max(first,0),5))*factor(s,day,id)));
 /* ghi nhận 1 lần hoàn thành; trả {bonus, milestone} nếu vừa đạt mốc đa dạng */
 function record(s,day,id){
  const p=today(s,day);p.counts[id]=plays(s,day,id)+1;
  const distinct=Object.keys(p.counts).length;let bonus=0,hit=null;
  for(const [n,coins] of MILESTONES)if(distinct>=n&&!p.bonus.includes(n)){p.bonus.push(n);bonus+=coins;hit=n}
  return {bonus,milestone:hit,distinct};
 }
 const nextMilestone=(s,day)=>{const p=today(s,day),d=Object.keys(p.counts).length,m=MILESTONES.find(([n])=>d<n);return m?{need:m[0]-d,coins:m[1],distinct:d}:null};
 return {base,baseOf,DECAY,MILESTONES,factor,pay,record,plays,nextMilestone,today};
})();
