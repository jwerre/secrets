#!/usr/bin/env node

import { Command } from 'commander';
import fs from 'fs/promises';
import { constants } from 'fs';
import { inspect } from 'util';
import yaml from 'js-yaml';
import { SecretsManager } from '@aws-sdk/client-secrets-manager';

const { F_OK, R_OK } = constants;
const ENV = 'development';
const REGION = 'us-west-2';
const DELIMITER = '/';

const program = new Command();

program
	.name('create-secrets')
	.description('Deploy configuration file to AWS Secrets Manager.')
	.argument('[config-file]', 'Path to configuration file (YAML or JSON)')
	.option('-v, --verbose', 'Verbose output')
	.option(
		'-r, --region <region>',
		'The AWS Secrets Manager region',
		process.env.AWS_REGION || REGION
	)
	.option(
		'-e, --env <environment>',
		'Which environment to use in the secret name',
		ENV
	)
	.option('-k, --kms <keyId>', 'KMS key id to use for encryption')
	.option('-n, --namespace <namespace>', 'Namespace of all parameters')
	.option(
		'-d, --delimiter <delimiter>',
		'Delimiter to use for secret name',
		DELIMITER
	)
	.option('-i, --in <file>', 'Input file path (alternative to argument)')
	.parse(process.argv);

const options = program.opts();
const args = program.args;

const stdin = args[0] || options.in;
const region = options.region;
const kms = options.kms;
const env = options.env;
const namespace = options.namespace;
const delimiter = options.delimiter;
const verbose = options.verbose;

async function getConfig(path) {
	let content, config, isYaml;

	try {
		await fs.access(path, F_OK | R_OK);
	} catch (err) {
		console.log(err);
		return Promise.reject(
			`${path} ${err.code === 'ENOENT' ? 'does not exist' : 'is read-only'}.`
		);
	}

	try {
		content = await fs.readFile(path, 'utf8');
	} catch (err) {
		return Promise.reject(err);
	}

	try {
		config = JSON.parse(content);
	} catch {
		isYaml = true;
	}

	if (isYaml) {
		try {
			config = yaml.load(content);
		} catch (err) {
			return Promise.reject(err);
		}
	}

	return Promise.resolve(config);
}

function parseSecrets(obj, current) {
	var result = [];

	(function recurse(obj, current) {
		for (let key in obj) {
			let value = obj[key],
				isEnumerable = false,
				newKey = current ? `${current}${delimiter}${key}` : key;

			// if it's the last nested object stop recursion
			if (Object.prototype.toString.call(value) === '[object Object]') {
				isEnumerable = Object.keys(value).some((key) => {
					return (
						Object.prototype.toString.call(value[key]) ===
						'[object Object]'
					);
				});
			}

			if (isEnumerable) {
				recurse(value, newKey);
			} else {
				let key = `${env}${delimiter}${newKey}`;

				if (namespace) {
					key = `${namespace}${delimiter}${key}`;
				}

				result.push({
					key: key,
					value: value,
				});
			}
		}
	})(obj);

	return result;
}

function createSecrets(list) {
	const secretsmanager = new SecretsManager({ region: region });
	const promises = [];

	for (let item of list) {
		const params = {
			Name: item.key,
			KmsKeyId: kms,
			SecretString: item.value,
		};

		if (
			Object.prototype.toString.call(params.SecretString) !==
			'[object String]'
		) {
			try {
				params.SecretString = JSON.stringify(params.SecretString);
			} catch {
				// ignore stringify err
			}
		}

		const promise = secretsmanager.createSecret(params);
		promises.push(promise);
	}

	return Promise.allSettled(promises);
}

(async () => {
	if (!stdin) {
		return Promise.reject(new Error('Must provide a path to config file.'));
	}

	let config, parameters;

	try {
		config = await getConfig(stdin);
	} catch (e) {
		return e;
	}

	try {
		parameters = await parseSecrets(config);
	} catch (err) {
		return Promise.reject(err);
	}

	return createSecrets(parameters);
})()
	.then((res) => {
		if (verbose) {
			console.log(inspect(res, { depth: 10, colors: true }));
		}
	})
	.catch(console.error)
	.then(process.exit);
