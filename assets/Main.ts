const { ccclass, property } = cc._decorator;
const LIMIT = 40;
import UserBar from "./UserBar";
import Toggle from "./Toggle";
import ToggleKey from "./ToggleKey";
import Modal from "./Modal";


var wx = window["wx"];
var addonMap = {
    "maxScore": "关",
    "g2nStar": "星",
    "g3level": "关",
    "g4maxScore": "分",
    "g5level": "关",
    "g6level": "关",
    "g7maxScore": "分",
    "g8maxScore": "个字",
    "g9maxScore": "分",
    "g10level": "关",
    "g11stars":"星"
};



interface WorldRankData {
    score: number;
    _id: string;
    _openid: string;

    avatarUrl: string;
    nickName: string;
}
interface UserGameData {
    avatarUrl: string;
    nickname: string;
    openid: string;
    KVDataList: KVData[];
}
interface KVData {
    key: string;
    value: string;
}
interface UserInfo {
    avatarUrl: string;
    nickName: string;
    openId: string;
    privince: string;
}
interface GiftObj {
    sendCount: number;
    receiveRecords: {
        fromOpenid: string;
        time: number;
    }[]
}



@ccclass
export default class Main extends cc.Component{


    private selfOpenid: string = "";                // 自身的openid
    private friendsDataList: UserGameData[] = [];
    private worldDataList: {
        key: string,
        value: WorldRankData[]
    }[] = [];
    private giftStorageKey: string = new Date().toDateString();
    _rankType: number = -1;
    get rankType() {
        return this._rankType;
    }
    set rankType(v) {
        var change = v !== this._rankType;
        this._rankType = v;
        if (!change) return;
        // 
        this.toggleArr.forEach((toggle, i) => {
            toggle.act = v === i;
        });
        if (v === 0) {
            if (this.selfOpenid) {
                // 不是onLoad里面的，是后面切换的，需要重新刷新
                this.initFriendsData();
            } else {
                this.drawFriendRank(this.rankKey);
            }
        } else {
            this.drawWorldRankList();
        }
    }
    _rankKey: string = "maxScore---";
    get rankKey() {
        return this._rankKey;
    }
    set rankKey(v) {
        var change = v !== this._rankKey;
        this._rankKey = v;
        if (!change) return;
        // 
        this.toggleArrKey.forEach((toggle, i) => {
            toggle.act = v === toggle.key;
        });
        if (this.rankType === 0) {
            if (this.selfOpenid) {
                // 不是onLoad里面的，是后面切换的，需要重新刷新
                this.initFriendsData();
            } else {
                // 此时在onLoad里面
                this.drawFriendRank(this.rankKey);
            }
        } else {
            this.drawWorldRankList();
        }
    }


    
    @property(cc.Prefab)
    prefabUserBar: cc.Prefab = null!;
    
    @property(cc.Node)
    nodeView: cc.Node = null;
    @property(cc.ScrollView)
    scrollView: cc.ScrollView = null;
    @property(cc.Node)
    containerUserBar: cc.Node = null;

    @property(cc.Label)
    labelMyName: cc.Label = null;
    @property(cc.Label)
    labelMyScore: cc.Label = null;
    @property(cc.Sprite)
    spMyAvatar: cc.Sprite = null;
    @property(Modal)
    modal: Modal = null;

    @property(Toggle)
    toggleArr: Toggle[] = [];
    @property(ToggleKey)
    toggleArrKey: ToggleKey[] = [];


