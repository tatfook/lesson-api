
const _ = require("lodash");
const consts = require("../common/consts.js");
const Controller = require("./baseController.js");

const {
	PACKAGE_SUBSCRIBE_STATE_BUY
} = consts;

class PayController extends Controller {
	// 前端跳转至 https://stage.keepwork.com/wiki/pay?username=xioayao&app_name=lessons&app_goods_id=1&price=1&additional=%7B%22packageId%22%3A1%7D
	async callback() {
		const { ctx } = this;
		const query = ctx.query;
		const username = query.username;
		const packageId = _.toNumber(query.packageId);
		const price = _.toNumber(query.price);
		// const config = app.config.self;
		// const ip = ctx.ip;

		// console.log(ctx.ip);
		// console.log(config);
		// console.log(ctx.path);
		// console.log(ctx.query);

		// if (_.indexOf(config.trustIps, ip) < 0) {
		// await ctx.model.Logs.create({text:"支付-不可信任请求:" + ip});
		// ctx.throw(400, "不可信任请求");
		// }

		if (!username || !price || !packageId) {
			await ctx.model.Log.create({ text: "支付-参数错误" + JSON.stringify(query) });
			ctx.throw(400, "params invalid");
		}

		let user = await ctx.model.Users.findOne({ where: { username }});
		if (!user) {
			await ctx.model.Log.create({ text: "支付-用户不存在" + username });
			ctx.throw(400, "user not exist");
		}
		user = user.get({ plain: true });

		let package_ = await ctx.model.Packages.findOne({ where: { id: packageId }});
		if (!package_) {
			await ctx.model.Log.create({ text: "支付-课程包不存在" });
			ctx.throw(400, "package not exist" + packageId);
		}
		package_ = package_.get({ plain: true });
		if (package_.rmb > price) {
			await ctx.model.Log.create({ text: "支付-支付金额错误" + price });
			ctx.throw(400, "金额不对");
		}

		const subscribe = await ctx.model.Subscribe.findOne({ where: { userId: user.id, packageId: package_.id, state: 1 }});
		if (subscribe) {
			await ctx.model.Log.create({ text: "支付-课程包已购买" });
			ctx.throw(400, "package already subscribe");
		}

		// 更新用户待解锁金币数
		const lockCoin = user.lockCoin + package_.coin;
		await ctx.model.User.update({ lockCoin }, { where: { id: user.id }});

		await ctx.model.Subscribe.upsert({
			userId: user.id,
			packageId: package_.id,
			state: PACKAGE_SUBSCRIBE_STATE_BUY,
		});

		this.success("OK");
	}

	create() {
		return this.success("OK");
	}
}

module.exports = PayController;


