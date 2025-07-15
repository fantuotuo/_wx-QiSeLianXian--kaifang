// 世界排行榜数据对象
export type WorldRankData = {
  score: number;
  _id: string;
  _openid: string;

  avatarUrl: string;
  nickName: string;
};
// 好友托管数据
export type UserGameData = {
  avatarUrl: string;
  nickname: string;
  openid: string;
  KVDataList: {
    key: string;
    value: string;
  }[];
};
// 好友赠送数据（来自好友托管数据）
export type GiftObj = {
  sendCount: number;
  receiveRecords: {
    fromOpenid: string;
    time: number;
  }[];
};

// 0好友排行 1世界排行 2周排行
export enum RankType {
  FRIEND = 0,
  WORLD = 1,
  WEEK = 2,
}
export enum MessageType {
  SEND_OPENID = 0,
  SEND_RANK_DATA = 1,
}

export const LIMIT_RANK = 40; // 最多展示多少个
export const AddonMap = {
  maxScore: "关",
  g2nStar: "星",
  g3level: "关",
  g4maxScore: "分",
  g5level: "关",
  g6level: "关",
  g7maxScore: "分",
  g8maxScore: "个字",
  g9maxScore: "分",
  g10level: "关",
  g11stars: "星",
  g13stars: "星",
};
export const RankKeyArr = Object.keys(AddonMap);
export const GiftStorageKey = new Date().toDateString(); // 每天的key不一样
