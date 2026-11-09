// Shared enclosure; only assigned pets appear in the garden scene.
const gardenDialog=document.createElement('dialog');gardenDialog.id='gardenDialog';document.body.append(gardenDialog);
let gardenPanel=null;
function openGardenPanel(mode,id=null){gardenPanel={mode,id};drawGardenPanel();if(!gardenDialog.open)gardenDialog.showModal()}
function closeGardenPanel(){gardenPanel=null;gardenDialog.close()}
gardenDialog.addEventListener('close',()=>{gardenPanel=null});
const beforeSharedGardenRender=render;
render=function(){Adventure.normalize(state);beforeSharedGardenRender();document.body.dataset.page=current;if(current==='garden'&&gardenDialog.open&&gardenPanel)drawGardenPanel()};
function drawGardenPanel(){const panel=gardenPanel;if(!panel)return;Adventure.normalize(state);const body=`<h2 id="gardenPanelTitle">Nhà trứng</h2><p class="muted">Ấp trứng để có thêm bạn mới. Shop mua trứng chưa ấp với giá 15 xu, không giới hạn theo ngày.</p><div class="nursery-list">${state.eggs.map(e=>`<article><div class="nursery-egg"><span class="egg" style="--egg-color:${COLORS[e.color][1]}"></span></div><h3>${petName(e)}</h3>${e.hatchAt?`<p data-countdown="${e.id}">Đang ấp · còn ${Math.max(0,Math.ceil((e.hatchAt-now())/1000))} giây</p>`:`<div class="actions"><button data-nursery-hatch="${e.id}">Ấp ${state.firstHatch?'miễn phí':'· 20 xu'}</button><button class="secondary" data-nursery-sell="${e.id}">Bán · +15 xu</button></div>`}</article>`).join('')||'<p class="empty">Chưa có trứng. Xin quẻ và hoàn thành thử thách màu để nhận trứng nhé.</p>'}</div>`;gardenDialog.innerHTML=`<button class="panel-close" aria-label="Đóng thông tin" id="closeGardenPanel">✕</button>${body}<button class="secondary panel-bottom-close" id="closeGardenBottom">Đóng</button>`;gardenDialog.setAttribute('aria-labelledby','gardenPanelTitle');$('closeGardenPanel').onclick=closeGardenPanel;$('closeGardenBottom').onclick=closeGardenPanel;gardenDialog.querySelectorAll('[data-nursery-hatch]').forEach(b=>b.onclick=()=>{const e=state.eggs.find(e=>e.id===b.dataset.nurseryHatch);if(!e||e.hatchAt)return;if(!state.firstHatch&&state.coins<20)return notice('Cần 20 xu để ấp trứng.');if(!state.firstHatch)state.coins-=20;state.firstHatch=false;e.hatchAt=now()+60000;save();render()});gardenDialog.querySelectorAll('[data-nursery-sell]').forEach(b=>b.onclick=()=>{const result=Economy.sellEgg(state,b.dataset.nurserySell,day());if(!result.ok)return notice(result.message);save();render();notice(result.message)})}





