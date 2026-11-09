/* Vietnamese games: tone marks, hỏi/ngã, spelling, friend-or-rival words, odd-one-out, proverbs, word types, sentence builder. */
const vnGame=(id,icon,title,intro,rounds,words,q)=>{practiceGames[id]={icon,title,intro,rounds,reward:15,words,question:q};arcadeGames.push([id,icon,title,intro,15])};
const vnOpts=(a,...rest)=>[a,...rest];

vnGame('tone','🎩','Phép màu dấu thanh','Mỗi từ bị mất dấu thanh. Đọc gợi ý rồi chọn từ có dấu đúng.',6,[
['🐟','Con vật sống dưới nước, bơi bằng vây','cá','ca','cà','cả'],
['🌙','Vật sáng trên trời đêm, có khi tròn như cái đĩa','trăng','trang','trắng','trẳng'],
['🐔','Con vật kêu “cục tác”, đẻ trứng','gà','ga','gả','gạ'],
['🌧️','Nước rơi từ mây xuống vào mùa hè','mưa','mua','mùa','múa'],
['🍎','Loại quả tròn, màu đỏ hoặc xanh','táo','tao','tạo','tào'],
['🦆','Con vật có mỏ dẹt, bơi trên ao','vịt','vit','vít','vìt'],
['📖','Thứ em đọc ở trường','sách','sạch','sác','sảch'],
['🏠','Nơi gia đình em sống','nhà','nha','nhá','nhả'],
['🍚','Món ăn hằng ngày nấu từ gạo','cơm','côm','com','cờm'],
['🐴','Con vật chạy nhanh, có bờm và kéo xe','ngựa','ngưa','ngứa','ngụa']],
function(r,s){const [icon,clue,a,...o]=s.words[r];return {prompt:`<p class="practice-word"><span aria-hidden="true">${icon}</span>${clue}</p>`,options:[a,...o],answer:a,hint:`Từ này có ${[...a].length} chữ cái. Thử đọc to từng lựa chọn xem từ nào hợp với gợi ý.`,explanation:`Đáp án đúng là “${a}”.`}});

vnGame('hoinga','🌊','Hỏi hay Ngã?','Hỏi (ỉ) và ngã (ĩ) rất dễ nhầm! Đọc câu rồi chọn chữ viết đúng.',6,[
['Em uống cốc ___ nóng mỗi sáng.','sữa','sửa','sưa','Sữa là đồ uống từ bò. “Sửa” là làm cho hết hỏng.'],
['Bố ___ lại chiếc xe đạp bị hỏng.','sửa','sữa','sưa','“Sửa” nghĩa là làm cho hết hỏng.'],
['Bạn Mai ___ tranh rất đẹp.','vẽ','vẻ','vé','“Vẽ tranh” viết dấu ngã.'],
['Gương mặt bạn ấy có ___ rất vui tươi.','vẻ','vẽ','vé','“Vẻ mặt” viết dấu hỏi.'],
['Hè này em được ___ học ở nhà.','nghỉ','nghĩ','nghi','“Nghỉ học” là không đến trường. “Nghĩ” là dùng trí óc.'],
['Em đang ___ cách giải bài toán.','nghĩ','nghỉ','nghi','“Suy nghĩ” viết dấu ngã.'],
['Mẹ ___ nước ra cốc.','đổ','đỗ','đô','“Đổ nước” viết dấu hỏi. “Đỗ” là thi đậu hoặc dừng xe.'],
['Anh trai em ___ vào trường chuyên.','đỗ','đổ','đô','“Thi đỗ” viết dấu ngã.'],
['Em chạy nhanh nên bị ___ đau chân.','ngã','ngả','nga','“Bị ngã” viết dấu ngã.'],
['Bạn nhỏ ___ nón chào cô giáo.','ngả','ngã','nga','“Ngả nón” là nghiêng nón về phía trước.'],
['Em sẽ yêu quê hương ___ mãi.','mãi','mải','mai','“Mãi mãi” viết dấu ngã.'],
['Bé ___ chơi nên quên cả ăn cơm.','mải','mãi','mai','“Mải chơi” nghĩa là chỉ chăm chú vào chơi.']],
function(r,s){const [sen,a,b,c,ex]=s.words[r];return {prompt:`<p class="practice-word">${sen.replace('___','<u>&nbsp;&nbsp;&nbsp;?&nbsp;&nbsp;&nbsp;</u>')}</p>`,options:[a,b,c],answer:a,hint:'Đọc câu và hiểu nghĩa của chỗ trống, rồi chọn dấu hỏi hay dấu ngã.',explanation:ex}});

