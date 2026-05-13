import { useCallback, useEffect, useRef, useState } from 'react';

import { buildApiErrorMessage, extractTechnicalFromResponse } from '@/utils/api-error';

type UseSpeechOptions = {
  apiToken: string;
  apiEndpoint: string;
  transcriptionLanguage: string;
  onTranscript: (text: string, audioUrl?: string) => void;
  onError?: (message: string, audioUrl?: string, isSilent?: boolean) => void;
};

type UseSpeechReturn = {
  isListening: boolean;
  isTranscribing: boolean;
  audioLevel: number;
  sttSupported: boolean;
  ttsSupported: boolean;
  speakingId: string | null;
  startListening: () => void;
  stopListening: () => void;
  speak: (text: string, id?: string) => void;
  stopSpeaking: () => void;
};

const MOCK_MODE = import.meta.env.VITE_MOCK_CHAT === 'true';
const t = () => `+${performance.now().toFixed(0)}ms`;

const NATIVE_STT_SKIP_KEY = 'speech_skip_native_stt';
// If native STT previously failed with a network/service error, skip it immediately.
let skipNativeStt =
  typeof localStorage !== 'undefined' && localStorage.getItem(NATIVE_STT_SKIP_KEY) === '1';

function getWhisperEndpoint(chatEndpoint: string): string {
  try {
    const url = new URL(chatEndpoint);
    const parts = url.pathname.split('/');
    const v1Index = parts.indexOf('v1');

    if (v1Index !== -1) {
      url.pathname = [...parts.slice(0, v1Index + 1), 'audio', 'transcriptions'].join('/');
    } else {
      url.pathname = '/v1/audio/transcriptions';
    }

    return url.toString();
  } catch {
    return 'https://api.openai.com/v1/audio/transcriptions';
  }
}

// Native browser Speech Recognition (Chrome/Edge; not available in Firefox or Brave)
const NativeSpeechRecognition =
  typeof window !== 'undefined'
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition ?? null)
    : null;

const nativeSttAvailable = NativeSpeechRecognition !== null;

const mediaRecorderSttAvailable =
  typeof window !== 'undefined' &&
  typeof navigator !== 'undefined' &&
  typeof navigator.mediaDevices?.getUserMedia === 'function' &&
  typeof MediaRecorder !== 'undefined';

const sttSupported = nativeSttAvailable || mediaRecorderSttAvailable;

const ttsSupported =
  typeof window !== 'undefined' &&
  typeof window.speechSynthesis !== 'undefined' &&
  typeof SpeechSynthesisUtterance !== 'undefined';

function getRecorderOptions(): MediaRecorderOptions | undefined {
  if (typeof MediaRecorder === 'undefined') {
    return undefined;
  }

  if (MediaRecorder.isTypeSupported('audio/webm')) {
    return { mimeType: 'audio/webm' };
  }

  if (MediaRecorder.isTypeSupported('audio/ogg')) {
    return { mimeType: 'audio/ogg' };
  }

  return undefined;
}

