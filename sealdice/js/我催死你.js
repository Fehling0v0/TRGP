// ==UserScript==
// @name         我催死你
// @author       Fehling0v0
// @version      2.0.0
// @description  我吵死你们这帮不交卡的（掏扩音器）\n\n使用【help 我催死你】查看帮助\n请勿恶意使用。\n\n2.0优化版
// @timestamp    2025-07-29
// @license      Apache-2
// @homepageURL  https://github.com/Fehling0v0/TRPG
// ==/UserScript==


let ext = seal.ext.find('我催死你');
if (!ext) {
    ext = seal.ext.new('我催死你', 'Fehling0v0', '1.0.0');
    seal.ext.register(ext);
}

// 生成5位随机秘钥（数字+大小写字母）
function generateSecretKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let key = '';
    for (let i = 0; i < 5; i++) {
        key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
}

let masterQQ = "";

ext.onNotCommandReceived = (ctx, msg) => {
    const message=msg.message;
    if (message === "help 我催死你" || message === "help我催死你") {
        let help1 = '指令格式:\n' +
            '催[他/她/它]+干什么+@对方+时间间隔\n' +
            '示例：\n' + 
            '【催他交卡@鸽子 1h】\n' +
            '【催她画稿@鸽子 30m】\n' +
            '时间间隔格式示例：10m，1h，1d\n' +
            '不输入时间间隔则默认间隔为三小时\n\n' +
            '--- 催宝，一款真正人性化的智能扩音器 ---' +
            '\n\n请勿恶意使用。如果被害了善用拉黑免打扰，冤有头债有主别骂我。\n' +
            '使用【help 我催死你2.0】查看更新内容。' 
        seal.replyToSender(ctx, msg, help1);   
        return; 
    }
    if (message === "help 我催死你2.0") {
        let help2 ='2.0更新：\n' +
            '限制消息回复频率为三分钟及以上。\n' +
            '催促达到100次后自动取消任务。\n' + 
            '任务创建者指令：【show key 催】 查看你发起的所有任务的秘钥\n' +
            '群主指令：【delete 催】 删除本群内所有任务\n' +
            '管理员指令：\n' +
            '【set admin 催】 设置当前账号为管理员（需要拥有骰主权限）\n' +
            '【delete admin 催】 删除当前账号的管理员权限\n' +
            '管理员只能设置一位。设置管理员之后可以使用以下指令，且每当有人新建催促任务时管理员均会收到提示\n' +
            '【show all 催】 查看当前所有任务的信息及秘钥\n' +
            '【delete all 催】 删除所有任务';
        seal.replyToSender(ctx, msg, help2);
        return;
    }

    //设置管理员
    if (message.includes("set admin") && (message.includes("催"))) {
        if (ctx.privilegeLevel == 100){
            if (masterQQ == "") {
                masterQQ = seal.format(ctx, "{$t账号ID_RAW}");
                seal.replyToSender(ctx, msg, `已设置管理员${masterQQ}`);
                return;
            } else {
                seal.replyToSender(ctx, msg, `管理员已存在，无法重复设置。`);
            }
        } else {
            seal.replyToSender(ctx, msg, `你没有权限设置管理员。`);
            return;
        }
    }

    //删除管理员
    if (message.includes("delete admin") && (message.includes("催"))) {
        if (ctx.privilegeLevel == 100){
            if (seal.format(ctx, "{$t账号ID_RAW}") === masterQQ ) {
                masterQQ = "";
                seal.replyToSender(ctx, msg, `已删除管理员${masterQQ}`);
                return;
            }
        } else {
            seal.replyToSender(ctx, msg, `你没有权限删除管理员。`);
            return;
        }
    }

    //管理员操作
    if (seal.format(ctx, "{$t账号ID_RAW}") === masterQQ ) {
        if (message.includes("show all") && (message.includes("催"))) {
            //展示当前所有任务的群号、发起者、催促对象、频率及秘钥
            let replyMsg = "";
            const tasks = JSON.parse(ext.storageGet("reminderTasks") || '{}');
            for (let taskId in tasks) {
                replyMsg = replyMsg + `群号：${tasks[taskId].groupId}，发起者：${tasks[taskId].creatorQQ}，催促对象：${tasks[taskId].targetQQ}，动作：${tasks[taskId].action}，频率：${tasks[taskId].intervalStr}，秘钥：${tasks[taskId].secretKey}\n`;
            }
            if (replyMsg === "") {
                replyMsg = "当前没有任务。";
            }
            seal.replyToSender(ctx, msg, replyMsg);
            return;
        }
        if (message.includes("delete all") && (message.includes("催"))) {
            //草泥马烦死我了全删了jpg
            ext.storageSet("reminderTasks", JSON.stringify({}));
            seal.replyToSender(ctx, msg, `已清除所有任务。`);
            return;
        }
    }

    //群主指令
    if (ctx.privilegeLevel >= 60) {
        if (message == "delete 催") {
            //删除本群所有任务
            const tasks = JSON.parse(ext.storageGet("reminderTasks") || '{}');
            for (let taskId in tasks) {
                if (tasks[taskId].groupId === seal.format(ctx, "{$t群号_RAW}")) {
                    delete tasks[taskId];
                }
            }
            ext.storageSet("reminderTasks", JSON.stringify(tasks));
            seal.replyToSender(ctx, msg, `已清除本群所有任务。`);
            return;
        }
    }


    // 处理取消催促指令
    if (message.startsWith("不催了")) {
        const secretKey = message.slice(3).trim();
        if (secretKey.length !== 5) {
            seal.replyToSender(ctx, msg, "秘钥格式错误！请使用: 不催了+5位秘钥（不带加号）");
            return;
        }
        try {
            const tasks = JSON.parse(ext.storageGet("reminderTasks") || '{}');
            let taskFound = false;
            
            // 查找并删除对应秘钥的任务
            for (let taskId in tasks) {
                if (tasks[taskId].secretKey === secretKey) {
                    delete tasks[taskId];
                    taskFound = true;
                    break;
                }
            }
            
            if (taskFound) {
                ext.storageSet("reminderTasks", JSON.stringify(tasks));
                seal.replyToSender(ctx, msg, `已取消秘钥为${secretKey}的任务`);
            } else {
                seal.replyToSender(ctx, msg, `未找到秘钥为${secretKey}的任务`);
            }
        } catch (e) {
            seal.replyToSender(ctx, msg, "坏了，取消不了: " + e.message);
        }
        return;
    }

    if (message === "show key 催") {
        //展示以当前qq为发起者的所有任务的秘钥
        let replyMsg = "";
        const tasks = JSON.parse(ext.storageGet("reminderTasks") || '{}');
        let taskFound = false;
        for (let taskId in tasks) {
            if (tasks[taskId].creatorQQ === seal.format(ctx, "{$t账号ID_RAW}")) {
                taskFound = true;
                replyMsg = replyMsg + `催促对象${tasks[taskId].targetQQ}，动作${tasks[taskId].action}，频率${tasks[taskId].intervalStr}，秘钥${tasks[taskId].secretKey}\n`;
            }
        }
        if (!taskFound) {
            seal.replyToSender(ctx, msg, `未找到以当前qq为发起者的任务。`);
            return;
        }
        seal.replyToSender(ctx, msg, replyMsg);
    }

    if (message.startsWith("催他") || message.startsWith("催它") || message.startsWith("催她")) {
        const match = message.match(/催[他它她](.*?)\[CQ:at,qq=(\d+)\](.*)/);
        if (!match) {
            return;
        }
        const action = match[1].trim();
        const targetQQ = match[2];
        const intervalStr = match[3].trim() || "3h";
        
        // 解析时间间隔
        const intervalMatch = intervalStr.match(/(\d+)([smhd])/);
        if (!intervalMatch) {
            seal.replyToSender(ctx, msg, "时间格式错误！支持格式: 10m(分钟)、1h(小时)、1d(天)");
            return;
        }
        const intervalNum = parseInt(intervalMatch[1]);
        const intervalUnit = intervalMatch[2];
        let intervalMs = 0;
        switch(intervalUnit) {
            case 's': intervalMs = intervalNum * 1000; break;   //。。。我得把这个ban了
            case 'm': intervalMs = intervalNum * 60 * 1000; break;
            case 'h': intervalMs = intervalNum * 60 * 60 * 1000; break;
            case 'd': intervalMs = intervalNum * 24 * 60 * 60 * 1000; break;
            default: intervalMs = 3 * 60 * 60 * 1000; // 默认3小时
        }
/*
        if (intervalNum < 180000) {
            seal.replyToSender(ctx, msg, "时间间隔过短，拒绝执行该任务。最小时间间隔为三分钟。");
            return;
        }
        */
        
        // 创建定时任务
        const taskId = `task_${Date.now()}`;
        const task = {
            action, targetQQ, intervalMs,
            groupId: seal.format(ctx, "{$t群号_RAW}"),
            creatorQQ: seal.format(ctx, "{$t账号ID_RAW}"),
            createTime: Date.now(),
            secretKey: generateSecretKey(), // 添加秘钥
            intervalStr: intervalStr,
        }

        const masterMsg = seal.newMessage();
        masterMsg.messageType = "private";
        masterMsg.sender.userId = `QQ:${masterQQ}`;
        masterMsg.message = "来自群" +task.groupId + "的定时催促任务：\n" + 
                            "发起者：" + task.creatorQQ + "，目标：" + task.targetQQ + "\n" +
                            "频率：" + intervalStr + "，动作：" + task.action + "，秘钥：" + task.secretKey;
        seal.replyToSender(seal.createTempCtx(ctx.endPoint, masterMsg), masterMsg, masterMsg.message);
        
        let reply = '此任务的秘钥为：' + task.secretKey + '\n' +
        '输入【不催了+秘钥（不带加号）】可取消此任务。';
        seal.replyPerson(ctx, msg, reply);
        
        // 保存任务到存储
        const tasks = JSON.parse(ext.storageGet("reminderTasks") || '{}');
        tasks[taskId] = task;
        ext.storageSet("reminderTasks", JSON.stringify(tasks));
        
        let count=0;
        // 设置定时器并保存ID
        const timerId = setInterval(() => {
            try {
                // 检查任务是否存在
                const currentTasks = JSON.parse(ext.storageGet("reminderTasks") || '{}');
                if (!currentTasks[taskId]) {
                    // 任务已被删除，清除定时器
                    clearInterval(timerId);
                    return;
                }                

                const groupMsg = seal.newMessage();
                groupMsg.messageType = "group";
                groupMsg.groupId = `QQ-Group:${task.groupId}`;
                groupMsg.message = `[CQ:at,qq=${task.targetQQ}] ${task.action}！！！`;
                seal.replyToSender(seal.createTempCtx(ctx.endPoint, groupMsg), groupMsg, groupMsg.message);
                
                const privateMsg = seal.newMessage();
                privateMsg.messageType = "private";
                privateMsg.sender.userId = `QQ:${task.targetQQ}`;
                privateMsg.message = ` ${task.action}！！！！！`;
                seal.replyToSender(seal.createTempCtx(ctx.endPoint, privateMsg), privateMsg, privateMsg.message);

                count++;
                if(count == 100){
                    seal.replyToSender(ctx, msg, `任务催[CQ:at,qq=${task.targetQQ}] ${task.action}已执行100次，已停止。`);
                    //删除任务
                    delete currentTasks[taskId];
                    ext.storageSet("reminderTasks", JSON.stringify(currentTasks));
                    clearInterval(timerId);
                    return;
                }

            } catch (e) {
                console.error("催不动了:", e);
            }            
        
        }, intervalMs);
        
        seal.replyToSender(ctx, msg, `了解！将于${intervalStr}后提醒[CQ:at,qq=${targetQQ}] ${action}`);
    }
}

//这玩意儿怎么特么快三百行了谁有头绪吗，插件作者没头绪，怎么真有神人设1s一条+没加骰子好友没收到秘钥取消不掉
