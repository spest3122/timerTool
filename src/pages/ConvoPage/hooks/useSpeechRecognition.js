import { useState, useRef, useCallback, useEffect } from 'react';

/* Detect API presence once at module load */
const SR =
  typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

/**
 * useSpeechRecognition
 *
 * @param {string} lang  BCP-47 locale string, e.g. 'de-DE'
 * @returns {{
 *   isSupported: boolean,
 *   isListening: boolean,
 *   transcript: string,
 *   isFinal: boolean,
 *   start: () => void,
 *   stop: () => void,
 *   reset: () => void,
 * }}
 */
export function useSpeechRecognition(lang = 'en-US') {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isFinal, setIsFinal] = useState(false);
  const recRef = useRef(null);
  const explicitlyStoppedRef = useRef(false);
  const lastErrorRef = useRef(null);
  const transcriptRef = useRef('');

  const isSupported = Boolean(SR);

  /* Abort recognition on unmount to avoid stale callbacks */
  useEffect(() => {
    return () => {
      if (recRef.current) {
        recRef.current.abort();
        recRef.current = null;
      }
    };
  }, []);


  const start = useCallback(() => {
    if (!SR) return;

    /* Abort any existing session first */
    if (recRef.current) {
      recRef.current.abort();
      recRef.current = null;
    }

    setTranscript('');
    setIsFinal(false);
    transcriptRef.current = '';
    explicitlyStoppedRef.current = false;
    lastErrorRef.current = null;

    const rec = new SR();
    rec.lang = lang;
    rec.continuous = false;       // stop automatically after first utterance
    rec.interimResults = true;    // show partial results while speaking

    rec.onstart = () => {
      setIsListening(true);
    };

    rec.onresult = (event) => {
      let combinedText = '';
      let gotFinal = false;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        combinedText += event.results[i][0].transcript;
        if (event.results[i].isFinal) gotFinal = true;
      }

      setTranscript(combinedText);
      transcriptRef.current = combinedText;
      if (gotFinal) setIsFinal(true);
    };

    rec.onerror = (event) => {
      console.warn('[SpeechRecognition] Error:', event.error);
      lastErrorRef.current = event.error;
      setIsListening(false);
    };

    rec.onend = () => {
      setIsListening(false);

      const wasNoSpeech = lastErrorRef.current === 'no-speech';
      const wasAborted = lastErrorRef.current === 'aborted';
      const hadOtherError = lastErrorRef.current !== null && !wasNoSpeech;
      const isSilentEnd = !transcriptRef.current && !wasAborted && !hadOtherError;

      if (!explicitlyStoppedRef.current && (wasNoSpeech || isSilentEnd)) {
        console.log('[SpeechRecognition] Silent timeout/no-speech detected. Auto-restarting...');
        setTimeout(() => {
          if (!explicitlyStoppedRef.current) {
            start();
          }
        }, 100);
      }
    };

    recRef.current = rec;
    rec.start();
  }, [lang]);

  const stop = useCallback(() => {
    explicitlyStoppedRef.current = true;
    if (recRef.current) {
      recRef.current.stop(); // triggers onend → setIsListening(false)
    }
  }, []);

  const reset = useCallback(() => {
    explicitlyStoppedRef.current = true;
    if (recRef.current) {
      recRef.current.abort();
      recRef.current = null;
    }
    setTranscript('');
    setIsFinal(false);
    setIsListening(false);
  }, []);

  /* Stop listening if text-to-speech begins playing */
  useEffect(() => {
    const handlePlayTTS = () => {
      if (isListening) {
        stop();
      }
    };
    window.addEventListener('convo-tts-play', handlePlayTTS);
    return () => {
      window.removeEventListener('convo-tts-play', handlePlayTTS);
    };
  }, [isListening, stop]);

  return { isSupported, isListening, transcript, isFinal, start, stop, reset };
}