vnGame('spellvn','🔍','Săn lỗi chính tả','Chọn chữ viết đúng chính tả để câu có nghĩa.',6,[
['🐃','Con ___ kéo cày giúp bác nông dân.','trâu','châu','tâu','Tr: “con trâu”.'],
['🍋','Quả ___ có vị chua.','chanh','tranh','canh','Ch: “quả chanh”.'],
['🏞️','Em ngắm ___ sông chảy hiền hòa.','dòng','ròng','dong','D: “dòng sông”.'],
['⭐','Ngôi ___ sáng lấp lánh trên trời.','sao','xao','sau','S: “ngôi sao”.'],
['🌸','Hoa ___ nở rộ mỗi dịp Tết.','đào','tào','dào','Đ: “hoa đào”.'],
['🐢','Con ___ bò chậm chạp trên cỏ.','rùa','dùa','giùa','R: “con rùa”.'],
['🐦','Con chim ___ nhảy trên cành.','sẻ','xẻ','sẽ','“Chim sẻ”: s + dấu hỏi.'],
['🧊','Nước ___ rất lạnh.','đá','dá','tá','Đ: “nước đá”.'],
['🍚','Mẹ nấu bát ___ trắng thơm.','cơm','gơm','kơm','C đứng trước ơ: “cơm”.'],
['🐘','Con ___ có chiếc vòi dài.','voi','roi','doi','V: “con voi”.']],
function(r,s){const [icon,sen,a,b,c,ex]=s.words[r];return {prompt:`<p class="practice-word"><span aria-hidden="true">${icon}</span>${sen.replace('___','<u>&nbsp;&nbsp;?&nbsp;&nbsp;</u>')}</p>`,options:[a,b,c],answer:a,hint:'Nhìn hình, đọc câu rồi tự hỏi: từ nào có nghĩa trong câu này?',explanation:ex}});

vnGame('friend','🤝','Bạn hay Đối thủ?','Mỗi lượt hỏi tìm BẠN (từ cùng nghĩa) hoặc ĐỐI THỦ (từ trái nghĩa) của một từ. Đọc kỹ đề nhé!',6,[
['chăm chỉ','siêng năng','lười biếng','vội vàng'],['to lớn','khổng lồ','nhỏ bé','cao ráo'],
['vui','mừng rỡ','buồn bã','nhanh nhẹn'],['đẹp','xinh xắn','xấu xí','sạch sẽ'],
['dũng cảm','can đảm','hèn nhát','thông minh'],['nhanh','mau lẹ','chậm chạp','mạnh mẽ'],
['gọn gàng','ngăn nắp','bừa bộn','sạch sẽ'],['yên tĩnh','vắng lặng','ồn ào','mát mẻ'],
['hiền lành','hiền hậu','độc ác','thông minh']],
function(r,s){const [w,f,e,d]=s.words[r],friend=r%2===0;return {prompt:`<p class="practice-word">${friend?'🤝 Tìm <b>BẠN</b> (cùng nghĩa)':'⚔️ Tìm <b>ĐỐI THỦ</b> (trái nghĩa)'} của từ<br><b>“${w}”</b></p>`,options:[f,e,d],answer:friend?f:e,hint:friend?'Bạn là từ có nghĩa gần giống từ đã cho.':'Đối thủ là từ có nghĩa ngược lại với từ đã cho.',explanation:friend?`“${w}” và “${f}” có nghĩa giống nhau.`:`“${w}” và “${e}” có nghĩa trái ngược nhau.`}});

