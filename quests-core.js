/* Nhiệm vụ ngày (thuần logic). Số liệu ở EcoData.quests. Trạng thái: s.dq={date,claimed:[],bonus:false,streak,last}.
   Tiến độ đọc từ số sự kiện hôm nay (Adventure.daily(s,date).counts) nên không cần bọc thêm recordEvent. */
const Quests=(()=>{
 const Q=EcoData.quests;
 const hash=str=>{let h=2166136261;for(const c of str){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0};
 const today=date=>Q.slots.map((list,i)=>list[hash(date+'#'+i)%list.length]);
 const prev=date=>{const [y,m,d]=date.split('-').map(Number);return new Date(Date.UTC(y,m-1,d-1)).toISOString().slice(0,10)};
 function normalize(s,date){
  const d=s.dq;
  if(!d||typeof d!=='object')s.dq={date,claimed:[],bonus:false,streak:0,last:''};
  else{
   d.streak=Number.isSafeInteger(d.streak)&&d.streak>=0?d.streak:0;d.last=typeof d.last==='string'?d.last:'';
   if(d.date!==date){d.date=date;d.claimed=[];d.bonus=false;if(d.last!==prev(date))d.streak=0}
   if(!Array.isArray(d.claimed))d.claimed=[];
  }
  return s.dq;
 }
 const value=(metric,counts)=>{
  const c=counts||{};
  if(metric==='variety')return Object.keys(c).filter(k=>k.startsWith('mini_')&&c[k]>0).length;
  if(metric==='fish')return c.mini_fishing||0;
  if(metric==='hunt')return (c.color||0)+(c.camera_shape||0);
  return c[metric]||0;
 };
 const bonusPay=streak=>Q.bonus+Math.min(Math.max(streak-1,0),Q.streakCap)*Q.streakStep;
 function status(s,counts,date){
  const d=normalize(s,date);
  const items=today(date).map(q=>{const v=Math.min(q.target,value(q.metric,counts));return {...q,value:v,done:v>=q.target,claimed:d.claimed.includes(q.id)}});
  const allClaimed=items.every(x=>x.claimed);
  const nextStreak=d.last===prev(date)?d.streak+1:1;
  return {items,allClaimed,bonus:d.bonus,streak:d.streak,bonusPay:bonusPay(nextStreak),nextStreak,canBonus:allClaimed&&!d.bonus};
 }
 function claim(s,counts,date,id){
  const st=status(s,counts,date),q=st.items.find(x=>x.id===id);
  if(!q)return {ok:false,message:'Nhiệm vụ không tồn tại.'};
  if(q.claimed)return {ok:false,message:'Đã nhận rồi.'};
  if(!q.done)return {ok:false,message:'Chưa hoàn thành nhiệm vụ.'};
  s.dq.claimed.push(id);s.coins+=q.reward;
  return {ok:true,paid:q.reward,message:'Nhiệm vụ xong · +'+q.reward+' xu'};
 }
 function claimBonus(s,counts,date){
  const st=status(s,counts,date);
  if(st.bonus)return {ok:false,message:'Đã nhận thưởng hôm nay.'};
  if(!st.allClaimed)return {ok:false,message:'Nhận hết 4 nhiệm vụ trước đã.'};
  const d=s.dq;d.streak=st.nextStreak;d.last=date;d.bonus=true;s.coins+=st.bonusPay;
  return {ok:true,paid:st.bonusPay,streak:d.streak,message:'Hoàn thành ngày · chuỗi '+d.streak+' · +'+st.bonusPay+' xu'};
 }
 const maxDaily=()=>Q.slots.reduce((a,l)=>a+Math.max(...l.map(q=>q.reward)),0)+bonusPay(Q.streakCap+1);
 return {today,prev,normalize,value,status,claim,claimBonus,bonusPay,maxDaily};
})();
