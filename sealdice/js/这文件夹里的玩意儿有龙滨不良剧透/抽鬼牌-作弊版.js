// ==UserScript==
// @name         抽鬼牌-作弊版
// @author       Fehling0v0
// @version      1.5.0
// @description  有人偷偷抽走了一张红心a，放进去了一张Joker
// @timestamp    2025-7-17
// @license      Apache-2
// @homepageURL  https://github.com/Fehling0v0/TRPG
// ==/UserScript==

let ext = seal.ext.find('OldMaid2');
if (!ext) {
  ext = seal.ext.new('OldMaid2', 'Fehling0v0', '1.0.0');
  seal.ext.register(ext);
}

let extEnabled2 = false;

ext.onNotCommandReceived = (ctx, msg) => {
  const message = msg.message;
  
  if (message === 'oldmaid on') {
    extEnabled2 = true;
    seal.replyToSender(ctx, msg, '抽鬼牌插件已激活');
    return;
  } else if (message === 'oldmaid off') {
    extEnabled2 = false;
    seal.replyToSender(ctx, msg, '抽鬼牌插件已停用');
    return;
  }
  
  if (!extEnabled2) return;
  
  const qq = seal.format(ctx,"{$t账号ID_RAW}");
  const groupId = seal.format(ctx,"{$t群号_RAW}");
  

  if (message === "发牌") {
    seal.replyToSender(ctx, msg, "发牌需要指定两名玩家，格式：发牌 <玩家1昵称>@玩家1 <玩家2昵称>@玩家2");
  } else if (message.startsWith("发牌 ")) {

    const pattern = /发牌\s+(.*?)\[CQ:at,qq=(\d+)\]\s+(.*?)\[CQ:at,qq=(\d+)\]/;
    const playermatch = message.match(pattern); 

    if (playermatch) {
    
      const player1Name = playermatch[1];
      const player1 = playermatch[2];
      const player2Name = playermatch[3];
      const player2 = playermatch[4];
      handleDealCards(ctx, msg, player1, player2, player1Name, player2Name);

      //seal.replyToSender(ctx, msg, `发牌成功，${player1Name}和${player2Name}开始游戏`);

    } else {
      seal.replyToSender(ctx, msg, "发牌需要指定两名玩家，格式：发牌 <玩家1昵称>@玩家1 <玩家2昵称>@玩家2");
    }
  } else if (message === "抽牌") {
    handleDrawCard(ctx, msg, qq);
  } else if (message === "抽走左边这张牌。") {
    handleDrawCard(ctx, msg, qq);
  } else if (message === "抽走右边这张牌。") {
    handleDrawCard(ctx, msg, qq);
  } else if (message === "明牌") {
    handleShowCards(ctx, msg, qq);
  } else if (message === "结束") {
    handleEndGame(ctx, msg, qq);
  } else if (message === "shuffle") {
    seal.replyToSender(ctx, msg, "已打乱您的手牌顺序。");
  }
};


// 明牌函数
function handleShowCards(ctx, msg, player) {
  const groupId = seal.format(ctx,"{$t群号_RAW}");
  if (!gameState[player]) {
    seal.replyToSender(ctx, msg, '你不在游戏中，无法明牌。');
    return;
  }
  
  seal.replyToSender(ctx, msg, `玩家 ${gameState[player].name} 的剩余手牌：${gameState[player].hand.join(', ')}`);
}

function handleEndGame(ctx, msg, player) {
  const groupId = seal.format(ctx,"{$t群号_RAW}");
  if (!gameState[player]) {
    seal.replyToSender(ctx, msg, '你不在游戏中，无需结束游戏。');
    return;
  }
  
  const opponent = gameState[player].opponent;
  delete gameState[player];
  delete gameState[opponent];
  
  seal.replyToSender(ctx, msg, '游戏已结束。');
}

// 游戏状态存储
const gameState = {};

// 创建一副去除一张 Joker 的牌
function createDeck() {
  const suits = ['♠', '♥', '♣', '♦'];
  const ranks = ['2','3','4','5','6','7','8','9','10','J','Q','K'];
  const deck = [];
  
  // 添加普通牌
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push(rank + suit);
    }
  }
  
  // 添加特殊牌：3张A和2张Joker
  deck.push('A♣', 'A♦', 'A♠');
  deck.push('Joker', 'Joker');
  
  return deck;
}

