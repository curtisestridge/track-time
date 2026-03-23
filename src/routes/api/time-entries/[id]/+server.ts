import { json } from '@sveltejs/kit';
import { getTimeEntry, updateTimeEntry, deleteTimeEntry } from '$lib/db/index.js';

export function GET({ params }) {
	const entry = getTimeEntry(Number(params.id));
	if (!entry) return json({ error: 'Entry not found' }, { status: 404 });
	return json(entry);
}

export async function PUT({ params, request }) {
	const id = Number(params.id);
	const data = await request.json();
	if (data.hours !== undefined && data.hours !== null && (data.hours <= 0 || data.hours > 24)) {
		return json({ error: 'Hours must be between 0 and 24' }, { status: 400 });
	}
	const entry = updateTimeEntry(id, data);
	if (!entry) return json({ error: 'Entry not found' }, { status: 404 });
	return json(entry);
}

export async function DELETE({ params }) {
	deleteTimeEntry(Number(params.id));
	return json({ success: true });
}