vnGame('oddword','🕵️','Ai lạc đàn?','Ba từ thuộc cùng một nhóm, một từ “lạc đàn”. Hãy tìm ra nó!',6,[
['con vật','mèo','chó','gà','bàn'],['đồ dùng học tập','bút','thước','vở','bếp'],['loại quả','cam','xoài','ổi','rau muống'],
['màu sắc','xanh','đỏ','vàng','nhanh'],['bộ phận cơ thể','tay','chân','mắt','bảng'],['phương tiện giao thông','xe buýt','tàu hỏa','máy bay','cái nồi'],
['hoạt động','chạy','nhảy','hát','xinh'],['người trong gia đình','bố','mẹ','anh','bảng đen']],
function(r,s){const [g,a,b,c,odd]=s.words[r];return {prompt:`<p class="practice-word">Từ nào <b>không cùng nhóm</b> với ba từ còn lại?</p>`,options:[a,b,c,odd],answer:odd,hint:`Ba từ cùng chỉ ${g}.`,explanation:`“${a}”, “${b}”, “${c}” cùng là ${g}. “${odd}” không thuộc nhóm này.`}});

vnGame('proverb','📜','Đố vui tục ngữ','Chọn từ còn thiếu để hoàn thành câu tục ngữ, ca dao quen thuộc.',6,[
['Có công mài sắt, có ngày nên ___.','kim','dao','búa','Kiên trì rèn luyện thì sẽ thành công.'],
['Uống nước nhớ ___.','nguồn','sông','giếng','Nhớ ơn những người đã giúp mình.'],
['Ăn quả nhớ kẻ ___.','trồng cây','hái quả','bán hàng','Biết ơn người đã tạo ra thành quả.'],
['Lá lành đùm lá ___.','rách','non','úa','Người khỏe mạnh, may mắn giúp đỡ người khó khăn.'],
['Thương người như thể thương ___.','thân','bạn','mình','Yêu thương người khác như yêu thương chính bản thân.'],
['Có chí thì ___.','nên','khó','quên','Có quyết tâm thì sẽ làm được.'],
['Đi một ngày đàng, học một sàng ___.','khôn','vàng','sách','Đi nhiều, trải nghiệm nhiều sẽ hiểu biết hơn.'],
['Gần mực thì đen, gần đèn thì ___.','rạng','tối','mờ','Môi trường sống ảnh hưởng đến con người.'],
['Học thầy không tày học ___.','bạn','sách','trò','Học hỏi từ bạn bè cũng rất quan trọng.'],
['Tốt gỗ hơn tốt ___.','nước sơn','màu vẽ','cái đẹp','Phẩm chất bên trong quan trọng hơn vẻ ngoài.']],
function(r,s){const [sen,a,b,c,ex]=s.words[r];return {prompt:`<p class="practice-word">${sen.replace('___','<u>&nbsp;&nbsp;?&nbsp;&nbsp;</u>')}</p>`,options:[a,b,c],answer:a,hint:'Nhớ lại câu này em từng nghe ông bà, cô giáo nói. Thử đọc to cả câu.',explanation:`“${sen.replace('___',a)}” – ${ex}`}});

vnGame('wordtype','🏷️','Phân loại từ','Từ chỉ sự vật, hoạt động hay đặc điểm? Chọn đúng nhóm cho mỗi từ.',8,[
['cái bàn','Sự vật'],['chạy','Hoạt động'],['xinh xắn','Đặc điểm'],['con mèo','Sự vật'],['hát','Hoạt động'],['cao','Đặc điểm'],
['cô giáo','Sự vật'],['đọc','Hoạt động'],['chăm chỉ','Đặc điểm'],['quyển vở','Sự vật'],['bơi','Hoạt động'],['thơm','Đặc điểm']],
function(r,s){const [w,a]=s.words[r];return {prompt:`<p class="practice-word">“${w}” là từ chỉ…</p>`,options:['Sự vật','Hoạt động','Đặc điểm'],answer:a,hint:'Sự vật: người, vật, cây cối… Hoạt động: việc làm, có thể “đang” làm. Đặc điểm: tính chất như đẹp, cao, ngoan.',explanation:`“${w}” là từ chỉ ${a.toLowerCase()}.`}});

gameSubjects.find(([s])=>s==='Tiếng Việt')[1].push('tone','hoinga','spellvn','friend','oddword','proverb','wordtype','buildsen');

