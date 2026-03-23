<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { Plus, Download, Trash2, Send, CheckCircle, X, ArrowLeft } from 'lucide-svelte';
	import type { Client, TimeEntry, Invoice, InvoiceLineItem } from '$lib/types.js';
	import { generateInvoicePDF } from '$lib/invoice-pdf.js';

	let { data } = $props();

	let invoices = $derived(data.invoices);
	let clients = $derived(data.clients as Client[]);
	let settings = $derived(data.settings);
	let currency = $derived(settings.currency_symbol || '$');

	// Create invoice state
	let showCreate = $state(false);
	let selectedClientId = $state('');
	let issueDate = $state(new Date().toISOString().split('T')[0]);
	let dueDate = $state('');
	let paymentInstructions = $state('');
	let invoiceNotes = $state('');
	let rangeStart = $state('');
	let rangeEnd = $state('');
	let lineItems: { description: string; hours: number; rate: number; amount: number }[] = $state([]);
	let entriesLoaded = $state(false);

	// Manual line item
	let manualDesc = $state('');
	let manualHours = $state('');
	let manualRate = $state('');

	function startCreate() {
		showCreate = true;
		selectedClientId = '';
		issueDate = new Date().toISOString().split('T')[0];
		paymentInstructions = settings.payment_instructions || '';
		invoiceNotes = settings.invoice_notes || '';
		lineItems = [];
		entriesLoaded = false;
		rangeStart = '';
		rangeEnd = '';
		calculateDueDate();
	}

	function calculateDueDate() {
		const terms = settings.payment_terms || 'Net 30';
		const d = new Date(issueDate + 'T12:00:00');
		let days = 30;
		if (terms === 'Due on Receipt') days = 0;
		else if (terms === 'Net 15') days = 15;
		else if (terms === 'Net 30') days = 30;
		else if (terms === 'Net 45') days = 45;
		else if (terms === 'Net 60') days = 60;
		d.setDate(d.getDate() + days);
		dueDate = d.toISOString().split('T')[0];
	}

	async function loadTimeEntries() {
		if (!selectedClientId || !rangeStart || !rangeEnd) return;
		const res = await fetch(`/api/time-entries?start=${rangeStart}&end=${rangeEnd}&client_id=${selectedClientId}`);
		if (!res.ok) return;
		const entries: TimeEntry[] = await res.json();

		// Group by project+task
		const groups = new Map<string, { description: string; hours: number }>();
		for (const e of entries) {
			if (!e.hours) continue;
			const key = `${e.project_name} — ${e.task_name}`;
			const existing = groups.get(key);
			if (existing) {
				existing.hours += e.hours;
			} else {
				groups.set(key, { description: key, hours: e.hours });
			}
		}

		const client = clients.find(c => c.id === Number(selectedClientId));
		const rate = client?.hourly_rate || 0;

		lineItems = Array.from(groups.values()).map(g => ({
			description: g.description,
			hours: Math.round(g.hours * 100) / 100,
			rate,
			amount: Math.round(g.hours * rate * 100) / 100
		}));
		entriesLoaded = true;
	}

	function updateItemRate(index: number, newRate: number) {
		lineItems[index].rate = newRate;
		lineItems[index].amount = Math.round(lineItems[index].hours * newRate * 100) / 100;
	}

	function removeItem(index: number) {
		lineItems = lineItems.filter((_, i) => i !== index);
	}

	function addManualItem() {
		const h = parseFloat(manualHours);
		const r = parseFloat(manualRate);
		if (!manualDesc || isNaN(h) || isNaN(r)) return;
		lineItems = [...lineItems, {
			description: manualDesc,
			hours: h,
			rate: r,
			amount: Math.round(h * r * 100) / 100
		}];
		manualDesc = '';
		manualHours = '';
		manualRate = '';
	}

	let total = $derived(lineItems.reduce((sum, item) => sum + item.amount, 0));

	async function createInvoice() {
		if (!selectedClientId || lineItems.length === 0) return;

		const res = await fetch('/api/invoices', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				client_id: Number(selectedClientId),
				issue_date: issueDate,
				due_date: dueDate,
				notes: invoiceNotes || null,
				payment_instructions: paymentInstructions || null,
				line_items: lineItems
			})
		});

		if (res.ok) {
			const invoice = await res.json();
			// Download PDF immediately
			await downloadPDF(invoice.id);
			showCreate = false;
			invalidateAll();
		}
	}

	async function downloadPDF(invoiceId: number) {
		const res = await fetch(`/api/invoices/${invoiceId}`);
		if (!res.ok) return;
		const invoice = await res.json();
		generateInvoicePDF({
			invoice_number: invoice.invoice_number,
			client_name: invoice.client_name,
			issue_date: invoice.issue_date,
			due_date: invoice.due_date,
			notes: invoice.notes,
			payment_instructions: invoice.payment_instructions,
			line_items: invoice.line_items,
			settings
		});
	}

	async function updateStatus(id: number, status: string) {
		await fetch(`/api/invoices/${id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ status })
		});
		invalidateAll();
	}

	async function deleteInvoice(id: number) {
		await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
		invalidateAll();
	}

	function formatCurrency(amount: number): string {
		return currency + amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
	}

	function formatDate(dateStr: string): string {
		return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}

	const statusColors: Record<string, string> = {
		draft: 'bg-text-secondary/20 text-text-secondary',
		sent: 'bg-accent/20 text-accent',
		paid: 'bg-timer-green/20 text-timer-green'
	};

	const inputClass = 'bg-bg border border-border rounded-md px-3 py-2 text-sm text-text focus:border-accent focus:outline-none';
</script>

<div class="p-8 max-w-5xl mx-auto">
	{#if showCreate}
		<!-- Create Invoice -->
		<div class="flex items-center gap-3 mb-6">
			<button onclick={() => (showCreate = false)} class="p-1.5 rounded-md hover:bg-surface text-text-secondary hover:text-text transition-colors cursor-pointer">
				<ArrowLeft size={18} />
			</button>
			<h2 class="text-2xl font-semibold">New Invoice</h2>
		</div>

		<div class="space-y-6">
			<!-- Step 1: Invoice Details -->
			<div class="bg-surface rounded-lg border border-border p-6">
				<h3 class="text-sm font-medium text-text-secondary uppercase tracking-wider mb-4">Invoice Details</h3>
				<div class="grid grid-cols-2 gap-4">
					<label class="block">
						<span class="text-sm font-medium text-text-secondary mb-1.5 block">Client</span>
						<select bind:value={selectedClientId} class="w-full {inputClass}">
							<option value="">Select client...</option>
							{#each clients as client}
								<option value={String(client.id)}>{client.name}</option>
							{/each}
						</select>
					</label>
					<div></div>
					<label class="block">
						<span class="text-sm font-medium text-text-secondary mb-1.5 block">Issue Date</span>
						<input type="date" bind:value={issueDate} onchange={calculateDueDate} class="w-full {inputClass}" />
					</label>
					<label class="block">
						<span class="text-sm font-medium text-text-secondary mb-1.5 block">Due Date</span>
						<input type="date" bind:value={dueDate} class="w-full {inputClass}" />
					</label>
				</div>
				<div class="mt-4 space-y-3">
					<label class="block">
						<span class="text-sm font-medium text-text-secondary mb-1.5 block">Payment Instructions</span>
						<textarea bind:value={paymentInstructions} rows="2" class="w-full {inputClass}"></textarea>
					</label>
					<label class="block">
						<span class="text-sm font-medium text-text-secondary mb-1.5 block">Notes</span>
						<textarea bind:value={invoiceNotes} rows="2" class="w-full {inputClass}"></textarea>
					</label>
				</div>
			</div>

			<!-- Step 2: Line Items -->
			<div class="bg-surface rounded-lg border border-border p-6">
				<h3 class="text-sm font-medium text-text-secondary uppercase tracking-wider mb-4">Line Items</h3>

				{#if selectedClientId}
					<div class="flex items-end gap-3 mb-4 pb-4 border-b border-border">
						<label class="block">
							<span class="text-xs text-text-secondary mb-1 block">Start Date</span>
							<input type="date" bind:value={rangeStart} class="{inputClass}" />
						</label>
						<label class="block">
							<span class="text-xs text-text-secondary mb-1 block">End Date</span>
							<input type="date" bind:value={rangeEnd} class="{inputClass}" />
						</label>
						<button
							onclick={loadTimeEntries}
							disabled={!rangeStart || !rangeEnd}
							class="bg-accent/15 hover:bg-accent/25 text-accent border border-accent/30 rounded-md px-4 py-2 text-sm font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
						>
							Load Time Entries
						</button>
					</div>
				{:else}
					<p class="text-sm text-text-secondary mb-4">Select a client above to load time entries.</p>
				{/if}

				{#if lineItems.length > 0}
					<table class="w-full mb-4">
						<thead>
							<tr class="border-b border-border text-left text-xs text-text-secondary uppercase tracking-wider">
								<th class="pb-2 font-medium">Description</th>
								<th class="pb-2 font-medium text-right w-20">Hours</th>
								<th class="pb-2 font-medium text-right w-32">Rate ({currency}/hr)</th>
								<th class="pb-2 font-medium text-right w-28">Amount</th>
								<th class="pb-2 w-10"></th>
							</tr>
						</thead>
						<tbody>
							{#each lineItems as item, i}
								<tr class="border-b border-border/50">
									<td class="py-2 text-sm">{item.description}</td>
									<td class="py-2 text-sm text-right font-mono">{item.hours.toFixed(2)}</td>
									<td class="py-2 text-right">
										<input
											type="number"
											step="0.01"
											min="0"
											value={item.rate}
											onchange={(e) => updateItemRate(i, parseFloat(e.currentTarget.value) || 0)}
											class="w-24 bg-bg border border-border rounded px-2 py-1 text-sm text-right font-mono text-text ml-auto block"
										/>
									</td>
									<td class="py-2 text-sm text-right font-mono font-medium">{formatCurrency(item.amount)}</td>
									<td class="py-2 text-right">
										<button onclick={() => removeItem(i)} class="p-1 rounded text-text-secondary hover:text-danger transition-colors cursor-pointer">
											<X size={14} />
										</button>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				{/if}

				<!-- Manual line item -->
				<div class="flex items-end gap-2 pt-2">
					<label class="flex-1 block">
						<span class="text-xs text-text-secondary mb-1 block">Description</span>
						<input type="text" bind:value={manualDesc} placeholder="Custom item" class="w-full {inputClass}" />
					</label>
					<label class="w-20 block">
						<span class="text-xs text-text-secondary mb-1 block">Hours</span>
						<input type="number" step="0.25" bind:value={manualHours} class="w-full {inputClass} text-right font-mono" />
					</label>
					<label class="w-24 block">
						<span class="text-xs text-text-secondary mb-1 block">Rate</span>
						<input type="number" step="0.01" bind:value={manualRate} class="w-full {inputClass} text-right font-mono" />
					</label>
					<button onclick={addManualItem} class="p-2 rounded text-accent hover:bg-accent/10 transition-colors cursor-pointer">
						<Plus size={18} />
					</button>
				</div>

				<!-- Total -->
				{#if lineItems.length > 0}
					<div class="flex justify-end mt-4 pt-4 border-t border-border">
						<div class="text-right">
							<span class="text-sm text-text-secondary mr-4">Total:</span>
							<span class="text-xl font-mono font-semibold text-accent">{formatCurrency(total)}</span>
						</div>
					</div>
				{/if}
			</div>

			<button
				onclick={createInvoice}
				disabled={!selectedClientId || lineItems.length === 0}
				class="bg-accent hover:bg-accent-hover text-white rounded-md px-6 py-2.5 text-sm font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
			>
				Create Invoice
			</button>
		</div>
	{:else}
		<!-- Invoice List -->
		<div class="flex items-center justify-between mb-6">
			<h2 class="text-2xl font-semibold">Invoices</h2>
			<button
				onclick={startCreate}
				class="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white rounded-md px-4 py-2 text-sm font-medium transition-colors cursor-pointer"
			>
				<Plus size={16} />
				New Invoice
			</button>
		</div>

		<div class="bg-surface rounded-lg border border-border overflow-hidden">
			<table class="w-full">
				<thead>
					<tr class="border-b border-border text-left text-xs text-text-secondary uppercase tracking-wider">
						<th class="px-4 py-3 font-medium">Invoice #</th>
						<th class="px-4 py-3 font-medium">Client</th>
						<th class="px-4 py-3 font-medium">Issue Date</th>
						<th class="px-4 py-3 font-medium">Due Date</th>
						<th class="px-4 py-3 font-medium text-right">Amount</th>
						<th class="px-4 py-3 font-medium">Status</th>
						<th class="px-4 py-3 font-medium text-right w-40">Actions</th>
					</tr>
				</thead>
				<tbody>
					{#each invoices as invoice (invoice.id)}
						<tr class="border-b border-border hover:bg-bg/30 transition-colors">
							<td class="px-4 py-3 text-sm font-mono font-medium">{invoice.invoice_number}</td>
							<td class="px-4 py-3 text-sm">{invoice.client_name}</td>
							<td class="px-4 py-3 text-sm text-text-secondary">{formatDate(invoice.issue_date)}</td>
							<td class="px-4 py-3 text-sm text-text-secondary">{formatDate(invoice.due_date)}</td>
							<td class="px-4 py-3 text-sm text-right font-mono font-medium">{formatCurrency(invoice.total)}</td>
							<td class="px-4 py-3">
								<span class="px-2 py-0.5 rounded-full text-xs font-medium {statusColors[invoice.status] || ''}">{invoice.status}</span>
							</td>
							<td class="px-4 py-3 text-right">
								<div class="flex items-center justify-end gap-1">
									<button onclick={() => downloadPDF(invoice.id)} class="p-1.5 rounded text-text-secondary hover:text-accent hover:bg-accent/10 transition-colors cursor-pointer" title="Download PDF">
										<Download size={14} />
									</button>
									{#if invoice.status === 'draft'}
										<button onclick={() => updateStatus(invoice.id, 'sent')} class="p-1.5 rounded text-text-secondary hover:text-accent hover:bg-accent/10 transition-colors cursor-pointer" title="Mark as Sent">
											<Send size={14} />
										</button>
									{/if}
									{#if invoice.status !== 'paid'}
										<button onclick={() => updateStatus(invoice.id, 'paid')} class="p-1.5 rounded text-text-secondary hover:text-timer-green hover:bg-timer-green/10 transition-colors cursor-pointer" title="Mark as Paid">
											<CheckCircle size={14} />
										</button>
									{/if}
									<button onclick={() => deleteInvoice(invoice.id)} class="p-1.5 rounded text-text-secondary hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer" title="Delete">
										<Trash2 size={14} />
									</button>
								</div>
							</td>
						</tr>
					{/each}
					{#if invoices.length === 0}
						<tr>
							<td colspan="7" class="px-4 py-12 text-center text-text-secondary text-sm">
								No invoices yet — create your first one.
							</td>
						</tr>
					{/if}
				</tbody>
			</table>
		</div>
	{/if}
</div>
