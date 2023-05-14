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

export async function executeCaptureWebsite(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
	const items = this.getInputData();
	const returnData = [];

	for (let i = 0; i < items.length; i++) {
		let tasks: CreateTasksPayload = {
			'n8n-process': {
				operation: 'capture-website',
				url: this.getNodeParameter('url', i),
				output_format: this.getNodeParameter('outputFormat', i),
			},
			'n8n-export': {
				input: 'n8n-process',
				operation: 'export/url',
			},
		};

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

		let exportUrls = getJobExportUrls(completedJob);

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
