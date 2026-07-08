import { BookOpen, X } from 'lucide-react';

/**
 * ScriptModal — slide-in right panel showing the full dialogue for reference.
 *
 * @param {{
 *   script: { topic: string, topicEn: string, emoji: string, turns: Array },
 *   charName: string,
 *   onClose: () => void,
 * }} props
 */
export default function ScriptModal({ script, charName, onClose }) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="cp-script-overlay"
        role="dialog"
        aria-modal="true"
        aria-label="Conversation script"
        onClick={onClose}
      >
        {/* Panel — stop propagation so clicking inside doesn't close */}
        <div
          className="cp-script-panel"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="cp-script-header">
            <h3 className="cp-script-title">
              <BookOpen size={15} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              {script.emoji} {script.topicEn}
            </h3>
            <button
              className="cp-script-close"
              onClick={onClose}
              aria-label="Close script panel"
              id="convo-script-close-btn"
            >
              <X size={16} />
            </button>
          </div>

          {/* Turn list */}
          <div className="cp-script-list">
            {script.turns.map((turn, idx) => (
              <div
                key={idx}
                className={`cp-script-turn ${turn.speaker === 'ai' ? 'ai-turn' : 'user-turn'}`}
              >
                <p className="cp-script-turn-label">
                  {turn.speaker === 'ai' ? `${charName}` : 'You'}
                </p>
                {turn.speaker === 'ai' ? (
                  <p className="cp-script-turn-text">{turn.text}</p>
                ) : (
                  <p className="cp-script-turn-hint">💡 {turn.hint}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
