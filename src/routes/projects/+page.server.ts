import { getAllClients, getAllProjects, getAllTasks } from '$lib/db/index.js';

export function load() {
	return {
		clients: getAllClients(),
		projects: getAllProjects(true),
		tasks: getAllTasks()
	};
}
