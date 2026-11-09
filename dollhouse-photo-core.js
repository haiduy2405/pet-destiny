/* Pure helpers for the "photo of my room" feature: how each wall/floor is painted on a canvas,
   how big things are, and file names. The browser side (dollhouse-photo.js) only executes these. */
const DollPhotoCore=(()=>{
 const W=1080,H=810,CAP=150,FRAME=14,REF=360; // photo size, caption band, border; REF = css px width the room styles were designed for
 const scale=W/REF;
 const S=c=>({k:'solid',c});
 const walls={cream:S('#fff1d6'),sky:S('#cfe8ff'),mint:S('#d3f2e0'),pink:S('#ffd9e6'),lavender:S('#e5dcff'),
  stripe:{k:'stripes',dir:'v',a:'#ffe3ec',b:'#fff7fa',pa:18,pb:18},
  dots:{k:'dots',bg:'#fff6d9',c:'#ffd166',step:26,r:.155},
  stars:{k:'dots',bg:'#2f3a78',c:'#ffffff',step:34,r:.06},
  brick:{k:'stripes',dir:'h',a:'#c8765a',b:'#e9d3c4',pa:14,pb:2,fromEnd:true}};
 const floors={wood:{k:'stripes',dir:'v',a:'#d9a566',b:'#c98f52',pa:38,pb:2},
  tile:{k:'checker',a:'#ffffff',b:'#d7e4ea',size:48},
  carpet:S('#d9605e'),pinkrug:S('#f3a6c3'),blue:S('#8fc1e8'),
  grass:{k:'stripes',dir:'v',a:'#8ad07a',b:'#7cc46c',pa:12,pb:12},
  marble:{k:'grad',angle:135,stops:[[0,'#f4f4f6'],[.45,'#d9dbe3'],[1,'#f4f4f6']]}};
 const wallSpec=id=>walls[id]||walls.cream,floorSpec=id=>floors[id]||floors.wood;
 const WALL_FRAC=.64;
 const objSize=s=>Math.round(.125*W*(Number.isFinite(+s)?Math.min(3,Math.max(.5,+s)):1));
 /* the pet's box: bottom-right anchored at the corner by default, or centred on a spot (percent) after a visit */
 function petBox(pos,growth){
  const g=Math.min(1.15,Math.max(.5,Number.isFinite(+growth)?+growth:1)),w=Math.round(.25*W),h=w;
  const cx=pos?pos.x/100*W:.99*W-w/2,bottom=pos?pos.y/100*H:.98*H;
  return {x:Math.round(cx-w/2),y:Math.round(bottom-h),w,h,g};
 }
 const sheetCell=species=>({sx:(species%4)*300,sy:Math.floor(species/4)*300,sw:300,sh:300});
 const fileName=(roomId,date)=>`pet-destiny-${String(roomId).replace(/[^a-z0-9]/gi,'')||'room'}-${String(date).replace(/[^0-9-]/g,'')}.png`;
 const drawOrder=objs=>[...objs].sort((a,b)=>a.y-b.y||a.u-b.u);
 return {W,H,CAP,FRAME,scale,WALL_FRAC,walls,floors,wallSpec,floorSpec,objSize,petBox,sheetCell,fileName,drawOrder};
})();
