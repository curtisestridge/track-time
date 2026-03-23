import { json } from '@sveltejs/kit';
import { updateClient, getClient, getDb } from '$lib/db/index.js';

export async function PUT({ params, request }) {
	const id = Number(params.id);
	const data = await request.json();
	const client = updateClient(id, data);
	if (!client) return json({ error: 'Client not found' }, { status: 404 });
	return json(client);
}

export function GET({ params }) {
	const client = getClient(Number(params.id));
	if (!client) return json({ error: 'Client not found' }, { status: 404 });
	return json(client);
}

export function DELETE({ params }) {
	const id = Number(params.id);
	const client = getClient(id);
	if (!client) return json({ error: 'Client not found' }, { status: 404 });

	const db = getDb();
	const deleteClient = db.transaction((clientId: number) => {
		// Delete invoice line items for invoices belonging to this client
		db.prepare(`
			DELETE FROM invoice_line_items WHERE invoice_id IN (
				SELECT id FROM invoices WHERE client_id = ?
			)
		`).run(clientId);

		// Delete invoices for this client
		db.prepare('DELETE FROM invoices WHERE client_id = ?').run(clientId);

		// Delete time entries for projects under this client
		db.prepare(`
			DELETE FROM time_entries WHERE project_id IN (
				SELECT id FROM projects WHERE client_id = ?
			)
		`).run(clientId);

		// Delete tasks for projects under this client
		db.prepare(`
			DELETE FROM tasks WHERE project_id IN (
				SELECT id FROM projects WHERE client_id = ?
			)
		`).run(clientId);

		db.prepare('DELETE FROM projects WHERE client_id = ?').run(clientId);

		db.prepare('DELETE FROM clients WHERE id = ?').run(clientId);
	});

	deleteClient(id);
	return json({ success: true });
}
