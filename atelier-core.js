const Atelier=(()=>{
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number(n)||0));
 const isSign=id=>id==='woodsign'||id==='flowersign';
 function pose(id,i=0){const sign=isSign(id);return {id,x:sign?50:22+(i%4)*19,y:sign?19:68+(i%2)*12,scale:1,rotation:0,flip:false,z:sign?5:i%4}}
 function normalize(o){
  const sign=isSign(o.id);
  return {id:String(o.id),x:clamp(o.x,8,92),y:clamp(o.y,sign?10:35,90),scale:clamp(o.scale,.6,1.6),rotation:clamp(o.rotation,-45,45),flip:!!o.flip,z:clamp(o.z,0,10),...(sign?{text:cleanName(o.text)}:{})};
 }
 function objects(h){if(!h.roomObjects)h.roomObjects=[...new Set([h.equipped?.house,h.equipped?.toy,...(h.decor||[])].filter(Boolean))].map(pose);return h.roomObjects}
 function put(h,id){const list=objects(h);if(!h.owned.includes(id)||list.some(o=>o.id===id))return false;list.push(pose(id,list.length));return true}
 function commit(h,draft){const seen=new Set();h.roomObjects=draft.filter(o=>h.owned.includes(o.id)&&!seen.has(o.id)&&(seen.add(o.id),true)).map(normalize)}
 function wearPose(id, saved={}){
  return {id,x:clamp(saved.x,-110,110),y:clamp(saved.y,-130,130),scale:clamp(saved.scale??1,.35,2.2),rotation:clamp(saved.rotation,-180,180)};
 }
 function gesture(points){
  const [a,b]=points;
  if(!b)return {x:a.x,y:a.y,distance:0,angle:0};
  const dx=b.x-a.x,dy=b.y-a.y;
  return {x:(a.x+b.x)/2,y:(a.y+b.y)/2,distance:Math.hypot(dx,dy),angle:Math.atan2(dy,dx)};
 }
 function transform(pose,start,end,xUnits=1,yUnits=1){
  const pinch=start.distance>=4&&end.distance>=4;
  const radians=end.angle-start.angle;
  return {...pose,x:pose.x+(end.x-start.x)*xUnits,y:pose.y+(end.y-start.y)*yUnits,
   scale:pinch?pose.scale*end.distance/start.distance:pose.scale,
   rotation:pinch?(pose.rotation||0)+Math.atan2(Math.sin(radians),Math.cos(radians))*180/Math.PI:pose.rotation};
 }
 function cleanName(value){return Array.from(String(value||'').replace(/[\u0000-\u001f\u007f]/g,'').trim()).slice(0,24).join('')}
 function escape(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
 return {pose,normalize,objects,put,commit,wearPose,gesture,transform,isSign,cleanName,escape};
})();
