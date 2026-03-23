<script lang="ts">
	import { Check } from 'lucide-svelte';

	let { data } = $props();
	const s = data.settings;

	let companyName = $state(s.company_name || '');
	let companyEmail = $state(s.company_email || '');
	let companyPhone = $state(s.company_phone || '');
	let companyWebsite = $state(s.company_website || '');
	let addressLine1 = $state(s.company_address_line1 || '');
	let addressLine2 = $state(s.company_address_line2 || '');
	let city = $state(s.company_city || '');
	let stateProvince = $state(s.company_state || '');
	let zip = $state(s.company_zip || '');
	let country = $state(s.company_country || 'United States');
	let currencySymbol = $state(s.currency_symbol || '$');
	let currencyCode = $state(s.currency_code || 'USD');
	let invoicePrefix = $state(s.invoice_prefix || 'INV-');
	let invoiceNextNumber = $state(s.invoice_next_number || '1');
	let paymentTerms = $state(s.payment_terms || 'Net 30');
	let paymentInstructions = $state(s.payment_instructions || '');
	let invoiceNotes = $state(s.invoice_notes || '');

	let showToast = $state(false);
	let backupMessage = $state('');
	let backupError = $state(false);

	async function saveSetting(key: string, value: string) {
		await fetch('/api/settings', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ key, value })
		});
	}

	async function saveAll() {
		const settings: Record<string, string> = {
			company_name: companyName,
			company_email: companyEmail,
			company_phone: companyPhone,
			company_website: companyWebsite,
			company_address_line1: addressLine1,
			company_address_line2: addressLine2,
			company_city: city,
			company_state: stateProvince,
			company_zip: zip,
			company_country: country,
			currency_symbol: currencySymbol,
			currency_code: currencyCode,
			invoice_prefix: invoicePrefix,
			invoice_next_number: invoiceNextNumber,
			payment_terms: paymentTerms,
			payment_instructions: paymentInstructions,
			invoice_notes: invoiceNotes
		};
		for (const [key, value] of Object.entries(settings)) {
			await saveSetting(key, value);
		}
		showToast = true;
		setTimeout(() => (showToast = false), 2500);
	}

	const inputClass = 'w-full bg-bg border border-border rounded-md px-3 py-2 text-sm text-text placeholder:text-text-secondary/50 focus:border-accent focus:outline-none';
	const labelClass = 'text-sm font-medium text-text-secondary mb-1.5 block';
</script>

