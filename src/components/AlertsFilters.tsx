import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import {
	setSeverity,
	setCategory,
	setTimeRange,
	clearFilters,
} from '../store/filtersSlice';

import type { Severity, Category, TimeRange } from '../store/filtersSlice';

const SEVERITIES: Severity[] = ['Critical', 'High', 'Medium', 'Low'];
const CATEGORIES: Category[] = ['Runtime', 'Identity', 'Config', 'Network'];
const TIME_RANGES: { label: string; value: TimeRange }[] = [
	{ label: 'Last Hour', value: 'lastHour' },
	{ label: 'Last 24 Hours', value: 'last24h' },
	{ label: 'Last 7 Days', value: 'last7d' }
];

export default function AlertsFilters() {
	const dispatch = useDispatch<AppDispatch>();
	const { severity, category, timeRange } = useSelector((state: RootState) => state.filters);

	function handleSeverityChange(ev: React.ChangeEvent<HTMLInputElement>) {
		const value = ev.target.value as Severity;
		if (ev.target.checked) {
			dispatch(setSeverity([...severity, value]));
		} else {
			dispatch(setSeverity(severity.filter(sev => sev !== value)));
		}
	}

	function handleCategoryChange(ev: React.ChangeEvent<HTMLInputElement>) {
		const value = ev.target.value as Category;
		if (ev.target.checked) {
			dispatch(setCategory([...category, value]));
		} else {
			dispatch(setCategory(category.filter(cat => cat !== value)));
		}
	}

	function handleTimeRangeChange(ev: React.ChangeEvent<HTMLSelectElement>) {
		dispatch(setTimeRange(ev.target.value as TimeRange));
	}

	return (
		<div className="bg-white shadow rounded-lg p-4 mx-auto my-4 max-w-6xl flex flex-col md:flex-row gap-6 items-center">
			{/* Severity Filter */}
			<div className="flex flex-col gap-1">
				<span className="font-semibold text-gray-700 mb-1">Severity:</span>
				<div className="flex flex-wrap gap-2">
					{SEVERITIES.map(sev => (
						<label key={sev} className="flex items-center gap-1">
							<input
								type="checkbox"
								value={sev}
								checked={severity.includes(sev)}
								onChange={handleSeverityChange}
								className="accent-red-600"
							/>
							<span>{sev}</span>
						</label>
					))}
				</div>
			</div>

			{/* Category Filter */}
			<div className="flex flex-col gap-1">
				<span className="font-semibold text-gray-700 mb-1">Category:</span>
				<div className="flex flex-wrap gap-2">
					{CATEGORIES.map(cat => (
						<label key={cat} className="flex items-center gap-1">
							<input
								type="checkbox"
								value={cat}
								checked={category.includes(cat)}
								onChange={handleCategoryChange}
								className="accent-blue-500"
							/>
							<span>{cat}</span>
						</label>
					))}
				</div>
			</div>

			{/* Time Range Filter */}
			<div className="flex flex-col gap-1">
				<label className="font-semibold text-gray-700 mb-1" htmlFor="time-range-select">Time Range:</label>
				<select
					id="time-range-select"
					className="border rounded px-2 py-1"
					value={timeRange}
					onChange={handleTimeRangeChange}
				>
					{TIME_RANGES.map(({ label, value }) => (
						<option key={value} value={value}>{label}</option>
					))}
				</select>
			</div>

			{/* Clear Filters Button */}
			<button
				className="mt-4 md:mt-0 ml-0 md:ml-auto px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded font-semibold text-gray-700"
				onClick={() => dispatch(clearFilters())}
			>
				Clear Filters
			</button>
		</div>
	);
}