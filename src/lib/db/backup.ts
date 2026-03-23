import fs from 'fs';
import path from 'path';

const DB_PATH = 'data/timetracker.db';
const BACKUP_DIR = 'data/backups';
const LAST_BACKUP_FILE = 'data/backups/.last_backup';

function getBackupFilename(): string {
	const date = new Date().toISOString().slice(0, 10);
	return path.join(BACKUP_DIR, `timetracker-${date}.db`);
}

export function runBackup(): { success: boolean; path?: string; message?: string } {
	try {
		if (!fs.existsSync(DB_PATH)) {
			return { success: false, message: 'Database file not found.' };
		}

		fs.mkdirSync(BACKUP_DIR, { recursive: true });

		const dest = getBackupFilename();
		fs.copyFileSync(DB_PATH, dest);
		fs.writeFileSync(LAST_BACKUP_FILE, new Date().toISOString());

		return { success: true, path: dest };
	} catch (err) {
		return { success: false, message: String(err) };
	}
}

export function shouldRunDailyBackup(): boolean {
	try {
		if (!fs.existsSync(LAST_BACKUP_FILE)) return true;
		const last = new Date(fs.readFileSync(LAST_BACKUP_FILE, 'utf-8').trim());
		const today = new Date().toISOString().slice(0, 10);
		const lastDate = last.toISOString().slice(0, 10);
		return lastDate !== today;
	} catch {
		return true;
	}
}
