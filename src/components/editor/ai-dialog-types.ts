export type AiDialogState = {
  context: string;
  mode: 'create' | 'addBelow';
  open: boolean;
  targetContentId: string | null;
  type: 'text' | 'multiple-choice';
};

export const INITIAL_AI_DIALOG: AiDialogState = {
  open: false,
  type: 'text',
  context: '',
  mode: 'create',
  targetContentId: null,
};
