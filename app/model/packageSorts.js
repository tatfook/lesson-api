
module.exports = app => {
	const {
		BIGINT,
		INTEGER,
	} = app.Sequelize;

	const model = app.model.define("packageSorts", {
		id: {
			type: BIGINT,
			autoIncrement: true,
			primaryKey: true,
		},

		packageId: { // 课程包ID
			type: BIGINT,
			unique: true,
			allowNull: false,
		},

		hotNo: { // 热门序号
			type: INTEGER,
			defaultValue: 0, // 
		},

	}, {
		underscored: false,
		charset: "utf8mb4",
		collate: "utf8mb4_bin",
	});

	// model.sync({force:true});

	model.getHots = async function () {
		const sql = `select packages.* 
			from packageSorts, packages 
			where packageSorts.packageId = packages.id 
			order by packageSorts.hotNo desc`;

		const list = app.model.query(sql, {
			type: app.model.QueryTypes.SELECT,
		});

		return list;
	};

	return model;
};
