// ==UserScript==
// @name         xp狼人杀
// @author       Fehling0v0
// @version      1.0.1
// @description  不一定靠谱的测试版，使用【help xp狼人杀】查看指令
// @timestamp    2025-07-24
// @license      Apache-2
// @homepageURL  https://github.com/Fehling0v0/TRPG
// ==/UserScript==


let ext;

if (!seal.ext.find('XP狼人杀')) {
  ext = seal.ext.new('XP狼人杀','Fehling0v0','1.0.1');
  seal.ext.register(ext);
} else {
  ext = seal.ext.find('XP狼人杀');
}

// 存储游戏数据
let group = JSON.parse(ext.storageGet("group") || '{}');

ext.onNotCommandReceived = (ctx, msg) => {
	const message = msg.message;
	const groupId = seal.format(ctx,"{$t群号_RAW}")
	const qq = seal.format(ctx,"{$t账号ID_RAW}")
	try {
		group = JSON.parse(ext.storageGet("group") || '{}');
	} catch (e) {
		seal.replyToSender(ctx, msg, "数据加载错误: " + e.message);
		return;
	}

	if (message === "加入XP狼人杀" || message === "加入xp狼人杀") {
		joinGame(ctx, msg, groupId, qq);
		return;
	}

	if (message === "开始XP狼人杀" || message === "开始xp狼人杀") {
		startGame(ctx, msg, groupId, qq);
		return;
	}

	if (seal.format(ctx,"{$t消息类型}") === "private" && (message.startsWith("xp") || message.startsWith("XP"))) {
		submitXP(ctx, msg, qq);
		return;
	}

	if (/^投票 ?\[CQ:at,qq=\d+\] ?$/.test(message)) {
		handleVote(ctx, msg, groupId, qq);
		return;
	}

	if (seal.format(ctx,"{$t消息类型}") === "private" && message.startsWith("kill")) {
		// 提取要杀的人
		const targetQQ = message.match(/\d+/)[0];
		wolfKill(ctx, msg, qq, targetQQ);
		return;
	}

	if (message === "结束XP狼人杀" || message === "结束xp狼人杀") {
		endGame(ctx, msg, groupId, qq);
		return;
	}

	if (message === "help XP狼人杀" || message === "help xp狼人杀"){
		showHelp(ctx, msg);
		return;
	}

	if (message === "退出XP狼人杀" || message === "退出xp狼人杀") {
		exitGame(ctx, msg, groupId, qq);
		return;
	}

}

// 保存group数据
function saveGroup() {
	try {
		ext.storageSet("group", JSON.stringify(group));
		return true;
	} catch (e) {
		console.error("保存数据失败: " + e.message);
		return false;
	}
}

// 初始化时加载group数据
try {
	group = JSON.parse(ext.storageGet("group") || '{}');
} catch (e) {
	console.error("初始化数据加载错误: " + e.message);
	group = {};
}

// 清除票数
function clearVote(ctx, msg, groupId) {
	if (!group.hasOwnProperty(groupId)) {
		seal.replyToSender(ctx, msg, "游戏未初始化");
		return;
	}

	let arr = Object.keys(group[groupId].gamer)
	let arr1 = []
	for (let i = 0; i < arr.length; i++) {
		group[groupId].gamer[arr[i]].votes = 0
		group[groupId].gamer[arr[i]].isVote = false
		if (!group[groupId].gamer[arr[i]].isDie) {
			arr1.push(arr[i])
		}
	}
	group[groupId].speakPeople = 0
	group[groupId].canVote = true
	saveGroup()
	//seal.replyToSender(ctx, msg, `接下来请玩家开始自由发言！`)
	return;
}

// 生成投票结果文本
function voteText(obj) {
	let text = "本轮票数排行榜："
	for (let i = 0; i < obj.length; i++) {
		text += `\n第${i+1}名:[CQ:at,qq=${obj[i]["qq"]}] (${obj[i]["votes"]}票)`
	}
	return text
}

