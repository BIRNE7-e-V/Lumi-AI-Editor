import { EyeIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import { useCallback, useEffect, useState } from 'react';

import { useAppActions, useEditorState } from '@state';
import { useChat } from '@components/chat/use-chat';
import { useThemeMode } from '@components/theme/use-theme-mode';
import { ChatPanel } from '@components/chat/chat-panel';
import { EditorSidebar } from '@components/editor/editor-sidebar';
import { PreviewSidebar } from '@components/preview/preview-sidebar';
import { SIDE_PANEL_TOGGLE_WIDTH, SidePanel } from '@components/side-panel/side-panel';
import { useKeybinds } from '@components/keybinds/use-keybinds';

const PANEL_WIDTH_DEFAULT = 360;
const PREVIEW_WIDTH_DEFAULT = 380;
const MOCK_MODE = import.meta.env.VITE_MOCK_CHAT === 'true';
const MOCK_API = import.meta.env.VITE_MOCK_API === 'true';

export function ChatPage() {
  const editor = useEditorState();
  const actions = useAppActions();
  const { toggleMode } = useThemeMode();
  const { languageMode, openKeybinds, openSettings } = useChat();
  const [showEditor, setShowEditor] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [guidedCreationToken, setGuidedCreationToken] = useState(0);

  const canUseAi = MOCK_MODE || MOCK_API || Boolean(editor.apiConfig.apiToken.trim());
  const chatPanelPadding = {
    paddingLeft: `${SIDE_PANEL_TOGGLE_WIDTH / 2}px`,
    paddingRight: `${SIDE_PANEL_TOGGLE_WIDTH / 2}px`,
  };

  useEffect(() => {
    localStorage.setItem('sprache', languageMode);
    actions.chatLanguageModeChanged(languageMode);
  }, [languageMode, actions]);

  useEffect(() => {
    if (editor.worksheetLlmRevision > 0) setShowPreview(true);
  }, [editor.worksheetLlmRevision]);

  const startGuidedCreation = useCallback(() => {
    if (!canUseAi) {
      openSettings();
      return;
    }

    setGuidedCreationToken((value) => value + 1);
  }, [canUseAi, openSettings]);

  const handleStartGuidedCreation = useCallback(() => {
    startGuidedCreation();
  }, [startGuidedCreation]);

  useKeybinds({
    onChatCleared: actions.chatCleared,
    onToggleMode: toggleMode,
    onOpenKeybinds: openKeybinds,
  });

  return (
    <>
      <section className="bg-base-200 flex h-full min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="hidden h-full min-h-0 gap-2 overflow-hidden lg:flex">
            <SidePanel
              side="left"
              open={showEditor}
              defaultWidth={PANEL_WIDTH_DEFAULT}
              storageKey="lumi-editor-panel-width"
              onToggle={() => setShowEditor((v) => !v)}
              button={
                <div className="tooltip tooltip-right">
                  <div className="tooltip-content bg-secondary text-secondary-content rounded p-2 text-lg font-bold">
                    <div className="">
                      Bearbeitungs-Modus: Hier passt du dein Arbeitsblatt an. Dann als Kurs herunterladen
                    </div>
                  </div>

                  <button
                    aria-label={`Bearbeitungs-Modus ${showEditor ? 'schließen' : 'öffnen'}`}
                    className="btn btn-lg rounded-box border-base-300 bg-secondary text-secondary-content h-auto min-h-0 w-12 flex-col gap-2 border px-2 py-5 shadow-sm"
                    type="button"
                    onClick={() => setShowEditor((v) => !v)}
                  >
                    <PencilSquareIcon className="size-5 stroke-2" />
                    <span className="rotate-180 text-xs font-bold [writing-mode:vertical-rl]">
                      Bearbeitungs-Modus
                    </span>
                  </button>
                </div>
              }
            >
              <EditorSidebar
                canUseAi={canUseAi}
                onStartGuidedCreation={handleStartGuidedCreation}
              />
            </SidePanel>

            <div
              className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
              style={chatPanelPadding}
            >
              <ChatPanel
                canUseAi={canUseAi}
                guidedCreationToken={guidedCreationToken}
                onStartGuidedCreation={handleStartGuidedCreation}
              />
            </div>

            <SidePanel
              side="right"
              open={showPreview}
              defaultWidth={PREVIEW_WIDTH_DEFAULT}
              storageKey="lumi-preview-panel-width"
              onToggle={() => setShowPreview((v) => !v)}
              button={
                <div className="tooltip tooltip-left">
                  <div className="tooltip-content bg-primary text-primary-content rounded p-2 text-lg font-bold">
                    Vorschau: Hier siehst du, was du schon alles auf deinem Arbeitsblatt stehen
                    hast.
                  </div>
                  <button
                    aria-label={`Vorschau ${showPreview ? 'schließen' : 'öffnen'}`}
                    className="btn btn-lg rounded-box border-base-300 bg-primary text-primary-content h-auto min-h-0 w-12 flex-col gap-2 border px-2 py-5 shadow-sm"
                    type="button"
                    onClick={() => setShowPreview((v) => !v)}
                  >
                    <EyeIcon className="size-5 stroke-2" />
                    <span className="rotate-180 text-xs font-bold [writing-mode:vertical-rl]">
                      Vorschau
                    </span>
                  </button>
                </div>
              }
            >
              <PreviewSidebar />
            </SidePanel>
          </div>

          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden lg:hidden">
            <ChatPanel
              canUseAi={canUseAi}
              guidedCreationToken={guidedCreationToken}
              onStartGuidedCreation={handleStartGuidedCreation}
            />
          </div>
        </div>
      </section>
    </>
  );
}
