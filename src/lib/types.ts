export interface Client {
	id: number;
	name: string;
	color: string;
	archived: number;
	created_at: string;
}

export interface Project {
	id: number;
	client_id: number;
	name: string;
	budget_hours: number | null;
	archived: number;
	created_at: string;
	// Joined fields
	client_name?: string;
	client_color?: string;
	total_hours?: number;
}

export interface Task {
	id: number;
	project_id: number;
	name: string;
	created_at: string;
}

export interface TimeEntry {
	id: number;
	project_id: number;
	task_id: number;
	date: string;
	hours: number | null;
	notes: string | null;
	timer_started_at: string | null;
	created_at: string;
	updated_at: string;
	// Joined fields
	project_name?: string;
	client_name?: string;
	client_color?: string;
	task_name?: string;
}
