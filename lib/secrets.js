const {spawnSync} = require( 'child_process');
const AWS = require('aws-sdk');


/**
 * Class for loading all secrets from AWS Secrets Manager.
 */
class Secrets {
	

	/**	
	 * @constructor
	 * @param  {Object} options class options
	 * @param  {String} options.region The AWS region where your secrets saved.
	 * @param  {String} options.delimiter delimiter used in key names (default:'/')
	 * @param  {String} options.env The environment or stage the secret belongs to
	 * e.g.: staging/database/secret. This is important when generating secret 
	 * config so that only that only secrets for specific environments are used.
	 * If not provided `process.env.NODE_ENV` is used.
	 * @param  {String|Array} options.namespace An optional namespace to be prepended.
	 * e.g.: my-namespace/production/database/secret
	 * @param  {Boolean} options.all Ignore the environment and retrieve all secrets
	 */	 
	constructor(options={}) {
		
		this.delimiter = options.delimiter || '/';
		
		this.env = options.env || process.env.NODE_ENV;

		if (options.region && options.region.length) {
			this.region = options.region;
			AWS.config.update({region: options.region});
		}
		
		if (options.all) {
			this.env = null;
		}
		
		if (options.namespace && options.namespace.length) {
			
			if (Array.isArray(options.namespace)) {
				this.namespace = options.namespace.join(this.delimiter);
			}
			
			this.namespace = options.namespace;

		}
		

		this.secretsmanager = new AWS.SecretsManager();

	}

	/**	
	 * configSync - config configuration data with all secrets from AWS Secrets Manager
	 * 	 
	 * @return {Object}	config object
	 */	
	configSync() {
		
		const args = {
			env: this.env,
			region: this.region,
			namespace: this.namespace,
		};

		let result = spawnSync( 'node', [ __dirname + '/readline' ], {
			input: JSON.stringify( args ),
			maxBuffer: (1024*1024) * 3
		});

		let res = JSON.parse( result.stdout.toString() );
		
		if( res.error ) {
			throw new Error( res.error.message || res.error.code );
		}
		
		return res.config || {};

	}

