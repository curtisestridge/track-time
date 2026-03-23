import { json } from '@sveltejs/kit';
import { getAllClients, createClient } from '$lib/db/index.js';

export function GET() {
	return json(getAllClients());
}

export async function POST({ request }) {
	const { name, color, hourly_rate } = await request.json();
	if (!name) return json({ error: 'Name is required' }, { status: 400 });
	const client = createClient(name, color || '#6366f1', hourly_rate || 0);
	return json(client, { status: 201 });
}
