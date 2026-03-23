import { json } from '@sveltejs/kit';
import { getRunningTimer } from '$lib/db/index.js';

export function GET() {
	const timer = getRunningTimer();
	return json(timer || null);
}
