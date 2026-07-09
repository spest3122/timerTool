import { useState } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { CHARACTERS_BY_LANG } from './data/characters';

/** Map lang code → human label + flag (for the header chip) */
const LANG_META = {
  de: { label: 'German',  flag: '🇩🇪' },
  en: { label: 'English', flag: '🇬🇧' },
  es: { label: 'Spanish', flag: '🇪🇸' },
};

/**
 * SelectionModal
 *
 * Reads the current language from SettingsContext and shows the available
 * scene partners (actors/actresses) for that language.
 * The user picks a character then taps "Start Scene".
 *
 * @param {{ onStart: (lang: string, charId: string) => void }} props
 */
export default function SelectionModal({ onStart }) {
  const { language } = useSettings();
  const [selectedId, setSelectedId] = useState(null);

  // Characters for the current settings language (fallback to 'en')
  const chars    = CHARACTERS_BY_LANG[language] ?? CHARACTERS_BY_LANG.en;
  const selected = chars.find((c) => c.id === selectedId);
  const langMeta = LANG_META[language] ?? LANG_META.en;

  function handleStart() {
    if (!selected) return;
    onStart(selected.lang, selected.id);
  }

  return (
    <div
      className="cp-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Scene partner selection"
    >
      <div className="cp-selection-modal">

        {/* ── Heading ── */}
        <h2 className="cp-modal-title">🎬 Choose Your Scene Partner</h2>

        {/* Language chip — shows which language this is for */}
        <div className="cp-lang-chip">
          <span className="cp-lang-chip-flag">{langMeta.flag}</span>
          <span className="cp-lang-chip-label">{langMeta.label}</span>
          <span className="cp-lang-chip-hint">· Change in Settings</span>
        </div>

        <p className="cp-modal-subtitle">
          Pick a character to act out a scene with. You play the other role — they speak first.
        </p>

        {/* ── Character cards (2-column grid) ── */}
        <div className="cp-char-cards cp-char-cards--2col">
          {chars.map((char) => (
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
              <p className="cp-char-name">{char.name}</p>
              <span
                className="cp-char-role-badge"
                style={
                  selectedId === char.id
                    ? { color: char.color, borderColor: char.color, background: '#fff' }
                    : {}
                }
              >
                {char.role}
              </span>
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
            ? `Start Scene with ${selected.name} →`
            : 'Select a scene partner to begin'}
        </button>
      </div>
    </div>
  );
}
