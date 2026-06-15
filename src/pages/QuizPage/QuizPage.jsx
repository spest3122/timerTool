import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  buildDataset, loadProgress, saveProgress, updateProgress,
  chooseNextQuestion, normalize, tokenDiff,
  highDifficultyRatio, priorityWeight, defaultProgress,
} from '../../utils/quizLogic'
import './QuizPage.css'

const CENTER  = 120
const dataset = buildDataset()

// Pre-compute clock tick marks once (static)
const TICKS = Array.from({ length: 60 }, (_, i) => {
  const n     = i + 1
  const angle = ((n * 6 - 90) * Math.PI) / 180
  const major = n % 5 === 0
  const r1    = major ? 95 : 103
  return {
    key: n, major,
    x1: CENTER + Math.cos(angle) * r1,  y1: CENTER + Math.sin(angle) * r1,
    x2: CENTER + Math.cos(angle) * 108, y2: CENTER + Math.sin(angle) * 108,
    strokeWidth: major ? 3 : 1,
    num: major ? n / 5 : null,
    tx:  major ? CENTER + Math.cos(angle) * 78 : null,
    ty:  major ? CENTER + Math.sin(angle) * 78 + 5 : null,
  }
})

function handPos(angleDeg, length) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x2: CENTER + Math.cos(rad) * length, y2: CENTER + Math.sin(rad) * length }
}

