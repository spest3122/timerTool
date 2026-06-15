import { useState, useEffect, useRef, useCallback } from 'react'
import './SpeakerPage.css'

// ── Helpers ────────────────────────────────────────────────────────────────────

const LANG_DEFAULTS = {
  de: 'de-DE',
  en: 'en-US',
  es: 'es-ES',
}

function getVoicesForLang(lang) {
  if (typeof speechSynthesis === 'undefined') return []
  return speechSynthesis
    .getVoices()
    .filter(v => v.lang.startsWith(lang + '-') || v.lang.toLowerCase() === lang)
}

function buildLinesFromText(rawText) {
  return rawText
    .split('\n')
    .map(s => s.trim())
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function SpeakerPage() {
  const [language,           setLanguageState]  = useState('de')
  const [voices,             setVoices]         = useState([])
  const [selectedVoiceName,  setSelectedVoiceName] = useState('')
  const [speed,              setSpeed]          = useState(1.0)
  const [textContent,        setTextContent]    = useState('')
  const [isLooping,          setIsLooping]      = useState(false)
  const [isListening,        setIsListening]    = useState(false)
  const [statusMsg,          setStatusMsg]      = useState('')
  const [lastSpokenLine,     setLastSpokenLine] = useState('')

  // Mutable speech queue refs
  const textLinesRef           = useRef([])
  const currentLineIndexRef    = useRef(0)
  const hasRepeatedRef         = useRef(false)
  const isSpeakingRef          = useRef(false)
  const recognitionRef         = useRef(null)

  // ── Load voices ────────────────────────────────────────────────────────────
  const loadVoices = useCallback((lang) => {
    const v = getVoicesForLang(lang)
    setVoices(v)
    setSelectedVoiceName(v[0]?.name || '')
  }, [])

  const setLanguage = (lang) => {
    setLanguageState(lang)
    loadVoices(lang)
  }

  useEffect(() => {
    const init = () => loadVoices(language)
    init()
    if (typeof speechSynthesis !== 'undefined' && speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = init
    }
    return () => {
      if (typeof speechSynthesis !== 'undefined') speechSynthesis.onvoiceschanged = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadVoices(language)
  }, [language, loadVoices])

  // ── Speech synthesis ───────────────────────────────────────────────────────
  const speakLine = useCallback((text, onEnd) => {
    if (typeof speechSynthesis === 'undefined' || !text) return
    speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = speed
    const selectedVoice = voices.find(v => v.name === selectedVoiceName)
    if (selectedVoice) {
      utterance.voice = selectedVoice
      utterance.lang  = selectedVoice.lang
    } else {
      utterance.lang = LANG_DEFAULTS[language] || 'de-DE'
    }
    utterance.onend = onEnd || null
    setLastSpokenLine(text)
    speechSynthesis.speak(utterance)
  }, [voices, selectedVoiceName, speed, language])

  const speakNextLine = useCallback(() => {
    const lines = textLinesRef.current
    if (!isSpeakingRef.current) return

    if (currentLineIndexRef.current >= lines.length) {
      if (isLooping && lines.length > 0) {
        currentLineIndexRef.current = 0
        hasRepeatedRef.current = false
      } else {
        isSpeakingRef.current = false
        setStatusMsg('Done!')
        return
      }
    }

    const idx  = currentLineIndexRef.current
    const currentLine = lines[idx]?.trim()
    const nextLine = lines[idx + 1]?.trim()

    if (!currentLine || currentLine === '↺') {
      currentLineIndexRef.current++
      speakNextLine()
      return
    }

    setStatusMsg(`Line ${idx + 1} / ${lines.length}`)

    speakLine(currentLine, () => {
      if (!isSpeakingRef.current) return

      if (nextLine === '↺') {
        if (isLooping) {
          speakNextLine()
        } else {
          if (!hasRepeatedRef.current) {
            hasRepeatedRef.current = true
            speakNextLine()
          } else {
            hasRepeatedRef.current = false
            currentLineIndexRef.current += 2
            speakNextLine()
          }
        }
      } else {
        currentLineIndexRef.current++
        speakNextLine()
      }
    })
  }, [speakLine, isLooping])

  const handleStartSpeaking = () => {
    const lines = buildLinesFromText(textContent)
    if (!lines.length) { setStatusMsg('⚠️ No text to speak.'); return }
    textLinesRef.current        = lines
    currentLineIndexRef.current = 0
    hasRepeatedRef.current      = false
    isSpeakingRef.current       = true
    speakNextLine()
  }

  const handlePause = () => {
    if (typeof speechSynthesis !== 'undefined' && speechSynthesis.speaking && !speechSynthesis.paused) {
      speechSynthesis.pause()
      setStatusMsg('Paused.')
    }
  }

  const handleResume = () => {
    if (typeof speechSynthesis !== 'undefined' && speechSynthesis.paused) {
      speechSynthesis.resume()
      setStatusMsg('Resumed.')
    }
  }

  const handleStop = () => {
    isSpeakingRef.current = false
    textLinesRef.current = []
    currentLineIndexRef.current = 0
    hasRepeatedRef.current = false
    if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel()
    setStatusMsg('Stopped.')
  }

  const handleInsertRepeat = () => {
    const input = document.getElementById('textInput')
    if (!input) return
    const start = input.selectionStart
    const end = input.selectionEnd
    const current = textContent
    const before = current.substring(0, start)
    const after = current.substring(end)
    const injection = (before.endsWith('\n') || before === '') ? '↺\n' : '\n↺\n'
    setTextContent(before + injection + after)
    setTimeout(() => {
      input.focus()
      input.setSelectionRange(start + injection.length, start + injection.length)
    }, 0)
  }

  // ── Speech recognition ─────────────────────────────────────────────────────
  const toggleListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { setStatusMsg('⚠️ Speech recognition not supported in this browser.'); return }

    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      setStatusMsg('Recognition stopped.')
      return
    }

    const recognition = new SR()
    recognition.continuous    = true
    recognition.interimResults = false
    recognition.lang           = LANG_DEFAULTS[language] || 'de-DE'
    recognition.onresult = (e) => {
      const transcript = Array.from(e.results)
        .map(r => r[0].transcript)
        .join(' ')
      setTextContent(prev => prev ? prev + '\n' + transcript : transcript)
    }
    recognition.onerror = () => { setIsListening(false); setStatusMsg('Recognition error.') }
    recognition.onend   = () => { setIsListening(false) }
    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
    setStatusMsg('🎙️ Listening…')
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel()
      recognitionRef.current?.stop()
    }
  }, [])

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <main className="speaker-main">
      <div className="speaker-wrapper">
        <div className="speaker-body">
          {/* Left: Controls */}
          <div className="speaker-controls">
            {/* Language */}
            <div className="spk-field">
              <label htmlFor="spkLangSelect">Language</label>
              <select
                id="spkLangSelect"
                value={language}
                onChange={e => setLanguage(e.target.value)}
              >
                <option value="de">Deutsch (German)</option>
                <option value="en">English</option>
                <option value="es">Español (Spanish)</option>
              </select>
            </div>

            {/* Voice */}
            <div className="spk-field">
              <label htmlFor="spkVoiceSelect">Voice</label>
              <select
                id="spkVoiceSelect"
                value={selectedVoiceName}
                onChange={e => setSelectedVoiceName(e.target.value)}
              >
                <option value="">System default</option>
                {voices.map((v, i) => (
                  <option key={i} value={v.name}>{v.name} ({v.lang})</option>
                ))}
              </select>
            </div>

            {/* Speed */}
            <div className="spk-field">
              <label htmlFor="spkSpeed">
                Speed: <strong>{speed.toFixed(1)}×</strong>
              </label>
              <input
                id="spkSpeed"
                type="range"
                min="0.5" max="2.0" step="0.1"
                value={speed}
                onChange={e => setSpeed(parseFloat(e.target.value))}
                className="spk-slider"
              />
            </div>

            {/* Loop toggle */}
            <label className="spk-toggle">
              <input
                type="checkbox"
                checked={isLooping}
                onChange={e => setIsLooping(e.target.checked)}
              />
              <span>Loop</span>
            </label>

            {/* Action buttons */}
            <div className="spk-btns">
              <button id="startSpeakingBtn" className="spk-btn spk-btn-primary" onClick={handleStartSpeaking}>
                ▶ Speak
              </button>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button id="pauseBtn" className="spk-btn spk-btn-secondary" style={{ flex: 1 }} onClick={handlePause}>
                  ⏸ Pause
                </button>
                <button id="resumeBtn" className="spk-btn spk-btn-secondary" style={{ flex: 1 }} onClick={handleResume}>
                  ⏯ Resume
                </button>
              </div>
              <button id="stopSpeakingBtn" className="spk-btn spk-btn-danger" onClick={handleStop}>
                ■ Stop
              </button>
              <button
                id="recognitionBtn"
                className={`spk-btn ${isListening ? 'spk-btn-danger' : 'spk-btn-secondary'}`}
                onClick={toggleListening}
              >
                {isListening ? '⬛ Stop Listening' : '🎙️ Dictate'}
              </button>
            </div>

            {/* Status */}
            {statusMsg && (
              <div className="spk-status" id="speakerStatus">
                {statusMsg}
              </div>
            )}

            {/* Last spoken line */}
            {lastSpokenLine && (
              <div className="spk-last-line">
                <span className="spk-last-label">Last spoken:</span>
                <span>{lastSpokenLine}</span>
              </div>
            )}
          </div>

          {/* Right: Text area */}
          <div className="speaker-text-area">
            <div className="spk-textarea-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '8px' }}>
              <button
                className="spk-btn spk-btn-ghost"
                onClick={handleInsertRepeat}
                title="Insert repeat symbol"
              >
                ↺ Insert Repeat
              </button>
              <button
                className="spk-btn spk-btn-ghost"
                onClick={() => setTextContent('')}
              >
                Clear text
              </button>
            </div>

            <textarea
              id="textInput"
              className="spk-textarea"
              placeholder={
                language === 'de'
                  ? 'Text hier einfügen (eine Zeile pro Satz)…'
                  : language === 'es'
                  ? 'Pegue el texto aquí (una oración por línea)…'
                  : 'Paste text here (one sentence per line)…'
              }
              value={textContent}
              onChange={e => setTextContent(e.target.value)}
            />
          </div>
        </div>
      </div>
    </main>
  )
}
