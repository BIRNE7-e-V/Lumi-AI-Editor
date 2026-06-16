import {
  ChatBubbleLeftRightIcon,
  MicrophoneIcon,
  SpeakerWaveIcon,
  SparklesIcon,
  StopCircleIcon,
  SpeakerXMarkIcon,
} from '@heroicons/react/24/outline';
import { useCallback, useEffect, useRef, useState } from 'react';
import { twMerge } from 'tailwind-merge';

import { useAppActions, useChatState, useEditorState } from '@state';
import { parseMessage } from '@components/editor/utils';
import { useSpeech } from '@components/chat/use-speech';

type LanguageModeContent = {
  greetingText: string;
  greetingSuggestions: string[];
  audiencePromptText: (topic: string) => string;
  audienceSuggestions: string[];
  objectivesText: string;
  objectivesSuggestions: string[];
  aspectsText: string;
  aspectsSuggestions: string[];
  topicPlaceholder: string;
};

function pickRandom<T>(arr: T[], n: number): T[] {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, n);
}

function withSuggestions(text: string, suggestions: string[]): string {
  return `${text}\n\n[VORSCHLÄGE: ${suggestions.join(' | ')}]`;
}

const LANGUAGE_MODE_CONTENT: Record<string, LanguageModeContent> = {
  leichte: {
    greetingText:
      'Hallo! Ich helfe dir beim Erstellen eines Arbeitsblatts.\n\nWorüber soll dein Arbeitsblatt sein?',
    greetingSuggestions: [
      // Alltag & Leben
      'Einkaufen und Preise vergleichen',
      'Einen Brief schreiben',
      'Eine E-Mail schreiben',
      'Einen Termin vereinbaren',
      'Fahrplan lesen und verstehen',
      'Rezepte lesen und kochen',
      'Medikamente und Beipackzettel verstehen',
      'Einen Antrag ausfüllen',
      'Mit Behörden sprechen',
      'Wohnung einrichten und organisieren',
      // Zahlen & Rechnen
      'Addieren und Subtrahieren',
      'Multiplizieren und Dividieren',
      'Brüche verstehen',
      'Prozente im Alltag',
      'Uhr lesen und Zeit einteilen',
      'Geld zählen und wechseln',
      'Kalender und Datum verstehen',
      'Messen und Wiegen',
      'Taschenrechner benutzen',
      'Tabellen lesen',
      // Sprache & Lesen
      'Lesen üben – kurze Texte',
      'Buchstaben und Laute',
      'Wörter richtig schreiben',
      'Sätze bilden',
      'Texte verstehen und zusammenfassen',
      'Geschichten nacherzählen',
      'Reime und Gedichte',
      'Zeitungsartikel verstehen',
      'Schilder und Symbole lesen',
      'Formulare ausfüllen',
      // Natur & Tiere
      'Tiere und ihre Lebensräume',
      'Pflanzen und Bäume erkennen',
      'Jahreszeiten und Wetter',
      'Wasser und Gewässer',
      'Der Körper von Tieren',
      'Haustiere pflegen',
      'Insekten und ihre Aufgaben',
      'Umwelt schützen',
      'Recycling und Müll trennen',
      'Wald und Natur erkunden',
      // Körper & Gesundheit
      'Der menschliche Körper',
      'Gesund essen und trinken',
      'Schlafen und Erholen',
      'Sport und Bewegung',
      'Arztbesuch vorbereiten',
      'Erste Hilfe Grundlagen',
      'Hygiene im Alltag',
      'Gefühle und Stimmungen verstehen',
      'Stress abbauen',
      'Zähne und Zahnpflege',
      // Beruf & Arbeit
      'Einen Lebenslauf schreiben',
      'Bewerbungsschreiben verstehen',
      'Ein Vorstellungsgespräch vorbereiten',
      'Rechte und Pflichten bei der Arbeit',
      'Arbeitszeiten und Pausen',
      'Lohnabrechnung lesen',
      'Teamarbeit und Kommunikation',
      'Berufe kennenlernen',
      'Ausbildung und Weiterbildung',
      'Kündigung und Arbeitslosigkeit',
      // Technik & Medien
      'Smartphone benutzen',
      'Internet sicher nutzen',
      'E-Mails schreiben und empfangen',
      'Soziale Medien verstehen',
      'Passwörter und Datenschutz',
      'Online-Banking Grundlagen',
      'Videos und Musik streamen',
      'Fotos machen und speichern',
      'Computer und Tastatur',
      'Apps installieren und nutzen',
      // Geschichte & Gesellschaft
      'Deutschland – Geschichte einfach erklärt',
      'Demokratie und Wahlen',
      'Gesetze und Regeln',
      'Europa und die EU',
      'Menschenrechte',
      'Wichtige Personen der Geschichte',
      'Erster und Zweiter Weltkrieg einfach erklärt',
      'Religionen der Welt',
      'Kulturen und Bräuche',
      'Flucht und Migration verstehen',
      // Kreativität & Freizeit
      'Malen und Zeichnen',
      'Basteln und Werken',
      'Musik hören und verstehen',
      'Ein Instrument lernen',
      'Tanzen und Bewegung',
      'Fotografieren',
      'Kochen und Backen',
      'Gärtnern und Pflanzen ziehen',
      'Spiele und Spielregeln',
      'Urlaub planen',
      // Gefühle & Soziales
      'Freundschaft und Beziehungen',
      'Konflikte lösen',
      'Nein sagen und Grenzen setzen',
      'Selbstbewusstsein stärken',
      'Hilfe suchen und annehmen',
      'Einsamkeit und Gesellschaft',
      'Trauer und Verlust',
      'Freude und Dankbarkeit',
      'Familie und Zusammenleben',
      'Träume und Ziele',
    ],
    audiencePromptText: (topic) =>
      `Super! Dein Arbeitsblatt geht um "${topic}".\n\nFür wen ist es gedacht?`,
    audienceSuggestions: [
      'Grundschule',
      'Förderschule',
      'Realschule',
      'Gymnasium',
      'Erwachsene',
      'Senioren',
      'Menschen mit Lernschwierigkeiten',
    ],
    objectivesText: 'Was soll man danach wissen oder können?',
    objectivesSuggestions: [
      'Etwas Neues lernen',
      'Eine Aufgabe selbst machen',
      'Etwas erklären können',
      'Schritt für Schritt vorgehen',
      'Üben und wiederholen',
      'Wichtige Wörter kennen',
    ],
    aspectsText: 'Was soll unbedingt vorkommen?',
    aspectsSuggestions: [
      'Einfache Erklärungen',
      'Beispiele',
      'Klare Schritt-für-Schritt-Aufgaben',
      'Wenig Text',
      'Große Schrift',
      'Fragen zum Ankreuzen',
    ],
    topicPlaceholder: 'Worüber soll das Arbeitsblatt sein?',
  },
  standard: {
    greetingText:
      'Hallo! Ich helfe dir beim Erstellen eines Arbeitsblatts. Lass uns mit den Grundlagen beginnen.\n\nWelches Thema soll dein Arbeitsblatt behandeln?',
    greetingSuggestions: [
      'Brüche',
      'Photosynthese',
      'Französische Revolution',
      'Klimawandel',
      'Demokratie',
      'Geometrie',
      'Mittelalter',
      'Ökosysteme',
      'Grammatik',
      'Globalisierung',
    ],
    audiencePromptText: (topic) =>
      `Super! Dein Arbeitsblatt wird sich mit "${topic}" befassen.\n\nWer ist die Zielgruppe?`,
    audienceSuggestions: [
      'Grundschule',
      'Sekundarstufe I',
      'Sekundarstufe II',
      'Erwachsene',
      'Berufsschule',
    ],
    objectivesText:
      'Verstanden! Was soll der Lernende nach dem Arbeitsblatt verstehen oder können? Was sind die Lernziele?',
    objectivesSuggestions: [
      'Grundkonzepte verstehen',
      'Aufgaben selbständig lösen',
      'Zusammenhänge erklären können',
      'Wissen anwenden',
      'Fachbegriffe kennen',
      'Kritisch denken',
    ],
    aspectsText:
      'Welche Aspekte oder Unterthemen sind besonders wichtig und sollen unbedingt vorkommen?',
    aspectsSuggestions: [
      'Alle relevanten Grundlagen',
      'Die wichtigsten Konzepte',
      'Praktische Beispiele',
      'Übungsaufgaben',
      'Definitionen und Begriffe',
      'Schaubilder und Diagramme',
    ],
    topicPlaceholder: 'Welches Thema soll behandelt werden?',
  },
  fach: {
    greetingText:
      'Hallo! Ich unterstütze Sie bei der Entwicklung eines fachlich fundierten Arbeitsblatts.\n\nWelches Thema oder Fachgebiet soll bearbeitet werden?',
    greetingSuggestions: [
      'Differentialrechnung',
      'Organische Chemie',
      'Makroökonomie',
      'Quantenmechanik',
      'Verfassungsrecht',
      'Literaturtheorie',
      'Molekularbiologie',
      'Statistik',
      'Europäische Integration',
      'Thermodynamik',
    ],
    audiencePromptText: (topic) =>
      `Das Arbeitsblatt wird das Thema „${topic}" behandeln.\n\nFür welche Zielgruppe und Kompetenzstufe ist es konzipiert?`,
    audienceSuggestions: [
      'Gymnasium Oberstufe',
      'Hochschule / Studium',
      'Berufsschule Fachklasse',
      'Masterstudium',
      'Weiterbildung Fachkräfte',
    ],
    objectivesText: 'Welche fachlichen Kompetenzen oder Lernziele sollen vermittelt werden?',
    objectivesSuggestions: [
      'Konzepte analysieren und anwenden',
      'Fachterminologie sicher verwenden',
      'Komplexe Zusammenhänge modellieren',
      'Wissenschaftlich argumentieren',
      'Methoden kritisch reflektieren',
      'Forschungsergebnisse interpretieren',
    ],
    aspectsText: 'Welche fachlichen Inhalte oder Methoden sollen zwingend integriert werden?',
    aspectsSuggestions: [
      'Kerninhalte des Lehrplans',
      'Fachspezifische Methoden und Arbeitsweisen',
      'Verweise auf Primärquellen',
      'Aktuelle Forschungsbefunde',
      'Interdisziplinäre Bezüge',
      'Fallstudien und Anwendungsbeispiele',
    ],
    topicPlaceholder: 'Welches Fachthema soll behandelt werden?',
  },
};

