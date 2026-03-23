import { json } from '@sveltejs/kit';
import { getAllSettings, setSetting } from '$lib/db/index.js';

export function GET() {
	return json(getAllSettings());
}

export async function PUT({ request }) {
	const { key, value } = await request.json();
	if (!key || value === undefined) {
		return json({ error: 'key and value are required' }, { status: 400 });
	}
	setSetting(key, value);
	return json({ success: true });
}
