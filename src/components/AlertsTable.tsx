import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import SimpleModal from './SimpleModal';
import {
	useInvestigateAlertMutation,
	useIsolateAlertMutation,
	useGenerateSlackSummaryMutation,
	useCreateJiraTicketMutation,
} from '../features/alerts/alertsApi';
import toast from 'react-hot-toast';

type ModalType = null | 'investigate' | 'isolate' | 'jira';

interface JiraFormState {
	projectKey: 'RAD' | string;
	title: string;
	description: string;
	priority: 'Low' | 'Medium' | 'High' | 'Critical';
	assignee: string;
}

// Helper to map FiltersState.timeRange -> milliseconds window
function timeRangeToMs(range: 'lastHour' | 'last24h' | 'last7d') {
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

export default function AlertsTable() {
	const alerts = useSelector((state: RootState) => state.alerts.alerts);
	const currentTenantId = useSelector(
		(state: RootState) => state.tenants.currentTenantId
	);
	const projects = useSelector((state: RootState) => state.projects.projects);
	const currentProjectId = useSelector(
		(state: RootState) => state.projects.currentProjectId
	);
	const { severity, category, timeRange } = useSelector(
		(state: RootState) => state.filters
	);

	// Modal State
	const [modalOpen, setModalOpen] = useState(false);
	const [modalType, setModalType] = useState<ModalType>(null);
	const [modalAlert, setModalAlert] = useState<any>(null);

	// JIRA form local state
	const [jiraForm, setJiraForm] = useState<JiraFormState>({
		projectKey: 'RAD',
		title: '',
		description: '',
		priority: 'High',
		assignee: '',
	});

	// RTK Query Mutations
	const [investigateAlert, { isLoading: isInvestigating }] =
		useInvestigateAlertMutation();
	const [isolateAlert, { isLoading: isIsolating }] =
		useIsolateAlertMutation();
	const [generateSlackSummary, { isLoading: isGeneratingSlack }] =
		useGenerateSlackSummaryMutation();
	const [createJiraTicket, { isLoading: isCreatingJira }] =
		useCreateJiraTicketMutation();

	// Apply tenant, project, severity, category, and timeRange filters
	const filteredAlerts = useMemo(() => {
		const since = Date.now() - timeRangeToMs(timeRange);
		return alerts.filter((alert) => {
			const project = projects.find((p) => p.id === alert.projectId);
			if (!project || project.tenantId !== currentTenantId) return false;
			if (currentProjectId && alert.projectId !== currentProjectId) return false;
			if (severity.length > 0 && !severity.includes(alert.severity)) return false;
			if (category.length > 0 && !category.includes(alert.category)) return false;
			if (alert.time < since) return false; // time range filter applied
			return true;
		});
	}, [
		alerts,
		projects,
		currentTenantId,
		currentProjectId,
		severity,
		category,
		timeRange,
	]);

	function formatDate(dateValue: string | number) {
		const date = new Date(dateValue);
		return date.toLocaleString();
	}

	function getProjectName(id: string) {
		return projects.find((p) => p.id === id)?.name || 'Unknown';
	}

	function severityColor(sev: string) {
		switch (sev) {
			case 'Critical':
				return 'bg-red-600 text-white';
			case 'High':
				return 'bg-orange-500 text-white';
			case 'Medium':
				return 'bg-yellow-400 text-gray-900';
			case 'Low':
				return 'bg-green-400 text-gray-900';
			default:
				return 'bg-gray-200 text-gray-900';
		}
	}

	function openModal(type: ModalType, alert: any) {
		setModalType(type);
		setModalAlert(alert);
		if (type === 'jira') {
			setJiraForm((prev) => ({
				...prev,
				title: `[${alert.severity}] ${alert.summary}`,
				description:
					`Alert ID: ${alert.id}\n` +
					`Project: ${getProjectName(alert.projectId)}\n` +
					`Category: ${alert.category}\n` +
					`Resource: ${alert.resourceType}\n` +
					`Time: ${formatDate(alert.time)}\n\n` +
					`Context:\n- Describe impact, blast radius, and indicators.\n\n` +
					`Remediation Plan:\n- Add steps here.`,
			}));
		}
		setModalOpen(true);
	}

	async function handleModalAction() {
		if (!modalAlert) return;
		try {
			if (modalType === 'investigate') {
				await investigateAlert(modalAlert.id).unwrap();
				toast.success('Investigation started!');
			} else if (modalType === 'isolate') {
				await isolateAlert(modalAlert.id).unwrap();
				toast.success('Resource isolated!');
			} else if (modalType === 'jira') {
				const res = await createJiraTicket({
					alertId: modalAlert.id,
					projectKey: jiraForm.projectKey || 'RAD',
					title: jiraForm.title || `[${modalAlert.severity}] ${modalAlert.summary}`,
					description: jiraForm.description,
					priority: jiraForm.priority,
					assignee: jiraForm.assignee || undefined,
				}).unwrap();
				toast.success(`JIRA created: ${res.id}`);
				window.open(res.url, '_blank', 'noopener,noreferrer');
			}
			setModalOpen(false);
		} catch (e: any) {
			toast.error(
				typeof e?.data === 'string' ? e.data : 'Action failed. Please retry.'
			);
		}
	}

	async function handleCopySlack(alert: any) {
		try {
			const { summary } = await generateSlackSummary({ alertId: alert.id }).unwrap();
			await navigator.clipboard.writeText(summary);
			toast.success('Slack summary copied to clipboard!');
		} catch (e: any) {
			toast.error('Failed to generate/copy Slack summary.');
		}
	}

	const actionPrimaryLabel =
		modalType === 'investigate'
			? isInvestigating
				? 'Investigating...'
				: 'Start Investigation'
			: modalType === 'isolate'
				? isIsolating
					? 'Isolating...'
					: 'Isolate'
				: modalType === 'jira'
					? isCreatingJira
						? 'Creating...'
						: 'Create Ticket'
					: undefined;

	const actionBusy = isInvestigating || isIsolating || isCreatingJira;

	return (
		<>
			<div className="overflow-x-auto bg-white shadow rounded-lg mt-6 mx-auto max-w-6xl">
				<table className="min-w-full divide-y divide-gray-200">
					<thead>
						<tr className="bg-gray-50">
							<th className="px-4 py-3 text-left font-semibold text-gray-700">
								Summary
							</th>
							<th className="px-4 py-3 text-left font-semibold text-gray-700">
								Severity
							</th>
							<th className="px-4 py-3 text-left font-semibold text-gray-700">
								Time
							</th>
							<th className="px-4 py-3 text-left font-semibold text-gray-700">
								Category
							</th>
							<th className="px-4 py-3 text-left font-semibold text-gray-700">
								Resource Type
							</th>
							<th className="px-4 py-3 text-left font-semibold text-gray-700">
								Project
							</th>
							<th className="px-4 py-3 text-left font-semibold text-gray-700">
								Actions
							</th>
						</tr>
					</thead>
					<tbody>
						{filteredAlerts.length === 0 && (
							<tr>
								<td colSpan={7} className="text-center px-4 py-6 text-gray-500">
									No alerts found for this selection.
								</td>
							</tr>
						)}
						{filteredAlerts.map((alert) => (
							<tr key={alert.id} className="hover:bg-gray-50">
								<td className="px-4 py-3">
									<span className="font-medium">{alert.summary}</span>
								</td>
								<td className="px-4 py-3">
									<span
										className={`inline-block px-2 py-1 rounded text-xs font-bold ${severityColor(
											alert.severity
										)}`}
									>
										{alert.severity}
									</span>
								</td>
								<td className="px-4 py-3">{formatDate(alert.time)}</td>
								<td className="px-4 py-3">{alert.category}</td>
								<td className="px-4 py-3">{alert.resourceType}</td>
								<td className="px-4 py-3">{getProjectName(alert.projectId)}</td>
								<td className="px-4 py-3 flex flex-wrap gap-2">
									<button
										className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold"
										onClick={() => openModal('investigate', alert)}
									>
										Investigate
									</button>
									<button
										className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold"
										onClick={() => openModal('isolate', alert)}
									>
										Isolate
									</button>
									<button
										className="px-2 py-1 bg-slate-700 hover:bg-slate-800 text-white rounded text-xs font-semibold disabled:opacity-60"
										onClick={() => handleCopySlack(alert)}
										disabled={isGeneratingSlack}
										title="Copy Slack Summary"
									>
										{isGeneratingSlack ? 'Generating...' : 'Copy Slack Summary'}
									</button>
									<button
										className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-semibold"
										onClick={() => openModal('jira', alert)}
									>
										Create JIRA
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			<SimpleModal
				open={modalOpen}
				title={
					modalType === 'investigate'
						? 'Investigate Alert'
						: modalType === 'isolate'
							? 'Isolate Resource'
							: modalType === 'jira'
								? 'Create JIRA Ticket'
								: ''
				}
				onClose={() => setModalOpen(false)}
				actionLabel={actionPrimaryLabel}
				onAction={handleModalAction}
				actionDisabled={actionBusy}
			>
				{modalAlert && modalType !== 'jira' && (
					<div className="text-gray-700 text-sm">
						<div>
							<span className="font-semibold">Summary:</span> {modalAlert.summary}
						</div>
						<div>
							<span className="font-semibold">Severity:</span> {modalAlert.severity}
						</div>
						<div>
							<span className="font-semibold">Time:</span> {formatDate(modalAlert.time)}
						</div>
						<div>
							<span className="font-semibold">Category:</span> {modalAlert.category}
						</div>
						<div>
							<span className="font-semibold">Resource Type:</span> {modalAlert.resourceType}
						</div>
						<div>
							<span className="font-semibold">Project:</span>{' '}
							{getProjectName(modalAlert.projectId)}
						</div>
						<div className="mt-2">
							{modalType === 'investigate' && (
								<span>
									Are you sure you want to start investigation for this alert?
								</span>
							)}
							{modalType === 'isolate' && (
								<span>Are you sure you want to isolate the affected resource?</span>
							)}
						</div>
					</div>
				)}

				{modalAlert && modalType === 'jira' && (
					<div className="text-gray-700 text-sm space-y-3">
						<div className="grid grid-cols-2 gap-2">
							<label className="flex flex-col">
								<span className="text-xs font-semibold mb-1">Project Key</span>
								<input
									className="border rounded px-2 py-1"
									value={jiraForm.projectKey}
									onChange={(e) =>
										setJiraForm((s) => ({ ...s, projectKey: e.target.value }))
									}
									placeholder="RAD"
								/>
							</label>
							<label className="flex flex-col">
								<span className="text-xs font-semibold mb-1">Priority</span>
								<select
									className="border rounded px-2 py-1"
									value={jiraForm.priority}
									onChange={(e) =>
										setJiraForm((s) => ({
											...s,
											priority: e.target.value as JiraFormState['priority'],
										}))
									}
								>
									<option>Low</option>
									<option>Medium</option>
									<option>High</option>
									<option>Critical</option>
								</select>
							</label>
						</div>

						<label className="flex flex-col">
							<span className="text-xs font-semibold mb-1">Title</span>
							<input
								className="border rounded px-2 py-1"
								value={jiraForm.title}
								onChange={(e) =>
									setJiraForm((s) => ({ ...s, title: e.target.value }))
								}
								placeholder="[High] Suspicious exec into kube-system pod"
							/>
						</label>

						<label className="flex flex-col">
							<span className="text-xs font-semibold mb-1">Description</span>
							<textarea
								className="border rounded px-2 py-1 min-h-[120px]"
								value={jiraForm.description}
								onChange={(e) =>
									setJiraForm((s) => ({ ...s, description: e.target.value }))
								}
								placeholder="Add context, reproduction steps, and remediation plan."
							/>
						</label>

						<label className="flex flex-col">
							<span className="text-xs font-semibold mb-1">Assignee (optional)</span>
							<input
								className="border rounded px-2 py-1"
								value={jiraForm.assignee}
								onChange={(e) =>
									setJiraForm((s) => ({ ...s, assignee: e.target.value }))
								}
								placeholder="jane.doe"
							/>
						</label>
					</div>
				)}
			</SimpleModal>
		</>
	);
}