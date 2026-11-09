const shopDialog=document.createElement('dialog');shopDialog.id='shopDialog';shopDialog.setAttribute('aria-label','Cửa hàng khu vườn');document.body.append(shopDialog);
function showShop(){drawShop();if(!shopDialog.open)shopDialog.showModal()}
const beforeShopRender=render;render=function(){Economy.normalize(state);beforeShopRender();let b=$('openShop');if(!b){b=document.createElement('button');b.id='openShop';b.className='save-menu shop-menu';b.textContent='🛍 Cửa hàng';b.onclick=showShop;document.querySelector('header').append(b)}b.disabled=activeSlot===null;};

