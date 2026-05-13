import { ChatContext } from '@components/chat/chat-context-def';

export function ChatProvider({
  value,
  children,
}: {
  value: {
    languageMode: string;
    setLanguageMode: (value: string) => void;
    openSettings: () => void;
    openKeybinds: () => void;
  };
  children: React.ReactNode;
}) {
  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
