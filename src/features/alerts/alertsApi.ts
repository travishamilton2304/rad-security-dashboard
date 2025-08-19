import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export type AlertId = string;

export interface SlackSummaryRequest {
	alertId: AlertId;
}

export interface SlackSummaryResponse {
	summary: string;
}

export interface JiraTicketRequest {
	alertId: AlertId;
	projectKey: string;
	title: string;
	description?: string;
	priority: 'Low' | 'Medium' | 'High' | 'Critical';
	assignee?: string;
}

export interface JiraTicketResponse {
	id: string;       // e.g., "RAD-1234"
	url: string;      // e.g., "https://jira.example.com/browse/RAD-1234"
}

function randomFail(prob = 0.1) {
	return Math.random() < prob;
}
function delay(ms: number) {
	return new Promise((res) => setTimeout(res, ms));
}

export const alertsApi = createApi({
	reducerPath: 'alertsApi',
	baseQuery: fetchBaseQuery({ baseUrl: '/api' }), // not used in mocked queryFn
	endpoints: (builder) => ({
		investigateAlert: builder.mutation<void, AlertId>({
			async queryFn(alertId) {
				console.log(alertId);
				await delay(800);
				if (randomFail(0.08)) {
					return { error: { status: 500, data: 'Failed to start investigation' } as any };
				}
				return { data: undefined };
			},
		}),
		isolateAlert: builder.mutation<void, AlertId>({
			async queryFn(alertId) {
				console.log(alertId);
				await delay(800);
				if (randomFail(0.08)) {
					return { error: { status: 500, data: 'Failed to isolate resource' } as any };
				}
				return { data: undefined };
			},
		}),
		generateSlackSummary: builder.mutation<SlackSummaryResponse, SlackSummaryRequest>({
			async queryFn({ alertId }) {
				await delay(500);
				if (randomFail(0.05)) {
					return { error: { status: 500, data: 'Failed to generate summary' } as any };
				}
				// Mocked LLM-ish summary text
				const summary =
					`:rotating_light: Critical alert triage\n` +
					`• Alert ID: ${alertId}\n` +
					`• Finding: Suspicious exec into kube-system pod\n` +
					`• Severity: High\n` +
					`• Impact: Potential privilege escalation path\n` +
					`• Recommended: Isolate the workload and rotate service account tokens\n` +
					`— Sent via RAD Assistant`;
				return { data: { summary } };
			},
		}),
		createJiraTicket: builder.mutation<JiraTicketResponse, JiraTicketRequest>({
			async queryFn(req) {
				await delay(700);
				if (randomFail(0.12)) {
					return { error: { status: 500, data: 'Failed to create JIRA ticket' } as any };
				}
				const numeric = Math.floor(1000 + Math.random() * 9000);
				const id = `${req.projectKey.toUpperCase()}-${numeric}`;
				const url = `https://jira.example.com/browse/${id}`;
				return { data: { id, url } };
			},
		}),
	}),
});

export const {
	useInvestigateAlertMutation,
	useIsolateAlertMutation,
	useGenerateSlackSummaryMutation,
	useCreateJiraTicketMutation,
} = alertsApi;