function handleDealCards(ctx, msg, player1, player2, player1Name, player2Name) {
  const groupId = seal.format(ctx,"{$t群号_RAW}");
  try {
    // 创建牌组
    let deck = createDeck();
    
    // 固定分配特殊牌
    const player1Hand = ['A♣', 'A♦', 'Joker'];
    const player2Hand = ['A♠', 'Joker'];
    
    // 移除已分配的牌
    deck = deck.filter(card => !['A♣', 'A♦', 'A♠', 'Joker', 'Joker'].includes(card));
    
    // 洗牌并分配剩余牌
    deck = shuffleDeck(deck);
    player1Hand.push(...deck.slice(0, 24));
    player2Hand.push(...deck.slice(24, 48));
    
    // 初始化游戏状态
    gameState[player1] = { 
      hand: player1Hand, 
      opponent: player2,
      drawCount: 0,
      name: player1Name,
    };
    gameState[player2] = { 
      hand: player2Hand, 
      opponent: player1,
      drawCount: 0,
      name: player2Name,
    };
    
    // 移除成对的牌
    const player1Result = removePairs(gameState[player1].hand);
    const player2Result = removePairs(gameState[player2].hand);
    
    gameState[player1].hand = player1Result.newHand;
    gameState[player2].hand = player2Result.newHand;
    
    // 私聊展示手牌
    const msg1 = seal.newMessage();
    msg1.messageType = "private";
    msg1.sender.userId = "QQ:"+player1;
    seal.replyToSender(seal.createTempCtx(ctx.endPoint, msg1), msg1, `你的手牌：${gameState[player1].hand.join(', ')}`);
    
    const msg2 = seal.newMessage();
    msg2.messageType = "private";
    msg2.sender.userId = "QQ:"+player2;
    seal.replyToSender(seal.createTempCtx(ctx.endPoint, msg2), msg2, `你的手牌：${gameState[player2].hand.join(', ')}`);
    
    // 大群内回复
    seal.replyToSender(ctx, msg, `发牌完毕\n玩家 ${gameState[player1].name} 打出的牌：${player1Result.pairs.join(', ') || '无'}\n剩余手牌：${generateHandCountBars(gameState[player1].hand.length)}\n玩家 ${gameState[player2].name} 打出的牌：${player2Result.pairs.join(', ') || '无'}\n剩余手牌：${generateHandCountBars(gameState[player2].hand.length)}`);
  } catch (e) {
    seal.replyToSender(ctx, msg, `发牌过程中出现错误: ${e.message}`);
  }
}

