import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
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

export async function executePdfOperation(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
	const items = this.getInputData();
	const returnData: INodeExecutionData[] = [];

	for (let i = 0; i < items.length; i++) {
		const nodeOperation = this.getNodeParameter('operation', i) as string;

		if (!nodeOperation.startsWith('pdf/')) {
			throw new NodeOperationError(this.getNode(), `Unsupported PDF operation: ${nodeOperation}`);
		}

		const tasks: CreateTasksPayload = {
			'n8n-upload': {
				operation: 'import/upload',
			},
			'n8n-process': {
				input: 'n8n-upload',
				operation: nodeOperation,
			},
			'n8n-export': {
				input: 'n8n-process',
				operation: 'export/url',
			},
		};

		// Operation-specific options
		if (nodeOperation === 'pdf/a') {
			const conformanceLevel = this.getNodeParameter('pdfAConformanceLevel', i, '') as string;
			if (conformanceLevel) {
				(tasks['n8n-process'] as any).conformance_level = conformanceLevel;
			}
		} else if (nodeOperation === 'pdf/ocr') {
			const autoOrient = this.getNodeParameter('pdfOcrAutoOrient', i, false) as boolean;
			(tasks['n8n-process'] as any).auto_orient = autoOrient;

			const languages = this.getNodeParameter('pdfOcrLanguages', i, '') as string;
			if (languages) {
				(tasks['n8n-process'] as any).language = languages
					.split(',')
					.map((l) => l.trim())
					.filter((l) => l !== '');
			}
		} else if (nodeOperation === 'pdf/encrypt') {
			const setPassword = this.getNodeParameter('pdfEncryptSetPassword', i, '') as string;
			if (setPassword) {
				(tasks['n8n-process'] as any).set_password = setPassword;
			}

			const setOwnerPassword = this.getNodeParameter('pdfEncryptSetOwnerPassword', i, '') as string;
			if (setOwnerPassword) {
				(tasks['n8n-process'] as any).set_owner_password = setOwnerPassword;
			}

			const allowExtract = this.getNodeParameter('pdfEncryptAllowExtract', i, false) as boolean;
			(tasks['n8n-process'] as any).allow_extract = allowExtract;

			const allowAccessibility = this.getNodeParameter(
				'pdfEncryptAllowAccessibility',
				i,
				false,
			) as boolean;
			(tasks['n8n-process'] as any).allow_accessibility = allowAccessibility;

			const allowModify = this.getNodeParameter('pdfEncryptAllowModify', i, '') as string;
			if (allowModify) {
				(tasks['n8n-process'] as any).allow_modify = allowModify;
			}

			const allowPrint = this.getNodeParameter('pdfEncryptAllowPrint', i, '') as string;
			if (allowPrint) {
				(tasks['n8n-process'] as any).allow_print = allowPrint;
			}
		} else if (nodeOperation === 'pdf/decrypt') {
			const password = this.getNodeParameter('pdfDecryptPassword', i, '') as string;
			if (password) {
				(tasks['n8n-process'] as any).password = password;
			}
		} else if (nodeOperation === 'pdf/split-pages') {
			// no specific options besides common ones
		} else if (nodeOperation === 'pdf/extract-pages') {
			const pages = this.getNodeParameter('pdfExtractPagesPages', i, '') as string;
			if (pages) {
				(tasks['n8n-process'] as any).pages = pages;
			}
		} else if (nodeOperation === 'pdf/rotate-pages') {
			const pages = this.getNodeParameter('pdfRotatePagesPages', i, '') as string;
			if (pages) {
				(tasks['n8n-process'] as any).pages = pages;
			}

			const rotation = this.getNodeParameter('pdfRotatePagesRotation', i, '') as string;
			if (rotation) {
				(tasks['n8n-process'] as any).rotation = rotation;
			}
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
	}

	return this.prepareOutputData(returnData);
}

