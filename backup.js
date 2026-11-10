/* Backup / restore UI for the save-slot dialog (slots.js calls bkPanel() and bkBind()). */
const BK_KEY='pet-destiny-last-backup',BK_STALE_DAYS=14;
function bkLast(){try{const v=Number(localStorage.getItem(BK_KEY));return Number.isFinite(v)&&v>0?v:0}catch{return 0}}
function bkMark(){try{localStorage.setItem(BK_KEY,String(now()))}catch{}}
const bkHasGames=()=>!slotError&&slotData.slots.some(Boolean);
const bkCanShare=()=>{try{return typeof File==='function'&&!!navigator.canShare&&navigator.canShare({files:[new File(['{}'],'x.json',{type:'application/json'})]})}catch{return false}};
function bkStatus(){
  if(!bkHasGames())return '';
  const t=bkLast();
  if(!t)return '<p class="bk-warn">⚠ Chưa sao lưu lần nào. Nếu xóa dữ liệu trình duyệt, tiến trình sẽ mất.</p>';
  const days=Math.floor((now()-t)/864e5);
  return days>=BK_STALE_DAYS?`<p class="bk-warn">⚠ Đã ${days} ngày chưa sao lưu. Nên sao lưu lại nhé.</p>`:`<p class="muted">Sao lưu lần cuối: ${slotTime(t)}</p>`;
}
function bkPanel(){
  return `<section class="bk-panel" aria-label="Sao lưu và khôi phục"><h3>🛟 Sao lưu &amp; khôi phục</h3><p class="muted">Tạo file dự phòng cả 4 ô lưu. Cất file ở nơi an toàn (Google Drive, Zalo, email...) rồi nhập lại khi đổi máy hoặc lỡ xóa dữ liệu.</p>${bkStatus()}<div class="bk-actions">${bkHasGames()?`<button id="bkSave">⬇ Tải file sao lưu</button>${bkCanShare()?'<button class="secondary" id="bkShare">📤 Chia sẻ</button>':''}`:''}<button class="secondary" id="bkLoad">📂 Khôi phục từ file</button></div><input type="file" id="bkFile" accept=".json,application/json"></section>`;
}
function bkBind(){
  const d=slotDialog,q=id=>d.querySelector('#'+id);
  if(q('bkSave'))q('bkSave').onclick=()=>bkExport(false);
  if(q('bkShare'))q('bkShare').onclick=()=>bkExport(true);
  if(q('bkLoad'))q('bkLoad').onclick=()=>q('bkFile').click();
  if(q('bkFile'))q('bkFile').onchange=async e=>{
    const file=e.target.files[0];e.target.value='';if(!file)return;
    if(file.size>8e6){notice('File quá lớn, không phải file sao lưu Làng Bạn Nhỏ.');return}
    let incoming;
    try{incoming=SaveStore.parseBackup(await file.text())}catch{notice('File này không phải bản sao lưu Làng Bạn Nhỏ hợp lệ.');return}
    bkReview(incoming);
  };
}
async function bkExport(share){
  if(activeSlot!==null&&!save())return;
  let text;try{text=SaveStore.exportData(slotData)}catch{notice('Chưa có game nào để sao lưu.');return}
  const name=`lang-ban-nho-${day()}.json`;
  if(share){
    try{const file=new File([text],name,{type:'application/json'});await navigator.share({files:[file],title:'Sao lưu Làng Bạn Nhỏ'});bkMark();notice('Đã chia sẻ file sao lưu.');drawSlots()}
    catch(err){if(err&&err.name!=='AbortError')notice('Không chia sẻ được. Hãy thử “Tải file sao lưu”.')}
    return;
  }
  bkSaveBlob(new Blob([text],{type:'application/json'}),name);
  bkMark();notice('Đã tạo file '+name+'. Hãy cất ở nơi an toàn nhé.');drawSlots();
}
function bkSaveBlob(blob,name){
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),4000);
}
const bkSlotName=(s,i)=>Atelier.escape(s?.state.saveName||'Game '+(i+1));
function bkReview(incoming){
  const from=incoming.slots.map((s,i)=>s?i:-1).filter(i=>i>=0),cur=slotError?[null,null,null,null]:slotData.slots;
  const taken=new Set(),pick={};
  for(const i of from){let t=!cur[i]&&!taken.has(i)?i:cur.findIndex((s,k)=>!s&&!taken.has(k));pick[i]=t;if(t>=0)taken.add(t)}
  let armed=false;
  const draw=()=>{
    const moves=from.filter(i=>pick[i]>=0).map(i=>[i,pick[i]]),over=moves.filter(([,t])=>cur[t]).map(([,t])=>t);
    d.innerHTML=`<div class="eyebrow">KHÔI PHỤC TỪ FILE</div><h2>Chọn game muốn đưa vào</h2>${slotError?'<p class="bk-warn">Dữ liệu hiện tại đang bị lỗi. Khôi phục sẽ ghi đè dữ liệu lỗi đó.</p>':''}<div class="bk-list">${from.map(i=>{const s=incoming.slots[i];return `<article class="bk-item"><div><b>${bkSlotName(s,i)}</b><p>🪙 ${s.state.coins} · ${s.state.pets.length} thú · ${s.state.eggs.length} trứng</p><small>Lưu: ${slotTime(s.updatedAt)}</small></div><label>Đưa vào<select data-from="${i}"><option value="-1" ${pick[i]<0?'selected':''}>Bỏ qua</option>${[0,1,2,3].map(t=>`<option value="${t}" ${pick[i]===t?'selected':''}>Ô ${t+1}${cur[t]?' · thay '+bkSlotName(cur[t],t):' · trống'}</option>`).join('')}</select></label></article>`}).join('')}</div>${over.length?`<p class="bk-warn" role="alert">⚠ Sẽ thay thế: ${over.map(t=>'ô '+(t+1)+' ('+bkSlotName(cur[t],t)+')').join(', ')}. Không thể hoàn tác.</p>`:''}${new Set(moves.map(m=>m[1])).size<moves.length?'<p class="bk-warn" role="alert">Hai game đang chọn cùng một ô. Hãy chọn ô khác.</p>':''}<div class="actions"><button class="secondary" id="bkCancel">Quay lại</button><button id="bkGo" class="${armed?'danger':''}" ${moves.length&&new Set(moves.map(m=>m[1])).size===moves.length?'':'disabled'}>${armed?'Xác nhận thay thế':'Khôi phục'}</button></div>`;
    d.querySelectorAll('[data-from]').forEach(sel=>sel.onchange=()=>{pick[Number(sel.dataset.from)]=Number(sel.value);armed=false;draw()});
    d.querySelector('#bkCancel').onclick=drawSlots;
    d.querySelector('#bkGo').onclick=()=>{if(over.length&&!armed){armed=true;draw();return}bkApply(incoming,moves)};
  };
  const d=slotDialog;draw();
}
function bkApply(incoming,moves){
  const base=slotError?{version:1,slots:[null,null,null,null]}:slotData;let res;
  try{res=SaveStore.importInto(base,incoming,moves)}catch{notice('Không khôi phục được. Dữ liệu hiện tại được giữ nguyên.');drawSlots();return}
  for(const s of res.data.slots)if(s&&s.state.saveName)s.state.saveName=Atelier.cleanName(s.state.saveName)||s.state.saveName;
  if(!persistSlots(res.data))return;
  slotError=false;
  if(activeSlot!==null&&res.overwritten.includes(activeSlot)){state=SaveStore.copy(slotData.slots[activeSlot].state);current='garden';match=false;photoTarget=null;render();updateSlotButton()}
  drawSlots();notice(`Đã khôi phục ${moves.length} game.`);
}
