import { useState, useEffect, useRef, useCallback } from 'react'
import { useSettings } from '../../context/SettingsContext'
import './SpeakerPage.css'

// ── Helpers ────────────────────────────────────────────────────────────────────

const LANG_DEFAULTS = {
  de: 'de-DE',
  en: 'en-US',
  es: 'es-ES',
}

function buildLinesFromText(rawText) {
  return rawText
    .split('\n')
    .map(s => s.trim())
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function SpeakerPage() {
  // ── Shared settings (language & voice synced with SettingsDrawer) ──────────
  const {
    language,
    filteredVoices,
    selectedVoiceIndex,
    setSelectedVoiceIndex,
  } = useSettings()

  const [speed,          setSpeed]          = useState(1.0)
  const [textContent,    setTextContent]    = useState('')
  const [isLooping,      setIsLooping]      = useState(false)
  const [isListening,    setIsListening]    = useState(false)
  const [statusMsg,      setStatusMsg]      = useState('')
  const [lastSpokenLine, setLastSpokenLine] = useState('')

  // Mutable speech queue refs
  const textLinesRef        = useRef([])
  const currentLineIndexRef = useRef(0)
  const hasRepeatedRef      = useRef(false)
  const isSpeakingRef       = useRef(false)
  const recognitionRef      = useRef(null)

  // ── Speech synthesis ───────────────────────────────────────────────────────
  const speakLine = useCallback((text, onEnd) => {
    if (typeof speechSynthesis === 'undefined' || !text) return
    speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = speed
    const idx = parseInt(selectedVoiceIndex, 10)
    const selectedVoice = !isNaN(idx) && filteredVoices[idx] ? filteredVoices[idx] : null
    if (selectedVoice) {
      utterance.voice = selectedVoice
      utterance.lang  = selectedVoice.lang
    } else {
      utterance.lang = LANG_DEFAULTS[language] || 'de-DE'
    }
    utterance.onend = onEnd || null
    setLastSpokenLine(text)
    speechSynthesis.speak(utterance)
  }, [filteredVoices, selectedVoiceIndex, speed, language])

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

    const idx         = currentLineIndexRef.current
    const currentLine = lines[idx]?.trim()
    const nextLine    = lines[idx + 1]?.trim()

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
    const end   = input.selectionEnd
    const current = textContent
    const before  = current.substring(0, start)
    const after   = current.substring(end)
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
    recognition.continuous     = true
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
          {/* Left: Text area */}
          <div className="speaker-text-area-card">
            <textarea
              id="textInput"
              className="spk-textarea"
              placeholder="Type something here, or tap 'Start Listening' on the right to dictate text..."
              value={textContent}
              onChange={e => setTextContent(e.target.value)}
            />
          </div>

          {/* Right: Controls */}
          <div className="speaker-controls">
            {/* Language & Voice info banner (read from shared settings) */}
            <div className="spk-field spk-settings-info">
              <span className="spk-settings-info-label">🌐 Language</span>
              <span className="spk-settings-info-value">
                {{ de: 'Deutsch (German)', en: 'English', es: 'Español (Spanish)' }[language] || language}
              </span>
            </div>

            <button
              id="recognitionBtn"
              className={`spk-btn spk-btn-listen ${isListening ? 'spk-btn-danger' : 'spk-btn-primary'}`}
              onClick={toggleListening}
            >
              {isListening ? '⬛ Stop Listening' : '🎙️ Start Listening (Microphone)'}
            </button>

            {/* Voice — synced with Settings drawer */}
            <div className="spk-field">
              <label htmlFor="spkVoiceSelect">Output Voice</label>
              <select
                id="spkVoiceSelect"
                value={selectedVoiceIndex}
                onChange={e => setSelectedVoiceIndex(e.target.value)}
              >
                <option value="">System default</option>
                {filteredVoices.map((v, i) => (
                  <option key={i} value={i}>{v.name} ({v.lang})</option>
                ))}
              </select>
            </div>

            {/* Settings Box */}
            <div className="spk-settings-box">
              <div className="spk-setting-row">
                <span className="spk-setting-label">Loop Playback:</span>
                <label className="spk-toggle">
                  <input
                    type="checkbox"
                    checked={isLooping}
                    onChange={e => setIsLooping(e.target.checked)}
                  />
                  <span className="spk-toggle-text">{isLooping ? 'On' : 'Off'}</span>
                </label>
              </div>

              <div className="spk-setting-row">
                <label htmlFor="spkSpeed" className="spk-setting-label">Reading Speed:</label>
                <input
                  id="spkSpeed"
                  type="range"
                  min="0.5" max="2.0" step="0.1"
                  value={speed}
                  onChange={e => setSpeed(parseFloat(e.target.value))}
                  className="spk-slider"
                />
                <span className="spk-speed-value">{speed.toFixed(1)}x</span>
              </div>

              <div className="spk-action-icons">
                <button
                  className="spk-icon-btn"
                  onClick={handleInsertRepeat}
                  title="Insert repeat symbol"
                >
                  ↺
                </button>
                <button
                  className="spk-icon-btn"
                  onClick={() => setTextContent('')}
                  title="Clear text"
                >
                  🗑️
                </button>
              </div>
            </div>

            {/* Play/Control Action buttons */}
            <button id="startSpeakingBtn" className="spk-btn spk-btn-success spk-play-btn" onClick={handleStartSpeaking}>
              ▶ Play Text
            </button>
            <div className="spk-playback-controls">
              <button id="pauseBtn" className="spk-btn spk-btn-warning" onClick={handlePause}>
                Pause
              </button>
              <button id="resumeBtn" className="spk-btn spk-btn-info" onClick={handleResume}>
                Resume
              </button>
              <button id="stopSpeakingBtn" className="spk-btn spk-btn-danger" onClick={handleStop}>
                Stop
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
        </div>
      </div>
    </main>
  )
}
