const practiceGames = {
  clock: {
    icon: '🕰️', title: 'Đọc đồng hồ', rounds: 5, reward: 12,
    intro: 'Đọc giờ trên đồng hồ kim. Kim ngắn chỉ giờ, kim dài chỉ phút. Mỗi số trên mặt đồng hồ cách nhau 5 phút.',
    question() {
      const hour = 1 + rand(12), minute = 5 * rand(12);
      const time = (h, m) => h + ':' + String(m).padStart(2, '0');
      const answer = time(hour, minute);
      const options = [answer, time(hour % 12 + 1, minute), time(hour, (minute + 5) % 60), time(hour, (minute + 15) % 60)];
      const labels = Array.from({length: 12}, (_, i) => {
        const angle = i * Math.PI / 6;
        return `<text x="${80 + Math.sin(angle) * 58}" y="${80 - Math.cos(angle) * 58}">${i || 12}</text>`;
      }).join('');
      const prompt = `<svg class="practice-clock" viewBox="0 0 160 160" role="img" aria-label="Đồng hồ kim"><circle cx="80" cy="80" r="77"/>${labels}
        <line class="clock-hour" x1="80" y1="80" x2="80" y2="46" transform="rotate(${hour * 30 + minute / 2} 80 80)"/>
        <line class="clock-minute" x1="80" y1="80" x2="80" y2="34" transform="rotate(${minute * 6} 80 80)"/>
        <circle class="clock-pin" cx="80" cy="80" r="3"/></svg>`;
      return {prompt, options, answer, hint: 'Tìm số kim ngắn vừa đi qua. Đếm từ số 12 theo kim dài, mỗi khoảng là 5 phút.',
        explanation: `Kim ngắn chỉ giờ ${hour}, kim dài chỉ ${minute} phút.`};
    }
  },
  patterns: {
    icon: '🧩', title: 'Dãy số bí mật', rounds: 5, reward: 14,
    intro: 'Tìm số kế tiếp trong dãy. Hãy xem các số đang tăng, giảm, nhân đôi hay thay đổi theo hai bước luân phiên.',
    question(round) {
      const step = 2 + rand(5), start = 2 + rand(8);
      const rules = [
        [i => start + i * step, `Mỗi bước cộng ${step}.`],
        [i => start + (5 - i) * step, `Mỗi bước trừ ${step}.`],
        [i => start * 2 ** i, 'Mỗi số gấp đôi số ngay trước nó.'],
        [i => start + i * step + Math.floor(i / 2), `Lần lượt cộng ${step} rồi cộng ${step + 1}, sau đó lặp lại.`],
        [i => start + i * (i + 1) / 2, 'Các bước lần lượt là +1, +2, +3, +4…']
      ];
      const [valueAt, explanation] = rules[round];
      const answer = valueAt(4);
      const options = [answer, answer - 1, answer + 2, answer + step + 2];
      return {prompt: `<p class="practice-pattern">${Array.from({length: 4}, (_, i) => valueAt(i)).join(' · ')} · ?</p>`,
        options, answer, hint: 'Thử so sánh từng cặp số đứng cạnh nhau. ' + explanation, explanation};
    }
  },
  english: {
    icon: '🔤', title: 'Ghép từ tiếng Anh', rounds: 6, reward: 15,
    intro: 'Nhìn hình và nghĩa tiếng Việt, rồi chọn từ tiếng Anh phù hợp. Nếu chọn sai, gợi ý sẽ hiện để bạn thử lại.',
    words: [
      ['🍎', 'Quả táo', 'apple'], ['🌧️', 'Mưa', 'rain'], ['🐱', 'Con mèo', 'cat'],
      ['🌙', 'Mặt trăng', 'moon'], ['📚', 'Sách', 'book'], ['🍞', 'Bánh mì', 'bread'],
      ['🐟', 'Con cá', 'fish'], ['🥛', 'Sữa', 'milk'], ['☀️', 'Mặt trời', 'sun'],
      ['👟', 'Chiếc giày', 'shoe'], ['🍃', 'Chiếc lá', 'leaf'], ['⭐', 'Ngôi sao', 'star']
    ],
    question(round, session) {
      const [icon, vietnamese, answer] = session.words[round];
      const distractors = shuffle(this.words.filter(([, , word]) => word !== answer)).slice(0, 3);
      return {prompt: `<p class="practice-word"><span aria-hidden="true">${icon}</span>${vietnamese}</p>`,
        options: [answer, ...distractors.map(([, , word]) => word)], answer,
        hint: `Từ này bắt đầu bằng chữ “${answer[0]}”.`, explanation: `${vietnamese} là “${answer}”.`};
    }
  }
};

