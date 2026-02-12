export const FIXTURES = [
	{
		name: 'secret1',
		description: 'testing objects',
		secrets: {
			key: 'peter@example.com',
			secret: 'pumpkins',
		},
	},
	{
		name: 'secret2',
		description: 'testing string',
		secrets: 'pumpkins',
	},
	{
		name: 'secret3',
		description: 'testing number',
		secrets: 4,
	},
	{
		name: 'secret4',
		description: 'testing boolean',
		secrets: true,
	},
	{
		name: 'secret5',
		description: 'testing array',
		secrets: [1, 2, 3],
	},
	{
		name: 'secret6',
		description: 'testing mixed',
		secrets: [1, 'peach', null, ['apple'], { yes: true }],
	},
	{
		name: 'nested/secret/1',
		description: 'testing nested number',
		secrets: 5,
	},
	{
		name: 'nested/secret/2',
		description: 'tested nested array',
		secrets: ['apple', 'peach', 'banana'],
	},
	{
		name: 'nested/secret/auth',
		description: 'tested nested object',
		secrets: {
			username: 'joe@example.com',
			password: 'p3@ches',
		},
	},
];

export const RESULT = {
	secret1: FIXTURES[0].secrets,
	secret2: FIXTURES[1].secrets,
	secret3: FIXTURES[2].secrets,
	secret4: FIXTURES[3].secrets,
	secret5: FIXTURES[4].secrets,
	secret6: FIXTURES[5].secrets,
	nested: {
		secret: {
			1: FIXTURES[6].secrets,
			2: FIXTURES[7].secrets,
			auth: FIXTURES[8].secrets,
		},
	},
};
