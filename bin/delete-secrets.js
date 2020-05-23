#!/usr/bin/env node

const argv = require('minimist')(process.argv.slice(2));
const {inspect} = require('util');
const inquirer = require('inquirer');
const AWS = require('aws-sdk');

const REGION = 'us-west-2';
const ENV = 'development';

const secretsmanager = new AWS.SecretsManager({region:REGION});
const dry = argv.d || argv.dry;
const force = argv.f || argv.force;
const verbose = argv.v || argv.verbose;
const env = argv.e || argv.env || ENV;
const namespace = argv.n || argv.namespace;
const region = argv.r || argv.region;


function showHelp () {
	console.log(`
Delete all secrets from AWS Secrets Manager within a region, environment and namespace. 
!! This is desctructive, be carfull using it !!

Usage: delete-config --namespace my-namespace --env staging

Options:
-h, --help		Show help.
-v, --verbose		Verbose output.
-e, --env		Which environment to use (defaut:${ENV}).
-f, --force		Force delete without recovery
-d, --dry		Dry run.
-n, --namespace		Namespace of all parameters (optional).
-r, --region		AWS region where secrets are stored.
`);

	return process.exit();
}


if (argv.h || argv.help) {
	showHelp();
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


	if (region) {
		AWS.config.update({region: region});
	}
	
	let list, prompt;
		
	try {
		list = await listSecrets();
	} catch (e) {
		return e;
	}
	
	if (!list || !list.length) {
		return Promise.reject('Nothing to delete');
	}
	
	if (dry) {
		console.log('Dry Run:');
		return Promise.resolve(list);
	}

	try {
		prompt = await inquirer.prompt([
			{
				type: 'confirm',
				name: 'confirm',
				default: false,
				message: `This will remove ${list.length} ${env} secrets from AWS Secret Manager. Are you sure?`,
			},
		]);
	} catch (err) {
		return Promise.reject(err);
	}
	
	if (!prompt.confirm) {
		return Promise.reject('Aborting... Nothing was deleted your secrets are safe.');
	}
	
	return deleteSecrets(list);

})()
	.then( (res) => {
		if (verbose && res) {
			console.log( inspect(res, {depth:10, colors:true}) );
		}
	})
	.catch( console.error )
	.then( process.exit );
