import { json } from '@sveltejs/kit';
import { getInvoice, getInvoiceLineItems, updateInvoiceStatus, deleteInvoice } from '$lib/db/index.js';

export function GET({ params }) {
	const id = Number(params.id);
	const invoice = getInvoice(id);
	if (!invoice) return json({ error: 'Invoice not found' }, { status: 404 });
	const line_items = getInvoiceLineItems(id);
	return json({ ...invoice, line_items });
}

export async function PUT({ params, request }) {
	const id = Number(params.id);
	const { status } = await request.json();
	if (!status) return json({ error: 'status is required' }, { status: 400 });
	const invoice = updateInvoiceStatus(id, status);
	if (!invoice) return json({ error: 'Invoice not found' }, { status: 404 });
	return json(invoice);
}

export function DELETE({ params }) {
	deleteInvoice(Number(params.id));
	return json({ success: true });
}
