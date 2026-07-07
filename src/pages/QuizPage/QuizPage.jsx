import { useState, useRef, useEffect } from 'react'
import './QuizPage.css'

// ── Quiz Data ────────────────────────────────────────────────────────────────

const SECTIONS = [
  {
    id: 'german',
    lang: 'de',
    title: 'German',
    emoji: '🇩🇪',
    color: 'section-de',
    focus: 'Adjective endings · Subordinate clauses · Two-way prepositions · Case triggers',
    questions: [
      {
        id: 1,
        sentence: 'Ich lege das Buch _______ den Tisch. (hint: two-way preposition — motion → accusative)',
        answer: 'auf',
        explanation: '"Auf" is a two-way preposition. Because the verb "legen" expresses motion/placement, it triggers the accusative case — hence "den Tisch" (acc.).',
      },
      {
        id: 2,
        sentence: 'Das Buch liegt _______ dem Tisch. (hint: two-way preposition — location → dative)',
        answer: 'auf',
        explanation: '"Auf" again, but "liegen" expresses a static location, so it governs the dative case — hence "dem Tisch" (dat.).',
      },
      {
        id: 3,
        sentence: 'Er sagt, dass er morgen nicht _______ kann. (hint: modal verb "kommen" in a subordinate "dass" clause — put it last)',
        answer: 'kommen',
        explanation: 'In a subordinate clause introduced by "dass," the finite verb is pushed to the very end. With a modal, the infinitive (kommen) follows the modal (kann): "…nicht kommen kann."',
      },
      {
        id: 4,
        sentence: 'Wir wissen nicht, ob sie _______ oder nicht. (hint: "kommen" — yes/no subordinate clause)',
        answer: 'kommt',
        explanation: '"Ob" introduces an indirect yes/no question (a subordinate clause), so the conjugated verb (kommt) goes to the end.',
      },
      {
        id: 5,
        sentence: 'Das ist die Frau, _______ ich gestern im Café getroffen habe. (hint: relative pronoun, accusative, feminine)',
        answer: 'die',
        explanation: 'The relative pronoun must match the gender of its antecedent "Frau" (feminine) and the case of its role in the relative clause (direct object → accusative). Feminine accusative = "die."',
      },
      {
        id: 6,
        sentence: 'Trotz des schlechten _______ sind wir spazieren gegangen. (hint: "Wetter" — genitive after "trotz," strong adjective ending)',
        answer: 'Wetters',
        explanation: '"Trotz" always takes the genitive. "Wetter" is neuter, so the genitive is "des Wetters." The adjective after "des" gets a weak ending: "schlechten."',
      },
      {
        id: 7,
        sentence: 'Sie hat mir ein _______ Geschenk gegeben. (hint: "schön" — adjective after an indefinite article, neuter accusative)',
        answer: 'schönes',
        explanation: 'After the indefinite article "ein," adjectives carry mixed endings. "Geschenk" is neuter and the direct object (accusative) → the adjective takes "-es": "schönes."',
      },
      {
        id: 8,
        sentence: 'Er ist so müde, dass er nicht _______ kann. (hint: "aufhören zu schlafen" — he cannot stop sleeping; focus on word order)',
        answer: 'aufhören',
        explanation: 'In the "dass" subordinate clause the finite verb goes last. The separable infinitive "aufhören" stays together here as the infinitive form at the end.',
      },
      {
        id: 9,
        sentence: 'Ich erinnere mich an den Mann, _______ ich das Buch geliehen habe. (hint: relative pronoun, dative, masculine — recipient of the loan)',
        answer: 'dem',
        explanation: '"Leihen" takes a dative object for the recipient ("to lend to someone"). The antecedent "Mann" is masculine, so the dative relative pronoun is "dem."',
      },
      {
        id: 10,
        sentence: 'Wegen _______ starken Regens mussten wir das Picknick absagen. (hint: "Regen" — genitive after "wegen," masculine noun)',
        answer: 'des',
        explanation: '"Wegen" governs the genitive case. "Regen" is masculine, so genitive = "des Regens." The adjective takes a weak ending after the definite article: "des starken Regens."',
      },
    ],
  },
  {
    id: 'english',
    lang: 'en',
    title: 'English',
    emoji: '🇬🇧',
    color: 'section-en',
    focus: 'Phrasal verbs · Conditionals · Inversion · Gerund vs. Infinitive · Business collocations',
    questions: [
      {
        id: 11,
        sentence: 'She decided to _______ the meeting until next Thursday. (hint: phrasal verb meaning "postpone")',
        answer: 'put off',
        explanation: '"Put off" means to postpone or delay. It is a separable phrasal verb: "put the meeting off" or "put off the meeting" are both correct.',
      },
      {
        id: 12,
        sentence: 'Had I known about the delay, I _______ a different route. (hint: third conditional with inversion — past perfect in the if-clause)',
        answer: 'would have taken',
        explanation: 'This is a third conditional (unreal past). Removing "if" and inverting the auxiliary ("Had I known") is a formal/literary alternative. The result clause requires "would have + past participle."',
      },
      {
        id: 13,
        sentence: 'The company needs to _______ costs if it wants to survive the recession. (hint: business collocation meaning "reduce expenses significantly")',
        answer: 'cut',
        explanation: '"Cut costs" is a standard business collocation meaning to reduce expenses. "Reduce costs" is acceptable but "cut costs" is the idiomatic, high-register choice.',
      },
      {
        id: 14,
        sentence: 'I remember _______ her at the conference last year, but I forgot to get her card. (hint: gerund or infinitive? — memory of a past event)',
        answer: 'meeting',
        explanation: '"Remember + gerund" refers to a memory of something that already happened. "Remember + infinitive" means to remember to do something in the future. Here the event is past → gerund: "meeting."',
      },
      {
        id: 15,
        sentence: 'Not until the results were published _______ the extent of the damage. (hint: negative inversion — auxiliary + subject inverted after "not until")',
        answer: 'did they realise',
        explanation: 'When a sentence begins with a negative adverbial like "Not until…," subject-auxiliary inversion is mandatory. The main clause inverts to "did they realise" (not "they realised").',
      },
      {
        id: 16,
        sentence: 'He tried to _______ the situation by offering a full refund. (hint: phrasal verb meaning "resolve or fix a problem")',
        answer: 'sort out',
        explanation: '"Sort out" means to resolve a problem or situation. It is a common British English phrasal verb widely used in business contexts.',
      },
      {
        id: 17,
        sentence: 'The new policy will _______ effect from the first of January. (hint: business collocation — policy becoming active)',
        answer: 'take',
        explanation: '"Take effect" is a fixed collocation meaning to become operative or active. "Come into effect" is another acceptable alternative.',
      },
      {
        id: 18,
        sentence: 'She stopped _______ when the doctor warned her about her health. (hint: gerund or infinitive? — permanently ceased the habit)',
        answer: 'smoking',
        explanation: '"Stop + gerund" means to cease a habit entirely. "Stop + infinitive" means to pause in order to do something else (e.g., "she stopped to smoke" = she stopped walking in order to smoke).',
      },
      {
        id: 19,
        sentence: 'Were the project to _______, the entire department would face redundancies. (hint: formal second conditional with inversion — "fail")',
        answer: 'fail',
        explanation: 'This is a formal inverted second conditional. "Were + subject + infinitive" replaces "If + subject + were to + infinitive." It expresses a hypothetical present/future situation.',
      },
      {
        id: 20,
        sentence: 'The board eventually _______ the merger after months of negotiations. (hint: phrasal verb meaning "agreed to" or "approved")',
        answer: 'signed off on',
        explanation: '"Sign off on" is a business phrasal verb meaning to give formal approval. It is three-part (verb + adverb + preposition) and cannot be split.',
      },
    ],
  },
  {
    id: 'spanish',
    lang: 'es',
    title: 'Spanish',
    emoji: '🇪🇸',
    color: 'section-es',
    focus: 'Por vs. Para · Subjunctive vs. Indicative · Preterite vs. Imperfect · Reflexive & relative pronouns',
    questions: [
      {
        id: 21,
        sentence: 'Te llamo _______ saber si llegas a tiempo. (hint: "por" or "para"? — purpose/goal of calling)',
        answer: 'para',
        explanation: '"Para" expresses purpose or goal — "in order to." "Por" would indicate cause or motive for something already done. Here the call has the purpose of finding out → "para."',
      },
      {
        id: 22,
        sentence: 'Caminé _______ el parque durante una hora. (hint: "por" or "para"? — movement through a place)',
        answer: 'por',
        explanation: '"Por" is used for movement through, around, or along a place. "Para" would indicate destination: "caminar para el parque" would mean heading toward the park as a destination.',
      },
      {
        id: 23,
        sentence: 'No creo que él _______ la verdad. (hint: "saber" in subjunctive or indicative? — after a negated belief verb)',
        answer: 'sepa',
        explanation: 'Negated verbs of belief/opinion ("no creer que," "no pensar que") trigger the subjunctive in the subordinate clause. "Saber" in the present subjunctive, third person singular = "sepa."',
      },
      {
        id: 24,
        sentence: 'Espero que tú _______ bien mañana. (hint: "estar" — expressing a wish about someone else\'s future state)',
        answer: 'estés',
        explanation: 'After "esperar que" (to hope that), when the subject changes, the subjunctive is required. "Estar" in the present subjunctive, second person singular = "estés."',
      },
      {
        id: 25,
        sentence: 'Ayer _______ al mercado y _______ fruta fresca. (hint: "ir" and "comprar" — completed single past events)',
        answer: 'fui / compré',
        explanation: 'Both actions are single, completed events at a specific past moment (yesterday). The preterite is used for such actions. "Ir" preterite 1st sg. = "fui"; "comprar" preterite 1st sg. = "compré."',
      },
      {
        id: 26,
        sentence: 'Cuando era niña, _______ al parque todos los días. (hint: "ir" — habitual past action in childhood)',
        answer: 'iba',
        explanation: 'Habitual, repeated, or ongoing actions in the past use the imperfect. "Ir" in the imperfect, first person singular = "iba." The phrase "todos los días" (every day) confirms the habitual nature.',
      },
      {
        id: 27,
        sentence: 'El libro _______ que compré ayer es muy interesante. (hint: relative pronoun for a thing — no preposition)',
        answer: 'que',
        explanation: '"Que" is the most common relative pronoun and is used for both people and things when no preposition precedes it. "El cual / la cual" are more formal alternatives.',
      },
      {
        id: 28,
        sentence: 'Ella _______ despertó tarde y llegó al trabajo con retraso. (hint: reflexive pronoun — "despertar" is reflexive for "to wake up")',
        answer: 'se',
        explanation: '"Despertarse" is the reflexive form meaning "to wake up (oneself)." The third-person reflexive pronoun is "se." Without it, "despertar" means "to wake someone else up."',
      },
      {
        id: 29,
        sentence: 'Este trabajo es _______ ti; lo hice con mucho cariño. (hint: "por" or "para"? — intended recipient)',
        answer: 'para',
        explanation: '"Para" expresses the intended recipient or beneficiary of something. "Por" before a person typically means "on behalf of" or "because of," not "intended for."',
      },
      {
        id: 30,
        sentence: 'Ojalá _______ mejor tiempo mañana para el partido. (hint: "haber" — expressing a wish about weather; present subjunctive)',
        answer: 'haya',
        explanation: '"Ojalá" (I hope/if only) always triggers the subjunctive. When expressing a hope about the future, the present subjunctive is used. The impersonal "haber" in the present subjunctive = "haya."',
      },
    ],
  },
]

