import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		include: [`test/**/*.{test,spec}.js`],

		// Global test timeout since tests are dependent on external AWS API
		testTimeout: 4000,

		// Environment
		environment: 'node',

		// Reporter
		reporters: ['verbose'],

		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			include: ['lib/**/*.js'],
			exclude: ['tests/**'],
		},
	},
});
