import { useState } from 'react';
import TenantProjectSwitcher from './components/TenantProjectSwitcher';
import AlertsFilters from './components/AlertsFilters';
import ThreatOverview from './components/ThreatOverview';
import AlertsTable from './components/AlertsTable';
import StreamControls from './components/StreamControls';
import useMockThreatStream from './hooks/useMockThreatStream';
import { Toaster } from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import { clearAlerts } from './store/alertsSlice';
import AssistantLauncher from './components/AssistantLauncher';
import AssistantPanel from './components/AssistantPanel';
import './index.css';

function App() {
	const [streamEnabled, setStreamEnabled] = useState(true);
	useMockThreatStream({ enabled: streamEnabled, minMs: 2000, maxMs: 5000 });

	const dispatch = useDispatch();

	return (
		<div className="min-h-screen bg-gray-50">
			<header className="bg-white shadow">
				<h1 className="text-2xl font-bold p-4">RAD Security Threat Dashboard</h1>
			</header>

			<div className="px-4 sm:px-6 lg:px-8">
				<TenantProjectSwitcher />
				<AlertsFilters />
				<StreamControls
					enabled={streamEnabled}
					setEnabled={setStreamEnabled}
					onClear={() => dispatch(clearAlerts())}
				/>
				<ThreatOverview />
				<AlertsTable />
				<AssistantLauncher />
				<AssistantPanel />
			</div>

			<Toaster position="top-right" />
		</div>
	);
}

export default App;