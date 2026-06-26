import { useState, useEffect, useRef, useCallback } from 'react'
import { useSettings } from '../../context/SettingsContext'
import {
  buildMultilingualTime,
  weekDayNames,
  weekLabelText,
  uiTranslations,
  sectionsLabelMapping,
  dialWordsMapping,
} from '../../utils/timeLanguage'
import './TimerPage.css'

const CENTER = 200

function getTodayDayIndex() {
  const d = new Date().getDay() // 0=Sun … 6=Sat
  return (d + 6) % 7            // 0=Mon … 6=Sun
}

function getHandCoords(angleDeg, length) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return {
    x2: CENTER + Math.cos(rad) * length,
    y2: CENTER + Math.sin(rad) * length,
  }
}

// Lightweight click-sound via Web Audio API
let _audioCtx = null
function playClickSound() {
  try {
    if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    const ctx = _audioCtx
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.08)
    gain.gain.setValueAtTime(0.18, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.13)
  } catch (_) { /* audio not available */ }
}

// ── Date & Season data ────────────────────────────────────────────────────────

const DAYS   = Array.from({ length: 31 }, (_, i) => i + 1)
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

function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

function buildTranslations(day, monthIdx, year, season) {
  const enDate   = `the ${ordinal(day)} of ${MONTHS[monthIdx]}, ${year}`
  const esDate   = `el ${day} de ${MONTH_ES[monthIdx]} de ${year}`
  const deDate   = `der ${DE_DAY_ORDINAL[day - 1]} ${MONTH_DE[monthIdx]} ${year}`
  const enSeason = `It is ${SEASON_EN[season]}`
  const esSeason = `Es ${SEASON_ES[season]}`
  const deSeason = `Es ist ${SEASON_DE[season]}`
  return { enDate, esDate, deDate, enSeason, esSeason, deSeason }
}

// ── Date & Season sub-components ──────────────────────────────────────────────

