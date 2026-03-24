import type Database from 'better-sqlite3';
import { localDate } from '../utils.js';

export function initializeSchema(db: Database.Database): void {
	db.exec(`
		CREATE TABLE IF NOT EXISTS clients (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			color TEXT DEFAULT '#6366f1',
			archived INTEGER DEFAULT 0,
			created_at TEXT DEFAULT (datetime('now'))
		);

		CREATE TABLE IF NOT EXISTS projects (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			client_id INTEGER REFERENCES clients(id),
			name TEXT NOT NULL,
			budget_hours REAL,
			archived INTEGER DEFAULT 0,
			created_at TEXT DEFAULT (datetime('now'))
		);

		CREATE TABLE IF NOT EXISTS tasks (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			project_id INTEGER REFERENCES projects(id),
			name TEXT NOT NULL,
			created_at TEXT DEFAULT (datetime('now'))
		);

		CREATE TABLE IF NOT EXISTS time_entries (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			project_id INTEGER REFERENCES projects(id),
			task_id INTEGER REFERENCES tasks(id),
			date TEXT NOT NULL,
			hours REAL,
			notes TEXT,
			timer_started_at TEXT,
			created_at TEXT DEFAULT (datetime('now')),
			updated_at TEXT DEFAULT (datetime('now'))
		);

		CREATE TABLE IF NOT EXISTS settings (
			key TEXT PRIMARY KEY,
			value TEXT NOT NULL
		);

		INSERT OR IGNORE INTO settings (key, value) VALUES ('company_name', 'My Company');
		INSERT OR IGNORE INTO settings (key, value) VALUES ('company_address_line1', '');
		INSERT OR IGNORE INTO settings (key, value) VALUES ('company_address_line2', '');
		INSERT OR IGNORE INTO settings (key, value) VALUES ('company_city', '');
		INSERT OR IGNORE INTO settings (key, value) VALUES ('company_state', '');
		INSERT OR IGNORE INTO settings (key, value) VALUES ('company_zip', '');
		INSERT OR IGNORE INTO settings (key, value) VALUES ('company_country', 'United States');
		INSERT OR IGNORE INTO settings (key, value) VALUES ('company_email', '');
		INSERT OR IGNORE INTO settings (key, value) VALUES ('company_phone', '');
		INSERT OR IGNORE INTO settings (key, value) VALUES ('company_website', '');
		INSERT OR IGNORE INTO settings (key, value) VALUES ('currency_symbol', '$');
		INSERT OR IGNORE INTO settings (key, value) VALUES ('currency_code', 'USD');
		INSERT OR IGNORE INTO settings (key, value) VALUES ('invoice_prefix', 'INV-');
		INSERT OR IGNORE INTO settings (key, value) VALUES ('invoice_next_number', '1');
		INSERT OR IGNORE INTO settings (key, value) VALUES ('payment_terms', 'Net 30');
		INSERT OR IGNORE INTO settings (key, value) VALUES ('payment_instructions', '');
		INSERT OR IGNORE INTO settings (key, value) VALUES ('invoice_notes', '');

		CREATE TABLE IF NOT EXISTS invoices (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			invoice_number TEXT NOT NULL UNIQUE,
			client_id INTEGER REFERENCES clients(id),
			status TEXT DEFAULT 'draft',
			issue_date TEXT NOT NULL,
			due_date TEXT NOT NULL,
			notes TEXT,
			payment_instructions TEXT,
			created_at TEXT DEFAULT (datetime('now')),
			updated_at TEXT DEFAULT (datetime('now'))
		);

		CREATE TABLE IF NOT EXISTS invoice_line_items (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			invoice_id INTEGER REFERENCES invoices(id),
			description TEXT NOT NULL,
			hours REAL NOT NULL,
			rate REAL NOT NULL,
			amount REAL NOT NULL
		);
	`);

	// Add hourly_rate to clients if not exists
	const cols = db.prepare("PRAGMA table_info(clients)").all() as { name: string }[];
	if (!cols.find(c => c.name === 'hourly_rate')) {
		db.exec("ALTER TABLE clients ADD COLUMN hourly_rate REAL DEFAULT 0");
	}

	// Add resume_entry_id to time_entries if not exists
	const teCols = db.prepare("PRAGMA table_info(time_entries)").all() as { name: string }[];
	if (!teCols.find(c => c.name === 'resume_entry_id')) {
		db.exec("ALTER TABLE time_entries ADD COLUMN resume_entry_id INTEGER REFERENCES time_entries(id)");
	}
}

export function seedData(db: Database.Database): void {
	const clientCount = db.prepare('SELECT COUNT(*) as count FROM clients').get() as { count: number };
	if (clientCount.count > 0) return;

	// Seed clients
	const insertClient = db.prepare('INSERT INTO clients (name, color) VALUES (?, ?)');
	const client1 = insertClient.run('Acme Corp', '#6366f1');
	const client2 = insertClient.run('Globex Inc', '#f59e0b');

	// Seed projects
	const insertProject = db.prepare('INSERT INTO projects (client_id, name, budget_hours) VALUES (?, ?, ?)');
	const proj1 = insertProject.run(client1.lastInsertRowid, 'Website Redesign', 120);
	const proj2 = insertProject.run(client1.lastInsertRowid, 'Mobile App', 200);
	const proj3 = insertProject.run(client2.lastInsertRowid, 'Brand Strategy', 40);

	// Seed tasks
	const insertTask = db.prepare('INSERT INTO tasks (project_id, name) VALUES (?, ?)');
	insertTask.run(proj1.lastInsertRowid, 'Design');
	insertTask.run(proj1.lastInsertRowid, 'Development');
	insertTask.run(proj1.lastInsertRowid, 'QA Testing');
	insertTask.run(proj2.lastInsertRowid, 'UI Design');
	insertTask.run(proj2.lastInsertRowid, 'Backend API');
	insertTask.run(proj2.lastInsertRowid, 'Testing');
	insertTask.run(proj3.lastInsertRowid, 'Research');
	insertTask.run(proj3.lastInsertRowid, 'Presentation');

	// Seed a few time entries for today and recent days
	const today = localDate();
	const yesterday = localDate(new Date(Date.now() - 86400000));

	const insertEntry = db.prepare(
		'INSERT INTO time_entries (project_id, task_id, date, hours, notes) VALUES (?, ?, ?, ?, ?)'
	);
	insertEntry.run(proj1.lastInsertRowid, 1, today, 2.5, 'Homepage mockups');
	insertEntry.run(proj1.lastInsertRowid, 2, today, 1.75, 'Header component');
	insertEntry.run(proj2.lastInsertRowid, 5, yesterday, 3.0, 'Auth endpoints');
	insertEntry.run(proj3.lastInsertRowid, 7, yesterday, 1.5, 'Competitor analysis');
}
