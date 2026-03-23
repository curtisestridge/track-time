export interface Client {
	id: number;
	name: string;
	color: string;
	hourly_rate: number;
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

export interface Invoice {
	id: number;
	invoice_number: string;
	client_id: number;
	status: string;
	issue_date: string;
	due_date: string;
	notes: string | null;
	payment_instructions: string | null;
	created_at: string;
	updated_at: string;
	// Joined fields
	client_name?: string;
	total?: number;
}

export interface InvoiceLineItem {
	id: number;
	invoice_id: number;
	description: string;
	hours: number;
	rate: number;
	amount: number;
}
