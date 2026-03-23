import { getTimeEntriesByDate, getWeekSummary, getAllProjects, getAllTasks } from '$lib/db/index.js';

export function load({ url, depends }) {
	depends('app:time-entries');
	const dateParam = url.searchParams.get('date');
	const date = dateParam || new Date().toISOString().split('T')[0];

	// Calculate week boundaries (Mon-Sun)
	const d = new Date(date + 'T12:00:00');
	const day = d.getDay();
	const mondayOffset = day === 0 ? -6 : 1 - day;
	const monday = new Date(d);
	monday.setDate(d.getDate() + mondayOffset);
	const sunday = new Date(monday);
	sunday.setDate(monday.getDate() + 6);

	const weekStart = monday.toISOString().split('T')[0];
	const weekEnd = sunday.toISOString().split('T')[0];

	const entries = getTimeEntriesByDate(date);
	const weekSummary = getWeekSummary(weekStart, weekEnd);
	const projects = getAllProjects();
	const tasks = getAllTasks();

	// Build week days array
	const weekDays = [];
	for (let i = 0; i < 7; i++) {
		const wd = new Date(monday);
		wd.setDate(monday.getDate() + i);
		const ds = wd.toISOString().split('T')[0];
		const summary = weekSummary.find(s => s.date === ds);
		weekDays.push({
			date: ds,
			dayName: wd.toLocaleDateString('en-US', { weekday: 'short' }),
			dayNum: wd.getDate(),
			hours: summary?.total_hours || 0,
			isToday: ds === new Date().toISOString().split('T')[0],
			isSelected: ds === date
		});
	}

	const dailyTotal = entries.reduce((sum, e) => sum + (e.hours || 0), 0);

	return { date, entries, weekDays, dailyTotal, projects, tasks };
}
