import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Volume2,
  Mic,
  Square,
  RotateCcw,
  CheckCircle,
} from 'lucide-react';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';

/* ═══════════════════════════════════════════════════════════════
   UserTurnInput — handles mic / fallback text input for user turns
   ═══════════════════════════════════════════════════════════════ */
function UserTurnInput({ lang, hint, onSubmit }) {
  const { isSupported, isListening, transcript, isFinal, start, stop, reset } =
    useSpeechRecognition(lang);

  const [draft, setDraft] = useState('');
  const [captureReady, setCaptureReady] = useState(false);
  const [textInput, setTextInput] = useState('');
  const inputRef = useRef(null);

  // When speech recognition ends, if we have text → move to "captured" state
  useEffect(() => {
    if (!isListening && transcript.trim()) {
      setDraft(transcript.trim());
      setCaptureReady(true);
    }
  }, [isListening, transcript]);

  // isFinal is an alternative early-capture signal
  useEffect(() => {
    if (isFinal && transcript.trim() && !captureReady) {
      setDraft(transcript.trim());
      setCaptureReady(true);
    }
  }, [isFinal, transcript, captureReady]);

  const handleMicClick = useCallback(() => {
    if (isListening) {
      stop();
    } else {
      reset();
      setCaptureReady(false);
      setDraft('');
      start();
    }
  }, [isListening, start, stop, reset]);

  const handleRecordAgain = useCallback(() => {
    reset();
    setDraft('');
    setCaptureReady(false);
    start();
  }, [reset, start]);

  const handleSubmitMic = useCallback(() => {
    if (draft.trim()) onSubmit(draft.trim());
  }, [draft, onSubmit]);

  const handleSubmitText = useCallback(() => {
    if (textInput.trim()) onSubmit(textInput.trim());
  }, [textInput, onSubmit]);

  /* ─── Fallback: plain text input ─── */
  if (!isSupported) {
    return (
      <div>
        <p className="cp-hint">💡 {hint}</p>
        <div className="cp-fallback-row">
          <input
            ref={inputRef}
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && textInput.trim()) handleSubmitText();
            }}
            placeholder="Type your response…"
            className="cp-text-input"
            id="convo-text-fallback-input"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
          <button
            className="cp-submit-btn"
            onClick={handleSubmitText}
            disabled={!textInput.trim()}
            id="convo-text-fallback-submit"
          >
            Submit
          </button>
        </div>
      </div>
    );
  }

  /* ─── Speech recognition UI ─── */
  return (
    <div>
      <p className="cp-hint">💡 {hint}</p>

      {/* Transcript display */}
      {(isListening || draft) && (
        <div
          className={`cp-transcript-box${isListening ? ' listening' : ''}`}
          aria-live="polite"
          aria-label="Speech transcript"
        >
          {isListening ? (
            <span className="cp-listening-text">
              {transcript || 'Listening'}
            </span>
          ) : (
            draft
          )}
        </div>
      )}

      {/* Controls */}
      {!captureReady ? (
        <button
          className={`cp-mic-btn${isListening ? ' cp-recording' : ''}`}
          onClick={handleMicClick}
          id={isListening ? 'convo-stop-recording-btn' : 'convo-start-recording-btn'}
          aria-label={isListening ? 'Stop recording' : 'Start recording'}
          aria-pressed={isListening}
        >
          {isListening ? <Square size={18} /> : <Mic size={18} />}
          {isListening ? 'Stop' : 'Record'}
        </button>
      ) : (
        <div className="cp-capture-actions">
          <button
            className="cp-retry-btn"
            onClick={handleRecordAgain}
            id="convo-record-again-btn"
          >
            <RotateCcw size={15} />
            Record Again
          </button>
          <button
            className="cp-keep-btn"
            onClick={handleSubmitMic}
            id="convo-keep-submit-btn"
          >
            <CheckCircle size={15} />
            Keep &amp; Submit
          </button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TurnCard — renders one conversation turn (AI or User)
   ═══════════════════════════════════════════════════════════════ */

/** How long (ms) to wait before auto-advancing an AI turn */
const AI_ADVANCE_DELAY = 1800;

/**
 * @param {{
 *   turn: { speaker: 'ai'|'user', text?: string, hint?: string },
 *   isActive: boolean,
 *   isDone: boolean,
 *   submittedText?: string,
 *   charName: string,
 *   charAvatar: string,
 *   voiceLocale: string,
 *   lang: string,
 *   turnIdx: number,
 *   onAiContinue: () => void,
 *   onUserSubmit: (text: string) => void,
 * }} props
 */
export default function TurnCard({
  turn,
  isActive,
  isDone,
  submittedText,
  charName,
  charAvatar,
  voiceLocale,
  lang,
  turnIdx,
  onAiContinue,
  onUserSubmit,
  onSpeak,
  autoAdvanceDelay = 1800,
}) {
  const isAi   = turn.speaker === 'ai';
  const isUser = turn.speaker === 'user';

  /* ── Auto-advance AI turns after speech or reading delay ── */
  useEffect(() => {
    if (!isAi || !isActive) return;

    let fallbackTimer = null;

    const handleSpeechEnd = (e) => {
      if (e && e.type === 'error' && e.error === 'interrupted') {
        return;
      }
      onAiContinue();
    };

    if (typeof speechSynthesis === 'undefined') {
      fallbackTimer = setTimeout(() => {
        onAiContinue();
      }, autoAdvanceDelay);
    } else {
      // Autoplay the sounds
      onSpeak?.(turn.text, handleSpeechEnd);

      // Safety fallback timer: in case speech synthesis is blocked, unsupported, or takes too long,
      // we set a safety timeout (e.g. at least 6 seconds, or 100ms per character).
      const estimatedDuration = Math.max(6000, turn.text.length * 100);
      fallbackTimer = setTimeout(() => {
        try {
          speechSynthesis.cancel();
        } catch (e) {}
        onAiContinue();
      }, estimatedDuration);
    }

    return () => {
      if (fallbackTimer) clearTimeout(fallbackTimer);
    };
  }, [isAi, isActive, turn.text, onSpeak, onAiContinue, autoAdvanceDelay]);

  return (
    <div
      className={[
        'cp-turn-card',
        isAi   ? 'cp-turn-ai'   : 'cp-turn-user',
        isDone ? 'cp-turn-done' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label={isAi ? `${charName} speaking` : 'Your turn'}
    >
      {/* ── Card header ── */}
      <div className="cp-turn-header">
        <span className={`cp-turn-label ${isAi ? 'ai-label' : 'user-label'}`}>
          <span className="cp-turn-avatar">{isAi ? charAvatar : '🧑‍💻'}</span>
          {isAi ? charName : 'You'}
        </span>

        {/* TTS button — always visible on AI cards */}
        {isAi && (
          <button
            className="cp-tts-btn"
            onClick={() => onSpeak?.(turn.text)}
            aria-label="Play audio"
            id={`convo-tts-btn-${turnIdx}`}
          >
            <Volume2 size={14} />
            Listen
          </button>
        )}
      </div>

      {/* ── AI turn body ── */}
      {isAi && (
        <>
          <p className="cp-ai-text">{turn.text}</p>
          {/* Subtle auto-advance indicator while active */}
          {isActive && (
            <span className="cp-auto-next" aria-hidden="true" />
          )}
        </>
      )}

      {/* ── User turn body ── */}
      {isUser && (
        <>
          {isDone ? (
            <p className="cp-done-text">"{submittedText}"</p>
          ) : (
            isActive && (
              <UserTurnInput
                lang={voiceLocale}
                hint={turn.hint}
                onSubmit={onUserSubmit}
              />
            )
          )}
        </>
      )}
    </div>
  );
}
