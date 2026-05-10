import {
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline';
import type { ComponentType, SVGProps } from 'react';

import type { Content, ContentType } from '@state/lumi-editor/types';

export const CONTENT_ACTIONS: Array<{
  type: ContentType;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}> = [
  { type: 'text', label: 'Text', icon: DocumentTextIcon },
  { type: 'multiple-choice', label: 'Frage', icon: ClipboardDocumentListIcon },
  { type: 'fill-in-the-blanks', label: 'Lückentext', icon: PencilSquareIcon },
  { type: 'freetext', label: 'Freitext', icon: DocumentTextIcon },
];

export function contentTypeLabel(type: ContentType) {
  switch (type) {
    case 'text':
      return 'Text';
    case 'multiple-choice':
      return 'Frage';
    case 'fill-in-the-blanks':
      return 'Lückentext';
    case 'freetext':
      return 'Freitext';
  }
}

export function contentTypeBadgeClass(type: ContentType) {
  switch (type) {
    case 'text':
      return 'badge-primary';
    case 'multiple-choice':
      return 'badge-secondary';
    case 'fill-in-the-blanks':
      return 'badge-accent';
    case 'freetext':
      return 'badge-info';
  }
}

export function getContentText(item: Content) {
  switch (item.type) {
    case 'text':
      return item.text;
    case 'multiple-choice':
      return item.question;
    case 'fill-in-the-blanks':
      return item.text;
    case 'freetext':
      return item.task;
  }
}

export function transformContent(item: Content, targetType: ContentType): Content {
  if (item.type === targetType) {
    return item;
  }

  const seedText = getContentText(item);

  switch (targetType) {
    case 'text':
      return { id: item.id, type: 'text', text: seedText };
    case 'multiple-choice':
      return {
        id: item.id,
        type: 'multiple-choice',
        question: seedText,
        answers: [
          { text: '', correct: true },
          { text: '', correct: false },
        ],
      };
    case 'fill-in-the-blanks':
      return { id: item.id, type: 'fill-in-the-blanks', text: seedText };
    case 'freetext':
      return { id: item.id, type: 'freetext', task: seedText };
  }
}
