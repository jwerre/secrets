import globals from 'globals';
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';

export default [
	{
		ignores: ['dist/'],
	},
	{
		files: ['**/*.js'],
		languageOptions: {
			ecmaVersion: 2023,
			sourceType: 'module',
			parserOptions: {
				ecmaFeatures: {
					globalReturn: false,
					jsx: false,
				},
			},
			globals: {
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
	prettier,
];
