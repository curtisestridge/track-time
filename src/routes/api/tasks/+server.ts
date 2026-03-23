import { json } from '@sveltejs/kit';
import { getTasksByProject, createTask, updateTask, deleteTask } from '$lib/db/index.js';

export function GET({ url }) {
	const projectId = url.searchParams.get('project_id');
	if (!projectId) return json({ error: 'project_id is required' }, { status: 400 });
	return json(getTasksByProject(Number(projectId)));
}

export async function POST({ request }) {
	const { project_id, name } = await request.json();
	if (!project_id || !name) return json({ error: 'project_id and name are required' }, { status: 400 });
	return json(createTask(project_id, name), { status: 201 });
}

export async function PUT({ request }) {
	const { id, name } = await request.json();
	if (!id || !name) return json({ error: 'id and name are required' }, { status: 400 });
	return json(updateTask(id, name));
}

export async function DELETE({ url }) {
	const id = url.searchParams.get('id');
	if (!id) return json({ error: 'id is required' }, { status: 400 });
	deleteTask(Number(id));
	return json({ success: true });
}