<div class="p-8 max-w-2xl mx-auto">
	<h2 class="text-2xl font-semibold mb-6">Settings</h2>

	<div class="space-y-6">
		<!-- Business Information -->
		<div class="bg-surface rounded-lg border border-border p-6">
			<h3 class="text-sm font-medium text-text-secondary uppercase tracking-wider mb-4">Business Information</h3>
			<div class="space-y-3">
				<label class="block">
					<span class={labelClass}>Company Name</span>
					<input type="text" bind:value={companyName} class={inputClass} placeholder="My Company" />
				</label>
				<label class="block">
					<span class={labelClass}>Email Address</span>
					<input type="email" bind:value={companyEmail} class={inputClass} placeholder="hello@example.com" />
				</label>
				<div class="grid grid-cols-2 gap-3">
					<label class="block">
						<span class={labelClass}>Phone Number</span>
						<input type="text" bind:value={companyPhone} class={inputClass} placeholder="+1 (555) 000-0000" />
					</label>
					<label class="block">
						<span class={labelClass}>Website</span>
						<input type="text" bind:value={companyWebsite} class={inputClass} placeholder="https://example.com" />
					</label>
				</div>
			</div>
		</div>

		<!-- Business Address -->
		<div class="bg-surface rounded-lg border border-border p-6">
			<h3 class="text-sm font-medium text-text-secondary uppercase tracking-wider mb-4">Business Address</h3>
			<div class="space-y-3">
				<label class="block">
					<span class={labelClass}>Address Line 1</span>
					<input type="text" bind:value={addressLine1} class={inputClass} placeholder="123 Main St" />
				</label>
				<label class="block">
					<span class={labelClass}>Address Line 2</span>
					<input type="text" bind:value={addressLine2} class={inputClass} placeholder="Suite 100" />
				</label>
				<div class="grid grid-cols-2 gap-3">
					<label class="block">
						<span class={labelClass}>City</span>
						<input type="text" bind:value={city} class={inputClass} />
					</label>
					<label class="block">
						<span class={labelClass}>State</span>
						<input type="text" bind:value={stateProvince} class={inputClass} />
					</label>
				</div>
				<div class="grid grid-cols-2 gap-3">
					<label class="block">
						<span class={labelClass}>ZIP Code</span>
						<input type="text" bind:value={zip} class={inputClass} />
					</label>
					<label class="block">
						<span class={labelClass}>Country</span>
						<select bind:value={country} class={inputClass}>
							<option value="United States">United States</option>
							<option value="Canada">Canada</option>
							<option value="United Kingdom">United Kingdom</option>
							<option value="Australia">Australia</option>
							<option value="Germany">Germany</option>
							<option value="France">France</option>
							<option value="Japan">Japan</option>
							<option value="India">India</option>
							<option value="Brazil">Brazil</option>
							<option value="Mexico">Mexico</option>
							<option value="Netherlands">Netherlands</option>
							<option value="Sweden">Sweden</option>
							<option value="Switzerland">Switzerland</option>
							<option value="New Zealand">New Zealand</option>
							<option value="Ireland">Ireland</option>
							<option value="Singapore">Singapore</option>
							<option value="South Korea">South Korea</option>
							<option value="Italy">Italy</option>
							<option value="Spain">Spain</option>
							<option value="Norway">Norway</option>
						</select>
					</label>
				</div>
			</div>
		</div>

		<!-- Currency -->
		<div class="bg-surface rounded-lg border border-border p-6">
			<h3 class="text-sm font-medium text-text-secondary uppercase tracking-wider mb-4">Currency</h3>
			<div class="grid grid-cols-2 gap-3">
				<label class="block">
					<span class={labelClass}>Currency Symbol</span>
					<input type="text" bind:value={currencySymbol} class={inputClass} placeholder="$" />
				</label>
				<label class="block">
					<span class={labelClass}>Currency Code</span>
					<input type="text" bind:value={currencyCode} class={inputClass} placeholder="USD" />
				</label>
			</div>
		</div>

		<!-- Invoice Defaults -->
		<div class="bg-surface rounded-lg border border-border p-6">
			<h3 class="text-sm font-medium text-text-secondary uppercase tracking-wider mb-4">Invoice Defaults</h3>
			<div class="space-y-3">
				<div class="grid grid-cols-2 gap-3">
					<label class="block">
						<span class={labelClass}>Invoice Number Prefix</span>
						<input type="text" bind:value={invoicePrefix} class={inputClass} placeholder="INV-" />
					</label>
					<label class="block">
						<span class={labelClass}>Next Invoice Number</span>
						<input type="number" min="1" bind:value={invoiceNextNumber} class={inputClass} />
					</label>
				</div>
				<label class="block">
					<span class={labelClass}>Default Payment Terms</span>
					<select bind:value={paymentTerms} class={inputClass}>
						<option value="Due on Receipt">Due on Receipt</option>
						<option value="Net 15">Net 15</option>
						<option value="Net 30">Net 30</option>
						<option value="Net 45">Net 45</option>
						<option value="Net 60">Net 60</option>
					</select>
				</label>
				<label class="block">
					<span class={labelClass}>Payment Instructions</span>
					<textarea bind:value={paymentInstructions} rows="3" class={inputClass} placeholder="Bank details, payment link, etc."></textarea>
				</label>
				<label class="block">
					<span class={labelClass}>Default Invoice Notes</span>
					<textarea bind:value={invoiceNotes} rows="3" class={inputClass} placeholder="Thank you for your business!"></textarea>
				</label>
			</div>
		</div>

		<button
			onclick={saveAll}
			class="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white rounded-md px-4 py-2 text-sm font-medium transition-colors cursor-pointer"
		>
			Save All Settings
		</button>

		<!-- Database Backup -->
		<div class="bg-surface rounded-lg border border-border p-6">
			<h3 class="text-sm font-medium text-text-secondary uppercase tracking-wider mb-4">Database Backup</h3>
			<p class="text-sm text-text-secondary mb-4">Backups are saved to <span class="font-mono text-text">data/backups/</span> as dated copies of your database.</p>
			<button
				onclick={async () => {
					backupMessage = '';
					backupError = false;
					const res = await fetch('/api/backup', { method: 'POST' });
					const result = await res.json();
					if (result.success) {
						backupMessage = `Backup saved: ${result.path.split('/').pop()}`;
						backupError = false;
					} else {
						backupMessage = result.message || 'Backup failed.';
						backupError = true;
					}
				}}
				class="flex items-center gap-2 bg-accent/15 hover:bg-accent/25 text-accent border border-accent/30 rounded-md px-4 py-2 text-sm font-medium transition-colors cursor-pointer"
			>
				Backup Now
			</button>
			{#if backupMessage}
				<div class="mt-3 text-sm {backupError ? 'text-danger' : 'text-timer-green'}">{backupMessage}</div>
			{/if}
		</div>
	</div>

	{#if showToast}
		<div class="fixed bottom-6 right-6 flex items-center gap-2 bg-timer-green/15 border border-timer-green/30 text-timer-green rounded-lg px-4 py-2.5 text-sm font-medium shadow-lg">
			<Check size={16} />
			Settings saved
		</div>
	{/if}
</div>
