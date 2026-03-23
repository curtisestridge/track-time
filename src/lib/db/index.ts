import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { initializeSchema, seedData } from './schema.js';
import type { Client, Project, Task, TimeEntry } from '../types.js';

const DB_PATH = path.resolve('data', 'timetracker.db');

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
	if (!_db) {
		const dir = path.dirname(DB_PATH);
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true });
		}
		_db = new Database(DB_PATH);
		_db.pragma('journal_mode = WAL');
		_db.pragma('foreign_keys = ON');
		initializeSchema(_db);
		seedData(_db);
	}
	return _db;
}

// ── Clients ──

export function getAllClients(): Client[] {
	return getDb().prepare('SELECT * FROM clients ORDER BY name').all() as Client[];
}

export function getClient(id: number): Client | undefined {
	return getDb().prepare('SELECT * FROM clients WHERE id = ?').get(id) as Client | undefined;
}

export function createClient(name: string, color: string): Client {
	const result = getDb().prepare('INSERT INTO clients (name, color) VALUES (?, ?)').run(name, color);
	return getClient(Number(result.lastInsertRowid))!;
}

export function updateClient(id: number, data: Partial<Pick<Client, 'name' | 'color' | 'archived'>>): Client | undefined {
	const fields: string[] = [];
	const values: unknown[] = [];
	if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
	if (data.color !== undefined) { fields.push('color = ?'); values.push(data.color); }
	if (data.archived !== undefined) { fields.push('archived = ?'); values.push(data.archived); }
	if (fields.length === 0) return getClient(id);
	values.push(id);
	getDb().prepare(`UPDATE clients SET ${fields.join(', ')} WHERE id = ?`).run(...values);
	return getClient(id);
}

// ── Projects ──

export function getAllProjects(includeArchived = false): Project[] {
	const where = includeArchived ? '' : 'WHERE p.archived = 0';
	return getDb().prepare(`
		SELECT p.*, c.name as client_name, c.color as client_color,
			COALESCE(SUM(te.hours), 0) as total_hours
		FROM projects p
		LEFT JOIN clients c ON p.client_id = c.id
		LEFT JOIN time_entries te ON te.project_id = p.id
		${where}
		GROUP BY p.id
		ORDER BY c.name, p.name
	`).all() as Project[];
}

export function getProjectsByClient(clientId: number): Project[] {
	return getDb().prepare(`
		SELECT p.*, c.name as client_name, c.color as client_color,
			COALESCE(SUM(te.hours), 0) as total_hours
		FROM projects p
		LEFT JOIN clients c ON p.client_id = c.id
		LEFT JOIN time_entries te ON te.project_id = p.id
		WHERE p.client_id = ?
		GROUP BY p.id
		ORDER BY p.name
	`).all(clientId) as Project[];
}

export function getProject(id: number): Project | undefined {
	return getDb().prepare(`
		SELECT p.*, c.name as client_name, c.color as client_color
		FROM projects p
		LEFT JOIN clients c ON p.client_id = c.id
		WHERE p.id = ?
	`).get(id) as Project | undefined;
}

export function createProject(clientId: number, name: string, budgetHours?: number): Project {
	const result = getDb().prepare(
		'INSERT INTO projects (client_id, name, budget_hours) VALUES (?, ?, ?)'
	).run(clientId, name, budgetHours ?? null);
	return getProject(Number(result.lastInsertRowid))!;
}

