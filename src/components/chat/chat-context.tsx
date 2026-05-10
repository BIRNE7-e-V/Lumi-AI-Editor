import { createContext, useContext } from 'react';

type ChatContextValue = {
  languageMode: string;
  setLanguageMode: (value: string) => void;
  openSettings: () => void;
  openKeybinds: () => void;
};

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({
  value,
  children,
}: {
  value: ChatContextValue;
  children: React.ReactNode;
}) {
  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const value = useContext(ChatContext);

  if (!value) {
    throw new Error('useChat must be used within ChatProvider');
  }

  return value;
}
