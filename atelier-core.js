const Atelier=(()=>{
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number(n)||0));
 function pose(id,i=0){return {id,x:22+(i%4)*19,y:68+(i%2)*12,scale:1,rotation:0,flip:false,z:i%4}}
 function normalize(o){return {id:String(o.id),x:clamp(o.x,8,92),y:clamp(o.y,35,90),scale:clamp(o.scale,.6,1.6),rotation:clamp(o.rotation,-45,45),flip:!!o.flip,z:clamp(o.z,0,10)}}
 function objects(h){if(!h.roomObjects)h.roomObjects=[...new Set([h.equipped?.house,h.equipped?.toy,...(h.decor||[])].filter(Boolean))].map(pose);return h.roomObjects}
 function put(h,id){const list=objects(h);if(!h.owned.includes(id)||list.some(o=>o.id===id))return false;list.push(pose(id,list.length));return true}
 function commit(h,draft){const seen=new Set();h.roomObjects=draft.filter(o=>h.owned.includes(o.id)&&!seen.has(o.id)&&(seen.add(o.id),true)).map(normalize)}
 function cleanName(value){return Array.from(String(value||'').replace(/[\u0000-\u001f\u007f]/g,'').trim()).slice(0,24).join('')}
 function escape(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
 return {pose,normalize,objects,put,commit,cleanName,escape};
})();
