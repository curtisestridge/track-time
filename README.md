# Track Time

A local-first time tracking web app modeled after Harvest. Runs entirely on your machine with SQLite — no accounts, no external services.

## Setup

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

The database auto-initializes on first run with sample clients, projects, and tasks so you can start immediately.

## Features

- **Timesheets** — Daily view with week summary strip, inline add/edit/delete entries
- **Timer** — Persistent sidebar timer that survives page reloads (state stored in DB)
- **Projects & Clients** — Two-panel management with color-coded clients, budget tracking, inline task editing
- **Reports** — Bar and donut charts by project/client with date range presets and CSV export

## Database

SQLite database lives at `data/timetracker.db` (gitignored).

To back up your data, copy this file. To reset, delete it — a fresh DB with seed data will be created on next launch.

## Tech Stack

- SvelteKit + TypeScript
- SQLite via better-sqlite3
- Tailwind CSS v4
- Chart.js via svelte-chartjs
- Lucide icons
