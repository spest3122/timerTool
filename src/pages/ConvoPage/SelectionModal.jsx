import { useState } from 'react';
import { CHARACTERS } from './data/characters';

/**
 * SelectionModal
 *
 * Full-screen overlay shown before the lesson starts (and when "Change Character" is clicked).
 * The user picks one of three character cards — each is tied to a specific language.
 *
 * @param {{ onStart: (lang: string, charId: string) => void }} props
 */
export default function SelectionModal({ onStart }) {
  const [selectedId, setSelectedId] = useState(null);

  const selected = CHARACTERS.find((c) => c.id === selectedId);

  function handleStart() {
    if (!selected) return;
    onStart(selected.lang, selected.id);
  }

  return (
    <div
      className="cp-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Character and language selection"
    >
      <div className="cp-selection-modal">
        {/* ── Heading ── */}
        <h2 className="cp-modal-title">👋 Choose Your Tutor</h2>
        <p className="cp-modal-subtitle">
          Pick a character — they'll guide you through a conversation in their language.
        </p>

        {/* ── Character cards ── */}
        <div className="cp-char-cards">
          {CHARACTERS.map((char) => (
            <button
              key={char.id}
              className={`cp-char-card${selectedId === char.id ? ' cp-char-selected' : ''}`}
              style={
                selectedId === char.id
                  ? { borderColor: char.color, background: char.bgColor }
                  : {}
              }
              onClick={() => setSelectedId(char.id)}
              aria-pressed={selectedId === char.id}
              id={`char-card-${char.id}`}
            >
              <span className="cp-char-avatar">{char.avatar}</span>
              <div className="cp-char-flag">{char.langFlag}</div>
              <p className="cp-char-name">{char.name}</p>
              <p className="cp-char-lang">{char.langLabel}</p>
              <p className="cp-char-persona">{char.persona}</p>
            </button>
          ))}
        </div>

        {/* ── Start button ── */}
        <button
          className="cp-start-btn"
          onClick={handleStart}
          disabled={!selectedId}
          id="convo-start-lesson-btn"
        >
          {selectedId
            ? `Start ${selected.langLabel} Lesson with ${selected.name} →`
            : 'Select a tutor to begin'}
        </button>
      </div>
    </div>
  );
}
