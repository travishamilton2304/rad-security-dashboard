import type { RootState } from '../../store';
import type { Alert } from '../../store/alertsSlice';

export function timeRangeToMs(range: 'lastHour' | 'last24h' | 'last7d') {
	switch (range) {
		case 'lastHour': return 60 * 60 * 1000;
		case 'last24h': return 24 * 60 * 60 * 1000;
		case 'last7d': return 7 * 24 * 60 * 60 * 1000;
		default: return 24 * 60 * 60 * 1000;
	}
}

export function summarizeFromState(
	state: RootState,
	args: { severity?: Alert['severity'][]; category?: Alert['category'][]; limit?: number }
) {
	const since = Date.now() - timeRangeToMs(state.filters.timeRange);
	const scoped = state.alerts.alerts.filter((a) => {
		const project = state.projects.projects.find((p) => p.id === a.projectId);
		if (!project || project.tenantId !== state.tenants.currentTenantId) return false;
		if (state.projects.currentProjectId && a.projectId !== state.projects.currentProjectId) return false;
		if (state.filters.severity.length && !state.filters.severity.includes(a.severity)) return false;
		if (state.filters.category.length && !state.filters.category.includes(a.category)) return false;
		if (a.time < since) return false;
		return true;
	});

	const filtered = scoped
		.filter(a => !args.severity || args.severity.includes(a.severity))
		.filter(a => !args.category || args.category.includes(a.category))
		.sort((a, b) => b.time - a.time)
		.slice(0, args.limit ?? 20);

	return summarizeAlerts(filtered);
}

export function summarizeAlerts(alerts: Alert[]) {
	if (alerts.length === 0) return 'No alerts match the current scope and filters.';
	const sevOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 } as const;

	const bySev = new Map<string, number>();
	const byCat = new Map<string, number>();
	alerts.forEach(a => {
		bySev.set(a.severity, (bySev.get(a.severity) || 0) + 1);
		byCat.set(a.category, (byCat.get(a.category) || 0) + 1);
	});

	const sevStr = Array.from(bySev.entries())
		.sort((a, b) => (sevOrder as any)[a[0]] - (sevOrder as any)[b[0]])
		.map(([k, v]) => `${k}: ${v}`).join(', ');
	const catStr = Array.from(byCat.entries())
		.map(([k, v]) => `${k}: ${v}`).join(', ');

	const recent = alerts.slice(0, 5)
		.map(a => `- [${a.severity}] ${a.summary} (${a.category}, ${new Date(a.time).toLocaleString()})`)
		.join('\n');

	return `Summary:
- By severity: ${sevStr}
- By category: ${catStr}
Recent:
${recent}`;
}

export function slackFromSummary(summary: string, state: RootState) {
	const tenant = state.tenants.tenants.find(t => t.id === state.tenants.currentTenantId)?.name ?? 'Tenant';
	const project = state.projects.currentProjectId
		? state.projects.projects.find(p => p.id === state.projects.currentProjectId)?.name
		: 'All Projects';
	return `:rotating_light: Threat update for ${tenant} — ${project}\n${summary}\n\ncc @secops`;
}