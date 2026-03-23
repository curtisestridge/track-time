import { getRunningTimer, getAllProjects, getAllTasks, getSetting } from '$lib/db/index.js';

export function load() {
	return {
		runningTimer: getRunningTimer() || null,
		projects: getAllProjects(true),
		tasks: getAllTasks(),
		companyName: getSetting('company_name') || 'My Company'
	};
}