export function useSpeech({
  apiToken,
  apiEndpoint,
  transcriptionLanguage,
  onTranscript,
  onError,
}: UseSpeechOptions): UseSpeechReturn {
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<{ stop: () => void } | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const ensureStreamPromiseRef = useRef<Promise<boolean> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const analyserBufferRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const analyserFrameRef = useRef<number | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const apiTokenRef = useRef(apiToken);
  const apiEndpointRef = useRef(apiEndpoint);
  const transcriptionLanguageRef = useRef(transcriptionLanguage);
  const onTranscriptRef = useRef(onTranscript);
  const onErrorRef = useRef(onError);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const nativeSttFallbackRef = useRef(false);
  const startMediaRecorderListeningRef = useRef<(() => Promise<void>) | null>(null);

  useEffect(() => {
    apiTokenRef.current = apiToken;
    apiEndpointRef.current = apiEndpoint;
    transcriptionLanguageRef.current = transcriptionLanguage;
    onTranscriptRef.current = onTranscript;
    onErrorRef.current = onError;
  }, [apiEndpoint, apiToken, onError, onTranscript, transcriptionLanguage]);

  const stopMeter = useCallback(() => {
    if (analyserFrameRef.current !== null) {
      cancelAnimationFrame(analyserFrameRef.current);
      analyserFrameRef.current = null;
    }

    setAudioLevel(0);
  }, []);

  const startMeter = useCallback(() => {
    const analyser = analyserRef.current;
    const buffer = analyserBufferRef.current;

    if (!analyser || !buffer) {
      return;
    }

    const tick = () => {
      analyser.getByteFrequencyData(buffer);
      const average = buffer.reduce((sum, value) => sum + value, 0) / buffer.length;
      setAudioLevel(average / 128);
      analyserFrameRef.current = requestAnimationFrame(tick);
    };

    analyserFrameRef.current = requestAnimationFrame(tick);
  }, []);

  const ensureStream = useCallback(async () => {
    if (streamRef.current) {
      console.debug(`[speech] ${t()} ensureStream: stream already exists, reusing`);
      return true;
    }

    // Deduplicate concurrent calls (e.g. React StrictMode double-invoke)
    if (ensureStreamPromiseRef.current) {
      console.debug(`[speech] ${t()} ensureStream: awaiting in-flight getUserMedia call`);
      return ensureStreamPromiseRef.current;
    }

    console.debug(`[speech] ${t()} ensureStream: calling getUserMedia...`);
    const t0 = performance.now();
    const promise = (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.debug(
          `[speech] ${t()} ensureStream: getUserMedia resolved in ${(performance.now() - t0).toFixed(0)} ms`
        );
        streamRef.current = stream;

        const audioContext = new AudioContext();
        audioContextRef.current = audioContext;
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;
        analyserBufferRef.current = new Uint8Array(analyser.frequencyBinCount);
        console.debug(`[speech] ${t()} ensureStream: AudioContext + analyser ready`);
        return true;
      } catch (error) {
        console.error(
          `[speech] ${t()} ensureStream: getUserMedia failed after ${(performance.now() - t0).toFixed(0)} ms`,
          error
        );
        onErrorRef.current?.('Mikrofonzugriff wurde verweigert oder ist nicht verfugbar.');
        return false;
      } finally {
        ensureStreamPromiseRef.current = null;
      }
    })();
    ensureStreamPromiseRef.current = promise;
    return promise;
  }, []);

  // Pre-warm: if mic permission was already granted in a previous session, acquire
  // the stream and AudioContext immediately so there is no delay on first click.
  useEffect(() => {
    if (!mediaRecorderSttAvailable) {
      console.debug(`[speech] ${t()} pre-warm: mediaRecorderSttAvailable=false, skipping`);
      return;
    }

    console.debug(`[speech] ${t()} pre-warm: querying mic permission`);
    navigator.permissions
      ?.query({ name: 'microphone' as PermissionName })
      .then((status) => {
        console.debug(`[speech] ${t()} pre-warm: mic permission state = ${status.state}`);
        if (status.state === 'granted') {
          console.debug(`[speech] ${t()} pre-warm: calling ensureStream()`);
          void ensureStream();
        } else {
          console.debug(`[speech] ${t()} pre-warm: permission not yet granted, skipping pre-warm`);
        }
      })
      .catch((err) => {
        console.debug(`[speech] ${t()} pre-warm: permissions query failed`, err);
      });
  }, [ensureStream]);

  const startMediaRecorderListening = useCallback(async () => {
    console.debug(`[speech] ${t()} startMediaRecorderListening called`, {
      mediaRecorderSttAvailable,
      hasRecorder: !!recorderRef.current,
    });
    if (!mediaRecorderSttAvailable || recorderRef.current) {
      console.debug(`[speech] ${t()} startMediaRecorderListening: bailing out early`);
      return;
    }

    const streamAvailable = await ensureStream();

    if (!streamAvailable || !streamRef.current) {
      return;
    }

    const recorderOptions = getRecorderOptions();
    console.debug(`[speech] ${t()} starting MediaRecorder`, recorderOptions);
    const recorder = new MediaRecorder(streamRef.current, recorderOptions);
    audioChunksRef.current = [];

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };

    recorder.onstop = async () => {
      console.debug(`[speech] ${t()} recorder stopped, chunks: ${audioChunksRef.current.length}`);
      const blob = new Blob(audioChunksRef.current, {
        type: recorder.mimeType || 'audio/webm',
      });
      console.debug(`[speech] ${t()} blob size: ${blob.size}, type: ${blob.type}`);
      const audioUrl = URL.createObjectURL(blob);

      setIsTranscribing(true);

      try {
        if (MOCK_MODE) {
          await new Promise((resolve) => window.setTimeout(resolve, 300));
          onTranscriptRef.current('[Mock-Transkript] Testnachricht per Sprache', audioUrl);
          return;
        }

        const fileExtension = blob.type.includes('ogg') ? 'ogg' : 'webm';
        const formData = new FormData();
        formData.append('file', blob, `recording.${fileExtension}`);
        formData.append('model', 'whisper-1');
        formData.append(
          'language',
          transcriptionLanguageRef.current || navigator.language.split('-')[0]
        );

        const response = await fetch(getWhisperEndpoint(apiEndpointRef.current), {
          method: 'POST',
          headers: { Authorization: `Bearer ${apiTokenRef.current}` },
          body: formData,
        });

        if (!response.ok) {
          const technical = await extractTechnicalFromResponse(response);
          onErrorRef.current?.(buildApiErrorMessage(response.status, technical), audioUrl);
          return;
        }

        const data = (await response.json()) as { text?: string };
        const transcript = data.text?.trim();

        if (transcript) {
          onTranscriptRef.current(transcript, audioUrl);
          return;
        }

        onErrorRef.current?.('Die Aufnahme konnte nicht transkribiert werden.', audioUrl, true);
      } catch (error) {
        console.error('[speech] transcription fetch failed', error);
        onErrorRef.current?.('Spracherkennung fehlgeschlagen. Bitte versuche es erneut.', audioUrl);
      } finally {
        setIsTranscribing(false);
      }
    };

    recorder.start();
    recorderRef.current = recorder;
    console.debug(`[speech] ${t()} MediaRecorder started, state: ${recorder.state}`);
    setIsListening(true);
    startMeter();
  }, [ensureStream, startMeter]);

  useEffect(() => {
    startMediaRecorderListeningRef.current = startMediaRecorderListening;
  }, [startMediaRecorderListening]);

  const startNativeListening = useCallback(() => {
    console.debug(`[speech] ${t()} startNativeListening called`, {
      NativeSpeechRecognition: !!NativeSpeechRecognition,
      hasRecognition: !!recognitionRef.current,
    });
    if (!NativeSpeechRecognition || recognitionRef.current) {
      return;
    }

     
    const recognition = new NativeSpeechRecognition();
    recognition.lang = transcriptionLanguageRef.current || navigator.language || 'de';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      console.debug(`[speech] ${t()} native recognition result`, event.results);
      const transcript = Array.from(event.results)
        .map((result: SpeechRecognitionResult) => result[0].transcript)
        .join('');

      if (transcript.trim()) {
        onTranscriptRef.current(transcript.trim());
      } else {
        onErrorRef.current?.('Die Aufnahme konnte nicht transkribiert werden.');
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.debug(`[speech] ${t()} native recognition error`, event.error, event);
      if (event.error === 'no-speech') {
        onErrorRef.current?.('Keine Sprache erkannt. Bitte versuche es erneut.', undefined, true);
        return;
      }
      if (event.error === 'not-allowed') {
        onErrorRef.current?.('Mikrofonzugriff wurde verweigert.');
        return;
      }
      if (
        (event.error === 'service-not-allowed' || event.error === 'network') &&
        mediaRecorderSttAvailable
      ) {
        // Native Web Speech API failed — the browser's cloud speech service is blocked or
        // unavailable (e.g. Edge with speech recognition disabled in privacy settings, a
        // firewall blocking the cloud endpoint, or Brave). Fall back to MediaRecorder + Whisper
        // and persist the decision so the next click skips the ~4 s timeout entirely.
        console.debug(
          `[speech] ${t()} native STT unavailable, falling back to MediaRecorder + Whisper`,
          event.error
        );
        skipNativeStt = true;
        try {
          localStorage.setItem(NATIVE_STT_SKIP_KEY, '1');
        } catch {
          /* ignore */
        }
        nativeSttFallbackRef.current = true;
        void startMediaRecorderListeningRef.current?.();
        return;
      }
      onErrorRef.current?.('Spracherkennung fehlgeschlagen. Bitte versuche es erneut.');
    };

    recognition.onend = () => {
      console.debug(`[speech] ${t()} native recognition ended`, {
        fallback: nativeSttFallbackRef.current,
      });
      recognitionRef.current = null;
      // Don't reset listening state when we've already started the MediaRecorder fallback
      if (!nativeSttFallbackRef.current) {
        setIsListening(false);
      }
      nativeSttFallbackRef.current = false;
    };

    recognition.start();
    recognitionRef.current = recognition as { stop: () => void };
    setIsListening(true);
  }, []);

  const startListening = useCallback(async () => {
    if (isTranscribing) {
      return;
    }

    if (nativeSttAvailable && !skipNativeStt) {
      console.debug(`[speech] ${t()} startListening: using native STT`);
      startNativeListening();
      return;
    }

    if (skipNativeStt) {
      console.debug(
        `[speech] ${t()} startListening: native STT skipped (previously failed), using MediaRecorder`
      );
    }
    await startMediaRecorderListening();
  }, [isTranscribing, startMediaRecorderListening, startNativeListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setIsListening(false);
      return;
    }

    const recorder = recorderRef.current;

    if (!recorder) {
      return;
    }

    recorderRef.current = null;
    setIsListening(false);
    stopMeter();
    recorder.stop();
  }, [stopMeter]);

  const stopSpeaking = useCallback(() => {
    if (!ttsSupported) {
      return;
    }

    window.speechSynthesis.cancel();
    utteranceRef.current = null;
    setSpeakingId(null);
  }, []);

  const speak = useCallback((text: string, id?: string) => {
    if (!ttsSupported || !text.trim()) {
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = transcriptionLanguageRef.current || navigator.language || 'de-DE';
    utterance.onend = () => {
      utteranceRef.current = null;
      setSpeakingId((current) => (current === (id ?? null) ? null : current));
    };
    utterance.onerror = () => {
      utteranceRef.current = null;
      setSpeakingId((current) => (current === (id ?? null) ? null : current));
    };

    utteranceRef.current = utterance;
    setSpeakingId(id ?? '__speech__');
    window.speechSynthesis.speak(utterance);
  }, []);

  useEffect(
    () => () => {
      stopMeter();
      stopSpeaking();

      recognitionRef.current?.stop();

      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        recorderRef.current.stop();
      }

      streamRef.current?.getTracks().forEach((track) => track.stop());
      void audioContextRef.current?.close();
    },
    [stopMeter, stopSpeaking]
  );

  return {
    isListening,
    isTranscribing,
    audioLevel,
    sttSupported,
    ttsSupported,
    speakingId,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  };
}
