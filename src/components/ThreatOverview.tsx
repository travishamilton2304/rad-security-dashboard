import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	Legend,
	PieChart,
	Pie,
	Cell,
} from 'recharts';
import type { Alert } from '../store/alertsSlice';
import type { TimeRange } from '../store/filtersSlice';

const SEVERITY_ORDER = ['Low', 'Medium', 'High', 'Critical'] as const;
const SEVERITY_COLORS: Record<string, string> = {
	Low: '#34D399',
	Medium: '#FBBF24',
	High: '#F97316',
	Critical: '#DC2626',
};
const CATEGORY_COLORS = ['#0EA5E9', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#14B8A6'];

function nowMs() {
	return Date.now();
}

function timeRangeToMs(range: TimeRange): number {
	switch (range) {
		case 'lastHour':
			return 60 * 60 * 1000;
		case 'last24h':
			return 24 * 60 * 60 * 1000;
		case 'last7d':
			return 7 * 24 * 60 * 60 * 1000;
		default:
			return 24 * 60 * 60 * 1000;
	}
}

export default function ThreatOverview() {
	const alerts: Alert[] = useSelector((s: RootState) => s.alerts.alerts);
	const projects = useSelector((s: RootState) => s.projects.projects);
	const currentTenantId = useSelector((s: RootState) => s.tenants.currentTenantId);
	const currentProjectId = useSelector((s: RootState) => s.projects.currentProjectId);
	const { severity, category, timeRange } = useSelector((s: RootState) => s.filters);

	// Filter alerts to match your table logic + time range
	const scopedAlerts = useMemo(() => {
		const since = nowMs() - timeRangeToMs(timeRange);
		return alerts.filter((a) => {
			const project = projects.find((p) => p.id === a.projectId);
			if (!project || project.tenantId !== currentTenantId) return false;
			if (currentProjectId && a.projectId !== currentProjectId) return false;
			if (severity.length > 0 && !severity.includes(a.severity)) return false;
			if (category.length > 0 && !category.includes(a.category)) return false;
			if (a.time < since) return false;
			return true;
		});
	}, [alerts, projects, currentTenantId, currentProjectId, severity, category, timeRange]);

	// 1) Time-series: bucket alerts by 5-minute windows and count per severity
	const timeSeriesData = useMemo(() => {
		const BUCKET_MS = 5 * 60 * 1000;
		const buckets = new Map<number, any>();

		for (const a of scopedAlerts) {
			const bucketTs = Math.floor(a.time / BUCKET_MS) * BUCKET_MS;
			if (!buckets.has(bucketTs)) {
				const init: any = { ts: bucketTs };
				SEVERITY_ORDER.forEach((s) => (init[s] = 0));
				buckets.set(bucketTs, init);
			}
			buckets.get(bucketTs)![a.severity] += 1;
		}

		return Array.from(buckets.entries())
			.sort((a, b) => a[0] - b[0])
			.map(([ts, row]) => ({ ...row, ts }));
	}, [scopedAlerts]);

	// 2) Category breakdown
	const categoryData = useMemo(() => {
		const map = new Map<string, number>();
		for (const a of scopedAlerts) {
			map.set(a.category, (map.get(a.category) || 0) + 1);
		}
		return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
	}, [scopedAlerts]);

	// 3) Top critical threats (recent High/Critical)
	const topCritical = useMemo(() => {
		return scopedAlerts
			.filter((a) => a.severity === 'Critical' || a.severity === 'High')
			.sort((a, b) => b.time - a.time)
			.slice(0, 10);
	}, [scopedAlerts]);

	function formatTs(ts: number) {
		const d = new Date(ts);
		return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	}

	return (
		<div className="mx-auto max-w-6xl mt-6 space-y-6">
			{/* Time-series */}
			<div className="bg-white shadow rounded-lg p-4">
				<div className="flex items-center justify-between mb-2">
					<h3 className="text-sm font-semibold text-gray-800">Threat Trend (by severity)</h3>
				</div>
				<div className="w-full h-64">
					<ResponsiveContainer width="100%" height="100%">
						<LineChart data={timeSeriesData} margin={{ top: 10, right: 16, left: -8, bottom: 0 }}>
							<CartesianGrid strokeDasharray="3 3" />
							<XAxis
								dataKey="ts"
								type="number"
								domain={['auto', 'auto']}
								tickFormatter={(v) => formatTs(v as number)}
							/>
							<YAxis allowDecimals={false} />
							<Tooltip
								labelFormatter={(v) => new Date(v as number).toLocaleString()}
								formatter={(val, name) => [val as number, name as string]}
							/>
							<Legend />
							{SEVERITY_ORDER.map((sev) => (
								<Line
									key={sev}
									type="monotone"
									dataKey={sev}
									stroke={SEVERITY_COLORS[sev]}
									strokeWidth={2}
									dot={false}
									isAnimationActive={false}
								/>
							))}
						</LineChart>
					</ResponsiveContainer>
				</div>
			</div>

			{/* Category + Top Critical */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<div className="bg-white shadow rounded-lg p-4 md:col-span-2">
					<h3 className="text-sm font-semibold text-gray-800 mb-2">Category Breakdown</h3>
					<div className="w-full h-64">
						<ResponsiveContainer width="100%" height="100%">
							<PieChart>
								<Pie
									data={categoryData}
									dataKey="value"
									nameKey="name"
									innerRadius={60}
									outerRadius={90}
									paddingAngle={3}
									label={(entry) => `${entry.name} (${entry.value})`}
									isAnimationActive={false}
								>
									{categoryData.map((_, idx) => (
										<Cell key={`cell-${idx}`} fill={CATEGORY_COLORS[idx % CATEGORY_COLORS.length]} />
									))}
								</Pie>
								<Tooltip formatter={(v, n) => [v as number, n as string]} />
							</PieChart>
						</ResponsiveContainer>
					</div>
				</div>

				<div className="bg-white shadow rounded-lg p-4">
					<h3 className="text-sm font-semibold text-gray-800 mb-2">Top Critical Threats</h3>
					<ul className="divide-y divide-gray-200">
						{topCritical.length === 0 && (
							<li className="py-3 text-gray-500 text-sm">No High/Critical alerts yet.</li>
						)}
						{topCritical.map((a) => (
							<li key={a.id} className="py-3">
								<div className="flex items-start gap-2">
									<span
										className="inline-block px-2 py-0.5 rounded text-xs font-bold text-white"
										style={{ backgroundColor: SEVERITY_COLORS[a.severity] }}
									>
										{a.severity}
									</span>
									<div className="min-w-0">
										<div className="text-sm font-medium text-gray-900 line-clamp-2">
											{a.summary}
										</div>
										<div className="text-xs text-gray-500">
											{new Date(a.time).toLocaleString()} • {a.category} • {a.resourceType}
										</div>
									</div>
								</div>
							</li>
						))}
					</ul>
				</div>
			</div>
		</div>
	);
}