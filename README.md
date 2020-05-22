# Secrets

Synchronously retrieve all your secrets from [AWS Secrets Manager](https://aws.amazon.com/secrets-manager) and create tidy configuration objects for your applications or services. AWS Secrets Manager is a secure way to store sensitive information for your applications. Instead of putting a configuration files on all your servers, particularly if you have distributed architecture, securely store them in AWS Secrets Manager and use this module to synchronously retrieve them before you start up you app.

## Install

``` bash
npm install --save @jwerre/secrets
```

## Examples

### Synchronous

```js
const config = require('secrets').configSync({
	region: 'us-east-1'
});
```

### Asynchronous

```js
( async function(){

	const {config} = require('secrets');

	let appConfig;
	
	try {
		appConfig = config({
			region: 'us-west-1',
			env: 'prod',
			delimiter: '.',
			namespace: 'acme-co'
		});
	} else (err) {
		return Promise.reject(err)
	}
	
})();
```

## Options

| Option 	| Type 				| Description	|
| -			| -					| -				|
| delimiter | String			| delimiter used in secret names (default:`/`).
| region	| String			| The AWS region where your secrets saved.
| env 		| String  			| The environment or stage the secret belongs to e.g.: staging/database/secret. This is important when generating secret config so that only that only secrets for specific environments are used. If not provided `process.env.NODE_ENV` is used.
| namespace | String\|Array 	| An optional namespace to be prepended. e.g.: my-namespace/production/database/secret. For multiple namespaces use an array.
| all 		| Boolean  			| Ignore the environment and retrieve all secrets.

## Naming Convention

Your secrets should be named in such a way so they can be parsed into a proper object. They should also have an environment like 'production' or 'development' so the appropriate secrets can be loaded into the correct environment. You may use a namespace but that\'s not required. For example, you may have some AWS Secrets Manager secrets with the following names:

- `acme-co/production/name`
- `acme-co/production/db/username`
- `acme-co/production/db/password`
- `acme-co/production/session/secret`
- `acme-co/production/apis/google/key`
- `acme-co/production/apis/google/secret`

After generating your secrets the result should look something like this:

```js
config = require('secrets').configSync({
	region: 'us-east-1',
	namespace: 'acme-co',
	env: 'production',
});
```

```js
{
	name: 'My App'
	db: {
		username: 'admin',
		password: 'Super$ercret!'
	},
	session: {
		secret: 'abc123'
	},
	apis: {
		google: {
			key: '3829rufmv90498hj3f92j3',
			secret: '309jcnr8g9302nfe',
		}
	}
}
```

### Delimiters

Your secret names should have a delimiter separating the namespace, environment and the overall hierarchical structure. The default delimiter is a forward slash (`/`) but you can use anything you want. If you're not using the default delimiter be sure and use the `delimiter` argument.


## Testing

Testing can be a bit finicky since AWS won't delete the secrets created in the test immediately. To run the test execute:

```bash
npm install
npm test
``` 

## CLI
To load your secrets use the command line interface in the `bin` directory. Use the `--help` flag to see all the options.

```bash
./bin/config.js --region us-west-1 --pretty
```


## API

You may want to access the higher level API which can be done like this:

```js
const {Secrets} = require('secrets');
const secret = new Secrets(options);
const config = secrets.configSync();
```

### Methods
There's a handful of methods that wrap the AWS Secrets Manager SDK. Take a look at `lib/secrets.js` for full documentation.

#### configSync()
Retrieve configuration data with all secrets from AWS Secrets Manager.

#### config()
Retrieve configuration data with all secrets from AWS Secrets Manager.

#### createSecret(options)
create a new secret in AWS Secrets Manager. This method will automatically append the namespace and env it they are provided.

#### getSecret(id)
Retrieve a secret from AWS Secrets Manager

#### listSecrets()
Retrieve a full list of all secrets.

#### deleteSecret(id, force)
Delete a secret with a recovery window of 30 days unless `force` argument is `true`
