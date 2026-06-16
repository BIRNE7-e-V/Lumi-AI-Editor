import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { buildApiErrorMessage, extractTechnicalFromJson } from '@/utils/api-error';

import { AppActionsContext, ChatStateContext, EditorStateContext } from '@state/app-state-contexts';
import {
  createMultipleChoiceContent,
  createTextContent,
} from '@state/content-factories';
import type { AppActions, ChatState, GenerationOptions, WorksheetCommand } from '@state/app-state-types';

import { buildSystemPrompt } from '@state/chat/prompts';
import type { ChatMessage } from '@state/chat/types';
import { DEFAULT_PROVIDER, PROVIDERS } from '@state/lumi-editor/providers';
import type {
  Content,
  ID,
  LumiEditorState,
  ProviderType,
} from '@state/lumi-editor/types';


const MOCK_MODE = import.meta.env.VITE_MOCK_CHAT === 'true';
const MOCK_API = import.meta.env.VITE_MOCK_API === 'true';
const MOCK_API_ENDPOINT = 'http://localhost:3000/mock/v1/chat/completions';

const loadFromLocalStorage = <T,>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') {
    return defaultValue;
  }

  try {
    const stored = window.localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : defaultValue;
  } catch {
    return defaultValue;
  }
};

function getInitialEditorState(): LumiEditorState {
  const storedProvider = loadFromLocalStorage<ProviderType>('api_provider', DEFAULT_PROVIDER);
  const provider = PROVIDERS[storedProvider] ? storedProvider : DEFAULT_PROVIDER;

  return {
    apiConfig: {
      provider,
      apiEndpoint: MOCK_API
        ? MOCK_API_ENDPOINT
        : loadFromLocalStorage('api_endpoint', PROVIDERS[provider].endpoint),
      apiToken: loadFromLocalStorage('api_token', ''),
      apiModel: loadFromLocalStorage('api_model', PROVIDERS[provider].defaultModel),
      transcriptionLanguage: loadFromLocalStorage('transcription_language', 'de'),
    },
    title: '',
    content: {},
    structure: [],
    worksheetLlmRevision: 0,
    ui: {
      loading: {},
    },
  };
}

function getInitialChatState(): ChatState {
  return {
    messages: [],
    loading: false,
    h5pGenerating: false,
    h5pTitle: null,
    h5pContentJson: null,
    h5pError: null,
    preview: '',
    previewDoc: null,
    customSystemPrompt: loadFromLocalStorage<string | null>('custom_system_prompt', null),
    readAloudEnabled: false,
    languageMode: loadFromLocalStorage<string>('sprache', 'standard'),
  };
}


function getOrderedContent(editor: LumiEditorState): Content[] {
  return editor.structure.map((id) => editor.content[id]).filter(Boolean) as Content[];
}

function mockReply(userMessage: string): string {
  return `[Mock] Du hast geschrieben: "${userMessage}"`;
}

function extractWorksheetBlock(raw: string): {
  displayText: string;
  payload: {
    title?: string;
    content?: Array<
      | { type: 'text'; text: string }
      | {
          type: 'multiple-choice';
          question: string;
          answers: { text: string; correct: boolean }[];
        }
    >;
  } | null;
} {
  const blockStart = raw.indexOf('[WORKSHEET_UPDATE:');
  if (blockStart === -1) {
    return { displayText: raw, payload: null };
  }

  const jsonStart = raw.indexOf('{', blockStart);
  if (jsonStart === -1) {
    return { displayText: raw, payload: null };
  }

  let depth = 0;
  let jsonEnd = -1;
  for (let index = jsonStart; index < raw.length; index += 1) {
    if (raw[index] === '{') {
      depth += 1;
    } else if (raw[index] === '}') {
      depth -= 1;
      if (depth === 0) {
        jsonEnd = index;
        break;
      }
    }
  }

  if (jsonEnd === -1) {
    return { displayText: raw.slice(0, blockStart).trim(), payload: null };
  }

  const blockEnd = raw.indexOf(']', jsonEnd);
  const displayText =
    blockEnd === -1
      ? raw.slice(0, blockStart).trim()
      : `${raw.slice(0, blockStart)}${raw.slice(blockEnd + 1)}`.trim();

  try {
    return {
      displayText,
      payload: JSON.parse(raw.slice(jsonStart, jsonEnd + 1)) as {
        title?: string;
        content?: Array<
          | { type: 'text'; text: string }
          | {
              type: 'multiple-choice';
              question: string;
              answers: { text: string; correct: boolean }[];
            }
        >;
      },
    };
  } catch {
    return { displayText, payload: null };
  }
}

