/* Reward balance: every game pays the same (PAY), +up to 5 for first-try accuracy.
   Variety bonus: the first completion of each game each day pays +DAILY_FIRST. */
const PAY=EcoData.reward.pay,DAILY_FIRST=EcoData.reward.dailyFirst;
arcadeGames.forEach(g=>{g[4]=PAY});
Object.values(practiceGames).forEach(g=>{g.reward=PAY});
const rewardEventBase=recordEvent;
recordEvent=function(type){
  if(activeSlot!==null&&(/^mini_/.test(type)||type==='color'||type==='camera_shape')&&!Adventure.daily(state,day()).counts[type]){
    state.coins+=DAILY_FIRST;
    setTimeout(()=>{notice('🎯 Trò mới hôm nay: +'+DAILY_FIRST+' xu');if($('coins'))$('coins').textContent=state.coins},900);
  }
  return rewardEventBase(type);
};
