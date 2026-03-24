/**
 * Converts decimal hours to H:MM format.
 * e.g. 2.25 → "2:15", 0.5 → "0:30", 1.0 → "1:00"
 */
export function formatHours(decimalHours: number): string {
	const totalMinutes = Math.round(decimalHours * 60);
	const hours = Math.floor(totalMinutes / 60);
	const minutes = totalMinutes % 60;
	return `${hours}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Returns today's date as YYYY-MM-DD in local timezone.
 */
export function localDate(date: Date = new Date()): string {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, '0');
	const d = String(date.getDate()).padStart(2, '0');
	return `${y}-${m}-${d}`;
}
