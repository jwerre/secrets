#!/usr/bin/env node

import { Command } from 'commander';
import Secrets from '../lib/secrets.mjs';
import { inspect } from 'util';

const ENV = 'development';
const REGION = 'us-west-2';
const DELIMITER = '/';

const program = new Command();

program
	.name('get-config')
	.description('Retrieve all secrets from AWS Secrets Manager.')
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
	.option('-d, --delimiter <delimiter>', 'Secret name delimiter', DELIMITER)
	.option('-p, --pretty', 'Pretty output')
	.option(
		'-a, --all',
		'Ignore the environment and retrieve all secrets',
		false
	)
	.option('-n, --namespace <namespace>', 'Namespace of all parameters')
	.option('-t, --time', 'Display time it takes to retrieve config')
	.option(
		'-m, --maxBuffer <bytes>',
		'Largest the entire config can be in bytes (default: 3 Mb)'
	)
	.parse(process.argv);

const options = program.opts();

(async function () {
	if (options.time) {
		console.time('total time');
	}

	let secretsOptions = {
		region: options.region,
		env: options.env,
	};

	if (options.namespace && options.namespace.length) {
		secretsOptions.namespace = options.namespace;
	}

	if (options.all) {
		secretsOptions.all = true;
	}

	if (options.delimiter) {
		secretsOptions.delimiter = options.delimiter;
	}

	if (options.maxBuffer) {
		secretsOptions.maxBuffer = options.maxBuffer;
	}

	const secrets = new Secrets(secretsOptions);

	let config;

	try {
		config = await secrets.config();
	} catch (err) {
		console.error(err);
		process.exit(1);
	}

	if (options.pretty) {
		console.log(inspect(config, { depth: 10, colors: true }));
	} else {
		try {
			console.log(JSON.stringify(config));
		} catch (err) {
			console.error(err);
			process.exit(1);
		}
	}

	if (options.time) {
		console.timeEnd('total time');
	}
})();
