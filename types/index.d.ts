declare module '@jwerre/secrets' {
  import { SecretsManager } from '@aws-sdk/client-secrets-manager';

  export interface SecretsOptions {
    /**
     * The AWS region where your secrets are saved
     * @default process.env.AWS_REGION || 'us-west-2'
     */
    region?: string;

    /**
     * Delimiter used in key names
     * @default '/'
     */
    delimiter?: string;

    /**
     * The environment or stage the secret belongs to
     * e.g.: staging/database/secret
     * @default process.env.NODE_ENV
     */
    env?: string;

    /**
     * An optional namespace to be prepended
     * e.g.: my-namespace/production/database/secret
     */
    namespace?: string | string[];

    /**
     * Ignore the environment and retrieve all secrets
     * @default false
     */
    all?: boolean;

    /**
     * Largest the entire config can be in bytes
     * @default 3145728 (3 MB)
     */
    maxBuffer?: number;
  }

  export interface GetSecretOptions {
    /**
     * The id of the secret to retrieve
     */
    id: string;

    /**
     * The secret version
     */
    version?: string;

    /**
     * Staging label attached to the version
     */
    stage?: string;

    /**
     * Return all the raw data from AWS instead of just the secret
     * @default false
     */
    raw?: boolean;

    /**
     * For sync version: Largest amount of data in Bytes the secret can be
     * @default 65536
     */
    maxBuffer?: number;
  }

  export interface CreateSecretOptions {
    /**
     * Secret name (can be an array that will be joined with delimiter)
     */
    name: string | string[];

    /**
     * Secret description
     */
    description?: string;

    /**
     * Client request token for idempotency
     */
    token?: string;

    /**
     * KMS key ID for encryption
     */
    kms?: string;

    /**
     * Tags to attach to the secret
     */
    tags?: Array<{
      Key: string;
      Value: string;
    }>;

    /**
     * Secret value as string or object (will be JSON stringified)
     */
    secrets?: string | any;

    /**
     * Secret value as binary data
     */
    secretsBinary?: Buffer;
  }

  export interface SecretListItem {
    /**
     * The Amazon Resource Name (ARN) of the secret
     */
    ARN: string;

    /**
     * The name of the secret
     */
    Name: string;

    /**
     * The description of the secret
     */
    Description?: string;

    /**
     * The date the secret was created
     */
    CreatedDate?: Date;

    /**
     * The date the secret was last accessed
     */
    LastAccessedDate?: Date;

    /**
     * The date the secret was last changed
     */
    LastChangedDate?: Date;

    /**
     * The date the secret was last rotated
     */
    LastRotatedDate?: Date;

    /**
     * Whether automatic rotation is enabled
     */
    RotationEnabled?: boolean;

    /**
     * The rotation Lambda function ARN
     */
    RotationLambdaARN?: string;

    /**
     * The rotation rules
     */
    RotationRules?: {
      AutomaticallyAfterDays?: number;
    };

    /**
     * The tags attached to the secret
     */
    Tags?: Array<{
      Key: string;
      Value: string;
    }>;
  }

  export interface RawSecret {
    /**
     * The ARN of the secret
     */
    ARN: string;

    /**
     * The name of the secret
     */
    Name: string;

    /**
     * The version ID of the secret
     */
    VersionId: string;

    /**
     * The secret value as a string
     */
    SecretString?: string;

    /**
     * The secret value as binary data
     */
    SecretBinary?: Buffer;

    /**
     * The date the secret was created
     */
    CreatedDate: Date;
  }

  export interface DeleteSecretResponse {
    /**
     * The ARN of the secret
     */
    ARN: string;

    /**
     * The name of the secret
     */
    Name: string;

    /**
     * The date the secret will be deleted
     */
    DeletionDate?: Date;
  }

  export interface CreateSecretResponse {
    /**
     * The ARN of the secret
     */
    ARN: string;

    /**
     * The name of the secret
     */
    Name: string;

    /**
     * The version ID of the secret
     */
    VersionId: string;
  }

  export class Secrets {
    /**
     * Maximum number of retry attempts for rate limiting
     */
    static readonly MAX_RETRY_ATTEMPTS: number;

    /**
     * Create a new Secrets instance
     */
    constructor(options?: SecretsOptions);

    /**
     * The delimiter used for secret names
     */
    delimiter: string;

    /**
     * The environment/stage
     */
    env?: string;

    /**
     * The AWS region
     */
    region: string;

    /**
     * The namespace prefix
     */
    namespace?: string;

    /**
     * Maximum buffer size in bytes
     */
    maxBuffer: number;

    /**
     * Current retry attempt count
     */
    retryAttempts: number;

    /**
     * AWS Secrets Manager client instance
     */
    secretsmanager: SecretsManager;

    /**
     * Asynchronously retrieve all secrets as a configuration object
     */
    config(options?: {}): Promise<any>;

    /**
     * Synchronously retrieve all secrets as a configuration object
     */
    configSync(): any;

    /**
     * Asynchronously retrieve a single secret
     */
    getSecret(options: GetSecretOptions): Promise<string | RawSecret>;

    /**
     * Synchronously retrieve a single secret
     */
    getSecretSync(options: GetSecretOptions): any;

    /**
     * Create a new secret
     */
    createSecret(options: CreateSecretOptions): Promise<CreateSecretResponse>;

    /**
     * List all secrets matching the namespace and environment
     */
    listSecrets(): Promise<SecretListItem[]>;

    /**
     * Delete a secret
     */
    deleteSecret(id: string, force?: boolean): Promise<DeleteSecretResponse>;
  }

  /**
   * Default export is the Secrets class
   */
  export default Secrets;

  /**
   * Convenience function to get configuration asynchronously
   */
  export function config(options?: SecretsOptions): Promise<any>;

  /**
   * Convenience function to get configuration synchronously
   */
  export function configSync(options?: SecretsOptions): any;

  /**
   * Convenience function to get a single secret synchronously
   */
  export function secretSync(options: GetSecretOptions & { region?: string }): any;
}

/**
 * Commander.js type augmentation for the CLI tools
 */
declare module 'commander' {
  export interface Command {
    opts(): any;
  }
}
