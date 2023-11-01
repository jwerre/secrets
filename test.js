const assert = require('assert');
const { Secrets } = require('./index');

const FIXTURES = [
	{
		name: 'secret1',
		description: 'testing objects',
		secrets: {
			key: 'peter@example.com',
			secret: 'pumpkins',
		},
	},
	{
		name: 'secret2',
		description: 'testing string',
		secrets: 'pumpkins',
	},
	{
		name: 'secret3',
		description: 'testing number',
		secrets: 4,
	},
	{
		name: 'secret4',
		description: 'testing boolean',
		secrets: true,
	},
	{
		name: 'secret5',
		description: 'testing array',
		secrets: [1, 2, 3],
	},
	{
		name: 'secret6',
		description: 'testing mixed',
		secrets: [1, 'peach', null, ['apple'], { yes: true }],
	},
	{
		name: 'nested/secret/1',
		description: 'testing nested number',
		secrets: 5,
	},
	{
		name: 'nested/secret/2',
		description: 'tested nested array',
		secrets: ['apple', 'peach', 'banana'],
	},
	{
		name: 'nested/secret/auth',
		description: 'tested nested object',
		secrets: {
			username: 'joe@example.com',
			password: 'p3@ches',
		},
	},
];


const RESULT = {};

describe('Secrets', function () {
	this.timeout(4000);

	let secrets, secretCache;

	before(function () {
		// build the expected result
		RESULT.secret1 = FIXTURES[0].secrets;
		RESULT.secret2 = FIXTURES[1].secrets;
		RESULT.secret3 = FIXTURES[2].secrets;
		RESULT.secret4 = FIXTURES[3].secrets;
		RESULT.secret5 = FIXTURES[4].secrets;
		RESULT.secret6 = FIXTURES[5].secrets;
		RESULT.nested = {
			secret: {
				1: FIXTURES[6].secrets,
				2: FIXTURES[7].secrets,
				auth: FIXTURES[8].secrets,
			},
		};

		secrets = new Secrets({
			env: 'unit-testing',
			region: 'us-east-1',
			namespace: `__secrets-${new Date().getTime()}__`,
		});
	});

	// cleanup test data
	after(function (done) {
		this.timeout(0);

		let promises = [];

		for (let item of FIXTURES) {
			let id = `${secrets.namespace}${secrets.delimiter}${secrets.env}${secrets.delimiter}${item.name}`;
			let promise = secrets.deleteSecret(id, true);
			assert.ok(promise);
			assert.ok(promise instanceof Promise);
			promises.push(promise);
		}

		Promise.all(promises)
			.then((res) => {
				assert.ok(res);
				assert.ok(res.length === FIXTURES.length);
				for (let item of res) {
					assert.ok(item);
					assert.ok(item.hasOwnProperty('Name'));
					assert.ok(item.hasOwnProperty('ARN'));
					assert.ok(item.hasOwnProperty('DeletionDate'));
				}
				done();
			})
			.catch(done);
	});

	it('should should parse secret list into config object', function () {
		let args = FIXTURES.map((item) => {
			return {
				Name: `${secrets.namespace}/${secrets.env}/${item.name}`,
				SecretString: JSON.stringify(item.secrets),
			};
		});

		let res = secrets._parseSecrets(args);

		assert.deepStrictEqual(res, RESULT);
	});

	it('should create some secrets', function (done) {
		let promises = [];

		const items = JSON.parse(JSON.stringify(FIXTURES)); // deep clone this

		for (let item of items) {
			let promise = secrets.createSecret(item);
			assert.ok(promise);
			assert.ok(promise instanceof Promise);
			promises.push(promise);
		}

		Promise.all(promises)
			.then((res) => {
				assert.ok(res);
				secretCache = res;
				assert.ok(secretCache.length === promises.length);
				for (let secret of secretCache) {
					assert.ok(secret);
					assert.ok(secret.hasOwnProperty('Name'));
					assert.ok(secret.hasOwnProperty('ARN'));
					assert.ok(secret.hasOwnProperty('VersionId'));
				}
				done();
			})
			.catch(done);
	});

	it('should retrieve all secrets individually', function (done) {
		const promises = secretCache.map((item) => {
			return secrets.getSecret({
				id: item.Name,
				raw: true,
			});
		});

		Promise.all(promises)
			.then((res) => {
				assert.ok(res);
				assert.ok(res.length === secretCache.length);
				for (let secret of res) {
					assert.ok(secret);
					assert.ok(secret.hasOwnProperty('Name'));
					assert.ok(secret.hasOwnProperty('ARN'));
					assert.ok(secret.hasOwnProperty('VersionId'));
					assert.ok(secret.hasOwnProperty('SecretString'));
					assert.ok(secret.hasOwnProperty('CreatedDate'));
				}
				done();
			})
			.catch(done);
	});

	it('should synchronously retrieve a single secret string', function () {
		let secret,
			id = `${secrets.namespace}/${secrets.env}/secret2`;

		try {
			secret = secrets.getSecretSync({ id: id });
		} catch (err) {
			assert.fail(err.message);
		}

		assert.ok(secret);
		assert.ok(Object.prototype.toString.call(secret) === '[object String]');
		assert.strictEqual(secret, RESULT.secret2);
	});

	it('should synchronously retrieve a single secret and return a secret object', function () {
		let secret,
			id = `${secrets.namespace}/${secrets.env}/secret1`;

		try {
			secret = secrets.getSecretSync({ id: id });
		} catch (err) {
			assert.fail(err.message);
		}

		assert.ok(secret);
		assert.ok(Object.prototype.toString.call(secret) === '[object Object]');
		assert.ok(secret.hasOwnProperty('key'));
		assert.ok(secret.hasOwnProperty('secret'));
		assert.deepStrictEqual(secret, RESULT.secret1);
	});

	it('should synchronously retrieve a single secret mixed array', function () {
		let secret,
			id = `${secrets.namespace}/${secrets.env}/secret6`;

		try {
			secret = secrets.getSecretSync({ id: id });
		} catch (err) {
			assert.fail(err.message);
		}

		assert.ok(secret);
		assert.ok(Object.prototype.toString.call(secret) === '[object Array]');
		assert.deepStrictEqual(secret, RESULT.secret6);
	});

	it('should synchronously retrieve a single secret and return the raw AWS response', function () {
		let secret,
			item = secretCache[Math.floor(Math.random() * secretCache.length)];

		try {
			secret = secrets.getSecretSync({ id: item.Name, raw: true });
		} catch (err) {
			assert.fail(err.message);
		}

		assert.ok(secret);
		assert.ok(secret.hasOwnProperty('Name'));
		assert.ok(secret.hasOwnProperty('ARN'));
		assert.ok(secret.hasOwnProperty('VersionId'));
		assert.ok(secret.hasOwnProperty('SecretString'));
		assert.ok(secret.hasOwnProperty('CreatedDate'));
	});

	it('retrieve a list of all secrets', async function () {
		this.timeout(4000);
		this.retries(3);

		const regex = new RegExp(`^${secrets.namespace}/${secrets.env}/.+`);

		let list;

		try {
			list = await secrets.listSecrets();
		} catch (err) {
			assert.fail(err.message);
		}

		assert.ok(list);
		assert.ok(Array.isArray(list));
		// console.log(list);
		// console.log(list.length, secretCache.length);
		assert.strictEqual(
			list.length,
			secretCache.length,
			`The list should have length of ${secretCache.length} but only has ${list.length} items.`
		);

		for (let secret of list) {
			assert.ok(secret.hasOwnProperty('Name'));
			assert.ok(secret.hasOwnProperty('ARN'));
			assert.ok(regex.test(secret.Name));
		}
	});

	it('should generate a config with all test secrets', async function () {
		// test should't take this long but could depending on how long the
		// secrets take to retrieve from AWS.
		this.timeout(4000);
		this.retries(3);

		let config;

		try {
			config = await secrets.config();
		} catch (err) {
			assert.fail(err.message);
		}

		assert.ok(config);
		assert.deepStrictEqual(config, RESULT);
	});

	it('should synchronously generate config with all test secrets', function () {
		// test should't take this long but could depending on how long the
		// secrets take to retrieve from AWS.
		this.timeout(4000);

		let config;

		try {
			config = secrets.configSync();
		} catch (err) {
			assert.fail(err.message);
		}

		assert.ok(config);
		assert.deepStrictEqual(config, RESULT);
	});

	it.skip('should not synchronously generate config since buffer is too small', function () {

		this.timeout(4000);

		// get all the same test secrets but with a max buffer of 1
		const maxBufSecrets = new Secrets({
			env: secrets.env,
			region: secrets.region,
			namespace: secrets.namespace,
			maxBuffer: .1,
		});


		// The buffer is about 304 Bytes so this should fail but doesn't :/
		assert.throws(() => {
			const err = maxBufSecrets.configSync();
			return err;
		}, Error, 'Max buffer it too small to get all secrets');
		
	});

	it.skip('should produce a rate limit error, wait and try again', async function () {
		const iterations = 500;
		this.timeout(1000 * iterations);

		let result,
			promises = [];

		for (let index = 0; index < iterations; index++) {
			// const name = `${secrets.namespace}/${secrets.env}/${FIXTURES[0].name}`;
			promises.push(secrets.listSecrets());
		}

		try {
			result = await Promise.allSettled(promises);
		} catch (err) {
			assert.fail(err.message);
		}

		result.forEach((res, i) => {
			assert.ok(res.hasOwnProperty('value'));
			assert.ok(res.hasOwnProperty('status'));
			assert.ok(res.status === 'fulfilled');
			assert.ok(
				Object.prototype.toString.call(res.value) === '[object Array]'
			);
			// if (res.status !== 'fulfilled') {
			// 	console.log( require('util').inspect(res, {depth:10, colors:true}) );
			// }
		});

		assert.ok(result);
	});
});
