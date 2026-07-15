#!/usr/bin/env node

import { Command } from 'commander';
import Secrets from '../lib/secrets.js';

const REGION = 'us-west-2';

const program = new Command();

program
	.name('get-secret')
	.description('Retrieve a single secret from AWS Secrets Manager')
	.argument('<id>', 'name of the secret to retrieve')
	.option('-r, --region <region>', 'The AWS Secrets Manager region', REGION)
	// .option('-p, --pretty', 'Pretty-print the secret output')
	.action((id, options = {}) => {
		const secrets = new Secrets({
			region: options.region,
		});

		delete options.region;
		options.id = id;

		let secret = secrets.getSecretSync(options);

		console.log(secret);
	});

program.parse();
