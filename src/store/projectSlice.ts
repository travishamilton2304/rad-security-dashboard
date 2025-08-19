import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

type Project = { id: string; tenantId: string; name: string };

interface ProjectsState {
  projects: Project[];
  currentProjectId: string | null;
}

const initialState: ProjectsState = {
  projects: [
    { id: 'p1', tenantId: 't1', name: 'Acme API' },
    { id: 'p2', tenantId: 't1', name: 'Acme Web' },
    { id: 'p3', tenantId: 't2', name: 'Globex Cloud' },
  ],
  currentProjectId: null,
};

const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    setCurrentProject: (state, action: PayloadAction<string | null>) => {
      state.currentProjectId = action.payload;
    },
  },
});

export const { setCurrentProject } = projectsSlice.actions;
export default projectsSlice.reducer;
export type { Project };