import { json } from '@sveltejs/kit';
import { getAllProjects, createProject } from '$lib/db/index.js';

export function GET({ url }) {
	const includeArchived = url.searchParams.get('includeArchived') === 'true';
	return json(getAllProjects(includeArchived));
}

export async function POST({ request }) {
	const { client_id, name, budget_hours } = await request.json();
	if (!client_id || !name) return json({ error: 'client_id and name are required' }, { status: 400 });
	const project = createProject(client_id, name, budget_hours);
	return json(project, { status: 201 });
}
