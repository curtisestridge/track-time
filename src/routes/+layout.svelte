<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
	import { invalidate } from '$app/navigation';
	import { Clock, Calendar, FolderOpen, BarChart3, Square, Play, Settings } from 'lucide-svelte';
	import { onMount, onDestroy } from 'svelte';
	import type { TimeEntry, Project, Task } from '$lib/types.js';

	let { data, children } = $props();

	let runningTimerOverride: TimeEntry | null = $state(null);
	let hasOverride = $state(false);
	let runningTimer = $derived(hasOverride ? runningTimerOverride : (data.runningTimer as TimeEntry | null));

	function setRunningTimer(value: TimeEntry | null) {
		runningTimerOverride = value;
		hasOverride = true;
	}
	let elapsed = $state('00:00:00');
	let timerInterval: ReturnType<typeof setInterval> | null = null;

	// Timer form state
	let showTimerForm = $state(false);
	let timerProjectId = $state('');
	let timerTaskId = $state('');
	let timerNotes = $state('');
	let offsetHH = $state('00');
	let offsetMM = $state('00');
	let availableTasks: Task[] = $state([]);

	let projects = $derived(data.projects as Project[]);
	let allTasks = $derived(data.tasks as Task[]);

	function updateElapsed() {
		if (!runningTimer?.timer_started_at) {
			elapsed = '00:00:00';
			return;
		}
		const started = new Date(runningTimer.timer_started_at).getTime();
		const diff = Date.now() - started;
		const h = Math.floor(diff / 3600000);
		const m = Math.floor((diff % 3600000) / 60000);
		const s = Math.floor((diff % 60000) / 1000);
		elapsed = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
	}

	onMount(() => {
		updateElapsed();
		timerInterval = setInterval(updateElapsed, 1000);
	});

	$effect(() => {
		if (showTimerForm) {
			loadLastTimer();
		}
	});

	onDestroy(() => {
		if (timerInterval) clearInterval(timerInterval);
	});

	function onProjectChange() {
		const pid = Number(timerProjectId);
		availableTasks = allTasks.filter(t => t.project_id === pid);
		timerTaskId = '';
	}

	async function loadLastTimer() {
		const res = await fetch('/api/timer/last');
		if (!res.ok) return;
		const last = await res.json();
		if (!last) return;

		const project = projects.find(p => p.id === last.project_id && !p.archived);
		if (!project) return;

		timerProjectId = String(last.project_id);
		availableTasks = allTasks.filter(t => t.project_id === last.project_id);

		const task = availableTasks.find(t => t.id === last.task_id);
		if (task) {
			timerTaskId = String(last.task_id);
		}
	}

	async function handleStartTimer() {
		if (!timerProjectId || !timerTaskId) return;
		const offsetSeconds = (parseInt(offsetHH) || 0) * 3600 + (parseInt(offsetMM) || 0) * 60;
		const res = await fetch('/api/timer/start', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				project_id: Number(timerProjectId),
				task_id: Number(timerTaskId),
				notes: timerNotes,
				offset_seconds: offsetSeconds
			})
		});
		if (res.ok) {
			setRunningTimer(await res.json());
			showTimerForm = false;
			timerProjectId = '';
			timerTaskId = '';
			timerNotes = '';
			offsetHH = '00';
			offsetMM = '00';
			updateElapsed();
		}
	}

	async function handleStopTimer() {
		const res = await fetch('/api/timer/stop', { method: 'POST' });
		if (res.ok) {
			setRunningTimer(null);
			elapsed = '00:00:00';
			await invalidate('app:time-entries');
		}
	}

	const navItems = [
		{ href: '/timesheets', label: 'Timesheets', icon: Calendar },
		{ href: '/projects', label: 'Projects', icon: FolderOpen },
		{ href: '/reports', label: 'Reports', icon: BarChart3 }
	];
</script>