type WorksheetUpdatePayload = {
  title?: string;
  content?: Array<
    | { type: 'text'; text: string }
    | {
        type: 'multiple-choice';
        question: string;
        answers: { text: string; correct: boolean }[];
      }
  >;
};

type JsonCodeBlockExtraction = {
  displayText: string;
  parsed: unknown | null;
};

function extractJsonCodeBlock(raw: string): JsonCodeBlockExtraction {
  const match = raw.match(/```json\s*([\s\S]*?)\s*```/i);
  if (!match) {
    return { displayText: raw, parsed: null };
  }

  const displayText = raw.replace(match[0], '').trim();

  try {
    return { displayText, parsed: JSON.parse(match[1]) };
  } catch {
    return { displayText: raw, parsed: null };
  }
}

type ContentBlock = {
  type?: unknown;
  text?: unknown;
  level?: unknown;
  question?: unknown;
  answers?: unknown;
};

function parseAnswers(rawAnswers: unknown[]): { text: string; correct: boolean }[] {
  return rawAnswers
    .map((answer) => {
      if (!answer || typeof answer !== 'object') return null;
      const a = answer as { text?: unknown; correct?: unknown };
      if (typeof a.text !== 'string' || typeof a.correct !== 'boolean') return null;
      return { text: a.text, correct: a.correct };
    })
    .filter(Boolean) as { text: string; correct: boolean }[];
}

function normalizeBlock(
  block: ContentBlock,
  currentTitle: string | undefined
): {
  item: NonNullable<WorksheetUpdatePayload['content']>[number] | null;
  title: string | undefined;
} {
  if ((block.type === 'text' || block.type === 'paragraph') && typeof block.text === 'string') {
    return { item: { type: 'text', text: block.text }, title: currentTitle };
  }

  if (block.type === 'heading' && typeof block.text === 'string') {
    if (!currentTitle && block.level === 1) {
      return { item: null, title: block.text };
    }
    const item = block.text !== currentTitle ? { type: 'text' as const, text: block.text } : null;
    return { item, title: currentTitle };
  }

  if (
    block.type === 'multiple-choice' &&
    typeof block.question === 'string' &&
    Array.isArray(block.answers)
  ) {
    const answers = parseAnswers(block.answers).sort(() => Math.random() - 0.5);
    if (answers.length > 0) {
      return {
        item: { type: 'multiple-choice', question: block.question, answers },
        title: currentTitle,
      };
    }
  }

  return { item: null, title: currentTitle };
}

function normalizeWorksheetPayload(value: unknown): WorksheetUpdatePayload | null {
  if (!value || typeof value !== 'object') return null;

  const candidate = value as { title?: unknown; content?: unknown };
  let title = typeof candidate.title === 'string' ? candidate.title : undefined;
  const normalizedContent: NonNullable<WorksheetUpdatePayload['content']> = [];

  if (Array.isArray(candidate.content)) {
    for (const item of candidate.content) {
      if (typeof item === 'string') {
        if (item.trim()) normalizedContent.push({ type: 'text', text: item });
        continue;
      }
      if (!item || typeof item !== 'object') continue;
      const { item: normalized, title: updatedTitle } = normalizeBlock(item as ContentBlock, title);
      title = updatedTitle;
      if (normalized) normalizedContent.push(normalized);
    }
  }

  if (title === undefined && normalizedContent.length === 0) return null;

  return {
    ...(title !== undefined ? { title } : {}),
    ...(Array.isArray(candidate.content) ? { content: normalizedContent } : {}),
  };
}

