#!/usr/bin/env node

const argv = require('minimist')(process.argv.slice(2));
const {inspect} = require('util');
const AWS = require('aws-sdk');
const readline = require('readline');
const readln = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

const REGION = 'us-west-2';
const ENV = 'development';

const dry = argv.d || argv.dry;
const force = argv.f || argv.force;
const quiet = argv.q || argv.quiet;
const verbose = argv.v || argv.verbose;
const env = argv.e || argv.env || ENV;
const namespace = argv.n || argv.namespace;
const region = argv.r || argv.region || process.env.AWS_REGION || REGION;
const secretsmanager = new AWS.SecretsManager({region:region});


function showHelp () {
	console.log(`
Delete all secrets from AWS Secrets Manager within a region, environment and namespace.
By default, you will be prompted for confirmation deleting.

!! This is destructive, be careful using it !!

Usage: delete-secrets --namespace my-namespace --env staging

Options:
-h, --help		Show help.
-v, --verbose		Verbose output.
-e, --env		Which environment to use (default: ${ENV}).
-f, --force		Force delete without recovery
-d, --dry		Dry run.
-q, --quiet		Disable confirmation prompt.
-n, --namespace		Namespace of all parameters
-r, --region		AWS region where secrets are stored (default: AWS_PROFILE environment variable or ${REGION} if unset)
`);

	return process.exit();
}


if (argv.h || argv.help) {
	showHelp();
}


function prompt (question) {

	return new Promise( function (resolve, reject) {
		readln.question( question, function (answer) {
			resolve(
				answer &&
				answer.length && 
				answer.trim().toLowerCase() === 'yes' ||
				answer.trim().toLowerCase() === 'y'
			);
		});
	});

}


async function listSecrets () {
	
	let secrets = [],
		nextToken;
	
	do {
		let params = {},
			res;
			
		if (nextToken) {
			params.NextToken = nextToken;
		}
		
		try {
			res = await secretsmanager.listSecrets(params).promise();
		} catch (err) {
			return Promise.reject(err);
		}
		
		secrets = secrets.concat(res.SecretList);
		
		nextToken = res.NextToken;
		
		
	} while (nextToken);
	
	// filter out any secrests that are not part of the namespace and env
	let lookupStr = '^/?';
	
	if (namespace && namespace.length) {
		lookupStr += `${namespace}/`;
	}
	
	if (env && env.length) {
		lookupStr += `${env}/`;
	}
	
	if (lookupStr.length > 4) {
		
		let regexp = new RegExp(lookupStr);
		
		secrets = secrets.filter( (item) => {
			// console.log(item.Name, regexp, regexp.test(item.Name));
			return regexp.test(item.Name);
		});
		
	}
	
	return Promise.resolve(secrets);

}


function deleteSecrets (list) {
	
	let promises = [];
	
	for (let item of list) {

		let params = {
			SecretId: item.ARN,
		};
		
		if (force) {
			params.ForceDeleteWithoutRecovery = true;
		}
		
		let promise = secretsmanager.deleteSecret(params).promise();
		promises.push(promise);

	}
	
	return Promise.allSettled(promises);
	
}



( async () => {

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
			return Promise.reject('Aborting... Nothing was deleted your secrets are safe.');
		}

	}

	if (dry) {
		return Promise.resolve(list);
	}

	
	return deleteSecrets(list);

})()
	.then( (res) => {
		if (verbose && res) {
			console.log( inspect(res, {depth:10, colors:true}) );
			if (dry) {
				console.log('DRY RUN: no secrets were deleted');
			}
		}
	})
	.catch( console.error )
	.then( process.exit );
