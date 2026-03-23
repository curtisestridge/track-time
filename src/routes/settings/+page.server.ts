import { getAllSettings } from '$lib/db/index.js';

export function load() {
	return { settings: getAllSettings() };
}
