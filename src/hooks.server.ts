import { runBackup, shouldRunDailyBackup } from '$lib/db/backup';

if (shouldRunDailyBackup()) {
	const result = runBackup();
	if (result.success) {
		console.log(`[backup] Daily backup saved to ${result.path}`);
	} else {
		console.warn(`[backup] Daily backup failed: ${result.message}`);
	}
}
