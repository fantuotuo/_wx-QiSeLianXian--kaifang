import { AddonMap, FriendGameData, GiftObj, GiftStorageKey } from "./types";

/**
 * 对数组进行排序处理（倒序）
 * @param data FriendGameData数组
 * @param rankKey 需要排序的key
 */
export function sortFriendGameData(data: FriendGameData[], rankKey: string) {
  data.sort((a, b) => {
    const scoreA = getFriendScoreString(a.KVDataList, rankKey),
      scoreB = getFriendScoreString(b.KVDataList, rankKey);
    const sA = parseInt(scoreA),
      sB = parseInt(scoreB);
    // 从大到小排列
    if (isNaN(sA)) {
      return 1;
    }
    if (isNaN(sB)) {
      return -1;
    }
    return sB - sA;
  });
}

/**
 * 根据KVDATA数组获取对应的分数数据
 * @param KVDataList KVData数组
 * @param rankKey 要获取的key值
 * @return score string类型
 */
export function getFriendScoreString(
  KVDataList: FriendGameData["KVDataList"],
  rankKey: string
) {
  const addon = AddonMap[rankKey] || "";

  for (var i = 0; i < KVDataList.length; i++) {
    if (KVDataList[i].key === rankKey) {
      return KVDataList[i].value + addon;
    }
  }
  return "-" + addon;
}

/**
 * 获取礼物数据
 * @param KVDataList 某一个用户的KVDataList
 */
function getGift(KVDataList: FriendGameData["KVDataList"]): GiftObj {
  const kvData = KVDataList.find((item) => item.key === GiftStorageKey);
  if (kvData) {
    return JSON.parse(kvData.value);
  }

  return {
    sendCount: 0,
    receiveRecords: [],
  };
}
/**
 * 判断是否可以继续赠送礼物
 * @param KVDataList 对方用户的KVDataList
 * @param selfOpenid 自己的openid
 */
export function checkCanSendGift(
  KVDataList: FriendGameData["KVDataList"],
  selfOpenid: string
) {
  const obj_gift = getGift(KVDataList);
  const find = obj_gift.receiveRecords.find((record) => {
    return record.fromOpenid === selfOpenid;
  });
  return Boolean(find);
}

/**
 * 打印数据
 * @param params 需要打印的数据列表
 */
export function log(...params: any[]) {
  params[0] = `【开放域】${params[0]}`;
  console.log(...params);
}

export function isWechat() { 
  return cc.sys.platform === cc.sys.WECHAT_GAME || cc.sys.platform === cc.sys.WECHAT_GAME_SUB;
}
