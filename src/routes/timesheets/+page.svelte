<script lang="ts">
	import { goto, invalidate } from '$app/navigation';
	import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2, Check, X } from 'lucide-svelte';
	import type { TimeEntry, Project, Task } from '$lib/types.js';
	import { formatHours } from '$lib/utils.js';

	let { data } = $props();

	let entries = $derived(data.entries as TimeEntry[]);
	let weekDays = $derived(data.weekDays);
	let dailyTotal = $derived(data.dailyTotal as number);
	let currentDate = $derived(data.date as string);
	let projects = $derived(data.projects as Project[]);
	let tasks = $derived(data.tasks as Task[]);

	let showAddForm = $state(false);
	let editingId: number | null = $state(null);

	// Add form state
	let addProjectId = $state('');
	let addTaskId = $state('');
	let addHours = $state('');
	let addNotes = $state('');
	let addAvailableTasks: Task[] = $state([]);

	// Edit form state
	let editProjectId = $state('');
	let editTaskId = $state('');
	let editHours = $state('');
	let editNotes = $state('');
	let editAvailableTasks: Task[] = $state([]);

	function navigateDate(offset: number) {
		const d = new Date(currentDate + 'T12:00:00');
		d.setDate(d.getDate() + offset);
		goto(`/timesheets?date=${d.toISOString().split('T')[0]}`);
	}

	function formatDateDisplay(dateStr: string): string {
		const d = new Date(dateStr + 'T12:00:00');
		const today = new Date().toISOString().split('T')[0];
		const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
		if (dateStr === today) return 'Today';
		if (dateStr === yesterday) return 'Yesterday';
		return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
	}

	function onAddProjectChange() {
		const pid = Number(addProjectId);
		addAvailableTasks = tasks.filter((t: Task) => t.project_id === pid);
		addTaskId = '';
	}

	function onEditProjectChange() {
		const pid = Number(editProjectId);
		editAvailableTasks = tasks.filter((t: Task) => t.project_id === pid);
		editTaskId = '';
	}

	async function handleAdd() {
		if (!addProjectId || !addTaskId || !addHours) return;
		const hours = parseFloat(addHours);
		if (isNaN(hours) || hours <= 0 || hours > 24) return;

		await fetch('/api/time-entries', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				project_id: Number(addProjectId),
				task_id: Number(addTaskId),
				date: currentDate,
				hours,
				notes: addNotes
			})
		});

		showAddForm = false;
		addProjectId = '';
		addTaskId = '';
		addHours = '';
		addNotes = '';
		await invalidate('app:time-entries');
	}

	function startEdit(entry: TimeEntry) {
		editingId = entry.id;
		editProjectId = String(entry.project_id);
		editTaskId = String(entry.task_id);
		editHours = String(entry.hours || '');
		editNotes = entry.notes || '';
		editAvailableTasks = tasks.filter((t: Task) => t.project_id === entry.project_id);
	}

	async function handleEdit() {
		if (!editingId || !editProjectId || !editTaskId || !editHours) return;
		const hours = parseFloat(editHours);
		if (isNaN(hours) || hours <= 0 || hours > 24) return;

		await fetch(`/api/time-entries/${editingId}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				project_id: Number(editProjectId),
				task_id: Number(editTaskId),
				hours,
				notes: editNotes
			})
		});

		editingId = null;
		await invalidate('app:time-entries');
	}

	async function handleDelete(id: number) {
		await fetch(`/api/time-entries/${id}`, { method: 'DELETE' });
		await invalidate('app:time-entries');
	}
</script>

<div class="p-8 max-w-5xl mx-auto">
	<!-- Header -->
	<div class="flex items-center justify-between mb-6">
		<div class="flex items-center gap-4">
			<h2 class="text-2xl font-semibold">{formatDateDisplay(currentDate)}</h2>
			<div class="flex items-center gap-1">
				<button onclick={() => navigateDate(-1)} class="p-1.5 rounded-md hover:bg-surface text-text-secondary hover:text-text transition-colors cursor-pointer">
					<ChevronLeft size={18} />
				</button>
				<button onclick={() => navigateDate(1)} class="p-1.5 rounded-md hover:bg-surface text-text-secondary hover:text-text transition-colors cursor-pointer">
					<ChevronRight size={18} />
				</button>
			</div>
			<input
				type="date"
				value={currentDate}
				onchange={(e) => goto(`/timesheets?date=${e.currentTarget.value}`)}
				class="bg-surface border border-border rounded-md px-3 py-1.5 text-sm text-text"
			/>
		</div>
		<div class="text-right">
			<div class="text-sm text-text-secondary">Daily Total</div>
			<div class="text-2xl font-mono font-semibold text-accent">{formatHours(dailyTotal)}</div>
		</div>
	</div>

	<!-- Week Summary Strip -->
	<div class="grid grid-cols-7 gap-2 mb-8">
		{#each weekDays as day}
			<a
				href="/timesheets?date={day.date}"
				class="text-center p-2.5 rounded-lg border transition-colors {day.isSelected
					? 'bg-accent/15 border-accent/40 text-accent'
					: day.isToday
						? 'bg-surface border-accent/20 text-text'
						: 'bg-surface border-border text-text-secondary hover:border-border hover:text-text'}"
			>
				<div class="text-xs font-medium">{day.dayName}</div>
				<div class="text-lg font-medium">{day.dayNum}</div>
				<div class="text-xs font-mono {day.hours > 0 ? 'text-accent' : 'text-text-secondary/50'}">{formatHours(day.hours)}</div>
			</a>
		{/each}
	</div>

	<!-- Time Entries Table -->
	<div class="bg-surface rounded-lg border border-border overflow-hidden">
		<table class="w-full">
			<thead>
				<tr class="border-b border-border text-left text-xs text-text-secondary uppercase tracking-wider">
					<th class="px-4 py-3 font-medium">Project</th>
					<th class="px-4 py-3 font-medium">Task</th>
					<th class="px-4 py-3 font-medium">Notes</th>
					<th class="px-4 py-3 font-medium text-right">Hours</th>
					<th class="px-4 py-3 font-medium text-right w-24">Actions</th>
				</tr>
			</thead>
			<tbody>
				{#each entries as entry (entry.id)}
					{#if editingId === entry.id}
						<tr class="border-b border-border bg-bg/50">
							<td class="px-4 py-2">
								<select bind:value={editProjectId} onchange={onEditProjectChange} class="w-full bg-bg border border-border rounded px-2 py-1 text-sm text-text">
									{#each projects as project}
										<option value={String(project.id)}>{project.client_name} — {project.name}</option>
									{/each}
								</select>
							</td>
							<td class="px-4 py-2">
								<select bind:value={editTaskId} class="w-full bg-bg border border-border rounded px-2 py-1 text-sm text-text">
									{#each editAvailableTasks as task}
										<option value={String(task.id)}>{task.name}</option>
									{/each}
								</select>
							</td>
							<td class="px-4 py-2">
								<input type="text" bind:value={editNotes} class="w-full bg-bg border border-border rounded px-2 py-1 text-sm text-text" />
							</td>
							<td class="px-4 py-2">
								<input type="number" step="0.25" min="0" max="24" bind:value={editHours} class="w-20 bg-bg border border-border rounded px-2 py-1 text-sm text-text text-right font-mono ml-auto block" />
							</td>
							<td class="px-4 py-2 text-right">
								<div class="flex items-center justify-end gap-1">
									<button onclick={handleEdit} class="p-1.5 rounded text-timer-green hover:bg-timer-green/15 transition-colors cursor-pointer"><Check size={14} /></button>
									<button onclick={() => (editingId = null)} class="p-1.5 rounded text-text-secondary hover:bg-border/30 transition-colors cursor-pointer"><X size={14} /></button>
								</div>
							</td>
						</tr>
					{:else}
						<tr class="border-b border-border hover:bg-bg/30 transition-colors">
							<td class="px-4 py-3">
								<div class="flex items-center gap-2">
									<div class="w-1 h-8 rounded-full" style="background-color: {entry.client_color || '#6366f1'}"></div>
									<div>
										<div class="text-sm font-medium">{entry.project_name}</div>
										<div class="text-xs text-text-secondary">{entry.client_name}</div>
									</div>
								</div>
							</td>
							<td class="px-4 py-3 text-sm text-text-secondary">{entry.task_name}</td>
							<td class="px-4 py-3 text-sm text-text-secondary">{entry.notes || '—'}</td>
							<td class="px-4 py-3 text-right">
								{#if entry.hours !== null}
									<span class="font-mono text-sm font-medium">{formatHours(entry.hours)}</span>
								{:else}
									<span class="text-xs text-timer-green font-medium timer-pulse">Running...</span>
								{/if}
							</td>
							<td class="px-4 py-3 text-right">
								<div class="flex items-center justify-end gap-1">
									<button onclick={() => startEdit(entry)} class="p-1.5 rounded text-text-secondary hover:text-accent hover:bg-accent/10 transition-colors cursor-pointer"><Pencil size={14} /></button>
									<button onclick={() => handleDelete(entry.id)} class="p-1.5 rounded text-text-secondary hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer"><Trash2 size={14} /></button>
								</div>
							</td>
						</tr>
					{/if}
				{/each}

				{#if entries.length === 0 && !showAddForm}
					<tr>
						<td colspan="5" class="px-4 py-12 text-center text-text-secondary text-sm">
							No time entries for this day. Click "+ Add Time" to get started.
						</td>
					</tr>
				{/if}

				<!-- Add Form Row -->
				{#if showAddForm}
					<tr class="border-b border-border bg-bg/50">
						<td class="px-4 py-2">
							<select bind:value={addProjectId} onchange={onAddProjectChange} class="w-full bg-bg border border-border rounded px-2 py-1 text-sm text-text">
								<option value="">Select project...</option>
								{#each projects as project}
									<option value={String(project.id)}>{project.client_name} — {project.name}</option>
								{/each}
							</select>
						</td>
						<td class="px-4 py-2">
							<select bind:value={addTaskId} disabled={!addProjectId} class="w-full bg-bg border border-border rounded px-2 py-1 text-sm text-text disabled:opacity-40">
								<option value="">Select task...</option>
								{#each addAvailableTasks as task}
									<option value={String(task.id)}>{task.name}</option>
								{/each}
							</select>
						</td>
						<td class="px-4 py-2">
							<input type="text" placeholder="Notes..." bind:value={addNotes} class="w-full bg-bg border border-border rounded px-2 py-1 text-sm text-text placeholder:text-text-secondary/50" />
						</td>
						<td class="px-4 py-2">
							<input type="number" step="0.25" min="0" max="24" placeholder="0.00" bind:value={addHours} class="w-20 bg-bg border border-border rounded px-2 py-1 text-sm text-text text-right font-mono ml-auto block" />
						</td>
						<td class="px-4 py-2 text-right">
							<div class="flex items-center justify-end gap-1">
								<button onclick={handleAdd} disabled={!addProjectId || !addTaskId || !addHours} class="p-1.5 rounded text-timer-green hover:bg-timer-green/15 transition-colors disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"><Check size={14} /></button>
								<button onclick={() => (showAddForm = false)} class="p-1.5 rounded text-text-secondary hover:bg-border/30 transition-colors cursor-pointer"><X size={14} /></button>
							</div>
						</td>
					</tr>
				{/if}
			</tbody>
		</table>

		<!-- Add Time Button -->
		{#if !showAddForm}
			<button
				onclick={() => (showAddForm = true)}
				class="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm text-accent hover:bg-accent/5 transition-colors cursor-pointer"
			>
				<Plus size={16} />
				Add Time
			</button>
		{/if}
	</div>
</div>
