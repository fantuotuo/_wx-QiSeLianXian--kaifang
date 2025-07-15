import {
  UserGameData,
  WorldRankData,
  //
  RankType,
  MessageType,
  AddonMap,
  RankKeyArr,
  LIMIT_RANK,
  GiftStorageKey,
} from "./utils/types";
import {
  log,
  isWechat,
  loadAvatar,
  checkCanSendGift,
  sortFriendGameData,
  getFriendScoreString,
} from "./utils/tools";

const { ccclass, property } = cc._decorator;
import UserBar from "./UserBar";
import Toggle from "./Toggle";
import ToggleKey from "./ToggleKey";
import Modal from "./Modal";

@ccclass
export default class Main extends cc.Component {
  private act: boolean = true;

  private selfOpenid: string = ""; // 自身的openid
  private friendsDataList: UserGameData[] = [];
  private worldDataList: {
    key: string;
    value: WorldRankData[];
  }[] = [];
  private worldDataListWeek: {
    key: string;
    value: WorldRankData[];
  }[] = [];
  private rankDataSingle: {
    [key: string]: WorldRankData[];
  } = {};
  private rankDataSingleWeek: {
    [key: string]: WorldRankData[];
  } = {};

  _rankType?: RankType; // 0好友排行 1世界排行 2周排行
  get rankType() {
    return this._rankType;
  }
  set rankType(v) {
    if (!this.act) return;
    const change = v !== this._rankType;
    this._rankType = v;
    if (!change) return;
    //
    // 更新toggle组件激活状态
    this.toggleArr.forEach((toggle, i) => (toggle.act = v === i));
    if (v === RankType.FRIEND) {
      this.drawFriendRank();
    } else {
      if (this.rankType === RankType.WORLD) {
        this.drawWorldRankList();
      } else {
        this.drawWorldRankList(true);
      }
      wx.postMessage({
        messageType: MessageType.QUERY_RANK_DATA_SINGLE,
        rankKey: this.rankKey,
        isWeek: this.rankType === RankType.WEEK,
      });
    }
  }
  _rankKey?: keyof typeof AddonMap;
  get rankKey() {
    return this._rankKey;
  }
  set rankKey(v) {
    if (!this.act) return;
    const change = v !== this._rankKey;
    this._rankKey = v;
    if (!change) return;
    //
    // 更新toggle组件激活状态
    this.toggleArrKey.forEach((toggle, i) => (toggle.act = v === toggle.key));
    log(v, "rankKey changed");
    if (this.rankType === RankType.FRIEND) {
      this.drawFriendRank();
    } else {
      if (this.rankType === RankType.WORLD) {
        this.drawWorldRankList();
      } else {
        this.drawWorldRankList(true);
      }
      wx.postMessage({
        messageType: MessageType.QUERY_RANK_DATA_SINGLE,
        rankKey: this.rankKey,
        isWeek: this.rankType === RankType.WEEK,
      });
    }
  }

  @property(cc.Prefab)
  prefabUserBar: cc.Prefab = null!;

  @property(cc.Node)
  nodeView: cc.Node = null!;
  @property(cc.ScrollView)
  scrollView: cc.ScrollView = null!;
  @property(cc.Node)
  containerUserBar: cc.Node = null!;

  @property(cc.Label)
  labelMyName: cc.Label = null!;
  @property(cc.Label)
  labelMyScore: cc.Label = null!;
  @property(cc.Sprite)
  spMyAvatar: cc.Sprite = null!;
  @property(Modal)
  modal: Modal = null!;

  @property(Toggle)
  toggleArr: Toggle[] = [];
  @property(ToggleKey)
  toggleArrKey: ToggleKey[] = [];

