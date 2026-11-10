/* Cài như app + toàn màn hình.
   - Service worker và xin giữ dữ liệu lưu (như trước).
   - Toàn màn hình: trình duyệt chỉ cho vào khi người dùng chạm, nên vào chạm đầu tiên sẽ bật (Android/máy tính). Thoát bằng tay một lần thì
     ghi nhớ và không tự bật lại; nút ⛶ trên đầu trang bật/tắt thủ công.
   - Cách triệt để nhất là cài ra màn hình chính (manifest display=fullscreen): Android có nút "📲 Cài app", iPhone hiện hướng dẫn "Thêm vào MH chính". */
(()=>{
  const secure=location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1';
  if(secure&&'serviceWorker' in navigator)addEventListener('load',()=>{navigator.serviceWorker.register('sw.js',{updateViaCache:'none'}).catch(()=>{})});
  try{const p=navigator.storage&&navigator.storage.persist&&navigator.storage.persist();if(p&&p.catch)p.catch(()=>{})}catch{}

  const get=k=>{try{return localStorage.getItem(k)}catch{return null}},set=(k,v)=>{try{localStorage.setItem(k,v)}catch{}};
  const standalone=()=>matchMedia('(display-mode: fullscreen)').matches||matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
  const root=document.documentElement,canFs=!!(root.requestFullscreen||root.webkitRequestFullscreen);
  const inFs=()=>!!(document.fullscreenElement||document.webkitFullscreenElement);
  const enter=()=>{try{const r=(root.requestFullscreen||root.webkitRequestFullscreen).call(root,{navigationUI:'hide'});if(r&&r.catch)r.catch(()=>{})}catch{}};
  const leave=()=>{try{(document.exitFullscreen||document.webkitExitFullscreen).call(document)}catch{}};
  const header=()=>document.querySelector('header');
  function addBtn(id,label,title,onclick){
    const h=header();if(!h||document.getElementById(id))return null;
    const b=document.createElement('button');b.id=id;b.type='button';b.className='display-toggle';b.textContent=label;b.title=title;b.setAttribute('aria-label',title);b.onclick=onclick;h.appendChild(b);return b;
  }
  if(standalone())return; /* đã chạy như app: không còn thanh trình duyệt, khỏi cần gì thêm */

  /* 1) nút ⛶ và tự bật ở lần chạm đầu */
  if(canFs){
    const btn=addBtn('fsToggle','⛶','Bật/tắt toàn màn hình',()=>{if(inFs()){set('pet-destiny-fs','off');leave()}else{set('pet-destiny-fs','on');enter()}});
    if(get('pet-destiny-fs')!=='off'){
      const first=()=>{removeEventListener('pointerup',first,true);if(!inFs()&&get('pet-destiny-fs')!=='off')enter()};
      addEventListener('pointerup',first,true);
    }
    const sync=()=>{if(btn)btn.setAttribute('aria-pressed',String(inFs()))};
    document.addEventListener('fullscreenchange',sync);document.addEventListener('webkitfullscreenchange',sync);
  }

  /* 2) Android/Chrome: nút cài app */
  let deferred=null;
  addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e;addBtn('installBtn','📲 Cài app','Cài Pet Destiny ra màn hình chính để chơi toàn màn hình',async()=>{try{deferred.prompt();await deferred.userChoice}catch{}deferred=null;document.getElementById('installBtn')?.remove()})});
  addEventListener('appinstalled',()=>{document.getElementById('installBtn')?.remove()});

  /* 3) iPhone/iPad Safari: không có API toàn màn hình, chỉ có cách thêm vào màn hình chính */
  const ios=/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  if(ios&&!canFs&&get('pet-destiny-ios-hint')!=='done')addEventListener('load',()=>setTimeout(()=>{
    if(document.querySelector('.fs-hint'))return;
    const d=document.createElement('div');d.className='fs-hint';d.setAttribute('role','dialog');
    d.innerHTML='<b>Chơi toàn màn hình:</b> bấm nút <b>Chia sẻ</b> ⬆️ của Safari rồi chọn <b>Thêm vào MH chính</b>. Mở game từ biểu tượng mới sẽ không còn thanh địa chỉ.<br><button type="button">Đã hiểu</button>';
    d.querySelector('button').onclick=()=>{set('pet-destiny-ios-hint','done');d.remove()};document.body.appendChild(d);
  },2500));
})();
