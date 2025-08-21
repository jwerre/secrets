# TypeScript Types for @jwerre/secrets

This directory contains TypeScript type definitions for the `@jwerre/secrets` package.

## Files

- **`index.d.ts`** - Main type definitions for the public API
- **`cli.d.ts`** - Type definitions for CLI command options
- **`internal.d.ts`** - Internal type definitions for module internals

## Usage

TypeScript types are automatically included when you install this package. Simply import the module and TypeScript will provide full type support:

```typescript
import Secrets from '@jwerre/secrets';
// or
import { config, configSync, secretSync } from '@jwerre/secrets';
```

## Type Definitions

### Main Classes and Interfaces

#### `Secrets` Class
The main class for interacting with AWS Secrets Manager.

```typescript
const secrets = new Secrets({
  region: 'us-west-2',
  env: 'production',
  namespace: 'my-app',
  delimiter: '/',
  all: false,
  maxBuffer: 3145728
});
```

#### `SecretsOptions` Interface
Configuration options for the Secrets class constructor.

```typescript
interface SecretsOptions {
  region?: string;       // AWS region (default: process.env.AWS_REGION || 'us-west-2')
  delimiter?: string;    // Key delimiter (default: '/')
  env?: string;         // Environment (default: process.env.NODE_ENV)
  namespace?: string | string[];  // Namespace prefix
  all?: boolean;        // Retrieve all secrets ignoring env (default: false)
  maxBuffer?: number;   // Max config size in bytes (default: 3MB)
}
```

#### `GetSecretOptions` Interface
Options for retrieving a single secret.

```typescript
interface GetSecretOptions {
  id: string;           // Secret ID (required)
  version?: string;     // Secret version
  stage?: string;       // Version stage
  raw?: boolean;        // Return raw AWS response (default: false)
  maxBuffer?: number;   // For sync version only
}
```

#### `CreateSecretOptions` Interface
Options for creating a new secret.

```typescript
interface CreateSecretOptions {
  name: string | string[];     // Secret name
  description?: string;        // Secret description
  token?: string;             // Client request token
  kms?: string;               // KMS key ID
  tags?: Array<{Key: string; Value: string}>;  // Tags
  secrets?: string | any;     // Secret value
  secretsBinary?: Buffer;     // Binary secret value
}
```

### CLI Type Definitions

The CLI commands have their own type definitions in `cli.d.ts`:

- `DeleteSecretsOptions` - Options for the `delete-secrets` command
- `GetConfigOptions` - Options for the `get-config` command
- `CreateSecretsOptions` - Options for the `create-secrets` command

### Type-Safe Configuration

You can create your own configuration interface for type-safe access:

```typescript
interface MyAppConfig {
  database: {
    host: string;
    port: number;
    username: string;
    password: string;
  };
  api: {
    key: string;
    endpoint: string;
  };
}

const secrets = new Secrets({ env: 'production' });
const config = await secrets.config() as MyAppConfig;

// Now you have type-safe access
console.log(config.database.host);  // TypeScript knows this is a string
```


## Type Checking

To verify your TypeScript code against these types:

```bash
# Install TypeScript if not already installed
npm install --save-dev typescript

# Run type checking
npx tsc --noEmit
```

## Contributing

When adding new features to the package, please ensure you:

1. Update the corresponding type definitions
2. Add JSDoc comments for better IDE support
4. Run type checking to ensure compatibility

## Version Compatibility

These type definitions are compatible with:
- TypeScript 4.0+
- Node.js 14+
- @aws-sdk/client-secrets-manager 3.x
