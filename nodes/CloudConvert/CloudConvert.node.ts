import type {
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
	IExecuteFunctions,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { thumbnailFields } from './operations/thumbnail/fields';
import { executeThumbnail } from './operations/thumbnail/execute';
import { executeConvert } from './operations/convert/execute';
import { executeMerge } from './operations/merge/execute';
import { executeArchive } from './operations/archive/execute';
import { executeOptimize } from './operations/optimize/execute';
import { watermarkFields } from './operations/watermark/fields';
import { executeWatermark } from './operations/watermark/execute';
import { executeMetadata } from './operations/metadata/execute';
import { executeCaptureWebsite } from './operations/capture-website/execute';
import { captureWebsiteFields } from './operations/capture-website/fields';
import { executePdfOperation } from './operations/pdf/execute';
import { pdfFields } from './operations/pdf/fields';
import { executeCommand } from './operations/command/execute';
import { commandFields } from './operations/command/fields';

export class CloudConvert implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'CloudConvert',
		name: 'cloudConvert',
		/* eslint-disable n8n-nodes-base/node-class-description-icon-not-svg */
		icon: { light: 'file:cloudconvert.svg', dark: 'file:cloudconvert_dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{ $parameter["operation"] }}',
		description:
			'Use CloudConvert to convert files, create thumbnails, merge files, add watermarks and more!',
		defaults: {
			name: 'CloudConvert',
		},
		inputs: ['main'],
		outputs: ['main'],
		usableAsTool: true,
		/**
		 * Auth
		 */
		credentials: [
			{
				name: 'cloudConvertApi',
				required: true,
				displayOptions: {
					show: {
						authentication: ['apiKey'],
					},
				},
			},
			{
				name: 'cloudConvertOAuth2Api',
				required: true,
				displayOptions: {
					show: {
						authentication: ['oAuth2'],
					},
				},
			},
		],
		properties: [
			{
				displayName: 'Authentication',
				name: 'authentication',
				type: 'options',
				options: [
					{
						name: 'OAuth2 (Recommended)',
						value: 'oAuth2',
					},
					{
						name: 'API Key',
						value: 'apiKey',
					},
				],
				default: 'oAuth2',
			},
			/*
			 * Resources
			 */
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Command',
						value: 'command',
					},
					{
						name: 'File',
						value: 'file',
					},
					{
						name: 'Metadata',
						value: 'metadata',
					},
					{
						name: 'PDF',
						value: 'pdf',
					},
					{
						name: 'Website',
						value: 'website',
					}
				],
				default: 'file',
			},
			/**
			 * File Operations
			 */
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['file'],
					},
				},
				options: [
					{
						name: 'Add Watermark',
						value: 'watermark',
						description: 'Add a watermark to a PDF file, to an image or to a video',
						action: 'Add watermark to a file',
					},
					{
						name: 'Convert File',
						value: 'convert',
						description: 'Convert a file to a different format',
						action: 'Convert a file',
					},
					{
						name: 'Create Archive',
						value: 'archive',
						description: 'Create an archive (ZIP, RAR...) for multiple files',
						action: 'Create archive',
					},
					{
						name: 'Create Thumbnail',
						value: 'thumbnail',
						description: 'Create a thumbnail of a file',
						action: 'Create a thumbnail',
					},
					{
						name: 'Optimize File',
						value: 'optimize',
						description: 'Optimize / compress a file to reduce its size',
						action: 'Optimize a file',
					},
				],
				default: 'convert',
				noDataExpression: true,
			},
			/**
			 * Metadata Operations
			 */
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['metadata'],
					},
				},
				options: [
					{
						name: 'Get Metadata',
						value: 'metadata',
						description: 'Extract metadata from files',
						action: 'Get metadata from a file',
					},
					{
						name: 'Write Metadata',
						value: 'metadata/write',
						description: 'Write metadata to files',
						action: 'Write metadata to a file',
					},
				],
				default: 'metadata',
				noDataExpression: true,
			},

			/**
			 * PDF Operations
			 */
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['pdf'],
					},
				},
				options: [
					{
						name: 'Add PDF OCR Layer',
						value: 'pdf/ocr',
						description: 'Add an OCR text layer to scanned PDF files',
						action: 'Add OCR layer to PDF',
					},
					{
						name: 'Convert PDF to PDF/A',
						value: 'pdf/a',
						description: 'Convert a PDF file to PDF/A-1B, PDF/A-2B or PDF/A-3B',
						action: 'Convert PDF to PDF/A',
					},
					{
						name: 'Decrypt PDF',
						value: 'pdf/decrypt',
						description: 'Decrypt a password-protected PDF file',
						action: 'Decrypt PDF',
					},
					{
						name: 'Encrypt PDF',
						value: 'pdf/encrypt',
						description: 'Encrypt a PDF file and optionally set a password and restrictions',
						action: 'Encrypt PDF',
					},
					{
						name: 'Extract Pages From PDF',
						value: 'pdf/extract-pages',
						description: 'Extract specific pages or page ranges from a PDF file',
						action: 'Extract pages from PDF',
					},
					{
						name: 'Merge Files',
						value: 'pdf/merge',
						description: 'Merge multiple files into a single PDF',
						action: 'Merge files to PDF',
					},
					{
						name: 'Rotate PDF Pages',
						value: 'pdf/rotate-pages',
						description: 'Rotate single pages or all pages of a PDF file',
						action: 'Rotate PDF pages',
					},
					{
						name: 'Split PDF Into Pages',
						value: 'pdf/split-pages',
						description: 'Split a PDF into one PDF file per page',
						action: 'Split PDF into pages',
					},
				],
				default: 'pdf/a',
				noDataExpression: true,
			},
			/**
			 * Command Operations
			 */
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['command'],
					},
				},
				options: [
					{
						name: 'Execute Command',
						value: 'command',
						description:
							'Execute a custom ffmpeg, ImageMagick or GraphicsMagick command on the input file',
						action: 'Execute command',
					},
				],
				default: 'command',
				noDataExpression: true,
			},
			/**
			 * Website Operations
			 */
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['website'],
					},
				},
				options: [
					{
						name: 'Capture Website',
						value: 'capture-website',
						description:
							'Creates job to capture a website as PDF or create a website screenshot as JPG or PNG',
						action: 'Capture website',
					}
				],
				default: 'capture-website',
				noDataExpression: true,
			},
			{
				// eslint-disable-next-line n8n-nodes-base/node-param-display-name-wrong-for-dynamic-options
				displayName: 'Output Format',
				name: 'outputFormat',
				type: 'options',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['convert', 'merge', 'archive', 'thumbnail', 'capture-website'],
					},
				},
				typeOptions: {
					loadOptionsDependsOn: ['operation'],
					loadOptionsMethod: 'loadOutputFormats',
				},
				placeholder: '',
				// eslint-disable-next-line n8n-nodes-base/node-param-description-wrong-for-dynamic-options
				description: 'Output format the file should be converted to',
			},
			/**
			 * Input file
			 */
			{
				displayName: 'Binary Input Data',
				name: 'inputBinaryData',
				type: 'boolean',
				default: true,
				displayOptions: {
					show: {
						operation: [
							'convert',
							'merge',
							'archive',
							'thumbnail',
							'optimize',
							'metadata',
							'metadata/write',
							'watermark',
							'command',
							'pdf/a',
							'pdf/ocr',
							'pdf/encrypt',
							'pdf/decrypt',
							'pdf/split-pages',
							'pdf/extract-pages',
							'pdf/rotate-pages',
						],
					},
				},
				description: 'Whether the input file to upload should be taken from binary field',
			},
			{
				displayName: 'Input File Contents',
				name: 'inputFileContent',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: [
							'convert',
							'merge',
							'archive',
							'thumbnail',
							'optimize',
							'metadata',
							'metadata/write',
							'watermark',
							'command',
							'pdf/a',
							'pdf/ocr',
							'pdf/encrypt',
							'pdf/decrypt',
							'pdf/split-pages',
							'pdf/extract-pages',
							'pdf/rotate-pages',
						],
						inputBinaryData: [false],
					},
				},
				placeholder: '',
				description: 'The text content of the file to upload',
			},
			{
				displayName: 'Input File Name',
				name: 'inputFilename',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: [
							'convert',
							'merge',
							'archive',
							'thumbnail',
							'optimize',
							'metadata',
							'metadata/write',
							'watermark',
							'command',
						],
						inputBinaryData: [false],
					},
				},
				placeholder: '',
				description: 'The input filename, including extension',
			},
			{
				displayName: 'Binary Property',
				name: 'inputBinaryPropertyName',
				type: 'string',
				default: 'data',
				required: true,
				displayOptions: {
					show: {
						operation: [
							'convert',
							'merge',
							'archive',
							'thumbnail',
							'optimize',
							'metadata',
							'metadata/write',
							'watermark',
							'command',
							'pdf/a',
							'pdf/ocr',
							'pdf/encrypt',
							'pdf/decrypt',
							'pdf/split-pages',
							'pdf/extract-pages',
							'pdf/rotate-pages',
						],
						inputBinaryData: [true],
					},
				},
				placeholder: '',
				description:
					'Name of the binary property which contains the data for the file to be converted',
			},
			/**
			 * Operation specific options
			 */

			...captureWebsiteFields,
			...thumbnailFields,
			...watermarkFields,
			...pdfFields,
			...commandFields,

			/**
			 * Metadata specific options
			 */
			{
				displayName: 'Metadata',
				name: 'metadata',
				type: 'json',
				default: '',
				displayOptions: {
					show: {
						resource: ['metadata'],
						operation: ['metadata/write'],
					},
				},
				placeholder: '{ "Author": "Jane Doe", "Title": "My Document" }',
				description:
					'JSON dictionary of metadata keys and values to write, for example Title, Author, Creator, Producer',
			},

			/**
			 * General additional options
			 */
			{
				displayName: 'Additional Options',
				name: 'additionalOptions',
				type: 'json',
				default: '',
				displayOptions: {
					show: {
						operation: [
							'convert',
							'thumbnail',
							'optimize',
							'watermark',
							'capture-website',
							'command',
						],
					},
				},
				placeholder: '{}',
				description:
					'JSON dictionary of additional options which will be added to the converting task. You can use the CloudConvert job builder to show and generate these options.',
			},
		],
	};

	methods = {
		loadOptions: {
			async loadOutputFormats(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const operation = this.getCurrentNodeParameter('operation') as string;
				const returnData: INodePropertyOptions[] = [];
				const credentialsType =
					(this.getCurrentNodeParameter('authentication') as string) === 'oAuth2'
						? 'cloudConvertOAuth2Api'
						: 'cloudConvertApi';
				const { data } = await this.helpers.httpRequestWithAuthentication.call(
					this,
					credentialsType,
					{
						method: 'GET',
						url: `https://api.cloudconvert.com/v2/operations?filter[operation]=${operation}`,
					},
				);

				// Create a set of unique output formats using native methods
				const uniqueFormats = Array.from(
					new Set(
						(data as Array<{ output_format?: string }>).map((item) => item.output_format || ''),
					),
				);
				for (const outputFormat of uniqueFormats) {
					returnData.push({
						name: outputFormat,
						value: outputFormat,
					});
				}
				return returnData;
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const operation = this.getNodeParameter('operation', 0);

		try {
			if (operation === 'convert') {
				return await executeConvert.call(this);
			} else if (operation === 'thumbnail') {
				return await executeThumbnail.call(this);
			} else if (operation === 'merge') {
				return await executeMerge.call(this);
			} else if (operation === 'archive') {
				return await executeArchive.call(this);
			} else if (operation === 'optimize') {
				return await executeOptimize.call(this);
			} else if (operation === 'watermark') {
				return await executeWatermark.call(this);
			} else if (operation === 'metadata' || operation === 'metadata/write') {
				return await executeMetadata.call(this);
			} else if (operation === 'capture-website') {
				return await executeCaptureWebsite.call(this);
			} else if (operation === 'command') {
				return await executeCommand.call(this);
			} else if (
				operation === 'pdf/a' ||
				operation === 'pdf/ocr' ||
				operation === 'pdf/encrypt' ||
				operation === 'pdf/decrypt' ||
				operation === 'pdf/split-pages' ||
				operation === 'pdf/extract-pages' ||
				operation === 'pdf/rotate-pages'
			) {
				return await executePdfOperation.call(this);
			} else {
				throw new NodeOperationError(this.getNode(), `Invalid operation ${operation}`);
			}
		} catch (error) {
			if (this.continueOnFail()) {
				return this.prepareOutputData([
					{
						json: {
							error: error.message,
						},
					},
				]);
			}
			throw error;
		}
	}
}
