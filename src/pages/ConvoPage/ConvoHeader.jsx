import { User, BookOpen } from 'lucide-react';

/**
 * ConvoHeader
 *
 * Sticky top bar with:
 *  - Language flag + lesson title (left)
 *  - "Change Character" + "View Script" buttons (right)
 *  - Progress bar underneath
 *
 * @param {{
 *   character: object,
 *   script: { topic: string, topicEn: string, emoji: string, turns: Array },
 *   lang: string,
 *   turnIndex: number,
 *   totalTurns: number,
 *   onChangeCharacter: () => void,
 *   onViewScript: () => void,
 * }} props
 */
export default function ConvoHeader({
  character,
  script,
  turnIndex,
  totalTurns,
  onChangeCharacter,
  onViewScript,
}) {
  const progressPct = totalTurns > 0 ? Math.round(((turnIndex + 1) / totalTurns) * 100) : 0;

  return (
    <header className="cp-header">
      <div className="cp-header-inner">
        {/* ── Left: title ── */}
        <div className="cp-header-left">
          <span className="cp-header-flag" aria-hidden="true">
            {character?.langFlag ?? '🌐'}
          </span>
          <div>
            <div className="cp-header-title">
              {script?.emoji} {script?.topicEn ?? 'Conversation'}
            </div>
            <div className="cp-header-subtitle">
              {character?.name ?? 'Tutor'} · Turn {Math.min(turnIndex + 1, totalTurns)} of {totalTurns}
            </div>
          </div>
        </div>

        {/* ── Right: action buttons ── */}
        <div className="cp-header-right">
          <button
            className="cp-header-btn cp-header-btn--ghost"
            onClick={onChangeCharacter}
            id="convo-change-char-btn"
            aria-label="Change character"
            title="Change character"
          >
            <User size={15} />
            <span>Change Character</span>
          </button>
          <button
            className="cp-header-btn cp-header-btn--outline"
            onClick={onViewScript}
            id="convo-view-script-btn"
            aria-label="View script"
            title="View full script"
          >
            <BookOpen size={15} />
            <span>View Script</span>
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="cp-progress-strip" role="progressbar" aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100}>
        <div className="cp-progress-fill" style={{ width: `${progressPct}%` }} />
      </div>
    </header>
  );
}
