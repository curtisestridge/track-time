import { json } from '@sveltejs/kit';
import { getDb } from '$lib/db/index.js';

export function GET() {
	const row = getDb()
		.prepare('SELECT project_id, task_id FROM time_entries ORDER BY created_at DESC LIMIT 1')
		.get() as { project_id: number; task_id: number } | undefined;
	return json(row || null);
}
