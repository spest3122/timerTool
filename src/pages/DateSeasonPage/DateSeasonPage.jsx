import { useState, useEffect, useCallback } from 'react'
import { useSettings } from '../../context/SettingsContext'
import './DateSeasonPage.css'

// ── Data ─────────────────────────────────────────────────────────────────────

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1)

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

const YEARS = (() => {
  const arr = []
  for (let y = 1900; y <= 2030; y++) arr.push(y)
  return arr
})()

const SEASONS = ['Spring', 'Summer', 'Autumn', 'Winter']

// ── Translation maps ──────────────────────────────────────────────────────────

const MONTH_ES = [
  'enero','febrero','marzo','abril','mayo','junio',
  'julio','agosto','septiembre','octubre','noviembre','diciembre',
]
const MONTH_DE = [
  'Januar','Februar','März','April','Mai','Juni',
  'Juli','August','September','Oktober','November','Dezember',
]

const SEASON_ES = { Spring:'primavera', Summer:'verano', Autumn:'otoño', Winter:'invierno' }
const SEASON_DE = { Spring:'Frühling', Summer:'Sommer', Autumn:'Herbst', Winter:'Winter' }
const SEASON_EN = { Spring:'spring', Summer:'summer', Autumn:'autumn', Winter:'winter' }

// ── Helpers ───────────────────────────────────────────────────────────────────

// English ordinal suffix (1st, 2nd, 3rd, 4th…)
function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

// German ordinal day forms used in spoken date (Dativ after "der")
// e.g. "der ersten Juni" — all 31 days
const DE_DAY_ORDINAL = [
  'ersten','zweiten','dritten','vierten','fünften',
  'sechsten','siebten','achten','neunten','zehnten',
  'elften','zwölften','dreizehnten','vierzehnten','fünfzehnten',
  'sechzehnten','siebzehnten','achtzehnten','neunzehnten','zwanzigsten',
  'einundzwanzigsten','zweiundzwanzigsten','dreiundzwanzigsten',
  'vierundzwanzigsten','fünfundzwanzigsten','sechsundzwanzigsten',
  'siebenundzwanzigsten','achtundzwanzigsten','neunundzwanzigsten',
  'dreißigsten','einunddreißigsten',
]

// Build natural spoken strings for each language
function buildTranslations(day, monthIdx, year, season) {
  const enDate   = `the ${ordinal(day)} of ${MONTHS[monthIdx]}, ${year}`
  const esDate   = `el ${day} de ${MONTH_ES[monthIdx]} de ${year}`
  const deDate   = `der ${DE_DAY_ORDINAL[day - 1]} ${MONTH_DE[monthIdx]} ${year}`
  const enSeason = `It is ${SEASON_EN[season]}`
  const esSeason = `Es ${SEASON_ES[season]}`
  const deSeason = `Es ist ${SEASON_DE[season]}`
  return { enDate, esDate, deDate, enSeason, esSeason, deSeason }
}

// ── Per-language speech hook ──────────────────────────────────────────────────
// Mirrors the voice-selection logic from SettingsContext, but for a specific
// target language (es, de, en) using the same localStorage keys.

function useLangSpeak(langCode) {
  const langKey = langCode.split('-')[0] // 'es', 'de', 'en'

  const speak = useCallback((text) => {
    if (typeof speechSynthesis === 'undefined') return
    speechSynthesis.cancel()

    const utt = new SpeechSynthesisUtterance(text)

    // Collect all voices for this language code prefix
    const all = speechSynthesis.getVoices()
    const voices = all.filter(
      v => v.lang.startsWith(langKey + '-') || v.lang.toLowerCase() === langKey
    )

    // Read the user's saved voice preference for this language (same key as SettingsContext)
    const savedIdx = parseInt(localStorage.getItem(`timerTool_voice_${langKey}`), 10)
    if (!isNaN(savedIdx) && voices[savedIdx]) {
      utt.voice = voices[savedIdx]
      utt.lang  = voices[savedIdx].lang
    } else if (voices.length > 0) {
      // Fall back to the first available voice for this language
      utt.voice = voices[0]
      utt.lang  = voices[0].lang
    } else {
      // No matching voice — at least set the locale so the browser can try
      utt.lang = langCode
    }

    utt.rate = 0.92
    speechSynthesis.speak(utt)
  }, [langCode, langKey])

  return speak
}

