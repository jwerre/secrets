import { expect, describe, it, beforeAll, afterAll } from 'vitest';
import { Secrets } from '../lib/index.js';

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
	let secrets, secretCache;

	beforeAll(function () {
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

		expect(secrets).toBeDefined();
		expect(secrets).toBeInstanceOf(Secrets);
	});

	// cleanup test data
	afterAll(async function () {
		let promises = [];

		for (let item of FIXTURES) {
			let id = `${secrets.namespace}${secrets.delimiter}${secrets.env}${secrets.delimiter}${item.name}`;
			let promise = secrets.deleteSecret(id, true);
			expect(promise).toBeDefined();
			expect(promise).toBeInstanceOf(Promise);
			promises.push(promise);
		}

		const res = await Promise.all(promises);

		expect(res).toBeDefined();
		expect(res).toBeInstanceOf(Array);
		expect(res).toHaveLength(FIXTURES.length);
		for (let item of res) {
			expect(item).toBeDefined();
			expect(item).toHaveProperty('Name');
			expect(item).toHaveProperty('ARN');
			expect(item).toHaveProperty('DeletionDate');
		}
	});

	it('should should parse secret list into config object', function () {
		let args = FIXTURES.map((item) => {
			return {
				Name: `${secrets.namespace}/${secrets.env}/${item.name}`,
				SecretString: JSON.stringify(item.secrets),
			};
		});

		let res = secrets._parseSecrets(args);

		expect(res).toStrictEqual(RESULT);
	});

	it('should create some secrets', async function () {
		let promises = [];
		const items = JSON.parse(JSON.stringify(FIXTURES)); // deep clone this

		for (let item of items) {
			let promise = secrets.createSecret(item);
			expect(promise).toBeDefined();
			expect(promise).toBeInstanceOf(Promise);
			promises.push(promise);
		}

		const res = await Promise.all(promises);

		expect(res).toBeDefined();
		expect(res).toBeInstanceOf(Array);
		secretCache = res;
		expect(secretCache).toHaveLength(promises.length);
		for (let secret of secretCache) {
			expect(secret).toBeDefined();
			expect(secret).toHaveProperty('Name');
			expect(secret).toHaveProperty('ARN');
			expect(secret).toHaveProperty('VersionId');
		}
	});

	it('should retrieve all secrets individually', async function () {
		const promises = secretCache.map((item) => {
			return secrets.getSecret({
				id: item.Name,
				raw: true,
			});
		});

		const res = await Promise.all(promises);
		expect(res).toBeDefined();
		expect(res).toBeInstanceOf(Array);
		expect(res).toHaveLength(secretCache.length);

		for (let secret of res) {
			expect(secret).toBeDefined();
			expect(secret).toHaveProperty('Name');
			expect(secret).toHaveProperty('ARN');
			expect(secret).toHaveProperty('VersionId');
			expect(secret).toHaveProperty('SecretString');
			expect(secret).toHaveProperty('CreatedDate');
		}
	});

	it('should synchronously retrieve a single secret string', function () {
		const id = `${secrets.namespace}/${secrets.env}/secret2`;
		const secret = secrets.getSecretSync({ id: id });

		expect(secret).toBeDefined();
		expect(secret).toEqual(expect.any(String));
		expect(secret).toBe(RESULT.secret2);
	});

	it('should synchronously retrieve a single secret and return a secret object', function () {
		const id = `${secrets.namespace}/${secrets.env}/secret1`;
		const secret = secrets.getSecretSync({ id: id });

		expect(secret).toBeDefined();
		expect(secret).toEqual(expect.any(Object));
		expect(secret).toHaveProperty('key');
		expect(secret).toHaveProperty('secret');
		expect(secret).toStrictEqual(RESULT.secret1);
	});

	it('should synchronously retrieve a single secret mixed array', function () {
		const id = `${secrets.namespace}/${secrets.env}/secret6`;
		const secret = secrets.getSecretSync({ id: id });

		expect(secret).toBeDefined();
		expect(secret).toEqual(expect.any(Array));
		expect(secret).toStrictEqual(RESULT.secret6);
	});

	it('should synchronously retrieve a single secret and return the raw AWS response', function () {
		const item =
			secretCache[Math.floor(Math.random() * secretCache.length)];
		const secret = secrets.getSecretSync({ id: item.Name, raw: true });

		expect(secret).toBeDefined();
		expect(secret).toHaveProperty('Name');
		expect(secret).toHaveProperty('ARN');
		expect(secret).toHaveProperty('VersionId');
		expect(secret).toHaveProperty('SecretString');
		expect(secret).toHaveProperty('CreatedDate');
	});

	it('retrieve a list of all secrets', { retries: 3 }, async function () {
		const regex = new RegExp(`^${secrets.namespace}/${secrets.env}/.+`);
		const list = await secrets.listSecrets();

		expect(list).toBeDefined();
		expect(list).toEqual(expect.any(Array));
		// console.log(list);
		// console.log(list.length, secretCache.length);
		expect(
			list,
			`The list should have length of ${secretCache.length} but only has ${list.length} items.`
		).toHaveLength(secretCache.length);

		for (let secret of list) {
			expect(secret).toHaveProperty('Name');
			expect(secret).toHaveProperty('ARN');
			expect(secret.Name).toMatch(regex);
		}
	});

	it(
		'should generate a config with all test secrets',
		{ retries: 3 },
		async function () {
			// test should't take this long but could depending on how long the
			// secrets take to retrieve from AWS.

			const config = await secrets.config();

			expect(config).toBeDefined();
			expect(config).toStrictEqual(RESULT);
		}
	);

	it('should synchronously generate config with all test secrets', function () {
		const config = secrets.configSync();

		expect(config).toBeDefined();
		expect(config).toStrictEqual(RESULT);
	});

	it.skip('should not synchronously generate config since buffer is too small', function () {
		// get all the same test secrets but with a max buffer of 1
		const maxBufSecrets = new Secrets({
			env: secrets.env,
			region: secrets.region,
			namespace: secrets.namespace,
			maxBuffer: 0.1,
		});

		// The buffer is about 304 Bytes so this should fail but doesn't :/
		expect(() => {
			maxBufSecrets.configSync();
		}).toThrow('Max buffer it too small to retrieve all secrets.');
	});

	it.skip(
		'should produce a rate limit error, wait and try again',
		{ timeout: 500000 },
		async function () {
			const iterations = 500;

			const promises = [];

			for (let index = 0; index < iterations; index++) {
				// const name = `${secrets.namespace}/${secrets.env}/${FIXTURES[0].name}`;
				promises.push(secrets.listSecrets());
			}

			const result = await Promise.allSettled(promises);

			expect(result).toBeDefined();
			result.forEach((res) => {
				expect(res).toBeDefined();
				expect(res).toHaveProperty('value', expect.any(Array));
				expect(res).toHaveProperty('status', 'fulfilled');
				// if (res.status !== 'fulfilled') {
				// 	console.log( require('util').inspect(res, {depth:10, colors:true}) );
				// }
			});
		}
	);
});
