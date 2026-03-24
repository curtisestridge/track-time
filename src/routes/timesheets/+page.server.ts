import { getTimeEntriesByDate, getWeekSummary, getAllProjects, getAllTasks } from '$lib/db/index.js';
import { localDate } from '$lib/utils.js';

export function load({ url, depends }) {
	depends('app:time-entries');
	const dateParam = url.searchParams.get('date');
	const date = dateParam || localDate();

	// Calculate week boundaries (Mon-Sun)
	const d = new Date(date + 'T12:00:00');
	const day = d.getDay();
	const mondayOffset = day === 0 ? -6 : 1 - day;
	const monday = new Date(d);
	monday.setDate(d.getDate() + mondayOffset);
	const sunday = new Date(monday);
	sunday.setDate(monday.getDate() + 6);

	const weekStart = localDate(monday);
	const weekEnd = localDate(sunday);

	const entries = getTimeEntriesByDate(date);
	const weekSummary = getWeekSummary(weekStart, weekEnd);
	const projects = getAllProjects();
	const tasks = getAllTasks();

	// Build week days array
	const today = localDate();
	const weekDays = [];
	for (let i = 0; i < 7; i++) {
		const wd = new Date(monday);
		wd.setDate(monday.getDate() + i);
		const ds = localDate(wd);
		const summary = weekSummary.find(s => s.date === ds);
		weekDays.push({
			date: ds,
			dayName: wd.toLocaleDateString('en-US', { weekday: 'short' }),
			dayNum: wd.getDate(),
			hours: summary?.total_hours || 0,
			isToday: ds === today,
			isSelected: ds === date
		});
	}

	const dailyTotal = entries.reduce((sum, e) => sum + (e.hours || 0), 0);

	return { date, entries, weekDays, dailyTotal, projects, tasks };
}
