import { IExecuteFunctions } from 'n8n-core';
import keys from 'lodash.keys';
import keyBy from 'lodash.keyby';
import merge from 'lodash.merge';

import {
	IDataObject,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

import {
	createJob,
	downloadOutputFile,
	getJobExportUrls,
	getJobUploadTask,
	uploadInputFile,
	waitForJob,
} from './Utils';
import type { CreateTasksPayload } from './Interfaces';

export class CloudConvert implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'CloudConvert',
		name: 'cloudConvert',
		/* eslint-disable n8n-nodes-base/node-class-description-icon-not-svg */
		icon: 'file:cloudconvert.png',
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
						// eslint-disable-next-line n8n-nodes-base/node-param-display-name-miscased
						name: 'OAuth2 (recommended)',
						value: 'oAuth2',
					},
					{
						name: 'API Key',
						value: 'apiKey',
					},
				],
				default: 'oAuth2',
			},
			/**
			 * Operations
			 */
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				options: [
					{
						name: 'Add Watermark',
						value: 'watermark',
						description: 'Add a watermark to a PDF file, to an image or to a video',
						action: 'Add watermark to a file',
					},
					{
						name: 'Capture Website',
						value: 'capture-website',
						description:
							'Creates job to capture a website as PDF or create a website screenshot as JPG or PNG',
						action: 'Capture website',
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
						name: 'Get Metadata',
						value: 'metadata',
						description: 'Extract metadata from files',
						action: 'Get metadata from a file',
					},
					{
						name: 'Merge Files',
						value: 'merge',
						description: 'Merge multiple files into a single PDF',
						action: 'Merge files to PDF',
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
							'watermark',
						],
					},
				},
				description: 'Whether the input file to upload should be taken from binary field',
			},
			{
				displayName: 'Input File Content',
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
							'watermark',
						],
						inputBinaryData: [false],
					},
				},
				placeholder: '',
				description: 'The text content of the file to upload',
			},
			{
				displayName: 'Input Filename',
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
							'watermark',
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
							'watermark',
						],
						inputBinaryData: [true],
					},
				},
				placeholder: '',
				description:
					'Name of the binary property which contains the data for the file to be converted',
			},
			/**
			 * Capture Website options
			 */
			{
				displayName: 'URL',
				name: 'url',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['capture-website'],
					},
				},
				placeholder: 'https://...',
				description: 'The URL of the website',
			},
			/**
			 * Thumbnail options
			 */
			{
				displayName: 'Width',
				name: 'width',
				type: 'number',
				default: '',
				displayOptions: {
					show: {
						operation: ['thumbnail'],
					},
				},
				placeholder: '',
				description: 'Thumbnail width in pixels',
			},
			{
				displayName: 'Height',
				name: 'height',
				type: 'number',
				default: '',
				displayOptions: {
					show: {
						operation: ['thumbnail'],
					},
				},
				placeholder: '',
				description: 'Thumbnail height in pixels',
			},
			{
				displayName: 'Fit',
				name: 'fit',
				type: 'options',
				default: 'max',
				options: [
					{
						name: 'Max',
						value: 'max',
					},
					{
						name: 'Crop',
						value: 'crop',
					},
					{
						name: 'Scale',
						value: 'scale',
					},
				],
				displayOptions: {
					show: {
						operation: ['thumbnail'],
					},
				},
				description:
					'Sets the mode of resizing the image. "Max" resizes the image to fit within the width and height, but will not increase the size of the image if it is smaller than width or height. "Crop" resizes the image to fill the width and height dimensions and crops any excess image data. "Scale" enforces the image width and height by scaling.',
			},

			/**
			 * Watermark options
			 */
			{
				displayName: 'Watermark Image',
				name: 'useWatermarkImage',
				type: 'boolean',
				default: false,
				displayOptions: {
					show: {
						operation: ['watermark'],
					},
				},
				description: 'Whether the watermark should be an image',
			},
			{
				displayName: 'Image URL',
				name: 'imageUrl',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['watermark'],
						useWatermarkImage: [true],
					},
				},
				placeholder: 'https://...',
				description: 'The URL to the image (PNG, JPG, SVG) which should be added as watermark',
			},
			{
				displayName: 'Text',
				name: 'text',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['watermark'],
						useWatermarkImage: [false],
					},
				},
				placeholder: '',
				description: 'Sets the text to use as watermark',
			},
			{
				displayName: 'Font Size',
				name: 'font_size',
				type: 'number',
				default: 40,
				required: true,
				displayOptions: {
					show: {
						operation: ['watermark'],
						useWatermarkImage: [false],
					},
				},
				placeholder: '',
				description: 'Watermark font size',
			},
			{
				displayName: 'Font Color',
				name: 'font_color',
				type: 'color',
				default: '#000000',
				displayOptions: {
					show: {
						operation: ['watermark'],
						useWatermarkImage: [false],
					},
				},
				placeholder: '',
				description: 'Watermark font size',
			},
			{
				displayName: 'Vertical Position',
				name: 'position_vertical',
				type: 'options',
				default: 'center',
				options: [
					{
						name: 'Top',
						value: 'top',
					},
					{
						name: 'Center',
						value: 'center',
					},
					{
						name: 'Bottom',
						value: 'bottom',
					},
				],
				displayOptions: {
					show: { operation: ['watermark'] },
				},
				description: 'Vertical position of the watermark',
			},
			{
				displayName: 'Horizontal Position',
				name: 'position_horizontal',
				type: 'options',
				default: 'center',
				options: [
					{
						name: 'Left',
						value: 'left',
					},
					{
						name: 'Center',
						value: 'center',
					},
					{
						name: 'Right',
						value: 'right',
					},
				],
				displayOptions: {
					show: { operation: ['watermark'] },
				},
				description: 'Horizontal position of the watermark',
			},
			{
				displayName: 'Vertical Margin',
				name: 'margin_vertical',
				type: 'number',
				default: 25,
				displayOptions: {
					show: {
						operation: ['watermark'],
					},
				},
				placeholder: '',
				description: 'Spacing to the left and to the right of the watermark',
			},
			{
				displayName: 'Horizontal Margin',
				name: 'margin_horizontal',
				type: 'number',
				default: 25,
				displayOptions: {
					show: {
						operation: ['watermark'],
					},
				},
				placeholder: '',
				description: 'Spacing to the top and to the bottom of the watermark',
			},
			{
				displayName: 'Opacity',
				name: 'opacity',
				type: 'number',
				default: 100,
				displayOptions: {
					show: {
						operation: ['watermark'],
					},
				},
				placeholder: '',
				description:
					'Opacity in % to make the watermark transparent. A value of 100 means it is fully visible.',
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
							'metadata',
							'watermark',
							'capture-website',
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
				const { data } = await this.helpers.request({
					method: 'GET',
					json: true,
					url: `https://api.cloudconvert.com/v2/operations?filter[operation]=${operation}`,
				});

				for (const outputFormat of keys(keyBy(data, 'output_format'))) {
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
		const items = this.getInputData();
		const returnData = [];
		const operation = this.getNodeParameter('operation', 0) as string;

		if (['merge', 'archive'].includes(operation)) {
			/**
			 *
			 * Operations: merge, archive
			 *
			 * Create one job to merge all input items
			 *
			 */

			let tasks: CreateTasksPayload = {};

			for (let i = 0; i < items.length; i++) {
				tasks['n8n-upload-' + i] = {
					operation: 'import/upload',
				};
			}

			tasks['n8n-process'] = {
				input: Object.keys(tasks),
				operation: operation,
				output_format: this.getNodeParameter('outputFormat', 0),
			};

			tasks['n8n-export'] = {
				input: 'n8n-process',
				operation: 'export/url',
			};

			let createdJob = await createJob.call(this, tasks);

			for (let i = 0; i < items.length; i++) {
				const uploadTask = getJobUploadTask(createdJob, i);
				if (uploadTask) {
					await uploadInputFile.call(this, uploadTask, i);
				}
			}

			let completedJob = await waitForJob.call(this, createdJob.id);

			let exportUrl = getJobExportUrls(completedJob)[0]; // merge always results in one output file

			returnData.push({
				json: {},
				binary: {
					data: await downloadOutputFile.call(this, exportUrl),
				},
			});
		} else {
			/**
			 *
			 * Operations: convert, thumbnail, optimize, watermark, metadata, capture-website
			 *
			 * For each input item create a separte job
			 *
			 **/

			for (let i = 0; i < items.length; i++) {
				let tasks: CreateTasksPayload = {};

				tasks['n8n-process'] = {
					input: 'n8n-upload',
					operation: operation,
				};

				if (operation === 'capture-website') {
					tasks['n8n-process'].url = this.getNodeParameter('url', i);
				} else {
					tasks['n8n-upload'] = {
						operation: 'import/upload',
					};
				}

				if (['convert', 'thumbnail', 'capture-website'].includes(operation)) {
					tasks['n8n-process'].output_format = this.getNodeParameter('outputFormat', i);
				}

				if (operation === 'thumbnail') {
					for (let option of ['width', 'height', 'fit']) {
						if (this.getNodeParameter(option, i, null)) {
							tasks['n8n-process'][option] = this.getNodeParameter(option, i);
						}
					}
				}

				if (operation === 'watermark') {
					if(this.getNodeParameter('useWatermarkImage', i, false)) {
						tasks['n8n-watermark-image'] = {
							operation: 'import/url',
							url: this.getNodeParameter('imageUrl', i)
						};
						tasks['n8n-process'].image = 'n8n-watermark-image';
					}
					for (let option of [
						'text',
						'font_size',
						'font_color',
						'position_vertical',
						'position_horizontal',
						'margin_vertical',
						'margin_horizontal',
						'opacity',
					]) {
						if (this.getNodeParameter(option, i, null)) {
							tasks['n8n-process'][option] = this.getNodeParameter(option, i);
						}
					}
				}

				if (this.getNodeParameter('additionalOptions', i, null)) {
					let additionalOptions = this.getNodeParameter('additionalOptions', i) as string;
					try {
						additionalOptions = JSON.parse(additionalOptions);
					} catch (exception) {
						throw new NodeOperationError(this.getNode(), 'Additional Options must be a valid JSON');
					}
					tasks['n8n-process'] = merge(tasks['n8n-process'], additionalOptions);
				}

				if (operation !== 'metadata') {
					tasks['n8n-export'] = {
						input: 'n8n-process',
						operation: 'export/url',
					};
				}

				let createdJob = await createJob.call(this, tasks);

				const uploadTask = getJobUploadTask(createdJob);

				if (uploadTask) {
					await uploadInputFile.call(this, uploadTask, i);
				}

				let completedJob = await waitForJob.call(this, createdJob.id);

				if (operation === 'metadata') {
					const metadata = completedJob.tasks.filter(
						(task) => task.operation === 'metadata' && task.status === 'finished',
					)[0]?.result?.metadata as IDataObject;
					returnData.push({
						json: metadata,
						pairedItem: {
							item: i,
						},
					});
				} else {
					// download output files

					let exportUrls = getJobExportUrls(completedJob); // multiple output files possible, e.g. converting a multi page PDF to PNG

					for (let exportUrl of exportUrls) {
						returnData.push({
							json: {},
							binary: {
								data: await downloadOutputFile.call(this, exportUrl),
							},
							pairedItem: {
								item: i,
							},
						});
					}
				}
			}
		}

		return this.prepareOutputData(returnData);
	}
}
