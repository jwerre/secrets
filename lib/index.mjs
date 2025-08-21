import Secrets from './secrets.mjs';

export { Secrets };

export const config = function (options = {}) {
	const secrets = new Secrets(options);

	return secrets.config();
};

export const configSync = function (options = {}) {
	const secrets = new Secrets(options);

	let config = secrets.configSync();

	return config;
};

export const secretSync = function (options) {
	const secrets = new Secrets({
		region: options.region,
	});

	delete options.region;

	let secret = secrets.getSecretSync(options);

	return secret;
};
