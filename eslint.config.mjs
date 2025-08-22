import globals from 'globals';
import js from '@eslint/js';

export default [
	{
		ignores: ['dist/'],
	},
	{
		files: ['**/*.mjs'],
		languageOptions: {
			ecmaVersion: 11,
			sourceType: 'module',
			parserOptions: {
				ecmaFeatures: {
					globalReturn: false,
					impliedStrict: true,
					jsx: false,
				},
			},
			globals: {
				...globals.mocha,
				...globals.node,
			},
		},
		rules: {
			...js.configs.recommended.rules,
			indent: ['error', 'tab', { SwitchCase: 1 }],
			'linebreak-style': ['error', 'unix'],
			quotes: ['error', 'single'],
			semi: ['error', 'always'],
			'no-console': 'off',
			'no-unused-vars': [
				'error',
				{
					vars: 'all',
					args: 'none',
					ignoreRestSiblings: false,
				},
			],
		},
	},
];
