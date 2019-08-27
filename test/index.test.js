
const { app, mock, assert  } = require('egg-mock/bootstrap');

const asyncfunc = async () => {
	return await new Promise((resolve, reject) => {
		setTimeout(resolve, 2000);
	});
}

describe('test/controller/index.test.js', () => {
	//before(() => console.log('order 1'));
	//before(() => console.log('order 2'));
	//after(() => console.log('order 6'));
	//beforeEach(() => console.log('order 3'));
	//afterEach(() => console.log('order 5'));
	//it('should worker', async () => {
		//await asyncfunc();
		//console.log('order it1')
	//});

	//it('should worker', async () => {
		//await asyncfunc();
		//console.log('order it2')
	//});

	it('should status 200', async ()=> {
		await app.httpRequest().get("/index").expect(200).expect("hello world");
	});
});