// ── Control group (arrows + text input only) ──────────────────────────────────

function ControlGroup({ id, label, options, index, onChange }) {
  const [inputVal, setInputVal] = useState(() => String(options[index]))

  // Keep text input in sync when index changes via arrows
  useEffect(() => {
    setInputVal(String(options[index]))
  }, [index, options])

  function handleArrow(dir) {
    onChange((index + dir + options.length) % options.length)
  }

  function handleInputChange(e) {
    setInputVal(e.target.value)
  }

  function commit(raw) {
    const q = raw.trim().toLowerCase()
    // Exact match
    const exact = options.findIndex(o => String(o).toLowerCase() === q)
    if (exact !== -1) { onChange(exact); return }
    // Prefix match
    const prefix = options.findIndex(o => String(o).toLowerCase().startsWith(q))
    if (prefix !== -1) { onChange(prefix); return }
    // Numeric match (day / year)
    const num = parseInt(q, 10)
    if (!isNaN(num)) {
      const ni = options.findIndex(o => Number(o) === num)
      if (ni !== -1) { onChange(ni); return }
    }
    // Reset to current value
    setInputVal(String(options[index]))
  }

  function handleBlur() { commit(inputVal) }

  function handleKeyDown(e) {
    if (e.key === 'Enter')      { e.target.blur() }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); handleArrow(-1) }
    if (e.key === 'ArrowRight') { e.preventDefault(); handleArrow(1) }
    if (e.key === 'ArrowUp')    { e.preventDefault(); handleArrow(-1) }
    if (e.key === 'ArrowDown')  { e.preventDefault(); handleArrow(1) }
  }

  return (
    <div className="ds-control-group" role="group" aria-labelledby={`${id}-label`}>
      <div className="ds-group-label" id={`${id}-label`}>{label}</div>
      <div className="ds-controls">
        <button
          className="ds-arrow-btn"
          id={`${id}-prev`}
          aria-label={`Previous ${label}`}
          onClick={() => handleArrow(-1)}
        >
          ‹
        </button>

        <input
          className="ds-text-input"
          id={`${id}-input`}
          type="text"
          value={inputVal}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          aria-label={`Type ${label}`}
          autoComplete="off"
          spellCheck="false"
        />

        <button
          className="ds-arrow-btn"
          id={`${id}-next`}
          aria-label={`Next ${label}`}
          onClick={() => handleArrow(1)}
        >
          ›
        </button>
      </div>
    </div>
  )
}

// ── Audio button ──────────────────────────────────────────────────────────────

function AudioBtn({ id, text, lang, speakFn }) {
  const [speaking, setSpeaking] = useState(false)

  function handleClick() {
    if (typeof speechSynthesis === 'undefined') return
    // Track speaking state via utterance events
    speechSynthesis.cancel()

    const utt = new SpeechSynthesisUtterance(text)

    const all = speechSynthesis.getVoices()
    const langKey = lang.split('-')[0]
    const voices  = all.filter(
      v => v.lang.startsWith(langKey + '-') || v.lang.toLowerCase() === langKey
    )
    const savedIdx = parseInt(localStorage.getItem(`timerTool_voice_${langKey}`), 10)
    if (!isNaN(savedIdx) && voices[savedIdx]) {
      utt.voice = voices[savedIdx]
      utt.lang  = voices[savedIdx].lang
    } else if (voices.length > 0) {
      utt.voice = voices[0]
      utt.lang  = voices[0].lang
    } else {
      utt.lang = lang
    }

    utt.rate = 0.92
    utt.onstart = () => setSpeaking(true)
    utt.onend   = () => setSpeaking(false)
    utt.onerror = () => setSpeaking(false)
    speechSynthesis.speak(utt)
  }

  return (
    <button
      className={`ds-audio-btn${speaking ? ' ds-speaking' : ''}`}
      id={id}
      onClick={handleClick}
      aria-label={`Play pronunciation`}
      title={`Play audio`}
    >
      {speaking ? '⏸' : '🔊'}
    </button>
  )
}

