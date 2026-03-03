import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import type { CreateTasksPayload, Task } from '../../Interfaces';
import {
	mergeObjects,
	createJob,
	downloadOutputFile,
	getJobExportUrls,
	getJobUploadTask,
	uploadInputFile,
	waitForJob,
} from '../../Utils';

export async function executeCommand(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
	const items = this.getInputData();
	const returnData: INodeExecutionData[] = [];

	for (let i = 0; i < items.length; i++) {
		const engine = this.getNodeParameter('commandEngine', i) as string;
		const commandBase = this.getNodeParameter('commandBase', i) as string;
		const argumentsParam = this.getNodeParameter('commandArguments', i, '') as string;
		const captureOutput = this.getNodeParameter('commandCaptureOutput', i, false) as boolean;

		if (!engine) {
			throw new NodeOperationError(this.getNode(), 'Engine must be set for command operations');
		}

		if (!commandBase) {
			throw new NodeOperationError(this.getNode(), 'Command must be set for command operations');
		}

		const tasks: CreateTasksPayload = {
			'n8n-upload': {
				operation: 'import/upload',
			},
			'n8n-process': {
				input: 'n8n-upload',
				operation: 'command',
				engine,
				command: commandBase,
			},
			'n8n-export': {
				input: 'n8n-process',
				operation: 'export/url',
			},
		};

		if (argumentsParam) {
			(tasks['n8n-process'] as IDataObject).arguments = argumentsParam;
		}

		if (captureOutput) {
			(tasks['n8n-process'] as IDataObject).capture_output = true;
		}

		if (this.getNodeParameter('additionalOptions', i, null)) {
			let additionalOptions = this.getNodeParameter('additionalOptions', i) as string;
			try {
				additionalOptions = JSON.parse(additionalOptions);
			} catch (exception) {
				throw new NodeOperationError(this.getNode(), 'Additional Options must be a valid JSON');
			}
			tasks['n8n-process'] = mergeObjects(tasks['n8n-process'], additionalOptions as any);
		}

		const createdJob = await createJob.call(this, tasks);

		const uploadTask = getJobUploadTask(createdJob);

		if (uploadTask) {
			await uploadInputFile.call(this, uploadTask, i);
		}

		const completedJob = await waitForJob.call(this, createdJob.id);

		const exportUrls = getJobExportUrls(completedJob);

		let baseJson: IDataObject = {};

		if (captureOutput) {
			const commandTask = completedJob.tasks.find(
				(task: Task) => task.operation === 'command' && task.status === 'finished',
			);
			if (commandTask?.result) {
				baseJson = commandTask.result as unknown as IDataObject;
			}
		}

		if (exportUrls.length === 0) {
			returnData.push({
				json: baseJson,
				pairedItem: {
					item: i,
				},
			});
		} else {
			for (const exportUrl of exportUrls) {
				returnData.push({
					json: baseJson,
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

	return this.prepareOutputData(returnData);
}