<div class="flex h-screen overflow-hidden">
	<!-- Sidebar -->
	<aside class="w-60 bg-surface border-r border-border flex flex-col shrink-0">
		<!-- Logo -->
		<div class="p-5 border-b border-border">
			<h1 class="text-lg font-semibold text-text flex items-center gap-2">
				<Clock size={20} class="text-accent" />
				Track Time
			</h1>
			<div class="text-xs text-text-secondary mt-1">{data.companyName}</div>
		</div>

		<!-- Navigation -->
		<nav class="flex-1 p-3 flex flex-col">
			<div class="space-y-1 flex-1">
				{#each navItems as item}
					{@const isActive = $page.url.pathname.startsWith(item.href)}
					<a
						href={item.href}
						class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors {isActive
							? 'bg-accent/15 text-accent font-medium'
							: 'text-text-secondary hover:bg-border/30 hover:text-text'}"
					>
						<item.icon size={18} />
						{item.label}
					</a>
				{/each}
			</div>
			<div class="border-t border-border pt-2 mt-2">
				<a
					href="/settings"
					class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors {$page.url.pathname.startsWith('/settings')
						? 'bg-accent/15 text-accent font-medium'
						: 'text-text-secondary hover:bg-border/30 hover:text-text'}"
				>
					<Settings size={18} />
					Settings
				</a>
			</div>
		</nav>

		<!-- Timer Widget -->
		<div class="p-3 border-t border-border">
			{#if runningTimer}
				<div class="bg-timer-green/10 border border-timer-green/30 rounded-lg p-3">
					<div class="flex items-center gap-2 mb-1">
						<div class="w-2 h-2 rounded-full bg-timer-green timer-pulse"></div>
						<span class="text-xs text-timer-green font-medium uppercase tracking-wide">Running</span>
					</div>
					<div class="font-mono text-xl text-timer-green font-semibold mb-1">{elapsed}</div>
					<div class="text-xs text-text-secondary truncate mb-0.5">{runningTimer.project_name}</div>
					<div class="text-xs text-text-secondary/70 truncate mb-2">{runningTimer.task_name}</div>
					{#if runningTimer.notes}
						<div class="text-xs text-text-secondary/50 truncate mb-2">{runningTimer.notes}</div>
					{/if}
					<button
						onclick={handleStopTimer}
						class="w-full flex items-center justify-center gap-2 bg-danger/20 hover:bg-danger/30 text-danger border border-danger/30 rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer"
					>
						<Square size={12} />
						Stop Timer
					</button>
				</div>
			{:else if showTimerForm}
				<div class="bg-bg rounded-lg p-3 border border-border">
					<div class="space-y-2">
						<select
							bind:value={timerProjectId}
							onchange={onProjectChange}
							class="w-full bg-surface border border-border rounded-md px-2 py-1.5 text-xs text-text"
						>
							<option value="">Select project...</option>
							{#each projects.filter(p => !p.archived) as project}
								<option value={String(project.id)}>{project.client_name} — {project.name}</option>
							{/each}
						</select>
						<select
							bind:value={timerTaskId}
							disabled={!timerProjectId}
							class="w-full bg-surface border border-border rounded-md px-2 py-1.5 text-xs text-text disabled:opacity-40"
						>
							<option value="">Select task...</option>
							{#each availableTasks as task}
								<option value={String(task.id)}>{task.name}</option>
							{/each}
						</select>
						<input
							type="text"
							placeholder="Notes (optional)"
							bind:value={timerNotes}
							class="w-full bg-surface border border-border rounded-md px-2 py-1.5 text-xs text-text placeholder:text-text-secondary/50"
						/>
						<div>
							<div class="text-xs text-text-secondary mb-1">Time already worked</div>
							<div class="flex items-center gap-1">
								<input
									type="number"
									min="0"
									max="23"
									placeholder="00"
									bind:value={offsetHH}
									class="w-14 bg-surface border border-border rounded-md px-2 py-1.5 text-xs text-text text-center font-mono"
								/>
								<span class="text-xs text-text-secondary font-mono">:</span>
								<input
									type="number"
									min="0"
									max="59"
									placeholder="00"
									bind:value={offsetMM}
									class="w-14 bg-surface border border-border rounded-md px-2 py-1.5 text-xs text-text text-center font-mono"
								/>
							</div>
						</div>
						<div class="flex gap-2">
							<button
								onclick={handleStartTimer}
								disabled={!timerProjectId || !timerTaskId}
								class="flex-1 bg-timer-green/20 hover:bg-timer-green/30 text-timer-green border border-timer-green/30 rounded-md px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
							>
								Start
							</button>
							<button
								onclick={() => (showTimerForm = false)}
								class="px-3 py-1.5 text-xs text-text-secondary hover:text-text rounded-md border border-border transition-colors cursor-pointer"
							>
								Cancel
							</button>
						</div>
					</div>
				</div>
			{:else}
				<button
					onclick={() => (showTimerForm = true)}
					class="w-full flex items-center justify-center gap-2 bg-accent/15 hover:bg-accent/25 text-accent border border-accent/30 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer"
				>
					<Play size={14} />
					Start Timer
				</button>
			{/if}
		</div>
	</aside>

	<!-- Main content -->
	<main class="flex-1 overflow-y-auto">
		{@render children()}
	</main>
</div>
