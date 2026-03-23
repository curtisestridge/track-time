import { json } from '@sveltejs/kit';
import { getTimeEntriesByDate, getTimeEntriesByDateRange, createTimeEntry } from '$lib/db/index.js';

export function GET({ url }) {
	const date = url.searchParams.get('date');
	const start = url.searchParams.get('start');
	const end = url.searchParams.get('end');

	if (date) {
		return json(getTimeEntriesByDate(date));
	}
	if (start && end) {
		return json(getTimeEntriesByDateRange(start, end));
	}
	return json({ error: 'date or start+end params required' }, { status: 400 });
}

export async function POST({ request }) {
	const data = await request.json();
	if (!data.project_id || !data.task_id || !data.date) {
		return json({ error: 'project_id, task_id, and date are required' }, { status: 400 });
	}
	if (data.hours !== null && data.hours !== undefined && (data.hours <= 0 || data.hours > 24)) {
		return json({ error: 'Hours must be between 0 and 24' }, { status: 400 });
	}
	const entry = createTimeEntry(data);
	return json(entry, { status: 201 });
}