for (const [id, game] of Object.entries(practiceGames)) {
  arcadeGames.push([id, game.icon, game.title, game.intro, game.reward]);
}

let practiceSession = null;
const beforePracticeStart = startMini;
startMini = function(type) {
  const game = practiceGames[type];
  if (!game) return beforePracticeStart(type);
  practiceSession = {type, game, slot: activeSlot, round: 0, first: 0};
  if (game.words) practiceSession.words = shuffle(game.words);
  adventureDialog.innerHTML = `<h2>${game.icon} ${game.title}</h2><p>${game.intro}</p>
    <p>${game.rounds} câu · ${game.reward}–${game.reward + game.rounds} xu. Thử lại thoải mái và nhận thêm 1 xu cho mỗi câu đúng ngay.</p>
    <button id="startPractice">Bắt đầu</button><button class="secondary close-mini">Đóng</button>`;
  $('startPractice').onclick = drawPracticeQuestion;
  adventureDialog.querySelector('.close-mini').onclick = () => adventureDialog.close();
  if (!adventureDialog.open) adventureDialog.showModal();
  adventureDialog.scrollTop = 0;
};

function drawPracticeQuestion() {
  const session = practiceSession;
  if (!session || session.slot !== activeSlot) return;
  const {game, round} = session;
  const question = game.question(round, session);
  const options = shuffle(question.options);
  let missed = false;
  adventureDialog.innerHTML = `<h2>${game.icon} ${game.title}</h2><p>Câu ${round + 1}/${game.rounds}</p>${question.prompt}
    <div class="practice-options">${options.map((answer, i) => `<button data-practice-answer="${i}">${answer}</button>`).join('')}</div>
    <p id="practiceFeedback" class="muted" role="status"></p>
    <button id="practiceNext" hidden>${round + 1 === game.rounds ? 'Nhận xu' : 'Câu tiếp theo →'}</button>
    <button class="secondary close-mini">Đóng</button>`;
  const next = $('practiceNext');
  const answers = adventureDialog.querySelectorAll('[data-practice-answer]');
  answers.forEach((button, index) => {
    button.onclick = () => {
      if (practiceSession !== session || session.slot !== activeSlot || !next.hidden) return;
      if (options[index] !== question.answer) {
        missed = true;
        button.disabled = true;
        $('practiceFeedback').textContent = 'Chưa đúng. ' + question.hint;
        const remaining = [...answers].find(answer => !answer.disabled);
        remaining?.focus({preventScroll: true});
        return;
      }
      if (!missed) session.first++;
      answers.forEach(answer => answer.disabled = true);
      $('practiceFeedback').textContent = 'Đúng rồi! ' + question.explanation;
      next.hidden = false;
      next.focus();
    };
  });
  next.onclick = () => {
    if (round + 1 === game.rounds) return finishPractice();
    session.round++;
    drawPracticeQuestion();
  };
  adventureDialog.querySelector('.close-mini').onclick = () => adventureDialog.close();
  answers[0].focus({preventScroll: true});
}

function finishPractice() {
  const session = practiceSession;
  if (!session || session.slot !== activeSlot) return;
  const backup = SaveStore.copy(state);
  const coins = session.game.reward + session.first;
  state.coins += coins;
  recordEvent('mini');
  recordEvent('mini_' + session.type);
  if (!save()) {
    state = backup;
    return;
  }
  practiceSession = null;
  $('coins').textContent = state.coins;
  adventureDialog.innerHTML = `<h2>🏆 Hoàn thành · +${coins} xu</h2>
    <p>${session.first}/${session.game.rounds} câu đúng ngay lần đầu.</p>
    <button id="practiceAgain">Luyện tiếp</button><button class="secondary" id="practiceHome">Đóng</button>`;
  $('practiceAgain').onclick = () => startMini(session.type);
  $('practiceHome').onclick = () => { adventureDialog.close(); render(); };
  bindJourneyReturn($('practiceHome'));
  $('practiceHome').focus();
  sound('reward');
}

const beforePracticeRender = render;
render = function() {
  beforePracticeRender();
  if (current !== 'quests') return;
  for (const [id, game] of Object.entries(practiceGames)) {
    const button = document.querySelector(`[data-mini="${id}"]`);
    if (!button) continue;
    const range = game.reward + '–' + (game.reward + game.rounds) + ' xu';
    button.textContent = 'Chơi · ' + range;
    button.parentElement.querySelector('.quest-meta').textContent = '🪙 ' + range + ' / phiên hoàn thành';
  }
};
