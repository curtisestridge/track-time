import { json } from '@sveltejs/kit';
import { startTimer } from '$lib/db/index.js';

export async function POST({ request }) {
	const { project_id, task_id, notes, offset_seconds } = await request.json();
	if (!project_id || !task_id) {
		return json({ error: 'project_id and task_id are required' }, { status: 400 });
	}
	const entry = startTimer(project_id, task_id, notes, offset_seconds || 0);
	return json(entry, { status: 201 });
}
