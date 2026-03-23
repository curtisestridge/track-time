<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { Plus, Pencil, Archive, ArchiveRestore, Trash2, Check, X } from 'lucide-svelte';
	import type { Client, Project, Task } from '$lib/types.js';

	let { data } = $props();

	let selectedClientId: number | null = $state(null);

	// Client form
	let showClientForm = $state(false);
	let editingClientId: number | null = $state(null);
	let clientName = $state('');
	let clientColor = $state('#6366f1');
	let clientHourlyRate = $state('0');
	let confirmDeleteClientId: number | null = $state(null);

	// Project form
	let showProjectForm = $state(false);
	let editingProjectId: number | null = $state(null);
	let projectName = $state('');
	let projectBudget = $state('');

	// Task form
	let newTaskName = $state('');
	let editingTaskId: number | null = $state(null);
	let editTaskName = $state('');

	$effect(() => {
		if (data.clients.length > 0 && selectedClientId === null) {
			selectedClientId = data.clients[0].id;
		}
	});

	let filteredProjects = $derived(
		data.projects.filter((p: Project) => p.client_id === selectedClientId)
	);

	let filteredTasks = $derived.by(() => {
		const projectIds = new Set(filteredProjects.map((p: Project) => p.id));
		return data.tasks.filter((t: Task) => projectIds.has(t.project_id));
	});

	// ── Client CRUD ──

	function startAddClient() {
		showClientForm = true;
		editingClientId = null;
		clientName = '';
		clientColor = '#6366f1';
		clientHourlyRate = '0';
	}

	function startEditClient(client: Client) {
		showClientForm = true;
		editingClientId = client.id;
		clientName = client.name;
		clientColor = client.color;
		clientHourlyRate = String(client.hourly_rate || 0);
	}

	async function saveClient() {
		if (!clientName.trim()) return;
		if (editingClientId) {
			await fetch(`/api/clients/${editingClientId}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: clientName, color: clientColor, hourly_rate: parseFloat(clientHourlyRate) || 0 })
			});
		} else {
			const res = await fetch('/api/clients', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: clientName, color: clientColor, hourly_rate: parseFloat(clientHourlyRate) || 0 })
			});
			const newClient = await res.json();
			selectedClientId = newClient.id;
		}
		showClientForm = false;
		editingClientId = null;
		invalidateAll();
	}

	async function toggleArchiveClient(client: Client) {
		await fetch(`/api/clients/${client.id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ archived: client.archived ? 0 : 1 })
		});
		invalidateAll();
	}

	async function handleDeleteClient(id: number) {
		await fetch(`/api/clients/${id}`, { method: 'DELETE' });
		confirmDeleteClientId = null;
		if (selectedClientId === id) {
			selectedClientId = null;
		}
		invalidateAll();
	}

	// ── Project CRUD ──

	function startAddProject() {
		showProjectForm = true;
		editingProjectId = null;
		projectName = '';
		projectBudget = '';
	}

	function startEditProject(project: Project) {
		showProjectForm = true;
		editingProjectId = project.id;
		projectName = project.name;
		projectBudget = project.budget_hours ? String(project.budget_hours) : '';
	}

	async function saveProject() {
		if (!projectName.trim() || !selectedClientId) return;
		const body: Record<string, unknown> = { name: projectName, client_id: selectedClientId };
		if (projectBudget) body.budget_hours = parseFloat(projectBudget);

		if (editingProjectId) {
			await fetch(`/api/projects/${editingProjectId}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			});
		} else {
			await fetch('/api/projects', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			});
		}
		showProjectForm = false;
		editingProjectId = null;
		invalidateAll();
	}

	async function toggleArchiveProject(project: Project) {
		await fetch(`/api/projects/${project.id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ archived: project.archived ? 0 : 1 })
		});
		invalidateAll();
	}

	// ── Task CRUD ──

	async function addTask(projectId: number) {
		if (!newTaskName.trim()) return;
		await fetch('/api/tasks', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ project_id: projectId, name: newTaskName })
		});
		newTaskName = '';
		invalidateAll();
	}

	function startEditTask(task: Task) {
		editingTaskId = task.id;
		editTaskName = task.name;
	}

	async function saveTask() {
		if (!editingTaskId || !editTaskName.trim()) return;
		await fetch('/api/tasks', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ id: editingTaskId, name: editTaskName })
		});
		editingTaskId = null;
		invalidateAll();
	}

	async function deleteTask(id: number) {
		await fetch(`/api/tasks?id=${id}`, { method: 'DELETE' });
		invalidateAll();
	}

	function getTasksForProject(projectId: number): Task[] {
		return data.tasks.filter((t: Task) => t.project_id === projectId);
	}

	const selectedClient = $derived(data.clients.find((c: Client) => c.id === selectedClientId));
</script>