  /**
   * 获取好友托管数据（包括自己）
   */
  initFriendsData() {
    wx.getFriendCloudStorage({
      keyList: RankKeyArr.concat(GiftStorageKey),
      success: ({ data }: { data: UserGameData[] }) => {
        log("成功获取好友数据：", data);

        this.friendsDataList = data;
        if (this.rankType === RankType.FRIEND) {
          this.drawFriendRank();
        }
      },
    });
  }
  /**
   * 刷新显示
   */
  drawFriendRank() {
    if (!this.rankKey) return;
    var children = this.containerUserBar.children.slice();
    children.forEach((c) => c.destroy());
    // this.containerUserBar.removeAllChildren();

    sortFriendGameData(this.friendsDataList, this.rankKey);
    // 显示LIMIT_RANK个
    const friendsDataList = this.friendsDataList.slice(0, LIMIT_RANK);
    for (let i = 0; i < friendsDataList.length; i++) {
      const obj = friendsDataList[i];
      if (isNaN(parseInt(getFriendScoreString(obj.KVDataList, this.rankKey))))
        continue;

      const item = cc.instantiate(this.prefabUserBar);
      const comp = item.getComponent(UserBar);
      item.parent = this.containerUserBar;

      comp.init(
        i + 1,
        obj.avatarUrl,
        obj.nickname,
        getFriendScoreString(obj.KVDataList, this.rankKey),
        obj.openid
      );
      // 更新zanBtn显示
      const openid_same = !this.selfOpenid || obj.openid === this.selfOpenid;
      comp.canGift =
        !openid_same && checkCanSendGift(obj.KVDataList, this.selfOpenid);
    }

    // 显示自己的信息
    const selfObj = this.friendsDataList.find(
      (item) => item.openid === this.selfOpenid
    );
    if (selfObj) {
      this.labelMyName.string = `${selfObj.nickname}`;
      this.labelMyScore.string = `${getFriendScoreString(
        selfObj.KVDataList,
        this.rankKey
      )}`;
      loadAvatar(selfObj.avatarUrl, this.spMyAvatar);
    }
  }
  /**
   * 刷新世界排行榜
   * @param week 是否是周排行榜
   */
  drawWorldRankList(week = false) {
    if (!this.rankKey) return;
    const rankKey = this.rankKey;
    const children = this.containerUserBar.children.slice();
    children.forEach((c) => c.destroy());
    // this.containerUserBar.removeAllChildren();

    // 显示LIMIT_RANK个
    // let worldRnkObj = this.worldDataList.find((o) => o.key === rankKey);
    // if (week)
    //   worldRnkObj = this.worldDataListWeek.find((o) => o.key === rankKey);
    // if (!worldRnkObj) return;
    let worldRankObj = this.rankDataSingle[rankKey];
    if (week) worldRankObj = this.rankDataSingleWeek[rankKey];
    if (!worldRankObj) return;

    const worldDataList = worldRankObj.slice(0, LIMIT_RANK);
    for (let i = 0; i < worldDataList.length; i++) {
      const item = cc.instantiate(this.prefabUserBar);
      item.parent = this.containerUserBar;
      const comp = item.getComponent(UserBar);

      const obj = worldDataList[i];
      const score = obj[rankKey as keyof WorldRankData];
      const scoreAddon = AddonMap[rankKey as keyof typeof AddonMap];
      comp.init(
        i + 1,
        obj.avatarUrl,
        obj.nickName,
        score + scoreAddon,
        obj._openid
      );
    }

    // 显示自己的信息
    const selfObj = this.friendsDataList.find(
      (item) => item.openid === this.selfOpenid
    );
    if (selfObj) {
      this.labelMyName.string = `${selfObj.nickname}`;
      this.labelMyScore.string = `${getFriendScoreString(
        selfObj.KVDataList,
        rankKey || ""
      )}`;
      loadAvatar(selfObj.avatarUrl, this.spMyAvatar);
    }
  }

  // LIFE-CYCLE CALLBACKS:

  // 如果设置开放域窗口active为false，则无法触发这个onload事件
  onLoad() {
    log("sub load");
    this.modal.hide();
    if (!isWechat()) return;

    // 此时会刷新显示
    this.rankType = RankType.FRIEND;
    this.rankKey = "maxScore";
    this.scrollView.node.on("scrolling", this.onScrolling, this);
    this.scheduleOnce(() => {
      this.onScrolling(this.scrollView);
    });

    wx.onMessage((data: any) => {
      log("接收主域发来的消息数据：", data);
      // 主域发来消息，是否需要显示子域
      if (data.fromEngine && data.event === "mainLoop") {
        this.act = data.value;
        // 主动拉数据
        if (this.act && this.rankType !== RankType.FRIEND) {
          wx.postMessage({
            messageType: MessageType.QUERY_RANK_DATA_SINGLE,
            rankKey: this.rankKey,
            isWeek: this.rankType === RankType.WEEK,
          });
        }
        return;
      }

      switch (data.messageType) {
        case MessageType.SEND_OPENID:
          this.selfOpenid = data.selfOpenid;
          this.initFriendsData();
          break;
        case MessageType.SEND_RANK_DATA:
          // 世界排行榜信息
          this.worldDataList = data.rankdata;
          this.worldDataListWeek = data.rankdataWeek;
          if (this.rankType === RankType.WORLD) {
            this.drawWorldRankList();
          } else if (this.rankType === RankType.WEEK) {
            this.drawWorldRankList(true);
          }
          break;
        case MessageType.SEND_RANK_DATA_SINGLE:
          if (data.isWeek) {
            this.rankDataSingleWeek[data.rankKey] = data.rankdata;
          } else {
            this.rankDataSingle[data.rankKey] = data.rankdata;
          }
          // 只有当前选项匹配才绘制
          if (
            this.rankKey === data.rankKey &&
            this.rankType === RankType.WORLD &&
            !data.isWeek
          ) {
            this.drawWorldRankList();
          } else if (
            this.rankKey === data.rankKey &&
            this.rankType === RankType.WEEK &&
            data.isWeek
          ) {
            this.drawWorldRankList(true);
          }
          break;
        default:
          break;
      }
    });
  }

  // #region 工具函数
  onScrolling(scrollView: cc.ScrollView) {
    var viewRect = cc.rect(
      -this.nodeView.width / 2,
      -this.containerUserBar.y - this.nodeView.height / 2,
      this.nodeView.width,
      this.nodeView.height
    );

    for (var i = 0; i < this.containerUserBar.children.length; i++) {
      var node = this.containerUserBar.children[i];
      if (viewRect.intersects(node.getBoundingBox())) {
        node.opacity = 255;
      } else {
        node.opacity = 0;
      }
    }
  }
  // #endregion
}
