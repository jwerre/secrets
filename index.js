
const Secrets = require('./lib/secrets');

module.exports.Secrets = Secrets;

module.exports.config = function (options={}) { 

	const secrets = new Secrets(options);

	return secrets.config();
};

module.exports.configSync = function (options={}) { 

	const secrets = new Secrets(options);
	
	let config;
	
	try {
		config = secrets.configSync();
	} catch (err) {
		throw err;
	}
	
	return config;
};

module.exports.secretSync = function (options) { 

	const secrets = new Secrets({
		region: options.region
	});
	
	delete options.region;
	
	let secret;
	
	try {
		secret = secrets.getSecretSync(options);
	} catch (err) {
		throw err;
	}
	
	return secret;
};
