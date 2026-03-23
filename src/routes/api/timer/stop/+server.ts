import { json } from '@sveltejs/kit';
import { stopTimer, getRunningTimer } from '$lib/db/index.js';

export async function POST() {
	const running = getRunningTimer();
	if (!running) {
		return json({ error: 'No timer is running' }, { status: 400 });
	}
	const entry = stopTimer(running.id);
	return json(entry);
}
