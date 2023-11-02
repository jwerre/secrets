# Secrets

Synchronously retrieve all your secrets from [AWS Secrets Manager](https://aws.amazon.com/secrets-manager) and create a tidy configuration object for your application or service. AWS Secrets Manager is a secure way to store sensitive information for your application. Instead of putting a configuration file on all your servers, particularly if you have distributed architecture, securely store them in AWS Secrets Manager and use this module to synchronously retrieve them before your application loads.

## Install

```bash
npm install --save @jwerre/secrets
```

## Example

### Get all secrets

```js
const {configSync} = require('@jwerre/secrets');

// Retrieve all secrets that begin with 'my-project/production/'
const config = configSync({
	region: 'us-east-1',
	namespace: 'my-project',
	env: 'production'
});
```

#### Result:
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

### Get a single secret

Loading _all_ your secrets may not always be the best option. It's much faster to load a single secret like this:

```js
const {secretSync} = require('@jwerre/secrets')
const dbCredentials = secretSync({ region: 'us-east-1', id: '/my-project/production/db' });
```

#### Result:
```js
{
	username: 'admin',
	password: 'Super$ercret!'
}
```


### Asynchronously get all secrets

In most cases, you'll want to get your configuration object synchronously before your application starts up. But, if you prefer, you can also get your secrets asynchronously like this.

```js
const {config} = require('@jwerre/secrets');

( async function(){

	const appConfig = await config(options);

})();
```

## Options

| Option            | Type          | Description                                                                                                                                                                                                                                    |
| ----------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| delimiter         | String        | delimiter used in secret names (default:`/`).                                                                                                                                                                                                  |
| region            | String        | The AWS region where your secrets are saved. (default: AWS_PROFILE environment variable or us-west-2 if unset)                                                                                                                                 |
| env               | String        | The environment or stage the secret belongs to e.g.: `staging/database/secret`. This is important when generating the configuration so that only secrets for specific environments are loaded. If not provided `process.env.NODE_ENV` is used. |
| namespace         | String\|Array | An optional namespace to be prepended. e.g.: `my-namespace/production/database/secret`. For multiple namespaces use an array.                                                                                                                  |
| all               | Boolean       | Ignore the environment and retrieve all secrets.                                                                                                                                                                                               |
| maxBuffer=3145728 | Number        | Largest amount of data in bytes the entire config can be. If exceeded, the process is terminated and any config is truncated. (default: 3Mbs or 3145728 Bytes)                                                                                 |

## Naming Convention

Your secrets should be named appropriately so they can be parsed into a proper object. They should also have an environment like 'production' or 'development' so the secrets can be loaded into the correct environment. You may use a namespace but that\'s not required. The [example](#example) above was generated from secrets with the following names:

-   `acme-co/production/name`
-   `acme-co/production/db`
-   `acme-co/production/session`
-   `acme-co/production/apis/google`

### Delimiters

Your secret names should have a delimiter separating the namespace, environment and the overall hierarchical structure. The default delimiter is a forward slash (`/`) but you can use anything you want. If you're not using the default delimiter, be sure and use the `delimiter` argument.

## Permissions

You'll need to give your application or service permission to access your secrets. Start off by creating the following [AIM Policy](https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies.html).

```json
{
	"Version": "2012-10-17",
	"Statement": [
		{
			"Action": [
				"secretsmanager:ListSecrets",
				"secretsmanager:GetSecretValue"
			],
			"Effect": "Allow",
			"Resource": "*"
		}
	]
}
```

If you plan on using any of the higher level methods or any of the CLI tools in the `bin` directory, you'll need [additional permissions](https://docs.aws.amazon.com/IAM/latest/UserGuide/list_awssecretsmanager.html).

## API

You may want to access the higher level API which can be done like this:

```js
const { Secrets } = require('@jwerre/secrets');
const secret = new Secrets(options);
const config = secrets.configSync();
```

### Methods

There's a handful of methods that wrap the AWS Secrets Manager SDK.

##### config()

Asynchronously retrieve configuration data with all secrets from AWS Secrets Manager.

##### configSync()

Synchronously retrieve configuration data with all secrets from AWS Secrets Manager.

##### createSecret({})

Create a new secret in AWS Secrets Manager. This method will automatically append the `namespace` and `env` if they are provided.

| Option        | Type          | Description                    |
| ------------- | ------------- | ------------------------------ |
| name          | String        | Secret name.                   |
| description   | String        | Secret description.            |
| secrets       | Object:String | Secrets string or JSON Object. |
| secretsBinary | secretsBinary | Secret secrets as binary.      |
| token         | String        | Client request token.          |
| kms           | Boolean       | KMS key.                       |
| tags          | \[Object\]    | A list of secret tags.         |

##### getSecret({})

Retrieve a secret from AWS Secrets Manager

| Option          | Type    | Description                                                                                                                                                                                |
| --------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| id              | String  | The secret id.                                                                                                                                                                             |
| version         | String  | The secret version.                                                                                                                                                                        |
| stage           | String  | Staging label attached to the version.                                                                                                                                                     |
| raw             | Boolean | Return the full response from AWS.                                                                                                                                                         |
| maxBuffer=65536 | Number  | Largest amount of data in Bytes the secret can be (default: 65536 Bytes) which is the quota. See [Secret Manager quotas]( https://docs.aws.amazon.com/secretsmanager/latest/userguide/reference_limits.html#quotas). |

##### getSecretSync({})

Synchronously retrieve a secret from AWS Secrets Manager. Same options as `getSecret()`

##### listSecrets()

Retrieve a full list of all secrets.

##### deleteSecret(id, force)

Delete a secret with a recovery window of 30 days unless `force` argument is `true`

| Option | Type    | Description                    |
| ------ | ------- | ------------------------------ |
| id     | String  | The secret id.                 |
| force  | Boolean | Force delete without recovery. |

## Command Line Interface

There are a few handy CLI tools in the bin directory to help you get started. It helps to install this globally:

```bash
npm install --global @jwerre/secrets
```

All of the following commands have arguments which you can learn more about by using the `--help` flag.

### Retrieve Configuration Object

To retrieve all your secrets from AWS SecretsManger, execute the following script.

```bash
get-config --region us-east-2 --env staging --pretty
```

### Create Secrets

If you have a config file and you want to deploy it to AWS SecretsManager, you can use this script to do it. This script accepts JSON or YAML.

```bash
create-secrets --region us-east-2 --env production $HOME/.secrets/production.json
```

### Delete Secrets

Be careful with this one as it will remove all your secrets. It will, however, prompt you before removing.

```bash
# create a backup first
get-config --region us-east-2 --env development > config_development_backup.json

delete-secrets --region us-east-2 --env development --namespace acme-co --force

```

## Testing

Testing can be a bit finicky since AWS won't delete the secrets created in the test immediately. You may need to wait a minute or two in-between tests if you're running multiple times in succession.

```bash
npm install
npm test
```

NOTE: You must have access to an AWS account with the full access to Secret Manager [additional permissions](https://docs.aws.amazon.com/IAM/latest/UserGuide/list_awssecretsmanager.html).