// 加入游戏
function joinGame(ctx, msg, groupId, qq) {
	if (!group.hasOwnProperty(groupId)) {
		group[groupId] = {
			isStart: false,
			round: 0,
			speakPeople: 0,
			canVote: false,
			gamer: {},
			wolf: null,
			xpBox: []
		}
	} else {
		if (group[groupId].gamer.hasOwnProperty(qq)) {
			seal.replyToSender(ctx, msg, "你已经加入过游戏了")
			return false;
		}
		if (group[groupId].isStart) {
			seal.replyToSender(ctx, msg, "本局游戏已经开始了")
			return false;
		}
		if (Object.keys(group[groupId].gamer).length === 100) {
			seal.replyToSender(ctx, msg, "本局游戏人数已满")
			return false;
		}
	}
	group[groupId].gamer[qq] = {
		isDie: false,
		isWolf: false,
		votes: 0,
		isVote: false,
		xp: "",
		t: 11
	}
	let memberList = ""
	for (let i = 0; i < Object.keys(group[groupId].gamer).length; i++) {
		memberList += `\n${i+1}:[CQ:at,qq=${Object.keys(group[groupId].gamer)[i]}]`
	}
	seal.replyToSender(ctx, msg, `[CQ:at,qq=${qq}] 加入了本局XP狼人杀！\n当前人员:${memberList}\n提示:当游戏人员为3-100人时，发送[开始XP狼人杀]可以开始本局游戏。`)
	saveGroup()
	return true;
}

// 开始游戏
function startGame(ctx, msg, groupId, qq) {
	if (!group.hasOwnProperty(groupId) || Object.keys(group[groupId].gamer).length < 2) {
		seal.replyToSender(ctx, msg, "当前人数不足，无法开始游戏")
		return false;
	}
	if (!group[groupId].gamer.hasOwnProperty(qq)) {
		seal.replyToSender(ctx, msg, "你不在本局游戏内，无权这样做")
		return false;
	}
	if (group[groupId].isStart) {
		seal.replyToSender(ctx, msg, "本局游戏已经开始了！")
		return false;
	}

	// 收集所有玩家的XP
	let arr = Object.keys(group[groupId].gamer)
	for (let i = 0; i < arr.length; i++) {
		try {
			let msg1 = seal.newMessage();
			msg1.messageType = "private";
			msg1.sender.userId = "QQ:"+arr[i]
			let ctx1 = seal.createTempCtx(ctx.endPoint, msg1)
			seal.replyToSender(ctx1, msg1, "请私聊发送你的XP，以xp开头。")
		} catch (e) {
			seal.replyToSender(ctx, msg, "发送私聊消息失败: " + e.message);
		}
	}

	group[groupId].isStart = true
	group[groupId].round = 1
	saveGroup()
	seal.replyToSender(ctx, msg, "本局游戏已经开始，请各位玩家私聊发送XP！")
	return true;
}

