<script lang="ts">
	import { Check } from 'lucide-svelte';

	let { data } = $props();

	let companyName = $state(data.settings.company_name || '');
	let showToast = $state(false);

	async function save() {
		await fetch('/api/settings', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ key: 'company_name', value: companyName })
		});
		showToast = true;
		setTimeout(() => (showToast = false), 2500);
	}
</script>

<div class="p-8 max-w-2xl mx-auto">
	<h2 class="text-2xl font-semibold mb-6">Settings</h2>

	<div class="bg-surface rounded-lg border border-border p-6">
		<label class="block mb-4">
			<span class="text-sm font-medium text-text-secondary mb-1.5 block">Company Name</span>
			<input
				type="text"
				bind:value={companyName}
				class="w-full bg-bg border border-border rounded-md px-3 py-2 text-sm text-text placeholder:text-text-secondary/50 focus:border-accent focus:outline-none"
				placeholder="My Company"
			/>
		</label>

		<button
			onclick={save}
			class="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white rounded-md px-4 py-2 text-sm font-medium transition-colors cursor-pointer"
		>
			Save
		</button>
	</div>

	{#if showToast}
		<div class="fixed bottom-6 right-6 flex items-center gap-2 bg-timer-green/15 border border-timer-green/30 text-timer-green rounded-lg px-4 py-2.5 text-sm font-medium shadow-lg">
			<Check size={16} />
			Settings saved
		</div>
	{/if}
</div>