export function updateProject(id: number, data: Partial<Pick<Project, 'name' | 'budget_hours' | 'archived' | 'client_id'>>): Project | undefined {
	const fields: string[] = [];
	const values: unknown[] = [];
	if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
	if (data.budget_hours !== undefined) { fields.push('budget_hours = ?'); values.push(data.budget_hours); }
	if (data.archived !== undefined) { fields.push('archived = ?'); values.push(data.archived); }
	if (data.client_id !== undefined) { fields.push('client_id = ?'); values.push(data.client_id); }
	if (fields.length === 0) return getProject(id);
	values.push(id);
	getDb().prepare(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`).run(...values);
	return getProject(id);
}

// ── Tasks ──

export function getTasksByProject(projectId: number): Task[] {
	return getDb().prepare('SELECT * FROM tasks WHERE project_id = ? ORDER BY name').all(projectId) as Task[];
}

export function getAllTasks(): Task[] {
	return getDb().prepare('SELECT * FROM tasks ORDER BY name').all() as Task[];
}

export function createTask(projectId: number, name: string): Task {
	const result = getDb().prepare('INSERT INTO tasks (project_id, name) VALUES (?, ?)').run(projectId, name);
	return getDb().prepare('SELECT * FROM tasks WHERE id = ?').get(Number(result.lastInsertRowid)) as Task;
}

export function updateTask(id: number, name: string): Task {
	getDb().prepare('UPDATE tasks SET name = ? WHERE id = ?').run(name, id);
	return getDb().prepare('SELECT * FROM tasks WHERE id = ?').get(id) as Task;
}

export function deleteTask(id: number): void {
	getDb().prepare('DELETE FROM tasks WHERE id = ?').run(id);
}

// ── Time Entries ──

export function getTimeEntriesByDate(date: string): TimeEntry[] {
	return getDb().prepare(`
		SELECT te.*, p.name as project_name, c.name as client_name, c.color as client_color, t.name as task_name
		FROM time_entries te
		LEFT JOIN projects p ON te.project_id = p.id
		LEFT JOIN clients c ON p.client_id = c.id
		LEFT JOIN tasks t ON te.task_id = t.id
		WHERE te.date = ?
		ORDER BY te.created_at DESC
	`).all(date) as TimeEntry[];
}

export function getTimeEntriesByDateRange(start: string, end: string): TimeEntry[] {
	return getDb().prepare(`
		SELECT te.*, p.name as project_name, c.name as client_name, c.color as client_color, t.name as task_name
		FROM time_entries te
		LEFT JOIN projects p ON te.project_id = p.id
		LEFT JOIN clients c ON p.client_id = c.id
		LEFT JOIN tasks t ON te.task_id = t.id
		WHERE te.date >= ? AND te.date <= ?
		ORDER BY te.date DESC, te.created_at DESC
	`).all(start, end) as TimeEntry[];
}

export function getTimeEntry(id: number): TimeEntry | undefined {
	return getDb().prepare(`
		SELECT te.*, p.name as project_name, c.name as client_name, c.color as client_color, t.name as task_name
		FROM time_entries te
		LEFT JOIN projects p ON te.project_id = p.id
		LEFT JOIN clients c ON p.client_id = c.id
		LEFT JOIN tasks t ON te.task_id = t.id
		WHERE te.id = ?
	`).get(id) as TimeEntry | undefined;
}

export function createTimeEntry(data: {
	project_id: number;
	task_id: number;
	date: string;
	hours: number | null;
	notes?: string;
	timer_started_at?: string;
}): TimeEntry {
	const result = getDb().prepare(`
		INSERT INTO time_entries (project_id, task_id, date, hours, notes, timer_started_at)
		VALUES (?, ?, ?, ?, ?, ?)
	`).run(data.project_id, data.task_id, data.date, data.hours, data.notes ?? null, data.timer_started_at ?? null);
	return getTimeEntry(Number(result.lastInsertRowid))!;
}

export function updateTimeEntry(id: number, data: Partial<Pick<TimeEntry, 'project_id' | 'task_id' | 'date' | 'hours' | 'notes' | 'timer_started_at'>>): TimeEntry | undefined {
	const fields: string[] = ["updated_at = datetime('now')"];
	const values: unknown[] = [];
	if (data.project_id !== undefined) { fields.push('project_id = ?'); values.push(data.project_id); }
	if (data.task_id !== undefined) { fields.push('task_id = ?'); values.push(data.task_id); }
	if (data.date !== undefined) { fields.push('date = ?'); values.push(data.date); }
	if (data.hours !== undefined) { fields.push('hours = ?'); values.push(data.hours); }
	if (data.notes !== undefined) { fields.push('notes = ?'); values.push(data.notes); }
	if (data.timer_started_at !== undefined) { fields.push('timer_started_at = ?'); values.push(data.timer_started_at); }
	values.push(id);
	getDb().prepare(`UPDATE time_entries SET ${fields.join(', ')} WHERE id = ?`).run(...values);
	return getTimeEntry(id);
}

export function deleteTimeEntry(id: number): void {
	getDb().prepare('DELETE FROM time_entries WHERE id = ?').run(id);
}

// ── Timer ──

export function getRunningTimer(): TimeEntry | undefined {
	return getDb().prepare(`
		SELECT te.*, p.name as project_name, c.name as client_name, c.color as client_color, t.name as task_name
		FROM time_entries te
		LEFT JOIN projects p ON te.project_id = p.id
		LEFT JOIN clients c ON p.client_id = c.id
		LEFT JOIN tasks t ON te.task_id = t.id
		WHERE te.timer_started_at IS NOT NULL AND te.hours IS NULL
		LIMIT 1
	`).get() as TimeEntry | undefined;
}

export function startTimer(projectId: number, taskId: number, notes?: string, offsetSeconds = 0): TimeEntry {
	// Stop any existing timer first
	const running = getRunningTimer();
	if (running) {
		stopTimer(running.id);
	}

	const adjustedStart = new Date(Date.now() - offsetSeconds * 1000).toISOString();
	const today = new Date().toISOString().split('T')[0];
	return createTimeEntry({
		project_id: projectId,
		task_id: taskId,
		date: today,
		hours: null,
		notes: notes || '',
		timer_started_at: adjustedStart
	});
}

export function stopTimer(id: number): TimeEntry | undefined {
	const entry = getTimeEntry(id);
	if (!entry || !entry.timer_started_at) return entry;

	const started = new Date(entry.timer_started_at).getTime();
	const now = Date.now();
	const hours = Math.round(((now - started) / 3600000) * 100) / 100;

	getDb().prepare(`
		UPDATE time_entries SET hours = ?, timer_started_at = NULL, updated_at = datetime('now')
		WHERE id = ?
	`).run(hours, id);

	return getTimeEntry(id);
}

// ── Settings ──

export function getSetting(key: string): string | null {
	const row = getDb().prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined;
	return row?.value ?? null;
}

export function setSetting(key: string, value: string): void {
	getDb().prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value);
}

export function getAllSettings(): Record<string, string> {
	const rows = getDb().prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
	const result: Record<string, string> = {};
	for (const row of rows) result[row.key] = row.value;
	return result;
}

// ── Weekly Summary ──

export function getWeekSummary(weekStart: string, weekEnd: string): { date: string; total_hours: number }[] {
	return getDb().prepare(`
		SELECT date, COALESCE(SUM(hours), 0) as total_hours
		FROM time_entries
		WHERE date >= ? AND date <= ?
		GROUP BY date
		ORDER BY date
	`).all(weekStart, weekEnd) as { date: string; total_hours: number }[];
}