// 处理玩家私聊发送的XP
function submitXP(ctx, msg, qq) {
	// 获取玩家所在群组
	let groupId1 = "";
	for (let gid in group) {
		if (group[gid].gamer.hasOwnProperty(qq) && group[gid].isStart) {
			groupId1 = gid;
			break;
		}
	}
	if (!groupId1) {
		seal.replyToSender(ctx, msg, "你不在本局游戏内，无法提交XP")
		return false;
	}

	if (group[groupId1].gamer[qq].isDie) {
		seal.replyToSender(ctx, msg, "你已经出局了，无法提交XP")
		return false;
	}

	// 只在游戏准备阶段(未开始投票前)允许提交XP
	if (group[groupId1].canVote){
		seal.replyToSender(ctx, msg, "游戏已进入投票阶段，不能再提交XP")
		return false;
	}

	if (group[groupId1].gamer[qq].xp !== "") {
		seal.replyToSender(ctx, msg, "你已经提交过XP，无法修改。")
		return false;
	}

	// 只移除消息开头的"xp"或"XP"（如果存在）
	let xpContent = msg.message.replace(/^xp|^XP/, "");
	group[groupId1].gamer[qq].xp = xpContent;
	group[groupId1].xpBox.push(xpContent)
	seal.replyToSender(ctx, msg, "XP已记录: "+group[groupId1].gamer[qq].xp)

	saveGroup()

	// 检查是否所有玩家都已提交XP
	let allSubmitted = true
	let arr = Object.keys(group[groupId1].gamer)
	for (let i = 0; i < arr.length; i++) {
		if (group[groupId1].gamer[arr[i]].xp === "") {
			allSubmitted = false
			break;
		}
	}

	if (allSubmitted) {
		// 随机抽取一个XP作为狼人
		let wolfXP = group[groupId1].xpBox[Math.floor(Math.random()*group[groupId1].xpBox.length)]
		let wolfQQ = ""
		for (let i = 0; i < arr.length; i++) {
			if (group[groupId1].gamer[arr[i]].xp === wolfXP) {
				wolfQQ = arr[i]
				break;
			}
		}

		// 检查是否找到狼人
		if (!wolfQQ || !group[groupId1].gamer.hasOwnProperty(wolfQQ)) {
			seal.replyToSender(ctx, msg, "选择狼人时出错，未找到匹配的玩家。")
			return false;
		}

		group[groupId1].wolf = wolfQQ
		group[groupId1].gamer[wolfQQ].isWolf = true

		// 发送群消息公布狼人XP
		try {
			let groupMsg = seal.newMessage();
			groupMsg.messageType = "group";
			groupMsg.groupId = "QQ-Group:" + groupId1;
			let ctx2 = seal.createTempCtx(ctx.endPoint,groupMsg)
			seal.replyToSender(ctx2, groupMsg, `狼人XP是: ${wolfXP}\n请各位玩家推理这是谁的XP，然后投票！`);

		} catch (e) {
			seal.replyToSender(ctx, msg, "发送群消息失败: " + e.message);
		}

		// 向狼人发送私聊消息
		try {
			if (wolfQQ) {

				let wolfMsg = seal.newMessage();
				wolfMsg.messageType = "private";
				wolfMsg.sender.userId = "QQ:"+wolfQQ
				let ctx1 = seal.createTempCtx(ctx.endPoint,wolfMsg)
				// 发送私聊消息
				seal.replyToSender(ctx1, wolfMsg, `你是狼人！请在夜晚阶段私聊选择要杀的人。\n格式：kill QQ号`);

			}
		} catch (e) {
			seal.replyToSender(ctx, msg, "发送狼人提示消息失败: " + e.message);
		}

		group[groupId1].canVote = true
		saveGroup()
	} //else {
		//seal.replyToSender(ctx, msg, allSubmitted);
	//}

	return true;
}

// 处理投票
function handleVote(ctx, msg, groupId, qq) {
	if (!group.hasOwnProperty(groupId) || !group[groupId].isStart) {
		seal.replyToSender(ctx, msg, "游戏未开始或不存在")
		return false;
	}
	if (!group[groupId].gamer.hasOwnProperty(qq)) {
		seal.replyToSender(ctx, msg, "你不在此局游戏内，无权这样做")
		return false;
	}
	if (group[groupId].gamer[qq].isDie) {
		seal.replyToSender(ctx, msg, "你已经出局了，无法投票")
		return false;
	}
	if (!group[groupId].canVote) {
		seal.replyToSender(ctx, msg, "当前无法投票")
		return false;
	}
	if (group[groupId].gamer[qq].isVote) {
		seal.replyToSender(ctx, msg, "本轮你已经投票过了")
		return false;
	}

	let vote = msg.message.replace(/\D/g,"")
	if (!group[groupId].gamer.hasOwnProperty(vote)) {
		seal.replyToSender(ctx, msg, "ta不在此局游戏内")
		return false;
	}
	/*
	if (vote === qq) {
		seal.replyToSender(ctx, msg, "不可以投票给自己")
		return false;
	}*/
	if (group[groupId].gamer[vote].isDie) {
		seal.replyToSender(ctx, msg, "ta已经出局了，无法投票")
		return false;
	}

	group[groupId].gamer[vote].votes = group[groupId].gamer[vote].votes + 1
	group[groupId].gamer[qq].isVote = true
	seal.replyToSender(ctx, msg, "投票成功！")
	saveGroup()

	// 判断本轮所有玩家是否都已投票完毕
	let obj = []
	let arr = Object.keys(group[groupId].gamer)
	for (let i = 0; i < arr.length; i++) {
		if (group[groupId].gamer[arr[i]].isDie) {
			continue;
		}
		if (!group[groupId].gamer[arr[i]].isVote) {
			//seal.replyToSender(ctx, msg, "本轮还有玩家未投票完毕，请各位玩家抓紧时间！")
			return true;
		}
		let obj1 = {
			"qq": arr[i],
			"votes": group[groupId].gamer[arr[i]].votes
		}
		obj.push(obj1)
	}

	// 给obj按票数降序排序
	obj.sort(function (a, b){return b.votes - a.votes})

	seal.replyToSender(ctx, msg, `${voteText(obj)}`)

	// 处理投票结果
	if (obj[0].votes === obj[1].votes) {
		seal.replyToSender(ctx, msg, "本次得票榜一与榜二票数相同，无人被票出，游戏继续。")
		seal.replyToSender(ctx, msg, "进入夜晚阶段。狼人请私聊选择要杀的人。")
		group[groupId].canVote = false
		group[groupId].round = group[groupId].round + 1
		saveGroup()
		return true;
	}

	// 得票榜一被票出
	group[groupId].gamer[obj[0].qq].isDie = true
	seal.replyToSender(ctx, msg, `[CQ:at,qq=${obj[0].qq}] 被票出！现公开你的XP：${group[groupId].gamer[obj[0].qq].xp}`)

	// 检查游戏是否结束
	if (obj[0].qq === group[groupId].wolf) {
		seal.replyToSender(ctx, msg, "狼人被票出，好人阵营获胜！")
		delete group[groupId]
		saveGroup()
		return true;
	} else {
		// 狼人未被票出，进入夜晚
		seal.replyToSender(ctx, msg, "狼人未被票出，进入夜晚阶段。狼人请私聊选择要杀的人。")
		group[groupId].canVote = false
		group[groupId].round = group[groupId].round + 1
		saveGroup()
	}
	return true;
}

