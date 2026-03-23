import { json } from '@sveltejs/kit';
import { getAllInvoices, createInvoice, getSetting, setSetting } from '$lib/db/index.js';

export function GET() {
	return json(getAllInvoices());
}

export async function POST({ request }) {
	const data = await request.json();
	if (!data.client_id || !data.issue_date || !data.due_date || !data.line_items?.length) {
		return json({ error: 'client_id, issue_date, due_date, and line_items are required' }, { status: 400 });
	}

	const prefix = getSetting('invoice_prefix') || 'INV-';
	const nextNum = parseInt(getSetting('invoice_next_number') || '1');
	const invoiceNumber = prefix + String(nextNum).padStart(4, '0');

	const invoice = createInvoice({
		invoice_number: invoiceNumber,
		client_id: data.client_id,
		issue_date: data.issue_date,
		due_date: data.due_date,
		notes: data.notes,
		payment_instructions: data.payment_instructions,
		line_items: data.line_items
	});

	setSetting('invoice_next_number', String(nextNum + 1));

	return json(invoice, { status: 201 });
}