function extractWorksheetPayloadFromJsonCodeBlock(raw: string): {
  displayText: string;
  payload: WorksheetUpdatePayload | null;
} {
  const { displayText, parsed } = extractJsonCodeBlock(raw);
  return {
    displayText,
    payload: normalizeWorksheetPayload(parsed),
  };
}

function buildGenerationContext(
  options: GenerationOptions,
  editor: LumiEditorState
): { context: string; callAPI: (prompt: string) => Promise<string> } {
  const { apiEndpoint, apiModel, apiToken, provider } = editor.apiConfig;
  const title = editor.title;
  const content = getOrderedContent(editor);

  if (!apiToken.trim()) {
    throw new Error('Bitte geben Sie einen API-Token ein');
  }

  const targetItem = options.targetContentId
    ? content.find((item) => item.id === options.targetContentId)
    : null;
  const context =
    options.context?.trim() ||
    (options.mode === 'transform' && targetItem
      ? targetItem.type === 'text'
        ? targetItem.text
        : targetItem.type === 'multiple-choice'
          ? `Frage: ${targetItem.question}\nAntworten:\n${targetItem.answers
              .map((answer) => `${answer.correct ? '* ' : ''}${answer.text}`)
              .join('\n')}`
          : JSON.stringify({ title, content })
      : JSON.stringify({ title, content }));

  const callAPI = (prompt: string) =>
    callOpenAI(
      [{ role: 'user', content: prompt }],
      apiEndpoint,
      apiToken,
      PROVIDERS[provider].requiresModel,
      apiModel
    );

  return { context, callAPI };
}

function resolveAssistantContent(
  raw: string,
  applyUpdate: (payload: WorksheetUpdatePayload) => void,
  fallbackMessage = 'Ich habe das Arbeitsblatt aktualisiert.'
): string {
  const { displayText, payload } = extractWorksheetBlock(raw);
  const codeBlock = payload ? null : extractWorksheetPayloadFromJsonCodeBlock(raw);
  const appliedPayload = payload ?? codeBlock?.payload ?? null;

  if (appliedPayload) applyUpdate(appliedPayload);

  const content = (payload ? displayText : codeBlock?.payload ? codeBlock.displayText : raw).trim();
  const textOnly = content.replace(/\[VORSCHLÄGE:[^\]]+\]/g, '').trim();
  if (!textOnly) {
    const suggestionsTag = content.match(/\[VORSCHLÄGE:[^\]]+\]/)?.[0];
    const fallbackBase = fallbackMessage.replace(/\n*\[VORSCHLÄGE:[^\]]+\]$/g, '').trim();
    return suggestionsTag ? `${fallbackBase}\n\n${suggestionsTag}` : fallbackMessage;
  }
  return content;
}

const USAGE_BY_MODEL_KEY = 'ai_usage_by_model';
const USAGE_LAST_KEY = 'ai_usage_last';

type UsageTotals = {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  request_count: number;
};

function accumulateUsage(
  usage: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  },
  modelId: string
): void {
  try {
    const stored = window.localStorage.getItem(USAGE_BY_MODEL_KEY);
    const byModel: Record<string, UsageTotals> = stored
      ? (JSON.parse(stored) as Record<string, UsageTotals>)
      : {};

    const current = byModel[modelId] ?? {
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0,
      request_count: 0,
    };
    current.prompt_tokens += usage.prompt_tokens ?? 0;
    current.completion_tokens += usage.completion_tokens ?? 0;
    current.total_tokens += usage.total_tokens ?? 0;
    current.request_count += 1;
    byModel[modelId] = current;

    window.localStorage.setItem(USAGE_BY_MODEL_KEY, JSON.stringify(byModel));
    window.localStorage.setItem(
      USAGE_LAST_KEY,
      JSON.stringify({
        model: modelId,
        prompt_tokens: usage.prompt_tokens ?? 0,
        completion_tokens: usage.completion_tokens ?? 0,
        total_tokens: usage.total_tokens ?? 0,
      })
    );
    window.dispatchEvent(new Event('ai-usage-updated'));
  } catch {
    // localStorage unavailable — silently ignore
  }
}

