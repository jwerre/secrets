#!/usr/bin/env node

const argv = require('minimist')(process.argv.slice(2));
const fs = require('fs').promises;
const {inspect} = require('util');
const yaml = require('js-yaml');
const AWS = require('aws-sdk');

const {F_OK, R_OK} = require('fs').constants;
const ENV = 'development';
const REGION = 'us-west-2';
const DELIMITER = '/';

const stdin = argv._[0] || argv.i || argv.in;
const region = argv.r || argv.region || process.env.AWS_REGION || REGION;
const kms = argv.k || argv.kms;
const env = argv.env || argv.e || ENV;
const namespace = argv.namespace || argv.n;
const delimiter = argv.delimiter || argv.d || DELIMITER;
const verbose = argv.v || argv.verbose;

function showHelp () {
	console.log(`
Deploy configuration file to AWS Secrets Manager.

Usage: create-secrets --verbose --kms 123456789-123456789-1234567890 /path/to/my/config.<yaml|json>

Options:
-h, --help		Show help.
-v, --verbose		Verbose output.
-r, --region		The AWS Secrets Manager region (default: AWS_PROFILE environment variable or ${REGION} if unset).
-e, --env		Which environment to use in the secret name (default: ${ENV}).
-k, --kms		KMS key id to use for encryption.
-n, --namespace		Namespace of all parameters.
-d, --delimiter		Delimiter to use for secret name (default: ${DELIMITER}).
`);

	return process.exit();
}

if (argv.h || argv.help) {
	showHelp();
}


	
async function getConfig (path) {
	
	let content, config, isYaml;
	
	try {
		await fs.access(path, F_OK | R_OK);
	} catch (err) {
		console.log(err);
		return Promise.reject(`${path} ${err.code === 'ENOENT' ? 'does not exist' : 'is read-only'}.`);
	}
	
	try {
		content = await fs.readFile(path, 'utf8');
	} catch (err) {
		return Promise.reject(err);
	}
	
	try {
		config = JSON.parse(content);
	} catch (err) {
		isYaml = true;
	}
		
	if (isYaml) {

		try {
			config = yaml.safeLoad(content);
		} catch (err) {
			return Promise.reject(err);
		}

	}
	
	return Promise.resolve(config);
}



function parseSecrets(obj, current) {

	var result = [];
	
	(function recurse(obj, current) {
		
		for(let key in obj) {
			
			let value = obj[key],
				isInumerable = false,
				newKey = (current ? `${current}${delimiter}${key}` : key);

			// if it's the last nested object stop recursion
			if ( Object.prototype.toString.call(value) === '[object Object]' ) {
				
				isInumerable = Object.keys(value).some( (key) => {
					return Object.prototype.toString.call(value[key]) === '[object Object]';
				});

			}

			if ( isInumerable ) {
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


function createSecrets (list) {
	
	const secretsmanager = new AWS.SecretsManager({region:region});
	let promises = [];
	
	for (let item of list) {
		
		let params = {
			Name: item.key,
			KmsKeyId: kms,
			SecretString: item.value,
		};
		
		if (Object.prototype.toString.call(params.SecretString) !== '[object String]') {

			try {
				params.SecretString = JSON.stringify(params.SecretString);
			} catch (err) {
				// ignore stringify err
			}
			
		}

		let promise = secretsmanager.createSecret(params).promise();
		promises.push(promise);

	}
	
	return Promise.allSettled(promises);
}



( async () => {
	
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
	.then( (res) => {
		if (verbose) {
			console.log( inspect(res, {depth:10, colors:true}) );
		}
	})
	.catch( console.error )
	.then( process.exit );
