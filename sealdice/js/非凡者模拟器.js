// ==UserScript==
// @name         非凡者模拟器
// @author       Fehling0v0
// @version      1.0.0
// @description  【help 非凡者模拟器】
// @timestamp    2025-08-05
// @license      Apache-2
// @homepageURL  https://github.com/Fehling0v0/TRPG/tree/main/sealdice/js
// @updateUrl    https://raw.githubusercontent.com/Fehling0v0/TRPG/refs/heads/main/sealdice/js/%E9%9D%9E%E5%87%A1%E8%80%85%E6%A8%A1%E6%8B%9F%E5%99%A8.js
// @updateUrl    https://ghfast.top/https://raw.githubusercontent.com/Fehling0v0/TRPG/refs/heads/main/sealdice/js/%E9%9D%9E%E5%87%A1%E8%80%85%E6%A8%A1%E6%8B%9F%E5%99%A8.js
// ==/UserScript==

let ext = seal.ext.find('非凡者');
if (!ext) {
  ext = seal.ext.new('非凡者', 'Fehling0v0', '1.0.0');
  seal.ext.register(ext);
}

// 初始化存储
function initStorage() {
  // 初始化用户数据
  if (!ext.storageGet('userData')) {
    ext.storageSet('userData', JSON.stringify({}));
  }
  // 初始化序列数据
  if (!ext.storageGet('sequenceData')) {
    const sequenceData = {
      "占卜家": ["占卜家", "小丑", "魔术师", "无面人", "秘偶大师", "诡法师", "古代学者", "奇迹师", "诡秘侍者", "愚者"],
      "学徒": ["学徒", "戏法大师", "占星人", "纪录官", "旅行家", "秘法师", "漫游者", "旅法师", "星之匙", "门"],
      "偷盗者": ["偷盗者", "诈骗师", "解密学者", "盗火人", "窃梦家", "寄生者", "欺瞒导师", "命运木马", "时之虫", "错误"],
      "观众": ["观众", "读心者", "心理医生", "催眠师", "梦境行者", "操纵师", "织梦人", "洞察者", "作家", "空想家"],
      "太阳": ["歌颂者", "祈光人", "太阳神官", "公证人", "光之祭司", "无暗者", "正义导师", "逐光者", "纯白天使", "太阳"],
      "风暴": ["水手", "暴怒之民", "航海家", "风眷者", "海洋歌者", "灾难主祭", "海王", "天灾", "雷神", "暴君"],
      "阅读者": ["阅读者", "推理学员", "守知者", "博学者", "秘术导师", "预言家", "洞悉者", "智天使", "全知之眼", "白塔"],
      "秘祈人": ["秘祈人", "倾听者", "隐修士", "蔷薇主教", "牧羊人", "黑骑士", "三首圣堂", "秽语长老", "暗天使", "倒吊人"],
      "死神": ["收尸人", "掘墓人", "通灵者", "死灵导师", "看门人", "不死者", "摆渡人", "死亡执政官", "苍白皇帝", "死神"],
      "黑夜": ["不眠者", "午夜诗人", "梦魇", "安魂师", "灵巫", "守夜人", "恐惧主教", "隐秘之仆", "厄难骑士", "黑暗"],
      "战神": ["战士", "格斗家", "武器大师", "黎明骑士", "守护者", "猎魔者", "银骑士", "荣耀者", "神明之手", "黄昏巨人"],
      "红祭司": ["猎人", "挑衅者", "纵火家", "阴谋家", "收割者", "铁血骑士", "战争主教", "天气术士", "征服者", "红祭司"],
      "魔女": ["刺客", "教唆者", "女巫", "欢愉", "痛苦", "绝望", "不老", "灾难", "末日", "魔女"],
      "深渊": ["罪犯", "折翼天使", "连环杀手", "恶魔", "欲望使徒", "魔鬼", "呓语者", "鲜血大公", "污秽君王", "深渊"],
      "异种": ["囚犯", "疯子", "狼人", "活尸", "怨魂", "木偶", "沉默门徒", "古代邪物", "神孽", "被缚者"],
      "黑皇帝": ["律师", "野蛮人", "贿赂者", "腐化男爵", "混乱导师", "堕落伯爵", "狂乱法师", "熵之公爵", "弒序亲王", "黑皇帝"],
      "审判者": ["仲裁人", "治安官", "审讯者", "法官", "惩戒骑士", "律令法师", "混乱猎手", "平衡者", "秩序之手", "审判者"],
      "窥秘人": ["窥秘人", "格斗学者", "巫师", "卷轴教授", "星象师", "神秘学家", "预言大师", "贤者", "知识皇帝", "隐者"],
      "通识者": ["通识者", "考古学者", "鉴定师", "机械专家", "天文学家", "炼金术士", "奥秘学者", "知识导师", "启蒙者", "完美者"],
      "月亮": ["药师", "驯兽师", "吸血鬼", "魔药教授", "深红学者", "巫王", "召唤大师", "创生者", "美神", "月亮"],
      "大地": ["耕种者", "医师", "丰收祭司", "生物学家", "德鲁伊", "古代炼金师", "抬棺人", "荒芜主母", "自然行者", "母亲"],
      "命运": ["怪物", "机器", "幸运者", "灾祸教士", "赢家", "厄运法师", "混乱行者", "先知", "巨蛇", "命运之轮"]
    };
    ext.storageSet('sequenceData', JSON.stringify(sequenceData));
  }
  // 初始化途径分组数据
  if (!ext.storageGet('pathGroups')) {
    const pathGroups = {
      "group1": ["月亮", "大地"],
      "group2": ["黑皇帝", "审判者"],
      "group3": ["窥秘人", "通识者"],
      "group4": ["深渊", "异种"],
      "group5": ["红祭司", "魔女"],
      "group6": ["死神", "黑夜", "战神"],
      "group7": ["观众", "太阳", "风暴", "阅读者", "秘祈人"],
      "group8": ["占卜家", "学徒", "偷盗者"]
    };
    ext.storageSet('pathGroups', JSON.stringify(pathGroups));
  }
}

