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
	/**
	 * Speech to Text (ai/stt)
	 */
	{
		displayName: 'Output Format',
		name: 'aiSttOutputFormat',
		type: 'options',
		default: 'txt',
		options: [
			{
				name: 'JSON (Segments With Timestamps)',
				value: 'json',
			},
			{
				name: 'Plain Text (TXT)',
				value: 'txt',
			},
			{
				name: 'SubRip Subtitles (SRT)',
				value: 'srt',
			},
			{
				name: 'WebVTT Subtitles (VTT)',
				value: 'vtt',
			},
		],
		displayOptions: {
			show: {
				operation: ['ai/stt'],
			},
		},
		description: 'Format of the transcript',
	},
	{
		displayName: 'Language',
		name: 'aiSttLanguage',
		type: 'string',
		default: '',
		placeholder: 'en',
		displayOptions: {
			show: {
				operation: ['ai/stt'],
			},
		},
		description:
			'Language spoken in the file, as ISO 639-1 code (for example en, de, fr). If empty, the language is detected from the first 30 seconds of speech.',
	},
	{
		displayName: 'Translate to English',
		name: 'aiSttTranslate',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				operation: ['ai/stt'],
			},
		},
		description:
			'Whether to translate the speech to English instead of transcribing it in the spoken language',
	},
	{
		displayName: 'Word Timestamps',
		name: 'aiSttWordTimestamps',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				operation: ['ai/stt'],
				aiSttOutputFormat: ['json'],
			},
		},
		description: 'Whether to add the timestamps of each word to the segments',
	},
	{
		displayName: 'Max Line Length',
		name: 'aiSttMaxLineLength',
		type: 'number',
		default: 0,
		typeOptions: {
			minValue: 0,
			maxValue: 200,
		},
		displayOptions: {
			show: {
				operation: ['ai/stt'],
				aiSttOutputFormat: ['srt', 'vtt'],
			},
		},
		description:
			'Maximum number of characters of a subtitle (10 to 200). Longer segments are split at word boundaries. 0 keeps one subtitle per recognized segment.',
	},

	/**
	 * Text to Speech (ai/tts)
	 */
	{
		displayName: 'Text',
		name: 'aiTtsText',
		type: 'string',
		typeOptions: {
			rows: 4,
		},
		default: '',
		required: true,
		displayOptions: {
			show: {
				operation: ['ai/tts'],
			},
		},
		placeholder: 'Welcome to CloudConvert. Your file is ready for download.',
		description: 'The text to speak, up to 10,000 characters',
	},
	{
		displayName: 'Output Format',
		name: 'aiTtsOutputFormat',
		type: 'options',
		default: 'mp3',
		options: [
			{
				name: 'FLAC',
				value: 'flac',
			},
			{
				name: 'MP3',
				value: 'mp3',
			},
			{
				name: 'OGG (Opus)',
				value: 'ogg',
			},
			{
				name: 'WAV',
				value: 'wav',
			},
		],
		displayOptions: {
			show: {
				operation: ['ai/tts'],
			},
		},
		description: 'Format of the audio file',
	},
	{
		displayName: 'Voice',
		name: 'aiTtsVoice',
		type: 'options',
		default: 'ryan',
		options: [
			{
				name: 'Aiden',
				value: 'aiden',
				description: 'Male, sunny American voice with a clear midrange. Native language: English.',
			},
			{
				name: 'Dylan',
				value: 'dylan',
				description: 'Male, youthful with a Beijing accent. Native language: Chinese (Beijing dialect).',
			},
			{
				name: 'Eric',
				value: 'eric',
				description: 'Male, lively and slightly husky. Native language: Chinese (Sichuan dialect).',
			},
			{
				name: 'Ono Anna',
				value: 'ono_anna',
				description: 'Female, playful and light. Native language: Japanese.',
			},
			{
				name: 'Ryan',
				value: 'ryan',
				description: 'Male, energetic with a strong rhythm. Native language: English.',
			},
			{
				name: 'Serena',
				value: 'serena',
				description: 'Female, warm and gentle. Native language: Chinese.',
			},
			{
				name: 'Sohee',
				value: 'sohee',
				description: 'Female, warm with rich emotion. Native language: Korean.',
			},
			{
				name: 'Uncle Fu',
				value: 'uncle_fu',
				description: 'Male, mature with a low, mellow tone. Native language: Chinese.',
			},
			{
				name: 'Vivian',
				value: 'vivian',
				description: 'Female, bright and young with a slight edge. Native language: Chinese.',
			},
		],
		displayOptions: {
			show: {
				operation: ['ai/tts'],
			},
		},
		description:
			'The voice which speaks the text. Each voice speaks every supported language, and sounds best in its native language.',
	},
	{
		displayName: 'Language',
		name: 'aiTtsLanguage',
		type: 'options',
		default: 'auto',
		options: [
			{
				name: 'Chinese',
				value: 'zh',
			},
			{
				name: 'Detect Automatically',
				value: 'auto',
			},
			{
				name: 'English',
				value: 'en',
			},
			{
				name: 'French',
				value: 'fr',
			},
			{
				name: 'German',
				value: 'de',
			},
			{
				name: 'Italian',
				value: 'it',
			},
			{
				name: 'Japanese',
				value: 'ja',
			},
			{
				name: 'Korean',
				value: 'ko',
			},
			{
				name: 'Portuguese',
				value: 'pt',
			},
			{
				name: 'Russian',
				value: 'ru',
			},
			{
				name: 'Spanish',
				value: 'es',
			},
		],
		displayOptions: {
			show: {
				operation: ['ai/tts'],
			},
		},
		description: 'Language of the text',
	},
	{
		displayName: 'Instructions',
		name: 'aiTtsInstruct',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				operation: ['ai/tts'],
			},
		},
		placeholder: 'Calm and slow, like a bedtime story.',
		description:
			'How the text should be spoken, in plain language: tone, emotion, pace. At most 500 characters.',
	},

	/**
	 * Redact Personal Data (ai/redact)
	 */
	{
		displayName: 'Preset',
		name: 'aiRedactPreset',
		type: 'options',
		default: 'standard',
		options: [
			{
				name: 'Bank and Card Data Only',
				value: 'financial',
			},
			{
				name: 'Contact Details Only',
				value: 'contact',
			},
			{
				name: 'ID Numbers and Dates of Birth Only',
				value: 'identity',
			},
			{
				name: 'Names Only',
				value: 'names',
			},
			{
				name: 'Standard',
				value: 'standard',
				description:
					'Names, contact data, dates of birth, ID and tax numbers, bank and card data, credentials and IP addresses',
			},
			{
				name: 'Strict',
				value: 'strict',
				description:
					'Standard plus locations, other dates, account IDs and URLs, with lower confidence thresholds',
			},
			{
				name: 'Usernames, Passwords, Keys and IP Addresses Only',
				value: 'credentials',
			},
		],
		displayOptions: {
			show: {
				operation: ['ai/redact'],
			},
		},
		description:
			'Which personal data is removed. To list the types yourself, set "entities" in the Additional Options.',
	},
	{
		displayName: 'Replacement',
		name: 'aiRedactReplacement',
		type: 'options',
		default: 'label',
		options: [
			{
				name: 'Black Characters (█)',
				value: 'mask',
			},
			{
				name: 'Nothing',
				value: 'remove',
			},
			{
				name: 'Type, for Example [EMAIL]',
				value: 'label',
			},
		],
		displayOptions: {
			show: {
				operation: ['ai/redact'],
			},
		},
		description:
			'How removed text is replaced in TXT and MD files. In PDFs it is always a black box.',
	},
	{
		displayName: 'OCR Scanned Pages',
		name: 'aiRedactOcr',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				operation: ['ai/redact'],
			},
		},
		description:
			'Whether to run OCR on the PDF first, so that the text of scanned pages is redacted too. The OCR is billed as a separate PDF OCR task.',
	},
	{
		displayName: 'OCR Languages',
		name: 'aiRedactOcrLanguages',
		type: 'string',
		default: '',
		placeholder: 'eng,deu',
		displayOptions: {
			show: {
				operation: ['ai/redact'],
				aiRedactOcr: [true],
			},
		},
		description:
			'Comma-separated list of the languages of the scanned text as ISO 639-2 codes, for example "eng,deu". By default English.',
	},
	{
		displayName: 'Remove Metadata',
		name: 'aiRedactScrubMetadata',
		type: 'boolean',
		default: true,
		displayOptions: {
			show: {
				operation: ['ai/redact'],
			},
		},
		description: 'Whether to remove the metadata of the PDF (title, author, XMP)',
	},
	{
		displayName: 'Remove Attachments',
		name: 'aiRedactRemoveAttachments',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				operation: ['ai/redact'],
			},
		},
		description:
			'Whether to remove the files attached to the PDF. Attachments are not checked for personal data.',
	},
];
