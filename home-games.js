/* Maths games played "in the house": pretend cooking (kitchen) and gardening (garden). Registered like any practice game, so
   rewards, daily bonus, quests and evolution progress all come from the existing pipeline. Must load before rewards.js. */
const homeGame=(id,icon,title,intro,gen)=>{
  practiceGames[id]={icon,title,intro,rounds:6,reward:15,question(round,session){
    const q=gen(round,rand,session?.level||2);
    return {prompt:`<p>${q.text}</p><p class="practice-word home-icons" aria-hidden="true">${q.icons}</p>`,options:q.options,answer:q.answer,hint:q.hint,explanation:q.explanation};
  }};
  arcadeGames.push([id,icon,title,intro,15]);
};
homeGame('cook','🍳','Nấu ăn đồ hàng','Em là đầu bếp nhí! Tính xem cần bao nhiêu nguyên liệu để nấu món ngon.',HomeGames.cook);
homeGame('garden','🌱','Làm vườn vui','Chăm sóc khu vườn nhỏ: đếm cây, gộp lại và bớt đi.',HomeGames.garden);
gameSubjects.find(([s])=>s==='Toán')[1].push('cook','garden');
