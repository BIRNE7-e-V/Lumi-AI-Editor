import {
  ArchiveBoxArrowDownIcon,
  PencilSquareIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { memo, useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from 'react';
import { twMerge } from 'tailwind-merge';

import { createContent, useAppActions, useEditorState } from '@state';
import type { Content } from '@state/lumi-editor/types';
import { getOrderedContent } from '@components/editor/utils';
import { AiContentModal } from '@components/editor/ai-content-modal';
import { INITIAL_AI_DIALOG, type AiDialogState } from '@components/editor/ai-dialog-types';
import { EditorContentCard } from '@components/editor/editor-content-card';
import { CONTENT_ACTIONS, transformContent } from '@components/editor/editor-sidebar-utils';

type H5PModules = typeof import('../../utils/h5p-generator');

const EmptyState = memo(function EmptyState({
  canUseAi,
  onStartGuidedCreation,
}: {
  canUseAi: boolean;
  onStartGuidedCreation: () => void;
}) {
  return (
    <div className="rounded-box border-base-300 bg-base-200/80 border border-dashed px-6 py-10 text-center">
      <div className="mx-auto flex max-w-sm flex-col items-center gap-4">
        <div className="bg-primary/10 text-primary rounded-full p-4">
          <SparklesIcon className="size-8" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">Arbeitsblatt starten</h3>
          <p className="text-base-content/70 text-sm leading-6">
            Füge einen Titel hinzu oder lass dir vom KI-Assistenten einen ersten Entwurf erstellen.
          </p>
        </div>
        <button
          className="btn btn-primary gap-2"
          disabled={!canUseAi}
          type="button"
          onClick={onStartGuidedCreation}
        >
          <SparklesIcon className="size-5" />
          Mit KI starten
        </button>
      </div>
    </div>
  );
});

const TitleField = memo(function TitleField({
  title,
  onChange,
}: {
  title: string;
  onChange: (title: string) => void;
}) {
  const [draft, setDraft] = useState(title);

  useEffect(() => {
    setDraft(title);
  }, [title]);

  return (
    <label className="form-control gap-2">
      <span className="label-text font-medium">Titel</span>
      <input
        className="input input-bordered w-full"
        placeholder="Titel des Arbeitsblatts"
        value={draft}
        onBlur={() => {
          if (draft !== title) {
            onChange(draft);
          }
        }}
        onChange={(event) => {
          setDraft(event.target.value);
        }}
      />
    </label>
  );
});

export const EditorSidebar = memo(function EditorSidebar({
  canUseAi,
  onStartGuidedCreation,
}: {
  canUseAi: boolean;
  onStartGuidedCreation: () => void;
}) {
  const editor = useEditorState();
  const actions = useAppActions();
  const orderedContent = useMemo(
    () => getOrderedContent(editor.content, editor.structure),
    [editor.content, editor.structure]
  );
  const h5pModulesRef = useRef<H5PModules | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<'before' | 'after'>('after');
  const [feedback, setFeedback] = useState<{ message: string; tone: 'error' | 'success' } | null>(
    null
  );
  const [feedbackFading, setFeedbackFading] = useState(false);
  const [aiBusy, setAiBusy] = useState<string | null>(null);
  const [h5pLoading, setH5pLoading] = useState(false);
  const [aiDialog, setAiDialog] = useState<AiDialogState>(INITIAL_AI_DIALOG);

  useEffect(() => {
    if (!feedback || feedback.tone !== 'success') {
      setFeedbackFading(false);
      return;
    }

    const fadeTimer = setTimeout(() => setFeedbackFading(true), 4500);
    const clearTimer = setTimeout(() => {
      setFeedback(null);
      setFeedbackFading(false);
    }, 5000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(clearTimer);
    };
  }, [feedback]);

  const applyGeneratedContent = useCallback(
    (
      result: Content,
      mode: 'create' | 'addBelow' | 'transform',
      targetContentId: string | null
    ) => {
      if (mode === 'create') {
        actions.worksheetContentAdded({ content: result, index: 0 });
        return;
      }

      if (mode === 'addBelow' && targetContentId) {
        const targetIndex = orderedContent.findIndex((entry) => entry.id === targetContentId);
        actions.worksheetContentAdded({ content: result, index: targetIndex + 1 });
        return;
      }

      if (mode === 'transform' && targetContentId) {
        actions.worksheetContentsSet(
          orderedContent.map((entry) =>
            entry.id === targetContentId ? { ...result, id: targetContentId } : entry
          )
        );
      }
    },
    [actions, orderedContent]
  );

  const handleAiContent = useCallback(
    async (
      type: 'text' | 'multiple-choice',
      mode: 'create' | 'addBelow' | 'transform',
      targetId: string | null,
      context?: string
    ) => {
      if (!canUseAi) {
        setFeedback({
          message: 'Bitte hinterlege zuerst einen API-Token in den KI-Einstellungen.',
          tone: 'error',
        });
        return false;
      }

      const busyKey = `${type}-${mode}-${targetId ?? 'root'}`;
      setAiBusy(busyKey);
      setFeedback(null);

      try {
        const result =
          type === 'text'
            ? await actions.generateText({ mode, targetContentId: targetId, context })
            : await actions.generateQuestion({ mode, targetContentId: targetId, context });

        applyGeneratedContent(result, mode, targetId);
        setFeedback({
          message:
            mode === 'transform'
              ? `${type === 'text' ? 'Text' : 'Frage'} erfolgreich mit KI umgewandelt.`
              : `${type === 'text' ? 'Text' : 'Frage'} erfolgreich mit KI erstellt.`,
          tone: 'success',
        });
        return true;
      } catch (error) {
        setFeedback({
          message:
            error instanceof Error
              ? error.message
              : `Fehler beim Generieren von ${type === 'text' ? 'Text' : 'Frage'}.`,
          tone: 'error',
        });
        return false;
      } finally {
        setAiBusy(null);
      }
    },
    [actions, applyGeneratedContent, canUseAi]
  );

  const openAiDialog = useCallback(
    (
      type: 'text' | 'multiple-choice',
      mode: 'create' | 'addBelow',
      targetContentId: string | null
    ) => {
      setAiDialog({
        open: true,
        type,
        mode,
        targetContentId,
        context: '',
      });
      setFeedback(null);
    },
    []
  );

  const closeAiDialog = useCallback(() => {
    if (aiBusy !== null) {
      return;
    }

    setAiDialog(INITIAL_AI_DIALOG);
  }, [aiBusy]);

  const handleAiDialogGenerate = useCallback(async () => {
    if (!aiDialog.open) {
      return;
    }

    const success = await handleAiContent(
      aiDialog.type,
      aiDialog.mode,
      aiDialog.targetContentId,
      aiDialog.context
    );

    if (success) {
      setAiDialog(INITIAL_AI_DIALOG);
    }
  }, [aiDialog, handleAiContent]);

  const preloadH5P = useCallback(() => {
    if (h5pModulesRef.current) {
      return;
    }

    void import('../../utils/h5p-generator').then((modules) => {
      h5pModulesRef.current = modules;
    });
  }, []);

  const loadH5PModules = useCallback(async (): Promise<H5PModules> => {
    if (h5pModulesRef.current) {
      return h5pModulesRef.current;
    }

    h5pModulesRef.current = await import('../../utils/h5p-generator');
    return h5pModulesRef.current;
  }, []);

  const handleH5PDownload = useCallback(async () => {
    if (h5pLoading || orderedContent.length === 0) {
      return;
    }

    setH5pLoading(true);
    setFeedback(null);

    try {
      const { downloadH5PPackage, generateH5PPackage } = await loadH5PModules();
      const blob = await generateH5PPackage(editor.title, orderedContent);
      const filename =
        editor.title
          .trim()
          .replace(/[^\p{L}\p{N}_\s-]/gu, '')
          .replace(/\s+/g, '-') || 'interactive-book';

      downloadH5PPackage(blob, filename);
      setFeedback({ message: 'H5P-Paket erfolgreich heruntergeladen.', tone: 'success' });
    } catch (error) {
      setFeedback({
        message:
          error instanceof Error ? error.message : 'H5P-Paket konnte nicht heruntergeladen werden.',
        tone: 'error',
      });
    } finally {
      setH5pLoading(false);
    }
  }, [editor.title, h5pLoading, loadH5PModules, orderedContent]);

  const handleDragStart = useCallback((event: DragEvent<HTMLButtonElement>, id: string) => {
    setDragId(id);
    event.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragEnd = useCallback(() => {
    setDragId(null);
    setDropTargetId(null);
  }, []);

  const handleDragOver = useCallback(
    (event: DragEvent<HTMLDivElement>, targetId: string) => {
      event.preventDefault();
      const rect = event.currentTarget.getBoundingClientRect();
      const midpoint = rect.top + rect.height / 2;
      const position = event.clientY < midpoint ? 'before' : 'after';

      if (dropTargetId !== targetId || dropPosition !== position) {
        setDropTargetId(targetId);
        setDropPosition(position);
      }
    },
    [dropPosition, dropTargetId]
  );

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>, targetId: string) => {
      event.preventDefault();

      if (dragId && dragId !== targetId) {
        const sourceIndex = orderedContent.findIndex((entry) => entry.id === dragId);
        const targetIndex = orderedContent.findIndex((entry) => entry.id === targetId);

        if (sourceIndex !== -1 && targetIndex !== -1) {
          const next = [...orderedContent];
          const [removed] = next.splice(sourceIndex, 1);
          let finalIndex = targetIndex;

          if (dropPosition === 'after') {
            finalIndex += 1;
          }

          if (sourceIndex < targetIndex) {
            finalIndex -= 1;
          }

          next.splice(finalIndex, 0, removed);
          actions.worksheetContentsSet(next);
        }
      }

      setDragId(null);
      setDropTargetId(null);
    },
    [actions, dragId, dropPosition, orderedContent]
  );

  return (
    <aside className="bg-base-100 flex h-full min-h-0 flex-col overflow-hidden shadow-sm">
      <header className="border-base-300 border-b px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="rounded-box bg-secondary/10 text-secondary p-2">
            <PencilSquareIcon className="size-5" />
          </div>
          <div>
            <h2 className="font-semibold">Editor</h2>
            <p className="text-base-content/60 text-xs">Titel, Inhalte und Struktur des Blatts.</p>
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        <div className="flex flex-col gap-5">
          <TitleField title={editor.title} onChange={actions.worksheetTitleChanged} />

          <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
            {CONTENT_ACTIONS.map((option) => (
              <button
                key={option.type}
                className="btn btn-outline h-auto min-h-0 gap-1.5 px-3 py-2 text-xs leading-tight whitespace-normal"
                type="button"
                onClick={() => {
                  actions.worksheetContentAdded({ content: createContent(option.type), index: 0 });
                }}
              >
                <option.icon className="size-4" />
                {option.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              className="btn btn-outline gap-2"
              disabled={!canUseAi || aiBusy !== null || h5pLoading}
              type="button"
              onClick={() => {
                openAiDialog('text', 'create', null);
              }}
            >
              <SparklesIcon className="size-4" />
              {aiBusy === 'text-create-root' ? 'KI-Text...' : 'Text mit KI'}
            </button>
            <button
              className="btn btn-outline gap-2"
              disabled={!canUseAi || aiBusy !== null || h5pLoading}
              type="button"
              onClick={() => {
                openAiDialog('multiple-choice', 'create', null);
              }}
            >
              <SparklesIcon className="size-4" />
              {aiBusy === 'multiple-choice-create-root' ? 'KI-Frage...' : 'Frage mit KI'}
            </button>
          </div>

          {orderedContent.length === 0 && !editor.title.trim() ? (
            <EmptyState canUseAi={canUseAi} onStartGuidedCreation={onStartGuidedCreation} />
          ) : (
            <div className="space-y-4">
              {orderedContent.map((item, index) => (
                <EditorContentCard
                  key={item.id}
                  canUseAi={canUseAi && aiBusy === null}
                  dropPosition={dropPosition}
                  index={index}
                  isDropTarget={dropTargetId === item.id}
                  item={item}
                  total={orderedContent.length}
                  onAddBelow={(type) => {
                    actions.worksheetContentAdded({
                      content: createContent(type),
                      index: index + 1,
                    });
                  }}
                  onAiAddBelow={(type) => {
                    openAiDialog(type, 'addBelow', item.id);
                  }}
                  onAiTransform={(type) => {
                    void handleAiContent(type, 'transform', item.id);
                  }}
                  onTransform={(type) => {
                    actions.worksheetContentsSet(
                      orderedContent.map((entry) =>
                        entry.id === item.id ? transformContent(entry, type) : entry
                      )
                    );
                  }}
                  onDragEnd={handleDragEnd}
                  onDragOver={(event) => handleDragOver(event, item.id)}
                  onDragStart={(event) => handleDragStart(event, item.id)}
                  onDrop={(event) => handleDrop(event, item.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="border-base-300 flex shrink-0 flex-col gap-3 border-t px-5 py-4">
        {feedback ? (
          <div
            className={twMerge(
              'alert text-sm transition-opacity duration-500',
              feedback.tone === 'error' ? 'alert-error' : 'alert-success',
              feedbackFading ? 'opacity-0' : 'opacity-100'
            )}
          >
            <span>{feedback.message}</span>
          </div>
        ) : null}
        <button
          className="btn btn-outline w-full gap-2"
          disabled={orderedContent.length === 0 || aiBusy !== null || h5pLoading}
          type="button"
          onClick={() => {
            void handleH5PDownload();
          }}
          onMouseEnter={preloadH5P}
        >
          <ArchiveBoxArrowDownIcon className="size-4" />
          {h5pLoading ? 'Kurs wird vorbereitet...' : 'Kurs herunterladen'}
        </button>
      </div>

      <AiContentModal
        canUseAi={canUseAi}
        loading={aiBusy !== null}
        state={aiDialog}
        onClose={closeAiDialog}
        onContextChange={(value) => {
          setAiDialog((current) => ({ ...current, context: value }));
        }}
        onGenerate={() => {
          void handleAiDialogGenerate();
        }}
      />
    </aside>
  );
});
