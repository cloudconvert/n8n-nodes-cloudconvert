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

function splitList(value: string): string[] {
	return value
		.split(',')
		.map((entry) => entry.trim())
		.filter((entry) => entry !== '');
}

// ai/stt, ai/tts and ai/redact: one job per input item, like the conversion operations
export async function executeAiTask(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
	const items = this.getInputData();
	const returnData: INodeExecutionData[] = [];

	for (let i = 0; i < items.length; i++) {
		const operation = this.getNodeParameter('operation', i) as string;

		const processTask: CreateTasksPayload[string] = { operation };
		const tasks: CreateTasksPayload = {};

		if (operation === 'ai/tts') {
			// the text is part of the task, no input file needed
			const text = this.getNodeParameter('aiTtsText', i) as string;
			if (!text) {
				throw new NodeOperationError(this.getNode(), 'Text must be set for text to speech', {
					itemIndex: i,
				});
			}
			processTask.text = text;
			processTask.output_format = this.getNodeParameter('aiTtsOutputFormat', i);
			processTask.voice = this.getNodeParameter('aiTtsVoice', i);
			processTask.language = this.getNodeParameter('aiTtsLanguage', i);
			const instruct = this.getNodeParameter('aiTtsInstruct', i, '') as string;
			if (instruct) {
				processTask.instruct = instruct;
			}
		} else {
			tasks['n8n-upload'] = { operation: 'import/upload' };
			processTask.input = 'n8n-upload';

			if (operation === 'ai/stt') {
				const outputFormat = this.getNodeParameter('aiSttOutputFormat', i) as string;
				processTask.output_format = outputFormat;
				const language = this.getNodeParameter('aiSttLanguage', i, '') as string;
				if (language) {
					processTask.language = language.trim().toLowerCase();
				}
				processTask.translate = this.getNodeParameter('aiSttTranslate', i, false);
				if (outputFormat === 'json') {
					processTask.word_timestamps = this.getNodeParameter('aiSttWordTimestamps', i, false);
				}
				if (outputFormat === 'srt' || outputFormat === 'vtt') {
					const maxLineLength = this.getNodeParameter('aiSttMaxLineLength', i, 0) as number;
					if (maxLineLength) {
						processTask.max_line_length = maxLineLength;
					}
				}
			} else if (operation === 'ai/redact') {
				processTask.preset = this.getNodeParameter('aiRedactPreset', i);
				processTask.replacement = this.getNodeParameter('aiRedactReplacement', i);
				processTask.scrub_metadata = this.getNodeParameter('aiRedactScrubMetadata', i, true);
				processTask.remove_attachments = this.getNodeParameter(
					'aiRedactRemoveAttachments',
					i,
					false,
				);
				const ocr = this.getNodeParameter('aiRedactOcr', i, false) as boolean;
				processTask.ocr = ocr;
				if (ocr) {
					const ocrLanguages = splitList(
						this.getNodeParameter('aiRedactOcrLanguages', i, '') as string,
					);
					if (ocrLanguages.length) {
						processTask.ocr_language = ocrLanguages;
					}
				}
			} else {
				throw new NodeOperationError(this.getNode(), `Unsupported AI operation: ${operation}`, {
					itemIndex: i,
				});
			}
		}

		tasks['n8n-process'] = processTask;
		tasks['n8n-export'] = {
			input: 'n8n-process',
			operation: 'export/url',
		};

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

		// the result of the task besides its files: language and duration (ai/stt),
		// duration, characters and voice (ai/tts), the redactions per type (ai/redact)
		const resultTask = completedJob.tasks.find((task: Task) => task.name === 'n8n-process');
		const { files, ...result } = resultTask?.result ?? {};
		const json = result as IDataObject;

		for (const exportUrl of getJobExportUrls(completedJob)) {
			returnData.push({
				json,
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