// ── Translation row ───────────────────────────────────────────────────────────

function TranslationRow({ flag, lang, langCode, dateText, seasonText, rowId }) {
  return (
    <div className="ds-trans-row" id={rowId}>
      <div className="ds-trans-flag">{flag}</div>
      <div className="ds-trans-lang">{lang}</div>
      <div className="ds-trans-content">
        <div className="ds-trans-date">{dateText}</div>
        <div className="ds-trans-season">{seasonText}</div>
      </div>
      <div className="ds-trans-actions">
        <AudioBtn
          id={`${rowId}-date-btn`}
          text={dateText}
          lang={langCode}
        />
        <AudioBtn
          id={`${rowId}-season-btn`}
          text={seasonText}
          lang={langCode}
        />
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function DateSeasonPage() {
  // Default: today — June 24, 2026
  const [dayIdx,    setDayIdx]    = useState(23)                  // day 24 → index 23
  const [monthIdx,  setMonthIdx]  = useState(5)                   // June  → index 5
  const [yearIdx,   setYearIdx]   = useState(YEARS.indexOf(2026))
  const [seasonIdx, setSeasonIdx] = useState(0)                   // Spring

  const day    = DAYS[dayIdx]
  const year   = YEARS[yearIdx]
  const season = SEASONS[seasonIdx]

  const tr = buildTranslations(day, monthIdx, year, season)

  return (
    <main className="ds-page" aria-label="Date and Season Pronunciation Trainer">
      {/* ── Header ── */}
      <header className="ds-header">
        <h1 className="ds-title">Date &amp; Season Trainer</h1>
        <p className="ds-subtitle">
          Select a date and season, then hear how it's pronounced in Spanish, German &amp; English.
        </p>
      </header>

      {/* ── Controls ── */}
      <section className="ds-controls-panel" aria-label="Date and season controls">
        <ControlGroup
          id="ds-day"
          label="Day"
          options={DAYS}
          index={dayIdx}
          onChange={setDayIdx}
        />
        <ControlGroup
          id="ds-month"
          label="Month"
          options={MONTHS}
          index={monthIdx}
          onChange={setMonthIdx}
        />
        <ControlGroup
          id="ds-year"
          label="Year"
          options={YEARS}
          index={yearIdx}
          onChange={setYearIdx}
        />
        <ControlGroup
          id="ds-season"
          label="Season"
          options={SEASONS}
          index={seasonIdx}
          onChange={setSeasonIdx}
        />
      </section>

      {/* ── Translation table ── */}
      <section className="ds-translations" aria-label="Multilingual translations">
        <h2 className="ds-section-title">Translations &amp; Pronunciations</h2>

        <div className="ds-trans-table">
          <TranslationRow
            rowId="ds-row-es"
            flag="🇪🇸"
            lang="Spanish"
            langCode="es-ES"
            dateText={tr.esDate}
            seasonText={tr.esSeason}
          />
          <TranslationRow
            rowId="ds-row-de"
            flag="🇩🇪"
            lang="German"
            langCode="de-DE"
            dateText={tr.deDate}
            seasonText={tr.deSeason}
          />
          <TranslationRow
            rowId="ds-row-en"
            flag="🇬🇧"
            lang="English"
            langCode="en-GB"
            dateText={tr.enDate}
            seasonText={tr.enSeason}
          />
        </div>
      </section>
    </main>
  )
}
