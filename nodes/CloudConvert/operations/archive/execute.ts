import { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { CreateTasksPayload } from '../../Interfaces';
import {
	createJob,
	downloadOutputFile,
	getJobExportUrls,
	getJobUploadTask,
	uploadInputFile,
	waitForJob,
} from '../../Utils';

export async function executeArchive(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
	const items = this.getInputData();
	const returnData = [];

	// Create one job to merge all input items
	let tasks: CreateTasksPayload = {};

	for (let i = 0; i < items.length; i++) {
		tasks['n8n-upload-' + i] = {
			operation: 'import/upload',
		};
	}

	tasks['n8n-process'] = {
		input: Object.keys(tasks),
		operation: 'archive',
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

	let exportUrl = getJobExportUrls(completedJob)[0]; // archive always results in one output file

	returnData.push({
		json: {},
		binary: {
			data: await downloadOutputFile.call(this, exportUrl),
		},
	});

	return this.prepareOutputData(returnData);
}
