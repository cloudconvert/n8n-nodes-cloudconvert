import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import type { CreateTasksPayload } from '../../Interfaces';
import {
	createJob,
	downloadOutputFile,
	getJobExportUrls,
	getJobUploadTask,
	uploadInputFile,
	waitForJob,
} from '../../Utils';

export async function executeMetadata(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
	const items = this.getInputData();
	const returnData = [];

	for (let i = 0; i < items.length; i++) {
		const nodeOperation = this.getNodeParameter('operation', i) as string;

		if (nodeOperation === 'metadata') {
			const tasks: CreateTasksPayload = {
				'n8n-upload': {
					operation: 'import/upload',
				},
				'n8n-process': {
					input: 'n8n-upload',
					operation: 'metadata',
				},
			};


			const createdJob = await createJob.call(this, tasks);

			const uploadTask = getJobUploadTask(createdJob);

			if (uploadTask) {
				await uploadInputFile.call(this, uploadTask, i);
			}

			const completedJob = await waitForJob.call(this, createdJob.id);

			const metadata = completedJob.tasks.filter(
				(task) => task.operation === 'metadata' && task.status === 'finished',
			)[0]?.result?.metadata as IDataObject;
			returnData.push({
				json: metadata,
				pairedItem: {
					item: i,
				},
			});
		} else if (nodeOperation === 'metadata/write') {
			const tasks: CreateTasksPayload = {
				'n8n-upload': {
					operation: 'import/upload',
				},
				'n8n-process': {
					input: 'n8n-upload',
					operation: 'metadata/write',
				},
				'n8n-export': {
					input: 'n8n-process',
					operation: 'export/url',
				},
			};

			// Metadata to write
			if (this.getNodeParameter('metadata', i, null)) {
				let metadataParam = this.getNodeParameter('metadata', i) as string;
				try {
					metadataParam = JSON.parse(metadataParam);
				} catch {
					throw new NodeOperationError(this.getNode(), 'Metadata must be a valid JSON');
				}
				(tasks['n8n-process'] as any).metadata = metadataParam;
			}


			const createdJob = await createJob.call(this, tasks);

			const uploadTask = getJobUploadTask(createdJob);

			if (uploadTask) {
				await uploadInputFile.call(this, uploadTask, i);
			}

			const completedJob = await waitForJob.call(this, createdJob.id);

			const exportUrls = getJobExportUrls(completedJob);

			for (const exportUrl of exportUrls) {
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
		} else {
			throw new NodeOperationError(this.getNode(), `Unsupported metadata operation: ${nodeOperation}`);
		}
	}

	return this.prepareOutputData(returnData);
}
