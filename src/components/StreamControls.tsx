interface Props {
	enabled: boolean;
	setEnabled: (v: boolean) => void;
	onClear?: () => void;
}

export default function StreamControls({ enabled, setEnabled, onClear }: Props) {
	return (
		<div className="bg-white shadow rounded-lg p-3 mx-auto max-w-6xl mt-4 flex items-center gap-3">
			<label className="flex items-center gap-2">
				<input
					type="checkbox"
					className="accent-green-600"
					checked={enabled}
					onChange={(e) => setEnabled(e.target.checked)}
				/>
				<span className="text-sm">Live stream</span>
			</label>
			{onClear && (
				<button
					onClick={onClear}
					className="ml-auto px-3 py-1.5 bg-gray-200 hover:bg-gray-300 rounded text-sm font-semibold text-gray-700"
				>
					Clear Alerts
				</button>
			)}
		</div>
	);
}