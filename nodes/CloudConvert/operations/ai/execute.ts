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

export async function executeAiAgent(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
	const items = this.getInputData();
	const returnData: INodeExecutionData[] = [];

	const prompt = this.getNodeParameter('aiPrompt', 0) as string;

	if (!prompt) {
		throw new NodeOperationError(this.getNode(), 'Prompt must be set for AI agent operations');
	}

	// Create one job for all input items: the agent may need all files at once (e.g. to merge them),
	// and jobs with ai/agent tasks are rate limited
	const tasks: CreateTasksPayload = {};

	for (let i = 0; i < items.length; i++) {
		tasks['n8n-upload-' + i.toString()] = {
			operation: 'import/upload',
		};
	}

	tasks['n8n-process'] = {
		input: Object.keys(tasks),
		operation: 'ai/agent',
		prompt,
	};

	tasks['n8n-export'] = {
		input: 'n8n-process',
		operation: 'export/url',
		// the export is cancelled if the agent finishes without output files, e.g. after answering a question
		ignore_error: true,
	};

	if (this.getNodeParameter('additionalOptions', 0, null)) {
		let additionalOptions = this.getNodeParameter('additionalOptions', 0) as string;
		try {
			additionalOptions = JSON.parse(additionalOptions);
		} catch (exception) {
			throw new NodeOperationError(this.getNode(), 'Additional Options must be a valid JSON');
		}
		tasks['n8n-process'] = mergeObjects(tasks['n8n-process'], additionalOptions as any);
	}

	const createdJob = await createJob.call(this, tasks);

	for (let i = 0; i < items.length; i++) {
		const uploadTask = getJobUploadTask(createdJob, i);
		if (uploadTask) {
			await uploadInputFile.call(this, uploadTask, i);
		}
	}

	const completedJob = await waitForJob.call(this, createdJob.id);

	const agentTask = completedJob.tasks.find(
		(task: Task) => task.operation === 'ai/agent' && task.status === 'finished',
	);

	const baseJson: IDataObject = {
		message: agentTask?.message ?? null,
		question: agentTask?.result?.question ?? false,
		suggestions: agentTask?.result?.suggestions ?? [],
		steps: (agentTask?.result?.steps ?? []) as IDataObject[],
	};

	const exportUrls = getJobExportUrls(completedJob);

	if (exportUrls.length === 0) {
		returnData.push({
			json: baseJson,
		});
	} else {
		for (const exportUrl of exportUrls) {
			returnData.push({
				json: baseJson,
				binary: {
					data: await downloadOutputFile.call(this, exportUrl),
				},
			});
		}
	}

	return this.prepareOutputData(returnData);
}