// 抽牌函数
function handleDrawCard(ctx, msg, player) {
  const groupId = seal.format(ctx,"{$t群号_RAW}");
  if (!gameState[player]) {
    seal.replyToSender(ctx, msg, '你不在游戏中，无法抽牌。');
    return;
  }
  
  const opponent = gameState[player].opponent;
  const opponentHand = gameState[opponent].hand;
  
  if (opponentHand.length === 0) {
    seal.replyToSender(ctx, msg, '对方没有手牌了，无法抽牌。');
    return;
  }
  
  // 作弊逻辑
  let drawnCard;
  gameState[player].drawCount++;
  
  // 检查玩家是否拥有黑桃A
  const hasSpadeA = gameState[player].hand.includes('A♠');
  const opponentHasSpadeA = opponentHand.includes('A♠');
  
  // 不拥有黑桃A的玩家在第二次抽牌时固定抽到joker
  if (!hasSpadeA && gameState[player].drawCount === 2 && opponentHand.includes('Joker')) {
    const jokerIndex = opponentHand.indexOf('Joker');
    drawnCard = opponentHand.splice(jokerIndex, 1)[0];
    gameState[player].hand.push(drawnCard);
    
    // 私聊展示手牌
    const privateMsg1 = seal.newMessage();
    privateMsg1.messageType = "private";
    privateMsg1.sender.userId = "QQ:"+player;
    seal.replyToSender(seal.createTempCtx(ctx.endPoint, privateMsg1), privateMsg1, `你抽到了 ${drawnCard}，当前手牌：${gameState[player].hand.join(', ')}`);
    
    const privateMsg2 = seal.newMessage();
    privateMsg2.messageType = "private";
    privateMsg2.sender.userId = "QQ:"+opponent;
    seal.replyToSender(seal.createTempCtx(ctx.endPoint, privateMsg2), privateMsg2, `对方抽到了 ${drawnCard}，你当前手牌：${gameState[opponent].hand.join(', ')}`);
    
    // 大群内回复
    seal.replyToSender(ctx, msg, `玩家 ${gameState[player].name} 抽到了 ${drawnCard}\n玩家 ${gameState[player].name} 剩余手牌：${generateHandCountBars(gameState[player].hand.length)}\n玩家 ${gameState[opponent].name} 剩余手牌：${generateHandCountBars(gameState[opponent].hand.length)}`);
    return;
  }
  // 拥有黑桃A的玩家永远不会从另一个玩家手上抽到joker，除非另一名玩家手中除了两张joker以外没有别的牌了
  else if (hasSpadeA && opponentHand.includes('Joker') && opponentHand.length > 2) {
    const nonJokerCards = opponentHand.filter(card => card !== 'Joker' && card !== 'A♠');
    if (nonJokerCards.length > 0) {
      const randomIndex = Math.floor(Math.random() * nonJokerCards.length);
      drawnCard = nonJokerCards[randomIndex];
      opponentHand.splice(opponentHand.indexOf(drawnCard), 1);
    } else {
      const randomIndex = Math.floor(Math.random() * opponentHand.length);
      drawnCard = opponentHand.splice(randomIndex, 1)[0];
    }
  }
  // 其他情况随机抽牌
  else {
    const availableCards = opponentHand.filter(card => card !== 'A♠');
    if (availableCards.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableCards.length);
      drawnCard = availableCards[randomIndex];
      opponentHand.splice(opponentHand.indexOf(drawnCard), 1);
    } else {
      const randomIndex = Math.floor(Math.random() * opponentHand.length);
      drawnCard = opponentHand.splice(randomIndex, 1)[0];
    }
  }
  
  gameState[player].hand.push(drawnCard);
  
  // 移除成对的牌
  const result = removePairs(gameState[player].hand);
  gameState[player].hand = result.newHand;
  
  // 私聊展示手牌
  const privateMsg1 = seal.newMessage();
  privateMsg1.messageType = "private";
  privateMsg1.sender.userId = "QQ:"+player;
  seal.replyToSender(seal.createTempCtx(ctx.endPoint, privateMsg1), privateMsg1, `你抽到了 ${drawnCard}，打出的牌：${result.pairs.join(', ') || '无'}，当前手牌：${gameState[player].hand.join(', ')}`);
  
  const privateMsg2 = seal.newMessage();
  privateMsg2.messageType = "private";
  privateMsg2.sender.userId = "QQ:"+opponent;
  seal.replyToSender(seal.createTempCtx(ctx.endPoint, privateMsg2), privateMsg2, `对方抽到了 ${drawnCard}，你当前手牌：${gameState[opponent].hand.join(', ')}`);

  
  // 大群内回复
  seal.replyToSender(ctx, msg, `玩家 ${gameState[player].name} 抽到了 ${drawnCard}\n打出的牌：${result.pairs.join(', ') || '无'}\n玩家 ${gameState[player].name} 剩余手牌：${generateHandCountBars(gameState[player].hand.length)}\n玩家 ${gameState[opponent].name} 剩余手牌：${generateHandCountBars(gameState[opponent].hand.length)}`);
}

// 洗牌函数
function shuffleDeck(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

// 查找并移除成对的牌
function removePairs(hand) {
  const pairs = [];
  const sortedHand = [...hand].sort();
  let i = 0;
  while (i < sortedHand.length - 1) {
    if (sortedHand[i].slice(0, -1) === sortedHand[i + 1].slice(0, -1) && sortedHand[i] !== 'Joker' && sortedHand[i + 1] !== 'Joker') {
      pairs.push(sortedHand[i], sortedHand[i + 1]);
      sortedHand.splice(i, 2);
    } else {
      i++;
    }
  }
  return { newHand: sortedHand, pairs };
}

// 生成手牌数量条
function generateHandCountBars(count) {
  return '▊'.repeat(count+1);
}