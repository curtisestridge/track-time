import { json } from '@sveltejs/kit';
import { updateProject, getProject } from '$lib/db/index.js';

export async function PUT({ params, request }) {
	const id = Number(params.id);
	const data = await request.json();
	const project = updateProject(id, data);
	if (!project) return json({ error: 'Project not found' }, { status: 404 });
	return json(project);
}

export function GET({ params }) {
	const project = getProject(Number(params.id));
	if (!project) return json({ error: 'Project not found' }, { status: 404 });
	return json(project);
}
