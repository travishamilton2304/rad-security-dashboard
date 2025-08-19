import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import {
	toggleAssistant,
	setCurrentInput,
	addUserMessage,
	setSafeMode,
} from '../store/assistantSlice';
import { runAssistantTurn } from '../features/assistant/runAssistantTurn';

export default function AssistantPanel() {
	const dispatch = useDispatch<AppDispatch>();
	const { isOpen, chat, currentInput, loading, safeMode } = useSelector((s: RootState) => s.assistant);

	const endRef = useRef<HTMLDivElement | null>(null);
	useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chat, loading]);

	function onSend() {
		const content = currentInput.trim();
		if (!content || loading) return;
		dispatch(addUserMessage(content));
		dispatch(setCurrentInput(''));
		dispatch(runAssistantTurn());
	}

	return (
		<div className={`fixed right-0 top-0 h-full w-full sm:w-[28rem] bg-white shadow-2xl border-l z-40 transform transition-transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
			<div className="flex items-center justify-between p-3 border-b">
				<div className="font-semibold">RAD Assistant</div>
				<div className="flex items-center gap-3">
					<label className="text-xs flex items-center gap-1">
						<input
							type="checkbox"
							className="accent-blue-600"
							checked={safeMode}
							onChange={(e) => dispatch(setSafeMode(e.target.checked))}
						/>
						Safe mode
					</label>
					<button className="text-sm px-2 py-1 rounded bg-gray-100 hover:bg-gray-200"
						onClick={() => dispatch(toggleAssistant())}>Close</button>
				</div>
			</div>

			<div className="p-3 overflow-y-auto h-[calc(100%-8rem)]">
				{chat.length === 0 && (
					<div className="text-gray-500 text-sm">
						Try: “Summarize Critical Runtime alerts”, “Draft a Slack update”, “Investigate a_12345”, or “Isolate a_12345”.
					</div>
				)}
				{chat.map((m) => (
					<div key={m.id} className={`mb-3 ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
						<div className={`inline-block px-3 py-2 rounded-lg text-sm ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900 whitespace-pre-wrap'}`}>
							{m.content}
						</div>
					</div>
				))}
				{loading && (
					<div className="text-left">
						<div className="inline-block px-3 py-2 rounded-lg text-sm bg-gray-100 text-gray-500">
							Typing…
						</div>
					</div>
				)}
				<div ref={endRef} />
			</div>

			<div className="p-3 border-t">
				<div className="flex items-end gap-2">
					<textarea
						className="flex-1 border rounded px-2 py-2 text-sm resize-none h-20"
						placeholder="e.g., Summarize Critical Runtime alerts and draft a Slack message."
						value={currentInput}
						onChange={(e) => dispatch(setCurrentInput(e.target.value))}
						onKeyDown={(e) => {
							if (e.key === 'Enter' && !e.shiftKey) {
								e.preventDefault();
								onSend();
							}
						}}
					/>
					<button
						className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
						onClick={onSend}
						disabled={loading}
					>
						Send
					</button>
				</div>
			</div>
		</div>
	);
}