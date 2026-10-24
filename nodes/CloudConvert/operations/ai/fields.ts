import type { INodeProperties } from 'n8n-workflow';

export const aiFields: INodeProperties[] = [
	{
		displayName: 'Prompt',
		name: 'aiPrompt',
		type: 'string',
		typeOptions: {
			rows: 4,
		},
		default: '',
		required: true,
		displayOptions: {
			show: {
				operation: ['ai/agent'],
			},
		},
		placeholder:
			'Convert all files to PDF and merge them into one PDF, in alphabetical order of the file names',
		description:
			'What should be done with the input files, in plain language. The agent creates the required CloudConvert tasks. All input items are processed together in one job.',
	},
];
