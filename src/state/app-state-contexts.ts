import { createContext } from 'react';

import type { LumiEditorState } from '@state/lumi-editor/types';
import type { AppActions, ChatState } from '@state/app-state-types';

export const ChatStateContext = createContext<ChatState | null>(null);
export const EditorStateContext = createContext<LumiEditorState | null>(null);
export const AppActionsContext = createContext<AppActions | null>(null);
