import { configureStore } from '@reduxjs/toolkit';
import tenantsReducer from './tenantsSlice';
import projectsReducer from './projectSlice';
import alertsReducer from './alertsSlice';
import filtersReducer from './filtersSlice';
import assistantReducer from './assistantSlice';

export const store = configureStore({
	reducer: {
		tenants: tenantsReducer,
		projects: projectsReducer,
		alerts: alertsReducer,
		filters: filtersReducer,
		assistant: assistantReducer,
	},
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;