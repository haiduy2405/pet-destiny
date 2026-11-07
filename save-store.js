// Four independent local saves; keep the legacy key as a recovery backup.
const SaveStore=(()=>{
 const key='pet-destiny-slots-v1',legacy='pet-destiny-v1';
 const copy=value=>JSON.parse(JSON.stringify(value));
 function valid(s){return s&&Array.isArray(s.eggs)&&Array.isArray(s.pets)&&Array.isArray(s.collection)&&Number.isFinite(s.coins)}
 function load(){const raw=localStorage.getItem(key);if(raw!==null){const data=JSON.parse(raw);if(!data||data.version!==1||!Array.isArray(data.slots)||data.slots.length!==4||data.slots.some(s=>s!==null&&!valid(s.state)))throw Error('Invalid save data');return data}const data={version:1,slots:[null,null,null,null]};const old=localStorage.getItem(legacy);if(old){const state=JSON.parse(old);if(!valid(state))throw Error('Invalid legacy save');data.slots[0]={state,createdAt:Date.now(),updatedAt:Date.now()}}localStorage.setItem(key,JSON.stringify(data));return data}
 function write(data){localStorage.setItem(key,JSON.stringify(data))}
 return {load,write,copy};
})();
