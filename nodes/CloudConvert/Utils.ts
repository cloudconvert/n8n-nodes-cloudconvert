import type { IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import type { Readable } from 'stream';
import type { CreateTasksPayload, Job, Task, TaskResultFile } from './Interfaces';

export async function createJob(this: IExecuteFunctions, tasks: CreateTasksPayload): Promise<Job> {
	const credentialsType =
		(this.getNodeParameter('authentication', 0) as string) === 'oAuth2'
			? 'cloudConvertOAuth2Api'
			: 'cloudConvertApi';
	let createResponseData;
	try {
		createResponseData = await this.helpers.httpRequestWithAuthentication.call(
			this,
			credentialsType,
			{
				method: 'POST',
				url: 'https://api.cloudconvert.com/v2/jobs',
				json: true,
				body: {
					tag: 'n8n',
					tasks,
				},
			},
		);
	} catch (e) {
		if (e.cause.response?.data?.code) {
			throw new NodeOperationError(
				this.getNode(),
				`${e.cause.response.data.message} (Code: ${e.cause.response.data.code})`,
			);
		}
		throw e;
	}
	return createResponseData.data;
}

export async function uploadInputFile(this: IExecuteFunctions, uploadTask: Task, itemIndex = 0) {
	// Use native FormData and Blob (from Node's undici) instead of 'form-data' package
	const FormDataCtor = (globalThis as any).FormData;
	const BlobCtor = (globalThis as any).Blob;
	const formData = new FormDataCtor();

	for (const parameter in (uploadTask.result?.form?.parameters as Record<string, string>) || {}) {
		formData.append(parameter, uploadTask.result!.form!.parameters[parameter]);
	}

	if (this.getNodeParameter('inputBinaryData', itemIndex)) {
		const binaryPropertyName = this.getNodeParameter('inputBinaryPropertyName', itemIndex) as string;
		const binaryData = this.helpers.assertBinaryData(itemIndex, binaryPropertyName);
		const buffer = await this.helpers.getBinaryDataBuffer(itemIndex, binaryPropertyName);
		if (!binaryData.fileName)
			throw new NodeOperationError(this.getNode(), 'No file name given for input file.');

		const blob = new BlobCtor([buffer], { type: binaryData.mimeType || undefined });
		formData.append('file', blob, binaryData.fileName);
	} else {
		const content = this.getNodeParameter('inputFileContent', itemIndex) as string;
		const filename = this.getNodeParameter('inputFilename', itemIndex) as string;
		const blob = new BlobCtor([content], { type: 'text/plain' });
		formData.append('file', blob, filename);
	}

	await this.helpers.httpRequest({
		method: 'POST',
		url: uploadTask.result!.form!.url,
		body: formData as unknown as any,
	} as unknown as any);
}

export function getJobErrorMessage(job: Job): string {
	return job.tasks
		.map((task) => {
			if (task.status === 'error' && task.code !== 'INPUT_TASK_FAILED') {
				return task.message + ' (Code: ' + (task.code ?? '?') + ')';
			}
			return null;
		})
		.filter((msg: string | null) => msg !== null)
		.join('; ');
}

export async function waitForJob(this: IExecuteFunctions, id: string): Promise<Job> {
	const credentialsType =
		(this.getNodeParameter('authentication', 0) as string) === 'oAuth2'
			? 'cloudConvertOAuth2Api'
			: 'cloudConvertApi';
	const waitResponseData = await this.helpers.httpRequestWithAuthentication.call(
		this,
		credentialsType,
		{
			method: 'GET',
			url: `https://sync.api.cloudconvert.com/v2/jobs/${id}`,
		},
	);

	const job = waitResponseData.data as Job;

	if (job.status === 'error') {
		throw new NodeOperationError(this.getNode(), getJobErrorMessage(job));
	}
	return job;
}

export async function downloadOutputFile(this: IExecuteFunctions, exportUrl: TaskResultFile) {
	const downloadResponse = (await this.helpers.httpRequest({
		method: 'GET',
		url: exportUrl.url,
		returnFullResponse: true,
		encoding: 'stream',
	})) as { body: Readable; headers: { [key: string]: string } };
	return this.helpers.prepareBinaryData(
		downloadResponse.body,
		exportUrl.filename,
		downloadResponse.headers['content-type'],
	);
}

export function getJobUploadTask(job: Job, index = 0): Task | null {
	const uploadTasks = job.tasks.filter((task) => task.operation === 'import/upload');
	return uploadTasks[index] !== undefined ? uploadTasks[index] : null;
}

export function getJobExportUrls(job: Job): TaskResultFile[] {
	return job.tasks
		.filter((task) => task.operation === 'export/url' && task.status === 'finished')
		.flatMap((task) => task.result?.files ?? []);
}

// Simple deep merge to replace lodash.merge
export function mergeObjects<T extends Record<string, any>, U extends Record<string, any>>(
	target: T,
	source: U,
): T & U {
	const output: Record<string, any> = { ...target };
	for (const key of Object.keys(source)) {
		const sourceValue = (source as Record<string, any>)[key];
		const targetValue = (output as Record<string, any>)[key];
		if (
			sourceValue &&
			typeof sourceValue === 'object' &&
			!Array.isArray(sourceValue) &&
			targetValue &&
			typeof targetValue === 'object' &&
			!Array.isArray(targetValue)
		) {
			(output as Record<string, any>)[key] = mergeObjects(targetValue, sourceValue);
		} else {
			(output as Record<string, any>)[key] = sourceValue;
		}
	}
	return output as T & U;
}
