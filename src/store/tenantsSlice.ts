import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

type Tenant = { id: string; name: string };

interface TenantsState {
	tenants: Tenant[];
	currentTenantId: string | null;
}

const initialState: TenantsState = {
	tenants: [
		{ id: 't1', name: 'Acme Corp' },
		{ id: 't2', name: 'Globex' },
	],
	currentTenantId: 't1',
};

const tenantsSlice = createSlice({
	name: 'tenants',
	initialState,
	reducers: {
		setCurrentTenant: (state, action: PayloadAction<string>) => {
			state.currentTenantId = action.payload;
		},
	},
});

export const { setCurrentTenant } = tenantsSlice.actions;
export default tenantsSlice.reducer;
export type { Tenant };