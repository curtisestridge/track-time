import { getAllInvoices, getAllClients, getAllSettings } from '$lib/db/index.js';

export function load() {
	return {
		invoices: getAllInvoices(),
		clients: getAllClients().filter(c => !c.archived),
		settings: getAllSettings()
	};
}
