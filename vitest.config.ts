import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		coverage: {
			provider: 'v8',
			include: ['src/lib/**/*'],
		},
		projects: [
			{
				test: {
					name: 'main',
					include: ['test/main.test.js'],
					environment: 'node',
				},
			},
			{
				test: {
					name: 'integration',
					include: ['test/integration.test.js'],
					environment: 'node',
				},
			},
		],
	},
});
