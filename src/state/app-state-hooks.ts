import { useContext } from 'react';

import {
  AppActionsContext,
  ChatStateContext,
  EditorStateContext,
} from '@state/app-state-contexts';

export function useChatState() {
  const value = useContext(ChatStateContext);
  if (!value) throw new Error('useChatState must be used within AppStateProvider');
  return value;
}

export function useEditorState() {
  const value = useContext(EditorStateContext);
  if (!value) throw new Error('useEditorState must be used within AppStateProvider');
  return value;
}

export function useAppActions() {
  const value = useContext(AppActionsContext);
  if (!value) throw new Error('useAppActions must be used within AppStateProvider');
  return value;
}
