import * as React from 'react';

// ----------------------------------------------------------------------

type UseSpeechOptions = {
  /** Called with the final transcript when speech recognition completes. */
  onTranscript: (text: string) => void;
};

type UseSpeechReturn = {
  isListening: boolean;
  isSpeaking: boolean;
  /** ID of the message currently being spoken, or null. */
  speakingId: string | null;
  sttSupported: boolean;
  ttsSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  speak: (text: string, id: string) => void;
  stopSpeaking: () => void;
};

// ----------------------------------------------------------------------

export function useSpeech({ onTranscript }: UseSpeechOptions): UseSpeechReturn {
  const [isListening, setIsListening] = React.useState(false);
  const [isSpeaking, setIsSpeaking] = React.useState(false);
  const [speakingId, setSpeakingId] = React.useState<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = React.useRef<any>(null);
  const onTranscriptRef = React.useRef(onTranscript);
  onTranscriptRef.current = onTranscript;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type SpeechRecognitionCtor = new () => any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const SpeechRecognitionImpl: SpeechRecognitionCtor | undefined =
    typeof window !== 'undefined'
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition
      : undefined;

  const sttSupported = Boolean(SpeechRecognitionImpl);
  const ttsSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const startListening = React.useCallback(() => {
    if (!SpeechRecognitionImpl) return;

    const recognition = new SpeechRecognitionImpl();
    recognition.lang = navigator.language;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onTranscriptRef.current(transcript);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [SpeechRecognitionImpl]);

  const stopListening = React.useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const speak = React.useCallback(
    (text: string, id: string) => {
      if (!ttsSupported) return;
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = navigator.language;

      utterance.onstart = () => {
        setIsSpeaking(true);
        setSpeakingId(id);
      };
      utterance.onend = () => {
        setIsSpeaking(false);
        setSpeakingId(null);
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        setSpeakingId(null);
      };

      window.speechSynthesis.speak(utterance);
    },
    [ttsSupported]
  );

  const stopSpeaking = React.useCallback(() => {
    if (!ttsSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setSpeakingId(null);
  }, [ttsSupported]);

  // Cleanup on unmount
  React.useEffect(
    () => () => {
      recognitionRef.current?.stop();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    },
    []
  );

  return {
    isListening,
    isSpeaking,
    speakingId,
    sttSupported,
    ttsSupported,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  };
}
