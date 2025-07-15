import { AddonMap, UserGameData, GiftObj, GiftStorageKey } from "./types";

/**
 * 对数组进行排序处理（倒序）
 * @param data UserGameData数组
 * @param rankKey 需要排序的key
 */
export function sortFriendGameData(data: UserGameData[], rankKey: string) {
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
  KVDataList: UserGameData["KVDataList"],
  rankKey: string
) {
  const addon = AddonMap[rankKey as keyof typeof AddonMap] || "";

  for (var i = 0; i < KVDataList.length; i++) {
    if (KVDataList[i].key === rankKey) {
      return KVDataList[i].value + addon;
    }
  }
  return "-" + addon;
}

/**
 * 判断是否可以继续赠送礼物
 * @param KVDataList 对方用户的KVDataList
 * @param selfOpenid 自己的openid
 */
export function checkCanSendGift(
  KVDataList: UserGameData["KVDataList"],
  selfOpenid: string
) {
  // 先找到对方的礼物记录
  const kvData = KVDataList.find((item) => item.key === GiftStorageKey);
  let objGift: GiftObj = {
    sendCount: 0,
    receiveRecords: [],
  };
  if (kvData) {
    objGift = JSON.parse(kvData.value);
  }

  const find = objGift.receiveRecords.find((record) => {
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
  return (
    cc.sys.platform === cc.sys.WECHAT_GAME ||
    cc.sys.platform === cc.sys.WECHAT_GAME_SUB
  );
}
