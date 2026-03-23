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