// 处理狼人夜晚杀人
function wolfKill(ctx, msg, qq, killQQ) {
	// 获取玩家所在群组
	let groupId = "";
	for (let gid in group) {
		if (group[gid].gamer.hasOwnProperty(qq) && group[gid].isStart) {
			groupId = gid;
			break;
		}
	}
	//杀人失败
	{
	if (!groupId) {
		seal.replyToSender(ctx, msg, "你不在任何游戏中")
		return false;
	}
	if (!group[groupId].isStart) {
		seal.replyToSender(ctx, msg, "游戏未开始")
		return false;
	}
	if (!group[groupId].gamer.hasOwnProperty(qq)) {
		seal.replyToSender(ctx, msg, "你不在此局游戏内")
		return false;
	}
	if (!group[groupId].gamer[qq].isWolf) {
		seal.replyToSender(ctx, msg, "你不是狼人，无法执行此操作")
		return false;
	}
	if (group[groupId].gamer[qq].isDie) {
		seal.replyToSender(ctx, msg, "你已经出局了")
		return false;
	}
	if (group[groupId].canVote) {
		seal.replyToSender(ctx, msg, "当前不是夜晚阶段，无法杀人")
		return false;
	}


	if (!group[groupId].gamer.hasOwnProperty(killQQ)) {
		seal.replyToSender(ctx, msg, "ta不在此局游戏内")
		return false;
	}
	if (killQQ === qq) {
		seal.replyToSender(ctx, msg, "?不可以自杀哦")
		return false;
	}
	if (group[groupId].gamer[killQQ].isDie) {
		seal.replyToSender(ctx, msg, "ta已经出局了")
		return false;
	}
	}

	// 杀人成功
	group[groupId].gamer[killQQ].isDie = true
	seal.replyToSender(ctx, msg, "杀人成功！")
	// 发送群消息通知死亡
	try {
		let groupMsg = seal.newMessage();
		groupMsg.messageType = "group";
		groupMsg.sender.userId = "QQ:123456";
		groupMsg.groupId ="QQ-Group:" + groupId;
		let groupCtx = seal.createTempCtx(ctx.endPoint, groupMsg)
		seal.replyToSender(groupCtx, groupMsg, `[CQ:at,qq=${killQQ}] 被狼人杀死！\n现公开你的XP：${group[groupId].gamer[killQQ].xp}`)
	} catch (e) {
		seal.replyToSender(ctx, msg, "发送群消息失败: " + e.message);
	}

	// 检查游戏是否结束
	let aliveCount = 0
    let wolfAlive = false
    let arr = Object.keys(group[groupId].gamer)
    let totalPlayers = arr.length;
    for (let i = 0; i < arr.length; i++) {
        if (!group[groupId].gamer[arr[i]].isDie) {
            aliveCount++
            if (group[groupId].gamer[arr[i]].isWolf) {
                wolfAlive = true
            }
        }
    }

	// 发送群消息通知游戏结束
	let groupMsg = seal.newMessage();
	groupMsg.messageType = "group";
	groupMsg.groupId = "QQ-Group:" + groupId;
	let ctx2 = seal.createTempCtx(ctx.endPoint,groupMsg)

	if (!wolfAlive) {
        seal.replyToSender(ctx2, groupMsg, "狼人已全部死亡，好人阵营获胜！")
        delete group[groupId]
        saveGroup()
        return true;
    } else if ((aliveCount - 1) < totalPlayers / 2) {
        seal.replyToSender(ctx2, groupMsg, "剩余好人人数不足玩家总数1/2，狼人阵营获胜！")
        delete group[groupId]
        saveGroup()
        return true;
	} else {
		// 进入下一轮
		seal.replyToSender(ctx2, groupMsg, "天亮请睁眼，开始新一轮讨论！")
		group[groupId].canVote = true
		clearVote(ctx2, msg, groupId)
		saveGroup()
	}
	return true;
}