export default function QuizPage() {
  const [progress,         setProgress]         = useState(() => loadProgress(dataset))
  const [session,          setSession]           = useState({ attempts: 0, correct: 0, totalRt: 0, recent: [] })
  const [currentQuestion,  setCurrentQuestion]  = useState(null)
  const [questionStart,    setQuestionStart]     = useState(0)
  const [answerInput,      setAnswerInput]       = useState('')
  const [feedback,         setFeedback]          = useState(null)
  const answerRef = useRef(null)

  const startNextQuestion = useCallback((prog, sess) => {
    const q = chooseNextQuestion(dataset, prog, sess)
    setCurrentQuestion(q)
    setAnswerInput('')
    setFeedback(null)
    setQuestionStart(Date.now())
    requestAnimationFrame(() => answerRef.current?.focus())
  }, [])

  // Load progress and first question on mount
  useEffect(() => {
    const prog = loadProgress(dataset)
    setProgress(prog)
    startNextQuestion(prog, { attempts: 0, correct: 0, totalRt: 0, recent: [] })
  }, [startNextQuestion])

  // ── Derived metrics ─────────────────────────────────────────────────────────
  const ratio    = highDifficultyRatio(session)
  const accuracy = session.attempts ? Math.round((session.correct / session.attempts) * 100) : 0
  const avgRt    = session.attempts ? Math.round(session.totalRt / session.attempts) : null

  const dueCount = useMemo(() =>
    dataset.filter(item => priorityWeight(item, progress) >= 1).length,
  [progress])

  const itemQueue = useMemo(() =>
    dataset
      .map(item => ({ item, p: progress[item.id], w: priorityWeight(item, progress) }))
      .sort((a, b) => b.w - a.w)
      .slice(0, 10),
  [progress])

  // ── Clock hands ─────────────────────────────────────────────────────────────
  const hourAngle   = currentQuestion ? (currentQuestion.hour % 12) * 30 + currentQuestion.minute * 0.5 : 0
  const minuteAngle = currentQuestion ? currentQuestion.minute * 6 : 0
  const hHand = handPos(hourAngle, 50)
  const mHand = handPos(minuteAngle, 78)

  // ── Submit handler ──────────────────────────────────────────────────────────
  function handleSubmit(e) {
    e.preventDefault()
    if (!currentQuestion || feedback) return
    const rt      = Date.now() - questionStart
    const correct = normalize(answerInput) === normalize(currentQuestion.expected)
    const newSession = {
      attempts: session.attempts + 1,
      correct:  session.correct + (correct ? 1 : 0),
      totalRt:  session.totalRt + rt,
      recent:   [...session.recent, { correct, rt }].slice(-12),
    }
    const newProgress = updateProgress(progress, currentQuestion, correct, rt)
    saveProgress(newProgress)
    setSession(newSession)
    setProgress(newProgress)
    setFeedback({
      correct,
      rt,
      expected: currentQuestion.expected,
      tokens:   correct ? [] : tokenDiff(answerInput, currentQuestion.expected),
    })
  }

  function handleReset() {
    const newProg = defaultProgress(dataset)
    const newSess = { attempts: 0, correct: 0, totalRt: 0, recent: [] }
    saveProgress(newProg)
    setProgress(newProg)
    setSession(newSess)
    startNextQuestion(newProg, newSess)
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <main className="quiz-main">
      {/* Header */}
      <header className="quiz-header">
        <div className="quiz-header-inner">
          <div>
            <h1 className="quiz-title">German Time Quiz</h1>
            <p className="quiz-desc">
              No multiple choice here: type the full German time expression from memory.
              The quiz combines active recall, immediate feedback, adaptive difficulty, and spaced review.
            </p>
          </div>
          <div className="quiz-header-actions">
            <a href="/" className="quiz-back-btn">Back to Time Tool</a>
            <button id="resetProgress" className="quiz-reset-btn" onClick={handleReset}>
              Reset progress
            </button>
          </div>
        </div>
      </header>

      <section className="quiz-section">
        {/* Main quiz card */}
        <article className="quiz-card">
          <div className="quiz-card-inner">
            {/* Clock panel */}
            <div className="quiz-clock-panel">
              <div className="quiz-clock-meta">
                <span id="questionId" className="quiz-question-id">
                  {currentQuestion?.id ?? 'Item --'}
                </span>
                <span
                  id="difficultyBadge"
                  className={`quiz-diff-badge ${currentQuestion?.difficulty === 'high' ? 'badge-high' : 'badge-low'}`}
                >
                  {currentQuestion
                    ? (currentQuestion.difficulty === 'high' ? 'High · Colloquial' : 'Low · Formal 24h')
                    : '--'}
                </span>
              </div>

              <div id="digitalCue" className="quiz-digital-cue">
                {currentQuestion?.digital ?? '--:--'}
              </div>

              <svg
                id="clockFace"
                viewBox="0 0 240 240"
                className="quiz-clock-svg"
                aria-label="Analog clock"
              >
                <circle cx="120" cy="120" r="112" fill="#f8fafc" stroke="#0f172a" strokeWidth="4" />
                <g id="ticks">
                  {TICKS.map(t => (
                    <g key={t.key}>
                      <line x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
                        stroke="#0f172a" strokeWidth={t.strokeWidth} />
                      {t.major && (
                        <text x={t.tx} y={t.ty} textAnchor="middle"
                          fontSize="16" fontWeight="800" fill="#0f172a">
                          {t.num}
                        </text>
                      )}
                    </g>
                  ))}
                </g>
                <line id="hourHand" className="clock-hand"
                  x1="120" y1="120" x2={hHand.x2} y2={hHand.y2}
                  stroke="#0f172a" strokeWidth="9" strokeLinecap="round" />
                <line id="minuteHand" className="clock-hand"
                  x1="120" y1="120" x2={mHand.x2} y2={mHand.y2}
                  stroke="#0891b2" strokeWidth="7" strokeLinecap="round" />
                <circle cx="120" cy="120" r="7" fill="#0f172a" />
              </svg>
            </div>

            {/* Answer panel */}
            <div className="quiz-answer-panel">
              <div className="quiz-input-card">
                <label htmlFor="answerInput" className="quiz-input-label">Type your answer</label>
                <form id="answerForm" className="quiz-form" onSubmit={handleSubmit}>
                  <input
                    ref={answerRef}
                    id="answerInput"
                    value={answerInput}
                    onChange={e => setAnswerInput(e.target.value)}
                    autoComplete="off"
                    className="quiz-input"
                    placeholder="e.g. halb drei"
                  />
                  <button className="quiz-submit-btn" type="submit">Enter</button>
                </form>
                <p className="quiz-hint">
                  Case and outer whitespace are ignored. Press{' '}
                  <kbd>Enter</kbd> to submit your answer.
                </p>
              </div>

              {/* Feedback panel */}
              {feedback && (
                <div
                  id="feedbackPanel"
                  className={`quiz-feedback ${feedback.correct ? 'feedback-correct' : 'feedback-wrong'}`}
                >
                  <div className="feedback-inner">
                    <div className="feedback-top-row">
                      <p className="feedback-verdict">{feedback.correct ? 'Correct!' : 'Not yet.'}</p>
                      <span className="feedback-rt">RT {feedback.rt} ms</span>
                    </div>
                    <p className="feedback-hint-text">The correct answer is always shown immediately:</p>
                    <p className="feedback-expected">{feedback.expected}</p>
                    {!feedback.correct && feedback.tokens.length > 0 && (
                      <div>
                        <p className="feedback-diff-label">
                          Differential feedback: red = your mismatched words, blue = the expected words.
                        </p>
                        <div>
                          {feedback.tokens.map((tok, i) => (
                            <span key={i} className={`feedback-token token-${tok.type}`}>
                              {tok.text}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <button
                      id="nextQuestion"
                      className="feedback-next-btn"
                      onClick={() => startNextQuestion(progress, session)}
                    >
                      Next question
                    </button>
                  </div>
                </div>
              )}

              {/* Metrics row */}
              <div className="quiz-metrics">
                <div className="metric-card">
                  <p className="metric-label">Accuracy</p>
                  <p id="accuracyMetric" className="metric-value">
                    {accuracy}%
                  </p>
                </div>
                <div className="metric-card">
                  <p className="metric-label">Avg RT</p>
                  <p id="rtMetric" className="metric-value">
                    {avgRt !== null ? `${avgRt} ms` : '-- ms'}
                  </p>
                </div>
                <div className="metric-card">
                  <p className="metric-label">High mix</p>
                  <p id="mixMetric" className="metric-value">{Math.round(ratio * 100)}%</p>
                </div>
              </div>
            </div>
          </div>
        </article>

        {/* Aside panels */}
        <aside className="quiz-aside">
          {/* Adaptive logic info */}
          <section className="quiz-aside-card">
            <h2 className="aside-title">Adaptive Learning Logic</h2>
            <div className="aside-body">
              <p>
                <strong className="text-cyan">Low difficulty:</strong> formal 24-hour expressions,
                such as <em>vierzehn Uhr dreißig</em>.
              </p>
              <p>
                <strong className="text-fuchsia">High difficulty:</strong> colloquial 12-hour
                expressions, such as <em>halb drei</em> and <em>fünf vor halb acht</em>.
              </p>
              <p className="aside-muted">
                High accuracy and fast response times automatically increase the share of harder
                items. Slower correct answers stay in the review queue sooner.
              </p>
            </div>
            <div className="mix-bar-track">
              <div id="mixBar" className="mix-bar-fill" style={{ width: `${Math.round(ratio * 100)}%` }} />
            </div>
          </section>

          {/* Item queue */}
          <section className="quiz-aside-card">
            <div className="item-status-header">
              <h2 className="aside-title">Item Status</h2>
              <span id="reviewCount" className="review-count">{dueCount} due</span>
            </div>
            <div id="itemQueue" className="item-queue">
              {itemQueue.map(({ item, p, w }) => (
                <div key={item.id} className="queue-item">
                  <div className="queue-item-row">
                    <span className="queue-item-id">{item.id}</span>
                    <span className={`queue-item-label ${item.difficulty === 'high' ? 'label-high' : 'label-low'}`}>
                      {item.label}
                    </span>
                  </div>
                  <div className="queue-item-expected">{item.expected}</div>
                  <div className="queue-weight-track">
                    <div className="queue-weight-fill" style={{ width: `${Math.min(100, w * 18)}%` }} />
                  </div>
                  <div className="queue-item-stats">
                    Errors: {p.errorCount} · Avg RT: {p.historicalAverageResponseTime ?? '--'} ms ·
                    Interval: {Math.round(p.currentRepetitionInterval / 1000)} s
                  </div>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </section>
    </main>
  )
}
