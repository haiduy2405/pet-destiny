/* Install-as-app support: register the service worker and ask the browser not to evict saved games. */
(()=>{
  const secure=location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1';
  if(secure&&'serviceWorker' in navigator)addEventListener('load',()=>{navigator.serviceWorker.register('sw.js',{updateViaCache:'none'}).catch(()=>{})});
  try{const p=navigator.storage&&navigator.storage.persist&&navigator.storage.persist();if(p&&p.catch)p.catch(()=>{})}catch{}
})();
