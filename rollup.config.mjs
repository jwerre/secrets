import { nodeResolve } from '@rollup/plugin-node-resolve';
import json from '@rollup/plugin-json';

export default [
	// ES Module build
	{
		input: 'lib/index.mjs',
		output: {
			file: 'dist/index.mjs',
			format: 'es',
		},
		plugins: [nodeResolve(), json()],
		external: ['@aws-sdk/client-secrets-manager'], // Don't bundle external dependencies
	},
	// CommonJS build
	{
		input: 'lib/index.mjs',
		output: {
			file: 'dist/index.cjs',
			format: 'cjs',
			exports: 'named',
		},
		plugins: [nodeResolve(), json()],
		external: ['@aws-sdk/client-secrets-manager'],
	},

	// Copy readline.js to dist
	{
		input: 'lib/_read.mjs',
		output: {
			file: 'dist/_read.mjs',
			format: 'es',
		},
	},
];
