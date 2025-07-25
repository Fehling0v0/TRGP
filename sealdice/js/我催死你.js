// ==UserScript==
// @name         我催死你
// @author       Fehling0v0
// @version      1.0.0
// @description  我吵死你们这帮不交卡的（掏扩音器）\n\n使用【help 我催死你】查看帮助\n请勿恶意使用。
// @timestamp    2025-07-25
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

ext.onNotCommandReceived = (ctx, msg) => {
    const message=msg.message;
    if (message === "help 我催死你" || message === "help我催死你") {
        let help = '指令格式:\n' +
            '催[他/她/它]+干什么+@对方+时间间隔\n' +
            '示例：\n' + 
            '【催他交卡@鸽子 1h】\n' +
            '【催她画稿@鸽子 30m】\n' +
            '时间间隔格式示例：10m，1h，1d\n' +
            '不输入时间间隔则默认间隔为三小时\n\n' +
            '--- 催宝，一款真正人性化的智能扩音器 ---' +
            '\n\n请勿恶意使用。如果被害了冤有头债有主别挂我。';
        seal.replyToSender(ctx, msg, help);    
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

    if (message.startsWith("催他") || message.startsWith("催它") || message.startsWith("催她")) {
        // 解析指令格式: 催他【去干啥】@那个ta 【时间间隔】
        const match = message.match(/催[他它她](.*?)\[CQ:at,qq=(\d+)\](.*)/);
        if (!match) {
            //seal.replyToSender(ctx, msg, "指令格式错误！请使用: 催他【去干啥】@那个ta 【时间间隔】");
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
            case 's': intervalMs = intervalNum * 1000; break;
            case 'm': intervalMs = intervalNum * 60 * 1000; break;
            case 'h': intervalMs = intervalNum * 60 * 60 * 1000; break;
            case 'd': intervalMs = intervalNum * 24 * 60 * 60 * 1000; break;
            default: intervalMs = 3 * 60 * 60 * 1000; // 默认3小时
        }
        
        // 创建定时任务
        const taskId = `task_${Date.now()}`;
        const task = {
            action, targetQQ, intervalMs,
            groupId: seal.format(ctx, "{$t群号_RAW}"),
            creatorQQ: seal.format(ctx, "{$t账号ID_RAW}"),
            createTime: Date.now(),
            secretKey: generateSecretKey() // 添加秘钥
        }
        
        let reply = '此任务的秘钥为：' + task.secretKey + '\n' +
        '输入【不催了+秘钥（不带加号）】可取消此任务。';
        seal.replyPerson(ctx, msg, reply)
        
        // 保存任务到存储
        const tasks = JSON.parse(ext.storageGet("reminderTasks") || '{}');
        tasks[taskId] = task;
        ext.storageSet("reminderTasks", JSON.stringify(tasks));
        
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
            } catch (e) {
                console.error("催不动了:", e);
            }            
        
        }, intervalMs);
        
        seal.replyToSender(ctx, msg, `了解！将于${intervalStr}后提醒[CQ:at,qq=${targetQQ}] ${action}`);
    }
}

