import { json } from '@sveltejs/kit';
import { runBackup } from '$lib/db/backup';

export function POST() {
	const result = runBackup();
	return json(result, { status: result.success ? 200 : 500 });
}
