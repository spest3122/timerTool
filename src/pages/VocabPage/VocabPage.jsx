import { useState, useEffect, useCallback } from 'react'
import { useSettings } from '../../context/SettingsContext'
import { vocabularyData } from '../../data/vocabularyData'
import FocusView from './FocusView'
import OverviewList from './OverviewList'
import './VocabPage.css'

/* ── Language options ── */
const LANGUAGES = [
  { code: 'en', label: 'EN', full: 'English' },
  { code: 'de', label: 'DE', full: 'Deutsch' },
  { code: 'es', label: 'ES', full: 'Español' },
]

/* ── View icons ── */
const FocusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <circle cx="12" cy="12" r="4" />
  </svg>
)
const GridIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
)

const LS_VIEW_KEY  = 'vocab_view'
const LS_INDEX_KEY = 'vocab_index'

/**
 * VocabPage — top-level vocabulary learning page.
 *
 * Language + voice come from SettingsContext so they stay in sync with
 * the global Settings drawer. View and card index are local to this page.
 */
export default function VocabPage() {
  // Language and voice are owned by SettingsContext (shared with all pages)
  const { language: lang, setLanguage } = useSettings()

  const [view, setView] = useState(
    () => localStorage.getItem(LS_VIEW_KEY) || 'focus'
  )
  const [index, setIndex] = useState(() => {
    const saved = parseInt(localStorage.getItem(LS_INDEX_KEY), 10)
    return isNaN(saved) ? 0 : Math.min(saved, vocabularyData.length - 1)
  })

  /* Persist view and card index */
  useEffect(() => { localStorage.setItem(LS_VIEW_KEY,  view)  }, [view])
  useEffect(() => { localStorage.setItem(LS_INDEX_KEY, index) }, [index])

  /* Keyboard navigation (only in focus view) */
  useEffect(() => {
    if (view !== 'focus') return
    const onKey = (e) => {
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft')  goPrev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const total  = vocabularyData.length
  const goNext = useCallback(() => setIndex(i => (i + 1) % total),         [total])
  const goPrev = useCallback(() => setIndex(i => (i - 1 + total) % total), [total])
  const goDot  = useCallback((i) => setIndex(i), [])

  /** Select item from overview → jump to focus view at that index */
  const handleSelectItem = useCallback((i) => {
    setIndex(i)
    setView('focus')
  }, [])

  /**
   * Switch the global language (syncs with Settings drawer and all other
   * pages). Also cancel any in-progress speech so it restarts in the new lang.
   */
  const handleLang = useCallback((code) => {
    setLanguage(code)
    if (window.speechSynthesis) window.speechSynthesis.cancel()
  }, [setLanguage])

  const progressPct = total > 1 ? ((index + 1) / total) * 100 : 100

  return (
    <main className="vocab-page" id="vocabPage">
      {/* ── Sticky control bar ── */}
      <header className="vocab-controls">
        <span className="vocab-title">📚 Vocab Trainer</span>

        <div className="vocab-controls-right">
          {/* Language selector — writes to shared SettingsContext */}
          <div className="vocab-lang-selector" role="group" aria-label="Select language">
            {LANGUAGES.map(({ code, label, full }) => (
              <button
                key={code}
                id={`vocabLang-${code}`}
                className={`vocab-lang-btn${lang === code ? ' active' : ''}`}
                onClick={() => handleLang(code)}
                aria-pressed={lang === code}
                title={full}
              >
                {label}
              </button>
            ))}
          </div>

          {/* View toggle */}
          <div className="vocab-view-toggle" role="group" aria-label="Switch view">
            <button
              id="vocabViewFocus"
              className={`vocab-view-btn${view === 'focus' ? ' active' : ''}`}
              onClick={() => setView('focus')}
              aria-pressed={view === 'focus'}
              title="Focus view"
            >
              <FocusIcon /> Focus
            </button>
            <button
              id="vocabViewList"
              className={`vocab-view-btn${view === 'overview' ? ' active' : ''}`}
              onClick={() => setView('overview')}
              aria-pressed={view === 'overview'}
              title="Overview grid"
            >
              <GridIcon /> List
            </button>
          </div>
        </div>
      </header>

      {/* Progress indicator (focus view only) */}
      {view === 'focus' && (
        <div className="vocab-progress" aria-hidden="true">
          <div className="vocab-progress-track">
            <div
              className="vocab-progress-fill"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Page content */}
      {view === 'focus' ? (
        <FocusView
          items={vocabularyData}
          index={index}
          lang={lang}
          onPrev={goPrev}
          onNext={goNext}
          onDot={goDot}
        />
      ) : (
        <OverviewList
          items={vocabularyData}
          lang={lang}
          activeIndex={index}
          onSelectItem={handleSelectItem}
        />
      )}
    </main>
  )
}
