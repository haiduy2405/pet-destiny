// Four independent local saves; keep the legacy key as a recovery backup.
const SaveStore=(()=>{
 const key='pet-destiny-slots-v1',legacy='pet-destiny-v1';
 const copy=value=>JSON.parse(JSON.stringify(value));
 function valid(s){return s&&Array.isArray(s.eggs)&&Array.isArray(s.pets)&&Array.isArray(s.collection)&&Number.isFinite(s.coins)}
 function load(){const raw=localStorage.getItem(key);if(raw!==null){const data=JSON.parse(raw);if(!data||data.version!==1||!Array.isArray(data.slots)||data.slots.length!==4||data.slots.some(s=>s!==null&&!valid(s.state)))throw Error('Invalid save data');return data}const data={version:1,slots:[null,null,null,null]};const old=localStorage.getItem(legacy);if(old){const state=JSON.parse(old);if(!valid(state))throw Error('Invalid legacy save');data.slots[0]={state,createdAt:Date.now(),updatedAt:Date.now()}}localStorage.setItem(key,JSON.stringify(data));return data}
 function write(data){localStorage.setItem(key,JSON.stringify(data))}
 /* Backup file: one JSON document that holds any of the four slots. Pure helpers, no DOM. */
 const FILE_APP='pet-destiny',FILE_FORMAT=1,MAX_FILE=8e6,SLOTS=4;
 const stamp=(v,d)=>Number.isFinite(+v)&&+v>0?+v:d;
 function exportData(data,picks){
  const want=picks===undefined?null:new Set(picks);
  const slots=[0,1,2,3].map(i=>{const s=data&&data.slots&&data.slots[i];return s&&valid(s.state)&&(!want||want.has(i))?{state:copy(s.state),createdAt:s.createdAt,updatedAt:s.updatedAt}:null});
  if(!slots.some(Boolean))throw Error('Nothing to export');
  return JSON.stringify({app:FILE_APP,format:FILE_FORMAT,exportedAt:Date.now(),slots});
 }
 function parseBackup(text){
  if(typeof text!=='string'||text.length>MAX_FILE)throw Error('Invalid backup file');
  const raw=JSON.parse(text);
  const ours=raw&&raw.app===FILE_APP&&raw.format===FILE_FORMAT,store=raw&&raw.version===1;
  if(!ours&&!store)throw Error('Not a Pet Destiny backup');
  if(!Array.isArray(raw.slots)||raw.slots.length!==SLOTS)throw Error('Invalid backup slots');
  const t=Date.now(),slots=raw.slots.map(s=>{if(s===null)return null;if(!s||!valid(s.state))throw Error('Invalid backup slot');return {state:copy(s.state),createdAt:stamp(s.createdAt,t),updatedAt:stamp(s.updatedAt,t)}});
  if(!slots.some(Boolean))throw Error('Empty backup');
  return {slots,exportedAt:stamp(raw.exportedAt,0)};
 }
 /* moves: [[slot in file, slot to write]]. Returns a new store; `data` is never touched. */
 function importInto(data,incoming,moves){
  if(!Array.isArray(moves)||!moves.length)throw Error('Nothing to import');
  const targets=new Set(),next=copy(data),overwritten=[];
  for(const mv of moves){
   const [from,to]=Array.isArray(mv)?mv:[];
   if(!Number.isInteger(from)||!Number.isInteger(to)||from<0||from>=SLOTS||to<0||to>=SLOTS)throw Error('Invalid import target');
   if(!incoming.slots[from])throw Error('Empty source slot');
   if(targets.has(to))throw Error('Duplicate import target');
   targets.add(to);if(next.slots[to])overwritten.push(to);
   next.slots[to]=copy(incoming.slots[from]);
  }
  return {data:next,overwritten};
 }
 return {load,write,copy,exportData,parseBackup,importInto};
})();
