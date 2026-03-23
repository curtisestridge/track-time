<script lang="ts">
	import { goto } from '$app/navigation';
	import { Download } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { Bar, Doughnut } from 'svelte-chartjs';
	import { Chart, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';

	Chart.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

	let { data } = $props();
	let view = $state<'project' | 'client'>('project');
	let mounted = $state(false);

	onMount(() => { mounted = true; });

	function setPreset(preset: string) {
		goto(`/reports?preset=${preset}`);
	}

	function setCustomRange() {
		const startInput = document.getElementById('report-start') as HTMLInputElement;
		const endInput = document.getElementById('report-end') as HTMLInputElement;
		if (startInput?.value && endInput?.value) {
			goto(`/reports?preset=custom&start=${startInput.value}&end=${endInput.value}`);
		}
	}

	const barChartData = $derived({
		labels: data.projectData.map(p => p.name),
		datasets: [{
			label: 'Hours',
			data: data.projectData.map(p => Math.round(p.hours * 100) / 100),
			backgroundColor: data.projectData.map(p => p.color + '80'),
			borderColor: data.projectData.map(p => p.color),
			borderWidth: 1,
			borderRadius: 4
		}]
	});

	const doughnutChartData = $derived({
		labels: data.clientData.map(c => c.name),
		datasets: [{
			data: data.clientData.map(c => Math.round(c.hours * 100) / 100),
			backgroundColor: data.clientData.map(c => c.color + '80'),
			borderColor: data.clientData.map(c => c.color),
			borderWidth: 2
		}]
	});

	const chartOptions = {
		responsive: true,
		maintainAspectRatio: false,
		plugins: {
			legend: { display: false },
			tooltip: {
				callbacks: {
					label: (ctx: { parsed: number | { y: number } }) => {
						const val = typeof ctx.parsed === 'number' ? ctx.parsed : ctx.parsed.y;
						return ` ${val.toFixed(2)}h`;
					}
				}
			}
		},
		scales: {
			y: {
				beginAtZero: true,
				grid: { color: '#2a2d3a' },
				ticks: { color: '#94a3b8' }
			},
			x: {
				grid: { display: false },
				ticks: { color: '#94a3b8' }
			}
		}
	};

	const doughnutOptions = {
		responsive: true,
		maintainAspectRatio: false,
		plugins: {
			legend: {
				position: 'bottom' as const,
				labels: { color: '#e2e8f0', padding: 16 }
			}
		}
	};

	function exportCSV() {
		const rows = [['Date', 'Client', 'Project', 'Task', 'Hours', 'Notes']];
		for (const e of data.entries) {
			rows.push([
				e.date,
				e.client_name || '',
				e.project_name || '',
				e.task_name || '',
				String(e.hours || 0),
				(e.notes || '').replace(/"/g, '""')
			]);
		}
		const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
		const blob = new Blob([csv], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `time-report-${data.start}-to-${data.end}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	}

	const presets = [
		{ key: 'this-week', label: 'This Week' },
		{ key: 'this-month', label: 'This Month' },
		{ key: 'last-month', label: 'Last Month' },
		{ key: 'custom', label: 'Custom' }
	];
</script>

<div class="p-8 max-w-5xl mx-auto">
	<div class="flex items-center justify-between mb-6">
		<h2 class="text-2xl font-semibold">Reports</h2>
		<button onclick={exportCSV} class="flex items-center gap-2 bg-surface hover:bg-border/30 border border-border rounded-md px-4 py-2 text-sm text-text-secondary hover:text-text transition-colors cursor-pointer">
			<Download size={16} />
			Export CSV
		</button>
	</div>

	<!-- Date Range Selector -->
	<div class="flex items-center gap-2 mb-6 flex-wrap">
		{#each presets as preset}
			<button
				onclick={() => setPreset(preset.key)}
				class="px-3 py-1.5 rounded-md text-sm transition-colors cursor-pointer {data.preset === preset.key
					? 'bg-accent text-white'
					: 'bg-surface border border-border text-text-secondary hover:text-text'}"
			>
				{preset.label}
			</button>
		{/each}
		{#if data.preset === 'custom'}
			<div class="flex items-center gap-2 ml-2">
				<input type="date" id="report-start" value={data.start} class="bg-surface border border-border rounded-md px-2 py-1.5 text-sm text-text" />
				<span class="text-text-secondary text-sm">to</span>
				<input type="date" id="report-end" value={data.end} class="bg-surface border border-border rounded-md px-2 py-1.5 text-sm text-text" />
				<button onclick={setCustomRange} class="px-3 py-1.5 bg-accent text-white rounded-md text-sm cursor-pointer">Apply</button>
			</div>
		{/if}
		<div class="ml-auto text-right">
			<span class="text-sm text-text-secondary">Total:</span>
			<span class="text-xl font-mono font-semibold text-accent ml-2">{data.totalHours.toFixed(2)}h</span>
		</div>
	</div>

	<!-- View Toggle -->
	<div class="flex items-center gap-1 mb-6 bg-surface rounded-lg p-1 w-fit border border-border">
		<button
			onclick={() => (view = 'project')}
			class="px-4 py-1.5 rounded-md text-sm transition-colors cursor-pointer {view === 'project' ? 'bg-accent text-white' : 'text-text-secondary hover:text-text'}"
		>
			By Project
		</button>
		<button
			onclick={() => (view = 'client')}
			class="px-4 py-1.5 rounded-md text-sm transition-colors cursor-pointer {view === 'client' ? 'bg-accent text-white' : 'text-text-secondary hover:text-text'}"
		>
			By Client
		</button>
	</div>

	{#if view === 'project'}
		<div class="grid grid-cols-12 gap-6">
			<!-- Chart -->
			<div class="col-span-7 bg-surface rounded-lg border border-border p-4">
				<div class="h-72">
					{#if mounted && data.projectData.length > 0}
						<Bar data={barChartData} options={chartOptions} />
					{:else if data.projectData.length === 0}
						<div class="flex items-center justify-center h-full text-text-secondary text-sm">No data for this period</div>
					{/if}
				</div>
			</div>
			<!-- Table -->
			<div class="col-span-5 bg-surface rounded-lg border border-border overflow-hidden">
				<table class="w-full">
					<thead>
						<tr class="border-b border-border text-left text-xs text-text-secondary uppercase tracking-wider">
							<th class="px-4 py-3 font-medium">Project</th>
							<th class="px-4 py-3 font-medium text-right">Hours</th>
							<th class="px-4 py-3 font-medium text-right">%</th>
						</tr>
					</thead>
					<tbody>
						{#each data.projectData as project}
							<tr class="border-b border-border">
								<td class="px-4 py-2.5">
									<div class="flex items-center gap-2">
										<div class="w-2 h-2 rounded-full" style="background-color: {project.color}"></div>
										<div>
											<div class="text-sm">{project.name}</div>
											<div class="text-xs text-text-secondary">{project.client}</div>
										</div>
									</div>
								</td>
								<td class="px-4 py-2.5 text-right font-mono text-sm">{project.hours.toFixed(2)}</td>
								<td class="px-4 py-2.5 text-right text-sm text-text-secondary">
									{data.totalHours > 0 ? ((project.hours / data.totalHours) * 100).toFixed(0) : 0}%
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{:else}
		<div class="grid grid-cols-12 gap-6">
			<!-- Chart -->
			<div class="col-span-5 bg-surface rounded-lg border border-border p-4">
				<div class="h-72">
					{#if mounted && data.clientData.length > 0}
						<Doughnut data={doughnutChartData} options={doughnutOptions} />
					{:else if data.clientData.length === 0}
						<div class="flex items-center justify-center h-full text-text-secondary text-sm">No data for this period</div>
					{/if}
				</div>
			</div>
			<!-- Table -->
			<div class="col-span-7 bg-surface rounded-lg border border-border overflow-hidden">
				<table class="w-full">
					<thead>
						<tr class="border-b border-border text-left text-xs text-text-secondary uppercase tracking-wider">
							<th class="px-4 py-3 font-medium">Client</th>
							<th class="px-4 py-3 font-medium text-right">Hours</th>
							<th class="px-4 py-3 font-medium text-right">%</th>
						</tr>
					</thead>
					<tbody>
						{#each data.clientData as client}
							<tr class="border-b border-border">
								<td class="px-4 py-2.5">
									<div class="flex items-center gap-2">
										<div class="w-3 h-3 rounded-full" style="background-color: {client.color}"></div>
										<span class="text-sm">{client.name}</span>
									</div>
								</td>
								<td class="px-4 py-2.5 text-right font-mono text-sm">{client.hours.toFixed(2)}</td>
								<td class="px-4 py-2.5 text-right text-sm text-text-secondary">
									{data.totalHours > 0 ? ((client.hours / data.totalHours) * 100).toFixed(0) : 0}%
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}
</div>
