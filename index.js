
const Secrets = require('./lib/secrets');

module.exports.Secrets = Secrets;

// example:
// config = await require('secrets').config(options)
module.exports.config = function (options={}) { 

	const secrets = new Secrets(options);

	return secrets.config();
};

// example:
// config = require('secrets').configSync(options)
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
