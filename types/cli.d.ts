/**
 * Type definitions for the CLI commands in @jwerre/secrets
 */

/**
 * Options for the delete-secrets CLI command
 */
export interface DeleteSecretsOptions {
  /**
   * Verbose output
   */
  verbose?: boolean;

  /**
   * Which environment to use
   * @default 'development'
   */
  env?: string;

  /**
   * Force delete without recovery
   */
  force?: boolean;

  /**
   * Dry run mode
   */
  dry?: boolean;

  /**
   * Disable confirmation prompt
   */
  quiet?: boolean;

  /**
   * Namespace of all parameters
   */
  namespace?: string;

  /**
   * AWS region where secrets are stored
   * @default process.env.AWS_REGION || 'us-west-2'
   */
  region?: string;
}

/**
 * Options for the get-config CLI command
 */
export interface GetConfigOptions {
  /**
   * The AWS Secrets Manager region
   * @default process.env.AWS_REGION || 'us-west-2'
   */
  region?: string;

  /**
   * Which environment to use in the secret name
   * @default 'development'
   */
  env?: string;

  /**
   * Secret name delimiter
   * @default '/'
   */
  delimiter?: string;

  /**
   * Pretty output
   */
  pretty?: boolean;

  /**
   * Ignore the environment and retrieve all secrets
   * @default false
   */
  all?: boolean;

  /**
   * Namespace of all parameters
   */
  namespace?: string;

  /**
   * Display time it takes to retrieve config
   */
  time?: boolean;

  /**
   * Largest the entire config can be in bytes
   * @default 3145728 (3 MB)
   */
  maxBuffer?: number;
}

/**
 * Options for the create-secrets CLI command
 */
export interface CreateSecretsOptions {
  /**
   * Verbose output
   */
  verbose?: boolean;

  /**
   * The AWS Secrets Manager region
   * @default process.env.AWS_REGION || 'us-west-2'
   */
  region?: string;

  /**
   * Which environment to use in the secret name
   * @default 'development'
   */
  env?: string;

  /**
   * KMS key id to use for encryption
   */
  kms?: string;

  /**
   * Namespace of all parameters
   */
  namespace?: string;

  /**
   * Delimiter to use for secret name
   * @default '/'
   */
  delimiter?: string;

  /**
   * Input file path (alternative to argument)
   */
  in?: string;
}

/**
 * Parsed secret item for create-secrets
 */
export interface ParsedSecret {
  /**
   * The full key name including namespace and environment
   */
  key: string;

  /**
   * The secret value (can be string or object)
   */
  value: any;
}

/**
 * Configuration file format that can be loaded by create-secrets
 */
export interface ConfigFile {
  [key: string]: any;
}

/**
 * Result of a secret operation
 */
export interface SecretOperationResult {
  status: 'fulfilled' | 'rejected';
  value?: any;
  reason?: Error;
}
