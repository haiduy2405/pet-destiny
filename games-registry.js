/* Sổ đăng ký trò chơi: thay chuỗi bọc `startMini` ở nhiều file. Mỗi game gọi Games.on(loại | [các loại] | hàm kiểm tra, hàm bắt đầu).
   Đăng ký sau thì được hỏi trước (đúng như chuỗi bọc cũ), không khớp thì rơi về startMini gốc của adventure.js (memory/count).
   Hai "lớp bọc ngang" còn lại (arcade-levels.js, levels.js: chọn mức khó) vẫn bọc ngoài cùng vì chúng áp cho nhiều game.
   Load NGAY SAU adventure.js, trước arcade.js. */
const Games=(()=>{
  const entries=[],base=startMini;
  const matcher=m=>typeof m==='function'?m:Array.isArray(m)?t=>m.includes(t):t=>t===m;
  function on(match,fn){entries.unshift({test:matcher(match),fn})}
  const find=type=>entries.find(e=>e.test(type));
  return {on,find,base,entries};
})();
startMini=function(type){const e=Games.find(type);return e?e.fn(type):Games.base(type)};
