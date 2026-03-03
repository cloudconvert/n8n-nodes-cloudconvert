import type { INodeProperties } from 'n8n-workflow';

export const pdfFields: INodeProperties[] = [
	{
		displayName: 'Conformance Level',
		name: 'pdfAConformanceLevel',
		type: 'options',
		default: '3b',
		options: [
			{
				name: 'PDF/A-1B',
				value: '1b',
			},
			{
				name: 'PDF/A-2B',
				value: '2b',
			},
			{
				name: 'PDF/A-3B',
				value: '3b',
			},
		],
		displayOptions: {
			show: {
				operation: ['pdf/a'],
			},
		},
		description: 'PDF/A conformance level to convert to',
	},
	{
		displayName: 'Auto Orient',
		name: 'pdfOcrAutoOrient',
		type: 'boolean',
		default: true,
		displayOptions: {
			show: {
				operation: ['pdf/ocr'],
			},
		},
		description: 'Whether to automatically detect and correct page orientation before OCR',
	},
	{
		displayName: 'Languages',
		name: 'pdfOcrLanguages',
		type: 'string',
		default: '',
		placeholder: 'eng,deu',
		displayOptions: {
			show: {
				operation: ['pdf/ocr'],
			},
		},
		description: 'Comma-separated list of language codes to use for OCR, for example "eng,deu"',
	},
	{
		displayName: 'Set Password',
		name: 'pdfEncryptSetPassword',
		type: 'string',
		typeOptions: {
			password: true,
		},
		default: '',
		displayOptions: {
			show: {
				operation: ['pdf/encrypt'],
			},
		},
		description: 'Password required to open the PDF',
	},
	{
		displayName: 'Set Owner Password',
		name: 'pdfEncryptSetOwnerPassword',
		type: 'string',
		typeOptions: {
			password: true,
		},
		default: '',
		displayOptions: {
			show: {
				operation: ['pdf/encrypt'],
			},
		},
		description:
			'Owner password used for permissions; with this password, all protections can be removed',
	},
	{
		displayName: 'Allow Extract',
		name: 'pdfEncryptAllowExtract',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				operation: ['pdf/encrypt'],
			},
		},
		description: 'Whether to allow extracting content from the PDF',
	},
	{
		displayName: 'Allow Accessibility',
		name: 'pdfEncryptAllowAccessibility',
		type: 'boolean',
		default: true,
		displayOptions: {
			show: {
				operation: ['pdf/encrypt'],
			},
		},
		description: 'Whether to allow accessibility features such as screen readers',
	},
	{
		displayName: 'Allow Modify',
		name: 'pdfEncryptAllowModify',
		type: 'string',
		default: '',
		placeholder: 'form',
		displayOptions: {
			show: {
				operation: ['pdf/encrypt'],
			},
		},
		description:
			'Level of modification allowed for the PDF (for example "form"); see CloudConvert docs for valid values',
	},
	{
		displayName: 'Allow Print',
		name: 'pdfEncryptAllowPrint',
		type: 'string',
		default: '',
		placeholder: 'full',
		displayOptions: {
			show: {
				operation: ['pdf/encrypt'],
			},
		},
		description:
			'Level of printing allowed for the PDF (for example "full"); see CloudConvert docs for valid values',
	},
	{
		displayName: 'Password',
		name: 'pdfDecryptPassword',
		type: 'string',
		typeOptions: {
			password: true,
		},
		default: '',
		displayOptions: {
			show: {
				operation: ['pdf/decrypt'],
			},
		},
		description: 'Password of the encrypted PDF file',
	},
	{
		displayName: 'Pages',
		name: 'pdfExtractPagesPages',
		type: 'string',
		default: '',
		placeholder: '1,2,5-7',
		displayOptions: {
			show: {
				operation: ['pdf/extract-pages'],
			},
		},
		description:
			'Single pages or page ranges to extract, for example "1,2,5-7"; page numbering starts at 1',
	},
	{
		displayName: 'Pages',
		name: 'pdfRotatePagesPages',
		type: 'string',
		default: '',
		placeholder: '1,2,5-7',
		displayOptions: {
			show: {
				operation: ['pdf/rotate-pages'],
			},
		},
		description:
			'Single pages or page ranges to rotate, for example "1,2,5-7"; page numbering starts at 1',
	},
	{
		displayName: 'Rotation',
		name: 'pdfRotatePagesRotation',
		type: 'string',
		default: '',
		placeholder: '+90',
		displayOptions: {
			show: {
				operation: ['pdf/rotate-pages'],
			},
		},
		description: 'Rotation angle to apply, for example "+90", "-90", or "180"',
	},
];