	/**	
	 * config - config configuration data with all secrets from AWS Secrets Manager
	 * 
	 * @async
	 * @return {Promise.<Object>} config object
	 */	
	async config (options={}) {
		
		let config = {},
			list,
			secrets,
			promises = [];
		
		// retrieve a full list of secrets for this namespace
		try {
			list = await this.listSecrets();
		} catch (err) {
			return Promise.reject(err);
		}
		
		if (!list || !list.length) {
			return Promise.resolve(config);
		}
		
		// retrive the secrets for the entier list
		for (let item of list) {
			promises.push( this.getSecret(item.Name) );
		}
		
		try {
			secrets = await Promise.all(promises);
		} catch (err) {
			return Promise.reject(err);
		}
		
		try {
			config = this._parseSecrets(secrets);
		} catch (err) {
			return Promise.reject(err);
		}
		
		return Promise.resolve(config);
		
		
	}
	
	
	/**	
	 * createSecret - create a new secret in AWS Secrets Manager. This method
	 * will automatically append the namespace and env it they are provided
	 * 	 
	 * @param  {Object} options={} secret options
	 * @param  {String} name secret name
	 * @param  {String} description secret description
	 * @param  {String} token secret token
	 * @param  {String} kms secret kms
	 * @param  {String} tags secret tags
	 * @param  {String} secrets secret string
	 * @param  {String} secretsBinary secret secrets as binary
	 * @return {Promise} A Promise containing the ARN Name and VersionID
	 */	 
	createSecret (options={}) {
		
		if (Array.isArray(options.name)) {
			options.name = options.name.join(this.delimiter);
		}
		
		if (this.env) {
			options.name = `${this.env}${this.delimiter}${options.name}`;
		}

		if (this.namespace) {
			options.name = `${this.namespace}${this.delimiter}${options.name}`;
		}

		let params = {
			Name: options.name
		};

		if (options.description && options.description.length) {
			params.Description = options.description;
		}

		if (options.token && options.token.length) {
			params.ClientRequestToken = options.token;
		}

		if (options.kms && options.kms.length) {
			params.KmsKeyId = options.kms;
		}
		
		if (Array.isArray(options.tags)) {
			params.Tags = options.tags;
		}
		
		if (options.secretsBinary) {
			params.SecretBinary = options.secretsBinary;
		} else {
			params.SecretString = JSON.stringify(options.secrets);
		}

		return this.secretsmanager.createSecret(params).promise();
	}

	
	/**	
	 * getSecret - retrieve a secret from AWS Secrets Manager
	 * 	 
	 * @param  {String} id The id of the secret to retireve
	 * @param  {Object} options={}
	 * @param  {String} options.version The secret version 
	 * @param  {String} options.stage staging label attached to the version
	 * @return {Promise} A Promise contaning secret details
	 */	 
	getSecret (id, options={}) {

		let params = {
			SecretId: id, 
		};
		
		if (options.version) {
			params.VersionId = options.version;
		} else if (options.stage) {
			params.VersionStage = options.stage;
		}
		
		return this.secretsmanager.getSecretValue(params).promise();

	}

	
	/**	
	 * listSecrets - Retireve a full list of all secrets
	 * 
	 * @async
	 * @return {Promise.<[Object]>}
	 */	 
	async listSecrets () {
		
		let secrets = [],
			nextToken;
		
		do {
			let params = {},
				res;
				
			if (nextToken) {
				params.NextToken = nextToken;
			}
			
			try {
				res = await this.secretsmanager.listSecrets(params).promise();
			} catch (err) {
				return Promise.reject(err);
			}
			
			secrets = secrets.concat(res.SecretList);
			
			nextToken = res.NextToken;
			
			
		} while (nextToken);
		
		// filter out any secrests that are not part of the namespace and env
		let lookupStr = `^${this.delimiter}?`;
		
		if (this.namespace && this.namespace.length) {
			lookupStr += `${this.namespace}${this.delimiter}`;
		}
		
		if (this.env && this.env.length) {
			lookupStr += `${this.env}${this.delimiter}`;
		}
		
		if (lookupStr.length > 4) {
			
			let regexp = new RegExp(lookupStr);

			secrets = secrets.filter( (item) => {
				return regexp.test(item.Name);
			});
			
		}
		
		return Promise.resolve(secrets);

	}


	/**	
	 * deleteSecret - Delete a secret with a recovery window of 30 days unless
	 * `force` is true
	 * 	 
	 * @param  {type} id The id of secret to delete 
	 * @param  {type} force=false force the secret to be immedatly deleted
	 * @return {Promise} A Promise containing ARN, Name and DeletionDate
	 */	 
	deleteSecret (id, force=false) {

		let params = {
			SecretId: id,
		};
		
		if (force) {
			params.ForceDeleteWithoutRecovery = true;
		}
		
		return this.secretsmanager.deleteSecret(params).promise();

	}


	/**	
	 * _parseSecrets - convert secret names into proper config object using 
	 * 
	 * @param  {Array} list the list of secrets retuned from Secrets Mananger
	 * @return {Object}
	 */	 
	_parseSecrets(list) {
		
		let res = {};
		let config = {};


		for (let secret of list) {
		
			let name = secret.Name
				.replace(this.namespace+this.delimiter, '')
				.replace(this.env+this.delimiter, '');
		
			try {
				config[name] = JSON.parse(secret.SecretString);
			} catch (err) {
				return Promise.reject(err);
			}
		
		}
		
		for (let item in config) {
		
			let cache = res,
				parts = item.split(this.delimiter),
				key = parts.pop(),
				part;
		
			while (parts.length) {
				part = parts.shift();
				cache = cache[part] = cache[part] || {};
			}
			cache[key] = config[item];
		}

		return res;
		
	}
	
}




module.exports = Secrets;
