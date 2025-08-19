import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export type Alert = {
	id: string;
	summary: string;
	severity: 'Low' | 'Medium' | 'High' | 'Critical';
	category: 'Runtime' | 'Identity' | 'Config' | 'Network';
	time: number;
	resourceType: string;
	projectId: string;
	tenantId: string;
};

interface AlertsState {
	alerts: Alert[];
}

const initialState: AlertsState = {
	alerts: [
		{
			id: 'a1',
			summary: 'Suspicious exec into kube-system pod',
			severity: 'Critical',
			category: 'Runtime',
			time: Date.now() - 1000 * 60 * 20,
			resourceType: 'Pod',
			projectId: 'p1',
			tenantId: 't1',
		},
		{
			id: 'a2',
			summary: 'ServiceAccount token used from unfamiliar IP',
			severity: 'High',
			category: 'Identity',
			time: Date.now() - 1000 * 60 * 60,
			resourceType: 'ServiceAccount',
			projectId: 'p2',
			tenantId: 't1',
		},
		{
			id: 'a3',
			summary: 'Unusual network activity detected',
			severity: 'Medium',
			category: 'Network',
			time: Date.now() - 1000 * 60 * 5,
			resourceType: 'Pod',
			projectId: 'p3',
			tenantId: 't2',
		},
		// Add more mock alerts as you like
	],
};

const alertsSlice = createSlice({
	name: 'alerts',
	initialState,
	reducers: {
		setAlerts: (state, action: PayloadAction<Alert[]>) => {
			state.alerts = action.payload;
		},
		addAlert: (state, action: PayloadAction<Alert>) => {
			state.alerts.unshift(action.payload); // latest at top
		},
		clearAlerts: (state) => {
			state.alerts = [];
		}
	},
});

export const { setAlerts, addAlert, clearAlerts } = alertsSlice.actions;
export default alertsSlice.reducer;