    /**
     * 获取好友托管数据（包括自己）
    */
    initFriendsData() {
        var rankKeyArr = [
            "maxScore",
            "g2nStar",
            "g3level",
            "g4maxScore",
            "g5level",
            "g6level",
            "g7maxScore",
            "g8maxScore",
            "g9maxScore",
            "g10level",
            "g11stars",
        ];
        var rankKey = this.rankKey;
        wx.getFriendCloudStorage({
            keyList: rankKeyArr.concat(this.giftStorageKey),
            success: ({ data }: { data: UserGameData[] }) => {
                this.log("成功获取好友数据：", data);

                this.friendsDataList = data;

                this.rankType === 0 && this.drawFriendRank(rankKey);
            }
        });
    }
    /**
     * 刷新显示
     * @param rankKey key键值
    */
    drawFriendRank(rankKey: string) {
        this.containerUserBar.removeAllChildren();
        
        this.sortArray(this.friendsDataList, rankKey);
        
        // 显示LIMIT个
        var friendsDataList = this.friendsDataList.slice(0, LIMIT);
        for (var i = 0; i < friendsDataList.length; i++){
            var obj = friendsDataList[i],
                obj_gift = this.getGift(obj.KVDataList);
            if (isNaN(parseInt(this.getScoreString(obj.KVDataList, rankKey)))) continue;
            

            var item = cc.instantiate(this.prefabUserBar),
                comp = item.getComponent(UserBar);
            item.parent = this.containerUserBar;

            
            comp.init(
                i + 1,
                obj.avatarUrl,
                obj.nickname,
                this.getScoreString(obj.KVDataList, rankKey),
                obj.openid
            );
            // 更新zanBtn显示
            var openid_same = !this.selfOpenid || obj.openid === this.selfOpenid;
            comp.canGift = !openid_same && !this.getGiftRecord(obj_gift);
        }

        // 显示自己的信息
        const self = this.friendsDataList.find(item => item.openid === this.selfOpenid);
        if (self) {
            this.labelMyName.string = `${self.nickname}`;
            this.labelMyScore.string = `${this.getScoreString(self.KVDataList, rankKey)}`;
            var avatar = this.spMyAvatar;
            cc.loader.load({ url: self.avatarUrl, type: 'jpg' }, function (err, tex) {
                avatar.spriteFrame = new cc.SpriteFrame(tex);
            });
        }
    }
    drawWorldRankList() {
        var rankKey = this.rankKey;
        this.containerUserBar.removeAllChildren();

        // 显示LIMIT个
        var worldRnkObj = this.worldDataList.find(o => o.key === rankKey);
        if (!worldRnkObj) return;
        var worldDataList = worldRnkObj.value.slice(0, LIMIT);
        for (var i = 0; i < worldDataList.length; i++){
            var item = cc.instantiate(this.prefabUserBar);
            item.parent = this.containerUserBar;

            var obj = worldDataList[i],
                comp = item.getComponent(UserBar);
            comp.init(
                i + 1,
                obj.avatarUrl,
                obj.nickName,
                obj[rankKey] + addonMap[rankKey],
                obj._openid
            );
        }

        // 显示自己的信息
        const self = this.friendsDataList.find(item => item.openid === this.selfOpenid);
        if (self) {
            this.labelMyName.string = `${self.nickname}`;
            this.labelMyScore.string = `${this.getScoreString(self.KVDataList, rankKey)}`;
            var avatar = this.spMyAvatar;
            cc.loader.load({ url: self.avatarUrl, type: 'jpg' }, function (err, tex) {
                avatar.spriteFrame = new cc.SpriteFrame(tex);
            });
        }
    }


    


    // LIFE-CYCLE CALLBACKS:

    // 如果设置开放域窗口active为false，则无法触发这个onload事件
    onLoad() {
        this.log("sub load")
        this.modal.hide();
        if (!this.isWechat()) return;
        this.rankType = 0;
        this.rankKey = "maxScore";
        this.scrollView.node.on('scrolling', this.onScrolling, this);
        this.scheduleOnce(() => {
            this.onScrolling(this.scrollView);
        });
        
        if (this.isWechat()) {
            wx.onMessage(data => {
                this.log("接收主域发来的消息数据：", data);
                switch (data.messageType) {
                    // #region 作废消息传递
                    // case 3:
                    //     // 提交分数到微信云服务器
                    //     console.log("更新用户的最大分数，对当前用户的微信托管数据，进行写数据操作。");
                    //     this.refreshUserInfo(data.maxScore, "maxScore");
                    //     break;
                    // case 4:
                    //     // 提交分数到微信云服务器
                    //     console.log("更新用户的星星数，对当前用户的微信托管数据，进行写数据操作。");
                    //     this.refreshUserInfo(data.nStar,"g2nStar");
                    //     break;
                    // case 5:
                    //     // 提交分数到微信云服务器
                    //     console.log("更新用户的关卡数，对当前用户的微信托管数据，进行写数据操作。");
                    //     this.refreshUserInfo(data.g3level,"g3level");
                    //     break;
                    // case 6:
                    //     // 提交分数到微信云服务器
                    //     console.log("更新用户的最大分数，对当前用户的微信托管数据，进行写数据操作。");
                    //     this.refreshUserInfo(data.g4maxScore,"g4maxScore");
                    //     break;
                    // case 7:
                    //     // 提交分数到微信云服务器
                    //     console.log("更新用户的关卡数，对当前用户的微信托管数据，进行写数据操作。");
                    //     this.refreshUserInfo(data.g5level,"g5level");
                    //     break;
                    // case 8:
                    //     // 提交分数到微信云服务器
                    //     console.log("更新用户的关卡数，对当前用户的微信托管数据，进行写数据操作。");
                    //     this.refreshUserInfo(data.g6level, "g6level");
                    //     break;
                    // case 9:
                    //     // 提交分数到微信云服务器
                    //     console.log("更新用户的最大分数，对当前用户的微信托管数据，进行写数据操作。");
                    //     this.refreshUserInfo(data.g7maxScore,"g7maxScore");
                    //     break;
                    // case 10:
                    //     // 提交分数到微信云服务器
                    //     console.log("更新用户的最大分数，对当前用户的微信托管数据，进行写数据操作。");
                    //     this.refreshUserInfo(data.g8maxScore,"g8maxScore");
                    //     break;
                    // case 11:
                    //     // 提交分数到微信云服务器
                    //     console.log("更新用户的最大分数，对当前用户的微信托管数据，进行写数据操作。");
                    //     this.refreshUserInfo(data.g9maxScore, "g9maxScore");
                    //     break;
                    // case 12:
                    //     // 提交分数到微信云服务器
                    //     console.log("更新用户的关卡数，对当前用户的微信托管数据，进行写数据操作。");
                    //     this.refreshUserInfo(data.g10level, "g10level");
                    //     break;
                    // case 13:
                    //     // 提交分数到微信云服务器
                    //     console.log("更新用户的stars，对当前用户的微信托管数据，进行写数据操作。");
                    //     this.refreshUserInfo(data.g11stars, "g11stars");
                        // break;
                    // #endregion
                    case 0:
                        this.selfOpenid = data.selfOpenid;
                        this.initFriendsData();
                        break;
                    case 1:
                        // 世界
                        this.worldDataList = data.rankdata as { key: string, value: WorldRankData[] }[];
                        this.rankType === 1 && this.drawWorldRankList();
                        break;
                    default:
                        break;
                }
            });
        }
    }