async function callOpenAI(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  apiEndpoint: string,
  apiToken: string,
  requiresModel: boolean,
  apiModel: string
): Promise<string> {
  const body: Record<string, unknown> = { messages, temperature: 0.7 };

  if (requiresModel) {
    body.model = apiModel;
  }

  const response = await fetch(apiEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiToken}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const technical = extractTechnicalFromJson(
      (await response.json()) as Record<string, unknown>,
      response.status,
      response.statusText
    );
    throw new Error(buildApiErrorMessage(response.status, technical));
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: {
      prompt_tokens?: number;
      completion_tokens?: number;
      total_tokens?: number;
    };
  };

  if (data.usage) {
    accumulateUsage(data.usage, apiModel);
  }

  return data.choices?.[0]?.message?.content ?? '';
}

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [chatState, setChatState] = useState(getInitialChatState);
  const [editorState, setEditorState] = useState(getInitialEditorState);

  const chatRef = useRef(chatState);
  const editorRef = useRef(editorState);

  useEffect(() => {
    chatRef.current = chatState;
  }, [chatState]);

  useEffect(() => {
    editorRef.current = editorState;
  }, [editorState]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const { provider, apiEndpoint, apiToken, apiModel, transcriptionLanguage } =
      editorState.apiConfig;
    window.localStorage.setItem('api_provider', JSON.stringify(provider));
    window.localStorage.setItem('api_endpoint', JSON.stringify(apiEndpoint));
    window.localStorage.setItem('api_token', JSON.stringify(apiToken));
    window.localStorage.setItem('api_model', JSON.stringify(apiModel));
    window.localStorage.setItem('transcription_language', JSON.stringify(transcriptionLanguage));
  }, [editorState.apiConfig]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (chatState.customSystemPrompt === null) {
      window.localStorage.removeItem('custom_system_prompt');
      return;
    }
    window.localStorage.setItem(
      'custom_system_prompt',
      JSON.stringify(chatState.customSystemPrompt)
    );
  }, [chatState.customSystemPrompt]);

  const applyWorksheetCommand = useCallback((raw: string) => {
    const jsonMatch = raw.match(/```json\n([\s\S]*?)\n```/);
    if (!jsonMatch) return;
    try {
      const command = JSON.parse(jsonMatch[1]) as WorksheetCommand;
      if (command.action === 'set_title' && command.title) {
        setEditorState((prev) => ({ ...prev, title: command.title! }));
      }
      if (command.action === 'add_text' && command.text) {
        setEditorState((prev) => {
          const item = createTextContent(command.text);
          return {
            ...prev,
            content: { ...prev.content, [item.id]: item },
            structure: [...prev.structure, item.id],
          };
        });
      }
      if (command.action === 'add_question' && command.question && command.answers) {
        setEditorState((prev) => {
          const item = createMultipleChoiceContent(command.question, command.answers);
          return {
            ...prev,
            content: { ...prev.content, [item.id]: item },
            structure: [...prev.structure, item.id],
          };
        });
      }
    } catch (error) {
      console.error('Failed to parse worksheet command', error);
    }
  }, []);

  const applyWorksheetUpdate = useCallback((update: WorksheetUpdatePayload) => {
    setEditorState((prev) => {
      let next = prev;
      if (update.title !== undefined) {
        next = { ...next, title: update.title };
      }
      if (update.content !== undefined) {
        const content: LumiEditorState['content'] = {};
        const structure: ID[] = [];
        for (const item of update.content.map((i) =>
          i.type === 'text'
            ? createTextContent(i.text)
            : createMultipleChoiceContent(i.question, i.answers)
        )) {
          content[item.id] = item;
          structure.push(item.id);
        }
        next = { ...next, content, structure, worksheetLlmRevision: prev.worksheetLlmRevision + 1 };
      }
      return next;
    });
  }, []);

  const sendMessage = useCallback<AppActions['sendMessage']>(
    async (body, senderId, audioUrl) => {
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: senderId === 'assistant' ? 'assistant' : 'user',
        content: body,
        createdAt: Date.now(),
        audioUrl,
      };

      setChatState((prev) => ({
        ...prev,
        loading: true,
        messages: [...prev.messages, userMessage],
      }));

      if (MOCK_MODE) {
        await new Promise((resolve) => window.setTimeout(resolve, 400));
        setChatState((prev) => ({
          ...prev,
          loading: false,
          messages: [
            ...prev.messages,
            {
              id: crypto.randomUUID(),
              role: 'assistant',
              content: mockReply(body),
              createdAt: Date.now(),
            },
          ],
        }));
        return;
      }

      try {
        const chat = chatRef.current;
        const editor = editorRef.current;
        const messages = [...chat.messages, userMessage];
        const title = editor.title;
        const content = getOrderedContent(editor);
        const { apiEndpoint, apiModel, apiToken, provider } = editor.apiConfig;
        const rawReply = await callOpenAI(
          [
            {
              role: 'system',
              content: chat.customSystemPrompt ?? buildSystemPrompt(title, content, chat.languageMode),
            },
            ...messages.map((message, index) =>
              index === messages.length - 1 && message.role === 'user'
                ? {
                    role: message.role,
                    content: `${message.content}\n\n[Aktueller Stand des Arbeitsblatts: ${JSON.stringify({ title, content })}]`,
                  }
                : { role: message.role, content: message.content }
            ),
          ],
          apiEndpoint,
          apiToken,
          PROVIDERS[provider].requiresModel,
          apiModel
        );

        const assistantContent = resolveAssistantContent(rawReply, applyWorksheetUpdate);

        setChatState((prev) => ({
          ...prev,
          messages: [
            ...prev.messages,
            {
              id: crypto.randomUUID(),
              role: 'assistant',
              content: assistantContent,
              createdAt: Date.now(),
            },
          ],
        }));
      } catch (error) {
        setChatState((prev) => ({
          ...prev,
          messages: [
            ...prev.messages,
            {
              id: crypto.randomUUID(),
              role: 'assistant',
              content: `Fehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
              createdAt: Date.now(),
            },
          ],
        }));
      } finally {
        setChatState((prev) => ({ ...prev, loading: false }));
      }
    },
    [applyWorksheetUpdate]
  );

  const generateQuestion = useCallback<AppActions['generateQuestion']>(async (options) => {
    const { context, callAPI } = buildGenerationContext(options, editorRef.current);

    const prompt =
      options.mode === 'transform'
        ? `Wandle den folgenden Inhalt in eine Multiple-Choice-Frage um:\n\n${context}\n\nBehalte den Sinn und Inhalt bei, aber verwandle es in eine lehrreiche Multiple-Choice-Frage mit Antwortmöglichkeiten.\n\n<structured_output_contract>\nAntworte NUR mit einem JSON-Objekt. Kein Text davor oder danach, keine Markdown-Fences.\nPflichtfelder:\n{\n  "question": "Die Frage hier",\n  "answers": [\n    {"text": "Antwort 1", "correct": false},\n    {"text": "Richtige Antwort", "correct": true}\n  ]\n}\nStelle sicher, dass alle Klammern ausgeglichen sind.\n</structured_output_contract>`
        : `Erstelle eine Multiple-Choice-Frage basierend auf folgendem Arbeitsblatt-Kontext:\n\n${context}\n\n<structured_output_contract>\nAntworte NUR mit einem JSON-Objekt. Kein Text davor oder danach, keine Markdown-Fences.\nPflichtfelder:\n{\n  "question": "Die Frage hier",\n  "answers": [\n    {"text": "Antwort 1", "correct": false},\n    {"text": "Richtige Antwort", "correct": true}\n  ]\n}\nStelle sicher, dass alle Klammern ausgeglichen sind.\n</structured_output_contract>`;

    const raw = await callAPI(prompt);
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Keine gültige JSON-Antwort vom API erhalten');
    }

    const parsed = JSON.parse(jsonMatch[0]) as {
      question: string;
      answers: { text: string; correct: boolean }[];
    };

    return createMultipleChoiceContent(parsed.question, parsed.answers);
  }, []);

  const generateText = useCallback<AppActions['generateText']>(async (options) => {
    const { context, callAPI } = buildGenerationContext(options, editorRef.current);

    const prompt =
      options.mode === 'transform'
        ? `Wandle den folgenden Inhalt in einen informativen Text um:\n\n${context}\n\nBehalte den Kerninhalt und die Bedeutung bei, aber verwandle es in einen gut strukturierten, informativen Text.\n\n<output_contract>\nAntworte NUR mit dem Text selbst. Kein JSON, kein Markdown, keine Erklärungen davor oder danach.\n</output_contract>`
        : `Erstelle einen informativen und lehrreichen Text basierend auf folgendem Arbeitsblatt-Kontext:\n\n${context}\n\n<output_contract>\nAntworte NUR mit dem Text selbst. Kein JSON, kein Markdown, keine Erklärungen davor oder danach.\n</output_contract>`;

    return createTextContent((await callAPI(prompt)).trim());
  }, []);

  const sendChatMessage = useCallback<AppActions['sendChatMessage']>(
    async ({ userInput, creationState }) => {
      const { apiEndpoint, apiModel, apiToken, provider } = editorRef.current.apiConfig;
      const title = editorRef.current.title;
      const content = getOrderedContent(editorRef.current);
      const chatMessages = chatRef.current.messages;

      if (!apiToken.trim()) {
        throw new Error('Bitte geben Sie Ihren API-Token ein');
      }
      if (!userInput.trim()) {
        throw new Error('Eingabe ist leer');
      }

      if (creationState.step === 'asking_topic') {
        return {
          assistantMessage: {
            id: `msg-${Date.now()}`,
            role: 'assistant' as const,
            content: `Super! Dein Arbeitsblatt wird sich mit "${userInput}" befassen.\n\nWer ist die Zielgruppe?`,
          },
        };
      }

      if (creationState.step === 'asking_aspects') {
        const { topic, audience, objectives, aspects } = creationState;
        const progressMessage = {
          id: `msg-${Date.now()}`,
          role: 'assistant' as const,
          content: `Perfekt! Ich erstelle jetzt ein Arbeitsblatt über "${topic}" für ${audience}. Das kann einen Moment dauern...`,
        };

        setChatState((prev) => ({
          ...prev,
          loading: true,
          messages: [...prev.messages, { ...progressMessage, createdAt: Date.now() }],
        }));

        try {
          const systemPrompt = `${buildSystemPrompt(title, content, chatRef.current.languageMode)}

<instruction_override>
Du hast alle nötigen Informationen gesammelt:
- Thema: "${topic}"
- Zielgruppe: "${audience}"
- Lernziele: "${objectives}"
- Wichtige Aspekte/Unterthemen: "${aspects}"
Erstelle JETZT direkt einen ersten vollständigen Entwurf auf Basis dieser Informationen. Stelle keine weitere Rückfrage.
Behalte das [WORKSHEET_UPDATE]-Format aus dem structured_output_contract exakt bei.
</instruction_override>`;

          const raw = await callOpenAI(
            [
              { role: 'system', content: systemPrompt },
              {
                role: 'user',
                content: `Erstelle jetzt einen ersten Arbeitsblatt-Entwurf zum Thema "${topic}" für ${audience}. Lernziele: ${objectives}. Wichtige Aspekte: ${aspects}.`,
              },
            ],
            apiEndpoint,
            apiToken,
            PROVIDERS[provider].requiresModel,
            apiModel
          );

          const assistantContent = resolveAssistantContent(
            raw,
            applyWorksheetUpdate,
            `Ich habe einen ersten Entwurf erstellt.\n\n[VORSCHLÄGE: Füge Quizfragen hinzu | Vereinfache den Text | Ergänze eine Zusammenfassung]`
          );

          return {
            assistantMessage: {
              id: `msg-${Date.now()}`,
              role: 'assistant' as const,
              content: assistantContent,
            },
          };
        } finally {
          setChatState((prev) => ({ ...prev, loading: false }));
        }
      }

      const raw = await callOpenAI(
        [
          {
            role: 'system',
            content: `Du bist ein hilfreicher KI-Assistent für einen Arbeitsblatt-Editor.\n\nAktueller Stand:\n${JSON.stringify({ title, content })}\n\nWenn Inhalte geändert werden sollen, antworte mit einem JSON-Befehlsblock.`,
          },
          ...chatMessages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
          { role: 'user', content: userInput },
        ],
        apiEndpoint,
        apiToken,
        PROVIDERS[provider].requiresModel,
        apiModel
      );

      applyWorksheetCommand(raw);
      return {
        assistantMessage: {
          id: `msg-${Date.now()}`,
          role: 'assistant' as const,
          content: raw,
        },
      };
    },
    [applyWorksheetCommand, applyWorksheetUpdate]
  );

  const actions = useMemo<AppActions>(
    () => ({
      chatMessageAdded: (message) =>
        setChatState((prev) => ({
          ...prev,
          messages: [...prev.messages, message],
        })),
      chatMessagesSet: (messages) => setChatState((prev) => ({ ...prev, messages })),
      chatCleared: () => setChatState((prev) => ({ ...prev, messages: [] })),
      chatPreviewUpdated: (markdown, doc) =>
        setChatState((prev) => ({
          ...prev,
          preview: markdown,
          previewDoc: doc,
        })),
      chatReadAloudToggled: () =>
        setChatState((prev) => ({
          ...prev,
          readAloudEnabled: !prev.readAloudEnabled,
        })),
      chatSystemPromptChanged: (prompt) =>
        setChatState((prev) => ({ ...prev, customSystemPrompt: prompt })),
      chatLanguageModeChanged: (mode) =>
        setChatState((prev) => ({ ...prev, languageMode: mode })),

      providerChanged: (provider) =>
        setEditorState((prev) => ({
          ...prev,
          apiConfig: {
            ...prev.apiConfig,
            provider,
            apiEndpoint: PROVIDERS[provider].endpoint,
            apiModel: PROVIDERS[provider].defaultModel,
          },
        })),
      apiEndpointChanged: (apiEndpoint) =>
        setEditorState((prev) => ({
          ...prev,
          apiConfig: { ...prev.apiConfig, apiEndpoint },
        })),
      apiTokenChanged: (apiToken) =>
        setEditorState((prev) => ({
          ...prev,
          apiConfig: { ...prev.apiConfig, apiToken },
        })),
      apiModelChanged: (apiModel) =>
        setEditorState((prev) => ({
          ...prev,
          apiConfig: { ...prev.apiConfig, apiModel },
        })),
      transcriptionLanguageChanged: (language) =>
        setEditorState((prev) => ({
          ...prev,
          apiConfig: { ...prev.apiConfig, transcriptionLanguage: language },
        })),
      worksheetReset: () =>
        setEditorState((prev) => ({
          ...getInitialEditorState(),
          apiConfig: prev.apiConfig,
        })),
      worksheetTitleChanged: (title) => setEditorState((prev) => ({ ...prev, title })),
      worksheetContentAdded: ({ content, index }) =>
        setEditorState((prev) => {
          const structure = [...prev.structure];
          if (index !== undefined && index >= 0 && index <= structure.length) {
            structure.splice(index, 0, content.id);
          } else {
            structure.push(content.id);
          }
          return {
            ...prev,
            content: { ...prev.content, [content.id]: content },
            structure,
          };
        }),
      worksheetContentUpdated: ({ id, updates }) =>
        setEditorState((prev) => {
          const current = prev.content[id];
          if (!current) return prev;
          return {
            ...prev,
            content: {
              ...prev.content,
              [id]: { ...current, ...updates } as Content,
            },
          };
        }),
      worksheetContentDeleted: (id) =>
        setEditorState((prev) => {
          const content = { ...prev.content };
          const loading = { ...prev.ui.loading };
          delete content[id];
          delete loading[id];
          return {
            ...prev,
            content,
            structure: prev.structure.filter((s) => s !== id),
            ui: { ...prev.ui, loading },
          };
        }),
      worksheetContentDuplicated: (id) =>
        setEditorState((prev) => {
          const item = prev.content[id];
          if (!item) return prev;
          const newId = crypto.randomUUID();
          const duplicate = { ...item, id: newId };
          const structure = [...prev.structure];
          structure.splice(structure.indexOf(id) + 1, 0, newId);
          return {
            ...prev,
            content: { ...prev.content, [newId]: duplicate },
            structure,
          };
        }),
      worksheetContentMoved: ({ contentId, toIndex }) =>
        setEditorState((prev) => {
          const currentIndex = prev.structure.indexOf(contentId);
          if (currentIndex === -1 || toIndex < 0 || toIndex >= prev.structure.length) return prev;
          const structure = [...prev.structure];
          structure.splice(currentIndex, 1);
          structure.splice(toIndex, 0, contentId);
          return { ...prev, structure };
        }),
      worksheetContentsSet: (items) =>
        setEditorState((prev) => {
          const content: LumiEditorState['content'] = {};
          const structure: ID[] = [];
          for (const item of items) {
            content[item.id] = item;
            structure.push(item.id);
          }
          return { ...prev, content, structure };
        }),
      worksheetStateImported: (nextState) => setEditorState(() => nextState),
      worksheetIdSet: (worksheetId) => setEditorState((prev) => ({ ...prev, worksheetId })),
      worksheetContentIdsUpdated: (idMapping) =>
        setEditorState((prev) => {
          const structure = prev.structure.map((id) => idMapping[id] || id);
          const content: LumiEditorState['content'] = {};
          const loading: LumiEditorState['ui']['loading'] = {};
          for (const [oldId, item] of Object.entries(prev.content)) {
            const newId = idMapping[oldId] || oldId;
            content[newId] = { ...item, id: newId };
          }
          for (const [oldId, isLoading] of Object.entries(prev.ui.loading)) {
            const newId = idMapping[oldId] || oldId;
            loading[newId] = isLoading;
          }
          return { ...prev, content, structure, ui: { ...prev.ui, loading } };
        }),
      contentLoadingSet: ({ contentId, loading }) =>
        setEditorState((prev) => ({
          ...prev,
          ui: {
            ...prev.ui,
            loading: { ...prev.ui.loading, [contentId]: loading },
          },
        })),
      worksheetSavingSet: (saving) =>
        setEditorState((prev) => ({ ...prev, ui: { ...prev.ui, saving } })),
      tokenLimitErrorSet: (message) =>
        setEditorState((prev) => ({
          ...prev,
          ui: { ...prev.ui, tokenLimitError: message },
        })),
      tokenLimitErrorCleared: () =>
        setEditorState((prev) => ({
          ...prev,
          ui: { ...prev.ui, tokenLimitError: null },
        })),
      sendMessage,
      generateQuestion,
      generateText,
      sendChatMessage,
    }),
    [sendMessage, generateQuestion, generateText, sendChatMessage]
  );

  return (
    <AppActionsContext.Provider value={actions}>
      <ChatStateContext.Provider value={chatState}>
        <EditorStateContext.Provider value={editorState}>{children}</EditorStateContext.Provider>
      </ChatStateContext.Provider>
    </AppActionsContext.Provider>
  );
}

