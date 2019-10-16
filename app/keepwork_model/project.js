
module.exports = app => {
	const {
		BIGINT,
		INTEGER,
		STRING,
		FLOAT,
		TEXT,
		BOOLEAN,
		JSON,
	} = app.Sequelize;

	const attrs = {
		id: {
			type: BIGINT,
			autoIncrement: true,
			primaryKey: true,
		},

		userId: { // 拥有者
			type: BIGINT,
			allowNull: false,
		},

		name: { // 项目名称
			type: STRING(255),
			allowNull: false,
		},

		siteId: { // 站点Id
			type: BIGINT,
		},

		status: { // 项目状态  0 -- 创建失败  1  -- 创建中   2 --  创建成功
			type: INTEGER,
			defaultValue: 0,
		},

		visibility: { // 可见性 0 - 公开 1 - 私有
			type: INTEGER,
			defaultValue: 0,
		},

		privilege: { // 权限
			type: INTEGER,
			defaultValue: 0,
		},

		type: { // 评论对象类型  0 -- paracrfat  1 -- 网站 
			type: INTEGER,
			allowNull: false,
			defaultValue: 1,
		},

		tags: { // 项目tags
			type: STRING(255),
			defaultValue: "|",
		},

		visit: { // 访问量
			type: INTEGER,
			defaultValue: 0,
		},

		star: { // 点赞数量
			type: INTEGER,
			defaultValue: 0,
		},

		favorite: { // 收藏量
			type: INTEGER,
			defaultValue: 0,
		},

		comment: { // 评论数量
			type: INTEGER,
			defaultValue: 0,
		},

		lastVisit: { // 最近访问量
			type: INTEGER,
			defaultValue: 0,
		},

		lastStar: { // 最近点赞数量
			type: INTEGER,
			defaultValue: 0,
		},

		lastComment: { // 最近评论数量
			type: INTEGER,
			defaultValue: 0,
		},

		stars: { // 点赞用户id 列表
			type: JSON,
			defaultValue: [],
		},

		hotNo: {
			type: INTEGER, // 热门编号
			defaultValue: 0,
		},

		choicenessNo: { // 精选编号
			type: INTEGER,
			defaultValue: 0,
		},

		description: { // 项目描述
			type: TEXT,
			defaultValue: "",
		},

		rate: { // 项目评分
			type: FLOAT,
			defaultValue: 0,
		},

		rateCount: { // 项目评分人数
			type: INTEGER,
			defaultValue: 0,
		},

		classifyTags: { // 系统分类tags
			type: STRING(255),
			defaultValue: "|",
		},

		extend: { // 后端使用
			type: JSON,
			defaultValue: {},
		},

		extra: { // 前端使用
			type: JSON,
			defaultValue: {},
		},
	};

	const opts = {
		underscored: false,
		charset: "utf8mb4",
		collate: "utf8mb4_bin",
		indexes: [
			{
				unique: true,
				fields: ["userId", "name"],
			},
		],
	};
	//	app.model.illegalProjects = app.model.define("illegalProjects", attrs, opts);

	const model = app.keepworkModel.define("projects", attrs, opts);

	app.keepworkModel.Project = model;
	return model;
};


