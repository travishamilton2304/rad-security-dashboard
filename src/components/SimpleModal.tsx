import React from 'react';

interface SimpleModalProps {
	open: boolean;
	title: string;
	children: React.ReactNode;
	onClose: () => void;
	actionLabel?: string;
	onAction?: () => void;
	actionDisabled?: boolean;
}

export default function SimpleModal({
	open,
	title,
	children,
	onClose,
	actionLabel,
	onAction,
	actionDisabled = false,
}: SimpleModalProps) {
	if (!open) return null;
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75">
			<div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative">
				<button
					className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
					onClick={onClose}
					aria-label="Close"
				>
					×
				</button>
				<h2 className="text-lg font-bold mb-4">{title}</h2>
				<div className="mb-4">{children}</div>
				<div className="flex justify-end gap-2">
					<button
						className="px-4 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold"
						onClick={onClose}
						disabled={actionDisabled}
					>
						Cancel
					</button>
					{onAction && actionLabel && (
						<button
							className={`px-4 py-1 rounded text-white font-semibold ${actionDisabled
									? 'bg-blue-300 cursor-not-allowed'
									: 'bg-blue-600 hover:bg-blue-700'
								}`}
							onClick={onAction}
							disabled={actionDisabled}
						>
							{actionLabel}
						</button>
					)}
				</div>
			</div>
		</div>
	);
}