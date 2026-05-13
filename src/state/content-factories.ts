import type {
  Content,
  ContentType,
  FillInTheBlanks,
  Freetext,
  MultipleChoiceContent,
  TextContent,
} from '@state/lumi-editor/types';

export function createTextContent(text = ''): TextContent {
  return { id: crypto.randomUUID(), type: 'text', text };
}

export function createMultipleChoiceContent(
  question = '',
  answers: { correct: boolean; text: string }[] = [
    { correct: true, text: '' },
    { correct: false, text: '' },
  ]
): MultipleChoiceContent {
  return {
    id: crypto.randomUUID(),
    type: 'multiple-choice',
    question,
    answers,
  };
}

function createFillInTheBlanks(text = ''): FillInTheBlanks {
  return { id: crypto.randomUUID(), type: 'fill-in-the-blanks', text };
}

function createFreetext(task = ''): Freetext {
  return { id: crypto.randomUUID(), type: 'freetext', task };
}

export function createContent(type: ContentType): Content {
  switch (type) {
    case 'text':
      return createTextContent();
    case 'multiple-choice':
      return createMultipleChoiceContent();
    case 'fill-in-the-blanks':
      return createFillInTheBlanks();
    case 'freetext':
      return createFreetext();
    default:
      return createTextContent();
  }
}
