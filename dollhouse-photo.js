/* "📸 Chụp ảnh phòng": paints the current room onto a canvas (no DOM screenshot, so it works on every browser). */
const dpPets=new Image();dpPets.src='pets.png';
const dpLoad=img=>img.complete&&img.naturalWidth?Promise.resolve():new Promise((ok,no)=>{img.onload=ok;img.onerror=no});
function dpPaint(ctx,spec,x,y,w,h){
  const P=DollPhotoCore,k=P.scale;ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();
  if(spec.k==='solid'){ctx.fillStyle=spec.c;ctx.fillRect(x,y,w,h)}
  else if(spec.k==='stripes'){
    const a=spec.pa*k,b=spec.pb*k,v=spec.dir==='v',len=v?w:h;ctx.fillStyle=spec.b;ctx.fillRect(x,y,w,h);ctx.fillStyle=spec.a;
    for(let o=0;o<len;o+=a+b){const from=spec.fromEnd?len-o-a:o;v?ctx.fillRect(x+from,y,a,h):ctx.fillRect(x,y+from,w,a)}
  }else if(spec.k==='dots'){
    const s=spec.step*k;ctx.fillStyle=spec.bg;ctx.fillRect(x,y,w,h);ctx.fillStyle=spec.c;
    for(let j=0;j<h+s;j+=s)for(let i=0;i<w+s;i+=s){ctx.beginPath();ctx.arc(x+i+s/2,y+j+s/2,spec.r*s,0,7);ctx.fill()}
  }else if(spec.k==='checker'){
    const s=spec.size*k/2;ctx.fillStyle=spec.a;ctx.fillRect(x,y,w,h);ctx.fillStyle=spec.b;
    for(let j=0,r=0;j<h;j+=s,r++)for(let i=0,c=0;i<w;i+=s,c++)if((r+c)%2===(0))ctx.fillRect(x+i,y+j,s,s);
  }else if(spec.k==='grad'){
    const a=spec.angle*Math.PI/180,dx=Math.sin(a),dy=-Math.cos(a),len=Math.abs(w*dx)+Math.abs(h*dy),cx=x+w/2,cy=y+h/2;
    const g=ctx.createLinearGradient(cx-dx*len/2,cy-dy*len/2,cx+dx*len/2,cy+dy*len/2);spec.stops.forEach(([t,c])=>g.addColorStop(t,c));ctx.fillStyle=g;ctx.fillRect(x,y,w,h);
  }
  ctx.restore();
}
async function dpRender(rid){
  const P=DollPhotoCore,d=dhD(),o=d.rooms[rid],r=DollHouse.room(rid),rt=DollHouse.rate(state,rid),W=P.W,H=P.H,F=P.FRAME;
  const c=document.createElement('canvas');c.width=W;c.height=H+P.CAP;const ctx=c.getContext('2d');
  ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H+P.CAP);
  const sx=F,sy=F,sw=W-2*F,sh=H-2*F,wallH=Math.round(sh*P.WALL_FRAC);
  dpPaint(ctx,P.wallSpec(o.wall),sx,sy,sw,wallH);dpPaint(ctx,P.floorSpec(o.floor),sx,sy+wallH,sw,sh-wallH);
  ctx.save();ctx.beginPath();ctx.rect(sx,sy,sw,sh);ctx.clip();
  const emoji='"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';ctx.textAlign='center';ctx.textBaseline='bottom';
  for(const x of P.drawOrder(o.objs)){
    const it=DollHouse.find(x.id),px=sx+x.x/100*sw,py=sy+x.y/100*sh,size=P.objSize(x.s);
    ctx.save();ctx.translate(px,py);ctx.scale(x.f?-1:1,1);ctx.font=size+'px '+emoji;ctx.shadowColor='rgba(0,0,0,.25)';ctx.shadowBlur=6;ctx.shadowOffsetY=3;ctx.fillText(it.icon,0,size*.12);ctx.restore();
  }
  const pet=dhPet();
  if(pet){
    try{
      await dpLoad(dpPets);
      const b=P.petBox(dhPetPos,.65+(pet.xp||0)*.0035),cell=P.sheetCell(pet.species),bw=b.w*b.g,bh=b.h*b.g,bx=sx+b.x*sw/W+(b.w-bw)/2*sw/W,by=sy+b.y*sh/H+(b.h-bh)*sh/H;
      ctx.save();if('filter' in ctx&&pet.color!==undefined&&pet.color!==null)ctx.filter=tint(pet.color);
      ctx.drawImage(dpPets,cell.sx,cell.sy,cell.sw,cell.sh,bx,by,bw*sw/W,bh*sh/H);ctx.restore();
      if(pet.evolution){ctx.font=Math.round(.07*W)+'px '+emoji;ctx.fillText('👑',bx+bw*sw/W/2,by+.12*bh*sh/H)}
    }catch{}
  }
  ctx.restore();
  const name=d.name||('Nhà của '+(dhRawName()||'em')),y0=H+P.CAP/2;
  ctx.fillStyle='#193d36';ctx.textAlign='left';ctx.textBaseline='middle';
  ctx.font='700 44px system-ui,sans-serif';ctx.fillText(`${r.icon} ${r.name} · ${'★'.repeat(rt.stars)}${'☆'.repeat(3-rt.stars)}`,36,y0-26);
  ctx.font='32px system-ui,sans-serif';ctx.fillStyle='#4d6556';ctx.fillText(name,36,y0+26);
  ctx.textAlign='right';ctx.font='700 30px Georgia,serif';ctx.fillStyle='#235c48';ctx.fillText('Pet Destiny ✦',W-36,y0-18);
  ctx.font='26px system-ui,sans-serif';ctx.fillStyle='#4d6556';ctx.fillText(new Date().toLocaleDateString('vi-VN'),W-36,y0+22);
  return c;
}
async function dpShoot(){
  if(!dhRoom)return;const rid=dhRoom;let canvas;
  try{canvas=await dpRender(rid)}catch{notice('Chưa chụp được ảnh. Thử lại nhé.');return}
  const blob=await new Promise(ok=>canvas.toBlob(ok,'image/png'));
  if(!blob){notice('Chưa chụp được ảnh. Thử lại nhé.');return}
  const url=URL.createObjectURL(blob),name=DollPhotoCore.fileName(rid,day()),canShare=(()=>{try{return !!navigator.canShare&&navigator.canShare({files:[new File([blob],name,{type:'image/png'})]})}catch{return false}})();
  const o=dhOverlay(`<div class="dh-cele-card dh-shot"><h2>📸 Ảnh phòng của bạn</h2><img src="${url}" alt="Ảnh căn phòng ${Atelier.escape(DollHouse.room(rid).name)}"><div class="actions"><button id="dpSave">⬇ Lưu ảnh</button>${canShare?'<button class="secondary" id="dpShare">📤 Chia sẻ</button>':''}<button class="secondary" id="dpClose">Đóng</button></div></div>`,'quiet');
  const close=()=>{o.remove();URL.revokeObjectURL(url)};
  o.querySelector('#dpClose').onclick=close;
  o.querySelector('#dpSave').onclick=()=>{bkSaveBlob(blob,name);notice('Đã lưu ảnh '+name)};
  if(canShare)o.querySelector('#dpShare').onclick=async()=>{try{await navigator.share({files:[new File([blob],name,{type:'image/png'})],title:'Phòng của mình'})}catch(e){if(e&&e.name!=='AbortError')notice('Không chia sẻ được. Hãy dùng “Lưu ảnh”.')}};
  o.querySelector('#dpClose').focus();
}