type CreationState = {
  step:
    | 'idle'
    | 'asking_topic'
    | 'asking_audience'
    | 'asking_objectives'
    | 'asking_aspects'
    | 'generating'
    | 'done';
  topic: string;
  audience: string;
  objectives: string;
  aspects: string;
};

const INITIAL_CREATION_STATE: CreationState = {
  step: 'idle',
  topic: '',
  audience: '',
  objectives: '',
  aspects: '',
};

export function ChatPanel({
  canUseAi,
  guidedCreationToken = 0,
  onStartGuidedCreation,
}: {
  canUseAi: boolean;
  guidedCreationToken?: number;
  onStartGuidedCreation: () => void;
}) {
  const chat = useChatState();
  const editor = useEditorState();
  const actions = useAppActions();
  const [chatInput, setChatInput] = useState('');
  const [creationState, setCreationState] = useState<CreationState>(INITIAL_CREATION_STATE);
  const content = LANGUAGE_MODE_CONTENT[chat.languageMode] ?? LANGUAGE_MODE_CONTENT.standard;
  const languageModeRef = useRef(chat.languageMode);
  languageModeRef.current = chat.languageMode;
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const rootRef = useRef<HTMLElement>(null);
  const lastReadMessageRef = useRef<string | null>(null);
  const pendingAudioUrlRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    const style = getComputedStyle(el);
    const paddingY = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
    const lineHeight = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.5;
    el.style.height = '1px';
    el.style.height = `${Math.min(el.scrollHeight, lineHeight * 6 + paddingY)}px`;
  }, [chatInput]);

  const startGuidedCreation = useCallback(() => {
    if (!canUseAi) {
      return;
    }

    const modeContent =
      LANGUAGE_MODE_CONTENT[languageModeRef.current] ?? LANGUAGE_MODE_CONTENT.standard;
    actions.chatMessagesSet([
      {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: withSuggestions(
          modeContent.greetingText,
          pickRandom(modeContent.greetingSuggestions, 3)
        ),
        createdAt: Date.now(),
      },
    ]);
    setCreationState({
      step: 'asking_topic',
      topic: '',
      audience: '',
      objectives: '',
      aspects: '',
    });
    setChatInput('');
  }, [actions, canUseAi]);

  const handleGuidedMessage = useCallback(
    async (value: string, audioUrl?: string) => {
      const userMessage = {
        id: crypto.randomUUID(),
        role: 'user' as const,
        content: value,
        createdAt: Date.now(),
        audioUrl,
      };

      if (creationState.step === 'asking_topic') {
        actions.chatMessageAdded(userMessage);
        actions.chatMessageAdded({
          id: crypto.randomUUID(),
          role: 'assistant',
          content: withSuggestions(
            content.audiencePromptText(value),
            pickRandom(content.audienceSuggestions, 3)
          ),
          createdAt: Date.now(),
        });
        setCreationState((prev) => ({
          ...prev,
          step: 'asking_audience',
          topic: value,
          audience: '',
          objectives: '',
          aspects: '',
        }));
        return;
      }

      if (creationState.step === 'asking_audience') {
        actions.chatMessageAdded(userMessage);
        actions.chatMessageAdded({
          id: crypto.randomUUID(),
          role: 'assistant',
          content: withSuggestions(
            content.objectivesText,
            pickRandom(content.objectivesSuggestions, 3)
          ),
          createdAt: Date.now(),
        });
        setCreationState((prev) => ({ ...prev, step: 'asking_objectives', audience: value }));
        return;
      }

      if (creationState.step === 'asking_objectives') {
        actions.chatMessageAdded(userMessage);
        actions.chatMessageAdded({
          id: crypto.randomUUID(),
          role: 'assistant',
          content: withSuggestions(content.aspectsText, pickRandom(content.aspectsSuggestions, 3)),
          createdAt: Date.now(),
        });
        setCreationState((prev) => ({ ...prev, step: 'asking_aspects', objectives: value }));
        return;
      }

      if (creationState.step === 'asking_aspects') {
        actions.chatMessageAdded(userMessage);
        setCreationState((prev) => ({ ...prev, step: 'generating', aspects: value }));

        try {
          const updatedState = { ...creationState, aspects: value };
          const { assistantMessage } = await actions.sendChatMessage({
            userInput: value,
            creationState: updatedState,
          });

          actions.chatMessageAdded({
            ...assistantMessage,
            createdAt: Date.now(),
          });
          setCreationState((prev) => ({ ...prev, step: 'done', aspects: value }));
        } catch (error) {
          actions.chatMessageAdded({
            id: crypto.randomUUID(),
            role: 'assistant',
            content: `Fehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
            createdAt: Date.now(),
          });
          setCreationState((prev) => ({ ...prev, step: 'asking_aspects' }));
        }
      }
    },
    [actions, creationState, content]
  );

  const handleTranscript = useCallback((text: string, audioUrl?: string) => {
    if (!text.trim()) {
      return;
    }

    pendingAudioUrlRef.current = audioUrl;
    setChatInput(text);
    inputRef.current?.focus();
  }, []);

  const handleSpeechError = useCallback(
    (message: string, audioUrl?: string, isSilent?: boolean) => {
      if (isSilent) {
        return;
      }

      if (audioUrl) {
        actions.chatMessageAdded({
          id: crypto.randomUUID(),
          role: 'user',
          content: '[Sprachaufnahme]',
          createdAt: Date.now(),
          audioUrl,
        });
      }

      actions.chatMessageAdded({
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Fehler: ${message}`,
        createdAt: Date.now(),
      });
    },
    [actions]
  );

  const speech = useSpeech({
    apiToken: editor.apiConfig.apiToken,
    apiEndpoint: editor.apiConfig.apiEndpoint,
    transcriptionLanguage: editor.apiConfig.transcriptionLanguage,
    onTranscript: handleTranscript,
    onError: handleSpeechError,
  });

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat.messages]);

  useEffect(() => {
    if (!guidedCreationToken) {
      return;
    }

    if (rootRef.current?.offsetParent === null) {
      return;
    }

    startGuidedCreation();
  }, [guidedCreationToken, startGuidedCreation]);

  const { stopSpeaking, speak, ttsSupported } = speech;

  useEffect(() => {
    if (!chat.readAloudEnabled) {
      stopSpeaking();
    }
  }, [chat.readAloudEnabled, stopSpeaking]);

  useEffect(() => {
    if (!chat.readAloudEnabled || !ttsSupported) {
      return;
    }

    const lastMessage = chat.messages[chat.messages.length - 1];

    if (
      !lastMessage ||
      lastMessage.role !== 'assistant' ||
      lastReadMessageRef.current === lastMessage.id
    ) {
      return;
    }

    const { text } = parseMessage(lastMessage.content);
    lastReadMessageRef.current = lastMessage.id;
    speak(text || lastMessage.content, lastMessage.id);
  }, [chat.messages, chat.readAloudEnabled, speak, ttsSupported]);

  const handleSend = useCallback(async () => {
    if (!chatInput.trim() || !canUseAi || chat.loading) {
      return;
    }

    const value = chatInput;
    const audioUrl = pendingAudioUrlRef.current;
    pendingAudioUrlRef.current = undefined;
    setChatInput('');

    if (
      creationState.step === 'asking_topic' ||
      creationState.step === 'asking_audience' ||
      creationState.step === 'asking_objectives' ||
      creationState.step === 'asking_aspects'
    ) {
      await handleGuidedMessage(value, audioUrl);
      return;
    }

    await actions.sendMessage(value, 'user', audioUrl);
  }, [actions, canUseAi, chat.loading, chatInput, creationState.step, handleGuidedMessage]);

  const handleSuggestionSelect = useCallback(
    async (suggestion: string) => {
      if (!canUseAi || chat.loading) {
        return;
      }

      pendingAudioUrlRef.current = undefined;

      if (
        creationState.step === 'asking_topic' ||
        creationState.step === 'asking_audience' ||
        creationState.step === 'asking_objectives' ||
        creationState.step === 'asking_aspects'
      ) {
        await handleGuidedMessage(suggestion);
        return;
      }

      await actions.sendMessage(suggestion, 'user');
    },
    [actions, canUseAi, chat.loading, creationState.step, handleGuidedMessage]
  );

  return (
    <section
      ref={rootRef}
      className="border-base-300 bg-base-100 flex min-h-full flex-1 flex-col overflow-hidden border shadow-sm"
    >
      <header className="border-base-300 border-b p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 text-primary p-2">
              <ChatBubbleLeftRightIcon className="size-5" />
            </div>
            <div>
              <h1 className="font-semibold">KI-Assistent</h1>
              <p className="text-base-content/60 text-xs">
                Chat, Ideen und geführte Erstellung für das Arbeitsblatt.
              </p>
            </div>
          </div>

          {speech.ttsSupported ? (
            <button
              className={twMerge('btn btn-lg', chat.readAloudEnabled ? 'btn-primary' : 'btn-ghost')}
              type="button"
              onClick={actions.chatReadAloudToggled}
            >
              {chat.readAloudEnabled ? (
                <SpeakerXMarkIcon className="size-6" />
              ) : (
                <SpeakerWaveIcon className="size-6" />
              )}
              {chat.readAloudEnabled ? 'Vorlesen deaktivieren' : 'Alle Antworten vorlesen'}
            </button>
          ) : null}
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden px-5 py-5">
        <div className="rounded-box bg-base-200/80 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
          {chat.messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <div className="bg-primary/10 text-primary rounded-full p-4">
                <SparklesIcon className="size-8" />
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-semibold">Noch kein Gespräch</h2>
                <p className="text-base-content/70 max-w-md text-sm leading-6">
                  Klicke auf „Arbeitsblatt erstellen" – die KI erstellt dann das Arbeitsblatt mit
                  dir zusammen.
                </p>
              </div>
              <button
                className="btn btn-outline btn-primary btn-lg gap-2"
                disabled={!canUseAi}
                type="button"
                onClick={onStartGuidedCreation}
              >
                <SparklesIcon className="size-5" />
                Arbeitsblatt erstellen
              </button>
            </div>
          ) : (
            chat.messages.map((message) => {
              const { text, suggestions } = parseMessage(message.content);
              const isAssistant = message.role === 'assistant';
              const isSpeaking = speech.speakingId === message.id;

              return (
                <div
                  key={message.id}
                  className={twMerge('flex', isAssistant ? 'justify-start' : 'justify-end')}
                >
                  <div
                    className={twMerge(
                      'rounded-box max-w-[85%] min-w-[30%] px-4 py-3 text-sm leading-6 shadow-sm',
                      isAssistant
                        ? 'border-base-300 bg-base-100 text-base-content border'
                        : ''
                    )}
                    style={isAssistant ? undefined : { backgroundColor: '#d5cefd', color: '#000000' }}
                  >
                    {text || (!isAssistant && message.content) ? (
                      <p className="wrap-break-word whitespace-pre-wrap">
                        {text || message.content}
                      </p>
                    ) : null}

                    {message.audioUrl ? (
                      <audio className="mt-3 w-full" controls src={message.audioUrl}>
                        <track kind="captions" />
                      </audio>
                    ) : null}

                    {isAssistant && speech.ttsSupported ? (
                      <div className="mt-3 flex justify-start">
                        <button
                          className="btn btn-secondary btn-outline btn-sm flex cursor-pointer items-center gap-1"
                          type="button"
                          onClick={() => {
                            if (isSpeaking) {
                              speech.stopSpeaking();
                              return;
                            }
                            speech.speak(text || message.content, message.id);
                          }}
                        >
                          {isSpeaking ? (
                            <StopCircleIcon className="size-4" />
                          ) : (
                            <SpeakerWaveIcon className="size-4" />
                          )}
                          {isSpeaking ? 'Stoppen' : 'Vorlesen'}
                        </button>
                      </div>
                    ) : null}

                    {suggestions.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {suggestions.map((suggestion) => (
                          <button
                            key={`${message.id}-${suggestion}`}
                            className="badge border-primary text-primary hover:bg-primary hover:text-primary-content cursor-pointer"
                            disabled={!canUseAi || chat.loading}
                            type="button"
                            onClick={() => {
                              void handleSuggestionSelect(suggestion);
                            }}
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}

          {chat.loading ? (
            <div className="flex justify-start">
              <div className="rounded-box border-base-300 bg-base-100 border px-4 py-3 shadow-sm">
                <span className="loading loading-dots loading-sm" />
              </div>
            </div>
          ) : null}
          <div ref={endRef} />
        </div>

        <div className="rounded-box border-base-300 bg-base-100 border p-3 shadow-sm">
          {speech.isListening || speech.isTranscribing ? (
            <div className="rounded-box border-error/20 bg-error/5 mb-3 border px-3 py-3">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-base-content font-medium">
                  {speech.isTranscribing ? 'Transkription lauft...' : 'Sprachaufnahme lauft...'}
                </span>
                {speech.isListening ? (
                  <span className="badge badge-error badge-sm text-white">Live</span>
                ) : null}
              </div>
              {speech.isListening ? (
                <div className="bg-base-300 mt-3 h-2 overflow-hidden rounded-full">
                  <div
                    className="bg-error h-full rounded-full transition-[width]"
                    style={{ width: `${Math.min(Math.max(speech.audioLevel * 100, 6), 100)}%` }}
                  />
                </div>
              ) : null}
            </div>
          ) : null}

          {!canUseAi ? (
            <div className="rounded-box border-warning/30 bg-warning/10 text-warning-content mb-3 border px-3 py-2 text-sm">
              Hinterlege zuerst einen API-Token in den KI-Einstellungen, um den Assistenten zu
              verwenden.
            </div>
          ) : null}

          <div className="flex items-end gap-3">
            <button
              className={twMerge('btn btn-outline btn-lg', speech.isListening && 'btn-error')}
              data-chat-record-button="true"
              disabled={
                !speech.isListening &&
                (!speech.sttSupported || !canUseAi || chat.loading || speech.isTranscribing)
              }
              type="button"
              onClick={() => {
                if (speech.isListening) {
                  speech.stopListening();
                  return;
                }

                speech.startListening();
              }}
            >
              <MicrophoneIcon className="size-5" />
              {speech.isListening ? 'Stoppen' : 'Spracheingabe'}
            </button>
            <label className="form-control flex-1">
              <span className="sr-only">Nachricht</span>
              <textarea
                ref={inputRef}
                data-chat-input="true"
                className="textarea textarea-bordered textarea-lg w-full min-h-0 resize-none overflow-y-auto"
                rows={1}
                placeholder={
                  creationState.step === 'asking_topic'
                    ? content.topicPlaceholder
                    : creationState.step === 'asking_audience'
                      ? 'Wer ist die Zielgruppe?'
                      : 'Schreibe eine Nachricht an Lumi...'
                }
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    void handleSend();
                  }
                }}
              />
            </label>
            <button
              className="btn btn-primary btn-lg"
              disabled={
                !chatInput.trim() ||
                !canUseAi ||
                chat.loading ||
                creationState.step === 'generating'
              }
              type="button"
              onClick={() => {
                void handleSend();
              }}
            >
              {creationState.step === 'generating' ? 'Erstellt...' : 'Senden'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
