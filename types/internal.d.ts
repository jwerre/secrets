/**
 * Internal type definitions for @jwerre/secrets
 */

/**
 * Input structure for readline module
 */
export interface ReadlineInput {
  /**
   * The method to call on the Secrets instance
   */
  method: 'config' | 'getSecret' | 'configSync' | 'getSecretSync';

  /**
   * Options to pass to the Secrets constructor
   */
  options?: {
    region?: string;
    env?: string;
    namespace?: string;
    delimiter?: string;
    all?: boolean;
    maxBuffer?: number;
  };

  /**
   * Arguments to pass to the method
   */
  arguments?: any;
}

/**
 * Output structure from readline module
 */
export interface ReadlineOutput {
  /**
   * The configuration or secret data
   */
  config?: any;

  /**
   * Error information if operation failed
   */
  error?: {
    message?: string;
    code?: string;
    [key: string]: any;
  };
}

/**
 * AWS Secrets Manager secret object structure
 */
export interface AWSSecret {
  /**
   * The Amazon Resource Name (ARN) of the secret
   */
  ARN: string;

  /**
   * The friendly name of the secret
   */
  Name: string;

  /**
   * The version ID of the secret
   */
  VersionId: string;

  /**
   * The secret data as a string
   */
  SecretString?: string;

  /**
   * The secret data as binary
   */
  SecretBinary?: Buffer;

  /**
   * Labels attached to this version of the secret
   */
  VersionStages?: string[];

  /**
   * The date this version of the secret was created
   */
  CreatedDate: Date;
}

/**
 * Parsed configuration object structure
 */
export interface ParsedConfig {
  [key: string]: string | number | boolean | ParsedConfig | any;
}

/**
 * Secret name parts after splitting by delimiter
 */
export interface SecretNameParts {
  namespace?: string;
  environment?: string;
  path: string[];
  key: string;
}

/**
 * Options for spawning child processes
 */
export interface SpawnOptions {
  /**
   * Input data to pass to the child process
   */
  input: string;

  /**
   * Maximum buffer size for stdout/stderr
   */
  maxBuffer: number;
}

/**
 * Result from spawnSync operation
 */
export interface SpawnResult {
  /**
   * The process exit code
   */
  status: number | null;

  /**
   * The signal that terminated the process
   */
  signal: string | null;

  /**
   * The stdout buffer
   */
  stdout: Buffer;

  /**
   * The stderr buffer
   */
  stderr: Buffer;

  /**
   * Any error that occurred
   */
  error?: Error;
}

/**
 * Rate limit error from AWS
 */
export interface RateLimitError extends Error {
  code?: string;
  errorMessage?: string;
  statusCode?: number;
  retryable?: boolean;
}

/**
 * Throttling error from AWS
 */
export interface ThrottlingError extends Error {
  code: 'ThrottlingException';
  message: string;
  statusCode?: number;
  retryable?: boolean;
}

/**
 * Secret validation result
 */
export interface SecretValidation {
  isValid: boolean;
  errors?: string[];
  warnings?: string[];
}

/**
 * Configuration merge options
 */
export interface MergeOptions {
  /**
   * Whether to deep merge objects
   */
  deep?: boolean;

  /**
   * Whether to overwrite existing values
   */
  overwrite?: boolean;

  /**
   * Custom merge function
   */
  customMerge?: (target: any, source: any, key: string) => any;
}