<div class="p-8 max-w-6xl mx-auto">
	<h2 class="text-2xl font-semibold mb-6">Projects & Clients</h2>

	<div class="grid grid-cols-12 gap-6">
		<!-- Clients Panel -->
		<div class="col-span-4">
			<div class="bg-surface rounded-lg border border-border overflow-hidden">
				<div class="flex items-center justify-between px-4 py-3 border-b border-border">
					<h3 class="text-sm font-medium text-text-secondary uppercase tracking-wider">Clients</h3>
					<button onclick={startAddClient} class="p-1 rounded text-accent hover:bg-accent/10 transition-colors cursor-pointer">
						<Plus size={16} />
					</button>
				</div>

				{#if showClientForm}
					<div class="p-3 border-b border-border bg-bg/50">
						<input type="text" placeholder="Client name" bind:value={clientName} class="w-full bg-bg border border-border rounded px-2 py-1.5 text-sm text-text mb-2 placeholder:text-text-secondary/50" />
						<div class="flex items-center gap-2 mb-2">
							<span class="text-xs text-text-secondary shrink-0">Rate</span>
							<input type="number" step="0.01" min="0" placeholder="0.00" bind:value={clientHourlyRate} class="w-24 bg-bg border border-border rounded px-2 py-1.5 text-sm text-text font-mono text-right" />
							<span class="text-xs text-text-secondary">/hr</span>
						</div>
						<div class="flex items-center gap-2">
							<input type="color" bind:value={clientColor} class="w-8 h-8 rounded border border-border cursor-pointer" />
							<span class="text-xs text-text-secondary flex-1">{clientColor}</span>
							<button onclick={saveClient} class="p-1.5 rounded text-timer-green hover:bg-timer-green/15 transition-colors cursor-pointer"><Check size={14} /></button>
							<button onclick={() => { showClientForm = false; editingClientId = null; }} class="p-1.5 rounded text-text-secondary hover:bg-border/30 transition-colors cursor-pointer"><X size={14} /></button>
						</div>
					</div>
				{/if}

				<div class="divide-y divide-border max-h-[60vh] overflow-y-auto">
					{#each data.clients as client (client.id)}
						{#if confirmDeleteClientId === client.id}
							<div class="px-4 py-3 bg-danger/5 border-l-2 border-danger">
								<div class="text-sm font-medium text-danger mb-1">Delete {client.name}?</div>
								<div class="text-xs text-danger/80 mb-2">This will permanently delete all projects, tasks, and time entries for this client. This cannot be undone.</div>
								<div class="flex items-center gap-2">
									<button onclick={() => (confirmDeleteClientId = null)} class="px-2.5 py-1 text-xs text-text-secondary hover:text-text border border-border rounded transition-colors cursor-pointer">Cancel</button>
									<button onclick={() => handleDeleteClient(client.id)} class="px-2.5 py-1 text-xs text-white bg-danger hover:bg-danger-hover rounded transition-colors cursor-pointer">Yes, Delete</button>
								</div>
							</div>
						{:else}
							<!-- svelte-ignore a11y_click_events_have_key_events -->
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<div
								onclick={() => (selectedClientId = client.id)}
								class="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors cursor-pointer {selectedClientId === client.id ? 'bg-accent/10' : 'hover:bg-bg/50'} {client.archived ? 'opacity-50' : ''}"
							>
								<div class="w-3 h-3 rounded-full shrink-0" style="background-color: {client.color}"></div>
								<div class="flex-1 min-w-0">
									<div class="text-sm font-medium truncate">{client.name}</div>
									{#if client.archived}
										<div class="text-xs text-text-secondary">Archived</div>
									{/if}
								</div>
								<div class="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100" class:opacity-100={selectedClientId === client.id}>
									<button onclick={(e) => { e.stopPropagation(); startEditClient(client); }} class="p-1 rounded text-text-secondary hover:text-accent transition-colors cursor-pointer"><Pencil size={12} /></button>
									<button onclick={(e) => { e.stopPropagation(); toggleArchiveClient(client); }} class="p-1 rounded text-text-secondary hover:text-accent transition-colors cursor-pointer">
										{#if client.archived}<ArchiveRestore size={12} />{:else}<Archive size={12} />{/if}
									</button>
									<button onclick={(e) => { e.stopPropagation(); confirmDeleteClientId = client.id; }} class="p-1 rounded text-text-secondary hover:text-danger transition-colors cursor-pointer"><Trash2 size={12} /></button>
								</div>
							</div>
						{/if}
					{/each}
					{#if data.clients.length === 0}
						<div class="px-4 py-8 text-center text-text-secondary text-sm">No clients yet</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- Projects Panel -->
		<div class="col-span-8">
			{#if selectedClient}
				<div class="flex items-center gap-3 mb-4">
					<div class="w-4 h-4 rounded-full" style="background-color: {selectedClient.color}"></div>
					<h3 class="text-lg font-semibold">{selectedClient.name}</h3>
					<button onclick={startAddProject} class="ml-auto flex items-center gap-1.5 bg-accent/15 hover:bg-accent/25 text-accent border border-accent/30 rounded-md px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer">
						<Plus size={14} />
						Add Project
					</button>
				</div>

				{#if showProjectForm}
					<div class="bg-surface rounded-lg border border-border p-4 mb-4">
						<div class="flex gap-3">
							<input type="text" placeholder="Project name" bind:value={projectName} class="flex-1 bg-bg border border-border rounded px-3 py-2 text-sm text-text placeholder:text-text-secondary/50" />
							<input type="number" placeholder="Budget hours" step="1" bind:value={projectBudget} class="w-36 bg-bg border border-border rounded px-3 py-2 text-sm text-text placeholder:text-text-secondary/50 font-mono" />
							<button onclick={saveProject} class="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded text-sm font-medium transition-colors cursor-pointer">Save</button>
							<button onclick={() => { showProjectForm = false; editingProjectId = null; }} class="px-4 py-2 text-text-secondary hover:text-text border border-border rounded text-sm transition-colors cursor-pointer">Cancel</button>
						</div>
					</div>
				{/if}

				<div class="space-y-3">
					{#each filteredProjects as project (project.id)}
						<div class="bg-surface rounded-lg border border-border overflow-hidden {project.archived ? 'opacity-60' : ''}">
							<div class="flex items-center gap-3 px-4 py-3 border-b border-border">
								<div class="w-1.5 h-8 rounded-full" style="background-color: {selectedClient.color}"></div>
								<div class="flex-1">
									<div class="text-sm font-medium">{project.name}</div>
									<div class="text-xs text-text-secondary">
										<span class="font-mono">{(project.total_hours || 0).toFixed(1)}h</span> logged
										{#if project.budget_hours}
											<span class="mx-1">/</span>
											<span class="font-mono">{project.budget_hours}h</span> budget
										{/if}
									</div>
								</div>
								<div class="flex items-center gap-1">
									<button onclick={() => startEditProject(project)} class="p-1.5 rounded text-text-secondary hover:text-accent hover:bg-accent/10 transition-colors cursor-pointer"><Pencil size={14} /></button>
									<button onclick={() => toggleArchiveProject(project)} class="p-1.5 rounded text-text-secondary hover:text-accent hover:bg-accent/10 transition-colors cursor-pointer">
										{#if project.archived}<ArchiveRestore size={14} />{:else}<Archive size={14} />{/if}
									</button>
								</div>
							</div>

							<!-- Tasks -->
							<div class="px-4 py-2">
								<div class="text-xs text-text-secondary uppercase tracking-wider mb-2">Tasks</div>
								<div class="space-y-1">
									{#each getTasksForProject(project.id) as task (task.id)}
										{#if editingTaskId === task.id}
											<div class="flex items-center gap-2">
												<input type="text" bind:value={editTaskName} class="flex-1 bg-bg border border-border rounded px-2 py-1 text-sm text-text" />
												<button onclick={saveTask} class="p-1 rounded text-timer-green hover:bg-timer-green/15 transition-colors cursor-pointer"><Check size={12} /></button>
												<button onclick={() => (editingTaskId = null)} class="p-1 rounded text-text-secondary hover:bg-border/30 transition-colors cursor-pointer"><X size={12} /></button>
											</div>
										{:else}
											<div class="flex items-center gap-2 group">
												<span class="text-sm text-text-secondary flex-1">{task.name}</span>
												<button onclick={() => startEditTask(task)} class="p-1 rounded text-text-secondary/0 group-hover:text-text-secondary hover:text-accent transition-colors cursor-pointer"><Pencil size={12} /></button>
												<button onclick={() => deleteTask(task.id)} class="p-1 rounded text-text-secondary/0 group-hover:text-text-secondary hover:text-danger transition-colors cursor-pointer"><Trash2 size={12} /></button>
											</div>
										{/if}
									{/each}
									<!-- Add task inline -->
									<div class="flex items-center gap-2 mt-1">
										<input
											type="text"
											placeholder="Add task..."
											bind:value={newTaskName}
											onkeydown={(e) => { if (e.key === 'Enter') addTask(project.id); }}
											class="flex-1 bg-transparent border-b border-border/50 px-1 py-1 text-sm text-text placeholder:text-text-secondary/40 focus:border-accent focus:outline-none"
										/>
										<button onclick={() => addTask(project.id)} disabled={!newTaskName.trim()} class="p-1 rounded text-accent hover:bg-accent/10 transition-colors disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"><Plus size={14} /></button>
									</div>
								</div>
							</div>
						</div>
					{/each}

					{#if filteredProjects.length === 0}
						<div class="bg-surface rounded-lg border border-border px-4 py-12 text-center text-text-secondary text-sm">
							No projects for this client yet. Click "Add Project" to create one.
						</div>
					{/if}
				</div>
			{:else}
				<div class="bg-surface rounded-lg border border-border px-4 py-12 text-center text-text-secondary text-sm">
					Select a client to view their projects, or create a new client to get started.
				</div>
			{/if}
		</div>
	</div>
</div>
