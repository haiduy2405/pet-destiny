/* Khung dùng chung cho các tab phụ và giao dịch an toàn.
   - Tabs: mỗi tab phụ (Ngôi nhà, Nông trại, Câu cá...) chỉ cần Tabs.register({...}); không còn tự bọc render() và tự chèn nút nav.
     Thứ tự đăng ký = thứ tự nút. Hook: open() khi bấm nút, leave() mỗi lần vẽ lại (dừng timer/vòng lặp), canDraw(), draw().
   - txn(fn): sao lưu state → fn() → lưu; fn trả {ok:false,message} hoặc lưu hỏng thì hoàn lại state.
   Load SAU mọi file bọc render của tab gốc, TRƯỚC dollhouse.js (tab đầu tiên đăng ký). */
const Tabs=(()=>{
  const list=[],find=id=>list.find(t=>t.id===id);
  function register(t){
    if(!t||!t.id||typeof t.draw!=='function')throw Error('Tab cần id và draw()');
    if(find(t.id))throw Error('Tab trùng: '+t.id);
    list.push({page:t.id,...t});
  }
  function nav(){
    const el=$('nav');if(!el)return;
    for(const t of list){
      if(el.querySelector(`[data-tab="${t.id}"]`))continue;
      const b=document.createElement('button');b.dataset.tab=t.id;
      b.innerHTML=`<span class="nav-icon" aria-hidden="true">${t.icon}</span><span>${t.label}</span>`;
      b.onclick=()=>{current=t.id;if(t.open)t.open();render();window.scrollTo(0,0)};
      el.append(b);
    }
    const mine=find(current);
    if(mine)el.querySelectorAll('[data-tab]').forEach(x=>{const on=x.dataset.tab===mine.id;x.classList.toggle('active',on);on?x.setAttribute('aria-current','page'):x.removeAttribute('aria-current')});
    const vis=[...el.children].filter(x=>getComputedStyle(x).display!=='none').length||4;
    el.style.gridTemplateColumns=`repeat(${vis},minmax(0,1fr))`;
  }
  return {register,find,list,nav};
})();
/* render() gốc chỉ biết các tab cố định, nên tab phụ được vẽ bằng cách tạm đổi current='collection' rồi vẽ đè lên */
const tabsBaseRender=render;
render=function(){
  const t=Tabs.find(current);
  if(t)current='collection';
  tabsBaseRender();
  if(t)current=t.id;
  for(const x of Tabs.list)if(x.leave)x.leave();
  Tabs.nav();
  if(t&&(!t.canDraw||t.canDraw())){document.body.dataset.page=t.page;t.draw()}
};
/* giao dịch an toàn dùng chung (thay cho fmDo/fsDo/... lặp ở nhiều file) */
function txn(fn){
  if(activeSlot===null)return null;
  const backup=SaveStore.copy(state),res=fn();
  if(!res||!res.ok){state=backup;if(res&&res.message)notice(res.message);return res}
  if(!save()){state=backup;notice('Chưa lưu được, thử lại nhé.');return {ok:false}}
  if($('coins'))$('coins').textContent=state.coins;
  return res;
}
