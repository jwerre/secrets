import readline from 'readline';
import Secrets from './secrets.mjs';

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

rl.on('line', function (input) {
	try {
		input = JSON.parse(input);
	} catch (err) {
		return Promise.reject(err);
	}

	try {
		let secrets = new Secrets(input.options || input);

		return secrets[input.method || 'config']
			.call(secrets, input.arguments)
			.then((config) => {
				try {
					console.log(JSON.stringify({ config }));
				} catch (err) {
					return Promise.reject(err);
				}
			})
			.catch(errorHandler);
	} catch (err) {
		errorHandler(err);
	} finally {
		rl.close();
	}
});

function errorHandler(err) {
	let error = Object.assign({}, err, { message: err.message });

	console.log(JSON.stringify({ error }));
}
