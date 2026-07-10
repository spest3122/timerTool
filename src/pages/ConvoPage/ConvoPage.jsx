import { useState, useRef, useEffect, useCallback } from 'react';
import { SCRIPTS } from './data/scripts';
import { CHARACTER_MAP } from './data/characters';
import { useSettings } from '../../context/SettingsContext';
import SelectionModal from './SelectionModal';
import ScriptModal from './ScriptModal';
import ConvoHeader from './ConvoHeader';
import TurnCard from './TurnCard';
import FeedbackView from './FeedbackView';
import './ConvoPage.css';

/**
 * ConvoPage — top-level page component.
 *
 * State machine phases:
 *   'select'   — show SelectionModal (pick tutor / language)
 *   'convo'    — active turn-based conversation
 *   'feedback' — lesson complete, show summary
 */
export default function ConvoPage({ autoAdvanceDelay = 1800 } = {}) {
  const { language, speakWithLocale } = useSettings();

  /* ── Core state ─────────────────────────────────── */
  const [phase,          setPhase]          = useState('select');  // 'select'|'convo'|'feedback'
  const [selectedLang,   setSelectedLang]   = useState(language);  // follows settings on start
  const [selectedCharId, setSelectedCharId] = useState(null);
  const [scriptTopicIdx, setScriptTopicIdx] = useState(0);
  const [turnIndex,      setTurnIndex]      = useState(0);
  const [userResponses,  setUserResponses]  = useState({});        // { [turnIdx]: string }
  const [showScript,     setShowScript]     = useState(false);

  const bottomRef = useRef(null);

  /* Speak callback — uses Settings voice for the selected lesson language */
  const onSpeak = useCallback(
    (text, onEnd) => speakWithLocale(text, selectedLang, onEnd),
    [speakWithLocale, selectedLang]
  );

  /* ── Derived values ─────────────────────────────────────── */
  const character = selectedCharId ? CHARACTER_MAP[selectedCharId] : null;
  const scripts   = selectedLang ? SCRIPTS[selectedLang] : [];
  const script    = scripts[scriptTopicIdx % scripts.length];

  /* ── Auto-scroll to bottom as new turns appear ──────────── */
  useEffect(() => {
    if (phase === 'convo' && bottomRef.current) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 80);
    }
  }, [turnIndex, phase]);

  /* ── Handlers ───────────────────────────────────────────── */
  function handleStart(lang, charId) {
    setSelectedLang(lang);
    setSelectedCharId(charId);
    setScriptTopicIdx(0);
    setTurnIndex(0);
    setUserResponses({});
    setPhase('convo');
  }

  function handleChangeCharacter() {
    setPhase('select');
  }

  function advanceTurn(currentIdx) {
    const nextIdx = currentIdx + 1;
    if (nextIdx >= script.turns.length) {
      setPhase('feedback');
    } else {
      setTurnIndex(nextIdx);
    }
  }

  function handleAiContinue() {
    advanceTurn(turnIndex);
  }

  function handleUserSubmit(text) {
    setUserResponses((prev) => ({ ...prev, [turnIndex]: text }));
    advanceTurn(turnIndex);
  }

  function handleRetry() {
    setTurnIndex(0);
    setUserResponses({});
    setPhase('convo');
  }

  function handleNextContext() {
    const nextIdx = (scriptTopicIdx + 1) % scripts.length;
    setScriptTopicIdx(nextIdx);
    setTurnIndex(0);
    setUserResponses({});
    setPhase('convo');
  }

  /* ── Render ─────────────────────────────────────────────── */

  // Phase: select
  if (phase === 'select') {
    return <SelectionModal onStart={handleStart} />;
  }

  // Phase: feedback
  if (phase === 'feedback') {
    return (
      <FeedbackView
        script={script}
        userResponses={userResponses}
        lang={selectedLang}
        character={character}
        onRetry={handleRetry}
        onNextContext={handleNextContext}
      />
    );
  }

  // Phase: convo
  const visibleTurns = script.turns.slice(0, turnIndex + 1);

  return (
    <main className="cp-page" id="convo-page">
      {/* ── Sticky header ── */}
      <ConvoHeader
        character={character}
        script={script}
        lang={selectedLang}
        turnIndex={turnIndex}
        totalTurns={script.turns.length}
        onChangeCharacter={handleChangeCharacter}
        onViewScript={() => setShowScript(true)}
      />

      {/* ── Conversation feed ── */}
      <div className="cp-content">
        <p className="cp-progress-label">
          Turn {Math.min(turnIndex + 1, script.turns.length)} of {script.turns.length}
        </p>

        {visibleTurns.map((turn, idx) => (
          <TurnCard
            key={idx}
            turn={turn}
            turnIdx={idx}
            isActive={idx === turnIndex}
            isDone={idx < turnIndex}
            submittedText={userResponses[idx]}
            charName={character?.name ?? 'AI'}
            charAvatar={character?.avatar ?? '🤖'}
            voiceLocale={character?.voiceLocale ?? 'en-US'}
            lang={selectedLang}
            autoAdvanceDelay={autoAdvanceDelay}
            onSpeak={onSpeak}
            onAiContinue={handleAiContinue}
            onUserSubmit={handleUserSubmit}
          />
        ))}

        <div ref={bottomRef} />
      </div>

      {/* ── Script modal ── */}
      {showScript && (
        <ScriptModal
          script={script}
          charName={character?.name ?? 'AI'}
          onClose={() => setShowScript(false)}
        />
      )}
    </main>
  );
}
