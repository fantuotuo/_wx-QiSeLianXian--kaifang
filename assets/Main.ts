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
    } else if (this.rankType === RankType.WORLD) {
      this.drawWorldRankList();
    } else {
      this.drawWorldRankList(true);
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
    } else if (this.rankType === RankType.WORLD) {
      this.drawWorldRankList();
    } else {
      this.drawWorldRankList(true);
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
    var friendsDataList = this.friendsDataList.slice(0, LIMIT_RANK);
    for (var i = 0; i < friendsDataList.length; i++) {
      var obj = friendsDataList[i];
      if (isNaN(parseInt(getFriendScoreString(obj.KVDataList, this.rankKey))))
        continue;

      var item = cc.instantiate(this.prefabUserBar),
        comp = item.getComponent(UserBar);
      item.parent = this.containerUserBar;

      comp.init(
        i + 1,
        obj.avatarUrl,
        obj.nickname,
        getFriendScoreString(obj.KVDataList, this.rankKey),
        obj.openid
      );
      // 更新zanBtn显示
      var openid_same = !this.selfOpenid || obj.openid === this.selfOpenid;
      comp.canGift =
        !openid_same && checkCanSendGift(obj.KVDataList, this.selfOpenid);
    }

    // 显示自己的信息
    const self = this.friendsDataList.find(
      (item) => item.openid === this.selfOpenid
    );
    if (self) {
      this.labelMyName.string = `${self.nickname}`;
      this.labelMyScore.string = `${getFriendScoreString(
        self.KVDataList,
        this.rankKey
      )}`;
      loadAvatar(self.avatarUrl, this.spMyAvatar);
    }
  }
  drawWorldRankList(week = false) {
    var rankKey = this.rankKey;
    var children = this.containerUserBar.children.slice();
    children.forEach((c) => c.destroy());
    // this.containerUserBar.removeAllChildren();

    // 显示LIMIT_RANK个
    var worldRnkObj = this.worldDataList.find((o) => o.key === rankKey);
    if (week)
      worldRnkObj = this.worldDataListWeek.find((o) => o.key === rankKey);
    if (!worldRnkObj) return;
    var worldDataList = worldRnkObj.value.slice(0, LIMIT_RANK);
    for (var i = 0; i < worldDataList.length; i++) {
      var item = cc.instantiate(this.prefabUserBar);
      item.parent = this.containerUserBar;

      var obj = worldDataList[i],
        comp = item.getComponent(UserBar);
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
    const self = this.friendsDataList.find(
      (item) => item.openid === this.selfOpenid
    );
    if (self) {
      this.labelMyName.string = `${self.nickname}`;
      this.labelMyScore.string = `${getFriendScoreString(
        self.KVDataList,
        rankKey || ""
      )}`;
      loadAvatar(self.avatarUrl, this.spMyAvatar);
    }
  }

  // LIFE-CYCLE CALLBACKS:

  // 如果设置开放域窗口active为false，则无法触发这个onload事件
  onLoad() {
    log("sub load");
    this.modal.hide();
    if (!isWechat()) return;

    this.rankType = RankType.FRIEND;
    this.rankKey = "maxScore";
    this.scrollView.node.on("scrolling", this.onScrolling, this);
    this.scheduleOnce(() => {
      this.onScrolling(this.scrollView);
    });

    wx.onMessage((data: any) => {
      log("接收主域发来的消息数据：", data);
      if (data.fromEngine && data.event === "mainLoop")
        return (this.act = data.value);
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
