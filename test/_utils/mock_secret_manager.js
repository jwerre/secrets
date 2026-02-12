import { vi } from 'vitest';

// Mock the AWS SDK
export default function mockSecretManager() {
	vi.mock('@aws-sdk/client-secrets-manager', () => {
		const mockSecrets = new Map();

		class SecretsManager {
			async createSecret(params) {
				const secretId = params.Name;
				const secretData = {
					Name: secretId,
					ARN: `arn:aws:secretsmanager:us-east-1:123456789012:secret:${secretId}`,
					VersionId: `v${Date.now()}-${Math.random().toString(36).substring(7)}`,
					SecretString: params.SecretString || undefined,
					SecretBinary: params.SecretBinary || undefined,
					Description: params.Description,
					CreatedDate: new Date(),
				};

				mockSecrets.set(secretId, secretData);

				return {
					ARN: secretData.ARN,
					Name: secretData.Name,
					VersionId: secretData.VersionId,
				};
			}

			async getSecretValue(params) {
				const secret = mockSecrets.get(params.SecretId);
				if (!secret) {
					const error = new Error('ResourceNotFoundException');
					error.name = 'ResourceNotFoundException';
					throw error;
				}

				return {
					ARN: secret.ARN,
					Name: secret.Name,
					VersionId: secret.VersionId,
					SecretString: secret.SecretString,
					SecretBinary: secret.SecretBinary,
					CreatedDate: secret.CreatedDate,
				};
			}

			async listSecrets(params) {
				const secretList = Array.from(mockSecrets.values()).map((secret) => ({
					Name: secret.Name,
					ARN: secret.ARN,
				}));

				return {
					SecretList: secretList,
					NextToken: undefined,
				};
			}

			async deleteSecret(params) {
				const secret = mockSecrets.get(params.SecretId);
				if (!secret) {
					const error = new Error('ResourceNotFoundException');
					error.name = 'ResourceNotFoundException';
					throw error;
				}

				mockSecrets.delete(params.SecretId);

				return {
					ARN: secret.ARN,
					Name: secret.Name,
					DeletionDate: new Date(),
				};
			}
		}

		return { SecretsManager };
	});
}
