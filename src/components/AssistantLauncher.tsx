import { useDispatch, useSelector } from 'react-redux';
import { toggleAssistant } from '../store/assistantSlice';
import type { RootState } from '../store';

export default function AssistantLauncher() {
    const dispatch = useDispatch();
    const open = useSelector((s: RootState) => s.assistant.isOpen);
    return (
        <button
            className="fixed bottom-5 right-5 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg px-4 py-3 text-sm font-semibold"
            onClick={() => dispatch(toggleAssistant())}
            aria-label={open ? 'Close Assistant' : 'Open Assistant'}
        >
            Assistant
        </button>
    );
}