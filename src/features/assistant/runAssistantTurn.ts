import { createAsyncThunk } from '@reduxjs/toolkit';
import type { RootState, AppDispatch } from '../../store';
import { addAssistantMessage, setLoading } from '../../store/assistantSlice';
import { planToolCalls } from './mockPlanner';
import { summarizeFromState, slackFromSummary } from './helpers';

// Import your RTK Query API that has endpoints: investigateAlert, isolateAlert, createJiraTicket
// Adjust the import path and endpoint names to your actual api slice.
import { alertsApi } from '../alerts/alertsApi';

export const runAssistantTurn = createAsyncThunk<void, void, { state: RootState; dispatch: AppDispatch }>(
	'assistant/runTurn',
	async (_, { getState, dispatch }) => {
		dispatch(setLoading(true));
		try {
			const state = getState();
			const lastUser = [...state.assistant.chat].reverse().find(m => m.role === 'user');
			const userText = lastUser?.content || '';

			const context = {
				tenantName: state.tenants.tenants.find(t => t.id === state.tenants.currentTenantId)?.name ?? 'Tenant',
				projectName: state.projects.currentProjectId
					? state.projects.projects.find(p => p.id === state.projects.currentProjectId)?.name ?? null
					: null,
				filters: state.filters,
			};

			// Frontend-only “LLM” plan
			const { assistantPreface, toolCalls } = planToolCalls(userText, context);

			const outputs: string[] = [];
			const safeMode = state.assistant.safeMode;
			const lastUserLower = userText.toLowerCase();

			for (const call of toolCalls) {
				const { name, arguments: argsJson } = call.function;
				let args: any = {};
				try { args = JSON.parse(argsJson || '{}'); } catch { }

				if (name === 'summarize_alerts') {
					outputs.push(summarizeFromState(state, args));
				} else if (name === 'draft_slack') {
					const base = args.summary && args.summary.length > 0 ? args.summary : summarizeFromState(state, {});
					outputs.push(`Slack draft:\n${slackFromSummary(base, state)}`);
				} else if (name === 'investigate_alert' && args.alertId) {
					await dispatch(alertsApi.endpoints.investigateAlert.initiate(args.alertId)).unwrap();
					outputs.push(`Investigation started for ${args.alertId}.`);
				} else if (name === 'isolate_alert' && args.alertId) {
					const confirmed = /confirm|yes, isolate|proceed/.test(lastUserLower);
					if (safeMode && !confirmed) {
						outputs.push(`I can isolate ${args.alertId}, but need your confirmation. Reply "confirm isolate ${args.alertId}" to proceed.`);
					} else {
						await dispatch(alertsApi.endpoints.isolateAlert.initiate(args.alertId)).unwrap();
						outputs.push(`Isolation initiated for ${args.alertId}.`);
					}
				} else if (name === 'create_jira_ticket' && args.alertId) {
					const res = await dispatch(
						alertsApi.endpoints.createJiraTicket.initiate({
							alertId: args.alertId,
							projectKey: 'RAD',
							title: `Follow-up on ${args.alertId}`,
							description: `Created via Assistant with current dashboard context.`,
							priority: args.priority ?? 'High',
						})
					).unwrap();
					outputs.push(`JIRA created: ${res.id} (${res.url})`);
				}
			}

			const reply = [assistantPreface, ...outputs].filter(Boolean).join('\n\n');
			const trimmed = reply.length > 4000 ? reply.slice(0, 4000) + '…' : reply;
			dispatch(addAssistantMessage(trimmed || 'Done.'));
		} catch (e) {
			dispatch(addAssistantMessage('Sorry—assistant failed to respond.'));
		} finally {
			dispatch(setLoading(false));
		}
	}
);