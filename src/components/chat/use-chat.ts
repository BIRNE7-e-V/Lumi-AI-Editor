import { useContext } from 'react';

import { ChatContext } from '@components/chat/chat-context-def';

export function useChat() {
  const value = useContext(ChatContext);

  if (!value) {
    throw new Error('useChat must be used within ChatProvider');
  }

  return value;
}
