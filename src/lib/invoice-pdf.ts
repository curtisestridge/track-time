import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { InvoiceLineItem } from './types.js';

interface InvoicePDFData {
	invoice_number: string;
	client_name: string;
	issue_date: string;
	due_date: string;
	notes: string | null;
	payment_instructions: string | null;
	line_items: InvoiceLineItem[];
	settings: Record<string, string>;
}

function formatDate(dateStr: string): string {
	const d = new Date(dateStr + 'T12:00:00');
	return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatCurrency(amount: number, symbol: string): string {
	return symbol + amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function generateInvoicePDF(data: InvoicePDFData): void {
	const doc = new jsPDF();
	const s = data.settings;
	const currency = s.currency_symbol || '$';
	const pageWidth = doc.internal.pageSize.getWidth();

	let y = 20;

	// Company name
	doc.setFontSize(20);
	doc.setFont('helvetica', 'bold');
	doc.text(s.company_name || 'My Company', 14, y);
	y += 7;

	// Company details
	doc.setFontSize(9);
	doc.setFont('helvetica', 'normal');
	doc.setTextColor(100);
	const companyLines: string[] = [];
	if (s.company_address_line1) companyLines.push(s.company_address_line1);
	if (s.company_address_line2) companyLines.push(s.company_address_line2);
	const cityLine = [s.company_city, s.company_state, s.company_zip].filter(Boolean).join(', ');
	if (cityLine) companyLines.push(cityLine);
	if (s.company_country) companyLines.push(s.company_country);
	if (s.company_email) companyLines.push(s.company_email);
	if (s.company_phone) companyLines.push(s.company_phone);
	if (s.company_website) companyLines.push(s.company_website);
	for (const line of companyLines) {
		doc.text(line, 14, y);
		y += 4;
	}

	// Invoice meta — top right
	doc.setTextColor(0);
	doc.setFontSize(10);
	const metaX = pageWidth - 14;
	let metaY = 20;
	doc.setFont('helvetica', 'bold');
	doc.text('INVOICE', metaX, metaY, { align: 'right' });
	metaY += 7;
	doc.setFont('helvetica', 'normal');
	doc.setFontSize(9);
	doc.text(`Invoice #:   ${data.invoice_number}`, metaX, metaY, { align: 'right' });
	metaY += 5;
	doc.text(`Issue Date:  ${formatDate(data.issue_date)}`, metaX, metaY, { align: 'right' });
	metaY += 5;
	doc.text(`Due Date:    ${formatDate(data.due_date)}`, metaX, metaY, { align: 'right' });

	// Bill To
	y = Math.max(y, metaY) + 12;
	doc.setFontSize(9);
	doc.setTextColor(100);
	doc.text('Bill To:', 14, y);
	y += 5;
	doc.setFontSize(11);
	doc.setTextColor(0);
	doc.setFont('helvetica', 'bold');
	doc.text(data.client_name, 14, y);
	doc.setFont('helvetica', 'normal');
	y += 10;

	// Line items table
	const total = data.line_items.reduce((sum, item) => sum + item.amount, 0);

	autoTable(doc, {
		startY: y,
		head: [['Description', 'Hours', 'Rate', 'Amount']],
		body: data.line_items.map(item => [
			item.description,
			item.hours.toFixed(2),
			formatCurrency(item.rate, currency),
			formatCurrency(item.amount, currency)
		]),
		theme: 'striped',
		headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold', fontSize: 9 },
		bodyStyles: { fontSize: 9 },
		columnStyles: {
			0: { cellWidth: 'auto' },
			1: { halign: 'right', cellWidth: 25 },
			2: { halign: 'right', cellWidth: 30 },
			3: { halign: 'right', cellWidth: 35 }
		},
		margin: { left: 14, right: 14 }
	});

	// Total block
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	y = (doc as any).lastAutoTable.finalY + 10;
	doc.setFontSize(12);
	doc.setFont('helvetica', 'bold');
	doc.text(`Total Due:   ${formatCurrency(total, currency)}`, pageWidth - 14, y, { align: 'right' });
	y += 12;

	// Payment instructions
	if (data.payment_instructions) {
		doc.setFontSize(9);
		doc.setFont('helvetica', 'bold');
		doc.setTextColor(100);
		doc.text('Payment Instructions:', 14, y);
		y += 5;
		doc.setFont('helvetica', 'normal');
		const lines = doc.splitTextToSize(data.payment_instructions, pageWidth - 28);
		doc.text(lines, 14, y);
		y += lines.length * 4 + 8;
	}

	// Notes
	if (data.notes) {
		doc.setFontSize(9);
		doc.setTextColor(100);
		doc.setFont('helvetica', 'normal');
		const noteLines = doc.splitTextToSize(data.notes, pageWidth - 28);
		doc.text(noteLines, 14, y);
	}

	// Download
	const clientSlug = data.client_name.replace(/[^a-zA-Z0-9]/g, '');
	doc.save(`${data.invoice_number}-${clientSlug}.pdf`);
}
