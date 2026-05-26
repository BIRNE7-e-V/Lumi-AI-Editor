import type { ChatMessage, PreviewDocument } from '@state/chat/types';
import type {
  Content,
  ID,
  LumiEditorState,
  MultipleChoiceContent,
  ProviderType,
  TextContent,
} from '@state/lumi-editor/types';

export interface ChatState {
  messages: ChatMessage[];
  loading: boolean;
  h5pGenerating: boolean;
  h5pTitle: string | null;
  h5pContentJson: string | null;
  h5pError: string | null;
  preview: string;
  previewDoc: PreviewDocument | null;
  customSystemPrompt: string | null;
  readAloudEnabled: boolean;
  languageMode: string;
}

export type GenerationOptions = {
  mode: 'create' | 'addBelow' | 'transform';
  targetContentId: string | null;
  context?: string;
};

export type WorksheetCommand = {
  action: string;
  text?: string;
  question?: string;
  answers?: Array<{ text: string; correct: boolean }>;
  title?: string;
};

export type AppActions = {
  chatMessageAdded: (message: ChatMessage) => void;
  chatMessagesSet: (messages: ChatMessage[]) => void;
  chatCleared: () => void;
  chatPreviewUpdated: (markdown: string, doc: PreviewDocument) => void;
  chatReadAloudToggled: () => void;
  chatSystemPromptChanged: (prompt: string | null) => void;
  chatLanguageModeChanged: (mode: string) => void;
  providerChanged: (provider: ProviderType) => void;
  apiEndpointChanged: (apiEndpoint: string) => void;
  apiTokenChanged: (apiToken: string) => void;
  apiModelChanged: (apiModel: string) => void;
  transcriptionLanguageChanged: (language: string) => void;
  worksheetReset: () => void;
  worksheetTitleChanged: (title: string) => void;
  worksheetContentAdded: (payload: { content: Content; index?: number }) => void;
  worksheetContentUpdated: (payload: { id: ID; updates: Partial<Content> }) => void;
  worksheetContentDeleted: (id: ID) => void;
  worksheetContentDuplicated: (id: ID) => void;
  worksheetContentMoved: (payload: { contentId: ID; toIndex: number }) => void;
  worksheetContentsSet: (content: Content[]) => void;
  worksheetStateImported: (nextState: LumiEditorState) => void;
  worksheetIdSet: (worksheetId: string | null) => void;
  worksheetContentIdsUpdated: (idMapping: Record<string, string>) => void;
  contentLoadingSet: (payload: { contentId: ID; loading: boolean }) => void;
  worksheetSavingSet: (saving: boolean) => void;
  tokenLimitErrorSet: (message: string | null) => void;
  tokenLimitErrorCleared: () => void;
  sendMessage: (body: string, senderId: string, audioUrl?: string) => Promise<void>;
  generateQuestion: (options: GenerationOptions) => Promise<MultipleChoiceContent>;
  generateText: (options: GenerationOptions) => Promise<TextContent>;
  sendChatMessage: (options: {
    userInput: string;
    creationState: {
      step: string;
      topic: string;
      audience: string;
      objectives: string;
      aspects: string;
    };
  }) => Promise<{
    assistantMessage: { id: string; role: 'assistant'; content: string };
    commands?: WorksheetCommand[];
  }>;
};
