import { createSlice, nanoid } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

type Role = 'user' | 'assistant';

export interface ChatMessage {
	id: string;
	role: Role;
	content: string;
}

interface AssistantState {
	isOpen: boolean;
	currentInput: string;
	loading: boolean;
	chat: ChatMessage[];
	safeMode: boolean; // require confirmation for risky actions
}

const initialState: AssistantState = {
	isOpen: false,
	currentInput: '',
	loading: false,
	chat: [],
	safeMode: true,
};

const assistantSlice = createSlice({
	name: 'assistant',
	initialState,
	reducers: {
		toggleAssistant(state) {
			state.isOpen = !state.isOpen;
		},
		setCurrentInput(state, action: PayloadAction<string>) {
			state.currentInput = action.payload;
		},
		addUserMessage: {
			reducer(state, action: PayloadAction<ChatMessage>) {
				state.chat.push(action.payload);
			},
			prepare(content: string) {
				return { payload: { id: nanoid(), role: 'user' as const, content } };
			},
		},
		addAssistantMessage: {
			reducer(state, action: PayloadAction<ChatMessage>) {
				state.chat.push(action.payload);
			},
			prepare(content: string) {
				return { payload: { id: nanoid(), role: 'assistant' as const, content } };
			},
		},
		setLoading(state, action: PayloadAction<boolean>) {
			state.loading = action.payload;
		},
		clearChat(state) {
			state.chat = [];
		},
		setSafeMode(state, action: PayloadAction<boolean>) {
			state.safeMode = action.payload;
		},
	},
});

export const {
	toggleAssistant,
	setCurrentInput,
	addUserMessage,
	addAssistantMessage,
	setLoading,
	clearChat,
	setSafeMode,
} = assistantSlice.actions;

export default assistantSlice.reducer;