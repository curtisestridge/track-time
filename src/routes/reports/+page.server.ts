import { getTimeEntriesByDateRange } from '$lib/db/index.js';

export function load({ url }) {
	const preset = url.searchParams.get('preset') || 'this-week';
	let start = url.searchParams.get('start') || '';
	let end = url.searchParams.get('end') || '';

	const today = new Date();
	const todayStr = today.toISOString().split('T')[0];

	if (preset !== 'custom' || !start || !end) {
		const day = today.getDay();
		if (preset === 'this-week') {
			const mondayOffset = day === 0 ? -6 : 1 - day;
			const monday = new Date(today);
			monday.setDate(today.getDate() + mondayOffset);
			const sunday = new Date(monday);
			sunday.setDate(monday.getDate() + 6);
			start = monday.toISOString().split('T')[0];
			end = sunday.toISOString().split('T')[0];
		} else if (preset === 'this-month') {
			start = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
			end = todayStr;
		} else if (preset === 'last-month') {
			const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
			const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
			start = lastMonth.toISOString().split('T')[0];
			end = lastDay.toISOString().split('T')[0];
		}
	}

	const entries = getTimeEntriesByDateRange(start, end);

	// Aggregate by project
	const byProject = new Map<string, { name: string; client: string; color: string; hours: number }>();
	const byClient = new Map<string, { name: string; color: string; hours: number }>();

	for (const e of entries) {
		if (!e.hours) continue;
		const pKey = e.project_name || 'Unknown';
		const cKey = e.client_name || 'Unknown';

		const existing = byProject.get(pKey);
		if (existing) {
			existing.hours += e.hours;
		} else {
			byProject.set(pKey, { name: pKey, client: cKey, color: e.client_color || '#6366f1', hours: e.hours });
		}

		const cExisting = byClient.get(cKey);
		if (cExisting) {
			cExisting.hours += e.hours;
		} else {
			byClient.set(cKey, { name: cKey, color: e.client_color || '#6366f1', hours: e.hours });
		}
	}

	const totalHours = entries.reduce((sum, e) => sum + (e.hours || 0), 0);

	const projectData = Array.from(byProject.values()).sort((a, b) => b.hours - a.hours);
	const clientData = Array.from(byClient.values()).sort((a, b) => b.hours - a.hours);

	return { preset, start, end, totalHours, projectData, clientData, entries };
}
