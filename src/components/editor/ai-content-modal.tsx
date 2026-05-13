import { SparklesIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { memo } from 'react';

import type { AiDialogState } from '@components/editor/ai-dialog-types';

export const AiContentModal = memo(function AiContentModal({
  canUseAi,
  loading,
  onClose,
  onContextChange,
  onGenerate,
  state,
}: {
  canUseAi: boolean;
  loading: boolean;
  onClose: () => void;
  onContextChange: (value: string) => void;
  onGenerate: () => void;
  state: AiDialogState;
}) {
  if (!state.open) {
    return null;
  }

  const isQuestion = state.type === 'multiple-choice';

  return (
    <div className="bg-base-content/40 fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="rounded-box border-base-300 bg-base-100 w-full max-w-2xl border shadow-2xl">
        <div className="border-base-300 flex items-start justify-between gap-4 border-b px-6 py-4">
          <div className="space-y-1">
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <SparklesIcon className="text-primary size-5" />
              {isQuestion ? 'Frage mit KI generieren' : 'Text mit KI generieren'}
            </h3>
            <p className="text-base-content/70 text-sm leading-6">
              {isQuestion
                ? 'Gib den Kontext oder das Thema ein, aus dem eine Multiple-Choice-Frage erstellt werden soll.'
                : 'Gib den Kontext oder das Thema ein, aus dem ein informativer Text erstellt werden soll.'}
            </p>
          </div>
          <button className="btn btn-ghost btn-sm btn-circle" type="button" onClick={onClose}>
            <XMarkIcon className="size-5" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          {!canUseAi ? (
            <div className="alert alert-warning text-sm">
              <span>Bitte hinterlege zuerst einen API-Token in den KI-Einstellungen.</span>
            </div>
          ) : null}

          <label className="form-control gap-2">
            <span className="label-text font-medium">Kontext</span>
            <textarea
              className="textarea textarea-bordered min-h-40 w-full"
              disabled={loading}
              placeholder={
                isQuestion
                  ? 'Gib den Text oder das Thema ein, aus dem die KI eine Frage generieren soll...'
                  : 'Gib das Thema oder den Kontext ein, aus dem die KI Text generieren soll...'
              }
              value={state.context}
              onChange={(event) => onContextChange(event.target.value)}
            />
          </label>
        </div>

        <div className="border-base-300 flex items-center justify-end gap-2 border-t px-5 py-4">
          <button className="btn btn-ghost" disabled={loading} type="button" onClick={onClose}>
            Abbrechen
          </button>
          <button
            className="btn btn-primary gap-2"
            disabled={loading || !canUseAi || !state.context.trim()}
            type="button"
            onClick={onGenerate}
          >
            <SparklesIcon className="size-4" />
            {loading
              ? isQuestion
                ? 'Frage wird generiert...'
                : 'Text wird generiert...'
              : isQuestion
                ? 'Frage generieren'
                : 'Text generieren'}
          </button>
        </div>
      </div>
    </div>
  );
});
