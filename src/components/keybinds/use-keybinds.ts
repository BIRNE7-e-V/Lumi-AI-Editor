import { useEffect } from 'react';

export const KEYBINDS = [
  { label: 'Texteingabe fokussieren', key: 'T' },
  { label: 'Texteingabe verlassen', key: 'Esc' },
  { label: 'Sprachaufnahme starten / stoppen', key: 'A' },
  { label: 'Neues Gespräch starten', key: 'N' },
  { label: 'Hell / Dunkel umschalten', key: 'D' },
  { label: 'Diese Übersicht anzeigen', key: '?' },
] as const;

function getVisibleElement<T extends HTMLElement>(selector: string) {
  return Array.from(document.querySelectorAll<T>(selector)).find(
    (element) => element.offsetParent !== null
  );
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    target.isContentEditable
  );
}

type UseKeybindsOptions = {
  onChatCleared: () => void;
  onToggleMode: () => void;
  onOpenKeybinds: () => void;
};

export function useKeybinds({ onChatCleared, onToggleMode, onOpenKeybinds }: UseKeybindsOptions) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isTypingTarget(event.target)) {
        event.preventDefault();
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
        return;
      }

      if (isTypingTarget(event.target)) {
        return;
      }

      if (event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }

      const key = event.key.toLowerCase();

      if (key === 't') {
        event.preventDefault();
        getVisibleElement<HTMLInputElement>('[data-chat-input="true"]')?.focus();
        return;
      }

      if (key === 'a') {
        event.preventDefault();
        getVisibleElement<HTMLButtonElement>('[data-chat-record-button="true"]')?.click();
        return;
      }

      if (key === 'n') {
        event.preventDefault();
        onChatCleared();
        return;
      }

      if (key === 'd') {
        event.preventDefault();
        onToggleMode();
        return;
      }

      if (key === '?') {
        event.preventDefault();
        onOpenKeybinds();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onChatCleared, onToggleMode, onOpenKeybinds]);
}
