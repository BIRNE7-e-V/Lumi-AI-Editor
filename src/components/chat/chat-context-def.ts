import { createContext } from 'react';

type ChatContextValue = {
  languageMode: string;
  setLanguageMode: (value: string) => void;
  openSettings: () => void;
  openKeybinds: () => void;
};

export const ChatContext = createContext<ChatContextValue | null>(null);
