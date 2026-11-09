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
  },
  ruler: {
    icon: '📏', title: 'Đo độ dài', rounds: 5, reward: 12,
    intro: 'Đọc thước theo xăng-ti-mét. Độ dài bằng số ở đầu bên phải trừ số ở đầu bên trái.',
    question(round) {
      const start = round < 2 ? 0 : 1 + rand(3), answer = 2 + rand(6);
      const end = start + answer;
      const ticks = Array.from({length: 11}, (_, i) => `<line x1="${15 + i * 25}" y1="32" x2="${15 + i * 25}" y2="43"/><text x="${15 + i * 25}" y="59">${i}</text>`).join('');
      const prompt = `<svg class="practice-ruler" viewBox="0 0 280 65" role="img" aria-label="Vật nằm từ vạch ${start} đến vạch ${end} xăng-ti-mét">
        <rect x="${15 + start * 25}" y="10" width="${answer * 25}" height="13" rx="4"/>${ticks}</svg>`;
      return {prompt, answer, options: [answer, answer - 1, answer + 1, answer + 2],
        hint: 'Đếm các khoảng giữa hai đầu của vật, hoặc lấy vạch cuối trừ vạch đầu.',
        explanation: `${end} − ${start} = ${answer} cm.`};
    }
  },
  pitch: {
    icon: '🎧', title: 'Nghe cao hay thấp', rounds: 5, reward: 13,
    intro: 'Nghe hai âm liên tiếp. Chọn xem âm thứ hai cao hơn, thấp hơn hay bằng âm đầu. Có thể nghe lại bao nhiêu lần tùy thích.',
    question(round) {
      const base = [262, 294, 330][rand(3)];
      const direction = round === 0 ? 1 : round === 1 ? -1 : rand(3) - 1;
      const options = ['Thấp hơn', 'Bằng nhau', 'Cao hơn'];
      const answer = options[direction + 1];
      return {prompt: '<p>Âm thứ hai thế nào so với âm đầu?</p>', answer, options,
        audio: [base, base * 2 ** (direction * (round < 3 ? 7 : 4) / 12)],
        hint: 'Nghe lại và thử ngân theo hai âm. Giọng đi lên là cao hơn, đi xuống là thấp hơn.',
        explanation: direction === 0 ? 'Hai âm có cùng độ cao.' : 'Âm thứ hai ' + answer.toLowerCase() + ' âm đầu.'};
    }
  },
  phrases: {
    icon: '💬', title: 'Tiếng Anh hằng ngày', rounds: 5, reward: 15,
    intro: 'Chọn câu tiếng Anh dùng được trong từng tình huống hằng ngày.',
    words: [
      ['Bạn muốn nói lời cảm ơn.', 'Thank you.'], ['Bạn muốn xin lỗi vì đến muộn.', 'I’m sorry.'],
      ['Bạn gặp bạn bè vào buổi sáng.', 'Good morning.'], ['Bạn cần ai đó giúp mình.', 'Can you help me?'],
      ['Bạn muốn xin một ít nước.', 'Water, please.'], ['Bạn chưa hiểu câu vừa nghe.', 'I don’t understand.'],
      ['Bạn muốn biết nhà vệ sinh ở đâu.', 'Where is the restroom?']
    ],
    question(round, session) {
      const [scenario, answer] = session.words[round];
      return {prompt: `<p>${scenario}</p>`, answer,
        options: [answer, ...shuffle(this.words.filter(([, phrase]) => phrase !== answer)).slice(0, 2).map(([, phrase]) => phrase)],
        hint: `Câu phù hợp bắt đầu bằng “${answer.split(' ')[0].replace(/[.!?]$/, '')}”.`,
        explanation: `Bạn có thể nói “${answer}”`};
    }
  },
  reading: {
    icon: '📚', title: 'Đọc hiểu tình huống', rounds: 5, reward: 14,
    intro: 'Đọc một mẩu tin ngắn và chọn chi tiết đúng. Luyện với lời nhắn, biển báo và hướng dẫn quen thuộc.',
    words: [
      ['“An ơi, nhớ bỏ bình nước vào cặp trước khi ra khỏi nhà.” An cần mang gì?', 'Bình nước', 'Hộp bút', 'Áo mưa', 'Lời nhắn dặn mang bình nước.'],
      ['Biển ghi “Sàn ướt, đi chậm”. Em nên làm gì?', 'Đi chậm', 'Chạy nhanh', 'Nhảy qua', 'Đi chậm giúp tránh trượt ngã.'],
      ['Lịch ghi “Trả sách vào thứ Sáu”. Em trả sách ngày nào?', 'Thứ Sáu', 'Thứ Năm', 'Chủ nhật', 'Ngày ghi trong lịch là thứ Sáu.'],
      ['“Con rửa tay rồi mới ăn.” Việc nào làm trước?', 'Rửa tay', 'Ăn', 'Dọn bàn', 'Từ “rồi mới” cho biết việc rửa tay làm trước.'],
      ['Nhãn ghi “Chỉ tưới khi đất khô”. Đất đang ướt, em nên làm gì?', 'Chờ đất khô', 'Tưới ngay', 'Đổ thêm nước', 'Nhãn dặn chỉ tưới khi đất khô.'],
      ['“Em đặt bút chì bên cạnh quyển vở.” Bút chì ở đâu?', 'Bên cạnh quyển vở', 'Dưới ghế', 'Trong cặp', 'Cụm “bên cạnh” chỉ vị trí ngay cạnh quyển vở.']
    ],
    question(round, session) {
      const [scenario, answer, second, third, explanation] = session.words[round];
      return {prompt: `<p>${scenario}</p>`, answer, options: [answer, second, third],
        hint: 'Đọc lại câu và tìm đúng chi tiết mà câu hỏi nhắc tới.', explanation};
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
    ${question.audio ? '<button class="secondary" id="hearPractice">🔈 Nghe hai âm</button>' : ''}
    <div class="practice-options">${options.map((answer, i) => `<button data-practice-answer="${i}">${answer}</button>`).join('')}</div>
    <p id="practiceFeedback" class="muted" role="status"></p>
    <button id="practiceNext" hidden>${round + 1 === game.rounds ? 'Nhận xu' : 'Câu tiếp theo →'}</button>
    <button class="secondary close-mini">Đóng</button>`;
  const next = $('practiceNext');
  const answers = adventureDialog.querySelectorAll('[data-practice-answer]');
  const hear = $('hearPractice');
  if (hear) hear.onclick = () => musicPlay(question.audio.map(frequency => ({frequency})));
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
  (hear || answers[0]).focus({preventScroll: true});
}

function finishPractice() {
  const session = practiceSession;
  if (!session || session.slot !== activeSlot) return;
  const backup = SaveStore.copy(state);
  const coins = session.game.reward + Math.min(session.first, 5);
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
