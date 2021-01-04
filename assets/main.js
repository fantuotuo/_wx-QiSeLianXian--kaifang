var addonMap = {
    "maxScore": "关",
    "g2nStar": "星",
    "g3level": "关",
    "g4maxScore": "分",
    "g5level": "关",
    "g6level":"关"
};
        
cc.Class({
    extends: cc.Component,

    properties: {
        prefabItem: cc.Prefab,

        layoutContainer: cc.Node,
        itemMy: cc.Node,
        items: [cc.Node],
        

        myFriendsData: {
            // nickname,avatarUrl,KVDataList
            default:[]
        },
        userInfo: {
            // nickname,avatarUrl,score,rank,
            default: {},
        }
    },


    // 获取用户信息，只在初始化时候调用
    getUserInfo() { 
        if (this.isWechat()) {
            wx.getUserInfo({
                openIdList: ["selfOpenId"],
    
                success: res => {
                    console.log("【成功】获取用户信息", res);
                    var data = res.data;
                    if (data && data.length > 0) {
                        var obj = data[0];
                        this.userInfo.nickname = obj.nickName;
                        this.userInfo.avatarUrl = obj.avatarUrl;
                        this.getMyRank();
                    }
                },
                fail: res => {
                    console.log("【失败】获取用户信息", res);
                },
                complete: res => {
                    
                }
            });
        }
    },
    // 根据我的信息获取我的排名
    getMyRank(key) {   
        this.itemMy.active = false;
        if (!this.userInfo.nickname || this.myFriendsData.length <= 0) return;
        
        console.log("getMyRank--begin")
        var score, rank;
        // 已排序
        this.myFriendsData.forEach((data, i) => {
            if (data.nickname === this.userInfo.nickname && data.avatarUrl === this.userInfo.avatarUrl) {
                score = this.getScore(data.KVDataList, key);
                rank = i + 1;
            }
        });
        this.userInfo.score = score;
        this.userInfo.rank = rank;
        this.itemMy.active = false;

        if (this.userInfo.rank) {
            this.itemMy.active = true;
            this.itemMy.getComponent("item").init(
                this.userInfo.rank,
                this.userInfo.avatarUrl,
                this.userInfo.nickname,
                this.userInfo.score,
                addonMap[key],
                this.getChenghao(key,this.userInfo.score)
            );
        }
    },
    /**
     * 提交用户数据
     * @param data 字符串类型的数据
     * @param key 提交的数据键名
    */
    refreshUserInfo(data, key) {
        if (this.isWechat()) {
            wx.setUserCloudStorage({
                KVDataList: [
                    { key: key, value: String(data) }
                ],
                success: res => {
                    console.log(`【成功】设置用户托管数据_${key}_`, res);
                    this.getFriendsInfoArray(key);
                },
                fail: res => {
                    console.log("【失败】设置用户托管数据_${key}_", res);
                },
                complete: res => {
                    
                }
            });
        }
    },
    /**
     * 获取好友托管的数据
     * @param key 数据的键名
     * 后续操作：freshRank,getMyRank
    */
    getFriendsInfoArray(key) { 
        if (this.isWechat()) {
            wx.getFriendCloudStorage({
                keyList: [key],
                success: res => {
                    res.data = res.data.filter(obj => {
                        return obj.KVDataList.length > 0;
                    });
                    console.log("【成功】获取好友数据：", res.data);
                    this.sortArray(res.data, key);
                    this.myFriendsData = res.data;
                    this.freshRank(key);
                    this.getMyRank(key);
                },
                fail: res => {
                    console.log("【失败】wx.getFriendCloudStorage");
                }
            })
        }
    },
    sortArray(data, key) {
        data.sort((a, b) => {
            var scoreA = this.getScore(a.KVDataList, key),
                scoreB = this.getScore(b.KVDataList, key);
            // 从大到小
            return parseInt(scoreB) - parseInt(scoreA);
        });
    },
    // 刷新排行榜显示
    freshRank(key) {
        this.items.forEach(item => {
            item.destroy();
        });
        this.items = [];

        for (var i = 0; i < this.myFriendsData.length; i++){
            var item = cc.instantiate(this.prefabItem);
            item.parent = this.layoutContainer;
            this.items.push(item);

            var obj = this.myFriendsData[i];
            item.getComponent("item").init(
                i + 1,
                obj.avatarUrl,
                obj.nickname,
                this.getScore(obj.KVDataList, key),
                addonMap[key],
                this.getChenghao(key,this.getScore(obj.KVDataList, key))
            );
        }
    },
    getScore(KVDataList, key) {
        for (var i = 0; i < KVDataList.length; i++){
            if (KVDataList[i].key === key) {
                return KVDataList[i].value;
            }
        }
        return "-";
    },
    isWechat() { 
        return cc.sys.platform === cc.sys.WECHAT_GAME || cc.sys.platform === cc.sys.WECHAT_GAME_SUB;
    },
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
    },


    // LIFE-CYCLE CALLBACKS:

    // 如果设置开放域窗口active为false，则无法触发这个onload事件
    onLoad() {
        console.log("sub load")
        // this.myFriendsData = [
        //     // {nickname:"nickname",avatarUrl:"https://wx.qlogo.cn/mmopen/vi_32/tLZqAA1PzOXUykWIB1kicmRVLoqJ7aAFWFCibmnZryISialI1HPrKZXgCy9gq5kfyNhhqA5drm7VNzViar6y76NibhQ/132",KVDataList:[{key: "maxScore", value: "999"}]}
        // ];
        // this.freshRank();
        // 获取用户信息
        this.getUserInfo();
        // this.getFriendsInfoArray();

        
        if (this.isWechat()) {
            wx.onMessage(data => {
                console.log("接收主域发来的消息数据：", data);
                switch (data.messageType) {
                    case 3:
                        // 提交分数到微信云服务器
                        console.log("更新用户的最大分数，对当前用户的微信托管数据，进行写数据操作。");
                        this.refreshUserInfo(data.maxScore, "maxScore");
                        break;
                    case 4:
                        // 提交分数到微信云服务器
                        console.log("更新用户的星星数，对当前用户的微信托管数据，进行写数据操作。");
                        this.refreshUserInfo(data.nStar,"g2nStar");
                        break;
                    case 5:
                        // 提交分数到微信云服务器
                        console.log("更新用户的关卡数，对当前用户的微信托管数据，进行写数据操作。");
                        this.refreshUserInfo(data.g3level,"g3level");
                        break;
                    case 6:
                        // 提交分数到微信云服务器
                        console.log("更新用户的最大分数，对当前用户的微信托管数据，进行写数据操作。");
                        this.refreshUserInfo(data.g4maxScore,"g4maxScore");
                        break;
                    case 7:
                        // 提交分数到微信云服务器
                        console.log("更新用户的关卡数，对当前用户的微信托管数据，进行写数据操作。");
                        this.refreshUserInfo(data.g5level,"g5level");
                        break;
                    case 8:
                        // 提交分数到微信云服务器
                        console.log("更新用户的关卡数，对当前用户的微信托管数据，进行写数据操作。");
                        this.refreshUserInfo(data.g6level, "g6level");
                        break;
                    case 1:
                        // 获取用户某一个key的排行榜信息
                        console.log(`获取用户某一个key[${data.key}]的排行榜信息`);
                        this.getFriendsInfoArray(data.key);
                    default:
                        break;
                }
            });
        }
    },

    start () {

    },

    // update (dt) {},
});
