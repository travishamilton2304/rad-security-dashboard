import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import { setCurrentTenant } from '../store/tenantsSlice';
import { setCurrentProject } from '../store/projectSlice';

export default function TenantProjectSwitcher() {
	const dispatch = useDispatch<AppDispatch>();

	// Get tenants and the selected tenant
	const tenants = useSelector((state: RootState) => state.tenants.tenants);
	const currentTenantId = useSelector((state: RootState) => state.tenants.currentTenantId);

	// Get projects filtered by tenant
	const allProjects = useSelector((state: RootState) => state.projects.projects);
	const currentProjectId = useSelector((state: RootState) => state.projects.currentProjectId);
	const projects = allProjects.filter(p => p.tenantId === currentTenantId);

	// Handlers
	const handleTenantChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		dispatch(setCurrentTenant(e.target.value));
		dispatch(setCurrentProject(null)); // Reset project selection when tenant changes
	};

	const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		dispatch(setCurrentProject(e.target.value || null));
	};

	return (
		<div className="flex flex-col sm:flex-row items-center gap-4 bg-white shadow rounded p-4 my-4 mx-auto max-w-3xl">
			{/* Tenant Switcher */}
			<div className="flex items-center gap-2">
				<label htmlFor="tenant-select" className="font-semibold text-gray-700">
					Tenant:
				</label>
				<select
					id="tenant-select"
					className="border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-400"
					value={currentTenantId || ''}
					onChange={handleTenantChange}
				>
					{tenants.map((tenant) => (
						<option key={tenant.id} value={tenant.id}>
							{tenant.name}
						</option>
					))}
				</select>
			</div>

			{/* Project Switcher */}
			<div className="flex items-center gap-2">
				<label htmlFor="project-select" className="font-semibold text-gray-700">
					Project:
				</label>
				<select
					id="project-select"
					className="border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-400"
					value={currentProjectId || ''}
					onChange={handleProjectChange}
				>
					<option value="">All Projects</option>
					{projects.map((project) => (
						<option key={project.id} value={project.id}>
							{project.name}
						</option>
					))}
				</select>
			</div>
		</div>
	);
}