// Flatten all questions for progress tracking
const ALL_QUESTIONS = SECTIONS.flatMap(s => s.questions.map(q => ({ ...q, sectionId: s.id })))

// ── Helpers ──────────────────────────────────────────────────────────────────

function normalize(str) {
  return str.trim().toLowerCase().replace(/\s+/g, ' ')
}

function isCorrect(input, answer) {
  // Accept either slash-separated alternatives or exact match
  const alts = answer.split('/').map(a => normalize(a))
  return alts.includes(normalize(input))
}

// ── Component ────────────────────────────────────────────────────────────────

export default function QuizPage() {
  const [answers, setAnswers] = useState({})         // { [questionId]: string }
  const [revealed, setRevealed] = useState({})       // { [questionId]: boolean }
  const [submitted, setSubmitted] = useState(false)
  const [activeSection, setActiveSection] = useState('german')
  const [answerKeyOpen, setAnswerKeyOpen] = useState(false)
  const inputRefs = useRef({})

  // Scores per section
  const sectionScores = SECTIONS.map(s => {
    const qs = s.questions
    const correct = qs.filter(q => revealed[q.id] && isCorrect(answers[q.id] || '', q.answer)).length
    const attempted = qs.filter(q => revealed[q.id]).length
    return { id: s.id, correct, attempted, total: qs.length }
  })

  const totalCorrect = sectionScores.reduce((a, b) => a + b.correct, 0)
  const totalAttempted = sectionScores.reduce((a, b) => a + b.attempted, 0)

  function handleCheck(qId, answer) {
    setRevealed(r => ({ ...r, [qId]: true }))
  }

  function handleInput(qId, value) {
    setAnswers(a => ({ ...a, [qId]: value }))
    // If previously revealed, reset on new input
    if (revealed[qId]) {
      setRevealed(r => ({ ...r, [qId]: false }))
    }
  }

  function handleKeyDown(e, qId, answer) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleCheck(qId, answer)
    }
  }

  function handleReset() {
    setAnswers({})
    setRevealed({})
    setSubmitted(false)
  }

  const currentSection = SECTIONS.find(s => s.id === activeSection)

  return (
    <main className="fq-main">
      {/* ── Header ── */}
      <header className="fq-header">
        <div className="fq-header-inner">
          <div className="fq-header-text">
            <h1 className="fq-title">
              Multi-Language Fill-in-the-Blank Quiz
            </h1>
            <p className="fq-desc">
              30 questions across German, English, and Spanish — testing grammar, idioms, and vocabulary nuances.
              Type your answer and press <kbd>Enter</kbd> or click <strong>Check</strong> to get instant feedback.
            </p>
          </div>
          <div className="fq-header-actions">
            <button className="fq-reset-btn" onClick={handleReset}>
              ↺ Reset All
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="fq-global-progress">
          <div className="fq-progress-row">
            <span className="fq-progress-label">Overall Progress</span>
            <span className="fq-progress-count">{totalAttempted} / 30 answered</span>
          </div>
          <div className="fq-progress-track">
            <div
              className="fq-progress-fill"
              style={{ width: `${(totalAttempted / 30) * 100}%` }}
            />
          </div>
          {totalAttempted > 0 && (
            <div className="fq-progress-score">
              ✓ {totalCorrect} correct · ✗ {totalAttempted - totalCorrect} incorrect
            </div>
          )}
        </div>
      </header>

      {/* ── Section tabs ── */}
      <div className="fq-tabs" role="tablist">
        {SECTIONS.map(s => {
          const score = sectionScores.find(sc => sc.id === s.id)
          return (
            <button
              key={s.id}
              role="tab"
              aria-selected={activeSection === s.id}
              className={`fq-tab ${activeSection === s.id ? 'fq-tab-active' : ''} ${s.color}`}
              onClick={() => setActiveSection(s.id)}
            >
              <span className="fq-tab-emoji">{s.emoji}</span>
              <span className="fq-tab-name">{s.title}</span>
              {score.attempted > 0 && (
                <span className="fq-tab-badge">
                  {score.correct}/{score.total}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ── Active section ── */}
      {currentSection && (
        <section className={`fq-section-panel ${currentSection.color}`} key={currentSection.id}>
          <div className="fq-section-header">
            <div className="fq-section-title-row">
              <span className="fq-section-emoji">{currentSection.emoji}</span>
              <h2 className="fq-section-title">{currentSection.title} Section</h2>
              <span className="fq-section-q-range">
                Q{currentSection.questions[0].id}–{currentSection.questions[currentSection.questions.length - 1].id}
              </span>
            </div>
            <p className="fq-section-focus">
              <strong>Focus:</strong> {currentSection.focus}
            </p>
          </div>

          <div className="fq-question-list">
            {currentSection.questions.map((q, idx) => {
              const userAnswer = answers[q.id] || ''
              const isRev = revealed[q.id]
              const correct = isRev && isCorrect(userAnswer, q.answer)
              const wrong = isRev && !isCorrect(userAnswer, q.answer)

              return (
                <div
                  key={q.id}
                  className={`fq-question-card ${isRev ? (correct ? 'card-correct' : 'card-wrong') : ''}`}
                >
                  <div className="fq-question-top">
                    <span className="fq-q-number">Q{q.id}</span>
                    {isRev && (
                      <span className={`fq-verdict-badge ${correct ? 'badge-correct' : 'badge-wrong'}`}>
                        {correct ? '✓ Correct' : '✗ Incorrect'}
                      </span>
                    )}
                  </div>

                  <p className="fq-sentence">{q.sentence}</p>

                  <div className="fq-input-row">
                    <input
                      ref={el => (inputRefs.current[q.id] = el)}
                      id={`answer-${q.id}`}
                      className={`fq-input ${isRev ? (correct ? 'input-correct' : 'input-wrong') : ''}`}
                      type="text"
                      value={userAnswer}
                      onChange={e => handleInput(q.id, e.target.value)}
                      onKeyDown={e => handleKeyDown(e, q.id, q.answer)}
                      placeholder="Your answer…"
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck={false}
                    />
                    <button
                      className="fq-check-btn"
                      onClick={() => handleCheck(q.id, q.answer)}
                      disabled={!userAnswer.trim()}
                    >
                      Check
                    </button>
                  </div>

                  {isRev && (
                    <div className={`fq-feedback ${correct ? 'fb-correct' : 'fb-wrong'}`}>
                      {wrong && (
                        <p className="fq-correct-answer">
                          ✦ Correct answer: <strong>{q.answer}</strong>
                        </p>
                      )}
                      <p className="fq-explanation">{q.explanation}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ── Section navigation ── */}
      <div className="fq-section-nav">
        {SECTIONS.map((s, i) => {
          const prev = SECTIONS[i - 1]
          const next = SECTIONS[i + 1]
          if (s.id !== activeSection) return null
          return (
            <div key={s.id} className="fq-section-nav-inner">
              {prev && (
                <button className="fq-nav-btn fq-nav-prev" onClick={() => setActiveSection(prev.id)}>
                  ← {prev.emoji} {prev.title}
                </button>
              )}
              {next && (
                <button className="fq-nav-btn fq-nav-next" onClick={() => setActiveSection(next.id)}>
                  {next.emoji} {next.title} →
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Answer Key ── */}
      <div className="fq-answer-key">
        <button
          className="fq-ak-toggle"
          onClick={() => setAnswerKeyOpen(o => !o)}
          aria-expanded={answerKeyOpen}
        >
          <span>📋 Complete Answer Key</span>
          <span className="fq-ak-arrow">{answerKeyOpen ? '▲' : '▼'}</span>
        </button>
        <p className="fq-ak-warning">⚠️ Try all 30 questions first before revealing the answers!</p>

        {answerKeyOpen && (
          <div className="fq-ak-body">
            {SECTIONS.map(s => (
              <div key={s.id} className="fq-ak-section">
                <h3 className={`fq-ak-section-title ${s.color}-text`}>
                  {s.emoji} {s.title} Section
                </h3>
                <ol className="fq-ak-list">
                  {s.questions.map(q => (
                    <li key={q.id} className="fq-ak-item">
                      <div className="fq-ak-q-row">
                        <span className="fq-ak-q-num">Q{q.id}</span>
                        <span className="fq-ak-answer">{q.answer}</span>
                      </div>
                      <p className="fq-ak-explanation">{q.explanation}</p>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
