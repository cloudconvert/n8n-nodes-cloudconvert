import type { INodeProperties } from 'n8n-workflow';

export const commandFields: INodeProperties[] = [
	{
		displayName: 'Engine',
		name: 'commandEngine',
		type: 'options',
		default: 'ffmpeg',
		options: [
			{
				name: 'FFmpeg',
				value: 'ffmpeg',
			},
			{
				name: 'ImageMagick',
				value: 'imagemagick',
			},
			{
				name: 'GraphicsMagick',
				value: 'graphicsmagick',
			},
		],
		displayOptions: {
			show: {
				operation: ['command'],
			},
		},
		description:
			'Engine to use for executing the command, for example ffmpeg or ImageMagick',
	},
	{
		displayName: 'Command',
		name: 'commandBase',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				operation: ['command'],
			},
		},
		description:
			'Base command to execute, for example "ffmpeg" or "convert"; see CloudConvert docs for supported commands',
	},
	{
		displayName: 'Arguments',
		name: 'commandArguments',
		type: 'string',
		typeOptions: {
			rows: 4,
		},
		default: '',
		displayOptions: {
			show: {
				operation: ['command'],
			},
		},
		placeholder: '-i /input/n8n-upload/file.mp4 -vcodec libx264 -acodec copy /output/output.mp4',
		description:
			'Arguments to pass to the command. You can access input files via /input/{taskName}/ and must write output files to /output/ (see CloudConvert Execute Commands API).',
	},
	{
		displayName: 'Capture Console Output',
		name: 'commandCaptureOutput',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				operation: ['command'],
			},
		},
		description:
			'Whether to capture the console output of the command and return it in the result',
	},
];

