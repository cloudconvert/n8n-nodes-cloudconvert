export interface CreateTasksPayload {
	[taskName: string]: {
		operation: string;
		input?: string | string[];
		[option: string]: any;
	};
}

export interface Task {
	id: string;
	name: string;
	operation: string;
	status: string;
	message: string;
	code: string;
	result?: {
		form?: TaskResultUploadForm;
		metadata?: {
			[key: string]: string;
		};
		files?: TaskResultFile[];
		// ai/agent tasks
		output_tasks?: string[];
		steps?: unknown[];
		suggestions?: string[];
		question?: boolean;
	};
}

export interface TaskResultFile {
	url: string;
	filename: string;
}

export interface TaskResultUploadForm {
	url: string;
	parameters: { [key: string]: string };
}

export interface Job {
	id: string;
	status: string;
	tasks: Task[];
}
