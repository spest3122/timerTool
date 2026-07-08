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
      if (gotFinal) setIsFinal(true);
    };

    rec.onerror = (event) => {
      console.warn('[SpeechRecognition] Error:', event.error);
      setIsListening(false);
    };

    rec.onend = () => {
      setIsListening(false);
    };

    recRef.current = rec;
    rec.start();
  }, [lang]);

  const stop = useCallback(() => {
    if (recRef.current) {
      recRef.current.stop(); // triggers onend → setIsListening(false)
    }
  }, []);

  const reset = useCallback(() => {
    if (recRef.current) {
      recRef.current.abort();
      recRef.current = null;
    }
    setTranscript('');
    setIsFinal(false);
    setIsListening(false);
  }, []);

  return { isSupported, isListening, transcript, isFinal, start, stop, reset };
}