// 结束游戏
function endGame(ctx, msg, groupId, qq) {
	if (!group.hasOwnProperty(groupId)) {
		seal.replyToSender(ctx, msg, "当前群聊内不存在已经开始的游戏，无需结束游戏")
		return false;
	}
	if (ctx.privilegeLevel < 50 && !group[groupId].gamer.hasOwnProperty(qq)) {
		seal.replyToSender(ctx, msg, "你不在游戏中，无法结束游戏")
		return false;
	}
	delete group[groupId]
	saveGroup()
	seal.replyToSender(ctx, msg, "结束成功")
	return true;
}

// 显示帮助信息
function showHelp(ctx, msg) {
	let reply1 = 'XP狼人杀\n' +
		'参与游戏的人把自己的XP私聊发给骰子\n' +
		'骰子随机指定狼人，并公开狼人的XP\n' +
		'大家要推理公开的XP是谁的，然后投票\n' +
		'如果狼人没死，晚上可以杀一人\n' +
		'被杀的人将被公开XP\n' +
		'若狼人被投出，则好人方胜利\n' + 
		'若剩余好人人数不足总人数的1/2，则狼人获胜';
	let reply2 = '游戏指令：\n' +
		'1. 加入XP狼人杀 - 加入游戏\n' +
		'2. 退出XP狼人杀 - 退出游戏(游戏开始前)\n' +
		'3. 开始XP狼人杀 - 开始游戏(需3-100人)\n' +
		'4. 投票@玩家 - 投票选出狼人\n' +
		'5. kill 玩家qq号 - 杀死指定玩家\n' +
		'6. 结束XP狼人杀 - 强制结束当前游戏\n' +
		'7. help XP狼人杀 - 显示本帮助\n\n' +
		'指令使用XP/xp均可。';
	let reply3 = '注意：关于xp重复的情况，被选中的狼人会收到来自骰子的小窗提示，未收到消息则不是狼人。\n' +
		'如果在小窗录入xp时出现“你不在本局游戏内”的提示，一般是由于尚未使用“开始xp狼人杀”指令。使用这个指令后游戏状态才会转为已开始。\n' +
		'不建议玩家在多个群内同时进行游戏，可能会导致游戏数据混乱。\n' +
		'@人时请使用@（这说的什么话（总之意思是请不要使用复制粘贴\n';
	seal.replyToSender(ctx, msg, reply1);
	seal.replyToSender(ctx, msg, reply2);
	seal.replyToSender(ctx, msg, reply3);
	return true;
}

// 退出游戏
function exitGame(ctx, msg, groupId, qq) {
	if (!group.hasOwnProperty(groupId) || !group[groupId].gamer.hasOwnProperty(qq)) {
		seal.replyToSender(ctx, msg, "你不在本局游戏中")
		return false;
	}
	if (group[groupId].isStart) {
		seal.replyToSender(ctx, msg, "游戏已经开始，无法退出")
		return false;
	}
	delete group[groupId].gamer[qq];
	let memberList = "";
	for (let i = 0; i < Object.keys(group[groupId].gamer).length; i++) {
		memberList += `\n${i+1}:[CQ:at,qq=${Object.keys(group[groupId].gamer)[i]}]`;
	}
	saveGroup();
	seal.replyToSender(ctx, msg, `[CQ:at,qq=${qq}] 已退出本局XP狼人杀！\n当前人员:${memberList}`);
	return true;
}