function ControlGroup({ id, label, options, index, onChange }) {
  const [inputVal, setInputVal] = useState(() => String(options[index]))

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
    const exact = options.findIndex(o => String(o).toLowerCase() === q)
    if (exact !== -1) { onChange(exact); return }
    const prefix = options.findIndex(o => String(o).toLowerCase().startsWith(q))
    if (prefix !== -1) { onChange(prefix); return }
    const num = parseInt(q, 10)
    if (!isNaN(num)) {
      const ni = options.findIndex(o => Number(o) === num)
      if (ni !== -1) { onChange(ni); return }
    }
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

function AudioBtn({ id, text, lang }) {
  const [speaking, setSpeaking] = useState(false)

  function handleClick() {
    if (typeof speechSynthesis === 'undefined') return
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
      aria-label="Play pronunciation"
      title="Play audio"
    >
      {speaking ? '⏸' : '🔊'}
    </button>
  )
}

function TranslationRow({ flag, lang, langCode, dateText, seasonText, rowId }) {
  return (
    <div className="ds-trans-card" id={rowId}>
      <div className="ds-card-header">
        <span className="ds-card-flag">{flag}</span>
        <span className="ds-card-lang">{lang}</span>
      </div>
      <div className="ds-card-body">
        <div className="ds-card-row">
          <span className="ds-card-text ds-date">{dateText}</span>
          <AudioBtn id={`${rowId}-date-btn`} text={dateText} lang={langCode} />
        </div>
        <div className="ds-card-row">
          <span className="ds-card-text ds-season">{seasonText}</span>
          <AudioBtn id={`${rowId}-season-btn`} text={seasonText} lang={langCode} />
        </div>
      </div>
    </div>
  )
}

// ── DateSeasonPanel ───────────────────────────────────────────────────────────

function DateSeasonPanel() {
  const { language } = useSettings()
  const today = new Date()
  const [dayIdx,    setDayIdx]    = useState(today.getDate() - 1)
  const [monthIdx,  setMonthIdx]  = useState(today.getMonth())
  const [yearIdx,   setYearIdx]   = useState(YEARS.indexOf(today.getFullYear()))
  const [seasonIdx, setSeasonIdx] = useState(0)

  const day    = DAYS[dayIdx]
  const year   = YEARS[yearIdx]
  const season = SEASONS[seasonIdx]
  const tr     = buildTranslations(day, monthIdx, year, season)

  return (
    <div className="ds-panel" aria-label="Date and Season Pronunciation Trainer">
      {/* Controls */}
      <section className="ds-controls-panel" aria-label="Date and season controls">
        <ControlGroup id="ds-day"    label="Day"    options={DAYS}    index={dayIdx}    onChange={setDayIdx} />
        <ControlGroup id="ds-month"  label="Month"  options={MONTHS}  index={monthIdx}  onChange={setMonthIdx} />
        <ControlGroup id="ds-year"   label="Year"   options={YEARS}   index={yearIdx}   onChange={setYearIdx} />
        <ControlGroup id="ds-season" label="Season" options={SEASONS} index={seasonIdx} onChange={setSeasonIdx} />
      </section>

      {/* Translations */}
      <section className="ds-translations" aria-label="Multilingual translations">
        <div className="ds-section-title">Translations &amp; Pronunciations</div>
        <div className="ds-trans-table">
          {language === 'es' && <TranslationRow rowId="ds-row-es" flag="🇪🇸" lang="Spanish" langCode="es-ES" dateText={tr.esDate} seasonText={tr.esSeason} />}
          {language === 'de' && <TranslationRow rowId="ds-row-de" flag="🇩🇪" lang="German"  langCode="de-DE" dateText={tr.deDate} seasonText={tr.deSeason} />}
          {language === 'en' && <TranslationRow rowId="ds-row-en" flag="🇬🇧" lang="English" langCode="en-GB" dateText={tr.enDate} seasonText={tr.enSeason} />}
        </div>
      </section>
    </div>
  )
}

// ── TimerPage ─────────────────────────────────────────────────────────────────

export default function TimerPage() {
  const { language, speak } = useSettings()

  // ── Core state ──────────────────────────────────────────────────────────────
  const [totalMinutes, setTotalMinutes]       = useState(19 * 60 + 40)
  const [liveMode, setLiveMode]               = useState(false)
  const [practiceWeekDay, setPracticeWeekDay] = useState(getTodayDayIndex)

  // Mutable refs (don't need re-renders)
  const draggingRef        = useRef(null)
  const lastMinuteAngle    = useRef(null)
  const liveTimerRef       = useRef(null)
  const clockSvgRef        = useRef(null)

  // ── Derived display values ──────────────────────────────────────────────────
  const displayHour24  = Math.floor(totalMinutes / 60) % 24
  const displayHour12  = displayHour24 % 12 || 12
  const displayMinute  = totalMinutes % 60
  const hourAngleDeg   = (displayHour12 % 12) * 30 + displayMinute * 0.5
  const minuteAngleDeg = displayMinute * 6
  const hourHand       = getHandCoords(hourAngleDeg, 90)
  const minuteHand     = getHandCoords(minuteAngleDeg, 130)
  const digitalTime    = `${String(displayHour24).padStart(2, '0')}:${String(displayMinute).padStart(2, '0')}`
  const phrases        = buildMultilingualTime(language, displayHour24, displayMinute)
  const labels         = sectionsLabelMapping[language] || sectionsLabelMapping.de
  const t              = uiTranslations[language]        || uiTranslations.de
  const currentDayIdx  = liveMode ? getTodayDayIndex() : practiceWeekDay
  const currentDayName = (weekDayNames[language] || weekDayNames.en)[currentDayIdx]
  const dialWords      = dialWordsMapping[language] || dialWordsMapping.de

  // ── Clock dial numbers ──────────────────────────────────────────────────────
  const dialNumbers = Array.from({ length: 12 }, (_, i) => {
    const num = i + 1
    const angle = ((num * 30 - 90) * Math.PI) / 180
    return {
      num,
      xNum:  CENTER + Math.cos(angle) * 155,
      yNum:  CENTER + Math.sin(angle) * 155,
      xWord: CENTER + Math.cos(angle) * 128,
      yWord: CENTER + Math.sin(angle) * 128,
      word: dialWords[num],
    }
  })

  // ── Live mode ───────────────────────────────────────────────────────────────
  const syncWithCurrentTime = useCallback(() => {
    const now = new Date()
    setTotalMinutes(now.getHours() * 60 + now.getMinutes())
  }, [])

  const startLiveMode = () => {
    setLiveMode(true)
    syncWithCurrentTime()
    if (liveTimerRef.current) clearInterval(liveTimerRef.current)
    liveTimerRef.current = setInterval(syncWithCurrentTime, 1000)
    speak((weekDayNames[language] || weekDayNames.en)[getTodayDayIndex()])
  }

  const startPracticeMode = () => {
    setLiveMode(false)
    if (liveTimerRef.current) clearInterval(liveTimerRef.current)
    setPracticeWeekDay(getTodayDayIndex())
  }

  // Cleanup live timer on unmount
  useEffect(() => () => { if (liveTimerRef.current) clearInterval(liveTimerRef.current) }, [])

  // ── Week navigation ─────────────────────────────────────────────────────────
  const prevDay = () => {
    if (liveMode) return
    setPracticeWeekDay(d => {
      const next = (d + 6) % 7
      speak((weekDayNames[language] || weekDayNames.en)[next])
      return next
    })
  }
  const nextDay = () => {
    if (liveMode) return
    setPracticeWeekDay(d => {
      const next = (d + 1) % 7
      speak((weekDayNames[language] || weekDayNames.en)[next])
      return next
    })
  }

  // ── Drag handlers ───────────────────────────────────────────────────────────
  function getSVGCoords(e) {
    const svg = clockSvgRef.current
    if (!svg) return { x: 0, y: 0 }
    const pt = svg.createSVGPoint()
    const src = e.touches ? e.touches[0] : e
    pt.x = src.clientX
    pt.y = src.clientY
    const sp = pt.matrixTransform(svg.getScreenCTM().inverse())
    return { x: sp.x - CENTER, y: sp.y - CENTER }
  }

  useEffect(() => {
    function handleMove(e) {
      if (liveMode || !draggingRef.current) return
      if (e.touches) e.preventDefault()

      const { x, y } = getSVGCoords(e)
      let angle = (Math.atan2(y, x) * 180) / Math.PI + 90
      if (angle < 0) angle += 360

      if (draggingRef.current === 'minute') {
        if (lastMinuteAngle.current === null) {
          lastMinuteAngle.current = angle
          return
        }
        let diff = angle - lastMinuteAngle.current
        if (diff >  180) diff -= 360
        if (diff < -180) diff += 360
        const minuteChange = Math.round(diff / 6)
        if (minuteChange !== 0) {
          playClickSound()
          setTotalMinutes(prev => {
            let next = prev + minuteChange
            if (next < 0) next += 24 * 60
            return next % (24 * 60)
          })
          lastMinuteAngle.current = angle
        }
      }

      if (draggingRef.current === 'hour') {
        setTotalMinutes(prev => {
          const isPm = Math.floor(prev / 60) >= 12
          const newH12 = Math.round(angle / 30) % 12 || 12
          const newH24 = isPm ? (newH12 % 12) + 12 : newH12 % 12
          return newH24 * 60 + (prev % 60)
        })
      }
    }

    function handleEnd() {
      draggingRef.current     = null
      lastMinuteAngle.current = null
    }

    document.addEventListener('mousemove', handleMove)
    document.addEventListener('touchmove', handleMove, { passive: false })
    document.addEventListener('mouseup',   handleEnd)
    document.addEventListener('touchend',  handleEnd)
    return () => {
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('touchmove', handleMove)
      document.removeEventListener('mouseup',   handleEnd)
      document.removeEventListener('touchend',  handleEnd)
    }
  }, [liveMode]) // re-attach when mode changes

  // Close settings drawer on Escape key
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') document.getElementById('drawerOverlay')?.click() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="container">
      {/* ── Analog Clock ── */}
      <div className="clock-wrapper">
        <svg
          ref={clockSvgRef}
          id="clock"
          viewBox="0 0 400 400"
          aria-label="Analog clock"
        >
          <circle cx="200" cy="200" r="180" fill="white" stroke="#333" strokeWidth="3" />

          {/* Dial face numbers */}
          <g id="numbers">
            {dialNumbers.map(({ num, xNum, yNum, xWord, yWord, word }) => (
              <g key={num}>
                <text x={xNum} y={yNum + 5} textAnchor="middle" fontSize="18" fontWeight="bold">
                  {num}
                </text>
                <text x={xWord} y={yWord + 4} textAnchor="middle" fontSize="10" fill="#555">
                  {word}
                </text>
              </g>
            ))}
          </g>

          {/* Hour hand */}
          <line
            id="hourHand"
            x1="200" y1="200"
            x2={hourHand.x2} y2={hourHand.y2}
            stroke="#222" strokeWidth="12" strokeLinecap="round"
            style={{ cursor: liveMode ? 'default' : 'grab' }}
            onMouseDown={() => { if (!liveMode) draggingRef.current = 'hour' }}
            onTouchStart={e => { if (!liveMode) { e.preventDefault(); draggingRef.current = 'hour' } }}
          />

          {/* Minute hand */}
          <line
            id="minuteHand"
            x1="200" y1="200"
            x2={minuteHand.x2} y2={minuteHand.y2}
            stroke="#1976d2" strokeWidth="10" strokeLinecap="round"
            style={{ cursor: liveMode ? 'default' : 'grab' }}
            onMouseDown={() => { if (!liveMode) draggingRef.current = 'minute' }}
            onTouchStart={e => { if (!liveMode) { e.preventDefault(); draggingRef.current = 'minute' } }}
          />

          {/* Center dot */}
          <circle cx="200" cy="200" r="8" fill="#333" />
        </svg>
      </div>

      {/* ── Info Panel ── */}
      <div className={`info${liveMode ? ' live-mode' : ''}`} id="infoPanel">

        {/* Week + Digital Time row */}
        <div className="top-row">
          <div className="week-display">
            <button
              className="week-arrow"
              id="weekPrevBtn"
              aria-label="Previous day"
              onClick={prevDay}
            >
              &#8249;
            </button>

            <div
              className="week-box"
              id="weekBox"
              role="button"
              tabIndex={0}
              title="Click to hear the day name"
              onClick={() => speak(currentDayName)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  speak(currentDayName)
                }
              }}
            >
              <div className="week-day-label" id="weekLabel">
                {weekLabelText[language] || 'WEEKDAY'}
              </div>
              <div className="week-day-name" id="weekDayName">
                {currentDayName}
              </div>
            </div>

            <button
              className="week-arrow"
              id="weekNextBtn"
              aria-label="Next day"
              onClick={nextDay}
            >
              &#8250;
            </button>
          </div>

          <div className="status-block">
            <div id="digitalTime" className="digital-time">{digitalTime}</div>
            <div
              id="modeIndicator"
              className={`mode-status ${liveMode ? 'mode-live' : 'mode-practice'}`}
            >
              {liveMode ? t.live : t.practice}
            </div>
          </div>
        </div>

        {/* Phrase sections */}
        <div id="phrases">
          <div className="phrase-section-title">{labels.official12}</div>
          <PhraseRow text={phrases.official12} onSpeak={speak} />

          <div className="phrase-section-title">{labels.official24}</div>
          <PhraseRow text={phrases.official24} onSpeak={speak} />

          {phrases.informal.length > 0 && (
            <>
              <div className="phrase-section-title">{labels.informal}</div>
              {phrases.informal.map((text, i) => (
                <PhraseRow key={i} text={text} onSpeak={speak} />
              ))}
            </>
          )}
        </div>

        {/* Mode control buttons */}
        <div className="control-btns">
          <button id="liveModeBtn"     onClick={startLiveMode}>    {t.liveBtn}    </button>
          <button id="practiceModeBtn" onClick={startPracticeMode}>{t.practiceBtn}</button>
        </div>
      </div>

      {/* ── Date & Season Panel ── */}
      <DateSeasonPanel />
    </div>
  )
}

function PhraseRow({ text, onSpeak }) {
  return (
    <div className="phrase">
      <span>{text}</span>
      <button onClick={() => onSpeak(text)}>🔊</button>
    </div>
  )
}
