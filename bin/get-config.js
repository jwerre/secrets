#!/usr/bin/env node

const Secrets = require( '../lib/secrets' );
const argv = require('minimist')(process.argv.slice(2));
const {inspect} = require('util');

const ENV = 'development';
const REGION = 'us-west-2';
const DELIMITER = '/';

const env = argv.env || argv.e || ENV;
const region = argv.r || argv.region || process.env.AWS_REGION || REGION;
const namespace = argv.namespace || argv.n;
const pretty = argv.pretty || argv.p;
const delimiter = argv.delimiter || argv.d || DELIMITER;
const all = argv.all || argv.a;
const time = argv.time || argv.t;
const maxBuffer = argv.maxBuffer || argv.m;

function showHelp () {
	console.log(`
Retrieve all secrets from AWS Secrets Manager. 

Usage: get-config --namespace mynamespace --env production --pretty

Options:
-h, --help		Show help.
-r, --region		The AWS Secrets Manager region (default: AWS_PROFILE environment variable or ${REGION} if unset).
-e, --env		Which environment to use in the secret name (default: ${ENV}).
-d, --delimiter		Secret name delimiter (default: ${DELIMITER}).
-p, --pretty		Pretty output
-a, --all		Ignore the environment and retrieve all secrets (default: false).
-n, --namespace		Namespace of all parameters.
-t, --time		Display time it takes to retrieve config.
-m, --max		Largest the entire config can be in bytes (default: 3 Mb).
`);

	return process.exit();
}


(async function(){
	
	if (time) {
		console.time( 'total time' );
	}


	if (argv.h || argv.help) {
		return showHelp();
	}

	
	let options = {
		region: region,
		env: env,
	};
	
	if (namespace && namespace.length) {
		options.namespace = namespace;
	}
	
	if (all) {
		options.all = true;
	}
	
	if (delimiter) {
		options.delimiter = delimiter;
	}
	
	const secrets = new Secrets(options);

	let config;
	
	try {
		config = await secrets.config();
	} catch (err) {
		return Promise.reject(err);
	}
	
	if (pretty) {

		console.log( inspect(config, {depth:10, colors:true}) );

	} else {
		
		try {
			console.log( JSON.stringify(config) );
		} catch (err) {
			return Promise.reject(err);
		}

	}
	
	if (time) {
		console.timeEnd( 'total time' );
	}

	
})();
