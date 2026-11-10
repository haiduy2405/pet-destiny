/* DỮ LIỆU KINH TẾ DUY NHẤT: mọi bảng giá, thưởng, vé, tỉ lệ nằm ở đây. Các *-core.js chỉ chứa luật (code), đọc số từ EcoData.
   Chỉnh cân bằng = sửa file này, rồi `npm test` (tests/economy-balance.test.js canh các ràng buộc chéo giữa các nguồn xu)
   và `node tools/economy-report.js` để xem thu nhập từng nguồn. Load ĐẦU TIÊN (trước save-store.js). Đã gom đủ: shop, dollhouse. */
const EcoData=(()=>{
 const MIN=6e4,HOUR=36e5;
 return {
  /* thưởng mỗi lượt chơi game (rewards.js, levels-core.js) */
  reward:{pay:15,dailyFirst:10,firstTryMax:5},
  /* Balance: thưởng nền theo công sức; giảm dần khi lặp 1 game/ngày; thưởng đa dạng */
  balance:{
   base:{
  count:10,memory:11,pairs:12,snacks:9,colors:10,order:11,odd:13,path:14,math:15,shapes:18,
  rhythm:18,music:18,melody:18,earmemory:18,fractions:22,change:20,
  clock:15,patterns:30,ruler:18,pitch:11,
  english:18,phrases:12,reading:24,scramble:19,listen:15,fillblank:16,hangman:17,minpair:13,
  tone:12,hoinga:12,spellvn:13,friend:12,oddword:12,proverb:14,wordtype:16,buildsen:20,
  speakecho:20,speakshadow:20,speakchat:20,speaktwister:20,cook:20,garden:18},
   default:15,minPay:3,decay:[1,.7,.45,.25,.12],milestones:[[3,15],[6,30],[10,60]]},
  /* mức khó: nhân thưởng nền; mở khoá mức kế khi đúng ≥ unlock lần đầu */
  levels:{mult:[1,1.5,2.2],unlock:.6},
  /* hộp quà may mắn */
  lucky:{price:60,dailyCap:8,pityAfter:7,history:12,prizes:[
  {id:'c30',kind:'coins',coins:25,weight:340,rarity:'common',label:'25 xu',icon:'🪙'},
  {id:'c45',kind:'coins',coins:35,weight:250,rarity:'common',label:'35 xu',icon:'🪙'},
  {id:'c70',kind:'coins',coins:55,weight:150,rarity:'uncommon',label:'55 xu',icon:'💰'},
  {id:'dec1',kind:'decor',tier:'common',value:30,weight:100,rarity:'uncommon',label:'Đồ trang trí',icon:'🎀'},
  {id:'tick',kind:'ticket',value:60*.88,weight:60,rarity:'uncommon',label:'Vé miễn phí',icon:'🎟️'},
  {id:'c150',kind:'coins',coins:120,weight:60,rarity:'rare',label:'120 xu',icon:'💎'},
  {id:'dec2',kind:'decor',tier:'rare',value:70,weight:30,rarity:'rare',label:'Đồ hiếm',icon:'🏆'},
  {id:'c500',kind:'coins',coins:400,weight:10,rarity:'epic',label:'400 xu — Giải đặc biệt!',icon:'👑'}]},
  /* nông trại: lãi/giờ giảm dần theo thời gian trồng (cải 5 phút ≈ 36 xu/giờ → bí ngô 10 giờ ≈ 9 xu/giờ) để cây ngắn không thắng cây dài */
  farm:{
   crops:[
  {id:'cabbage',icon:'🥬',name:'Cải xanh',seed:8,grow:5*MIN,sell:11},
  {id:'carrot',icon:'🥕',name:'Cà rốt',seed:15,grow:10*MIN,sell:20},
  {id:'strawberry',icon:'🍓',name:'Dâu tây',seed:30,grow:30*MIN,sell:44},
  {id:'corn',icon:'🌽',name:'Bắp ngô',seed:50,grow:HOUR,sell:76},
  {id:'melon',icon:'🍉',name:'Dưa hấu',seed:120,grow:4*HOUR,sell:175},
  {id:'pumpkin',icon:'🎃',name:'Bí ngô',seed:200,grow:10*HOUR,sell:290}],
   startPlots:3,plotCosts:[150,300,600],waterCut:.2,bonusChance:.15,barnCap:40,
   breedCost:80,breedMs:20*MIN,breedCooldown:3*HOUR,minXp:25,minCare:40,mutation:.1,colorMutation:.12},
  /* câu cá: cần, phụ kiện, mồi, 3 hồ (vé, cá, độ khó), hệ số giảm khi thuê lại cùng hồ trong ngày */
  fishing:{
   rods:[
  {id:'bamboo',icon:'🎋',name:'Cần tre',cost:40,zone:.24,note:'Cần cơ bản, đủ để câu ao làng.'},
  {id:'fiber',icon:'🎣',name:'Cần sợi thủy tinh',cost:160,zone:.30,note:'Vùng giữ cá rộng hơn.'},
  {id:'carbon',icon:'🏆',name:'Cần carbon',cost:480,zone:.36,note:'Nhẹ và nhạy, rộng nhất.'}],
   accs:[
  {id:'float',icon:'🔴',name:'Phao nhạy',cost:60,note:'Có thêm 50% thời gian để giật cần khi cá cắn.'},
  {id:'glasses',icon:'🕶️',name:'Kính râm',cost:90,note:'Thấy gợn nước báo trước khi cá cắn khoảng nửa giây.'},
  {id:'net',icon:'🥅',name:'Lưới vợt',cost:140,note:'Mỗi vé cứu được 1 con tuột khỏi cần (kéo lại từ 35%).'}],
   baits:[
  {id:'worm',icon:'🪱',name:'Giun đất',cost:2,boost:1,note:'Rẻ, ra cá thường.'},
  {id:'corn',icon:'🌽',name:'Bắp ngô',cost:3,boost:2.6,note:'Dễ ra cá hiếm hơn giun.'},
  {id:'shrimp',icon:'🦐',name:'Tôm nhử',cost:6,boost:5,note:'Hấp dẫn cá hiếm nhất.'}],
   baitPack:5,baitCap:40,bucketCap:60,firstBonus:.5,decay:[1,.8,.6,.4,.25],
   lakes:[
  {id:'pond',icon:'🪷',name:'Ao làng',rec:'bamboo',stars:1,ticket:6,casts:6,window:2,wait:[1.6,4],
   reel:{zone:1.05,speed:.28,dart:.10,gain:.30,loss:.17,maxT:25},
   fish:[{id:'rophi',icon:'🐟',name:'Cá rô',w:48,v:6,cm:12,pw:.9},{id:'diec',icon:'🐠',name:'Cá diếc',w:30,v:8,cm:18,pw:1},
         {id:'chep',icon:'🐡',name:'Cá chép',w:16,v:15,cm:35,pw:1.15},{id:'tre',icon:'🐟',name:'Cá trê vàng',w:6,v:27,cm:42,pw:1.3}]},
  {id:'forest',icon:'🌲',name:'Hồ rừng',rec:'fiber',stars:2,ticket:22,casts:6,window:1.7,wait:[1.8,4.4],
   reel:{zone:.9,speed:.42,dart:.19,gain:.27,loss:.18,maxT:29},
   fish:[{id:'loc',icon:'🐟',name:'Cá lóc',w:42,v:8,cm:40,pw:.95},{id:'tram',icon:'🐠',name:'Cá trắm đen',w:30,v:14,cm:60,pw:1.05},
         {id:'lang',icon:'🐡',name:'Cá lăng',w:20,v:26,cm:75,pw:1.2},{id:'luon',icon:'🐍',name:'Lươn vàng',w:8,v:58,cm:80,pw:1.35}]},
  {id:'deep',icon:'🌊',name:'Vịnh sâu',rec:'carbon',stars:3,ticket:60,casts:6,window:1.4,wait:[2,5],
   reel:{zone:.82,speed:.56,dart:.27,gain:.25,loss:.2,maxT:33},
   fish:[{id:'thu',icon:'🐟',name:'Cá thu',w:38,v:16,cm:70,pw:.95},{id:'mu',icon:'🐠',name:'Cá mú',w:28,v:28,cm:80,pw:1.05},
         {id:'hong',icon:'🐡',name:'Cá hồng',w:20,v:48,cm:90,pw:1.15},{id:'ngu',icon:'🦈',name:'Cá ngừ vây vàng',w:10,v:76,cm:150,pw:1.3},
         {id:'kiem',icon:'🗡️',name:'Cá kiếm',w:4,v:136,cm:260,pw:1.45}]}]},
 /* giá cửa hàng cũ (economy-core.js) và Ngôi nhà (dollhouse-core.js): id → xu. Code chỉ giữ tên/biểu tượng/luật. */
 shop:{egg:30,sunset:80,moonlight:140,dream:220,flowers:40,lantern:75,fountain:120,treat:25,rush:15},
 dollhouse:{
  rooms:{living:0,bedroom:120,kitchen:150,bath:100,play:200,garden:250},
  walls:{cream:0,sky:15,mint:15,pink:20,lavender:20,stripe:30,dots:30,stars:45,brick:40,peachwall:25,moonwall:25,snowwall:25},
  floors:{wood:0,tile:15,carpet:25,pinkrug:25,blue:20,grass:30,marble:40},
  furniture:{sofa:45,bed:60,chair:15,tv:50,radio:20,lamp:15,door:30,window:30,fire:40,piano:90,books:35,mirror:35,vase:20,pot:20,teapot:20,cake:15,pizza:15,juice:10,bread:10,icecream:15,coffee:15,tub:70,shower:45,soap:10,brush:10,duck:15,toilet:40,teddy:25,ball:12,blocks:15,train:40,kite:20,guitar:50,paint:20,robot:45,doll:30,puzzle:20,horse:35,pot2:20,tulip:10,cactus:15,sunflower:15,tree:40,palm:40,bamboo:25,mushroom:15,rose:15,frame:25,ribbon:10,banner:20,sparkle:15,medal:15,star:10,moon:15,rainbow:30,clock:25,peach:35,kumquat:35,lantern:20,envelope:15,firework:25,circus:40,pinata:25,confetti:15,beach:40,melon:15,shades:10,beachball:15,shaved:15,moonlantern:20,mooncake:15,rabbit:30,fullmoon:25,bouquet:20,card:15,crayon:15,gradcap:25,xtree:50,santa:45,snowman:35,stocking:15,reindeer:30,unicorn:80,balloon:10,gift:20,crown:100,trophy:60,fountain:80,tent:70,castle:150,carousel:120,ferris:150}
 },
 /* Nhiệm vụ ngày: mỗi ngày bốn nhiệm vụ, mỗi khe chọn một mẫu theo ngày. metric đọc từ số sự kiện hôm nay (Adventure.daily).
    bonus = thưởng khi xong cả 4; streakStep = cộng thêm mỗi ngày liên tiếp (tối đa streakCap ngày cộng). */
 quests:{
  bonus:30,streakStep:4,streakCap:5,
  slots:[
   [{id:'play2',icon:'🎮',label:'Hoàn thành 2 trò chơi',metric:'mini',target:2,reward:15},{id:'play3',icon:'🎮',label:'Hoàn thành 3 trò chơi',metric:'mini',target:3,reward:25},{id:'play4',icon:'🎮',label:'Hoàn thành 4 trò chơi',metric:'mini',target:4,reward:35}],
   [{id:'care3',icon:'🍼',label:'Chăm thú 3 lần',metric:'care',target:3,reward:15},{id:'care5',icon:'🍼',label:'Chăm thú 5 lần',metric:'care',target:5,reward:25}],
   [{id:'mix2',icon:'🧩',label:'Chơi 2 loại trò khác nhau',metric:'variety',target:2,reward:20},{id:'mix3',icon:'🧩',label:'Chơi 3 loại trò khác nhau',metric:'variety',target:3,reward:30}],
   [{id:'fish1',icon:'🎣',label:'Đi câu 1 vé',metric:'fish',target:1,reward:20},{id:'fish2',icon:'🎣',label:'Đi câu 2 vé',metric:'fish',target:2,reward:35},{id:'hunt1',icon:'📸',label:'Thắng 1 lượt săn màu/hình',metric:'hunt',target:1,reward:25}]
  ]
 }
 };
})();
