const GamePacks = (() => {
  const size = 5, reward = 35, practiceTarget = 3, practiceReward = 12;
  const cameraEvents = {colorMain: 'color', shapeMain: 'camera_shape'};
  const count = (state, id) => state.stats?.[cameraEvents[id] || 'mini_' + id] || 0;
  const completed = (state, entry) => count(state, entry.id) > entry.start;
  const entries = state => state.gamePacks?.entries || [];
  const canClaimToday = (state, date) => state.gamePacks?.lastClaim !== date;

  function roll(state, ids, date, random = Math.random) {
    if (!canClaimToday(state, date)) return false;
    const previous = entries(state);
    const next = previous.filter(entry => ids.includes(entry.id) && completed(state, entry));
    if (next.length === size) return false;

    const previousIds = new Set(previous.map(entry => entry.id));
    const remaining = ids.filter(id => !next.some(entry => entry.id === id));
    while (next.length < size && remaining.length) {
      // Offer different unfinished games first, then favor games with fewer lifetime clears.
      const alternatives = remaining.filter(id => !previousIds.has(id));
      const pool = alternatives.length ? alternatives : remaining;
      const weights = pool.map(id => (practiceTarget + 1 - Math.min(practiceTarget, count(state, id))) ** 2);
      let pick = random() * weights.reduce((sum, weight) => sum + weight, 0);
      const id = pool.find((_, i) => (pick -= weights[i]) < 0) || pool.at(-1);
      next.push({id, start: count(state, id)});
      remaining.splice(remaining.indexOf(id), 1);
    }
    if (next.length !== size) return false;
    (state.gamePacks ??= {}).entries = next;
    return true;
  }

  function claim(state, date) {
    const pack = entries(state);
    if (!canClaimToday(state, date) || pack.length !== size || !pack.every(entry => completed(state, entry))) return false;
    state.gamePacks.lastClaim = date;
    state.gamePacks.entries = [];
    state.coins += reward;
    return true;
  }

  function practiceReady(state, ids) {
    const claimed = state.gamePacks?.practiceClaimed || [];
    return ids.filter(id => count(state, id) >= practiceTarget && !claimed.includes(id));
  }

  function claimPractice(state, ids) {
    const ready = practiceReady(state, ids);
    if (!ready.length) return 0;
    const pack = state.gamePacks ??= {};
    pack.practiceClaimed = [...(pack.practiceClaimed || []), ...ready];
    const coins = ready.length * practiceReward;
    state.coins += coins;
    return coins;
  }

  return {size, reward, practiceTarget, practiceReward, count, completed, entries, canClaimToday, roll, claim, practiceReady, claimPractice};
})();
