import { RotateCcw, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';

/* ── Mock error analysis data per language ──────────────────── */
const MOCK_ANALYSIS = {
  de: {
    grammar: [
      { text: 'Watch word order in subordinate clauses — the verb goes to the end.', severity: 'warning' },
      { text: 'Case endings (Nominativ/Akkusativ/Dativ) are a great next focus area.', severity: 'info' },
      { text: 'Good use of "Ich heiße" for introducing yourself!', severity: 'success' },
    ],
    pronunciation: [
      { text: 'The German "ch" sound (as in "ich") is tricky — keep practising!', severity: 'warning' },
      { text: 'Your vowel length in "sehr" was clear and natural.', severity: 'success' },
    ],
  },
  en: {
    grammar: [
      { text: 'Try using "would have + past participle" for hypothetical situations.', severity: 'info' },
      { text: 'Great use of phrasal verbs — keep it up!', severity: 'success' },
      { text: 'Watch subject-verb agreement in complex sentences.', severity: 'warning' },
    ],
    pronunciation: [
      { text: 'The "th" sound in "the" and "there" came through clearly.', severity: 'success' },
      { text: 'Try to reduce unstressed vowels (schwa) for a more natural rhythm.', severity: 'info' },
    ],
  },
  es: {
    grammar: [
      { text: 'Remember "ser" for permanent traits and "estar" for temporary states.', severity: 'warning' },
      { text: 'After "esperar que" and "querer que" the subjunctive mood is needed.', severity: 'info' },
      { text: 'Excellent use of reflexive verbs — "me llamo" was perfect!', severity: 'success' },
    ],
    pronunciation: [
      { text: 'Rolling the "r" in Spanish is coming along — keep at it!', severity: 'warning' },
      { text: 'Your vowel sounds (a, e, i, o, u) are clean and consistent.', severity: 'success' },
    ],
  },
};

const SEVERITY_ICON = {
  warning: <AlertCircle size={15} />,
  info:    <CheckCircle size={15} />,
  success: <CheckCircle size={15} />,
};

/* ── Star rating helper ─────────────────────────────────────── */
function calcStars(userResponses, totalUserTurns) {
  const completed = Object.keys(userResponses).length;
  const ratio = totalUserTurns > 0 ? completed / totalUserTurns : 0;
  if (ratio >= 1)   return 5;
  if (ratio >= 0.8) return 4;
  if (ratio >= 0.6) return 3;
  if (ratio >= 0.4) return 2;
  return 1;
}

/**
 * FeedbackView — full-page summary shown after the conversation ends.
 *
 * @param {{
 *   script: object,
 *   userResponses: Record<number, string>,
 *   lang: 'de'|'en'|'es',
 *   character: object,
 *   onRetry: () => void,
 *   onNextContext: () => void,
 * }} props
 */
export default function FeedbackView({
  script,
  userResponses,
  lang,
  character,
  onRetry,
  onNextContext,
}) {
  const analysis      = MOCK_ANALYSIS[lang] ?? MOCK_ANALYSIS.en;
  const userTurns     = script.turns.filter((t) => t.speaker === 'user');
  const userTurnIdxs  = script.turns
    .map((t, i) => (t.speaker === 'user' ? i : null))
    .filter((i) => i !== null);

  const completedCount = userTurnIdxs.filter((i) => userResponses[i]).length;
  const stars          = calcStars(userResponses, userTurns.length);

  return (
    <div className="cp-feedback-page">
      <div className="cp-feedback-card">
        {/* ── Header ── */}
        <div className="cp-feedback-header">
          <span className="cp-feedback-trophy">🎉</span>
          <h2 className="cp-feedback-title">Lesson Complete!</h2>
          <p className="cp-feedback-topic">
            {character?.langFlag} {character?.langLabel} · {script.emoji} {script.topicEn}
          </p>

          {/* Stars */}
          <div className="cp-stars" aria-label={`${stars} out of 5 stars`}>
            {Array.from({ length: 5 }).map((_, i) => (
              <span
                key={i}
                className={`cp-star${i < stars ? ' earned' : ''}`}
                aria-hidden="true"
              >
                {i < stars ? '⭐' : '☆'}
              </span>
            ))}
          </div>

          {/* Score pills */}
          <div className="cp-score-row">
            <div className="cp-score-pill">
              <span className="cp-score-pill-value">{completedCount}/{userTurns.length}</span>
              <span className="cp-score-pill-label">Responses</span>
            </div>
            <div className="cp-score-pill">
              <span className="cp-score-pill-value">{stars}/5</span>
              <span className="cp-score-pill-label">Stars</span>
            </div>
            <div className="cp-score-pill">
              <span className="cp-score-pill-value">{script.turns.length}</span>
              <span className="cp-score-pill-label">Total Turns</span>
            </div>
          </div>
        </div>

        {/* ── Grammar analysis ── */}
        <div className="cp-analysis-section">
          <p className="cp-analysis-title">📝 Grammar Feedback</p>
          <div className="cp-analysis-items">
            {analysis.grammar.map((item, idx) => (
              <div key={idx} className={`cp-analysis-item ${item.severity}`}>
                <span className={`cp-analysis-icon ${item.severity}`}>
                  {SEVERITY_ICON[item.severity]}
                </span>
                {item.text}
              </div>
            ))}
          </div>
        </div>

        {/* ── Pronunciation analysis ── */}
        <div className="cp-analysis-section">
          <p className="cp-analysis-title">🔊 Pronunciation Feedback</p>
          <div className="cp-analysis-items">
            {analysis.pronunciation.map((item, idx) => (
              <div key={idx} className={`cp-analysis-item ${item.severity}`}>
                <span className={`cp-analysis-icon ${item.severity}`}>
                  {SEVERITY_ICON[item.severity]}
                </span>
                {item.text}
              </div>
            ))}
          </div>
        </div>

        {/* ── Your responses ── */}
        {completedCount > 0 && (
          <div className="cp-responses-section">
            <p className="cp-analysis-title">💬 Your Responses</p>
            {userTurnIdxs.map((turnIdx, num) =>
              userResponses[turnIdx] ? (
                <div key={turnIdx} className="cp-response-row">
                  <span className="cp-response-idx">#{num + 1}</span>
                  <span className="cp-response-text">{userResponses[turnIdx]}</span>
                </div>
              ) : null
            )}
          </div>
        )}

        {/* ── Action buttons ── */}
        <div className="cp-feedback-actions">
          <button
            className="cp-retry-lesson-btn"
            onClick={onRetry}
            id="convo-retry-btn"
          >
            <RotateCcw size={16} />
            Retry Lesson
          </button>
          <button
            className="cp-next-context-btn"
            onClick={onNextContext}
            id="convo-next-context-btn"
          >
            <ArrowRight size={16} />
            Next Context
          </button>
        </div>
      </div>
    </div>
  );
}
