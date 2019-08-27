module.exports = app => {
	const {
		BIGINT,
		INTEGER,
		STRING,
		JSON,
		DECIMAL,
	} = app.Sequelize;

	const model = app.keepworkModel.define("trades", {
		id: {
			type: BIGINT,
			autoIncrement: true,
			primaryKey: true,
		},
		
		userId: { // 用户ID
			type: BIGINT,
			allowNull: false,
		},

		type: { // 交易类型
			type: INTEGER,
			defaultValue: 0,
		},

		subject: { // 物品标题
			type: STRING,
			defaultValue: "",
		},

		body: { // 物品描述
			type: STRING,
			defaultValue: "",
		},

		count: { // 交易的数量
			type: INTEGER,
			defaultValue: 1,
		},

		goodsId: { // 物品id
			type: BIGINT,
			defaultValue: 0,
		},

		discountId: { // 优惠券id
			type: BIGINT,
			defaultValue: 0,
		},

		rmb: { // 交易消耗或获取人民币
			type: DECIMAL(10, 2),
			defaultValue: 0,
			get() {
				return _.toNumber(this.getDataValue("rmb"));
			},
		},

		coin: { // 交易消耗或获取知识币
			type: INTEGER,
			defaultValue: 0,
		},

		bean: { // 交易消耗或获取知识豆
			type: INTEGER,
			defaultValue: 0,
		},

		realRmb: { // 交易实际消耗rmb
			type: DECIMAL(10, 2),
			defaultValue: 0,
			get() {
				return _.toNumber(this.getDataValue("realRmb"));
			},
		},

		realCoin: { // 交易实际消耗coin
			type: INTEGER,
			defaultValue: 0,
		},

		realBean: { // 交易实际消耗bean
			type: INTEGER,
			defaultValue: 0,
		},

		rewardRmb: { // 奖励rmb
			type: DECIMAL(10, 2),
			defaultValue: 0,
			get() {
				return _.toNumber(this.getDataValue("rewardRmb"));
			},
		},

		rewardCoin: { // 奖励coin
			type: INTEGER,
			defaultValue: 0,
		},

		rewardBean: { // 奖励bean
			type: INTEGER,
			defaultValue: 0,
		},

		description: { // 交易内容
			type: STRING,       
			defaultValue: "",
		},

		extra: {
			type: JSON,
			defaultValue: {},
		},

	}, {
		underscored: false,
		charset: "utf8mb4",
		collate: "utf8mb4_bin",
	});

	// model.sync({force:true});
	
	app.keepworkModel.trades = model;
	return model;
};

