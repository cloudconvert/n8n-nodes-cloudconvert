import FormData, { type Stream } from 'form-data';
import { IExecuteFunctions } from 'n8n-core';

import {
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

import { OptionsWithUri } from 'request';

export class CloudConvert implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'CloudConvert',
		name: 'cloudconvert',
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
		credentials: [
			{
				name: 'cloudConvertApi',
				required: true,
			},
		],
		// Basic node details will go here
		properties: [
			// Resources and operations will go here
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				options: [
					{
						name: 'Convert File',
						value: 'convert',
						description: 'Convert a file to a different format',
						action: 'Convert a file',
					},
				],
				default: 'convert',
				noDataExpression: true,
			},
			{
				displayName: 'Output Format',
				name: 'outputFormat',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['convert'],
					},
				},
				placeholder: '',
				description: 'Output format the file should be converted to',
			},
			{
				displayName: 'Binary Property',
				name: 'binaryPropertyName',
				type: 'string',
				default: 'data',
				required: true,
				displayOptions: {
					show: {
						operation: ['convert'],
					},
				},
				placeholder: '',
				description:
					'Name of the binary property which contains the data for the file to be converted',
			},
		],
	};
	// The execute method will go here
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		// Handle data coming from previous nodes
		const items = this.getInputData();
		const returnData = [];
		const operation = this.getNodeParameter('operation', 0) as string;

		// For each item
		for (let i = 0; i < items.length; i++) {
			let tasks = {};

			/*
			 * Create job
			 */

			if (['convert'].includes(operation)) {
				tasks['n8n-upload'] = {
					operation: 'import/upload',
				};
			}

			if (operation === 'convert') {
				tasks['n8n-process'] = {
					input: 'n8n-upload',
					operation: 'convert',
					output_format: this.getNodeParameter('outputFormat', i),
				};
			}

			tasks['n8n-export'] = {
				input: 'n8n-process',
				operation: 'export/url',
			};

			let createResponseData = await this.helpers.httpRequestWithAuthentication.call(
				this,
				'cloudConvertApi',
				{
					method: 'POST',
					url: 'https://api.cloudconvert.com/v2/jobs',
					json: true,
					body: {
						tag: 'n8n',
						tasks: tasks,
					},
				},
			);

			/*
			 * Upload file
			 */

			const uploadTask = createResponseData.data.tasks
				.filter((task: { name: string }) => task.name === 'n8n-upload')
				.shift();

			if (uploadTask) {
				const formData = new FormData();

				for (const parameter in uploadTask.result.form.parameters) {
					formData.append(parameter, uploadTask.result.form.parameters[parameter]);
				}

				const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;
				const binaryData = this.helpers.assertBinaryData(i, binaryPropertyName);
				let buffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);
				if (!binaryData.fileName)
					throw new NodeOperationError(this.getNode(), 'No file name given for input file.');

				formData.append('file', buffer, {
					contentType: binaryData.mimeType,
					filename: binaryData.fileName,
				});

				await this.helpers.httpRequest({
					method: 'POST',
					url: uploadTask.result.form.url,
					body: formData,

					headers: {
						...formData.getHeaders(),
					},
				});
			}

			/*
			 * Wait for job completion
			 */

			let waitResponseData = await this.helpers.httpRequestWithAuthentication.call(
				this,
				'cloudConvertApi',
				{
					method: 'GET',
					url: 'https://sync.api.cloudconvert.com/v2/jobs/' + createResponseData.data.id
				},
			);

			let job = waitResponseData.data;

			if (job.status === 'error') {
				throw new NodeOperationError(
					this.getNode(),
					job.tasks
						.map((task: { status: string; code: string; message: string }) => {
							if (task.status === 'error' && task.code !== 'INPUT_TASK_FAILED') {
								return task.message + ' (Code: ' + (task.code ?? '?') + ')';
							}
							return null;
						})
						.filter((msg: string | null) => msg !== null)
						.join('; '),
				);
			}

			/*
			 * Download output files
			 */

			let exportUrls = job.tasks
				.filter(
					(task: { operation: string; status: string }) =>
						task.operation === 'export/url' && task.status === 'finished',
				)
				.flatMap((task: { result: { files: any } }) => task.result?.files ?? []);

			for (let exportUrl of exportUrls) {
				let downloadResponse = await this.helpers.httpRequest({
					method: 'GET',
					url: exportUrl.url,
					returnFullResponse: true,
					encoding: 'stream',
				});

				const binaryData = await this.helpers.prepareBinaryData(
					downloadResponse.body,
					exportUrl.filename,
					downloadResponse.headers['content-type'],
				);

				returnData.push({
					json: {},
					binary: {
						data: binaryData,
					},
					pairedItem: {
						item: i,
					},
				});
			}
		}

		return this.prepareOutputData(returnData);
	}
}
