# Secrets

Synchronously retrieve all your secrets from [AWS Secrets Manager](https://aws.amazon.com/secrets-manager) and create a tidy configuration object for your application or service. AWS Secrets Manager is a secure way to store sensitive information for your application. Instead of putting a configuration file on all your servers, particularly if you have distributed architecture, securely store them in AWS Secrets Manager and use this module to synchronously retrieve then before your application loads.

## Install

``` bash
npm install --save @jwerre/secrets
```

## Example

### Get all secret

```js
const config = require('secrets').configSync({
	region: 'us-east-1'
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

### Get a single secrets

Loading *all* your secrets may not always be best options. It's much faster to load a single secret like this:

```js
const config = require('secrets').secretSync({
	region: 'us-east-2',
	id: '/my-co/apis/',
});
```

### Asynchronously get all secrets

In most cases you'll want to get your configuration object synchronously since your app probably won't run without it. But, if you prefer, you can also get your secrets asynchronously.

```js
const {config} = require('secrets');

( async function(){

	let appConfig;
	
	try {
		appConfig = await config(options);
	} else (err) {
		return Promise.reject(err)
	}
	
})();
```


## Options

| Option 	| Type 				| Description	|
| -			| -					| -				|
| delimiter | String			| delimiter used in secret names (default:`/`). |
| region	| String			| The AWS region where your secrets are saved. (default: us-west-2) |
| env 		| String  			| The environment or stage the secret belongs to e.g.: `staging/database/secret`. This is important when generating the configuration so that only that only secrets for specific environments are loaded. If not provided `process.env.NODE_ENV` is used. |
| namespace | String\|Array 	| An optional namespace to be prepended. e.g.: `my-namespace/production/database/secret`. For multiple namespaces use an array. |
| all 		| Boolean  			| Ignore the environment and retrieve all secrets. |

## Naming Convention

Your secrets should be named appropriately so they can be parsed into a proper object. They should also have an environment like 'production' or 'development' so the secrets can be loaded into the correct environment. You may use a namespace but that\'s not required. The [example](#example) above was generated from secrets with the following names:

- `acme-co/production/name`
- `acme-co/production/db`
- `acme-co/production/session`
- `acme-co/production/apis/google`

### Delimiters

Your secret names should have a delimiter separating the namespace, environment and the overall hierarchical structure. The default delimiter is a forward slash (`/`) but you can use anything you want. If you're not using the default delimiter be sure and use the `delimiter` argument.

## Permissions

You'll need to give you application or service permission to to access your secrets. Start off by creating the following [AIM Policy](https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies.html). 

```json
{
	"Version": "2012-10-17",
	"Statement": [
		{
			"Action": [
				"secretsmanager:ListSecrets",
				"secretsmanager:GetSecretValue",
			],
			"Effect": "Allow",
			"Resource": "*"
		}
	]
}
```

If you plan on using any of the higher lever methods or any of the cli tool in the `bin` directory you'll need [additional permissions](https://docs.aws.amazon.com/IAM/latest/UserGuide/list_awssecretsmanager.html). 

## API

You may want to access the higher level API which can be done like this:

```js
const {Secrets} = require('secrets');
const secret = new Secrets(options);
const config = secrets.configSync();
```

### Methods
There's a handful of methods that wrap the AWS Secrets Manager SDK.

##### config()

Asynchronously retrieve configuration data with all secrets from AWS Secrets Manager. Options are the same as

##### configSync()

Synchronously retrieve configuration data with all secrets from AWS Secrets Manager. Options are the same as `config()`.

##### createSecret({})

create a new secret in AWS Secrets Manager. This method will automatically append the namespace and env it they are provided.

| Option 		| Type 				| Description	|
| -				| -					| -				|
| name			| String			| Secret name. |
| description	| String			| Secret description. |
| secrets		| Object:String		| Secrets string or JSON Object. |
| secretsBinary	| secretsBinary		| Secret secrets as binary. |
| token			| String			| Client request token. |
| kms 			| Boolean  			| KMS key. |
| tags 			| \[Object\] 			| A list of secret tags. |


##### getSecret({})

Retrieve a secret from AWS Secrets Manager

| Option 	| Type 				| Description	|
| -			| -					| -				|
| id		| String			| The secret id. |
| version	| String			| The secret version. |
| stage		| String			| Staging label attached to the version. |
| raw 		| Boolean  			| Return the full response from AWS. |

##### getSecretSync({})

Synchronously retrieve a secret from AWS Secrets Manager. Same options as `getSecret()`

##### listSecrets()

Retrieve a full list of all secrets.

##### deleteSecret(id, force)

Delete a secret with a recovery window of 30 days unless `force` argument is `true`

| Option 	| Type 				| Description	|
| -			| -					| -				|
| id		| String			| The secret id. |
| forece	| Boolean  			| Force delete without recovery. |


## Command Line Interface
There are a few handy cli tools in the bin directory to help you get started. All these scripts have arguments which you can learn more about by using the `--help` flag.

### Retrieve Configuration Object

To retrieve all your secrets for from AWS SecretsManger execute the following script.

```bash
get-config.js --region us-east-2 --env staging --pretty
```

### Create Secrets

If you have a config file and you want to deploy it to AWS SecretsManager you can use this script to do it. This script accepts JSON or YAML.

```bash
create-secrets.js --region us-east-2 --env production $HOME/.secrets/production.json
```

### Delete Secrets

Be careful with this one, it will remove all your secrets for an environment. It will, however, prompt you before removing.

```bash
# create a backup first
get-config.js --region us-east-2 --env development > secrets-backup.json

delete-secrets.js --region us-east-2 --env development --namespace acme-co --force

```



## Testing
Testing can be a bit finicky since AWS won't delete the secrets created in the test immediately. You may need to wait a minute or two in-between tests if you're running multiple times in succession.

```bash
npm install
npm test
``` 
