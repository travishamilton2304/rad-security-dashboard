export type ToolCall = {
	id: string;
	type: 'function';
	function: { name: string; arguments: string };
};

export function planToolCalls(userText: string, context: {
	tenantName: string;
	projectName: string | null;
	filters: { severity: string[]; category: string[]; timeRange: 'lastHour' | 'last24h' | 'last7d' };
}) {
	const text = userText.toLowerCase();

	const wantsSummary = /(summar(ize|y)|overview|recap)/.test(text);
	const wantsSlack = /\bslack\b|\bpost\b|\bmessage\b/.test(text);
	const wantsJira = /\bjira\b|\bticket\b|\bissue\b/.test(text);
	const wantsInvestigate = /\binvestigat(e|ion)\b/.test(text);
	const wantsIsolate = /\bisolat(e|ion)\b/.test(text);

	const sev = Array.from(text.matchAll(/\b(critical|high|medium|low)\b/g)).map((m) => m[1]);
	const cat = Array.from(text.matchAll(/\b(runtime|identity|config|network)\b/g)).map((m) => m[1]);
	const alertId = text.match(/\b(a[_-]?\w+)\b/)?.[1];

	const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

	const calls: ToolCall[] = [];

	if (wantsSummary || (!wantsSlack && !wantsJira && !wantsInvestigate && !wantsIsolate)) {
		calls.push({
			id: `tool_${Date.now()}_sum`,
			type: 'function',
			function: {
				name: 'summarize_alerts',
				arguments: JSON.stringify({
					severity: sev.length ? sev.map(cap) : undefined,
					category: cat.length ? cat.map(cap) : undefined,
					limit: 20,
				}),
			},
		});
	}

	if (wantsSlack) {
		calls.push({
			id: `tool_${Date.now()}_slack`,
			type: 'function',
			function: { name: 'draft_slack', arguments: JSON.stringify({ summary: '' }) },
		});
	}

	if (wantsInvestigate && alertId) {
		calls.push({
			id: `tool_${Date.now()}_inv`,
			type: 'function',
			function: { name: 'investigate_alert', arguments: JSON.stringify({ alertId }) },
		});
	}

	if (wantsIsolate && alertId) {
		calls.push({
			id: `tool_${Date.now()}_iso`,
			type: 'function',
			function: { name: 'isolate_alert', arguments: JSON.stringify({ alertId }) },
		});
	}

	if (wantsJira && alertId) {
		calls.push({
			id: `tool_${Date.now()}_jira`,
			type: 'function',
			function: {
				name: 'create_jira_ticket',
				arguments: JSON.stringify({ alertId, priority: sev[0] ? cap(sev[0]) : 'High' }),
			},
		});
	}

	const assistantPreface =
		`Working on it for ${context.tenantName} — ${context.projectName ?? 'All Projects'}.\n` +
		`Filters: severity=${context.filters.severity.join(', ') || 'any'}, category=${context.filters.category.join(', ') || 'any'}, time=${context.filters.timeRange}.\n` +
		`I will ${describe(calls)}.`;

	return { assistantPreface, toolCalls: calls };
}

function describe(calls: ToolCall[]) {
	if (calls.length === 0) return 'provide guidance';
	return calls.map((c) => c.function.name.replace('_', ' ')).join(', then ');
}