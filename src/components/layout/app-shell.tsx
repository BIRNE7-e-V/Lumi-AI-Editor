import {
  ArrowLeftIcon,
  Cog6ToothIcon,
  CommandLineIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { Link, useRouterState } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { twMerge } from 'tailwind-merge';

import { useEditorState, useAppActions } from '@state';
import { ChatProvider } from '@components/chat/chat-context';
import { KeybindsModal } from '@components/keybinds/keybinds-modal';
import { SettingsModal } from '@components/settings/settings-modal';
import { AppHeader } from '@components/layout/app-header';
import { AppFooter } from '@components/layout/app-footer';
import { ThemeToggle } from '@components/theme/theme-toggle';

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isEditorRoute = pathname === '/editor' || pathname === '/';
  const editor = useEditorState();
  const actions = useAppActions();
  const [languageMode, setLanguageMode] = useState(
    () => localStorage.getItem('sprache') ?? 'standard'
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [keybindsOpen, setKeybindsOpen] = useState(false);

  const chatContextValue = useMemo(
    () => ({
      languageMode,
      setLanguageMode,
      openSettings: () => setSettingsOpen(true),
      openKeybinds: () => setKeybindsOpen(true),
    }),
    [languageMode]
  );

  return (
    <div className="h-dvh overflow-hidden bg-base-200 text-base-content">
      <ChatProvider value={chatContextValue}>
        <div className="flex h-full w-full flex-col">
          <AppHeader
            innerClassName={twMerge(!isEditorRoute && 'mx-auto max-w-screen-2xl')}
            leadingClassName={twMerge(isEditorRoute && 'shrink-0')}
            trailingClassName={twMerge(isEditorRoute && 'shrink-0')}
            wrap={!isEditorRoute}
            leading={
              isEditorRoute ? (
                <>
                  <button
                    className="btn btn-ghost btn-sm gap-2"
                    type="button"
                    onClick={() => {
                      actions.chatCleared();
                    }}
                  >
                    <PlusIcon className="size-4" />
                    Neues Gespräch
                  </button>
                  <select
                    className="select select-sm min-w-40 pr-8"
                    value={languageMode}
                    onChange={(event) => {
                      setLanguageMode(event.target.value);
                    }}
                  >
                    <option value="leichte">Leichte Sprache</option>
                    <option value="standard">Standard-Sprache</option>
                    <option value="fach">Fach-Sprache</option>
                  </select>
                </>
              ) : (
                <Link className="btn btn-ghost btn-sm gap-2" to="/editor">
                  <ArrowLeftIcon className="size-4" />
                  Zurück zum Editor
                </Link>
              )
            }
            trailing={
              <>
                {isEditorRoute ? (
                  <>
                    <div className="indicator">
                      {!editor.apiConfig.apiToken.trim() ? (
                        <span className="indicator-item status status-error" />
                      ) : null}
                      <button
                        className="btn btn-sm gap-2"
                        type="button"
                        onClick={() => setSettingsOpen(true)}
                      >
                        <Cog6ToothIcon className="size-4" />
                        KI-Einstellungen
                      </button>
                    </div>
                    <button
                      className="btn btn-ghost btn-sm gap-2"
                      type="button"
                      onClick={() => setKeybindsOpen(true)}
                    >
                      <CommandLineIcon className="size-4" />
                      Tastenkürzel
                    </button>
                  </>
                ) : null}
                <ThemeToggle />
              </>
            }
          />

          <main className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</main>
          <AppFooter
            compact={isEditorRoute}
            innerClassName={twMerge(!isEditorRoute && 'mx-auto max-w-screen-2xl')}
          />
        </div>

        <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
        <KeybindsModal open={keybindsOpen} onClose={() => setKeybindsOpen(false)} />
      </ChatProvider>
    </div>
  );
}
