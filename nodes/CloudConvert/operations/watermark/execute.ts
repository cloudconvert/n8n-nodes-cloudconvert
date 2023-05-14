import { IExecuteFunctions, INodeExecutionData, NodeOperationError } from 'n8n-workflow';
import { CreateTasksPayload } from '../../Interfaces';
import merge from 'lodash.merge';
import {
	createJob,
	downloadOutputFile,
	getJobExportUrls,
	getJobUploadTask,
	uploadInputFile,
	waitForJob,
} from '../../Utils';

export async function executeWatermark(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
	const items = this.getInputData();
	const returnData = [];

	for (let i = 0; i < items.length; i++) {
		let tasks: CreateTasksPayload = {
			'n8n-upload': {
				operation: 'import/upload',
			},
			'n8n-process': {
				input: 'n8n-upload',
				operation: 'watermark',
			},
			'n8n-export': {
				input: 'n8n-process',
				operation: 'export/url',
			},
		};

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

		if (this.getNodeParameter('additionalOptions', i, null)) {
			let additionalOptions = this.getNodeParameter('additionalOptions', i) as string;
			try {
				additionalOptions = JSON.parse(additionalOptions);
			} catch (exception) {
				throw new NodeOperationError(this.getNode(), 'Additional Options must be a valid JSON');
			}
			tasks['n8n-process'] = merge(tasks['n8n-process'], additionalOptions);
		}

		let createdJob = await createJob.call(this, tasks);

		const uploadTask = getJobUploadTask(createdJob);

		if (uploadTask) {
			await uploadInputFile.call(this, uploadTask, i);
		}

		let completedJob = await waitForJob.call(this, createdJob.id);

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

	return this.prepareOutputData(returnData);
}