/* Sentence builder: tap words in order. */
const VN_SENT=[['Em','đi','học','bằng','xe đạp'],['Mẹ','nấu','cơm','rất','ngon'],['Con mèo','đang','ngủ','trên','ghế'],['Trời','nắng','rất','đẹp'],
['Bạn Lan','có','mái tóc','dài','và đen'],['Chim','hót','líu lo','trên','cành cây'],['Ông','đọc','báo','vào','buổi sáng'],['Cả lớp','cùng','hát','một','bài hát','vui'],
['Vườn','nhà','em','có','nhiều','hoa'],['Cá','bơi','lội','dưới','ao'],['Bố','đưa','em','đến','trường'],['Bà','kể','chuyện','cổ tích']];
arcadeGames.push(['buildsen','🧱','Ghép câu thần tốc','Chạm các từ theo đúng thứ tự để ghép thành câu hoàn chỉnh. Từ đầu tiên đã được đặt sẵn!',15]);
let vnB=null;
const beforeVnStart=startMini;
startMini=function(type){
  if(type!=='buildsen')return beforeVnStart(type);
  vnB={slot:activeSlot,list:shuffle(VN_SENT).slice(0,5),i:0,first:0};
  adventureDialog.innerHTML=`<h2>🧱 Ghép câu thần tốc</h2><p>Các từ bị xáo trộn. Chạm lần lượt để xây thành câu đúng nghĩa. Từ đầu tiên đã có sẵn. Chạm sai thì thử lại, nhưng câu đó sẽ không được thưởng thêm.</p><p>5 câu · 15 xu, thưởng tối đa +5.</p><button id="vnBegin">Bắt đầu</button><button class="secondary close-mini">Đóng</button>`;
  $('vnBegin').onclick=vnSentence;adventureDialog.querySelector('.close-mini').onclick=()=>adventureDialog.close();
  if(!adventureDialog.open)adventureDialog.showModal();
};
function vnSentence(){const b=vnB;if(!b||b.slot!==activeSlot)return;const t=b.list[b.i];Object.assign(b,{n:1,bad:false,pool:shuffle(t.slice(1).map((w,k)=>[k,w]))});vnDraw()}
function vnDraw(){
  const b=vnB,t=b.list[b.i],done=b.n===t.length,line=t.slice(0,b.n).join(' ')+(done?'.':'');
  adventureDialog.innerHTML=`<div class="eyebrow">CÂU ${b.i+1}/5</div><p class="vn-line">${line}${done?'':' …'}</p>
  ${done?`<h3>🎉 Câu hoàn chỉnh!</h3><button id="vnNext">${b.i===4?'Nhận xu':'Câu tiếp theo →'}</button>`:`<div class="vn-pool">${b.pool.map(([k,w])=>`<button data-vn="${k}" ${k<b.n-1?'disabled':''}>${w}</button>`).join('')}</div><p id="vnMsg" class="muted" role="status"></p><button class="secondary close-mini">Đóng</button>`}`;
  if(done){if(!b.bad)b.first++;$('vnNext').onclick=()=>{if(b.i===4)return vnFinish();b.i++;vnSentence()};$('vnNext').focus();sound('reward');return}
  adventureDialog.querySelectorAll('[data-vn]').forEach(btn=>btn.onclick=()=>{
    if(!vnB||vnB.slot!==activeSlot)return;
    if(t[b.n]===btn.textContent&&!btn.disabled){b.pool=b.pool.filter(([k])=>k!==Number(btn.dataset.vn));b.n++;vnDraw()}
    else{b.bad=true;$('vnMsg').textContent='Chưa đúng chỗ. Hãy đọc to phần đã ghép rồi chọn từ tiếp theo nghe tự nhiên nhất.'}});
  adventureDialog.querySelector('.close-mini').onclick=()=>adventureDialog.close();
}
function vnFinish(){
  const b=vnB;if(!b||b.slot!==activeSlot)return;
  const backup=SaveStore.copy(state),coins=15+Math.min(b.first,5);
  state.coins+=coins;recordEvent('mini');recordEvent('mini_buildsen');
  if(!save()){state=backup;return}
  $('coins').textContent=state.coins;vnB=null;
  adventureDialog.innerHTML=`<h2>🏆 Hoàn thành · +${coins} xu</h2><p>${b.first}/5 câu ghép đúng ngay lần đầu.</p><button id="vnAgain">Chơi tiếp</button><button class="secondary" id="vnHome">Đóng</button>`;
  $('vnAgain').onclick=()=>startMini('buildsen');$('vnHome').onclick=()=>{adventureDialog.close();render()};bindJourneyReturn($('vnHome'));sound('reward');burst();
}
adventureDialog.addEventListener('close',()=>{vnB=null});
