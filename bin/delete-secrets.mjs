#!/usr/bin/env node

import { Command } from 'commander';
import { inspect } from 'util';
import { SecretsManager } from '@aws-sdk/client-secrets-manager';
import readline from 'readline';

const readln = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

const REGION = 'us-west-2';
const ENV = 'development';

const program = new Command();

program
	.name('delete-secrets')
	.description(
		'Delete all secrets from AWS Secrets Manager within a region, environment and namespace.\nBy default, you will be prompted for confirmation deleting.\n\n!! This is destructive, be careful using it !!'
	)
	.option('-v, --verbose', 'Verbose output')
	.option('-e, --env <environment>', 'Which environment to use', ENV)
	.option('-f, --force', 'Force delete without recovery')
	.option('-d, --dry', 'Dry run')
	.option('-q, --quiet', 'Disable confirmation prompt')
	.option('-n, --namespace <namespace>', 'Namespace of all parameters')
	.option(
		'-r, --region <region>',
		'AWS region where secrets are stored',
		process.env.AWS_REGION || REGION
	)
	.parse(process.argv);

const options = program.opts();

const dry = options.dry;
const force = options.force;
const quiet = options.quiet;
const verbose = options.verbose;
const env = options.env;
const namespace = options.namespace;
const region = options.region;
const secretsmanager = new SecretsManager({ region: region });

function prompt(question) {
	return new Promise(function (resolve, reject) {
		readln.question(question, function (answer) {
			resolve(
				(answer &&
					answer.length &&
					answer.trim().toLowerCase() === 'yes') ||
					answer.trim().toLowerCase() === 'y'
			);
		});
	});
}

async function listSecrets() {
	let secrets = [],
		nextToken;

	do {
		let params = {},
			res;

		if (nextToken) {
			params.NextToken = nextToken;
		}

		try {
			res = await secretsmanager.listSecrets(params);
		} catch (err) {
			return Promise.reject(err);
		}

		secrets = secrets.concat(res.SecretList);

		nextToken = res.NextToken;
	} while (nextToken);

	// filter out any secrets that are not part of the namespace and env
	let lookupStr = '^/?';

	if (namespace && namespace.length) {
		lookupStr += `${namespace}/`;
	}

	if (env && env.length) {
		lookupStr += `${env}/`;
	}

	if (lookupStr.length > 4) {
		let regexp = new RegExp(lookupStr);

		secrets = secrets.filter((item) => {
			// console.log(item.Name, regexp, regexp.test(item.Name));
			return regexp.test(item.Name);
		});
	}

	return Promise.resolve(secrets);
}

function deleteSecrets(list) {
	const promises = [];

	for (let item of list) {
		const params = { SecretId: item.ARN };

		if (force) {
			params.ForceDeleteWithoutRecovery = true;
		}

		const promise = secretsmanager.deleteSecret(params);
		promises.push(promise);
	}

	return Promise.allSettled(promises);
}

(async () => {
	let list, abort;

	try {
		list = await listSecrets();
	} catch (e) {
		return e;
	}

	if (!list || !list.length) {
		return Promise.reject('Nothing to delete');
	}

	if (!quiet) {
		let promptMsg = `This will remove ${list.length} ${env} secrets from AWS
Secret Manager. Are you sure you want to continue? [y/N] `;
		if (dry) {
			promptMsg = `!!DRY RUN!! ${promptMsg}`;
		}
		try {
			abort = await prompt(promptMsg);
		} catch (err) {
			return Promise.reject(err);
		}

		if (!abort) {
			return Promise.reject(
				'Aborting... Nothing was deleted your secrets are safe.'
			);
		}
	}

	if (dry) {
		return Promise.resolve(list);
	}

	return deleteSecrets(list);
})()
	.then((res) => {
		if (verbose && res) {
			console.log(inspect(res, { depth: 10, colors: true }));
			if (dry) {
				console.log('DRY RUN: no secrets were deleted');
			}
		}
	})
	.catch(console.error)
	.then(process.exit);
