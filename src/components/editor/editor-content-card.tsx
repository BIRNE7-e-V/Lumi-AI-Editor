import {
  Bars3Icon,
  DocumentDuplicateIcon,
  PlusIcon,
  SparklesIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { memo, useCallback, useState, type DragEvent, type ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

import { useAppActions } from '@state';
import type { Content, ContentType } from '@state/lumi-editor/types';
import {
  CONTENT_ACTIONS,
  contentTypeBadgeClass,
  contentTypeLabel,
} from '@components/editor/editor-sidebar-utils';

const TextareaField = memo(function TextareaField({
  label,
  value,
  placeholder,
  minHeightClass,
  onCommit,
}: {
  label: string;
  value: string;
  placeholder: string;
  minHeightClass: string;
  onCommit: (value: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  const [prevValue, setPrevValue] = useState(value);
  if (prevValue !== value) {
    setPrevValue(value);
    setDraft(value);
  }

  return (
    <label className="form-control gap-2">
      <span className="label-text font-medium">{label}</span>
      <textarea
        className={twMerge('textarea textarea-bordered w-full', minHeightClass)}
        placeholder={placeholder}
        value={draft}
        onBlur={() => {
          if (draft !== value) {
            onCommit(draft);
          }
        }}
        onChange={(event) => {
          setDraft(event.target.value);
        }}
      />
    </label>
  );
});

const MultipleChoiceEditorCard = memo(function MultipleChoiceEditorCard({
  item,
  onUpdate,
}: {
  item: Extract<Content, { type: 'multiple-choice' }>;
  onUpdate: (updates: Partial<Content>) => void;
}) {
  const [questionDraft, setQuestionDraft] = useState(item.question);
  const [answersDraft, setAnswersDraft] = useState(item.answers);
  const [prevQuestion, setPrevQuestion] = useState(item.question);
  const [prevAnswers, setPrevAnswers] = useState(item.answers);
  if (prevQuestion !== item.question) {
    setPrevQuestion(item.question);
    setQuestionDraft(item.question);
  }
  if (prevAnswers !== item.answers) {
    setPrevAnswers(item.answers);
    setAnswersDraft(item.answers);
  }

  return (
    <div className="space-y-4">
      <label className="form-control gap-2">
        <span className="label-text font-medium">Frage</span>
        <textarea
          className="textarea textarea-bordered min-h-24 w-full"
          placeholder="Formuliere eine Frage..."
          value={questionDraft}
          onBlur={() => {
            if (questionDraft !== item.question) {
              onUpdate({ question: questionDraft });
            }
          }}
          onChange={(event) => {
            setQuestionDraft(event.target.value);
          }}
        />
      </label>

      <div className="space-y-3">
        <p className="text-sm font-medium">Antworten</p>
        {item.answers.map((_, index) => (
          <label
            key={`${item.id}-${index}`}
            className="rounded-box border-base-300 bg-base-200 flex items-center gap-3 border px-3 py-2"
          >
            <input
              className="checkbox checkbox-sm checkbox-primary"
              checked={answersDraft[index]?.correct ?? false}
              type="checkbox"
              onChange={() => {
                const answers = answersDraft.map((current, currentIndex) =>
                  currentIndex === index ? { ...current, correct: !current.correct } : current
                );
                setAnswersDraft(answers);
                onUpdate({ answers });
              }}
            />
            <input
              className="input input-ghost h-10 w-full bg-transparent"
              placeholder={`Antwort ${index + 1}`}
              value={answersDraft[index]?.text ?? ''}
              onBlur={() => {
                if (JSON.stringify(answersDraft) !== JSON.stringify(item.answers)) {
                  onUpdate({ answers: answersDraft });
                }
              }}
              onChange={(event) => {
                const answers = answersDraft.map((current, currentIndex) =>
                  currentIndex === index ? { ...current, text: event.target.value } : current
                );
                setAnswersDraft(answers);
              }}
            />
          </label>
        ))}
      </div>
    </div>
  );
});

function ContentTypeMenu({
  summaryLabel,
  summaryIcon,
  onSelect,
  onAiText,
  onAiQuestion,
  canUseAi,
}: {
  summaryLabel: ReactNode;
  summaryIcon?: ReactNode;
  onSelect: (type: ContentType) => void;
  onAiText?: () => void;
  onAiQuestion?: () => void;
  canUseAi: boolean;
}) {
  return (
    <details className="dropdown dropdown-end">
      <summary className="btn btn-ghost btn-xs gap-1">
        {summaryIcon}
        {summaryLabel}
      </summary>
      <ul className="menu dropdown-content rounded-box border-base-300 bg-base-100 z-20 mt-2 w-56 border p-2 shadow-lg">
        {CONTENT_ACTIONS.map((option) => (
          <li key={option.type}>
            <button
              type="button"
              onClick={() => {
                onSelect(option.type);
              }}
            >
              <option.icon className="size-4" />
              {option.label}
            </button>
          </li>
        ))}
        {onAiText || onAiQuestion ? (
          <li className="menu-title px-2 pt-3 text-[11px]">Mit KI</li>
        ) : null}
        {onAiText ? (
          <li>
            <button disabled={!canUseAi} type="button" onClick={onAiText}>
              <SparklesIcon className="size-4" />
              Text mit KI
            </button>
          </li>
        ) : null}
        {onAiQuestion ? (
          <li>
            <button disabled={!canUseAi} type="button" onClick={onAiQuestion}>
              <SparklesIcon className="size-4" />
              Frage mit KI
            </button>
          </li>
        ) : null}
      </ul>
    </details>
  );
}

export const EditorContentCard = memo(function EditorContentCard({
  item,
  index,
  total,
  canUseAi,
  isDropTarget,
  dropPosition,
  onAddBelow,
  onAiAddBelow,
  onAiTransform,
  onTransform,
  onDragEnd,
  onDragOver,
  onDragStart,
  onDrop,
}: {
  item: Content;
  index: number;
  total: number;
  canUseAi: boolean;
  isDropTarget: boolean;
  dropPosition: 'before' | 'after';
  onAddBelow: (type: ContentType) => void;
  onAiAddBelow: (type: 'text' | 'multiple-choice') => void;
  onAiTransform: (type: 'text' | 'multiple-choice') => void;
  onTransform: (type: ContentType) => void;
  onDragStart: (event: DragEvent<HTMLButtonElement>) => void;
  onDragEnd: () => void;
  onDragOver: (event: DragEvent<HTMLDivElement>) => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
}) {
  const actions = useAppActions();

  const update = useCallback(
    (updates: Partial<Content>) => {
      actions.worksheetContentUpdated({ id: item.id, updates });
    },
    [actions, item.id]
  );

  const duplicate = useCallback(() => {
    actions.worksheetContentDuplicated(item.id);
  }, [actions, item.id]);

  const remove = useCallback(() => {
    actions.worksheetContentDeleted(item.id);
  }, [actions, item.id]);

  const move = useCallback(
    (offset: -1 | 1) => {
      actions.worksheetContentMoved({ contentId: item.id, toIndex: index + offset });
    },
    [actions, index, item.id]
  );

  let body: ReactNode;

  if (item.type === 'multiple-choice') {
    body = <MultipleChoiceEditorCard item={item} onUpdate={update} />;
  } else if (item.type === 'text') {
    body = (
      <TextareaField
        label="Text"
        minHeightClass="min-h-40"
        placeholder="Schreibe hier einen Einleitungstext oder Lerninhalt..."
        value={item.text}
        onCommit={(value) => update({ text: value })}
      />
    );
  } else if (item.type === 'fill-in-the-blanks') {
    body = (
      <TextareaField
        label="Lückentext"
        minHeightClass="min-h-32"
        placeholder="Schreibe einen Text mit Lücken oder Platzhaltern..."
        value={item.text}
        onCommit={(value) => update({ text: value })}
      />
    );
  } else {
    body = (
      <TextareaField
        label="Aufgabe"
        minHeightClass="min-h-28"
        placeholder="Beschreibe die Freitextaufgabe..."
        value={item.task}
        onCommit={(value) => update({ task: value })}
      />
    );
  }

  return (
    <div className="relative" onDragOver={onDragOver} onDrop={onDrop}>
      {isDropTarget && dropPosition === 'before' ? (
        <div className="bg-primary absolute inset-x-0 -top-1 z-10 h-1 rounded-full" />
      ) : null}

      <article
        className={twMerge(
          'rounded-box border-base-300 bg-base-100 border p-4 shadow-sm transition-colors',
          isDropTarget && 'bg-base-200/60'
        )}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div
              className={twMerge(
                'badge badge-outline badge-xl text-xs',
                contentTypeBadgeClass(item.type)
              )}
            >
              {contentTypeLabel(item.type)}
            </div>
            <button
              className="btn btn-ghost btn-xs cursor-grab"
              draggable
              type="button"
              onDragEnd={onDragEnd}
              onDragStart={onDragStart}
            >
              <Bars3Icon className="size-4" />
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              className="btn btn-ghost btn-xs"
              disabled={index === 0}
              type="button"
              onClick={() => move(-1)}
            >
              ↑
            </button>
            <button
              className="btn btn-ghost btn-xs"
              disabled={index === total - 1}
              type="button"
              onClick={() => move(1)}
            >
              ↓
            </button>
            <button className="btn btn-ghost btn-xs" type="button" onClick={duplicate}>
              <DocumentDuplicateIcon className="size-4" />
            </button>
            <button className="btn btn-ghost btn-xs text-error" type="button" onClick={remove}>
              <TrashIcon className="size-4" />
            </button>
          </div>
        </div>

        {body}

        <div className="border-base-300 mt-4 flex flex-wrap items-center gap-2 border-t pt-3">
          <ContentTypeMenu
            canUseAi={canUseAi}
            summaryIcon={<PlusIcon className="size-4" />}
            summaryLabel="Darunter"
            onAiQuestion={() => onAiAddBelow('multiple-choice')}
            onAiText={() => onAiAddBelow('text')}
            onSelect={onAddBelow}
          />
          <ContentTypeMenu
            canUseAi={canUseAi}
            summaryLabel="Umwandeln"
            onAiQuestion={() => onAiTransform('multiple-choice')}
            onAiText={() => onAiTransform('text')}
            onSelect={onTransform}
          />
        </div>
      </article>

      {isDropTarget && dropPosition === 'after' ? (
        <div className="bg-primary absolute inset-x-0 -bottom-1 z-10 h-1 rounded-full" />
      ) : null}
    </div>
  );
});
