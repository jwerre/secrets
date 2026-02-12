import { expect, describe, it, beforeAll } from 'vitest';
import { FIXTURES, RESULT } from './_utils/definitions.js';
import mockSecretManager from './_utils/mock_secret_manager.js';
import { Secrets } from '../lib/index.js';

describe('Secrets', function () {
	let secrets, secretCache;

	beforeAll(function () {
		mockSecretManager();

		secrets = new Secrets({
			env: 'ci-testing',
			region: 'us-east-1',
			namespace: `__secrets-mock-${new Date().getTime()}__`,
		});

		expect(secrets).toBeDefined();
		expect(secrets).toBeInstanceOf(Secrets);
	});

	it('should parse secret list into config object', function () {
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

	it('should retrieve a list of all secrets', async function () {
		const regex = new RegExp(`^${secrets.namespace}/${secrets.env}/.+`);
		const list = await secrets.listSecrets();

		expect(list).toBeDefined();
		expect(list).toEqual(expect.any(Array));
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

	it('should generate a config with all test secrets', async function () {
		const config = await secrets.config();

		expect(config).toBeDefined();
		expect(config).toStrictEqual(RESULT);
	});

	it('should delete all test secrets', async function () {
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
});
