export type ID = string;

export type ProviderType = 'openai';

export interface ModelConfig {
  id: string;
  label: string;
  priceInput: number; // USD per 1M tokens
  priceCached: number; // USD per 1M tokens
  priceOutput: number; // USD per 1M tokens
}

export interface ProviderConfig {
  name: string;
  endpoint: string;
  requiresModel: boolean;
  defaultModel: string;
  availableModels: ModelConfig[];
}

export interface TextContent {
  id: ID;
  heading?: string;
  text: string;
  type: 'text';
}

export interface MultipleChoiceContent {
  id: ID;
  heading?: string;
  question: string;
  answers: { correct: boolean; text: string }[];
  type: 'multiple-choice';
}

export interface FillInTheBlanks {
  id: ID;
  heading?: string;
  text: string;
  type: 'fill-in-the-blanks';
}

export interface Freetext {
  id: ID;
  heading?: string;
  task: string;
  type: 'freetext';
}

export type Content = TextContent | MultipleChoiceContent | FillInTheBlanks | Freetext;

export type ContentType = Content['type'];

export interface LumiEditorState {
  apiConfig: {
    provider: ProviderType;
    apiEndpoint: string;
    apiToken: string;
    apiModel: string;
    transcriptionLanguage: string;
  };
  title: string;
  content: {
    [id: string]: Content;
  };
  structure: Array<ID>;
  worksheetId?: string | null;
  worksheetLlmRevision: number;
  ui: {
    loading: {
      [id: string]: boolean;
    };
    saving?: boolean;
    tokenLimitError?: string | null;
  };
}