// 数字转中文
function numToChinese(num) {
  const ChineseNum = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
  if (num >= 0 && num <= 10) {
    return ChineseNum[num];
  } else if (num < 20) {
    return '十' + (num % 10 === 0 ? '' : ChineseNum[num % 10]);
  } else {
    return ChineseNum[Math.floor(num / 10)] + '十' + (num % 10 === 0 ? '' : ChineseNum[num % 10]);
  }
}

// 运行初始化
initStorage();

ext.onNotCommandReceived = (ctx, msg) => {
  let message = msg.message;
  let qq = seal.format(ctx, "{$t账号ID_RAW}");
  let date = parseInt(seal.format(ctx, "{$tDate}"));
  let userData = JSON.parse(ext.storageGet("userData") || '{}');
  let sequenceData = JSON.parse(ext.storageGet("sequenceData") || '{}');
  let pathGroups = JSON.parse(ext.storageGet("pathGroups") || '{}');
  let playerName = seal.format(ctx, "{$t玩家}");

  // 初始化用户数据
  if (!userData[qq]) {
    userData[qq] = {
      "path": null,
      "sequenceLevel": 9,
      "digestion": 0,
      "signInDate": 0,
      "sacrificeCount": 0,
      "actCount": 0,
      "canChangePath": true
    };
    ext.storageSet("userData", JSON.stringify(userData));
  }

  // 帮助信息
  if (message === "help 非凡者模拟器") {
    let reply = "非凡者模拟器指令说明：\n" +
                "1. 签到 - 每日签到增加1-6消化度\n" +
                "2. 献祭xx - 每日最多3次，增加1-3消化度\n" +
                "3. 扮演xx - 每日最多3次，增加1-3消化度\n" +
                "4. 选择途径 xx - 初次选择途径\n" +
                "5. 更换途径 xx - 序列四后可更换一次途径\n" +
               // "6. 查看状态 - 查看当前序列、消化度等信息\n" +
               // "7. 我是皇帝，消化度+[数字] - 测试指令，增加指定消化度\n" +
               // "8. 我是皇帝，更换到[途径名] - 测试指令，不受条件限制更换途径\n" +
               // "9. 三二一重开我不要当桂皮了_清空信息 - 重置当前用户的所有非凡者数据\n" +
               // "\n消化度达到50、100、200、500、1000、2000、5000、10000、20000时分别晋升序列八至序列零\n" +
                "请谨慎选择途径，序列四后仅可更换一次途径，且只能在相邻途径内更换。";
    seal.replyToSender(ctx, msg, reply);
    return;
  }

  // 查看状态
  /*
  if (message === "查看状态") {
    let user = userData[qq];
    if (!user.path) {
      seal.replyToSender(ctx, msg, "您尚未选择途径，请使用'选择途径/选择序列 [途径名/序列名]'指令选择途径。");
      return;
    }
    let sequenceName = sequenceData[user.path][user.sequenceLevel - 9];
    let nextDigestion = getNextDigestion(user.sequenceLevel);
    let reply = `${playerName}的非凡者状态：\n` +
                `途径：${user.path}\n` +
                `序列：${numToChinese(user.sequenceLevel)} (${sequenceName})\n` +
                `消化度：${user.digestion}/${nextDigestion || '已达到序列零'}\n` +
                `今日签到：${user.signInDate === date ? '已签到' : '未签到'}\n` +
                `今日献祭次数：${user.sacrificeCount}/3\n` +
                `今日扮演次数：${user.actCount}/3\n` +
                `是否可更换途径：${user.canChangePath && user.sequenceLevel <= 4 ? '是' : '否'}`;
    seal.replyToSender(ctx, msg, reply);
    return;
  }*/

  // 签到功能
  if (message === "签到") {
    let user = userData[qq];
    if (!user.path) {
      seal.replyToSender(ctx, msg, "您尚未选择途径，请先选择途径。");
      return;
    }
    if (user.signInDate === date) {
      seal.replyToSender(ctx, msg, "您今日已签到，请明日再来。");
      return;
    }
    let increase = Math.floor(Math.random() * 6) + 1; // 1-6
    user.digestion += increase;
    user.signInDate = date;
    ext.storageSet("userData", JSON.stringify(userData));
    
    // 检查是否晋升
    let oldLevel = user.sequenceLevel;
    checkPromotion(ctx, msg, qq, user, sequenceData);
    
    let sequenceName = sequenceData[user.path][9 - user.sequenceLevel];
    let reply = `${playerName}签到成功！获得 1d6=${increase} 点消化度，当前消化度：${user.digestion}。\n` +
                `当前您为序列${numToChinese(user.sequenceLevel)} - ${sequenceName}`;
    seal.replyToSender(ctx, msg, reply);
    return;
  }

  // 献祭功能
  if (message.startsWith("献祭")) {
    let user = userData[qq];
    if (!user.path) {
      seal.replyToSender(ctx, msg, "您尚未选择途径，请先选择途径。");
      return;
    }
    if (user.sacrificeCount >= 3) {
      seal.replyToSender(ctx, msg, "您今日献祭次数已达上限，请明日再来。");
      return;
    }
    let content = message.replace(/^献祭/, "").trim();
    if (!content) {
      seal.replyToSender(ctx, msg, "请输入献祭物品，格式：献祭[物品]");
      return;
    }
    let increase = Math.floor(Math.random() * 3) + 1; // 1-3
    user.digestion += increase;
    user.sacrificeCount++;
    ext.storageSet("userData", JSON.stringify(userData));
    
    // 检查是否晋升
    let oldLevel = user.sequenceLevel;
    checkPromotion(ctx, msg, qq, user, sequenceData);
    
    let sequenceName = sequenceData[user.path][9 - user.sequenceLevel];
    let reply = `${playerName}献祭成功！隐秘的存在收到了您的${content}，获得 1d3=${increase} 点消化度，当前消化度：${user.digestion}。\n` +
                `当前您为序列${numToChinese(user.sequenceLevel)} - ${sequenceName}\n`;
    seal.replyToSender(ctx, msg, reply);
    return;
  }

  // 扮演功能
  if (message.startsWith("扮演")) {
    let user = userData[qq];
    if (!user.path) {
      seal.replyToSender(ctx, msg, "您尚未选择途径，请先选择途径。");
      return;
    }
    if (user.actCount >= 3) {
      seal.replyToSender(ctx, msg, "您今日扮演次数已达上限，请明日再来。");
      return;
    }
    let content = message.replace(/^扮演/, "").trim();
    if (!content) {
      seal.replyToSender(ctx, msg, "请输入扮演行为，格式：扮演[行为]");
      return;
    }
    let increase = Math.floor(Math.random() * 3) + 1; // 1-3
    user.digestion += increase;
    user.actCount++;
    ext.storageSet("userData", JSON.stringify(userData));
    
    // 检查是否晋升
    let oldLevel = user.sequenceLevel;
    checkPromotion(ctx, msg, qq, user, sequenceData);
    
    let sequenceName = sequenceData[user.path][9 - user.sequenceLevel];
    let reply = `${playerName}扮演成功！您完美演绎了${content}，获得 1d3=${increase} 点消化度，当前消化度：${user.digestion}。\n` +
                `当前您为序列${numToChinese(user.sequenceLevel)} - ${sequenceName}`;
    seal.replyToSender(ctx, msg, reply);
    return;
  }

  // 选择途径/序列
  if (message.startsWith("选择途径") || message.startsWith("选择序列")) {
    let user = userData[qq];
    if (user.path) {
      seal.replyToSender(ctx, msg, "您已选择过途径。");
      return;
    }
    let pathInput = message.replace(/^选择途径|选择序列/, "").trim();
    if (!pathInput) {
      seal.replyToSender(ctx, msg, "请输入途径名。");
      return;
    }
    // 查找对应的途径
    let path = findPathByInput(pathInput, sequenceData);
    if (!path) {
      seal.replyToSender(ctx, msg, `未找到途径 ${pathInput}，请检查输入是否正确。`);
      return;
    }
    user.path = path;
    user.sequenceLevel = 9;
    user.digestion = 0;
    ext.storageSet("userData", JSON.stringify(userData));
    let sequenceName = sequenceData[path][0]; // 序列9的名称
    seal.replyToSender(ctx, msg, `已选择${path}途径，欢迎来到神秘与超凡的世界。\n当前您为序列九 - ${sequenceName}`);
    return;
  }

  // 更换途径/序列
  if (message.startsWith("更换途径") || message.startsWith("更换序列")) {
    let user = userData[qq];
    if (!user.path) {
      seal.replyToSender(ctx, msg, "您尚未选择途径，请先选择途径。");
      return;
    }
    if (!user.canChangePath) {
      seal.replyToSender(ctx, msg, "您已更换过一次途径，无法再次更换。");
      return;
    }
    if (user.sequenceLevel > 4) {
      seal.replyToSender(ctx, msg, "为满足更换条件，只有高序列才能更换途径。");
      return;
    }
    let newPathInput = message.replace(/^更换途径|更换序列/, "").trim();
    if (!newPathInput) {
      seal.replyToSender(ctx, msg, "请输入新途径名。");
      return;
    }
    // 查找对应的途径
    let newPath = findPathByInput(newPathInput, sequenceData);
    if (!newPath) {
      seal.replyToSender(ctx, msg, `未找到途径 ${newPathInput}，请检查输入是否正确。`);
      return;
    }
    // 检查是否可以更换到该途径
    if (!canChangeToPath(user.path, newPath, pathGroups)) {
      seal.replyToSender(ctx, msg, `无法更换到${newPath}途径，只能在相邻途径内更换。`);
      return;
    }
    // 更换途径，保持序列等级和消化度
    let oldPath = user.path;
    user.path = newPath;
    user.canChangePath = false;
    ext.storageSet("userData", JSON.stringify(userData));
    let oldSequenceName = sequenceData[oldPath][9 - user.sequenceLevel];
    let newSequenceName = sequenceData[newPath][9 - user.sequenceLevel];
    let reply = `已成功从${oldPath}途径更换到${newPath}途径。`;
    seal.replyToSender(ctx, msg, reply);
    return;
  }

  // 测试指令：增加消化度
  let testMatch = message.match(/^我是皇帝，消化度\+([0-9]+)$/);
  if (testMatch) {
    let user = userData[qq];
    if (!user.path) {
      seal.replyToSender(ctx, msg, "您尚未选择途径，请先选择途径。");
      return;
    }
    let increase = parseInt(testMatch[1]);
    user.digestion += increase;
    ext.storageSet("userData", JSON.stringify(userData));
    
    // 检查是否晋升
    let oldLevel = user.sequenceLevel;
    checkPromotion(ctx, msg, qq, user, sequenceData);
    
    let sequenceName = sequenceData[user.path][9 - user.sequenceLevel];
    let reply = `已增加${increase}点消化度，当前消化度：${user.digestion}。\n当前您为序列${numToChinese(user.sequenceLevel)} - ${sequenceName}`;
    seal.replyToSender(ctx, msg, reply);
    return;
  }

  // 皇帝更换途径指令：不受条件限制
  let emperorChangeMatch = message.match(/^我是皇帝，更换到(.+)$/);
  if (emperorChangeMatch) {
    let user = userData[qq];
    if (!user.path) {
      seal.replyToSender(ctx, msg, "打错了");
      return;
    }
    let newPathInput = emperorChangeMatch[1].trim();
    if (!newPathInput) {
      seal.replyToSender(ctx, msg, "打错了");
      return;
    }
    // 查找对应的途径
    let newPath = findPathByInput(newPathInput, sequenceData);
    if (!newPath) {
      seal.replyToSender(ctx, msg, `打错了`);
      return;
    }
    // 更换途径，保持序列等级和消化度
    let oldPath = user.path;
    user.path = newPath;
    // 即使使用皇帝指令，也标记为已更换过途径
    user.canChangePath = false;
    ext.storageSet("userData", JSON.stringify(userData));
    let oldSequenceName = sequenceData[oldPath][9 - user.sequenceLevel];
    let newSequenceName = sequenceData[newPath][9 - user.sequenceLevel];
    let reply = `已成功从${oldPath}途径更换到${newPath}途径。`;
    seal.replyToSender(ctx, msg, reply);
    return;
  }

  // 清空信息指令
  if (message === "三二一重开我不要当桂皮了_清空信息") {
    delete userData[qq];
    ext.storageSet("userData", JSON.stringify(userData));
    seal.replyToSender(ctx, msg, "已清空您的所有非凡者数据，可重新选择途径开始。");
    return;
  }

} // end of onNotCommandReceived

