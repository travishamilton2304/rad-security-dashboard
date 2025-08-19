import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export type Severity = 'Low' | 'Medium' | 'High' | 'Critical';
export type Category = 'Runtime' | 'Identity' | 'Config' | 'Network';
export type TimeRange = 'lastHour' | 'last24h' | 'last7d';

export interface FiltersState {
    severity: Severity[];
    category: Category[];
    timeRange: TimeRange;
    projectId: string | null;
    cluster: string | null;
}

const initialState: FiltersState = {
    severity: [],
    category: [],
    timeRange: 'last24h',
    projectId: null,
    cluster: null,
};

const filtersSlice = createSlice({
    name: 'filters',
    initialState,
    reducers: {
        setSeverity: (state, action: PayloadAction<Severity[]>) => {
            state.severity = action.payload;
        },
        setCategory: (state, action: PayloadAction<Category[]>) => {
            state.category = action.payload;
        },
        setTimeRange: (state, action: PayloadAction<TimeRange>) => {
            state.timeRange = action.payload;
        },
        setProjectId: (state, action: PayloadAction<string | null>) => {
            state.projectId = action.payload;
        },
        setCluster: (state, action: PayloadAction<string | null>) => {
            state.cluster = action.payload;
        },
        clearFilters: (state) => {
            state.severity = [];
            state.category = [];
            state.timeRange = 'last24h';
            state.projectId = null;
            state.cluster = null;
        }
    },
});

export const {
    setSeverity,
    setCategory,
    setTimeRange,
    setProjectId,
    setCluster,
    clearFilters,
} = filtersSlice.actions;

export default filtersSlice.reducer;