    // #region 工具函数
    /**
     * 打印数据
     * @param params 需要打印的数据列表
    */
    log(...params: any) {
        params[0] = `【开放域】${params[0]}`;
        console.log(...params);
    }
    getGift(KVDataList: KVData[]) {
        var key_gift = this.giftStorageKey,
            obj_gift: GiftObj;
        for (var i = 0; i < KVDataList.length; i++){
            if (KVDataList[i].key === key_gift) {
                obj_gift = JSON.parse(KVDataList[i].value);
                return obj_gift;
            }
        }
        return {
            sendCount: 0,
            receiveRecords: []
        };
    }
    getGiftRecord(obj_gift: GiftObj) {
        var find = obj_gift.receiveRecords.find(record => {
            return record.fromOpenid === this.selfOpenid;
        });
        return Boolean(find);
    }
    /**
     * 对数组进行排序处理（倒序）
     * @param data UserGameData数组
     * @param rankKey 需要排序的key
    */
    sortArray(data: UserGameData[], rankKey: string) {
        data.sort((a, b) => {
            var scoreA = this.getScoreString(a.KVDataList, rankKey),
                scoreB = this.getScoreString(b.KVDataList, rankKey);
            var sA = parseInt(scoreA),
                sB = parseInt(scoreB);
            // 从大到小排列
            if (isNaN(sA)) {
                return 1;
            } else {
                if (isNaN(sB)) {
                    return -1;
                } else {
                    return sB - sA;
                }
            }
        });
    }
    /**
     * 根据KVDATA数组获取对应的分数数据
     * @param KVDataList KVData数组
     * @param rankKey 要获取的key值
     * @return score string类型
    */
    getScoreString(KVDataList: KVData[], rankKey: string) {
        var addon = addonMap[rankKey];
        addon = addon ? addon : "";
        
        for (var i = 0; i < KVDataList.length; i++){
            if (KVDataList[i].key === rankKey) {
                return KVDataList[i].value + addon;
            }
        }
        return "-" + addon;
    }
    isWechat() { 
        return cc.sys.platform === cc.sys.WECHAT_GAME || cc.sys.platform === cc.sys.WECHAT_GAME_SUB;
    }
    getChenghao(key, score) { 
        if (key !== "g6level") return "";
        var guans = 30,
            arr = [
                "学童",
                "童生",
                "秀才",
                "举人",
                "贡士",

                "进士",
                "翰林",
                "侍郎",
                "尚书",
                "大学士",

                "御史",
                "丞相",
                "太子少师",
                "太子太师"
            ];
        score = parseInt(score);
        score = isNaN(score) ? 1 : score;
        score = Math.max(1, score);
        score = Math.min(guans * arr.length, score);
        var index = Math.floor((score - 1) / guans);
        return arr[index];
    }
    onScrolling(scrollView: cc.ScrollView) {
        var viewRect = cc.rect(-this.nodeView.width / 2, -this.containerUserBar.y - this.nodeView.height / 2, this.nodeView.width, this.nodeView.height);

        for (var i = 0; i < this.containerUserBar.children.length; i++){
            var node = this.containerUserBar.children[i];
            if (viewRect.intersects(node.getBoundingBox())) {
                node.opacity = 255;
            } else {
                node.opacity = 0;
            }
        }
    }
    // #endregion
};