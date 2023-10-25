const {spawnSync} = require( 'child_process');
const { SecretsManager } = require("@aws-sdk/client-secrets-manager");

const DEFAULT_REGION = 'us-west-2';
const MAX_RETRY_ATTEMPTS = 3;

/**
 * Class for loading all secrets from AWS Secrets Manager.
 */
class Secrets {

	/**	
	 * @constructor
	 * @param  {Object} options class options
	 * @param  {String} options.region The AWS region where your secrets saved (default: AWS_PROFILE environment variable or 'us-west-2' if unset).
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

		this.region = options.region || process.env.AWS_REGION || DEFAULT_REGION;
		
		if (options.all) {
			this.env = null;
		}
		
		if (options.namespace && options.namespace.length) {
			
			if (Array.isArray(options.namespace)) {
				this.namespace = options.namespace.join(this.delimiter);
			}
			
			this.namespace = options.namespace;

		}
		
		this.retryAttempts = 0;

		this.secretsmanager = new SecretsManager({region: this.region});

	}

	static get MAX_RETRY_ATTEMPTS () { return MAX_RETRY_ATTEMPTS; }

	/**	
	 * configSync - config configuration data with all secrets from AWS Secrets Manager
	 * 	 
	 * @return {Object}	config object
	 */	
	configSync() {
		
		const args = {
			method: 'config',
			options: {
				env: this.env,
				region: this.region,
				namespace: this.namespace,
				delimiter: this.delimiter
			}
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
	 * @return {Promise<Object>} config object
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
		
		// retrieve the secrets for the entire list
		for (let item of list) {
			promises.push( this.getSecret({id: item.Name, raw:true}) );
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
	 * getSecret - retrieve a secret from AWS Secrets Manager
	 * 	 
	 * @param  {Object} options={}
	 * @param  {String} options.id The id of the secret to retrieve
	 * @param  {String} options.version The secret version 
	 * @param  {String} options.stage staging label attached to the version
	 * @param  {String} options.raw return all the raw data from AWS instead of 
	 * 	just the secret
	 * @return {Promise} A Promise containing secret details
	 */	 
	async getSecret (options={}) {
		
		let secret,
			params = {
				SecretId: options.id, 
			};
		
		if (options.version) {
			params.VersionId = options.version;
		} else if (options.stage) {
			params.VersionStage = options.stage;
		}
		
		try {
			secret = await this.secretsmanager.getSecretValue(params);
		} catch (err) {

			if (
				err.errorMessage &&
				err.errorMessage === 'Rate exceeded' &&
				this.retryAttempts <= this.MAX_RETRY_ATTEMPTS
			) {
				
				this.retryAttempts++;
				console.error(new Error( `Rate limit exceeded. Retry attempt ${this.retryAttempts} of ${this.MAX_RETRY_ATTEMPTS}.`) );
				return new Promise( (resolve, reject) => {
					setTimeout( () => {
						this.getSecret(options)
							.then(resolve)
							.catch(reject);
					}, 1050);
				});

			}

			return Promise.reject(err);
		}
		
		if (options.raw) {
			return Promise.resolve(secret);
		}
		
		return Promise.resolve(secret.SecretString);

	}

	/**	
	 * getSecretSync - Synchronously retrieve a secret from AWS Secrets Manager
	 * 	 
	 * @param  {Object} options={}
	 * @param  {String} options.id The id of the secret to retrieve
     * @param  {Number} options.maxBuffer The maxBuffer for the spawned process
	 * @param  {String} options.version The secret version 
	 * @param  {String} options.stage staging label attached to the version
	 * @param  {String} options.raw return all the raw data from AWS instead of just the secret
	 * @return {Object} A Promise containing secret details
	 */	 
	getSecretSync (options={}) {

        const maxBuffer = options.maxBuffer || 15; // max size is 10 Kb
        delete options.maxBuffer;
		const args = {
			method: 'getSecret',
			options: {
				region: this.region,
			},
			arguments: options
		};
		
		const result = spawnSync( 'node', [ __dirname + '/readline' ], {
			input: JSON.stringify(args),
			maxBuffer
		});

		let res = JSON.parse( result.stdout.toString() );
		
		if( res.error ) {
			throw new Error( res.error.message || res.error.code );
		}

		// If the result is a JSON string try to parse it
		if ( Object.prototype.toString.call(res.config) === '[object String]' ) {
			try {
				res.config = JSON.parse(res.config);
			} catch (err) {}
		}
		
		return res.config || {};

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
	 * @param  {[Object]} tags secret tags
	 * @param  {Object:String} secrets secret string
	 * @param  {Buffer} secretsBinary secret secrets as binary
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
			
			if ( Object.prototype.toString.call(options.secrets) === '[object String]' ) {
				params.SecretString = options.secrets;
			} else {
				params.SecretString = JSON.stringify(options.secrets);
			}

		}

		return this.secretsmanager.createSecret(params);
	}


	
	/**	
	 * listSecrets - Retrieve a full list of all secrets
	 * 
	 * @async
	 * @return {Promise<[Object]>}
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
				try {
					res = await this.secretsmanager.listSecrets(params);
				}
				catch (err) {

					// if it fails for some reason try again but wait for a second
					// since it's likely a rate limit error

					if (err.code === 'ThrottlingException') {

						res = await new Promise( (resolve, reject) => {

							setTimeout( () => {
								this.secretsmanager.listSecrets(params)
									.then(resolve)
									.catch(reject);
							}, 1050);

						});

					} else {
						throw err;
					}

				}
			} catch( err ) {
				return Promise.reject(err);
			}
			
			secrets = secrets.concat(res.SecretList);
			
			nextToken = res.NextToken;
			
			
		} while (nextToken);
		
		// filter out any secrets that are not part of the namespace and env
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
	 * @param  {type} force=false force the secret to be immediately deleted
	 * @return {Promise} A Promise containing ARN, Name and DeletionDate
	 */	 
	deleteSecret (id, force=false) {

		let params = {
			SecretId: id,
		};
		
		if (force) {
			params.ForceDeleteWithoutRecovery = true;
		}
		
		return this.secretsmanager.deleteSecret(params);

	}


	/**	
	 * _parseSecrets - convert secret names into proper config object using 
	 * 
	 * @param  {Array} list the list of secrets returned from Secrets Manager
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
				config[name] = secret.SecretString;
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