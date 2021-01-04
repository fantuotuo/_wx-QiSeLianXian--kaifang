

cc.Class({
    extends: cc.Component,

    properties: {
        uRank: {
            get() { 
                return this._uRank;
            },
            set(v) { 
                this._uRank = v;
                // todo
                this.node.getChildByName("rank").getComponent("cc.Label").string = v;
            }
        },
        uAvatar: {
            get() { 
                return this._uAvatar;
            },
            set(v) { 
                this._uAvatar = v;
                // todo
                var avatar = this.node.getChildByName("avatar").getComponent("cc.Sprite");
                cc.loader.load({ url: v, type: 'jpg' }, function (err, tex) {
                    avatar.spriteFrame = new cc.SpriteFrame(tex);
                });
            }
        },
        uName: {
            get() { 
                return this._uName;
            },
            set(v) { 
                this._uName = v;
                // todo
                this.node.getChildByName("name").getComponent("cc.Label").string = v;
            }
        },
        uScore: {
            get() { 
                return this._uScore;
            },
            set(v) { 
                this._uScore = v;
                // todo
                this.node.getChildByName("score").getComponent("cc.Label").string = v + this.addon;
            }
        },
        uChenghao: {
            get() { 
                return this._uChengao;
            },
            set(v) { 
                this._uChengao = v;
                // todo
                this.node.getChildByName("chenghao").getComponent("cc.Label").string = v;
            }
        },

        addon: cc.String,
        
    },


    

    init(rank, avatarUrl, name, score, addon, chenghao) {
        this.addon = addon ? addon : "";

        this.uRank = rank;
        this.uAvatar = avatarUrl;
        this.uName = name;
        this.uScore = score;
        this.uChenghao = chenghao;
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    start () {

    },

    // update (dt) {},
});