// 检查晋升
function checkPromotion(ctx, msg, qq, user, sequenceData) {
  const promotionLevels = [
    { level: 8, digestion: 50 },
    { level: 7, digestion: 100 },
    { level: 6, digestion: 200 },
    { level: 5, digestion: 500 },
    { level: 4, digestion: 1000 },
    { level: 3, digestion: 2000 },
    { level: 2, digestion: 5000 },
    { level: 1, digestion: 10000 },
    { level: 0, digestion: 20000 }
  ];

  for (let promo of promotionLevels) {
    if (user.sequenceLevel > promo.level && user.digestion >= promo.digestion) {
      user.sequenceLevel = promo.level;
      let sequenceName = sequenceData[user.path][9 - user.sequenceLevel];
      seal.replyToSender(ctx, msg, `恭喜您晋升至序列${numToChinese(promo.level)} - ${sequenceName}`);
      // 更新存储
      let userData = JSON.parse(ext.storageGet("userData") || '{}');
      userData[qq] = user;
      ext.storageSet("userData", JSON.stringify(userData));
      // 继续检查是否可以进一步晋升
      checkPromotion(ctx, msg, qq, user, sequenceData);
      break;
    }
  }
}

// 获取下一等级所需消化度
function getNextDigestion(level) {
  const promotionLevels = [
    { level: 8, digestion: 50 },
    { level: 7, digestion: 100 },
    { level: 6, digestion: 200 },
    { level: 5, digestion: 500 },
    { level: 4, digestion: 1000 },
    { level: 3, digestion: 2000 },
    { level: 2, digestion: 5000 },
    { level: 1, digestion: 10000 },
    { level: 0, digestion: 20000 }
  ];

  for (let promo of promotionLevels) {
    if (level > promo.level) {
      return promo.digestion;
    }
  }
  return null; // 已达到序列0
}

// 根据输入查找途径
function findPathByInput(input, sequenceData) {
  // 1. 直接匹配途径名
  if (sequenceData[input]) {
    return input;
  }
  // 2. 匹配序列名
  for (let path in sequenceData) {
    if (sequenceData[path].includes(input)) {
      return path;
    }
  }
  return null;
}

// 检查是否可以更换到目标途径
function canChangeToPath(currentPath, targetPath, pathGroups) {
  if (currentPath === targetPath) {
    return true;
  }
  for (let group in pathGroups) {
    if (pathGroups[group].includes(currentPath) && pathGroups[group].includes(targetPath)) {
      return true;
    }
  }
  return false;
}
