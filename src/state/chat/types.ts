export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: number;
  /** Object URL of the recorded audio blob. */
  audioUrl?: string;
}

export interface PreviewChapter {
  name: string;
  explanation: string;
  questions: string;
}

export interface PreviewDocument {
  title: string;
  chapters: PreviewChapter[];
}
